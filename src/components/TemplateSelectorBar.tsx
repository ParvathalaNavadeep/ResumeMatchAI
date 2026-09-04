import React from 'react';
import { ResumeTemplateId } from '../types';
import { RESUME_TEMPLATES } from '../lib/templates';
import { Check, Sparkles, LayoutTemplate, Terminal, ShieldCheck } from 'lucide-react';

interface TemplateSelectorBarProps {
  selectedTemplateId: ResumeTemplateId;
  onSelectTemplate: (templateId: ResumeTemplateId) => void;
  compact?: boolean;
}

export const TemplateSelectorBar: React.FC<TemplateSelectorBarProps> = ({
  selectedTemplateId,
  onSelectTemplate,
  compact = false
}) => {
  const currentTemplate = selectedTemplateId || 'ats-classic';

  const getIcon = (id: ResumeTemplateId) => {
    switch (id) {
      case 'ats-classic':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'modern-professional':
        return <Sparkles className="w-4 h-4 text-blue-600" />;
      case 'technical':
        return <Terminal className="w-4 h-4 text-purple-600" />;
      default:
        return <LayoutTemplate className="w-4 h-4 text-slate-600" />;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <label className="text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1.5">
          <LayoutTemplate className="w-3.5 h-3.5 text-blue-600" />
          Template:
        </label>
        <select
          value={currentTemplate}
          onChange={(e) => onSelectTemplate(e.target.value as ResumeTemplateId)}
          className="bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
        >
          {RESUME_TEMPLATES.map((tmpl) => (
            <option key={tmpl.id} value={tmpl.id}>
              {tmpl.name} ({tmpl.badge})
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">Select Resume Template</h2>
        </div>
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
          All 100% Single-Column ATS Compliant
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {RESUME_TEMPLATES.map((tmpl) => {
          const isSelected = tmpl.id === currentTemplate;
          return (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => onSelectTemplate(tmpl.id)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    {getIcon(tmpl.id)}
                    {tmpl.name}
                  </span>
                  {isSelected ? (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {tmpl.badge}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                  {tmpl.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-mono">
                <strong>Best For:</strong> {tmpl.targetRoles}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
