"use client";

import { useState } from "react";
import { Box, TextField, Button } from "@mui/material";
import AiResponseCard from "./AiResponseCard";

interface CompanyResearchPanelProps {
  companyName: string;
  jobTitle: string;
}

export default function CompanyResearchPanel({
  companyName,
  jobTitle,
}: CompanyResearchPanelProps) {
  const [notes, setNotes] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setContent("");

    try {
      const response = await fetch("/api/ai/company-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, jobTitle, notes }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate company research");
      }

      if (!response.ok) throw new Error("Failed to generate company research");
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
      <TextField
        label="Additional Notes"
        multiline
        rows={3}
        fullWidth
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button
        variant="contained"
        onClick={handleGenerate}
        disabled={loading}
      >
        Generate Company Research
      </Button>
      <AiResponseCard content={content} loading={loading} error={error} />
    </Box>
  );
}
