export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { streamChat } from "@/lib/xai-client";

export async function POST(request: NextRequest) {
  const {
    schoolName,
    degree,
    fieldOfStudy,
    gpa,
    startDate,
    endDate,
    summary,
    skills,
    fieldLabel,
    value,
  } = await request.json();

  const systemPrompt = `You are an expert resume writer.
Rewrite the candidate's education section content to be concise, specific, and credible.
Return only the rewritten text in this exact syntax:
- Item one
- Item two
- Item three
Use one item per line, each line must start with "- ".
Never use em-dashes or en-dashes, use commas, periods, colons, or other punctuation instead.
Avoid obvious AI-sounding phrasing, generic hype, and unsupported claims.
Keep the result appropriate for an education section on a resume.`;

  const userPrompt = [
    schoolName ? `School: ${schoolName}` : "",
    degree ? `Degree: ${degree}` : "",
    fieldOfStudy ? `Field of study: ${fieldOfStudy}` : "",
    gpa ? `GPA: ${gpa}` : "",
    startDate || endDate ? `Dates: ${[startDate, endDate].filter(Boolean).join(" to ")}` : "",
    summary ? `Resume summary context:\n${summary}` : "",
    skills ? `Skills context:\n${skills}` : "",
    fieldLabel ? `Field to rewrite: ${fieldLabel}` : "",
    value ? `Current content:\n${value}` : "Current content is blank. Draft strong resume-ready content from the available context.",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const result = await streamChat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);
    return result.toTextStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
