import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { resumeVersions } from "./resume-versions";

export const resumeEducationEntries = sqliteTable("resume_education_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  resumeVersionId: integer("resume_version_id")
    .notNull()
    .references(() => resumeVersions.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  schoolName: text("school_name").notNull().default(""),
  degree: text("degree").notNull().default(""),
  fieldOfStudy: text("field_of_study").notNull().default(""),
  gpa: text("gpa"),
  courses: text("courses"),
  awardsHonors: text("awards_honors"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  description: text("description"),
  visibilityConfig: text("visibility_config").notNull().default("{}"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});
