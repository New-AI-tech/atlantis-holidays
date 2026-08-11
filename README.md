# Atlantis Holidays & Wellness

A client-side document generator and mini admin suite for Atlantis Holidays & Wellness. Everything runs as static HTML/JS in the browser — no backend server, no build step — and is hosted on GitHub Pages.

## Pages

- **`index.html` — Proposal Generator**
  Two document types in one tool, switched via tabs:
  - **Proposal Generator** — enter an event/client name plus line items for Hotel Options, Transportation, and Tours & Activities. Subtotal, 5% VAT, and grand total are computed automatically. Generates a branded `.docx` proposal from `template.docx`, a live preview, and a "Download PDF" export.
  - **Hotel Confirmation Voucher** — enter guest and reservation details to generate a branded `.docx` voucher from `voucher_template.docx`, with the same live preview and PDF export pattern.

  Both flows use `docxtemplater` + `pizzip` to fill the Word templates in-browser and `FileSaver.js` to trigger the download. PDF export uses a self-hosted `html2pdf.bundle.min.js`. Official Atlantis/Serandipians header and footer branding is applied to both outputs.

- **`admin-dashboard.html` — Proposal Manager**
  A Kanban-style pipeline board (Lead → Sent → Won/Lost, etc.) for tracking proposals. Cards are dragged between columns to update status; state is persisted to `localStorage` (no backend).

- **`design-system.html` — Design System**
  Living style guide documenting the shared visual language (colors, type, components) used across the site, built on the Fraunces typeface and the tokens/components in `assets/css/`.

## Tech stack

- Vanilla HTML/CSS/JS — no framework, no bundler.
- [`docxtemplater`](https://docxtemplater.com/) + [`pizzip`](https://github.com/open-xml-templating/pizzip) for `.docx` templating in the browser.
- [`FileSaver.js`](https://github.com/eligrey/FileSaver.js) for file downloads.
- Self-hosted `html2pdf.bundle.min.js` (see `assets/js/HTML2PDF-LICENSE.txt`) for PDF export.
- Shared design tokens/components in `assets/css/tokens.css` and `assets/css/components.css`, Fraunces webfont in `assets/fonts/`.
- Light/dark theme toggle persisted via `localStorage`.

## Project structure

```
index.html              Proposal Generator + Hotel Confirmation Voucher (tabs)
admin-dashboard.html    Kanban proposal pipeline manager
design-system.html      Style guide / component reference
template.docx           Word template for proposals
voucher_template.docx   Word template for hotel confirmation vouchers
assets/
  css/                  Design tokens and shared components
  fonts/                Fraunces webfont files
  images/               Atlantis/Serandipians header & footer branding
  js/                   Self-hosted html2pdf bundle
test/                   Node/Playwright scripts: template render checks,
                         calc verification, and page screenshot/QA scripts
```

## Running locally

No build step is required — open `index.html` directly in a browser, or serve the folder statically, e.g.:

```bash
npx serve .
```

## Tests

```bash
npm install
npm test
```

`npm test` runs `test/render.test.js`, which renders `template.docx` with sample data and asserts the subtotal/VAT/grand-total calculations and field substitution are correct. The `test/` directory also contains standalone Playwright-based scripts used during development to verify the voucher template, admin dashboard, design system, and PDF exports.

## Deployment

Hosted as a static site on GitHub Pages — pushes to the deployed branch go live with no build step.
