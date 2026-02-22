"use client";

import Link from "next/link";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import StatusChip from "./StatusChip";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Application } from "@/types";

interface ApplicationCardProps {
  application: Application;
}

export default function ApplicationCard({ application }: ApplicationCardProps) {
  return (
    <Card variant="outlined">
      <CardActionArea component={Link} href={`/applications/${application.id}`}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              {application.companyName}
            </Typography>
            <StatusChip status={application.status} />
          </Box>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            {application.jobTitle}
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Applied: {formatDate(application.dateApplied)}
            </Typography>
            {application.salaryAsked && (
              <Typography variant="caption" color="text.secondary">
                Salary: {formatCurrency(application.salaryAsked)}
              </Typography>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
