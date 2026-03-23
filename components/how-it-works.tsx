"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { ClipboardList, Upload, Route, FileText } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: ClipboardList,
    title: "Describe your symptoms",
    description:
      "Tell MedNavigator AI what you're experiencing in plain language. Our AI organizes and structures your input to extract key signals.",
    color: "brand",
  },
  {
    number: "02",
    icon: Upload,
    title: "Upload medical files",
    description:
      "Attach ECG readings, MRI scans, lab results, or other files. File labels are used to contextualize your summary.",
    color: "teal",
  },
  {
    number: "03",
    icon: Route,
    title: "Get specialist routing",
    description:
      "Receive a suggested specialist type and urgency guidance based on your symptom pattern — not a diagnosis.",
    color: "violet",
  },
  {
    number: "04",
    icon: FileText,
    title: "Review your doctor-ready summary",
    description:
      "Get a clean, concise summary to share with your clinician. Arrive better prepared and make the most of your appointment.",
    color: "brand",
  },
];

const colorMap: Record<string, { bg: string; border: string; icon: string; number: string }> = {
  brand: {
    bg: "bg-brand-50",
    border: "border-brand-100",
    icon: "text-brand-600",
    number: "text-brand-200",
  },
  teal: {
    bg: "bg-teal-50",
    border: "border-teal-100",
    icon: "text-teal-600",
    number: "text-teal-200",
  },
  violet: {
    bg: "bg-violet-50",
    border: "border-violet-100",
    icon: "text-violet-600",
    number: "text-violet-200",
  },
};

export default function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" className="section-padding bg-white" ref={ref}>
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-xs font-semibold mb-4">
            How it works
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            From symptoms to clarity in minutes
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            A structured workflow designed to help you arrive at your appointment informed, organized, and ready.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {steps.map((step, i) => {
            const colors = colorMap[step.color] || colorMap.brand;
            const Icon = step.icon;

            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative group"
              >
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div
                    className="hidden lg:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-border to-transparent z-0"
                    aria-hidden="true"
                  />
                )}

                <div className="relative z-10 card-glow rounded-2xl border border-border bg-white p-6 h-full">
                  <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${colors.icon}`} aria-hidden="true" />
                  </div>

                  <span className={`text-4xl font-black ${colors.number} absolute top-4 right-4`} aria-hidden="true">
                    {step.number}
                  </span>

                  <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
