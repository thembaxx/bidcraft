"use client";

// EasyUI FAQ presentation; content stays explicit about Bidcraft's real limits.
import Link from "next/link";
import { FAQ, type FAQItem } from "@/components/ui/faq";

const questions: FAQItem[] = [
  {
    id: "storage",
    question: "Where are my proposals stored?",
    answer: (
      <>
        Tender work is saved in this browser’s local storage, not synced across devices. Export
        important drafts; clearing site data can remove local work. Bidcraft currently has no
        account-based cloud backup.
      </>
    ),
  },
  {
    id: "offline",
    question: "What can I do offline?",
    answer: (
      <>
        Some visited pages and locally saved work may be accessible after an online visit. This is
        not guaranteed. Local editing and exports may work, but live tender updates and AI drafting,
        audits or OCR require connectivity and suitable server configuration.
      </>
    ),
  },
  {
    id: "demo",
    question: "Are the example records real company evidence?",
    answer: (
      <>
        No. Example tenders and supporting evidence are fictional demonstration content, separate
        from the live notices in discovery. They do not prove your organisation’s certifications,
        insurance or capabilities.
      </>
    ),
  },
  {
    id: "privacy",
    question: "How is personal information handled?",
    answer: (
      <>
        Using AI sends selected clauses, documents and evidence to Bidcraft’s server and Google
        Gemini. Google’s unpaid API terms can allow submitted material to improve services and
        involve human review; the operator must verify actual billing and processing arrangements.
        Avoid confidential or personal material without suitable rights and safeguards. Read the{" "}
        <Link
          className="font-semibold text-[#12695C] underline underline-offset-2 dark:text-[#9BDBBE]"
          href="/privacy"
        >
          privacy notice
        </Link>{" "}
        and{" "}
        <Link
          className="font-semibold text-[#12695C] underline underline-offset-2 dark:text-[#9BDBBE]"
          href="/ai-disclosure"
        >
          AI limitations
        </Link>
        .
      </>
    ),
  },
  {
    id: "accuracy",
    question: "Are tender listings and deadlines guaranteed current?",
    answer: (
      <>
        No. National Treasury source data and locally saved records can be incomplete or outdated,
        and source timestamps may disagree. Confirm availability, briefings, requirements,
        amendments and submission times directly with the procuring entity. See{" "}
        <Link
          className="font-semibold text-[#12695C] underline underline-offset-2 dark:text-[#9BDBBE]"
          href="/data-sources"
        >
          data sources and reliability
        </Link>
        .
      </>
    ),
  },
  {
    id: "eligibility",
    question: "Does a compliance score guarantee eligibility?",
    answer: (
      <>
        No. AI grades and suggested wording are review aids, not verified compliance, professional
        certification or procurement advice. Validate all claims, contractual commitments and
        eligibility requirements with your bid team and the original documents. Bidcraft does not
        submit bids.
      </>
    ),
  },
];

export function AboutFaq() {
  return <FAQ items={questions} defaultOpen="storage" searchable />;
}
