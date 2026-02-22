import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { applications } from "./applications";

export const companyLinks = sqliteTable("company_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  applicationId: integer("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  url: text("url").notNull(),
});
