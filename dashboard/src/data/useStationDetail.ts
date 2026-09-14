import { Station } from "@target-air/sdk";
import type { Osdk } from "@osdk/client";
import { useCallback, useEffect, useState } from "react";
import client, { signIn } from "@/client";

/**
 * One station on the line, assembled by traversing outward from it.
 *
 *   Station -> aircraft           what is sitting here now
 *   Station -> workOrders         what has been worked here
 *   Station -> shortages -> part  what is missing here
 *   Station -> nonConformances    what has gone wrong here
 *   Station -> bomLines -> part   what this station consumes
 *
 * The last one is the reason bomLines exists in the model. It answers "what
 * does this station need per airframe", which is the question a supply chain
 * planner asks and no amount of work-order data can answer.
 */

export interface StationAircraft {
  serialNumber: string;
  customer?: string;
  status?: string;
  forecastDelivery?: Date;
  slipDays: number;
}

export interface StationWorkOrder {
  workOrderId: string;
  serialNumber?: string;
  status?: string;
  hoursBooked?: number;
  standardHours?: number;
  startedDate?: Date;
}

export interface StationShortage {
  shortageId: string;
  partNumber: string;
  partDescription?: string;
  criticality?: string;
  qtyShort?: number;
  serialNumber?: string;
  expectedRecovery?: Date;
  supplierName?: string;
}

export interface StationNcr {
  ncrId: string;
  severity?: string;
  status?: string;
  description?: string;
  serialNumber?: string;
  openedDate?: Date;
}

export interface StationBomLine {
  bomLineId: string;
  partNumber: string;
  partDescription?: string;
  qtyPerAircraft?: number;
  criticality?: string;
  leadTimeDays?: number;
  supplierName?: string;
}

export interface StationDetail {
  stationCode: string;
  stationName: string;
  sequence?: number;
  taktDays?: number;
  avgCycleDays?: number;
  overTaktDays: number;
  standardHours?: number;
  aircraft: StationAircraft[];
  workOrders: StationWorkOrder[];
  shortages: StationShortage[];
  nonConformances: StationNcr[];
  bomLines: StationBomLine[];
}

const DAY_MS = 86_400_000;

function toDate(value: string | undefined): Date | undefined {
  return value == null ? undefined : new Date(value);
}

function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.round((b - a) / DAY_MS);
}

