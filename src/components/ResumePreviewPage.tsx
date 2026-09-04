import React, { useState } from 'react';
import { OptimizedResume, PageType, ResumeTemplateId } from '../types';
import { Download, Printer, Copy, FileEdit, Check, Eye } from 'lucide-react';
import { generateAtsPdf } from '../lib/pdfGenerator';
import { TemplateSelectorBar } from './TemplateSelectorBar';

interface ResumePreviewPageProps {
  optimizedResume: OptimizedResume | null;
  setCurrentPage: (page: PageType) => void;
}


export const cleanString = (val: any): any => {
  if (typeof val === 'string') {
    const lower = val.trim().toLowerCase();
    if (['null', 'undefined', 'nan', 'n/a', 'none', '[object object]'].includes(lower)) return undefined;
    if (val.trim() === '') return undefined;
    return val;
  }
  return val;
};

export const cleanResumeData = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(cleanResumeData).filter(item => item !== undefined && item !== null);
  } else if (obj !== null && typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      const val = cleanResumeData(obj[key]);
      if (val !== undefined && val !== null) {
        cleaned[key] = val;
      }
    }
    return cleaned;
  }
  return cleanString(obj);
};

export const formatEducationDetails = (edu: any) => {
  let title = edu.degree || edu.level || '';
  const spec = edu.specialization || edu.fieldOfStudy || '';
  
  if (spec && title.toLowerCase().indexOf(spec.toLowerCase()) === -1) {
    if (title.toLowerCase().endsWith('in')) {
      title += ' ' + spec;
    } else if (title) {
      title += ' — ' + spec;
    } else {
      title = spec;
    }
  }

  // Handle duplicated 'in MPC in MPC'
  title = title.replace(/\s+in\s+(.+?)\s+in\s+\1/i, ' — $1');
  title = title.replace(/(.+?)\s+in\s+\1/i, '$1');

  // Handle duplicated 'in MPC in MPC'
  title = title.replace(/\s+in\s+(.+?)\s+in\s+\1/i, ' — $1');
  title = title.replace(/(.+?)\s+in\s+\1/i, '$1');

  // Handle 'in null' or 'null'
  title = title.replace(/\s*in\s*null/gi, '').replace(/null/gi, '').trim();
  // Handle duplicate strings like "MPC - MPC" or "MPC — MPC"
  const titleParts = title.split('—').map(s => s.trim());
  if (titleParts.length === 2 && titleParts[0].toLowerCase() === titleParts[1].toLowerCase()) {
    title = titleParts[0];
  }

  let inst = [edu.institution, edu.board].filter(Boolean)[0] || '';
  let loc = edu.location || '';
  let subtitleParts = [inst, loc].filter(Boolean);
  let subtitle = subtitleParts.join(', ');

  let dates = [edu.startDate, edu.endDate].filter(Boolean).join(' – ') || edu.graduationYear || '';

  let scores = [];
  if (edu.cgpa && String(edu.cgpa) !== 'null') scores.push(`CGPA: ${edu.cgpa}`);
  if (edu.percentage && String(edu.percentage) !== 'null') scores.push(`Percentage: ${edu.percentage}`);
  if (edu.marksObtained && String(edu.marksObtained) !== 'null') {
    if (edu.totalMarks && String(edu.totalMarks) !== 'null') {
      scores.push(`Marks: ${edu.marksObtained}/${edu.totalMarks}`);
    } else {
      scores.push(`Marks: ${edu.marksObtained}`);
    }
  }
  let scoreLine = scores.join(' | ');

  return { title, subtitle, dates, scoreLine };
};

