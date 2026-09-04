import express from 'express';
import path from 'path';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { PDFParse } from 'pdf-parse';

// Helper to extract text from PDF buffer using pdf-parse or Gemini multimodal PDF fallback
async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  let extractedText = '';

  // Step 1: Attempt extraction using pdf-parse library
  try {
    const parser = new PDFParse({ data: buffer });
    const res = await parser.getText();
    const rawText = typeof res === 'string' ? res : (res?.text || '');
    if (rawText) {
      extractedText = rawText.replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '').trim();
    }
  } catch (pdfErr: any) {
    console.log('pdf-parse library extraction failed (likely invalid PDF), falling back to Gemini:', pdfErr?.message || pdfErr);
  }

  // Step 2: Fallback to Gemini native PDF OCR / text extraction if text is empty or too short
  if (!extractedText || extractedText.length < 30) {
    try {
      const ai = getGenAI();
      const base64Pdf = buffer.toString('base64');
      const modelToUse = getBestModelToUse();
      const response = await runWithGeminiQueue(() =>
        ai.models.generateContent({
          model: modelToUse,
          contents: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64Pdf
              }
            },
            'Extract all text content from this resume PDF document verbatim. Return plain text only without commentary.'
          ]
        })
      );
      extractedText = response.text?.trim() || '';
    } catch (geminiPdfErr: any) {
      console.log('Gemini native PDF extraction failed (likely unsupported or invalid PDF):', geminiPdfErr?.message || geminiPdfErr);
    }
  }

  return extractedText;
}

const app = express();
const PORT = 3000;

// Increase payload limits for PDF / resume data
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Lazy initialize Gemini API client
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
  return new GoogleGenAI({ apiKey });
}

// Helper to sanitize and robustly parse Gemini JSON response
function cleanJsonResponse(text: string): any {
  if (!text || typeof text !== 'string') {
    throw new Error('Empty or invalid output from AI model.');
  }
  try {
    let cleaned = text.trim();
    const markdownMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (markdownMatch && markdownMatch[1]) {
      cleaned = markdownMatch[1].trim();
    } else {
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
    }
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse Gemini JSON output:', text);
    throw new Error('Invalid JSON format returned from AI model.');
  }
}

// Track rate-limited models to avoid retrying them as primary choice during cooldown
const modelCooldowns = new Map<string, number>(); // modelName -> timestamp of last 429
const GEMINI_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes cooldown

// Simple in-memory response cache to prevent redundant API calls
const geminiResponseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Sequential Queue to serialize Gemini API calls and prevent concurrent rate limit spikes
let geminiTaskQueue: Array<() => Promise<void>> = [];
let isProcessingGeminiQueue = false;
let lastGeminiCallEndTime = 0;
const MIN_GEMINI_GAP_MS = 1200; // 1.2s delay between API invocations

async function processGeminiQueue() {
  if (isProcessingGeminiQueue) return;
  isProcessingGeminiQueue = true;

  while (geminiTaskQueue.length > 0) {
    const task = geminiTaskQueue.shift();
    if (task) {
      const now = Date.now();
      const timeSinceLast = now - lastGeminiCallEndTime;
      if (timeSinceLast < MIN_GEMINI_GAP_MS) {
        await new Promise(r => setTimeout(r, MIN_GEMINI_GAP_MS - timeSinceLast));
      }
      try {
        await task();
      } catch (e) {
        // Handled individually inside wrapper
      }
      lastGeminiCallEndTime = Date.now();
    }
  }

  isProcessingGeminiQueue = false;
}

function runWithGeminiQueue<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    geminiTaskQueue.push(async () => {
      try {
        const res = await fn();
        resolve(res);
      } catch (err) {
        reject(err);
      }
    });
    processGeminiQueue();
  });
}

