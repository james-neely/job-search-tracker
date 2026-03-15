import { NextRequest, NextResponse } from "next/server";
import { getResumeVersion } from "@/db/queries/resume-versions";
import { getAllSettings } from "@/db/queries/settings";
import { renderResumePdf } from "@/lib/resume-builder";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const version = await getResumeVersion(id);

  if (!version) {
    return NextResponse.json({ error: "Resume version not found" }, { status: 404 });
  }

  const settingsMap: Record<string, string> = {};
  for (const setting of await getAllSettings()) {
    settingsMap[setting.key] = setting.value;
  }

  const pdfBuffer = await renderResumePdf(version, settingsMap);

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${version.title.replace(/[^a-zA-Z0-9-_]+/g, "-").toLowerCase() || "resume"}-preview.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
