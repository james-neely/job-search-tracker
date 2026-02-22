import { db } from "@/db";
import { applications } from "@/db/schema";
import { eq, desc, asc, like, sql } from "drizzle-orm";
import type { ApplicationStatus } from "@/lib/constants";

interface ListFilters {
  status?: ApplicationStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function listApplications(filters: ListFilters = {}) {
  const { status, search, sortBy = "updatedAt", sortOrder = "desc" } = filters;
  const conditions = [];

  if (status) {
    conditions.push(eq(applications.status, status));
  }
  if (search) {
    conditions.push(
      sql`(${applications.companyName} LIKE ${"%" + search + "%"} OR ${applications.jobTitle} LIKE ${"%" + search + "%"})`
    );
  }

  const columnMap: Record<string, typeof applications.updatedAt> = {
    updatedAt: applications.updatedAt,
    createdAt: applications.createdAt,
    companyName: applications.companyName,
    dateApplied: applications.dateApplied,
  };

  const orderColumn = columnMap[sortBy] || applications.updatedAt;
  const orderFn = sortOrder === "asc" ? asc : desc;

  let query = db.select().from(applications);
  if (conditions.length > 0) {
    query = query.where(sql.join(conditions, sql` AND `)) as typeof query;
  }

  return query.orderBy(orderFn(orderColumn));
}

export async function getApplication(id: number) {
  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.id, id))
    .limit(1);
  return rows[0] || null;
}

export async function createApplication(
  data: typeof applications.$inferInsert
) {
  const result = await db.insert(applications).values(data).returning();
  return result[0];
}

export async function updateApplication(
  id: number,
  data: Partial<typeof applications.$inferInsert>
) {
  const result = await db
    .update(applications)
    .set({ ...data, updatedAt: sql`(datetime('now'))` })
    .where(eq(applications.id, id))
    .returning();
  return result[0] || null;
}

export async function deleteApplication(id: number) {
  await db.delete(applications).where(eq(applications.id, id));
}
