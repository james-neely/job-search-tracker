import { db } from "@/db";
import { applications, statusHistory, settings } from "@/db/schema";
import { sql, eq, and, gte, ne, inArray } from "drizzle-orm";
import dayjs from "dayjs";

export async function getDashboardStats() {
  const allApps = await db.select().from(applications);

  const today = dayjs().format("YYYY-MM-DD");
  const weekAgo = dayjs().subtract(7, "day").format("YYYY-MM-DD");
  const monthAgo = dayjs().subtract(30, "day").format("YYYY-MM-DD");

  const totalApplications = allApps.length;

  const appliedToday = allApps.filter(
    (a) => a.dateApplied === today
  ).length;

  const appliedThisWeek = allApps.filter(
    (a) => a.dateApplied && a.dateApplied >= weekAgo
  ).length;

  const appliedThisMonth = allApps.filter(
    (a) => a.dateApplied && a.dateApplied >= monthAgo
  ).length;

  const beyondSaved = allApps.filter((a) => a.status !== "saved");
  const beyondApplied = allApps.filter(
    (a) => !["saved", "applied"].includes(a.status)
  );
  const appliedPlus = allApps.filter((a) => a.status !== "saved");

  const callbackRate =
    appliedPlus.length > 0 ? beyondApplied.length / appliedPlus.length : 0;

  const rejectedCount = allApps.filter((a) => a.status === "rejected").length;
  const rejectionRate =
    beyondSaved.length > 0 ? rejectedCount / beyondSaved.length : 0;

  const offerCount = allApps.filter(
    (a) => a.status === "offer" || a.status === "accepted"
  ).length;
  const offerRate =
    beyondSaved.length > 0 ? offerCount / beyondSaved.length : 0;

  const withSalary = allApps.filter((a) => a.salaryAsked !== null);
  const salaries = withSalary.map((a) => a.salaryAsked!);
  const avgSalaryAsked =
    salaries.length > 0
      ? salaries.reduce((s, v) => s + v, 0) / salaries.length
      : null;
  const minSalaryAsked = salaries.length > 0 ? Math.min(...salaries) : null;
  const maxSalaryAsked = salaries.length > 0 ? Math.max(...salaries) : null;

  const statusBreakdown: Record<string, number> = {};
  for (const app of allApps) {
    statusBreakdown[app.status] = (statusBreakdown[app.status] || 0) + 1;
  }

  const recentActivity = await db
    .select()
    .from(statusHistory)
    .orderBy(sql`${statusHistory.changedAt} DESC`)
    .limit(10);

  const unemploymentSetting = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "unemployment_start_date"))
    .limit(1);

  let unemploymentDays: number | null = null;
  if (unemploymentSetting.length > 0) {
    const startDate = dayjs(unemploymentSetting[0].value);
    unemploymentDays = dayjs().diff(startDate, "day");
  }

  return {
    totalApplications,
    appliedToday,
    appliedThisWeek,
    appliedThisMonth,
    callbackRate,
    rejectionRate,
    offerRate,
    avgSalaryAsked,
    minSalaryAsked,
    maxSalaryAsked,
    statusBreakdown,
    unemploymentDays,
    recentActivity,
  };
}
