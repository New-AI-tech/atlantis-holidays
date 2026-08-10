import { launchChromium } from "./launch-browser.mjs";

const [, , url, outPrefix] = process.argv;
const widths = { mobile: 375, tablet: 768, desktop: 1440 };

const browser = await launchChromium();
for (const [label, width] of Object.entries(widths)) {
  for (const theme of ["dark", "light"]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    await page.goto(url, { waitUntil: "networkidle" }).catch(() => {});
    if (theme === "light") {
      await page.click("#themeToggle");
      await page.waitForTimeout(350);
    }
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${outPrefix}-${label}-${width}-${theme}.png`, fullPage: true });
    await page.close();
    console.log(`saved ${outPrefix}-${label}-${width}-${theme}.png`);
  }
}
await browser.close();
