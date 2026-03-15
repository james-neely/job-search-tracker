import { NextRequest, NextResponse } from "next/server";
import { createResumeVersion, listResumeVersions } from "@/db/queries/resume-versions";

export async function GET() {
  const versions = await listResumeVersions();
  return NextResponse.json(versions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const title = typeof body.title === "string" && body.title.trim()
    ? body.title.trim()
    : `Resume ${new Date().toLocaleDateString("en-US")}`;
  const parentVersionId = typeof body.parentVersionId === "string" ? body.parentVersionId : null;

  const version = await createResumeVersion(title, parentVersionId);

  if (!version) {
    return NextResponse.json({ error: "Failed to create resume version" }, { status: 500 });
  }

  return NextResponse.json(version, { status: 201 });
}
