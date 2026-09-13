import { Supplier } from "@target-air/sdk";
import type { Osdk } from "@osdk/client";
import { useCallback, useEffect, useState } from "react";
import client, { auth } from "@/client";

/**
 * One supplier, and everything downstream of it.
 *
 *   Supplier -> parts
 *   Supplier -> parts -> shortages         what they are currently holding up
 *   Supplier -> parts -> inventoryLots     what cover exists if they slip
 *   Supplier -> parts -> bomLines -> station   where a slip would land
 *
 * The last chain is the one worth having. It answers "if this supplier misses,
 * which station stops" without anyone having to know the answer in advance,
 * and it is three hops from an object that holds none of that information.
 */

export interface SupplierPart {
  partNumber: string;
  description?: string;
  criticality?: string;
  leadTimeDays?: number;
  unitCostUsd?: number;
  qtyOnHand: number;
  openShortages: number;
  stations: string[];
}

export interface SupplierShortage {
  shortageId: string;
  partNumber: string;
  partDescription?: string;
  criticality?: string;
  qtyShort?: number;
  serialNumber?: string;
  stationCode?: string;
  expectedRecovery?: Date;
}

export interface SupplierDetail {
  supplierId: string;
  supplierName: string;
  location?: string;
  onTimeRate: number;
  avgLeadTimeDays?: number;
  parts: SupplierPart[];
  shortages: SupplierShortage[];
  stationsExposed: string[];
  totalOnHand: number;
  criticalParts: number;
}

function toDate(value: string | undefined): Date | undefined {
  return value == null ? undefined : new Date(value);
}

async function fetchDetail(supplierId: string): Promise<SupplierDetail> {
  await auth.signIn();

  const supplier: Osdk.Instance<Supplier> = await client(Supplier).fetchOne(supplierId);
  const partPage = await supplier.$link.parts.fetchPage({ $pageSize: 500 });

  const shortages: SupplierShortage[] = [];
  const stationsExposed = new Set<string>();

  const parts: SupplierPart[] = await Promise.all(
    partPage.data.map(async (p) => {
      const [lotPage, shortagePage, bomPage] = await Promise.all([
        p.$link.inventoryLots.fetchPage({ $pageSize: 200 }),
        p.$link.shortages.fetchPage({ $pageSize: 200 }),
        p.$link.bomLines.fetchPage({ $pageSize: 200 }),
      ]);

      const stations = [
        ...new Set(bomPage.data.flatMap((b) => (b.stationCode != null ? [b.stationCode] : []))),
      ].sort();
      stations.forEach((s) => stationsExposed.add(s));

      for (const s of shortagePage.data) {
        if (s.status !== "Open") {
          continue;
        }
        shortages.push({
          shortageId: s.shortageId ?? "—",
          partNumber: s.partNumber ?? "—",
          partDescription: p.description ?? undefined,
          criticality: s.criticality ?? p.criticality ?? undefined,
          qtyShort: s.qtyShort ?? undefined,
          serialNumber: s.serialNumber ?? undefined,
          stationCode: s.stationCode ?? undefined,
          expectedRecovery: toDate(s.expectedRecoveryDate),
        });
      }

      return {
        partNumber: p.partNumber ?? "—",
        description: p.description ?? undefined,
        criticality: p.criticality ?? undefined,
        leadTimeDays: p.leadTimeDays ?? undefined,
        unitCostUsd: p.unitCostUsd ?? undefined,
        qtyOnHand: lotPage.data.reduce((sum, l) => sum + (l.qtyOnHand ?? 0), 0),
        openShortages: shortagePage.data.filter((s) => s.status === "Open").length,
        stations,
      };
    }),
  );

  parts.sort((a, b) => {
    // What a buyer would look at first: live shortages, then criticality,
    // then the longest lead, because that is the least recoverable.
    const short = b.openShortages - a.openShortages;
    if (short !== 0) {
      return short;
    }
    const crit = Number(b.criticality === "critical") - Number(a.criticality === "critical");
    return crit !== 0 ? crit : (b.leadTimeDays ?? 0) - (a.leadTimeDays ?? 0);
  });

  return {
    supplierId: supplier.supplierId ?? supplierId,
    supplierName: supplier.supplierName ?? supplierId,
    location: supplier.location ?? undefined,
    onTimeRate: supplier.onTimeRate ?? 0,
    avgLeadTimeDays: supplier.avgLeadTimeDays ?? undefined,
    parts,
    shortages,
    stationsExposed: [...stationsExposed].sort(),
    totalOnHand: parts.reduce((sum, p) => sum + p.qtyOnHand, 0),
    criticalParts: parts.filter((p) => p.criticality === "critical").length,
  };
}

export interface SupplierDetailState {
  data?: SupplierDetail;
  error?: string;
  loading: boolean;
  /** Re-read from the ontology, so the screen shows what an action actually
   *  stored rather than what we hoped it stored. */
  reload: () => void;
}

export function useSupplierDetail(supplierId: string | undefined): SupplierDetailState {
  const [state, setState] = useState<Omit<SupplierDetailState, "reload">>({ loading: true });
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => {
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (supplierId == null) {
      setState({ error: "No supplier specified.", loading: false });
      return;
    }

    let cancelled = false;
    // Keep previous data on screen while refetching so applying an action
    // does not blank the page the user is reading.
    setState((prev) => ({ ...prev, loading: prev.data == null }));

    fetchDetail(supplierId)
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
  }, [supplierId, nonce]);

  return { ...state, reload };
}
