// Renders voucher_template.docx with sample data mirroring exactly what
// the Hotel Confirmation Voucher form's Word-download handler assembles
// (buildVoucherData() + the dataContext mapping in index.html), and
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
  voucher_number: "AH-TR-270626",
  issue_date: "11 August 2026 (Tuesday)",
  status: "Confirmed",
  hotel_name: "Atlantis The Royal, Dubai, UAE",
  hotel_address: "Al Sufouh Rd, Dubai Marina, Dubai, United Arab Emirates",
  hotel_website: "atlantistheroyal.com",
  guest_name: "Jane Smith",
  reservation_numbers: "ATL-2026-00123, ATL-2026-00456, ATL-2026-00789",
  arrival_date: "27 June 2026 (Saturday)",
  departure_date: "30 June 2026 (Tuesday)",
  duration_of_stay: "3 Nights",
  number_of_guests: "2 Adults",
  room_type: "Deluxe Ocean View Room",
  room_description: "Spacious room with panoramic views and premium in-room amenities.",
  room_size: "40",
  bed_type: "King Bed",
  room_view: "Ocean View",
  floor: "High Floor",
  connecting_rooms: "Available",
  room_inclusions: "Complimentary WiFi, minibar (non-alcoholic), daily housekeeping.",
  meal_plan: "Bed & Breakfast",
  checkin_time: "15:00",
  checkout_time: "12:00",
  special_requests: specialRequests,
  special_request_note: specialRequests,
  cancellation_policy: "Free cancellation up to 7 days before arrival. Cancellations within 7 days of arrival are subject to a one-night charge.",
  important_info: "A valid passport/Emirates ID and the credit card used for booking are required at check-in.",
  no_show_policy: "No-shows will be charged the full stay value and the reservation will be released.",
  consultant_name: "Ahmed Backer",
  consultant_phone: "+971 4 000 0000",
  consultant_email: "reservations@atlantisholidays.com",
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

// Static Terms & Conditions section (not template data — same on every
// voucher). Checked here so an edit to the .docx that breaks this text
// is caught the same way a broken placeholder would be.
const termsAndConditions = [
  "Terms & Conditions",
  "Tourism Dirham:",
  "Applicable Tourism Dirham fees will be charged by the hotel as per prevailing UAE/DET regulations and payable by the guest at check-in.",
  "Security Deposit:",
  "Any refundable security deposit required by the hotel must be paid directly by the guest and will be released after check-out, subject to hotel policy.",
  "Hotel Extras:",
  "All personal expenses, including laundry, food & beverages, minibar, room service, spa/massage, delivery, and other additional services, are payable directly by the guest.",
  "Additional Charges:",
  "Any charges for damages, lost items, late check-out, early check-in, or services not included in the booking are payable by the guest.",
  "Hotel Policies:",
  "All guests are subject to the hotel's applicable check-in, check-out, identification, and other policies.",
];
for (const line of termsAndConditions) {
  assert.ok(plainText.includes(line), `Terms & Conditions text missing/altered in rendered voucher: "${line}"`);
}

const outPath = path.join(__dirname, "voucher-output.docx");
fs.writeFileSync(outPath, outZip.generate({ type: "nodebuffer" }));

console.log("\nPASS: voucher_template.docx renders all fields correctly, no \"undefined\" anywhere, and the Terms & Conditions section is intact.");
console.log("Rendered file written to:", outPath);
