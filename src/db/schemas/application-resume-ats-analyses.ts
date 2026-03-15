import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { applications } from "./applications";

export const applicationResumeAtsAnalyses = sqliteTable("application_resume_ats_analyses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  applicationId: integer("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  resumeVersionId: text("resume_version_id").notNull(),
  resumeVersionTitle: text("resume_version_title").notNull(),
  overallScore: integer("overall_score").notNull(),
  matchedKeywordCount: integer("matched_keyword_count").notNull(),
  totalKeywordCount: integer("total_keyword_count").notNull(),
  analysisJson: text("analysis_json").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});
