import {
  Aircraft,
  NonConformance,
  Part,
  Shortage,
  Station,
  Supplier,
  WorkOrder,
} from "@target-air/sdk";
import type { Osdk } from "@osdk/client";
import { useCallback, useEffect, useState } from "react";
import client, { signIn } from "@/client";

/**
 * Loads every object type this screen needs in one parallel round, then joins
 * them in memory.
 *
 * The ontology exposes direct links for all of this, but walking $link per row
 * costs a request per hop. At this cardinality (12 aircraft, 75 work orders,
 * 60 parts) it is cheaper and steadier to pull the sets once and join on the
 * foreign keys the links are built from. The links still matter: they are what
 * makes the join safe to write, because the ontology guarantees the keys line
 * up. Smoke.tsx exercises the traversal path directly.
 */

const DAY_MS = 86_400_000;

export type Delivery = "delivered" | "on-plan" | "late" | "overdue";

export interface AircraftRow {
  serialNumber: string;
  customer: string;
  status: string;
  stationCode?: string;
  stationName?: string;
  plannedDelivery?: Date;
  forecastDelivery?: Date;
  buildStart?: Date;
  slipDays: number;
  delivery: Delivery;
  blockedWorkOrders: number;
  openNcrs: number;
}

export interface StationRow {
  stationCode: string;
  stationName: string;
  sequence: number;
  taktDays: number;
  avgCycleDays: number;
  overTaktDays: number;
  openNcrs: number;
  openShortages: number;
  aircraftHere: string[];
}

export interface ShortageRow {
  shortageId: string;
  partNumber: string;
  partDescription: string;
  criticality: string;
  qtyShort: number;
  openedDate?: Date;
  expectedRecovery?: Date;
  daysToRecovery?: number;
  ageDays?: number;
  workOrderId: string;
  workOrderStatus?: string;
  serialNumber: string;
  stationCode: string;
  stationName?: string;
  supplierName?: string;
  supplierOnTimeRate?: number;
  partLeadTimeDays?: number;
  exposureUsd: number;
  slipDaysOnTail: number;
}

export interface SupplierRow {
  supplierId: string;
  supplierName: string;
  location: string;
  onTimeRate: number;
  avgLeadTimeDays: number;
  partCount: number;
  openShortages: number;
  criticalParts: number;
}

export interface Operations {
  asOf: Date;
  aircraft: AircraftRow[];
  stations: StationRow[];
  shortages: ShortageRow[];
  suppliers: SupplierRow[];
  totals: {
    inProgress: number;
    delivered: number;
    forecastLate: number;
    overdue: number;
    slipDays: number;
    blockedWorkOrders: number;
    openShortages: number;
    criticalShortages: number;
    openNcrs: number;
    criticalNcrs: number;
    shortageExposureUsd: number;
    taktDays: number;
    bottleneck?: StationRow;
  };
}

function toDate(value: string | undefined): Date | undefined {
  return value == null ? undefined : new Date(value);
}

/** Whole days between two instants, floored, ignoring time of day. */
function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.round((b - a) / DAY_MS);
}

