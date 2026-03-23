"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function CTABand() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-20" ref={ref}>
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden gradient-brand p-10 md:p-16 text-center text-white"
        >
          {/* Background decoration */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)",
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white/90 text-xs font-semibold mb-6">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              No diagnosis. No prescription. Just clarity.
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to understand your symptoms?
            </h2>
            <p className="text-white/80 text-lg leading-relaxed mb-8">
              Join thousands of people who use MedNavigator AI to organize their health information and walk into their doctor appointments prepared.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-brand-700 bg-white hover:bg-brand-50 shadow-lg transition-all duration-200 hover:-translate-y-px"
              >
                Start free assessment
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                href="/clinics"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-white/15 border border-white/30 hover:bg-white/25 transition-all duration-200"
              >
                Partner with us
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
