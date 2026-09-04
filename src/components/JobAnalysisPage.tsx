import React from 'react';
import { JobAnalysis, PageType } from '../types';
import { 
  SearchCode, 
  Briefcase, 
  Building2, 
  Award, 
  GraduationCap, 
  Wrench, 
  Code2, 
  CheckCircle, 
  AlertCircle, 
  Layers, 
  BookOpen, 
  Clock, 
  ArrowRight 
} from 'lucide-react';

interface JobAnalysisPageProps {
  jobAnalysis: JobAnalysis | null;
  setCurrentPage: (page: PageType) => void;
}

export const JobAnalysisPage: React.FC<JobAnalysisPageProps> = ({
  jobAnalysis,
  setCurrentPage
}) => {
  if (!jobAnalysis) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600 mb-4">No job description analysis available yet.</p>
        <button
          onClick={() => setCurrentPage('create')}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm"
        >
          Create New Optimization
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/60 text-blue-300 text-xs font-semibold mb-3 border border-blue-700/50">
            <SearchCode className="w-3.5 h-3.5" />
            AI Extracted Job Blueprint
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {jobAnalysis.jobTitle || 'Target Job Role'}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300 mt-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Building2 className="w-4 h-4 text-blue-400" />
              {jobAnalysis.company || 'Target Employer'}
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-amber-400" />
              Seniority: <strong className="text-white">{jobAnalysis.seniority || 'N/A'}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              Experience: <strong className="text-white">{jobAnalysis.yearsOfExperience || 'N/A'}</strong>
            </span>
          </div>
        </div>

        <button
          onClick={() => setCurrentPage('match-report')}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center gap-2 self-start md:self-auto shadow-md transition-all cursor-pointer"
        >
          View Match Report
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Grid Layout of Extracted Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Required Skills & Technologies */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-600" />
            Technologies & Hard Skills
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Required Skills & Tech ({jobAnalysis.requiredSkills?.length || 0})
              </h3>
              <div className="flex flex-wrap gap-2">
                {jobAnalysis.requiredSkills?.map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium">
                    {typeof skill === 'string' ? skill : (skill as any)?.name || ''}
                  </span>
                ))}
              </div>
            </div>

            {jobAnalysis.technologies?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Core Technologies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {jobAnalysis.technologies.map((tech, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-mono">
                      {typeof tech === 'string' ? tech : (tech as any)?.name || ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {jobAnalysis.preferredSkills?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Preferred / Nice-to-Have Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {jobAnalysis.preferredSkills.map((skill, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                      {typeof skill === 'string' ? skill : (skill as any)?.name || ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tools & Domain Knowledge */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-600" />
            Tools & Domain Context
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Tools & Platforms ({jobAnalysis.tools?.length || 0})
              </h3>
              <div className="flex flex-wrap gap-2">
                {jobAnalysis.tools?.map((tool, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-medium">
                    {typeof tool === 'string' ? tool : (tool as any)?.name || ''}
                  </span>
                ))}
              </div>
            </div>

            {jobAnalysis.domainKnowledge?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Domain Knowledge
                </h3>
                <div className="flex flex-wrap gap-2">
                  {jobAnalysis.domainKnowledge.map((domain, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 text-xs font-medium">
                      {domain}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {jobAnalysis.softSkills?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Soft Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {jobAnalysis.softSkills.map((soft, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
                      {soft}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Core Responsibilities */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm md:col-span-2">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            Key Responsibilities
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-700">
            {jobAnalysis.responsibilities?.map((resp, i) => (
              <li key={i} className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{resp}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Education, Certifications & Acronyms */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            Education & Certifications
          </h2>

          <div className="space-y-3 text-sm text-slate-700">
            <div>
              <span className="font-bold text-slate-900">Education: </span>
              {jobAnalysis.educationRequirements?.join(', ') || 'Not explicitly specified'}
            </div>
            <div>
              <span className="font-bold text-slate-900">Certifications: </span>
              {jobAnalysis.certificationRequirements?.join(', ') || 'None required'}
            </div>
          </div>
        </div>

        {/* Acronym Equivalents */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600" />
            Acronyms & Equivalents Recognized
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {jobAnalysis.acronyms?.map((ac, i) => (
              <div key={i} className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="font-bold text-blue-700">{ac.term}</span>
                <span className="text-slate-600 truncate max-w-[120px]" title={ac.expansion}>= {ac.expansion}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
