"use client";

import { useI18n, type Locale } from "@/lib/i18n";
import { motion } from "framer-motion";

const LOCALES: { code: Locale; label: string }[] = [
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
];

interface LanguageSwitcherProps {
  variant?: "pill" | "minimal";
}

export function LanguageSwitcher({ variant = "pill" }: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n();

  if (variant === "minimal") {
    return (
      <div className="flex items-center gap-1">
        {LOCALES.map(({ code, label }) => (
          <button
            key={code}
            onClick={() => setLocale(code)}
            className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
              locale === code
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative flex items-center rounded-full border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800/60">
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLocale(code)}
          className="relative z-10 min-w-[36px] rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
        >
          {locale === code && (
            <motion.span
              layoutId="locale-pill"
              className="absolute inset-0 rounded-full bg-white shadow-sm dark:bg-slate-700"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span
            className={`relative z-10 ${
              locale === code
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}
