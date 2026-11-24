import { DateTime } from "luxon";

export const DEFAULT_TIMEZONE = "Asia/Jakarta";
export const DATE_RANGES = [
  "last7",
  "last30",
  "thisMonth",
  "lastMonth",
  "thisYear",
  "all",
  "custom",
] as const;

export type DateRangeKey = (typeof DATE_RANGES)[number];

export function assertTimezone(timezone: string) {
  if (!DateTime.now().setZone(timezone).isValid) throw new Error("Invalid timezone");
  return timezone;
}

export function todayInput(timezone = DEFAULT_TIMEZONE, now = DateTime.now()) {
  return now.setZone(timezone).toISODate();
}

export function dateInputToUtc(value: string, timezone = DEFAULT_TIMEZONE) {
  const parsed = DateTime.fromISO(value, { zone: timezone }).startOf("day");
  if (!parsed.isValid) throw new Error("Invalid date");
  return parsed.toUTC().toJSDate();
}

export function dateToInput(value: Date, timezone = DEFAULT_TIMEZONE) {
  return DateTime.fromJSDate(value).setZone(timezone).toISODate();
}

export function formatDate(value: Date, timezone = DEFAULT_TIMEZONE) {
  return DateTime.fromJSDate(value).setZone(timezone).toFormat("dd MMM yyyy");
}

export function formatDateTime(value: Date, timezone = DEFAULT_TIMEZONE) {
  return DateTime.fromJSDate(value).setZone(timezone).toFormat("dd MMM yyyy, HH:mm");
}

export function resolveDateRange({
  range,
  from,
  to,
  timezone = DEFAULT_TIMEZONE,
  now = DateTime.now(),
}: {
  range: DateRangeKey;
  from?: string;
  to?: string;
  timezone?: string;
  now?: DateTime;
}) {
  assertTimezone(timezone);
  const zonedNow = now.setZone(timezone);
  let start: DateTime | null = null;
  let endExclusive: DateTime | null = zonedNow.startOf("day").plus({ days: 1 });

  switch (range) {
    case "last7":
      start = zonedNow.startOf("day").minus({ days: 6 });
      break;
    case "last30":
      start = zonedNow.startOf("day").minus({ days: 29 });
      break;
    case "thisMonth":
      start = zonedNow.startOf("month");
      endExclusive = start.plus({ months: 1 });
      break;
    case "lastMonth":
      start = zonedNow.startOf("month").minus({ months: 1 });
      endExclusive = start.plus({ months: 1 });
      break;
    case "thisYear":
      start = zonedNow.startOf("year");
      endExclusive = start.plus({ years: 1 });
      break;
    case "all":
      endExclusive = null;
      break;
    case "custom": {
      if (!from || !to) throw new Error("Custom range requires both dates");
      start = DateTime.fromISO(from, { zone: timezone }).startOf("day");
      endExclusive = DateTime.fromISO(to, { zone: timezone }).startOf("day").plus({ days: 1 });
      if (!start.isValid || !endExclusive.isValid) throw new Error("Invalid custom date range");
      if (start >= endExclusive) throw new Error("Start date must be before or equal to end date");
      break;
    }
  }

  return {
    from: start?.toUTC().toJSDate() ?? null,
    toExclusive: endExclusive?.toUTC().toJSDate() ?? null,
    fromInput: start?.toISODate() ?? "",
    toInput: endExclusive ? endExclusive.minus({ days: 1 }).toISODate()! : "",
  };
}

export function calculateHoldingDays(start: Date, end: Date, timezone = DEFAULT_TIMEZONE) {
  const startDay = DateTime.fromJSDate(start).setZone(timezone).startOf("day");
  const endDay = DateTime.fromJSDate(end).setZone(timezone).startOf("day");
  return Math.max(0, Math.floor(endDay.diff(startDay, "days").days));
}
