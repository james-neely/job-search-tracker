export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { streamChat } from "@/lib/xai-client";

export async function POST(request: NextRequest) {
  const { name, link, technologies, description, summary, skills, fieldLabel, value } = await request.json();

  const fieldSpecificInstructions =
    fieldLabel === "Technologies"
      ? `Return only a concise technologies line, with items separated by commas. Do not use bullets or headings.`
      : `Return only a concise project description suitable for a resume. Keep it short, specific, and credible.`;

  const systemPrompt = `You are an expert resume writer.
Rewrite the candidate's project section content to be concise, specific, and credible.
${fieldSpecificInstructions}
Never use em-dashes or en-dashes, use commas, periods, colons, or other punctuation instead.
Avoid obvious AI-sounding phrasing, generic hype, and unsupported claims.`;

  const userPrompt = [
    name ? `Project: ${name}` : "",
    link ? `Link: ${link}` : "",
    technologies ? `Current technologies:\n${technologies}` : "",
    description ? `Current description:\n${description}` : "",
    summary ? `Resume summary context:\n${summary}` : "",
    skills ? `Skills context:\n${skills}` : "",
    fieldLabel ? `Field to rewrite: ${fieldLabel}` : "",
    value ? `Current field value:\n${value}` : "Current field is blank. Draft strong resume-ready content from the available context.",
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
