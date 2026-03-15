import { NextResponse } from "next/server";
import { getApplication } from "@/db/queries/applications";
import { getMainResumeVersion, getResumeVersion } from "@/db/queries/resume-versions";
import { db } from "@/db";
import { applicationResumeAtsAnalyses } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import {
  atsAnalysisSchema,
  finalizeAtsAnalysis,
  resumeVersionToJson,
} from "@/lib/resume-json";
import { generateStructuredObject } from "@/lib/xai-client";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const applicationId = Number(id);
  const application = await getApplication(applicationId);

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const historyRows = await db
    .select()
    .from(applicationResumeAtsAnalyses)
    .where(eq(applicationResumeAtsAnalyses.applicationId, applicationId))
    .orderBy(desc(applicationResumeAtsAnalyses.createdAt), desc(applicationResumeAtsAnalyses.id));

  return NextResponse.json({
    attachedResumeVersionId: application.attachedResumeVersionId,
    history: historyRows.map((row) => ({
      id: row.id,
      applicationId: row.applicationId,
      resumeVersionId: row.resumeVersionId,
      resumeVersionTitle: row.resumeVersionTitle,
      overallScore: row.overallScore,
      matchedKeywordCount: row.matchedKeywordCount,
      totalKeywordCount: row.totalKeywordCount,
      createdAt: row.createdAt,
    })),
  });
}

export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const applicationId = Number(id);
  const application = await getApplication(applicationId);

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (!application.jobDescription?.trim()) {
    return NextResponse.json({ error: "Add a job description before running ATS analysis." }, { status: 400 });
  }

  const attachedResume = application.attachedResumeVersionId
    ? await getResumeVersion(application.attachedResumeVersionId)
    : null;
  const mainResume = await getMainResumeVersion();
  const targetResume = attachedResume ?? mainResume;

  if (!targetResume) {
    return NextResponse.json({ error: "Select a main resume before running ATS analysis." }, { status: 400 });
  }

  const analysis = await generateStructuredObject({
    schema: atsAnalysisSchema,
    messages: [
      {
        role: "system",
        content: `You are an ATS and resume reviewer.
Audit the provided resume against the target application and return structured analysis.
Identify the most important ATS keywords from the job description, then classify each as matched or missing in the resume.
Matched and missing keywords must not overlap.
Provide practical section-level feedback for summary, skills, work experience, projects, and education.
Flag formatting or ATS risks only when they are real.
Never use em-dashes or en-dashes, use commas, periods, colons, or other punctuation instead.`,
      },
      {
        role: "user",
        content: [
          `Target company: ${application.companyName}`,
          `Target role: ${application.jobTitle}`,
          `Job description:\n${application.jobDescription}`,
          application.notes ? `Application notes:\n${application.notes}` : "",
          application.companyIntel ? `Company intel:\n${application.companyIntel}` : "",
          `Resume under analysis: ${targetResume.title}`,
          `Resume JSON:\n${JSON.stringify(resumeVersionToJson(targetResume), null, 2)}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
    ],
  });

  const finalized = finalizeAtsAnalysis(analysis);
  const inserted = await db
    .insert(applicationResumeAtsAnalyses)
    .values({
      applicationId,
      resumeVersionId: targetResume.id,
      resumeVersionTitle: targetResume.title,
      overallScore: finalized.overallScore,
      matchedKeywordCount: finalized.matchedKeywordCount,
      totalKeywordCount: finalized.totalKeywordCount,
      analysisJson: JSON.stringify(finalized),
    })
    .returning();

  return NextResponse.json({
    resumeVersionId: targetResume.id,
    resumeVersionTitle: targetResume.title,
    analysis: finalized,
    historyItem: {
      id: inserted[0]?.id,
      applicationId,
      resumeVersionId: targetResume.id,
      resumeVersionTitle: targetResume.title,
      overallScore: finalized.overallScore,
      matchedKeywordCount: finalized.matchedKeywordCount,
      totalKeywordCount: finalized.totalKeywordCount,
      createdAt: inserted[0]?.createdAt ?? new Date().toISOString(),
    },
  });
}
