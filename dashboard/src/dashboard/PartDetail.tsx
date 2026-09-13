import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePartDetail } from "@/data/usePartDetail";
import { ActionHost, type ActionTarget } from "./actionForms";
import css from "./Dashboard.module.css";
import { percent, shortDateYear, usd } from "./format";

/**
 * One part.
 *
 * The figure worth having here is cover: how many more airframes the stock on
 * hand will build. It needs quantity on hand and quantity per airframe, which
 * live in two different object types, and it is the number that turns "we have
 * forty" into "that is five aircraft and the sixth stops".
 */

function PartDetail(): React.ReactElement {
  const { partNumber } = useParams<{ partNumber: string }>();
  const { data, error, loading, reload } = usePartDetail(partNumber);
  const [dialog, setDialog] = useState<ActionTarget | undefined>(undefined);

  if (loading) {
    return <div className={css.taCenter}>Traversing the ontology…</div>;
  }

  if (error != null || data == null) {
    return (
      <div className={css.taCenter}>
        <div className={css.taErrorBox}>{error ?? "Part not found."}</div>
      </div>
    );
  }

  const openShortages = data.shortages.filter((s) => s.status === "Open");
  const critical = data.criticality === "critical";
  const noCover = data.airframesCovered != null && data.airframesCovered < 1;

  return (
    <div className={css.taShell}>
      <ActionHost open={dialog} onApplied={reload} onClose={() => setDialog(undefined)} />
      <div className={css.taInner}>
        <header className={css.taMasthead}>
          <div className={css.taBrand}>
            <Link className={css.taBackLink} to="/">
              ← Program overview
            </Link>
          </div>
          <div className={css.taMastheadMeta}>
            <span className={css.taMetaItem}>
              <span className={css.taMetaLabel}>Part</span>
              <span className={css.taMetaValue}>{data.partNumber}</span>
            </span>
            <span className={css.taMetaItem}>
              <span className={css.taMetaLabel}>Unit</span>
              <span className={css.taMetaValue}>{data.uom ?? "—"}</span>
            </span>
          </div>
        </header>

        <section className={css.taVerdict}>
          <span className={css.taVerdictHead}>
            {data.description}
            {critical ? (
              <>
                {" "}
                <span className={[css.taChip, css.taChipCritical].join(" ")}>critical</span>
              </>
            ) : null}
          </span>
          <span className={css.taVerdictBody}>
            {data.supplierName != null
              ? `Supplied by ${data.supplierName} at ${percent(data.supplierOnTimeRate ?? 0)} on time, ${data.leadTimeDays} day lead. `
              : ""}
            {data.qtyPerAircraft > 0
              ? `${data.qtyPerAircraft} per airframe, ${data.qtyOnHand} on hand, which covers ${data.airframesCovered} more ${data.airframesCovered === 1 ? "airframe" : "airframes"}.`
              : `${data.qtyOnHand} on hand. Not on the bill of materials for this program.`}
            {openShortages.length > 0
              ? ` Currently short on ${openShortages.length} ${openShortages.length === 1 ? "airframe" : "airframes"}.`
              : ""}
          </span>
        </section>

        <div className={css.taFigures}>
          <div className={css.taFigure}>
            <span className={css.taFigureLabel}>Cover</span>
            <span
              className={[
                css.taFigureValue,
                noCover ? css.taToneBad : data.airframesCovered != null ? css.taToneGood : "",
              ].join(" ")}
            >
              {data.airframesCovered ?? "—"}
              <span className={css.taFigureUnit}>airframes</span>
            </span>
            <span className={css.taFigureNote}>
              {data.qtyOnHand} on hand ÷ {data.qtyPerAircraft || "—"} per airframe
            </span>
          </div>
          <div className={css.taFigure}>
            <span className={css.taFigureLabel}>Lead time</span>
            <span
              className={[
                css.taFigureValue,
                (data.leadTimeDays ?? 0) >= 50 ? css.taToneWarn : "",
              ].join(" ")}
            >
              {data.leadTimeDays}
              <span className={css.taFigureUnit}>days</span>
            </span>
            <span className={css.taFigureNote}>
              {(data.leadTimeDays ?? 0) >= 50 ? "cannot be expedited" : "replaceable"}
            </span>
          </div>
          <div className={css.taFigure}>
            <span className={css.taFigureLabel}>Unit cost</span>
            <span className={css.taFigureValue}>{usd(data.unitCostUsd ?? 0)}</span>
            <span className={css.taFigureNote}>per {data.uom ?? "unit"}</span>
          </div>
          <div className={css.taFigure}>
            <span className={css.taFigureLabel}>Open shortages</span>
            <span
              className={[
                css.taFigureValue,
                openShortages.length > 0 ? css.taToneBad : css.taToneGood,
              ].join(" ")}
            >
              {openShortages.length}
            </span>
            <span className={css.taFigureNote}>
              {data.shortages.length} raised in total
            </span>
          </div>
          <div className={css.taFigure}>
            <span className={css.taFigureLabel}>Supplier</span>
            <span className={css.taFigureValue} style={{ fontSize: "1rem", lineHeight: 1.3 }}>
              {data.supplierId != null ? (
                <Link
                  className={css.taInlineLink}
                  to={`/supplier/${encodeURIComponent(data.supplierId)}`}
                >
                  {data.supplierName}
                </Link>
              ) : (
                "—"
              )}
            </span>
            <span className={css.taFigureNote}>
              {data.supplierLocation ?? "—"}
              {data.supplierOnTimeRate != null
                ? ` · ${percent(data.supplierOnTimeRate)} on time`
                : ""}
            </span>
          </div>
        </div>

        <div className={css.taSplitWide}>
          <section className={css.taPanel}>
            <header className={css.taPanelHead}>
              <h2 className={css.taPanelTitle}>Where it is consumed</h2>
              <span className={css.taTraversal}>Part → bomLines → station</span>
            </header>
            <div className={css.taPanelBody}>
              {data.consumption.length === 0 ? (
                <p className={css.taEmpty}>Not on the bill of materials for this program.</p>
              ) : (
                <div className={css.taTableWrap}>
                  <table className={css.taTable}>
                    <thead>
                      <tr>
                        <th scope="col">Station</th>
                        <th scope="col" className={css.taCellNum}>
                          Per airframe
                        </th>
                        <th scope="col" className={css.taCellNum}>
                          For 12 tails
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.consumption.map((c) => (
                        <tr key={c.bomLineId}>
                          <td>
                            {c.stationCode != null ? (
                              <Link
                                className={css.taInlineLink}
                                to={`/station/${encodeURIComponent(c.stationCode)}`}
                              >
                                {c.stationName ?? c.stationCode}
                              </Link>
                            ) : (
                              "—"
                            )}
                            <span className={css.taCellSub}>{c.bomLineId}</span>
                          </td>
                          <td className={css.taCellNum}>{c.qtyPerAircraft ?? "—"}</td>
                          <td className={css.taCellNum}>{(c.qtyPerAircraft ?? 0) * 12}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className={css.taPanel}>
            <header className={css.taPanelHead}>
              <h2 className={css.taPanelTitle}>Stock on hand</h2>
              <span className={css.taTraversal}>Part → inventoryLots</span>
            </header>
            <div className={css.taPanelBody}>
              {data.lots.length === 0 ? (
                <p className={css.taEmpty}>No lots recorded.</p>
              ) : (
                <div className={css.taTableWrap}>
                  <table className={css.taTable}>
                    <thead>
                      <tr>
                        <th scope="col">Lot</th>
                        <th scope="col">Location</th>
                        <th scope="col" className={css.taCellNum}>
                          Qty
                        </th>
                        <th scope="col" className={css.taCellNum}>
                          Received
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.lots.map((l) => (
                        <tr key={l.lotId}>
                          <td className={css.taCellMono}>{l.lotId}</td>
                          <td className={css.taCellMono}>{l.location ?? "—"}</td>
                          <td className={css.taCellNum}>
                            <span className={l.qtyOnHand === 0 ? css.taToneBad : undefined}>
                              {l.qtyOnHand ?? "—"}
                            </span>
                          </td>
                          <td className={css.taCellNum}>{shortDateYear(l.receivedDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>

        {data.shortages.length > 0 ? (
          <section className={css.taPanel}>
            <header className={css.taPanelHead}>
              <h2 className={css.taPanelTitle}>Shortages of this part</h2>
              <span className={css.taTraversal}>Part → shortages</span>
            </header>
            <div className={css.taPanelBody}>
              <div className={css.taTableWrap}>
                <table className={css.taTable}>
                  <thead>
                    <tr>
                      <th scope="col">Shortage</th>
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
                          <span className={css.taCellMono}>{s.shortageId}</span>
                          <span className={css.taCellSub}>{s.status}</span>
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
                          {s.status === "Open" ? (
                            <button
                              type="button"
                              className={css.taRowAction}
                              onClick={() =>
                                setDialog({
                                  kind: "shortage",
                                  target: {
                                    shortageId: s.shortageId,
                                    label: `${s.shortageId} · ${data.description}`,
                                    expectedRecovery: s.expectedRecovery,
                                    status: s.status,
                                  },
                                })
                              }
                            >
                              Acknowledge
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export default PartDetail;
