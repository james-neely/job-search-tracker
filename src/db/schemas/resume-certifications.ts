import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { resumeVersions } from "./resume-versions";

export const resumeCertifications = sqliteTable("resume_certifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  resumeVersionId: integer("resume_version_id")
    .notNull()
    .references(() => resumeVersions.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  name: text("name").notNull().default(""),
  issuer: text("issuer"),
  issueDate: text("issue_date"),
  credentialId: text("credential_id"),
  visibilityConfig: text("visibility_config").notNull().default("{}"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});
