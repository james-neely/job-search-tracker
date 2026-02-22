"use client";

import Grid from "@mui/material/Grid2";
import type { DashboardStats } from "@/types";
import { formatCurrency, formatPercent } from "@/lib/utils";
import StatCard from "./StatCard";

interface StatsGridProps {
  stats: DashboardStats;
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const cards = [
    { title: "Total Applications", value: stats.totalApplications },
    { title: "Applied Today", value: stats.appliedToday },
    { title: "Applied This Week", value: stats.appliedThisWeek },
    { title: "Applied This Month", value: stats.appliedThisMonth },
    { title: "Callback Rate", value: formatPercent(stats.callbackRate) },
    { title: "Rejection Rate", value: formatPercent(stats.rejectionRate) },
    { title: "Offer Rate", value: formatPercent(stats.offerRate) },
    {
      title: "Avg Salary Asked",
      value: formatCurrency(stats.avgSalaryAsked),
    },
  ];

  if (stats.unemploymentDays !== null) {
    cards.push({
      title: "Days Unemployed",
      value: stats.unemploymentDays,
    });
  }

  return (
    <Grid container spacing={2}>
      {cards.map((card) => (
        <Grid key={card.title} size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title={card.title} value={card.value} />
        </Grid>
      ))}
    </Grid>
  );
}
