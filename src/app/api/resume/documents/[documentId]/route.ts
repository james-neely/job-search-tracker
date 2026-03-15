import { NextRequest, NextResponse } from "next/server";
import {
  deleteGeneratedResumeDocument,
  getGeneratedResumeDocument,
} from "@/db/queries/resume-versions";
import { deleteUploadedFile } from "@/lib/file-storage";

type RouteParams = { params: Promise<{ documentId: string }> };

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { documentId } = await params;
  const id = Number(documentId);

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
  }

  const document = await getGeneratedResumeDocument(id);

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  await deleteGeneratedResumeDocument(id);
  await deleteUploadedFile(document.filePath);

  return NextResponse.json({ success: true, id });
}
