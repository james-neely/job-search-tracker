import { NextRequest } from "next/server";
import { streamChat } from "@/lib/xai-client";

export async function POST(request: NextRequest) {
  const { summary, skills, jobTitle } = await request.json();

  const systemPrompt = `You are an expert resume coach.
Review the candidate summary and provide concise, actionable coaching feedback.
Explain what is working, what is weak or generic, and give specific suggestions to improve clarity, credibility, and impact.
Do not rewrite the full summary unless a very short example phrase is necessary.
Use plain coaching language that is practical and direct.
Never use em-dashes or en-dashes, use commas, periods, or other punctuation instead.
Avoid obvious AI-sounding phrasing, generic hype, and empty corporate buzzwords.`;

  const userPrompt = [
    jobTitle ? `Target role: ${jobTitle}` : "",
    skills ? `Skills context:\n${skills}` : "",
    summary ? `Current summary:\n${summary}` : "Current summary is blank. Coach me on what a strong summary should include.",
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