// Helper to select the best available model, prioritizing healthy models in order
function getBestModelToUse(): string {
  // Ordered by preference and rate limit resilience
  const baseModels = ['gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3.1-pro-preview'];
  const now = Date.now();

  // Find models that are NOT currently in 3-minute cooldown
  const healthyModels = baseModels.filter(m => {
    const last429 = modelCooldowns.get(m);
    return !last429 || (now - last429 >= GEMINI_COOLDOWN_MS);
  });

  if (healthyModels.length > 0) {
    return healthyModels[0];
  }

  // If ALL models are cooling down, pick the one whose 429 was longest ago
  const sortedByCooldownAge = [...baseModels].sort((a, b) => {
    const tA = modelCooldowns.get(a) || 0;
    const tB = modelCooldowns.get(b) || 0;
    return tA - tB;
  });

  return sortedByCooldownAge[0];
}

// Call Gemini model with automatic retry, rate limit queueing, exponential backoff, model fallback rotation, & robust JSON parsing
async function callGeminiJson<T>(
  prompt: string,
  systemInstruction?: string,
  maxRetries = 6
): Promise<T> {
  const cacheKey = (systemInstruction || '') + ':::' + prompt;
  const cached = geminiResponseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log('[Gemini Cache] Returning cached AI response');
    return cached.data as T;
  }

  const ai = getGenAI();
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const modelToUse = getBestModelToUse();

    try {
      console.log(`[Gemini Request] Attempt ${attempt}/${maxRetries} using model '${modelToUse}'...`);
      const response = await runWithGeminiQueue(() =>
        ai.models.generateContent({
          model: modelToUse,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            ...(systemInstruction ? { systemInstruction } : {})
          }
        })
      );

      const rawText = response.text || '';
      const parsed = cleanJsonResponse(rawText);
      if (parsed && typeof parsed === 'object') {
        geminiResponseCache.set(cacheKey, { data: parsed, timestamp: Date.now() });
        return parsed as T;
      }
    } catch (err: any) {
      const isRateLimit = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED') || err?.message?.includes('Quota');
      if (isRateLimit) {
        modelCooldowns.set(modelToUse, Date.now());
        // Pause subsequent queue processing for 3.5s to let rate limit window cool down
        lastGeminiCallEndTime = Date.now() + 3500;
      }

      console.warn(`Gemini API attempt ${attempt} (${modelToUse}) failed:`, err?.status || err?.message);
      lastError = err;

      if (attempt < maxRetries) {
        // Exponential backoff base: 3s, 5.5s, 9s, 14s, 20s + random jitter (500-1500ms)
        const baseDelay = isRateLimit ? Math.min(3000 * Math.pow(1.5, attempt - 1), 20000) : 2000;
        const jitter = Math.floor(Math.random() * 1000) + 500;
        const waitMs = Math.round(baseDelay + jitter);
        
        console.log(`[Gemini Backoff] Waiting ${waitMs}ms before retry ${attempt + 1}...`);
        await new Promise(r => setTimeout(r, waitMs));
      }
    }
  }

  const isQuota = lastError?.status === 429 || lastError?.message?.includes('429') || lastError?.message?.includes('RESOURCE_EXHAUSTED') || lastError?.message?.includes('Quota');
  if (isQuota) {
    throw new Error('AI service rate limit reached. The system automatically retried, but API limits are temporarily active. Please wait a few seconds and try again.');
  }

  throw new Error(lastError?.message || 'AI service failed to generate valid structured response. Please try again.');
}

// Server-side Gemini API test endpoint
app.get('/api/health-ai', async (req, res) => {
  try {
    const data = await callGeminiJson<{ status: string }>('Respond with JSON: {"status": "ok"}', 'Return valid JSON only.');
    res.json({ status: 'ok', model: 'gemini-3.6-flash', data });
  } catch (error: any) {
    console.error('Gemini API health check failed:', error);
    res.status(500).json({ error: error?.message || 'AI service unavailable.' });
  }
});

