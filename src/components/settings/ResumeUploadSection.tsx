"use client";
import { useState } from "react";
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

interface Props {
  initialResumePath: string;
}

export default function ResumeUploadSection({ initialResumePath }: Props) {
  const [resumePath, setResumePath] = useState(initialResumePath);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textOpen, setTextOpen] = useState(false);
  const [resumeText, setResumeText] = useState<string | null>(null);

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

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Resume</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {resumePath ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <ArticleIcon color="primary" />
          <Typography>Resume on file</Typography>
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button component="label" variant="outlined" disabled={uploading}>
            {uploading ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
            Upload Resume
            <input type="file" accept=".pdf,.txt" hidden onChange={handleUpload} />
          </Button>
          <Typography variant="body2" color="text.secondary">
            Accepted formats: PDF, TXT (max 15,000 characters extracted)
          </Typography>
        </Box>
      )}
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
    </Paper>
  );
}
