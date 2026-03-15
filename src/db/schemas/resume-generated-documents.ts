import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { resumeVersions } from "./resume-versions";

export const resumeGeneratedDocuments = sqliteTable("resume_generated_documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  resumeVersionId: integer("resume_version_id")
    .notNull()
    .references(() => resumeVersions.id, { onDelete: "cascade" }),
  format: text("format").notNull(),
  label: text("label").notNull(),
  filePath: text("file_path").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});
