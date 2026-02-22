"use client";

import { useState } from "react";
import {
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Button,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";

interface AiResponseCardProps {
  content: string;
  loading: boolean;
  error: string | null;
}

export default function AiResponseCard({
  content,
  loading,
  error,
}: AiResponseCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!content) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Button
          size="small"
          startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
          onClick={handleCopy}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </Box>
      <Typography component="div" sx={{ whiteSpace: "pre-wrap" }}>
        {content}
      </Typography>
    </Paper>
  );
}
