"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { MessageSquare, HelpCircle, Navigation } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const STEP_ICONS = [MessageSquare, HelpCircle, Navigation];
const STEP_COLORS = [
  { bg: "bg-blue-50", border: "border-blue-100", icon: "text-blue-600", number: "text-blue-100" },
  { bg: "bg-teal-50", border: "border-teal-100", icon: "text-teal-600", number: "text-teal-100" },
  { bg: "bg-violet-50", border: "border-violet-100", icon: "text-violet-600", number: "text-violet-100" },
];

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { t } = useI18n();

  const steps = [0, 1, 2].map((i) => ({
    number: `0${i + 1}`,
    title: t(`howItWorks.steps.${i}.title`),
    desc: t(`howItWorks.steps.${i}.desc`),
  }));

  return (
    <section id="how-it-works" className="section-padding bg-white dark:bg-slate-950" ref={ref}>
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <span className="mb-4 inline-block rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-400">
            {t("howItWorks.subtitle")}
          </span>
          <h2 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
            {t("howItWorks.title")}
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => {
            const colors = STEP_COLORS[i] ?? STEP_COLORS[0];
            const Icon = STEP_ICONS[i] ?? MessageSquare;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl border ${colors.bg} ${colors.border}`}>
                  <Icon className={`h-5 w-5 ${colors.icon}`} aria-hidden="true" />
                </div>
                <span className={`absolute right-4 top-4 text-4xl font-black ${colors.number}`} aria-hidden="true">
                  {step.number}
                </span>
                <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-slate-100">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {step.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
