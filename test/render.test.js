// Standalone test proving the subtotal/vat_amount/grand_total fix in index.html.
// Mirrors the exact calculation logic from the submit handler (parseSection +
// subtotal/vat_amount/grand_total derivation), then renders template.docx and
// inspects the produced document.xml to confirm the correct numbers appear.

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");

// Same per-item calculation as parseSection() in index.html.
function buildSectionItems(rawItems) {
  let sectionTotal = 0;
  const items = rawItems.map(({ name, quantity, unit, rate }) => {
    const total = quantity * rate;
    sectionTotal += total;
    return {
      name,
      quantity,
      unit,
      rate: rate.toLocaleString("en-US", { minimumFractionDigits: 2 }),
      total: total.toLocaleString("en-US", { minimumFractionDigits: 2 }),
    };
  });
  return { items, sectionTotal };
}

const hotelData = buildSectionItems([
  { name: "Atlantis The Royal - Deluxe Room", quantity: 1, unit: "Nights", rate: 1800.0 },
]);
const transData = buildSectionItems([
  { name: "Airport Arrival Transfer (Luxury Sedan)", quantity: 1, unit: "Vehicle", rate: 350.0 },
]);
const tourData = buildSectionItems([
  { name: "Private Desert Safari with VIP Dinner", quantity: 2, unit: "Guests", rate: 450.0 },
  { name: "Burj Khalifa Ticket", quantity: 1, unit: "Ticket", rate: 250.0 },
]);

// Same subtotal/vat_amount/grand_total derivation as the fixed submit handler.
const subtotalValue = hotelData.sectionTotal + transData.sectionTotal + tourData.sectionTotal;
const vatValue = subtotalValue * 0.05;
const grandTotalValue = subtotalValue + vatValue;

const dataContext = {
  event_name: "Atlantis EADV Congress 2026",
  event_dates: "October 12 - October 16, 2026",
  hotel_services: hotelData.items,
  transportation: transData.items,
  tours: tourData.items,
  subtotal: subtotalValue.toFixed(2),
  vat_amount: vatValue.toFixed(2),
  grand_total: grandTotalValue.toFixed(2),
};

console.log("Computed dataContext values:");
console.log("  subtotal   =", dataContext.subtotal);
console.log("  vat_amount =", dataContext.vat_amount);
console.log("  grand_total=", dataContext.grand_total);

const templatePath = path.join(__dirname, "..", "template.docx");
const content = fs.readFileSync(templatePath, "binary");
const zip = new PizZip(content);
const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

doc.render(dataContext);

const outZip = doc.getZip();
const documentXml = outZip.file("word/document.xml").asText();
const plainText = documentXml.replace(/<[^>]+>/g, "");

assert.ok(!/undefined/i.test(plainText), 'Rendered document must not contain the literal string "undefined"');
assert.ok(plainText.includes("3300.00"), "subtotal 3300.00 not found in rendered document");
assert.ok(plainText.includes("165.00"), "vat_amount 165.00 not found in rendered document");
assert.ok(plainText.includes("3465.00"), "grand_total 3465.00 not found in rendered document");

assert.strictEqual(dataContext.subtotal, "3300.00");
assert.strictEqual(dataContext.vat_amount, "165.00");
assert.strictEqual(dataContext.grand_total, "3465.00");

const outPath = path.join(__dirname, "output.docx");
fs.writeFileSync(outPath, outZip.generate({ type: "nodebuffer" }));

console.log("\nPASS: subtotal, vat_amount, and grand_total all render correctly.");
console.log("Rendered file written to:", outPath);
