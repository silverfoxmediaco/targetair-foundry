import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSupplierDetail } from "@/data/useSupplierDetail";
import { ActionHost, type ActionTarget } from "./actionForms";
import css from "./Dashboard.module.css";
import { percent, shortDateYear, usd } from "./format";

/**
 * One supplier, read as exposure rather than as a scorecard.
 *
 * An on-time rate on its own says nothing about consequence. What matters is
 * which parts they hold, whether any of those are critical, how long they take
 * to replace, and which stations stop if they miss. All four come from walking
 * out of a Supplier object that stores none of them.
 */

function SupplierDetail(): React.ReactElement {
  const { supplierId } = useParams<{ supplierId: string }>();
  const { data, error, loading, reload } = useSupplierDetail(supplierId);
  const [dialog, setDialog] = useState<ActionTarget | undefined>(undefined);

  if (loading) {
    return <div className={css.taCenter}>Traversing the ontology…</div>;
  }

  if (error != null || data == null) {
    return (
      <div className={css.taCenter}>
        <div className={css.taErrorBox}>{error ?? "Supplier not found."}</div>
      </div>
    );
  }

  const rateTone =
    data.onTimeRate < 0.8
      ? css.taToneBad
      : data.onTimeRate < 0.92
        ? css.taToneWarn
        : css.taToneGood;

  const longLead = (data.avgLeadTimeDays ?? 0) >= 60;

  return (
    <div className={css.taShell}>
      <ActionHost open={dialog} onApplied={reload} onClose={() => setDialog(undefined)} />
      <div className={css.taInner}>
        <header className={css.taMasthead}>
          <div className={css.taBrand}>
            <Link className={css.taBackLink} to="/dashboard">
              ← Program overview
            </Link>
          </div>
          <div className={css.taMastheadMeta}>
            <span className={css.taMetaItem}>
              <span className={css.taMetaLabel}>Supplier</span>
              <span className={css.taMetaValue}>{data.supplierId}</span>
            </span>
            <span className={css.taMetaItem}>
              <span className={css.taMetaLabel}>Location</span>
              <span className={css.taMetaValue}>{data.location ?? "—"}</span>
            </span>
          </div>
        </header>

        <section className={css.taVerdict}>
          <span className={css.taVerdictHead}>{data.supplierName}</span>
          <span className={css.taVerdictBody}>
            {percent(data.onTimeRate)} on time across {data.parts.length} parts,{" "}
            {data.criticalParts} of them critical.
            {longLead
              ? ` Average lead is ${data.avgLeadTimeDays} days, so a miss cannot be expedited out of.`
              : ` Average lead is ${data.avgLeadTimeDays} days.`}
            {data.shortages.length > 0
              ? ` ${data.shortages.length} of their parts ${data.shortages.length === 1 ? "is" : "are"} short right now.`
              : " Nothing of theirs is short today."}
          </span>
        </section>

        <div className={css.taFigures}>
          <div className={css.taFigure}>
            <span className={css.taFigureLabel}>On-time rate</span>
            <span className={[css.taFigureValue, rateTone].join(" ")}>
              {percent(data.onTimeRate)}
            </span>
            <span className={css.taFigureNote}>reliability, not consequence</span>
          </div>
          <div className={css.taFigure}>
            <span className={css.taFigureLabel}>Average lead</span>
            <span className={[css.taFigureValue, longLead ? css.taToneWarn : ""].join(" ")}>
              {data.avgLeadTimeDays}
              <span className={css.taFigureUnit}>days</span>
            </span>
            <span className={css.taFigureNote}>
              {longLead ? "too long to expedite" : "recoverable"}
            </span>
          </div>
          <div className={css.taFigure}>
            <span className={css.taFigureLabel}>Parts supplied</span>
            <span className={css.taFigureValue}>{data.parts.length}</span>
            <span className={css.taFigureNote}>
              {data.criticalParts} critical
            </span>
          </div>
          <div className={css.taFigure}>
            <span className={css.taFigureLabel}>Open shortages</span>
            <span
              className={[
                css.taFigureValue,
                data.shortages.length > 0 ? css.taToneBad : css.taToneGood,
              ].join(" ")}
            >
              {data.shortages.length}
            </span>
            <span className={css.taFigureNote}>
              {data.shortages.length > 0 ? "live problem" : "exposure only"}
            </span>
          </div>
          <div className={css.taFigure}>
            <span className={css.taFigureLabel}>Stations exposed</span>
            <span className={css.taFigureValue}>{data.stationsExposed.length}</span>
            <span className={css.taFigureNote}>
              {data.stationsExposed.join(", ") || "none"}
            </span>
          </div>
        </div>

        {data.shortages.length > 0 ? (
          <section className={css.taPanel}>
            <header className={css.taPanelHead}>
              <h2 className={css.taPanelTitle}>What they are holding up</h2>
              <span className={css.taTraversal}>Supplier → parts → shortages</span>
            </header>
            <div className={css.taPanelBody}>
              <div className={css.taTableWrap}>
                <table className={css.taTable}>
                  <thead>
                    <tr>
                      <th scope="col">Part</th>
                      <th scope="col">Airframe</th>
                      <th scope="col">Station</th>
                      <th scope="col" className={css.taCellNum}>
                        Short
                      </th>
                      <th scope="col" className={css.taCellNum}>
                        Recovers
                      </th>
                      <th scope="col" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.shortages.map((s) => (
                      <tr key={s.shortageId}>
                        <td>
                          <Link
                            className={css.taInlineLink}
                            to={`/part/${encodeURIComponent(s.partNumber)}`}
                          >
                            {s.partDescription ?? s.partNumber}
                          </Link>
                          {s.criticality === "critical" ? (
                            <>
                              {" "}
                              <span className={[css.taChip, css.taChipCritical].join(" ")}>
                                critical
                              </span>
                            </>
                          ) : null}
                          <span className={css.taCellSub}>{s.shortageId}</span>
                        </td>
                        <td>
                          {s.serialNumber != null ? (
                            <Link
                              className={css.taInlineLink}
                              to={`/aircraft/${encodeURIComponent(s.serialNumber)}`}
                            >
                              {s.serialNumber}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          {s.stationCode != null ? (
                            <Link
                              className={css.taInlineLink}
                              to={`/station/${encodeURIComponent(s.stationCode)}`}
                            >
                              {s.stationCode}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className={css.taCellNum}>{s.qtyShort}</td>
                        <td className={css.taCellNum}>{shortDateYear(s.expectedRecovery)}</td>
                        <td className={css.taCellNum}>
                          <button
                            type="button"
                            className={css.taRowAction}
                            onClick={() =>
                              setDialog({
                                kind: "shortage",
                                target: {
                                  shortageId: s.shortageId,
                                  label: `${s.shortageId} · ${s.partDescription ?? s.partNumber}`,
                                  expectedRecovery: s.expectedRecovery,
                                },
                              })
                            }
                          >
                            Acknowledge
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : null}

        <section className={css.taPanel}>
          <header className={css.taPanelHead}>
            <h2 className={css.taPanelTitle}>Parts supplied</h2>
            <span className={css.taTraversal}>
              Supplier → parts → inventoryLots, bomLines → station
            </span>
          </header>
          <div className={css.taPanelBody}>
            <div className={css.taTableWrap}>
              <table className={css.taTable}>
                <thead>
                  <tr>
                    <th scope="col">Part</th>
                    <th scope="col">Consumed at</th>
                    <th scope="col" className={css.taCellNum}>
                      Lead
                    </th>
                    <th scope="col" className={css.taCellNum}>
                      On hand
                    </th>
                    <th scope="col" className={css.taCellNum}>
                      Unit cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.parts.map((p) => (
                    <tr key={p.partNumber}>
                      <td>
                        <Link
                          className={css.taInlineLink}
                          to={`/part/${encodeURIComponent(p.partNumber)}`}
                        >
                          {p.description ?? p.partNumber}
                        </Link>
                        {p.criticality === "critical" ? (
                          <>
                            {" "}
                            <span className={[css.taChip, css.taChipCritical].join(" ")}>
                              critical
                            </span>
                          </>
                        ) : null}
                        {p.openShortages > 0 ? (
                          <>
                            {" "}
                            <span className={[css.taChip, css.taChipBad].join(" ")}>short</span>
                          </>
                        ) : null}
                        <span className={css.taCellSub}>{p.partNumber}</span>
                      </td>
                      <td className={css.taCellMono}>{p.stations.join(", ") || "—"}</td>
                      <td className={css.taCellNum}>
                        {p.leadTimeDays != null ? `${p.leadTimeDays}d` : "—"}
                      </td>
                      <td className={css.taCellNum}>
                        <span className={p.qtyOnHand === 0 ? css.taToneBad : undefined}>
                          {p.qtyOnHand}
                        </span>
                      </td>
                      <td className={css.taCellNum}>{usd(p.unitCostUsd ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SupplierDetail;
