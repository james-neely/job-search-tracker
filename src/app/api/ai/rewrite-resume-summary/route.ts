export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { streamChat } from "@/lib/xai-client";

export async function POST(request: NextRequest) {
  const { summary, skills, jobTitle } = await request.json();

  const systemPrompt = `You are an expert resume writer.
Rewrite the candidate summary to be concise, specific, and credible.
Keep it professional, first-person free, and suitable for the top of a resume.
Return only the rewritten summary text, no heading, no bullets unless the input clearly requires them.
Never use em-dashes or en-dashes, use commas, periods, or other punctuation instead.
Avoid stale resume cliches, generic hype, and obvious AI-sounding phrasing.
Prefer concrete wording, natural sentence rhythm, and specific claims that sound human and grounded.`;

  const userPrompt = [
    jobTitle ? `Target role: ${jobTitle}` : "",
    skills ? `Skills context:\n${skills}` : "",
    summary ? `Current summary:\n${summary}` : "Current summary is blank. Draft a strong summary from the available context.",
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
