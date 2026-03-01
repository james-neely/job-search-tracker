"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";
import type { ApplicationTask } from "@/types";

interface TasksEditorProps {
  applicationId: number;
  tasks: ApplicationTask[];
  onUpdate: () => void;
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toISOString().split("T")[0]);
}

export default function TasksEditor({ applicationId, tasks, onUpdate }: TasksEditorProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const pending = tasks.filter((t) => !t.completedAt);
  const completed = tasks.filter((t) => t.completedAt);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await fetch(`/api/applications/${applicationId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), url: url.trim() || null, dueDate: dueDate || null }),
    });
    setTitle("");
    setUrl("");
    setDueDate("");
    setSaving(false);
    onUpdate();
  };

  const handleToggleComplete = async (task: ApplicationTask) => {
    const completedAt = task.completedAt ? null : new Date().toISOString();
    await fetch(`/api/applications/${applicationId}/tasks?taskId=${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completedAt }),
    });
    onUpdate();
  };

  const handleDelete = async (taskId: number) => {
    await fetch(`/api/applications/${applicationId}/tasks?taskId=${taskId}`, {
      method: "DELETE",
    });
    onUpdate();
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Tasks</Typography>
      <List dense disablePadding>
        {pending.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onToggle={handleToggleComplete}
            onDelete={handleDelete}
          />
        ))}
        {completed.length > 0 && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              Completed
            </Typography>
            {completed.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={handleToggleComplete}
                onDelete={handleDelete}
              />
            ))}
          </>
        )}
      </List>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
          <TextField
            size="small"
            label="New task"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            sx={{ flex: 1 }}
          />
          <TextField
            size="small"
            label="Due date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />
        </Box>
        <TextField
          size="small"
          label="URL (optional)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://"
          fullWidth
        />
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          disabled={!title.trim() || saving}
          onClick={handleAdd}
          sx={{ whiteSpace: "nowrap", alignSelf: "flex-start" }}
        >
          {saving ? "Adding..." : "Add Task"}
        </Button>
      </Box>
    </Box>
  );
}

interface TaskRowProps {
  task: ApplicationTask;
  onToggle: (task: ApplicationTask) => void;
  onDelete: (id: number) => void;
}

function TaskRow({ task, onToggle, onDelete }: TaskRowProps) {
  const overdue = isOverdue(task.dueDate) && !task.completedAt;

  return (
    <ListItem
      disableGutters
      secondaryAction={
        <IconButton edge="end" size="small" onClick={() => onDelete(task.id)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      }
    >
      <Checkbox
        size="small"
        checked={!!task.completedAt}
        onChange={() => onToggle(task)}
        sx={{ mr: 0.5 }}
      />
      <ListItemText
        primary={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            {task.url ? (
              <Typography
                component="a"
                href={task.url}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                sx={{
                  textDecoration: task.completedAt ? "line-through" : "underline",
                  color: "primary.main",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <LinkIcon sx={{ fontSize: 14 }} />
                {task.title}
              </Typography>
            ) : (
              <Typography
                variant="body2"
                sx={{ textDecoration: task.completedAt ? "line-through" : "none" }}
              >
                {task.title}
              </Typography>
            )}
            {task.dueDate && (
              <Chip
                label={overdue ? `Overdue: ${task.dueDate}` : task.dueDate}
                size="small"
                color={overdue ? "error" : "default"}
              />
            )}
          </Box>
        }
      />
    </ListItem>
  );
}
