import { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require("pdf-parse") as { PDFParse: new (opts: { data: Buffer }) => { getText: () => Promise<{ pages: { text: string }[] }> } };
import { saveUploadedFile, deleteUploadedFile, getUploadPath } from "@/lib/file-storage";
import { upsertSetting, getSetting } from "@/db/queries/settings";

const ALLOWED_EXTENSIONS = [".pdf", ".txt"];
const MAX_CHARS = 15000;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return Response.json({ error: "Only .pdf and .txt files are allowed" }, { status: 400 });
  }

  const filename = await saveUploadedFile(file);
  const buffer = await readFile(getUploadPath(filename));

  let extractedText: string;
  if (ext === ".pdf") {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    extractedText = result.pages.map((p) => p.text).join("\n");
  } else {
    extractedText = buffer.toString("utf-8");
  }

  const trimmedText = extractedText.trim().slice(0, MAX_CHARS);

  await upsertSetting("resume_path", filename);
  await upsertSetting("resume_text", trimmedText);

  return Response.json({ filename, charCount: trimmedText.length });
}

export async function DELETE() {
  const existingFilename = await getSetting("resume_path");

  if (existingFilename) {
    await deleteUploadedFile(existingFilename);
  }

  await upsertSetting("resume_path", "");
  await upsertSetting("resume_text", "");

  return Response.json({ success: true });
}
