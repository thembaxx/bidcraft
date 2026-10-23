"use client";

// Adapted from EasyUI FAQ (MIT © 2026 Suraj Maurya).
// Retains keyboard/ARIA semantics and uses Bidcraft styling + Phosphor.
import { useId, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";

export interface FAQItem {
  id: string;
  question: string;
  answer: ReactNode;
}

export function FAQ({
  items,
  defaultOpen,
  searchable = false,
}: {
  items: FAQItem[];
  defaultOpen?: string;
  searchable?: boolean;
}) {
  const [active, setActive] = useState<string | null>(defaultOpen || null);
  const [search, setSearch] = useState("");
  const id = useId();
  const reducedMotion = useReducedMotion();
  const filtered = useMemo(
    () => items.filter((item) => item.question.toLowerCase().includes(search.trim().toLowerCase())),
    [items, search],
  );
  return (
    <div className="space-y-3">
      {searchable && (
        <label className="relative block">
          <span className="sr-only">Search common questions</span>
          <MagnifyingGlass
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#168B7A]"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search questions…"
            className="min-h-11 w-full rounded-xl border border-neutral-200 bg-[#F8F6EF] pl-10 pr-4 text-sm outline-offset-2 focus-visible:outline-[#168B7A] dark:border-neutral-700 dark:bg-[#0D0F0E]"
          />
        </label>
      )}
      <div className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {filtered.map((item) => {
          const open = active === item.id;
          const contentId = id + "-" + item.id + "-content",
            triggerId = id + "-" + item.id + "-trigger";
          return (
            <div key={item.id}>
              <h3>
                <button
                  type="button"
                  id={triggerId}
                  aria-expanded={open}
                  aria-controls={contentId}
                  onClick={() => setActive(open ? null : item.id)}
                  className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-[#168B7A]/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#168B7A] sm:px-5"
                >
                  {item.question}
                  <motion.span
                    aria-hidden="true"
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={
                      reducedMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 360, damping: 29 }
                    }
                  >
                    <CaretDown size={18} />
                  </motion.span>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    key="content"
                    id={contentId}
                    role="region"
                    aria-labelledby={triggerId}
                    initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={
                      reducedMotion
                        ? { opacity: 0, transition: { duration: 0 } }
                        : { height: 0, opacity: 0 }
                    }
                    transition={
                      reducedMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 270, damping: 32 }
                    }
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-5 text-sm leading-7 text-neutral-600 dark:text-neutral-300 sm:px-5">
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <p role="status" className="text-sm text-neutral-500">
          No questions match. Try a different phrase.
        </p>
      )}
    </div>
  );
}
