"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PanelLeft, PanelRight, AlertTriangle } from "lucide-react";
import { ChatInput } from "./chat-input";
import { ChatMessageBubble } from "./chat-message";
import { ContextPanel } from "./context-panel";
import { QuickStarterChips } from "./option-chips";
import { ChatSidebar, MobileSidebar } from "./chat-sidebar";
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
    markMessageRead,
    setLoading,
  } = useChatStore();

  const [input, setInput] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true); // desktop default
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Greeting on first load
  useEffect(() => {
    if (messages.length === 0 && !hasGreeted) {
      setHasGreeted(true);
      addMessage({ role: "assistant", content: t("chat.greeting") });
    }
  }, [messages.length, hasGreeted, addMessage, t]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;
      setInput("");

      addMessage({ role: "user", content: content.trim() });
      addMessage({ role: "assistant", content: "", isLoading: true });
      setLoading(true);

      try {
        const currentMessages = useChatStore.getState().messages;
        const apiMessages = selectApiMessages(
          currentMessages.filter((m) => !m.isLoading)
        );

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            sessionMemory: useChatStore.getState().memory,
            locale,
          }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data: ChatResponse = await response.json();

        updateLastAssistantMessage({
          content: data.message,
          isLoading: false,
          isNew: true, // triggers typewriter
          urgency: data.urgency,
          recommendedSpecialist: data.recommendedSpecialist ?? undefined,
          followUpQuestions: data.followUpQuestions,
          recommendations: data.recommendations,
        });

        if (data.sessionMemory) {
          updateMemory(data.sessionMemory);
        }
      } catch (err) {
        console.error("[ChatShell] send failed:", err);
        updateLastAssistantMessage({
          content: t("chat.greeting"),
          isLoading: false,
          isNew: true,
        });
      } finally {
        setLoading(false);
      }
    },
    [isLoading, addMessage, updateLastAssistantMessage, updateMemory, setLoading, locale, t]
  );

  const handleOptionSelect = useCallback(
    (_questionId: string, value: string) => sendMessage(value),
    [sendMessage]
  );

  const handleStarterSelect = useCallback(
    (starter: string) => sendMessage(starter),
    [sendMessage]
  );

  const starters = ta("chat.quickStarters");
  const showStarters = messages.length <= 1 && !isLoading;

  return (
    <div className="flex h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <AnimatePresence initial={false}>
        {showSidebar && (
          <motion.aside
            key="desktop-sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="hidden overflow-hidden border-r border-slate-200 dark:border-slate-800 lg:block"
          >
            <ChatSidebar />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Mobile sidebar overlay ───────────────────────── */}
      <MobileSidebar
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* ── Main column ─────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 lg:hidden"
            >
              <PanelLeft className="h-4 w-4" />
            </button>

            {/* Desktop sidebar toggle */}
            <button
              onClick={() => setShowSidebar((v) => !v)}
              className={`hidden h-8 w-8 items-center justify-center rounded-xl transition-colors lg:flex ${
                showSidebar
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              }`}
            >
              <PanelLeft className="h-4 w-4" />
            </button>

            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {t("chat.title")}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {t("chat.subtitle")}
              </p>
            </div>
          </div>

          {/* Context panel toggle (desktop) */}
          <button
            onClick={() => setShowContext((v) => !v)}
            className={`hidden h-8 w-8 items-center justify-center rounded-xl transition-colors lg:flex ${
              showContext
                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            }`}
            title="Session context"
          >
            <PanelRight className="h-4 w-4" />
          </button>
        </div>

        {/* Emergency notice */}
        <div className="flex items-center gap-2 bg-red-50 px-4 py-2 dark:bg-red-950/30">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />
          <p className="text-xs text-red-600 dark:text-red-400">{t("chat.emergency")}</p>
        </div>

        {/* Messages + context */}
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
                    onTypingDone={markMessageRead}
                  />
                ))}
              </AnimatePresence>

              {/* Quick starters on empty chat */}
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
                transition={{ duration: 0.22 }}
                className="hidden overflow-hidden border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block"
              >
                <ContextPanel memory={memory} />
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
