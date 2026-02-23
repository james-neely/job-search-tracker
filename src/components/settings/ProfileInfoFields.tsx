"use client";

import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid2";

const PROFILE_FIELDS = [
  { key: "full_name", label: "Full Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone Number" },
  { key: "current_company", label: "Current Company" },
  { key: "current_job_title", label: "Current Job Title" },
  { key: "linkedin_url", label: "LinkedIn URL" },
  { key: "x_url", label: "X URL" },
  { key: "github_url", label: "GitHub URL" },
  { key: "portfolio_url", label: "Portfolio URL" },
  { key: "website_url", label: "Website URL" },
] as const;

interface ProfileInfoFieldsProps {
  settings: Record<string, string>;
  onChange: (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ProfileInfoFields({
  settings,
  onChange,
}: ProfileInfoFieldsProps) {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Profile Information
      </Typography>
      <Grid container spacing={3}>
        {PROFILE_FIELDS.map(({ key, label }) => (
          <Grid key={key} size={{ xs: 12, sm: 6 }}>
            <TextField
              label={label}
              value={settings[key] || ""}
              onChange={onChange(key)}
              fullWidth
            />
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
