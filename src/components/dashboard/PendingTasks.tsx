"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import type { PendingTask } from "@/types";

interface PendingTasksProps {
  tasks: PendingTask[];
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toISOString().split("T")[0]);
}

export default function PendingTasks({ tasks }: PendingTasksProps) {
  if (tasks.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No pending tasks.
      </Typography>
    );
  }

  return (
    <List disablePadding>
      {tasks.map((task) => {
        const overdue = isOverdue(task.dueDate);
        return (
          <ListItem key={task.id} disableGutters>
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
                      sx={{ color: "primary.main", textDecoration: "underline" }}
                    >
                      {task.title}
                    </Typography>
                  ) : (
                    <Typography variant="body2">{task.title}</Typography>
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
              secondary={
                <Link href={`/applications/${task.applicationId}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <Typography variant="caption" color="primary" sx={{ "&:hover": { textDecoration: "underline" } }}>
                    {task.companyName} - {task.jobTitle}
                  </Typography>
                </Link>
              }
            />
          </ListItem>
        );
      })}
    </List>
  );
}