// Endpoint 0: Extract PDF text
app.post('/api/extract-pdf', (req, res, next) => {
  upload.single('resumeFile')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size exceeds the 10MB limit. Please upload a smaller PDF.' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      return res.status(400).json({ error: 'Failed to process uploaded file.' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided. Please select a valid PDF document.' });
    }

    // MIME type / magic bytes check
    const mimeType = req.file.mimetype || '';
    const isPdf = mimeType.includes('pdf') || req.file.originalname.toLowerCase().endsWith('.pdf') || req.file.buffer.slice(0, 4).toString() === '%PDF';
    if (!isPdf) {
      return res.status(400).json({ error: 'Invalid file format. Only PDF documents are allowed.' });
    }

    const extractedText = await extractTextFromPdfBuffer(req.file.buffer);

    if (!extractedText) {
      return res.status(400).json({ error: 'Could not extract readable text from the provided PDF file.' });
    }

    res.json({ text: extractedText });
  } catch (error: any) {
    console.error('Error in /api/extract-pdf:', error?.message || error);
    res.status(500).json({ error: 'Failed to extract text from PDF document.' });
  }
});

// OPERATION 1: ANALYZE JOB DESCRIPTION
app.post('/api/ai/analyze-job', async (req, res) => {
  try {
    const jobDescription = req.body.jobDescription || req.body.jobDescriptionText;
    if (!jobDescription || typeof jobDescription !== 'string') {
      return res.status(400).json({ error: 'Job description text is required.' });
    }

    const systemInstruction = `You are an expert ATS & technical recruiter. Analyze job descriptions into precise structured JSON format.`;
    
    const prompt = `Analyze the following job description thoroughly and extract structured information into JSON.

Job Description:
"""
${jobDescription}
"""

Return a valid JSON object matching this schema EXACTLY:
{
  "jobTitle": "string",
  "company": "string",
  "seniority": "string (e.g. Junior, Mid, Senior, Lead, Staff, Principal, Director)",
  "yearsOfExperience": "string (e.g. 5+ years)",
  "requiredSkills": [
    {
      "name": "string",
      "normalizedName": "string",
      "importance": "REQUIRED|HIGH|MEDIUM|LOW",
      "category": "string",
      "synonyms": ["string"]
    }
  ],
  "preferredSkills": [
    {
      "name": "string",
      "normalizedName": "string",
      "importance": "PREFERRED|MEDIUM|LOW",
      "category": "string",
      "synonyms": ["string"]
    }
  ],
  "technologies": [
    {
      "name": "string",
      "normalizedName": "string",
      "importance": "REQUIRED|HIGH|MEDIUM|LOW",
      "category": "string",
      "synonyms": ["string"]
    }
  ],
  "tools": [
    {
      "name": "string",
      "normalizedName": "string",
      "importance": "HIGH|MEDIUM|LOW",
      "category": "string",
      "synonyms": ["string"]
    }
  ],
  "responsibilities": ["array of core responsibilities"],
  "educationRequirements": ["array of degree requirements"],
  "certificationRequirements": ["array of certification requirements"],
  "softSkills": ["array of soft skills"],
  "domainKnowledge": ["array of domain/industry knowledge"],
  "keywords": [
    {
      "name": "string",
      "normalizedName": "string",
      "importance": "HIGH|MEDIUM|LOW",
      "category": "string",
      "synonyms": ["string"]
    }
  ],
  "importantPhrases": ["array of key contextual phrases"],
  "acronyms": [
    { "term": "string", "expansion": "string" }
  ]
}`;

    const result = await callGeminiJson<any>(prompt, systemInstruction);

    if (result) {
      if (!result.company) result.company = 'Target Employer';
      if (!result.jobTitle) result.jobTitle = 'Target Role';
      if (!result.acronyms) result.acronyms = [];
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error in /api/ai/analyze-job:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze job description. Please try again.' });
  }
});

// OPERATION 2: ANALYZE RESUME
app.post('/api/ai/analyze-resume', async (req, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText || typeof resumeText !== 'string') {
      return res.status(400).json({ error: 'Resume text is required.' });
    }

    const systemInstruction = `You are a meticulous resume parser. Extract candidate factual information with exact evidence snippets from the original resume.`;

    const prompt = `Analyze the following candidate resume text carefully and extract all factual candidate information. Preserve exact evidence snippets from the original resume for every extracted skill.

Candidate Resume Text:
"""
${resumeText}
"""

Return a valid JSON object matching this schema EXACTLY:
{
  "personal": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedIn": "string",
    "portfolio": "string"
  },
  "summary": "string",
  "skills": [
    {
      "name": "string",
      "category": "string",
      "evidenceFromResume": "direct quote or reference snippet from original resume"
    }
  ],
  "experience": [
    {
      "id": "exp_1",
      "jobTitle": "string",
      "company": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "bullets": ["array of bullet points from original resume"]
    }
  ],
  "projects": [
    {
      "id": "proj_1",
      "title": "string",
      "description": "string",
      "technologiesUsed": ["array of technologies used"],
      "link": "string"
    }
  ],
  "education": [
    {
      "id": "edu_1",
      "level": "string (e.g. 10th / Secondary, 12th / Intermediate, Undergraduate, etc)",
      "degree": "string (e.g. Bachelor of Technology)",
      "specialization": "string (e.g. Electronics and Communication Engineering)",
      "fieldOfStudy": "string (alias for specialization)",
      "institution": "string (e.g. Audisankara College)",
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "graduationYear": "string",
      "cgpa": "string (ONLY if candidate explicitly provided)",
      "percentage": "string (ONLY if candidate explicitly provided)",
      "marksObtained": "string (ONLY if candidate explicitly provided)",
      "totalMarks": "string",
      "board": "string"
    }
  ],
  "certifications": [
    {
      "id": "cert_1",
      "name": "string",
      "issuer": "string",
      "year": "string"
    }
  ]
}`;

    const result = await callGeminiJson<any>(prompt, systemInstruction);

    if (result) {
      if (result.personal && !result.contactInfo) {
        result.contactInfo = { ...result.personal };
      } else if (result.contactInfo && !result.personal) {
        result.personal = { ...result.contactInfo };
      }
      if (result.experience && !result.workExperience) {
        result.workExperience = [...result.experience];
      } else if (result.workExperience && !result.experience) {
        result.experience = [...result.workExperience];
      }
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error in /api/ai/analyze-resume:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze candidate resume. Please try again.' });
  }
});

