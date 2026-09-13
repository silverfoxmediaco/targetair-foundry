import {
  acknowledgeShortage,
  dispositionNonConformance,
  updateForecastDelivery,
} from "@target-air/sdk";
import React from "react";
import client from "@/client";
import ActionDialog, { type FieldSpec } from "./ActionDialog";
import { shortDateYear } from "./format";

/**
 * The three ontology actions, defined once.
 *
 * A shortage can be acknowledged from the overview, the airframe, the station,
 * the supplier or the part — five places that are all looking at the same
 * object. Defining the form five times would guarantee they drift: one screen
 * would allow a status the others do not, or default a date differently, and
 * the ontology would end up holding whichever the user happened to reach.
 *
 * These parameters are `LocalDate`, so the YYYY-MM-DD an <input type="date">
 * produces goes through untouched. Appending T00:00:00Z is rejected with
 * InvalidParameterValue — a LocalDate has no timezone to get wrong. That is
 * why the read path normalises to UTC and the write path does not.
 */

/** A Date back to the YYYY-MM-DD an <input type="date"> expects. */
function toInputDate(value: Date | undefined): string {
  return value == null ? "" : value.toISOString().slice(0, 10);
}

// ---- Forecast -------------------------------------------------------------

export interface ForecastTarget {
  serialNumber: string;
  forecastDelivery?: Date;
}

export function ForecastDialog({
  target,
  onApplied,
  onClose,
}: {
  target: ForecastTarget;
  onApplied: () => void;
  onClose: () => void;
}): React.ReactElement {
  return (
    <ActionDialog
      title="Update forecast delivery"
      subject={`${target.serialNumber} · currently ${shortDateYear(target.forecastDelivery)}`}
      actionApiName="update-forecast-delivery"
      submitLabel="Re-forecast"
      fields={
        [
          {
            name: "forecastDeliveryDate",
            label: "New forecast delivery",
            kind: "date",
            required: true,
            initial: toInputDate(target.forecastDelivery),
          },
          { name: "reason", label: "Reason", kind: "text", required: true },
        ] satisfies FieldSpec[]
      }
      onSubmit={async (v) => {
        // `reason` is collected but not sent: the ontology has nowhere to put
        // it. In a real build it would write to an audit object. Requiring it
        // costs nothing and makes the user state a case before moving a date
        // a customer is holding them to.
        await client(updateForecastDelivery).applyAction({
          aircraft: target.serialNumber,
          forecastDeliveryDate: v.forecastDeliveryDate,
        });
      }}
      onApplied={onApplied}
      onClose={onClose}
    />
  );
}

// ---- Shortage -------------------------------------------------------------

export interface ShortageTarget {
  shortageId: string;
  label: string;
  expectedRecovery?: Date;
  status?: string;
}

export function ShortageDialog({
  target,
  onApplied,
  onClose,
}: {
  target: ShortageTarget;
  onApplied: () => void;
  onClose: () => void;
}): React.ReactElement {
  return (
    <ActionDialog
      title="Acknowledge shortage"
      subject={target.label}
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
            initial: target.status === "Open" ? "Mitigating" : (target.status ?? "Mitigating"),
          },
          {
            name: "expectedRecoveryDate",
            label: "Expected recovery",
            kind: "date",
            required: true,
            initial: toInputDate(target.expectedRecovery),
          },
        ] satisfies FieldSpec[]
      }
      onSubmit={async (v) => {
        await client(acknowledgeShortage).applyAction({
          shortage: target.shortageId,
          status: v.status,
          expectedRecoveryDate: v.expectedRecoveryDate,
        });
      }}
      onApplied={onApplied}
      onClose={onClose}
    />
  );
}

// ---- Non-conformance ------------------------------------------------------

export interface NcrTarget {
  ncrId: string;
  label: string;
  disposition?: string;
  status?: string;
}

export function NcrDialog({
  target,
  onApplied,
  onClose,
}: {
  target: NcrTarget;
  onApplied: () => void;
  onClose: () => void;
}): React.ReactElement {
  return (
    <ActionDialog
      title="Disposition non-conformance"
      subject={target.label}
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
            initial: target.disposition ?? "",
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
          nonConformance: target.ncrId,
          disposition: v.disposition,
          status: v.status,
          closedDate: v.closedDate === "" ? undefined : v.closedDate,
        });
      }}
      onApplied={onApplied}
      onClose={onClose}
    />
  );
}

// ---- Shared open-dialog state --------------------------------------------

export type ActionTarget =
  | { kind: "forecast"; target: ForecastTarget }
  | { kind: "shortage"; target: ShortageTarget }
  | { kind: "ncr"; target: NcrTarget };

/** Renders whichever dialog is open, or nothing. */
export function ActionHost({
  open,
  onApplied,
  onClose,
}: {
  open: ActionTarget | undefined;
  onApplied: () => void;
  onClose: () => void;
}): React.ReactElement | null {
  if (open == null) {
    return null;
  }
  switch (open.kind) {
    case "forecast":
      return <ForecastDialog target={open.target} onApplied={onApplied} onClose={onClose} />;
    case "shortage":
      return <ShortageDialog target={open.target} onApplied={onApplied} onClose={onClose} />;
    case "ncr":
      return <NcrDialog target={open.target} onApplied={onApplied} onClose={onClose} />;
  }
}
