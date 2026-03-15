import { NextRequest, NextResponse } from "next/server";
import { getResumeVersion, addGeneratedResumeDocument } from "@/db/queries/resume-versions";
import { getAllSettings } from "@/db/queries/settings";
import {
  renderResumeMarkdown,
  renderResumeDocx,
  renderResumePdf,
} from "@/lib/resume-builder";
import { saveBufferAsUploadedFile } from "@/lib/file-storage";

type RouteParams = { params: Promise<{ id: string }> };

const FORMAT_CONFIG = {
  markdown: {
    extension: ".md",
    label: "Markdown",
  },
  pdf: {
    extension: ".pdf",
    label: "PDF",
  },
  docx: {
    extension: ".docx",
    label: "DOCX",
  },
} as const;

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const version = await getResumeVersion(id);

  if (!version) {
    return NextResponse.json({ error: "Resume version not found" }, { status: 404 });
  }

  const body = await request.json();
  const format = typeof body.format === "string" ? body.format : "";

  if (!(format in FORMAT_CONFIG)) {
    return NextResponse.json({ error: "Unsupported resume format" }, { status: 400 });
  }

  const settingsMap: Record<string, string> = {};
  for (const setting of await getAllSettings()) {
    settingsMap[setting.key] = setting.value;
  }

  let buffer: Buffer;
  if (format === "markdown") {
    buffer = Buffer.from(renderResumeMarkdown(version, settingsMap), "utf-8");
  } else if (format === "pdf") {
    buffer = await renderResumePdf(version, settingsMap);
  } else {
    buffer = await renderResumeDocx(version, settingsMap);
  }

  const config = FORMAT_CONFIG[format as keyof typeof FORMAT_CONFIG];
  const filePath = await saveBufferAsUploadedFile(buffer, config.extension);
  const document = await addGeneratedResumeDocument(
    version.id,
    format,
    `${version.title} ${config.label}`,
    filePath
  );

  if (!document) {
    return NextResponse.json({ error: "Failed to save generated document" }, { status: 500 });
  }

  return NextResponse.json(document, { status: 201 });
}
