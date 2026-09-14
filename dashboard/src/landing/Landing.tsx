import React from "react";
import { Link } from "react-router-dom";
import Wordmark from "@/brand/Wordmark";
import css from "./Landing.module.css";

/**
 * Sign-in screen.
 *
 * Every other route calls `auth.signIn()` on mount, so opening the site used to
 * bounce straight to Foundry's login with no context at all. This page touches
 * no data and triggers no authentication: it is the front door, and signing in
 * is a deliberate act.
 *
 * Written in-world. The reader is an executive at Target Air Limited arriving
 * to see where the program stands, not someone evaluating a piece of software.
 * So it orients them and gets out of the way — one action, no marketing.
 */

const INSIDE = [
  { label: "Delivery position", note: "Planned against forecast, every tail" },
  { label: "Line constraint", note: "Station cycle time against takt" },
  { label: "Supply chain", note: "Open shortages and supplier exposure" },
  { label: "Quality", note: "Non-conformances by station" },
];

function Mark({ className }: { className: string }): React.ReactElement {
  return (
    <svg className={className} viewBox="0 0 32 32" role="img" aria-label="Target Air">
      <title>Target Air</title>
      <path d="M16 2 L30 28 L16 20.5 L2 28 Z" fill="currentColor" />
    </svg>
  );
}

function Landing(): React.ReactElement {
  return (
    <div className={css.taSignInShell}>
      {/* Oversized mark, bled off the edge. Atmosphere rather than decoration:
          it is the same shape as the favicon and the masthead, at a size that
          reads as a surface treatment. */}
      <Mark className={css.taWatermark} />

      <div className={css.taSignInGrid}>
        <section className={css.taSignInBrandPane}>
          <div className={css.taSignInLockup}>
            <Wordmark size="hero" sub="Limited" />
          </div>

          <h1 className={css.taSignInTitle}>Program Operations</h1>
          <p className={css.taSignInLede}>
            Where the TA-7 program stands today: which airframes are behind, what is holding the
            line, and what it costs the delivery schedule.
          </p>

          <ul className={css.taInsideList}>
            {INSIDE.map((item) => (
              <li className={css.taInsideItem} key={item.label}>
                <span className={css.taInsideLabel}>{item.label}</span>
                <span className={css.taInsideNote}>{item.note}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={css.taSignInCardPane}>
          <div className={css.taSignInCard}>
            <span className={css.taSignInEyebrow}>Restricted system</span>
            <h2 className={css.taSignInCardTitle}>Sign in to continue</h2>
            <p className={css.taSignInCardBody}>
              Access is governed by your Palantir Foundry account. You will be returned here once
              authentication completes.
            </p>

            <Link className={css.taSignInButton} to="/dashboard">
              Sign in with Palantir Foundry
            </Link>

            <p className={css.taSignInNotice}>
              Authorized personnel only. Program schedule and supplier data are commercially
              sensitive. Activity is attributed to your account.
            </p>
          </div>

          <p className={css.taSignInHelp}>
            No access? Contact your program administrator.
          </p>
        </section>
      </div>

      <footer className={css.taSignInFooter}>
        <span>TA-7 Program · Target Air Limited</span>
        <span className={css.taSignInCredit}>
          Built by{" "}
          <a
            className={css.taSignInColophon}
            href="https://github.com/silverfoxmediaco/targetair-foundry"
            target="_blank"
            rel="noreferrer"
          >
            James McEwen
          </a>{" "}
          · Silver Fox Media · on Palantir Foundry
        </span>
      </footer>
    </div>
  );
}

export default Landing;
