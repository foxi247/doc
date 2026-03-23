"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SessionMemory, FollowUpQuestion } from "@/lib/ai/chat-types";
import type { HospitalResult, DoctorResult } from "@/lib/search/providers";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  urgency?: "low" | "medium" | "high";
  recommendedSpecialist?: string | null;
  followUpQuestions?: FollowUpQuestion[];
  recommendations?: {
    hospitals: HospitalResult[];
    doctors: DoctorResult[];
  };
  isLoading?: boolean;
}

interface ChatStore {
  messages: ChatMessage[];
  memory: SessionMemory;
  isLoading: boolean;
  addMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => string;
  updateLastAssistantMessage: (updates: Partial<ChatMessage>) => void;
  updateMemory: (updates: Partial<SessionMemory>) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const defaultMemory: SessionMemory = {
  symptoms: [],
  location: { country: null, city: null },
  files: [],
  specialist: null,
  urgency: null,
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [],
      memory: defaultMemory,
      isLoading: false,

      addMessage: (msg) => {
        const id = crypto.randomUUID();
        set((state) => ({
          messages: [
            ...state.messages,
            { ...msg, id, timestamp: Date.now() },
          ],
        }));
        return id;
      },

      updateLastAssistantMessage: (updates) => {
        set((state) => {
          const msgs = [...state.messages];
          for (let i = msgs.length - 1; i >= 0; i--) {
            if (msgs[i].role === "assistant") {
              msgs[i] = { ...msgs[i], ...updates };
              break;
            }
          }
          return { messages: msgs };
        });
      },

      updateMemory: (updates) => {
        set((state) => ({
          memory: {
            ...state.memory,
            ...updates,
            location: updates.location
              ? { ...state.memory.location, ...updates.location }
              : state.memory.location,
            symptoms: updates.symptoms
              ? Array.from(new Set([...state.memory.symptoms, ...updates.symptoms]))
              : state.memory.symptoms,
            files: updates.files
              ? Array.from(new Set([...state.memory.files, ...updates.files]))
              : state.memory.files,
          },
        }));
      },

      setLoading: (loading) => set({ isLoading: loading }),

      reset: () =>
        set({
          messages: [],
          memory: defaultMemory,
          isLoading: false,
        }),
    }),
    {
      name: "mednavigator-chat",
      partialize: (state) => ({
        messages: state.messages.slice(-20), // Keep last 20 messages
        memory: state.memory,
      }),
    }
  )
);

// Selector for API messages format (exclude loading placeholders)
export function selectApiMessages(messages: ChatMessage[]) {
  return messages
    .filter((m) => !m.isLoading && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content }));
}
