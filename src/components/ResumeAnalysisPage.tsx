import React from 'react';
import { ResumeAnalysis, PageType } from '../types';
import { 
  UserCheck, 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Globe, 
  Briefcase, 
  GraduationCap, 
  Award, 
  FolderGit2, 
  FileText, 
  Quote, 
  ArrowRight 
} from 'lucide-react';

interface ResumeAnalysisPageProps {
  resumeAnalysis: ResumeAnalysis | null;
  setCurrentPage: (page: PageType) => void;
}

export const ResumeAnalysisPage: React.FC<ResumeAnalysisPageProps> = ({
  resumeAnalysis,
  setCurrentPage
}) => {
  if (!resumeAnalysis) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600 mb-4">No resume analysis available yet.</p>
        <button
          onClick={() => setCurrentPage('create')}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm"
        >
          Create New Optimization
        </button>
      </div>
    );
  }

  const { contactInfo, summary, skills, workExperience, projects, education, certifications } = resumeAnalysis;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/60 text-blue-300 text-xs font-semibold mb-3 border border-blue-700/50">
            <UserCheck className="w-3.5 h-3.5" />
            Extracted Candidate Master Profile
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {contactInfo?.name || 'Candidate Name'}
          </h1>

          {/* Contact Details Bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-3">
            {contactInfo?.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                {contactInfo.email}
              </span>
            )}
            {contactInfo?.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                {contactInfo.phone}
              </span>
            )}
            {contactInfo?.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                {contactInfo.location}
              </span>
            )}
            {contactInfo?.linkedIn && (
              <span className="flex items-center gap-1">
                <Linkedin className="w-3.5 h-3.5 text-sky-400" />
                {contactInfo.linkedIn}
              </span>
            )}
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

      {/* Summary */}
      {summary && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Master Professional Summary
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
            {summary}
          </p>
        </div>
      )}

      {/* Extracted Skills with Resume Evidence */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Quote className="w-5 h-5 text-amber-600" />
            Extracted Skills & Verified Evidence
          </span>
          <span className="text-xs font-semibold text-slate-500">
            {skills?.length || 0} Verified Skills
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills?.map((skillItem, i) => (
            <div key={i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-bold text-sm text-slate-900">{skillItem.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
                  {skillItem.category || 'Skill'}
                </span>
              </div>
              <p className="text-xs text-slate-600 italic bg-white p-2 rounded border border-slate-100 mt-1 flex items-start gap-1.5">
                <Quote className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                <span>{skillItem.evidenceFromResume || 'Found in master resume text'}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Work Experience */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-emerald-600" />
          Work Experience ({workExperience?.length || 0})
        </h2>

        <div className="space-y-6">
          {workExperience?.map((exp, i) => (
            <div key={i} className="border-b border-slate-100 pb-6 last:border-b-0 last:pb-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <h3 className="font-bold text-slate-900 text-base">
                  {exp.jobTitle} <span className="text-slate-500 font-normal">at</span> <span className="text-blue-700">{exp.company}</span>
                </h3>
                <span className="text-xs font-semibold text-slate-500 font-mono">
                  {[exp.startDate, exp.endDate].filter(Boolean).join(' - ')}
                </span>
              </div>
              
              <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-700 mt-2">
                {exp.bullets?.map((bullet, bIdx) => (
                  <li key={bIdx} className="leading-relaxed">
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Projects, Education, Certifications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Projects */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-indigo-600" />
            Projects
          </h2>
          <div className="space-y-3">
            {projects?.map((proj, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <h3 className="font-bold text-xs text-slate-900">{proj.title}</h3>
                <p className="text-xs text-slate-600 mt-1">{proj.description}</p>
                {proj.technologiesUsed?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {proj.technologiesUsed.map((t, tI) => (
                      <span key={tI} className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-mono">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            Education
          </h2>
          <div className="space-y-3">
            {education?.map((edu, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <h3 className="font-bold text-xs text-slate-900">{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</h3>
                <p className="text-xs text-slate-600">{edu.institution}</p>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">{edu.graduationYear}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            Certifications
          </h2>
          <div className="space-y-3">
            {certifications?.map((cert, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <h3 className="font-bold text-xs text-slate-900">{cert.name}</h3>
                <p className="text-xs text-slate-600">{cert.issuer} {cert.year ? `(${cert.year})` : ''}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
