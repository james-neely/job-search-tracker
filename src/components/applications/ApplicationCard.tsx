"use client";

import Link from "next/link";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import StatusChip from "./StatusChip";
import { annualToHourly, formatCompensationRange, formatDate, hourlyToAnnual } from "@/lib/utils";
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

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
            <Chip
              size="small"
              variant="outlined"
              label={
                application.employmentType === "full_time"
                  ? "Full Time"
                  : application.employmentType === "part_time"
                    ? "Part Time"
                    : "Contract"
              }
            />
            <Chip
              size="small"
              variant="outlined"
              label={application.compensationType === "salary" ? "Salary" : "Hourly"}
            />
            <Chip
              size="small"
              variant="outlined"
              label={
                application.workplaceType === "remote"
                  ? "Remote"
                  : application.workplaceType === "hybrid"
                    ? "Hybrid"
                    : "On Site"
              }
            />
            {application.offersEquity ? (
              <Chip size="small" color="success" variant="outlined" label="Equity" />
            ) : null}
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1, gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Applied: {formatDate(application.dateApplied)}
            </Typography>
            {application.applicationMedium ? (
              <Typography variant="caption" color="text.secondary">
                Via: {application.applicationMedium}
              </Typography>
            ) : null}
          </Box>
          {(application.salaryMin !== null || application.salaryMax !== null) && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                {application.compensationType === "salary" ? "Salary" : "Hourly"}:{" "}
                {formatCompensationRange(
                  application.salaryMin,
                  application.salaryMax,
                  application.compensationType
                )}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {application.compensationType === "salary"
                  ? `Hourly equivalent: ${formatCompensationRange(
                      annualToHourly(application.salaryMin),
                      annualToHourly(application.salaryMax),
                      "hourly"
                    )}`
                  : `Annual equivalent: ${formatCompensationRange(
                      hourlyToAnnual(application.salaryMin),
                      hourlyToAnnual(application.salaryMax),
                      "salary"
                    )}`}
              </Typography>
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
