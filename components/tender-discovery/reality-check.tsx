"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  ArrowsClockwise,
  CaretDown,
  CheckCircle,
  ClipboardText,
  FileText,
  Info,
  Plus,
  ShieldWarning,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { importNoticeToWorkspace, isTenderDetail } from "@/lib/discovery/storage";
import { formatTenderDate } from "@/lib/discovery/model";
import type { TenderDetail, TenderNotice } from "@/lib/discovery/types";
import {
  EMPTY_PROFILE,
  emptyCheck,
  evaluateRealityCheck,
  officialRequirementLink,
  resultLabel,
  sourceChanges,
  sourceFingerprint,
  supplierContext,
  type Answer,
  type RecordedRequirement,
  type RequirementKind,
  type RealityCheck,
  type SupplierProfile,
} from "@/lib/suitability/model";
import {
  readRealityCheck,
  readRealityEntry,
  readSupplierProfile,
  writeRealityCheck,
  writeSupplierProfile,
} from "@/lib/suitability/storage";

const provinces = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
  "National",
];
const screenOptions = [
  { key: "result", label: "Result" },
  { key: "requirements", label: "Requirements" },
  { key: "plan", label: "Action plan" },
] as const;
type Screen = (typeof screenOptions)[number]["key"] | "profile";
const card =
  "rounded-3xl border border-neutral-200/80 bg-white p-5 dark:border-neutral-800 dark:bg-[#161918] sm:p-6";
const input =
  "min-h-11 w-full min-w-0 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-[#101714] outline-offset-2 focus-visible:outline-[#168B7A] dark:border-neutral-700 dark:bg-[#101714] dark:text-white";
const pill =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168B7A]";
const primary = pill + " bg-[#DDFB82] text-[#101714] hover:bg-[#d3ef77]";
const secondary =
  pill +
  " border border-neutral-300 bg-white text-[#101714] dark:border-neutral-700 dark:bg-[#1B241F] dark:text-white";

