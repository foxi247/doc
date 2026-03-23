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

  const prompt =
    language === "ru"
      ? "Ты медицинский ассистент. Внимательно прочитай этот медицинский документ или результат анализа. Извлеки всю информацию: показатели, значения, нормы, диагнозы, заключения. Ответь чётко и структурированно на русском языке."
      : "You are a medical assistant. Carefully read this medical document or test result. Extract all information: indicators, values, normal ranges, diagnoses, conclusions. Respond clearly and in a structured way in English.";

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
