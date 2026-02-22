"use client";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import {
  STATUS_LABELS,
  type ApplicationStatus,
} from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { StatusHistoryEntry } from "@/types";

interface RecentActivityProps {
  activity: StatusHistoryEntry[];
}

function formatTransition(entry: StatusHistoryEntry): string {
  const toLabel = STATUS_LABELS[entry.toStatus] || entry.toStatus;

  if (entry.fromStatus === null) {
    return `App #${entry.applicationId}: Created as ${toLabel}`;
  }

  const fromLabel =
    STATUS_LABELS[entry.fromStatus as ApplicationStatus] || entry.fromStatus;
  return `App #${entry.applicationId}: ${fromLabel} -> ${toLabel}`;
}

export default function RecentActivity({ activity }: RecentActivityProps) {
  if (activity.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No recent activity.
      </Typography>
    );
  }

  return (
    <List disablePadding>
      {activity.map((entry) => (
        <ListItem key={entry.id} disableGutters>
          <ListItemText
            primary={formatTransition(entry)}
            secondary={formatDate(entry.changedAt)}
          />
        </ListItem>
      ))}
    </List>
  );
}
