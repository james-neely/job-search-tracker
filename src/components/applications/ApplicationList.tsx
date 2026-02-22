"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import ApplicationCard from "./ApplicationCard";
import type { Application } from "@/types";

interface ApplicationListProps {
  applications: Application[];
}

export default function ApplicationList({ applications }: ApplicationListProps) {
  if (applications.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No applications yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Start tracking your job search by creating your first application.
        </Typography>
        <Button
          component={Link}
          href="/applications/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          New Application
        </Button>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {applications.map((application) => (
        <Grid key={application.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <ApplicationCard application={application} />
        </Grid>
      ))}
    </Grid>
  );
}
