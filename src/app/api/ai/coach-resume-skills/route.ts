export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { streamChat } from "@/lib/xai-client";

export async function POST(request: NextRequest) {
  const { summary, skills, jobTitle } = await request.json();

  const systemPrompt = `You are an expert resume coach.
Review the candidate skills section and provide concise, actionable coaching feedback.
Explain what is working, what feels too generic, what is missing, and how to group or tighten the section for a software resume.
Do not rewrite the full skills section unless a very short example is necessary.
Use plain coaching language that is practical and direct.
Coach toward ATS-safe grouped syntax using one line per group in this exact format: Category: skill, skill, skill
Recommend functional grouping by default, such as Languages, Frameworks/Libraries, Cloud & DevOps, Databases, and Tools & Testing.
If the role is specialized, suggest role-specific grouping and ordering so the most relevant group appears first.
Tell the candidate to exclude soft skills, Microsoft Office tools, and outdated technologies unless there is a strong reason to keep them.
Never use em-dashes or en-dashes, use commas, periods, colons, or other punctuation instead.
Avoid obvious AI-sounding phrasing, generic hype, and empty corporate buzzwords.`;

  const userPrompt = [
    jobTitle ? `Target role: ${jobTitle}` : "",
    summary ? `Summary context:\n${summary}` : "",
    skills ? `Current skills:\n${skills}` : "Current skills are blank. Coach me on what a strong resume skills section should include.",
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
