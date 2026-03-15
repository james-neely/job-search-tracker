export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { streamChat } from "@/lib/xai-client";

export async function POST(request: NextRequest) {
  const { name, link, technologies, description, summary, skills, fieldLabel, value } = await request.json();

  const systemPrompt = `You are an expert resume coach.
Review the candidate's project section content and provide concise, actionable coaching feedback.
Explain what is working, what is vague or weak, and how to improve clarity, relevance, specificity, and technology signal.
Do not rewrite the full field unless a very short example is necessary.
If coaching technologies, prefer a tight comma-separated list of concrete tools and frameworks.
If coaching description, prefer concise resume-ready language with outcomes or scope when possible.
Never use em-dashes or en-dashes, use commas, periods, colons, or other punctuation instead.
Avoid obvious AI-sounding phrasing, generic hype, and unsupported claims.`;

  const userPrompt = [
    name ? `Project: ${name}` : "",
    link ? `Link: ${link}` : "",
    technologies ? `Current technologies:\n${technologies}` : "",
    description ? `Current description:\n${description}` : "",
    summary ? `Resume summary context:\n${summary}` : "",
    skills ? `Skills context:\n${skills}` : "",
    fieldLabel ? `Field to coach: ${fieldLabel}` : "",
    value ? `Current field value:\n${value}` : "Current field is blank. Coach me on what strong project section content should include.",
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
