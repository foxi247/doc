import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiClient, AI_MODEL, AI_CHAT_OPTIONS } from "@/lib/ai/client";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/ai/prompts";
import { parseAIResponse } from "@/lib/ai/parser";
import { getMockResponse } from "@/lib/ai/fallback";
import { sanitizeInput } from "@/lib/utils";

const RequestSchema = z.object({
  symptoms: z
    .string()
    .min(10, "Please describe your symptoms in more detail.")
    .max(2000, "Please keep your description under 2000 characters."),
  uploadedFiles: z.array(z.string().max(100)).max(10).optional(),
});

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const validation = RequestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0]?.message || "Invalid request." },
      { status: 400 }
    );
  }

  const { symptoms, uploadedFiles } = validation.data;
  const sanitizedSymptoms = sanitizeInput(symptoms);
  const sanitizedFiles = uploadedFiles?.map((f) => sanitizeInput(f));

  const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS || "30000", 10);

  // Fall back to mock if no API key configured
  if (!process.env.NVIDIA_API_KEY || process.env.NVIDIA_API_KEY === "placeholder-key") {
    console.info("[MedNavigator] No API key configured — returning mock response.");
    await new Promise((r) => setTimeout(r, 800)); // Simulate latency
    return NextResponse.json(getMockResponse(sanitizedSymptoms));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      { role: "user" as const, content: buildUserMessage(sanitizedSymptoms, sanitizedFiles) },
    ];

    const completion = await aiClient.chat.completions.create({
      model: AI_MODEL,
      messages,
      ...AI_CHAT_OPTIONS,
      stream: false,
    } as Parameters<typeof aiClient.chat.completions.create>[0] & { stream: false });

    clearTimeout(timeoutId);

    // Extract content — do NOT expose reasoning_content to users
    const rawContent =
      completion.choices?.[0]?.message?.content || "";

    if (!rawContent.trim()) {
      console.error("[MedNavigator] Empty response from model.");
      return NextResponse.json(getMockResponse(sanitizedSymptoms));
    }

    const parsed = parseAIResponse(rawContent);

    if (!parsed) {
      console.error("[MedNavigator] Failed to parse model response. Raw:", rawContent.slice(0, 200));
      return NextResponse.json(getMockResponse(sanitizedSymptoms));
    }

    return NextResponse.json(parsed);
  } catch (err) {
    clearTimeout(timeoutId);

    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    // Log server-side without leaking key or sensitive data
    console.error("[MedNavigator] AI call failed:", errorMessage.slice(0, 200));

    if (errorMessage.includes("abort") || errorMessage.includes("timeout")) {
      return NextResponse.json(
        { error: "The request timed out. Showing estimated guidance instead.", ...getMockResponse(sanitizedSymptoms) },
        { status: 200 }
      );
    }

    return NextResponse.json(getMockResponse(sanitizedSymptoms));
  }
}
