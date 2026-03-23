export interface AIResponse {
  urgency: "low" | "medium" | "high";
  recommendedSpecialist: string;
  followUpQuestions: string[];
  summary: string;
  possibleConcern: string;
  disclaimer: string;
}

export interface AIRequest {
  symptoms: string;
  uploadedFiles?: string[];
}

export const AI_RESPONSE_SCHEMA = {
  urgency: ["low", "medium", "high"] as const,
  fields: [
    "urgency",
    "recommendedSpecialist",
    "followUpQuestions",
    "summary",
    "possibleConcern",
    "disclaimer",
  ],
};
