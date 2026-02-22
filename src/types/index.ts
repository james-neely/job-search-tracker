import type { ApplicationStatus } from "@/lib/constants";

export interface Application {
  id: number;
  companyName: string;
  jobTitle: string;
  status: ApplicationStatus;
  salaryAsked: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  jobDescriptionUrl: string | null;
  jobDescription: string | null;
  notes: string | null;
  companyIntel: string | null;
  resumePath: string | null;
  resumeIsUrl: boolean;
  coverLetterPath: string | null;
  coverLetterIsUrl: boolean;
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
