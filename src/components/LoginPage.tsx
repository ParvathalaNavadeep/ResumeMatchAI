import React, { useState } from 'react';
import { PageType, UserProfile } from '../types';
import { signInWithGoogle } from '../lib/firebase';
import { ShieldCheck, LogIn, Lock, CheckCircle2, AlertCircle, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import firebaseConfigData from '../../firebase-applet-config.json';

interface LoginPageProps {
  setCurrentPage: (page: PageType) => void;
  currentUser: UserProfile | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  setCurrentPage,
  currentUser
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfigValid = Boolean(firebaseConfigData && firebaseConfigData.apiKey && firebaseConfigData.projectId);

  const handleGoogleSignIn = async () => {
    if (!isConfigValid) {
      setError('Firebase configuration is missing or incomplete. Please ensure firebase-applet-config.json contains valid apiKey and projectId.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      setCurrentPage('dashboard');
    } catch (err: any) {
      console.error('Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completing auth. Please try again.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Sign-in request was cancelled. Please try again.');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to sign in with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">You Are Already Signed In</h1>
        <p className="text-sm text-slate-600">
          Signed in as <strong>{currentUser.email}</strong>
        </p>
        <div className="pt-4 flex justify-center gap-3">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => setCurrentPage('account')}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm rounded-xl transition-colors cursor-pointer"
          >
            View Account Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      
      {/* Configuration Warning if missing */}
      {!isConfigValid && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 text-amber-950 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="font-bold text-sm text-amber-900 block mb-1">Firebase Configuration Required</strong>
            Firebase environment variables or config settings are missing. To enable authentication and cloud persistence, ensure <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">firebase-applet-config.json</code> is provisioned with valid API credentials.
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xl space-y-8 text-center">
        
        <div className="space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Sign In to 9th Resume
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Access your private, encrypted ATS workspace. Save your target job analyses, resume versions, and 100% fact-checked applications.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-800 text-xs text-left flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-bold block mb-0.5">Authentication Error</strong>
              {error}
            </div>
          </div>
        )}

        {/* Google Sign In Button */}
        <div className="space-y-4 max-w-sm mx-auto">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || !isConfigValid}
            className={`w-full py-3.5 px-5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-md flex items-center justify-center gap-3 transition-all cursor-pointer ${
              loading || !isConfigValid ? 'opacity-60 cursor-not-allowed' : 'hover:border-slate-400 hover:shadow-lg'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                Signing in with Google...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-slate-400" />
            Protected by Firebase Auth & Firestore Rules
          </p>
        </div>

        {/* Security Assurance List */}
        <div className="pt-6 border-t border-slate-100 text-left space-y-2.5 max-w-md mx-auto text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span><strong>Owner-Only Security Rules:</strong> No other user can ever read or modify your saved records.</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span><strong>Zero Secrets Stored:</strong> Gemini API keys stay securely server-side only.</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span><strong>Cross-Device Persistence:</strong> Access your resumes, job analyses, and match reports anywhere.</span>
          </div>
        </div>

      </div>

      {/* Guest Demo Callout */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="font-extrabold text-sm flex items-center justify-center sm:justify-start gap-1.5 text-blue-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Want to test without signing in?
          </h3>
          <p className="text-xs text-slate-300">
            You can test the interactive ATS optimizer and sample job match reports in guest demo mode.
          </p>
        </div>
        <button
          onClick={() => setCurrentPage('create')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
        >
          Try Guest Demo
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
