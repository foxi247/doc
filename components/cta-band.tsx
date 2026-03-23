"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function CTABand() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { t } = useI18n();

  const isRu = t("nav.getStarted") === "Начать чат";

  return (
    <section className="py-20" ref={ref}>
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl gradient-brand p-10 text-center text-white md:p-16"
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)" }}
            aria-hidden="true"
          />
          <div className="relative z-10 mx-auto max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-xs font-semibold text-white/90">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {t("safety.notADoctor")}
            </div>

            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              {isRu ? "Готовы разобраться с симптомами?" : "Ready to understand your symptoms?"}
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-white/80">
              {isRu
                ? "MedNavigator AI поможет организовать информацию о здоровье и прийти к врачу подготовленным."
                : "MedNavigator AI helps you organize your health information and walk into appointments prepared."}
            </p>

            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/chat"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-lg transition-all duration-200 hover:-translate-y-px hover:bg-blue-50"
              >
                {t("nav.getStarted")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/clinics"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/15 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/25"
              >
                {t("nav.clinics")}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