async function fetchAll(): Promise<Operations> {
  await signIn();

  const [
    aircraftPage,
    stationPage,
    workOrderPage,
    shortagePage,
    partPage,
    supplierPage,
    ncrPage,
  ] = await Promise.all([
    client(Aircraft).fetchPage({ $pageSize: 500 }),
    client(Station).fetchPage({ $pageSize: 500 }),
    client(WorkOrder).fetchPage({ $pageSize: 1000 }),
    client(Shortage).fetchPage({ $pageSize: 500 }),
    client(Part).fetchPage({ $pageSize: 500 }),
    client(Supplier).fetchPage({ $pageSize: 500 }),
    client(NonConformance).fetchPage({ $pageSize: 500 }),
  ]);

  const asOf = new Date();

  const stationsRaw = stationPage.data;
  const partsRaw = partPage.data;
  const suppliersRaw = supplierPage.data;
  const workOrders = workOrderPage.data;
  const ncrs = ncrPage.data;

  const stationByCode = new Map<string, Osdk.Instance<Station>>(
    stationsRaw.flatMap((s) => (s.stationCode != null ? [[s.stationCode, s]] : [])),
  );
  const partByNumber = new Map<string, Osdk.Instance<Part>>(
    partsRaw.flatMap((p) => (p.partNumber != null ? [[p.partNumber, p]] : [])),
  );
  const supplierById = new Map<string, Osdk.Instance<Supplier>>(
    suppliersRaw.flatMap((s) => (s.supplierId != null ? [[s.supplierId, s]] : [])),
  );
  const workOrderById = new Map<string, Osdk.Instance<WorkOrder>>(
    workOrders.flatMap((w) => (w.workOrderId != null ? [[w.workOrderId, w]] : [])),
  );

  const openNcrs = ncrs.filter((n) => n.status === "Open");
  const blockedWorkOrders = workOrders.filter((w) => w.status === "Blocked");
  const openShortages = shortagePage.data.filter((s) => s.status === "Open");

  // ---- Aircraft -----------------------------------------------------------

  const aircraft: AircraftRow[] = aircraftPage.data
    .map((a): AircraftRow => {
      const planned = toDate(a.plannedDeliveryDate);
      const forecast = toDate(a.forecastDeliveryDate);
      const slipDays = planned != null && forecast != null ? daysBetween(planned, forecast) : 0;
      const isDelivered = a.status === "Delivered";

      let delivery: Delivery;
      if (isDelivered) {
        delivery = "delivered";
      } else if (forecast != null && forecast < asOf) {
        // Forecast date has passed and the tail has not been handed over. This
        // outranks schedule variance: the forecast itself is now stale.
        delivery = "overdue";
      } else if (slipDays > 0) {
        delivery = "late";
      } else {
        delivery = "on-plan";
      }

      const station = a.currentStationCode != null ? stationByCode.get(a.currentStationCode) : undefined;

      return {
        serialNumber: a.serialNumber ?? "—",
        customer: a.customer ?? "—",
        status: a.status ?? "—",
        stationCode: a.currentStationCode ?? undefined,
        stationName: station?.stationName ?? undefined,
        plannedDelivery: planned,
        forecastDelivery: forecast,
        buildStart: toDate(a.buildStartDate),
        slipDays,
        delivery,
        blockedWorkOrders: blockedWorkOrders.filter((w) => w.serialNumber === a.serialNumber).length,
        openNcrs: openNcrs.filter((n) => n.serialNumber === a.serialNumber).length,
      };
    })
    .sort((a, b) => {
      const at = a.plannedDelivery?.getTime() ?? 0;
      const bt = b.plannedDelivery?.getTime() ?? 0;
      return at - bt;
    });

  // ---- Stations -----------------------------------------------------------

  const stations: StationRow[] = stationsRaw
    .map((s): StationRow => {
      const takt = s.taktDays ?? 0;
      const cycle = s.avgCycleDays ?? 0;
      return {
        stationCode: s.stationCode ?? "—",
        stationName: s.stationName ?? "—",
        sequence: s.sequence ?? 0,
        taktDays: takt,
        avgCycleDays: cycle,
        overTaktDays: cycle - takt,
        openNcrs: openNcrs.filter((n) => n.stationCode === s.stationCode).length,
        openShortages: openShortages.filter((x) => x.stationCode === s.stationCode).length,
        aircraftHere: aircraft
          .filter((a) => a.stationCode === s.stationCode)
          .map((a) => a.serialNumber),
      };
    })
    .sort((a, b) => a.sequence - b.sequence);

  // ---- Shortages ----------------------------------------------------------
  // The join that justifies the ontology: a shortage reaches its part, then the
  // part's supplier, while the same shortage reaches the work order it blocks
  // and the tail that work order belongs to.

  const shortages: ShortageRow[] = openShortages
    .map((s): ShortageRow => {
      const part = s.partNumber != null ? partByNumber.get(s.partNumber) : undefined;
      const supplier = part?.supplierId != null ? supplierById.get(part.supplierId) : undefined;
      const workOrder = s.workOrderId != null ? workOrderById.get(s.workOrderId) : undefined;
      const tail = aircraft.find((a) => a.serialNumber === s.serialNumber);
      const recovery = toDate(s.expectedRecoveryDate);
      const opened = toDate(s.openedDate);
      const qty = s.qtyShort ?? 0;

      return {
        shortageId: s.shortageId ?? "—",
        partNumber: s.partNumber ?? "—",
        partDescription: part?.description ?? s.partNumber ?? "—",
        criticality: s.criticality ?? part?.criticality ?? "standard",
        qtyShort: qty,
        openedDate: opened,
        expectedRecovery: recovery,
        daysToRecovery: recovery != null ? daysBetween(asOf, recovery) : undefined,
        ageDays: opened != null ? daysBetween(opened, asOf) : undefined,
        workOrderId: s.workOrderId ?? "—",
        workOrderStatus: workOrder?.status ?? undefined,
        serialNumber: s.serialNumber ?? "—",
        stationCode: s.stationCode ?? "—",
        stationName: s.stationCode != null ? stationByCode.get(s.stationCode)?.stationName : undefined,
        supplierName: supplier?.supplierName ?? undefined,
        supplierOnTimeRate: supplier?.onTimeRate ?? undefined,
        partLeadTimeDays: part?.leadTimeDays ?? undefined,
        exposureUsd: qty * (part?.unitCostUsd ?? 0),
        slipDaysOnTail: tail?.slipDays ?? 0,
      };
    })
    .sort((a, b) => {
      // Critical first, then whichever recovers latest.
      const critical = Number(b.criticality === "critical") - Number(a.criticality === "critical");
      if (critical !== 0) {
        return critical;
      }
      return (b.daysToRecovery ?? 0) - (a.daysToRecovery ?? 0);
    });

  // ---- Suppliers ----------------------------------------------------------

  const suppliers: SupplierRow[] = suppliersRaw
    .map((s): SupplierRow => {
      const ownParts = partsRaw.filter((p) => p.supplierId === s.supplierId);
      const ownPartNumbers = new Set(ownParts.map((p) => p.partNumber));
      return {
        supplierId: s.supplierId ?? "—",
        supplierName: s.supplierName ?? "—",
        location: s.location ?? "—",
        onTimeRate: s.onTimeRate ?? 0,
        avgLeadTimeDays: s.avgLeadTimeDays ?? 0,
        partCount: ownParts.length,
        openShortages: openShortages.filter(
          (x) => x.partNumber != null && ownPartNumbers.has(x.partNumber),
        ).length,
        criticalParts: ownParts.filter((p) => p.criticality === "critical").length,
      };
    })
    .sort((a, b) => a.onTimeRate - b.onTimeRate);

  // ---- Totals -------------------------------------------------------------

  const bottleneck = [...stations].sort((a, b) => b.overTaktDays - a.overTaktDays)[0];

  return {
    asOf,
    aircraft,
    stations,
    shortages,
    suppliers,
    totals: {
      inProgress: aircraft.filter((a) => a.delivery !== "delivered").length,
      delivered: aircraft.filter((a) => a.delivery === "delivered").length,
      // Counted off the delivery status, which is mutually exclusive, so a tail
      // that is both slipped and past its forecast is not counted twice.
      forecastLate: aircraft.filter((a) => a.delivery === "late").length,
      overdue: aircraft.filter((a) => a.delivery === "overdue").length,
      slipDays: aircraft.reduce((sum, a) => sum + Math.max(0, a.slipDays), 0),
      blockedWorkOrders: blockedWorkOrders.length,
      openShortages: shortages.length,
      criticalShortages: shortages.filter((s) => s.criticality === "critical").length,
      openNcrs: openNcrs.length,
      criticalNcrs: openNcrs.filter((n) => n.severity === "Critical").length,
      shortageExposureUsd: shortages.reduce((sum, s) => sum + s.exposureUsd, 0),
      taktDays: stations[0]?.taktDays ?? 0,
      bottleneck: bottleneck != null && bottleneck.overTaktDays > 0 ? bottleneck : undefined,
    },
  };
}

export interface OperationsState {
  data?: Operations;
  error?: string;
  loading: boolean;
  /** Re-read from the ontology, so the screen shows what an action actually
   *  stored rather than what we hoped it stored. */
  reload: () => void;
}

export function useOperations(): OperationsState {
  const [state, setState] = useState<Omit<OperationsState, "reload">>({ loading: true });
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => {
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchAll()
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
  }, [nonce]);

  return { ...state, reload };
}
