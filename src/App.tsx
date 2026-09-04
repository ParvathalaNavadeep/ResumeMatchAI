import React, { useState, useEffect } from 'react';
import { PageType, ApplicationRecord, UserProfile, OptimizedResume, ApplicationDocument } from './types';
import { auth, onAuthStateChanged } from './lib/firebase';
import { 
  syncUserProfile, 
  saveResumeDoc, 
  saveJobDoc, 
  saveApplicationDoc, 
  fetchUserApplications, 
  deleteApplicationDoc 
} from './lib/firestoreService';

import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { DashboardPage } from './components/DashboardPage';
import { CreateResumePage } from './components/CreateResumePage';
import { JobAnalysisPage } from './components/JobAnalysisPage';
import { ResumeAnalysisPage } from './components/ResumeAnalysisPage';
import { MatchReportPage } from './components/MatchReportPage';
import { ResumeEditorPage } from './components/ResumeEditorPage';
import { ResumePreviewPage } from './components/ResumePreviewPage';
import { SettingsPage } from './components/SettingsPage';
import { LoginPage } from './components/LoginPage';
import { AccountPage } from './components/AccountPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('landing');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [activeApplication, setActiveApplication] = useState<ApplicationRecord | null>(null);

  // Load local applications on initial mount as fallback
  useEffect(() => {
    const savedLocal = localStorage.getItem('9th_resume_applications');
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setApplications(parsed);
          setActiveApplication(parsed[0]);
        }
      } catch (err) {
        console.warn('Failed to parse local stored applications:', err);
      }
    }
  }, []);

  // Sync applications to localStorage
  useEffect(() => {
    if (applications.length > 0) {
      localStorage.setItem('9th_resume_applications', JSON.stringify(applications));
    } else {
      localStorage.removeItem('9th_resume_applications');
    }
  }, [applications]);

  // Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(true);
      if (user) {
        const profile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'Candidate',
          photoURL: user.photoURL || undefined
        };
        setCurrentUser(profile);

        // Sync User document to Firestore: users/{uid} -> { uid, name, email, createdAt }
        try {
          await syncUserProfile(profile);
          await loadUserApplicationsFromFirestore(user.uid);
        } catch (err) {
          console.warn('Error syncing user profile or applications from Firestore:', err);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load saved applications from Firestore
  const loadUserApplicationsFromFirestore = async (uid: string) => {
    try {
      const docs = await fetchUserApplications(uid);
      const loaded: ApplicationRecord[] = docs.map(d => ({
        id: d.id || `app_${Date.now()}`,
        userId: d.ownerId,
        title: d.title || 'Job Application',
        jobTitle: d.jobTitle || 'Target Role',
        company: d.company || 'Target Employer',
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        resumeFileName: d.resumeFileName || 'Resume.pdf',
        resumeText: d.jobDescriptionText || '',
        jobDescriptionText: d.jobDescriptionText || '',
        jobAnalysis: d.jobAnalysis || d.matchAnalysis as any,
        resumeAnalysis: d.resumeAnalysis || {} as any,
        matchReport: d.matchAnalysis,
        optimizedResume: d.optimizedResume,
        validationReport: d.validation
      }));

      if (loaded.length > 0) {
        setApplications(loaded);
        if (!activeApplication) {
          setActiveApplication(loaded[0]);
        }
      }
    } catch (err) {
      console.warn('Error loading applications from Firestore:', err);
    }
  };

  // Handle completed AI optimization & save to Firestore collections (users, resumes, jobs, applications)
  const handleCompleteOptimization = async (record: ApplicationRecord) => {
    const finalRecord = {
      ...record,
      userId: currentUser?.uid || 'guest'
    };

    const updatedList = [finalRecord, ...applications.filter(a => a.id !== finalRecord.id)];
    setApplications(updatedList);
    setActiveApplication(finalRecord);

    // If authenticated, persist to Firestore collections
    if (currentUser?.uid) {
      try {
        const ownerId = currentUser.uid;

        // 1. Save Resume Document (resumes)
        const resumeDoc = await saveResumeDoc(
          ownerId,
          record.resumeFileName || 'Candidate Resume',
          record.resumeAnalysis
        );

        // 2. Save Job Document (jobs)
        const jobDoc = await saveJobDoc(
          ownerId,
          record.jobTitle || 'Target Role',
          record.jobDescriptionText || '',
          record.jobAnalysis
        );

        // 3. Save Application Document (applications)
        await saveApplicationDoc(
          ownerId,
          resumeDoc.id || 'resume_1',
          jobDoc.id || 'job_1',
          record.matchReport,
          record.optimizedResume,
          record.validationReport,
          {
            id: record.id,
            title: record.title,
            jobTitle: record.jobTitle,
            company: record.company,
            resumeFileName: record.resumeFileName,
            jobDescriptionText: record.jobDescriptionText,
            jobAnalysis: record.jobAnalysis,
            resumeAnalysis: record.resumeAnalysis
          }
        );
      } catch (err) {
        console.warn('Failed to save full application stack to Firestore:', err);
      }
    }

    setCurrentPage('match-report');
  };

  // Select application from dashboard
  const handleSelectApplication = (appRecord: ApplicationRecord, targetPage: PageType = 'match-report') => {
    setActiveApplication(appRecord);
    setCurrentPage(targetPage);
  };

  // Delete application
  const handleDeleteApplication = async (id: string) => {
    setApplications(prev => prev.filter(a => a.id !== id));
    if (activeApplication?.id === id) {
      setActiveApplication(null);
    }

    if (currentUser?.uid) {
      try {
        await deleteApplicationDoc(id);
      } catch (err) {
        console.warn('Failed to delete application from Firestore:', err);
      }
    }
  };

  // Save edited resume
  const handleSaveResume = async (updatedOptimizedResume: OptimizedResume) => {
    if (!activeApplication) return;

    const updatedRecord: ApplicationRecord = {
      ...activeApplication,
      optimizedResume: updatedOptimizedResume,
      updatedAt: new Date().toISOString()
    };

    setActiveApplication(updatedRecord);
    setApplications(prev => prev.map(a => a.id === updatedRecord.id ? updatedRecord : a));

    if (currentUser?.uid) {
      try {
        await saveApplicationDoc(
          currentUser.uid,
          'resume_1',
          'job_1',
          updatedRecord.matchReport,
          updatedRecord.optimizedResume,
          updatedRecord.validationReport,
          {
            id: updatedRecord.id,
            title: updatedRecord.title,
            jobTitle: updatedRecord.jobTitle,
            company: updatedRecord.company,
            resumeFileName: updatedRecord.resumeFileName,
            jobDescriptionText: updatedRecord.jobDescriptionText,
            jobAnalysis: updatedRecord.jobAnalysis,
            resumeAnalysis: updatedRecord.resumeAnalysis
          }
        );
      } catch (err) {
        console.warn('Failed to update application in Firestore:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        currentUser={currentUser}
        hasActiveApplication={Boolean(activeApplication)}
      />

      <main className="flex-1">
        {currentPage === 'landing' && (
          <LandingPage setCurrentPage={setCurrentPage} />
        )}

        {currentPage === 'login' && (
          <LoginPage
            setCurrentPage={setCurrentPage}
            currentUser={currentUser}
          />
        )}

        {currentPage === 'account' && (
          <AccountPage
            currentUser={currentUser}
            setCurrentPage={setCurrentPage}
          />
        )}

        {currentPage === 'dashboard' && (
          <DashboardPage
            applications={applications}
            onSelectApplication={handleSelectApplication}
            onDeleteApplication={handleDeleteApplication}
            setCurrentPage={setCurrentPage}
            currentUser={currentUser}
          />
        )}

        {currentPage === 'create' && (
          <CreateResumePage
            onCompleteOptimization={handleCompleteOptimization}
            setCurrentPage={setCurrentPage}
          />
        )}

        {currentPage === 'job-analysis' && (
          <JobAnalysisPage
            jobAnalysis={activeApplication?.jobAnalysis || null}
            setCurrentPage={setCurrentPage}
          />
        )}

        {currentPage === 'resume-analysis' && (
          <ResumeAnalysisPage
            resumeAnalysis={activeApplication?.resumeAnalysis || null}
            setCurrentPage={setCurrentPage}
          />
        )}

        {currentPage === 'match-report' && (
          <MatchReportPage
            matchReport={activeApplication?.matchReport || null}
            jobAnalysis={activeApplication?.jobAnalysis || null}
            resumeAnalysis={activeApplication?.resumeAnalysis || null}
            validationReport={activeApplication?.validationReport || null}
            optimizedResume={activeApplication?.optimizedResume || null}
            setCurrentPage={setCurrentPage}
          />
        )}

        {currentPage === 'resume-editor' && (
          <ResumeEditorPage
            optimizedResume={activeApplication?.optimizedResume || null}
            validationReport={activeApplication?.validationReport || null}
            onSaveResume={handleSaveResume}
            setCurrentPage={setCurrentPage}
          />
        )}

        {currentPage === 'resume-preview' && (
          <ResumePreviewPage
            optimizedResume={activeApplication?.optimizedResume || null}
            setCurrentPage={setCurrentPage}
          />
        )}

        {currentPage === 'settings' && (
          <SettingsPage
            currentUser={currentUser}
            applications={applications}
            setCurrentPage={setCurrentPage}
            onRefreshApplications={() => {
              if (currentUser?.uid) {
                loadUserApplicationsFromFirestore(currentUser.uid);
              } else {
                setApplications([]);
                setActiveApplication(null);
                localStorage.removeItem('9th_resume_applications');
              }
            }}
          />
        )}
      </main>
    </div>
  );
}

