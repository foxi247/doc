"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { MascotFDoctor } from "@/components/chat/mascot-f-doctor";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

export default function Hero() {
  const { t, ta } = useI18n();
  const chips = ta("hero.chips");

  return (
    <section className="relative overflow-hidden bg-white dark:bg-slate-950">
      {/* Soft background gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-blue-50 opacity-60 blur-3xl dark:bg-blue-950/20" />
      </div>

      <div className="container-custom relative py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Left — copy */}
          <div className="space-y-6">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400">
                <Shield className="h-3 w-3" />
                {t("hero.badge")}
              </span>
            </motion.div>

            <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="show" className="text-4xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              {t("hero.headline").split("\n").map((line, i) => (
                <span key={i} className={i === 1 ? "gradient-text block" : "block"}>
                  {line}
                </span>
              ))}
            </motion.h1>

            <motion.p custom={2} variants={fadeUp} initial="hidden" animate="show" className="max-w-md text-lg text-slate-500 dark:text-slate-400">
              {t("hero.subheadline")}
            </motion.p>

            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="flex flex-wrap items-center gap-3">
              <Link
                href="/chat"
                className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
              >
                {t("hero.ctaStart")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {t("hero.ctaHow")}
              </Link>
            </motion.div>

            <motion.p custom={4} variants={fadeUp} initial="hidden" animate="show" className="text-xs text-slate-400 dark:text-slate-600">
              {t("hero.disclaimer")}
            </motion.p>
          </div>

          {/* Right — chat preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            <ChatPreview chips={chips} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ChatPreview({ chips }: { chips: string[] }) {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-sm overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white">F</div>
        <div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">MedNavigator AI</p>
          <p className="text-[10px] text-green-500">● Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-3 px-4 py-4">
        <div className="flex items-end gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">F</div>
          <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {t("hero.chatGreeting")}
          </div>
        </div>

        <div className="flex justify-end">
          <div className="max-w-[70%] rounded-2xl rounded-br-sm bg-blue-600 px-3 py-2 text-xs text-white">
            {chips[0] || "Headache"}
          </div>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">F</div>
          <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            How long have you had this? Is it on one side or both?
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pl-8">
          {["One side", "Both sides"].map((opt) => (
            <span key={opt} className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] text-blue-700">
              {opt}
            </span>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-slate-100 px-3 py-3 dark:border-slate-800">
        <div className="mb-2 flex justify-center">
          <MascotFDoctor isTyping={false} size={36} />
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
          <p className="flex-1 text-[11px] text-slate-400">{t("hero.chatPlaceholder")}</p>
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600">
            <ArrowRight className="h-3 w-3 text-white" />
          </div>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-slate-400">{t("hero.chatDisclaimer")}</p>
      </div>
    </div>
  );
}
