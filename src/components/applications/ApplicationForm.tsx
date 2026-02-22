"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/constants";
import type { Application } from "@/types";

interface Props {
  application?: Application;
}

export default function ApplicationForm({ application }: Props) {
  const router = useRouter();
  const isEdit = !!application;

  const [form, setForm] = useState({
    companyName: application?.companyName ?? "",
    jobTitle: application?.jobTitle ?? "",
    status: application?.status ?? "saved",
    salaryAsked: application?.salaryAsked?.toString() ?? "",
    salaryMin: application?.salaryMin?.toString() ?? "",
    salaryMax: application?.salaryMax?.toString() ?? "",
    jobDescriptionUrl: application?.jobDescriptionUrl ?? "",
    jobDescription: application?.jobDescription ?? "",
    notes: application?.notes ?? "",
    dateApplied: application?.dateApplied ?? "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      salaryAsked: form.salaryAsked ? Number(form.salaryAsked) : null,
      salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
      salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
      jobDescriptionUrl: form.jobDescriptionUrl || null,
      jobDescription: form.jobDescription || null,
      notes: form.notes || null,
      dateApplied: form.dateApplied || null,
    };

    const url = isEdit ? `/api/applications/${application.id}` : "/api/applications";
    const method = isEdit ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      router.push(`/applications/${data.id}`);
      router.refresh();
    }
    setSaving(false);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h5" gutterBottom>
        {isEdit ? "Edit Application" : "New Application"}
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Company Name" value={form.companyName} onChange={(e) => handleChange("companyName", e.target.value)} required fullWidth />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Job Title" value={form.jobTitle} onChange={(e) => handleChange("jobTitle", e.target.value)} required fullWidth />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Status" value={form.status} onChange={(e) => handleChange("status", e.target.value)} select fullWidth>
            {APPLICATION_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>{STATUS_LABELS[s]}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Date Applied" type="date" value={form.dateApplied} onChange={(e) => handleChange("dateApplied", e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label="Salary Asked" type="number" value={form.salaryAsked} onChange={(e) => handleChange("salaryAsked", e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label="Salary Min" type="number" value={form.salaryMin} onChange={(e) => handleChange("salaryMin", e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label="Salary Max" type="number" value={form.salaryMax} onChange={(e) => handleChange("salaryMax", e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField label="Job Description URL" value={form.jobDescriptionUrl} onChange={(e) => handleChange("jobDescriptionUrl", e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField label="Job Description" value={form.jobDescription} onChange={(e) => handleChange("jobDescription", e.target.value)} multiline rows={6} fullWidth placeholder="Paste the full job description here for AI features" />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField label="Notes" value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} multiline rows={4} fullWidth />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Button type="submit" disabled={saving} size="large">
            {saving ? "Saving..." : isEdit ? "Update" : "Create Application"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
