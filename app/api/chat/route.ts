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
    return NextResponse.json(await buildMockResponseWithClinics(memory, locale, sanitizedMessages));
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

    // Attach recommendations if location is known
    if (parsed.sessionMemory.location.city || parsed.sessionMemory.location.country) {
      const query = {
        specialty: parsed.sessionMemory.specialist ?? undefined,
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
    return NextResponse.json(await buildMockResponseWithClinics(memory, locale, sanitizedMessages));
  }
}

// ─── Shared response type ─────────────────────────────────────────────────────
interface MockResponse {
  message: string;
  urgency: "low" | "medium" | "high";
  recommendedSpecialist: string | null;
  followUpQuestions: { id: string; question: string; type: "single-choice" | "multi-choice" | "free-text"; options?: string[] }[];
  sessionMemory: SessionMemory;
  requestLocation: boolean;
  disclaimer: string;
  recommendations?: { hospitals: unknown[]; doctors: unknown[] };
}

// ─── Smart mock ───────────────────────────────────────────────────────────────
// Used when API key is absent OR request times out.
// Varies by conversation stage so it never repeats the same message.

async function buildMockResponseWithClinics(
  memory: SessionMemory,
  locale: string,
  messages: ApiMessage[]
): Promise<MockResponse> {
  const base = buildMockResponse(memory, locale, messages);
  // Search clinics for mock if city is known
  if (base.sessionMemory.location.city) {
    try {
      const query = {
        specialty: base.sessionMemory.specialist ?? undefined,
        city: base.sessionMemory.location.city,
        country: base.sessionMemory.location.country ?? undefined,
      };
      const [hospitals, doctors] = await Promise.all([
        hospitalProvider.searchHospitals(query).catch(() => []),
        doctorProvider.searchDoctors(query).catch(() => []),
      ]);
      if (hospitals.length > 0 || doctors.length > 0) {
        return { ...base, recommendations: { hospitals, doctors } };
      }
    } catch { /* ignore */ }
  }
  return base;
}

