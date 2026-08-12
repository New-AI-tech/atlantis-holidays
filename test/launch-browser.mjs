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
    return chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  }
}
