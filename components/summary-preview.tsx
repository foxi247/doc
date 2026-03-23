"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
  FileText,
  AlertTriangle,
  User,
  Upload,
  Eye,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";

const summaryData = {
  patient: "Anonymous Preview",
  date: "Mar 23, 2026",
  urgency: "Medium",
  urgencyColor: "text-amber-700 bg-amber-50 border-amber-200",
  specialist: "Cardiologist",
  symptoms: ["Intermittent chest discomfort", "Shortness of breath on exertion", "Mild fatigue over 3 days"],
  files: ["ECG Report — 3/22/2026", "Lab Results — CBC Panel"],
  observations: [
    "Symptoms appear correlated with physical activity",
    "Onset was gradual over 72 hours",
    "No reported loss of consciousness or syncope",
  ],
  questions: [
    "When exactly did the discomfort first begin?",
    "Does the discomfort radiate to the arm, jaw, or back?",
    "Any family history of cardiac events?",
  ],
  disclaimer:
    "This document is a navigation aid only and does not constitute a medical diagnosis or treatment plan.",
};

export default function SummaryPreview() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="summary" className="section-padding bg-white" ref={ref}>
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-xs font-semibold mb-4">
              Medical Summary Preview
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Arrive at your appointment prepared
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              MedNavigator AI generates a concise, structured summary you can share directly with your clinician — saving time and improving the quality of your consultation.
            </p>

            <ul className="space-y-3">
              {[
                "Symptom timeline organized automatically",
                "Uploaded file references included",
                "Relevant follow-up questions prepared",
                "Urgency guidance at a glance",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right: Summary card */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            aria-label="Sample medical summary preview"
          >
            <div className="rounded-2xl border border-border bg-white shadow-card-hover overflow-hidden">
              {/* Header */}
              <div className="gradient-brand p-5 text-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" aria-hidden="true" />
                    <span className="font-semibold text-sm">Doctor-Ready Summary</span>
                  </div>
                  <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">Preview</span>
                </div>
                <div className="flex items-center gap-3 text-xs opacity-80">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {summaryData.patient}
                  </span>
                  <span>{summaryData.date}</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {/* Urgency + Specialist */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-xl border p-3 ${summaryData.urgencyColor}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                      <span className="text-[10px] font-semibold uppercase tracking-wide">Urgency</span>
                    </div>
                    <p className="font-bold text-sm">{summaryData.urgency}</p>
                  </div>
                  <div className="rounded-xl border border-brand-100 bg-brand-50 p-3">
                    <div className="flex items-center gap-1.5 mb-1 text-brand-700">
                      <User className="w-3.5 h-3.5" aria-hidden="true" />
                      <span className="text-[10px] font-semibold uppercase tracking-wide">Specialist</span>
                    </div>
                    <p className="font-bold text-sm text-brand-800">{summaryData.specialist}</p>
                  </div>
                </div>

                {/* Symptoms */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Symptom Overview
                  </p>
                  <ul className="space-y-1">
                    {summaryData.symptoms.map((s) => (
                      <li key={s} className="text-xs text-foreground flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-brand-400 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Files */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Upload className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Uploaded Files
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {summaryData.files.map((f) => (
                      <span key={f} className="text-[10px] px-2 py-1 rounded-md bg-muted border border-border text-muted-foreground">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Observations */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Key Observations
                    </p>
                  </div>
                  <ul className="space-y-1">
                    {summaryData.observations.map((o) => (
                      <li key={o} className="text-xs text-foreground flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-teal-400 flex-shrink-0 mt-1.5" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Questions */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Questions to Discuss
                    </p>
                  </div>
                  <ul className="space-y-1">
                    {summaryData.questions.map((q) => (
                      <li key={q} className="text-xs text-foreground flex items-start gap-2">
                        <span className="text-brand-400 font-bold flex-shrink-0">?</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer disclaimer */}
              <div className="px-5 pb-4">
                <p className="text-[10px] text-muted-foreground bg-muted rounded-lg px-3 py-2 border border-border">
                  {summaryData.disclaimer}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
