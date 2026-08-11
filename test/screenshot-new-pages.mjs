import { launchChromium } from "./launch-browser.mjs";

const browser = await launchChromium();

const shots = [
  { url: "design-system.html", width: 1440, theme: "dark" },
  { url: "design-system.html", width: 1440, theme: "light" },
  { url: "design-system.html", width: 768, theme: "dark" },
  { url: "design-system.html", width: 375, theme: "dark" },
  { url: "admin-dashboard.html", width: 1440, theme: "dark" },
  { url: "admin-dashboard.html", width: 1440, theme: "light" },
  { url: "admin-dashboard.html", width: 768, theme: "dark" },
  { url: "admin-dashboard.html", width: 375, theme: "dark" },
];

for (const { url, width, theme } of shots) {
  const page = await browser.newPage({ viewport: { width, height: 1200 } });
  await page.goto(`http://localhost:8931/${url}`);
  await page.evaluate(() => localStorage.removeItem("atlantis-proposal-board"));
  if (theme === "light") {
    await page.evaluate(() => localStorage.setItem("atlantis-theme", "light"));
  }
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.evaluate(() => document.fonts.ready);
  const name = url.replace(".html", "");
  await page.screenshot({ path: `/tmp/shots4/${name}-${width}-${theme}.png`, fullPage: true });
  await page.close();
  console.log(`saved ${name}-${width}-${theme}.png`);
}

await browser.close();
