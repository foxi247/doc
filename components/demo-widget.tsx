"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  User,
  FileText,
  Upload,
  X,
  Loader2,
  Info,
  AlertOctagon,
} from "lucide-react";
import { AIResponse } from "@/lib/ai/types";
import { formatUrgency } from "@/lib/utils";

const FILE_OPTIONS = [
  "ECG Report",
  "MRI Scan",
  "CT Scan",
  "Lab Results (Blood Panel)",
  "X-Ray",
  "Ultrasound",
  "Pathology Report",
];

export default function DemoWidget() {
  const [symptoms, setSymptoms] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleFile = (file: string) => {
    setSelectedFiles((prev) =>
      prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim() || symptoms.trim().length < 10) {
      setError("Please describe your symptoms in at least 10 characters.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: symptoms.trim(),
          uploadedFiles: selectedFiles.length > 0 ? selectedFiles : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setResult(data as AIResponse);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setSymptoms("");
    setSelectedFiles([]);
    setError(null);
  };

  const urgencyFormat = result ? formatUrgency(result.urgency) : null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Simulation disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 mb-6" role="note">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm text-blue-800">
          <strong>This is a simulation.</strong> Outputs are for demonstration purposes only and do not constitute medical advice, diagnosis, or treatment. Always consult a licensed healthcare professional.
        </div>
      </div>

      {/* Emergency warning */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-6" role="alert">
        <AlertOctagon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-amber-800">
          If you may be experiencing a medical emergency, contact local emergency services immediately.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-white shadow-card p-6 space-y-6"
            noValidate
          >
            {/* Symptom input */}
            <div>
              <label htmlFor="symptoms" className="block text-sm font-semibold text-foreground mb-2">
                Describe your symptoms
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Describe what you&apos;re experiencing in plain language. Include duration, intensity, and any patterns you&apos;ve noticed.
              </p>
              <textarea
                id="symptoms"
                value={symptoms}
                onChange={(e) => {
                  setSymptoms(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. I've been experiencing intermittent chest discomfort and shortness of breath for the past 3 days, especially when climbing stairs..."
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-colors resize-none"
                rows={5}
                maxLength={2000}
                aria-describedby="symptoms-hint"
              />
              <div id="symptoms-hint" className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">Minimum 10 characters</span>
                <span className="text-xs text-muted-foreground">{symptoms.length}/2000</span>
              </div>
            </div>

            {/* File upload simulation */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Medical files (optional)
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Select the types of files you have available. No actual files are uploaded in this demo.
              </p>
              <div className="flex flex-wrap gap-2">
                {FILE_OPTIONS.map((file) => (
                  <button
                    key={file}
                    type="button"
                    onClick={() => toggleFile(file)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      selectedFiles.includes(file)
                        ? "bg-brand-50 border-brand-200 text-brand-700"
                        : "bg-white border-border text-muted-foreground hover:border-brand-200 hover:text-brand-600"
                    }`}
                    aria-pressed={selectedFiles.includes(file)}
                  >
                    <Upload className="w-3 h-3" aria-hidden="true" />
                    {file}
                    {selectedFiles.includes(file) && (
                      <X className="w-3 h-3" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-destructive"
                role="alert"
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || symptoms.trim().length < 10}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white gradient-brand shadow-brand hover:shadow-brand-lg transition-all duration-200 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Analyzing symptoms…
                </>
              ) : (
                "Analyze my symptoms"
              )}
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            {/* Result header */}
            <div className="rounded-2xl border border-border bg-white shadow-card overflow-hidden">
              {/* Top banner */}
              <div className="gradient-brand px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" aria-hidden="true" />
                    <span className="font-semibold text-sm">Navigation Summary</span>
                  </div>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Simulation</span>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Urgency + Specialist row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-xl border p-3.5 ${urgencyFormat?.bg}`}>
                    <div className={`flex items-center gap-1.5 mb-1 ${urgencyFormat?.color}`}>
                      <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                      <span className="text-[10px] font-bold uppercase tracking-wide">Urgency Guidance</span>
                    </div>
                    <p className={`font-bold text-sm ${urgencyFormat?.color}`}>
                      {urgencyFormat?.label}
                    </p>
                  </div>
                  <div className="rounded-xl border border-brand-100 bg-brand-50 p-3.5">
                    <div className="flex items-center gap-1.5 mb-1 text-brand-600">
                      <User className="w-3.5 h-3.5" aria-hidden="true" />
                      <span className="text-[10px] font-bold uppercase tracking-wide">Specialist to Consider</span>
                    </div>
                    <p className="font-bold text-sm text-brand-800">{result.recommendedSpecialist}</p>
                  </div>
                </div>

                {/* Possible concern */}
                <div className="rounded-xl bg-muted border border-border p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Possible area of concern
                  </p>
                  <p className="text-sm text-foreground">{result.possibleConcern}</p>
                </div>

                {/* Summary */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Navigation Summary
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{result.summary}</p>
                </div>

                {/* Follow-up questions */}
                {result.followUpQuestions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Recommended next steps &amp; questions for your doctor
                      </p>
                    </div>
                    <ul className="space-y-2">
                      {result.followUpQuestions.map((q, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                  <p className="text-xs text-blue-800 leading-relaxed">{result.disclaimer}</p>
                </div>
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="w-full py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Start a new assessment
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
