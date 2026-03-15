export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { streamChat } from "@/lib/xai-client";

export async function POST(request: NextRequest) {
  const { companyName, roleTitle, location, summary, skills, bullets } = await request.json();

  const systemPrompt = `You are an expert resume coach.
Review the candidate's work experience bullets and provide concise, actionable coaching feedback.
Explain what is working, what is vague or weak, and how to improve impact, specificity, technology signal, and outcomes.
Do not rewrite the full bullet list unless a very short example is necessary.
Coach toward ATS-safe bullet syntax using one bullet per line, each starting with "- ".
Never use em-dashes or en-dashes, use commas, periods, colons, or other punctuation instead.
Avoid obvious AI-sounding phrasing, generic hype, and unsupported claims.`;

  const userPrompt = [
    companyName ? `Company: ${companyName}` : "",
    roleTitle ? `Role: ${roleTitle}` : "",
    location ? `Location: ${location}` : "",
    summary ? `Resume summary context:\n${summary}` : "",
    skills ? `Skills context:\n${skills}` : "",
    bullets ? `Current bullets:\n${bullets}` : "Current bullets are blank. Coach me on what strong work experience bullets should include.",
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
