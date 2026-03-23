"use client";

import { motion, AnimatePresence } from "framer-motion";

interface MascotFDoctorProps {
  isTyping?: boolean;
  isThinking?: boolean;
  size?: number;
}

export function MascotFDoctor({ isTyping = false, isThinking = false, size = 64 }: MascotFDoctorProps) {
  const show = !isTyping;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="mascot"
          initial={{ opacity: 0, y: 8, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.85 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{ width: size, height: size }}
          className="select-none"
          aria-hidden="true"
        >
          {isThinking ? (
            <ThinkingMascot size={size} />
          ) : (
            <IdleMascot size={size} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function IdleMascot({ size }: { size: number }) {
  return (
    <motion.div
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
    >
      <FDoctorSVG size={size} eyeState="open" />
    </motion.div>
  );
}

function ThinkingMascot({ size }: { size: number }) {
  return (
    <motion.div
      animate={{ rotate: [-2, 2, -2] }}
      transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
    >
      <FDoctorSVG size={size} eyeState="thinking" />
    </motion.div>
  );
}

function FDoctorSVG({ size, eyeState }: { size: number; eyeState: "open" | "thinking" }) {
  const w = size;
  const h = size;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Body — letter F shape */}
      {/* Vertical bar */}
      <rect x="10" y="6" width="16" height="52" rx="4" fill="#3B82F6" />
      {/* Top horizontal bar */}
      <rect x="10" y="6" width="38" height="14" rx="4" fill="#3B82F6" />
      {/* Middle horizontal bar */}
      <rect x="10" y="26" width="28" height="12" rx="4" fill="#3B82F6" />

      {/* Face area highlight */}
      <rect x="13" y="10" width="30" height="26" rx="3" fill="#60A5FA" opacity="0.3" />

      {/* Eyes */}
      {eyeState === "open" ? (
        <>
          <circle cx="22" cy="22" r="3.5" fill="white" />
          <circle cx="34" cy="22" r="3.5" fill="white" />
          <circle cx="22.8" cy="22.8" r="1.8" fill="#1E3A5F" />
          <circle cx="34.8" cy="22.8" r="1.8" fill="#1E3A5F" />
          {/* Eye shine */}
          <circle cx="23.5" cy="21.5" r="0.7" fill="white" />
          <circle cx="35.5" cy="21.5" r="0.7" fill="white" />
        </>
      ) : (
        <>
          {/* Thinking eyes — slightly squinted */}
          <path d="M19 22 Q22 19.5 25 22" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M31 22 Q34 19.5 37 22" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
        </>
      )}

      {/* Medical mask */}
      <rect x="12" y="30" width="32" height="18" rx="5" fill="white" opacity="0.95" />
      {/* Mask stripes */}
      <line x1="12" y1="36" x2="44" y2="36" stroke="#BFDBFE" strokeWidth="1.5" />
      <line x1="12" y1="42" x2="44" y2="42" stroke="#BFDBFE" strokeWidth="1.5" />
      {/* Mask ties */}
      <line x1="12" y1="32" x2="8" y2="30" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="44" x2="8" y2="46" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="44" y1="32" x2="48" y2="30" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="44" y1="44" x2="48" y2="46" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />

      {/* Medical cross on mask */}
      <rect x="26" y="34" width="6" height="2" rx="1" fill="#3B82F6" opacity="0.6" />
      <rect x="28" y="32" width="2" height="6" rx="1" fill="#3B82F6" opacity="0.6" />
    </svg>
  );
}
