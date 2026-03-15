import { NextRequest } from "next/server";
import { streamChat } from "@/lib/xai-client";
import { getSetting } from "@/db/queries/settings";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: Message[];
  context: {
    companyName: string;
    jobTitle: string;
    status: string;
    employmentType?: string;
    workplaceType?: string;
    applicationMedium?: string | null;
    jobDescription?: string;
    jobApplicationUrl?: string | null;
    jobApplicationStatusUrl?: string | null;
    notes?: string;
    salaryAsked?: number | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
    compensationType?: string;
    offersEquity?: boolean;
    jobPostedAt?: string | null;
    workLocationCity?: string | null;
    workLocationState?: string | null;
    hiringManagerName?: string | null;
    hiringManagerEmail?: string | null;
    hiringManagerPhone?: string | null;
    hiringManagerLinkedinUrl?: string | null;
    dateApplied?: string | null;
  };
}

function buildSystemPrompt(context: RequestBody["context"], resumeText: string | null): string {
  const parts = [
    `You are a helpful job application assistant. The user is applying for a position and may ask for help answering application questions, drafting responses, or preparing materials.`,
    `\nApplication context:`,
    `- Company: ${context.companyName}`,
    `- Position: ${context.jobTitle}`,
    `- Status: ${context.status}`,
  ];

  if (context.dateApplied) parts.push(`- Applied: ${context.dateApplied}`);
  if (context.jobPostedAt) parts.push(`- Job posted: ${context.jobPostedAt}`);
  if (context.employmentType) parts.push(`- Employment type: ${context.employmentType}`);
  if (context.workplaceType) parts.push(`- Workplace type: ${context.workplaceType}`);
  if (context.applicationMedium) parts.push(`- Application medium: ${context.applicationMedium}`);
  if (context.workLocationCity || context.workLocationState) {
    parts.push(`- Work location: ${context.workLocationCity ?? "?"}, ${context.workLocationState ?? "?"}`);
  }
  if (context.offersEquity) parts.push(`- Company offers equity`);
  if (context.salaryAsked) parts.push(`- Salary asked: $${context.salaryAsked.toLocaleString()}`);
  if (context.salaryMin || context.salaryMax) {
    parts.push(`- ${context.compensationType === "hourly" ? "Hourly" : "Salary"} range: $${context.salaryMin?.toLocaleString() ?? "?"} - $${context.salaryMax?.toLocaleString() ?? "?"}`);
  }
  if (context.jobApplicationUrl) parts.push(`- Application URL: ${context.jobApplicationUrl}`);
  if (context.jobApplicationStatusUrl) parts.push(`- Application status URL: ${context.jobApplicationStatusUrl}`);
  if (context.hiringManagerName) parts.push(`- Hiring manager: ${context.hiringManagerName}`);
  if (context.hiringManagerEmail) parts.push(`- Hiring manager email: ${context.hiringManagerEmail}`);
  if (context.hiringManagerPhone) parts.push(`- Hiring manager phone: ${context.hiringManagerPhone}`);
  if (context.hiringManagerLinkedinUrl) parts.push(`- Hiring manager LinkedIn: ${context.hiringManagerLinkedinUrl}`);
  if (context.jobDescription) parts.push(`\nJob description:\n${context.jobDescription}`);
  if (context.notes) parts.push(`\nUser's notes:\n${context.notes}`);
  if (resumeText) parts.push(`\nCandidate's resume:\n${resumeText}`);

  parts.push(
    `\nProvide concise, tailored answers that reference the specific company and role when relevant.`,
    `If the user pastes an application question, help them craft a strong answer.`,
    `Never use em-dashes or en-dashes in your writing; use commas, periods, or other punctuation instead.`,
  );

  return parts.join("\n");
}

export async function POST(request: NextRequest) {
  const { messages, context }: RequestBody = await request.json();

  const resumeText = await getSetting("resume_text");
  const systemPrompt = buildSystemPrompt(context, resumeText);

  const chatMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  try {
    const result = await streamChat(chatMessages);
    return result.toTextStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
