import React from "react";
import type { Operations } from "@/data/useOperations";
import css from "./Dashboard.module.css";

/**
 * Open non-conformances by station, in build sequence.
 *
 * Shown next to the takt chart on purpose. Where quality and throughput point
 * at the same station, the two are usually the same problem: rework inside the
 * station is what pushes its cycle past takt. Where they point at different
 * stations, they are two problems and need two answers.
 */

interface Props {
  ops: Operations;
}

function QualityPanel({ ops }: Props): React.ReactElement {
  const withNcrs = ops.stations.filter((s) => s.openNcrs > 0);
  const worst = Math.max(1, ...withNcrs.map((s) => s.openNcrs));
  const bottleneckCode = ops.totals.bottleneck?.stationCode;
  // Station carrying the most open rework, which is not necessarily the
  // constraint station and is the whole point of the caption below.
  const heaviest = [...withNcrs].sort((a, b) => b.openNcrs - a.openNcrs)[0];

  return (
    <section className={css.taPanel}>
      <header className={css.taPanelHead}>
        <h2 className={css.taPanelTitle}>Open non-conformances</h2>
        <span className={css.taPanelNote}>
          {ops.totals.openNcrs} open · {ops.totals.criticalNcrs} critical
        </span>
      </header>

      <div className={css.taPanelBody}>
        <div className={css.taTaktGrid}>
          {withNcrs.map((s) => {
            const isBottleneck = s.stationCode === bottleneckCode;
            return (
              <React.Fragment key={s.stationCode}>
                <div className={css.taTaktLabel}>
                  <span className={css.taTaktName}>{s.stationName}</span>
                  <span className={css.taTaktCode}>{s.stationCode}</span>
                </div>
                <div className={css.taTaktTrack}>
                  <span
                    className={css.taTaktBar}
                    style={{
                      width: `${(s.openNcrs / worst) * 100}%`,
                      background: isBottleneck ? "var(--ta-late)" : "var(--ta-ice-dim)",
                    }}
                  />
                </div>
                <span className={css.taTaktValue}>{s.openNcrs}</span>
              </React.Fragment>
            );
          })}
        </div>

        <p className={css.taTaktCaption}>
          {bottleneckCode != null && heaviest != null && heaviest.stationCode !== bottleneckCode ? (
            <span>
              Quality and throughput point at different stations. The heaviest
              rework sits at {heaviest.stationName} with {heaviest.openNcrs} open,
              while the constraint is {ops.totals.bottleneck?.stationName}. Two
              problems, not one.
            </span>
          ) : (
            <span>
              Rework is concentrated at the constraint station, so cycle time and
              quality are likely the same problem.
            </span>
          )}
        </p>
      </div>
    </section>
  );
}

export default QualityPanel;
