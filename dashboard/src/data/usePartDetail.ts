import { Part } from "@target-air/sdk";
import type { Osdk } from "@osdk/client";
import { useCallback, useEffect, useState } from "react";
import client, { auth } from "@/client";

/**
 * One part.
 *
 *   Part -> supplier
 *   Part -> inventoryLots          cover on hand, by location
 *   Part -> bomLines -> station    where it is consumed and how many per tail
 *   Part -> shortages              what it is currently holding up
 *
 * Demand per airframe comes from the bill of materials rather than from any
 * count of what has been ordered, which is the distinction between "we bought
 * forty" and "we need forty-eight".
 */

export interface PartLot {
  lotId: string;
  qtyOnHand?: number;
  location?: string;
  receivedDate?: Date;
}

export interface PartConsumption {
  bomLineId: string;
  stationCode?: string;
  stationName?: string;
  qtyPerAircraft?: number;
}

export interface PartShortage {
  shortageId: string;
  status?: string;
  criticality?: string;
  qtyShort?: number;
  serialNumber?: string;
  stationCode?: string;
  expectedRecovery?: Date;
}

export interface PartDetail {
  partNumber: string;
  description: string;
  criticality?: string;
  leadTimeDays?: number;
  unitCostUsd?: number;
  uom?: string;
  supplierId?: string;
  supplierName?: string;
  supplierOnTimeRate?: number;
  supplierLocation?: string;
  supplierLeadTimeDays?: number;
  lots: PartLot[];
  consumption: PartConsumption[];
  shortages: PartShortage[];
  qtyOnHand: number;
  qtyPerAircraft: number;
  airframesCovered?: number;
}

function toDate(value: string | undefined): Date | undefined {
  return value == null ? undefined : new Date(value);
}

async function fetchDetail(partNumber: string): Promise<PartDetail> {
  await auth.signIn();

  const part: Osdk.Instance<Part> = await client(Part).fetchOne(partNumber);

  const [supplier, lotPage, bomPage, shortagePage] = await Promise.all([
    part.$link.supplier.fetchOne().catch(() => undefined),
    part.$link.inventoryLots.fetchPage({ $pageSize: 200 }),
    part.$link.bomLines.fetchPage({ $pageSize: 200 }),
    part.$link.shortages.fetchPage({ $pageSize: 200 }),
  ]);

  const lots: PartLot[] = lotPage.data
    .map((l) => ({
      lotId: l.lotId ?? "—",
      qtyOnHand: l.qtyOnHand ?? undefined,
      location: l.location ?? undefined,
      receivedDate: toDate(l.receivedDate),
    }))
    .sort((a, b) => (b.qtyOnHand ?? 0) - (a.qtyOnHand ?? 0));

  const consumption: PartConsumption[] = await Promise.all(
    bomPage.data.map(async (b) => {
      const station = await b.$link.station.fetchOne().catch(() => undefined);
      return {
        bomLineId: b.bomLineId ?? "—",
        stationCode: b.stationCode ?? undefined,
        stationName: station?.stationName ?? undefined,
        qtyPerAircraft: b.qtyPerAircraft ?? undefined,
      };
    }),
  );

  const shortages: PartShortage[] = shortagePage.data
    .map((s) => ({
      shortageId: s.shortageId ?? "—",
      status: s.status ?? undefined,
      criticality: s.criticality ?? undefined,
      qtyShort: s.qtyShort ?? undefined,
      serialNumber: s.serialNumber ?? undefined,
      stationCode: s.stationCode ?? undefined,
      expectedRecovery: toDate(s.expectedRecoveryDate),
    }))
    .sort((a, b) => Number(b.status === "Open") - Number(a.status === "Open"));

  const qtyOnHand = lots.reduce((sum, l) => sum + (l.qtyOnHand ?? 0), 0);
  const qtyPerAircraft = consumption.reduce((sum, c) => sum + (c.qtyPerAircraft ?? 0), 0);

  return {
    partNumber: part.partNumber ?? partNumber,
    description: part.description ?? partNumber,
    criticality: part.criticality ?? undefined,
    leadTimeDays: part.leadTimeDays ?? undefined,
    unitCostUsd: part.unitCostUsd ?? undefined,
    uom: part.uom ?? undefined,
    supplierId: supplier?.supplierId ?? undefined,
    supplierName: supplier?.supplierName ?? undefined,
    supplierOnTimeRate: supplier?.onTimeRate ?? undefined,
    supplierLocation: supplier?.location ?? undefined,
    supplierLeadTimeDays: supplier?.avgLeadTimeDays ?? undefined,
    lots,
    consumption,
    shortages,
    qtyOnHand,
    qtyPerAircraft,
    // How many more airframes this stock covers. The number a planner wants,
    // and it only exists because the bill of materials is in the model.
    airframesCovered: qtyPerAircraft > 0 ? Math.floor(qtyOnHand / qtyPerAircraft) : undefined,
  };
}

export interface PartDetailState {
  data?: PartDetail;
  error?: string;
  loading: boolean;
  /** Re-read from the ontology, so the screen shows what an action actually
   *  stored rather than what we hoped it stored. */
  reload: () => void;
}

export function usePartDetail(partNumber: string | undefined): PartDetailState {
  const [state, setState] = useState<Omit<PartDetailState, "reload">>({ loading: true });
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => {
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (partNumber == null) {
      setState({ error: "No part specified.", loading: false });
      return;
    }

    let cancelled = false;
    // Keep previous data on screen while refetching so applying an action
    // does not blank the page the user is reading.
    setState((prev) => ({ ...prev, loading: prev.data == null }));

    fetchDetail(partNumber)
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
  }, [partNumber, nonce]);

  return { ...state, reload };
}
