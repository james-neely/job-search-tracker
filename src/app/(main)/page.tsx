"use client";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid2";
import StatsGrid from "@/components/dashboard/StatsGrid";
import StatusBreakdown from "@/components/dashboard/StatusBreakdown";
import RecentActivity from "@/components/dashboard/RecentActivity";
import QuickCopyGrid from "@/components/dashboard/QuickCopyGrid";
import LoadingState from "@/components/common/LoadingState";
import type { DashboardStats } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([statsData, settingsData]) => {
        setStats(statsData);
        setSettings(settingsData);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (!stats) return <Typography>Failed to load stats.</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>
      <StatsGrid stats={stats} />
      <QuickCopySection settings={settings} />
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Status Breakdown
            </Typography>
            <StatusBreakdown breakdown={stats.statusBreakdown} />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <RecentActivity activity={stats.recentActivity} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

function QuickCopySection({ settings }: { settings: Record<string, string> }) {
  const hasProfileData = [
    "full_name", "email", "phone", "current_company", "current_job_title",
    "linkedin_url", "x_url", "github_url", "portfolio_url", "website_url",
  ].some((key) => settings[key]);

  if (!hasProfileData) return null;

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Quick Copy
      </Typography>
      <QuickCopyGrid settings={settings} />
    </Paper>
  );
}
