/**
 * Render the social share card to PNG at exactly 1280x640.
 *
 *   npx playwright@latest install chromium   # once
 *   node brand/render-og.mjs
 *
 * The card is HTML rather than a drawing so it uses the real brand fonts and
 * the real mark geometry, and so a copy change is an edit rather than a
 * redesign. Never hand-edit the PNG.
 *
 * 1280x640 is the size GitHub, LinkedIn, Slack and iMessage all render well.
 * deviceScaleFactor 2 gives a 2560x1280 file that stays sharp on retina
 * without exceeding anyone's size limit.
 */

import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, "og-card.html");
const out = resolve(here, "og-card.png");

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 640 },
  deviceScaleFactor: 2,
});

await page.goto(`file://${source}`);
// Fonts load from disk via @font-face; without waiting, the card can render in
// a fallback face and the wordmark's weight contrast silently disappears.
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);

await page.screenshot({ path: out });
await browser.close();

console.log(`wrote ${out}`);
