"use client";

import { ShieldCheck, AlertOctagon, XCircle, CheckCircle2, Scale, Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function SafetyPage() {
  const { locale } = useI18n();
  const isRu = locale === "ru";

  const doesList = isRu
    ? [
        "Организует и структурирует описание симптомов",
        "Предлагает тип специалиста для консультации",
        "Даёт общую оценку срочности (низкая / средняя / высокая)",
        "Генерирует краткое резюме для врача",
        "Задаёт уточняющие вопросы для подготовки к приёму",
        "Определяет симптомы, требующие срочного внимания",
      ]
    : [
        "Organizes and structures symptom descriptions submitted by users",
        "Suggests what type of medical specialist may be appropriate to consult",
        "Provides broad urgency guidance (low, medium, high) based on described patterns",
        "Generates a concise, neutral summary for sharing with a licensed clinician",
        "Asks clarifying questions to help users prepare for their appointment",
        "Identifies when symptoms may warrant urgent professional attention",
      ];

  const doesNotList = isRu
    ? [
        "Ставить диагноз любому заболеванию или расстройству",
        "Рекомендовать конкретные лекарства или дозировки",
        "Составлять планы лечения",
        "Интерпретировать результаты клинических анализов или снимков",
        "Заменять оценку лицензированного медицинского специалиста",
        "Гарантировать точность любых медицинских выводов",
        "Быть лицензированным медицинским устройством",
        "Оказывать экстренную медицинскую помощь",
      ]
    : [
        "Diagnose any medical condition, disease, or disorder",
        "Recommend or suggest specific medications or dosages",
        "Create or provide a treatment plan of any kind",
        "Interpret clinical test results or imaging findings",
        "Replace the evaluation of a licensed healthcare professional",
        "Guarantee the accuracy of any health-related output",
        "Act as a licensed medical device under any regulatory framework",
        "Provide emergency medical services or triage",
      ];

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 bg-hero-gradient">
        <div className="container-custom text-center max-w-3xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-7 h-7 text-teal-600" aria-hidden="true" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-semibold mb-4">
            {isRu ? "Безопасность и политика" : "Safety & Compliance"}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-5">
            {isRu ? "Наши обязательства по безопасности" : "Our safety commitments"}
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {isRu
              ? "MedNavigator AI создан с чёткими и неизменными границами. На этой странице описано, что такое этот сервис, чем он не является и как использовать его ответственно."
              : "MedNavigator AI is built with clear, non-negotiable boundaries. This page explains exactly what this platform is, what it is not, and how to use it responsibly."}
          </p>
        </div>
      </section>

      {/* Emergency notice */}
      <section className="py-8 bg-amber-50 border-y border-amber-200">
        <div className="container-custom">
          <div className="flex items-start gap-3 max-w-3xl mx-auto" role="alert">
            <AlertOctagon className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-amber-900 mb-1">
                {isRu ? "Экстренные ситуации" : "Emergency situations"}
              </p>
              <p className="text-sm text-amber-800 leading-relaxed">
                {isRu
                  ? "Если вы считаете, что у вас медицинская экстренная ситуация — включая боль в груди, затруднённое дыхание, признаки инсульта, сильное кровотечение или потерю сознания — "
                  : "If you believe you are experiencing a medical emergency — including chest pain, difficulty breathing, signs of stroke, severe bleeding, or loss of consciousness — "}
                <strong>{isRu ? "не используйте этот сервис" : "do not use this platform"}</strong>.{" "}
                {isRu ? "Немедленно вызовите скорую помощь. В России — 103 или 112." : "Contact your local emergency services immediately."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="section-padding bg-white">
        <div className="container-custom max-w-4xl">
          {/* Not a medical device */}
          <div className="rounded-2xl border border-border bg-muted p-8 mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-xl font-bold text-foreground">
                {isRu ? "Не является лицензированным медицинским устройством" : "Not a licensed medical device"}
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {isRu
                ? "MedNavigator AI — программный продукт, предназначенный исключительно для информационных и навигационных целей. Он не классифицируется и не сертифицирован как медицинское устройство."
                : "MedNavigator AI is a software product designed for informational and navigational purposes only. It is not classified as, certified as, or intended to function as a medical device."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {/* Does */}
            <div className="rounded-2xl border border-teal-100 bg-white p-6">
              <div className="flex items-center gap-2 mb-5">
                <CheckCircle2 className="w-5 h-5 text-teal-600" aria-hidden="true" />
                <h3 className="font-semibold text-foreground">
                  {isRu ? "Что делает MedNavigator AI" : "What MedNavigator AI does"}
                </h3>
              </div>
              <ul className="space-y-3">
                {doesList.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Does not */}
            <div className="rounded-2xl border border-border bg-white p-6">
              <div className="flex items-center gap-2 mb-5">
                <XCircle className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                <h3 className="font-semibold text-foreground">
                  {isRu ? "Что он НЕ делает" : "What it does not do"}
                </h3>
              </div>
              <ul className="space-y-3">
                {doesNotList.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <XCircle className="w-4 h-4 text-muted-foreground/60 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Privacy */}
          <div className="rounded-2xl border border-border bg-white p-8 mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-brand-600" aria-hidden="true" />
              <h2 className="text-xl font-bold text-foreground">
                {isRu ? "Конфиденциальность и данные" : "Privacy & data handling"}
              </h2>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                {isRu
                  ? "Все данные о симптомах обрабатываются на стороне сервера и не хранятся и не используются для обучения. Мы не создаём постоянные медицинские профили пользователей."
                  : "All symptom data submitted to MedNavigator AI is processed server-side and is not stored or used for training purposes. We do not build persistent health profiles from demo submissions."}
              </p>
              <p>
                {isRu
                  ? "API-ключи и учётные данные никогда не передаются клиенту. Все взаимодействия с моделью происходят на стороне сервера через защищённые переменные окружения."
                  : "API keys and credentials are never exposed to the client. All model interactions occur server-side through secured environment variables."}
              </p>
              <p>
                {isRu
                  ? "Рекомендуем не включать персональные данные, помимо необходимых для описания симптомов."
                  : "We recommend users avoid including personally identifiable information beyond what is necessary to describe their symptoms."}
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="rounded-2xl bg-muted border border-border p-6">
            <h3 className="font-semibold text-foreground mb-3">
              {isRu ? "Полный медицинский отказ от ответственности" : "Full medical disclaimer"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isRu
                ? "MedNavigator AI предоставляется «как есть» исключительно в информационных и навигационных целях. Выходные данные платформы не являются медицинскими советами, диагнозами, рекомендациями по лечению или клинической оценкой. Всегда обращайтесь к квалифицированному медицинскому специалисту. Никогда не игнорируйте профессиональную медицинскую консультацию и не откладывайте её из-за информации, полученной от этой платформы."
                : "MedNavigator AI is provided \"as is\" for informational and navigational purposes only. The outputs of this platform do not constitute medical advice, diagnosis, treatment recommendations, or clinical evaluation. Users should always seek the advice of a qualified healthcare professional with any questions they may have regarding a medical condition. Never disregard professional medical advice or delay seeking it because of something read or generated by this platform."}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
