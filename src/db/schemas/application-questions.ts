import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { applications } from "./applications";

export const applicationQuestions = sqliteTable("application_questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  applicationId: integer("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull().default(""),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});
