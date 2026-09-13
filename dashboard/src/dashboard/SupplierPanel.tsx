import React from "react";
import type { Operations } from "@/data/useOperations";
import css from "./Dashboard.module.css";
import { percent } from "./format";

/**
 * Supplier exposure, worst on-time rate first.
 *
 * Worth reading against the shortage panel rather than on its own. A low
 * on-time rate is a reliability problem; a long lead time is a recovery
 * problem. They are different failures and they need different responses,
 * which is why both are shown per supplier.
 */

interface Props {
  ops: Operations;
}

function rateTone(rate: number): string {
  if (rate < 0.8) {
    return "var(--ta-late)";
  }
  if (rate < 0.92) {
    return "var(--ta-at-risk)";
  }
  return "var(--ta-on-plan)";
}

function SupplierPanel({ ops }: Props): React.ReactElement {
  return (
    <section className={css.taPanel}>
      <header className={css.taPanelHead}>
        <h2 className={css.taPanelTitle}>Supplier exposure</h2>
        <span className={css.taPanelNote}>Worst on-time first</span>
      </header>

      <div className={css.taPanelBody}>
        <div className={css.taTableWrap}>
          <table className={css.taTable}>
            <thead>
              <tr>
                <th scope="col">Supplier</th>
                <th scope="col" className={css.taCellNum}>
                  On time
                </th>
                <th scope="col" className={css.taCellNum}>
                  Lead
                </th>
                <th scope="col" className={css.taCellNum}>
                  Parts
                </th>
                <th scope="col" className={css.taCellNum}>
                  Short
                </th>
              </tr>
            </thead>
            <tbody>
              {ops.suppliers.map((s) => (
                <tr key={s.supplierId}>
                  <td>
                    {s.supplierName}
                    <span className={css.taCellSub}>{s.location}</span>
                  </td>
                  <td className={css.taCellNum}>
                    {percent(s.onTimeRate)}
                    <span className={css.taRateTrack}>
                      <span
                        className={css.taRateFill}
                        style={{
                          width: `${s.onTimeRate * 100}%`,
                          background: rateTone(s.onTimeRate),
                        }}
                      />
                    </span>
                  </td>
                  <td className={css.taCellNum}>
                    {s.avgLeadTimeDays}d
                    {s.avgLeadTimeDays >= 60 ? (
                      <span className={[css.taCellSub, css.taToneWarn].join(" ")}>long</span>
                    ) : null}
                  </td>
                  <td className={css.taCellNum}>
                    {s.partCount}
                    {s.criticalParts > 0 ? (
                      <span className={css.taCellSub}>{s.criticalParts} critical</span>
                    ) : null}
                  </td>
                  <td className={css.taCellNum}>
                    {s.openShortages > 0 ? (
                      <span className={css.taToneBad}>{s.openShortages}</span>
                    ) : (
                      <span className={css.taToneNeutral}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default SupplierPanel;
