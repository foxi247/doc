import { NextRequest, NextResponse } from "next/server";
import { aiClient, AI_MODEL } from "@/lib/ai/client";
import { buildChatSystemPrompt } from "@/lib/ai/chat-prompts";
import { parseChatResponse } from "@/lib/ai/chat-parser";
import { ChatRequestSchema, type SessionMemory } from "@/lib/ai/chat-types";
import { sanitizeInput } from "@/lib/utils";
import { hospitalProvider } from "@/lib/search/hospitals";
import { doctorProvider } from "@/lib/search/doctors";

export const maxDuration = 60;

const DEFAULT_MEMORY: SessionMemory = {
  symptoms: [],
  location: { country: null, city: null },
  files: [],
  specialist: null,
  urgency: null,
};

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const validation = ChatRequestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0]?.message || "Invalid request." },
      { status: 400 }
    );
  }

  const { messages, sessionMemory, locale } = validation.data;
  const memory: SessionMemory = sessionMemory ?? DEFAULT_MEMORY;

  // Sanitize user messages
  const sanitizedMessages = messages.map((m) => ({
    ...m,
    content: m.role === "user" ? sanitizeInput(m.content) : m.content,
  }));

  const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS || "8000", 10);

  // Fall back if no API key
  if (
    !process.env.NVIDIA_API_KEY ||
    process.env.NVIDIA_API_KEY === "placeholder-key"
  ) {
    return NextResponse.json(buildMockResponse(memory, locale));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const systemPrompt = buildChatSystemPrompt(locale, memory);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completion = await (aiClient.chat.completions.create as any)(
      {
        model: AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...sanitizedMessages,
        ],
        temperature: 0.4,
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
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    const rawContent = completion.choices?.[0]?.message?.content || "";

    if (!rawContent.trim()) {
      return NextResponse.json(buildMockResponse(memory, locale));
    }

    const parsed = parseChatResponse(rawContent, memory);

    // Attach recommendations if location known + specialist identified
    if (
      (parsed.sessionMemory.location.city || parsed.sessionMemory.location.country) &&
      parsed.sessionMemory.specialist
    ) {
      const query = {
        specialty: parsed.sessionMemory.specialist,
        city: parsed.sessionMemory.location.city ?? undefined,
        country: parsed.sessionMemory.location.country ?? undefined,
      };

      const [hospitals, doctors] = await Promise.all([
        hospitalProvider.searchHospitals(query).catch(() => []),
        doctorProvider.searchDoctors(query).catch(() => []),
      ]);

      if (hospitals.length > 0 || doctors.length > 0) {
        parsed.recommendations = { hospitals, doctors };
      }
    }

    return NextResponse.json(parsed);
  } catch (err) {
    clearTimeout(timeoutId);
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[MedNavigator chat] AI call failed:", msg.slice(0, 200));
    return NextResponse.json(buildMockResponse(memory, locale));
  }
}

function buildMockResponse(memory: SessionMemory, locale: string) {
  const isRu = locale === "ru";
  const hasSymptoms = memory.symptoms.length > 0;

  return {
    message: hasSymptoms
      ? isRu
        ? `Я отметил ваши симптомы: ${memory.symptoms.join(", ")}. Расскажите подробнее — как долго это продолжается?`
        : `I've noted your symptoms: ${memory.symptoms.join(", ")}. Can you tell me more — how long has this been happening?`
      : isRu
      ? "Здравствуйте! Опишите ваши симптомы, и я помогу понять, к какому специалисту обратиться."
      : "Hello! Please describe your symptoms and I'll help guide you to the right specialist.",
    urgency: "low" as const,
    recommendedSpecialist: memory.specialist,
    followUpQuestions: [
      {
        id: "q1",
        question: isRu ? "Как долго продолжаются симптомы?" : "How long have you had these symptoms?",
        type: "single-choice" as const,
        options: isRu
          ? ["Менее суток", "1–3 дня", "Более недели", "Хроническое"]
          : ["Less than a day", "1–3 days", "Over a week", "Chronic/ongoing"],
      },
    ],
    sessionMemory: memory,
    requestLocation: false,
    disclaimer: isRu
      ? "Это не диагноз. Консультируйтесь с врачом."
      : "This is not a diagnosis. Always consult a physician.",
  };
}
