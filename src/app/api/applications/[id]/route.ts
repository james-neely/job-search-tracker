import { NextRequest, NextResponse } from "next/server";
import {
  getApplication,
  updateApplication,
  deleteApplication,
} from "@/db/queries/applications";
import { db } from "@/db";
import { statusHistory } from "@/db/schema";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const app = await getApplication(Number(id));
  if (!app) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(app);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const appId = Number(id);
  const existing = await getApplication(appId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const updated = await updateApplication(appId, body);

  if (body.status && body.status !== existing.status) {
    await db.insert(statusHistory).values({
      applicationId: appId,
      fromStatus: existing.status,
      toStatus: body.status,
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  await deleteApplication(Number(id));
  return NextResponse.json({ success: true });
}
