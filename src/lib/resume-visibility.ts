export interface ResumeSectionVisibilityConfig {
  summary: boolean;
  skills: boolean;
  workExperience: boolean;
  projects: boolean;
  education: boolean;
  certifications: boolean;
}

export interface ResumeEducationVisibilityConfig {
  entry: boolean;
  schoolName: boolean;
  degree: boolean;
  fieldOfStudy: boolean;
  gpa: boolean;
  startDate: boolean;
  endDate: boolean;
  courses: boolean;
  awardsHonors: boolean;
  description: boolean;
}

export interface ResumeWorkExperienceVisibilityConfig {
  entry: boolean;
  companyName: boolean;
  roleTitle: boolean;
  location: boolean;
  startDate: boolean;
  endDate: boolean;
  bullets: boolean;
}

export interface ResumeProjectVisibilityConfig {
  entry: boolean;
  name: boolean;
  link: boolean;
  technologies: boolean;
  description: boolean;
}

export interface ResumeCertificationVisibilityConfig {
  entry: boolean;
  name: boolean;
  issuer: boolean;
  issueDate: boolean;
  credentialId: boolean;
}

export const DEFAULT_RESUME_SECTION_VISIBILITY: ResumeSectionVisibilityConfig = {
  summary: true,
  skills: true,
  workExperience: true,
  projects: true,
  education: true,
  certifications: true,
};

export const DEFAULT_RESUME_EDUCATION_VISIBILITY: ResumeEducationVisibilityConfig = {
  entry: true,
  schoolName: true,
  degree: true,
  fieldOfStudy: true,
  gpa: true,
  startDate: true,
  endDate: true,
  courses: true,
  awardsHonors: true,
  description: true,
};

export const DEFAULT_RESUME_WORK_EXPERIENCE_VISIBILITY: ResumeWorkExperienceVisibilityConfig = {
  entry: true,
  companyName: true,
  roleTitle: true,
  location: true,
  startDate: true,
  endDate: true,
  bullets: true,
};

export const DEFAULT_RESUME_PROJECT_VISIBILITY: ResumeProjectVisibilityConfig = {
  entry: true,
  name: true,
  link: true,
  technologies: true,
  description: true,
};

export const DEFAULT_RESUME_CERTIFICATION_VISIBILITY: ResumeCertificationVisibilityConfig = {
  entry: true,
  name: true,
  issuer: true,
  issueDate: true,
  credentialId: true,
};

function normalizeVisibilityConfig<T extends Record<string, boolean>>(
  value: unknown,
  defaults: T
): T {
  const source = typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
  const normalized = {} as T;

  for (const [key, defaultValue] of Object.entries(defaults)) {
    normalized[key as keyof T] = typeof source[key] === "boolean"
      ? source[key] as T[keyof T]
      : defaultValue as T[keyof T];
  }

  return normalized;
}

function parseJson(value: string | null | undefined) {
  if (!value?.trim()) return null;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

export function parseResumeSectionVisibility(
  value: string | null | undefined
): ResumeSectionVisibilityConfig {
  return normalizeVisibilityConfig(parseJson(value), DEFAULT_RESUME_SECTION_VISIBILITY);
}

export function parseResumeEducationVisibility(
  value: string | null | undefined
): ResumeEducationVisibilityConfig {
  return normalizeVisibilityConfig(parseJson(value), DEFAULT_RESUME_EDUCATION_VISIBILITY);
}

export function parseResumeWorkExperienceVisibility(
  value: string | null | undefined
): ResumeWorkExperienceVisibilityConfig {
  return normalizeVisibilityConfig(parseJson(value), DEFAULT_RESUME_WORK_EXPERIENCE_VISIBILITY);
}

export function parseResumeProjectVisibility(
  value: string | null | undefined
): ResumeProjectVisibilityConfig {
  return normalizeVisibilityConfig(parseJson(value), DEFAULT_RESUME_PROJECT_VISIBILITY);
}

export function parseResumeCertificationVisibility(
  value: string | null | undefined
): ResumeCertificationVisibilityConfig {
  return normalizeVisibilityConfig(parseJson(value), DEFAULT_RESUME_CERTIFICATION_VISIBILITY);
}

export function serializeVisibilityConfig(value: Record<string, boolean>) {
  return JSON.stringify(value);
}
