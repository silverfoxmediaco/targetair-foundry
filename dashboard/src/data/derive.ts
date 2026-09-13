/**
 * Pure derivations.
 *
 * Every judgement the dashboard makes — is this tail late, is this station the
 * constraint, how much stock cover is left — lives here rather than inside the
 * functions that fetch from Foundry. Two reasons: the rules are the part worth
 * testing, and they are the part worth reading when someone asks how a number
 * on screen was arrived at.
 *
 * Nothing in this file touches the network, the clock, or the ontology.
 * `asOf` is always passed in so that "today" is an argument rather than an
 * ambient fact, which is what makes the behaviour reproducible.
 */

const DAY_MS = 86_400_000;

/**
 * Whole days between two instants, counting calendar days rather than elapsed
 * time.
 *
 * Normalised to UTC midnight on both sides deliberately. The ontology stores
 * these columns as datetimes, so a naive subtraction is sensitive to the time
 * component and to daylight saving transitions — an hour of clock shift is
 * enough to turn a 3-day slip into 2.958 days, which floors to 2.
 */
export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.round((b - a) / DAY_MS);
}

/**
 * Schedule variance: how much later the forecast is than the plan.
 *
 * Positive means late. Negative is possible and means the tail is forecast to
 * beat its plan, which is left signed rather than clamped, because a programme
 * that is pulling in is information too.
 */
export function slipDays(planned: Date | undefined, forecast: Date | undefined): number {
  if (planned == null || forecast == null) {
    return 0;
  }
  return daysBetween(planned, forecast);
}

export type DeliveryState = "delivered" | "on-plan" | "late" | "overdue";

/**
 * Which of four states a tail is in. The order of these checks is the whole
 * point and is not arbitrary.
 *
 * `delivered` wins outright: a handed-over aircraft cannot be overdue, whatever
 * its dates say.
 *
 * `overdue` then outranks `late`, because they answer different questions.
 * "Late" is a forecast that admits it has slipped. "Overdue" is a forecast that
 * has already been overtaken by the calendar and has not been updated — the
 * forecast itself is now stale. A tail whose forecast still equals its plan
 * reports zero variance while sitting weeks past its own date, and that is
 * exactly the case an executive view exists to surface rather than hide.
 */
export function deliveryState(
  status: string | undefined,
  planned: Date | undefined,
  forecast: Date | undefined,
  asOf: Date,
): DeliveryState {
  if (status === "Delivered") {
    return "delivered";
  }
  if (forecast != null && forecast < asOf) {
    return "overdue";
  }
  return slipDays(planned, forecast) > 0 ? "late" : "on-plan";
}

/**
 * Days elapsed since a forecast date that has already passed. Zero if the date
 * is still ahead, so callers never have to guard the sign.
 */
export function daysPastForecast(forecast: Date | undefined, asOf: Date): number {
  if (forecast == null) {
    return 0;
  }
  return Math.max(0, daysBetween(forecast, asOf));
}

/**
 * How far a station's actual cycle exceeds the takt it is supposed to hold.
 * Positive is over takt and therefore constraining; negative is slack.
 */
export function overTaktDays(avgCycleDays: number, taktDays: number): number {
  return avgCycleDays - taktDays;
}

/**
 * The constraint station: the one furthest past takt. Returns undefined when
 * nothing is over takt, because "the least bad station" is not a bottleneck and
 * calling it one sends people to the wrong place.
 */
export function findBottleneck<T extends { overTaktDays: number }>(
  stations: readonly T[],
): T | undefined {
  const worst = [...stations].sort((a, b) => b.overTaktDays - a.overTaktDays)[0];
  return worst != null && worst.overTaktDays > 0 ? worst : undefined;
}

/** Value of the parts missing on a shortage. */
export function shortageExposure(qtyShort: number, unitCostUsd: number | undefined): number {
  return qtyShort * (unitCostUsd ?? 0);
}

/**
 * How many more airframes the stock on hand will build.
 *
 * Floored, because a partial set builds nothing. Undefined when the part is not
 * on the bill of materials, which is different from zero: zero means "this
 * stops the next aircraft", undefined means "this part has no demand here".
 * Collapsing the two would report every non-BOM part as a stock-out.
 */
export function airframesCovered(
  qtyOnHand: number,
  qtyPerAircraft: number,
): number | undefined {
  if (qtyPerAircraft <= 0) {
    return undefined;
  }
  return Math.floor(qtyOnHand / qtyPerAircraft);
}

/** Total schedule slip across a programme, counting only tails that are late. */
export function totalSlipDays(tails: readonly { slipDays: number }[]): number {
  return tails.reduce((sum, t) => sum + Math.max(0, t.slipDays), 0);
}
