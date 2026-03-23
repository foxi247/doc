"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Clock, ClipboardCheck, BarChart3, Link2, ArrowRight } from "lucide-react";
import Link from "next/link";

const benefits = [
  {
    icon: ClipboardCheck,
    title: "Better prepared patients",
    description:
      "Patients arrive with organized symptom histories, uploaded files, and structured summaries — reducing intake time significantly.",
  },
  {
    icon: Clock,
    title: "Less wasted appointment time",
    description:
      "Clinicians spend less time extracting symptom history and more time on clinical assessment and patient care.",
  },
  {
    icon: BarChart3,
    title: "Cleaner intake summaries",
    description:
      "Standardized, structured data format makes it easier for staff to process and route patients correctly.",
  },
  {
    icon: Link2,
    title: "Integration-ready",
    description:
      "Designed for future integration with telemedicine platforms, EHR systems, and insurance intake workflows.",
  },
];

export default function ClinicsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="clinics" className="section-padding" style={{ background: "linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)" }} ref={ref}>
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-xs font-semibold mb-4">
              For Clinics &amp; Partners
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              The layer before the consultation
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              MedNavigator AI works as an intelligent intake layer that prepares patients before they see you. Structured data, better preparation, and fewer wasted appointments.
            </p>

            <div className="space-y-5">
              {benefits.map((b, i) => {
                const Icon = b.icon;
                return (
                  <motion.div
                    key={b.title}
                    initial={{ opacity: 0, x: -16 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-brand-600" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm mb-0.5">{b.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="mt-8"
            >
              <Link
                href="/clinics"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white gradient-brand shadow-brand hover:shadow-brand-lg transition-all duration-200 hover:-translate-y-px"
              >
                Learn more for clinics
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Right: Stats panel */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            aria-label="Clinic partnership stats"
          >
            <div className="glass rounded-2xl border border-white/60 shadow-card-hover p-8 space-y-6">
              <h3 className="font-semibold text-foreground">Why clinics choose MedNavigator AI</h3>

              {[
                { label: "Reduction in intake time", value: "~40%", color: "gradient-brand" },
                { label: "More structured patient data", value: "3×", color: "gradient-brand" },
                { label: "Patient satisfaction improvement", value: "+28%", color: "gradient-brand" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <span className={`text-2xl font-bold ${stat.color} bg-clip-text text-transparent`} style={{ backgroundImage: "linear-gradient(135deg, #0ea5e9, #14b8a6)" }}>
                    {stat.value}
                  </span>
                </div>
              ))}

              <div className="rounded-xl bg-muted border border-border p-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Statistics are illustrative projections based on structured patient intake methodologies. Individual clinic results may vary. Contact us for a custom evaluation.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
