"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle2, Loader2, Activity } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const ContactSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  company: z.string().max(100).optional(),
  message: z.string().min(10).max(2000),
});

type ContactFormData = z.infer<typeof ContactSchema>;

export default function ContactPage() {
  const { locale } = useI18n();
  const isRu = locale === "ru";
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(ContactSchema),
  });

  const onSubmit = async (_data: ContactFormData) => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <>
      <section className="pt-32 pb-20 bg-hero-gradient">
        <div className="container-custom text-center max-w-2xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-xs font-semibold mb-4">
            {isRu ? "Контакты" : "Contact"}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            {isRu ? "Напишите нам" : "Get in touch"}
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {isRu
              ? "Хотите обсудить партнёрство с клиникой, задать вопрос о продукте или узнать о наших планах — напишите нам."
              : "Whether you're interested in a clinic partnership, have a question about the product, or want to learn more about our roadmap — we'd love to hear from you."}
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom max-w-xl mx-auto">
          {submitted ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-teal-600" aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                {isRu ? "Сообщение получено" : "Message received"}
              </h2>
              <p className="text-muted-foreground">
                {isRu
                  ? "Спасибо, что написали нам. Мы ответим в течение 1–2 рабочих дней."
                  : "Thank you for reaching out. Our team will get back to you within 1–2 business days."}
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="rounded-2xl border border-border bg-white shadow-card p-8 space-y-5"
              noValidate
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
                  <Activity className="w-4 h-4 text-white" aria-hidden="true" />
                </div>
                <span className="font-semibold text-foreground text-sm">MedNavigator AI</span>
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-foreground mb-1.5">
                  {isRu ? "Полное имя" : "Full name"} <span aria-hidden="true" className="text-destructive">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 transition-colors ${
                    errors.fullName
                      ? "border-destructive bg-destructive/5"
                      : "border-border bg-muted/30 focus:border-brand-300"
                  }`}
                  placeholder={isRu ? "Иван Иванов" : "Jane Smith"}
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive mt-1" role="alert">
                    {isRu ? "Введите ваше имя" : "Please enter your full name."}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-1.5">
                  {isRu ? "Email" : "Email address"} <span aria-hidden="true" className="text-destructive">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 transition-colors ${
                    errors.email
                      ? "border-destructive bg-destructive/5"
                      : "border-border bg-muted/30 focus:border-brand-300"
                  }`}
                  placeholder="ivan@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive mt-1" role="alert">
                    {isRu ? "Введите корректный email" : "Please enter a valid email address."}
                  </p>
                )}
              </div>

              {/* Company */}
              <div>
                <label htmlFor="company" className="block text-sm font-semibold text-foreground mb-1.5">
                  {isRu ? "Компания" : "Company"}{" "}
                  <span className="text-muted-foreground font-normal">({isRu ? "необязательно" : "optional"})</span>
                </label>
                <input
                  id="company"
                  type="text"
                  autoComplete="organization"
                  className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-colors"
                  placeholder={isRu ? "Медицинский центр «Здоровье»" : "Acme Health Clinic"}
                  {...register("company")}
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-foreground mb-1.5">
                  {isRu ? "Сообщение" : "Message"} <span aria-hidden="true" className="text-destructive">*</span>
                </label>
                <textarea
                  id="message"
                  rows={5}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 transition-colors resize-none ${
                    errors.message
                      ? "border-destructive bg-destructive/5"
                      : "border-border bg-muted/30 focus:border-brand-300"
                  }`}
                  placeholder={
                    isRu
                      ? "Расскажите о вашем запросе или идее для партнёрства..."
                      : "Tell us about your use case, question, or interest in partnering with MedNavigator AI..."
                  }
                  {...register("message")}
                />
                {errors.message && (
                  <p className="text-xs text-destructive mt-1" role="alert">
                    {isRu ? "Введите сообщение (минимум 10 символов)" : "Please enter a message of at least 10 characters."}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white gradient-brand shadow-brand hover:shadow-brand-lg transition-all duration-200 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    {isRu ? "Отправка..." : "Sending…"}
                  </>
                ) : (
                  <>
                    {isRu ? "Отправить" : "Send message"}
                    <Send className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
