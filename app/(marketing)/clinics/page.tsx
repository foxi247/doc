import type { Metadata } from "next";
import {
  ClipboardCheck,
  Clock,
  BarChart3,
  Link2,
  Users,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import CTABand from "@/components/cta-band";

export const metadata: Metadata = {
  title: "For Clinics & Partners — MedNavigator AI",
  description:
    "Integrate MedNavigator AI as an intelligent intake layer before patient consultations. Better preparation, less wasted time, cleaner summaries.",
};

const features = [
  {
    icon: ClipboardCheck,
    title: "Intelligent pre-consultation intake",
    description:
      "Patients complete a structured symptom assessment before their appointment. When they arrive, your team has organized data — not a blank intake form.",
  },
  {
    icon: Clock,
    title: "Shorter, more productive appointments",
    description:
      "Clinicians spend less time extracting history and more time on clinical assessment. Every minute saved compounds across hundreds of weekly appointments.",
  },
  {
    icon: BarChart3,
    title: "Standardized, analyzable data",
    description:
      "Every intake generates structured data in a consistent format — making it possible to analyze patient trends, routing patterns, and specialty demand.",
  },
  {
    icon: Users,
    title: "Better patient experience",
    description:
      "Patients who feel organized and informed are less anxious and more engaged during their consultation. MedNavigator AI helps them walk in prepared.",
  },
  {
    icon: Link2,
    title: "Integration-ready architecture",
    description:
      "Designed with future integrations in mind: EHR systems, telemedicine platforms, insurer workflows, and patient portal connections.",
  },
];

const useCases = [
  {
    title: "Primary care practices",
    description: "Route patients to the right specialist before their first visit, with organized history already available.",
  },
  {
    title: "Specialist clinics",
    description: "Receive patients who arrive with pre-organized symptom summaries relevant to your specialty.",
  },
  {
    title: "Telemedicine platforms",
    description: "Add a structured intake layer before virtual consultations to improve session quality.",
  },
  {
    title: "Health insurance intake",
    description: "Pre-assess patient situations before routing to the appropriate care channel or authorization pathway.",
  },
];

export default function ClinicsPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-hero-gradient">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-600 text-xs font-semibold mb-4">
                For Clinics &amp; Partners
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-5">
                The intelligent layer before the consultation
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                MedNavigator AI acts as a structured intake layer between your patients and your clinicians — improving preparation quality and reducing appointment inefficiency.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white gradient-brand shadow-brand hover:shadow-brand-lg transition-all duration-200 hover:-translate-y-px"
                >
                  Request a partnership discussion
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Stats card */}
            <div className="glass rounded-2xl border border-white/60 shadow-card-hover p-8" aria-label="Partnership benefits at a glance">
              <h3 className="font-semibold text-foreground mb-6">Partnership benefits at a glance</h3>
              <div className="space-y-4">
                {[
                  { metric: "~40%", label: "Reduction in average intake time" },
                  { metric: "3×", label: "More structured patient data per appointment" },
                  { metric: "+28%", label: "Patient satisfaction score improvement" },
                  { metric: "6", label: "Specialist routing categories available" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{s.label}</span>
                    <span className="text-xl font-bold gradient-text">{s.metric}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Statistics are illustrative projections. Individual results may vary.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Built for clinical integration
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Every feature is designed with the clinical workflow in mind — not just the patient experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-2xl border border-border bg-white p-6 card-glow"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-4">
                    <Icon className="w-4 h-4 text-brand-600" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="section-padding" style={{ background: "linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)" }}>
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              Who can benefit
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              MedNavigator AI is versatile by design — built to fit into multiple healthcare workflow contexts.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {useCases.map((uc) => (
              <div
                key={uc.title}
                className="flex items-start gap-3 p-5 rounded-2xl border border-border bg-white"
              >
                <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">{uc.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{uc.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABand />
    </>
  );
}
