import { NextRequest } from "next/server";
import { streamChat } from "@/lib/xai-client";

export async function POST(request: NextRequest) {
  const { summary, skills, jobTitle } = await request.json();

  const systemPrompt = `You are an expert resume writer.
Rewrite the candidate skills section to be concise, credible, and well organized for a resume.
Use functional category grouping by default, for example Languages, Frameworks/Libraries, Cloud & DevOps, Databases, and Tools & Testing.
If the role is specialized, adjust the groups to highlight the most relevant strengths first, such as Frontend, Backend, Data Processing, Storage, or Infrastructure.
Use simple ATS-safe syntax with one group per line in this exact format: Category: skill, skill, skill
Put the most important group first, and the most important skill first within each line.
Do not include soft skills, Microsoft Office tools, or stale outdated technologies unless the provided context makes them clearly necessary.
Return only the rewritten skills text, no heading, and preserve the one-line-per-group syntax so it can be pasted directly into the resume builder.
Never use em-dashes or en-dashes, use commas, periods, colons, or other punctuation instead.
Avoid obvious AI-sounding phrasing, inflated buzzwords, and filler.
Prefer concrete technologies and natural grouping over generic labels.`;

  const userPrompt = [
    jobTitle ? `Target role: ${jobTitle}` : "",
    summary ? `Summary context:\n${summary}` : "",
    skills ? `Current skills:\n${skills}` : "Current skills are blank. Draft a strong skills section from the available context.",
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
