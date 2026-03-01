"use client";

import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import type { Application } from "@/types";

interface CoverLetterTabProps {
  application: Application;
  onUpdate: () => void;
}

export default function CoverLetterTab({ application, onUpdate }: CoverLetterTabProps) {
  const [text, setText] = useState(application.coverLetterText ?? "");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [selectedFont, setSelectedFont] = useState<"ocr-a" | "ocr-b">("ocr-a");

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateError(null);
    setText("");

    try {
      const response = await fetch("/api/ai/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: application.companyName,
          jobTitle: application.jobTitle,
          jobDescription: application.jobDescription,
          notes: application.notes,
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate cover letter");
      }

      if (!response.ok) throw new Error("Failed to generate cover letter");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let done = false;
      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) {
          setText((prev) => prev + decoder.decode(result.value));
        }
      }
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch(`/api/applications/${application.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverLetterText: text }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveStatus("success");
      onUpdate();
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGeneratePdf = async () => {
    if (!text.trim()) return;

    setGeneratingPdf(true);
    setPdfError(null);

    try {
      const response = await fetch(`/api/applications/${application.id}/cover-letter/generate-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ font: selectedFont, text }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate PDF");
      }

      const result = await response.json();
      onUpdate();
      window.open(`/api/files/${result.document.filePath}`, "_blank");
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">Cover Letter</Typography>
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={generating}
          startIcon={generating ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {generating ? "Generating..." : "Generate with AI"}
        </Button>
      </Box>

      {generateError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {generateError}
        </Alert>
      )}

      <TextField
        multiline
        minRows={16}
        fullWidth
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste or type your cover letter here, or use Generate with AI."
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button
          variant="outlined"
          startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
          onClick={handleCopy}
          disabled={!text}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Font</InputLabel>
          <Select
            value={selectedFont}
            label="Font"
            onChange={(e) => setSelectedFont(e.target.value as "ocr-a" | "ocr-b")}
          >
            <MenuItem value="ocr-a">Courier (OCR-style)</MenuItem>
            <MenuItem value="ocr-b">Courier Bold (OCR-style)</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          color="secondary"
          startIcon={generatingPdf ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdfIcon />}
          onClick={handleGeneratePdf}
          disabled={generatingPdf || !text.trim()}
        >
          {generatingPdf ? "Generating PDF..." : "Generate PDF"}
        </Button>
        {saveStatus === "success" && <Alert severity="success" sx={{ py: 0 }}>Saved</Alert>}
        {saveStatus === "error" && <Alert severity="error" sx={{ py: 0 }}>Save failed</Alert>}
      </Box>

      {pdfError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {pdfError}
        </Alert>
      )}
    </Paper>
  );
}
