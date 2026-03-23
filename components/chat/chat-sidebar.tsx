"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Home,
  Shield,
  Building2,
  MessageSquare,
  Clock,
  X,
  ChevronRight,
} from "lucide-react";
import { useChatStore } from "@/lib/store/chat";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

interface ChatSidebarProps {
  onClose?: () => void;
}

export function ChatSidebar({ onClose }: ChatSidebarProps) {
  const { t } = useI18n();
  const { history, reset } = useChatStore();

  const navLinks = [
    { href: "/", icon: Home, label: t("nav.howItWorks").split(" ")[0] === "Как" ? "Главная" : "Home" },
    { href: "/safety", icon: Shield, label: t("nav.safety") },
    { href: "/clinics", icon: Building2, label: t("nav.clinics") },
  ];

  const handleNewChat = () => {
    reset();
    onClose?.();
  };

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
            F
          </div>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            MedNavigator
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* New chat button */}
      <div className="px-3 pb-3">
        <button
          onClick={handleNewChat}
          className="flex w-full items-center gap-2 rounded-xl border border-dashed border-blue-200 bg-blue-50/60 px-3 py-2.5 text-sm font-medium text-blue-600 transition-all hover:border-blue-300 hover:bg-blue-50 dark:border-blue-800/50 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-950/30"
        >
          <Plus className="h-4 w-4" />
          {t("chat.newChat")}
        </button>
      </div>

      <div className="mx-3 border-t border-slate-100 dark:border-slate-800" />

      {/* Chat history */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {history.length > 0 ? (
          <div className="space-y-1">
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-600">
              {t("chat.title") === "Медицинская навигация" ? "История" : "History"}
            </p>
            {history.map((session, i) => (
              <motion.button
                key={session.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => {
                  /* restore session (future) */
                }}
                className="group flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 group-hover:text-blue-400 dark:text-slate-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                    {session.preview}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-600">
                    <Clock className="h-3 w-3" />
                    {formatTime(session.timestamp)}
                    <span className="ml-1 opacity-60">·</span>
                    <span className="opacity-60">{session.messageCount} msg</span>
                  </p>
                </div>
                <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-200 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-700" />
              </motion.button>
            ))}
          </div>
        ) : (
          <p className="px-2 text-xs text-slate-400 dark:text-slate-600 italic">
            {t("chat.title") === "Медицинская навигация"
              ? "История пуста — начните новый разговор"
              : "No history — start a new conversation"}
          </p>
        )}
      </div>

      <div className="mx-3 border-t border-slate-100 dark:border-slate-800" />

      {/* Navigation */}
      <div className="px-3 py-3 space-y-1">
        {navLinks.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>

      {/* Language switcher */}
      <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
        <LanguageSwitcher variant="pill" />
      </div>
    </div>
  );
}

// Mobile sidebar overlay
export function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />
          {/* Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-64 shadow-xl lg:hidden"
          >
            <ChatSidebar onClose={onClose} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}
