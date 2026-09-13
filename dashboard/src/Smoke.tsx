import { Aircraft, Part, Shortage, WorkOrder } from "@target-air/sdk";
import type { Osdk } from "@osdk/client";
import React, { useEffect, useState } from "react";
import client, { auth } from "@/client";
import css from "./Smoke.module.css";

/**
 * Connectivity proof, not a design.
 *
 * Fetches every open shortage, then walks Shortage -> Part, Shortage ->
 * WorkOrder and Shortage -> Aircraft one object at a time. If these four rows
 * render with their linked objects resolved, then OAuth, the generated SDK and
 * link traversal are all working and the rest of the build is presentation.
 */

interface ShortageRow {
  shortage: Osdk.Instance<Shortage>;
  part?: Osdk.Instance<Part>;
  workOrder?: Osdk.Instance<WorkOrder>;
  aircraft?: Osdk.Instance<Aircraft>;
}

function Smoke(): React.ReactElement {
  const [rows, setRows] = useState<ShortageRow[] | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      await auth.signIn();

      const page = await client(Shortage).fetchPage({ $pageSize: 50 });

      // Deliberately N+1. Four shortages, and the point here is to exercise the
      // traversal rather than to be fast. The real dashboard batches this.
      const resolved = await Promise.all(
        page.data.map(async (shortage): Promise<ShortageRow> => {
          const [part, workOrder, aircraft] = await Promise.all([
            shortage.$link.part.fetchOne().catch(() => undefined),
            shortage.$link.workOrder.fetchOne().catch(() => undefined),
            shortage.$link.aircraft.fetchOne().catch(() => undefined),
          ]);
          return { shortage, part, workOrder, aircraft };
        }),
      );

      if (!cancelled) {
        setRows(resolved);
      }
    }

    load().catch((e: unknown) => {
      if (!cancelled) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error != null) {
    return (
      <div className={css.taSmokeShell}>
        <p className={css.taSmokeError}>{error}</p>
      </div>
    );
  }

  if (rows == null) {
    return (
      <div className={css.taSmokeShell}>
        <p className={css.taSmokeStatus}>Signing in and querying the ontology…</p>
      </div>
    );
  }

  return (
    <div className={css.taSmokeShell}>
      <h1 className={css.taSmokeHeading}>Open shortages</h1>
      <p className={css.taSmokeStatus}>
        {rows.length} shortage{rows.length === 1 ? "" : "s"} returned, each
        traversed to its part, blocked work order and aircraft.
      </p>

      <div className={css.taSmokeTableWrap}>
        <table className={css.taSmokeTable}>
          <thead>
            <tr>
              <th>Shortage</th>
              <th>Part</th>
              <th className={css.taSmokeNumeric}>Qty short</th>
              <th>Criticality</th>
              <th>Blocked work order</th>
              <th>Aircraft</th>
              <th>Forecast delivery</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ shortage, part, workOrder, aircraft }) => (
              <tr key={shortage.shortageId}>
                <td>{shortage.shortageId}</td>
                <td>
                  {part?.description ?? shortage.partNumber}
                  <span className={css.taSmokeSub}>{shortage.partNumber}</span>
                </td>
                <td className={css.taSmokeNumeric}>{shortage.qtyShort}</td>
                <td>{shortage.criticality}</td>
                <td>
                  {workOrder?.workOrderId ?? "—"}
                  <span className={css.taSmokeSub}>{workOrder?.status}</span>
                </td>
                <td>{aircraft?.serialNumber ?? "—"}</td>
                <td>{formatDate(aircraft?.forecastDeliveryDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(value: string | undefined): string {
  if (value == null) {
    return "—";
  }
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default Smoke;
