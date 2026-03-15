"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid2";
import Divider from "@mui/material/Divider";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SearchIcon from "@mui/icons-material/Search";
import LanguageIcon from "@mui/icons-material/Language";
import LoadingState from "@/components/common/LoadingState";
import type { JobBoard } from "@/types";

type JobBoardCategory = "careers_pages" | "job_boards" | "ats_platforms" | "specialized_networks" | "other";

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getCategoryLabel(category: JobBoardCategory) {
  switch (category) {
    case "careers_pages":
      return "Careers Pages";
    case "job_boards":
      return "Job Boards";
    case "ats_platforms":
      return "ATS / Employer Platforms";
    case "specialized_networks":
      return "Specialized Networks";
    default:
      return "Other Sources";
  }
}

function getCategoryDescription(category: JobBoardCategory) {
  switch (category) {
    case "careers_pages":
      return "Company-owned career sites and direct hiring pages.";
    case "job_boards":
      return "Broad job marketplaces and search aggregators.";
    case "ats_platforms":
      return "Application systems frequently used for company-hosted openings.";
    case "specialized_networks":
      return "Niche platforms, startup networks, and remote-first sources.";
    default:
      return "Anything that does not fit the main patterns yet.";
  }
}

function classifyBoard(board: JobBoard): JobBoardCategory {
  const hostname = getHostname(board.url).toLowerCase();
  const name = board.name.toLowerCase();
  const combined = `${name} ${hostname}`;

  if (
    combined.includes("careers.") ||
    combined.includes("/careers") ||
    combined.includes("jobs.") ||
    combined.includes("/jobs") ||
    combined.includes("company careers")
  ) {
    return "careers_pages";
  }

  if (
    ["linkedin", "indeed", "monster", "ziprecruiter", "dice", "careerbuilder", "simplyhired", "glassdoor"]
      .some((keyword) => combined.includes(keyword))
  ) {
    return "job_boards";
  }

  if (
    ["greenhouse", "lever", "jobvite", "workday", "smartrecruiters", "ashby", "icims", "taleo"]
      .some((keyword) => combined.includes(keyword))
  ) {
    return "ats_platforms";
  }

  if (
    ["wellfound", "angel", "otta", "remote", "himalayas", "jobright", "remoteok", "weworkremotely"]
      .some((keyword) => combined.includes(keyword))
  ) {
    return "specialized_networks";
  }

  return "other";
}

