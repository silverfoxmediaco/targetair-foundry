import {
  acknowledgeShortage,
  dispositionNonConformance,
  updateForecastDelivery,
} from "@target-air/sdk";
import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import client from "@/client";
import { useAircraftDetail } from "@/data/useAircraftDetail";
import ActionDialog, { type FieldSpec } from "./ActionDialog";
import css from "./Dashboard.module.css";
import { shortDateYear, usd } from "./format";

/**
 * These action parameters are `LocalDate`, not instants, so the YYYY-MM-DD an
 * <input type="date"> produces is already the right shape and goes through
 * untouched.
 *
 * Worth stating, because the obvious defensive move is to append T00:00:00Z
 * and "avoid a timezone bug". That is wrong twice over: the API rejects it
 * outright with InvalidParameterValue, and a LocalDate has no timezone to get
 * wrong in the first place. A delivery date is a day on a calendar, not a
 * moment — which is the correct modelling choice and the reason the read path
 * has to normalise to UTC while the write path does not.
 */
function toLocalDate(isoDate: string): string {
  return isoDate;
}

/** A Date back to the YYYY-MM-DD an <input type="date"> expects. */
function toInputDate(value: Date | undefined): string {
  return value == null ? "" : value.toISOString().slice(0, 10);
}

type OpenDialog =
  | { kind: "forecast" }
  | { kind: "shortage"; shortageId: string; label: string; recovery?: Date }
  | { kind: "ncr"; ncrId: string; label: string };

