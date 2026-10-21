// Adapted from EasyUI Alert. MIT © 2026 Suraj Maurya. See THIRD_PARTY_NOTICES.md.
"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { WarningCircle, CheckCircle, Info, Warning, X, type Icon } from "@phosphor-icons/react";
import { cn } from "../../lib/utils";

export type AlertTone = "neutral" | "info" | "success" | "warning" | "danger";

const tones: Record<AlertTone, { box: string; icon: string; Icon: Icon }> = {
  neutral: {
    box: "border-neutral-200 bg-neutral-50/70 dark:border-neutral-800 dark:bg-neutral-900/60",
    icon: "text-neutral-500 dark:text-neutral-400",
    Icon: Info,
  },
  info: {
    box: "border-sky-200 bg-sky-50/70 dark:border-sky-500/30 dark:bg-sky-500/12",
    icon: "text-sky-600 dark:text-sky-400",
    Icon: Info,
  },
  success: {
    box: "border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-500/12",
    icon: "text-emerald-600 dark:text-emerald-400",
    Icon: CheckCircle,
  },
  warning: {
    box: "border-amber-200 bg-amber-50/70 dark:border-amber-500/30 dark:bg-amber-500/12",
    icon: "text-amber-600 dark:text-amber-400",
    Icon: Warning,
  },
  danger: {
    box: "border-red-200 bg-red-50/70 dark:border-red-500/30 dark:bg-red-500/12",
    icon: "text-red-600 dark:text-red-400",
    Icon: WarningCircle,
  },
};

export interface AlertProps extends Omit<React.ComponentProps<"div">, "title"> {
  tone?: AlertTone;
  /** Custom icon, or `false` for none. */
  icon?: React.ReactNode | false;
  dismissible?: boolean;
  /** Fires after the collapse animation finishes. */
  onDismiss?: () => void;
  /** Right-side slot, e.g. a button. */
  action?: React.ReactNode;
}

export function Alert({
  tone = "neutral",
  icon,
  dismissible,
  onDismiss,
  action,
  className,
  children,
  ...props
}: AlertProps) {
  const [visible, setVisible] = React.useState(true);
  const t = tones[tone];
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false} onExitComplete={onDismiss}>
      {visible && (
        <motion.div
          key="alert"
          initial={false}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.25, ease: [0.32, 0.72, 0, 1] }}
          className="overflow-hidden"
        >
          <div
            role={tone === "danger" || tone === "warning" ? "alert" : "status"}
            className={cn("flex items-start gap-3 rounded-xl border p-4 text-sm", t.box, className)}
            {...props}
          >
            {icon !== false && (
              <span className={cn("mt-0.5 shrink-0 [&>svg]:size-4", t.icon)}>{icon ?? <t.Icon />}</span>
            )}
            <div className="min-w-0 flex-1">{children}</div>
            {action && <div className="-my-1 shrink-0">{action}</div>}
            {dismissible && (
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setVisible(false)}
                className="-mr-1 -mt-1 grid size-7 shrink-0 place-items-center rounded-lg text-neutral-400 outline-none transition hover:bg-black/5 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-400/50 active:scale-95 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-neutral-600/60"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AlertTitle({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("font-medium text-neutral-900 dark:text-neutral-100", className)} {...props} />;
}

export function AlertDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("mt-0.5 text-neutral-600 dark:text-neutral-400", className)} {...props} />;
}