export default function JobBoardsPage() {
  const [boards, setBoards] = useState<JobBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", url: "" });

  const fetchBoards = useCallback(async () => {
    setError(null);
    const response = await fetch("/api/job-boards");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "Failed to load job boards");
    }

    setBoards(data);
  }, []);

  useEffect(() => {
    fetchBoards()
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Failed to load job boards");
      })
      .finally(() => setLoading(false));
  }, [fetchBoards]);

  const filteredBoards = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return boards;

    return boards.filter((board) =>
      [board.name, board.url, getHostname(board.url)]
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [boards, search]);

  const categorizedBoards = useMemo(() => {
    const groups = new Map<JobBoardCategory, JobBoard[]>();

    for (const board of filteredBoards) {
      const category = classifyBoard(board);
      const current = groups.get(category) ?? [];
      current.push(board);
      groups.set(category, current);
    }

    return [
      "careers_pages",
      "job_boards",
      "ats_platforms",
      "specialized_networks",
      "other",
    ].map((category) => ({
      category: category as JobBoardCategory,
      boards: groups.get(category as JobBoardCategory) ?? [],
    })).filter((group) => group.boards.length > 0);
  }, [filteredBoards]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: "", url: "" });
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.url.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(
        editingId === null ? "/api/job-boards" : `/api/job-boards/${editingId}`,
        {
          method: editingId === null ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name.trim(), url: form.url.trim() }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save job board");
      }

      resetForm();
      await fetchBoards();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save job board");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (boardId: number) => {
    setDeletingId(boardId);
    setError(null);

    try {
      const response = await fetch(`/api/job-boards/${boardId}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to delete job board");
      }
      await fetchBoards();
      if (editingId === boardId) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete job board");
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (board: JobBoard) => {
    setEditingId(board.id);
    setForm({ name: board.name, url: board.url });
    setError(null);
  };

  if (loading) {
    return <LoadingState message="Loading job boards..." />;
  }

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Box sx={{ display: "grid", gap: 1 }}>
        <Typography variant="h4" fontWeight="bold">
          Job Boards
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Keep the boards and aggregators you actually use close at hand for faster application tracking.
        </Typography>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper
            sx={{
              p: 3,
              display: "grid",
              gap: 2,
              background:
                "linear-gradient(180deg, rgba(12,74,110,0.06) 0%, rgba(255,255,255,1) 38%)",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              useFlexGap
              sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}
            >
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip label={`${boards.length} saved`} color="primary" />
                <Chip label={`${filteredBoards.length} visible`} variant="outlined" />
              </Stack>
              <TextField
                size="small"
                placeholder="Search name, URL, or host"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ minWidth: { xs: "100%", md: 320 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>

            <Divider />

            {filteredBoards.length === 0 ? (
              <Box
                sx={{
                  py: 8,
                  px: 3,
                  borderRadius: 2,
                  border: "1px dashed",
                  borderColor: "divider",
                  textAlign: "center",
                  backgroundColor: "background.default",
                }}
              >
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  {boards.length === 0 ? "No job boards saved yet" : "No matching job boards"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {boards.length === 0
                    ? "Add your most-used boards on the right so they are easy to reuse in application details."
                    : "Try a different search term or clear the filter."}
                </Typography>
              </Box>
            ) : (
              <Stack spacing={3}>
                {categorizedBoards.map(({ category, boards: categoryBoards }) => (
                  <Box key={category} sx={{ display: "grid", gap: 1.5 }}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      useFlexGap
                      sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
                    >
                      <Box>
                        <Typography variant="h6" fontWeight={700}>
                          {getCategoryLabel(category)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {getCategoryDescription(category)}
                        </Typography>
                      </Box>
                      <Chip size="small" label={`${categoryBoards.length} saved`} variant="outlined" />
                    </Stack>

                    <Grid container spacing={2}>
                      {categoryBoards.map((board) => (
                        <Grid key={board.id} size={{ xs: 12, md: 6 }}>
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 2,
                              height: "100%",
                              display: "grid",
                              gap: 1.5,
                              borderRadius: 3,
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
                            >
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="subtitle1" fontWeight={700}>
                                  {board.name}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ mt: 0.75 }} useFlexGap flexWrap="wrap">
                                  <Chip
                                    size="small"
                                    icon={<LanguageIcon />}
                                    label={getHostname(board.url)}
                                    variant="outlined"
                                  />
                                </Stack>
                              </Box>
                              <Stack direction="row" spacing={0.5}>
                                <IconButton
                                  size="small"
                                  component="a"
                                  href={board.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <OpenInNewIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => startEdit(board)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={deletingId === board.id}
                                  onClick={() => void handleDelete(board.id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </Stack>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                wordBreak: "break-word",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {board.url}
                            </Typography>

                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", pt: 0.5 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<OpenInNewIcon />}
                                href={board.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Open Board
                              </Button>
                              <Button size="small" onClick={() => startEdit(board)}>
                                Edit
                              </Button>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper
            sx={{
              p: 3,
              position: { lg: "sticky" },
              top: 24,
              display: "grid",
              gap: 2,
              borderRadius: 3,
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {editingId === null ? "Add Job Board" : "Edit Job Board"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Save the boards you use most so they can be selected quickly in application details.
              </Typography>
            </Box>

            <TextField
              label="Name"
              placeholder="LinkedIn, Greenhouse, Jobright"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              fullWidth
            />
            <TextField
              label="URL"
              placeholder="https://www.linkedin.com/jobs"
              value={form.url}
              onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
              fullWidth
            />

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                disabled={!form.name.trim() || !form.url.trim() || saving}
                onClick={() => void handleSubmit()}
              >
                {saving ? (editingId === null ? "Adding..." : "Saving...") : editingId === null ? "Add Board" : "Save Changes"}
              </Button>
              {editingId !== null ? (
                <Button onClick={resetForm}>Cancel</Button>
              ) : null}
            </Stack>

            <Divider />

            <Box sx={{ display: "grid", gap: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Suggested entries
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Examples: LinkedIn, Indeed, Greenhouse, Lever, Jobvite, Workday, Remote, Wellfound.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
