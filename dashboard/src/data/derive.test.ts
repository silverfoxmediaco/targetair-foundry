import { describe, expect, it } from "vitest";
import {
  airframesCovered,
  daysBetween,
  daysPastForecast,
  deliveryState,
  findBottleneck,
  overTaktDays,
  shortageExposure,
  slipDays,
  totalSlipDays,
} from "./derive";

/** Ontology date columns arrive as datetimes at UTC midnight. */
const d = (iso: string): Date => new Date(`${iso}T00:00:00Z`);

describe("daysBetween", () => {
  it("counts whole calendar days forward", () => {
    expect(daysBetween(d("2026-09-01"), d("2026-09-04"))).toBe(3);
  });

  it("is signed, so a date in the past reads negative", () => {
    expect(daysBetween(d("2026-09-04"), d("2026-09-01"))).toBe(-3);
  });

  it("counts calendar days, not elapsed time, across midnight", () => {
    // The case that separates a real implementation from a naive
    // (to - from) / 86400000. Two hours apart, but a day apart on the
    // calendar. Naive arithmetic floors this to 0 and loses a day of slip.
    const lateOnDayOne = new Date("2026-09-01T23:00:00Z");
    const earlyOnDayTwo = new Date("2026-09-02T01:00:00Z");
    expect(daysBetween(lateOnDayOne, earlyOnDayTwo)).toBe(1);
  });

  it("does not count nearly-a-full-day as a day when the date has not changed", () => {
    // The mirror case. 23 hours of elapsed time inside one calendar day is
    // still zero days, and naive arithmetic that rounds would call it 1.
    const start = new Date("2026-09-01T00:30:00Z");
    const end = new Date("2026-09-01T23:30:00Z");
    expect(daysBetween(start, end)).toBe(0);
  });

  it("is unaffected by the time component on either side", () => {
    // Same calendar gap, wildly different times of day. All three must agree,
    // or a shortage opened at 09:00 and one opened at 17:00 would age
    // differently for no reason a user could explain.
    expect(daysBetween(new Date("2026-09-01T00:01:00Z"), new Date("2026-09-04T23:59:00Z"))).toBe(3);
    expect(daysBetween(new Date("2026-09-01T23:59:00Z"), new Date("2026-09-04T00:01:00Z"))).toBe(3);
    expect(daysBetween(d("2026-09-01"), d("2026-09-04"))).toBe(3);
  });

  it("returns zero for the same day", () => {
    expect(daysBetween(d("2026-09-13"), d("2026-09-13"))).toBe(0);
  });
});

describe("slipDays", () => {
  it("reports a forecast later than plan as positive", () => {
    expect(slipDays(d("2026-12-18"), d("2026-12-21"))).toBe(3);
  });

  it("reports a forecast that beats plan as negative rather than clamping", () => {
    // A program pulling in is information. Clamping to zero would hide it.
    expect(slipDays(d("2026-12-18"), d("2026-12-15"))).toBe(-3);
  });

  it("is zero when either date is missing", () => {
    expect(slipDays(undefined, d("2026-12-21"))).toBe(0);
    expect(slipDays(d("2026-12-18"), undefined)).toBe(0);
    expect(slipDays(undefined, undefined)).toBe(0);
  });
});

describe("deliveryState", () => {
  const asOf = d("2026-09-13");

  it("calls a tail on plan when forecast matches plan and is ahead", () => {
    expect(deliveryState("In Build", d("2026-10-01"), d("2026-10-01"), asOf)).toBe("on-plan");
  });

  it("calls a tail late when its forecast slipped but is still ahead", () => {
    expect(deliveryState("In Build", d("2026-12-18"), d("2026-12-21"), asOf)).toBe("late");
  });

  it("calls a tail overdue once its forecast has passed", () => {
    expect(deliveryState("In Test", d("2026-08-25"), d("2026-08-25"), asOf)).toBe("overdue");
  });

  it("ranks overdue above late, because a stale forecast is the worse fact", () => {
    // Slipped by 3 days AND already past. It must not report merely "late".
    expect(deliveryState("In Build", d("2026-08-22"), d("2026-08-25"), asOf)).toBe("overdue");
  });

  it("reports the real TA7-034 case: zero variance while weeks overdue", () => {
    // The case that motivated the state existing at all. Forecast still equals
    // plan, so schedule variance is zero and every "is it late" check built on
    // variance alone says no — while the aircraft sits 19 days past its date
    // and undelivered.
    const planned = d("2026-08-25");
    const forecast = d("2026-08-25");
    expect(slipDays(planned, forecast)).toBe(0);
    expect(deliveryState("In Test", planned, forecast, asOf)).toBe("overdue");
    expect(daysPastForecast(forecast, asOf)).toBe(19);
  });

  it("never marks a delivered tail overdue, whatever its dates say", () => {
    expect(deliveryState("Delivered", d("2026-06-23"), d("2026-06-23"), asOf)).toBe("delivered");
  });

  it("never marks a delivered tail late either", () => {
    expect(deliveryState("Delivered", d("2026-06-20"), d("2026-06-23"), asOf)).toBe("delivered");
  });

  it("falls back to on-plan when there is no forecast to judge", () => {
    expect(deliveryState("In Build", undefined, undefined, asOf)).toBe("on-plan");
  });
});

