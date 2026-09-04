import React, { useState, useEffect, useRef } from 'react';
import { 
  OptimizedResume, 
  ValidationReport, 
  PageType, 
  WorkExperienceItem, 
  ProjectItem, 
  EducationItem, 
  CertificationItem,
  SkillCategoryGroup,
  ResumeTemplateId
} from '../types';
import { 
  Save, 
  Undo, 
  Redo, 
  Eye, 
  Download, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  User, 
  FileText, 
  Wrench, 
  Briefcase, 
  FolderGit2, 
  GraduationCap, 
  Award, 
  ShieldAlert,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { generateAtsPdf } from '../lib/pdfGenerator';
import { TemplateSelectorBar } from './TemplateSelectorBar';
import { FactCheckSection } from './FactCheckSection';

interface ResumeEditorPageProps {
  optimizedResume: OptimizedResume | null;
  validationReport: ValidationReport | null;
  onSaveResume: (updatedResume: OptimizedResume) => void;
  setCurrentPage: (page: PageType) => void;
}

// Utility to reorder items in an array
function reorderArray<T>(list: T[], index: number, direction: 'up' | 'down'): T[] {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= list.length) return list;
  const result = [...list];
  const [removed] = result.splice(index, 1);
  result.splice(targetIndex, 0, removed);
  return result;
}

