export type PageType = 
  | 'landing' 
  | 'dashboard' 
  | 'create' 
  | 'job-analysis' 
  | 'resume-analysis' 
  | 'match-report' 
  | 'resume-editor' 
  | 'resume-preview' 
  | 'settings'
  | 'login'
  | 'account';

export interface UserDocument {
  uid: string;
  name: string;
  email: string;
  createdAt: string;
  photoURL?: string;
}

export interface ResumeDocument {
  id?: string;
  ownerId: string;
  name: string;
  parsedResume: ResumeAnalysis;
  createdAt: string;
  updatedAt: string;
}

export interface JobDocument {
  id?: string;
  ownerId: string;
  title: string;
  description: string;
  analysis: JobAnalysis;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationDocument {
  id?: string;
  ownerId: string;
  resumeId: string;
  jobId: string;
  matchAnalysis: MatchReport;
  optimizedResume: OptimizedResume;
  validation: ValidationReport;
  createdAt: string;
  updatedAt: string;
  // Extra helper fields for UI display
  title?: string;
  jobTitle?: string;
  company?: string;
  resumeFileName?: string;
  jobDescriptionText?: string;
  jobAnalysis?: JobAnalysis;
  resumeAnalysis?: ResumeAnalysis;
}


export interface SkillKeyword {
  name: string;
  normalizedName: string;
  importance: string; // 'REQUIRED' | 'PREFERRED' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  synonyms: string[];
}

export interface ClassifiedRequirement {
  item: string;
  category: 'required' | 'preferred' | 'contextual';
  type: 'skill' | 'technology' | 'tool' | 'experience' | 'education' | 'certification' | 'responsibility' | 'domain';
}

export interface AcronymPair {
  term: string;
  expansion: string;
}

export interface JobAnalysis {
  jobTitle: string;
  company?: string;
  seniority: string;
  yearsOfExperience: string;
  requiredSkills: (string | SkillKeyword)[];
  preferredSkills: (string | SkillKeyword)[];
  technologies: (string | SkillKeyword)[];
  tools: (string | SkillKeyword)[];
  responsibilities: string[];
  educationRequirements: string[];
  certificationRequirements: string[];
  softSkills: string[];
  domainKnowledge: string[];
  keywords: SkillKeyword[];
  importantKeywords?: string[];
  importantPhrases: string[];
  acronyms: AcronymPair[];
  classifiedRequirements?: ClassifiedRequirement[];
}

export interface SkillWithEvidence {
  name: string;
  category: string;
  evidenceFromResume: string;
}

export interface WorkExperienceItem {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  technologiesUsed: string[];
  link?: string;
}

export interface EducationItem {
  id: string;
  level?: string;
  degree?: string;
  specialization?: string;
  fieldOfStudy?: string; // Kept for backward compatibility
  institution?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  graduationYear?: string;
  cgpa?: string;
  percentage?: string;
  marksObtained?: string;
  totalMarks?: string;
  board?: string;
  honors?: string;
  additionalDetails?: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedIn: string;
  portfolio: string;
}

export interface ResumeAnalysis {
  personal: ContactInfo;
  contactInfo: ContactInfo;
  summary: string;
  skills: SkillWithEvidence[];
  experience: WorkExperienceItem[];
  workExperience: WorkExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
}

export type MatchStatus = 'MATCHED' | 'PARTIALLY_MATCHED' | 'NOT_FOUND';

export interface RequirementMatch {
  requirement: string;
  importance?: string;
  status: MatchStatus;
  candidateEvidence?: string[];
  supportingEvidence?: string;
  explanation?: string;
  overlapExplanation?: string;
  notFoundStatement?: string;
  category?: 'required' | 'preferred' | 'contextual';
}

export interface KeywordOpportunity {
  keyword: string;
  importance: string; // 'HIGH' | 'MEDIUM' | 'LOW';
  reasonItMatters: string;
  evidenceFound: boolean;
  evidenceSnippet?: string;
  recommendation: string;
}

export interface MatchReport {
  skillsMatch: number;
  keywordMatch: number;
  experienceMatch: number;
  responsibilityMatch: number;
  educationMatch: number;
  overallMatch: number;
  overallMatchScore?: number;
  skillsMatchScore?: number;
  keywordMatchScore?: number;
  experienceMatchScore?: number;
  responsibilityMatchScore?: number;
  educationMatchScore?: number;
  scoreNote: string;
  requirements: RequirementMatch[];
  keywordOpportunities: KeywordOpportunity[];
  strongMatches: string[];
  missingRequirements: string[];
  partialMatches: string[];
  recommendations: string[];
}

export type ResumeTemplateId = 'ats-classic' | 'modern-professional' | 'technical' | 'resumematch-professional';

export interface ResumeTemplateOption {
  id: ResumeTemplateId;
  name: string;
  description: string;
  targetRoles: string;
  badge: string;
}

export interface SkillCategoryGroup {
  category: string;
  items: string[];
}

export interface OptimizedResume {
  templateId?: ResumeTemplateId;
  contactInfo: ContactInfo;
  personal?: ContactInfo;
  summary: string;
  skills: SkillCategoryGroup[];
  experience: WorkExperienceItem[];
  workExperience?: WorkExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
}

export interface UnsupportedClaimWarning {
  type: string;
  claim: string;
  sourceProblem: string;
  recommendation: string;
}

export interface ValidationReport {
  safeToPublish: boolean;
  fabricationsDetected: boolean;
  unsupportedClaims: UnsupportedClaimWarning[];
  warnings: UnsupportedClaimWarning[];
  verifiedFactsCount: number;
  flaggedCount: number;
  isValid?: boolean;
}

export interface ApplicationRecord {
  id: string;
  userId: string;
  title: string;
  jobTitle: string;
  company: string;
  createdAt: string;
  updatedAt: string;
  resumeFileName: string;
  resumeText: string;
  jobDescriptionText: string;
  jobAnalysis: JobAnalysis;
  resumeAnalysis: ResumeAnalysis;
  matchReport: MatchReport;
  optimizedResume: OptimizedResume;
  validationReport: ValidationReport;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}
