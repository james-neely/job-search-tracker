import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { applications } from "./applications";

export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  applicationId: integer("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  filePath: text("file_path").notNull(),
  isUrl: integer("is_url", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});