async function fetchDetail(stationCode: string): Promise<StationDetail> {
  await signIn();

  const station: Osdk.Instance<Station> = await client(Station).fetchOne(stationCode);

  const [aircraftPage, workOrderPage, shortagePage, ncrPage, bomPage] = await Promise.all([
    station.$link.aircraft.fetchPage({ $pageSize: 200 }),
    station.$link.workOrders.fetchPage({ $pageSize: 500 }),
    station.$link.shortages.fetchPage({ $pageSize: 200 }),
    station.$link.nonConformances.fetchPage({ $pageSize: 200 }),
    station.$link.bomLines.fetchPage({ $pageSize: 500 }),
  ]);

  const aircraft: StationAircraft[] = aircraftPage.data
    .map((a) => {
      const planned = toDate(a.plannedDeliveryDate);
      const forecast = toDate(a.forecastDeliveryDate);
      return {
        serialNumber: a.serialNumber ?? "—",
        customer: a.customer ?? undefined,
        status: a.status ?? undefined,
        forecastDelivery: forecast,
        slipDays: planned != null && forecast != null ? daysBetween(planned, forecast) : 0,
      };
    })
    .sort((a, b) => a.serialNumber.localeCompare(b.serialNumber));

  const workOrders: StationWorkOrder[] = workOrderPage.data
    .map((w) => ({
      workOrderId: w.workOrderId ?? "—",
      serialNumber: w.serialNumber ?? undefined,
      status: w.status ?? undefined,
      hoursBooked: w.hoursBooked ?? undefined,
      standardHours: w.standardHours ?? undefined,
      startedDate: toDate(w.startedDate),
    }))
    // Anything still live first, since a finished order is not news.
    .sort((a, b) => {
      const rank = (s?: string): number => (s === "Blocked" ? 0 : s === "In Progress" ? 1 : 2);
      const r = rank(a.status) - rank(b.status);
      return r !== 0 ? r : a.workOrderId.localeCompare(b.workOrderId);
    });

  const shortages: StationShortage[] = await Promise.all(
    shortagePage.data.map(async (s) => {
      const part = await s.$link.part.fetchOne().catch(() => undefined);
      const supplier =
        part != null ? await part.$link.supplier.fetchOne().catch(() => undefined) : undefined;
      return {
        shortageId: s.shortageId ?? "—",
        partNumber: s.partNumber ?? "—",
        partDescription: part?.description ?? undefined,
        criticality: s.criticality ?? undefined,
        qtyShort: s.qtyShort ?? undefined,
        serialNumber: s.serialNumber ?? undefined,
        expectedRecovery: toDate(s.expectedRecoveryDate),
        supplierName: supplier?.supplierName ?? undefined,
      };
    }),
  );

  const nonConformances: StationNcr[] = ncrPage.data
    .map((n) => ({
      ncrId: n.ncrId ?? "—",
      severity: n.severity ?? undefined,
      status: n.status ?? undefined,
      description: n.description ?? undefined,
      serialNumber: n.serialNumber ?? undefined,
      openedDate: toDate(n.openedDate),
    }))
    .sort((a, b) => {
      const openFirst = Number(b.status === "Open") - Number(a.status === "Open");
      return openFirst !== 0 ? openFirst : a.ncrId.localeCompare(b.ncrId);
    });

  const bomLines: StationBomLine[] = (
    await Promise.all(
      bomPage.data.map(async (b) => {
        const part = await b.$link.part.fetchOne().catch(() => undefined);
        const supplier =
          part != null ? await part.$link.supplier.fetchOne().catch(() => undefined) : undefined;
        return {
          bomLineId: b.bomLineId ?? "—",
          partNumber: b.partNumber ?? "—",
          partDescription: part?.description ?? undefined,
          qtyPerAircraft: b.qtyPerAircraft ?? undefined,
          criticality: part?.criticality ?? undefined,
          leadTimeDays: part?.leadTimeDays ?? undefined,
          supplierName: supplier?.supplierName ?? undefined,
        };
      }),
    )
  ).sort((a, b) => {
    // Critical parts first, then longest lead: the order a planner would want.
    const crit = Number(b.criticality === "critical") - Number(a.criticality === "critical");
    return crit !== 0 ? crit : (b.leadTimeDays ?? 0) - (a.leadTimeDays ?? 0);
  });

  const takt = station.taktDays ?? 0;
  const cycle = station.avgCycleDays ?? 0;

  return {
    stationCode: station.stationCode ?? stationCode,
    stationName: station.stationName ?? stationCode,
    sequence: station.sequence ?? undefined,
    taktDays: takt,
    avgCycleDays: cycle,
    overTaktDays: cycle - takt,
    standardHours: station.standardHours ?? undefined,
    aircraft,
    workOrders,
    shortages,
    nonConformances,
    bomLines,
  };
}

export interface StationDetailState {
  data?: StationDetail;
  error?: string;
  loading: boolean;
  /** Re-read from the ontology, so the screen shows what an action actually
   *  stored rather than what we hoped it stored. */
  reload: () => void;
}

export function useStationDetail(stationCode: string | undefined): StationDetailState {
  const [state, setState] = useState<Omit<StationDetailState, "reload">>({ loading: true });
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => {
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (stationCode == null) {
      setState({ error: "No station specified.", loading: false });
      return;
    }

    let cancelled = false;
    // Keep previous data on screen while refetching so applying an action
    // does not blank the page the user is reading.
    setState((prev) => ({ ...prev, loading: prev.data == null }));

    fetchDetail(stationCode)
      .then((data) => {
        if (!cancelled) {
          setState({ data, loading: false });
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setState({ error: e instanceof Error ? e.message : String(e), loading: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [stationCode, nonce]);

  return { ...state, reload };
}
