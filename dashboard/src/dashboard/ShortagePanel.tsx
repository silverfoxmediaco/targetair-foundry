import React from "react";
import type { Operations } from "@/data/useOperations";
import css from "./Dashboard.module.css";
import { shortDate, usd } from "./format";

/**
 * The join, rendered.
 *
 * Each row starts at a shortage and reaches a part, that part's supplier, the
 * work order the shortage blocks, and the tail that work order belongs to. No
 * single source system holds all five; the ontology is what makes the row
 * expressible at all.
 */

interface Props {
  ops: Operations;
}

function ShortagePanel({ ops }: Props): React.ReactElement {
  return (
    <section className={css.taPanel}>
      <header className={css.taPanelHead}>
        <h2 className={css.taPanelTitle}>Open shortages</h2>
        <span className={css.taPanelNote}>
          {usd(ops.totals.shortageExposureUsd)} of parts holding{" "}
          {ops.totals.blockedWorkOrders} work orders
        </span>
      </header>

      <div className={css.taPanelBody}>
        <div className={css.taTableWrap}>
          <table className={css.taTable}>
            <thead>
              <tr>
                <th scope="col">Part</th>
                <th scope="col">Supplier</th>
                <th scope="col">Blocking</th>
                <th scope="col" className={css.taCellNum}>
                  Qty
                </th>
                <th scope="col" className={css.taCellNum}>
                  Recovers
                </th>
              </tr>
            </thead>
            <tbody>
              {ops.shortages.map((s) => {
                const critical = s.criticality === "critical";
                const far = (s.daysToRecovery ?? 0) > 21;

                return (
                  <tr key={s.shortageId}>
                    <td>
                      {s.partDescription}
                      {critical ? (
                        <>
                          {" "}
                          <span className={[css.taChip, css.taChipCritical].join(" ")}>
                            critical
                          </span>
                        </>
                      ) : null}
                      <span className={css.taCellSub}>
                        {s.partNumber} · {s.shortageId} · open {s.ageDays}d
                      </span>
                    </td>
                    <td>
                      {s.supplierName ?? "—"}
                      <span className={css.taCellSub}>
                        {s.supplierOnTimeRate != null
                          ? `${Math.round(s.supplierOnTimeRate * 100)}% on time`
                          : "—"}
                        {s.partLeadTimeDays != null ? ` · ${s.partLeadTimeDays}d lead` : ""}
                      </span>
                    </td>
                    <td>
                      <span className={css.taCellMono}>{s.serialNumber}</span>
                      <span className={css.taCellSub}>
                        {s.workOrderId} · {s.stationName ?? s.stationCode}
                      </span>
                    </td>
                    <td className={css.taCellNum}>
                      {s.qtyShort}
                      <span className={css.taCellSub}>{usd(s.exposureUsd)}</span>
                    </td>
                    <td className={css.taCellNum}>
                      <span className={far ? css.taToneBad : css.taToneWarn}>
                        {shortDate(s.expectedRecovery)}
                      </span>
                      <span className={css.taCellSub}>
                        {s.daysToRecovery != null
                          ? s.daysToRecovery >= 0
                            ? `in ${s.daysToRecovery}d`
                            : `${Math.abs(s.daysToRecovery)}d overdue`
                          : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default ShortagePanel;
