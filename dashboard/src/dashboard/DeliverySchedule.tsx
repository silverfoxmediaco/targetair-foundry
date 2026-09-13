import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { AircraftRow, Operations } from "@/data/useOperations";
import css from "./Dashboard.module.css";
import { monthLabel, shortDate } from "./format";

/**
 * One row per tail across a shared time axis.
 *
 * Position on the axis answers "when", the slip bar answers "how much", and
 * the today rule answers "has it already gone past". The slip column on the
 * right exists because the slips here are three days against a seven month
 * axis — too small to read positionally, so magnitude is given its own scale.
 */

const DAY_MS = 86_400_000;

interface Props {
  ops: Operations;
}

function toneClass(row: AircraftRow): string {
  switch (row.delivery) {
    case "delivered":
      return css.taToneGood;
    case "overdue":
      return css.taToneCritical;
    case "late":
      return css.taToneBad;
    default:
      return css.taToneNeutral;
  }
}

/** What the right-hand column says. Schedule variance where there is some,
 *  days elapsed past a forecast that has already gone by where there is not. */
function slipLabel(row: AircraftRow, asOf: Date): string {
  if (row.delivery === "delivered") {
    return "done";
  }
  if (row.delivery === "overdue" && row.forecastDelivery != null) {
    const past = Math.round(
      (Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate()) -
        Date.UTC(
          row.forecastDelivery.getUTCFullYear(),
          row.forecastDelivery.getUTCMonth(),
          row.forecastDelivery.getUTCDate(),
        )) /
        DAY_MS,
    );
    return `${past}d past`;
  }
  if (row.slipDays > 0) {
    return `+${row.slipDays}d`;
  }
  return "on plan";
}

function markerColor(row: AircraftRow): string {
  switch (row.delivery) {
    case "delivered":
      return "var(--ta-on-plan)";
    case "overdue":
      return "var(--ta-critical)";
    case "late":
      return "var(--ta-late)";
    default:
      return "var(--ta-ice)";
  }
}