export const ResumePreviewPage: React.FC<ResumePreviewPageProps> = ({
  optimizedResume: rawResume,
  setCurrentPage
}) => {
  const optimizedResume = cleanResumeData(rawResume);
  const [copied, setCopied] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<ResumeTemplateId>(
    optimizedResume?.templateId || 'ats-classic'
  );

  if (!optimizedResume) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600 mb-4 font-medium">No optimized resume loaded for preview.</p>
        <button
          onClick={() => setCurrentPage('create')}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm cursor-pointer hover:bg-blue-700 transition-colors"
        >
          Create New Optimization
        </button>
      </div>
    );
  }

  const handleCopyText = () => {
    const textParts: string[] = [];
    textParts.push(optimizedResume.contactInfo.name.toUpperCase());
    textParts.push(
      [
        optimizedResume.contactInfo.email,
        optimizedResume.contactInfo.phone,
        optimizedResume.contactInfo.location,
        optimizedResume.contactInfo.linkedIn,
        optimizedResume.contactInfo.portfolio
      ].filter(Boolean).join(' | ')
    );
    textParts.push('\nSUMMARY\n' + optimizedResume.summary);

    if (optimizedResume.skills?.length > 0) {
      textParts.push('\nSKILLS\n' + optimizedResume.skills.map(s => `${s.category}: ${s.items.join(', ')}`).join('\n'));
    }

    if (optimizedResume.experience?.length > 0) {
      textParts.push('\nEXPERIENCE\n' + optimizedResume.experience.map(e => `${e.jobTitle} - ${e.company} (${e.startDate} - ${e.endDate})\n${e.bullets.map(b => '• ' + b).join('\n')}`).join('\n\n'));
    }

    if (optimizedResume.projects?.length > 0) {
      textParts.push('\nPROJECTS\n' + optimizedResume.projects.map(p => `${p.title} (${p.technologiesUsed?.join(', ')})\n${p.description}`).join('\n\n'));
    }

    if (optimizedResume.education?.length > 0) {
      textParts.push('\nEDUCATION\n' + optimizedResume.education.map(ed => `${ed.degree} in ${ed.fieldOfStudy} - ${ed.institution} (${ed.graduationYear})`).join('\n'));
    }

    if (optimizedResume.certifications?.length > 0) {
      textParts.push('\nCERTIFICATIONS\n' + optimizedResume.certifications.map(c => `${c.name} - ${c.issuer} (${c.year})`).join('\n'));
    }

    navigator.clipboard.writeText(textParts.join('\n\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-600" />
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight">ATS Resume Preview</h1>
            <p className="text-xs text-slate-500">Live rendering matching the generated ATS PDF.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage('resume-editor')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileEdit className="w-4 h-4 text-emerald-600" />
            Edit Content
          </button>

          <button
            onClick={handleCopyText}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied Text!' : 'Copy Text'}
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>

          <button
            onClick={() => generateAtsPdf(optimizedResume, selectedTemplateId)}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* TEMPLATE SELECTOR BAR */}
      <div className="print:hidden">
        <TemplateSelectorBar
          selectedTemplateId={selectedTemplateId}
          onSelectTemplate={(tmplId) => setSelectedTemplateId(tmplId)}
        />
      </div>

      {/* ======================================================================= */}
      {/* TEMPLATE 1: ATS CLASSIC (Serif font, Centered Header, Minimal) */}
      {/* ======================================================================= */}
      {selectedTemplateId === 'ats-classic' && (
        <div className="bg-white border border-slate-300 shadow-xl rounded-none sm:rounded-lg p-8 sm:p-12 text-slate-900 font-serif max-w-4xl mx-auto print:shadow-none print:border-none print:p-0">
          
          <div className="text-center pb-4 mb-6 border-b border-slate-400">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold uppercase tracking-wider text-slate-900 mb-2">
              {optimizedResume.contactInfo?.name || 'CANDIDATE NAME'}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-700">
              {optimizedResume.contactInfo?.email && <a href={`mailto:${optimizedResume.contactInfo.email}`} className="hover:underline">{optimizedResume.contactInfo.email}</a>}
              {optimizedResume.contactInfo?.phone && <span>|  {optimizedResume.contactInfo.phone}</span>}
              {optimizedResume.contactInfo?.location && <span>|  {optimizedResume.contactInfo.location}</span>}
              {optimizedResume.contactInfo?.linkedIn && <React.Fragment><span className="text-slate-400 mx-1">|</span><a href={optimizedResume.contactInfo.linkedIn} target="_blank" rel="noreferrer" className="hover:underline">LinkedIn</a></React.Fragment>}
              {optimizedResume.contactInfo?.portfolio && <React.Fragment><span className="text-slate-400 mx-1">|</span><a href={optimizedResume.contactInfo.portfolio} target="_blank" rel="noreferrer" className="hover:underline">Portfolio</a></React.Fragment>}
            </div>
          </div>

          {optimizedResume.summary && (
            <div className="mb-6">
              <h2 className="text-xs font-serif font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-1 mb-2">
                SUMMARY
              </h2>
              <p className="text-xs text-slate-800 leading-relaxed">
                {optimizedResume.summary}
              </p>
            </div>
          )}

          {optimizedResume.skills && optimizedResume.skills.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-serif font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-1 mb-2">
                SKILLS
              </h2>
              <div className="space-y-1 text-xs text-slate-800">
                {optimizedResume.skills.map((skillGroup, idx) => (
                  <div key={idx}>
                    <strong className="text-slate-900">{skillGroup.category}: </strong>
                    <span>{skillGroup.items?.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {optimizedResume.experience && optimizedResume.experience.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-serif font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-1 mb-3">
                EXPERIENCE
              </h2>

              <div className="space-y-4">
                {optimizedResume.experience.map((exp, idx) => (
                  <div key={idx}>
                    <div className="flex items-baseline justify-between text-xs font-serif font-bold text-slate-900">
                      <span>{exp.jobTitle}</span>
                      <span className="font-semibold text-slate-700">{[exp.startDate, exp.endDate].filter(Boolean).join(' – ')}</span>
                    </div>
                    <div className="text-xs italic text-slate-700 mb-1">
                      {[exp.company, exp.location].filter(Boolean).join(' | ')}
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-800 pl-1">
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
          )}

          {optimizedResume.projects && optimizedResume.projects.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-serif font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-1 mb-3">
                PROJECTS
              </h2>

              <div className="space-y-3 text-xs text-slate-800">
                {optimizedResume.projects.map((proj, idx) => (
                  <div key={idx}>
                    <div className="font-serif font-bold text-slate-900">
                      {proj.title} {proj.technologiesUsed?.length > 0 && <span className="font-normal italic text-slate-600">({proj.technologiesUsed.join(', ')})</span>}
                    </div>
                    {proj.description && <p className="mt-0.5 leading-relaxed">{proj.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {optimizedResume.education && optimizedResume.education.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-serif font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-1 mb-2">
                EDUCATION
              </h2>

              <div className="space-y-2 text-xs text-slate-800">
                {optimizedResume.education.map((edu, idx) => {
                  const ed = formatEducationDetails(edu);
                  return (
                  <div key={idx} className="mb-2">
                    <div className="flex items-baseline justify-between">
                      <strong className="text-slate-900">{ed.title}</strong>
                      {ed.dates && <span className="font-semibold text-slate-700">{ed.dates}</span>}
                    </div>
                    {ed.subtitle && <div className="text-slate-700">{ed.subtitle}</div>}
                    {ed.scoreLine && <div className="text-slate-700 font-medium italic mt-0.5">{ed.scoreLine}</div>}
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {optimizedResume.certifications && optimizedResume.certifications.length > 0 && (
            <div>
              <h2 className="text-xs font-serif font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-1 mb-2">
                CERTIFICATIONS
              </h2>

              <div className="space-y-1 text-xs text-slate-800">
                {optimizedResume.certifications.map((cert, idx) => (
                  <div key={idx} className="flex items-baseline justify-between">
                    <span className="font-serif font-bold text-slate-900">{cert.name}</span>
                    <span className="text-slate-700">{[cert.issuer, cert.year].filter(Boolean).join(' - ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ======================================================================= */}
      {/* TEMPLATE 2: MODERN PROFESSIONAL (Left Header, Crisp Navy Hierarchy) */}
      {/* ======================================================================= */}
      {selectedTemplateId === 'modern-professional' && (
        <div className="bg-white border border-slate-300 shadow-xl rounded-none sm:rounded-lg p-8 sm:p-12 text-slate-900 font-sans max-w-4xl mx-auto print:shadow-none print:border-none print:p-0">
          
          <div className="pb-4 mb-6 border-b-2 border-slate-900">
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-slate-900 mb-1.5">
              {optimizedResume.contactInfo?.name || 'CANDIDATE NAME'}
            </h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-medium">
              {optimizedResume.contactInfo?.email && <a href={`mailto:${optimizedResume.contactInfo.email}`} className="hover:underline">{optimizedResume.contactInfo.email}</a>}
              {optimizedResume.contactInfo?.phone && <span>|  {optimizedResume.contactInfo.phone}</span>}
              {optimizedResume.contactInfo?.location && <span>|  {optimizedResume.contactInfo.location}</span>}
              {optimizedResume.contactInfo?.linkedIn && <React.Fragment><span className="text-slate-400 mx-1">|</span><a href={optimizedResume.contactInfo.linkedIn} target="_blank" rel="noreferrer" className="hover:underline">LinkedIn</a></React.Fragment>}
              {optimizedResume.contactInfo?.portfolio && <React.Fragment><span className="text-slate-400 mx-1">|</span><a href={optimizedResume.contactInfo.portfolio} target="_blank" rel="noreferrer" className="hover:underline">Portfolio</a></React.Fragment>}
            </div>
          </div>

          {optimizedResume.summary && (
            <div className="mb-6">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                SUMMARY
              </h2>
              <p className="text-xs text-slate-800 leading-relaxed font-normal">
                {optimizedResume.summary}
              </p>
            </div>
          )}

          {optimizedResume.skills && optimizedResume.skills.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                SKILLS
              </h2>
              <div className="space-y-1.5 text-xs text-slate-800">
                {optimizedResume.skills.map((skillGroup, idx) => (
                  <div key={idx}>
                    <strong className="text-slate-900 font-bold">{skillGroup.category}: </strong>
                    <span className="text-slate-800">{skillGroup.items?.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {optimizedResume.experience && optimizedResume.experience.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
                EXPERIENCE
              </h2>

              <div className="space-y-4">
                {optimizedResume.experience.map((exp, idx) => (
                  <div key={idx}>
                    <div className="flex items-baseline justify-between text-xs font-bold text-slate-900">
                      <span>{exp.jobTitle}</span>
                      <span className="font-semibold text-slate-700">{[exp.startDate, exp.endDate].filter(Boolean).join(' – ')}</span>
                    </div>
                    <div className="text-xs italic text-slate-700 mb-1.5">
                      {[exp.company, exp.location].filter(Boolean).join(' | ')}
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-800 pl-1">
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
          )}

          {optimizedResume.projects && optimizedResume.projects.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
                PROJECTS
              </h2>

              <div className="space-y-3 text-xs text-slate-800">
                {optimizedResume.projects.map((proj, idx) => (
                  <div key={idx}>
                    <div className="font-bold text-slate-900">
                      {proj.title} {proj.technologiesUsed?.length > 0 && <span className="font-normal italic text-slate-600">({proj.technologiesUsed.join(', ')})</span>}
                    </div>
                    {proj.description && <p className="mt-0.5 leading-relaxed">{proj.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {optimizedResume.education && optimizedResume.education.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                EDUCATION
              </h2>

              <div className="space-y-2 text-xs text-slate-800">
                {optimizedResume.education.map((edu, idx) => {
                  const ed = formatEducationDetails(edu);
                  return (
                  <div key={idx} className="mb-2">
                    <div className="flex items-baseline justify-between">
                      <strong className="text-slate-900">{ed.title}</strong>
                      {ed.dates && <span className="font-semibold text-slate-700">{ed.dates}</span>}
                    </div>
                    {ed.subtitle && <div className="text-slate-700">{ed.subtitle}</div>}
                    {ed.scoreLine && <div className="text-slate-700 font-medium italic mt-0.5">{ed.scoreLine}</div>}
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {optimizedResume.certifications && optimizedResume.certifications.length > 0 && (
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                CERTIFICATIONS
              </h2>

              <div className="space-y-1 text-xs text-slate-800">
                {optimizedResume.certifications.map((cert, idx) => (
                  <div key={idx} className="flex items-baseline justify-between">
                    <span className="font-bold text-slate-900">{cert.name}</span>
                    <span className="text-slate-700">{[cert.issuer, cert.year].filter(Boolean).join(' - ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ======================================================================= */}
      {/* TEMPLATE 3: TECHNICAL / ENGINEERING (Tech Stack & Projects Upfront) */}
      {/* ======================================================================= */}
      {selectedTemplateId === 'technical' && (
        <div className="bg-white border border-slate-300 shadow-xl rounded-none sm:rounded-lg p-8 sm:p-12 text-slate-900 font-sans max-w-4xl mx-auto print:shadow-none print:border-none print:p-0">
          
          <div className="pb-4 mb-6 border-b-2 border-slate-800">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 mb-1">
              {optimizedResume.contactInfo?.name || 'CANDIDATE NAME'}
            </h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-slate-700">
              {optimizedResume.contactInfo?.email && <a href={`mailto:${optimizedResume.contactInfo.email}`} className="hover:underline">{optimizedResume.contactInfo.email}</a>}
              {optimizedResume.contactInfo?.phone && <span>|  {optimizedResume.contactInfo.phone}</span>}
              {optimizedResume.contactInfo?.location && <span>|  {optimizedResume.contactInfo.location}</span>}
              {optimizedResume.contactInfo?.linkedIn && <React.Fragment><span className="text-slate-400 mx-1">|</span><a href={optimizedResume.contactInfo.linkedIn} target="_blank" rel="noreferrer" className="hover:underline">LinkedIn</a></React.Fragment>}
              {optimizedResume.contactInfo?.portfolio && <React.Fragment><span className="text-slate-400 mx-1">|</span><a href={optimizedResume.contactInfo.portfolio} target="_blank" rel="noreferrer" className="hover:underline">Portfolio</a></React.Fragment>}
            </div>
          </div>

          {optimizedResume.summary && (
            <div className="mb-6">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                SUMMARY
              </h2>
              <p className="text-xs text-slate-800 leading-relaxed font-normal">
                {optimizedResume.summary}
              </p>
            </div>
          )}

          {/* TECHNICAL SKILLS SURFACED RIGHT AFTER SUMMARY */}
          {optimizedResume.skills && optimizedResume.skills.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2.5">
                TECHNICAL SKILLS
              </h2>
              <div className="space-y-2 text-xs">
                {optimizedResume.skills.map((skillGroup, idx) => (
                  <div key={idx} className="flex flex-wrap items-baseline gap-1.5">
                    <strong className="text-slate-900 font-bold min-w-[120px]">{skillGroup.category}:</strong>
                    <div className="flex flex-wrap gap-1">
                      {skillGroup.items?.map((item, sIdx) => (
                        <span key={sIdx} className="font-mono text-[11px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {optimizedResume.experience && optimizedResume.experience.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
                PROFESSIONAL EXPERIENCE
              </h2>

              <div className="space-y-4">
                {optimizedResume.experience.map((exp, idx) => (
                  <div key={idx}>
                    <div className="flex items-baseline justify-between text-xs font-bold text-slate-900">
                      <span>{exp.jobTitle}</span>
                      <span className="font-mono font-semibold text-slate-700">{[exp.startDate, exp.endDate].filter(Boolean).join(' – ')}</span>
                    </div>
                    <div className="text-xs italic text-slate-700 mb-1">
                      {[exp.company, exp.location].filter(Boolean).join(' | ')}
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-800 pl-1">
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
          )}

          {optimizedResume.projects && optimizedResume.projects.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
                TECHNICAL PROJECTS
              </h2>

              <div className="space-y-3.5 text-xs text-slate-800">
                {optimizedResume.projects.map((proj, idx) => (
                  <div key={idx}>
                    <div className="flex flex-wrap items-baseline gap-2 font-bold text-slate-900">
                      <span>{proj.title}</span>
                      {proj.technologiesUsed?.length > 0 && (
                        <span className="font-mono text-[11px] text-slate-600 font-normal">
                          [{proj.technologiesUsed.join(' • ')}]
                        </span>
                      )}
                    </div>
                    {proj.description && <p className="mt-1 leading-relaxed text-slate-800">{proj.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {optimizedResume.education && optimizedResume.education.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                EDUCATION
              </h2>

              <div className="space-y-2 text-xs text-slate-800">
                {optimizedResume.education.map((edu, idx) => {
                  const ed = formatEducationDetails(edu);
                  return (
                  <div key={idx} className="mb-2">
                    <div className="flex items-baseline justify-between">
                      <strong className="text-slate-900">{ed.title}</strong>
                      {ed.dates && <span className="font-mono font-semibold text-slate-700">{ed.dates}</span>}
                    </div>
                    {ed.subtitle && <div className="text-slate-700">{ed.subtitle}</div>}
                    {ed.scoreLine && <div className="text-slate-700 font-medium italic mt-0.5">{ed.scoreLine}</div>}
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {optimizedResume.certifications && optimizedResume.certifications.length > 0 && (
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                CERTIFICATIONS
              </h2>

              <div className="space-y-1 text-xs text-slate-800">
                {optimizedResume.certifications.map((cert, idx) => (
                  <div key={idx} className="flex items-baseline justify-between">
                    <span className="font-bold text-slate-900">{cert.name}</span>
                    <span className="font-mono text-slate-700">{[cert.issuer, cert.year].filter(Boolean).join(' - ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ======================================================================= */}
      {/* TEMPLATE 4: ResumeMatch Professional */}
      {/* ======================================================================= */}
      {selectedTemplateId === 'resumematch-professional' && (
        <div className="bg-white border border-slate-300 shadow-xl rounded-none sm:rounded-lg p-8 sm:p-12 text-slate-900 font-sans max-w-4xl mx-auto print:shadow-none print:border-none print:p-0">
          
          <div className="mb-6 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2 uppercase tracking-wide">
              {optimizedResume.contactInfo?.name || 'CANDIDATE NAME'}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-700">
              {[
                optimizedResume.contactInfo?.location && <span key="loc">{optimizedResume.contactInfo.location}</span>,
                optimizedResume.contactInfo?.phone && <span key="phone">{optimizedResume.contactInfo.phone}</span>,
                optimizedResume.contactInfo?.email && <a key="email" href={`mailto:${optimizedResume.contactInfo.email}`} className="text-blue-600 hover:underline">{optimizedResume.contactInfo.email}</a>,
                optimizedResume.contactInfo?.linkedIn && <a key="linkedin" href={optimizedResume.contactInfo.linkedIn} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">LinkedIn</a>,
                optimizedResume.contactInfo?.portfolio && <a key="port" href={optimizedResume.contactInfo.portfolio} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Portfolio/GitHub</a>
              ].filter(Boolean).map((el, i, arr) => (
                <React.Fragment key={i}>
                  {el}
                  {i < arr.length - 1 && <span className="text-slate-400">|</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          {optimizedResume.summary && (
            <div className="mb-5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-1 mb-2">
                SUMMARY
              </h2>
              <p className="text-sm text-slate-800 leading-relaxed">
                {optimizedResume.summary}
              </p>
            </div>
          )}

          {optimizedResume.skills && optimizedResume.skills.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-1 mb-2">
                TECHNICAL SKILLS
              </h2>
              <div className="space-y-1 text-sm text-slate-800">
                {optimizedResume.skills.map((skillGroup, idx) => (
                  <div key={idx} className="flex">
                    <strong className="font-semibold text-slate-900 w-32 shrink-0">{skillGroup.category}:</strong>
                    <span>{skillGroup.items?.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {optimizedResume.experience && optimizedResume.experience.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-1 mb-3">
                PROFESSIONAL EXPERIENCE
              </h2>
              <div className="space-y-4">
                {optimizedResume.experience.map((exp, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="font-bold text-slate-900 text-sm">{exp.jobTitle}</h3>
                      <span className="text-sm font-semibold text-slate-800 whitespace-nowrap">
                        {[exp.startDate, exp.endDate].filter(Boolean).join(' – ')}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-slate-700 mb-2 italic">
                      {[exp.company, exp.location].filter(Boolean).join(' | ')}
                    </div>
                    <ul className="list-disc list-outside ml-4 space-y-1 text-sm text-slate-800">
                      {exp.bullets?.map((bullet, bIdx) => (
                        <li key={bIdx} className="leading-relaxed pl-1">{bullet}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {optimizedResume.projects && optimizedResume.projects.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-1 mb-3">
                PROJECTS
              </h2>
              <div className="space-y-4">
                {optimizedResume.projects.map((proj, idx) => (
                  <div key={idx}>
                    <div className="mb-1">
                      <span className="font-bold text-slate-900 text-sm">{proj.title}</span>
                      {proj.technologiesUsed?.length > 0 && (
                        <span className="text-sm text-slate-700 ml-2 italic">
                          | {proj.technologiesUsed.join(', ')}
                        </span>
                      )}
                    </div>
                    {proj.description && (
                      <ul className="list-disc list-outside ml-4 space-y-1 text-sm text-slate-800">
                        <li className="leading-relaxed pl-1">{proj.description}</li>
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {optimizedResume.education && optimizedResume.education.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-1 mb-3">
                EDUCATION
              </h2>
              <div className="space-y-3">
                {optimizedResume.education.map((edu, idx) => {
                  const ed = formatEducationDetails(edu);
                  return (
                  <div key={idx} className="mb-2">
                    <div className="flex justify-between items-baseline">
                      <div className="font-bold text-slate-900 text-sm">{ed.title}</div>
                      {ed.dates && (
                        <div className="text-sm font-semibold text-slate-800 whitespace-nowrap">
                          {ed.dates}
                        </div>
                      )}
                    </div>
                    {ed.subtitle && <div className="text-sm text-slate-700">{ed.subtitle}</div>}
                    {ed.scoreLine && <div className="text-sm text-slate-800 font-medium italic mt-0.5">{ed.scoreLine}</div>}
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {optimizedResume.certifications && optimizedResume.certifications.length > 0 && (
            <div className="mb-5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-1 mb-3">
                CERTIFICATIONS
              </h2>
              <div className="space-y-2">
                {optimizedResume.certifications.map((cert, idx) => (
                  <div key={idx} className="flex justify-between items-baseline">
                    <div className="text-sm text-slate-900">
                      <span className="font-bold">{cert.name}</span>
                      {cert.issuer && <span className="text-slate-700"> – {cert.issuer}</span>}
                    </div>
                    {cert.year && (
                      <div className="text-sm font-semibold text-slate-800 whitespace-nowrap">{cert.year}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
