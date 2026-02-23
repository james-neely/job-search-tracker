import { NextRequest } from "next/server";
import { streamChat } from "@/lib/xai-client";

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
    jobDescription?: string;
    notes?: string;
    salaryAsked?: number | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
    dateApplied?: string | null;
  };
}

function buildSystemPrompt(context: RequestBody["context"]): string {
  const parts = [
    `You are a helpful job application assistant. The user is applying for a position and may ask for help answering application questions, drafting responses, or preparing materials.`,
    `\nApplication context:`,
    `- Company: ${context.companyName}`,
    `- Position: ${context.jobTitle}`,
    `- Status: ${context.status}`,
  ];

  if (context.dateApplied) parts.push(`- Applied: ${context.dateApplied}`);
  if (context.salaryAsked) parts.push(`- Salary asked: $${context.salaryAsked.toLocaleString()}`);
  if (context.salaryMin || context.salaryMax) {
    parts.push(`- Salary range: $${context.salaryMin?.toLocaleString() ?? "?"} - $${context.salaryMax?.toLocaleString() ?? "?"}`);
  }
  if (context.jobDescription) parts.push(`\nJob description:\n${context.jobDescription}`);
  if (context.notes) parts.push(`\nUser's notes:\n${context.notes}`);

  parts.push(
    `\nProvide concise, tailored answers that reference the specific company and role when relevant.`,
    `If the user pastes an application question, help them craft a strong answer.`,
  );

  return parts.join("\n");
}

export async function POST(request: NextRequest) {
  const { messages, context }: RequestBody = await request.json();

  const systemPrompt = buildSystemPrompt(context);

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
