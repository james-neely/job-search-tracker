"use client";

import { useState, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LoadingState from "@/components/common/LoadingState";
import type { JobBoard } from "@/types";

export default function JobBoardsPage() {
  const [boards, setBoards] = useState<JobBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");

  const fetchBoards = useCallback(async () => {
    const response = await fetch("/api/job-boards");
    const data = await response.json();
    setBoards(data);
  }, []);

  useEffect(() => {
    fetchBoards().finally(() => setLoading(false));
  }, [fetchBoards]);

  const handleAdd = async () => {
    if (!name.trim() || !url.trim()) return;
    setSaving(true);
    await fetch("/api/job-boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), url: url.trim() }),
    });
    setName("");
    setUrl("");
    setSaving(false);
    fetchBoards();
  };

  const handleDelete = async (boardId: number) => {
    await fetch(`/api/job-boards/${boardId}`, { method: "DELETE" });
    fetchBoards();
  };

  const startEdit = (board: JobBoard) => {
    setEditingId(board.id);
    setEditName(board.name);
    setEditUrl(board.url);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editUrl.trim() || editingId === null) return;
    await fetch(`/api/job-boards/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), url: editUrl.trim() }),
    });
    setEditingId(null);
    fetchBoards();
  };

  if (loading) return <LoadingState message="Loading job boards..." />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Job Boards
      </Typography>

      <List dense disablePadding>
        {boards.map((board) => (
          <ListItem
            key={board.id}
            sx={{ flexDirection: "column", alignItems: "stretch" }}
            secondaryAction={
              editingId !== board.id ? (
                <Box>
                  <IconButton size="small" onClick={() => startEdit(board)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => handleDelete(board.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : undefined
            }
          >
            {editingId === board.id ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  width: "100%",
                }}
              >
                <TextField
                  size="small"
                  label="Name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  fullWidth
                />
                <TextField
                  size="small"
                  label="URL"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  fullWidth
                />
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleSaveEdit}
                  >
                    Save
                  </Button>
                  <Button size="small" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </Box>
              </Box>
            ) : (
              <ListItemText
                primary={
                  <Box
                    component="a"
                    href={board.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                      color: "primary.main",
                      textDecoration: "none",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    {board.name}
                    <OpenInNewIcon sx={{ fontSize: 16 }} />
                  </Box>
                }
                secondary={board.url}
              />
            )}
          </ListItem>
        ))}
      </List>

      {boards.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No job boards saved yet. Add one below.
        </Typography>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}>
        <TextField
          size="small"
          label="Name"
          placeholder="e.g. LinkedIn Jobs"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
        />
        <TextField
          size="small"
          label="URL"
          placeholder="e.g. https://linkedin.com/jobs"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          disabled={!name.trim() || !url.trim() || saving}
          onClick={handleAdd}
          sx={{ alignSelf: "flex-start" }}
        >
          {saving ? "Adding..." : "Add Job Board"}
        </Button>
      </Box>
    </Box>
  );
}
