import { AIResponse } from "./types";

export function parseAIResponse(raw: string): AIResponse | null {
  if (!raw || typeof raw !== "string") return null;

  // Strip markdown fences if model wraps in them despite instructions
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  cleaned = cleaned.replace(/^```\s*/i, "").replace(/\s*```$/i, "");

  // Extract JSON object if there's surrounding text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(cleaned);
    return validateAndNormalize(parsed);
  } catch {
    // Attempt lightweight repair
    return attemptRepair(cleaned);
  }
}

function validateAndNormalize(obj: Record<string, unknown>): AIResponse | null {
  if (!obj || typeof obj !== "object") return null;

  const urgency = (obj.urgency as string)?.toLowerCase();
  if (!["low", "medium", "high"].includes(urgency)) return null;

  const recommendedSpecialist =
    typeof obj.recommendedSpecialist === "string" && obj.recommendedSpecialist.trim()
      ? obj.recommendedSpecialist.trim()
      : null;

  if (!recommendedSpecialist) return null;

  const followUpQuestions = Array.isArray(obj.followUpQuestions)
    ? (obj.followUpQuestions as unknown[])
        .filter((q) => typeof q === "string")
        .map((q) => (q as string).trim())
        .slice(0, 5)
    : [];

  const summary =
    typeof obj.summary === "string" && obj.summary.trim() ? obj.summary.trim() : null;

  if (!summary) return null;

  const possibleConcern =
    typeof obj.possibleConcern === "string" ? obj.possibleConcern.trim() : "To be discussed with a clinician";

  const disclaimer =
    typeof obj.disclaimer === "string"
      ? obj.disclaimer.trim()
      : "This is not a diagnosis or treatment recommendation. Please consult a licensed healthcare professional.";

  return {
    urgency: urgency as "low" | "medium" | "high",
    recommendedSpecialist,
    followUpQuestions,
    summary,
    possibleConcern,
    disclaimer,
  };
}

function attemptRepair(text: string): AIResponse | null {
  try {
    // Try to fix common JSON issues: trailing commas, single quotes
    const repaired = text
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/'/g, '"')
      .replace(/(\w+):/g, '"$1":');

    const parsed = JSON.parse(repaired);
    return validateAndNormalize(parsed);
  } catch {
    return null;
  }
}
