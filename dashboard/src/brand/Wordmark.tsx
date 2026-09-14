import React from "react";
import css from "./Wordmark.module.css";

/**
 * The Target Air lockup — "Delta mark", option B from the identity study in
 * `wordmark.html`.
 *
 * The mark is a swept wing planform: geometric, reads as aircraft without
 * drawing one, and holds its shape at favicon size because it is four straight
 * lines. Drawn as a filled path rather than a stroked one, which is the right
 * call for a logo — a stroke changes optical weight as it scales, and several
 * rasterisers refuse to render stroked SVG at all.
 *
 * The wordmark sets TARGET in 300 against AIR in 600. The weight contrast is
 * what makes it a lockup rather than two words next to a triangle, so it is not
 * a detail to lose: keep both weights, keep the letter-spacing, and let size
 * vary through the `size` prop rather than by restyling it in place.
 */

export type WordmarkSize = "hero" | "nav" | "tiny";

const SIZE_CLASS: Record<WordmarkSize, string> = {
  hero: css.taLkHero,
  nav: css.taLkNav,
  tiny: css.taLkTiny,
};

interface Props {
  size?: WordmarkSize;
  /** Optional line beneath the lockup, e.g. "Program operations". */
  sub?: string;
  className?: string;
}

function Wordmark({ size = "nav", sub, className }: Props): React.ReactElement {
  const lockup = (
    <span className={[css.taLk, SIZE_CLASS[size], className ?? ""].join(" ")}>
      <svg className={css.taMk} viewBox="0 0 32 32" role="img" aria-label="Target Air">
        <title>Target Air</title>
        <path d="M16 2 L30 28 L16 20.5 L2 28 Z" fill="currentColor" />
      </svg>
      <span className={css.taWd} aria-hidden="true">
        <span className={css.taT1}>TARGET</span>
        <span className={css.taT2}>AIR</span>
      </span>
    </span>
  );

  if (sub == null) {
    return lockup;
  }

  return (
    <span className={css.taLkStack}>
      {lockup}
      <span className={css.taLkSub}>{sub}</span>
    </span>
  );
}

export default Wordmark;
