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

  const systemPrompt = `You are an expert resume coach.
Review the candidate's education section content and provide concise, actionable coaching feedback.
Explain what is working, what is vague or weak, and how to improve clarity, relevance, specificity, and ATS readability.
Do not rewrite the full field unless a very short example is necessary.
Coach toward ATS-safe bullet syntax using one item per line, each starting with "- ".
Never use em-dashes or en-dashes, use commas, periods, colons, or other punctuation instead.
Avoid obvious AI-sounding phrasing, generic hype, and unsupported claims.`;

  const userPrompt = [
    schoolName ? `School: ${schoolName}` : "",
    degree ? `Degree: ${degree}` : "",
    fieldOfStudy ? `Field of study: ${fieldOfStudy}` : "",
    gpa ? `GPA: ${gpa}` : "",
    startDate || endDate ? `Dates: ${[startDate, endDate].filter(Boolean).join(" to ")}` : "",
    summary ? `Resume summary context:\n${summary}` : "",
    skills ? `Skills context:\n${skills}` : "",
    fieldLabel ? `Field to coach: ${fieldLabel}` : "",
    value ? `Current content:\n${value}` : "Current content is blank. Coach me on what strong education section content should include.",
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
