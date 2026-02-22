"use client";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid2";
import LoadingState from "@/components/common/LoadingState";

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

  if (loading) return <LoadingState message="Loading settings..." />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">Settings</Typography>
      {saved && <Alert severity="success" sx={{ mb: 2 }}>Settings saved.</Alert>}
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Unemployment Start Date"
              type="date"
              value={settings.unemployment_start_date || ""}
              onChange={(e) => setSettings((s) => ({ ...s, unemployment_start_date: e.target.value }))}
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
              onChange={(e) => setSettings((s) => ({ ...s, xai_api_key: e.target.value }))}
              fullWidth
              helperText="Required for AI-powered features (interview prep, company research, resume tailoring)"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Button onClick={handleSave} size="large">Save Settings</Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
