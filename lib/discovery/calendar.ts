import type { TenderNotice } from "./types";

function escapeCalendar(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}
function utc(value: Date) {
  return value
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

/** Opt-in calendar download; delivery of notifications is controlled by the user's calendar. */
export function downloadTenderReminder(notice: TenderNotice): boolean {
  if (!notice.closesAt) return false;
  const start = new Date(notice.closesAt);
  if (!Number.isFinite(start.getTime()) || start.getTime() <= Date.now()) return false;
  const end = new Date(start.getTime() + 15 * 60000);
  const filename =
    ("bidcraft-" + (notice.reference || notice.id)).replace(/[^a-z0-9-_]/gi, "-").slice(0, 75) +
    ".ics";
  const payload =
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Bidcraft//Tender Deadline Reminder//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:bidcraft-" + notice.id + "@reminders.local",
      "DTSTAMP:" + utc(new Date()),
      "DTSTART:" + utc(start),
      "DTEND:" + utc(end),
      "SUMMARY:" + escapeCalendar("Tender deadline: " + notice.reference),
      "DESCRIPTION:" +
        escapeCalendar(
          notice.title +
            "\n" +
            notice.buyer +
            "\nCheck official amendments and submission instructions before the deadline.",
        ),
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:Check the official tender deadline and prepare your submission.",
      "TRIGGER:-P1D",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n") + "\r\n";
  const blob = new Blob([payload], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
