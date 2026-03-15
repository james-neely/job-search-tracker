export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { streamChat } from "@/lib/xai-client";

export async function POST(request: NextRequest) {
  const { companyName, roleTitle, location, summary, skills, bullets } = await request.json();

  const systemPrompt = `You are an expert resume writer.
Rewrite the candidate's work experience bullets to be concise, specific, and credible.
Focus on impact, scope, technologies, and outcomes when the context supports them.
Return only the rewritten bullet text in this exact syntax:
- Bullet one
- Bullet two
- Bullet three
Use one bullet per line, each line must start with "- ".
Never use em-dashes or en-dashes, use commas, periods, colons, or other punctuation instead.
Avoid obvious AI-sounding phrasing, generic hype, and unsupported claims.
Prefer strong verbs, concrete technologies, and measurable outcomes when possible.`;

  const userPrompt = [
    companyName ? `Company: ${companyName}` : "",
    roleTitle ? `Role: ${roleTitle}` : "",
    location ? `Location: ${location}` : "",
    summary ? `Resume summary context:\n${summary}` : "",
    skills ? `Skills context:\n${skills}` : "",
    bullets ? `Current bullets:\n${bullets}` : "Current bullets are blank. Draft strong work experience bullets from the available context.",
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
