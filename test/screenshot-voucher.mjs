import { launchChromium } from "./launch-browser.mjs";

const browser = await launchChromium();

const shots = [
  { tab: "proposal", width: 1440, theme: "dark" },
  { tab: "voucher", width: 1440, theme: "dark" },
  { tab: "voucher", width: 1440, theme: "light" },
  { tab: "voucher", width: 375, theme: "dark" },
];

for (const { tab, width, theme } of shots) {
  const page = await browser.newPage({ viewport: { width, height: 1400 } });
  await page.goto("http://localhost:8931/index.html", { waitUntil: "networkidle" });
  if (theme === "light") {
    await page.click("#themeToggle");
    await page.waitForTimeout(300);
  }
  if (tab === "voucher") {
    await page.click("#tab-voucher");
    await page.waitForTimeout(200);
  }
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `/tmp/shots3/${tab}-${width}-${theme}.png`, fullPage: true });
  await page.close();
  console.log(`saved ${tab}-${width}-${theme}.png`);
}

await browser.close();
