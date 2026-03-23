"use client";

import { useCallback, useRef, useEffect } from "react";

export function useSpeechOutput() {
  const isSpeakingRef = useRef(false);

  const speak = useCallback((text: string, locale: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Strip markdown-like characters for cleaner speech
    const clean = text
      .replace(/[•\*#_\[\]]/g, "")
      .replace(/\n+/g, ". ")
      .trim()
      .slice(0, 800); // limit length to avoid very long TTS

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = locale === "ru" ? "ru-RU" : "en-US";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => { isSpeakingRef.current = true; };
    utterance.onend = () => { isSpeakingRef.current = false; };
    utterance.onerror = () => { isSpeakingRef.current = false; };

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return { speak, stop };
}