function downloadText(filename: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type: "text/markdown;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function TenderRealityCheck({ id }: { id: string }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [notice, setNotice] = useState<TenderNotice | null>(null);
  const [detail, setDetail] = useState<TenderDetail | null>(null);
  const [network, setNetwork] = useState<"loading" | "ready" | "cached">("loading");
  const [ready, setReady] = useState(false);
  const [retry, setRetry] = useState(0);
  const [profile, setProfile] = useState<SupplierProfile>(EMPTY_PROFILE);
  const [check, setCheck] = useState<RealityCheck>(() => emptyCheck(id));
  const [screen, setScreen] = useState<Screen>("result");
  const [message, setMessage] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newExcerpt, setNewExcerpt] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newPage, setNewPage] = useState("");
  const [newKind, setNewKind] = useState<RequirementKind>("mandatory");

  useEffect(() => {
    // Browser storage is not available to the server render. Hydrate in a cancellable
    // microtask instead of triggering a synchronous state cascade in the effect.
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const entry = readRealityEntry(id);
      const previous = readRealityCheck(id);
      setNotice(entry.notice);
      setDetail(entry.detail || previous.sourceSnapshot || null);
      setCheck(previous);
      setProfile(readSupplierProfile());
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/tenders/" + encodeURIComponent(id), {
          cache: "no-store",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(45000)]),
        });
        const json: unknown = await response.json();
        if (!response.ok || !isTenderDetail(json)) throw new Error("Unable to refresh source");
        if (!controller.signal.aborted) {
          setNotice(json);
          setDetail(json);
          setNetwork("ready");
        }
      } catch {
        if (!controller.signal.aborted) setNetwork("cached");
      }
    })();
    return () => controller.abort();
  }, [id, ready, retry]);

  const decision = evaluateRealityCheck(notice, detail, check, network === "ready");
  const assessed = Boolean(check.evaluatedAt);
  const changed = Boolean(
    detail && check.sourceFingerprint && check.sourceFingerprint !== sourceFingerprint(detail),
  );
  const diffs =
    detail && check.sourceSnapshot && changed ? sourceChanges(check.sourceSnapshot, detail) : [];
  const title = notice?.title || "Tender details unavailable";
  const mandatory = decision.criteria.filter((c) => c.kind === "mandatory");
  const fromSource = detail?.documents ?? [];

  const changeCheck = (patch: Partial<RealityCheck>) => {
    const next = { ...check, ...patch };
    if (detail && !next.sourceFingerprint) {
      next.sourceFingerprint = sourceFingerprint(detail);
      next.sourceSnapshot = detail;
    }
    try {
      writeRealityCheck(next);
      setCheck(next);
      setMessage("Saved in this browser.");
    } catch {
      setMessage(
        "Unable to save changes in this browser. Your previous saved record is unchanged.",
      );
    }
  };
  const changeProfile = (patch: Partial<SupplierProfile>) => {
    const next = { ...profile, ...patch, updatedAt: new Date().toISOString() };
    try {
      writeSupplierProfile(next);
      setProfile(next);
      setMessage("Profile saved in this browser.");
    } catch {
      setMessage("Unable to save your profile. Check browser storage.");
    }
  };
  const setAnswer = (key: string, answer: Answer) =>
    changeCheck({
      answers: { ...check.answers, [key]: answer },
      reviewed: { ...check.reviewed, [key]: false },
      evaluatedAt: "",
    });
  const markReviewed = (key: string, value: boolean) =>
    changeCheck({ reviewed: { ...check.reviewed, [key]: value }, evaluatedAt: "" });
  const assess = () => {
    if (changed)
      return setMessage(
        "Review changed source details first. An earlier assessment cannot be reused unchanged.",
      );
    changeCheck({ evaluatedAt: new Date().toISOString() });
    setScreen("result");
  };
  const acknowledgeChanges = () => {
    if (!detail) return;
    changeCheck({
      sourceFingerprint: sourceFingerprint(detail),
      sourceSnapshot: detail,
      reviewed: {},
      packReviewed: false,
      evaluatedAt: "",
    });
    setScreen("requirements");
  };
  const addRequirement = () => {
    if (
      !newLabel.trim() ||
      !newExcerpt.trim() ||
      !officialRequirementLink(newUrl) ||
      newExcerpt.trim().length < 12 ||
      newLabel.length > 180 ||
      newExcerpt.length > 1500
    ) {
      setMessage(
        "Enter a label, an excerpt of at least 12 characters and a direct National Treasury eTender document or listing URL.",
      );
      return;
    }
    if (check.manualRequirements.length >= 40) {
      setMessage("This local assessment supports up to 40 recorded requirements.");
      return;
    }
    const next: RecordedRequirement = {
      id: "manual-" + crypto.randomUUID(),
      label: newLabel.trim(),
      excerpt: newExcerpt.trim(),
      kind: newKind,
      sourceUrl: newUrl.trim(),
      page: newPage.trim().slice(0, 50),
      createdAt: new Date().toISOString(),
    };
    changeCheck({
      manualRequirements: [...check.manualRequirements, next],
      packReviewed: false,
      evaluatedAt: "",
    });
    setNewLabel("");
    setNewExcerpt("");
    setNewUrl("");
    setNewPage("");
  };
  const removeRequirement = (key: string) =>
    changeCheck({
      manualRequirements: check.manualRequirements.filter((r) => r.id !== key),
      packReviewed: false,
      evaluatedAt: "",
    });
  const actions = [
    {
      id: "official",
      title: "Review the full original tender pack",
      detail: "Read official forms, addenda, mandatory requirements and document links.",
    },
    ...decision.criteria
      .filter((c) => c.kind !== "evaluation" && c.state !== "reviewed_supported")
      .map((c) => ({
        id: c.id,
        title:
          c.state === "possible_conflict"
            ? "Resolve possible conflict: " + c.label
            : "Confirm: " + c.label,
        detail:
          c.source === "supplier_transcribed"
            ? "Validate your transcribed source and supporting evidence."
            : "Verify attendance with the procuring entity and original documentation.",
      })),
    {
      id: "csd",
      title: "Check CSD registration if required",
      detail: "Tender-specific requirement; your profile entry is self-reported.",
    },
    {
      id: "tcs",
      title: "Check SARS TCS Good Standing if required",
      detail: "Use SARS directly; do not enter tax numbers or TCS PIN here.",
    },
    {
      id: "submit",
      title: "Confirm official submission method and deadline",
      detail: "Bidcraft does not submit tenders or guarantee background alerts.",
    },
  ];
  const exportPlan = () => {
    const lines = [
      "# Tender Reality Check (self-reported, not official verification)",
      "",
      "Reference: " + (notice?.reference || id),
      "Tender: " + title,
      "Result: " + resultLabel(assessed ? decision.state : "not_assessed"),
      "Source checked: " + (detail?.checkedAt || "Unavailable"),
      "",
      "## Actions",
    ];
    for (const action of actions)
      lines.push(
        "- [" +
          (check.completedActions.includes(action.id) ? "x" : " ") +
          "] " +
          action.title +
          " — " +
          action.detail,
      );
    lines.push("", "## Requirements");
    for (const c of decision.criteria)
      lines.push(
        "- " +
          c.label +
          " | " +
          c.state +
          " | " +
          c.url +
          (c.page ? " | page " + c.page : "") +
          " | " +
          c.excerpt,
      );
    lines.push(
      "",
      "Source and supplier details must be independently checked. This does not verify eligibility, file a tender or send alerts.",
    );
    downloadText("bidcraft-reality-check-" + id + ".md", lines.join("\n"));
  };
  const proceed = () => {
    if (!notice) return setMessage("A valid source notice is needed to open a workspace.");
    try {
      importNoticeToWorkspace(notice);
      router.push("/#bid-studio");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to create a bid workspace.");
    }
  };
  const assessmentStatus = !assessed ? "not_assessed" : decision.state;

  return (
    <main
      id="workspace"
      className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-28 pt-6 sm:px-8 sm:pt-10 lg:pb-12"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/tenders"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#12695C] focus-visible:outline-[#168B7A] dark:text-[#9BDBBE]"
        >
          <ArrowLeft size={18} /> Back to Discover
        </Link>
        <span className="rounded-full border border-[#168B7A]/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#12695C] dark:text-[#9BDBBE]">
          Independent preparation tool
        </span>
      </div>
      <header className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#168B7A] dark:text-[#9BDBBE]">
          Tender Reality Check / South Africa
        </p>
        <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-[-.045em] sm:text-5xl">
          Should you bid?
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          {title}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400">
          <span className="font-mono">{notice?.reference || id}</span>
          <span>{notice?.province || "Province not published"}</span>
          <span>Closes {formatTenderDate(notice?.closesAt || null, true)} SAST</span>
        </div>
      </header>
      {network !== "ready" && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-50 p-4 text-xs leading-6 text-amber-950 dark:bg-[#302517] dark:text-amber-100"
        >
          <WarningCircle size={19} className="mt-0.5 shrink-0" />
          <p>
            {network === "loading"
              ? "Checking official source details…"
              : "Live source refresh unavailable. Any saved copy is only a reference; current tender information and eligibility are unconfirmed."}
          </p>
          {network === "cached" && (
            <button
              type="button"
              onClick={() => {
                setNetwork("loading");
                setRetry((n) => n + 1);
              }}
              className="ml-auto inline-flex min-h-11 items-center gap-1 font-semibold"
            >
              <ArrowsClockwise size={16} /> Retry
            </button>
          )}
        </div>
      )}
      {changed && (
        <section
          className={card + " border-amber-400/50"}
          aria-label="Source changed warning"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <WarningCircle size={24} className="shrink-0 text-amber-600" />
            <div className="space-y-2">
              <h2 className="font-bold">Source information changed</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Your previous answers and checks need to be reviewed against the latest official
                record. No silent reapproval.
              </p>
              <ul className="list-inside list-disc text-xs text-neutral-600 dark:text-neutral-300">
                {(diffs.length ? diffs : ["Source record differs from the saved snapshot"]).map(
                  (t) => (
                    <li key={t}>{t}</li>
                  ),
                )}
              </ul>
              <button type="button" className={secondary} onClick={acknowledgeChanges}>
                Review updated information
              </button>
            </div>
          </div>
        </section>
      )}
      {detail?.deadlineConflict && (
        <div
          role="alert"
          className="rounded-2xl border border-amber-400/50 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-900 dark:bg-[#302517] dark:text-amber-100"
        >
          The eTender listing and OCDS feed show different closing times. Confirm the time in the
          original documents.
        </div>
      )}
      <nav
        aria-label="Reality Check sections"
        className="flex gap-1 overflow-x-auto rounded-2xl bg-[#E8EDE5] p-1 dark:bg-[#1D2620]"
      >
        {screenOptions.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-current={screen === item.key ? "step" : undefined}
            onClick={() => setScreen(item.key)}
            className={
              "min-h-11 flex-1 whitespace-nowrap rounded-xl px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#168B7A] " +
              (screen === item.key
                ? "bg-white text-[#101714] shadow-sm dark:bg-[#DDFB82]"
                : "text-neutral-600 dark:text-neutral-300")
            }
          >
            {item.label}
          </button>
        ))}
      </nav>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={screen}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          className="space-y-5"
        >
          {screen === "result" && (
            <>
              <section className={card + " space-y-4"}>
                <p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#12695C] dark:text-[#9BDBBE]">
                  Your preliminary result
                </p>
                <div aria-live="polite" aria-atomic="true" className="flex items-start gap-3">
                  {assessmentStatus === "potential_blocker" ? (
                    <ShieldWarning size={27} className="shrink-0 text-amber-600" />
                  ) : assessmentStatus === "potential_fit" ? (
                    <CheckCircle size={27} className="shrink-0 text-[#168B7A]" />
                  ) : (
                    <Info size={27} className="shrink-0 text-[#168B7A]" />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                      {resultLabel(assessmentStatus)}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
                      {assessed
                        ? decision.reason
                        : "Review the tender sources and answer a few questions to get an explainable preliminary assessment."}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    ["Criteria recorded", decision.criteria.length],
                    ["Reviewed support", decision.supported],
                    ["To confirm", decision.unanswered],
                    ["Possible blockers", decision.blockers],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-[#F8F6EF] p-3 dark:bg-[#111A15]">
                      <p className="text-2xl font-semibold tabular-nums">{value}</p>
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-400">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={primary} onClick={() => setScreen("profile")}>
                    Add my business details <ArrowRight size={17} />
                  </button>
                  <button type="button" className={secondary} onClick={assess}>
                    Run suitability check
                  </button>
                </div>
              </section>
              <section className={card + " space-y-3"}>
                <h2 className="text-base font-bold">Why we are saying this</h2>
                {decision.criteria.length ? (
                  decision.criteria.slice(0, 3).map((c) => (
                    <div
                      className="flex items-start gap-2 border-b border-neutral-100 py-2 last:border-0 dark:border-neutral-800"
                      key={c.id}
                    >
                      {c.state === "possible_conflict" ? (
                        <WarningCircle size={18} className="shrink-0 text-amber-600" />
                      ) : (
                        <Info size={18} className="shrink-0 text-[#168B7A]" />
                      )}
                      <div>
                        <p className="text-sm font-semibold">{c.label}</p>
                        <p className="text-xs leading-6 text-neutral-500 dark:text-neutral-400">
                          {c.state.replaceAll("_", " ")} ·{" "}
                          {c.source === "notice_metadata"
                            ? "Treasury listing"
                            : "User-recorded source, not independently verified"}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-7 text-neutral-500">
                    No mandatory requirements have been established from the document pack. The
                    tender title alone cannot determine suitability.
                  </p>
                )}
                <button
                  type="button"
                  className={secondary}
                  onClick={() => setScreen("requirements")}
                >
                  Review each requirement <ArrowRight size={16} />
                </button>
              </section>
              <section className={card + " space-y-2"}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-bold">Your business context</h2>
                  <button
                    type="button"
                    className="min-h-11 text-xs font-bold text-[#12695C] dark:text-[#9BDBBE]"
                    onClick={() => setScreen("profile")}
                  >
                    Edit profile
                  </button>
                </div>
                <p className="text-xs leading-6 text-neutral-500 dark:text-neutral-400">
                  Advisory prompts from your saved, self-reported profile; these do not
                  independently establish eligibility.
                </p>
                <ul className="list-disc space-y-1 pl-4 text-xs leading-6 text-neutral-600 dark:text-neutral-300">
                  {supplierContext(notice, profile).map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </section>
              <section className={card + " space-y-2"}>
                <h2 className="text-sm font-bold">Important limitations</h2>
                <ul className="list-disc space-y-1 pl-4 text-xs leading-6 text-neutral-600 dark:text-neutral-300">
                  {decision.limitations.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </section>
            </>
          )}
          {screen === "profile" && (
            <section className={card + " space-y-5"}>
              <div>
                <h2 className="text-lg font-bold">A few details about your business</h2>
                <p className="mt-2 text-sm leading-7 text-neutral-500">
                  Saved only in this browser. All answers are self-reported and may be left blank;
                  no tax numbers, CSD credentials or bank details are needed.
                </p>
              </div>
              <label className="block space-y-2 text-sm font-semibold">
                Services your business provides
                <textarea
                  className={input + " min-h-24"}
                  maxLength={1500}
                  value={profile.services}
                  onChange={(e) => changeProfile({ services: e.target.value })}
                  placeholder="e.g. IT support, security maintenance"
                />
              </label>
              <label className="block space-y-2 text-sm font-semibold">
                Main province served
                <select
                  className={input}
                  value={profile.provinces[0] || ""}
                  onChange={(e) =>
                    changeProfile({ provinces: e.target.value ? [e.target.value] : [] })
                  }
                >
                  <option value="">Not specified</option>
                  {provinces.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2 text-sm font-semibold">
                Able to travel for onsite work?
                <select
                  className={input}
                  value={profile.travel}
                  onChange={(e) => changeProfile({ travel: e.target.value as Answer })}
                >
                  <option value="unknown">Not sure</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
              <label className="block space-y-2 text-sm font-semibold">
                CSD registration (self-reported)
                <select
                  className={input}
                  value={profile.csd}
                  onChange={(e) => changeProfile({ csd: e.target.value as SupplierProfile["csd"] })}
                >
                  <option value="unknown">Not sure</option>
                  <option value="registered">Registered</option>
                  <option value="in_progress">In progress</option>
                  <option value="not_registered">Not registered</option>
                </select>
              </label>
              <label className="block space-y-2 text-sm font-semibold">
                SARS TCS Good Standing (self-reported)
                <select
                  className={input}
                  value={profile.taxGoodStanding}
                  onChange={(e) => changeProfile({ taxGoodStanding: e.target.value as Answer })}
                >
                  <option value="unknown">Not sure</option>
                  <option value="yes">Reported good standing</option>
                  <option value="no">Not currently in good standing</option>
                </select>
              </label>
              <label className="block space-y-2 text-sm font-semibold">
                Relevant completed projects / experience
                <textarea
                  className={input + " min-h-20"}
                  maxLength={500}
                  value={profile.experience}
                  onChange={(e) => changeProfile({ experience: e.target.value })}
                  placeholder="Optional high-level description only"
                />
              </label>
              {/(construction|building|civil|infrastructure|works)/i.test(
                (notice?.category || "") + " " + (notice?.procurementType || "") + " " + title,
              ) && (
                <div className="space-y-3 rounded-xl bg-[#F8F6EF] p-3 dark:bg-[#101714]">
                  <p className="text-xs font-semibold">
                    Construction-specific (only if tender requires cidb registration)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs">
                      cidb class
                      <input
                        className={input}
                        maxLength={60}
                        value={profile.cidbClass}
                        onChange={(e) => changeProfile({ cidbClass: e.target.value })}
                        placeholder="e.g. GB"
                      />
                    </label>
                    <label className="text-xs">
                      cidb grade
                      <input
                        className={input}
                        maxLength={30}
                        value={profile.cidbGrade}
                        onChange={(e) => changeProfile({ cidbGrade: e.target.value })}
                        placeholder="e.g. 3"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Class and grade must be verified together against the specific tender and
                    official cidb records.
                  </p>
                </div>
              )}
              <button type="button" className={primary} onClick={() => setScreen("requirements")}>
                Continue to requirements <ArrowRight size={17} />
              </button>
            </section>
          )}
          {screen === "requirements" && (
            <>
              <section className={card + " space-y-3"}>
                <h2 className="text-lg font-bold">Mandatory and supporting requirements</h2>
                <p className="text-sm leading-7 text-neutral-600 dark:text-neutral-300">
                  Treasury notice fields are separate from the tender PDF. Only requirements you
                  manually record from the source pack appear below; the app does not automatically
                  analyse or verify linked PDFs.
                </p>
                {detail?.conditions && (
                  <details className="rounded-xl bg-[#F8F6EF] p-3 dark:bg-[#101714]">
                    <summary className="min-h-11 cursor-pointer text-sm font-semibold">
                      Read published conditions <CaretDown size={15} className="inline" />
                    </summary>
                    <p className="whitespace-pre-wrap text-xs leading-6">{detail.conditions}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      These fields are unclassified text, not automatically assumed to be
                      disqualifying conditions.
                    </p>
                  </details>
                )}
                {!decision.criteria.length && (
                  <p className="rounded-xl border border-neutral-200 p-4 text-sm text-neutral-500 dark:border-neutral-800">
                    No confirmed mandatory requirements recorded. Check the original document pack
                    first.
                  </p>
                )}
                {decision.criteria.map((c) => (
                  <details
                    key={c.id}
                    className="group rounded-2xl border border-neutral-200 p-3 dark:border-neutral-700"
                  >
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-[#168B7A]">
                      <span className="min-w-0">
                        {c.label}
                        <span className="mt-1 block text-[11px] font-normal text-neutral-500">
                          {c.kind} · {c.state.replaceAll("_", " ")}
                        </span>
                      </span>
                      <CaretDown
                        size={18}
                        className="shrink-0 transition-transform group-open:rotate-180"
                      />
                    </summary>
                    <div className="space-y-3 pt-3 text-xs leading-6">
                      <p className="whitespace-pre-wrap rounded-xl bg-[#F8F6EF] p-3 text-neutral-600 dark:bg-[#101714] dark:text-neutral-300">
                        {c.excerpt}
                      </p>
                      <p>
                        {c.source === "notice_metadata"
                          ? "Source: Treasury listing metadata. Original PDF has not been examined."
                          : "Source: supplier-transcribed excerpt. Bidcraft has not validated the document text."}
                        {c.page ? " · Page " + c.page : ""}
                      </p>
                      {officialRequirementLink(c.url) && (
                        <a
                          className="inline-flex min-h-11 items-center gap-1 font-bold text-[#12695C] dark:text-[#9BDBBE]"
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open official source <ArrowSquareOut size={16} />
                        </a>
                      )}
                      <label className="block space-y-2 font-semibold">
                        Does your business meet this criterion?
                        <select
                          className={input}
                          aria-label={"Answer for " + c.label}
                          value={c.answer}
                          onChange={(e) => setAnswer(c.id, e.target.value as Answer)}
                        >
                          <option value="unknown">Not sure / need to confirm</option>
                          <option value="yes">Yes, self-reported</option>
                          <option value="no">No, self-reported</option>
                        </select>
                      </label>
                      <label className="flex min-h-11 items-start gap-3 text-xs">
                        <input
                          type="checkbox"
                          className="mt-1 size-4 accent-[#168B7A]"
                          checked={c.reviewed}
                          disabled={c.answer !== "yes"}
                          onChange={(e) => markReviewed(c.id, e.target.checked)}
                        />
                        <span>
                          I personally checked supporting evidence for this answer. This is not
                          government verification.
                        </span>
                      </label>
                      {c.source === "supplier_transcribed" && (
                        <button
                          type="button"
                          className="inline-flex min-h-11 items-center gap-2 font-bold text-rose-700 dark:text-rose-300"
                          onClick={() => removeRequirement(c.id)}
                        >
                          <X size={15} /> Remove recorded requirement
                        </button>
                      )}
                    </div>
                  </details>
                ))}
              </section>
              <section className={card + " space-y-3"}>
                <h2 className="text-base font-bold">Record a requirement from the original pack</h2>
                <p className="text-xs leading-6 text-neutral-500">
                  Paste the exact passage and official source URL yourself. Do not upload private
                  bid documents. This does not automatically validate the excerpt.
                </p>
                <label className="block space-y-1 text-xs font-bold">
                  Requirement title
                  <input
                    className={input}
                    value={newLabel}
                    maxLength={180}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g. Three reference letters"
                  />
                </label>
                <label className="block space-y-1 text-xs font-bold">
                  Type
                  <select
                    className={input}
                    value={newKind}
                    onChange={(e) => setNewKind(e.target.value as RequirementKind)}
                  >
                    <option value="mandatory">Mandatory condition (as specified by buyer)</option>
                    <option value="submission">Document to submit</option>
                    <option value="evaluation">Evaluation / preference criterion</option>
                  </select>
                </label>
                <label className="block space-y-1 text-xs font-bold">
                  Exact source excerpt
                  <textarea
                    className={input + " min-h-24"}
                    value={newExcerpt}
                    maxLength={1500}
                    onChange={(e) => setNewExcerpt(e.target.value)}
                    placeholder="Copy the requirement from the tender documentation"
                  />
                </label>
                <label className="block space-y-1 text-xs font-bold">
                  Official eTender document or listing URL
                  <input
                    className={input}
                    type="url"
                    value={newUrl}
                    maxLength={1500}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://www.etenders.gov.za/..."
                  />
                </label>
                <label className="block space-y-1 text-xs font-bold">
                  Document page (optional)
                  <input
                    className={input}
                    value={newPage}
                    maxLength={50}
                    onChange={(e) => setNewPage(e.target.value)}
                    placeholder="e.g. 12"
                  />
                </label>
                <button type="button" className={secondary} onClick={addRequirement}>
                  <Plus size={17} /> Add sourced requirement
                </button>
                <label className="flex items-start gap-3 rounded-xl bg-[#F8F6EF] p-4 text-xs leading-6 dark:bg-[#101714]">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 shrink-0 accent-[#168B7A]"
                    checked={check.packReviewed}
                    onChange={(e) =>
                      changeCheck({ packReviewed: e.target.checked, evaluatedAt: "" })
                    }
                  />
                  <span>
                    I personally reviewed the original tender pack and have recorded its mandatory
                    conditions, including amendments. This is a self-attestation, not an automated
                    document scan or official certification.
                  </span>
                </label>
                <button type="button" className={primary} onClick={assess}>
                  Update Reality Check <ArrowRight size={17} />
                </button>
              </section>
              <section className={card + " space-y-2"}>
                <h2 className="text-sm font-bold">Official attachments ({fromSource.length})</h2>
                {fromSource.length ? (
                  fromSource.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-11 items-center gap-2 text-xs font-semibold text-[#12695C] dark:text-[#9BDBBE]"
                    >
                      <FileText size={17} className="shrink-0" />
                      <span className="min-w-0 break-words">{doc.title}</span>
                      <ArrowSquareOut size={15} className="shrink-0" />
                    </a>
                  ))
                ) : (
                  <p className="text-xs text-neutral-500">
                    No linked files returned. Use the official portal.
                  </p>
                )}
              </section>
            </>
          )}
          {screen === "plan" && (
            <>
              <section className={card + " space-y-3"}>
                <h2 className="text-lg font-bold">Your preparation plan</h2>
                <p className="text-sm leading-7 text-neutral-500">
                  Actions are based on recorded requirements and general checks, not a certification
                  or guaranteed deadline reminder.
                </p>
                <p className="text-xs font-bold text-[#12695C] dark:text-[#9BDBBE]">
                  {check.completedActions.length} of {actions.length} marked complete in this
                  browser
                </p>
                {actions.map((action, index) => (
                  <label
                    className="flex min-h-14 items-start gap-3 border-b border-neutral-100 py-3 last:border-0 dark:border-neutral-800"
                    key={action.id}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 size-5 shrink-0 accent-[#168B7A]"
                      checked={check.completedActions.includes(action.id)}
                      onChange={(e) =>
                        changeCheck({
                          completedActions: e.target.checked
                            ? [...check.completedActions, action.id]
                            : check.completedActions.filter((x) => x !== action.id),
                        })
                      }
                    />
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">
                        {index + 1}. {action.title}
                      </span>
                      <span className="mt-1 block text-xs leading-6 text-neutral-500 dark:text-neutral-400">
                        {action.detail}
                      </span>
                    </span>
                  </label>
                ))}
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={secondary} onClick={exportPlan}>
                    <ClipboardText size={17} /> Export checklist (.md)
                  </button>
                  <button type="button" className={primary} onClick={proceed}>
                    Prepare bid <ArrowRight size={17} />
                  </button>
                </div>
              </section>
            </>
          )}
        </motion.div>
      </AnimatePresence>
      {screen !== "profile" && (
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-[#12695C] dark:text-[#9BDBBE]"
          onClick={() => setScreen("profile")}
        >
          <FileText size={16} /> Edit reusable business profile
        </button>
      )}
      {message && (
        <div
          role="status"
          className="rounded-xl bg-[#E8F1E9] p-3 text-xs text-[#12695C] dark:bg-[#24342A] dark:text-[#9BDBBE]"
        >
          {message}
          <button
            type="button"
            aria-label="Dismiss message"
            className="ml-4 min-h-11 font-semibold"
            onClick={() => setMessage("")}
          >
            Dismiss
          </button>
        </div>
      )}
      <footer className="space-y-2 border-t border-neutral-200 pt-5 text-xs leading-6 text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
        <p>
          Bidcraft does not verify CSD, SARS or cidb status, certify eligibility, submit bids or
          send guaranteed notifications. Your profile and work are stored only in this browser.
          Manual inputs and sources require independent review.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={notice?.sourceUrl || "https://www.etenders.gov.za/Home/opportunities?id=1"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1 font-bold text-[#12695C] dark:text-[#9BDBBE]"
          >
            Official portal <ArrowSquareOut size={15} />
          </a>
          <Link href="/privacy" className="inline-flex min-h-11 items-center">
            Privacy
          </Link>
          <Link href="/data-sources" className="inline-flex min-h-11 items-center">
            Data sources
          </Link>
          <Link href="/ai-disclosure" className="inline-flex min-h-11 items-center">
            AI limitations
          </Link>
        </div>
      </footer>
    </main>
  );
}
