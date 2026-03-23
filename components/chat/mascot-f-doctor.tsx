"use client";

import { motion, AnimatePresence } from "framer-motion";

interface MascotFDoctorProps {
  isTyping?: boolean;
  isThinking?: boolean;
  size?: number;
}

export function MascotFDoctor({
  isTyping = false,
  isThinking = false,
  size = 48,
}: MascotFDoctorProps) {
  return (
    <AnimatePresence>
      {!isTyping && (
        <motion.div
          key="mascot"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          aria-hidden="true"
          className="select-none"
          style={{ width: size, height: size }}
        >
          {isThinking ? (
            <WalkingMascot size={size} />
          ) : (
            <IdleMascot size={size} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Idle: gentle float ────────────────────────────────────────────────────── */
function IdleMascot({ size }: { size: number }) {
  return (
    <motion.div
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
    >
      <FDocSVG size={size} eyeState="open" walking={false} />
    </motion.div>
  );
}

/* ─── Thinking: walks left-to-right across the bar ─────────────────────────── */
function WalkingMascot({ size }: { size: number }) {
  return (
    <motion.div
      animate={{ x: [-28, 28, -28] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
    >
      <FDocSVG size={size} eyeState="thinking" walking />
    </motion.div>
  );
}

/* ─── SVG: letter-F with legs ───────────────────────────────────────────────── */
function FDocSVG({
  size,
  eyeState,
  walking,
}: {
  size: number;
  eyeState: "open" | "thinking";
  walking: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      overflow="visible"
    >
      {/* ── F body ── */}
      {/* Vertical bar */}
      <rect x="7" y="3" width="11" height="36" rx="3" fill="#3B82F6" />
      {/* Top horizontal bar */}
      <rect x="7" y="3" width="30" height="11" rx="3" fill="#3B82F6" />
      {/* Middle horizontal bar */}
      <rect x="7" y="19" width="22" height="9" rx="3" fill="#3B82F6" />

      {/* ── Eyes ── */}
      {eyeState === "open" ? (
        <>
          <circle cx="15" cy="10" r="2.8" fill="white" />
          <circle cx="26" cy="10" r="2.8" fill="white" />
          <circle cx="15.8" cy="10.8" r="1.4" fill="#1E3A5F" />
          <circle cx="26.8" cy="10.8" r="1.4" fill="#1E3A5F" />
          <circle cx="16.3" cy="9.8" r="0.6" fill="white" />
          <circle cx="27.3" cy="9.8" r="0.6" fill="white" />
        </>
      ) : (
        <>
          {/* Squinted walking eyes */}
          <path d="M13 10 Q15 7.5 17 10" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M24 10 Q26 7.5 28 10" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </>
      )}

      {/* ── Medical mask ── */}
      <rect x="9" y="26" width="23" height="13" rx="4" fill="white" opacity="0.97" />
      <line x1="9" y1="31" x2="32" y2="31" stroke="#BFDBFE" strokeWidth="1.2" />
      <line x1="9" y1="35" x2="32" y2="35" stroke="#BFDBFE" strokeWidth="1.2" />
      {/* Mask ties */}
      <line x1="9" y1="28.5" x2="5" y2="27" stroke="#93C5FD" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="9" y1="36.5" x2="5" y2="38" stroke="#93C5FD" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="32" y1="28.5" x2="36" y2="27" stroke="#93C5FD" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="32" y1="36.5" x2="36" y2="38" stroke="#93C5FD" strokeWidth="1.2" strokeLinecap="round" />
      {/* Medical cross */}
      <rect x="18" y="29.5" width="5" height="1.8" rx="0.9" fill="#3B82F6" opacity="0.55" />
      <rect x="19.6" y="27.9" width="1.8" height="5" rx="0.9" fill="#3B82F6" opacity="0.55" />

      {/* ── Legs ── */}
      <LeftLeg walking={walking} />
      <RightLeg walking={walking} />
    </svg>
  );
}

function LeftLeg({ walking }: { walking: boolean }) {
  if (!walking) {
    return (
      <g>
        <rect x="9" y="39" width="5" height="11" rx="2.5" fill="#2563EB" />
        <rect x="7" y="48" width="9" height="4" rx="2" fill="#1D4ED8" />
      </g>
    );
  }
  return (
    <motion.g
      animate={{ y: [0, -5, 0, 0] }}
      transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0 }}
    >
      <rect x="9" y="39" width="5" height="11" rx="2.5" fill="#2563EB" />
      <rect x="7" y="48" width="9" height="4" rx="2" fill="#1D4ED8" />
    </motion.g>
  );
}

function RightLeg({ walking }: { walking: boolean }) {
  if (!walking) {
    return (
      <g>
        <rect x="17" y="39" width="5" height="11" rx="2.5" fill="#2563EB" />
        <rect x="15" y="48" width="9" height="4" rx="2" fill="#1D4ED8" />
      </g>
    );
  }
  return (
    <motion.g
      animate={{ y: [-5, 0, 0, -5] }}
      transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0 }}
    >
      <rect x="17" y="39" width="5" height="11" rx="2.5" fill="#2563EB" />
      <rect x="15" y="48" width="9" height="4" rx="2" fill="#1D4ED8" />
    </motion.g>
  );
}
