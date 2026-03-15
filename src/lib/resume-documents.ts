import { db } from "@/db";
import { documents } from "@/db/schema";
import { addGeneratedResumeDocument } from "@/db/queries/resume-versions";
import type { ResumeVersion } from "@/types";
import {
  renderResumeMarkdown,
  renderResumeDocx,
  renderResumePdf,
} from "@/lib/resume-builder";
import { saveBufferAsUploadedFile } from "@/lib/file-storage";

export const RESUME_FORMAT_CONFIG = {
  markdown: {
    extension: ".md",
    label: "Markdown",
  },
  pdf: {
    extension: ".pdf",
    label: "PDF",
  },
  docx: {
    extension: ".docx",
    label: "DOCX",
  },
} as const;

export type ResumeOutputFormat = keyof typeof RESUME_FORMAT_CONFIG;

export async function renderResumeBuffer(
  version: ResumeVersion,
  settingsMap: Record<string, string>,
  format: ResumeOutputFormat
) {
  if (format === "markdown") {
    return Buffer.from(renderResumeMarkdown(version, settingsMap), "utf-8");
  }

  if (format === "pdf") {
    return renderResumePdf(version, settingsMap);
  }

  return renderResumeDocx(version, settingsMap);
}

export async function generateStoredResumeDocument(options: {
  version: ResumeVersion;
  settingsMap: Record<string, string>;
  format: ResumeOutputFormat;
  applicationId?: number | null;
  applicationLabel?: string;
}) {
  const { version, settingsMap, format, applicationId, applicationLabel } = options;
  const config = RESUME_FORMAT_CONFIG[format];
  const buffer = await renderResumeBuffer(version, settingsMap, format);

  const resumeFilePath = await saveBufferAsUploadedFile(buffer, config.extension);
  const resumeDocument = await addGeneratedResumeDocument(
    version.id,
    format,
    `${version.title} ${config.label}`,
    resumeFilePath
  );

  let applicationDocument: { id: number; label: string; filePath: string; isUrl: boolean; createdAt: string | null } | null = null;
  if (applicationId) {
    const appFilePath = await saveBufferAsUploadedFile(buffer, config.extension);
    const inserted = await db
      .insert(documents)
      .values({
        applicationId,
        label: applicationLabel ?? `${version.title} ${config.label}`,
        filePath: appFilePath,
        isUrl: false,
      })
      .returning();
    applicationDocument = inserted[0] ?? null;
  }

  return {
    format,
    label: config.label,
    resumeDocument,
    applicationDocument,
  };
}
