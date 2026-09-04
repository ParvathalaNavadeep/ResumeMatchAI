import React, { useState } from 'react';
import { MatchReport, JobAnalysis, ResumeAnalysis, PageType, RequirementMatch, KeywordOpportunity, ValidationReport, OptimizedResume } from '../types';
import { FactCheckSection } from './FactCheckSection';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Sparkles, 
  FileEdit, 
  Eye, 
  Info,
  X,
  Search,
  HelpCircle,
  ArrowUpRight,
  ShieldAlert,
  Target
} from 'lucide-react';

interface MatchReportPageProps {
  matchReport: MatchReport | null;
  jobAnalysis?: JobAnalysis | null;
  resumeAnalysis?: ResumeAnalysis | null;
  validationReport?: ValidationReport | null;
  optimizedResume?: OptimizedResume | null;
  setCurrentPage: (page: PageType) => void;
}

interface InspectedKeyword {
  keyword: string;
  status: 'MATCHED' | 'PARTIALLY_MATCHED' | 'NOT_FOUND';
  importance: string;
  category: string;
  jobContext: string;
  resumeAppears: boolean | 'PARTIAL';
  resumeEvidence: string;
  explanation: string;
  recommendedAction: string;
}

export const MatchReportPage: React.FC<MatchReportPageProps> = ({
  matchReport,
  jobAnalysis,
  resumeAnalysis,
  validationReport,
  optimizedResume,
  setCurrentPage
}) => {
  const [inspectedKeyword, setInspectedKeyword] = useState<InspectedKeyword | null>(null);

  if (!matchReport) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600 mb-4">No match report available yet.</p>
        <button
          onClick={() => setCurrentPage('create')}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm cursor-pointer hover:bg-blue-700 transition-colors"
        >
          Create New Optimization
        </button>
      </div>
    );
  }

  const {
    overallMatchScore = 0,
    skillsMatchScore = 0,
    keywordMatchScore = 0,
    experienceMatchScore = 0,
    responsibilityMatchScore = 0,
    educationMatchScore = 0,
    requirements: rawRequirements = [],
    keywordOpportunities: rawKeywordOpportunities = [],
    strongMatches: rawStrongMatches = [],
    missingRequirements: rawMissingRequirements = [],
    partialMatches: rawPartialMatches = [],
    recommendations = []
  } = matchReport;

  // Normalize data to ensure object properties (like SkillKeyword) are converted to strings before rendering
  const requirements = rawRequirements.map(r => ({
    ...r,
    requirement: typeof r.requirement === 'string' ? r.requirement : ((r.requirement as any)?.name || String(r.requirement))
  }));

  const keywordOpportunities = rawKeywordOpportunities.map(k => ({
    ...k,
    keyword: typeof k.keyword === 'string' ? k.keyword : ((k.keyword as any)?.name || String(k.keyword))
  }));

  const strongMatches = rawStrongMatches.map(s => typeof s === 'string' ? s : ((s as any)?.name || String(s)));
  const missingRequirements = rawMissingRequirements.map(m => typeof m === 'string' ? m : ((m as any)?.name || String(m)));
  const partialMatches = rawPartialMatches.map(p => typeof p === 'string' ? p : ((p as any)?.name || String(p)));

  // Derive structured lists from requirements & opportunities
  const matchedRequirements = requirements.filter(r => r.status === 'MATCHED');
  const partialRequirements = requirements.filter(r => r.status === 'PARTIALLY_MATCHED');
  const missingRequirementsList = requirements.filter(r => r.status === 'NOT_FOUND');

  // Fallback keyword array if requirements array is sparse
  const matchedKeywordsBadges = matchedRequirements.length > 0 
    ? matchedRequirements.map(r => r.requirement)
    : strongMatches;

  // Helper to construct InspectedKeyword detail for modal
  const handleInspectKeyword = (keywordName: string) => {
    const kwLower = keywordName.toLowerCase().trim();

    // Check in requirements array first
    const reqMatch = requirements.find(r => r.requirement.toLowerCase().trim() === kwLower || kwLower.includes(r.requirement.toLowerCase().trim()));
    
    // Check in keyword opportunities
    const oppMatch = keywordOpportunities.find(k => k.keyword.toLowerCase().trim() === kwLower || kwLower.includes(k.keyword.toLowerCase().trim()));

    // Check in job analysis required/preferred skills
    let jobContext = 'Mentioned as a target requirement in the job description.';
    if (jobAnalysis) {
      if (jobAnalysis.jobTitle) {
        jobContext = `Required qualification for the ${jobAnalysis.jobTitle} position at ${jobAnalysis.company || 'target company'}.`;
      }
    }

    let status: 'MATCHED' | 'PARTIALLY_MATCHED' | 'NOT_FOUND' = 'NOT_FOUND';
    if (reqMatch) {
      status = reqMatch.status;
    } else if (oppMatch) {
      status = oppMatch.evidenceFound ? 'MATCHED' : 'NOT_FOUND';
    } else if (strongMatches.some(s => s.toLowerCase().includes(kwLower))) {
      status = 'MATCHED';
    } else if (partialMatches.some(p => p.toLowerCase().includes(kwLower))) {
      status = 'PARTIALLY_MATCHED';
    }

    let resumeAppears: boolean | 'PARTIAL' = false;
    if (status === 'MATCHED') resumeAppears = true;
    else if (status === 'PARTIALLY_MATCHED') resumeAppears = 'PARTIAL';

    // Evidence
    let resumeEvidence = 'No supporting evidence found in candidate\'s uploaded resume.';
    if (reqMatch) {
      if (reqMatch.supportingEvidence) resumeEvidence = reqMatch.supportingEvidence;
      else if (reqMatch.candidateEvidence && reqMatch.candidateEvidence.length > 0) {
        resumeEvidence = Array.isArray(reqMatch.candidateEvidence) ? reqMatch.candidateEvidence.join('; ') : String(reqMatch.candidateEvidence);
      }
    } else if (oppMatch && oppMatch.evidenceSnippet) {
      resumeEvidence = oppMatch.evidenceSnippet;
    } else if (resumeAnalysis?.skills) {
      const skillEv = resumeAnalysis.skills.find(s => s.name.toLowerCase().includes(kwLower));
      if (skillEv?.evidenceFromResume) {
        resumeEvidence = skillEv.evidenceFromResume;
      }
    }

    // Explanation
    let explanation = reqMatch?.explanation || reqMatch?.overlapExplanation || oppMatch?.reasonItMatters || 'Evaluated during ATS keyword and experience scanning.';

    // Recommended Action
    let recommendedAction = '';
    if (status === 'MATCHED') {
      recommendedAction = `Keep this key strength prominent in your summary and experience bullet points using high-impact action verbs.`;
    } else if (status === 'PARTIALLY_MATCHED') {
      recommendedAction = `Clarify and expand your existing experience with ${keywordName} in your experience bullet points to demonstrate full depth.`;
    } else {
      recommendedAction = `Do not add this skill unless you have genuine experience with it. If you have real hands-on experience, add concise evidence in your work experience or projects.`;
    }

    if (oppMatch?.recommendation) {
      recommendedAction = oppMatch.recommendation;
    }

    const importance = reqMatch?.importance || oppMatch?.importance || (status === 'NOT_FOUND' ? 'REQUIRED' : 'HIGH');
    const category = reqMatch?.category || 'Skill / Requirement';

    setInspectedKeyword({
      keyword: keywordName,
      status,
      importance,
      category,
      jobContext,
      resumeAppears,
      resumeEvidence,
      explanation,
      recommendedAction
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* HEADER & ACTION BUTTONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Target className="w-7 h-7 text-blue-600" />
            ATS Job Match Analysis Dashboard
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Comprehensive ATS qualification scoring, evidence verification, and keyword alignment audit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage('resume-editor')}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <FileEdit className="w-4 h-4" />
            Edit Optimized Resume
          </button>

          <button
            onClick={() => setCurrentPage('resume-preview')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Eye className="w-4 h-4" />
            Preview & Download PDF
          </button>
        </div>
      </div>

      {/* TOP SECTION: ATS-ORIENTED MATCH SCORE CARD */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-8 pb-8 border-b border-slate-800/80">
          
          <div className="flex items-center gap-6">
            <div className={`w-32 h-32 rounded-2xl flex flex-col items-center justify-center font-extrabold border-2 shadow-inner shrink-0 ${
              overallMatchScore >= 80 ? 'bg-emerald-950/90 border-emerald-500 text-emerald-400' :
              overallMatchScore >= 60 ? 'bg-amber-950/90 border-amber-500 text-amber-400' : 'bg-rose-950/90 border-rose-500 text-rose-400'
            }`}>
              <span className="text-xs uppercase tracking-widest font-mono text-slate-400 mb-0.5">ATS-ORIENTED MATCH</span>
              <span className="text-5xl tracking-tight font-black">{overallMatchScore}%</span>
              <span className="text-[10px] text-slate-300 font-medium mt-1">Score</span>
            </div>

            <div>
              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-2">
                Job Match Optimization Score
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                {overallMatchScore >= 85 ? 'Excellent Alignment with Target Qualifications' :
                 overallMatchScore >= 70 ? 'Strong Base Match with Optimization Opportunities' : 'Moderate Match — Address Key Qualification Gaps'}
              </h2>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Calculated across 5 ATS matching dimensions comparing explicit evidence in candidate resume against target job description requirements.
              </p>

              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 text-slate-300 text-xs font-mono border border-slate-700/80">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Optimization score — not a guaranteed ATS result.</span>
              </div>
            </div>
          </div>

        </div>

        {/* 5 SUB-DIMENSION PROGRESS INDICATORS */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            Match Dimension Breakdown
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Skills Match */}
            <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/60">
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-slate-300">Skills Match</span>
                <span className="text-blue-400 font-bold">{skillsMatchScore}%</span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${skillsMatchScore}%` }} 
                />
              </div>
            </div>

            {/* Keyword Match */}
            <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/60">
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-slate-300">Keyword Match</span>
                <span className="text-amber-400 font-bold">{keywordMatchScore}%</span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${keywordMatchScore}%` }} 
                />
              </div>
            </div>

            {/* Experience Match */}
            <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/60">
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-slate-300">Experience Match</span>
                <span className="text-emerald-400 font-bold">{experienceMatchScore}%</span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${experienceMatchScore}%` }} 
                />
              </div>
            </div>

            {/* Responsibilities Match */}
            <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/60">
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-slate-300">Responsibilities Match</span>
                <span className="text-indigo-400 font-bold">{responsibilityMatchScore}%</span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${responsibilityMatchScore}%` }} 
                />
              </div>
            </div>

            {/* Education Match */}
            <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/60 col-span-1 sm:col-span-2 lg:col-span-1">
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-slate-300">Education Match</span>
                <span className="text-purple-400 font-bold">{educationMatchScore}%</span>
              </div>
              <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-purple-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${educationMatchScore}%` }} 
                />
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* TRUTH CHECK / FACT CHECK SECTION */}
      <FactCheckSection
        validationReport={validationReport || null}
        optimizedResume={optimizedResume || null}
      />

      {/* MATCHED KEYWORDS SECTION */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              MATCHED KEYWORDS
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified qualifications present in candidate's resume. Click any badge to view "Why does this matter?".
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            {matchedKeywordsBadges.length} Matched
          </span>
        </div>

        {matchedKeywordsBadges.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {matchedKeywordsBadges.map((keyword, i) => (
              <button
                key={i}
                onClick={() => handleInspectKeyword(keyword)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all group"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{keyword}</span>
                <ArrowUpRight className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No fully matched keywords detected.</p>
        )}
      </div>

      {/* PARTIAL MATCHES SECTION */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              PARTIAL MATCHES
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Candidate possesses related skills or experience, but exact keyword or depth nuance differs.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
            {partialRequirements.length || partialMatches.length} Partial
          </span>
        </div>

        {partialRequirements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {partialRequirements.map((req, i) => (
              <div 
                key={i} 
                className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2 relative group hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-slate-900">{req.requirement}</span>
                  <button
                    onClick={() => handleInspectKeyword(req.requirement)}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
                  >
                    Why does this matter?
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs bg-white p-3 rounded-lg border border-amber-100 space-y-1.5 text-slate-700">
                  <div>
                    <strong className="text-amber-900 font-semibold">Candidate Evidence: </strong>
                    <span className="italic">
                      "{req.supportingEvidence || (Array.isArray(req.candidateEvidence) ? req.candidateEvidence[0] : req.candidateEvidence) || 'Related experience detected'}"
                    </span>
                  </div>
                  <div>
                    <strong className="text-amber-900 font-semibold">Explanation: </strong>
                    <span>{req.overlapExplanation || req.explanation || 'Overlapping candidate experience identified.'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : partialMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {partialMatches.map((pm, i) => (
              <div key={i} className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-slate-900">{pm}</span>
                  <button
                    onClick={() => handleInspectKeyword(pm)}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
                  >
                    Why does this matter?
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xs bg-white p-3 rounded-lg border border-amber-100 text-slate-700">
                  <strong className="text-amber-900 font-semibold">Explanation: </strong>
                  Partial experience overlap identified in candidate profile.
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No partial requirement matches detected.</p>
        )}
      </div>

      {/* MISSING REQUIREMENTS SECTION */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              MISSING REQUIREMENTS
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Key position qualifications with no evidence found in candidate's original resume.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold shrink-0">
            {missingRequirementsList.length || missingRequirements.length} Missing
          </span>
        </div>

        {/* PROMINENT MANDATORY WARNING NOTICE */}
        <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900 leading-relaxed font-semibold">
            Warning: Do not add this skill unless you have genuine experience with it.
            <p className="font-normal text-rose-800 mt-0.5">
              Adding unbacked skills triggers ATS fraud detection and risks disqualification during interviews.
            </p>
          </div>
        </div>

        {missingRequirementsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missingRequirementsList.map((req, i) => (
              <div key={i} className="p-4 rounded-xl bg-rose-50/40 border border-rose-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{req.requirement}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200">
                      {req.importance || 'REQUIRED'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleInspectKeyword(req.requirement)}
                    className="text-xs font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    Why does this matter?
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs bg-white p-3 rounded-lg border border-rose-100 space-y-1.5 text-slate-700">
                  <div>
                    <strong className="text-rose-900 font-semibold">Explanation: </strong>
                    <span>{req.explanation || req.notFoundStatement || 'No evidence found in uploaded resume.'}</span>
                  </div>
                  <div>
                    <strong className="text-blue-900 font-semibold">Recommendation: </strong>
                    <span>Only add if you possess verifiable experience; otherwise focus on your core strengths.</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : missingRequirements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missingRequirements.map((mr, i) => (
              <div key={i} className="p-4 rounded-xl bg-rose-50/40 border border-rose-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-slate-900">{mr}</span>
                  <button
                    onClick={() => handleInspectKeyword(mr)}
                    className="text-xs font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer"
                  >
                    Why does this matter?
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xs bg-white p-3 rounded-lg border border-rose-100 text-slate-700">
                  <strong className="text-rose-900 font-semibold">Explanation: </strong>
                  Requirement not identified in uploaded candidate document.
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No missing requirements detected.</p>
        )}
      </div>

      {/* ACTIONABLE RECOMMENDATIONS LIST */}
      {recommendations.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Strategic Recommendations
          </h2>
          <ul className="space-y-2 text-xs text-slate-700">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* "WHY DOES THIS MATTER?" MODAL DIALOG */}
      {inspectedKeyword && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Keyword Impact Analysis
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  "Why does this matter?"
                </h3>
              </div>

              <button
                onClick={() => setInspectedKeyword(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Keyword Title & Status Badge */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-500 font-mono block">Keyword / Requirement:</span>
                <span className="text-lg font-bold text-slate-900">{inspectedKeyword.keyword}</span>
              </div>

              <div>
                {inspectedKeyword.status === 'MATCHED' && (
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    MATCHED
                  </span>
                )}
                {inspectedKeyword.status === 'PARTIALLY_MATCHED' && (
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold inline-flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    PARTIAL
                  </span>
                )}
                {inspectedKeyword.status === 'NOT_FOUND' && (
                  <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-extrabold inline-flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    MISSING
                  </span>
                )}
              </div>
            </div>

            {/* 4 REQUIRING FIELDS IN MODAL */}
            <div className="space-y-4 text-xs">
              
              {/* 1. Where it appears in the job description */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  Where it appears in the job description:
                </div>
                <p className="text-slate-700 leading-relaxed pl-3.5">
                  {inspectedKeyword.jobContext}
                </p>
              </div>

              {/* 2. Whether it appears in the candidate resume */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  Whether it appears in the candidate resume:
                </div>
                <div className="pl-3.5 pt-0.5">
                  {inspectedKeyword.resumeAppears === true && (
                    <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold">
                      Yes — Explicitly verified in candidate resume.
                    </span>
                  )}
                  {inspectedKeyword.resumeAppears === 'PARTIAL' && (
                    <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 font-bold">
                      Partial — Related experience present, but exact phrasing differs.
                    </span>
                  )}
                  {inspectedKeyword.resumeAppears === false && (
                    <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 font-bold">
                      No — Not found in uploaded candidate resume.
                    </span>
                  )}
                </div>
              </div>

              {/* 3. Evidence from the resume */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Evidence from the candidate resume:
                </div>
                <p className="text-slate-700 italic font-mono pl-3.5 leading-relaxed bg-white p-2 rounded border border-slate-200">
                  "{inspectedKeyword.resumeEvidence}"
                </p>
              </div>

              {/* 4. Recommended action */}
              <div className={`p-3.5 rounded-xl border ${
                inspectedKeyword.status === 'NOT_FOUND' ? 'bg-rose-50 border-rose-200' : 'bg-blue-50 border-blue-200'
              } space-y-1`}>
                <div className={`font-bold flex items-center gap-1.5 ${
                  inspectedKeyword.status === 'NOT_FOUND' ? 'text-rose-900' : 'text-blue-900'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    inspectedKeyword.status === 'NOT_FOUND' ? 'bg-rose-600' : 'bg-blue-600'
                  }`} />
                  Recommended Action:
                </div>
                <p className={`pl-3.5 leading-relaxed font-medium ${
                  inspectedKeyword.status === 'NOT_FOUND' ? 'text-rose-900 font-semibold' : 'text-blue-900'
                }`}>
                  {inspectedKeyword.recommendedAction}
                </p>
              </div>

            </div>

            {/* Footer Close Button */}
            <div className="pt-2 text-right">
              <button
                onClick={() => setInspectedKeyword(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                Close Analysis
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
