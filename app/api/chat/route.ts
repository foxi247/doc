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

type ApiMessage = { role: "user" | "assistant"; content: string };

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

  const sanitizedMessages: ApiMessage[] = messages.map((m) => ({
    ...m,
    content: m.role === "user" ? sanitizeInput(m.content) : m.content,
  }));

  // Default: thinking OFF for speed (enable via NVIDIA_ENABLE_THINKING=true)
  const thinkingEnabled = process.env.NVIDIA_ENABLE_THINKING === "true";
  const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS || "8000", 10);

  // Fall back if no API key
  if (
    !process.env.NVIDIA_API_KEY ||
    process.env.NVIDIA_API_KEY === "placeholder-key"
  ) {
    return NextResponse.json(buildMockResponse(memory, locale, sanitizedMessages));
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
            enable_thinking: thinkingEnabled,
            clear_thinking: false,
          },
        },
      },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    const rawContent = completion.choices?.[0]?.message?.content || "";

    if (!rawContent.trim()) {
      return NextResponse.json(buildMockResponse(memory, locale, sanitizedMessages));
    }

    const parsed = parseChatResponse(rawContent, memory);

    // Attach recommendations if location + specialist known
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
    return NextResponse.json(buildMockResponse(memory, locale, sanitizedMessages));
  }
}

// ─── Smart mock ───────────────────────────────────────────────────────────────
// Used when API key is absent OR request times out.
// Varies by conversation stage so it never repeats the same message.

function buildMockResponse(
  memory: SessionMemory,
  locale: string,
  messages: ApiMessage[]
) {
  const isRu = locale === "ru";
  const userMessages = messages.filter((m) => m.role === "user");
  const stage = userMessages.length; // how many user turns so far

  // Extract symptom keywords from latest user message
  const lastUserText = userMessages[userMessages.length - 1]?.content ?? "";
  const extractedSymptoms = extractSymptomKeywords(lastUserText, isRu);
  const allSymptoms = Array.from(
    new Set([...memory.symptoms, ...extractedSymptoms])
  );

  // Urgency guess from keywords
  const urgent = URGENT_KEYWORDS.some((k) =>
    lastUserText.toLowerCase().includes(k)
  );

  const updatedMemory: SessionMemory = {
    ...memory,
    symptoms: allSymptoms,
    urgency: urgent ? "high" : memory.urgency ?? "low",
  };

  if (urgent) {
    return {
      message: isRu
        ? "Некоторые из ваших симптомов требуют срочного внимания. Пожалуйста, немедленно обратитесь за медицинской помощью или вызовите скорую."
        : "Some of your symptoms require urgent attention. Please seek immediate medical care or call emergency services.",
      urgency: "high" as const,
      recommendedSpecialist: isRu ? "Скорая помощь / Кардиолог" : "Emergency / Cardiologist",
      followUpQuestions: [],
      sessionMemory: updatedMemory,
      requestLocation: false,
      disclaimer: isRu ? "Это не диагноз. При экстренной ситуации звоните 112." : "Not a diagnosis. Call emergency services if needed.",
    };
  }

  // Stage-based conversation flow
  const stages = buildStages(isRu, allSymptoms, memory);
  const stageData = stages[Math.min(stage - 1, stages.length - 1)] ?? stages[stages.length - 1];

  return {
    message: stageData.message,
    urgency: stageData.urgency,
    recommendedSpecialist: stageData.specialist ?? memory.specialist,
    followUpQuestions: stageData.question ? [stageData.question] : [],
    sessionMemory: updatedMemory,
    requestLocation: stage >= 3,
    disclaimer: isRu ? "Это не диагноз. Всегда консультируйтесь с врачом." : "Not a diagnosis. Always consult a physician.",
  };
}

const URGENT_KEYWORDS = [
  "боль в груди", "chest pain", "не могу дышать", "can't breathe",
  "инсульт", "stroke", "потерял сознание", "unconscious",
  "сильное кровотечение", "severe bleeding", "давление", "pressure in chest",
];

