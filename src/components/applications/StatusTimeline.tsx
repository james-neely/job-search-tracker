"use client";

import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import Typography from "@mui/material/Typography";
import { STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { StatusHistoryEntry } from "@/types";

interface StatusTimelineProps {
  history: StatusHistoryEntry[];
}

function transitionLabel(entry: StatusHistoryEntry): string {
  const toLabel = STATUS_LABELS[entry.toStatus];
  if (!entry.fromStatus) return toLabel;
  return `${STATUS_LABELS[entry.fromStatus]} → ${toLabel}`;
}

export default function StatusTimeline({ history }: StatusTimelineProps) {
  if (history.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        No status changes recorded.
      </Typography>
    );
  }

  return (
    <Timeline position="alternate">
      {history.map((entry, index) => (
        <TimelineItem key={entry.id}>
          <TimelineSeparator>
            <TimelineDot color="primary" />
            {index < history.length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent>
            <Typography variant="body2" fontWeight={600}>
              {transitionLabel(entry)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDate(entry.changedAt)}
            </Typography>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
