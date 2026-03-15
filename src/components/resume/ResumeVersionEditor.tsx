"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ResumeVersion } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid2";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import AddIcon from "@mui/icons-material/Add";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import DownloadIcon from "@mui/icons-material/Download";
import SaveIcon from "@mui/icons-material/Save";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";

interface EducationDraft {
  schoolName: string;
  degree: string;
  fieldOfStudy: string;
  gpa: string;
  courses: string;
  awardsHonors: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface WorkExperienceDraft {
  companyName: string;
  roleTitle: string;
  location: string;
  startDate: string;
  endDate: string;
  bullets: string;
}

interface ProjectDraft {
  name: string;
  link: string;
  technologies: string;
  description: string;
}

interface CertificationDraft {
  name: string;
  issuer: string;
  issueDate: string;
  credentialId: string;
}

interface ResumeDraft {
  title: string;
  summary: string;
  skills: string;
  fontSize: string;
  margin: string;
  education: EducationDraft[];
  workExperience: WorkExperienceDraft[];
  projects: ProjectDraft[];
  certifications: CertificationDraft[];
}

type EducationAiField = "courses" | "awardsHonors" | "description";

const MARGIN_OPTIONS = ["0.25", "0.5", "0.75", "1", "1.25", "1.5"] as const;
const DEGREE_OPTIONS = [
  "High School Diploma",
  "Associate of Arts",
  "Associate of Science",
  "Associate of Applied Science",
  "Bachelor of Arts",
  "Bachelor of Science",
  "Bachelor of Engineering",
  "Bachelor of Business Administration",
  "Master of Arts",
  "Master of Science",
  "Master of Engineering",
  "Master of Business Administration",
  "Doctor of Philosophy",
  "Juris Doctor",
  "Doctor of Medicine",
  "Certificate",
] as const;
const FIELD_OF_STUDY_OPTIONS = [
  "Computer Science",
  "Software Engineering",
  "Computer Engineering",
  "Information Technology",
  "Information Systems",
  "Data Science",
  "Cybersecurity",
  "Electrical Engineering",
  "Mathematics",
  "Statistics",
  "Physics",
  "Business Administration",
  "Finance",
  "Economics",
  "Design",
  "Other",
] as const;

const EMPTY_EDUCATION: EducationDraft = {
  schoolName: "",
  degree: "",
  fieldOfStudy: "",
  gpa: "",
  courses: "",
  awardsHonors: "",
  startDate: "",
  endDate: "",
  description: "",
};

const EMPTY_WORK_EXPERIENCE: WorkExperienceDraft = {
  companyName: "",
  roleTitle: "",
  location: "",
  startDate: "",
  endDate: "",
  bullets: "",
};

const EMPTY_PROJECT: ProjectDraft = {
  name: "",
  link: "",
  technologies: "",
  description: "",
};

const EMPTY_CERTIFICATION: CertificationDraft = {
  name: "",
  issuer: "",
  issueDate: "",
  credentialId: "",
};

function createDraft(version: ResumeVersion): ResumeDraft {
  return {
    title: version.title,
    summary: version.summary ?? "",
    skills: version.skills ?? "",
    fontSize: String(version.fontSize),
    margin: String(version.margin),
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

export default function ResumeVersionEditor({ versionId }: { versionId: string }) {
  const router = useRouter();
  const [version, setVersion] = useState<ResumeVersion | null>(null);
  const [draft, setDraft] = useState<ResumeDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [forking, setForking] = useState(false);
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [rewritingSummary, setRewritingSummary] = useState(false);
  const [coachingSummary, setCoachingSummary] = useState(false);
  const [rewritingSkills, setRewritingSkills] = useState(false);
  const [coachingSkills, setCoachingSkills] = useState(false);
  const [rewritingWorkIndex, setRewritingWorkIndex] = useState<number | null>(null);
  const [coachingWorkIndex, setCoachingWorkIndex] = useState<number | null>(null);
  const [summarySuggestion, setSummarySuggestion] = useState<string | null>(null);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [summaryCoaching, setSummaryCoaching] = useState<string | null>(null);
  const [summaryCoachingDialogOpen, setSummaryCoachingDialogOpen] = useState(false);
  const [skillsSuggestion, setSkillsSuggestion] = useState<string | null>(null);
  const [skillsDialogOpen, setSkillsDialogOpen] = useState(false);
  const [skillsCoaching, setSkillsCoaching] = useState<string | null>(null);
  const [skillsCoachingDialogOpen, setSkillsCoachingDialogOpen] = useState(false);
  const [workBulletsSuggestion, setWorkBulletsSuggestion] = useState<string | null>(null);
  const [workBulletsDialogOpen, setWorkBulletsDialogOpen] = useState(false);
  const [workBulletsSuggestionIndex, setWorkBulletsSuggestionIndex] = useState<number | null>(null);
  const [workBulletsCoaching, setWorkBulletsCoaching] = useState<string | null>(null);
  const [workBulletsCoachingDialogOpen, setWorkBulletsCoachingDialogOpen] = useState(false);
  const [rewritingEducationField, setRewritingEducationField] = useState<{ index: number; field: EducationAiField } | null>(null);
  const [coachingEducationField, setCoachingEducationField] = useState<{ index: number; field: EducationAiField } | null>(null);
  const [educationFieldSuggestion, setEducationFieldSuggestion] = useState<string | null>(null);
  const [educationFieldDialogOpen, setEducationFieldDialogOpen] = useState(false);
  const [educationFieldSuggestionTarget, setEducationFieldSuggestionTarget] = useState<{ index: number; field: EducationAiField } | null>(null);
  const [educationFieldCoaching, setEducationFieldCoaching] = useState<string | null>(null);
  const [educationFieldCoachingDialogOpen, setEducationFieldCoachingDialogOpen] = useState(false);

  const educationFieldLabels: Record<EducationAiField, string> = {
    courses: "Courses",
    awardsHonors: "Awards / Honors",
    description: "Description",
  };

  const loadVersion = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/resume/versions/${versionId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load resume");
      }
      setVersion(data);
      setDraft(createDraft(data));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load resume");
    } finally {
      setLoading(false);
    }
  }, [versionId]);

