import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const resumeVersions = sqliteTable("resume_versions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  publicId: text("public_id").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  skills: text("skills"),
  parentVersionId: integer("parent_version_id").references(() => resumeVersions.id, {
    onDelete: "set null",
  }),
  fontSize: real("font_size").notNull().default(11),
  marginTop: real("margin_top").notNull().default(0.75),
  marginRight: real("margin_right").notNull().default(0.75),
  marginBottom: real("margin_bottom").notNull().default(0.75),
  marginLeft: real("margin_left").notNull().default(0.75),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});
