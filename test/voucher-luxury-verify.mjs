// Verifies the extended Hotel Confirmation Voucher tab: voucher-number
// auto-generation, date formatting, dynamic reservation numbers,
// hotel image preview, the preview modal, and the PDF export producing
// a real PDF (the self-hosted html2pdf path, proven to work in this
// sandbox independent of any blocked CDN).
import { launchChromium } from "./launch-browser.mjs";

const browser = await launchChromium();
const page = await browser.newPage();
await page.goto("http://localhost:8931/index.html");
await page.click("#tab-voucher");

const assert = (cond, msg) => { if (!cond) throw new Error("FAIL: " + msg); };

// --- Voucher number auto-generation ---
const initialVoucherNumber = await page.inputValue("#voucher_number");
assert(/^AH-TR-\d{6}$/.test(initialVoucherNumber), `expected AH-TR-DDMMYY format for "Atlantis The Royal", got "${initialVoucherNumber}"`);
console.log("PASS: voucher number auto-generated from known hotel code:", initialVoucherNumber);

await page.fill("#arrival_date", "2026-06-27");
await page.dispatchEvent("#arrival_date", "change");
await page.waitForTimeout(100);
const voucherNumberAfterDate = await page.inputValue("#voucher_number");
assert(voucherNumberAfterDate === "AH-TR-270626", `expected AH-TR-270626, got "${voucherNumberAfterDate}"`);
console.log("PASS: voucher number date-code updates with arrival date:", voucherNumberAfterDate);

// Unknown hotel -> falls back to initials
await page.fill("#hotel_search", "Beachfront Grand Resort");
await page.dispatchEvent("#hotel_search", "input");
await page.waitForTimeout(100);
const fallbackVoucherNumber = await page.inputValue("#voucher_number");
assert(fallbackVoucherNumber === "AH-BGR-270626", `expected AH-BGR-270626 fallback initials, got "${fallbackVoucherNumber}"`);
console.log("PASS: unrecognized hotel falls back to derived initials:", fallbackVoucherNumber);
await page.fill("#hotel_search", "Atlantis The Royal, Dubai, UAE");

// --- Issue date formatted "DD Month YYYY (DayOfWeek)" ---
const issueDate = await page.inputValue("#issue_date");
assert(/^\d{2} \w+ \d{4} \(\w+\)$/.test(issueDate), `expected "DD Month YYYY (Weekday)" format, got "${issueDate}"`);
console.log("PASS: issue date auto-set in the required format:", issueDate);

// --- Dynamic reservation numbers ---
let reservationCount = await page.locator(".reservation-row").count();
assert(reservationCount === 1, `expected 1 seeded reservation row, got ${reservationCount}`);
await page.click("#addReservationBtn");
await page.click("#addReservationBtn");
reservationCount = await page.locator(".reservation-row").count();
assert(reservationCount === 3, `expected 3 reservation rows after adding 2, got ${reservationCount}`);
const reservationInputs = page.locator(".reservation-number");
await reservationInputs.nth(1).fill("ATL-2026-00456");
await reservationInputs.nth(2).fill("ATL-2026-00789");
console.log("PASS: reservation numbers list grows dynamically (3 rows)");

// --- Fill required fields for a full generation ---
await page.fill("#guest_name", "Jane Smith");
await page.fill("#departure_date", "2026-06-30");
await page.dispatchEvent("#departure_date", "change");
await page.waitForTimeout(100);
const duration = await page.inputValue("#duration_stay");
assert(duration === "3 Nights", `expected 3 Nights, got "${duration}"`);

await page.fill("#hotel_image_url", "https://example.com/hotel.jpg");
await page.dispatchEvent("#hotel_image_url", "input");
await page.waitForTimeout(100);
const previewHidden = await page.locator("#hotelImagePreview").isHidden();
assert(!previewHidden, "hotel image preview should become visible once a URL is entered");
console.log("PASS: hotel image preview shows once an image URL is entered");

// --- Preview modal renders the live data into the iframe ---
await page.click("#voucherPreviewBtn");
await page.waitForTimeout(300);
const modalOpen = await page.locator("#voucherPreviewOverlay").evaluate(el => el.classList.contains("is-open"));
assert(modalOpen, "preview modal should open");

const frame = page.frameLocator("#voucherPreviewFrame");
const frameText = await frame.locator(".voucher-page").innerText();
assert(frameText.includes("Jane Smith"), "preview should show the guest name");
assert(frameText.includes("AH-TR-270626"), "preview should show the generated voucher number");
assert(frameText.includes("ATL-2026-00456") && frameText.includes("ATL-2026-00789"), "preview should show all reservation numbers");
assert(frameText.includes("3 Nights"), "preview should show computed duration");

// Dynamic reservation columns: 3 numbers -> 3-column grid
const reservationGridColumns = await frame.locator(".v-reservation-table").evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length);
assert(reservationGridColumns === 3, `expected 3 grid columns for 3 reservation numbers, got ${reservationGridColumns}`);
console.log("PASS: preview iframe renders live data, including 3 dynamic reservation-number columns");

await page.keyboard.press("Escape");
await page.waitForTimeout(300);
const modalClosedAfterEscape = await page.locator("#voucherPreviewOverlay").evaluate(el => !el.classList.contains("is-open"));
assert(modalClosedAfterEscape, "Escape should close the preview modal");
console.log("PASS: Escape closes the preview modal");

// --- PDF export produces a real, non-trivial PDF download ---
const downloadPromise = page.waitForEvent("download", { timeout: 20000 });
await page.click("#voucherPdfBtn");
const download = await downloadPromise;
const pdfPath = "/tmp/voucher-luxury-test-output.pdf";
await download.saveAs(pdfPath);

const fs = await import("fs");
const stats = fs.statSync(pdfPath);
assert(stats.size > 5000, `expected a substantial PDF file, got ${stats.size} bytes`);
const header = fs.readFileSync(pdfPath).subarray(0, 5).toString();
assert(header === "%PDF-", `expected a real PDF file header, got "${header}"`);
console.log(`PASS: Download PDF produced a real ${stats.size}-byte PDF file (${download.suggestedFilename()})`);

await browser.close();
console.log("\nAll luxury voucher checks passed.");
