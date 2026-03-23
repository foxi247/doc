"use client";

import Link from "next/link";
import { ArrowRight, Building2, Clock, BarChart3, Users, ClipboardCheck, Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function ClinicsPage() {
  const { locale } = useI18n();
  const isRu = locale === "ru";

  const features = isRu
    ? [
        {
          icon: ClipboardCheck,
          title: "Умный предварительный интейк",
          description: "Пациент описывает симптомы до приёма. Врач получает структурированные данные — не пустую форму.",
        },
        {
          icon: Clock,
          title: "Более эффективные приёмы",
          description: "Врач тратит меньше времени на сбор анамнеза и больше — на клиническую оценку.",
        },
        {
          icon: BarChart3,
          title: "Стандартизированные данные",
          description: "Каждый интейк генерирует структурированные данные — удобно для анализа и маршрутизации.",
        },
        {
          icon: Users,
          title: "Лучший опыт для пациента",
          description: "Подготовленный пациент приходит менее тревожным и более готовым к диалогу с врачом.",
        },
      ]
    : [
        {
          icon: ClipboardCheck,
          title: "Intelligent pre-consultation intake",
          description: "Patients complete a structured assessment before their appointment. Clinicians receive organized data, not a blank form.",
        },
        {
          icon: Clock,
          title: "Shorter, more productive appointments",
          description: "Clinicians spend less time extracting history and more time on clinical assessment.",
        },
        {
          icon: BarChart3,
          title: "Standardized, analyzable data",
          description: "Every intake generates structured data — making it easy to analyze patient trends and routing patterns.",
        },
        {
          icon: Users,
          title: "Better patient experience",
          description: "Patients who feel organized and informed are less anxious and more engaged during consultations.",
        },
      ];

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-hero-gradient">
        <div className="container-custom text-center max-w-3xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-5">
            <Building2 className="w-7 h-7 text-blue-600" aria-hidden="true" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-xs font-semibold mb-4">
            {isRu ? "Для клиник и партнёров" : "For Clinics & Partners"}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-5">
            {isRu
              ? "Умный слой перед консультацией"
              : "The intelligent layer before the consultation"}
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">
            {isRu
              ? "MedNavigator AI работает как интеллектуальный интейк-слой между пациентами и врачами — улучшает качество подготовки и снижает неэффективность приёмов."
              : "MedNavigator AI acts as a structured intake layer between your patients and clinicians — improving preparation quality and reducing appointment inefficiency."}
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white gradient-brand shadow-brand hover:shadow-brand-lg transition-all duration-200 hover:-translate-y-px"
          >
            {isRu ? "Обсудить партнёрство" : "Request a partnership discussion"}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {isRu ? "Создано для клинического процесса" : "Built for clinical integration"}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {isRu
                ? "Каждая функция разработана с учётом рабочего процесса клиники, а не только опыта пациента."
                : "Every feature is designed with the clinical workflow in mind — not just the patient experience."}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-2xl border border-border bg-white p-6 card-glow"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-4">
                    <Icon className="w-4 h-4 text-brand-600" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="rounded-3xl gradient-brand p-10 text-center text-white md:p-16 max-w-3xl mx-auto">
            <Mail className="w-10 h-10 text-white/80 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              {isRu ? "Готовы обсудить интеграцию?" : "Ready to discuss integration?"}
            </h2>
            <p className="text-white/80 mb-6 leading-relaxed">
              {isRu
                ? "Свяжитесь с нами, и мы обсудим, как MedNavigator AI может улучшить рабочий процесс вашей клиники."
                : "Get in touch and we'll discuss how MedNavigator AI can improve your clinic's workflow."}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-lg transition-all duration-200 hover:-translate-y-px hover:bg-blue-50"
            >
              {isRu ? "Написать нам" : "Contact us"}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
