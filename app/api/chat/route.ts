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

// ─── Item 4: Specialist persona messages with OPQRST-style questions ──────────
function specialistIntro(specialist: string, symptoms: string[], isRu: boolean): { message: string; question: string; questionId: string; options: string[] } {
  const symStr = symptoms.slice(0, 4).join(isRu ? ", " : ", ");
  const symContext = symStr ? (isRu ? ` (${symStr})` : ` (${symStr})`) : "";

  if (specialist.toLowerCase().includes("гастро") || specialist.toLowerCase().includes("gastro")) {
    return {
      message: isRu
        ? `Здравствуйте, я ваш AI-гастроэнтеролог.\n\nИзучил симптомы${symContext}. Это может указывать на гастрит, синдром раздражённого кишечника, кишечную инфекцию или нарушение моторики.\n\nДля точной оценки мне важно понять характер боли:`
        : `Hello, I'm your AI gastroenterologist.\n\nI've reviewed your symptoms${symContext}. These may indicate gastritis, irritable bowel syndrome, intestinal infection, or motility disorder.\n\nTo assess accurately, I need to understand the pain character:`,
      question: isRu ? "Как бы вы описали боль в животе?" : "How would you describe the abdominal pain?",
      questionId: "gastro-q1",
      options: isRu
        ? ["Постоянная тупая боль / дискомфорт", "Острая приступообразная боль", "Спазмы и колики", "Вздутие без выраженной боли"]
        : ["Constant dull ache / discomfort", "Sharp cramping pain", "Spasms and colic", "Bloating without significant pain"],
    };
  }
  if (specialist.toLowerCase().includes("невролог") || specialist.toLowerCase().includes("neurolog")) {
    return {
      message: isRu
        ? `Здравствуйте, я ваш AI-невролог.\n\nПо симптомам${symContext} несколько возможных причин: мигрень, головная боль напряжения, шейный остеохондроз или сосудистые нарушения.\n\nОпишите характер боли подробнее:`
        : `Hello, I'm your AI neurologist.\n\nFor your symptoms${symContext}, possible causes include: migraine, tension headache, cervical osteochondrosis, or vascular issues.\n\nDescribe the pain character:`,
      question: isRu ? "Как бы вы описали головную боль?" : "How would you describe the headache?",
      questionId: "neuro-q1",
      options: isRu
        ? ["Давящая / как обруч вокруг головы", "Пульсирующая, обычно с одной стороны", "Острая / резкая", "Тупая и постоянная"]
        : ["Pressing / like a band around head", "Pulsating, usually one-sided", "Sharp / stabbing", "Dull and constant"],
    };
  }
  if (specialist.toLowerCase().includes("кардиолог") || specialist.toLowerCase().includes("cardiolog")) {
    return {
      message: isRu
        ? `Здравствуйте, я ваш AI-кардиолог.\n\nСимптомы${symContext} требуют внимательной оценки. Сердечные симптомы нужно исключать в первую очередь.\n\nУточните важный момент:`
        : `Hello, I'm your AI cardiologist.\n\nSymptoms${symContext} require careful evaluation. Cardiac causes should be ruled out first.\n\nPlease clarify:`,
      question: isRu ? "Боль в груди или одышка — когда появляются?" : "When does chest pain or shortness of breath occur?",
      questionId: "cardio-q1",
      options: isRu
        ? ["При физической нагрузке", "В покое, без нагрузки", "Ночью или утром", "Без явной закономерности"]
        : ["With physical exertion", "At rest, without exertion", "At night or morning", "No clear pattern"],
    };
  }
  if (specialist.toLowerCase().includes("ортопед") || specialist.toLowerCase().includes("ревматолог") || specialist.toLowerCase().includes("orthop") || specialist.toLowerCase().includes("rheumatol")) {
    return {
      message: isRu
        ? `Здравствуйте, я ваш AI-ортопед.\n\nПо симптомам${symContext} рассматриваю несколько причин: мышечное перенапряжение, протрузия диска, остеохондроз или межпозвоночная грыжа.\n\nДля уточнения важен характер боли:`
        : `Hello, I'm your AI orthopedist.\n\nFor symptoms${symContext}, I'm considering: muscle strain, disc protrusion, osteochondrosis, or herniated disc.\n\nThe pain character is important:`,
      question: isRu ? "Куда отдаёт боль в спине?" : "Does the back pain radiate anywhere?",
      questionId: "ortho-q1",
      options: isRu
        ? ["Только в спине, никуда не отдаёт", "Отдаёт в ногу / бедро", "Отдаёт в шею или плечо", "Опоясывающая боль вокруг туловища"]
        : ["Only in the back, no radiation", "Radiates to leg / hip", "Radiates to neck or shoulder", "Belt-like pain around the torso"],
    };
  }
  if (specialist.toLowerCase().includes("пульмонолог") || specialist.toLowerCase().includes("pulmonol")) {
    return {
      message: isRu
        ? `Здравствуйте, я ваш AI-пульмонолог.\n\nСимптомы${symContext} могут указывать на бронхит, астму, аллергический или инфекционный кашель.\n\nОпишите кашель подробнее:`
        : `Hello, I'm your AI pulmonologist.\n\nSymptoms${symContext} may indicate bronchitis, asthma, or allergic/infectious cough.\n\nDescribe the cough:`,
      question: isRu ? "Какой характер кашля?" : "What type of cough do you have?",
      questionId: "pulmo-q1",
      options: isRu
        ? ["Сухой, без мокроты", "Влажный с мокротой", "Приступообразный (особенно ночью)", "С одышкой или свистом в груди"]
        : ["Dry, no mucus", "Productive with mucus", "Paroxysmal (especially at night)", "With shortness of breath or wheezing"],
    };
  }
  // Default GP
  return {
    message: isRu
      ? `Здравствуйте, я ваш AI-${specialist.toLowerCase()}.\n\nПо симптомам${symContext} хочу задать несколько уточняющих вопросов, как на приёме у врача:`
      : `Hello, I'm your AI ${specialist.toLowerCase()}.\n\nFor your symptoms${symContext}, I'd like to ask a few clarifying questions, just like at a doctor's appointment:`,
    question: isRu ? "Эти симптомы появились впервые или бывали раньше?" : "Are these symptoms new or have you had them before?",
    questionId: "spec-q1",
    options: isRu
      ? ["Впервые в жизни", "Изредка бывает", "Периодически повторяется", "Хронические, давно"]
      : ["First time ever", "Occasionally", "Recurring periodically", "Chronic, long-standing"],
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

  // ── Document / test-result query detection ───────────────────────────────────
  const DOC_KEYWORDS_RU = ["анализ", "результат", "обследован", "снимок", "узи", "мрт", "кт", "рентген", "биохими", "анализов", "анализы", "документ", "выписк", "справк", "направлен"];
  const DOC_KEYWORDS_EN = ["analysis", "result", "lab", "blood test", "scan", "mri", "ct ", "xray", "x-ray", "report", "document", "record", "ultrasound"];
  const isDocumentQuery = (isRu ? DOC_KEYWORDS_RU : DOC_KEYWORDS_EN).some((k) => lowerLast.includes(k));

  // ── Item 6: Uploaded document handling ────────────────────────────────────────
  // Triggered when vision API extracted text and sent it as [Загружен медицинский документ: ...]
  const isUploadedDoc = lowerLast.includes("[загружен медицинский документ") || lowerLast.includes("[uploaded medical document");
  if (isUploadedDoc) {
    // Extract file name from prefix
    const nameMatch = lastUserText.match(/\[(?:Загружен медицинский документ|Uploaded medical document): ([^\]]+)\]/);
    const fileName = nameMatch?.[1] ?? (isRu ? "документ" : "document");
    // Check if vision API returned no-key message
    const noKeyMsg = lowerLast.includes("недоступен без api") || lowerLast.includes("unavailable without api");
    if (noKeyMsg) {
      return {
        message: isRu
          ? `Я вижу, что вы загрузили файл «${fileName}».\n\nАвтоматическое распознавание документов временно недоступно (нет API ключа). Пожалуйста, скопируйте ключевые показатели из документа текстом, и я помогу их интерпретировать.\n\nНапример: «Гемоглобин 98, лейкоциты 11.2, глюкоза 6.8»`
          : `I see you uploaded "${fileName}".\n\nAutomatic document recognition is temporarily unavailable (no API key). Please copy the key values from the document as text, and I'll help interpret them.\n\nFor example: "Hemoglobin 98, WBC 11.2, glucose 6.8"`,
        urgency: "low",
        recommendedSpecialist: null,
        followUpQuestions: [],
        sessionMemory: { ...memory, files: [...memory.files, fileName] },
        requestLocation: false,
        disclaimer: DISC,
      };
    }
    // Vision API returned actual text → acknowledge and guide
    return {
      message: isRu
        ? `Я изучил документ «${fileName}».\n\nЕсли вы видите выше расшифровку показателей — обратите внимание на значения, отмеченные ↑ (выше нормы) или ↓ (ниже нормы).\n\nРасскажите:\n• Что вас беспокоит в этих результатах?\n• Есть ли симптомы — слабость, головная боль, боли где-то?`
        : `I've reviewed "${fileName}".\n\nIf you see the extracted values above, pay attention to values marked ↑ (above normal) or ↓ (below normal).\n\nPlease tell me:\n• What concerns you about these results?\n• Do you have any symptoms — fatigue, headaches, pain anywhere?`,
      urgency: "low",
      recommendedSpecialist: null,
      followUpQuestions: [],
      sessionMemory: { ...memory, files: [...memory.files, fileName] },
      requestLocation: false,
      disclaimer: DISC,
    };
  }

  // ── Symptoms extraction + city detection ─────────────────────────────────────
  const extractedSymptoms = extractSymptomKeywords(lastUserText, isRu);
  const allSymptoms = Array.from(new Set([...memory.symptoms, ...extractedSymptoms]));

  const urgent = URGENT_KEYWORDS.some((k) => lowerLast.includes(k));

  // ── Document query with no symptoms → ask to describe or upload ──────────────
  if (isDocumentQuery && allSymptoms.length === 0 && !memory.specialist) {
    return {
      message: isRu
        ? "Понял, вы хотите обсудить медицинские документы или результаты анализов.\n\nЕсть два способа:\n• Нажмите кнопку 📎 и загрузите фото документа — я прочитаю его автоматически\n• Или опишите ключевые показатели текстом\n\nКакие именно анализы или результаты вас интересуют?"
        : "I see you'd like to discuss medical documents or test results.\n\nTwo ways to proceed:\n• Tap the 📎 button to upload a photo — I'll read it automatically\n• Or describe the key values in text\n\nWhich test results or documents would you like to discuss?",
      urgency: "low",
      recommendedSpecialist: null,
      followUpQuestions: [],
      sessionMemory: { ...memory, symptoms: allSymptoms },
      requestLocation: false,
      disclaimer: DISC,
    };
  }

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
  const symStr = allSymptoms.slice(0, 5).join(isRu ? ", " : ", ");

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
    const symContext = symStr ? (isRu ? ` (${symStr})` : ` (${symStr})`) : "";
    return {
      message: isRu
        ? `Понял. Исходя из описанных симптомов${symContext}, рекомендую консультацию специалиста — ${detectedSpec}.\n\nПозвольте уточнить подробности у специалиста. Продолжаем...`
        : `Got it. Based on your symptoms${symContext}, I recommend seeing a ${detectedSpec}.\n\nLet me connect you with a specialist for more details.`,
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
    const symNote = symStr ? (isRu ? ` Симптомы: ${symStr}.` : ` Symptoms noted: ${symStr}.`) : "";
    return {
      message: isRu
        ? `Понял.${symNote} Насколько сильно это влияет на вашу повседневную жизнь?`
        : `I see.${symNote} How much is this affecting your daily life?`,
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
      ? (symStr
          ? `Я отметил ваши симптомы: ${symStr}.\n\nКак долго они продолжаются?`
          : "Понял. Расскажите подробнее — что именно вас беспокоит? Опишите симптомы, ощущения или что произошло.")
      : (symStr
          ? `I've noted your symptoms: ${symStr}.\n\nHow long have you been experiencing this?`
          : "Understood. Could you describe in more detail what's bothering you? Please tell me your symptoms, sensations, or what happened."),
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

// ── Item 5: Differential diagnosis causes ─────────────────────────────────────
// Key = exact symptom name as stored in symptoms array (from extractSymptomKeywords output)
const CAUSE_MAP: Record<string, { ru: string[]; en: string[] }> = {
  "боль в животе": {
    ru: ["Гастроэнтерит (кишечная инфекция) — тошнота, диарея, температура", "Синдром раздражённого кишечника — спазмы, вздутие, нарушение стула", "Гастрит или язва желудка — боль после еды/натощак", "Аппендицит — острая боль справа снизу (требует срочной помощи)"],
    en: ["Gastroenteritis — nausea, diarrhea, fever", "Irritable bowel syndrome — cramping, bloating, irregular stools", "Gastritis or peptic ulcer — pain after meals or on empty stomach", "Appendicitis — acute right lower pain (urgent care needed)"],
  },
  "abdominal pain": {
    ru: ["Гастроэнтерит", "Синдром раздражённого кишечника", "Гастрит или язва"],
    en: ["Gastroenteritis — nausea, diarrhea", "Irritable bowel syndrome — cramping, bloating", "Gastritis or peptic ulcer — pain after meals"],
  },
  "stomach pain": {
    ru: ["Гастрит или язва желудка", "Гастроэнтерит", "Синдром раздражённого кишечника"],
    en: ["Gastritis or peptic ulcer", "Gastroenteritis", "Irritable bowel syndrome"],
  },
  "повышенная температура": {
    ru: ["Вирусная инфекция (ОРВИ, грипп) — наиболее вероятно при температуре до 38.5°C", "Бактериальная инфекция — температура выше 38.5°C, не сбивается", "Воспалительный процесс в организме — хроническое заболевание"],
    en: ["Viral infection (flu, cold) — most likely if under 38.5°C", "Bacterial infection — temperature above 38.5°C, resistant to antipyretics", "Inflammatory condition — chronic disease"],
  },
  "fever": {
    ru: [],
    en: ["Viral infection (flu, cold)", "Bacterial infection", "Inflammatory condition"],
  },
  "головная боль": {
    ru: ["Мигрень — пульсирующая боль с одной стороны, часто с тошнотой и светобоязнью", "Головная боль напряжения — давящая по всей голове, от стресса и усталости", "Повышенное/пониженное давление — измерьте тонометром", "Обезвоживание — пейте больше воды"],
    en: ["Migraine — pulsating one-sided pain, often with nausea and light sensitivity", "Tension headache — pressing pain throughout head, from stress and fatigue", "Blood pressure changes — check with a blood pressure monitor", "Dehydration — increase fluid intake"],
  },
  "headache": {
    ru: [],
    en: ["Migraine — pulsating one-sided pain, nausea, light sensitivity", "Tension headache — pressing pain, stress-related", "Blood pressure changes — measure with a monitor", "Dehydration — drink more water"],
  },
  "боль в спине": {
    ru: ["Мышечное перенапряжение / растяжение — чаще при физической нагрузке или неправильной позе", "Протрузия или грыжа межпозвоночного диска — боль с отдачей в ногу (ишиас)", "Остеохондроз — хроническая дегенерация позвоночника, чаще у взрослых", "Спазм мышц спины — острая боль при движении, проходит с покоем", "Почечная колика — острая боль в пояснице сбоку (если есть проблемы с почками)"],
    en: ["Muscle strain or spasm — often after physical exertion or poor posture", "Herniated disc — pain radiating down the leg (sciatica)", "Osteoarthritis / osteochondrosis — chronic spinal degeneration", "Facet joint syndrome — pain with twisting or bending", "Kidney stones — sharp flank pain if kidney issues suspected"],
  },
  "back pain": {
    ru: [],
    en: ["Muscle strain or spasm — after exertion or poor posture", "Herniated disc — pain radiating down leg (sciatica)", "Osteoarthritis / spinal degeneration", "Facet joint syndrome — pain with twisting", "Kidney stones — if sharp flank pain"],
  },
  "мигрень": {
    ru: ["Классическая мигрень — триггеры: стресс, недосып, гормональные изменения, определённые продукты", "Шейная мигрень (цервикогенная) — от проблем в шейном отделе позвоночника", "Мигрень с аурой — перед болью появляются визуальные эффекты, онемение"],
    en: ["Classic migraine — triggers: stress, sleep deprivation, hormonal changes, certain foods", "Cervicogenic headache — from cervical spine problems", "Migraine with aura — visual disturbances, numbness before pain"],
  },
  "кашель": {
    ru: ["ОРВИ / простуда — сухой или влажный кашель при вирусной инфекции", "Бронхит — влажный кашель с мокротой, часто после ОРВИ", "Бронхиальная астма — приступообразный кашель, особенно ночью или после нагрузки", "Аллергический кашель — сухой, без температуры, сезонный или на аллерген"],
    en: ["URTI / cold — dry or productive cough with viral infection", "Bronchitis — productive cough, often post-cold", "Bronchial asthma — paroxysmal cough, especially at night or after exertion", "Allergic cough — dry, without fever, seasonal or allergen-triggered"],
  },
  "cough": {
    ru: [],
    en: ["URTI / common cold — dry or productive cough", "Bronchitis — productive cough after infection", "Bronchial asthma — paroxysmal, nocturnal cough", "Allergic cough — dry, without fever"],
  },
  "тошнота": {
    ru: ["Гастрит или рефлюкс (ГЭРБ) — особенно утром или после жирной еды", "Вирусная инфекция ЖКТ (ротавирус, норовирус)", "Вегетативная дисфункция (ВСД) — тошнота при стрессе или переутомлении", "Лекарственные эффекты — побочное действие некоторых препаратов"],
    en: ["Gastritis or reflux (GERD) — especially in the morning or after fatty food", "Viral gastrointestinal infection (rotavirus, norovirus)", "Autonomic dysfunction — nausea with stress or exhaustion", "Medication side effects — check current medications"],
  },
  "nausea": {
    ru: [],
    en: ["Gastritis or GERD — especially in the morning or after meals", "Viral gastrointestinal infection", "Motion sickness or vertigo", "Medication side effects"],
  },
  "слабость": {
    ru: ["Анемия (снижение гемоглобина) — слабость, бледность, одышка при нагрузке", "Дефицит витамина D или B12 — хроническая усталость, особенно зимой", "Вирусная инфекция или постковидный синдром", "Нарушение сна / хроническое переутомление", "Гипотиреоз — сниженная функция щитовидной железы"],
    en: ["Anemia — weakness, pallor, exertional shortness of breath", "Vitamin D or B12 deficiency — chronic fatigue, especially in winter", "Viral infection or post-COVID syndrome", "Sleep disorder / chronic fatigue", "Hypothyroidism — underactive thyroid"],
  },
  "fatigue": {
    ru: [],
    en: ["Anemia — check hemoglobin levels", "Vitamin D or B12 deficiency", "Post-viral syndrome or post-COVID", "Chronic fatigue syndrome / sleep disorder", "Hypothyroidism — underactive thyroid"],
  },
  "головокружение": {
    ru: ["Доброкачественное позиционное головокружение (ДППГ) — при повороте головы", "Вестибулярный неврит — резкое головокружение после инфекции", "Снижение давления (гипотония) — особенно при вставании", "Анемия — недостаток кислорода в крови"],
    en: ["Benign paroxysmal positional vertigo (BPPV) — on head movement", "Vestibular neuritis — sudden vertigo after infection", "Low blood pressure (hypotension) — especially on standing", "Anemia — reduced oxygen in blood"],
  },
  "dizziness": {
    ru: [],
    en: ["BPPV — vertigo on head movement", "Vestibular neuritis — after infection", "Low blood pressure — especially on standing", "Anemia — check hemoglobin"],
  },
  "давление": {
    ru: ["Гипертоническая болезнь — хроническое повышение давления", "Вторичная гипертензия — из-за почечных или эндокринных заболеваний", "Гипотония — пониженное давление, слабость, головокружение"],
    en: ["Essential hypertension — chronic elevated blood pressure", "Secondary hypertension — due to kidney or endocrine disease", "Hypotension — low pressure, weakness, dizziness"],
  },
  "high pressure": {
    ru: [],
    en: ["Essential hypertension — chronic elevated blood pressure", "Secondary hypertension", "White coat hypertension — anxiety-related"],
  },
  "боль в груди": {
    ru: ["Стенокардия или ОКС — боль при нагрузке, отдаёт в руку/челюсть (СРОЧНО к врачу)", "Плеврит — боль при дыхании, после инфекции", "Остеохондроз грудного отдела — боль при движении", "Гастроэзофагеальный рефлюкс — жжение за грудиной после еды"],
    en: ["Angina or ACS — chest pain on exertion, may radiate to arm/jaw (URGENT)", "Pleuritis — pain on breathing, post-infection", "Thoracic osteochondrosis — pain with movement", "GERD — burning behind sternum after eating"],
  },
  "chest pain": {
    ru: [],
    en: ["Angina or ACS — on exertion, may radiate to arm/jaw (URGENT)", "Pleuritis — pain on breathing", "Costochondritis — chest wall pain, reproduced by palpation", "GERD — burning after eating"],
  },
};

function buildCausesMessage(isRu: boolean, symptoms: string[]): string {
  const allCauses = new Set<string>();

  for (const sym of symptoms) {
    const symLower = sym.toLowerCase();
    // Exact match first, then partial (symptom contains key, not the other way around)
    const key = Object.keys(CAUSE_MAP).find((k) => symLower === k || symLower.includes(k));
    if (key) {
      const causes = isRu ? CAUSE_MAP[key].ru : CAUSE_MAP[key].en;
      causes.forEach((c) => allCauses.add(c));
    }
  }

  const causeList = Array.from(allCauses).slice(0, 6);
  const symStr = symptoms.join(isRu ? ", " : ", ");

  if (causeList.length === 0) {
    return isRu
      ? `На основе описанных симптомов${symStr ? ` (${symStr})` : ""} сложно определить точные причины без осмотра.\n\nРекомендую обратиться к терапевту — он проведёт осмотр, назначит анализы и поставит точный диагноз.\n\n⚠️ Только врач может поставить диагноз.`
      : `Based on the described symptoms${symStr ? ` (${symStr})` : ""}, specific causes are hard to determine without examination.\n\nI recommend seeing a general practitioner for a physical exam and tests.\n\n⚠️ Only a doctor can diagnose.`;
  }

  const list = causeList.map((c) => `• ${c}`).join("\n");
  const header = isRu
    ? `Наиболее вероятные причины${symStr ? ` при симптомах (${symStr})` : ""}:\n\n${list}`
    : `Most likely causes${symStr ? ` for symptoms (${symStr})` : ""}:\n\n${list}`;

  return `${header}\n\n⚠️ ${isRu ? "Это дифференциальный список для ориентира, а не диагноз. Точный диагноз ставит только врач после осмотра и анализов." : "This is a differential list for reference only, not a diagnosis. Only a doctor can diagnose after examination and tests."}`;
}

// ── Item 7: Expanded red flag / emergency detection ───────────────────────────
const URGENT_KEYWORDS = [
  // Cardiac
  "боль в груди", "chest pain", "жжение за грудиной", "боль отдаёт в руку", "боль в левой руке",
  // Breathing
  "не могу дышать", "can't breathe", "задыхаюсь", "нехватка воздуха", "shortness of breath",
  // Neurological
  "инсульт", "stroke", "потерял сознание", "unconscious", "не могу говорить", "онемела рука",
  "перекосило лицо", "face drooping", "arm weakness", "sudden severe headache",
  // Bleeding
  "сильное кровотечение", "severe bleeding", "рвота кровью", "кровь из", "vomiting blood",
  // Other emergencies
  "потеря сознания", "судороги", "seizure", "анафилакс", "anaphylax",
  "острая боль в животе", "острый живот", "острая боль",
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

