"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Heart, Brain, Stethoscope, Wind, Microscope, Activity } from "lucide-react";

const agents = [
  {
    icon: Stethoscope,
    title: "General Therapist",
    description: "Organizes broad symptom patterns and routes to the most appropriate initial specialist.",
    gradient: "from-brand-400 to-brand-600",
    glow: "group-hover:shadow-[0_8px_32px_rgba(14,165,233,0.25)]",
    badge: "bg-brand-50 text-brand-700 border-brand-100",
  },
  {
    icon: Heart,
    title: "Cardiology",
    description: "Focuses on cardiovascular symptoms: chest pain, palpitations, shortness of breath.",
    gradient: "from-rose-400 to-rose-600",
    glow: "group-hover:shadow-[0_8px_32px_rgba(244,63,94,0.2)]",
    badge: "bg-rose-50 text-rose-700 border-rose-100",
  },
  {
    icon: Brain,
    title: "Neurology",
    description: "Addresses neurological concerns: headaches, dizziness, coordination, and cognitive patterns.",
    gradient: "from-violet-400 to-violet-600",
    glow: "group-hover:shadow-[0_8px_32px_rgba(139,92,246,0.2)]",
    badge: "bg-violet-50 text-violet-700 border-violet-100",
  },
  {
    icon: Activity,
    title: "Gastroenterology",
    description: "Covers digestive system concerns: abdominal pain, nausea, bloating, and bowel changes.",
    gradient: "from-amber-400 to-amber-600",
    glow: "group-hover:shadow-[0_8px_32px_rgba(245,158,11,0.2)]",
    badge: "bg-amber-50 text-amber-700 border-amber-100",
  },
  {
    icon: Wind,
    title: "Pulmonology",
    description: "Targets respiratory symptoms: persistent cough, breathing difficulties, and lung-related concerns.",
    gradient: "from-teal-400 to-teal-600",
    glow: "group-hover:shadow-[0_8px_32px_rgba(20,184,166,0.2)]",
    badge: "bg-teal-50 text-teal-700 border-teal-100",
  },
  {
    icon: Microscope,
    title: "Dermatology",
    description: "Evaluates skin-related descriptions: rashes, lesions, texture changes, and pigmentation.",
    gradient: "from-pink-400 to-pink-600",
    glow: "group-hover:shadow-[0_8px_32px_rgba(236,72,153,0.2)]",
    badge: "bg-pink-50 text-pink-700 border-pink-100",
  },
];

export default function AIAgents() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="ai-agents" className="section-padding" style={{ background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)" }} ref={ref}>
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-semibold mb-4">
            AI Specialist Agents
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Six specialist agents, always available
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Each agent is trained to recognize symptom patterns relevant to its specialty and route you appropriately.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, i) => {
            const Icon = agent.icon;

            return (
              <motion.div
                key={agent.title}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`group relative rounded-2xl border border-border bg-white p-6 transition-all duration-300 ${agent.glow} hover:-translate-y-1 cursor-default`}
              >
                {/* Gradient border on hover via pseudo */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: "linear-gradient(135deg, rgba(14,165,233,0.06), rgba(20,184,166,0.06))",
                  }}
                  aria-hidden="true"
                />

                <div className={`relative z-10 w-12 h-12 rounded-xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center mb-5 shadow-md transition-transform group-hover:scale-110 duration-300`}>
                  <Icon className="w-5 h-5 text-white" aria-hidden="true" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground">{agent.title}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${agent.badge}`}>
                      Agent
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{agent.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center text-xs text-muted-foreground mt-10 max-w-lg mx-auto"
        >
          Agents provide routing guidance only. They do not diagnose conditions or recommend treatment. Always consult a licensed healthcare professional.
        </motion.p>
      </div>
    </section>
  );
}
