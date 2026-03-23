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
  isNew?: boolean;
}

export interface ChatSession {
  id: string;
  name: string;        // user-editable
  preview: string;     // first user message
  timestamp: number;
  messageCount: number;
}

interface ChatStore {
  messages: ChatMessage[];
  memory: SessionMemory;
  isLoading: boolean;
  history: ChatSession[];
  /** ID of history session being displayed (null = current live chat) */
  activeHistoryId: string | null;

  addMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => string;
  updateLastAssistantMessage: (updates: Partial<ChatMessage>) => void;
  markMessageRead: (id: string) => void;
  updateMemory: (updates: Partial<SessionMemory>) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
  renameSession: (id: string, name: string) => void;
  deleteSession: (id: string) => void;
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
      history: [],
      activeHistoryId: null,

      addMessage: (msg) => {
        const id = crypto.randomUUID();
        set((s) => ({
          messages: [...s.messages, { ...msg, id, timestamp: Date.now() }],
        }));
        return id;
      },

      updateLastAssistantMessage: (updates) => {
        set((s) => {
          const msgs = [...s.messages];
          for (let i = msgs.length - 1; i >= 0; i--) {
            if (msgs[i].role === "assistant") {
              msgs[i] = { ...msgs[i], ...updates };
              break;
            }
          }
          return { messages: msgs };
        });
      },

      markMessageRead: (id) => {
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id ? { ...m, isNew: false } : m)),
        }));
      },

      updateMemory: (updates) => {
        set((s) => ({
          memory: {
            ...s.memory,
            ...updates,
            location: updates.location
              ? { ...s.memory.location, ...updates.location }
              : s.memory.location,
            symptoms: updates.symptoms
              ? Array.from(new Set([...s.memory.symptoms, ...updates.symptoms]))
              : s.memory.symptoms,
            files: updates.files
              ? Array.from(new Set([...s.memory.files, ...updates.files]))
              : s.memory.files,
          },
        }));
      },

      setLoading: (loading) => set({ isLoading: loading }),

      reset: () => {
        const { messages } = get();
        const userMsgs = messages.filter((m) => m.role === "user" && !m.isLoading);
        if (userMsgs.length > 0) {
          const preview = userMsgs[0].content.slice(0, 60);
          const session: ChatSession = {
            id: crypto.randomUUID(),
            name: preview,
            preview,
            timestamp: Date.now(),
            messageCount: messages.filter((m) => !m.isLoading).length,
          };
          set((s) => ({
            history: [session, ...s.history].slice(0, 20),
          }));
        }
        set({ messages: [], memory: defaultMemory, isLoading: false, activeHistoryId: null });
      },

      renameSession: (id, name) => {
        set((s) => ({
          history: s.history.map((h) => (h.id === id ? { ...h, name } : h)),
        }));
      },

      deleteSession: (id) => {
        set((s) => ({ history: s.history.filter((h) => h.id !== id) }));
      },
    }),
    {
      name: "mednavigator-chat",
      partialize: (s) => ({
        messages: s.messages.slice(-20),
        memory: s.memory,
        history: s.history,
      }),
    }
  )
);

export function selectApiMessages(messages: ChatMessage[]) {
  return messages
    .filter((m) => !m.isLoading && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content }));
}
