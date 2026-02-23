import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobBoards } from "@/db/schema";
import { eq } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const updated = await db
    .update(jobBoards)
    .set({ name: body.name, url: body.url })
    .where(eq(jobBoards.id, Number(id)))
    .returning();
  return NextResponse.json(updated[0]);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  await db.delete(jobBoards).where(eq(jobBoards.id, Number(id)));
  return NextResponse.json({ success: true });
}
