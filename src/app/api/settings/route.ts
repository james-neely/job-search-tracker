import { NextRequest, NextResponse } from "next/server";
import { getAllSettings, upsertSetting } from "@/db/queries/settings";

export async function GET() {
  const allSettings = await getAllSettings();
  const settingsMap: Record<string, string> = {};
  for (const s of allSettings) {
    settingsMap[s.key] = s.value;
  }
  return NextResponse.json(settingsMap);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "string") {
      await upsertSetting(key, value);
    }
  }
  return NextResponse.json({ success: true });
}
