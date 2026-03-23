import { ChatResponseSchema, type ChatResponse, type SessionMemory } from "./chat-types";

export function parseChatResponse(raw: string, fallbackMemory: SessionMemory): ChatResponse {
  // Strip markdown fences
  let text = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  // Extract JSON if surrounded by text
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart > 0 || jsonEnd < text.length - 1) {
    if (jsonStart !== -1 && jsonEnd !== -1) {
      text = text.slice(jsonStart, jsonEnd + 1);
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = tryRepair(text);
  }

  if (!parsed || typeof parsed !== "object") {
    return buildFallback(raw, fallbackMemory);
  }

  const result = ChatResponseSchema.safeParse(parsed);
  if (result.success) {
    // Merge memory — don't lose what we already knew
    return mergeMemory(result.data, fallbackMemory);
  }

  // Try to salvage partial response
  const obj = parsed as Record<string, unknown>;
  const message = typeof obj.message === "string" ? obj.message : raw.slice(0, 500);
  return mergeMemory(
    {
      message,
      urgency: "low",
      recommendedSpecialist: null,
      followUpQuestions: [],
      sessionMemory: fallbackMemory,
      requestLocation: false,
    },
    fallbackMemory
  );
}

function mergeMemory(response: ChatResponse, fallback: SessionMemory): ChatResponse {
  return {
    ...response,
    sessionMemory: {
      symptoms: Array.from(
        new Set([...fallback.symptoms, ...(response.sessionMemory?.symptoms ?? [])])
      ),
      location: {
        country:
          response.sessionMemory?.location?.country ?? fallback.location.country,
        city: response.sessionMemory?.location?.city ?? fallback.location.city,
      },
      files: Array.from(
        new Set([...fallback.files, ...(response.sessionMemory?.files ?? [])])
      ),
      specialist: response.sessionMemory?.specialist ?? fallback.specialist,
      urgency: response.sessionMemory?.urgency ?? fallback.urgency,
    },
  };
}

function buildFallback(raw: string, memory: SessionMemory): ChatResponse {
  return {
    message: raw.slice(0, 800) || "I'm here to help. Could you describe your symptoms?",
    urgency: "low",
    recommendedSpecialist: null,
    followUpQuestions: [],
    sessionMemory: memory,
    requestLocation: false,
  };
}

function tryRepair(text: string): unknown {
  try {
    // Remove trailing commas before ] or }
    const repaired = text
      .replace(/,\s*([\]}])/g, "$1")
      .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":')
      .replace(/:\s*'([^']*)'/g, ': "$1"');
    return JSON.parse(repaired);
  } catch {
    return null;
  }
}
