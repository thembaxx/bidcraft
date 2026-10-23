import Link from "next/link";

const links = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/data-sources", label: "Data sources" },
  { href: "/ai-disclosure", label: "AI limitations" },
  { href: "/legal", label: "Legal information" },
];

export function LegalFooter() {
  return (
    <footer
      aria-label="Legal and data transparency"
      className="border-t border-neutral-200/80 bg-[#F8F6EF] px-5 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-7 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-[#0D0F0E] dark:text-neutral-400 lg:pb-8"
    >
      <div className="mx-auto flex max-w-[1536px] flex-wrap items-start justify-between gap-5">
        <div className="max-w-md space-y-1">
          <p className="font-semibold text-[#101714] dark:text-neutral-100">
            Bidcraft is an independent bid-preparation tool.
          </p>
          <p className="leading-6">
            Not affiliated with government. Tender data and AI outputs may be incomplete. Always
            verify the official documents and submit directly to the procuring entity.
          </p>
        </div>
        <nav aria-label="Policies" className="flex max-w-xl flex-wrap gap-x-5 gap-y-3">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              className="min-h-10 content-center font-semibold transition-colors hover:text-[#168B7A] dark:hover:text-[#9BDBBE]"
              href={href}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
