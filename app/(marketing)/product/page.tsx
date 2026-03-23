import type { Metadata } from "next";
import { ClipboardList, Upload, Route, AlertTriangle, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import CTABand from "@/components/cta-band";

export const metadata: Metadata = {
  title: "Product — MedNavigator AI",
  description:
    "Learn how MedNavigator AI organizes symptoms, uploads medical files, routes to specialists, and generates doctor-ready summaries.",
};

const features = [
  {
    icon: ClipboardList,
    title: "Symptom Intake & Organization",
    description:
      "Describe your symptoms in natural language. Our AI structures and organizes your input into a clear timeline, extracting key signals without guessing at conditions.",
    details: [
      "Plain-language symptom entry",
      "Automatic organization by type and duration",
      "Pattern recognition for relevant signals",
      "Multi-symptom correlation support",
    ],
    color: "brand",
  },
  {
    icon: Upload,
    title: "Medical File Upload",
    description:
      "Attach ECG readings, MRI scans, CT results, lab panels, and more. File references are incorporated into your summary to give your clinician full context.",
    details: [
      "Support for ECG, MRI, CT, X-ray references",
      "Lab results and pathology reports",
      "Files contextualized in your summary",
      "No diagnostic interpretation of files",
    ],
    color: "teal",
  },
  {
    icon: Route,
    title: "Specialist Routing Guidance",
    description:
      "Based on your symptom pattern, MedNavigator AI suggests which type of specialist may be most appropriate to consult — not a diagnosis, but meaningful direction.",
    details: [
      "Six specialist categories available",
      "Pattern-based routing guidance",
      "Clear explanation of routing logic",
      "Multiple specialist suggestions when appropriate",
    ],
    color: "violet",
  },
  {
    icon: AlertTriangle,
    title: "Urgency Indicators",
    description:
      "Broad urgency assessment helps you understand whether your situation may require prompt attention, standard scheduling, or monitoring.",
    details: [
      "Low / Medium / High urgency tiers",
      "Emergency escalation flags",
      "Clear guidance messaging",
      "Not a substitute for professional triage",
    ],
    color: "amber",
  },
  {
    icon: FileText,
    title: "Doctor-Ready Summary Generation",
    description:
      "A concise, structured summary designed to be shared directly with your clinician — reducing intake time and helping you make the most of every appointment.",
    details: [
      "Symptom timeline overview",
      "Uploaded file references",
      "Key observations extracted",
      "Suggested discussion questions",
    ],
    color: "brand",
  },
];

const colorMap: Record<string, { bg: string; border: string; icon: string }> = {
  brand: { bg: "bg-brand-50", border: "border-brand-100", icon: "text-brand-600" },
  teal: { bg: "bg-teal-50", border: "border-teal-100", icon: "text-teal-600" },
  violet: { bg: "bg-violet-50", border: "border-violet-100", icon: "text-violet-600" },
  amber: { bg: "bg-amber-50", border: "border-amber-100", icon: "text-amber-600" },
};

export default function ProductPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 section-padding bg-hero-gradient">
        <div className="container-custom text-center max-w-3xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-xs font-semibold mb-4">
            Product Overview
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-5">
            Everything you need to arrive at your appointment prepared
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">
            MedNavigator AI is a complete medical navigation workflow — from symptom description to doctor-ready summary, without diagnosis or treatment.
          </p>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white gradient-brand shadow-brand hover:shadow-brand-lg transition-all duration-200 hover:-translate-y-px"
          >
            Try the demo
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="space-y-20">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              const colors = colorMap[feature.color] || colorMap.brand;
              const isEven = i % 2 === 0;

              return (
                <div
                  key={feature.title}
                  className={`grid lg:grid-cols-2 gap-12 items-center ${
                    isEven ? "" : "lg:grid-flow-col-dense"
                  }`}
                >
                  <div className={isEven ? "" : "lg:col-start-2"}>
                    <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center mb-5`}>
                      <Icon className={`w-5 h-5 ${colors.icon}`} aria-hidden="true" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                      {feature.title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">{feature.description}</p>
                    <ul className="space-y-2.5">
                      {feature.details.map((d) => (
                        <li key={d} className="flex items-center gap-2.5 text-sm text-foreground">
                          <span className={`w-1.5 h-1.5 rounded-full ${colors.bg} border ${colors.border} bg-opacity-100`} style={{ background: "currentColor", opacity: 0.7 }} />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={isEven ? "" : "lg:col-start-1 lg:row-start-1"}>
                    <div className={`rounded-2xl ${colors.bg} ${colors.border} border p-8 h-48 flex items-center justify-center`}>
                      <Icon className={`w-16 h-16 ${colors.icon} opacity-30`} aria-hidden="true" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <CTABand />
    </>
  );
}
