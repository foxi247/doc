import type { Metadata } from "next";
import { ShieldCheck, AlertOctagon, XCircle, CheckCircle2, Scale, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Safety Policy — MedNavigator AI",
  description:
    "MedNavigator AI is not a diagnostic tool. Learn about our safety boundaries, what we do and don't do, and how to use this platform responsibly.",
};

const doesList = [
  "Organizes and structures symptom descriptions submitted by users",
  "Suggests what type of medical specialist may be appropriate to consult",
  "Provides broad urgency guidance (low, medium, high) based on described patterns",
  "Generates a concise, neutral summary for sharing with a licensed clinician",
  "Asks clarifying questions to help users prepare for their appointment",
  "Identifies when symptoms may warrant urgent professional attention",
];

const doesNotList = [
  "Diagnose any medical condition, disease, or disorder",
  "Recommend or suggest specific medications or dosages",
  "Create or provide a treatment plan of any kind",
  "Interpret clinical test results or imaging findings",
  "Replace the evaluation of a licensed healthcare professional",
  "Guarantee the accuracy of any health-related output",
  "Act as a licensed medical device under any regulatory framework",
  "Provide emergency medical services or triage",
];

export default function SafetyPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 bg-hero-gradient">
        <div className="container-custom text-center max-w-3xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-7 h-7 text-teal-600" aria-hidden="true" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-semibold mb-4">
            Safety &amp; Compliance
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-5">
            Our safety commitments
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            MedNavigator AI is built with clear, non-negotiable boundaries. This page explains exactly what this platform is, what it is not, and how to use it responsibly.
          </p>
        </div>
      </section>

      {/* Emergency notice */}
      <section className="py-8 bg-amber-50 border-y border-amber-200">
        <div className="container-custom">
          <div className="flex items-start gap-3 max-w-3xl mx-auto" role="alert">
            <AlertOctagon className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-semibold text-amber-900 mb-1">Emergency situations</p>
              <p className="text-sm text-amber-800 leading-relaxed">
                If you believe you are experiencing a medical emergency — including but not limited to chest pain, difficulty breathing, sudden severe headache, signs of stroke, severe bleeding, or loss of consciousness — <strong>do not use this platform</strong>. Contact your local emergency services immediately. In the United States, call 911. In the United Kingdom, call 999.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="section-padding bg-white">
        <div className="container-custom max-w-4xl">
          {/* Not a medical device */}
          <div className="rounded-2xl border border-border bg-muted p-8 mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-xl font-bold text-foreground">Not a licensed medical device</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              MedNavigator AI is a software product designed for <strong>informational and navigational purposes only</strong>. It is not classified as, certified as, or intended to function as a medical device under any regulatory framework, including but not limited to:
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {["FDA (United States)", "CE marking (European Union)", "MHRA (United Kingdom)", "TGA (Australia)", "Health Canada"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {/* Does */}
            <div className="rounded-2xl border border-teal-100 bg-white p-6">
              <div className="flex items-center gap-2 mb-5">
                <CheckCircle2 className="w-5 h-5 text-teal-600" aria-hidden="true" />
                <h3 className="font-semibold text-foreground">What MedNavigator AI does</h3>
              </div>
              <ul className="space-y-3">
                {doesList.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Does not */}
            <div className="rounded-2xl border border-border bg-white p-6">
              <div className="flex items-center gap-2 mb-5">
                <XCircle className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                <h3 className="font-semibold text-foreground">What it does not do</h3>
              </div>
              <ul className="space-y-3">
                {doesNotList.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <XCircle className="w-4 h-4 text-muted-foreground/60 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Privacy */}
          <div className="rounded-2xl border border-border bg-white p-8 mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-brand-600" aria-hidden="true" />
              <h2 className="text-xl font-bold text-foreground">Privacy & data handling</h2>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>All symptom data submitted to MedNavigator AI is processed server-side and is not stored or used for training purposes. We do not build persistent health profiles from demo submissions.</p>
              <p>API keys and credentials are never exposed to the client. All model interactions occur server-side through secured environment variables.</p>
              <p>We recommend users avoid including personally identifiable information beyond what is necessary to describe their symptoms.</p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="rounded-2xl bg-muted border border-border p-6">
            <h3 className="font-semibold text-foreground mb-3">Full medical disclaimer</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              MedNavigator AI is provided &quot;as is&quot; for informational and navigational purposes only. The outputs of this platform do not constitute medical advice, diagnosis, treatment recommendations, or clinical evaluation. Users should always seek the advice of a qualified healthcare professional with any questions they may have regarding a medical condition. Never disregard professional medical advice or delay seeking it because of something read or generated by this platform. MedNavigator AI does not guarantee the accuracy, completeness, or timeliness of any information or output. Use of this platform is at the user&apos;s own risk.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
