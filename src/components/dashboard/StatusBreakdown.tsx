"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  type ApplicationStatus,
} from "@/lib/constants";

interface StatusBreakdownProps {
  breakdown: Record<string, number>;
}

export default function StatusBreakdown({ breakdown }: StatusBreakdownProps) {
  const entries = Object.entries(breakdown);

  if (entries.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No applications yet.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {entries.map(([status, count]) => {
        const key = status as ApplicationStatus;
        return (
          <Box
            key={status}
            sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: STATUS_COLORS[key] || "#9e9e9e",
                flexShrink: 0,
              }}
            />
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              {STATUS_LABELS[key] || status}
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {count}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
