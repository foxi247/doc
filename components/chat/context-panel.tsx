"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MapPin, FileText, Stethoscope, Activity, Tag } from "lucide-react";
import type { SessionMemory } from "@/lib/ai/chat-types";
import { useI18n } from "@/lib/i18n";

const URGENCY_COLORS = {
  high: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
  medium: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  low: "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400",
};

interface ContextPanelProps {
  memory: SessionMemory;
}

export function ContextPanel({ memory }: ContextPanelProps) {
  const { t } = useI18n();
  const isEmpty =
    memory.symptoms.length === 0 &&
    !memory.location.city &&
    !memory.location.country &&
    memory.files.length === 0 &&
    !memory.specialist &&
    !memory.urgency;

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {t("chat.context.title")}
      </p>

      {isEmpty ? (
        <p className="text-xs text-slate-400 dark:text-slate-600 italic">
          {t("chat.context.empty")}
        </p>
      ) : (
        <div className="space-y-3">
          <ContextSection
            icon={<Tag className="h-3.5 w-3.5" />}
            label={t("chat.context.symptoms")}
            show={memory.symptoms.length > 0}
          >
            <div className="flex flex-wrap gap-1">
              {memory.symptoms.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                >
                  {s}
                </span>
              ))}
            </div>
          </ContextSection>

          <ContextSection
            icon={<Stethoscope className="h-3.5 w-3.5" />}
            label={t("chat.context.specialist")}
            show={!!memory.specialist}
          >
            <p className="text-xs text-slate-600 dark:text-slate-300">{memory.specialist}</p>
          </ContextSection>

          <ContextSection
            icon={<Activity className="h-3.5 w-3.5" />}
            label={t("chat.context.urgency")}
            show={!!memory.urgency}
          >
            {memory.urgency && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${URGENCY_COLORS[memory.urgency]}`}
              >
                {t(`chat.urgency.${memory.urgency}`)}
              </span>
            )}
          </ContextSection>

          <ContextSection
            icon={<MapPin className="h-3.5 w-3.5" />}
            label={t("chat.context.location")}
            show={!!(memory.location.city || memory.location.country)}
          >
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {[memory.location.city, memory.location.country].filter(Boolean).join(", ")}
            </p>
          </ContextSection>

          <ContextSection
            icon={<FileText className="h-3.5 w-3.5" />}
            label={t("chat.context.files")}
            show={memory.files.length > 0}
          >
            <div className="space-y-0.5">
              {memory.files.map((f) => (
                <p key={f} className="truncate text-xs text-slate-600 dark:text-slate-300">
                  {f}
                </p>
              ))}
            </div>
          </ContextSection>
        </div>
      )}
    </div>
  );
}

function ContextSection({
  icon,
  label,
  show,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  show: boolean;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-1"
        >
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            {icon}
            {label}
          </div>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
