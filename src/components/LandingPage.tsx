import React from 'react';
import { PageType } from '../types';
import { 
  ShieldCheck, 
  SearchCode, 
  FileCheck2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  FileText, 
  Target, 
  Lock 
} from 'lucide-react';

interface LandingPageProps {
  setCurrentPage: (page: PageType) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setCurrentPage }) => {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative max-w-5xl mx-auto px-4 pt-16 pb-20 sm:px-6 lg:px-8 text-center">
        
        {/* Anti-Fabrication Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/90 border border-blue-800/80 text-blue-300 text-xs font-semibold mb-8 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>Strict Factual Accuracy Engine — Zero Fabricated Skills Guarantee</span>
        </div>

        {/* Required Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.12]">
          Build a Resume That Matches the Job
        </h1>

        {/* Required Subheadline */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Analyze the job description, identify the skills that matter, and optimize your resume using only your real experience.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
          <button
            onClick={() => setCurrentPage('create')}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            Create My Resume
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href="#demo-section"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-semibold text-base transition-colors flex items-center justify-center"
          >
            View Live Demo
          </a>
        </div>

        {/* Factuality Pledge Banner */}
        <div className="max-w-3xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-left shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">
                The 9th Resume Factual Integrity Standard
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Most AI resume tools blindly insert buzzwords or invent experience you don't have, putting your interview credibility at risk. 9th Resume verifies every single word against your original upload. If a skill is missing, we highlight it as a gap instead of fabricating it.
              </p>
            </div>
          </div>
        </div>

      </section>

      {/* Limited Demo Information Section for Unauthenticated Visitors */}
      <section id="demo-section" className="bg-slate-900 border-t border-slate-800 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-700/50 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Limited Guest Demo Preview
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Sample ATS Analysis & Fact-Checked Match
            </h2>
            <p className="text-slate-400 text-sm">
              Explore how 9th Resume breaks down job descriptions and matches candidate resumes without exaggerations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Demo Card 1: Job Analysis */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <SearchCode className="w-4 h-4 text-blue-400" />
                  Target Job Analysis
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">Sample</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Staff Software Engineer</h3>
                <p className="text-xs text-slate-400">Cloud Infrastructure & React Systems</p>
              </div>
              <div className="space-y-2 pt-1 text-xs">
                <div className="text-slate-300 font-semibold text-[11px]">Key Required Skills Identified:</div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-800/60 text-blue-300 font-mono text-[10px]">TypeScript</span>
                  <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-800/60 text-blue-300 font-mono text-[10px]">React 19</span>
                  <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-800/60 text-blue-300 font-mono text-[10px]">Distributed Systems</span>
                  <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-800/60 text-blue-300 font-mono text-[10px]">GraphQL</span>
                </div>
              </div>
            </div>

            {/* Demo Card 2: Extracted Resume */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Resume Fact Extraction
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">Verified</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Alex Morgan</h3>
                <p className="text-xs text-slate-400">7+ Years Full Stack Architecture</p>
              </div>
              <div className="space-y-2 pt-1 text-xs">
                <div className="text-slate-300 font-semibold text-[11px]">Extracted Experience Quote:</div>
                <p className="text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 italic">
                  "Architected real-time microservices in TypeScript serving 50k+ active users with 99.99% uptime."
                </p>
              </div>
            </div>

            {/* Demo Card 3: Match & Factuality Audit */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-amber-400" />
                  ATS Match Score
                </span>
                <span className="text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">88% Match</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-300 font-semibold">
                  <span>Factuality Audit:</span>
                  <span className="text-emerald-400 font-bold">100% Safe (0 Fabrications)</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5 text-emerald-300 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Matched: TypeScript, React, System Design</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-300 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Identified Gap: Kubernetes (Flagged, Not Fabricated)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => setCurrentPage('create')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg flex items-center gap-2 mx-auto cursor-pointer transition-all"
            >
              Test Optimization Demo
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-slate-900/60 border-t border-slate-800/80 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
              Four Steps to an Honest, ATS-Tailored Application
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              A transparent workflow designed to maximize job match score without compromising integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Step 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative">
              <div className="w-8 h-8 rounded-lg bg-blue-950 text-blue-400 font-mono font-bold text-sm flex items-center justify-center mb-4 border border-blue-800/50">
                01
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Upload PDF Resume
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Upload your existing master resume. Our parser extracts clean plain text, preserving exact evidence quotes for every skill.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative">
              <div className="w-8 h-8 rounded-lg bg-blue-950 text-blue-400 font-mono font-bold text-sm flex items-center justify-center mb-4 border border-blue-800/50">
                02
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <SearchCode className="w-4 h-4 text-amber-400" />
                Analyze Job Requirements
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Paste the job description. We extract required vs preferred skills, technologies, tools, domain keywords, and acronyms.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative">
              <div className="w-8 h-8 rounded-lg bg-blue-950 text-blue-400 font-mono font-bold text-sm flex items-center justify-center mb-4 border border-blue-800/50">
                03
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                3-Way Requirement Match
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Every requirement is strictly classified as <span className="text-emerald-400 font-semibold">MATCHED</span>, <span className="text-amber-400 font-semibold">PARTIAL</span>, or <span className="text-rose-400 font-semibold">NOT FOUND</span> with evidence snippets.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative">
              <div className="w-8 h-8 rounded-lg bg-blue-950 text-blue-400 font-mono font-bold text-sm flex items-center justify-center mb-4 border border-blue-800/50">
                04
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-indigo-400" />
                Audit & Export PDF
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Review your tailored ATS resume, pass a separate automated factuality audit, edit as needed, and download a single-column PDF.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} 9th Resume — ATS Job Match & Factual Optimization</p>
          <p className="text-slate-400 font-mono">Optimization score is an analytical estimate — not a guaranteed ATS outcome.</p>
        </div>
      </footer>
    </div>
  );
};
