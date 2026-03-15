import type { ApplicationStatus } from "@/lib/constants";
import type {
  ResumeCertificationVisibilityConfig,
  ResumeEducationVisibilityConfig,
  ResumeProjectVisibilityConfig,
  ResumeSectionVisibilityConfig,
  ResumeWorkExperienceVisibilityConfig,
} from "@/lib/resume-visibility";

export type EmploymentType = "full_time" | "part_time" | "contract";
export type CompensationType = "salary" | "hourly";
export type WorkplaceType = "remote" | "hybrid" | "on_site";

export interface Application {
  id: number;
  companyName: string;
  jobTitle: string;
  status: ApplicationStatus;
  employmentType: EmploymentType;
  workplaceType: WorkplaceType;
  compensationType: CompensationType;
  salaryAsked: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  jobPostedAt: string | null;
  jobDescriptionUrl: string | null;
  jobApplicationUrl: string | null;
  jobApplicationStatusUrl: string | null;
  jobDescription: string | null;
  notes: string | null;
  companyIntel: string | null;
  workLocationCity: string | null;
  workLocationState: string | null;
  offersEquity: boolean;
  hiringManagerName: string | null;
  hiringManagerEmail: string | null;
  hiringManagerPhone: string | null;
  hiringManagerLinkedinUrl: string | null;
  applicationMedium: string | null;
  resumePath: string | null;
  resumeIsUrl: boolean;
  attachedResumeVersionId: string | null;
  coverLetterPath: string | null;
  coverLetterIsUrl: boolean;
  coverLetterText: string | null;
  dateApplied: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyLink {
  id: number;
  applicationId: number;
  label: string;
  url: string;
}

export interface Document {
  id: number;
  applicationId: number;
  label: string;
  filePath: string;
  isUrl: boolean;
  createdAt: string;
}

export interface ApplicationQuestion {
  id: number;
  applicationId: number;
  question: string;
  answer: string;
  createdAt: string;
}

export interface StatusHistoryEntry {
  id: number;
  applicationId: number;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  changedAt: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface JobBoard {
  id: number;
  name: string;
  url: string;
  createdAt: string;
}

export interface ApplicationTask {
  id: number;
  applicationId: number;
  title: string;
  url: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface PendingTask extends ApplicationTask {
  companyName: string;
  jobTitle: string;
}

export interface ResumeEducationEntry {
  id: number;
  sortOrder: number;
  schoolName: string;
  degree: string;
  fieldOfStudy: string;
  gpa: string | null;
  courses: string | null;
  awardsHonors: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  visibilityConfig: ResumeEducationVisibilityConfig;
  createdAt: string;
}

export interface ResumeWorkExperience {
  id: number;
  sortOrder: number;
  companyName: string;
  roleTitle: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  bullets: string | null;
  visibilityConfig: ResumeWorkExperienceVisibilityConfig;
  createdAt: string;
}

export interface ResumeProject {
  id: number;
  sortOrder: number;
  name: string;
  link: string | null;
  technologies: string | null;
  description: string | null;
  visibilityConfig: ResumeProjectVisibilityConfig;
  createdAt: string;
}

export interface ResumeCertification {
  id: number;
  sortOrder: number;
  name: string;
  issuer: string | null;
  issueDate: string | null;
  credentialId: string | null;
  visibilityConfig: ResumeCertificationVisibilityConfig;
  createdAt: string;
}

export interface ResumeGeneratedDocument {
  id: number;
  format: string;
  label: string;
  filePath: string;
  createdAt: string;
}

export interface ResumeVersion {
  id: string;
  title: string;
  location: string | null;
  summary: string | null;
  skills: string | null;
  visibilityConfig: ResumeSectionVisibilityConfig;
  isMain: boolean;
  applicationId: number | null;
  parentVersionId: string | null;
  parentTitle: string | null;
  fontSize: number;
  margin: number;
  createdAt: string;
  updatedAt: string;
  education: ResumeEducationEntry[];
  workExperience: ResumeWorkExperience[];
  projects: ResumeProject[];
  certifications: ResumeCertification[];
  documents: ResumeGeneratedDocument[];
}

export interface ApplicationResumeAtsAnalysisHistory {
  id: number;
  applicationId: number;
  resumeVersionId: string;
  resumeVersionTitle: string;
  overallScore: number;
  matchedKeywordCount: number;
  totalKeywordCount: number;
  createdAt: string;
}

export interface DashboardStats {
  totalApplications: number;
  appliedToday: number;
  appliedThisWeek: number;
  appliedThisMonth: number;
  callbackRate: number;
  rejectionRate: number;
  offerRate: number;
  avgSalaryAsked: number | null;
  minSalaryAsked: number | null;
  maxSalaryAsked: number | null;
  statusBreakdown: Record<string, number>;
  unemploymentDays: number | null;
  recentActivity: StatusHistoryEntry[];
}