describe("daysPastForecast", () => {
  const asOf = d("2026-09-13");

  it("counts days elapsed since a date that has gone", () => {
    expect(daysPastForecast(d("2026-09-12"), asOf)).toBe(1);
  });

  it("is zero for a date still ahead, so callers need no sign guard", () => {
    expect(daysPastForecast(d("2026-12-21"), asOf)).toBe(0);
  });

  it("is zero when there is no forecast", () => {
    expect(daysPastForecast(undefined, asOf)).toBe(0);
  });
});

describe("overTaktDays and findBottleneck", () => {
  it("is positive when a station runs slower than takt", () => {
    expect(overTaktDays(27, 20)).toBe(7);
  });

  it("is negative when a station is absorbing slack", () => {
    expect(overTaktDays(12, 20)).toBe(-8);
  });

  it("picks the station furthest past takt", () => {
    const stations = [
      { stationCode: "ST-50", overTaktDays: 1 },
      { stationCode: "ST-40", overTaktDays: 7 },
      { stationCode: "ST-80", overTaktDays: 2 },
    ];
    expect(findBottleneck(stations)?.stationCode).toBe("ST-40");
  });

  it("returns nothing when every station is inside takt", () => {
    // The least-slack station is not a bottleneck. Naming one anyway sends
    // people to a station that is not the problem.
    const stations = [{ overTaktDays: -1 }, { overTaktDays: -8 }];
    expect(findBottleneck(stations)).toBeUndefined();
  });

  it("returns nothing for an empty line", () => {
    expect(findBottleneck([])).toBeUndefined();
  });

  it("does not reorder the caller's array", () => {
    const stations = [{ overTaktDays: 1 }, { overTaktDays: 7 }];
    findBottleneck(stations);
    expect(stations[0].overTaktDays).toBe(1);
  });
});

describe("shortageExposure", () => {
  it("multiplies quantity short by unit cost", () => {
    expect(shortageExposure(2, 4434.19)).toBeCloseTo(8868.38, 2);
  });

  it("treats an unpriced part as zero rather than NaN", () => {
    // A missing cost must not poison a sum. One NaN turns a program total
    // into "$NaNk" on screen.
    expect(shortageExposure(12, undefined)).toBe(0);
  });
});

describe("airframesCovered", () => {
  it("floors, because a partial set builds nothing", () => {
    expect(airframesCovered(7, 4)).toBe(1);
  });

  it("reports zero cover when stock is out", () => {
    expect(airframesCovered(0, 4)).toBe(0);
  });

  it("distinguishes no demand from no stock", () => {
    // undefined means "not on the bill of materials"; 0 means "this stops the
    // next aircraft". Collapsing them would flag every non-BOM part as a
    // stock-out, and would divide by zero getting there.
    expect(airframesCovered(163, 0)).toBeUndefined();
    expect(airframesCovered(0, 4)).toBe(0);
  });

  it("handles exact multiples", () => {
    expect(airframesCovered(48, 4)).toBe(12);
  });
});

describe("totalSlipDays", () => {
  it("sums the tails that are late", () => {
    expect(totalSlipDays([{ slipDays: 3 }, { slipDays: 3 }, { slipDays: 0 }])).toBe(6);
  });

  it("does not let an early tail cancel out a late one", () => {
    // Program slip is exposure, not a net position. A tail pulling in three
    // days does not undo another tail losing three.
    expect(totalSlipDays([{ slipDays: 3 }, { slipDays: -3 }])).toBe(3);
  });

  it("is zero for a program on plan", () => {
    expect(totalSlipDays([{ slipDays: 0 }, { slipDays: 0 }])).toBe(0);
  });
});
