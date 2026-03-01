import { NextRequest } from "next/server";
import { streamChat } from "@/lib/xai-client";
import { getSetting } from "@/db/queries/settings";

export async function POST(request: NextRequest) {
  const { companyName, jobTitle, jobDescription, notes } = await request.json();

  const resumeText = await getSetting("resume_text");

  const systemPrompt = `You are an expert career coach who writes compelling cover letters.
Write a complete, tailored cover letter for the position described. The letter should be
professional, specific to the role and company, and highlight relevant experience.
Do not use placeholders or generic filler text. Write the full letter ready to send.
Never use em-dashes or en-dashes; use commas, periods, or other punctuation instead.`;

  const parts = [
    `Company: ${companyName}`,
    `Position: ${jobTitle}`,
    jobDescription ? `Job Description:\n${jobDescription}` : "",
    resumeText ? `Candidate Resume:\n${resumeText}` : "",
    notes ? `Additional context:\n${notes}` : "",
  ].filter(Boolean);

  const userPrompt = parts.join("\n\n");

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
