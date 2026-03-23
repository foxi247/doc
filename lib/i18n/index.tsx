"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import en from "./messages/en.json";
import ru from "./messages/ru.json";

export type Locale = "en" | "ru";

const messages: Record<Locale, Record<string, unknown>> = { en, ru };

function get(obj: unknown, path: string): string {
  const result = path.split(".").reduce<unknown>((o, k) => {
    if (o && typeof o === "object") return (o as Record<string, unknown>)[k];
    return undefined;
  }, obj);
  return typeof result === "string" ? result : path;
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  /** Returns string array for array values */
  ta: (key: string) => string[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ru");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("mednavigator-locale") as Locale | null;
      if (stored && (stored === "en" || stored === "ru")) {
        setLocaleState(stored);
      } else {
        // Auto-detect from browser
        const lang = navigator.language.slice(0, 2).toLowerCase();
        if (lang === "ru") setLocaleState("ru");
        else setLocaleState("en");
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem("mednavigator-locale", l);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string) => get(messages[locale], key),
    [locale]
  );

  const ta = useCallback(
    (key: string): string[] => {
      const result = key.split(".").reduce<unknown>((o, k) => {
        if (o && typeof o === "object") return (o as Record<string, unknown>)[k];
        return undefined;
      }, messages[locale] as unknown);
      if (Array.isArray(result)) return result as string[];
      return [];
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, ta }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
