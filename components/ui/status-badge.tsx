"use client";

// Adapted from EasyUI Badge (MIT © 2026 Suraj Maurya).
// A bounded, status-driven component; never indicates verified eligibility.
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "danger";
const tones: Record<Tone, string> = {
  neutral:
    "border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
  success: "border-[#168B7A]/25 bg-[#168B7A]/10 text-[#12695C] dark:text-[#9BDBBE]",
  warning: "border-amber-400/35 bg-amber-50 text-[#805218] dark:bg-[#302517] dark:text-amber-200",
  danger: "border-rose-400/35 bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
};

export function StatusBadge({
  children,
  tone = "neutral",
  dot = false,
  pulse = false,
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <span
      className={
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-tight " +
        tones[tone] +
        " " +
        className
      }
    >
      {dot && (
        <span aria-hidden="true" className="relative inline-flex size-1.5 shrink-0">
          {pulse && !reducedMotion && (
            <motion.span
              className="absolute inset-0 rounded-full bg-current"
              animate={{ scale: [1, 2.1], opacity: [0.35, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          <span className="relative size-1.5 rounded-full bg-current" />
        </span>
      )}
      <span className="min-w-0">{children}</span>
    </span>
  );
}