function DeliverySchedule({ ops }: Props): React.ReactElement {
  const navigate = useNavigate();
  // Which row the pointer is over. The three cells of a row are separate grid
  // children, so the highlight has to be shared rather than inherited.
  const [hovered, setHovered] = useState<string | undefined>(undefined);

  const dates = ops.aircraft.flatMap((a) =>
    [a.buildStart, a.plannedDelivery, a.forecastDelivery].filter(
      (d): d is Date => d != null,
    ),
  );
  dates.push(ops.asOf);

  const min = new Date(Math.min(...dates.map((d) => d.getTime())) - 12 * DAY_MS);
  const max = new Date(Math.max(...dates.map((d) => d.getTime())) + 12 * DAY_MS);
  const span = max.getTime() - min.getTime();

  const pct = (d: Date): number => ((d.getTime() - min.getTime()) / span) * 100;

  // Month gridlines across the whole axis.
  const ticks: Date[] = [];
  const cursor = new Date(Date.UTC(min.getUTCFullYear(), min.getUTCMonth() + 1, 1));
  while (cursor < max) {
    ticks.push(new Date(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  const todayPct = pct(ops.asOf);

  return (
    <section className={css.taPanel}>
      <header className={css.taPanelHead}>
        <h2 className={css.taPanelTitle}>Delivery schedule · TA-7 program</h2>
        <span className={css.taPanelNote}>
          Planned against forecast, all {ops.aircraft.length} tails
        </span>
      </header>

      <div className={css.taPanelBody}>
        <div className={css.taScheduleGrid}>
          <div />
          <div className={css.taScheduleAxis}>
            {ticks.map((t) => (
              <React.Fragment key={t.toISOString()}>
                <span className={css.taAxisRule} style={{ left: `${pct(t)}%` }} />
                <span className={css.taAxisTick} style={{ left: `${pct(t)}%` }}>
                  {monthLabel(t)}
                </span>
              </React.Fragment>
            ))}
            <span className={css.taTodayRule} style={{ left: `${todayPct}%` }} />
            <span className={css.taTodayFlag} style={{ left: `${todayPct}%` }}>
              today
            </span>
          </div>
          <div />

          {ops.aircraft.map((row) => {
            const planned = row.plannedDelivery;
            const forecast = row.forecastDelivery;
            const start = row.buildStart;
            const ghost = row.delivery === "delivered";
            const color = markerColor(row);

            const hot = hovered === row.serialNumber;
            const rowCell = (base: string): string =>
              [base, css.taRowLink, ghost ? css.taRowGhost : "", hot ? css.taRowHot : ""].join(" ");
            const enter = (): void => setHovered(row.serialNumber);
            const leave = (): void => setHovered(undefined);
            const open = (): void => {
              navigate(`/aircraft/${encodeURIComponent(row.serialNumber)}`);
            };

            return (
              <React.Fragment key={row.serialNumber}>
                <div className={rowCell(css.taTailId)} onMouseEnter={enter} onMouseLeave={leave}>
                  {/* A real link, so the row is keyboard reachable and opens in
                      a new tab on middle click like anything else. */}
                  <Link
                    className={css.taTailSerial}
                    to={`/aircraft/${encodeURIComponent(row.serialNumber)}`}
                  >
                    {row.serialNumber}
                  </Link>
                  <span className={css.taTailMeta}>
                    {row.customer}
                    {row.stationCode != null ? ` · ${row.stationCode}` : ""}
                  </span>
                </div>

                {/* Pointer convenience only. The row's keyboard and screen
                    reader path is the serial <Link> above; giving these cells
                    their own tab stop would add a second focus target per row
                    for twelve rows and make keyboard use worse, not better. */}
                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                <div
                  className={rowCell(css.taTrack)}
                  onMouseEnter={enter}
                  onMouseLeave={leave}
                  onClick={open}
                >
                  <span className={css.taTrackBase} />

                  {start != null && planned != null ? (
                    <span
                      className={[
                        css.taBuildSpan,
                        ghost ? css.taBuildSpanDone : "",
                      ].join(" ")}
                      style={{
                        left: `${pct(start)}%`,
                        width: `${pct(planned) - pct(start)}%`,
                      }}
                    />
                  ) : null}

                  {planned != null && forecast != null && row.slipDays > 0 ? (
                    <span
                      className={css.taSlipBar}
                      style={{
                        left: `${pct(planned)}%`,
                        width: `${Math.max(0, pct(forecast) - pct(planned))}%`,
                        background: color,
                      }}
                    />
                  ) : null}

                  <span className={css.taTodayRule} style={{ left: `${todayPct}%` }} />

                  {planned != null ? (
                    <span className={css.taMarkPlanned} style={{ left: `${pct(planned)}%` }} />
                  ) : null}

                  {forecast != null ? (
                    <span
                      className={css.taMarkForecast}
                      style={{ left: `${pct(forecast)}%`, background: color }}
                    />
                  ) : null}
                </div>

                {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                <div
                  className={rowCell(css.taSlipCell)}
                  onMouseEnter={enter}
                  onMouseLeave={leave}
                  onClick={open}
                >
                  <span className={[css.taSlipValue, toneClass(row)].join(" ")}>
                    {slipLabel(row, ops.asOf)}
                  </span>
                  <span className={css.taSlipDate}>{shortDate(forecast)}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div className={css.taLegend}>
          <span className={css.taLegendItem}>
            <span className={css.taLegendDiamond} />
            planned delivery
          </span>
          <span className={css.taLegendItem}>
            <span
              className={css.taLegendDiamond}
              style={{ background: "var(--ta-ice)", borderColor: "var(--ta-ice)" }}
            />
            forecast delivery
          </span>
          <span className={css.taLegendItem}>
            <span className={css.taLegendBar} style={{ background: "var(--ta-late)" }} />
            schedule slip
          </span>
          <span className={css.taLegendItem}>
            <span
              className={css.taLegendDiamond}
              style={{ background: "var(--ta-critical)", borderColor: "var(--ta-critical)" }}
            />
            forecast date passed, not delivered
          </span>
        </div>
      </div>
    </section>
  );
}

export default DeliverySchedule;
