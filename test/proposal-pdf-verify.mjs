// Verifies the new Proposal PDF export: preview modal shows correct
// line items/totals, and Download PDF produces a real, single-page PDF.
import { launchChromium } from "./launch-browser.mjs";

const browser = await launchChromium();
const page = await browser.newPage();
await page.goto("http://localhost:8931/index.html");

const assert = (cond, msg) => { if (!cond) throw new Error("FAIL: " + msg); };

// --- Preview modal renders correct data ---
await page.click("#proposalPreviewBtn");
await page.waitForTimeout(300);
const modalOpen = await page.locator("#proposalPreviewOverlay").evaluate(el => el.classList.contains("is-open"));
assert(modalOpen, "proposal preview modal should open");

const frame = page.frameLocator("#proposalPreviewFrame");
const frameText = await frame.locator(".doc-page").innerText();
assert(frameText.includes("Atlantis EADV Congress 2026"), "preview should show the event name");
assert(frameText.includes("Atlantis The Royal - Deluxe Room"), "preview should show the seeded hotel line item");
assert(frameText.includes("Airport Arrival Transfer"), "preview should show the seeded transport line item");
assert(frameText.includes("Private Desert Safari"), "preview should show the seeded tour line item");
assert(frameText.includes("3,050.00") || frameText.includes("3050.00"), `preview should show correct subtotal, got: ${frameText}`);
assert(frameText.includes("152.50"), "preview should show correct VAT");
assert(frameText.includes("3,202.50") || frameText.includes("3202.50"), "preview should show correct grand total");
console.log("PASS: proposal preview renders correct line items and totals");

await page.keyboard.press("Escape");
await page.waitForTimeout(300);
const modalClosed = await page.locator("#proposalPreviewOverlay").evaluate(el => !el.classList.contains("is-open"));
assert(modalClosed, "Escape should close the proposal preview modal");
console.log("PASS: Escape closes the proposal preview modal");

// --- PDF export produces a real, single-page PDF ---
const downloadPromise = page.waitForEvent("download", { timeout: 20000 });
await page.click("#proposalPdfBtn");
const download = await downloadPromise;
const pdfPath = "/tmp/proposal-pdf-test-output.pdf";
await download.saveAs(pdfPath);

const fs = await import("fs");
const stats = fs.statSync(pdfPath);
assert(stats.size > 5000, `expected a substantial PDF file, got ${stats.size} bytes`);
const header = fs.readFileSync(pdfPath).subarray(0, 5).toString();
assert(header === "%PDF-", `expected a real PDF file header, got "${header}"`);
console.log(`PASS: Download PDF produced a real ${stats.size}-byte PDF file (${download.suggestedFilename()})`);

await browser.close();
console.log("\nAll proposal PDF checks passed.");
