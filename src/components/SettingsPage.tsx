import React, { useState, useEffect } from 'react';
import { UserProfile, PageType, ApplicationRecord, ResumeDocument, JobDocument } from '../types';
import { 
  fetchUserResumes, 
  fetchUserJobs, 
  fetchUserApplications,
  deleteIndividualResume,
  deleteIndividualJob,
  deleteAllUserResumes,
  deleteAllUserJobs,
  deleteUserAccountAndData
} from '../lib/firestoreService';
import { signInWithGoogle, logoutUser } from '../lib/firebase';
import { 
  Settings, 
  ShieldCheck, 
  Database, 
  Trash2, 
  LogIn, 
  LogOut, 
  AlertTriangle, 
  FileText, 
  SearchCode, 
  Lock, 
  CheckCircle2, 
  Info, 
  Loader2, 
  X,
  UserCheck
} from 'lucide-react';

interface SettingsPageProps {
  currentUser: UserProfile | null;
  applications: ApplicationRecord[];
  setCurrentPage: (page: PageType) => void;
  onRefreshApplications: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentUser,
  applications,
  setCurrentPage,
  onRefreshApplications
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'privacy' | 'resumes' | 'jobs' | 'danger'>('privacy');
  
  // Data state
  const [resumes, setResumes] = useState<ResumeDocument[]>([]);
  const [jobs, setJobs] = useState<JobDocument[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal confirmation states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'delete-resume' | 'delete-job' | 'delete-all-resumes' | 'delete-all-jobs' | 'delete-account' | null;
    itemId?: string;
    itemTitle?: string;
  }>({ isOpen: false, type: null });

  const [confirmInputText, setConfirmInputText] = useState('');

  // Load user resumes and job analyses from Firestore when currentUser changes
  useEffect(() => {
    if (currentUser?.uid) {
      loadUserData(currentUser.uid);
    }
  }, [currentUser]);

