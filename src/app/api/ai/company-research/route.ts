import { NextRequest } from "next/server";
import { streamChat } from "@/lib/xai-client";

export async function POST(request: NextRequest) {
  const { companyName, jobTitle, notes } = await request.json();

  const systemPrompt = `You are a company research analyst. Provide a thorough briefing about the company.
Include: company overview, culture and values, recent news, competitive landscape,
potential interview talking points, and any red flags to watch for.
Never use em-dashes or en-dashes in your writing; use commas, periods, or other punctuation instead.`;

  const userPrompt = [
    `Company: ${companyName}`,
    jobTitle ? `Position I'm applying for: ${jobTitle}` : "",
    notes ? `Additional context:\n${notes}` : "",
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
