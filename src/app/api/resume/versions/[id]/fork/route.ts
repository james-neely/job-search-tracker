import { NextRequest, NextResponse } from "next/server";
import { createResumeVersion, getResumeVersion } from "@/db/queries/resume-versions";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const sourceVersion = await getResumeVersion(id);

  if (!sourceVersion) {
    return NextResponse.json({ error: "Resume version not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" && body.title.trim()
    ? body.title.trim()
    : `${sourceVersion.title} Fork`;

  const version = await createResumeVersion(title, sourceVersion.id);

  if (!version) {
    return NextResponse.json({ error: "Failed to fork resume version" }, { status: 500 });
  }

  return NextResponse.json(version, { status: 201 });
}
