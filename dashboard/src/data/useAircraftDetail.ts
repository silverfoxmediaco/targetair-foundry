import { Aircraft } from "@target-air/sdk";
import type { Osdk } from "@osdk/client";
import { useCallback, useEffect, useState } from "react";
import client, { auth } from "@/client";

/**
 * Detail for a single airframe, assembled by walking the ontology's links.
 *
 * This is deliberately the opposite approach to useOperations, which fetches
 * whole object sets and joins them in memory. Here we hold one object and
 * traverse outward from it:
 *
 *   Aircraft -> station
 *   Aircraft -> workOrders
 *   Aircraft -> shortages -> part -> supplier
 *   Aircraft -> nonConformances
 *
 * At this cardinality — one airframe, a handful of linked rows — traversal is
 * both cheap and the honest way to express the question being asked. It is
 * also the reason the link types exist: nothing here is joined on a foreign
 * key in application code.
 */

export interface DetailWorkOrder {
  workOrderId: string;
  stationCode?: string;
  stationName?: string;
  status?: string;
  startedDate?: Date;
  completedDate?: Date;
  hoursBooked?: number;
  standardHours?: number;
}

export interface DetailShortage {
  shortageId: string;
  partNumber: string;
  partDescription?: string;
  criticality?: string;
  qtyShort?: number;
  expectedRecovery?: Date;
  daysToRecovery?: number;
  supplierName?: string;
  supplierOnTimeRate?: number;
  partLeadTimeDays?: number;
  blockedWorkOrderId?: string;
  stationName?: string;
  exposureUsd?: number;
}

export interface DetailNcr {
  ncrId: string;
  severity?: string;
  status?: string;
  description?: string;
  stationCode?: string;
  stationName?: string;
  openedDate?: Date;
  disposition?: string;
}

