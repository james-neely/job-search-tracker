import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { deleteUploadedFile } from "@/lib/file-storage";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.applicationId, Number(id)));
  return NextResponse.json(docs);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const doc = await db
    .insert(documents)
    .values({
      applicationId: Number(id),
      label: body.label,
      filePath: body.filePath,
      isUrl: body.isUrl || false,
    })
    .returning();
  return NextResponse.json(doc[0], { status: 201 });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();

  if (!body.docId || typeof body.label !== "string" || !body.label.trim()) {
    return NextResponse.json({ error: "docId and label are required" }, { status: 400 });
  }

  const updated = await db
    .update(documents)
    .set({ label: body.label.trim() })
    .where(
      and(
        eq(documents.id, Number(body.docId)),
        eq(documents.applicationId, Number(id))
      )
    )
    .returning();

  return NextResponse.json(updated[0] ?? null);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const docId = request.nextUrl.searchParams.get("docId");
  if (!docId) {
    return NextResponse.json({ error: "docId required" }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.id, Number(docId)),
        eq(documents.applicationId, Number(id))
      )
    )
    .limit(1);

  if (existing[0] && !existing[0].isUrl) {
    await deleteUploadedFile(existing[0].filePath);
  }

  await db
    .delete(documents)
    .where(
      and(
        eq(documents.id, Number(docId)),
        eq(documents.applicationId, Number(id))
      )
    );
  return NextResponse.json({ success: true });
}
