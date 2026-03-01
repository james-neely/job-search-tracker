import { NextResponse } from "next/server";
import { db } from "@/db";
import { applicationTasks, applications } from "@/db/schema";
import { isNull, eq, asc } from "drizzle-orm";
import { sql } from "drizzle-orm";

export async function GET() {
  const tasks = await db
    .select({
      id: applicationTasks.id,
      applicationId: applicationTasks.applicationId,
      title: applicationTasks.title,
      dueDate: applicationTasks.dueDate,
      completedAt: applicationTasks.completedAt,
      createdAt: applicationTasks.createdAt,
      companyName: applications.companyName,
      jobTitle: applications.jobTitle,
    })
    .from(applicationTasks)
    .innerJoin(applications, eq(applicationTasks.applicationId, applications.id))
    .where(isNull(applicationTasks.completedAt))
    .orderBy(
      sql`CASE WHEN ${applicationTasks.dueDate} IS NULL THEN 1 ELSE 0 END`,
      asc(applicationTasks.dueDate),
      asc(applicationTasks.createdAt)
    )
    .limit(20);
  return NextResponse.json(tasks);
}
