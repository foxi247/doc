"use client";

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
}

export function ChatMessageBubble({ message, onOptionSelect, isLast }: ChatMessageProps) {
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
          <ThinkingDots />
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
          <MessageContent content={message.content} />
        </div>

        {/* Urgency + specialist */}
        {(message.urgency || message.recommendedSpecialist) && (
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

        {/* Follow-up question chips */}
        {isLast && message.followUpQuestions?.map((q) =>
          q.type !== "free-text" ? (
            <OptionChips
              key={q.id}
              question={q}
              onSelect={onOptionSelect ?? (() => {})}
              disabled={!isLast}
            />
          ) : null
        )}

        {/* Recommendation cards */}
        {message.recommendations && (
          <RecommendationCards
            hospitals={message.recommendations.hospitals}
            doctors={message.recommendations.doctors}
          />
        )}
      </div>
    </motion.div>
  );
}

function AssistantAvatar() {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm">
      F
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  // Render newlines as breaks
  return (
    <>
      {content.split("\n").map((line, i) => (
        <span key={i}>
          {line}
          {i < content.split("\n").length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600"
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}
