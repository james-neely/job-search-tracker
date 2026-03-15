"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid2";
import LoadingState from "@/components/common/LoadingState";
import ProfileInfoFields from "@/components/settings/ProfileInfoFields";
import CompanionServerSettingsSection from "@/components/settings/CompanionServerSettingsSection";
import CoverLetterSettingsSection from "@/components/settings/CoverLetterSettingsSection";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings((s) => ({ ...s, [key]: e.target.value }));
  };

  if (loading) return <LoadingState message="Loading settings..." />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">Settings</Typography>
      {saved && <Alert severity="success" sx={{ mb: 2 }}>Settings saved.</Alert>}

      <ProfileInfoFields settings={settings} onChange={handleChange} />

      <CompanionServerSettingsSection
        value={settings.companion_servers_json || ""}
        onChange={(nextValue) => setSettings((current) => ({ ...current, companion_servers_json: nextValue }))}
      />

      <CoverLetterSettingsSection settings={settings} onChange={handleChange} />

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>App Configuration</Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Unemployment Start Date"
              type="date"
              value={settings.unemployment_start_date || ""}
              onChange={handleChange("unemployment_start_date")}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              helperText="Used to calculate days of unemployment on the dashboard"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="xAI API Key"
              type="password"
              value={settings.xai_api_key || ""}
              onChange={handleChange("xai_api_key")}
              fullWidth
              helperText="Required for AI-powered features (interview prep, company research, resume tailoring)"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Button component={Link} href="/resume" variant="outlined" sx={{ mr: 2 }}>
              Open Resume Builder
            </Button>
            <Button onClick={handleSave} size="large">Save Settings</Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
