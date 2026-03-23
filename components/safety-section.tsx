"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { ShieldCheck, AlertOctagon, XCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

const doesList = [
  "Organizes and structures symptom descriptions",
  "Suggests which specialist type to consider",
  "Provides broad urgency guidance",
  "Generates a doctor-ready summary",
  "Asks clarifying questions to help you prepare",
];

const doesNotList = [
  "Diagnose any medical condition",
  "Prescribe or suggest medications",
  "Recommend treatment plans",
  "Replace a licensed clinician's evaluation",
  "Guarantee accuracy of any health assessment",
];

export default function SafetySection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="safety" className="section-padding" style={{ background: "linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%)" }} ref={ref}>
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-semibold mb-4">
            Built for safety
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Clear boundaries. Clear purpose.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            MedNavigator AI is a navigation tool, not a medical device. We are transparent about what it can and cannot do.
          </p>
        </motion.div>

        {/* Emergency notice */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-10 max-w-2xl mx-auto"
          role="alert"
        >
          <AlertOctagon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-amber-800">
            <strong>Emergency:</strong> If you may be experiencing a medical emergency, contact local emergency services immediately. Do not rely on this tool for emergency situations.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Does */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl border border-teal-100 bg-white p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-teal-600" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-foreground">What MedNavigator does</h3>
            </div>
            <ul className="space-y-3">
              {doesList.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                  <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Does not */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl border border-border bg-white p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center">
                <XCircle className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-foreground">What it does not do</h3>
            </div>
            <ul className="space-y-3">
              {doesNotList.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <XCircle className="w-4 h-4 text-muted-foreground/60 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-10"
        >
          <Link
            href="/safety"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            Read our full safety policy
            <span aria-hidden="true">→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
