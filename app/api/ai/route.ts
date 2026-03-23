import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiClient, AI_MODEL } from "@/lib/ai/client";
import { SYSTEM_PROMPT, buildUserMessage } from "@/lib/ai/prompts";
import { parseAIResponse } from "@/lib/ai/parser";
import { getMockResponse } from "@/lib/ai/fallback";
import { sanitizeInput } from "@/lib/utils";

// Increase Vercel serverless timeout (requires Pro plan for >10s; set to max safe on hobby)
export const maxDuration = 60;

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

  // Use 8s timeout on hobby plan (Vercel kills at 10s), 25s otherwise
  const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS || "8000", 10);

  // Fall back to mock if no API key configured
  if (!process.env.NVIDIA_API_KEY || process.env.NVIDIA_API_KEY === "placeholder-key") {
    console.info("[MedNavigator] No API key configured — returning mock response.");
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json(getMockResponse(sanitizedSymptoms));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      { role: "user" as const, content: buildUserMessage(sanitizedSymptoms, sanitizedFiles) },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completion = await (aiClient.chat.completions.create as any)(
      {
        model: AI_MODEL,
        messages,
        temperature: 0.3,
        top_p: 1,
        max_tokens: 1200,
        stream: false,
        extra_body: {
          chat_template_kwargs: {
            enable_thinking: process.env.NVIDIA_ENABLE_THINKING !== "false",
            clear_thinking: false,
          },
        },
      },
      { signal: controller.signal } // ← connected abort signal
    );

    clearTimeout(timeoutId);

    // Extract content — do NOT expose reasoning_content to users
    const rawContent = completion.choices?.[0]?.message?.content || "";

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
    console.error("[MedNavigator] AI call failed:", errorMessage.slice(0, 200));

    // Always return a valid mock — never let the server return no body
    return NextResponse.json(getMockResponse(sanitizedSymptoms));
  }
}
