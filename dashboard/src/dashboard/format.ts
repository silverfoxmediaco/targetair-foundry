/** Shared formatters. Dates are pinned to UTC so the displayed day never
 *  shifts with the reader's timezone — the ontology stores these as datetimes
 *  at midnight, which is one timezone away from showing the previous day. */

export function shortDate(value: Date | undefined): string {
  if (value == null) {
    return "—";
  }
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function shortDateYear(value: Date | undefined): string {
  if (value == null) {
    return "—";
  }
  return value.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function monthLabel(value: Date): string {
  return value.toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
}

export function usd(value: number): string {
  if (value >= 1000) {
    return `$${Math.round(value / 1000)}k`;
  }
  return `$${Math.round(value)}`;
}

export function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function signedDays(value: number): string {
  if (value === 0) {
    return "on plan";
  }
  return value > 0 ? `+${value}d` : `${value}d`;
}
