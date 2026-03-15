import { z } from "zod";
import type { ResumeVersion } from "@/types";
import type {
  ResumeCertificationInput,
  ResumeEducationInput,
  ResumeProjectInput,
  ResumeWorkExperienceInput,
} from "@/db/queries/resume-versions";
import {
  DEFAULT_RESUME_CERTIFICATION_VISIBILITY,
  DEFAULT_RESUME_EDUCATION_VISIBILITY,
  DEFAULT_RESUME_PROJECT_VISIBILITY,
  DEFAULT_RESUME_SECTION_VISIBILITY,
  DEFAULT_RESUME_WORK_EXPERIENCE_VISIBILITY,
} from "@/lib/resume-visibility";

const marginSchema = z.union([
  z.literal(0.25),
  z.literal(0.5),
  z.literal(0.75),
  z.literal(1),
  z.literal(1.25),
  z.literal(1.5),
]);

const resumeSectionVisibilitySchema = z.object({
  summary: z.boolean().default(true),
  skills: z.boolean().default(true),
  workExperience: z.boolean().default(true),
  projects: z.boolean().default(true),
  education: z.boolean().default(true),
  certifications: z.boolean().default(true),
});

const educationVisibilitySchema = z.object({
  entry: z.boolean().default(true),
  schoolName: z.boolean().default(true),
  degree: z.boolean().default(true),
  fieldOfStudy: z.boolean().default(true),
  gpa: z.boolean().default(true),
  startDate: z.boolean().default(true),
  endDate: z.boolean().default(true),
  courses: z.boolean().default(true),
  awardsHonors: z.boolean().default(true),
  description: z.boolean().default(true),
});

const workVisibilitySchema = z.object({
  entry: z.boolean().default(true),
  companyName: z.boolean().default(true),
  roleTitle: z.boolean().default(true),
  location: z.boolean().default(true),
  startDate: z.boolean().default(true),
  endDate: z.boolean().default(true),
  bullets: z.boolean().default(true),
});

const projectVisibilitySchema = z.object({
  entry: z.boolean().default(true),
  name: z.boolean().default(true),
  link: z.boolean().default(true),
  technologies: z.boolean().default(true),
  description: z.boolean().default(true),
});

const certificationVisibilitySchema = z.object({
  entry: z.boolean().default(true),
  name: z.boolean().default(true),
  issuer: z.boolean().default(true),
  issueDate: z.boolean().default(true),
  credentialId: z.boolean().default(true),
});

const resumeEducationJsonSchema = z.object({
  schoolName: z.string().default(""),
  degree: z.string().default(""),
  fieldOfStudy: z.string().default(""),
  gpa: z.string().default(""),
  courses: z.string().default(""),
  awardsHonors: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  description: z.string().default(""),
  visibilityConfig: educationVisibilitySchema.default(DEFAULT_RESUME_EDUCATION_VISIBILITY),
});

const resumeWorkExperienceJsonSchema = z.object({
  companyName: z.string().default(""),
  roleTitle: z.string().default(""),
  location: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  bullets: z.string().default(""),
  visibilityConfig: workVisibilitySchema.default(DEFAULT_RESUME_WORK_EXPERIENCE_VISIBILITY),
});

const resumeProjectJsonSchema = z.object({
  name: z.string().default(""),
  link: z.string().default(""),
  technologies: z.string().default(""),
  description: z.string().default(""),
  visibilityConfig: projectVisibilitySchema.default(DEFAULT_RESUME_PROJECT_VISIBILITY),
});

const resumeCertificationJsonSchema = z.object({
  name: z.string().default(""),
  issuer: z.string().default(""),
  issueDate: z.string().default(""),
  credentialId: z.string().default(""),
  visibilityConfig: certificationVisibilitySchema.default(DEFAULT_RESUME_CERTIFICATION_VISIBILITY),
});

export const tailoredResumeSchema = z.object({
  title: z.string().default("Tailored Resume"),
  location: z.string().default(""),
  summary: z.string().default(""),
  skills: z.string().default(""),
  visibilityConfig: resumeSectionVisibilitySchema.default(DEFAULT_RESUME_SECTION_VISIBILITY),
  fontSize: z.number().min(8).max(16).default(11),
  margin: marginSchema.default(0.75),
  education: z.array(resumeEducationJsonSchema).default([]),
  workExperience: z.array(resumeWorkExperienceJsonSchema).default([]),
  projects: z.array(resumeProjectJsonSchema).default([]),
  certifications: z.array(resumeCertificationJsonSchema).default([]),
});

export const atsAnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100),
  summary: z.string(),
  keywordsConsidered: z.array(z.string()).default([]),
  matchedKeywords: z.array(z.string()).default([]),
  missingKeywords: z.array(z.string()).default([]),
  sectionFeedback: z.object({
    summary: z.string().default(""),
    skills: z.string().default(""),
    workExperience: z.string().default(""),
    projects: z.string().default(""),
    education: z.string().default(""),
  }),
  formattingRisks: z.array(z.string()).default([]),
  topRecommendations: z.array(z.string()).default([]),
});

