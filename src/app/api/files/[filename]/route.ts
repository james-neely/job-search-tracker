import { NextRequest, NextResponse } from "next/server";
import { getUploadPath } from "@/lib/file-storage";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

type RouteParams = { params: Promise<{ filename: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { filename } = await params;
  const download = request.nextUrl.searchParams.get("download") === "1";
  const filepath = getUploadPath(filename);

  try {
    const data = await readFile(filepath);
    const ext = extname(filename).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Length": String(data.length),
    };

    if (download) {
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
    } else {
      headers["Content-Disposition"] = "inline";
    }

    return new NextResponse(data, { headers });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
