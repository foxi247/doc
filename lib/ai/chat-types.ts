import { z } from "zod";

// ─── Session memory ────────────────────────────────────────────────────────────
export const SessionMemorySchema = z.object({
  symptoms: z.array(z.string()).default([]),
  location: z
    .object({
      country: z.string().nullable().default(null),
      city: z.string().nullable().default(null),
    })
    .default({ country: null, city: null }),
  files: z.array(z.string()).default([]),
  specialist: z.string().nullable().default(null),
  urgency: z.enum(["low", "medium", "high"]).nullable().default(null),
});

export type SessionMemory = z.infer<typeof SessionMemorySchema>;

// ─── Follow-up question ───────────────────────────────────────────────────────
export const FollowUpQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  type: z.enum(["single-choice", "multi-choice", "free-text"]),
  options: z.array(z.string()).optional(),
});

export type FollowUpQuestion = z.infer<typeof FollowUpQuestionSchema>;

// ─── Chat response ────────────────────────────────────────────────────────────
export const ChatResponseSchema = z.object({
  message: z.string(),
  disclaimer: z.string().optional(),
  urgency: z.enum(["low", "medium", "high"]).default("low"),
  recommendedSpecialist: z.string().nullable().default(null),
  followUpQuestions: z.array(FollowUpQuestionSchema).default([]),
  sessionMemory: SessionMemorySchema,
  requestLocation: z.boolean().default(false),
  recommendations: z
    .object({
      hospitals: z.array(z.any()).default([]),
      doctors: z.array(z.any()).default([]),
    })
    .optional(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

// ─── Chat request ─────────────────────────────────────────────────────────────
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export const ChatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().max(4000),
    })
  ).min(1).max(40),
  sessionMemory: SessionMemorySchema.optional(),
  locale: z.enum(["en", "ru", "de", "uz", "ar", "es"]).default("ru"),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
