"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Home, Shield, Building2, MessageSquare,
  Clock, X, ChevronRight, Check, Pencil, Trash2,
} from "lucide-react";
import { useChatStore, type ChatSession } from "@/lib/store/chat";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

interface ChatSidebarProps {
  onClose?: () => void;
}

export function ChatSidebar({ onClose }: ChatSidebarProps) {
  const { t } = useI18n();
  const { messages, history, reset, renameSession, deleteSession } = useChatStore();
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    window.addEventListener("pointerdown", handler);
    return () => window.removeEventListener("pointerdown", handler);
  }, [contextMenu]);

  const isRu = t("chat.title") === "Медицинская навигация";

  const navLinks = [
    { href: "/", icon: Home, label: isRu ? "Главная" : "Home" },
    { href: "/safety", icon: Shield, label: t("nav.safety") },
    { href: "/clinics", icon: Building2, label: t("nav.clinics") },
  ];

  // Derive current session from live messages
  const firstUserMsg = messages.find((m) => m.role === "user" && !m.isLoading);
  const currentSession = firstUserMsg
    ? {
        id: "current",
        name: firstUserMsg.content.slice(0, 55),
        preview: firstUserMsg.content.slice(0, 55),
        timestamp: firstUserMsg.timestamp,
        messageCount: messages.filter((m) => !m.isLoading).length,
      }
    : null;

  const handleNewChat = () => {
    reset();
    onClose?.();
  };

  const openContextMenu = (id: string, e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ id, x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY });
  };

  const startRename = (session: ChatSession) => {
    setContextMenu(null);
    setRenamingId(session.id);
    setRenameValue(session.name);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      renameSession(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const handleDelete = (id: string) => {
    setContextMenu(null);
    deleteSession(id);
  };

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">F</div>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">MedNavigator</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 lg:hidden">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* New chat */}
      <div className="px-3 pb-3">
        <button
          onClick={handleNewChat}
          className="flex w-full items-center gap-2 rounded-xl border border-dashed border-blue-200 bg-blue-50/60 px-3 py-2.5 text-sm font-medium text-blue-600 transition-all hover:border-blue-300 hover:bg-blue-50 dark:border-blue-800/50 dark:bg-blue-950/20 dark:text-blue-400"
        >
          <Plus className="h-4 w-4" />
          {t("chat.newChat")}
        </button>
      </div>

      <div className="mx-3 border-t border-slate-100 dark:border-slate-800" />

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-600">
          {isRu ? "Чаты" : "Chats"}
        </p>

        {/* Current active chat */}
        {currentSession && (
          <SessionItem
            session={currentSession}
            isActive
            renamingId={renamingId}
            renameValue={renameValue}
            onRenameChange={setRenameValue}
            onRenameCommit={commitRename}
            onContextMenu={(e) => openContextMenu(currentSession.id, e)}
            onLongPress={(e) => openContextMenu(currentSession.id, e)}
          />
        )}

        {/* Past sessions */}
        {history.length > 0 ? (
          history.map((session, i) => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={false}
              index={i}
              renamingId={renamingId}
              renameValue={renameValue}
              onRenameChange={setRenameValue}
              onRenameCommit={commitRename}
              onContextMenu={(e) => openContextMenu(session.id, e)}
              onLongPress={(e) => openContextMenu(session.id, e)}
            />
          ))
        ) : (
          !currentSession && (
            <p className="px-2 text-xs italic text-slate-400 dark:text-slate-600">
              {isRu ? "Начните разговор" : "Start a conversation"}
            </p>
          )
        )}
      </div>

      <div className="mx-3 border-t border-slate-100 dark:border-slate-800" />

      {/* Nav links */}
      <div className="space-y-1 px-3 py-3">
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

      {/* Context menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.12 }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ position: "fixed", left: Math.min(contextMenu.x, window.innerWidth - 160), top: contextMenu.y, zIndex: 100 }}
            className="min-w-[148px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
          >
            {contextMenu.id !== "current" && (
              <>
                <button
                  onClick={() => {
                    const s = history.find((h) => h.id === contextMenu.id);
                    if (s) startRename(s);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {isRu ? "Переименовать" : "Rename"}
                </button>
                <button
                  onClick={() => handleDelete(contextMenu.id)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {isRu ? "Удалить" : "Delete"}
                </button>
              </>
            )}
            {contextMenu.id === "current" && (
              <button
                onClick={() => setContextMenu(null)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                {isRu ? "Текущий чат" : "Current chat"}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Session item ─────────────────────────────────────────────────────────── */
function SessionItem({
  session,
  isActive,
  index = 0,
  renamingId,
  renameValue,
  onRenameChange,
  onRenameCommit,
  onContextMenu,
  onLongPress,
}: {
  session: { id: string; name: string; timestamp: number; messageCount: number };
  isActive: boolean;
  index?: number;
  renamingId: string | null;
  renameValue: string;
  onRenameChange: (v: string) => void;
  onRenameCommit: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onLongPress: (e: React.PointerEvent) => void;
}) {
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    pressTimerRef.current = setTimeout(() => onLongPress(e), 600);
  };
  const clearPress = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
  };

  const isRenaming = renamingId === session.id;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onContextMenu={onContextMenu}
      onPointerDown={handlePointerDown}
      onPointerUp={clearPress}
      onPointerLeave={clearPress}
      className={`group relative flex items-start gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
        isActive
          ? "bg-blue-50 dark:bg-blue-950/30"
          : "hover:bg-slate-50 dark:hover:bg-slate-800"
      }`}
    >
      <MessageSquare
        className={`mt-0.5 h-4 w-4 shrink-0 ${
          isActive ? "text-blue-500" : "text-slate-300 group-hover:text-blue-400 dark:text-slate-600"
        }`}
      />
      <div className="min-w-0 flex-1">
        {isRenaming ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onRenameCommit(); if (e.key === "Escape") onRenameCommit(); }}
              className="flex-1 rounded border border-blue-300 bg-white px-1.5 py-0.5 text-xs outline-none dark:border-blue-700 dark:bg-slate-800"
            />
            <button onClick={onRenameCommit} className="text-blue-500 hover:text-blue-700">
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <p className={`truncate text-xs ${isActive ? "font-medium text-blue-700 dark:text-blue-300" : "text-slate-600 dark:text-slate-300"}`}>
            {session.name}
          </p>
        )}
        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-600">
          <Clock className="h-3 w-3" />
          {formatTime(session.timestamp)}
        </p>
      </div>
      {!isRenaming && (
        <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-200 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-700" />
      )}
    </motion.div>
  );
}

/* ─── Mobile overlay ───────────────────────────────────────────────────────── */
export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />
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
