import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .slice(0, 2000);
}

export function formatUrgency(urgency: string): {
  label: string;
  color: string;
  bg: string;
} {
  switch (urgency.toLowerCase()) {
    case "high":
      return {
        label: "High Priority",
        color: "text-amber-700",
        bg: "bg-amber-50 border-amber-200",
      };
    case "medium":
      return {
        label: "Medium Priority",
        color: "text-brand-700",
        bg: "bg-brand-50 border-brand-200",
      };
    default:
      return {
        label: "Low Priority",
        color: "text-teal-700",
        bg: "bg-teal-50 border-teal-200",
      };
  }
}
