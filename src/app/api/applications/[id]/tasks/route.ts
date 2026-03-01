import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applicationTasks } from "@/db/schema";
import { eq, and } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const tasks = await db
    .select()
    .from(applicationTasks)
    .where(eq(applicationTasks.applicationId, Number(id)));
  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const task = await db
    .insert(applicationTasks)
    .values({
      applicationId: Number(id),
      title: body.title,
      url: body.url ?? null,
      dueDate: body.dueDate ?? null,
    })
    .returning();
  return NextResponse.json(task[0], { status: 201 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const taskId = request.nextUrl.searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json({ error: "taskId required" }, { status: 400 });
  }
  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.url !== undefined) updates.url = body.url;
  if (body.dueDate !== undefined) updates.dueDate = body.dueDate;
  if (body.completedAt !== undefined) updates.completedAt = body.completedAt;
  const updated = await db
    .update(applicationTasks)
    .set(updates)
    .where(
      and(
        eq(applicationTasks.id, Number(taskId)),
        eq(applicationTasks.applicationId, Number(id))
      )
    )
    .returning();
  return NextResponse.json(updated[0]);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const taskId = request.nextUrl.searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json({ error: "taskId required" }, { status: 400 });
  }
  await db
    .delete(applicationTasks)
    .where(
      and(
        eq(applicationTasks.id, Number(taskId)),
        eq(applicationTasks.applicationId, Number(id))
      )
    );
  return NextResponse.json({ success: true });
}
