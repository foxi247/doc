import OpenAI from "openai";

if (!process.env.NVIDIA_API_KEY && process.env.NODE_ENV === "production") {
  console.warn("[MedNavigator] NVIDIA_API_KEY is not set. Falling back to mock responses.");
}

export const aiClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY || "placeholder-key",
  baseURL: process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
});

export const AI_MODEL = process.env.NVIDIA_MODEL || "z-ai/glm4.7";

export const AI_CHAT_OPTIONS = {
  temperature: 0.3,
  top_p: 1,
  max_tokens: 1200,
  // Preserve NVIDIA-specific thinking parameters from reference implementation
  extra_body: {
    chat_template_kwargs: {
      enable_thinking: process.env.NVIDIA_ENABLE_THINKING !== "false",
      clear_thinking: false,
    },
  },
} as const;
