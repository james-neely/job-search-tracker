"use client";

import Chip from "@mui/material/Chip";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";
import type { ApplicationStatus } from "@/lib/constants";

interface StatusChipProps {
  status: ApplicationStatus;
  size?: "small" | "medium";
}

export default function StatusChip({ status, size = "small" }: StatusChipProps) {
  return (
    <Chip
      label={STATUS_LABELS[status]}
      size={size}
      sx={{
        backgroundColor: STATUS_COLORS[status],
        color: "#fff",
        fontWeight: 600,
      }}
    />
  );
}
