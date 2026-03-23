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
        temperature: 1,
        top_p: 0.95,
        max_tokens: 2048,
        stream: false,
        extra_body: {
          chat_template_kwargs: {
            thinking: thinkingEnabled,
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

// ─── Specialist detection ─────────────────────────────────────────────────────
function detectSpecialistFromSymptoms(symptoms: string[], isRu: boolean): string {
  const lower = symptoms.join(" ").toLowerCase();

  if (lower.includes("живот") || lower.includes("желудок") || lower.includes("тошнот") ||
      lower.includes("рвот") || lower.includes("туалет") || lower.includes("стул") ||
      lower.includes("stomach") || lower.includes("abdominal") || lower.includes("nausea") || lower.includes("bowel")) {
    return isRu ? "Гастроэнтеролог" : "Gastroenterologist";
  }
  if (lower.includes("сердц") || lower.includes("боль в груди") || lower.includes("chest pain") || lower.includes("аритм")) {
    return isRu ? "Кардиолог" : "Cardiologist";
  }
  if (lower.includes("голов") || lower.includes("мигрен") || lower.includes("головокружен") ||
      lower.includes("headache") || lower.includes("migrain") || lower.includes("dizz")) {
    return isRu ? "Невролог" : "Neurologist";
  }
  if (lower.includes("кашл") || lower.includes("дыхан") || lower.includes("бронх") ||
      lower.includes("cough") || lower.includes("breath") || lower.includes("lung")) {
    return isRu ? "Пульмонолог" : "Pulmonologist";
  }
  if (lower.includes("сустав") || lower.includes("спин") || lower.includes("колен") ||
      lower.includes("joint") || lower.includes("back") || lower.includes("knee")) {
    return isRu ? "Ортопед / Ревматолог" : "Orthopedist / Rheumatologist";
  }
  return isRu ? "Терапевт" : "General Practitioner";
}

// ─── Specialist persona messages ──────────────────────────────────────────────
function specialistIntro(specialist: string, symptoms: string[], isRu: boolean): { message: string; question: string; questionId: string; options: string[] } {
  const symStr = symptoms.slice(0, 4).join(isRu ? ", " : ", ");

  if (specialist.toLowerCase().includes("гастро") || specialist.toLowerCase().includes("gastro")) {
    return {
      message: isRu
        ? `Здравствуйте, я ваш AI-гастроэнтеролог.\n\nИзучил описание: ${symStr}. Ваши симптомы могут указывать на кишечную инфекцию, воспалительный процесс или нарушение моторики кишечника.\n\nМне нужна уточняющая информация:`
        : `Hello, I'm your AI gastroenterologist.\n\nI've reviewed your symptoms: ${symStr}. These may indicate intestinal infection, inflammatory process, or motility disorder.\n\nI need some clarification:`,
      question: isRu ? "Как бы вы описали характер боли в животе?" : "How would you describe the abdominal pain?",
      questionId: "gastro-q1",
      options: isRu
        ? ["Постоянная тупая боль", "Приступообразная острая боль", "Спазмы / колики", "Вздутие и дискомфорт"]
        : ["Constant dull ache", "Sharp, cramping pain", "Spasms / colic", "Bloating and discomfort"],
    };
  }
  if (specialist.toLowerCase().includes("невролог") || specialist.toLowerCase().includes("neurolog")) {
    return {
      message: isRu
        ? `Здравствуйте, я ваш AI-невролог.\n\nПо описанным симптомам (${symStr}) у меня есть несколько уточняющих вопросов:`
        : `Hello, I'm your AI neurologist.\n\nBased on your symptoms (${symStr}), I have some clarifying questions:`,
      question: isRu ? "Как бы вы описали характер головной боли?" : "How would you describe the headache?",
      questionId: "neuro-q1",
      options: isRu
        ? ["Давящая / опоясывающая", "Пульсирующая (обычно с одной стороны)", "Острая / прострел", "Тупая и постоянная"]
        : ["Pressing / tight", "Pulsating (usually one side)", "Sharp / shooting", "Dull and constant"],
    };
  }
  if (specialist.toLowerCase().includes("кардиолог") || specialist.toLowerCase().includes("cardiolog")) {
    return {
      message: isRu
        ? `Здравствуйте, я ваш AI-кардиолог.\n\nВаши симптомы (${symStr}) требуют внимательной оценки. Сначала несколько важных вопросов:`
        : `Hello, I'm your AI cardiologist.\n\nYour symptoms (${symStr}) require careful evaluation. A few important questions first:`,
      question: isRu ? "Есть ли отдышка или ощущение сердцебиения?" : "Do you have shortness of breath or palpitations?",
      questionId: "cardio-q1",
      options: isRu
        ? ["Да, при нагрузке", "Да, даже в покое", "Периодически", "Нет"]
        : ["Yes, with exertion", "Yes, even at rest", "Occasionally", "No"],
    };
  }
  // Default
  return {
    message: isRu
      ? `Здравствуйте, я ваш AI-${specialist.toLowerCase()}.\n\nПо описанным симптомам (${symStr}) давайте разберёмся подробнее:`
      : `Hello, I'm your AI ${specialist.toLowerCase()}.\n\nBased on your symptoms (${symStr}), let's explore further:`,
    question: isRu ? "Симптомы появились впервые или бывали раньше?" : "Are these symptoms new or have you had them before?",
    questionId: "spec-q1",
    options: isRu
      ? ["Впервые", "Иногда бывает", "Хронические, есть давно"]
      : ["First time", "Occasionally", "Chronic, long-standing"],
  };
}

// ─── City extraction (known + unknown) ────────────────────────────────────────
function extractCity(text: string, prevCityQuestion: boolean): { city: string; country: string; known: boolean } | null {
  const lower = text.toLowerCase().trim();
  const knownCities: { [kw: string]: { city: string; country: string } } = {
    "москв": { city: "Москва", country: "Россия" },
    "moscow": { city: "Москва", country: "Россия" },
    "берлин": { city: "Berlin", country: "Germany" },
    "berlin": { city: "Berlin", country: "Germany" },
    "new york": { city: "New York", country: "USA" },
    "нью-йорк": { city: "New York", country: "USA" },
    "ташкент": { city: "Ташкент", country: "Узбекистан" },
    "tashkent": { city: "Ташкент", country: "Узбекистан" },
    "санкт": { city: "Санкт-Петербург", country: "Россия" },
    "петербург": { city: "Санкт-Петербург", country: "Россия" },
    "st. pet": { city: "Санкт-Петербург", country: "Россия" },
    "новосиб": { city: "Новосибирск", country: "Россия" },
    "екатеринб": { city: "Екатеринбург", country: "Россия" },
    "краснодар": { city: "Краснодар", country: "Россия" },
    "лондон": { city: "London", country: "UK" },
    "london": { city: "London", country: "UK" },
    "париж": { city: "Paris", country: "France" },
    "paris": { city: "Paris", country: "France" },
    "dubai": { city: "Dubai", country: "UAE" },
    "дубай": { city: "Dubai", country: "UAE" },
  };

  for (const [kw, loc] of Object.entries(knownCities)) {
    if (lower.includes(kw)) return { ...loc, known: true };
  }

  // If previous question was about city AND message is short → treat as city name
  if (prevCityQuestion && text.trim().length > 2 && text.trim().length < 50 &&
      !text.toLowerCase().includes("нет") && !text.toLowerCase().includes("no ")) {
    const cleaned = text.trim().replace(/^(я из |я в |живу в |я нахожусь в |i live in |i'm in |in )/i, "").trim();
    const firstWord = cleaned.split(/[\s,\.]/)[0];
    if (firstWord.length > 2) {
      return { city: cleaned.charAt(0).toUpperCase() + cleaned.slice(1), country: "", known: false };
    }
  }

  return null;
}

function buildMockResponse(
  memory: SessionMemory,
  locale: string,
  messages: ApiMessage[]
): MockResponse {
  const isRu = locale === "ru";
  const userMessages = messages.filter((m) => m.role === "user");
  const stage = userMessages.length;
  const lastUserText = userMessages[userMessages.length - 1]?.content ?? "";
  const lowerLast = lastUserText.toLowerCase();
  const DISC = isRu ? "Это не диагноз. Всегда консультируйтесь с врачом." : "Not a diagnosis. Always consult a physician.";

  // ── Greeting ────────────────────────────────────────────────────────────────
  const greetings = ["привет", "здравствуй", "добрый", "hi", "hello", "hey", "доброе", "добрый день", "добрый вечер"];
  const isGreeting = stage <= 1 && greetings.some((g) => lowerLast.includes(g)) && lastUserText.length < 70;
  if (isGreeting) {
    return {
      message: isRu
        ? "Здравствуйте! Я ваш AI-терапевт MedNavigator.\n\nОпишите, что вас беспокоит — симптомы, ощущения, как давно началось — и я помогу разобраться, к какому специалисту нужно обратиться."
        : "Hello! I'm your AI general practitioner from MedNavigator.\n\nTell me what's bothering you — your symptoms, how long they've lasted — and I'll help find the right specialist.",
      urgency: "low", recommendedSpecialist: null, followUpQuestions: [],
      sessionMemory: memory, requestLocation: false, disclaimer: DISC,
    };
  }

  // ── Symptoms extraction + city detection ─────────────────────────────────────
  const extractedSymptoms = extractSymptomKeywords(lastUserText, isRu);
  const allSymptoms = Array.from(new Set([...memory.symptoms, ...extractedSymptoms]));

  const urgent = URGENT_KEYWORDS.some((k) => lowerLast.includes(k));

  // Was the previous AI message asking for city?
  const allMessages = messages;
  const prevAiMessages = allMessages.filter((m) => m.role === "assistant");
  const lastAiText = prevAiMessages[prevAiMessages.length - 1]?.content ?? "";
  // Use specific city-question phrases only — avoid matching "городскую поликлинику" etc.
  const prevWasCityQuestion = (
    lastAiText.toLowerCase().includes("в каком городе") ||
    lastAiText.toLowerCase().includes("укажите ваш город") ||
    lastAiText.toLowerCase().includes("где вы находитесь") ||
    lastAiText.toLowerCase().includes("what city are you in") ||
    lastAiText.toLowerCase().includes("your city")
  );

  const cityResult = extractCity(lastUserText, prevWasCityQuestion);
  const effectiveCity = cityResult
    ? { city: cityResult.city, country: cityResult.country }
    : memory.location;
  const cityJustSet = !!cityResult && !memory.location.city;
  const cityChanged = !!cityResult && memory.location.city && memory.location.city !== cityResult.city;

  const updatedMemory: SessionMemory = {
    ...memory,
    symptoms: allSymptoms,
    urgency: urgent ? "high" : memory.urgency ?? "low",
    location: effectiveCity,
    specialist: memory.specialist ?? (allSymptoms.length > 0 ? detectSpecialistFromSymptoms(allSymptoms, isRu) : null),
  };

  // ── Emergency ───────────────────────────────────────────────────────────────
  if (urgent) {
    return {
      message: isRu
        ? "⚠️ Ваши симптомы могут указывать на экстренную ситуацию. Немедленно позвоните 103 (скорая) или 112."
        : "⚠️ Your symptoms may indicate an emergency. Call 911 immediately.",
      urgency: "high", recommendedSpecialist: isRu ? "Скорая помощь" : "Emergency Services",
      followUpQuestions: [], sessionMemory: updatedMemory, requestLocation: false,
      disclaimer: isRu ? "При экстренной ситуации звоните 112." : "Call emergency services immediately.",
    };
  }

  const specialist = updatedMemory.specialist ?? (isRu ? "Терапевт" : "General Practitioner");
  const symStr = allSymptoms.length > 0
    ? allSymptoms.slice(0, 5).join(isRu ? ", " : ", ")
    : isRu ? "ваши симптомы" : "your symptoms";

  // ── City confirmed / changed ─────────────────────────────────────────────────
  if (cityJustSet || cityChanged) {
    const cityName = effectiveCity.city;
    const isKnown = cityResult?.known ?? false;

    if (!isKnown) {
      return {
        message: isRu
          ? `Понял, вы в ${cityName}. К сожалению, наша база клиник пока не покрывает этот город напрямую.\n\nРекомендую:\n• Обратиться в городскую поликлинику по месту жительства\n• Найти клинику через сайт ОМС или НМП вашего региона\n• Позвонить на горячую линию здравоохранения региона\n\nВам нужна консультация специалиста: ${specialist}.`
          : `Got it, you're in ${cityName}. Unfortunately our clinic database doesn't cover this city directly.\n\nI recommend:\n• Visit your local clinic or hospital\n• Search through your regional health system\n• Call the regional health hotline\n\nYou need: ${specialist}.`,
        urgency: (updatedMemory.urgency as "low" | "medium" | "high") ?? "medium",
        recommendedSpecialist: specialist,
        followUpQuestions: [{
          id: "city-help",
          question: isRu ? "Как ещё могу помочь?" : "How else can I help?",
          type: "single-choice" as const,
          options: isRu
            ? ["Что взять к врачу", "Возможные причины симптомов", "Задать другой вопрос"]
            : ["What to bring to the doctor", "Possible causes", "Ask another question"],
        }],
        sessionMemory: updatedMemory, requestLocation: false, disclaimer: DISC,
      };
    }

    return {
      message: isRu
        ? `Отлично, нашёл клиники и врачей в ${cityName}! Показываю результаты ниже.\n\nРекомендую обратиться к ${specialist}. При записи упомяните основные симптомы: ${symStr}.`
        : `Great, found clinics and doctors in ${cityName}! See results below.\n\nI recommend seeing a ${specialist}. When booking, mention your main symptoms: ${symStr}.`,
      urgency: (updatedMemory.urgency as "low" | "medium" | "high") ?? "medium",
      recommendedSpecialist: specialist,
      followUpQuestions: [],
      sessionMemory: updatedMemory, requestLocation: false, disclaimer: DISC,
    };
  }

  // ── Specialist Q&A (after specialist stage) ──────────────────────────────────
  if (stage >= 5 && memory.specialist) {
    // If city is known → already showed clinics. Answer follow-up questions.
    if (memory.location.city) {
      return buildSpecialistQA(isRu, lastUserText, allSymptoms, updatedMemory, specialist, DISC);
    }
    // Ask for city
    return {
      message: isRu
        ? `Спасибо за ответ. Это помогает уточнить картину.\n\nЧтобы порекомендовать конкретных врачей и клиники — в каком городе вы находитесь?`
        : `Thank you, that helps clarify the picture.\n\nTo recommend specific doctors and clinics — what city are you in?`,
      urgency: (updatedMemory.urgency as "low" | "medium" | "high") ?? "medium",
      recommendedSpecialist: specialist,
      followUpQuestions: [{
        id: "city-input",
        question: isRu ? "Укажите ваш город:" : "What city are you in?",
        type: "free-text" as const,
      }],
      sessionMemory: updatedMemory, requestLocation: true, disclaimer: DISC,
    };
  }

  // ── Stage 4: Specialist intro ─────────────────────────────────────────────────
  if (stage >= 4) {
    if (!memory.specialist) {
      // GP hands off to specialist
      const detectedSpec = detectSpecialistFromSymptoms(allSymptoms, isRu);
      updatedMemory.specialist = detectedSpec;
      const intro = specialistIntro(detectedSpec, allSymptoms, isRu);
      return {
        message: isRu
          ? `Как терапевт, на основе ваших симптомов (${symStr}), направляю вас к специалисту.\n\n---\n\n${intro.message}`
          : `As your general practitioner, based on your symptoms (${symStr}), I'm connecting you with a specialist.\n\n---\n\n${intro.message}`,
        urgency: "medium",
        recommendedSpecialist: detectedSpec,
        followUpQuestions: [{
          id: intro.questionId,
          question: intro.question,
          type: "single-choice" as const,
          options: intro.options,
        }],
        sessionMemory: updatedMemory, requestLocation: false, disclaimer: DISC,
      };
    }
    // Specialist is known, ask specialist question
    const intro = specialistIntro(memory.specialist, allSymptoms, isRu);
    return {
      message: intro.message,
      urgency: "medium",
      recommendedSpecialist: memory.specialist,
      followUpQuestions: [{
        id: intro.questionId,
        question: intro.question,
        type: "single-choice" as const,
        options: intro.options,
      }],
      sessionMemory: updatedMemory, requestLocation: false, disclaimer: DISC,
    };
  }

  // ── Stage 3: severity → GP summary + identify specialist ────────────────────
  if (stage === 3) {
    const detectedSpec = detectSpecialistFromSymptoms(allSymptoms, isRu);
    updatedMemory.specialist = detectedSpec;
    return {
      message: isRu
        ? `Понял. Исходя из описанных симптомов (${symStr}), рекомендую консультацию специалиста — ${detectedSpec}.\n\nПозвольте уточнить подробности у специалиста. Продолжаем...`
        : `Got it. Based on your symptoms (${symStr}), I recommend seeing a ${detectedSpec}.\n\nLet me connect you with a specialist for more details.`,
      urgency: "medium",
      recommendedSpecialist: detectedSpec,
      followUpQuestions: [{
        id: "confirm-handoff",
        question: isRu ? "Хотите уточнить что-то ещё перед переходом к специалисту?" : "Anything to add before I connect you to the specialist?",
        type: "single-choice" as const,
        options: isRu
          ? ["Продолжить", "Есть ещё симптомы", "Хочу объяснить подробнее"]
          : ["Continue", "I have more symptoms", "Let me explain more"],
      }],
      sessionMemory: updatedMemory, requestLocation: false, disclaimer: DISC,
    };
  }

  // ── Stage 2: duration → ask severity ──────────────────────────────────────────
  if (stage === 2) {
    return {
      message: isRu
        ? `Понял. Симптомы: ${symStr}. Насколько сильно это влияет на вашу повседневную жизнь?`
        : `I see. Symptoms: ${symStr}. How much is this affecting your daily life?`,
      urgency: "low",
      recommendedSpecialist: null,
      followUpQuestions: [{
        id: "severity",
        question: isRu ? "Оцените интенсивность:" : "How severe is it?",
        type: "single-choice" as const,
        options: isRu
          ? ["Слабо — почти не мешает", "Умеренно — заметно мешает", "Сильно — не могу нормально функционировать"]
          : ["Mild — barely noticeable", "Moderate — noticeably affects me", "Severe — hard to function normally"],
      }],
      sessionMemory: updatedMemory, requestLocation: false, disclaimer: DISC,
    };
  }

  // ── Stage 1: first symptoms message ───────────────────────────────────────────
  return {
    message: isRu
      ? `Я отметил ваши симптомы: ${symStr}.\n\nКак долго они продолжаются?`
      : `I've noted your symptoms: ${symStr}.\n\nHow long have you been experiencing this?`,
    urgency: "low",
    recommendedSpecialist: null,
    followUpQuestions: [{
      id: "duration",
      question: isRu ? "Как долго продолжаются симптомы?" : "How long have the symptoms lasted?",
      type: "single-choice" as const,
      options: isRu
        ? ["Менее суток", "2–3 дня", "1–2 недели", "Больше месяца"]
        : ["Less than a day", "2–3 days", "1–2 weeks", "Over a month"],
    }],
    sessionMemory: updatedMemory, requestLocation: false, disclaimer: DISC,
  };
}

// ─── Specialist open Q&A ──────────────────────────────────────────────────────
function buildSpecialistQA(
  isRu: boolean,
  userText: string,
  symptoms: string[],
  memory: SessionMemory,
  specialist: string,
  disclaimer: string
): MockResponse {
  const lower = userText.toLowerCase();
  const symStr = symptoms.slice(0, 4).join(isRu ? ", " : ", ");

  if (lower.includes("причин") || lower.includes("почему") || lower.includes("что это") ||
      lower.includes("диагноз") || lower.includes("diagnosis") || lower.includes("чем болею") ||
      lower.includes("causes") || lower.includes("why") || lower.includes("what could") ||
      lower.includes("относит") || lower.includes("может быть") || lower.includes("болезн")) {
    return {
      message: buildCausesMessage(isRu, symptoms),
      urgency: (memory.urgency as "low" | "medium" | "high") ?? "medium",
      recommendedSpecialist: specialist,
      followUpQuestions: [],
      sessionMemory: memory, requestLocation: false, disclaimer,
    };
  }

  if (lower.includes("взять") || lower.includes("подготов") || lower.includes("prepare") || lower.includes("bring") ||
      lower.includes("взял") || lower.includes("нести") || lower.includes("документ")) {
    return {
      message: isRu
        ? `Перед визитом к ${specialist}:\n\n• Записать все симптомы: ${symStr}\n• Даты начала каждого симптома\n• Принимаемые лекарства (если есть)\n• Результаты анализов (если есть)\n• Паспорт и медицинский полис`
        : `Before visiting the ${specialist}:\n\n• List all symptoms: ${symStr}\n• When each started\n• Current medications (if any)\n• Previous test results (if any)\n• ID and insurance card`,
      urgency: "low", recommendedSpecialist: specialist,
      followUpQuestions: [],
      sessionMemory: memory, requestLocation: false, disclaimer,
    };
  }

  if (lower.includes("как") && (lower.includes("лечить") || lower.includes("лечен") || lower.includes("treat") || lower.includes("cure"))) {
    return {
      message: isRu
        ? `Лечение при симптомах (${symStr}) зависит от точного диагноза, который поставит врач после осмотра.\n\nОбщие рекомендации до визита к ${specialist}:\n• Постельный режим при выраженной слабости\n• Следите за температурой — при повышении свыше 38.5°C принимайте жаропонижающее\n• Пейте больше жидкости\n• Не занимайтесь самолечением без консультации\n\n⚠️ Конкретное лечение назначает только врач.`
        : `Treatment for your symptoms (${symStr}) depends on the exact diagnosis from a doctor's examination.\n\nGeneral recommendations before seeing the ${specialist}:\n• Rest if feeling weak\n• Monitor temperature — take fever reducer if above 38.5°C\n• Stay hydrated\n• Avoid self-medication\n\n⚠️ Specific treatment must be prescribed by a doctor.`,
      urgency: "low", recommendedSpecialist: specialist,
      followUpQuestions: [],
      sessionMemory: memory, requestLocation: false, disclaimer,
    };
  }

  if (lower.includes("спасибо") || lower.includes("thank") || lower.includes("понятно") || lower.includes("ясно") || lower.includes("всё") || lower.includes("ладно")) {
    return {
      message: isRu
        ? `Пожалуйста! Желаю вам скорейшего выздоровления. Не откладывайте визит к ${specialist} — чем раньше обратитесь, тем лучше.\n\nЕсли появятся новые симптомы или ухудшение — сразу обратитесь к врачу.\n\nЗаботьтесь о себе! 🌱`
        : `You're welcome! I hope you feel better soon. Don't delay seeing the ${specialist} — early consultation is always best.\n\nIf symptoms worsen, seek medical attention promptly.\n\nTake care! 🌱`,
      urgency: "low", recommendedSpecialist: specialist,
      followUpQuestions: [],
      sessionMemory: memory, requestLocation: false, disclaimer,
    };
  }

  // Default: answer naturally based on what was asked
  return {
    message: isRu
      ? `Исходя из ваших симптомов (${symStr}), рекомендую не откладывать консультацию у ${specialist}.\n\nЯ могу помочь с:\n• Возможными причинами симптомов\n• Что взять на приём\n• Как подготовиться к визиту\n\nЧто именно вас интересует?`
      : `Based on your symptoms (${symStr}), I recommend seeing a ${specialist} soon.\n\nI can help with:\n• Possible causes of your symptoms\n• What to bring to the appointment\n• How to prepare for your visit\n\nWhat would you like to know?`,
    urgency: (memory.urgency as "low" | "medium" | "high") ?? "medium",
    recommendedSpecialist: specialist,
    followUpQuestions: [{
      id: "final-help",
      question: isRu ? "Что вас интересует?" : "What would you like to know?",
      type: "single-choice" as const,
      options: isRu
        ? ["Возможные диагнозы", "Что взять к врачу", "Как лечится", "Всё понятно, спасибо"]
        : ["Possible diagnoses", "What to bring to doctor", "How is it treated", "All clear, thanks"],
    }],
    sessionMemory: memory, requestLocation: false, disclaimer,
  };
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

