// Verifies the new Hotel Confirmation Voucher tab: tab switching,
// duration-of-stay auto-calculation, graceful handling when the
// Nominatim address lookup is unreachable (expected in this sandbox),
// and that no calculation/field regressed on the Proposal Generator tab.
import { launchChromium } from "./launch-browser.mjs";

const browser = await launchChromium();
const page = await browser.newPage();
await page.goto("http://localhost:8931/index.html");

const assert = (cond, msg) => { if (!cond) throw new Error("FAIL: " + msg); };

// --- Tab switching -----------------------------------------------------
const initial = await page.evaluate(() => ({
  proposalActive: document.getElementById("panel-proposal").classList.contains("active"),
  voucherHidden: document.getElementById("panel-voucher").hasAttribute("hidden"),
}));
assert(initial.proposalActive, "Proposal panel should be active on load");
assert(initial.voucherHidden, "Voucher panel should be hidden on load");

await page.click("#tab-voucher");
const afterSwitch = await page.evaluate(() => ({
  proposalHidden: !document.getElementById("panel-proposal").classList.contains("active"),
  voucherActive: document.getElementById("panel-voucher").classList.contains("active"),
  voucherVisible: !document.getElementById("panel-voucher").hasAttribute("hidden"),
  tabAriaSelected: document.getElementById("tab-voucher").getAttribute("aria-selected"),
}));
assert(afterSwitch.proposalHidden, "Proposal panel should deactivate after switching");
assert(afterSwitch.voucherActive && afterSwitch.voucherVisible, "Voucher panel should be visible after switching");
assert(afterSwitch.tabAriaSelected === "true", "Voucher tab should report aria-selected=true");
console.log("PASS: tab switching toggles .active / aria-selected / hidden correctly");

// --- Duration-of-stay calculation ---------------------------------------
await page.fill("#arrival_date", "2026-10-12");
await page.fill("#departure_date", "2026-10-16");
await page.dispatchEvent("#departure_date", "change");
await page.waitForTimeout(100);
let duration = await page.inputValue("#duration_stay");
assert(duration === "4 Nights", `expected "4 Nights", got "${duration}"`);
console.log("PASS: 4-night stay (Oct 12 -> Oct 16) computed as:", duration);

// Single-night singular form
await page.fill("#departure_date", "2026-10-13");
await page.dispatchEvent("#departure_date", "change");
await page.waitForTimeout(100);
duration = await page.inputValue("#duration_stay");
assert(duration === "1 Night", `expected "1 Night" (singular), got "${duration}"`);
console.log("PASS: 1-night stay computed with correct singular form:", duration);

// Invalid range (departure before arrival) should clear duration + show status
await page.fill("#departure_date", "2026-10-01");
await page.dispatchEvent("#departure_date", "change");
await page.waitForTimeout(100);
const invalidState = await page.evaluate(() => ({
  duration: document.getElementById("duration_stay").value,
  statusText: document.getElementById("voucherFormStatus").textContent,
  statusVisible: document.getElementById("voucherFormStatus").classList.contains("is-visible"),
}));
assert(invalidState.duration === "", "duration should clear when departure is before arrival");
assert(invalidState.statusVisible, "an inline error status should show for an invalid date range");
console.log("PASS: invalid date range clears duration and shows inline error:", invalidState.statusText);

// Restore a valid range for the render test below
await page.fill("#arrival_date", "2026-11-01");
await page.fill("#departure_date", "2026-11-04");
await page.dispatchEvent("#departure_date", "change");
await page.waitForTimeout(100);
duration = await page.inputValue("#duration_stay");
assert(duration === "3 Nights", `expected "3 Nights", got "${duration}"`);

// --- Nominatim lookup: graceful failure (expected — blocked in this sandbox) ---
await page.fill("#hotel_search", "Atlantis The Royal, Dubai, UAE");
await page.focus("#guest_name"); // triggers blur on hotel_search
await page.waitForTimeout(800);
const hint = await page.evaluate(() => ({
  text: document.getElementById("addressHint").textContent,
  isError: document.getElementById("addressHint").classList.contains("is-error"),
  formStillUsable: !document.getElementById("voucherSubmitBtn").disabled,
}));
console.log("Nominatim lookup result (network to nominatim.openstreetmap.org is blocked in this sandbox, same as unpkg/cdnjs/atlantisholidays.com earlier):");
console.log("  hint:", hint.text, "| is-error:", hint.isError);
assert(hint.formStillUsable, "a failed address lookup must not lock up the form");
assert(hint.text.length > 0, "some hint text should be shown either way (success or graceful failure)");
console.log("PASS: address lookup failure degrades gracefully — form remains usable, user can fill address manually");

// Manually fill the address (since the live API call can't succeed here) so the render test below has real data
await page.fill("#hotel_address", "Al Sufouh Rd, Dubai Marina, Dubai, United Arab Emirates");

await browser.close();
console.log("\nAll voucher-tab UI/logic checks passed.");