export const ResumeEditorPage: React.FC<ResumeEditorPageProps> = ({
  optimizedResume,
  validationReport,
  onSaveResume,
  setCurrentPage
}) => {
  if (!optimizedResume) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600 mb-4 font-medium">No optimized resume loaded for editing.</p>
        <button
          onClick={() => setCurrentPage('create')}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm cursor-pointer hover:bg-blue-700 transition-colors"
        >
          Create New Optimization
        </button>
      </div>
    );
  }

  // Ensure all section arrays are initialized
  const initialResume: OptimizedResume = {
    contactInfo: {
      name: optimizedResume.contactInfo?.name || optimizedResume.personal?.name || '',
      email: optimizedResume.contactInfo?.email || optimizedResume.personal?.email || '',
      phone: optimizedResume.contactInfo?.phone || optimizedResume.personal?.phone || '',
      location: optimizedResume.contactInfo?.location || optimizedResume.personal?.location || '',
      linkedIn: optimizedResume.contactInfo?.linkedIn || optimizedResume.personal?.linkedIn || '',
      portfolio: optimizedResume.contactInfo?.portfolio || optimizedResume.personal?.portfolio || ''
    },
    summary: optimizedResume.summary || '',
    skills: Array.isArray(optimizedResume.skills) ? optimizedResume.skills : [],
    experience: Array.isArray(optimizedResume.experience) 
      ? optimizedResume.experience 
      : (Array.isArray(optimizedResume.workExperience) ? optimizedResume.workExperience : []),
    projects: Array.isArray(optimizedResume.projects) ? optimizedResume.projects : [],
    education: Array.isArray(optimizedResume.education) ? optimizedResume.education : [],
    certifications: Array.isArray(optimizedResume.certifications) ? optimizedResume.certifications : []
  };

  // Undo / Redo history state
  const [history, setHistory] = useState<OptimizedResume[]>([initialResume]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Autosave status state
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');
  const [savedSuccessToast, setSavedSuccessToast] = useState(false);

  // Validation Report state
  const [currentValReport, setCurrentValReport] = useState<ValidationReport | null>(validationReport);

  const currentResume = history[historyIndex] || initialResume;

  // Ref to track if change is user-initiated for autosave debounce
  const isInitialMount = useRef(true);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Push new resume state to history
  const updateResume = (newResume: OptimizedResume) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newResume);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setSaveStatus('unsaved');
  };

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSaveStatus('unsaved');
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSaveStatus('unsaved');
    }
  };

  // Manual Save
  const handleSave = () => {
    onSaveResume(currentResume);
    setSaveStatus('saved');
    setSavedSuccessToast(true);
    setTimeout(() => setSavedSuccessToast(false), 2500);
  };

  // Debounced Autosave (3 seconds after user stops typing)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (saveStatus === 'unsaved') {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

      autosaveTimerRef.current = setTimeout(() => {
        setSaveStatus('saving');
        onSaveResume(currentResume);
        setTimeout(() => setSaveStatus('saved'), 600);
      }, 3000);
    }

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [currentResume, saveStatus]);

  // -------------------------------------------------------------
  // 1. PERSONAL INFORMATION HANDLERS
  // -------------------------------------------------------------
  const handleContactChange = (field: keyof typeof currentResume.contactInfo, value: string) => {
    updateResume({
      ...currentResume,
      contactInfo: {
        ...currentResume.contactInfo,
        [field]: value
      }
    });
  };

  // -------------------------------------------------------------
  // 2. PROFESSIONAL SUMMARY HANDLER
  // -------------------------------------------------------------
  const handleSummaryChange = (value: string) => {
    updateResume({
      ...currentResume,
      summary: value
    });
  };

  // -------------------------------------------------------------
  // 3. SKILLS HANDLERS
  // -------------------------------------------------------------
  const addSkillCategory = () => {
    updateResume({
      ...currentResume,
      skills: [
        ...currentResume.skills,
        { category: 'New Category', items: ['Skill 1', 'Skill 2'] }
      ]
    });
  };

  const removeSkillCategory = (catIdx: number) => {
    const updated = [...currentResume.skills];
    updated.splice(catIdx, 1);
    updateResume({ ...currentResume, skills: updated });
  };

  const reorderSkillCategory = (catIdx: number, direction: 'up' | 'down') => {
    const updated = reorderArray(currentResume.skills, catIdx, direction);
    updateResume({ ...currentResume, skills: updated });
  };

  const handleCategoryNameChange = (catIdx: number, name: string) => {
    const updated = [...currentResume.skills];
    updated[catIdx] = { ...updated[catIdx], category: name };
    updateResume({ ...currentResume, skills: updated });
  };

  const handleSkillItemChange = (catIdx: number, itemIdx: number, value: string) => {
    const updated = [...currentResume.skills];
    const items = [...updated[catIdx].items];
    items[itemIdx] = value;
    updated[catIdx] = { ...updated[catIdx], items };
    updateResume({ ...currentResume, skills: updated });
  };

  const addSkillItem = (catIdx: number) => {
    const updated = [...currentResume.skills];
    const items = [...(updated[catIdx].items || []), 'New Skill'];
    updated[catIdx] = { ...updated[catIdx], items };
    updateResume({ ...currentResume, skills: updated });
  };

  const removeSkillItem = (catIdx: number, itemIdx: number) => {
    const updated = [...currentResume.skills];
    const items = [...updated[catIdx].items];
    items.splice(itemIdx, 1);
    updated[catIdx] = { ...updated[catIdx], items };
    updateResume({ ...currentResume, skills: updated });
  };

  const reorderSkillItem = (catIdx: number, itemIdx: number, direction: 'up' | 'down') => {
    const updated = [...currentResume.skills];
    const items = reorderArray(updated[catIdx].items, itemIdx, direction);
    updated[catIdx] = { ...updated[catIdx], items };
    updateResume({ ...currentResume, skills: updated });
  };

  // -------------------------------------------------------------
  // 4. WORK EXPERIENCE HANDLERS
  // -------------------------------------------------------------
  const addExperienceItem = () => {
    updateResume({
      ...currentResume,
      experience: [
        ...currentResume.experience,
        {
          id: 'exp_' + Date.now(),
          jobTitle: 'Job Title',
          company: 'Company Name',
          location: 'City, State',
          startDate: '2022',
          endDate: 'Present',
          bullets: ['Delivered key initiative driving quantifiable business results.']
        }
      ]
    });
  };

  const removeExperienceItem = (index: number) => {
    const updated = [...currentResume.experience];
    updated.splice(index, 1);
    updateResume({ ...currentResume, experience: updated });
  };

  const reorderExperienceItem = (index: number, direction: 'up' | 'down') => {
    const updated = reorderArray(currentResume.experience, index, direction);
    updateResume({ ...currentResume, experience: updated });
  };

  const handleExpFieldChange = (index: number, field: keyof WorkExperienceItem, value: any) => {
    const updated = [...currentResume.experience];
    updated[index] = { ...updated[index], [field]: value };
    updateResume({ ...currentResume, experience: updated });
  };

  const handleExpBulletChange = (expIdx: number, bulletIdx: number, value: string) => {
    const updatedExp = [...currentResume.experience];
    const updatedBullets = [...updatedExp[expIdx].bullets];
    updatedBullets[bulletIdx] = value;
    updatedExp[expIdx] = { ...updatedExp[expIdx], bullets: updatedBullets };
    updateResume({ ...currentResume, experience: updatedExp });
  };

  const addExpBullet = (expIdx: number) => {
    const updatedExp = [...currentResume.experience];
    const updatedBullets = [...(updatedExp[expIdx].bullets || []), 'Accomplished [task] by leveraging [skill].'];
    updatedExp[expIdx] = { ...updatedExp[expIdx], bullets: updatedBullets };
    updateResume({ ...currentResume, experience: updatedExp });
  };

  const removeExpBullet = (expIdx: number, bulletIdx: number) => {
    const updatedExp = [...currentResume.experience];
    const updatedBullets = [...updatedExp[expIdx].bullets];
    updatedBullets.splice(bulletIdx, 1);
    updatedExp[expIdx] = { ...updatedExp[expIdx], bullets: updatedBullets };
    updateResume({ ...currentResume, experience: updatedExp });
  };

  const reorderExpBullet = (expIdx: number, bulletIdx: number, direction: 'up' | 'down') => {
    const updatedExp = [...currentResume.experience];
    const updatedBullets = reorderArray(updatedExp[expIdx].bullets, bulletIdx, direction);
    updatedExp[expIdx] = { ...updatedExp[expIdx], bullets: updatedBullets };
    updateResume({ ...currentResume, experience: updatedExp });
  };

  // -------------------------------------------------------------
  // 5. PROJECTS HANDLERS
  // -------------------------------------------------------------
  const addProjectItem = () => {
    updateResume({
      ...currentResume,
      projects: [
        ...(currentResume.projects || []),
        {
          id: 'proj_' + Date.now(),
          title: 'Project Title',
          description: 'Brief overview of project architecture and impact.',
          technologiesUsed: ['React', 'TypeScript', 'Node.js'],
          link: ''
        }
      ]
    });
  };

  const removeProjectItem = (index: number) => {
    const updated = [...(currentResume.projects || [])];
    updated.splice(index, 1);
    updateResume({ ...currentResume, projects: updated });
  };

  const reorderProjectItem = (index: number, direction: 'up' | 'down') => {
    const updated = reorderArray(currentResume.projects || [], index, direction);
    updateResume({ ...currentResume, projects: updated });
  };

  const handleProjectChange = (index: number, field: keyof ProjectItem, value: any) => {
    const updated = [...(currentResume.projects || [])];
    updated[index] = { ...updated[index], [field]: value };
    updateResume({ ...currentResume, projects: updated });
  };

  // -------------------------------------------------------------
  // 6. EDUCATION HANDLERS
  // -------------------------------------------------------------
  const addEducationItem = () => {
    updateResume({
      ...currentResume,
      education: [
        ...(currentResume.education || []),
        {
          id: 'edu_' + Date.now(),
          degree: 'Bachelor of Science',
          institution: 'University Name',
          fieldOfStudy: 'Computer Science',
          graduationYear: '2022'
        }
      ]
    });
  };

  const removeEducationItem = (index: number) => {
    const updated = [...(currentResume.education || [])];
    updated.splice(index, 1);
    updateResume({ ...currentResume, education: updated });
  };

  const reorderEducationItem = (index: number, direction: 'up' | 'down') => {
    const updated = reorderArray(currentResume.education || [], index, direction);
    updateResume({ ...currentResume, education: updated });
  };

  const handleEducationChange = (index: number, field: keyof EducationItem, value: string) => {
    const updated = [...(currentResume.education || [])];
    updated[index] = { ...updated[index], [field]: value };
    updateResume({ ...currentResume, education: updated });
  };

  // -------------------------------------------------------------
  // 7. CERTIFICATIONS HANDLERS
  // -------------------------------------------------------------
  const addCertificationItem = () => {
    updateResume({
      ...currentResume,
      certifications: [
        ...(currentResume.certifications || []),
        {
          id: 'cert_' + Date.now(),
          name: 'Certification Name',
          issuer: 'Issuing Organization',
          year: '2023'
        }
      ]
    });
  };

  const removeCertificationItem = (index: number) => {
    const updated = [...(currentResume.certifications || [])];
    updated.splice(index, 1);
    updateResume({ ...currentResume, certifications: updated });
  };

  const reorderCertificationItem = (index: number, direction: 'up' | 'down') => {
    const updated = reorderArray(currentResume.certifications || [], index, direction);
    updateResume({ ...currentResume, certifications: updated });
  };

  const handleCertChange = (index: number, field: keyof CertificationItem, value: string) => {
    const updated = [...(currentResume.certifications || [])];
    updated[index] = { ...updated[index], [field]: value };
    updateResume({ ...currentResume, certifications: updated });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* TOP STICKY TOOLBAR */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-black text-slate-900 tracking-tight mr-1">
            Resume Editor
          </h1>

          <div className="flex items-center gap-1.5 border-r border-slate-200 pr-3">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Undo change"
            >
              <Undo className="w-4 h-4" />
              <span className="hidden sm:inline">Undo</span>
            </button>

            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Redo change"
            >
              <Redo className="w-4 h-4" />
              <span className="hidden sm:inline">Redo</span>
            </button>
          </div>

          {/* Autosave Status Indicator */}
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {saveStatus === 'saving' && (
              <span className="text-amber-600 flex items-center gap-1 animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                Autosaving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                All changes saved
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="text-slate-400 flex items-center gap-1">
                • Unsaved changes
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {savedSuccessToast && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved!
            </span>
          )}

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4 text-blue-400" />
            Save
          </button>

          <button
            onClick={() => setCurrentPage('resume-preview')}
            className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4 text-blue-600" />
            Preview
          </button>

          <button
            onClick={() => generateAtsPdf(currentResume)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>

      </div>

      {/* RESUME TEMPLATE SELECTOR */}
      <TemplateSelectorBar
        selectedTemplateId={currentResume.templateId || 'ats-classic'}
        onSelectTemplate={(templateId: ResumeTemplateId) => {
          updateResume({
            ...currentResume,
            templateId
          });
        }}
      />

      {/* TRUTH CHECK / FACT CHECK SECTION */}
      <FactCheckSection
        validationReport={currentValReport}
        optimizedResume={currentResume}
        onUpdateResume={updateResume}
        onUpdateValidationReport={setCurrentValReport}
      />

      {/* SECTION 1: PERSONAL INFORMATION */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          1. Personal Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={currentResume.contactInfo?.name || ''}
              onChange={(e) => handleContactChange('name', e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              placeholder="First and Last Name"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={currentResume.contactInfo?.email || ''}
              onChange={(e) => handleContactChange('email', e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              value={currentResume.contactInfo?.phone || ''}
              onChange={(e) => handleContactChange('phone', e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              placeholder="(555) 000-0000"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Location (City, State)</label>
            <input
              type="text"
              value={currentResume.contactInfo?.location || ''}
              onChange={(e) => handleContactChange('location', e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              placeholder="San Francisco, CA"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">LinkedIn URL / Handle</label>
            <input
              type="text"
              value={currentResume.contactInfo?.linkedIn || ''}
              onChange={(e) => handleContactChange('linkedIn', e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              placeholder="linkedin.com/in/username"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Portfolio / Website</label>
            <input
              type="text"
              value={currentResume.contactInfo?.portfolio || ''}
              onChange={(e) => handleContactChange('portfolio', e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              placeholder="https://portfolio.dev"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: PROFESSIONAL SUMMARY */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            2. Professional Summary
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {currentResume.summary?.length || 0} chars
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Concise, high-impact summary statement showcasing target position alignment.
        </p>
        <textarea
          rows={4}
          value={currentResume.summary || ''}
          onChange={(e) => handleSummaryChange(e.target.value)}
          className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Write a targeted 3-4 sentence professional summary..."
        />
      </div>

      {/* SECTION 3: SKILLS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-emerald-600" />
              3. Skills
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Organized by technical & professional categories. Add, edit, remove, or reorder categories and skills.
            </p>
          </div>

          <button
            onClick={addSkillCategory}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-200"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Category
          </button>
        </div>

        <div className="space-y-4">
          {currentResume.skills?.map((catGroup, cIdx) => (
            <div key={cIdx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              
              {/* Category Header */}
              <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => reorderSkillCategory(cIdx, 'up')}
                      disabled={cIdx === 0}
                      className="p-1 rounded hover:bg-slate-200 disabled:opacity-20 text-slate-600"
                      title="Move Category Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => reorderSkillCategory(cIdx, 'down')}
                      disabled={cIdx === currentResume.skills.length - 1}
                      className="p-1 rounded hover:bg-slate-200 disabled:opacity-20 text-slate-600"
                      title="Move Category Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={catGroup.category}
                    onChange={(e) => handleCategoryNameChange(cIdx, e.target.value)}
                    className="font-bold text-sm bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none max-w-xs"
                    placeholder="Category Name"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addSkillItem(cIdx)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Add Skill
                  </button>

                  <button
                    onClick={() => removeSkillCategory(cIdx)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Skill Items inside Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {catGroup.items?.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => reorderSkillItem(cIdx, itemIdx, 'up')}
                        disabled={itemIdx === 0}
                        className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-20 text-slate-500"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => reorderSkillItem(cIdx, itemIdx, 'down')}
                        disabled={itemIdx === (catGroup.items.length - 1)}
                        className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-20 text-slate-500"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleSkillItemChange(cIdx, itemIdx, e.target.value)}
                      className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 text-slate-800 font-mono font-medium"
                    />

                    <button
                      onClick={() => removeSkillItem(cIdx, itemIdx)}
                      className="p-0.5 text-slate-300 hover:text-rose-600 shrink-0 cursor-pointer"
                      title="Remove Skill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: WORK EXPERIENCE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              4. Work Experience
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Edit companies, titles, dates, locations, and achievement bullet points.
            </p>
          </div>

          <button
            onClick={addExperienceItem}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-indigo-200"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Experience
          </button>
        </div>

        <div className="space-y-6">
          {currentResume.experience?.map((exp, expIdx) => (
            <div key={exp.id || expIdx} className="p-5 bg-slate-50/70 rounded-xl border border-slate-200 space-y-4">
              
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => reorderExperienceItem(expIdx, 'up')}
                      disabled={expIdx === 0}
                      className="p-1 rounded hover:bg-slate-200 disabled:opacity-20 text-slate-600"
                      title="Move Role Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => reorderExperienceItem(expIdx, 'down')}
                      disabled={expIdx === currentResume.experience.length - 1}
                      className="p-1 rounded hover:bg-slate-200 disabled:opacity-20 text-slate-600"
                      title="Move Role Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs font-extrabold uppercase text-slate-500 font-mono">
                    Role #{expIdx + 1}: {exp.jobTitle || 'Untitled Position'}
                  </span>
                </div>

                <button
                  onClick={() => removeExperienceItem(expIdx)}
                  className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Experience
                </button>
              </div>

              {/* Role Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={exp.jobTitle || ''}
                    onChange={(e) => handleExpFieldChange(expIdx, 'jobTitle', e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. Senior Software Engineer"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={exp.company || ''}
                    onChange={(e) => handleExpFieldChange(expIdx, 'company', e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    placeholder="e.g. Acme Corp"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dates (Start - End)</label>
                  <div className="grid grid-cols-2 gap-1">
                    <input
                      type="text"
                      value={exp.startDate || ''}
                      onChange={(e) => handleExpFieldChange(expIdx, 'startDate', e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Jan 2021"
                    />
                    <input
                      type="text"
                      value={exp.endDate || ''}
                      onChange={(e) => handleExpFieldChange(expIdx, 'endDate', e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Present"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={exp.location || ''}
                    onChange={(e) => handleExpFieldChange(expIdx, 'location', e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    placeholder="City, State / Remote"
                  />
                </div>
              </div>

              {/* Bullet Points */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Achievement Bullets ({exp.bullets?.length || 0})
                  </label>
                  <button
                    onClick={() => addExpBullet(expIdx)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Bullet
                  </button>
                </div>

                <div className="space-y-2">
                  {exp.bullets?.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-start gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                      
                      <div className="flex flex-col gap-0.5 mt-1 shrink-0">
                        <button
                          onClick={() => reorderExpBullet(expIdx, bIdx, 'up')}
                          disabled={bIdx === 0}
                          className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-20 text-slate-500"
                          title="Move Bullet Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => reorderExpBullet(expIdx, bIdx, 'down')}
                          disabled={bIdx === exp.bullets.length - 1}
                          className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-20 text-slate-500"
                          title="Move Bullet Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        value={bullet}
                        onChange={(e) => handleExpBulletChange(expIdx, bIdx, e.target.value)}
                        className="w-full p-2 text-xs leading-relaxed border-0 focus:ring-1 focus:ring-blue-500 rounded-lg"
                        placeholder="Bullet point achievement..."
                      />

                      <button
                        onClick={() => removeExpBullet(expIdx, bIdx)}
                        className="p-1 text-slate-300 hover:text-rose-600 shrink-0 mt-1 cursor-pointer"
                        title="Delete Bullet"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* SECTION 5: PROJECTS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-purple-600" />
              5. Projects
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Highlight key engineering, research, or personal projects.
            </p>
          </div>

          <button
            onClick={addProjectItem}
            className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-purple-200"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Project
          </button>
        </div>

        <div className="space-y-4">
          {currentResume.projects?.map((proj, pIdx) => (
            <div key={proj.id || pIdx} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
              
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => reorderProjectItem(pIdx, 'up')}
                      disabled={pIdx === 0}
                      className="p-1 rounded hover:bg-slate-200 disabled:opacity-20 text-slate-600"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => reorderProjectItem(pIdx, 'down')}
                      disabled={pIdx === (currentResume.projects.length - 1)}
                      className="p-1 rounded hover:bg-slate-200 disabled:opacity-20 text-slate-600"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs font-bold text-slate-700">Project #{pIdx + 1}</span>
                </div>

                <button
                  onClick={() => removeProjectItem(pIdx)}
                  className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Project
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project Title</label>
                  <input
                    type="text"
                    value={proj.title || ''}
                    onChange={(e) => handleProjectChange(pIdx, 'title', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Project Title"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project Link (Optional)</label>
                  <input
                    type="text"
                    value={proj.link || ''}
                    onChange={(e) => handleProjectChange(pIdx, 'link', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="https://github.com/user/project"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-xs">Description</label>
                <textarea
                  rows={2}
                  value={proj.description || ''}
                  onChange={(e) => handleProjectChange(pIdx, 'description', e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Project overview, architecture, or results..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-xs">Technologies Used (comma-separated):</label>
                <input
                  type="text"
                  value={Array.isArray(proj.technologiesUsed) ? proj.technologiesUsed.join(', ') : (proj.technologiesUsed || '')}
                  onChange={(e) => {
                    const techArr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                    handleProjectChange(pIdx, 'technologiesUsed', techArr);
                  }}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="React, Node.js, PostgreSQL"
                />
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* SECTION 6: EDUCATION */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              6. Education
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Academic degrees, institutions, and graduation years.
            </p>
          </div>

          <button
            onClick={addEducationItem}
            className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Education
          </button>
        </div>

        <div className="space-y-4">
          {currentResume.education?.map((edu, eduIdx) => (
            <div key={edu.id || eduIdx} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
              
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => reorderEducationItem(eduIdx, 'up')}
                      disabled={eduIdx === 0}
                      className="p-1 rounded hover:bg-slate-200 disabled:opacity-20 text-slate-600"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => reorderEducationItem(eduIdx, 'down')}
                      disabled={eduIdx === (currentResume.education.length - 1)}
                      className="p-1 rounded hover:bg-slate-200 disabled:opacity-20 text-slate-600"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs font-bold text-slate-700">Degree #{eduIdx + 1}</span>
                </div>

                <button
                  onClick={() => removeEducationItem(eduIdx)}
                  className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Education
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Degree</label>
                  <input
                    type="text"
                    value={edu.degree || ''}
                    onChange={(e) => handleEducationChange(eduIdx, 'degree', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Bachelor of Science"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Field of Study</label>
                  <input
                    type="text"
                    value={edu.fieldOfStudy || ''}
                    onChange={(e) => handleEducationChange(eduIdx, 'fieldOfStudy', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    placeholder="Computer Science"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Institution</label>
                  <input
                    type="text"
                    value={edu.institution || ''}
                    onChange={(e) => handleEducationChange(eduIdx, 'institution', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    placeholder="University Name"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Graduation Year</label>
                  <input
                    type="text"
                    value={edu.graduationYear || ''}
                    onChange={(e) => handleEducationChange(eduIdx, 'graduationYear', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    placeholder="2022"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs mt-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CGPA</label>
                  <input
                    type="text"
                    value={edu.cgpa || ''}
                    onChange={(e) => handleEducationChange(eduIdx, 'cgpa', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    placeholder="e.g. 3.8/4.0"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Percentage</label>
                  <input
                    type="text"
                    value={edu.percentage || ''}
                    onChange={(e) => handleEducationChange(eduIdx, 'percentage', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    placeholder="e.g. 92%"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Marks Obtained</label>
                  <input
                    type="text"
                    value={edu.marksObtained || ''}
                    onChange={(e) => handleEducationChange(eduIdx, 'marksObtained', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    placeholder="e.g. 850"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Marks</label>
                  <input
                    type="text"
                    value={edu.totalMarks || ''}
                    onChange={(e) => handleEducationChange(eduIdx, 'totalMarks', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    placeholder="e.g. 1000"
                  />
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* SECTION 7: CERTIFICATIONS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              7. Certifications
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Professional credentials, licenses, and verified certifications.
            </p>
          </div>

          <button
            onClick={addCertificationItem}
            className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-200"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Certification
          </button>
        </div>

        <div className="space-y-4">
          {currentResume.certifications?.map((cert, certIdx) => (
            <div key={cert.id || certIdx} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
              
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => reorderCertificationItem(certIdx, 'up')}
                      disabled={certIdx === 0}
                      className="p-1 rounded hover:bg-slate-200 disabled:opacity-20 text-slate-600"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => reorderCertificationItem(certIdx, 'down')}
                      disabled={certIdx === (currentResume.certifications.length - 1)}
                      className="p-1 rounded hover:bg-slate-200 disabled:opacity-20 text-slate-600"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs font-bold text-slate-700">Certification #{certIdx + 1}</span>
                </div>

                <button
                  onClick={() => removeCertificationItem(certIdx)}
                  className="text-rose-600 hover:text-rose-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Certification
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Certification Name</label>
                  <input
                    type="text"
                    value={cert.name || ''}
                    onChange={(e) => handleCertChange(certIdx, 'name', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="AWS Certified Solutions Architect"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Issuing Organization</label>
                  <input
                    type="text"
                    value={cert.issuer || ''}
                    onChange={(e) => handleCertChange(certIdx, 'issuer', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    placeholder="Amazon Web Services"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Year Issued</label>
                  <input
                    type="text"
                    value={cert.year || ''}
                    onChange={(e) => handleCertChange(certIdx, 'year', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    placeholder="2023"
                  />
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
