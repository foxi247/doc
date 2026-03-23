"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, PanelRight, AlertTriangle } from "lucide-react";
import { ChatInput } from "./chat-input";
import { ChatMessageBubble } from "./chat-message";
import { ContextPanel } from "./context-panel";
import { QuickStarterChips } from "./option-chips";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useChatStore, selectApiMessages } from "@/lib/store/chat";
import { useI18n } from "@/lib/i18n";
import type { ChatResponse } from "@/lib/ai/chat-types";

export function ChatShell() {
  const { t, ta, locale } = useI18n();
  const {
    messages,
    memory,
    isLoading,
    addMessage,
    updateLastAssistantMessage,
    updateMemory,
    setLoading,
    reset,
  } = useChatStore();

  const [input, setInput] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show greeting on mount if no messages
  useEffect(() => {
    if (messages.length === 0 && !hasGreeted) {
      setHasGreeted(true);
      addMessage({
        role: "assistant",
        content: t("chat.greeting"),
      });
    }
  }, [messages.length, hasGreeted, addMessage, t]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setInput("");

      // Add user message
      addMessage({ role: "user", content: content.trim() });

      // Add loading placeholder
      addMessage({ role: "assistant", content: "", isLoading: true });

      setLoading(true);

      try {
        const apiMessages = selectApiMessages([
          ...useChatStore.getState().messages.filter((m) => !m.isLoading),
        ]);

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            sessionMemory: memory,
            locale,
          }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data: ChatResponse = await response.json();

        // Update loading placeholder with real message
        updateLastAssistantMessage({
          content: data.message,
          isLoading: false,
          urgency: data.urgency,
          recommendedSpecialist: data.recommendedSpecialist ?? undefined,
          followUpQuestions: data.followUpQuestions,
          recommendations: data.recommendations,
        });

        // Update session memory
        if (data.sessionMemory) {
          updateMemory(data.sessionMemory);
        }
      } catch (err) {
        console.error("[ChatShell] send failed:", err);
        updateLastAssistantMessage({
          content: t("chat.greeting"),
          isLoading: false,
        });
      } finally {
        setLoading(false);
      }
    },
    [isLoading, addMessage, updateLastAssistantMessage, updateMemory, setLoading, memory, locale, t]
  );

  const handleOptionSelect = useCallback(
    (_questionId: string, value: string) => {
      sendMessage(value);
    },
    [sendMessage]
  );

  const handleStarterSelect = useCallback(
    (starter: string) => {
      sendMessage(starter);
    },
    [sendMessage]
  );

  const handleReset = () => {
    reset();
    setHasGreeted(false);
  };

  const starters = ta("chat.quickStarters");
  const showStarters = messages.length <= 1 && !isLoading;

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-950">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
            F
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {t("chat.title")}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{t("chat.subtitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="pill" />

          <button
            onClick={handleReset}
            title={t("chat.newChat")}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <Plus className="h-4 w-4" />
          </button>

          <button
            onClick={() => setShowContext((v) => !v)}
            title="Context panel"
            className={`hidden lg:flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
              showContext
                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            }`}
          >
            <PanelRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Emergency notice */}
      <div className="flex items-center gap-2 bg-red-50 px-4 py-2 dark:bg-red-950/30">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />
        <p className="text-xs text-red-600 dark:text-red-400">{t("chat.emergency")}</p>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Messages */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <ChatMessageBubble
                  key={msg.id}
                  message={msg}
                  onOptionSelect={handleOptionSelect}
                  isLast={i === messages.length - 1}
                />
              ))}
            </AnimatePresence>

            {/* Quick starters */}
            {showStarters && starters.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="pl-9"
              >
                <QuickStarterChips
                  starters={starters}
                  onSelect={handleStarterSelect}
                />
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={() => sendMessage(input)}
            isLoading={isLoading}
          />
        </div>

        {/* Context panel — desktop only */}
        <AnimatePresence>
          {showContext && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="hidden lg:block overflow-hidden border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            >
              <ContextPanel memory={memory} />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
