import { launchChromium } from "./launch-browser.mjs";

const [, , url, outPrefix] = process.argv;
const widths = { mobile: 375, tablet: 768, desktop: 1440 };

const browser = await launchChromium();
for (const [label, width] of Object.entries(widths)) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(url, { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outPrefix}-${label}-${width}.png`, fullPage: true });
  await page.close();
  console.log(`saved ${outPrefix}-${label}-${width}.png`);
}
await browser.close();
