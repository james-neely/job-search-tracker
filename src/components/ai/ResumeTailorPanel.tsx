"use client";

import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import AiResponseCard from "./AiResponseCard";

interface ResumeTailorPanelProps {
  companyName: string;
  jobTitle: string;
  jobDescription?: string;
}

export default function ResumeTailorPanel({
  companyName,
  jobTitle,
  jobDescription,
}: ResumeTailorPanelProps) {
  const [documentText, setDocumentText] = useState("");
  const [documentType, setDocumentType] = useState<"resume" | "cover_letter">("resume");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setContent("");

    try {
      const response = await fetch("/api/ai/tailor-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          jobTitle,
          jobDescription,
          documentText,
          documentType,
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || "Failed to tailor document");
      }

      if (!response.ok) throw new Error("Failed to tailor document");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let done = false;
      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) {
          setContent((prev) => prev + decoder.decode(result.value));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Document Type</InputLabel>
        <Select
          value={documentType}
          label="Document Type"
          onChange={(e) => setDocumentType(e.target.value as "resume" | "cover_letter")}
        >
          <MenuItem value="resume">Resume</MenuItem>
          <MenuItem value="cover_letter">Cover Letter</MenuItem>
        </Select>
      </FormControl>
      <TextField
        label="Paste your document text"
        multiline
        rows={6}
        fullWidth
        value={documentText}
        onChange={(e) => setDocumentText(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button
        variant="contained"
        onClick={handleGenerate}
        disabled={loading}
      >
        Generate Tailored {documentType === "resume" ? "Resume" : "Cover Letter"}
      </Button>
      <AiResponseCard content={content} loading={loading} error={error} />
    </Box>
  );
}