function buildMockResponse(
  memory: SessionMemory,
  locale: string,
  messages: ApiMessage[]
): MockResponse {
  const isRu = locale === "ru";
  const userMessages = messages.filter((m) => m.role === "user");
  const stage = userMessages.length; // how many user turns so far

  // Extract symptom keywords from latest user message
  const lastUserText = userMessages[userMessages.length - 1]?.content ?? "";
  const lowerLast = lastUserText.toLowerCase();

  // Greeting detection — respond naturally without diagnostic flow
  const greetingWords = ["привет", "здравствуй", "добрый", "hi", "hello", "hey", "good morning", "good evening", "good afternoon", "доброе утро", "добрый день", "добрый вечер"];
  const isGreeting = stage <= 1 && greetingWords.some((g) => lowerLast.includes(g)) && lastUserText.length < 60;
  if (isGreeting) {
    return {
      message: isRu
        ? "Здравствуйте! Я ваш AI-помощник по медицинской навигации.\n\nОпишите, что вас беспокоит — симптомы, ощущения, как давно началось — и я помогу разобраться, к какому специалисту обратиться."
        : "Hello! I'm your AI medical navigation assistant.\n\nTell me what's bothering you — your symptoms, sensations, how long they've been going on — and I'll help you figure out the right next step.",
      urgency: "low",
      recommendedSpecialist: null,
      followUpQuestions: [],
      sessionMemory: memory,
      requestLocation: false,
      disclaimer: isRu ? "Это не диагноз. Всегда консультируйтесь с врачом." : "Not a diagnosis. Always consult a physician.",
    };
  }

  // Extract city from user message
  const cityKeywords: { [key: string]: { city: string; country: string } } = {
    "москв": { city: "Москва", country: "Россия" },
    "moscow": { city: "Москва", country: "Россия" },
    "берлин": { city: "Berlin", country: "Germany" },
    "berlin": { city: "Berlin", country: "Germany" },
    "new york": { city: "New York", country: "USA" },
    "нью-йорк": { city: "New York", country: "USA" },
    "ташкент": { city: "Ташкент", country: "Узбекистан" },
    "tashkent": { city: "Ташкент", country: "Узбекистан" },
  };
  let detectedCity: { city: string; country: string } | null = null;
  for (const [kw, loc] of Object.entries(cityKeywords)) {
    if (lowerLast.includes(kw)) { detectedCity = loc; break; }
  }

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
    location: detectedCity
      ? { city: detectedCity.city, country: detectedCity.country }
      : memory.location,
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

  // Stage 4+: respond intelligently to user's actual message
  if (stage >= 4) {
    const freeResponse = buildFreeResponse(isRu, lastUserText, allSymptoms, memory);
    if (freeResponse) {
      return {
        ...freeResponse,
        sessionMemory: updatedMemory,
        requestLocation: !memory.location.city,
        disclaimer: isRu ? "Это не диагноз. Всегда консультируйтесь с врачом." : "Not a diagnosis. Always consult a physician.",
      };
    }
  }

  // Stage-based conversation flow (stages 1-3)
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

// ─── Free response for stage 4+ questions ─────────────────────────────────────
type FreeResponse = Omit<MockResponse, "sessionMemory" | "requestLocation" | "disclaimer">;

function buildFreeResponse(
  isRu: boolean,
  userText: string,
  symptoms: string[],
  memory: SessionMemory
): FreeResponse | null {
  const lower = userText.toLowerCase();
  const symStr = symptoms.join(isRu ? ", " : ", ");
  const specialist = memory.specialist ?? (isRu ? "терапевта" : "a general practitioner");

  // Asking about possible causes
  if (
    lower.includes("причин") || lower.includes("почему") ||
    lower.includes("что это") || lower.includes("causes") ||
    lower.includes("why") || lower.includes("what could") ||
    lower.includes("можете помочь") || lower.includes("can you help")
  ) {
    const causes = buildCausesMessage(isRu, symptoms);
    return {
      message: causes,
      urgency: memory.urgency as "low" | "medium" | "high" ?? "medium",
      recommendedSpecialist: memory.specialist ?? (isRu ? "Терапевт" : "General Practitioner"),
      followUpQuestions: [{
        id: "next-step",
        question: isRu ? "Что хотите сделать дальше?" : "What would you like to do next?",
        type: "single-choice" as const,
        options: isRu
          ? ["Найти клинику рядом", "Что взять с собой к врачу", "Задать ещё вопрос"]
          : ["Find a nearby clinic", "What to bring to the doctor", "Ask another question"],
      }],
    };
  }

  // Asking for clinic/hospital help
  if (
    lower.includes("клиник") || lower.includes("больниц") || lower.includes("врач") ||
    lower.includes("clinic") || lower.includes("hospital") || lower.includes("doctor")
  ) {
    return {
      message: isRu
        ? `Чтобы подобрать клинику в вашем городе (${memory.location.city ?? "укажите город"}), порекомендую обратиться к ${specialist}. Если нужно — уточните город и я помогу с поиском.`
        : `To find a clinic near you (${memory.location.city ?? "please specify your city"}), I recommend seeing ${specialist}. Tell me your city and I'll help search.`,
      urgency: "medium" as const,
      recommendedSpecialist: memory.specialist ?? (isRu ? "Терапевт" : "General Practitioner"),
      followUpQuestions: [],
    };
  }

  // What to prepare for the doctor
  if (
    lower.includes("взять") || lower.includes("подготов") || lower.includes("prepare") ||
    lower.includes("bring") || lower.includes("before")
  ) {
    return {
      message: isRu
        ? `Перед визитом к ${specialist} рекомендую:\n\n• Записать все симптомы: ${symStr}\n• Отметить когда началось и как менялось\n• Взять результаты предыдущих анализов, если есть\n• Список принимаемых лекарств\n• Паспорт и полис (при наличии)`
        : `Before seeing ${specialist}, prepare:\n\n• List your symptoms: ${symStr}\n• Note when it started and how it changed\n• Bring previous test results if any\n• List of current medications\n• ID and insurance card`,
      urgency: "low" as const,
      recommendedSpecialist: memory.specialist ?? (isRu ? "Терапевт" : "General Practitioner"),
      followUpQuestions: [],
    };
  }

  // Frustration / "you can answer?" / repeat question
  if (
    lower.includes("ответить") || lower.includes("слышите") || lower.includes("там") ||
    lower.includes("are you") || lower.includes("answer me") || lower.includes("hello")
  ) {
    return {
      message: isRu
        ? `Да, я здесь! Прошу прощения, если мои ответы казались однотипными.\n\nНа основе того, что вы описали (${symStr}), я могу помочь:\n• Объяснить возможные причины симптомов\n• Найти клинику в вашем городе\n• Подсказать, что взять на приём\n• Ответить на конкретный вопрос\n\nЧто вас интересует?`
        : `Yes, I'm here! Sorry if my responses felt repetitive.\n\nBased on what you described (${symStr}), I can help you:\n• Explain possible causes\n• Find a clinic near you\n• Suggest what to bring to the appointment\n• Answer a specific question\n\nWhat would you like?`,
      urgency: memory.urgency as "low" | "medium" | "high" ?? "low",
      recommendedSpecialist: memory.specialist,
      followUpQuestions: [{
        id: "help-type",
        question: isRu ? "Чем могу помочь?" : "How can I help?",
        type: "single-choice" as const,
        options: isRu
          ? ["Возможные причины", "Найти клинику", "Что взять к врачу", "Другой вопрос"]
          : ["Possible causes", "Find a clinic", "Prepare for visit", "Other question"],
      }],
    };
  }

  return null;
}

function buildCausesMessage(isRu: boolean, symptoms: string[]): string {
  const causeMap: Record<string, { ru: string[]; en: string[] }> = {
    "боль в животе": {
      ru: ["гастроэнтерит (кишечная инфекция)", "синдром раздражённого кишечника", "гастрит или язва", "аппендицит (если боль справа снизу — нужна срочная помощь)"],
      en: ["gastroenteritis", "irritable bowel syndrome", "gastritis or ulcer", "appendicitis (if lower right pain — seek urgent care)"],
    },
    "abdominal pain": {
      ru: ["боли в животе"],
      en: ["gastroenteritis", "irritable bowel syndrome", "gastritis"],
    },
    "повышенная температура": {
      ru: ["вирусная инфекция (ОРВИ, грипп)", "бактериальная инфекция", "воспалительный процесс в организме"],
      en: ["viral infection (flu, cold)", "bacterial infection", "inflammatory condition"],
    },
    "fever": {
      ru: [],
      en: ["viral infection", "bacterial infection", "inflammatory condition"],
    },
    "головная боль": {
      ru: ["мигрень", "напряжение (стресс, усталость)", "повышенное/пониженное давление", "обезвоживание"],
      en: ["migraine", "tension headache", "blood pressure changes", "dehydration"],
    },
    "headache": {
      ru: [],
      en: ["migraine", "tension headache", "blood pressure changes"],
    },
    "отёки": {
      ru: ["нарушение работы почек", "проблемы с сердечно-сосудистой системой", "аллергическая реакция", "длительное пребывание в одной позе"],
      en: ["kidney issues", "cardiovascular problems", "allergic reaction", "prolonged immobility"],
    },
    "слабость": {
      ru: ["анемия (нехватка железа)", "вирусная инфекция", "дефицит витаминов", "нарушение сна"],
      en: ["anemia", "viral infection", "vitamin deficiency", "sleep disorder"],
    },
  };

  const allCauses = new Set<string>();
  for (const sym of symptoms) {
    const key = Object.keys(causeMap).find((k) =>
      sym.toLowerCase().includes(k) || k.includes(sym.toLowerCase().split(" ")[0])
    );
    if (key) {
      const causes = isRu ? causeMap[key].ru : causeMap[key].en;
      causes.forEach((c) => allCauses.add(c));
    }
  }

  const causeList = Array.from(allCauses).slice(0, 6);
  const symStr = symptoms.join(isRu ? ", " : ", ");

  if (causeList.length === 0) {
    return isRu
      ? `На основе симптомов (${symStr}) сложно назвать конкретные причины без осмотра врача. Рекомендую обратиться к терапевту, который проведёт необходимые обследования и поставит точный диагноз.\n\n⚠️ Помните: только врач может поставить диагноз.`
      : `Based on symptoms (${symStr}), specific causes are hard to determine without examination. I recommend seeing a general practitioner who will conduct the necessary tests.\n\n⚠️ Only a doctor can provide a diagnosis.`;
  }

  const list = causeList.map((c) => `• ${c}`).join("\n");
  return isRu
    ? `На основе симптомов (${symStr}) возможные причины могут включать:\n\n${list}\n\n⚠️ Это информационный перечень, а не диагноз. Для точного ответа необходим осмотр и обследование у врача.`
    : `Based on symptoms (${symStr}), possible causes may include:\n\n${list}\n\n⚠️ This is informational only, not a diagnosis. A doctor's examination is needed for an accurate answer.`;
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
