"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Stethoscope } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/lib/store/chat";
import { OptionChips } from "./option-chips";
import { RecommendationCards } from "./recommendation-cards";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const URGENCY_STYLES = {
  high: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
  medium: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  low: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900",
};

interface ChatMessageProps {
  message: ChatMessageType;
  onOptionSelect?: (questionId: string, value: string) => void;
  isLast?: boolean;
  onTypingDone?: (id: string) => void;
}

export function ChatMessageBubble({ message, onOptionSelect, isLast, onTypingDone }: ChatMessageProps) {
  const { t } = useI18n();
  const isUser = message.role === "user";

  if (message.isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end gap-2"
      >
        <AssistantAvatar />
        <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm dark:bg-slate-800">
          <ECGLoadingAnimation />
        </div>
      </motion.div>
    );
  }

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-blue-600 px-4 py-2.5 text-sm text-white shadow-sm">
          {message.content}
        </div>
      </motion.div>
    );
  }

  // Assistant message
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-end gap-2"
    >
      <AssistantAvatar />
      <div className="max-w-[85%] space-y-2">
        <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
          {message.isNew ? (
            <TypewriterText
              text={message.content}
              onDone={() => onTypingDone?.(message.id)}
            />
          ) : (
            <MessageContent content={message.content} />
          )}
        </div>

        {/* Urgency + specialist badges */}
        {(message.urgency || message.recommendedSpecialist) && !message.isNew && (
          <div className="flex flex-wrap gap-2 pl-1">
            {message.urgency && (
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  URGENCY_STYLES[message.urgency]
                )}
              >
                {message.urgency === "high" && <AlertTriangle className="h-3 w-3" />}
                {t(`chat.urgency.${message.urgency}`)}
              </span>
            )}
            {message.recommendedSpecialist && (
              <span className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                <Stethoscope className="h-3 w-3" />
                {message.recommendedSpecialist}
              </span>
            )}
          </div>
        )}

        {/* Follow-up question chips — only on last message and after typing done */}
        {isLast && !message.isNew && message.followUpQuestions?.map((q) =>
          q.type !== "free-text" ? (
            <OptionChips
              key={q.id}
              question={q}
              onSelect={onOptionSelect ?? (() => {})}
            />
          ) : null
        )}

        {/* Recommendation cards */}
        {!message.isNew && message.recommendations && (
          <RecommendationCards
            hospitals={message.recommendations.hospitals}
            doctors={message.recommendations.doctors}
          />
        )}
      </div>
    </motion.div>
  );
}

// ─── Typewriter ──────────────────────────────────────────────────────────────

const TYPEWRITER_SPEED = 14; // ms per character
const INSTANT_THRESHOLD = 400; // chars beyond this show instantly

function TypewriterText({ text, onDone }: { text: string; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (text.length > INSTANT_THRESHOLD) {
      setDisplayed(text);
      setDone(true);
      onDone?.();
      return;
    }

    let i = 0;
    setDisplayed("");

    const tick = () => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i < text.length) {
        timer = setTimeout(tick, TYPEWRITER_SPEED);
      } else {
        setDone(true);
        onDone?.();
      }
    };

    let timer = setTimeout(tick, TYPEWRITER_SPEED);
    return () => clearTimeout(timer);
  }, [text, onDone]);

  return (
    <span>
      <MessageContent content={displayed} />
      {!done && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.7, repeat: Infinity }}
          className="inline-block w-px h-4 ml-0.5 bg-blue-500 align-middle"
        />
      )}
    </span>
  );
}

// ─── ECG loading animation ────────────────────────────────────────────────────

function ECGLoadingAnimation() {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <svg
        width="72"
        height="28"
        viewBox="0 0 72 28"
        fill="none"
        className="overflow-visible"
      >
        {/* Static lead-in */}
        <motion.polyline
          points="0,14 10,14 14,14 18,4 22,24 26,14 36,14 40,14 44,4 48,24 52,14 62,14 72,14"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0.3 }}
          animate={{ pathLength: [0, 1, 1, 0], opacity: [0.3, 1, 1, 0.3] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.5, 0.8, 1],
          }}
        />
      </svg>
      <motion.span
        className="text-xs text-slate-400 dark:text-slate-500"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        …
      </motion.span>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function AssistantAvatar() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm">
      F
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  return (
    <>
      {content.split("\n").map((line, i, arr) => (
        <span key={i}>
          {line}
          {i < arr.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}
