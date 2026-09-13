import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStationDetail } from "@/data/useStationDetail";
import { ActionHost, type ActionTarget } from "./actionForms";
import css from "./Dashboard.module.css";
import { shortDateYear } from "./format";

/**
 * One station on the line.
 *
 * Reached by clicking a bar on the takt chart. Where the airframe view answers
 * "what is wrong with this tail", this answers "what is wrong at this place" —
 * which is the question the constraint station provokes and the overview
 * cannot answer.
 */

function severityChip(severity: string | undefined): string {
  switch (severity) {
    case "Critical":
      return css.taChipCritical;
    case "Major":
      return css.taChipBad;
    default:
      return css.taChipMuted;
  }
}

function workOrderChip(status: string | undefined): string {
  switch (status) {
    case "Blocked":
      return css.taChipBad;
    case "In Progress":
      return css.taChipWarn;
    case "Complete":
      return css.taChipGood;
    default:
      return css.taChipMuted;
  }
}

function StationDetail(): React.ReactElement {
  const { stationCode } = useParams<{ stationCode: string }>();
  const { data, error, loading, reload } = useStationDetail(stationCode);
  const [dialog, setDialog] = useState<ActionTarget | undefined>(undefined);

  if (loading) {
    return <div className={css.taCentre}>Traversing the ontology…</div>;
  }

  if (error != null || data == null) {
    return (
      <div className={css.taCentre}>
        <div className={css.taErrorBox}>{error ?? "Station not found."}</div>
      </div>
    );
  }

  const overTakt = data.overTaktDays > 0;
  const blocked = data.workOrders.filter((w) => w.status === "Blocked").length;
  const openNcrs = data.nonConformances.filter((n) => n.status === "Open").length;
  const live = data.workOrders.filter(
    (w) => w.status === "Blocked" || w.status === "In Progress",
  ).length;

  return (
    <div className={css.taShell}>
      <ActionHost open={dialog} onApplied={reload} onClose={() => setDialog(undefined)} />
      <div className={css.taInner}>
        <header className={css.taMasthead}>
          <div className={css.taBrand}>
            <Link className={css.taBackLink} to="/">
              ← Programme overview
            </Link>
          </div>
          <div className={css.taMastheadMeta}>
            <span className={css.taMetaItem}>
              <span className={css.taMetaLabel}>Station</span>
              <span className={css.taMetaValue}>{data.stationCode}</span>
            </span>
            <span className={css.taMetaItem}>
              <span className={css.taMetaLabel}>Sequence</span>
              <span className={css.taMetaValue}>{data.sequence ?? "—"} of 8</span>
            </span>
          </div>
        </header>

        <section className={css.taVerdict}>
          <span className={css.taVerdictHead}>{data.stationName}</span>
          <span className={css.taVerdictBody}>
            {overTakt
              ? `Runs ${data.avgCycleDays} days against a ${data.taktDays}-day takt, ${data.overTaktDays} over. The line cannot move faster than this station until that closes.`
              : `Runs ${data.avgCycleDays} days against a ${data.taktDays}-day takt, ${Math.abs(data.overTaktDays)} inside. This station is absorbing slack rather than creating it.`}
            {blocked > 0 ? ` ${blocked} work order${blocked === 1 ? "" : "s"} blocked here.` : ""}
          </span>
        </section>

        <div className={css.taFigures}>
          <div className={css.taFigure}>
            <span className={css.taFigureLabel}>Cycle time</span>
            <span
              className={[css.taFigureValue, overTakt ? css.taToneBad : css.taToneGood].join(" ")}
            >
              {data.avgCycleDays}
              <span className={css.taFigureUnit}>days</span>
            </span>
            <span className={css.taFigureNote}>
              {overTakt ? `${data.overTaktDays} over` : `${Math.abs(data.overTaktDays)} inside`} a{" "}
              {data.taktDays}-day takt
            </span>
          </div>
          <div className={css.taFigure}>
            <span className={css.taFigureLabel}>Airframes here</span>
            <span className={css.taFigureValue}>{data.aircraft.length}</span>
            <span className={css.taFigureNote}>
              {data.aircraft.map((a) => a.serialNumber).join(", ") || "none on station"}
            </span>
          </div>
          <div className={css.taFigure}>
            <span className={css.taFigureLabel}>Live work orders</span>
            <span className={[css.taFigureValue, blocked > 0 ? css.taToneWarn : ""].join(" ")}>
              {live}
            </span>
            <span className={css.taFigureNote}>
              {blocked > 0 ? `${blocked} blocked` : "none blocked"} · {data.workOrders.length} all
              time
            </span>
          </div>
          <div className={css.taFigure}>
            <span className={css.taFigureLabel}>Shortages</span>
            <span
              className={[
                css.taFigureValue,
                data.shortages.length > 0 ? css.taToneBad : css.taToneGood,
              ].join(" ")}
            >
              {data.shortages.length}
            </span>
            <span className={css.taFigureNote}>open against this station</span>
          </div>
          <div className={css.taFigure}>
            <span className={css.taFigureLabel}>Open rework</span>
            <span
              className={[css.taFigureValue, openNcrs > 0 ? css.taToneWarn : ""].join(" ")}
            >
              {openNcrs}
            </span>
            <span className={css.taFigureNote}>
              {data.nonConformances.length} raised here in total
            </span>
          </div>
        </div>

        <div className={css.taSplitWide}>
          {/* ---- Work orders -------------------------------------------- */}
          <section className={css.taPanel}>
            <header className={css.taPanelHead}>
              <h2 className={css.taPanelTitle}>Work orders at this station</h2>
              <span className={css.taTraversal}>Station → workOrders</span>
            </header>
            <div className={css.taPanelBody}>
              <div className={css.taTableWrap}>
                <table className={css.taTable}>
                  <thead>
                    <tr>
                      <th scope="col">Order</th>
                      <th scope="col">Airframe</th>
                      <th scope="col">Status</th>
                      <th scope="col" className={css.taCellNum}>
                        Hours
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.workOrders.map((w) => (
                      <tr key={w.workOrderId}>
                        <td className={css.taCellMono}>{w.workOrderId}</td>
                        <td>
                          {w.serialNumber != null ? (
                            <Link
                              className={css.taInlineLink}
                              to={`/aircraft/${encodeURIComponent(w.serialNumber)}`}
                            >
                              {w.serialNumber}
                            </Link>
                          ) : (
                            "—"
                          )}
                          <span className={css.taCellSub}>{shortDateYear(w.startedDate)}</span>
                        </td>
                        <td>
                          <span className={[css.taChip, workOrderChip(w.status)].join(" ")}>
                            {w.status}
                          </span>
                        </td>
                        <td className={css.taCellNum}>
                          {w.hoursBooked ?? "—"}
                          <span className={css.taCellSub}>of {w.standardHours ?? "—"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ---- Parts consumed ----------------------------------------- */}
          <section className={css.taPanel}>
            <header className={css.taPanelHead}>
              <h2 className={css.taPanelTitle}>Parts consumed here</h2>
              <span className={css.taTraversal}>Station → bomLines → part → supplier</span>
            </header>
            <div className={css.taPanelBody}>
              <div className={css.taTableWrap}>
                <table className={css.taTable}>
                  <thead>
                    <tr>
                      <th scope="col">Part</th>
                      <th scope="col">Supplier</th>
                      <th scope="col" className={css.taCellNum}>
                        Per airframe
                      </th>
                      <th scope="col" className={css.taCellNum}>
                        Lead
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bomLines.map((b) => (
                      <tr key={b.bomLineId}>
                        <td>
                          {b.partDescription ?? b.partNumber}
                          {b.criticality === "critical" ? (
                            <>
                              {" "}
                              <span className={[css.taChip, css.taChipCritical].join(" ")}>
                                critical
                              </span>
                            </>
                          ) : null}
                          <span className={css.taCellSub}>{b.partNumber}</span>
                        </td>
                        <td>{b.supplierName ?? "—"}</td>
                        <td className={css.taCellNum}>{b.qtyPerAircraft ?? "—"}</td>
                        <td className={css.taCellNum}>
                          {b.leadTimeDays != null ? `${b.leadTimeDays}d` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        <div className={css.taSplitWide}>
          {/* ---- Shortages ---------------------------------------------- */}
          <section className={css.taPanel}>
            <header className={css.taPanelHead}>
              <h2 className={css.taPanelTitle}>Shortages here</h2>
              <span className={css.taTraversal}>Station → shortages → part → supplier</span>
            </header>
            <div className={css.taPanelBody}>
              {data.shortages.length === 0 ? (
                <p className={css.taEmpty}>Nothing short at this station.</p>
              ) : (
                <div className={css.taTableWrap}>
                  <table className={css.taTable}>
                    <thead>
                      <tr>
                        <th scope="col">Part</th>
                        <th scope="col">Supplier</th>
                        <th scope="col">Holding</th>
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
                            {s.partDescription ?? s.partNumber}
                            {s.criticality === "critical" ? (
                              <>
                                {" "}
                                <span className={[css.taChip, css.taChipCritical].join(" ")}>
                                  critical
                                </span>
                              </>
                            ) : null}
                            <span className={css.taCellSub}>
                              {s.partNumber} · short {s.qtyShort}
                            </span>
                          </td>
                          <td>{s.supplierName ?? "—"}</td>
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
              )}
            </div>
          </section>

          {/* ---- Non-conformances --------------------------------------- */}
          <section className={css.taPanel}>
            <header className={css.taPanelHead}>
              <h2 className={css.taPanelTitle}>Non-conformances here</h2>
              <span className={css.taTraversal}>Station → nonConformances</span>
            </header>
            <div className={css.taPanelBody}>
              {data.nonConformances.length === 0 ? (
                <p className={css.taEmpty}>Nothing raised at this station.</p>
              ) : (
                <div className={css.taTableWrap}>
                  <table className={css.taTable}>
                    <thead>
                      <tr>
                        <th scope="col">Finding</th>
                        <th scope="col">Airframe</th>
                        <th scope="col">Status</th>
                        <th scope="col" />
                      </tr>
                    </thead>
                    <tbody>
                      {data.nonConformances.map((n) => (
                        <tr key={n.ncrId}>
                          <td>
                            {n.description ?? "—"}
                            <span className={css.taCellSub}>
                              {n.ncrId} · {shortDateYear(n.openedDate)}
                            </span>
                          </td>
                          <td>
                            {n.serialNumber != null ? (
                              <Link
                                className={css.taInlineLink}
                                to={`/aircraft/${encodeURIComponent(n.serialNumber)}`}
                              >
                                {n.serialNumber}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>
                            <span className={[css.taChip, severityChip(n.severity)].join(" ")}>
                              {n.severity}
                            </span>
                            <span className={css.taCellSub}>{n.status}</span>
                          </td>
                          <td className={css.taCellNum}>
                            {n.status === "Open" ? (
                              <button
                                type="button"
                                className={css.taRowAction}
                                onClick={() =>
                                  setDialog({
                                    kind: "ncr",
                                    target: {
                                      ncrId: n.ncrId,
                                      label: `${n.ncrId} · ${n.description ?? ""}`,
                                      status: n.status,
                                    },
                                  })
                                }
                              >
                                Disposition
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default StationDetail;
