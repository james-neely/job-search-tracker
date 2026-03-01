import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { applications } from "./applications";

export const applicationTasks = sqliteTable("application_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  applicationId: integer("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  url: text("url"),
  dueDate: text("due_date"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});
