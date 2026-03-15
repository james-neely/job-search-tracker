import { NextResponse } from "next/server";
import { getApplication, updateApplication } from "@/db/queries/applications";
import {
  createResumeVersion,
  getMainResumeVersion,
  updateResumeVersion,
} from "@/db/queries/resume-versions";
import { getAllSettings } from "@/db/queries/settings";
import { generateStoredResumeDocument } from "@/lib/resume-documents";
import {
  resumeJsonToInputs,
  resumeVersionToJson,
  tailoredResumeSchema,
} from "@/lib/resume-json";
import { generateStructuredObject } from "@/lib/xai-client";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const applicationId = Number(id);
  const application = await getApplication(applicationId);

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (!application.jobDescription?.trim()) {
    return NextResponse.json({ error: "Add a job description before tailoring a resume." }, { status: 400 });
  }

  const mainResume = await getMainResumeVersion();
  if (!mainResume) {
    return NextResponse.json({ error: "Select a main resume before generating a tailored resume." }, { status: 400 });
  }

  const baseResumeJson = resumeVersionToJson(mainResume);

  const tailoredResume = await generateStructuredObject({
    schema: tailoredResumeSchema,
    messages: [
      {
        role: "system",
        content: `You are an expert resume writer.
Return only structured resume JSON that matches the provided schema.
Tailor the content to the target role using the job description and application context.
Preserve a credible tone and maximize relevance aggressively, but remain truthful.
You may reframe real experience to emphasize adjacent, transferable, or equivalent concepts only when the base resume supports that interpretation.
Prefer the closest truthful match over omission, and prefer stronger ordering, tighter phrasing, and clearer alignment over weak generic summaries.
Do not invent employers, schools, dates, certifications, tools, frameworks, languages, responsibilities, or metrics that are not supported by the base resume or application context.
Do not swap one concrete technology for a different concrete technology unless the base resume already shows both.
You may reorder sections, entries, bullets, and skills so the most relevant real evidence appears first.
You may rewrite bullets and summaries to foreground technologies, outcomes, and domain overlap that already exist in the source material.
When experience is adjacent rather than direct, use honest phrasing such as worked with, built with, supported, used in coursework, or used in personal projects.
Keep skills in ATS-safe grouped syntax, one group per line, using this format: Category: skill, skill, skill
Keep work bullets one per line, each starting with "- ".
Keep education list-style fields one item per line, each starting with "- ".
Keep project technologies as a concise comma-separated line.
Use Remote or City, ST for work locations.
Never use em-dashes or en-dashes, use commas, periods, colons, or other punctuation instead.
Avoid obvious AI-sounding phrasing, generic hype, and empty buzzwords.`,
      },
      {
        role: "user",
        content: [
          `Target company: ${application.companyName}`,
          `Target role: ${application.jobTitle}`,
          `Job description:\n${application.jobDescription}`,
          application.notes ? `Application notes:\n${application.notes}` : "",
          application.companyIntel ? `Company intel:\n${application.companyIntel}` : "",
          `Base resume JSON:\n${JSON.stringify(baseResumeJson, null, 2)}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
    ],
  });

  const tailoredTitle =
    tailoredResume.title.trim() ||
    `${application.companyName} ${application.jobTitle} Resume`;

  const createdVersion = await createResumeVersion(tailoredTitle, mainResume.id, {
    applicationId,
  });

  if (!createdVersion) {
    return NextResponse.json({ error: "Failed to create tailored resume version" }, { status: 500 });
  }

  const updatedVersion = await updateResumeVersion(
    createdVersion.id,
    resumeJsonToInputs({
      ...tailoredResume,
      title: tailoredTitle,
      fontSize: mainResume.fontSize,
      margin: mainResume.margin as typeof tailoredResume.margin,
    })
  );

  if (!updatedVersion) {
    return NextResponse.json({ error: "Failed to save tailored resume version" }, { status: 500 });
  }

  await updateApplication(applicationId, {
    attachedResumeVersionId: updatedVersion.id,
  });

  const settingsMap: Record<string, string> = {};
  for (const setting of await getAllSettings()) {
    settingsMap[setting.key] = setting.value;
  }

  const generatedDocuments = [];
  for (const format of ["docx", "markdown", "pdf"] as const) {
    const generated = await generateStoredResumeDocument({
      version: updatedVersion,
      settingsMap,
      format,
      applicationId,
      applicationLabel: `${application.companyName} ${application.jobTitle} ${format.toUpperCase()}`,
    });
    generatedDocuments.push(generated);
  }

  return NextResponse.json({
    resumeVersion: updatedVersion,
    attachedResumeVersionId: updatedVersion.id,
    resumeJson: tailoredResume,
    documents: generatedDocuments,
  }, { status: 201 });
}
