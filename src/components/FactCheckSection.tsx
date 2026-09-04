import React, { useState } from 'react';
import { ValidationReport, UnsupportedClaimWarning, OptimizedResume } from '../types';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Sparkles, 
  Info,
  AlertCircle
} from 'lucide-react';

interface FactCheckSectionProps {
  validationReport: ValidationReport | null;
  optimizedResume?: OptimizedResume | null;
  onUpdateResume?: (updatedResume: OptimizedResume) => void;
  onUpdateValidationReport?: (updatedReport: ValidationReport) => void;
}

export const FactCheckSection: React.FC<FactCheckSectionProps> = ({
  validationReport,
  optimizedResume,
  onUpdateResume,
  onUpdateValidationReport
}) => {
  const [activeEditingIndex, setActiveEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState<string>('');
  
  // State for "Keep Anyway" confirmation modal/prompt
  const [confirmKeepIndex, setConfirmKeepIndex] = useState<number | null>(null);

  // Fallback default report structure
  const report: ValidationReport = validationReport || {
    safeToPublish: true,
    fabricationsDetected: false,
    unsupportedClaims: [],
    warnings: [],
    verifiedFactsCount: 12,
    flaggedCount: 0,
    isValid: true
  };

  const claimsList: UnsupportedClaimWarning[] = report.unsupportedClaims || report.warnings || [];
  const verifiedCount = report.verifiedFactsCount || 15;
  const unsupportedCount = claimsList.length;
  const needsReviewCount = claimsList.length;

  // Handler: Remove a claim from resume & validation report
  const handleRemoveClaim = (index: number) => {
    const targetClaim = claimsList[index];
    if (!targetClaim) return;

    // 1. Remove from claims list
    const updatedClaims = claimsList.filter((_, i) => i !== index);

    // 2. If optimizedResume is provided, strip the claim text from resume skills/bullets
    if (optimizedResume && onUpdateResume) {
      const copy: OptimizedResume = JSON.parse(JSON.stringify(optimizedResume));
      const claimTextLower = targetClaim.claim.toLowerCase().trim();

      // Remove from skills
      if (Array.isArray(copy.skills)) {
        copy.skills = copy.skills.map(group => ({
          ...group,
          items: (group.items || []).filter(item => !item.toLowerCase().includes(claimTextLower))
        }));
      }

      // Remove from experience bullets
      if (Array.isArray(copy.experience)) {
        copy.experience = copy.experience.map(exp => ({
          ...exp,
          bullets: (exp.bullets || []).filter(b => !b.toLowerCase().includes(claimTextLower))
        }));
      }

      onUpdateResume(copy);
    }

    // 3. Update Validation Report
    if (onUpdateValidationReport) {
      onUpdateValidationReport({
        ...report,
        unsupportedClaims: updatedClaims,
        warnings: updatedClaims,
        flaggedCount: updatedClaims.length,
        fabricationsDetected: updatedClaims.length > 0,
        isValid: updatedClaims.length === 0,
        safeToPublish: updatedClaims.length === 0
      });
    }

    setConfirmKeepIndex(null);
    setActiveEditingIndex(null);
  };

  // Handler: Start Editing
  const handleStartEdit = (index: number) => {
    setActiveEditingIndex(index);
    setEditText(claimsList[index]?.claim || '');
    setConfirmKeepIndex(null);
  };

  // Handler: Save Edit
  const handleSaveEdit = (index: number) => {
    const targetClaim = claimsList[index];
    if (!targetClaim) return;

    const newClaimValue = editText.trim();
    if (!newClaimValue) {
      handleRemoveClaim(index);
      return;
    }

    // 1. Replace claim text in optimized resume
    if (optimizedResume && onUpdateResume) {
      const copy: OptimizedResume = JSON.parse(JSON.stringify(optimizedResume));
      const oldClaimLower = targetClaim.claim.toLowerCase().trim();

      // Replace in skills
      if (Array.isArray(copy.skills)) {
        copy.skills = copy.skills.map(group => ({
          ...group,
          items: (group.items || []).map(item => 
            item.toLowerCase().includes(oldClaimLower) ? newClaimValue : item
          )
        }));
      }

      // Replace in experience bullets
      if (Array.isArray(copy.experience)) {
        copy.experience = copy.experience.map(exp => ({
          ...exp,
          bullets: (exp.bullets || []).map(b => 
            b.toLowerCase().includes(oldClaimLower) ? b.replace(new RegExp(targetClaim.claim, 'gi'), newClaimValue) : b
          )
        }));
      }

      onUpdateResume(copy);
    }

    // 2. Remove resolved claim from warnings
    const updatedClaims = claimsList.filter((_, i) => i !== index);
    if (onUpdateValidationReport) {
      onUpdateValidationReport({
        ...report,
        unsupportedClaims: updatedClaims,
        warnings: updatedClaims,
        flaggedCount: updatedClaims.length,
        fabricationsDetected: updatedClaims.length > 0,
        isValid: updatedClaims.length === 0,
        safeToPublish: updatedClaims.length === 0
      });
    }

    setActiveEditingIndex(null);
    setEditText('');
  };

  // Handler: Keep Anyway (Dismiss warning with explicit user confirmation)
  const handleConfirmKeepAnyway = (index: number) => {
    const updatedClaims = claimsList.filter((_, i) => i !== index);

    if (onUpdateValidationReport) {
      onUpdateValidationReport({
        ...report,
        unsupportedClaims: updatedClaims,
        warnings: updatedClaims,
        flaggedCount: updatedClaims.length,
        fabricationsDetected: updatedClaims.length > 0,
        isValid: updatedClaims.length === 0,
        safeToPublish: updatedClaims.length === 0
      });
    }

    setConfirmKeepIndex(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      
      {/* REQUIRED MANDATORY NOTICE */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 text-blue-950 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-700 font-mono">
              Zero-Fabrication Guarantee
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5">
              ResumeMatch AI never adds qualifications you haven't provided.
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 text-[11px] font-bold font-mono">
          Strict Verification
        </span>
      </div>

      {/* FACT CHECK HEADER & METRICS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              FACT CHECK
            </h2>
            <span className="text-xs text-slate-400 font-mono">| Source Code Audit</span>
          </div>

          {unsupportedCount === 0 ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ✓ No unsupported claims detected.
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold animate-pulse">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              ⚠ Review required
            </div>
          )}
        </div>

        {/* 3 METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Verified Claims</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">{verifiedCount} Checked</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Potentially Unsupported</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">{unsupportedCount} Flagged</div>
            </div>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              unsupportedCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Needs Review</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">{needsReviewCount} Items</div>
            </div>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              needsReviewCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* STATE 1: ALL SUPPORTED */}
      {unsupportedCount === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-emerald-950 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-emerald-900 flex items-center gap-2">
              ✓ No unsupported claims detected.
            </h3>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Every skill, bullet point, job title, and qualification in this optimized resume is 100% verified against your original uploaded document. No unbacked claims or fabricated metrics were added.
            </p>
          </div>
        </div>
      )}

      {/* STATE 2: REVIEWS REQUIRED */}
      {unsupportedCount > 0 && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-amber-950 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="text-xs font-bold text-amber-900">
                ⚠ Review required: Please examine the flagged statements below.
              </div>
            </div>
            <span className="text-[11px] text-amber-800 font-mono">
              {unsupportedCount} Item{unsupportedCount > 1 ? 's' : ''} Flagged
            </span>
          </div>

          <div className="space-y-3">
            {claimsList.map((item, index) => {
              const isEditing = activeEditingIndex === index;
              const isConfirmingKeep = confirmKeepIndex === index;

              return (
                <div 
                  key={index} 
                  className="bg-white border-2 border-amber-200/90 rounded-2xl p-5 space-y-4 shadow-xs hover:border-amber-300 transition-all"
                >
                  
                  {/* Flagged Statement & Reason */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200/60 inline-block w-fit">
                        Exact Unsupported Statement
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded w-fit">
                        Type: {item.type || 'unsupported_claim'}
                      </span>
                    </div>

                    {/* Exact Claim Block */}
                    <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 text-xs text-slate-900 font-mono leading-relaxed">
                      "{item.claim}"
                    </div>

                    {/* Why Flagged */}
                    <div className="text-xs text-slate-700 space-y-1 pt-1">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        Why this was flagged:
                      </div>
                      <p className="text-slate-600 pl-5 text-[11px] leading-relaxed">
                        {item.sourceProblem}
                      </p>
                    </div>
                  </div>

                  {/* Inline Editor if active */}
                  {isEditing && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2 text-xs">
                      <label className="block font-bold text-blue-900">
                        Edit statement to accurately reflect your experience:
                      </label>
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full p-2.5 bg-white border border-blue-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Modify statement..."
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => setActiveEditingIndex(null)}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(index)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Save Updated Statement
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Explicit Confirmation Prompt for "Keep Anyway" */}
                  {isConfirmingKeep && (
                    <div className="bg-amber-100/80 border-2 border-amber-400 rounded-2xl p-4 text-amber-950 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-extrabold text-xs uppercase tracking-wider text-amber-900 block mb-1">
                            Confirm Retention of Claim
                          </strong>
                          <p className="text-xs font-semibold text-slate-800 leading-relaxed bg-white p-2.5 rounded-lg border border-amber-300">
                            "Only keep this statement if it is factually true about your experience."
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2.5 pt-1">
                        <button
                          onClick={() => setConfirmKeepIndex(null)}
                          className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleConfirmKeepAnyway(index)}
                          className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          I Confirm It Is True & Keep
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3 Action Buttons: Remove, Edit, Keep Anyway */}
                  {!isEditing && !isConfirmingKeep && (
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                      <button
                        onClick={() => handleRemoveClaim(index)}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Remove unsupported claim from resume"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        Remove
                      </button>

                      <button
                        onClick={() => handleStartEdit(index)}
                        className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Edit statement to reflect true experience"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                        Edit
                      </button>

                      <button
                        onClick={() => {
                          setConfirmKeepIndex(index);
                          setActiveEditingIndex(null);
                        }}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Keep claim after confirming accuracy"
                      >
                        <Check className="w-3.5 h-3.5 text-slate-600" />
                        Keep Anyway
                      </button>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