  const loadUserData = async (uid: string) => {
    setLoadingData(true);
    try {
      const [resList, jobList] = await Promise.all([
        fetchUserResumes(uid),
        fetchUserJobs(uid)
      ]);
      setResumes(resList);
      setJobs(jobList);
    } catch (err) {
      console.warn('Error loading user data for Settings page:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // Handler for deleting single resume
  const handleConfirmDeleteResume = async (resumeId: string) => {
    setActionLoading(true);
    try {
      if (currentUser?.uid) {
        await deleteIndividualResume(resumeId, currentUser.uid);
        await loadUserData(currentUser.uid);
      }
      onRefreshApplications();
      setConfirmModal({ isOpen: false, type: null });
    } catch (err) {
      console.error('Error deleting resume:', err);
      alert('Failed to delete resume. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for deleting single job analysis
  const handleConfirmDeleteJob = async (jobId: string) => {
    setActionLoading(true);
    try {
      if (currentUser?.uid) {
        await deleteIndividualJob(jobId, currentUser.uid);
        await loadUserData(currentUser.uid);
      }
      onRefreshApplications();
      setConfirmModal({ isOpen: false, type: null });
    } catch (err) {
      console.error('Error deleting job analysis:', err);
      alert('Failed to delete job analysis. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for deleting ALL resumes
  const handleConfirmDeleteAllResumes = async () => {
    setActionLoading(true);
    try {
      if (currentUser?.uid) {
        await deleteAllUserResumes(currentUser.uid);
        await loadUserData(currentUser.uid);
      } else {
        localStorage.removeItem('9th_resume_applications');
      }
      onRefreshApplications();
      setConfirmModal({ isOpen: false, type: null });
    } catch (err) {
      console.error('Error deleting all resumes:', err);
      alert('Failed to delete all resumes. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for deleting Account & All Data
  const handleConfirmDeleteAccount = async () => {
    if (confirmInputText.trim().toUpperCase() !== 'DELETE') {
      alert('Please type DELETE to confirm account deletion.');
      return;
    }

    setActionLoading(true);
    try {
      if (currentUser?.uid) {
        await deleteUserAccountAndData(currentUser.uid);
      }
      localStorage.clear();
      onRefreshApplications();
      await logoutUser();
      setConfirmModal({ isOpen: false, type: null });
      setCurrentPage('landing');
    } catch (err) {
      console.error('Error deleting account:', err);
      alert('Failed to delete account. You may need to sign in again before performing this action.');
    } finally {
      setActionLoading(false);
      setConfirmInputText('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-blue-600" />
          Settings & Privacy Controls
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Manage your account profile, Firestore data storage, and privacy controls.
        </p>
      </div>

      {/* Mandatory Privacy Explanation Banner */}
      <div className="bg-blue-900 text-white rounded-2xl p-5 shadow-sm border border-blue-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-800 flex items-center justify-center shrink-0 mt-0.5">
            <Lock className="w-5 h-5 text-blue-200" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-blue-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Privacy Statement
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 font-medium leading-relaxed">
              &ldquo;Your resume contains personal information. We provide controls to delete stored resume and job data.&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar text-xs font-bold">
        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'privacy' 
              ? 'bg-blue-600 text-white shadow-2xs' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-4 h-4" />
          Data & Privacy
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'account' 
              ? 'bg-blue-600 text-white shadow-2xs' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Account
        </button>

        <button
          onClick={() => setActiveTab('resumes')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'resumes' 
              ? 'bg-blue-600 text-white shadow-2xs' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          Delete Individual Resume
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 text-[10px]">
            {resumes.length || applications.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'jobs' 
              ? 'bg-blue-600 text-white shadow-2xs' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <SearchCode className="w-4 h-4" />
          Delete Job Analysis
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 text-[10px]">
            {jobs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('danger')}
          className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'danger' 
              ? 'bg-rose-600 text-white shadow-2xs' 
              : 'text-rose-600 hover:bg-rose-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Danger Zone
        </button>
      </div>

      {/* 1. DATA & PRIVACY TAB */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              Data Ownership & Zero-Lockin Guarantee
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Your resume files and extracted career profiles belong exclusively to you. ResumeMatch AI enforces zero-trust security controls on Google Cloud Firestore, ensuring that no other user can access or view your uploaded resumes or target job scans.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Isolated User Scope
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Every document is tagged with your unique Firebase User ID. Firestore security rules enforce strict read/write authorization.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Instant Permanent Removal
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Deleting a resume or account immediately deletes the Firestore document records and associated application analyses.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Delete All Saved Resumes</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Remove all stored master resumes, candidate profiles, and tailored outputs.
                </p>
              </div>
              <button
                onClick={() => setConfirmModal({ isOpen: true, type: 'delete-all-resumes' })}
                className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 transition-colors cursor-pointer"
              >
                Delete All Resumes
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Delete Entire Account</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Permanently erase your user profile, resumes, job scans, and application records.
                </p>
              </div>
              <button
                onClick={() => setConfirmModal({ isOpen: true, type: 'delete-account' })}
                className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ACCOUNT TAB */}
      {activeTab === 'account' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt={currentUser.displayName} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-500/10" />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center text-lg">
                  {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">{currentUser?.displayName || 'Guest User'}</h2>
                <p className="text-xs text-slate-500 font-mono">{currentUser?.email || 'Not authenticated'}</p>
              </div>
            </div>

            {currentUser ? (
              <button
                onClick={logoutUser}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                Sign Out
              </button>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <LogIn className="w-4 h-4" />
                Sign In with Google
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium block">Account UID</span>
              <span className="font-mono text-slate-900 font-bold block mt-1 break-all">{currentUser?.uid || 'N/A (Guest)'}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-medium block">Database Status</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-4 h-4" />
                Firestore Protected Collection
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. DELETE INDIVIDUAL RESUME TAB */}
      {activeTab === 'resumes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Stored Resumes ({resumes.length || applications.length})
            </h2>
          </div>

          {loadingData ? (
            <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              Loading stored resumes...
            </div>
          ) : (resumes.length === 0 && applications.length === 0) ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700">No stored resumes found.</p>
              <p className="text-xs text-slate-500">Upload a PDF resume to start tailoring applications.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.map((res) => (
                <div key={res.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 text-sm">{res.name}</p>
                    <p className="text-xs text-slate-500">
                      Skills extracted: {res.parsedResume?.coreSkills?.length || 0} &bull; Created: {new Date(res.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setConfirmModal({
                      isOpen: true,
                      type: 'delete-resume',
                      itemId: res.id,
                      itemTitle: res.name
                    })}
                    className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer self-end sm:self-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Resume
                  </button>
                </div>
              ))}

              {/* Also list applications if resumes collection hasn't synced separately */}
              {resumes.length === 0 && applications.map((app) => (
                <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 text-sm">{app.resumeFileName || app.title}</p>
                    <p className="text-xs text-slate-500">
                      Target Role: {app.jobTitle} @ {app.company} &bull; Created: {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setConfirmModal({
                      isOpen: true,
                      type: 'delete-resume',
                      itemId: app.id,
                      itemTitle: app.resumeFileName || app.title
                    })}
                    className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer self-end sm:self-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Resume
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. DELETE JOB ANALYSIS TAB */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <SearchCode className="w-5 h-5 text-purple-600" />
              Stored Job Analyses ({jobs.length})
            </h2>
          </div>

          {loadingData ? (
            <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
              Loading stored job analyses...
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-700">No stored job description analyses found.</p>
              <p className="text-xs text-slate-500">Paste a job description during optimization to store target job analyses.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((j) => (
                <div key={j.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 text-sm">{j.title || j.analysis?.jobTitle || 'Target Role Scan'}</p>
                    <p className="text-xs text-slate-500">
                      Required Skills: {j.analysis?.requiredSkills?.length || 0} &bull; Created: {new Date(j.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setConfirmModal({
                      isOpen: true,
                      type: 'delete-job',
                      itemId: j.id,
                      itemTitle: j.title || 'Job Analysis'
                    })}
                    className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer self-end sm:self-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Job Scan
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. DANGER ZONE TAB */}
      {activeTab === 'danger' && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 text-rose-800">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-rose-950">Destructive Actions & Permanent Erasure</h2>
              <p className="text-xs text-rose-700">Actions taken in this section are irreversible and permanently wipe data from Cloud Firestore.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-white border border-rose-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <h3 className="font-bold text-slate-900 text-sm">Delete All Resumes</h3>
              <p className="text-xs text-slate-500">
                Permanently delete all stored resumes, candidate profiles, and tailored outputs.
              </p>
              <button
                onClick={() => setConfirmModal({ isOpen: true, type: 'delete-all-resumes' })}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                Delete All Resumes
              </button>
            </div>

            <div className="bg-white border border-rose-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <h3 className="font-bold text-slate-900 text-sm">Delete Account & Erase All Data</h3>
              <p className="text-xs text-slate-500">
                Permanently delete user profile, resumes, job scans, and tailored application records.
              </p>
              <button
                onClick={() => setConfirmModal({ isOpen: true, type: 'delete-account' })}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL DIALOG */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                onClick={() => setConfirmModal({ isOpen: false, type: null })}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {confirmModal.type === 'delete-resume' && 'Delete Resume?'}
                {confirmModal.type === 'delete-job' && 'Delete Job Analysis?'}
                {confirmModal.type === 'delete-all-resumes' && 'Delete ALL Stored Resumes?'}
                {confirmModal.type === 'delete-account' && 'Permanently Delete Account?'}
              </h3>
              
              <p className="text-xs text-slate-600 leading-relaxed">
                {confirmModal.type === 'delete-resume' && (
                  <>Are you sure you want to delete <strong className="text-slate-900">&ldquo;{confirmModal.itemTitle}&rdquo;</strong>? This will permanently delete its Firestore record and associated tailored analyses.</>
                )}
                {confirmModal.type === 'delete-job' && (
                  <>Are you sure you want to delete <strong className="text-slate-900">&ldquo;{confirmModal.itemTitle}&rdquo;</strong>? This will permanently remove this job description analysis.</>
                )}
                {confirmModal.type === 'delete-all-resumes' && (
                  <>Are you sure you want to delete <strong>ALL stored resumes</strong>? This action cannot be undone.</>
                )}
                {confirmModal.type === 'delete-account' && (
                  <>This action will permanently delete your account profile, all uploaded resumes, job analyses, and tailored applications from Firestore.</>
                )}
              </p>
            </div>

            {/* Type DELETE to confirm input for Account Deletion */}
            {confirmModal.type === 'delete-account' && (
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Type <span className="font-mono text-rose-600 font-bold">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmInputText}
                  onChange={(e) => setConfirmInputText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmModal({ isOpen: false, type: null })}
                disabled={actionLoading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              {confirmModal.type === 'delete-resume' && (
                <button
                  onClick={() => confirmModal.itemId && handleConfirmDeleteResume(confirmModal.itemId)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Trash2 className="w-4 h-4" />}
                  Confirm Delete
                </button>
              )}

              {confirmModal.type === 'delete-job' && (
                <button
                  onClick={() => confirmModal.itemId && handleConfirmDeleteJob(confirmModal.itemId)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Trash2 className="w-4 h-4" />}
                  Confirm Delete
                </button>
              )}

              {confirmModal.type === 'delete-all-resumes' && (
                <button
                  onClick={handleConfirmDeleteAllResumes}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Trash2 className="w-4 h-4" />}
                  Delete All Resumes
                </button>
              )}

              {confirmModal.type === 'delete-account' && (
                <button
                  onClick={handleConfirmDeleteAccount}
                  disabled={actionLoading || confirmInputText.trim().toUpperCase() !== 'DELETE'}
                  className={`px-4 py-2 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                    confirmInputText.trim().toUpperCase() === 'DELETE'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <AlertTriangle className="w-4 h-4" />}
                  Delete Account Now
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
