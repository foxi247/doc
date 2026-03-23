import OpenAI from "openai";

if (!process.env.NVIDIA_API_KEY && process.env.NODE_ENV === "production") {
  console.warn("[MedNavigator] NVIDIA_API_KEY is not set. Falling back to mock responses.");
}

const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "placeholder-key";

export const aiClient = new OpenAI({
  apiKey: NVIDIA_API_KEY,
  baseURL: NVIDIA_BASE_URL,
});

// Main conversational model: DeepSeek v3.2 with extended reasoning
export const AI_MODEL = process.env.NVIDIA_MODEL || "deepseek-ai/deepseek-v3.2";

// Vision model: Mistral Large for reading medical images and documents
export const VISION_MODEL = "mistralai/mistral-large-3-675b-instruct-2512";

export const AI_CHAT_OPTIONS = {
  temperature: 1,
  top_p: 0.95,
  max_tokens: 2048,
  extra_body: {
    chat_template_kwargs: {
      thinking: process.env.NVIDIA_ENABLE_THINKING !== "false",
    },
  },
} as const;
