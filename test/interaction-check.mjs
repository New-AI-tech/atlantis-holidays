import { launchChromium } from "./launch-browser.mjs";

const browser = await launchChromium();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto("http://localhost:8931/index.html");

// Theme toggle: keyboard-activatable real <button>, persists via localStorage
const toggle = page.locator("#themeToggle");
await toggle.focus();
await page.keyboard.press("Enter");
await page.waitForTimeout(350);
const isLight = await page.evaluate(() => document.body.classList.contains("light-mode"));
const ariaPressed = await toggle.getAttribute("aria-pressed");
console.log("theme toggled via keyboard Enter -> light-mode:", isLight, "aria-pressed:", ariaPressed);
await page.screenshot({ path: "/tmp/shots/after-desktop-1440-light.png", fullPage: true });

// Toggle back, then test the remove-guard shake + inline status (no alert())
await page.keyboard.press("Enter");
await page.waitForTimeout(350);

const removeBtn = page.locator(".hotel-row .btn-remove").first();
await removeBtn.click();
await page.waitForTimeout(150);
const rowStillThere = await page.locator(".hotel-row").count();
const statusText = await page.locator("#formStatus").textContent();
const statusVisible = await page.locator("#formStatus").evaluate(el => el.classList.contains("is-visible"));
console.log("hotel rows after blocked removal (should stay 1):", rowStillThere);
console.log("inline status shown instead of alert():", statusVisible, "->", statusText);

// Add-row animation + focus handoff
await page.click("text=+ Add Hotel");
await page.waitForTimeout(400);
const hotelRows = await page.locator(".hotel-row").count();
const focusedIsNewName = await page.evaluate(() => document.activeElement.classList.contains("name"));
console.log("hotel rows after add (should be 2):", hotelRows, "| focus moved to new name field:", focusedIsNewName);

await browser.close();