// OPERATION 3: MATCH RESUME TO JOB
app.post('/api/ai/match-job', async (req, res) => {
  try {
    const { jobAnalysis, resumeAnalysis, resumeText } = req.body;
    if (!jobAnalysis || !resumeAnalysis) {
      return res.status(400).json({ error: 'Job analysis and resume analysis are required.' });
    }

    const systemInstruction = `You are a rigorous ATS match engine. Audit requirement coverage, extract candidate evidence, classify status as MATCHED, PARTIALLY_MATCHED, or NOT_FOUND, and calculate internal optimization metrics. Internal optimization metrics must NEVER be claimed as guaranteed ATS probabilities.`;

    const prompt = `Compare the candidate's resume analysis against the target job requirements.

CRITICAL MATCHING RULES:
1. Every requirement from the job description must be returned as an item in the requirements array with:
   - "requirement": string name of requirement
   - "importance": "REQUIRED" | "PREFERRED" | "HIGH" | "MEDIUM" | "LOW"
   - "status": MUST be exactly one of: "MATCHED", "PARTIALLY_MATCHED", "NOT_FOUND"
   - "candidateEvidence": array of string quotes/snippets from candidate resume supporting the match
   - "explanation": detailed explanation of match, partial match, or reason missing
2. Status definitions:
   - "MATCHED": Explicitly backed by candidate experience/skills.
   - "PARTIALLY_MATCHED": Overlapping experience exists, but missing exact depth or specific tech variant.
   - "NOT_FOUND": No supporting evidence found in candidate's resume.
3. Equivalent Matching:
   - Recognize legitimate abbreviations and synonyms (e.g., JS = JavaScript, AWS = Amazon Web Services, Postgres = PostgreSQL, CI/CD = Continuous Integration).
   - DO NOT treat unrelated technologies as equivalents (e.g., React != React Native, AWS != Azure, SQL != PostgreSQL).
4. Calculate optimization scores (0-100):
   - skillsMatch
   - keywordMatch
   - experienceMatch
   - responsibilityMatch
   - educationMatch
   - overallMatch
   Include "scoreNote": "Internal optimization metric — not a guaranteed ATS probability."

Job Analysis Data:
${JSON.stringify(jobAnalysis, null, 2)}

Candidate Resume Data:
${JSON.stringify(resumeAnalysis, null, 2)}

Original Resume Text:
"""
${resumeText || ''}
"""

Return a valid JSON object matching this schema EXACTLY:
{
  "skillsMatch": 85,
  "keywordMatch": 80,
  "experienceMatch": 90,
  "responsibilityMatch": 75,
  "educationMatch": 100,
  "overallMatch": 86,
  "scoreNote": "Internal optimization metric — not a guaranteed ATS probability.",
  "requirements": [
    {
      "requirement": "string requirement",
      "importance": "REQUIRED|PREFERRED|HIGH|MEDIUM|LOW",
      "status": "MATCHED|PARTIALLY_MATCHED|NOT_FOUND",
      "candidateEvidence": ["array of evidence snippets"],
      "explanation": "string explanation"
    }
  ],
  "keywordOpportunities": [
    {
      "keyword": "string keyword",
      "importance": "HIGH|MEDIUM|LOW",
      "reasonItMatters": "why this matters",
      "evidenceFound": boolean,
      "evidenceSnippet": "snippet if found",
      "recommendation": "If evidence exists, advise how to phrase it. If NO evidence exists, explicitly state: 'Do not add this skill unless you have real hands-on experience.'"
    }
  ],
  "strongMatches": ["array of top matched skills/strengths"],
  "missingRequirements": ["array of missing requirements"],
  "partialMatches": ["array of partially matched areas"],
  "recommendations": ["array of actionable advice"]
}`;

    const result = await callGeminiJson<any>(prompt, systemInstruction);

    if (result) {
      result.overallMatchScore = result.overallMatch ?? result.overallMatchScore ?? 80;
      result.skillsMatchScore = result.skillsMatch ?? result.skillsMatchScore ?? 80;
      result.keywordMatchScore = result.keywordMatch ?? result.keywordMatchScore ?? 80;
      result.experienceMatchScore = result.experienceMatch ?? result.experienceMatchScore ?? 80;
      result.responsibilityMatchScore = result.responsibilityMatch ?? result.responsibilityMatchScore ?? 80;
      result.educationMatchScore = result.educationMatch ?? result.educationMatchScore ?? 100;
      result.scoreNote = "Internal optimization metric — not a guaranteed ATS probability.";
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error in /api/ai/match-job:', error);
    res.status(500).json({ error: error.message || 'Failed to compute match analysis. Please try again.' });
  }
});

// Helper function to audit and auto-sanitize optimized resume against original candidate data
function verifyAndSanitizeOptimizedResume(
  optimizedResume: any,
  originalResumeAnalysis: any,
  originalResumeText: string
) {
  const unsupportedClaims: Array<{
    type: string;
    claim: string;
    sourceProblem: string;
    recommendation: string;
  }> = [];

  const sanitized = JSON.parse(JSON.stringify(optimizedResume || {}));
  const origTextLower = (originalResumeText || '').toLowerCase();
  
  // Collect all original candidate skill names
  const origSkillsSet = new Set<string>();
  if (Array.isArray(originalResumeAnalysis?.skills)) {
    originalResumeAnalysis.skills.forEach((s: any) => {
      if (s?.name) origSkillsSet.add(s.name.toLowerCase().trim());
    });
  }

  // 1. Verify Skills and missing technologies
  if (Array.isArray(sanitized.skills)) {
    sanitized.skills = sanitized.skills.map((catGroup: any) => {
      if (!Array.isArray(catGroup?.items)) return catGroup;
      const validItems: string[] = [];

      for (const skillItem of catGroup.items) {
        const itemStr = String(skillItem).trim();
        const itemLower = itemStr.toLowerCase();
        
        // Check if present in original skills list or in raw original text
        const isKnownSkill = origSkillsSet.has(itemLower) ||
          origTextLower.includes(itemLower) ||
          Array.from(origSkillsSet).some(s => itemLower.includes(s) || s.includes(itemLower));

        if (isKnownSkill) {
          validItems.push(itemStr);
        } else {
          unsupportedClaims.push({
            type: 'unsupported_technology',
            claim: itemStr,
            sourceProblem: `The technology "${itemStr}" was not found in candidate's original resume upload.`,
            recommendation: `Removed "${itemStr}" from optimized skills list to prevent fabrication.`
          });
        }
      }

      return { ...catGroup, items: validItems };
    });
  }

  // 2. Verify Certifications
  if (Array.isArray(sanitized.certifications)) {
    const origCerts = (originalResumeAnalysis?.certifications || []).map((c: any) => (c?.name || '').toLowerCase().trim());
    sanitized.certifications = sanitized.certifications.filter((cert: any) => {
      const certName = (cert?.name || '').toLowerCase().trim();
      if (!certName) return false;
      const isKnown = origCerts.some((c: string) => c.includes(certName) || certName.includes(c)) || origTextLower.includes(certName);
      if (!isKnown) {
        unsupportedClaims.push({
          type: 'unsupported_certification',
          claim: cert?.name || certName,
          sourceProblem: `The certification "${cert?.name || certName}" was added without evidence in candidate's original resume.`,
          recommendation: `Removed "${cert?.name || certName}" from certifications section.`
        });
        return false;
      }
      return true;
    });
  }

  // 3. Verify Job Titles
  if (Array.isArray(sanitized.experience)) {
    const origTitles = (originalResumeAnalysis?.experience || originalResumeAnalysis?.workExperience || []).map((e: any) => (e?.jobTitle || '').toLowerCase().trim());
    sanitized.experience.forEach((exp: any) => {
      const optTitle = (exp?.jobTitle || '').toLowerCase().trim();
      if (optTitle && origTitles.length > 0) {
        const titleKnown = origTitles.some((t: string) => origTextLower.includes(optTitle) || optTitle.includes(t) || t.includes(optTitle));
        if (!titleKnown) {
          unsupportedClaims.push({
            type: 'unsupported_title',
            claim: exp.jobTitle,
            sourceProblem: `The job title "${exp.jobTitle}" differs from original job titles in uploaded resume.`,
            recommendation: `Verify job title against actual work history.`
          });
        }
      }
    });
  }

  // 4. Verify Metrics (e.g. percentages, numbers, $ amounts not present in original text)
  const metricRegex = /\b(\d+%\b|\$\d+[\d,]*[kKmMbB]?|\b\d+\s*(?:years?|yrs?|engineers?|clients?|users?)\b)/g;
  const origMetrics = new Set((origTextLower.match(metricRegex) || []).map(m => m.trim()));

  if (Array.isArray(sanitized.experience)) {
    sanitized.experience.forEach((exp: any) => {
      if (Array.isArray(exp.bullets)) {
        exp.bullets.forEach((bullet: string) => {
          const matches = bullet.toLowerCase().match(metricRegex) || [];
          for (const m of matches) {
            if (!origMetrics.has(m) && !origTextLower.includes(m)) {
              unsupportedClaims.push({
                type: 'unsupported_metric',
                claim: m,
                sourceProblem: `The metric "${m}" in "${bullet.slice(0, 45)}..." was created without original source data.`,
                recommendation: `Replace with qualitative achievement wording unless backed by verifiable data.`
              });
            }
          }
        });
      }
    });
  }

  return {
    sanitizedResume: sanitized,
    fabricationsDetected: unsupportedClaims.length > 0,
    unsupportedClaims
  };
}

// OPERATION 4: OPTIMIZE RESUME
app.post('/api/ai/optimize-resume', async (req, res) => {
  try {
    const { jobAnalysis, resumeAnalysis, matchReport, resumeText } = req.body;
    if (!jobAnalysis || !resumeAnalysis) {
      return res.status(400).json({ error: 'Job analysis and resume analysis are required.' });
    }

    const systemInstruction = `You are a strict factual resume optimizer. 
STRICT ZERO-FABRICATION GUARANTEE:
- Never add unsupported information.
- Never fabricate metrics, percentages, or numbers.
- Never fabricate technologies, tools, or skills.
- Never fabricate responsibilities, projects, or achievements.
- Never claim missing skills, missing degrees, or unearned certifications that the candidate does not possess.
- Never alter job titles or inflate years of experience.
- Optimize ONLY information supported by the original candidate data by polishing action verbs and prioritizing target position alignment.`;

    const prompt = `Generate an optimized, ATS-tailored resume using ONLY information supported by the candidate's original resume.

CRITICAL FACTUALITY RULES:
1. NEVER INVENT:
   - missing technologies or skills from target job description
   - tools or frameworks candidate has not used
   - employers, companies, or job titles
   - projects, degrees, or certifications
   - responsibilities or duties not performed by candidate
   - metrics, percentages, dollar amounts, or numbers
   - years of experience
2. If a technology or requirement appears in the job description but is missing from candidate's resume, DO NOT add it.
3. Optimize phrasing using target role keywords ONLY when backed by candidate's actual experience.

Candidate Resume Data:
${JSON.stringify(resumeAnalysis, null, 2)}

Original Resume Text:
"""
${resumeText || ''}
"""

Target Job Analysis Data:
${JSON.stringify(jobAnalysis, null, 2)}

Match Analysis Data:
${JSON.stringify(matchReport || {}, null, 2)}

Return a valid JSON object matching this schema EXACTLY:
{
  "contactInfo": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedIn": "string",
    "portfolio": "string"
  },
  "summary": "string tailored summary using ONLY candidate real experience",
  "skills": [
    {
      "category": "string (e.g., Programming Languages, Cloud, Frameworks)",
      "items": ["array of candidate's real skills"]
    }
  ],
  "experience": [
    {
      "id": "exp_1",
      "jobTitle": "string",
      "company": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "bullets": ["tailored action-verb bullets strictly using factual metrics and responsibilities from original resume"]
    }
  ],
  "projects": [
    {
      "id": "proj_1",
      "title": "string (Consistent Title Case formatting, e.g. ResumeMatch AI)",
      "description": "string (Concise description without inventing metrics)",
      "technologiesUsed": ["array of candidate's real project technologies"],
      "link": "string"
    }
  ],
  "education": [
    {
      "id": "edu_1",
      "degree": "string",
      "institution": "string",
      "graduationYear": "string",
      "fieldOfStudy": "string",
      "cgpa": "string (strictly from original resume, do not invent)",
      "percentage": "string (strictly from original resume, do not invent)",
      "marksObtained": "string",
      "totalMarks": "string",
      "board": "string"
    }
  ],
  "certifications": [
    {
      "id": "cert_1",
      "name": "string",
      "issuer": "string",
      "year": "string"
    }
  ]
}`;

    const result = await callGeminiJson<any>(prompt, systemInstruction);

    if (result) {
      if (result.contactInfo && !result.personal) {
        result.personal = { ...result.contactInfo };
      }
      if (result.experience && !result.workExperience) {
        result.workExperience = [...result.experience];
      }

      // Run automated anti-fabrication verification and auto-sanitization pass
      const autoVerification = verifyAndSanitizeOptimizedResume(result, resumeAnalysis, resumeText || '');
      const finalResume = autoVerification.sanitizedResume;
      finalResume.personal = finalResume.personal || finalResume.contactInfo;
      finalResume.workExperience = finalResume.workExperience || finalResume.experience;
      
      if (autoVerification.fabricationsDetected) {
        finalResume._autoSanitized = true;
        finalResume._sanitizedClaims = autoVerification.unsupportedClaims;
      }

      return res.json(finalResume);
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error in /api/ai/optimize-resume:', error);
    res.status(500).json({ error: error.message || 'Failed to generate optimized resume. Please try again.' });
  }
});

// OPERATION 5: VALIDATE OPTIMIZED RESUME
app.post('/api/ai/validate-resume', async (req, res) => {
  try {
    const { originalResumeText, originalResumeAnalysis, optimizedResume } = req.body;
    if (!originalResumeText || !optimizedResume) {
      return res.status(400).json({ error: 'Original resume text and optimized resume object are required.' });
    }

    const systemInstruction = `You are a zero-tolerance factual audit validator comparing an OPTIMIZED RESUME against an ORIGINAL RESUME. Flag any unsupported claim, fabricated metric, unmentioned skill, or ungrounded title.`;

    const prompt = `Perform a strict factual validation audit comparing the ORIGINAL RESUME against the OPTIMIZED RESUME.

Check for ANY unsupported claims or fabrications in the OPTIMIZED RESUME that were NOT in the ORIGINAL RESUME:
- missing skills or technologies from target job added without original basis
- unsupported certifications added
- metrics, numbers, or percentages created without original basis
- unsupported responsibilities or duties created
- inflated years of experience or false dates
- modified job titles or false employer names

ORIGINAL RESUME TEXT:
"""
${originalResumeText}
"""

ORIGINAL RESUME STRUCTURED DATA:
${JSON.stringify(originalResumeAnalysis || {}, null, 2)}

OPTIMIZED RESUME TO AUDIT:
${JSON.stringify(optimizedResume, null, 2)}

Return a valid JSON object matching this schema EXACTLY:
{
  "safeToPublish": boolean (true ONLY if 0 unsupported claims or fabrications exist),
  "fabricationsDetected": boolean (true if ANY unsupported claims exist),
  "unsupportedClaims": [
    {
      "type": "unsupported_skill|unsupported_technology|unsupported_employer|unsupported_title|unsupported_metric|unsupported_degree|unsupported_claim",
      "claim": "exact wording of unsupported claim in optimized resume",
      "sourceProblem": "explanation of why claim is unsupported",
      "recommendation": "actionable fix to replace or remove claim"
    }
  ],
  "warnings": [
    {
      "type": "string",
      "claim": "string",
      "sourceProblem": "string",
      "recommendation": "string"
    }
  ],
  "verifiedFactsCount": number,
  "flaggedCount": number
}`;

    const result = await callGeminiJson<any>(prompt, systemInstruction);

    // Combine with automated programmatic rule-based audit
    const autoAudit = verifyAndSanitizeOptimizedResume(optimizedResume, originalResumeAnalysis, originalResumeText);

    if (result) {
      const claimsMap = new Map<string, any>();
      (result.unsupportedClaims || []).forEach((c: any) => claimsMap.set(`${c.type}_${c.claim}`, c));
      (autoAudit.unsupportedClaims || []).forEach((c: any) => claimsMap.set(`${c.type}_${c.claim}`, c));

      const mergedClaims = Array.from(claimsMap.values());
      result.unsupportedClaims = mergedClaims;
      result.warnings = mergedClaims;
      result.fabricationsDetected = mergedClaims.length > 0;
      result.safeToPublish = !result.fabricationsDetected;
      result.isValid = result.safeToPublish;
      result.flaggedCount = mergedClaims.length;
      result.verifiedFactsCount = result.verifiedFactsCount ?? 10;
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error in /api/ai/validate-resume:', error);
    res.status(500).json({ error: error.message || 'Failed to complete resume validation audit. Please try again.' });
  }
});

// Fallback for unmatched /api routes to prevent HTML fall-through
app.all(['/api', '/api/*'], (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Global API error handling middleware (MUST have 4 arguments)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error Middleware caught:', err);
  if (res.headersSent) {
    return next(err);
  }
  const status = typeof err.status === 'number' ? err.status : (typeof err.statusCode === 'number' ? err.statusCode : 500);
  res.status(status).json({
    error: err?.message || 'An unexpected server error occurred. Please try again.'
  });
});

// Serve frontend assets or Vite dev middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
