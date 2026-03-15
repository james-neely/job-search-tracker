"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import ArticleIcon from "@mui/icons-material/Article";
import AddIcon from "@mui/icons-material/Add";
import CallSplitIcon from "@mui/icons-material/CallSplit";

export default function ResumeLibrary() {
  const router = useRouter();
  const [resumePath, setResumePath] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textOpen, setTextOpen] = useState(false);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [forkingId, setForkingId] = useState<string | null>(null);
  const [settingMainId, setSettingMainId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [versionsResponse, settingsResponse] = await Promise.all([
        fetch("/api/resume/versions"),
        fetch("/api/settings"),
      ]);
      const versionsData = await versionsResponse.json();
      const settingsData = await settingsResponse.json();

      if (!versionsResponse.ok) {
        throw new Error(versionsData.error ?? "Failed to load resumes");
      }

      setVersions(versionsData);
      setResumePath(settingsData.resume_path || "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load resumes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

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
      router.push(`/resume/${data.id}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create resume version");
    } finally {
      setCreating(false);
    }
  };

  const handleForkVersion = async (versionId: string) => {
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
      router.push(`/resume/${data.id}`);
    } catch (forkError) {
      setError(forkError instanceof Error ? forkError.message : "Failed to fork resume version");
    } finally {
      setForkingId(null);
    }
  };

  const handleSetMainVersion = async (versionId: string) => {
    setSettingMainId(versionId);
    setError(null);
    try {
      const response = await fetch(`/api/resume/versions/${versionId}/main`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to set main resume");
      }
      setVersions((current) =>
        current.map((version) => ({
          ...version,
          isMain: version.id === versionId,
        }))
      );
    } catch (setMainError) {
      setError(setMainError instanceof Error ? setMainError.message : "Failed to set main resume");
    } finally {
      setSettingMainId(null);
    }
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Resume Source File</Typography>
        {resumePath ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <ArticleIcon color="primary" />
            <Typography>Uploaded resume on file</Typography>
            <Button variant="outlined" size="small" href={`/api/files/${resumePath}`} target="_blank" rel="noopener noreferrer">
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

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="h6" gutterBottom>Resume Library</Typography>
            <Typography variant="body2" color="text.secondary">
              Open a specific resume to edit it at its own UUID-based route.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateVersion} disabled={creating}>
            {creating ? "Creating..." : "Create New Resume"}
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 3 }}>
            <CircularProgress size={24} />
            <Typography>Loading resumes...</Typography>
          </Box>
        ) : versions.length === 0 ? (
          <Alert severity="info">No resume versions yet. Create one to start.</Alert>
        ) : (
          <Stack spacing={2}>
            {versions.map((version) => (
              <Paper key={version.id} variant="outlined" sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
                  <Box>
                    <Typography variant="h6">{version.title}</Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1, mb: 1 }}>
                      {version.isMain ? <Chip size="small" color="primary" label="Main resume" /> : null}
                      <Chip size="small" label={version.parentTitle ? `Forked from ${version.parentTitle}` : "Blank base"} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Updated {formatRelativeTime(version.updatedAt)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button component={Link} href={`/resume/${version.id}`} variant="contained" size="small">
                      Open Builder
                    </Button>
                    <Button
                      variant={version.isMain ? "contained" : "outlined"}
                      size="small"
                      disabled={settingMainId === version.id || version.isMain}
                      onClick={() => handleSetMainVersion(version.id)}
                    >
                      {version.isMain ? "Main Resume" : settingMainId === version.id ? "Setting..." : "Set as Main"}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<CallSplitIcon />}
                      disabled={forkingId === version.id}
                      onClick={() => handleForkVersion(version.id)}
                    >
                      {forkingId === version.id ? "Forking..." : "Fork"}
                    </Button>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      <Dialog open={textOpen} onClose={() => setTextOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Extracted Resume Text</DialogTitle>
        <DialogContent dividers>
          <Typography component="pre" variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "monospace" }}>
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
