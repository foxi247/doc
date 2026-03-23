"use client";

import { useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip, Mic, MicOff, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
  disabled?: boolean;
  imageAnalyzing?: boolean;
  // Voice props
  isListening?: boolean;
  voiceSupported?: boolean;
  onVoiceToggle?: () => void;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onFileChange,
  isLoading = false,
  disabled = false,
  imageAnalyzing = false,
  isListening = false,
  voiceSupported = false,
  onVoiceToggle,
}: ChatInputProps) {
  const { t } = useI18n();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading && !disabled) onSend();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFileChange?.(e);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const canSend = value.trim().length > 0 && !isLoading && !disabled;

  return (
    <div className="px-3 pb-4 pt-2">
      <div className="relative flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition-shadow focus-within:border-blue-300 focus-within:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:focus-within:border-blue-700">
        {/* File upload — label wraps hidden input for reliable cross-browser/mobile support */}
        {onFileChange && (
          <label
            className={`mb-1.5 shrink-0 cursor-pointer rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 ${
              isLoading || disabled || imageAnalyzing ? "pointer-events-none opacity-50" : ""
            }`}
            title={t("chat.uploadFile")}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="sr-only"
              onChange={handleFileChange}
              disabled={isLoading || disabled || imageAnalyzing}
            />
            {imageAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </label>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? (t("chat.inputPlaceholder").includes("Опиш") ? "Слушаю..." : "Listening...") : t("chat.inputPlaceholder")}
          rows={1}
          disabled={isLoading || disabled}
          // font-size >= 16px prevents iOS auto-zoom on focus
          style={{ fontSize: "16px" }}
          className="max-h-[140px] flex-1 resize-none bg-transparent py-1 text-slate-700 placeholder-slate-400 outline-none dark:text-slate-200 dark:placeholder-slate-500"
        />

        {/* Mic button — inside input row */}
        {voiceSupported && onVoiceToggle && (
          <button
            type="button"
            onClick={onVoiceToggle}
            disabled={isLoading || disabled}
            title={isListening ? "Остановить" : "Голосовой ввод"}
            className={`mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all ${
              isListening
                ? "bg-red-100 text-red-500 animate-pulse dark:bg-red-900/40"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            } disabled:opacity-40`}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        )}

        <motion.button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          whileTap={{ scale: 0.9 }}
          className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
        </motion.button>
      </div>

      <p className="mt-2 text-center text-[11px] text-slate-400 dark:text-slate-600">
        {t("chat.disclaimer")}
      </p>
    </div>
  );
}