  useEffect(() => {
    void loadVersion();
  }, [loadVersion]);

  const updateDraft = (nextDraft: ResumeDraft) => setDraft(nextDraft);

  const handleDraftChange = (field: keyof ResumeDraft, value: string) => {
    if (!draft || field === "education" || field === "workExperience" || field === "projects" || field === "certifications") return;
    updateDraft({ ...draft, [field]: value });
  };

  const handleEducationChange = (index: number, field: keyof EducationDraft, value: string) => {
    if (!draft) return;
    updateDraft({
      ...draft,
      education: draft.education.map((entry, entryIndex) => {
        if (entryIndex !== index) return entry;
        if (field === "gpa") {
          const sanitized = value.replace(/[^\d.]/g, "");
          const parts = sanitized.split(".");
          const whole = parts[0]?.slice(0, 1) ?? "";
          const decimal = parts[1]?.slice(0, 2) ?? "";
          const normalized = parts.length > 1 ? `${whole}.${decimal}` : whole;
          return { ...entry, [field]: normalized };
        }
        return { ...entry, [field]: value };
      }),
    });
  };

  const handleWorkExperienceChange = (index: number, field: keyof WorkExperienceDraft, value: string) => {
    if (!draft) return;
    updateDraft({
      ...draft,
      workExperience: draft.workExperience.map((entry, entryIndex) => entryIndex === index ? { ...entry, [field]: value } : entry),
    });
  };

  const handleProjectChange = (index: number, field: keyof ProjectDraft, value: string) => {
    if (!draft) return;
    updateDraft({
      ...draft,
      projects: draft.projects.map((entry, entryIndex) => entryIndex === index ? { ...entry, [field]: value } : entry),
    });
  };

  const handleCertificationChange = (index: number, field: keyof CertificationDraft, value: string) => {
    if (!draft) return;
    updateDraft({
      ...draft,
      certifications: draft.certifications.map((entry, entryIndex) => entryIndex === index ? { ...entry, [field]: value } : entry),
    });
  };

  const addItem = <T,>(items: T[], empty: T, key: "education" | "workExperience" | "projects" | "certifications") => {
    if (!draft) return;
    updateDraft({ ...draft, [key]: [...items, empty] });
  };

  const removeItem = (key: "education" | "workExperience" | "projects" | "certifications", index: number) => {
    if (!draft) return;
    updateDraft({ ...draft, [key]: draft[key].filter((_, entryIndex) => entryIndex !== index) });
  };

