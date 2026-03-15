export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { streamChat } from "@/lib/xai-client";

export async function POST(request: NextRequest) {
  const { companyName, jobTitle, jobDescription, notes } = await request.json();

  const systemPrompt = `You are an expert interview coach. Prepare the candidate for an interview.
Provide: key topics to study, likely questions (behavioral and technical),
suggested answers using the STAR method, and questions to ask the interviewer.
Never use em-dashes or en-dashes in your writing; use commas, periods, or other punctuation instead.`;

  const userPrompt = [
    `Company: ${companyName}`,
    `Position: ${jobTitle}`,
    jobDescription ? `Job Description:\n${jobDescription}` : "",
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
