import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { 
  UserDocument, 
  ResumeDocument, 
  JobDocument, 
  ApplicationDocument, 
  ResumeAnalysis, 
  JobAnalysis, 
  MatchReport, 
  OptimizedResume, 
  ValidationReport,
  UserProfile 
} from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Save or sync User Profile
export async function syncUserProfile(user: UserProfile): Promise<UserDocument> {
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    const existingDoc = await getDoc(userRef);

    const userData: UserDocument = {
      uid: user.uid,
      name: user.displayName || user.email.split('@')[0] || 'Candidate',
      email: user.email,
      createdAt: existingDoc.exists() && existingDoc.data().createdAt ? existingDoc.data().createdAt : new Date().toISOString(),
      photoURL: user.photoURL || ''
    };

    await setDoc(userRef, userData, { merge: true });
    return userData;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Save or update Resume
export async function saveResumeDoc(
  ownerId: string, 
  name: string, 
  parsedResume: ResumeAnalysis, 
  existingId?: string
): Promise<ResumeDocument> {
  const resumeId = existingId || `resume_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `resumes/${resumeId}`;
  const now = new Date().toISOString();

  const resumeData: ResumeDocument = {
    id: resumeId,
    ownerId,
    name: name || 'Uploaded Resume',
    parsedResume,
    createdAt: now,
    updatedAt: now
  };

  try {
    await setDoc(doc(db, 'resumes', resumeId), resumeData, { merge: true });
    return resumeData;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Fetch Resumes for owner
export async function fetchUserResumes(ownerId: string): Promise<ResumeDocument[]> {
  const path = 'resumes';
  try {
    const q = query(collection(db, 'resumes'), where('ownerId', '==', ownerId));
    const snapshot = await getDocs(q);
    const resumes: ResumeDocument[] = [];
    snapshot.forEach(docSnap => {
      resumes.push({ id: docSnap.id, ...docSnap.data() } as ResumeDocument);
    });
    return resumes.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

// Delete Resume
export async function deleteResumeDoc(id: string): Promise<void> {
  const path = `resumes/${id}`;
  try {
    await deleteDoc(doc(db, 'resumes', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Save or update Job Analysis
export async function saveJobDoc(
  ownerId: string, 
  title: string, 
  description: string, 
  analysis: JobAnalysis, 
  existingId?: string
): Promise<JobDocument> {
  const jobId = existingId || `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `jobs/${jobId}`;
  const now = new Date().toISOString();

  const jobData: JobDocument = {
    id: jobId,
    ownerId,
    title: title || analysis.jobTitle || 'Target Job',
    description: description || '',
    analysis,
    createdAt: now,
    updatedAt: now
  };

  try {
    await setDoc(doc(db, 'jobs', jobId), jobData, { merge: true });
    return jobData;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Fetch Job Analyses for owner
export async function fetchUserJobs(ownerId: string): Promise<JobDocument[]> {
  const path = 'jobs';
  try {
    const q = query(collection(db, 'jobs'), where('ownerId', '==', ownerId));
    const snapshot = await getDocs(q);
    const jobs: JobDocument[] = [];
    snapshot.forEach(docSnap => {
      jobs.push({ id: docSnap.id, ...docSnap.data() } as JobDocument);
    });
    return jobs.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

// Delete Job
export async function deleteJobDoc(id: string): Promise<void> {
  const path = `jobs/${id}`;
  try {
    await deleteDoc(doc(db, 'jobs', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Save or update Application
export async function saveApplicationDoc(
  ownerId: string,
  resumeId: string,
  jobId: string,
  matchAnalysis: MatchReport,
  optimizedResume: OptimizedResume,
  validation: ValidationReport,
  extraData?: {
    id?: string;
    title?: string;
    jobTitle?: string;
    company?: string;
    resumeFileName?: string;
    jobDescriptionText?: string;
    jobAnalysis?: JobAnalysis;
    resumeAnalysis?: ResumeAnalysis;
  }
): Promise<ApplicationDocument> {
  const appId = extraData?.id || `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `applications/${appId}`;
  const now = new Date().toISOString();

  const applicationData: ApplicationDocument = {
    id: appId,
    ownerId,
    resumeId,
    jobId,
    matchAnalysis,
    optimizedResume,
    validation,
    createdAt: now,
    updatedAt: now,
    title: extraData?.title || extraData?.jobTitle || 'Target Role Application',
    jobTitle: extraData?.jobTitle || 'Target Role',
    company: extraData?.company || 'Target Company',
    resumeFileName: extraData?.resumeFileName || 'Resume.pdf',
    jobDescriptionText: extraData?.jobDescriptionText || '',
    jobAnalysis: extraData?.jobAnalysis,
    resumeAnalysis: extraData?.resumeAnalysis
  };

  try {
    await setDoc(doc(db, 'applications', appId), applicationData, { merge: true });
    return applicationData;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Fetch Applications for owner
export async function fetchUserApplications(ownerId: string): Promise<ApplicationDocument[]> {
  const path = 'applications';
  try {
    const q = query(collection(db, 'applications'), where('ownerId', '==', ownerId));
    const snapshot = await getDocs(q);
    const apps: ApplicationDocument[] = [];
    snapshot.forEach(docSnap => {
      apps.push({ id: docSnap.id, ...docSnap.data() } as ApplicationDocument);
    });
    return apps.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

// Delete Application
export async function deleteApplicationDoc(id: string): Promise<void> {
  const path = `applications/${id}`;
  try {
    await deleteDoc(doc(db, 'applications', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Delete Individual Resume and its associated applications and analyses
export async function deleteIndividualResume(resumeId: string, ownerId: string): Promise<void> {
  const path = `resumes/${resumeId}`;
  try {
    // 1. Delete resume doc
    await deleteDoc(doc(db, 'resumes', resumeId));

    // 2. Query and delete any applications linked to this resumeId
    const appQuery = query(
      collection(db, 'applications'), 
      where('ownerId', '==', ownerId)
    );
    const appSnap = await getDocs(appQuery);
    const deletePromises: Promise<void>[] = [];
    
    appSnap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.resumeId === resumeId || docSnap.id === resumeId) {
        deletePromises.push(deleteDoc(doc(db, 'applications', docSnap.id)));
      }
    });

    await Promise.all(deletePromises);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Delete Individual Job Analysis and its associated applications
export async function deleteIndividualJob(jobId: string, ownerId: string): Promise<void> {
  const path = `jobs/${jobId}`;
  try {
    // 1. Delete job doc
    await deleteDoc(doc(db, 'jobs', jobId));

    // 2. Delete linked applications
    const appQuery = query(
      collection(db, 'applications'), 
      where('ownerId', '==', ownerId)
    );
    const appSnap = await getDocs(appQuery);
    const deletePromises: Promise<void>[] = [];
    
    appSnap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.jobId === jobId) {
        deletePromises.push(deleteDoc(doc(db, 'applications', docSnap.id)));
      }
    });

    await Promise.all(deletePromises);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Bulk delete ALL user resumes & associated applications
export async function deleteAllUserResumes(ownerId: string): Promise<void> {
  try {
    const resumes = await fetchUserResumes(ownerId);
    const apps = await fetchUserApplications(ownerId);

    const deletePromises: Promise<void>[] = [];
    resumes.forEach(r => {
      deletePromises.push(deleteDoc(doc(db, 'resumes', r.id)));
    });
    apps.forEach(a => {
      deletePromises.push(deleteDoc(doc(db, 'applications', a.id)));
    });

    await Promise.all(deletePromises);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `resumes/bulk_${ownerId}`);
  }
}

// Bulk delete ALL user job analyses
export async function deleteAllUserJobs(ownerId: string): Promise<void> {
  try {
    const jobs = await fetchUserJobs(ownerId);
    const deletePromises = jobs.map(j => deleteDoc(doc(db, 'jobs', j.id)));
    await Promise.all(deletePromises);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `jobs/bulk_${ownerId}`);
  }
}

// Complete Account and Data Wipe
export async function deleteUserAccountAndData(ownerId: string): Promise<void> {
  try {
    // 1. Delete all resumes, jobs, applications
    await deleteAllUserResumes(ownerId);
    await deleteAllUserJobs(ownerId);

    // 2. Delete user profile doc in users collection
    await deleteDoc(doc(db, 'users', ownerId));

    // 3. Delete Firebase Auth user if logged in
    if (auth.currentUser && auth.currentUser.uid === ownerId) {
      await auth.currentUser.delete();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${ownerId}`);
  }
}

