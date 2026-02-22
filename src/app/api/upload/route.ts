import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile } from "@/lib/file-storage";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const filename = await saveUploadedFile(file);
  return NextResponse.json({ filename }, { status: 201 });
}
