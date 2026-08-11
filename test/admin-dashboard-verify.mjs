import { launchChromium } from "./launch-browser.mjs";

const browser = await launchChromium();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

// Fresh state every run
await page.goto("http://localhost:8931/admin-dashboard.html");
await page.evaluate(() => localStorage.removeItem("atlantis-proposal-board"));
await page.reload({ waitUntil: "networkidle" });

const assert = (cond, msg) => { if (!cond) throw new Error("FAIL: " + msg); };

// --- Loading skeleton appears before the real board ---
const sawSkeleton = await page.locator(".skeleton").count();
assert(sawSkeleton > 0, "skeleton cards should be present immediately on load");
console.log("PASS: loading skeleton renders before real data (found", sawSkeleton, "skeleton elements)");

await page.waitForTimeout(900); // wait past the simulated 550ms load

const draftCountBefore = await page.locator('.kanban-card-list[data-column="draft"] .proposal-card').count();
const sentCountBefore = await page.locator('.kanban-card-list[data-column="sent"] .proposal-card').count();
assert(draftCountBefore === 2, `expected 2 draft cards, got ${draftCountBefore}`);
assert(sentCountBefore === 2, `expected 2 sent cards, got ${sentCountBefore}`);
console.log("PASS: seeded board renders correct per-column counts (draft=2, sent=2)");

// --- VIP badge renders on flagged cards ---
const vipBadgeCount = await page.locator(".badge-gold").count();
assert(vipBadgeCount === 3, `expected 3 VIP badges, got ${vipBadgeCount}`);
console.log("PASS: VIP gold badges render on the 3 flagged proposals");

// --- Total value calculation ---
const totalText = await page.locator("#dashTotal").textContent();
console.log("Total summary text:", totalText.trim());
assert(/8 proposals/.test(totalText), "total should report 8 proposals");

// --- Drag a card from Draft to Accepted via pointer events ---
const card = page.locator('.kanban-card-list[data-column="draft"] .proposal-card').first();
const cardTitle = await card.locator(".proposal-card-title").textContent();
const cardBox = await card.boundingBox();
const targetColumn = page.locator('.kanban-column[data-column="accepted"] .kanban-card-list');
const targetBox = await targetColumn.boundingBox();

await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
await page.mouse.down();
// Move in a few steps past the drag threshold so the drag actually initiates
await page.mouse.move(cardBox.x + cardBox.width / 2 + 20, cardBox.y + cardBox.height / 2 + 10, { steps: 5 });
await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 30, { steps: 10 });
await page.waitForTimeout(100);

const dragOverActive = await page.locator('.kanban-column[data-column="accepted"]').evaluate(el => el.classList.contains("is-drag-over"));
assert(dragOverActive, "target column should show is-drag-over highlight while dragging over it");
console.log("PASS: drop-target column highlights while a card is dragged over it");

await page.mouse.up();
await page.waitForTimeout(300);

const draftCountAfter = await page.locator('.kanban-card-list[data-column="draft"] .proposal-card').count();
const acceptedCountAfter = await page.locator('.kanban-card-list[data-column="accepted"] .proposal-card').count();
assert(draftCountAfter === draftCountBefore - 1, `expected draft count to drop by 1, got ${draftCountAfter}`);
assert(acceptedCountAfter === 3, `expected accepted count to be 3, got ${acceptedCountAfter}`);
console.log(`PASS: card "${cardTitle.trim()}" moved from Draft to Accepted (draft ${draftCountBefore}->${draftCountAfter}, accepted 2->${acceptedCountAfter})`);

// --- Toast fired on the status change ---
const toastMsg = await page.locator(".toast-message").first().textContent();
assert(toastMsg.includes("Accepted"), `expected a move-to-Accepted toast, got "${toastMsg}"`);
console.log("PASS: status-change toast fired:", toastMsg.trim());

// --- Persistence: reload and confirm the move stuck ---
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(900);
const acceptedAfterReload = await page.locator('.kanban-card-list[data-column="accepted"] .proposal-card').count();
assert(acceptedAfterReload === 3, `expected the move to persist across reload, got ${acceptedAfterReload} in accepted`);
console.log("PASS: board state persists across reload via localStorage");

await browser.close();
console.log("\nAll admin-dashboard.html checks passed.");
