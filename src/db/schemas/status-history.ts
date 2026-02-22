import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { applications } from "./applications";

export const statusHistory = sqliteTable("status_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  applicationId: integer("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  changedAt: text("changed_at").default(sql`(datetime('now'))`),
});
