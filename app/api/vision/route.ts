import { NextRequest, NextResponse } from "next/server";
import { aiClient, VISION_MODEL } from "@/lib/ai/client";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { imageBase64, mimeType = "image/png", language = "ru" } = body as {
    imageBase64: string;
    mimeType?: string;
    language?: string;
  };

  if (!imageBase64) {
    return NextResponse.json({ error: "imageBase64 is required." }, { status: 400 });
  }

  // Fallback if no API key
  if (!process.env.NVIDIA_API_KEY || process.env.NVIDIA_API_KEY === "placeholder-key") {
    return NextResponse.json({
      text: language === "ru"
        ? "Анализ изображений недоступен без API ключа. Пожалуйста, опишите содержимое документа текстом."
        : "Image analysis unavailable without API key. Please describe the document contents in text.",
      summary: "",
    });
  }

  // Map locale to response language name for the prompt
  const LANG_NAMES: Record<string, string> = {
    ru: "русском языке",
    en: "English",
    de: "Deutsch",
    uz: "o'zbek tilida",
    ar: "اللغة العربية",
    es: "español",
  };
  const responseLang = LANG_NAMES[language] ?? "English";

  const prompt = language === "ru"
    ? `Ты опытный медицинский ассистент. Перед тобой медицинский документ или результат анализа — он может быть на любом языке (русском, английском, немецком, арабском и т.д.).

Твоя задача:
1. Прочитай весь документ, независимо от его языка
2. Извлеки ВСЕ показатели, значения, единицы измерения
3. Для каждого показателя укажи норму и отметь отклонения (↑ выше нормы / ↓ ниже нормы)
4. Выдели показатели, требующие внимания врача
5. Напиши краткое заключение

Отвечай ТОЛЬКО на русском языке, структурированно.`
    : `You are an experienced medical assistant. You are looking at a medical document or lab result — it may be in any language (Russian, English, German, Arabic, etc.).

Your task:
1. Read the entire document regardless of its language
2. Extract ALL indicators, values, and units of measurement
3. For each indicator, state the normal range and mark deviations (↑ above normal / ↓ below normal)
4. Highlight indicators requiring medical attention
5. Write a brief conclusion

Respond ONLY in ${responseLang}, in a structured format.`;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completion = await (aiClient.chat.completions.create as any)({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: `${prompt}\n\n<img src="data:${mimeType};base64,${imageBase64}" />`,
        },
      ],
      max_tokens: 2048,
      temperature: 0.15,
      stream: false,
    });

    const text: string = completion.choices?.[0]?.message?.content ?? "";

    if (!text.trim()) {
      return NextResponse.json({
        text: language === "ru"
          ? "Не удалось прочитать документ. Попробуйте загрузить более чёткое изображение или введите данные вручную."
          : "Could not read the document. Try uploading a clearer image or enter the data manually.",
        summary: "",
      });
    }

    return NextResponse.json({ text, summary: text });
  } catch (err) {
    console.error("[Vision API]", err);
    return NextResponse.json(
      { error: "Vision API error. Please try again." },
      { status: 500 }
    );
  }
}
