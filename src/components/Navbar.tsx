import React from 'react';
import { PageType, UserProfile } from '../types';
import { 
  PlusCircle, 
  LayoutDashboard, 
  SearchCode, 
  UserCheck, 
  BarChart3, 
  FileEdit, 
  Eye, 
  Settings, 
  LogIn, 
  LogOut, 
  ShieldCheck 
} from 'lucide-react';
import { logoutUser } from '../lib/firebase';

interface NavbarProps {
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
  currentUser: UserProfile | null;
  hasActiveApplication: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  setCurrentPage,
  currentUser,
  hasActiveApplication
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setCurrentPage('landing')} 
          className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs group-hover:bg-blue-500 transition-all duration-200">
            <ShieldCheck className="w-5 h-5 text-blue-100" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-1">
              Resume<span className="text-blue-400 font-bold">Match</span> <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-mono font-semibold border border-blue-800/80">AI</span>
            </span>
            <span className="text-[10px] text-slate-400 -mt-1 font-mono uppercase tracking-wider hidden sm:inline-block">
              Factual ATS Optimization
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold overflow-x-auto py-1 no-scrollbar">
          <button
            onClick={() => setCurrentPage('landing')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              currentPage === 'landing' 
                ? 'bg-slate-800 text-blue-400 font-bold shadow-2xs' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Home
          </button>

          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              currentPage === 'dashboard' 
                ? 'bg-slate-800 text-blue-400 font-bold shadow-2xs' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </button>

          <button
            onClick={() => setCurrentPage('create')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
              currentPage === 'create' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'bg-blue-600/90 hover:bg-blue-500 text-white shadow-2xs'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            New Optimization
          </button>

          {hasActiveApplication && (
            <div className="flex items-center gap-1 ml-1.5 pl-2 border-l border-slate-800">
              <button
                onClick={() => setCurrentPage('job-analysis')}
                title="Job Description Analysis"
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-[11px] transition-all cursor-pointer ${
                  currentPage === 'job-analysis' ? 'bg-slate-800 text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <SearchCode className="w-3.5 h-3.5" />
                Job Scan
              </button>

              <button
                onClick={() => setCurrentPage('resume-analysis')}
                title="Resume Extracted Profile"
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-[11px] transition-all cursor-pointer ${
                  currentPage === 'resume-analysis' ? 'bg-slate-800 text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Resume Scan
              </button>

              <button
                onClick={() => setCurrentPage('match-report')}
                title="ATS Match Report"
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-[11px] transition-all cursor-pointer ${
                  currentPage === 'match-report' ? 'bg-slate-800 text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                Match Report
              </button>

              <button
                onClick={() => setCurrentPage('resume-editor')}
                title="Resume Editor"
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-[11px] transition-all cursor-pointer ${
                  currentPage === 'resume-editor' ? 'bg-slate-800 text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileEdit className="w-3.5 h-3.5 text-emerald-400" />
                Editor
              </button>

              <button
                onClick={() => setCurrentPage('resume-preview')}
                title="ATS Preview & Download"
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-[11px] transition-all cursor-pointer ${
                  currentPage === 'resume-preview' ? 'bg-slate-800 text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                Preview
              </button>
            </div>
          )}
        </nav>

        {/* Right Side: Settings & Auth */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setCurrentPage('settings')}
            className={`p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer ${
              currentPage === 'settings' ? 'bg-slate-800 text-blue-400 ring-1 ring-slate-700' : ''
            }`}
            title="Application Settings"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2 border-l border-slate-800 pl-2 sm:pl-3">
              <button
                onClick={() => setCurrentPage('account')}
                className={`flex items-center gap-2 p-1 rounded-xl transition-all cursor-pointer ${
                  currentPage === 'account' ? 'bg-slate-800 ring-1 ring-blue-500' : 'hover:bg-slate-800/80'
                }`}
                title="Account Profile & Settings"
              >
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName} 
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg ring-1 ring-slate-700 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-700 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                    {currentUser.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden lg:inline text-xs font-semibold text-slate-200 max-w-[110px] truncate">
                  {currentUser.displayName}
                </span>
              </button>

              <button
                onClick={async () => {
                  await logoutUser();
                  setCurrentPage('landing');
                }}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCurrentPage('login')}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-100" />
              Sign In
            </button>
          )}
        </div>

      </div>

      {/* Mobile Secondary Quick Bar */}
      <div className="md:hidden bg-slate-950/80 border-t border-slate-800/80 px-3 py-1.5 flex items-center justify-between overflow-x-auto no-scrollbar gap-2 text-[11px] font-semibold text-slate-300">
        <button 
          onClick={() => setCurrentPage('landing')}
          className={`shrink-0 px-2.5 py-1 rounded-md ${currentPage === 'landing' ? 'bg-slate-800 text-blue-400' : ''}`}
        >
          Home
        </button>
        <button 
          onClick={() => setCurrentPage('dashboard')}
          className={`shrink-0 px-2.5 py-1 rounded-md flex items-center gap-1 ${currentPage === 'dashboard' ? 'bg-slate-800 text-blue-400' : ''}`}
        >
          <LayoutDashboard className="w-3 h-3" /> Dashboard
        </button>
        <button 
          onClick={() => setCurrentPage('create')}
          className={`shrink-0 px-2.5 py-1 rounded-md bg-blue-600 text-white flex items-center gap-1`}
        >
          <PlusCircle className="w-3 h-3" /> New Optimization
        </button>
        {hasActiveApplication && (
          <>
            <button 
              onClick={() => setCurrentPage('match-report')}
              className={`shrink-0 px-2 py-1 rounded-md ${currentPage === 'match-report' ? 'bg-slate-800 text-blue-400' : ''}`}
            >
              Match
            </button>
            <button 
              onClick={() => setCurrentPage('resume-editor')}
              className={`shrink-0 px-2 py-1 rounded-md ${currentPage === 'resume-editor' ? 'bg-slate-800 text-blue-400' : ''}`}
            >
              Editor
            </button>
            <button 
              onClick={() => setCurrentPage('resume-preview')}
              className={`shrink-0 px-2 py-1 rounded-md ${currentPage === 'resume-preview' ? 'bg-slate-800 text-blue-400' : ''}`}
            >
              Preview
            </button>
          </>
        )}
      </div>
    </header>
  );
};

