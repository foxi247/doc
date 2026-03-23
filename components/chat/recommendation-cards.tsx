"use client";

import { motion } from "framer-motion";
import { MapPin, Phone, Globe, ExternalLink, User, Building2, AlertTriangle } from "lucide-react";
import type { HospitalResult, DoctorResult } from "@/lib/search/providers";
import { useI18n } from "@/lib/i18n";

interface RecommendationCardsProps {
  hospitals?: HospitalResult[];
  doctors?: DoctorResult[];
}

export function RecommendationCards({ hospitals = [], doctors = [] }: RecommendationCardsProps) {
  const { t } = useI18n();

  if (hospitals.length === 0 && doctors.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-3 space-y-3"
    >
      {hospitals.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {t("recommendations.hospitals")}
          </p>
          {hospitals.map((h, i) => (
            <HospitalCard key={h.id} hospital={h} index={i} />
          ))}
        </div>
      )}

      {doctors.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {t("recommendations.doctors")}
          </p>
          {doctors.map((d, i) => (
            <DoctorCard key={d.id} doctor={d} index={i} />
          ))}
        </div>
      )}

      <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-950/30">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          {t("recommendations.disclaimer")}
        </p>
      </div>
    </motion.div>
  );
}

function HospitalCard({ hospital, index }: { hospital: HospitalResult; index: number }) {
  const { t } = useI18n();
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40">
          <Building2 className="h-4 w-4 text-blue-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
            {hospital.name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {[hospital.city, hospital.country].filter(Boolean).join(", ")}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              hospital.type === "private"
                ? "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400"
                : "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400"
            }`}>
              {hospital.type}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {hospital.phone && (
              <a
                href={`tel:${hospital.phone}`}
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                <Phone className="h-3 w-3" />
                {t("recommendations.callPhone")}
              </a>
            )}
            {hospital.website && (
              <a
                href={hospital.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                <Globe className="h-3 w-3" />
                {t("recommendations.openSite")}
              </a>
            )}
            {hospital.mapUrl && (
              <a
                href={hospital.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                <ExternalLink className="h-3 w-3" />
                {t("recommendations.getDirections")}
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DoctorCard({ doctor, index }: { doctor: DoctorResult; index: number }) {
  const { t } = useI18n();
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/40">
          <User className="h-4 w-4 text-teal-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
            {doctor.name}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">{doctor.specialty}</p>
          {doctor.hospital && (
            <p className="mt-0.5 truncate text-xs text-slate-500">{doctor.hospital}</p>
          )}
          <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
            <MapPin className="h-3 w-3" />
            {[doctor.city, doctor.country].filter(Boolean).join(", ")}
          </div>
          {doctor.note && (
            <p className="mt-1 text-xs text-slate-500 italic">{doctor.note}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {doctor.phone && (
              <a
                href={`tel:${doctor.phone}`}
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                <Phone className="h-3 w-3" />
                {t("recommendations.callPhone")}
              </a>
            )}
            {doctor.website && (
              <a
                href={doctor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                <Globe className="h-3 w-3" />
                {t("recommendations.openSite")}
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