export type TailoredResumeJson = z.infer<typeof tailoredResumeSchema>;
export type ResumeAtsAnalysis = z.infer<typeof atsAnalysisSchema> & {
  totalKeywordCount: number;
  matchedKeywordCount: number;
};

export function resumeVersionToJson(version: ResumeVersion): TailoredResumeJson {
  return {
    title: version.title,
    location: version.location ?? "",
    summary: version.summary ?? "",
    skills: version.skills ?? "",
    visibilityConfig: version.visibilityConfig ?? DEFAULT_RESUME_SECTION_VISIBILITY,
    fontSize: version.fontSize,
    margin: version.margin as TailoredResumeJson["margin"],
    education: version.education.map((entry) => ({
      schoolName: entry.schoolName ?? "",
      degree: entry.degree ?? "",
      fieldOfStudy: entry.fieldOfStudy ?? "",
      gpa: entry.gpa ?? "",
      courses: entry.courses ?? "",
      awardsHonors: entry.awardsHonors ?? "",
      startDate: entry.startDate ?? "",
      endDate: entry.endDate ?? "",
      description: entry.description ?? "",
      visibilityConfig: entry.visibilityConfig ?? DEFAULT_RESUME_EDUCATION_VISIBILITY,
    })),
    workExperience: version.workExperience.map((entry) => ({
      companyName: entry.companyName ?? "",
      roleTitle: entry.roleTitle ?? "",
      location: entry.location ?? "",
      startDate: entry.startDate ?? "",
      endDate: entry.endDate ?? "",
      bullets: entry.bullets ?? "",
      visibilityConfig: entry.visibilityConfig ?? DEFAULT_RESUME_WORK_EXPERIENCE_VISIBILITY,
    })),
    projects: version.projects.map((entry) => ({
      name: entry.name ?? "",
      link: entry.link ?? "",
      technologies: entry.technologies ?? "",
      description: entry.description ?? "",
      visibilityConfig: entry.visibilityConfig ?? DEFAULT_RESUME_PROJECT_VISIBILITY,
    })),
    certifications: version.certifications.map((entry) => ({
      name: entry.name ?? "",
      issuer: entry.issuer ?? "",
      issueDate: entry.issueDate ?? "",
      credentialId: entry.credentialId ?? "",
      visibilityConfig: entry.visibilityConfig ?? DEFAULT_RESUME_CERTIFICATION_VISIBILITY,
    })),
  };
}

export function resumeJsonToInputs(json: TailoredResumeJson): {
  title: string;
  location: string;
  summary: string;
  skills: string;
  visibilityConfig: typeof DEFAULT_RESUME_SECTION_VISIBILITY;
  fontSize: number;
  margin: number;
  education: ResumeEducationInput[];
  workExperience: ResumeWorkExperienceInput[];
  projects: ResumeProjectInput[];
  certifications: ResumeCertificationInput[];
} {
  return {
    title: json.title.trim() || "Tailored Resume",
    location: json.location,
    summary: json.summary,
    skills: json.skills,
    visibilityConfig: json.visibilityConfig,
    fontSize: json.fontSize,
    margin: json.margin,
    education: json.education.map((entry) => ({
      schoolName: entry.schoolName,
      degree: entry.degree,
      fieldOfStudy: entry.fieldOfStudy,
      gpa: entry.gpa,
      courses: entry.courses,
      awardsHonors: entry.awardsHonors,
      startDate: entry.startDate,
      endDate: entry.endDate,
      description: entry.description,
      visibilityConfig: entry.visibilityConfig,
    })),
    workExperience: json.workExperience.map((entry) => ({
      companyName: entry.companyName,
      roleTitle: entry.roleTitle,
      location: entry.location,
      startDate: entry.startDate,
      endDate: entry.endDate,
      bullets: entry.bullets,
      visibilityConfig: entry.visibilityConfig,
    })),
    projects: json.projects.map((entry) => ({
      name: entry.name,
      link: entry.link,
      technologies: entry.technologies,
      description: entry.description,
      visibilityConfig: entry.visibilityConfig,
    })),
    certifications: json.certifications.map((entry) => ({
      name: entry.name,
      issuer: entry.issuer,
      issueDate: entry.issueDate,
      credentialId: entry.credentialId,
      visibilityConfig: entry.visibilityConfig,
    })),
  };
}

export function finalizeAtsAnalysis(
  analysis: z.infer<typeof atsAnalysisSchema>
): ResumeAtsAnalysis {
  const keywordsConsidered = Array.from(new Set(analysis.keywordsConsidered));
  const matchedKeywords = Array.from(new Set(analysis.matchedKeywords));
  const missingKeywords = Array.from(
    new Set(analysis.missingKeywords.filter((keyword) => !matchedKeywords.includes(keyword)))
  );

  return {
    ...analysis,
    keywordsConsidered,
    matchedKeywords,
    missingKeywords,
    totalKeywordCount: keywordsConsidered.length,
    matchedKeywordCount: matchedKeywords.length,
  };
}