/**
 * One airframe, reached by clicking it on the overview.
 *
 * Every section here is a link traversal from the aircraft object rather than
 * a filtered query, and each is labelled with the path it walked. That label
 * is not decoration: it is the difference between a dashboard that happens to
 * show related rows and one where the relationship is part of the model.
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

function AircraftDetail(): React.ReactElement {
  const { serialNumber } = useParams<{ serialNumber: string }>();
  const { data, error, loading, reload } = useAircraftDetail(serialNumber);
  const [dialog, setDialog] = useState<OpenDialog | undefined>(undefined);

  if (loading) {
    return <div className={css.taCentre}>Traversing the ontology…</div>;
  }

  if (error != null || data == null) {
    return (
      <div className={css.taCentre}>
        <div className={css.taErrorBox}>{error ?? "Airframe not found."}</div>
      </div>
    );
  }

  const openNcrs = data.nonConformances.filter((n) => n.status === "Open").length;
  const blocked = data.workOrders.filter((w) => w.status === "Blocked").length;

  const deliveryTone = data.isOverdue
    ? css.taToneCritical
    : data.slipDays > 0
      ? css.taToneBad
      : data.status === "Delivered"
        ? css.taToneGood
        : css.taToneNeutral;

  const deliveryValue = data.isOverdue
    ? `${data.daysPastForecast}d`
    : data.slipDays > 0
      ? `+${data.slipDays}d`
      : data.status === "Delivered"
        ? "done"
        : "0d";

  const dialogNode =
    dialog?.kind === "forecast" ? (
      <ActionDialog
        title="Update forecast delivery"
        subject={`${data.serialNumber} · currently ${shortDateYear(data.forecastDelivery)}`}
        actionApiName="update-forecast-delivery"
        submitLabel="Re-forecast"
        fields={
          [
            {
              name: "forecastDeliveryDate",
              label: "New forecast delivery",
              kind: "date",
              required: true,
              initial: toInputDate(data.forecastDelivery),
            },
            { name: "reason", label: "Reason", kind: "text", required: true },
          ] satisfies FieldSpec[]
        }
        onSubmit={async (v) => {
          // `reason` is collected but not sent: the ontology has nowhere to put
          // it. In a real build it would write to an audit object. Requiring it
          // still costs nothing and makes the user state a case.
          await client(updateForecastDelivery).applyAction({
            aircraft: data.serialNumber,
            forecastDeliveryDate: toLocalDate(v.forecastDeliveryDate),
          });
        }}
        onApplied={reload}
        onClose={() => setDialog(undefined)}
      />
    ) : dialog?.kind === "shortage" ? (
      <ActionDialog
        title="Acknowledge shortage"
        subject={dialog.label}
        actionApiName="acknowledge-shortage"
        submitLabel="Acknowledge"
        fields={
          [
            {
              name: "status",
              label: "Status",
              kind: "select",
              options: ["Open", "Mitigating", "Closed"],
              required: true,
              initial: "Mitigating",
            },
            {
              name: "expectedRecoveryDate",
              label: "Expected recovery",
              kind: "date",
              required: true,
              initial: toInputDate(dialog.recovery),
            },
          ] satisfies FieldSpec[]
        }
        onSubmit={async (v) => {
          await client(acknowledgeShortage).applyAction({
            shortage: dialog.shortageId,
            status: v.status,
            expectedRecoveryDate: toLocalDate(v.expectedRecoveryDate),
          });
        }}
        onApplied={reload}
        onClose={() => setDialog(undefined)}
      />
    ) : dialog?.kind === "ncr" ? (
      <ActionDialog
        title="Disposition non-conformance"
        subject={dialog.label}
        actionApiName="disposition-non-conformance"
        submitLabel="Disposition"
        fields={
          [
            {
              name: "disposition",
              label: "Disposition",
              kind: "select",
              options: ["Use As Is", "Rework", "Scrap"],
              required: true,
            },
            {
              name: "status",
              label: "Status",
              kind: "select",
              options: ["Open", "Dispositioned", "Closed"],
              required: true,
              initial: "Dispositioned",
            },
            { name: "closedDate", label: "Closed date", kind: "date" },
          ] satisfies FieldSpec[]
        }
        onSubmit={async (v) => {
          await client(dispositionNonConformance).applyAction({
            nonConformance: dialog.ncrId,
            disposition: v.disposition,
            status: v.status,
            closedDate: v.closedDate === "" ? undefined : toLocalDate(v.closedDate),
          });
        }}
        onApplied={reload}
        onClose={() => setDialog(undefined)}
      />
    ) : null;

  return (
    <div className={css.taShell}>
      {dialogNode}
      <div className={css.taInner}>
        <header className={css.taMasthead}>
          <div className={css.taBrand}>
            <Link className={css.taBackLink} to="/">
              ← Programme overview
            </Link>
          </div>
          <div className={css.taMastheadMeta}>
            <span className={css.taMetaItem}>
              <span className={css.taMetaLabel}>Programme</span>
              <span className={css.taMetaValue}>{data.program ?? "—"}</span>
            </span>
            <span className={css.taMetaItem}>
              <span className={css.taMetaLabel}>Customer</span>
              <span className={css.taMetaValue}>{data.customer ?? "—"}</span>
            </span>
            {data.status !== "Delivered" ? (
              <button
                type="button"
                className={css.taButton}
                onClick={() => setDialog({ kind: "forecast" })}
              >
                Update forecast
              </button>
            ) : null}
          </div>
        </header>

        <section className={css.taVerdict}>
          <span className={css.taVerdictHead}>{data.serialNumber}</span>
          <span className={css.taVerdictBody}>
            {data.status}
            {data.stationName != null ? ` at ${data.stationName}` : ""}.{" "}
            {data.isOverdue
              ? `Forecast delivery was ${shortDateYear(data.forecastDelivery)}, ${data.daysPastForecast} days ago, and it has not been handed over.`
              : data.slipDays > 0
                ? `Forecast ${shortDateYear(data.forecastDelivery)}, ${data.slipDays} days later than planned.`
                : data.status === "Delivered"
                  ? `Delivered ${shortDateYear(data.forecastDelivery)}, on plan.`
                  : `Forecast ${shortDateYear(data.forecastDelivery)}, on plan.`}
            {blocked > 0
              ? ` ${blocked} work order${blocked === 1 ? "" : "s"} currently blocked.`
              : ""}
          </span>
        </section>

        <div className={css.taFigures}>
          <div className={css.taFigure}>
            <span className={css.taFigureLabel}>Schedule</span>
            <span className={[css.taFigureValue, deliveryTone].join(" ")}>{deliveryValue}</span>
            <span className={css.taFigureNote}>
              {data.isOverdue ? "past forecast, undelivered" : "forecast against plan"}
            </span>
          </div>
          <div className={css.taFigure}>
            <span className={css.taFigureLabel}>Current station</span>
            <span className={css.taFigureValue}>{data.stationCode ?? "—"}</span>
            <span className={css.taFigureNote}>
              {data.stationName ?? "not on the line"}
              {data.stationAvgCycleDays != null && data.stationTaktDays != null
                ? ` · ${data.stationAvgCycleDays}d against ${data.stationTaktDays}d takt`
                : ""}
            </span>
          </div>
          <div className={css.taFigure}>
            <span className={css.taFigureLabel}>Work orders</span>
            <span className={css.taFigureValue}>{data.workOrders.length}</span>
            <span className={css.taFigureNote}>
              {blocked > 0 ? `${blocked} blocked` : "none blocked"}
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
            <span className={css.taFigureNote}>
              {data.shortages.length > 0
                ? `${usd(data.shortages.reduce((s, x) => s + (x.exposureUsd ?? 0), 0))} exposure`
                : "nothing outstanding"}
            </span>
          </div>
          <div className={css.taFigure}>
            <span className={css.taFigureLabel}>Open rework</span>
            <span
              className={[css.taFigureValue, openNcrs > 0 ? css.taToneWarn : css.taToneNeutral].join(
                " ",
              )}
            >
              {openNcrs}
            </span>
            <span className={css.taFigureNote}>
              {data.nonConformances.length} raised in total
            </span>
          </div>
        </div>

        {/* ---- Shortages ------------------------------------------------ */}
        <section className={css.taPanel}>
          <header className={css.taPanelHead}>
            <h2 className={css.taPanelTitle}>Shortages against this airframe</h2>
            <span className={css.taTraversal}>Aircraft → shortages → part → supplier</span>
          </header>
          <div className={css.taPanelBody}>
            {data.shortages.length === 0 ? (
              <p className={css.taEmpty}>No open shortages against this airframe.</p>
            ) : (
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
                            {s.partNumber} · {s.shortageId}
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
                          <span className={css.taCellMono}>{s.blockedWorkOrderId ?? "—"}</span>
                          <span className={css.taCellSub}>{s.stationName ?? "—"}</span>
                        </td>
                        <td className={css.taCellNum}>
                          {s.qtyShort}
                          <span className={css.taCellSub}>{usd(s.exposureUsd ?? 0)}</span>
                        </td>
                        <td className={css.taCellNum}>
                          <span
                            className={(s.daysToRecovery ?? 0) > 21 ? css.taToneBad : css.taToneWarn}
                          >
                            {shortDateYear(s.expectedRecovery)}
                          </span>
                          <span className={css.taCellSub}>
                            {s.daysToRecovery != null
                              ? s.daysToRecovery >= 0
                                ? `in ${s.daysToRecovery}d`
                                : `${Math.abs(s.daysToRecovery)}d overdue`
                              : "—"}
                          </span>
                        </td>
                        <td className={css.taCellNum}>
                          <button
                            type="button"
                            className={css.taRowAction}
                            onClick={() =>
                              setDialog({
                                kind: "shortage",
                                shortageId: s.shortageId,
                                label: `${s.shortageId} · ${s.partDescription ?? s.partNumber}`,
                                recovery: s.expectedRecovery,
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

        <div className={css.taSplitWide}>
          {/* ---- Work orders -------------------------------------------- */}
          <section className={css.taPanel}>
            <header className={css.taPanelHead}>
              <h2 className={css.taPanelTitle}>Work orders</h2>
              <span className={css.taTraversal}>Aircraft → workOrders → station</span>
            </header>
            <div className={css.taPanelBody}>
              <div className={css.taTableWrap}>
                <table className={css.taTable}>
                  <thead>
                    <tr>
                      <th scope="col">Order</th>
                      <th scope="col">Station</th>
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
                          {w.stationName ?? w.stationCode}
                          <span className={css.taCellSub}>{w.stationCode}</span>
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

          {/* ---- Non-conformances --------------------------------------- */}
          <section className={css.taPanel}>
            <header className={css.taPanelHead}>
              <h2 className={css.taPanelTitle}>Non-conformances</h2>
              <span className={css.taTraversal}>Aircraft → nonConformances → station</span>
            </header>
            <div className={css.taPanelBody}>
              {data.nonConformances.length === 0 ? (
                <p className={css.taEmpty}>Nothing raised against this airframe.</p>
              ) : (
                <div className={css.taTableWrap}>
                  <table className={css.taTable}>
                    <thead>
                      <tr>
                        <th scope="col">Finding</th>
                        <th scope="col">Station</th>
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
                            {n.stationName ?? n.stationCode}
                            <span className={css.taCellSub}>{n.stationCode}</span>
                          </td>
                          <td>
                            <span className={[css.taChip, severityChip(n.severity)].join(" ")}>
                              {n.severity}
                            </span>
                            <span className={css.taCellSub}>
                              {n.status}
                              {n.disposition != null && n.disposition !== ""
                                ? ` · ${n.disposition}`
                                : ""}
                            </span>
                          </td>
                          <td className={css.taCellNum}>
                            {n.status === "Open" ? (
                              <button
                                type="button"
                                className={css.taRowAction}
                                onClick={() =>
                                  setDialog({
                                    kind: "ncr",
                                    ncrId: n.ncrId,
                                    label: `${n.ncrId} · ${n.description ?? ""}`,
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

export default AircraftDetail;
