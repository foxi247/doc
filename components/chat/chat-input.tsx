"use client";

import { useRef, useEffect, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip } from "lucide-react";
import { MascotFDoctor } from "./mascot-f-doctor";
import { useI18n } from "@/lib/i18n";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileAttach?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onFileAttach,
  isLoading = false,
  disabled = false,
}: ChatInputProps) {
  const { t } = useI18n();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isTyping = value.trim().length > 0;

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

  const canSend = value.trim().length > 0 && !isLoading && !disabled;

  return (
    <div className="px-3 pb-4 pt-1">
      {/* Mascot walks along this bar when thinking */}
      <div className="relative mb-1 flex h-12 w-full items-center justify-center overflow-visible">
        <MascotFDoctor isTyping={isTyping} isThinking={isLoading} size={44} />
      </div>

      <div className="relative flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition-shadow focus-within:border-blue-300 focus-within:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:focus-within:border-blue-700">
        {onFileAttach && (
          <button
            type="button"
            onClick={onFileAttach}
            disabled={isLoading || disabled}
            className="mb-1.5 shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            title={t("chat.uploadFile")}
          >
            <Paperclip className="h-4 w-4" />
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("chat.inputPlaceholder")}
          rows={1}
          disabled={isLoading || disabled}
          // font-size >= 16px prevents iOS auto-zoom on focus
          style={{ fontSize: "16px" }}
          className="max-h-[140px] flex-1 resize-none bg-transparent py-1 text-slate-700 placeholder-slate-400 outline-none dark:text-slate-200 dark:placeholder-slate-500"
        />

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
