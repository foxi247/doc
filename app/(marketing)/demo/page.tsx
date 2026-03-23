import type { Metadata } from "next";
import DemoWidget from "@/components/demo-widget";

export const metadata: Metadata = {
  title: "Demo — MedNavigator AI",
  description:
    "Try the MedNavigator AI simulation. Describe your symptoms and see how the platform organizes information and suggests a specialist — this is a demonstration only.",
};

export default function DemoPage() {
  return (
    <>
      <section className="pt-32 pb-10 bg-hero-gradient">
        <div className="container-custom text-center max-w-2xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold mb-4">
            ⚠ Simulation — Not Medical Advice
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Try the MedNavigator AI demo
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            This is a safe simulation showing how MedNavigator AI organizes symptom information and suggests a specialist type. No diagnosis is made. No treatment is recommended.
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom">
          <DemoWidget />
        </div>
      </section>
    </>
  );
}
