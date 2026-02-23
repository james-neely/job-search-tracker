"use client";

import { useState } from "react";
import Grid from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";

const PROFILE_FIELDS = [
  { key: "full_name", label: "Full Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "current_company", label: "Current Company" },
  { key: "current_job_title", label: "Current Job Title" },
  { key: "linkedin_url", label: "LinkedIn" },
  { key: "x_url", label: "X" },
  { key: "github_url", label: "GitHub" },
  { key: "portfolio_url", label: "Portfolio" },
  { key: "website_url", label: "Website" },
] as const;

interface QuickCopyGridProps {
  settings: Record<string, string>;
}

export default function QuickCopyGrid({ settings }: QuickCopyGridProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const visibleFields = PROFILE_FIELDS.filter((f) => settings[f.key]);

  if (visibleFields.length === 0) return null;

  const handleCopy = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <Grid container spacing={1}>
      {visibleFields.map(({ key, label }) => (
        <Grid key={key} size={{ xs: 12, sm: 6, md: 4 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="body2" noWrap>
                {settings[key]}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => handleCopy(key, settings[key])}
            >
              {copiedKey === key ? (
                <CheckIcon fontSize="small" color="success" />
              ) : (
                <ContentCopyIcon fontSize="small" />
              )}
            </IconButton>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}
