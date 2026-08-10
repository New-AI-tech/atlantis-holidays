// Proves the self-hosted Fraunces @font-face is actually loading (not
// silently falling back to a system font due to a broken path).
import { launchChromium } from "./launch-browser.mjs";

const browser = await launchChromium();
const page = await browser.newPage();
await page.goto("http://localhost:8931/index.html");
await page.evaluate(() => document.fonts.ready);

const result = await page.evaluate(async () => {
  const bodyFont = getComputedStyle(document.body).fontFamily;
  const h1Font = getComputedStyle(document.querySelector('h1')).fontFamily;
  const h1Weight = getComputedStyle(document.querySelector('h1')).fontWeight;

  const loadedFaces = [];
  for (const face of document.fonts) {
    loadedFaces.push({ family: face.family, weight: face.weight, style: face.style, status: face.status });
  }

  const frauncesLoaded = [...document.fonts].some(f => f.family.includes('Fraunces') && f.status === 'loaded');

  return { bodyFont, h1Font, h1Weight, loadedFaces, frauncesLoaded };
});

await browser.close();

console.log("computed body font-family:", result.bodyFont);
console.log("computed h1 font-family:", result.h1Font, "| weight:", result.h1Weight);
console.log("\ndocument.fonts entries:");
result.loadedFaces.forEach(f => console.log(`  ${f.family} weight=${f.weight} style=${f.style} status=${f.status}`));

const assert = (cond, msg) => { if (!cond) throw new Error("FAIL: " + msg); };

assert(result.bodyFont.toLowerCase().includes('fraunces'), `body font-family should list Fraunces first, got: ${result.bodyFont}`);
assert(!result.bodyFont.toLowerCase().includes('segoe'), `body font-family should NOT reference Segoe UI anymore, got: ${result.bodyFont}`);
assert(result.frauncesLoaded, "at least one Fraunces @font-face should report status=loaded");
assert(result.loadedFaces.length >= 6, `expected 6 self-hosted @font-face entries (300/400/400i/500/600/700), found ${result.loadedFaces.length}`);

console.log("\nPASS: self-hosted Fraunces is actually loading and applied — not a silent fallback to a system font.");
