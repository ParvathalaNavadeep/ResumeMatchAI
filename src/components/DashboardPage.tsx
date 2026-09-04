import React, { useState, useEffect } from 'react';
import { ApplicationRecord, PageType, UserProfile, ResumeDocument, JobDocument } from '../types';
import { fetchUserResumes, fetchUserJobs, fetchUserApplications, deleteResumeDoc, deleteJobDoc } from '../lib/firestoreService';
import { 
  PlusCircle, 
  Search, 
  FileText, 
  BarChart3, 
  FileEdit, 
  Eye, 
  Trash2, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  ShieldAlert, 
  SearchCode, 
  Briefcase, 
  Loader2, 
  LogIn,
  ShieldCheck 
} from 'lucide-react';

interface DashboardPageProps {
  applications: ApplicationRecord[];
  onSelectApplication: (app: ApplicationRecord, targetPage?: PageType) => void;
  onDeleteApplication: (id: string) => void;
  setCurrentPage: (page: PageType) => void;
  currentUser: UserProfile | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  applications,
  onSelectApplication,
  onDeleteApplication,
  setCurrentPage,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'applications' | 'resumes' | 'jobs'>('applications');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [savedResumes, setSavedResumes] = useState<ResumeDocument[]>([]);
  const [savedJobs, setSavedJobs] = useState<JobDocument[]>([]);
  const [loadingFirestore, setLoadingFirestore] = useState(false);

  useEffect(() => {
    if (currentUser?.uid) {
      loadUserCollections(currentUser.uid);
    }
  }, [currentUser]);

  const loadUserCollections = async (uid: string) => {
    setLoadingFirestore(true);
    try {
      const [resumesList, jobsList] = await Promise.all([
        fetchUserResumes(uid),
        fetchUserJobs(uid)
      ]);
      setSavedResumes(resumesList);
      setSavedJobs(jobsList);
    } catch (err) {
      console.warn('Error fetching resumes/jobs from Firestore:', err);
    } finally {
      setLoadingFirestore(false);
    }
  };

  const handleDeleteResume = async (id: string) => {
    setSavedResumes(prev => prev.filter(r => r.id !== id));
    try {
      await deleteResumeDoc(id);
    } catch (err) {
      console.warn('Error deleting resume:', err);
    }
  };

  const handleDeleteJob = async (id: string) => {
    setSavedJobs(prev => prev.filter(j => j.id !== id));
    try {
      await deleteJobDoc(id);
    } catch (err) {
      console.warn('Error deleting job:', err);
    }
  };

  const filteredApps = applications.filter(app => {
    const term = searchTerm.toLowerCase();
    return (
      (app.jobTitle || '').toLowerCase().includes(term) ||
      (app.company || '').toLowerCase().includes(term) ||
      (app.resumeFileName || '').toLowerCase().includes(term)
    );
  });

  const filteredResumes = savedResumes.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredJobs = savedJobs.filter(j => 
    j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Resume & Application Hub
            </h1>
            {currentUser && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Firestore Protected
              </span>
            )}
          </div>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Manage your saved master resumes, target job analyses, and tailored application reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage('create')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            New Optimization
          </button>
        </div>
      </div>

      {/* Guest Mode Callout */}
      {!currentUser && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-bold text-sm text-blue-400">Guest Mode Active</h3>
            <p className="text-xs text-slate-300">
              Sign in with Google to save your resumes, job scans, and applications permanently in your encrypted Firestore database.
            </p>
          </div>
          <button
            onClick={() => setCurrentPage('login')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors shadow-sm"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In with Google
          </button>
        </div>
      )}

      {/* Filter / Nav Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'applications'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Applications ({applications.length})
          </button>

          <button
            onClick={() => setActiveTab('resumes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'resumes'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Saved Resumes ({savedResumes.length})
          </button>

          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'jobs'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <SearchCode className="w-4 h-4" />
            Job Analyses ({savedJobs.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search saved records..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Loading Indicator for Firestore Fetch */}
      {loadingFirestore && (
        <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          Fetching records from Firestore...
        </div>
      )}

      {/* APPLICATIONS TAB CONTENT */}
      {activeTab === 'applications' && !loadingFirestore && (
        applications.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm max-w-2xl mx-auto my-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              No Application Records Found
            </h2>
            <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">
              Upload your resume and paste a target job description to generate your first tailored ATS application.
            </p>
            <button
              onClick={() => setCurrentPage('create')}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Start New Optimization
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app) => {
              const score = app.matchReport?.overallMatchScore ?? 0;
              const isValid = app.validationReport?.isValid ?? true;
              const warningsCount = app.validationReport?.warnings?.length ?? 0;

              return (
                <div 
                  key={app.id} 
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
                          {app.jobTitle || 'Job Application'}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium text-slate-700">{app.company || 'Target Employer'}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 ${
                          score >= 80 ? 'bg-emerald-100 text-emerald-800' :
                          score >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>{score}% Match</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-1.5 mb-4 flex items-center justify-between border border-slate-100">
                      <span className="truncate font-mono">PDF: {app.resumeFileName}</span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3" />
                        {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="mb-4">
                      {isValid ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-lg px-2.5 py-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>100% Factuality Passed — 0 Fabrications</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 rounded-lg px-2.5 py-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                          <span>{warningsCount} Unsupported Claim Warning{warningsCount > 1 ? 's' : ''} Flagged</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-1">
                    <button
                      onClick={() => onSelectApplication(app, 'match-report')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="View Match Report"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                      Report
                    </button>

                    <button
                      onClick={() => onSelectApplication(app, 'resume-editor')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Edit Resume Content"
                    >
                      <FileEdit className="w-3.5 h-3.5 text-emerald-600" />
                      Edit
                    </button>

                    <button
                      onClick={() => onSelectApplication(app, 'resume-preview')}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Preview & Download PDF"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      Preview
                    </button>

                    <button
                      onClick={() => onDeleteApplication(app.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Application"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* SAVED RESUMES TAB CONTENT */}
      {activeTab === 'resumes' && !loadingFirestore && (
        savedResumes.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs max-w-xl mx-auto my-4">
            <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">No Saved Resumes Found</h3>
            <p className="text-xs text-slate-600">
              Resumes uploaded during application optimizations will automatically save here in Firestore.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResumes.map(resume => (
              <div key={resume.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    {resume.name}
                  </div>
                  <button
                    onClick={() => resume.id && handleDeleteResume(resume.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                    title="Delete Saved Resume"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xs text-slate-500">
                  Extracted Skills: {resume.parsedResume?.skills?.length || 0} items
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Saved: {new Date(resume.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* JOB ANALYSES TAB CONTENT */}
      {activeTab === 'jobs' && !loadingFirestore && (
        savedJobs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs max-w-xl mx-auto my-4">
            <SearchCode className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">No Saved Job Analyses</h3>
            <p className="text-xs text-slate-600">
              Target job descriptions analyzed during optimizations will automatically save here in Firestore.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map(job => (
              <div key={job.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <SearchCode className="w-4 h-4 text-purple-600" />
                    {job.title}
                  </div>
                  <button
                    onClick={() => job.id && handleDeleteJob(job.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                    title="Delete Job Scan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>
                <div className="text-[10px] text-slate-400 font-mono">
                  Scanned: {new Date(job.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )
      )}

    </div>
  );
};
