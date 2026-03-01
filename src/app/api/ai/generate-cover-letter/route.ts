import { NextRequest } from "next/server";
import { streamChat } from "@/lib/xai-client";
import { getSetting } from "@/db/queries/settings";

export async function POST(request: NextRequest) {
  const { companyName, jobTitle, jobDescription, notes } = await request.json();

  const [
    resumeText,
    fullName,
    email,
    phone,
    linkedinUrl,
    portfolioUrl,
    websiteUrl,
    addressLine1,
    addressLine2,
    coverLetterFooter,
  ] = await Promise.all([
    getSetting("resume_text"),
    getSetting("full_name"),
    getSetting("email"),
    getSetting("phone"),
    getSetting("linkedin_url"),
    getSetting("portfolio_url"),
    getSetting("website_url"),
    getSetting("address_line1"),
    getSetting("address_line2"),
    getSetting("cover_letter_footer"),
  ]);

  const headerLines = [
    fullName,
    addressLine1,
    addressLine2,
    [phone, email].filter(Boolean).join(" | "),
    [linkedinUrl, portfolioUrl || websiteUrl].filter(Boolean).join(" | "),
  ].filter(Boolean);

  const headerBlock = headerLines.length
    ? `Candidate Header:\n${headerLines.join("\n")}`
    : "";

  const footerInstruction = coverLetterFooter
    ? `Use this exact closing paragraph before the sign-off:\n"${coverLetterFooter}"`
    : "";

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const systemPrompt = `You are an expert career coach who writes compelling cover letters.
Write a complete, tailored cover letter for the position described. The letter should be
professional, specific to the role and company, and highlight relevant experience.
Do not use placeholders or generic filler text. Write the full letter ready to send.
Include the candidate's header block (name, address, contact info) at the top exactly as provided.
The date of the letter is ${today}. Include it in the letter.
${footerInstruction}
Never use em-dashes or en-dashes; use commas, periods, or other punctuation instead.`.trim();

  const parts = [
    `Company: ${companyName}`,
    `Position: ${jobTitle}`,
    headerBlock,
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
