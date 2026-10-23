"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, House, MagnifyingGlass } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";

const destinations = [
  { href: "/today", label: "Today", icon: House, key: "today" },
  { href: "/tenders", label: "Discover", icon: MagnifyingGlass, key: "discover" },
  { href: "/#workspace", label: "My bids", icon: Briefcase, key: "bids" },
] as const;

/** App-level navigation, not a substitute for the tools inside an individual bid. */
export function MobileGlobalNav() {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const active = pathname.startsWith("/today")
    ? "today"
    : pathname.startsWith("/tenders")
      ? "discover"
      : "bids";

  return (
    <nav
      aria-label="Main mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dfe3dc] bg-[#F8F6EF]/95 px-3 pt-2 backdrop-blur-xl dark:border-[#344237] dark:bg-[#101714]/95 lg:hidden"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-3 gap-1">
        {destinations.map(({ href, label, icon: Icon, key }) => {
          const selected = active === key;
          return (
            <Link
              key={key}
              href={href}
              aria-current={selected ? "page" : undefined}
              className={
                "relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[11px] font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168B7A] " +
                (selected
                  ? "text-[#101714] dark:text-[#101714]"
                  : "text-[#626b66] hover:bg-[#168B7A]/10 dark:text-[#aab7ad]")
              }
            >
              {selected && (
                <motion.span
                  className="absolute inset-0 rounded-2xl bg-[#DDFB82]"
                  initial={reducedMotion ? false : { opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  aria-hidden="true"
                />
              )}
              <Icon
                size={21}
                weight={selected ? "fill" : "regular"}
                className="relative z-10"
                aria-hidden="true"
              />
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
