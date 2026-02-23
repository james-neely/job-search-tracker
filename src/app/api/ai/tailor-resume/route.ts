import { NextRequest } from "next/server";
import { streamChat } from "@/lib/xai-client";

export async function POST(request: NextRequest) {
  const { companyName, jobTitle, jobDescription, documentText, documentType } =
    await request.json();

  const docLabel = documentType === "cover_letter" ? "cover letter" : "resume";

  const systemPrompt = `You are an expert ${docLabel} writer and career coach.
Tailor the candidate's ${docLabel} to the specific job posting.
Highlight relevant skills, use keywords from the job description,
and suggest specific improvements with explanations.
Never use em-dashes or en-dashes in your writing; use commas, periods, or other punctuation instead.`;

  const userPrompt = [
    `Company: ${companyName}`,
    `Position: ${jobTitle}`,
    jobDescription ? `Job Description:\n${jobDescription}` : "",
    documentText ? `Current ${docLabel}:\n${documentText}` : "",
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
