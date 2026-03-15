import { NextRequest, NextResponse } from "next/server";
import { getResumeVersion } from "@/db/queries/resume-versions";
import { getAllSettings } from "@/db/queries/settings";
import { generateStoredResumeDocument, RESUME_FORMAT_CONFIG } from "@/lib/resume-documents";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const version = await getResumeVersion(id);

  if (!version) {
    return NextResponse.json({ error: "Resume version not found" }, { status: 404 });
  }

  const body = await request.json();
  const format = typeof body.format === "string" ? body.format : "";

  if (!(format in RESUME_FORMAT_CONFIG)) {
    return NextResponse.json({ error: "Unsupported resume format" }, { status: 400 });
  }

  const settingsMap: Record<string, string> = {};
  for (const setting of await getAllSettings()) {
    settingsMap[setting.key] = setting.value;
  }

  const generated = await generateStoredResumeDocument({
    version,
    settingsMap,
    format: format as keyof typeof RESUME_FORMAT_CONFIG,
  });
  const document = generated.resumeDocument;

  if (!document) {
    return NextResponse.json({ error: "Failed to save generated document" }, { status: 500 });
  }

  return NextResponse.json(document, { status: 201 });
}
