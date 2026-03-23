import type { Metadata } from "next";
import Hero from "@/components/hero";
import HowItWorks from "@/components/how-it-works";
import AIAgents from "@/components/ai-agents";
import SummaryPreview from "@/components/summary-preview";
import SafetySection from "@/components/safety-section";
import Testimonials from "@/components/testimonials";
import ClinicsSection from "@/components/clinics-section";
import CTABand from "@/components/cta-band";

export const metadata: Metadata = {
  title: "MedNavigator AI — AI Medical Navigation Before the Doctor Visit",
  description:
    "AI medical agents help you organize symptoms, upload ECG/MRI/lab results, assess urgency, and prepare a doctor-ready summary.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <AIAgents />
      <SummaryPreview />
      <SafetySection />
      <Testimonials />
      <ClinicsSection />
      <CTABand />
    </>
  );
}
