// Dev-only helper for the Playwright verification/screenshot scripts in this
// folder. Tries Playwright's normal browser resolution first; falls back to
// the pre-installed Chromium revision used by this sandbox environment
// (PLAYWRIGHT_BROWSERS_PATH), since the pinned playwright npm version here
// doesn't always match the installed browser revision exactly.
import { chromium } from "playwright";
import fs from "fs";

export async function launchChromium() {
  try {
    return await chromium.launch();
  } catch {
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
    const entry = fs.readdirSync(base).find(d => d.startsWith("chromium-"));
    if (!entry) throw new Error(`No fallback Chromium found under ${base}`);
    return chromium.launch({ executablePath: `${base}/${entry}/chrome-linux/chrome` });
  }
}
