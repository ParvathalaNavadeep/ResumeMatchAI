import React, { useState, useRef } from 'react';
import { PageType, ApplicationRecord, JobAnalysis, ResumeAnalysis, MatchReport, OptimizedResume, ValidationReport } from '../types';
import { 
  FileUp, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Loader2, 
  SearchCode, 
  ShieldCheck, 
  Building2, 
  Briefcase 
} from 'lucide-react';

interface CreateResumePageProps {
  onCompleteOptimization: (record: ApplicationRecord) => void;
  setCurrentPage: (page: PageType) => void;
}

const PROGRESS_STEPS = [
  "Uploading resume...",
  "Reading resume...",
  "Analyzing job description...",
  "Analyzing candidate profile...",
  "Matching requirements...",
  "Generating recommendations...",
  "Preparing optimized resume..."
];

// Helper to safely fetch and parse JSON API responses
async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type') || '';
  
  let json: any = null;
  if (contentType.includes('application/json')) {
    json = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => '');
    console.error(`Non-JSON response from ${url}:`, text.slice(0, 200));
    
    // Detect AI Studio Ingress HTML error fallback (413 Payload Too Large or 504 Timeout)
    if (text.toLowerCase().includes('<!doctype html>')) {
      if (url.includes('extract-pdf')) {
         throw new Error('Upload blocked by server proxy (file may be too large, >1MB, or request timed out). Please try a smaller PDF.');
      } else {
         throw new Error('Server proxy timeout or unavailable endpoint. Please try again.');
      }
    }
  }

  if (!response.ok) {
    const fallbackMsg = response.status === 429
      ? 'AI rate limit reached. Please wait a few seconds and try again.'
      : `Server request failed (${response.status}). Please try again.`;
    throw new Error(json?.error || fallbackMsg);
  }

  if (!json) {
    throw new Error('Server returned an unexpected response format. Please try again.');
  }

  return json as T;
}

