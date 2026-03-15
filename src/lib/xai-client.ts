import { createXai } from "@ai-sdk/xai";
import {
  generateObject,
  streamText,
  type StreamTextResult,
} from "ai";
import type { z } from "zod";
import { XAI_DEFAULT_MODEL } from "./constants";
import { getSetting } from "@/db/queries/settings";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function getApiKey(): Promise<string | null> {
  return getSetting("xai_api_key");
}

export async function streamChat(
  messages: ChatMessage[],
  model: string = XAI_DEFAULT_MODEL
): Promise<StreamTextResult<Record<string, never>, never>> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error("xAI API key not configured. Set it in Settings.");
  }

  const xai = createXai({ apiKey });

  return streamText({
    model: xai(model),
    messages,
  });
}

export async function generateStructuredObject<T>({
  messages,
  schema,
  model = XAI_DEFAULT_MODEL,
}: {
  messages: ChatMessage[];
  schema: z.ZodType<T>;
  model?: string;
}): Promise<T> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error("xAI API key not configured. Set it in Settings.");
  }

  const xai = createXai({ apiKey });
  const result = await generateObject({
    model: xai(model),
    schema,
    messages,
  });

  return result.object;
}
