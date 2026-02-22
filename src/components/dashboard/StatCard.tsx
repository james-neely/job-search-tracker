"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

export default function StatCard({ title, value, subtitle, color }: StatCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", color: color || "text.primary" }}
        >
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
