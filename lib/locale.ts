export const SOUTH_AFRICAN_LOCALE = "en-ZA";
export const SOUTH_AFRICAN_TIME_ZONE = "Africa/Johannesburg";

export function formatSouthAfricanDate(value: string | null, withTime = false): string {
  if (!value) return "Not published";
  // Older snapshots stored local times without an offset. Interpret those as SAST.
  const normalised = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(value)
    ? `${value.replace(" ", "T")}+02:00`
    : value;
  const date = new Date(normalised);
  if (!Number.isFinite(date.getTime())) return "Not published";
  return new Intl.DateTimeFormat(SOUTH_AFRICAN_LOCALE, {
    timeZone: SOUTH_AFRICAN_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" as const } : {}),
  }).format(date);
}

export function formatRand(value: number): string {
  return new Intl.NumberFormat(SOUTH_AFRICAN_LOCALE, { style: "currency", currency: "ZAR" }).format(
    value,
  );
}
