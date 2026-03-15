import { z } from "zod";
import type { ResumeVersion } from "@/types";
import type {
  ResumeCertificationInput,
  ResumeEducationInput,
  ResumeProjectInput,
  ResumeWorkExperienceInput,
} from "@/db/queries/resume-versions";

const marginSchema = z.union([
  z.literal(0.25),
  z.literal(0.5),
  z.literal(0.75),
  z.literal(1),
  z.literal(1.25),
  z.literal(1.5),
]);

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
});

const resumeWorkExperienceJsonSchema = z.object({
  companyName: z.string().default(""),
  roleTitle: z.string().default(""),
  location: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  bullets: z.string().default(""),
});

const resumeProjectJsonSchema = z.object({
  name: z.string().default(""),
  link: z.string().default(""),
  technologies: z.string().default(""),
  description: z.string().default(""),
});

const resumeCertificationJsonSchema = z.object({
  name: z.string().default(""),
  issuer: z.string().default(""),
  issueDate: z.string().default(""),
  credentialId: z.string().default(""),
});

export const tailoredResumeSchema = z.object({
  title: z.string().default("Tailored Resume"),
  summary: z.string().default(""),
  skills: z.string().default(""),
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
    summary: version.summary ?? "",
    skills: version.skills ?? "",
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
    })),
    workExperience: version.workExperience.map((entry) => ({
      companyName: entry.companyName ?? "",
      roleTitle: entry.roleTitle ?? "",
      location: entry.location ?? "",
      startDate: entry.startDate ?? "",
      endDate: entry.endDate ?? "",
      bullets: entry.bullets ?? "",
    })),
    projects: version.projects.map((entry) => ({
      name: entry.name ?? "",
      link: entry.link ?? "",
      technologies: entry.technologies ?? "",
      description: entry.description ?? "",
    })),
    certifications: version.certifications.map((entry) => ({
      name: entry.name ?? "",
      issuer: entry.issuer ?? "",
      issueDate: entry.issueDate ?? "",
      credentialId: entry.credentialId ?? "",
    })),
  };
}

export function resumeJsonToInputs(json: TailoredResumeJson): {
  title: string;
  summary: string;
  skills: string;
  fontSize: number;
  margin: number;
  education: ResumeEducationInput[];
  workExperience: ResumeWorkExperienceInput[];
  projects: ResumeProjectInput[];
  certifications: ResumeCertificationInput[];
} {
  return {
    title: json.title.trim() || "Tailored Resume",
    summary: json.summary,
    skills: json.skills,
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
    })),
    workExperience: json.workExperience.map((entry) => ({
      companyName: entry.companyName,
      roleTitle: entry.roleTitle,
      location: entry.location,
      startDate: entry.startDate,
      endDate: entry.endDate,
      bullets: entry.bullets,
    })),
    projects: json.projects.map((entry) => ({
      name: entry.name,
      link: entry.link,
      technologies: entry.technologies,
      description: entry.description,
    })),
    certifications: json.certifications.map((entry) => ({
      name: entry.name,
      issuer: entry.issuer,
      issueDate: entry.issueDate,
      credentialId: entry.credentialId,
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
