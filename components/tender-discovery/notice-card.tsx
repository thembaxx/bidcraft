"use client";

import {
  ArrowUpRight,
  BookmarkSimple,
  CalendarBlank,
  MapPin,
  Paperclip,
} from "@phosphor-icons/react";
import { formatTenderDate } from "@/lib/discovery/model";
import type { TenderNotice } from "@/lib/discovery/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export function NoticeCard({
  notice,
  saved,
  now,
  onOpen,
  onSave,
}: {
  notice: TenderNotice;
  saved: boolean;
  now: number;
  onOpen: () => void;
  onSave: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const passed = notice.closesAt && Date.parse(notice.closesAt) < now;
  const closingSoon =
    notice.closesAt && !passed && Date.parse(notice.closesAt) - now < 7 * 86400000;
  const briefingPassed =
    notice.briefing === "required" && notice.briefingAt && Date.parse(notice.briefingAt) < now;
  return (
    <motion.article
      className="discovery-notice"
      aria-label={`Tender ${notice.reference}`}
      variants={
        reducedMotion
          ? undefined
          : {
              hidden: { opacity: 0, y: 10 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { type: "spring", stiffness: 220, damping: 27 },
              },
            }
      }
    >
      <div className="discovery-notice-body">
        <div className="discovery-notice-kicker">
          <span className="discovery-reference">{notice.reference}</span>
          <span className="discovery-source">
            <span aria-hidden="true" /> National Treasury
          </span>
        </div>
        <h3>
          <button type="button" onClick={onOpen}>
            {notice.title}
            <ArrowUpRight size={20} aria-hidden="true" />
          </button>
        </h3>
        <p className="discovery-buyer">{notice.buyer || "Buyer not published"}</p>
        <div className="discovery-notice-meta">
          <span>
            <MapPin size={15} aria-hidden="true" />
            {notice.province || "Province not published"}
          </span>
          <span>
            <CalendarBlank size={15} aria-hidden="true" />
            {passed ? "Deadline passed" : "Closes"} {formatTenderDate(notice.closesAt)}
          </span>
          {notice.documentCount > 0 && (
            <span>
              <Paperclip size={15} aria-hidden="true" />
              {notice.documentCount} {notice.documentCount === 1 ? "document" : "documents"}
            </span>
          )}
        </div>
        <div className="discovery-notice-tags">
          <span>{notice.category || "Category not published"}</span>
          {closingSoon && (
            <StatusBadge tone="warning" dot pulse>
              Closing soon
            </StatusBadge>
          )}
          {notice.briefing === "required" && (
            <StatusBadge tone="warning" dot={Boolean(briefingPassed)}>
              {briefingPassed ? "Briefing may have passed" : "Compulsory briefing"}
            </StatusBadge>
          )}
          {notice.noticeKind !== "opportunity" && (
            <span>{notice.noticeKind === "results" ? "Result notice" : "Information request"}</span>
          )}
        </div>
      </div>
      <motion.button
        type="button"
        className="discovery-bookmark"
        onClick={onSave}
        aria-label={`${saved ? "Unsave" : "Save"} tender ${notice.reference}`}
        aria-pressed={saved}
        whileTap={reducedMotion ? undefined : { scale: 0.94 }}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={saved ? "saved" : "unsaved"}
            className="inline-flex"
            initial={reducedMotion ? false : { opacity: 0.5, scale: 0.65 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.65 }}
            transition={
              reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 24 }
            }
          >
            <BookmarkSimple size={21} weight={saved ? "fill" : "regular"} aria-hidden="true" />
          </motion.span>
        </AnimatePresence>
        <span>{saved ? "Saved" : "Save"}</span>
      </motion.button>
    </motion.article>
  );
}
