import { launchChromium } from './launch-browser.mjs';

const browser = await launchChromium();
const page = await browser.newPage();
await page.goto('http://localhost:8931/index.html', { waitUntil: 'networkidle' });

const assert = (condition, message) => {
    if (!condition) throw new Error(`FAIL: ${message}`);
};

for (const type of ['landPackage', 'fit', 'groups']) {
    await page.click(`.ew-subtab[data-qtype="${type}"]`);
    const previewButton = page.locator('#proposalPreviewBtn');
    assert(await previewButton.isVisible(), `${type} quotation Preview button should be visible`);
    await previewButton.click();
    await page.waitForTimeout(150);
    assert(await page.locator('#proposalPreviewOverlay').evaluate(el => el.classList.contains('is-open')), `${type} quotation preview should open`);
    const frameText = await page.frameLocator('#proposalPreviewFrame').locator('.doc-page').innerText();
    assert(frameText.length > 0, `${type} preview should render document content`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
}

await page.click('.ew-subtab[data-qtype="hotelProposal"]');
const hotelPreviewButton = page.locator('#hotelProposalPreviewBtn');
assert(await hotelPreviewButton.isVisible(), 'Hotel Proposal Preview button should be visible');
await hotelPreviewButton.click();
await page.waitForTimeout(150);
assert(await page.locator('#hotelProposalPreviewOverlay').evaluate(el => el.classList.contains('is-open')), 'Hotel Proposal preview should open');
const hotelFrame = page.frameLocator('#hotelProposalPreviewFrame');
const hotelFrameText = await hotelFrame.locator('body').innerText();
console.log('HOTEL PREVIEW TEXT:', JSON.stringify(hotelFrameText.slice(0, 500)));
assert(await hotelFrame.locator('.acc-page').count() === 1, 'Hotel Proposal preview should render its branded document');
await page.keyboard.press('Escape');

await browser.close();
console.log('PASS: quotation and Hotel Proposal preview controls work for Land Package, FIT, Groups, and Hotel Proposal.');
