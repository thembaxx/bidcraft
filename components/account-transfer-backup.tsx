"use client";

import { useState } from "react";
import { DownloadSimple, ShieldCheck, WarningCircle } from "@phosphor-icons/react";
import {
  LOCAL_TENDERS_STORAGE_KEY,
  createAccountTransferBackup,
  previewAccountTransfer,
  type AccountTransferPreview,
} from "@/lib/account-transfer";

export function AccountTransferBackup() {
  const [preview, setPreview] = useState<AccountTransferPreview | null>(null);
  const [message, setMessage] = useState("");

  function inspect() {
    setMessage("");
    try {
      setPreview(previewAccountTransfer(window.localStorage.getItem(LOCAL_TENDERS_STORAGE_KEY)));
    } catch {
      setPreview({
        status: "invalid",
        reason: "Browser storage is unavailable. No data was changed.",
        projects: [],
      });
    }
  }

  function download() {
    if (preview?.status !== "ready") return;
    try {
      const json = createAccountTransferBackup(preview.projects);
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "bidcraft-local-workspace-backup.json";
      a.click();
      URL.revokeObjectURL(url);
      setMessage(
        "Your local transfer backup was prepared. Store it privately. No data was uploaded.",
      );
    } catch {
      setMessage("Could not prepare the backup. Your saved projects were not changed.");
    }
  }

  return (
    <section aria-label="Local account transfer backup" className="space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-[.12em] text-neutral-500 dark:text-neutral-400">
        Local workspace recovery
      </p>
      <p className="text-xs leading-5 text-neutral-600 dark:text-neutral-300">
        Review and download a versioned copy of all your saved local bids before connecting a future
        account. This does not sign you in, create an account or upload proposals.
      </p>
      <button
        type="button"
        className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-neutral-200 px-3 text-left text-xs font-semibold transition-colors hover:bg-[#E8ECE5] dark:border-neutral-700 dark:hover:bg-white/10"
        onClick={inspect}
      >
        <ShieldCheck
          size={18}
          className="shrink-0 text-[#168B7A] dark:text-[#9BDBBE]"
          aria-hidden="true"
        />
        Review local projects
      </button>
      {preview?.status === "ready" && (
        <>
          <p role="status" className="text-xs leading-5">
            {preview.count} locally saved {preview.count === 1 ? "project" : "projects"} can be
            included. No automatic cloud upload will occur.
          </p>
          <p className="text-xs leading-5 text-neutral-600 dark:text-neutral-300">
            This file is readable JSON and can contain confidential bid, document and proposal
            details. Save it securely.
          </p>
          <button
            type="button"
            onClick={download}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl bg-[#DDFB82] px-3 text-left text-xs font-bold text-[#101714]"
          >
            <DownloadSimple size={18} aria-hidden="true" /> Download reviewed workspace
          </button>
        </>
      )}
      {preview?.status === "empty" && (
        <p role="status" className="text-xs">
          No saved local workspace was found. Nothing to download.
        </p>
      )}
      {preview?.status === "invalid" && (
        <p
          role="alert"
          className="flex items-start gap-2 text-xs leading-5 text-amber-700 dark:text-amber-300"
        >
          <WarningCircle size={18} className="shrink-0" aria-hidden="true" />
          {preview.reason}
        </p>
      )}
      {message && (
        <p role="status" className="text-xs leading-5">
          {message}
        </p>
      )}
    </section>
  );
}
