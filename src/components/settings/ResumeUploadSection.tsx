"use client";

import { useCallback, useEffect, useState } from "react";
import type { ResumeVersion } from "@/types";
import { formatRelativeTime } from "@/lib/utils";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import ArticleIcon from "@mui/icons-material/Article";
import AddIcon from "@mui/icons-material/Add";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import DownloadIcon from "@mui/icons-material/Download";
import SaveIcon from "@mui/icons-material/Save";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid2";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

interface Props {
  initialResumePath: string;
}

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

const MARGIN_OPTIONS = ["0.25", "0.5", "0.75", "1", "1.25", "1.5"] as const;

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

export default function ResumeUploadSection({ initialResumePath }: Props) {
  const [resumePath, setResumePath] = useState(initialResumePath);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textOpen, setTextOpen] = useState(false);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [drafts, setDrafts] = useState<Record<number, ResumeDraft>>({});
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [forkingId, setForkingId] = useState<number | null>(null);
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null);

  const syncVersions = (nextVersions: ResumeVersion[]) => {
    setVersions(nextVersions);
    setDrafts(
      Object.fromEntries(nextVersions.map((version) => [version.id, createDraft(version)]))
    );
  };

  const loadVersions = useCallback(async () => {
    setLoadingVersions(true);
    try {
      const response = await fetch("/api/resume/versions");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load resume versions");
      }
      syncVersions(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load resume versions");
    } finally {
      setLoadingVersions(false);
    }
  }, []);

  useEffect(() => {
    void loadVersions();
  }, [loadVersions]);

  useEffect(() => {
    if (initialResumePath) {
      return;
    }

    void (async () => {
      const response = await fetch("/api/settings");
      const data = await response.json();
      setResumePath(data.resume_path || "");
    })();
  }, [initialResumePath]);

  const handleViewText = async () => {
    if (!resumeText) {
      const data = await fetch("/api/settings").then((r) => r.json());
      setResumeText(data.resume_text || "(no text extracted)");
    }
    setTextOpen(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/resume", { method: "POST", body: formData });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Upload failed");
    } else {
      setResumePath(data.filename);
      setResumeText(null);
    }

    setUploading(false);
    e.target.value = "";
  };

  const handleDelete = async () => {
    setError(null);
    try {
      const response = await fetch("/api/resume", { method: "DELETE" });
      if (response.ok) {
        setResumePath("");
        setResumeText(null);
      } else {
        setError("Failed to remove resume");
      }
    } catch {
      setError("Failed to remove resume. Please try again.");
    }
  };

  const updateDraft = (versionId: number, nextDraft: ResumeDraft) => {
    setDrafts((current) => ({ ...current, [versionId]: nextDraft }));
  };

  const handleDraftChange = (
    versionId: number,
    field: keyof ResumeDraft,
    value: string
  ) => {
    const currentDraft = drafts[versionId];
    if (!currentDraft || field === "education" || field === "workExperience" || field === "projects" || field === "certifications") return;
    updateDraft(versionId, { ...currentDraft, [field]: value });
  };

  const handleEducationChange = (
    versionId: number,
    index: number,
    field: keyof EducationDraft,
    value: string
  ) => {
    const currentDraft = drafts[versionId];
    if (!currentDraft) return;

    const nextEducation = currentDraft.education.map((entry, entryIndex) => (
      entryIndex === index ? { ...entry, [field]: value } : entry
    ));
    updateDraft(versionId, { ...currentDraft, education: nextEducation });
  };

  const handleAddEducation = (versionId: number) => {
    const currentDraft = drafts[versionId];
    if (!currentDraft) return;
    updateDraft(versionId, {
      ...currentDraft,
      education: [...currentDraft.education, { ...EMPTY_EDUCATION }],
    });
  };

  const handleWorkExperienceChange = (
    versionId: number,
    index: number,
    field: keyof WorkExperienceDraft,
    value: string
  ) => {
    const currentDraft = drafts[versionId];
    if (!currentDraft) return;
    const nextItems = currentDraft.workExperience.map((entry, entryIndex) => (
      entryIndex === index ? { ...entry, [field]: value } : entry
    ));
    updateDraft(versionId, { ...currentDraft, workExperience: nextItems });
  };

  const handleAddWorkExperience = (versionId: number) => {
    const currentDraft = drafts[versionId];
    if (!currentDraft) return;
    updateDraft(versionId, {
      ...currentDraft,
      workExperience: [...currentDraft.workExperience, { ...EMPTY_WORK_EXPERIENCE }],
    });
  };

  const handleRemoveWorkExperience = (versionId: number, index: number) => {
    const currentDraft = drafts[versionId];
    if (!currentDraft) return;
    updateDraft(versionId, {
      ...currentDraft,
      workExperience: currentDraft.workExperience.filter((_, entryIndex) => entryIndex !== index),
    });
  };

  const handleProjectChange = (
    versionId: number,
    index: number,
    field: keyof ProjectDraft,
    value: string
  ) => {
    const currentDraft = drafts[versionId];
    if (!currentDraft) return;
    const nextItems = currentDraft.projects.map((entry, entryIndex) => (
      entryIndex === index ? { ...entry, [field]: value } : entry
    ));
    updateDraft(versionId, { ...currentDraft, projects: nextItems });
  };

  const handleAddProject = (versionId: number) => {
    const currentDraft = drafts[versionId];
    if (!currentDraft) return;
    updateDraft(versionId, {
      ...currentDraft,
      projects: [...currentDraft.projects, { ...EMPTY_PROJECT }],
    });
  };

  const handleRemoveProject = (versionId: number, index: number) => {
    const currentDraft = drafts[versionId];
    if (!currentDraft) return;
    updateDraft(versionId, {
      ...currentDraft,
      projects: currentDraft.projects.filter((_, entryIndex) => entryIndex !== index),
    });
  };

  const handleCertificationChange = (
    versionId: number,
    index: number,
    field: keyof CertificationDraft,
    value: string
  ) => {
    const currentDraft = drafts[versionId];
    if (!currentDraft) return;
    const nextItems = currentDraft.certifications.map((entry, entryIndex) => (
      entryIndex === index ? { ...entry, [field]: value } : entry
    ));
    updateDraft(versionId, { ...currentDraft, certifications: nextItems });
  };

  const handleAddCertification = (versionId: number) => {
    const currentDraft = drafts[versionId];
    if (!currentDraft) return;
    updateDraft(versionId, {
      ...currentDraft,
      certifications: [...currentDraft.certifications, { ...EMPTY_CERTIFICATION }],
    });
  };

  const handleRemoveCertification = (versionId: number, index: number) => {
    const currentDraft = drafts[versionId];
    if (!currentDraft) return;
    updateDraft(versionId, {
      ...currentDraft,
      certifications: currentDraft.certifications.filter((_, entryIndex) => entryIndex !== index),
    });
  };

  const handleRemoveEducation = (versionId: number, index: number) => {
    const currentDraft = drafts[versionId];
    if (!currentDraft) return;
    updateDraft(versionId, {
      ...currentDraft,
      education: currentDraft.education.filter((_, entryIndex) => entryIndex !== index),
    });
  };

  const handleCreateVersion = async () => {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/resume/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Resume Version ${versions.length + 1}` }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create resume version");
      }
      syncVersions([data, ...versions]);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create resume version");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveVersion = async (versionId: number) => {
    const draft = drafts[versionId];
    if (!draft) return;

    setSavingId(versionId);
    setError(null);
    try {
      const response = await fetch(`/api/resume/versions/${versionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save resume version");
      }
      syncVersions(versions.map((version) => (version.id === versionId ? data : version)));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save resume version");
    } finally {
      setSavingId(null);
    }
  };

  const handleForkVersion = async (versionId: number) => {
    setForkingId(versionId);
    setError(null);
    try {
      const response = await fetch(`/api/resume/versions/${versionId}/fork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to fork resume version");
      }
      syncVersions([data, ...versions]);
    } catch (forkError) {
      setError(forkError instanceof Error ? forkError.message : "Failed to fork resume version");
    } finally {
      setForkingId(null);
    }
  };

  const handleGenerate = async (versionId: number, format: "markdown" | "pdf" | "docx") => {
    setGeneratingKey(`${versionId}:${format}`);
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
      syncVersions(
        versions.map((version) => (
          version.id === versionId
            ? { ...version, documents: [data, ...version.documents] }
            : version
        ))
      );
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : `Failed to generate ${format.toUpperCase()} resume`);
    } finally {
      setGeneratingKey(null);
    }
  };

  const handleDeleteGeneratedDocument = async (versionId: number, documentId: number) => {
    setDeletingDocumentId(documentId);
    setError(null);
    try {
      const response = await fetch(`/api/resume/documents/${documentId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete generated document");
      }
      syncVersions(
        versions.map((version) => (
          version.id === versionId
            ? {
              ...version,
              documents: version.documents.filter((document) => document.id !== documentId),
            }
            : version
        ))
      );
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete generated document");
    } finally {
      setDeletingDocumentId(null);
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Resume Source File</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {resumePath ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <ArticleIcon color="primary" />
            <Typography>Uploaded resume on file</Typography>
            <Button
              variant="outlined"
              size="small"
              href={`/api/files/${resumePath}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Preview
            </Button>
            <Button variant="outlined" size="small" onClick={handleViewText}>
              View Text
            </Button>
            <Button variant="outlined" size="small" color="error" onClick={handleDelete}>
              Remove
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Button component="label" variant="outlined" disabled={uploading}>
              {uploading ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
              Upload Resume
              <input type="file" accept=".pdf,.txt" hidden onChange={handleUpload} />
            </Button>
            <Typography variant="body2" color="text.secondary">
              Accepted formats: PDF, TXT
            </Typography>
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="h6" gutterBottom>Resume Builder</Typography>
            <Typography variant="body2" color="text.secondary">
              Create blank versions, fork existing ones, edit education entries, and generate stored exports.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateVersion} disabled={creating}>
            {creating ? "Creating..." : "Create New Resume"}
          </Button>
        </Box>

        {loadingVersions ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 3 }}>
            <CircularProgress size={24} />
            <Typography>Loading resume versions...</Typography>
          </Box>
        ) : versions.length === 0 ? (
          <Alert severity="info">No resume versions yet. Create one to start building education entries.</Alert>
        ) : (
          <Stack spacing={3}>
            {versions.map((version) => {
              const draft = drafts[version.id] ?? createDraft(version);

              return (
                <Paper key={version.id} variant="outlined" sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 2, flexWrap: "wrap" }}>
                    <Box>
                      <Typography variant="h6">{version.title}</Typography>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                        <Chip size="small" label={`Version ${version.id}`} />
                        <Chip
                          size="small"
                          variant="outlined"
                          label={version.parentTitle ? `Forked from ${version.parentTitle}` : "Blank base"}
                        />
                      </Stack>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<CallSplitIcon />}
                        disabled={forkingId === version.id}
                        onClick={() => handleForkVersion(version.id)}
                      >
                        {forkingId === version.id ? "Forking..." : "Fork"}
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<SaveIcon />}
                        disabled={savingId === version.id}
                        onClick={() => handleSaveVersion(version.id)}
                      >
                        {savingId === version.id ? "Saving..." : "Save Changes"}
                      </Button>
                    </Box>
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Resume Title"
                        fullWidth
                        value={draft.title}
                        onChange={(e) => handleDraftChange(version.id, "title", e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Summary"
                        fullWidth
                        multiline
                        minRows={3}
                        value={draft.summary}
                        onChange={(e) => handleDraftChange(version.id, "summary", e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Skills"
                        fullWidth
                        multiline
                        minRows={2}
                        helperText="Comma-separated or one per line."
                        value={draft.skills}
                        onChange={(e) => handleDraftChange(version.id, "skills", e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                      <TextField
                        label="Font Size"
                        type="number"
                        fullWidth
                        slotProps={{ htmlInput: { min: 8, max: 16, step: 0.5 } }}
                        value={draft.fontSize}
                        onChange={(e) => handleDraftChange(version.id, "fontSize", e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                      <TextField
                        select
                        label="Margins"
                        fullWidth
                        value={draft.margin}
                        onChange={(e) => handleDraftChange(version.id, "margin", e.target.value)}
                      >
                        {MARGIN_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}&quot;
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
                        One value applies to all four sides.
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary">
                        Margin values are in inches. Font size is in points.
                      </Typography>
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle1" gutterBottom>Work Experience</Typography>
                  <Stack spacing={2}>
                    {draft.workExperience.map((entry, index) => (
                      <Paper key={`${version.id}-work-${index}`} variant="outlined" sx={{ p: 2 }}>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField label="Company" fullWidth value={entry.companyName} onChange={(e) => handleWorkExperienceChange(version.id, index, "companyName", e.target.value)} />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField label="Role Title" fullWidth value={entry.roleTitle} onChange={(e) => handleWorkExperienceChange(version.id, index, "roleTitle", e.target.value)} />
                          </Grid>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <TextField label="Location" fullWidth value={entry.location} onChange={(e) => handleWorkExperienceChange(version.id, index, "location", e.target.value)} />
                          </Grid>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <TextField label="Start Date" type="month" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={entry.startDate} onChange={(e) => handleWorkExperienceChange(version.id, index, "startDate", e.target.value)} />
                          </Grid>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <TextField label="End Date" type="month" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={entry.endDate} onChange={(e) => handleWorkExperienceChange(version.id, index, "endDate", e.target.value)} />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <TextField label="Bullets" fullWidth multiline minRows={3} helperText="One bullet per line or plain text." value={entry.bullets} onChange={(e) => handleWorkExperienceChange(version.id, index, "bullets", e.target.value)} />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Button color="error" onClick={() => handleRemoveWorkExperience(version.id, index)}>Remove Entry</Button>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                  </Stack>

                  <Box sx={{ mt: 2, mb: 3 }}>
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handleAddWorkExperience(version.id)}>
                      Add Work Experience
                    </Button>
                  </Box>

                  <Typography variant="subtitle1" gutterBottom>Education</Typography>
                  <Stack spacing={2}>
                    {draft.education.map((entry, index) => (
                      <Paper key={`${version.id}-${index}`} variant="outlined" sx={{ p: 2 }}>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                              label="School"
                              fullWidth
                              value={entry.schoolName}
                              onChange={(e) => handleEducationChange(version.id, index, "schoolName", e.target.value)}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                              label="Degree"
                              fullWidth
                              value={entry.degree}
                              onChange={(e) => handleEducationChange(version.id, index, "degree", e.target.value)}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                              label="Field of Study"
                              fullWidth
                              value={entry.fieldOfStudy}
                              onChange={(e) => handleEducationChange(version.id, index, "fieldOfStudy", e.target.value)}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 3 }}>
                            <TextField
                              label="GPA"
                              fullWidth
                              value={entry.gpa}
                              onChange={(e) => handleEducationChange(version.id, index, "gpa", e.target.value)}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 3 }}>
                            <TextField
                              label="Start Date"
                              type="month"
                              fullWidth
                              slotProps={{ inputLabel: { shrink: true } }}
                              value={entry.startDate}
                              onChange={(e) => handleEducationChange(version.id, index, "startDate", e.target.value)}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 3 }}>
                            <TextField
                              label="End Date"
                              type="month"
                              fullWidth
                              slotProps={{ inputLabel: { shrink: true } }}
                              value={entry.endDate}
                              onChange={(e) => handleEducationChange(version.id, index, "endDate", e.target.value)}
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              label="Courses"
                              fullWidth
                              multiline
                              minRows={2}
                              helperText="Comma-separated or one per line."
                              value={entry.courses}
                              onChange={(e) => handleEducationChange(version.id, index, "courses", e.target.value)}
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              label="Awards / Honors"
                              fullWidth
                              multiline
                              minRows={2}
                              value={entry.awardsHonors}
                              onChange={(e) => handleEducationChange(version.id, index, "awardsHonors", e.target.value)}
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              label="Description"
                              fullWidth
                              multiline
                              minRows={3}
                              value={entry.description}
                              onChange={(e) => handleEducationChange(version.id, index, "description", e.target.value)}
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Button color="error" onClick={() => handleRemoveEducation(version.id, index)}>
                              Remove Entry
                            </Button>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                  </Stack>

                  <Box sx={{ mt: 2 }}>
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handleAddEducation(version.id)}>
                      Add Education Entry
                    </Button>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="subtitle1" gutterBottom>Projects</Typography>
                  <Stack spacing={2}>
                    {draft.projects.map((entry, index) => (
                      <Paper key={`${version.id}-project-${index}`} variant="outlined" sx={{ p: 2 }}>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField label="Project Name" fullWidth value={entry.name} onChange={(e) => handleProjectChange(version.id, index, "name", e.target.value)} />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField label="Link" fullWidth value={entry.link} onChange={(e) => handleProjectChange(version.id, index, "link", e.target.value)} />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <TextField label="Technologies" fullWidth value={entry.technologies} onChange={(e) => handleProjectChange(version.id, index, "technologies", e.target.value)} />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <TextField label="Description" fullWidth multiline minRows={3} value={entry.description} onChange={(e) => handleProjectChange(version.id, index, "description", e.target.value)} />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Button color="error" onClick={() => handleRemoveProject(version.id, index)}>Remove Entry</Button>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                  </Stack>

                  <Box sx={{ mt: 2, mb: 3 }}>
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handleAddProject(version.id)}>
                      Add Project
                    </Button>
                  </Box>

                  <Typography variant="subtitle1" gutterBottom>Certifications</Typography>
                  <Stack spacing={2}>
                    {draft.certifications.map((entry, index) => (
                      <Paper key={`${version.id}-cert-${index}`} variant="outlined" sx={{ p: 2 }}>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField label="Certification Name" fullWidth value={entry.name} onChange={(e) => handleCertificationChange(version.id, index, "name", e.target.value)} />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField label="Issuer" fullWidth value={entry.issuer} onChange={(e) => handleCertificationChange(version.id, index, "issuer", e.target.value)} />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField label="Issue Date" type="month" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={entry.issueDate} onChange={(e) => handleCertificationChange(version.id, index, "issueDate", e.target.value)} />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField label="Credential ID" fullWidth value={entry.credentialId} onChange={(e) => handleCertificationChange(version.id, index, "credentialId", e.target.value)} />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Button color="error" onClick={() => handleRemoveCertification(version.id, index)}>Remove Entry</Button>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                  </Stack>

                  <Box sx={{ mt: 2 }}>
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handleAddCertification(version.id)}>
                      Add Certification
                    </Button>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="subtitle1" gutterBottom>Generate Documents</Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                    {(["docx", "markdown", "pdf"] as const).map((format) => (
                      <Button
                        key={format}
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        disabled={generatingKey === `${version.id}:${format}`}
                        onClick={() => handleGenerate(version.id, format)}
                      >
                        {generatingKey === `${version.id}:${format}` ? `Generating ${format.toUpperCase()}...` : `Generate ${format.toUpperCase()}`}
                      </Button>
                    ))}
                  </Box>

                  {version.documents.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No generated documents yet.
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {version.documents.map((document) => (
                        <Box
                          key={document.id}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 2,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <Box>
                            <Typography variant="body2">
                              {document.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Generated {formatRelativeTime(document.createdAt)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            <Button
                              size="small"
                              href={`/api/files/${document.filePath}?download=1`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Download
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<DeleteOutlineIcon />}
                              disabled={deletingDocumentId === document.id}
                              onClick={() => handleDeleteGeneratedDocument(version.id, document.id)}
                            >
                              {deletingDocumentId === document.id ? "Deleting..." : "Delete"}
                            </Button>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Paper>
              );
            })}
          </Stack>
        )}
      </Paper>

      <Dialog open={textOpen} onClose={() => setTextOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Extracted Resume Text</DialogTitle>
        <DialogContent dividers>
          <Typography
            component="pre"
            variant="body2"
            sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "monospace" }}
          >
            {resumeText}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTextOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
