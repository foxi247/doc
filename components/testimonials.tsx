"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "I went into my cardiology appointment with a clear summary of my symptoms. My doctor said it was the most prepared he'd seen a patient in years.",
    name: "Sarah M.",
    role: "User — Chicago, IL",
    stars: 5,
  },
  {
    quote:
      "The urgency indicator helped me realize I shouldn't wait another week. I booked an appointment the same day. It turned out to be important.",
    name: "James T.",
    role: "User — London, UK",
    stars: 5,
  },
  {
    quote:
      "Finally a health tool that doesn't try to be my doctor. It helped me organize what I was experiencing and point me in the right direction.",
    name: "Priya K.",
    role: "User — Toronto, CA",
    stars: 5,
  },
];

export default function Testimonials() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="section-padding bg-white" ref={ref}>
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-xs font-semibold mb-4">
            Why users love it
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Trusted by people who deserve clarity
          </h2>
          <p className="text-muted-foreground text-lg">
            Real user experiences. Better appointments. Less uncertainty.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-white p-6 shadow-card hover:shadow-card-hover transition-shadow duration-300"
            >
              <div className="flex gap-1 mb-4" aria-label={`${t.stars} stars`}>
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                ))}
              </div>
              <blockquote className="text-sm text-foreground leading-relaxed mb-5">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-bold">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
