"use client";

import { motion } from "framer-motion";
import type { FollowUpQuestion } from "@/lib/ai/chat-types";

interface OptionChipsProps {
  question: FollowUpQuestion;
  onSelect: (questionId: string, value: string) => void;
  disabled?: boolean;
}

export function OptionChips({ question, onSelect, disabled }: OptionChipsProps) {
  if (question.type === "free-text" || !question.options?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mt-2 space-y-2"
    >
      <p className="text-xs text-muted-foreground">{question.question}</p>
      <div className="flex flex-wrap gap-2">
        {question.options.map((opt, i) => (
          <motion.button
            key={opt}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => !disabled && onSelect(question.id, opt)}
            disabled={disabled}
            className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 transition-all hover:bg-blue-100 hover:border-blue-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/40"
          >
            {opt}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

interface QuickStarterChipsProps {
  starters: string[];
  onSelect: (value: string) => void;
  label?: string;
}

export function QuickStarterChips({ starters, onSelect, label }: QuickStarterChipsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-2"
    >
      {label && <p className="text-xs text-muted-foreground">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {starters.map((s, i) => (
          <motion.button
            key={s}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            onClick={() => onSelect(s)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-600 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
          >
            {s}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
