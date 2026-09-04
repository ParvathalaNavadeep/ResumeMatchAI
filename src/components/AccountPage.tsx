import React, { useState, useEffect } from 'react';
import { PageType, UserProfile } from '../types';
import { logoutUser } from '../lib/firebase';
import { fetchUserResumes, fetchUserJobs, fetchUserApplications } from '../lib/firestoreService';
import { 
  User, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  LogOut, 
  FileText, 
  SearchCode, 
  Briefcase, 
  Key, 
  Database, 
  Trash2, 
  Loader2, 
  Check, 
  AlertCircle 
} from 'lucide-react';

interface AccountPageProps {
  currentUser: UserProfile | null;
  setCurrentPage: (page: PageType) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  currentUser,
  setCurrentPage
}) => {
  const [stats, setStats] = useState({
    resumesCount: 0,
    jobsCount: 0,
    applicationsCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [copiedUid, setCopiedUid] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (currentUser?.uid) {
      loadStats(currentUser.uid);
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const loadStats = async (uid: string) => {
    setLoading(true);
    try {
      const [resumes, jobs, apps] = await Promise.all([
        fetchUserResumes(uid),
        fetchUserJobs(uid),
        fetchUserApplications(uid)
      ]);
      setStats({
        resumesCount: resumes.length,
        jobsCount: jobs.length,
        applicationsCount: apps.length
      });
    } catch (err) {
      console.warn('Error loading account statistics from Firestore:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUid = () => {
    if (currentUser?.uid) {
      navigator.clipboard.writeText(currentUser.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await logoutUser();
      setCurrentPage('landing');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setSigningOut(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Sign In Required</h1>
        <p className="text-sm text-slate-600 max-w-sm mx-auto">
          You must be signed in with your Google account to view your account profile and private records.
        </p>
        <button
          onClick={() => setCurrentPage('login')}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  const formattedCreatedAt = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Account Profile Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {currentUser.photoURL ? (
            <img 
              src={currentUser.photoURL} 
              alt={currentUser.displayName} 
              className="w-20 h-20 rounded-2xl ring-4 ring-blue-500/10 object-cover shadow-sm"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center text-2xl shadow-md">
              {currentUser.displayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {currentUser.displayName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Verified User
              </span>
            </div>

            <p className="text-xs text-slate-600 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {currentUser.email}
            </p>

            <p className="text-[11px] text-slate-500 font-mono flex items-center justify-center sm:justify-start gap-1.5 pt-0.5">
              <Key className="w-3 h-3 text-slate-400" />
              UID: {currentUser.uid}
              <button
                type="button"
                onClick={handleCopyUid}
                className="ml-1 text-blue-600 hover:underline cursor-pointer font-sans text-[10px] font-bold"
              >
                {copiedUid ? 'Copied!' : 'Copy'}
              </button>
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={signingOut}
          className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer shrink-0 shadow-2xs"
        >
          {signingOut ? <Loader2 className="w-4 h-4 animate-spin text-rose-600" /> : <LogOut className="w-4 h-4 text-rose-600" />}
          {signingOut ? 'Signing Out...' : 'Sign Out'}
        </button>
      </div>

      {/* Account Stats Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : stats.resumesCount}
            </div>
            <div className="text-xs font-bold text-slate-600">Saved Resumes</div>
            <div className="text-[10px] text-slate-400">Stored in Firestore</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <SearchCode className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : stats.jobsCount}
            </div>
            <div className="text-xs font-bold text-slate-600">Job Analyses</div>
            <div className="text-[10px] text-slate-400">Target Role Scans</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : stats.applicationsCount}
            </div>
            <div className="text-xs font-bold text-slate-600">Applications</div>
            <div className="text-[10px] text-slate-400">Fact-Checked & Tailored</div>
          </div>
        </div>
      </div>

      {/* Security & Data Privacy Panel */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5">
          <Database className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">Data Security & Firestore Isolation</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              Owner-Only Document Access
            </div>
            <p className="leading-relaxed text-slate-600">
              Firestore security rules restrict all reads, updates, and deletes to records matching <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-[11px]">ownerId == {currentUser.uid}</code>.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              Zero Secrets Stored
            </div>
            <p className="leading-relaxed text-slate-600">
              Gemini API keys, service tokens, and confidential model parameters remain strictly isolated inside the server-side proxy environment.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Go to My Applications
          </button>
        </div>
      </div>

    </div>
  );
};