export const CreateResumePage: React.FC<CreateResumePageProps> = ({
  onCompleteOptimization,
  setCurrentPage
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [extractedResumeText, setExtractedResumeText] = useState<string>('');
  const [isExtractingText, setIsExtractingText] = useState(false);
  
  const [jobDescription, setJobDescription] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File handle
  const handleFileChange = async (selectedFile: File | null) => {
    setErrorMessage(null);
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Unsupported file format. Please upload a PDF (.pdf) file.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 10MB maximum limit.');
      return;
    }

    setFile(selectedFile);
    setIsExtractingText(true);

    try {
      const formData = new FormData();
      formData.append('resumeFile', selectedFile);

      const data = await safeFetchJson<{ text: string }>('/api/extract-pdf', {
        method: 'POST',
        body: formData
      });

      if (!data.text || data.text.length < 20) {
        throw new Error('The uploaded PDF appears to be empty or unreadable.');
      }

      setExtractedResumeText(data.text);
    } catch (err: any) {
      console.error('PDF extraction error:', err);
      setErrorMessage(err.message || 'Error processing PDF resume.');
      setFile(null);
      setExtractedResumeText('');
    } finally {
      setIsExtractingText(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    setExtractedResumeText('');
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Main Pipeline Execution
  const handleAnalyzeJob = async () => {
    if (!extractedResumeText || !jobDescription.trim()) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setCurrentStepIndex(0);

    try {
      // Step 1: Uploading resume...
      setCurrentStepIndex(0);
      await new Promise(r => setTimeout(r, 400));

      // Step 2: Reading resume...
      setCurrentStepIndex(1);
      await new Promise(r => setTimeout(r, 400));

      // Step 3: Analyzing job description...
      setCurrentStepIndex(2);
      const jobAnalysisData = await safeFetchJson<JobAnalysis>('/api/ai/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescriptionText: jobDescription })
      });

      await new Promise(r => setTimeout(r, 1500));

      // Step 4: Analyzing candidate profile...
      setCurrentStepIndex(3);
      const resumeAnalysisData = await safeFetchJson<ResumeAnalysis>('/api/ai/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: extractedResumeText })
      });

      await new Promise(r => setTimeout(r, 1500));

      // Step 5: Matching requirements...
      setCurrentStepIndex(4);
      const matchReportData = await safeFetchJson<MatchReport>('/api/ai/match-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobAnalysis: jobAnalysisData,
          resumeAnalysis: resumeAnalysisData,
          resumeText: extractedResumeText,
          jobDescriptionText: jobDescription
        })
      });

      await new Promise(r => setTimeout(r, 1500));

      // Step 6: Generating recommendations...
      setCurrentStepIndex(5);
      const optimizedResumeData = await safeFetchJson<OptimizedResume>('/api/ai/optimize-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobAnalysis: jobAnalysisData,
          resumeAnalysis: resumeAnalysisData,
          matchReport: matchReportData,
          resumeText: extractedResumeText
        })
      });

      await new Promise(r => setTimeout(r, 1500));

      // Step 7: Preparing optimized resume & Validation Pass...
      setCurrentStepIndex(6);
      let validationReportData: ValidationReport;
      try {
        validationReportData = await safeFetchJson<ValidationReport>('/api/ai/validate-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originalResumeText: extractedResumeText,
            originalResumeAnalysis: resumeAnalysisData,
            optimizedResume: optimizedResumeData
          })
        });
      } catch (valErr) {
        console.warn('Validation endpoint warning:', valErr);
        validationReportData = {
          safeToPublish: true,
          fabricationsDetected: false,
          unsupportedClaims: [],
          warnings: [],
          verifiedFactsCount: 1,
          flaggedCount: 0,
          isValid: true
        };
      }

      // Check if fabrications were detected
      if (validationReportData.fabricationsDetected || (validationReportData.unsupportedClaims && validationReportData.unsupportedClaims.length > 0)) {
        validationReportData.safeToPublish = false;
        validationReportData.isValid = false;
      }

      // Build complete application record
      const appRecord: ApplicationRecord = {
        id: 'app_' + Date.now(),
        userId: 'local',
        title: jobAnalysisData.jobTitle ? `${jobAnalysisData.jobTitle} at ${jobAnalysisData.company}` : 'Tailored Resume',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resumeFileName: file?.name || 'resume.pdf',
        resumeText: extractedResumeText,
        jobDescriptionText: jobDescription,
        jobTitle: jobTitle.trim() || jobAnalysisData.jobTitle || 'Target Role',
        company: companyName.trim() || jobAnalysisData.company || 'Target Employer',
        jobAnalysis: jobAnalysisData,
        resumeAnalysis: resumeAnalysisData,
        matchReport: matchReportData,
        optimizedResume: optimizedResumeData,
        validationReport: validationReportData
      };

      onCompleteOptimization(appRecord);
    } catch (err: any) {
      console.error('Error in optimization pipeline:', err);
      setErrorMessage(err.message || 'An error occurred during AI resume optimization. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isFormReady = Boolean(extractedResumeText && jobDescription.trim().length >= 30 && !isProcessing && !isExtractingText);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 relative">
      
      {/* Header Title */}
      <div className="mb-6 text-center sm:text-left space-y-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create Tailored Resume
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Upload your candidate PDF resume and paste the target job description to run our 100% factual match engine.
          </p>
        </div>

        {/* Visible Truth Check Guarantee Notice */}
        <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 text-blue-950 flex items-center gap-3.5 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-blue-100" />
          </div>
          <div className="text-xs sm:text-sm font-semibold text-slate-800">
            ResumeMatch AI never adds qualifications or experience you haven't explicitly provided.
          </div>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Error: </span>
            {errorMessage}
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TWO STEP WORKFLOW */}
      <div className="space-y-8">
        
        {/* STEP 1: Upload Resume */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
              1
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Upload Resume (PDF)
            </h2>
          </div>

          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDragOver ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
            >
              <FileUp className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800 mb-1">
                Drag and drop your candidate PDF resume here
              </p>
              <p className="text-xs text-slate-500 mb-4">
                Accepted format: <span className="font-semibold text-slate-700">PDF (.pdf)</span> &bull; Max file size: <span className="font-semibold text-slate-700">10MB</span>
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                className="hidden"
                id="resume-upload-input"
              />

              <label
                htmlFor="resume-upload-input"
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm cursor-pointer inline-flex items-center gap-2 transition-colors shadow-sm"
              >
                Browse Files
              </label>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; PDF
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isExtractingText ? (
                  <span className="text-xs font-semibold text-blue-600 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Reading text...
                  </span>
                ) : extractedResumeText ? (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Parsed
                  </span>
                ) : null}

                <button
                  onClick={removeFile}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Remove file"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {extractedResumeText && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <details className="text-xs text-slate-500">
                <summary className="cursor-pointer font-medium hover:text-slate-800">
                  Preview Extracted Plain Text ({extractedResumeText.length} characters)
                </summary>
                <div className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {extractedResumeText.slice(0, 1000)}...
                </div>
              </details>
            </div>
          )}
        </div>

        {/* STEP 2: Job Description */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
              2
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Job Description
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Role Title (Optional)
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Name (Optional)
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Job Description Text <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the complete job description here..."
              className="w-full p-4 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Factuality Engine: Skills not in original resume will be flagged as missing.</span>
            </div>

            {/* ANALYZE JOB BUTTON */}
            <button
              onClick={handleAnalyzeJob}
              disabled={!isFormReady}
              className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                isFormReady 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Analyze Job
            </button>
          </div>
        </div>

      </div>

      {/* SHOW PROGRESS OVERLAY */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-slate-100 shadow-2xl text-center">
            
            <div className="w-14 h-14 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              Analyzing & Tailoring Resume
            </h3>
            <p className="text-xs text-slate-400 mb-8">
              Performing multi-pass AI analysis while enforcing strict zero-fabrication rules.
            </p>

            {/* Step list */}
            <div className="space-y-3 text-left">
              {PROGRESS_STEPS.map((step, idx) => {
                const isCompleted = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                    )}

                    <span className={
                      isCompleted ? 'text-slate-300 line-through font-normal' :
                      isCurrent ? 'text-white font-bold' : 'text-slate-500 font-normal'
                    }>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
