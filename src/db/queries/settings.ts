import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getSetting(key: string): Promise<string | null> {
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  return rows[0]?.value ?? null;
}

export async function getAllSettings() {
  return db.select().from(settings);
}

export async function upsertSetting(key: string, value: string) {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}
