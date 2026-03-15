"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Divider from "@mui/material/Divider";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/constants";
import {
  annualToHourly,
  formatCompensationRange,
  formatCurrency,
  formatHourly,
  hourlyToAnnual,
} from "@/lib/utils";
import type { Application, JobBoard } from "@/types";

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
    employmentType: application?.employmentType ?? "full_time",
    workplaceType: application?.workplaceType ?? "remote",
    compensationType: application?.compensationType ?? "salary",
    salaryAsked: application?.salaryAsked?.toString() ?? "",
    salaryMin: application?.salaryMin?.toString() ?? "",
    salaryMax: application?.salaryMax?.toString() ?? "",
    jobPostedAt: application?.jobPostedAt ?? "",
    jobDescriptionUrl: application?.jobDescriptionUrl ?? "",
    jobApplicationUrl: application?.jobApplicationUrl ?? "",
    jobApplicationStatusUrl: application?.jobApplicationStatusUrl ?? "",
    jobDescription: application?.jobDescription ?? "",
    notes: application?.notes ?? "",
    workLocationCity: application?.workLocationCity ?? "",
    workLocationState: application?.workLocationState ?? "",
    offersEquity: application?.offersEquity ?? false,
    hiringManagerName: application?.hiringManagerName ?? "",
    hiringManagerEmail: application?.hiringManagerEmail ?? "",
    hiringManagerPhone: application?.hiringManagerPhone ?? "",
    hiringManagerLinkedinUrl: application?.hiringManagerLinkedinUrl ?? "",
    applicationMedium: application?.applicationMedium ?? "",
    dateApplied: application?.dateApplied ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [jobBoards, setJobBoards] = useState<JobBoard[]>([]);
  const [newMediumName, setNewMediumName] = useState("");
  const [addingMedium, setAddingMedium] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    let active = true;

    async function loadJobBoards() {
      try {
        const response = await fetch("/api/job-boards");
        const data = await response.json();
        if (response.ok && active) {
          setJobBoards(data);
        }
      } catch {
        // Ignore medium list load failures in the form.
      }
    }

    void loadJobBoards();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      salaryAsked: form.salaryAsked ? Number(form.salaryAsked) : null,
      salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
      salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
      jobPostedAt: form.jobPostedAt || null,
      jobDescriptionUrl: form.jobDescriptionUrl || null,
      jobApplicationUrl: form.jobApplicationUrl || null,
      jobApplicationStatusUrl: form.jobApplicationStatusUrl || null,
      jobDescription: form.jobDescription || null,
      notes: form.notes || null,
      workLocationCity: form.workplaceType === "remote" ? null : form.workLocationCity || null,
      workLocationState: form.workplaceType === "remote" ? null : form.workLocationState || null,
      hiringManagerName: form.hiringManagerName || null,
      hiringManagerEmail: form.hiringManagerEmail || null,
      hiringManagerPhone: form.hiringManagerPhone || null,
      hiringManagerLinkedinUrl: form.hiringManagerLinkedinUrl || null,
      applicationMedium: form.applicationMedium || null,
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

  const handleAddMedium = async () => {
    if (!newMediumName.trim()) return;
    setAddingMedium(true);
    try {
      const response = await fetch("/api/job-boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMediumName.trim(),
          url: "",
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setJobBoards((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)));
        setForm((prev) => ({ ...prev, applicationMedium: data.name }));
        setNewMediumName("");
      }
    } finally {
      setAddingMedium(false);
    }
  };

  const compensationUnitLabel = form.compensationType === "salary" ? "Salary" : "Hourly";
  const askedValue = form.salaryAsked ? Number(form.salaryAsked) : null;
  const minValue = form.salaryMin ? Number(form.salaryMin) : null;
  const maxValue = form.salaryMax ? Number(form.salaryMax) : null;
  const convertedAsked =
    form.compensationType === "salary" ? annualToHourly(askedValue) : hourlyToAnnual(askedValue);
  const convertedMin =
    form.compensationType === "salary" ? annualToHourly(minValue) : hourlyToAnnual(minValue);
  const convertedMax =
    form.compensationType === "salary" ? annualToHourly(maxValue) : hourlyToAnnual(maxValue);

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
          <TextField label="Employment Type" value={form.employmentType} onChange={(e) => handleChange("employmentType", e.target.value)} select fullWidth>
            <MenuItem value="full_time">Full Time</MenuItem>
            <MenuItem value="part_time">Part Time</MenuItem>
            <MenuItem value="contract">Contract</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Workplace Type" value={form.workplaceType} onChange={(e) => handleChange("workplaceType", e.target.value)} select fullWidth>
            <MenuItem value="remote">Remote</MenuItem>
            <MenuItem value="hybrid">Hybrid</MenuItem>
            <MenuItem value="on_site">On Site</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Date Applied" type="date" value={form.dateApplied} onChange={(e) => handleChange("dateApplied", e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Date Job Posted" type="date" value={form.jobPostedAt} onChange={(e) => handleChange("jobPostedAt", e.target.value)} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
        </Grid>
        {form.workplaceType !== "remote" ? (
          <>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Work Location City" value={form.workLocationCity} onChange={(e) => handleChange("workLocationCity", e.target.value)} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Work Location State" value={form.workLocationState} onChange={(e) => handleChange("workLocationState", e.target.value)} fullWidth placeholder="CO" />
            </Grid>
          </>
        ) : null}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Pay Type" value={form.compensationType} onChange={(e) => handleChange("compensationType", e.target.value)} select fullWidth>
            <MenuItem value="salary">Salary</MenuItem>
            <MenuItem value="hourly">Hourly</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={form.offersEquity}
                onChange={(e) => setForm((prev) => ({ ...prev, offersEquity: e.target.checked }))}
              />
            }
            label="Company Offers Equity"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label={`${compensationUnitLabel} Asked`} type="number" value={form.salaryAsked} onChange={(e) => handleChange("salaryAsked", e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label={`${compensationUnitLabel} Min`} type="number" value={form.salaryMin} onChange={(e) => handleChange("salaryMin", e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label={`${compensationUnitLabel} Max`} type="number" value={form.salaryMax} onChange={(e) => handleChange("salaryMax", e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Typography variant="body2" color="text.secondary">
            Entered range: {formatCompensationRange(minValue, maxValue, form.compensationType)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {form.compensationType === "salary"
              ? `Equivalent hourly range at 40h/week for 52 weeks: ${formatCompensationRange(convertedMin, convertedMax, "hourly")}`
              : `Equivalent annual range at 40h/week for 52 weeks: ${formatCompensationRange(convertedMin, convertedMax, "salary")}`}
          </Typography>
          {askedValue !== null ? (
            <Typography variant="body2" color="text.secondary">
              {form.compensationType === "salary"
                ? `Asked: ${formatCurrency(askedValue)} per year, about ${formatHourly(convertedAsked)} per hour`
                : `Asked: ${formatHourly(askedValue)} per hour, about ${formatCurrency(convertedAsked)} per year`}
            </Typography>
          ) : null}
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle1" gutterBottom>
            Application Info
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Application Medium"
            value={form.applicationMedium}
            onChange={(e) => handleChange("applicationMedium", e.target.value)}
            select
            fullWidth
          >
            <MenuItem value="">None</MenuItem>
            {jobBoards.map((board) => (
              <MenuItem key={board.id} value={board.name}>{board.name}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              label="Add New Medium"
              value={newMediumName}
              onChange={(e) => setNewMediumName(e.target.value)}
              fullWidth
            />
            <Button onClick={() => void handleAddMedium()} disabled={addingMedium || !newMediumName.trim()}>
              {addingMedium ? "Adding..." : "Add"}
            </Button>
          </Box>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField label="Job Application URL" value={form.jobApplicationUrl} onChange={(e) => handleChange("jobApplicationUrl", e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField label="Job Application Status URL" value={form.jobApplicationStatusUrl} onChange={(e) => handleChange("jobApplicationStatusUrl", e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField label="Job Description URL" value={form.jobDescriptionUrl} onChange={(e) => handleChange("jobDescriptionUrl", e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle1" gutterBottom>
            Hiring Manager
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Hiring Manager Name" value={form.hiringManagerName} onChange={(e) => handleChange("hiringManagerName", e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Hiring Manager Email" value={form.hiringManagerEmail} onChange={(e) => handleChange("hiringManagerEmail", e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Hiring Manager Phone" value={form.hiringManagerPhone} onChange={(e) => handleChange("hiringManagerPhone", e.target.value)} fullWidth />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Hiring Manager LinkedIn URL" value={form.hiringManagerLinkedinUrl} onChange={(e) => handleChange("hiringManagerLinkedinUrl", e.target.value)} fullWidth />
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