  const handleSave = useCallback(async (): Promise<ResumeVersion | null> => {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/resume/versions/${versionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save resume");
      }
      setVersion(data);
      setDraft(createDraft(data));
      return data;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save resume");
      return null;
    } finally {
      setSaving(false);
    }
  }, [draft, versionId]);

  const handlePreview = useCallback(async () => {
    setPreviewing(true);
    setError(null);
    try {
      const savedVersion = await handleSave();
      if (!savedVersion) {
        return;
      }

      window.open(`/api/resume/versions/${savedVersion.id}/preview?ts=${Date.now()}`, "_blank", "noopener,noreferrer");
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Failed to preview resume");
    } finally {
      setPreviewing(false);
    }
  }, [handleSave]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (!saving) {
          void handleSave();
        }
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "p") {
        event.preventDefault();
        if (!previewing) {
          void handlePreview();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlePreview, handleSave, previewing, saving]);

  const handleFork = async () => {
    setForking(true);
    setError(null);
    try {
      const response = await fetch(`/api/resume/versions/${versionId}/fork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to fork resume");
      }
      router.push(`/resume/${data.id}`);
    } catch (forkError) {
      setError(forkError instanceof Error ? forkError.message : "Failed to fork resume");
    } finally {
      setForking(false);
    }
  };

  const handleGenerate = async (format: "markdown" | "pdf" | "docx") => {
    setGeneratingKey(format);
    setError(null);
    try {
      const response = await fetch(`/api/resume/versions/${versionId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? `Failed to generate ${format.toUpperCase()} resume`);
      }
      if (version) {
        setVersion({ ...version, documents: [data, ...version.documents] });
      }
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : `Failed to generate ${format.toUpperCase()} resume`);
    } finally {
      setGeneratingKey(null);
    }
  };

  const handleDeleteGeneratedDocument = async (documentId: number) => {
    setDeletingDocumentId(documentId);
    setError(null);
    try {
      const response = await fetch(`/api/resume/documents/${documentId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete generated document");
      }
      if (version) {
        setVersion({ ...version, documents: version.documents.filter((document) => document.id !== documentId) });
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete generated document");
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const handleRewriteSummary = async () => {
    if (!draft) return;

    setRewritingSummary(true);
    setError(null);
    setSummarySuggestion(null);

    try {
      const response = await fetch("/api/ai/rewrite-resume-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: draft.summary,
          skills: draft.skills,
          jobTitle: draft.workExperience[0]?.roleTitle || "",
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || "Failed to rewrite summary");
      }

      if (!response.ok) throw new Error("Failed to rewrite summary");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = "";
      let done = false;

      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) {
          content += decoder.decode(result.value);
        }
      }

      setSummarySuggestion(content.trim());
      setSummaryDialogOpen(true);
    } catch (rewriteError) {
      setError(rewriteError instanceof Error ? rewriteError.message : "Failed to rewrite summary");
    } finally {
      setRewritingSummary(false);
    }
  };

  const handleCoachSummary = async () => {
    if (!draft) return;

    setCoachingSummary(true);
    setError(null);
    setSummaryCoaching(null);

    try {
      const response = await fetch("/api/ai/coach-resume-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: draft.summary,
          skills: draft.skills,
          jobTitle: draft.workExperience[0]?.roleTitle || "",
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || "Failed to coach summary");
      }

      if (!response.ok) throw new Error("Failed to coach summary");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = "";
      let done = false;

      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) {
          content += decoder.decode(result.value);
        }
      }

      setSummaryCoaching(content.trim());
      setSummaryCoachingDialogOpen(true);
    } catch (coachError) {
      setError(coachError instanceof Error ? coachError.message : "Failed to coach summary");
    } finally {
      setCoachingSummary(false);
    }
  };

  const handleRewriteSkills = async () => {
    if (!draft) return;

    setRewritingSkills(true);
    setError(null);
    setSkillsSuggestion(null);

    try {
      const response = await fetch("/api/ai/rewrite-resume-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: draft.summary,
          skills: draft.skills,
          jobTitle: draft.workExperience[0]?.roleTitle || "",
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || "Failed to rewrite skills");
      }

      if (!response.ok) throw new Error("Failed to rewrite skills");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = "";
      let done = false;

      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) {
          content += decoder.decode(result.value);
        }
      }

      setSkillsSuggestion(content.trim());
      setSkillsDialogOpen(true);
    } catch (rewriteError) {
      setError(rewriteError instanceof Error ? rewriteError.message : "Failed to rewrite skills");
    } finally {
      setRewritingSkills(false);
    }
  };

  const handleCoachSkills = async () => {
    if (!draft) return;

    setCoachingSkills(true);
    setError(null);
    setSkillsCoaching(null);

    try {
      const response = await fetch("/api/ai/coach-resume-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: draft.summary,
          skills: draft.skills,
          jobTitle: draft.workExperience[0]?.roleTitle || "",
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || "Failed to coach skills");
      }

      if (!response.ok) throw new Error("Failed to coach skills");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = "";
      let done = false;

      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) {
          content += decoder.decode(result.value);
        }
      }

      setSkillsCoaching(content.trim());
      setSkillsCoachingDialogOpen(true);
    } catch (coachError) {
      setError(coachError instanceof Error ? coachError.message : "Failed to coach skills");
    } finally {
      setCoachingSkills(false);
    }
  };

  const handleRewriteWorkBullets = async (index: number) => {
    if (!draft) return;

    const entry = draft.workExperience[index];
    if (!entry) return;

    setRewritingWorkIndex(index);
    setError(null);
    setWorkBulletsSuggestion(null);
    setWorkBulletsSuggestionIndex(index);

    try {
      const response = await fetch("/api/ai/rewrite-resume-work-bullets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: entry.companyName,
          roleTitle: entry.roleTitle,
          location: entry.location,
          summary: draft.summary,
          skills: draft.skills,
          bullets: entry.bullets,
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || "Failed to rewrite work bullets");
      }

      if (!response.ok) throw new Error("Failed to rewrite work bullets");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = "";
      let done = false;

      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) {
          content += decoder.decode(result.value);
        }
      }

      setWorkBulletsSuggestion(content.trim());
      setWorkBulletsDialogOpen(true);
    } catch (rewriteError) {
      setError(rewriteError instanceof Error ? rewriteError.message : "Failed to rewrite work bullets");
    } finally {
      setRewritingWorkIndex(null);
    }
  };

  const handleCoachWorkBullets = async (index: number) => {
    if (!draft) return;

    const entry = draft.workExperience[index];
    if (!entry) return;

    setCoachingWorkIndex(index);
    setError(null);
    setWorkBulletsCoaching(null);

    try {
      const response = await fetch("/api/ai/coach-resume-work-bullets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: entry.companyName,
          roleTitle: entry.roleTitle,
          location: entry.location,
          summary: draft.summary,
          skills: draft.skills,
          bullets: entry.bullets,
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || "Failed to coach work bullets");
      }

      if (!response.ok) throw new Error("Failed to coach work bullets");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = "";
      let done = false;

      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) {
          content += decoder.decode(result.value);
        }
      }

      setWorkBulletsCoaching(content.trim());
      setWorkBulletsCoachingDialogOpen(true);
    } catch (coachError) {
      setError(coachError instanceof Error ? coachError.message : "Failed to coach work bullets");
    } finally {
      setCoachingWorkIndex(null);
    }
  };

  const handleRewriteEducationField = async (index: number, field: EducationAiField) => {
    if (!draft) return;
    const entry = draft.education[index];
    if (!entry) return;

    setRewritingEducationField({ index, field });
    setError(null);
    setEducationFieldSuggestion(null);
    setEducationFieldSuggestionTarget({ index, field });

    try {
      const response = await fetch("/api/ai/rewrite-resume-education-field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName: entry.schoolName,
          degree: entry.degree,
          fieldOfStudy: entry.fieldOfStudy,
          gpa: entry.gpa,
          startDate: entry.startDate,
          endDate: entry.endDate,
          summary: draft.summary,
          skills: draft.skills,
          fieldLabel: educationFieldLabels[field],
          value: entry[field],
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || `Failed to rewrite ${educationFieldLabels[field].toLowerCase()}`);
      }

      if (!response.ok) throw new Error(`Failed to rewrite ${educationFieldLabels[field].toLowerCase()}`);
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = "";
      let done = false;

      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) {
          content += decoder.decode(result.value);
        }
      }

      setEducationFieldSuggestion(content.trim());
      setEducationFieldDialogOpen(true);
    } catch (rewriteError) {
      setError(rewriteError instanceof Error ? rewriteError.message : `Failed to rewrite ${educationFieldLabels[field].toLowerCase()}`);
    } finally {
      setRewritingEducationField(null);
    }
  };

  const handleCoachEducationField = async (index: number, field: EducationAiField) => {
    if (!draft) return;
    const entry = draft.education[index];
    if (!entry) return;

    setCoachingEducationField({ index, field });
    setError(null);
    setEducationFieldCoaching(null);

    try {
      const response = await fetch("/api/ai/coach-resume-education-field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName: entry.schoolName,
          degree: entry.degree,
          fieldOfStudy: entry.fieldOfStudy,
          gpa: entry.gpa,
          startDate: entry.startDate,
          endDate: entry.endDate,
          summary: draft.summary,
          skills: draft.skills,
          fieldLabel: educationFieldLabels[field],
          value: entry[field],
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || `Failed to coach ${educationFieldLabels[field].toLowerCase()}`);
      }

      if (!response.ok) throw new Error(`Failed to coach ${educationFieldLabels[field].toLowerCase()}`);
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = "";
      let done = false;

      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) {
          content += decoder.decode(result.value);
        }
      }

      setEducationFieldCoaching(content.trim());
      setEducationFieldCoachingDialogOpen(true);
    } catch (coachError) {
      setError(coachError instanceof Error ? coachError.message : `Failed to coach ${educationFieldLabels[field].toLowerCase()}`);
    } finally {
      setCoachingEducationField(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 3 }}>
        <CircularProgress size={24} />
        <Typography>Loading resume...</Typography>
      </Box>
    );
  }

  if (!version || !draft) {
    return <Alert severity="error">Resume not found.</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Box>
          <Button component={Link} href="/resume" size="small" sx={{ mb: 1 }}>
            Back to Resume Library
          </Button>
          <Typography variant="h4" gutterBottom fontWeight="bold">{version.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            Resume ID: {version.id}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="outlined" startIcon={<CallSplitIcon />} disabled={forking} onClick={handleFork}>
            {forking ? "Forking..." : "Fork Resume"}
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
          <Chip size="small" label={version.parentTitle ? `Forked from ${version.parentTitle}` : "Blank base"} />
          <Chip size="small" variant="outlined" label={`Updated ${formatRelativeTime(version.updatedAt)}`} />
        </Stack>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12 }}>
            <TextField label="Resume Title" fullWidth value={draft.title} onChange={(e) => handleDraftChange("title", e.target.value)} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", flexWrap: "wrap" }}>
              <TextField
                label="Summary"
                fullWidth
                multiline
                minRows={3}
                value={draft.summary}
                onChange={(e) => handleDraftChange("summary", e.target.value)}
              />
              <Button
                variant="outlined"
                startIcon={<AutoFixHighIcon />}
                disabled={rewritingSummary}
                onClick={() => void handleRewriteSummary()}
                sx={{ minWidth: 160, mt: { xs: 0, sm: 0.5 } }}
              >
                {rewritingSummary ? "Rewriting..." : "Rewrite Summary"}
              </Button>
              <Button
                variant="outlined"
                disabled={coachingSummary}
                onClick={() => void handleCoachSummary()}
                sx={{ minWidth: 160, mt: { xs: 0, sm: 0.5 } }}
              >
                {coachingSummary ? "Coaching..." : "Coach Me"}
              </Button>
            </Box>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", flexWrap: "wrap" }}>
              <TextField
                label="Skills"
                fullWidth
                multiline
                minRows={5}
                helperText="Use one group per line in `Category: skill, skill, skill` format. Example: `Languages: Python, Go, SQL`"
                placeholder={"Languages: Python, Go, SQL\nFrameworks/Libraries: React, Next.js, FastAPI\nCloud & DevOps: AWS, Docker, Kubernetes\nDatabases: PostgreSQL, Redis\nTools & Testing: Git, Postman, Jest"}
                value={draft.skills}
                onChange={(e) => handleDraftChange("skills", e.target.value)}
              />
              <Button
                variant="outlined"
                startIcon={<AutoFixHighIcon />}
                disabled={rewritingSkills}
                onClick={() => void handleRewriteSkills()}
                sx={{ minWidth: 160, mt: { xs: 0, sm: 0.5 } }}
              >
                {rewritingSkills ? "Rewriting..." : "Rewrite Skills"}
              </Button>
              <Button
                variant="outlined"
                disabled={coachingSkills}
                onClick={() => void handleCoachSkills()}
                sx={{ minWidth: 160, mt: { xs: 0, sm: 0.5 } }}
              >
                {coachingSkills ? "Coaching..." : "Coach Me"}
              </Button>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField label="Font Size" type="number" fullWidth slotProps={{ htmlInput: { min: 8, max: 16, step: 0.5 } }} value={draft.fontSize} onChange={(e) => handleDraftChange("fontSize", e.target.value)} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <TextField select label="Margins" fullWidth value={draft.margin} onChange={(e) => handleDraftChange("margin", e.target.value)}>
              {MARGIN_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>{option}&quot;</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        <Typography variant="subtitle1" gutterBottom>Work Experience</Typography>
        <Stack spacing={2}>
          {draft.workExperience.map((entry, index) => (
            <Paper key={`work-${index}`} variant="outlined" sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}><TextField label="Company" fullWidth value={entry.companyName} onChange={(e) => handleWorkExperienceChange(index, "companyName", e.target.value)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField label="Role Title" fullWidth value={entry.roleTitle} onChange={(e) => handleWorkExperienceChange(index, "roleTitle", e.target.value)} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="Location"
                    fullWidth
                    placeholder="Remote or Denver, CO"
                    helperText="Use `Remote` or `City, ST`."
                    value={entry.location}
                    onChange={(e) => handleWorkExperienceChange(index, "location", e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}><TextField label="Start Date" type="month" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={entry.startDate} onChange={(e) => handleWorkExperienceChange(index, "startDate", e.target.value)} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}><TextField label="End Date" type="month" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={entry.endDate} onChange={(e) => handleWorkExperienceChange(index, "endDate", e.target.value)} /></Grid>
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <TextField
                      label="Bullets"
                      fullWidth
                      multiline
                      minRows={4}
                      helperText="Use one bullet per line. Each line should start with `- `."
                      placeholder={"- Built internal tooling in React and TypeScript\n- Reduced API latency by 35 percent through query tuning\n- Partnered with product and design to ship onboarding improvements"}
                      value={entry.bullets}
                      onChange={(e) => handleWorkExperienceChange(index, "bullets", e.target.value)}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<AutoFixHighIcon />}
                      disabled={rewritingWorkIndex === index}
                      onClick={() => void handleRewriteWorkBullets(index)}
                      sx={{ minWidth: 160, mt: { xs: 0, sm: 0.5 } }}
                    >
                      {rewritingWorkIndex === index ? "Rewriting..." : "Rewrite Bullets"}
                    </Button>
                    <Button
                      variant="outlined"
                      disabled={coachingWorkIndex === index}
                      onClick={() => void handleCoachWorkBullets(index)}
                      sx={{ minWidth: 160, mt: { xs: 0, sm: 0.5 } }}
                    >
                      {coachingWorkIndex === index ? "Coaching..." : "Coach Me"}
                    </Button>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12 }}><Button color="error" onClick={() => removeItem("workExperience", index)}>Remove Entry</Button></Grid>
              </Grid>
            </Paper>
          ))}
        </Stack>
        <Box sx={{ mt: 2, mb: 3 }}><Button variant="outlined" startIcon={<AddIcon />} onClick={() => addItem(draft.workExperience, { ...EMPTY_WORK_EXPERIENCE }, "workExperience")}>Add Work Experience</Button></Box>

        <Typography variant="subtitle1" gutterBottom>Education</Typography>
        <Stack spacing={2}>
          {draft.education.map((entry, index) => (
            <Paper key={`edu-${index}`} variant="outlined" sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}><TextField label="School" fullWidth value={entry.schoolName} onChange={(e) => handleEducationChange(index, "schoolName", e.target.value)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    label="Degree"
                    fullWidth
                    value={entry.degree}
                    onChange={(e) => handleEducationChange(index, "degree", e.target.value)}
                  >
                    {DEGREE_OPTIONS.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    label="Field of Study"
                    fullWidth
                    value={entry.fieldOfStudy}
                    onChange={(e) => handleEducationChange(index, "fieldOfStudy", e.target.value)}
                  >
                    {FIELD_OF_STUDY_OPTIONS.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    label="GPA"
                    fullWidth
                    placeholder="4.00"
                    value={entry.gpa}
                    onChange={(e) => handleEducationChange(index, "gpa", e.target.value)}
                    onBlur={() => handleEducationGpaBlur(index)}
                    slotProps={{ htmlInput: { inputMode: "decimal", pattern: "^(?:[0-3](?:\\.\\d{0,2})?|4(?:\\.0{0,2})?)$" } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}><TextField label="Start Date" type="month" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={entry.startDate} onChange={(e) => handleEducationChange(index, "startDate", e.target.value)} /></Grid>
                <Grid size={{ xs: 12, md: 3 }}><TextField label="End Date" type="month" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={entry.endDate} onChange={(e) => handleEducationChange(index, "endDate", e.target.value)} /></Grid>
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <TextField
                      label="Courses"
                      fullWidth
                      multiline
                      minRows={3}
                      placeholder={"- Algorithms\n- Distributed Systems\n- Database Systems"}
                      value={entry.courses}
                      onChange={(e) => handleEducationChange(index, "courses", e.target.value)}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<AutoFixHighIcon />}
                      disabled={rewritingEducationField?.index === index && rewritingEducationField.field === "courses"}
                      onClick={() => void handleRewriteEducationField(index, "courses")}
                      sx={{ minWidth: 160, mt: { xs: 0, sm: 0.5 } }}
                    >
                      {rewritingEducationField?.index === index && rewritingEducationField.field === "courses" ? "Rewriting..." : "Rewrite"}
                    </Button>
                    <Button
                      variant="outlined"
                      disabled={coachingEducationField?.index === index && coachingEducationField.field === "courses"}
                      onClick={() => void handleCoachEducationField(index, "courses")}
                      sx={{ minWidth: 160, mt: { xs: 0, sm: 0.5 } }}
                    >
                      {coachingEducationField?.index === index && coachingEducationField.field === "courses" ? "Coaching..." : "Coach Me"}
                    </Button>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <TextField
                      label="Awards / Honors"
                      fullWidth
                      multiline
                      minRows={3}
                      placeholder={"- Dean's List\n- Cum Laude\n- Academic Scholarship Recipient"}
                      value={entry.awardsHonors}
                      onChange={(e) => handleEducationChange(index, "awardsHonors", e.target.value)}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<AutoFixHighIcon />}
                      disabled={rewritingEducationField?.index === index && rewritingEducationField.field === "awardsHonors"}
                      onClick={() => void handleRewriteEducationField(index, "awardsHonors")}
                      sx={{ minWidth: 160, mt: { xs: 0, sm: 0.5 } }}
                    >
                      {rewritingEducationField?.index === index && rewritingEducationField.field === "awardsHonors" ? "Rewriting..." : "Rewrite"}
                    </Button>
                    <Button
                      variant="outlined"
                      disabled={coachingEducationField?.index === index && coachingEducationField.field === "awardsHonors"}
                      onClick={() => void handleCoachEducationField(index, "awardsHonors")}
                      sx={{ minWidth: 160, mt: { xs: 0, sm: 0.5 } }}
                    >
                      {coachingEducationField?.index === index && coachingEducationField.field === "awardsHonors" ? "Coaching..." : "Coach Me"}
                    </Button>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <TextField
                      label="Description"
                      fullWidth
                      multiline
                      minRows={4}
                      placeholder={"- Conducted research in distributed systems\n- Completed a capstone on computer vision\n- Served as teaching assistant for introductory programming"}
                      value={entry.description}
                      onChange={(e) => handleEducationChange(index, "description", e.target.value)}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<AutoFixHighIcon />}
                      disabled={rewritingEducationField?.index === index && rewritingEducationField.field === "description"}
                      onClick={() => void handleRewriteEducationField(index, "description")}
                      sx={{ minWidth: 160, mt: { xs: 0, sm: 0.5 } }}
                    >
                      {rewritingEducationField?.index === index && rewritingEducationField.field === "description" ? "Rewriting..." : "Rewrite"}
                    </Button>
                    <Button
                      variant="outlined"
                      disabled={coachingEducationField?.index === index && coachingEducationField.field === "description"}
                      onClick={() => void handleCoachEducationField(index, "description")}
                      sx={{ minWidth: 160, mt: { xs: 0, sm: 0.5 } }}
                    >
                      {coachingEducationField?.index === index && coachingEducationField.field === "description" ? "Coaching..." : "Coach Me"}
                    </Button>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12 }}><Button color="error" onClick={() => removeItem("education", index)}>Remove Entry</Button></Grid>
              </Grid>
            </Paper>
          ))}
        </Stack>
        <Box sx={{ mt: 2, mb: 3 }}><Button variant="outlined" startIcon={<AddIcon />} onClick={() => addItem(draft.education, { ...EMPTY_EDUCATION }, "education")}>Add Education Entry</Button></Box>

        <Typography variant="subtitle1" gutterBottom>Projects</Typography>
        <Stack spacing={2}>
          {draft.projects.map((entry, index) => (
            <Paper key={`project-${index}`} variant="outlined" sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}><TextField label="Project Name" fullWidth value={entry.name} onChange={(e) => handleProjectChange(index, "name", e.target.value)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField label="Link" fullWidth value={entry.link} onChange={(e) => handleProjectChange(index, "link", e.target.value)} /></Grid>
                <Grid size={{ xs: 12 }}><TextField label="Technologies" fullWidth value={entry.technologies} onChange={(e) => handleProjectChange(index, "technologies", e.target.value)} /></Grid>
                <Grid size={{ xs: 12 }}><TextField label="Description" fullWidth multiline minRows={3} value={entry.description} onChange={(e) => handleProjectChange(index, "description", e.target.value)} /></Grid>
                <Grid size={{ xs: 12 }}><Button color="error" onClick={() => removeItem("projects", index)}>Remove Entry</Button></Grid>
              </Grid>
            </Paper>
          ))}
        </Stack>
        <Box sx={{ mt: 2, mb: 3 }}><Button variant="outlined" startIcon={<AddIcon />} onClick={() => addItem(draft.projects, { ...EMPTY_PROJECT }, "projects")}>Add Project</Button></Box>

        <Typography variant="subtitle1" gutterBottom>Certifications</Typography>
        <Stack spacing={2}>
          {draft.certifications.map((entry, index) => (
            <Paper key={`cert-${index}`} variant="outlined" sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}><TextField label="Certification Name" fullWidth value={entry.name} onChange={(e) => handleCertificationChange(index, "name", e.target.value)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField label="Issuer" fullWidth value={entry.issuer} onChange={(e) => handleCertificationChange(index, "issuer", e.target.value)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField label="Issue Date" type="month" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={entry.issueDate} onChange={(e) => handleCertificationChange(index, "issueDate", e.target.value)} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField label="Credential ID" fullWidth value={entry.credentialId} onChange={(e) => handleCertificationChange(index, "credentialId", e.target.value)} /></Grid>
                <Grid size={{ xs: 12 }}><Button color="error" onClick={() => removeItem("certifications", index)}>Remove Entry</Button></Grid>
              </Grid>
            </Paper>
          ))}
        </Stack>
        <Box sx={{ mt: 2 }}><Button variant="outlined" startIcon={<AddIcon />} onClick={() => addItem(draft.certifications, { ...EMPTY_CERTIFICATION }, "certifications")}>Add Certification</Button></Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle1" gutterBottom>Generate Documents</Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
          {(["docx", "markdown", "pdf"] as const).map((format) => (
            <Button key={format} variant="outlined" startIcon={<DownloadIcon />} disabled={generatingKey === format} onClick={() => handleGenerate(format)}>
              {generatingKey === format ? `Generating ${format.toUpperCase()}...` : `Generate ${format.toUpperCase()}`}
            </Button>
          ))}
        </Box>

        {version.documents.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No generated documents yet.</Typography>
        ) : (
          <Stack spacing={1}>
            {version.documents.map((document) => (
              <Box key={document.id} sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                <Box>
                  <Typography variant="body2">{document.label}</Typography>
                  <Typography variant="caption" color="text.secondary">Generated {formatRelativeTime(document.createdAt)}</Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Button size="small" href={`/api/files/${document.filePath}?download=1`} target="_blank" rel="noopener noreferrer">Download</Button>
                  <Button size="small" color="error" startIcon={<DeleteOutlineIcon />} disabled={deletingDocumentId === document.id} onClick={() => handleDeleteGeneratedDocument(document.id)}>
                    {deletingDocumentId === document.id ? "Deleting..." : "Delete"}
                  </Button>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      <Box
        sx={{
          position: "sticky",
          bottom: 16,
          zIndex: 10,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          pb: 1,
        }}
      >
        <Paper
          elevation={6}
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            gap: 2,
            pointerEvents: "auto",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {typeof navigator !== "undefined" && navigator.platform.includes("Mac")
              ? "Cmd+S to save, Cmd+P to preview"
              : "Ctrl+S to save, Ctrl+P to preview"}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            disabled={previewing || saving}
            onClick={() => void handlePreview()}
          >
            {previewing ? "Previewing..." : "Preview PDF"}
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} disabled={saving || previewing} onClick={() => void handleSave()}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Paper>
      </Box>

      <Dialog open={summaryDialogOpen} onClose={() => setSummaryDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Review Rewritten Summary</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom>Current Summary</Typography>
              <Paper variant="outlined" sx={{ p: 2, minHeight: 180 }}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {draft.summary || "(empty)"}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom>Proposed Summary</Typography>
              <Paper variant="outlined" sx={{ p: 2, minHeight: 180 }}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {summarySuggestion || "(empty)"}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSummaryDialogOpen(false)}>Keep Current</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (draft && summarySuggestion !== null) {
                updateDraft({ ...draft, summary: summarySuggestion });
              }
              setSummaryDialogOpen(false);
            }}
          >
            Accept Rewrite
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={summaryCoachingDialogOpen} onClose={() => setSummaryCoachingDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Summary Coaching</DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              "& p": { my: 0 },
              "& ul, & ol": { my: 0, pl: 3 },
              "& li": { mb: 0.5 },
              "& h1, & h2, & h3, & h4, & h5, & h6": { my: 0, fontSize: "1rem", fontWeight: 700 },
              "& a": { color: "primary.main" },
              "& code": {
                fontFamily: "monospace",
                backgroundColor: "action.hover",
                px: 0.5,
                py: 0.125,
                borderRadius: 0.5,
              },
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {summaryCoaching || "(no coaching returned)"}
            </ReactMarkdown>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSummaryCoachingDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={skillsDialogOpen} onClose={() => setSkillsDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Review Rewritten Skills</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom>Current Skills</Typography>
              <Paper variant="outlined" sx={{ p: 2, minHeight: 180 }}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {draft.skills || "(empty)"}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom>Proposed Skills</Typography>
              <Paper variant="outlined" sx={{ p: 2, minHeight: 180 }}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {skillsSuggestion || "(empty)"}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSkillsDialogOpen(false)}>Keep Current</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (draft && skillsSuggestion !== null) {
                updateDraft({ ...draft, skills: skillsSuggestion });
              }
              setSkillsDialogOpen(false);
            }}
          >
            Accept Rewrite
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={skillsCoachingDialogOpen} onClose={() => setSkillsCoachingDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Skills Coaching</DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              "& p": { my: 0 },
              "& ul, & ol": { my: 0, pl: 3 },
              "& li": { mb: 0.5 },
              "& h1, & h2, & h3, & h4, & h5, & h6": { my: 0, fontSize: "1rem", fontWeight: 700 },
              "& a": { color: "primary.main" },
              "& code": {
                fontFamily: "monospace",
                backgroundColor: "action.hover",
                px: 0.5,
                py: 0.125,
                borderRadius: 0.5,
              },
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {skillsCoaching || "(no coaching returned)"}
            </ReactMarkdown>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSkillsCoachingDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={workBulletsDialogOpen} onClose={() => setWorkBulletsDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Review Rewritten Work Bullets</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom>Current Bullets</Typography>
              <Paper variant="outlined" sx={{ p: 2, minHeight: 180 }}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {(workBulletsSuggestionIndex !== null && draft.workExperience[workBulletsSuggestionIndex]?.bullets) || "(empty)"}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom>Proposed Bullets</Typography>
              <Paper variant="outlined" sx={{ p: 2, minHeight: 180 }}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {workBulletsSuggestion || "(empty)"}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkBulletsDialogOpen(false)}>Keep Current</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (draft && workBulletsSuggestion !== null && workBulletsSuggestionIndex !== null) {
                handleWorkExperienceChange(workBulletsSuggestionIndex, "bullets", workBulletsSuggestion);
              }
              setWorkBulletsDialogOpen(false);
            }}
          >
            Accept Rewrite
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={workBulletsCoachingDialogOpen} onClose={() => setWorkBulletsCoachingDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Work Bullets Coaching</DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              "& p": { my: 0 },
              "& ul, & ol": { my: 0, pl: 3 },
              "& li": { mb: 0.5 },
              "& h1, & h2, & h3, & h4, & h5, & h6": { my: 0, fontSize: "1rem", fontWeight: 700 },
              "& a": { color: "primary.main" },
              "& code": {
                fontFamily: "monospace",
                backgroundColor: "action.hover",
                px: 0.5,
                py: 0.125,
                borderRadius: 0.5,
              },
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {workBulletsCoaching || "(no coaching returned)"}
            </ReactMarkdown>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkBulletsCoachingDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={educationFieldDialogOpen} onClose={() => setEducationFieldDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {educationFieldSuggestionTarget ? `Review Rewritten ${educationFieldLabels[educationFieldSuggestionTarget.field]}` : "Review Rewritten Education Field"}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom>Current Content</Typography>
              <Paper variant="outlined" sx={{ p: 2, minHeight: 180 }}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {(educationFieldSuggestionTarget &&
                    draft.education[educationFieldSuggestionTarget.index]?.[educationFieldSuggestionTarget.field]) || "(empty)"}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" gutterBottom>Proposed Content</Typography>
              <Paper variant="outlined" sx={{ p: 2, minHeight: 180 }}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {educationFieldSuggestion || "(empty)"}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEducationFieldDialogOpen(false)}>Keep Current</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (draft && educationFieldSuggestion !== null && educationFieldSuggestionTarget) {
                handleEducationChange(educationFieldSuggestionTarget.index, educationFieldSuggestionTarget.field, educationFieldSuggestion);
              }
              setEducationFieldDialogOpen(false);
            }}
          >
            Accept Rewrite
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={educationFieldCoachingDialogOpen} onClose={() => setEducationFieldCoachingDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {coachingEducationField ? `${educationFieldLabels[coachingEducationField.field]} Coaching` : "Education Field Coaching"}
        </DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              "& p": { my: 0 },
              "& ul, & ol": { my: 0, pl: 3 },
              "& li": { mb: 0.5 },
              "& h1, & h2, & h3, & h4, & h5, & h6": { my: 0, fontSize: "1rem", fontWeight: 700 },
              "& a": { color: "primary.main" },
              "& code": {
                fontFamily: "monospace",
                backgroundColor: "action.hover",
                px: 0.5,
                py: 0.125,
                borderRadius: 0.5,
              },
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {educationFieldCoaching || "(no coaching returned)"}
            </ReactMarkdown>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEducationFieldCoachingDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
  const handleEducationGpaBlur = (index: number) => {
    if (!draft) return;
    const currentValue = draft.education[index]?.gpa ?? "";
    if (!currentValue.trim()) return;
    const parsed = Number(currentValue);
    if (!Number.isFinite(parsed)) {
      handleEducationChange(index, "gpa", "");
      return;
    }
    const clamped = Math.min(4, Math.max(0, parsed));
    handleEducationChange(index, "gpa", clamped.toFixed(2));
  };