export interface AircraftDetail {
  serialNumber: string;
  program?: string;
  customer?: string;
  status?: string;
  stationCode?: string;
  stationName?: string;
  stationTaktDays?: number;
  stationAvgCycleDays?: number;
  buildStart?: Date;
  plannedDelivery?: Date;
  forecastDelivery?: Date;
  slipDays: number;
  isOverdue: boolean;
  daysPastForecast?: number;
  workOrders: DetailWorkOrder[];
  shortages: DetailShortage[];
  nonConformances: DetailNcr[];
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

async function fetchDetail(serialNumber: string): Promise<AircraftDetail> {
  await auth.signIn();

  const aircraft: Osdk.Instance<Aircraft> = await client(Aircraft).fetchOne(serialNumber);
  const asOf = new Date();

  // Aircraft -> station, workOrders, shortages, nonConformances
  const [station, workOrderPage, shortagePage, ncrPage] = await Promise.all([
    aircraft.$link.station.fetchOne().catch(() => undefined),
    aircraft.$link.workOrders.fetchPage({ $pageSize: 200 }),
    aircraft.$link.shortages.fetchPage({ $pageSize: 200 }),
    aircraft.$link.nonConformances.fetchPage({ $pageSize: 200 }),
  ]);

  // Each work order reaches its own station, so the row can name where the
  // work happened rather than just its code.
  const workOrders: DetailWorkOrder[] = await Promise.all(
    workOrderPage.data.map(async (w) => {
      const woStation = await w.$link.station.fetchOne().catch(() => undefined);
      return {
        workOrderId: w.workOrderId ?? "—",
        stationCode: w.stationCode ?? undefined,
        stationName: woStation?.stationName ?? undefined,
        status: w.status ?? undefined,
        startedDate: toDate(w.startedDate),
        completedDate: toDate(w.completedDate),
        hoursBooked: w.hoursBooked ?? undefined,
        standardHours: w.standardHours ?? undefined,
      };
    }),
  );
  workOrders.sort((a, b) => (a.stationCode ?? "").localeCompare(b.stationCode ?? ""));

  // Shortage -> part -> supplier. The two-hop walk is the whole argument for
  // the model: it turns "a part is missing" into "and here is who owes it".
  const shortages: DetailShortage[] = await Promise.all(
    shortagePage.data.map(async (s) => {
      const part = await s.$link.part.fetchOne().catch(() => undefined);
      const [supplier, shortageStation] = await Promise.all([
        part != null ? part.$link.supplier.fetchOne().catch(() => undefined) : undefined,
        s.$link.station.fetchOne().catch(() => undefined),
      ]);
      const recovery = toDate(s.expectedRecoveryDate);
      const qty = s.qtyShort ?? 0;

      return {
        shortageId: s.shortageId ?? "—",
        partNumber: s.partNumber ?? "—",
        partDescription: part?.description ?? undefined,
        criticality: s.criticality ?? part?.criticality ?? undefined,
        qtyShort: qty,
        expectedRecovery: recovery,
        daysToRecovery: recovery != null ? daysBetween(asOf, recovery) : undefined,
        supplierName: supplier?.supplierName ?? undefined,
        supplierOnTimeRate: supplier?.onTimeRate ?? undefined,
        partLeadTimeDays: part?.leadTimeDays ?? undefined,
        blockedWorkOrderId: s.workOrderId ?? undefined,
        stationName: shortageStation?.stationName ?? undefined,
        exposureUsd: qty * (part?.unitCostUsd ?? 0),
      };
    }),
  );

  const nonConformances: DetailNcr[] = await Promise.all(
    ncrPage.data.map(async (n) => {
      const ncrStation = await n.$link.station.fetchOne().catch(() => undefined);
      return {
        ncrId: n.ncrId ?? "—",
        severity: n.severity ?? undefined,
        status: n.status ?? undefined,
        description: n.description ?? undefined,
        stationCode: n.stationCode ?? undefined,
        stationName: ncrStation?.stationName ?? undefined,
        openedDate: toDate(n.openedDate),
        disposition: n.disposition ?? undefined,
      };
    }),
  );
  nonConformances.sort((a, b) => {
    const openFirst = Number(b.status === "Open") - Number(a.status === "Open");
    return openFirst !== 0 ? openFirst : (a.ncrId ?? "").localeCompare(b.ncrId ?? "");
  });

  const planned = toDate(aircraft.plannedDeliveryDate);
  const forecast = toDate(aircraft.forecastDeliveryDate);
  const slipDays = planned != null && forecast != null ? daysBetween(planned, forecast) : 0;
  const delivered = aircraft.status === "Delivered";
  const isOverdue = !delivered && forecast != null && forecast < asOf;

  return {
    serialNumber: aircraft.serialNumber ?? serialNumber,
    program: aircraft.program ?? undefined,
    customer: aircraft.customer ?? undefined,
    status: aircraft.status ?? undefined,
    stationCode: aircraft.currentStationCode ?? undefined,
    stationName: station?.stationName ?? undefined,
    stationTaktDays: station?.taktDays ?? undefined,
    stationAvgCycleDays: station?.avgCycleDays ?? undefined,
    buildStart: toDate(aircraft.buildStartDate),
    plannedDelivery: planned,
    forecastDelivery: forecast,
    slipDays,
    isOverdue,
    daysPastForecast: isOverdue && forecast != null ? daysBetween(forecast, asOf) : undefined,
    workOrders,
    shortages,
    nonConformances,
  };
}

export interface AircraftDetailState {
  data?: AircraftDetail;
  error?: string;
  loading: boolean;
  /** Re-read from the ontology. Called after an action is applied, so the
   *  screen shows what was actually stored rather than what we hoped was. */
  reload: () => void;
}

export function useAircraftDetail(serialNumber: string | undefined): AircraftDetailState {
  const [state, setState] = useState<Omit<AircraftDetailState, "reload">>({ loading: true });
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => {
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (serialNumber == null) {
      setState({ error: "No airframe specified.", loading: false });
      return;
    }

    let cancelled = false;
    // Keep the previous data on screen while refetching, so applying an action
    // does not blank the page the user is reading.
    setState((prev) => ({ ...prev, loading: prev.data == null }));

    fetchDetail(serialNumber)
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
  }, [serialNumber, nonce]);

  return { ...state, reload };
}
