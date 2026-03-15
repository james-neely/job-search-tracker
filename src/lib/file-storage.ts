import { v4 as uuidv4 } from "uuid";
import { mkdir, unlink } from "node:fs/promises";
import { join, extname } from "node:path";

const UPLOADS_DIR = join(process.cwd(), "data", "uploads");

export async function saveUploadedFile(file: File): Promise<string> {
  await mkdir(UPLOADS_DIR, { recursive: true });

  const extension = extname(file.name) || "";
  const filename = `${uuidv4()}${extension}`;
  const filepath = join(UPLOADS_DIR, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await Bun.write(filepath, buffer);

  return filename;
}

export async function saveBufferAsUploadedFile(buffer: Buffer, extension: string): Promise<string> {
  await mkdir(UPLOADS_DIR, { recursive: true });

  const normalizedExtension = extension.startsWith(".") ? extension : `.${extension}`;
  const filename = `${uuidv4()}${normalizedExtension}`;
  const filepath = join(UPLOADS_DIR, filename);

  await Bun.write(filepath, buffer);

  return filename;
}

export async function deleteUploadedFile(filename: string): Promise<void> {
  const filepath = join(UPLOADS_DIR, filename);
  try {
    await unlink(filepath);
  } catch {
    // File may not exist, ignore
  }
}

export function getUploadPath(filename: string): string {
  return join(UPLOADS_DIR, filename);
}
