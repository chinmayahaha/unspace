# Visual QA Checklist

This file contains a short checklist for visual verification and commands to capture screenshots locally or in CI.

## Pages to verify
- Home
- Marketplace (listings grid + filters)
- Listing detail (gallery + lightbox + CTA column)
- Book Exchange (cards + add flow)
- Community (posts list + like button)
- Business directory (cards + contact)
- AdsX (requests list + status badges)

## Quick local screenshot commands (Windows PowerShell)
Start the dev server:

```powershell
npm start
```

Open the page in the browser (example):

```powershell
# Open marketplace
start http://localhost:3000/marketplace
```

To capture a screenshot in CI or locally programmatically, you can use Playwright or Puppeteer. Example (Playwright):

```powershell
# Install once
npm i -D playwright
# Run a simple node script to capture a screenshot
node scripts/screenshot-marketplace.js
```

## Accessibility checks
- Ensure all interactive elements have keyboard focus and visible outlines
- All images have alt text (placeholder images included)
- Buttons exposed with aria-labels where required

## Notes
- Tests should be added to CI to run `npm run build` and optionally run a headless visual snapshot.
