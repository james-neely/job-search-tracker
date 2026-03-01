import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const applications = sqliteTable("applications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyName: text("company_name").notNull(),
  jobTitle: text("job_title").notNull(),
  status: text("status").notNull().default("saved"),
  salaryAsked: real("salary_asked"),
  salaryMin: real("salary_min"),
  salaryMax: real("salary_max"),
  jobDescriptionUrl: text("job_description_url"),
  jobDescription: text("job_description"),
  notes: text("notes"),
  companyIntel: text("company_intel"),
  resumePath: text("resume_path"),
  resumeIsUrl: integer("resume_is_url", { mode: "boolean" }).default(false),
  coverLetterPath: text("cover_letter_path"),
  coverLetterIsUrl: integer("cover_letter_is_url", { mode: "boolean" }).default(false),
  coverLetterText: text("cover_letter_text"),
  dateApplied: text("date_applied"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});
