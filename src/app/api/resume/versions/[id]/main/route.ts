import { NextResponse } from "next/server";
import { setMainResumeVersion } from "@/db/queries/resume-versions";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const version = await setMainResumeVersion(id);

  if (!version) {
    return NextResponse.json({ error: "Resume version not found" }, { status: 404 });
  }

  return NextResponse.json(version);
}
