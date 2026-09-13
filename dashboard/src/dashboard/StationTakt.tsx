import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Operations } from "@/data/useOperations";
import css from "./Dashboard.module.css";

/**
 * Average cycle time per station against the takt line.
 *
 * A line runs at the speed of its slowest station, so the only station that
 * sets programme throughput is the one furthest past takt. Everything to the
 * left of the ice rule is absorbing slack; everything past it is the schedule.
 */

interface Props {
  ops: Operations;
}

function StationTakt({ ops }: Props): React.ReactElement {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | undefined>(undefined);
  const takt = ops.totals.taktDays;
  const scaleMax = Math.max(takt, ...ops.stations.map((s) => s.avgCycleDays)) * 1.12;
  const bottleneck = ops.totals.bottleneck;

  return (
    <section className={css.taPanel}>
      <header className={css.taPanelHead}>
        <h2 className={css.taPanelTitle}>Station cycle against takt</h2>
        <span className={css.taPanelNote}>Takt {takt} days</span>
      </header>

      <div className={css.taPanelBody}>
        <div className={css.taTaktWrap}>
          <div className={css.taTaktGrid}>
            {ops.stations.map((s) => {
              const over = s.overTaktDays > 0;
              const isBottleneck = s.stationCode === bottleneck?.stationCode;
              const colour = isBottleneck
                ? "var(--ta-late)"
                : over
                  ? "var(--ta-at-risk)"
                  : "var(--ta-ice-dim)";

              const hot = hovered === s.stationCode;
              const cell = (base: string): string =>
                [base, css.taRowLink, hot ? css.taRowHot : ""].join(" ");
              const enter = (): void => setHovered(s.stationCode);
              const leave = (): void => setHovered(undefined);
              const open = (): void => {
                navigate(`/station/${encodeURIComponent(s.stationCode)}`);
              };

              return (
                <React.Fragment key={s.stationCode}>
                  <div className={cell(css.taTaktLabel)} onMouseEnter={enter} onMouseLeave={leave}>
                    <Link
                      className={css.taTaktLink}
                      to={`/station/${encodeURIComponent(s.stationCode)}`}
                    >
                      <span className={css.taTaktName}>{s.stationName}</span>
                      <span className={css.taTaktCode}>
                        {s.stationCode}
                        {s.aircraftHere.length > 0 ? ` · ${s.aircraftHere.join(", ")}` : ""}
                      </span>
                    </Link>
                  </div>

                  {/* Pointer convenience. The anchor above is the keyboard path. */}
                  {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                  <div
                    className={cell(css.taTaktTrack)}
                    onMouseEnter={enter}
                    onMouseLeave={leave}
                    onClick={open}
                  >
                    <span
                      className={css.taTaktBar}
                      style={{
                        width: `${(s.avgCycleDays / scaleMax) * 100}%`,
                        background: colour,
                      }}
                    />
                    <span
                      className={css.taTaktThreshold}
                      style={{ left: `${(takt / scaleMax) * 100}%` }}
                    />
                  </div>

                  {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                  <span
                    className={cell(
                      [
                        css.taTaktValue,
                        isBottleneck ? css.taToneBad : over ? css.taToneWarn : "",
                      ].join(" "),
                    )}
                    onMouseEnter={enter}
                    onMouseLeave={leave}
                    onClick={open}
                  >
                    {s.avgCycleDays}d
                  </span>
                </React.Fragment>
              );
            })}
          </div>

          {bottleneck != null ? (
            <p className={css.taTaktCaption}>
              <span>
                <strong className={css.taToneBad}>{bottleneck.stationName}</strong> runs{" "}
                {bottleneck.overTaktDays} days over takt. The programme cannot beat{" "}
                {bottleneck.avgCycleDays} days per tail until it does.
              </span>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default StationTakt;
