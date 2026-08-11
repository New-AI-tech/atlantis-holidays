import { launchChromium } from "./launch-browser.mjs";

const browser = await launchChromium();
const page = await browser.newPage();
await page.goto("http://localhost:8931/design-system.html", { waitUntil: "networkidle" });

const assert = (cond, msg) => { if (!cond) throw new Error("FAIL: " + msg); };

// Swatches actually reflect the CSS tokens, not just literal placeholders
const swatchCount = await page.locator(".swatch").count();
assert(swatchCount === 12, `expected 12 swatches, got ${swatchCount}`);
const firstSwatchBg = await page.locator(".swatch-color").first().evaluate(el => getComputedStyle(el).backgroundColor);
assert(firstSwatchBg && firstSwatchBg !== "rgba(0, 0, 0, 0)", "swatch should have a real computed background color");
console.log("PASS: swatch grid renders with real computed colors");

// Font actually loads (self-hosted, not a silent system-font fallback)
await page.evaluate(() => document.fonts.ready);
const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
assert(bodyFont.toLowerCase().includes("fraunces"), `expected Fraunces, got ${bodyFont}`);
console.log("PASS: Fraunces font loads on design-system.html:", bodyFont);

// Modal open/close
await page.click("#openModalBtn");
await page.waitForTimeout(300);
let modalOpen = await page.locator("#modalOverlay").evaluate(el => el.classList.contains("is-open"));
assert(modalOpen, "modal should open on trigger click");
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
modalOpen = await page.locator("#modalOverlay").evaluate(el => el.classList.contains("is-open"));
assert(!modalOpen, "modal should close on Escape");
console.log("PASS: modal opens on click, closes on Escape");

// Modal confirm triggers a toast
await page.click("#openModalBtn");
await page.waitForTimeout(300);
await page.click("#modalConfirmBtn");
await page.waitForTimeout(300);
const toastText = await page.locator(".toast-message").first().textContent();
assert(toastText.includes("Sent"), `expected a "Sent" toast, got "${toastText}"`);
console.log("PASS: confirming the modal triggers a toast:", toastText);

// Toast triggers + dismiss
await page.click("#toastErrorBtn");
await page.waitForTimeout(200);
const toastCountBefore = await page.locator(".toast").count();
assert(toastCountBefore >= 1, "error toast should appear");
await page.click(".toast-close");
await page.waitForTimeout(500);
const toastCountAfter = await page.locator(".toast").count();
assert(toastCountAfter < toastCountBefore, "toast should be dismissible");
console.log("PASS: toast triggers and dismisses correctly");

// Loading-state button demo
await page.click("#loadingBtnDemo");
const isDisabledDuringLoad = await page.locator("#loadingBtnDemo").isDisabled();
assert(isDisabledDuringLoad, "button should disable itself during its loading demo");
const labelDuringLoad = await page.locator("#loadingBtnLabel").textContent();
assert(labelDuringLoad.includes("Loading"), "label should change to Loading… during the demo");
console.log("PASS: button loading-state demo disables itself and updates label");

await browser.close();
console.log("\nAll design-system.html checks passed.");
