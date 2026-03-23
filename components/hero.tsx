"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Upload, FileHeart, Brain, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-hero-gradient" aria-hidden="true" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(14,165,233,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(20,184,166,0.12) 0%, transparent 50%)",
        }}
        aria-hidden="true"
      />

      <div className="container-custom relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center py-20">
        {/* Left: Copy */}
        <div className="max-w-xl">
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-xs font-semibold mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            AI Medical Navigation Platform
          </motion.div>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold leading-[1.1] tracking-tight text-foreground mb-6"
          >
            Understand your symptoms.{" "}
            <span className="gradient-text">Get routed to the right specialist.</span>
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-lg text-muted-foreground leading-relaxed mb-8"
          >
            AI medical agents help you organize symptoms, upload ECG&nbsp;/&nbsp;MRI&nbsp;/&nbsp;lab results,
            assess urgency, and prepare a doctor-ready summary — without diagnosis or treatment.
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex flex-col sm:flex-row gap-3 mb-10"
          >
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white gradient-brand shadow-brand hover:shadow-brand-lg transition-all duration-200 hover:-translate-y-px"
            >
              Start free assessment
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              href="/#how-it-works"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-foreground bg-white/80 border border-border hover:bg-white hover:shadow-card transition-all duration-200"
            >
              See how it works
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </motion.div>

          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex flex-wrap gap-4 text-xs text-muted-foreground"
          >
            {["No diagnosis given", "Privacy-first", "Doctor-ready output", "Emergency aware"].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" aria-hidden="true" />
                {item}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Right: UI Mockup */}
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative"
          aria-label="MedNavigator AI interface preview"
          aria-hidden="true"
        >
          <div className="relative max-w-md mx-auto lg:ml-auto">
            {/* Main card */}
            <div className="glass rounded-2xl shadow-card-hover border border-white/60 p-5 space-y-4">
              {/* Chat header */}
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">MedNavigator AI</p>
                  <p className="text-xs text-teal-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    Ready to help
                  </p>
                </div>
              </div>

              {/* Chat bubble */}
              <div className="bg-muted rounded-xl p-3 text-xs text-muted-foreground leading-relaxed">
                I&apos;ve been experiencing intermittent chest discomfort and shortness of breath for the past 3 days, especially when climbing stairs.
              </div>

              {/* Upload cards */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Uploaded files</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "ECG Report", color: "text-brand-600 bg-brand-50 border-brand-100" },
                    { label: "MRI Scan", color: "text-teal-600 bg-teal-50 border-teal-100" },
                    { label: "Lab Results", color: "text-violet-600 bg-violet-50 border-violet-100" },
                  ].map((file) => (
                    <div
                      key={file.label}
                      className={`rounded-lg border p-2 text-center ${file.color}`}
                    >
                      <Upload className="w-3.5 h-3.5 mx-auto mb-1" />
                      <p className="text-[10px] font-medium leading-tight">{file.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specialist routing */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Suggested specialist</p>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-50 border border-brand-100">
                  <FileHeart className="w-4 h-4 text-brand-600" />
                  <span className="text-xs font-semibold text-brand-700">Cardiologist</span>
                </div>
              </div>

              {/* Urgency + Summary */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-amber-50 border border-amber-100 p-2.5">
                  <div className="flex items-center gap-1 mb-0.5">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] font-semibold text-amber-700">Urgency</span>
                  </div>
                  <p className="text-xs font-bold text-amber-800">Medium</p>
                </div>
                <div className="rounded-lg bg-teal-50 border border-teal-100 p-2.5">
                  <div className="flex items-center gap-1 mb-0.5">
                    <CheckCircle2 className="w-3 h-3 text-teal-500" />
                    <span className="text-[10px] font-semibold text-teal-700">Summary</span>
                  </div>
                  <p className="text-[10px] text-teal-800 leading-snug">Ready for review</p>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground text-center border-t border-border pt-2">
                Not a diagnosis. For guidance only. Consult a licensed clinician.
              </p>
            </div>

            {/* Floating badge */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 glass rounded-xl px-3 py-2 shadow-card border border-white/60 text-xs font-semibold text-foreground hidden sm:block"
            >
              🔒 Privacy-first
            </motion.div>

            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -bottom-4 -left-4 glass rounded-xl px-3 py-2 shadow-card border border-white/60 text-xs font-semibold text-foreground hidden sm:block"
            >
              6 specialist agents
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
