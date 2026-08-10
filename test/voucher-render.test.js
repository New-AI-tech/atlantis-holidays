// Renders voucher_template.docx with sample data mirroring exactly what
// the Hotel Confirmation Voucher form's submit handler assembles, and
// checks the produced document.xml for the expected values with no
// "undefined" anywhere (the template has two placeholders for the same
// special-request text: {special_requests} and {special_request_note} —
// both must be supplied).

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");

const specialRequests = "High floor, honeymoon setup, late check-out if possible";

const dataContext = {
  hotel_name: "Atlantis The Royal, Dubai, UAE",
  hotel_address: "Al Sufouh Rd, Dubai Marina, Dubai, United Arab Emirates",
  guest_name: "Jane Smith",
  confirmation_number: "ATL-2026-00123",
  arrival_date: "November 1, 2026",
  departure_date: "November 4, 2026",
  duration_of_stay: "3 Nights",
  number_of_guests: "2 Adults",
  room_type: "Deluxe Ocean View Room",
  meal_plan: "Bed & Breakfast",
  checkin_time: "15:00",
  checkout_time: "12:00",
  special_requests: specialRequests,
  special_request_note: specialRequests,
};

console.log("Rendering voucher_template.docx with:");
console.log(JSON.stringify(dataContext, null, 2));

const templatePath = path.join(__dirname, "..", "voucher_template.docx");
const content = fs.readFileSync(templatePath, "binary");
const zip = new PizZip(content);
const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

doc.render(dataContext);

const outZip = doc.getZip();
const documentXml = outZip.file("word/document.xml").asText();
const plainText = documentXml
  .replace(/<[^>]+>/g, "")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'");

assert.ok(!/undefined/i.test(plainText), 'Rendered voucher must not contain the literal string "undefined"');

for (const value of Object.values(dataContext)) {
  // special_requests/special_request_note are duplicated with the same
  // value, so just confirm each distinct value appears at least once.
  assert.ok(plainText.includes(value), `expected value not found in rendered voucher: "${value}"`);
}

const outPath = path.join(__dirname, "voucher-output.docx");
fs.writeFileSync(outPath, outZip.generate({ type: "nodebuffer" }));

console.log("\nPASS: voucher_template.docx renders all fields correctly, no \"undefined\" anywhere.");
console.log("Rendered file written to:", outPath);
