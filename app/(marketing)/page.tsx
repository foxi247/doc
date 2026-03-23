import type { Metadata } from "next";
import Hero from "@/components/hero";
import HowItWorks from "@/components/how-it-works";
import SafetySection from "@/components/safety-section";
import ClinicsSection from "@/components/clinics-section";
import CTABand from "@/components/cta-band";

export const metadata: Metadata = {
  title: "MedNavigator AI — AI Medical Navigation Before the Doctor Visit",
  description:
    "AI medical agents help you organize symptoms, assess urgency, and guide you to the right specialist — quickly and safely.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <SafetySection />
      <ClinicsSection />
      <CTABand />
    </>
  );
}
