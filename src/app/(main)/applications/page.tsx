"use client";
import { useState, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid2";
import Button from "@mui/material/Button";
import Link from "next/link";
import ApplicationList from "@/components/applications/ApplicationList";
import LoadingState from "@/components/common/LoadingState";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/constants";
import type { Application } from "@/types";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchApplications = useCallback(async () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter) params.set("status", statusFilter);
    params.set("sortBy", sortBy);
    params.set("sortOrder", "desc");

    const response = await fetch(`/api/applications?${params}`);
    const data = await response.json();
    setApplications(data);
    setLoading(false);
  }, [debouncedSearch, statusFilter, sortBy]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Applications</Typography>
        <Button component={Link} href="/applications/new">New Application</Button>
      </Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label="Search" value={search} onChange={(e) => setSearch(e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} select fullWidth>
            <MenuItem value="">All</MenuItem>
            {APPLICATION_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>{STATUS_LABELS[s]}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label="Sort By" value={sortBy} onChange={(e) => setSortBy(e.target.value)} select fullWidth>
            <MenuItem value="updatedAt">Last Updated</MenuItem>
            <MenuItem value="createdAt">Created</MenuItem>
            <MenuItem value="companyName">Company Name</MenuItem>
            <MenuItem value="dateApplied">Date Applied</MenuItem>
          </TextField>
        </Grid>
      </Grid>
      {loading ? <LoadingState /> : <ApplicationList applications={applications} />}
    </Box>
  );
}