function extractSymptomKeywords(text: string, isRu: boolean): string[] {
  const lower = text.toLowerCase();
  const map = isRu
    ? [
        ["голов", "головная боль"],
        ["мигрен", "мигрень"],
        ["боль в груди", "боль в груди"],
        ["грудь", "боль в груди"],
        ["живот", "боль в животе"],
        ["желудок", "боль в животе"],
        ["спин", "боль в спине"],
        ["усталост", "усталость"],
        ["слабост", "слабость"],
        ["температур", "повышенная температура"],
        ["кашл", "кашель"],
        ["тошнот", "тошнота"],
        ["головокружен", "головокружение"],
        ["давлен", "давление"],
      ]
    : [
        ["head", "headache"],
        ["migrain", "migraine"],
        ["chest", "chest pain"],
        ["stomach", "stomach pain"],
        ["abdomen", "abdominal pain"],
        ["back pain", "back pain"],
        ["fatigue", "fatigue"],
        ["tired", "fatigue"],
        ["fever", "fever"],
        ["cough", "cough"],
        ["nausea", "nausea"],
        ["dizz", "dizziness"],
        ["pressure", "high pressure"],
      ];

  return map
    .filter(([keyword]) => lower.includes(keyword))
    .map(([, symptom]) => symptom);
}

function buildStages(isRu: boolean, symptoms: string[], memory: SessionMemory) {
  const symList = symptoms.length > 0
    ? symptoms.join(isRu ? ", " : ", ")
    : isRu ? "ваши симптомы" : "your symptoms";

  return [
    // Stage 1 – duration
    {
      message: isRu
        ? `Я зафиксировал: ${symList}. Как долго это у вас продолжается?`
        : `I've noted: ${symList}. How long have you been experiencing this?`,
      urgency: "low" as const,
      specialist: memory.specialist,
      question: {
        id: "duration",
        question: isRu ? "Как долго продолжаются симптомы?" : "How long have the symptoms lasted?",
        type: "single-choice" as const,
        options: isRu
          ? ["Менее суток", "2–3 дня", "1–2 недели", "Больше месяца"]
          : ["Less than a day", "2–3 days", "1–2 weeks", "Over a month"],
      },
    },
    // Stage 2 – severity
    {
      message: isRu
        ? `Понял. Насколько сильно это влияет на ваш привычный распорядок?`
        : `Got it. How much is this affecting your daily routine?`,
      urgency: "low" as const,
      specialist: memory.specialist,
      question: {
        id: "severity",
        question: isRu ? "Оцените интенсивность:" : "How severe is it?",
        type: "single-choice" as const,
        options: isRu
          ? ["Слабо — почти не мешает", "Умеренно — заметно мешает", "Сильно — не могу нормально функционировать"]
          : ["Mild — barely noticeable", "Moderate — affects my day", "Severe — hard to function"],
      },
    },
    // Stage 3 – location request + specialist hint
    {
      message: isRu
        ? `Спасибо. Исходя из описанного, вам может подойти консультация ${memory.specialist ?? "терапевта"}. Чтобы помочь найти подходящую клинику — в каком городе вы находитесь?`
        : `Thank you. Based on what you've described, seeing a ${memory.specialist ?? "general practitioner"} would be a good first step. To help find a nearby clinic — what city are you in?`,
      urgency: "medium" as const,
      specialist: memory.specialist ?? (isRu ? "Терапевт" : "General Practitioner"),
      question: {
        id: "location",
        question: isRu ? "Укажите ваш город:" : "What city are you in?",
        type: "free-text" as const,
      },
    },
    // Stage 4+ – guidance summary
    {
      message: isRu
        ? `На основе нашего разговора рекомендую обратиться к ${memory.specialist ?? "терапевту"} — это хороший первый шаг. Есть ли ещё что-то, что вас беспокоит?`
        : `Based on our conversation, I'd recommend seeing a ${memory.specialist ?? "general practitioner"} as a first step. Is there anything else bothering you?`,
      urgency: "low" as const,
      specialist: memory.specialist ?? (isRu ? "Терапевт" : "General Practitioner"),
      question: {
        id: "more",
        question: isRu ? "Хотите добавить что-то ещё?" : "Anything else to add?",
        type: "free-text" as const,
      },
    },
  ];
}
