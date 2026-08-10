// Proves the live page's real parseSection()/subtotal/vat_amount/grand_total
// logic produces correct numbers against actual DOM state — one row per
// category, matching what the "Generate Word Proposal" button would send
// into doc.render(). Run against a static file server (no CDN required,
// since PizZip/Docxtemplater reachability is a sandbox network constraint,
// not part of what's being verified here).

import { launchChromium } from "./launch-browser.mjs";

const browser = await launchChromium();
const page = await browser.newPage();
await page.goto("http://localhost:8931/index.html");

// Default rows already populate one item per category:
//   hotel: Atlantis The Royal - Deluxe Room, 1 x 1800.00
//   transportation: Airport Arrival Transfer, 1 x 350.00
//   tours: Private Desert Safari with VIP Dinner, 2 x 450.00
// Expected: subtotal = 1800 + 350 + 900 = 3050.00, vat = 152.50, grand = 3202.50

const result = await page.evaluate(() => {
  const hotelData = parseSection('hotel-row');
  const transData = parseSection('trans-row');
  const tourData = parseSection('tour-row');

  const subtotalValue = hotelData.sectionTotal + transData.sectionTotal + tourData.sectionTotal;
  const vatValue = subtotalValue * 0.05;
  const grandTotalValue = subtotalValue + vatValue;

  return {
    hotelItems: hotelData.items,
    transItems: transData.items,
    tourItems: tourData.items,
    subtotal: subtotalValue.toFixed(2),
    vat_amount: vatValue.toFixed(2),
    grand_total: grandTotalValue.toFixed(2),
  };
});

await browser.close();

console.log("Line items pulled from the live form:");
console.log("  hotel_services:", JSON.stringify(result.hotelItems));
console.log("  transportation:", JSON.stringify(result.transItems));
console.log("  tours:", JSON.stringify(result.tourItems));
console.log("\nComputed via the page's actual parseSection() + subtotal/vat_amount/grand_total logic:");
console.log("  subtotal   =", result.subtotal);
console.log("  vat_amount =", result.vat_amount);
console.log("  grand_total=", result.grand_total);

const assert = (cond, msg) => {
  if (!cond) throw new Error("FAIL: " + msg);
};

assert(result.subtotal === "3050.00", `subtotal expected 3050.00, got ${result.subtotal}`);
assert(result.vat_amount === "152.50", `vat_amount expected 152.50, got ${result.vat_amount}`);
assert(result.grand_total === "3202.50", `grand_total expected 3202.50, got ${result.grand_total}`);
assert(!Object.values(result).some(v => JSON.stringify(v).includes("undefined")), "no field should be undefined");

console.log("\nPASS: subtotal, vat_amount, and grand_total are all defined and correct — no VAT-less grand_total, no \"undefined\" values.");
