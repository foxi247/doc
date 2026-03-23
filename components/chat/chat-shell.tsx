"use client";

import { useState, useRef, useEffect, useCallback, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PanelLeft, PanelRight, AlertTriangle, Copy, Check, ChevronDown, FileDown, Volume2, VolumeX } from "lucide-react";
import { ChatInput } from "./chat-input";
import { ChatMessageBubble } from "./chat-message";
import { ContextPanel } from "./context-panel";
import { QuickStarterChips } from "./option-chips";
import { ChatSidebar, MobileSidebar } from "./chat-sidebar";
import { useChatStore, selectApiMessages } from "@/lib/store/chat";
import { useI18n } from "@/lib/i18n";
import { useVoiceInput } from "@/lib/hooks/use-voice-input";
import { useSpeechOutput } from "@/lib/hooks/use-speech-output";
import { exportChatToPdf } from "@/lib/export/chat-pdf";
import type { ChatResponse } from "@/lib/ai/chat-types";

export function ChatShell() {
  const { t, ta, locale } = useI18n();
  const {
    messages, memory, isLoading,
    addMessage, updateLastAssistantMessage, updateMemory,
    markMessageRead, rateMessage, setLoading,
  } = useChatStore();

  const [input, setInput] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageAnalyzing, setImageAnalyzing] = useState(false);

  const [voiceMode, setVoiceMode] = useState(false);
  const { speak: speakTTS, stop: stopTTS } = useSpeechOutput();

  // Voice input
  const { isListening, isSupported: voiceSupported, toggle: toggleVoice } = useVoiceInput({
    locale,
    onResult: (text) => {
      if (text.trim()) {
        setInput("");
        sendMessage(text);
      }
    },
  });

  // PDF export
  const exportPdf = useCallback(() => {
    exportChatToPdf(messages, locale);
  }, [messages, locale]);

  // Scroll tracking
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 120);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Auto-scroll when messages change (only if already near bottom)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distFromBottom < 200) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBtn(false);
  };

  // Greeting
  useEffect(() => {
    if (messages.length === 0 && !hasGreeted) {
      setHasGreeted(true);
      addMessage({ role: "assistant", content: t("chat.greeting") });
    }
  }, [messages.length, hasGreeted, addMessage, t]);

  // Copy chat
  const copyChat = useCallback(async () => {
    const isRu = locale === "ru";
    const text = messages
      .filter((m) => !m.isLoading && m.content.trim())
      .map((m) => `${m.role === "user" ? (isRu ? "Вы" : "You") : "MedNavigator"}: ${m.content}`)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // fallback: select the text
    }
  }, [messages, locale]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;
      setInput("");

      addMessage({ role: "user", content: content.trim() });
      addMessage({ role: "assistant", content: "", isLoading: true });
      setLoading(true);

      // Scroll to show loading indicator
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

      try {
        const currentMessages = useChatStore.getState().messages;
        const apiMessages = selectApiMessages(currentMessages.filter((m) => !m.isLoading));

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
          isNew: true,
          urgency: data.urgency,
          recommendedSpecialist: data.recommendedSpecialist ?? undefined,
          followUpQuestions: data.followUpQuestions,
          recommendations: data.recommendations,
        });

        if (data.sessionMemory) updateMemory(data.sessionMemory);

        // TTS: speak AI response in voice mode
        if (voiceMode && data.message) {
          speakTTS(data.message, locale);
        }
      } catch (err) {
        console.error("[ChatShell]", err);
        updateLastAssistantMessage({
          content: locale === "ru"
            ? "Извините, произошла ошибка. Попробуйте ещё раз."
            : "Sorry, an error occurred. Please try again.",
          isLoading: false,
          isNew: true,
        });
      } finally {
        setLoading(false);
      }
    },
    [isLoading, addMessage, updateLastAssistantMessage, updateMemory, setLoading, locale]
  );

  const handleOptionSelect = useCallback((_qId: string, value: string) => sendMessage(value), [sendMessage]);
  const handleStarterSelect = useCallback((s: string) => sendMessage(s), [sendMessage]);

  // Image/file upload — reads image, calls vision API, injects extracted text into chat
  const handleFileAttach = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) return;

      setImageAnalyzing(true);
      try {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const result = ev.target?.result as string;
            resolve(result.split(",")[1]);
          };
          reader.readAsDataURL(file);
        });

        const res = await fetch("/api/vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type, language: locale }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.text) {
          const prefix =
            locale === "ru"
              ? `[Загружен медицинский документ: ${file.name}]\n\n${data.text}`
              : `[Uploaded medical document: ${file.name}]\n\n${data.text}`;
          sendMessage(prefix);
        }
      } catch (err) {
        console.error("[FileUpload]", err);
      } finally {
        setImageAnalyzing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [locale, sendMessage]
  );

  const starters = ta("chat.quickStarters");
  const showStarters = messages.length <= 1 && !isLoading;

  return (
    <div className="flex h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Desktop sidebar */}
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

      {/* Mobile sidebar */}
      <MobileSidebar open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 lg:hidden"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
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
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t("chat.title")}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{t("chat.subtitle")}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Copy chat button */}
            <button
              onClick={copyChat}
              title={locale === "ru" ? "Скопировать чат" : "Copy chat"}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>

            {/* PDF export button */}
            {messages.filter((m) => !m.isLoading && m.content.trim()).length > 1 && (
              <button
                onClick={exportPdf}
                title={locale === "ru" ? "Сохранить как PDF" : "Save as PDF"}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <FileDown className="h-4 w-4" />
              </button>
            )}

            {/* Voice mode toggle — TTS on/off */}
            {voiceSupported && (
              <button
                onClick={() => { setVoiceMode((v) => !v); if (voiceMode) stopTTS(); }}
                title={voiceMode ? (locale === "ru" ? "Выкл. голос" : "Disable voice") : (locale === "ru" ? "Вкл. голосовой режим" : "Enable voice mode")}
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                  voiceMode
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                }`}
              >
                {voiceMode ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
            )}

            {/* Context panel toggle */}
            <button
              onClick={() => setShowContext((v) => !v)}
              className={`hidden h-8 w-8 items-center justify-center rounded-xl transition-colors lg:flex ${
                showContext
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              }`}
            >
              <PanelRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Emergency bar */}
        <div className="flex items-center gap-2 bg-red-50 px-4 py-2 dark:bg-red-950/30">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />
          <p className="text-xs text-red-600 dark:text-red-400">{t("chat.emergency")}</p>
        </div>

        {/* Messages + context */}
        <div className="flex flex-1 overflow-hidden">
          {/* Scroll area */}
          <div className="relative flex flex-1 flex-col overflow-hidden">
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
            >
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <ChatMessageBubble
                    key={msg.id}
                    message={msg}
                    onOptionSelect={handleOptionSelect}
                    isLast={i === messages.length - 1}
                    onTypingDone={markMessageRead}
                    onRate={msg.role === "assistant" ? rateMessage : undefined}
                  />
                ))}
              </AnimatePresence>

              {showStarters && starters.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="pl-9"
                >
                  <QuickStarterChips starters={starters} onSelect={handleStarterSelect} />
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Scroll-to-bottom button */}
            <AnimatePresence>
              {showScrollBtn && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 8 }}
                  transition={{ duration: 0.18 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-24 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                  <ChevronDown className="h-5 w-5" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Hidden file input for image upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Input */}
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={() => sendMessage(input)}
              onFileAttach={handleFileAttach}
              isLoading={isLoading || imageAnalyzing}
              isListening={isListening}
              voiceSupported={voiceSupported}
              onVoiceToggle={toggleVoice}
            />
          </div>

          {/* Context panel */}
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
