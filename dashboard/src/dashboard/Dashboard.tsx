import React from "react";
import { useNavigate } from "react-router-dom";
import { auth, clearOauthSession } from "@/client";
import Wordmark from "@/brand/Wordmark";
import { useOperations, type Operations } from "@/data/useOperations";
import css from "./Dashboard.module.css";
import DeliverySchedule from "./DeliverySchedule";
import QualityPanel from "./QualityPanel";
import ShortagePanel from "./ShortagePanel";
import StationTakt from "./StationTakt";
import SupplierPanel from "./SupplierPanel";
import { shortDateYear, usd } from "./format";

/**
 * Target Air Limited — program operations, executive view.
 *
 * Reading order is deliberate. The verdict states whether the program
 * delivers. The figure band quantifies it. The schedule shows which tails.
 * Everything below the schedule is cause: throughput, parts, suppliers,
 * quality. No number appears without something underneath it that explains it.
 */

function Verdict({ ops }: { ops: Operations }): React.ReactElement {
  const { totals } = ops;
  const atRisk = totals.forecastLate + totals.overdue;

  return (
    <section className={css.taVerdict}>
      <span className={css.taVerdictHead}>
        {atRisk === 0
          ? "Program is on plan."
          : `${atRisk} of ${totals.inProgress} tails in work are behind.`}
      </span>
      <span className={css.taVerdictBody}>
        {totals.overdue > 0
          ? `${totals.overdue} sit past their own forecast date and remain undelivered. `
          : ""}
        {totals.slipDays} days of schedule slip across the program, against{" "}
        {totals.blockedWorkOrders} work orders held by {totals.openShortages} open
        shortages worth {usd(totals.shortageExposureUsd)}.
        {totals.bottleneck != null
          ? ` ${totals.bottleneck.stationName} is the constraint at ${totals.bottleneck.avgCycleDays} days against ${totals.taktDays}.`
          : ""}
      </span>
    </section>
  );
}

function Figures({ ops }: { ops: Operations }): React.ReactElement {
  const { totals } = ops;

  const items = [
    {
      label: "Tails in work",
      value: String(totals.inProgress),
      tone: css.taToneNeutral,
      note: `${totals.delivered} delivered this program`,
    },
    {
      label: "Behind schedule",
      value: String(totals.forecastLate + totals.overdue),
      tone: totals.forecastLate + totals.overdue > 0 ? css.taToneBad : css.taToneGood,
      note:
        totals.overdue > 0
          ? `${totals.overdue} past forecast and undelivered`
          : "forecast later than plan",
    },
    {
      label: "Schedule slip",
      value: String(totals.slipDays),
      unit: "days",
      tone: totals.slipDays > 0 ? css.taToneBad : css.taToneGood,
      note: "forecast against plan, all tails",
    },
    {
      label: "Work orders held",
      value: String(totals.blockedWorkOrders),
      tone: totals.blockedWorkOrders > 0 ? css.taToneWarn : css.taToneGood,
      note: `${totals.openShortages} open shortages, ${totals.criticalShortages} critical`,
    },
    {
      label: "Open rework",
      value: String(totals.openNcrs),
      tone: totals.criticalNcrs > 0 ? css.taToneWarn : css.taToneNeutral,
      note: `${totals.criticalNcrs} critical non-conformance${totals.criticalNcrs === 1 ? "" : "s"}`,
    },
  ];

  return (
    <div className={css.taFigures}>
      {items.map((item) => (
        <div className={css.taFigure} key={item.label}>
          <span className={css.taFigureLabel}>{item.label}</span>
          <span className={[css.taFigureValue, item.tone].join(" ")}>
            {item.value}
            {item.unit != null ? <span className={css.taFigureUnit}>{item.unit}</span> : null}
          </span>
          <span className={css.taFigureNote}>{item.note}</span>
        </div>
      ))}
    </div>
  );
}

function Dashboard(): React.ReactElement {
  const { data, error, loading, reload } = useOperations();
  const navigate = useNavigate();

  // signOut() clears the stored token, but the app keeps whatever it already
  // fetched in memory until the page is torn down. Navigating is not enough —
  // React Router would preserve component state and leave program data on a
  // screen the user believes they have left. A full reload is the honest exit.
  //
  // It clears localStorage and leaves sessionStorage alone, so without
  // clearOauthSession() the next sign-in attempt in this tab fails on a stale
  // codeVerifier instead of redirecting.
  async function handleSignOut(): Promise<void> {
    await auth.signOut().catch(() => undefined);
    clearOauthSession();
    navigate("/", { replace: true });
    window.location.reload();
  }

  if (loading) {
    return <div className={css.taCenter}>Signing in and querying the ontology…</div>;
  }

  if (error != null || data == null) {
    return (
      <div className={css.taCenter}>
        <div className={css.taErrorBox}>{error ?? "No data returned."}</div>
      </div>
    );
  }

  return (
    <div className={css.taShell}>
      <div className={css.taInner}>
        <header className={css.taMasthead}>
          <div className={css.taBrand}>
            <Wordmark size="nav" sub="Program operations" />
          </div>

          <div className={css.taMastheadMeta}>
            <span className={css.taMetaItem}>
              <span className={css.taMetaLabel}>Program</span>
              <span className={css.taMetaValue}>TA-7</span>
            </span>
            <span className={css.taMetaItem}>
              <span className={css.taMetaLabel}>As at</span>
              <span className={css.taMetaValue}>{shortDateYear(data.asOf)}</span>
            </span>
            <button type="button" className={css.taSignOut} onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </header>

        <Verdict ops={data} />
        <Figures ops={data} />
        <DeliverySchedule ops={data} />

        <div className={css.taSplitWide}>
          <StationTakt ops={data} />
          <ShortagePanel ops={data} onApplied={reload} />
        </div>

        <div className={css.taSplit}>
          <SupplierPanel ops={data} />
          <QualityPanel ops={data} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
