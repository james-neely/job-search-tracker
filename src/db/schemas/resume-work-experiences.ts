import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { resumeVersions } from "./resume-versions";

export const resumeWorkExperiences = sqliteTable("resume_work_experiences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  resumeVersionId: integer("resume_version_id")
    .notNull()
    .references(() => resumeVersions.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  companyName: text("company_name").notNull().default(""),
  roleTitle: text("role_title").notNull().default(""),
  location: text("location"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  bullets: text("bullets"),
  visibilityConfig: text("visibility_config").notNull().default("{}"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});
