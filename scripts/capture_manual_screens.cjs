const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const outDir = 'public/manual-screens';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });

  const candidates = [process.env.BASE_URL, 'http://localhost:5174/', 'http://localhost:5173/'].filter(Boolean);
  let lastErr = null;
  let opened = false;
  for (const base of candidates) {
    console.log('Trying', base);
    try {
      await page.goto(base, { waitUntil: 'networkidle', timeout: 10000 });
      console.log('Opened', base);
      opened = true;
      break;
    } catch (e) {
      console.warn('Could not open', base, e.message);
      lastErr = e;
    }
  }
  if (!opened) throw lastErr;
  await page.waitForTimeout(800);
  await page.waitForTimeout(800);
  // Close any modal overlay (user manual or other) that may intercept clicks
  try {
    // Click the user manual close button if present
    const userManualClose = await page.$('button[aria-label="Close user manual"]');
    if (userManualClose) {
      await userManualClose.click();
      await page.waitForTimeout(300);
    }

    // If Disclaimer is shown and requires acceptance, click Accept
    const disclaimerHeader = await page.locator('text=Important Disclaimer').first();
    if (await disclaimerHeader.count() > 0) {
      const acceptBtn = page.locator('button', { hasText: 'Accept' }).first();
      if (await acceptBtn.count() > 0) {
        await acceptBtn.click();
        await page.waitForTimeout(500);
      }
    }
  } catch (e) {
    // ignore
  }

  async function safeClick(text) {
    try {
      const locator = page.locator(`text=${text}`).first();
      await locator.scrollIntoViewIfNeeded();
      await locator.click({ timeout: 5000 });
      await page.waitForTimeout(600);
      return true;
    } catch (e) {
      console.warn('Could not click', text, e.message);
      return false;
    }
  }

  // Accounts tab
  await safeClick('Accounts');
  await page.screenshot({ path: `${outDir}/accounts.png` });
  console.log('Saved accounts.png');

  // Income -> Pensions
  await safeClick('Income');
  await safeClick('Pensions');
  await page.screenshot({ path: `${outDir}/pensions.png` });
  console.log('Saved pensions.png');

  // Income -> Annuities (optional)
  await safeClick('Annuities');
  await page.screenshot({ path: `${outDir}/annuities.png` });
  console.log('Saved annuities.png');

  // Scenario Manager (top area)
  // Try clicking a button or fallback to header screenshot
  await safeClick('Scenario Manager');
  await page.screenshot({ path: `${outDir}/scenario-manager.png` });
  console.log('Saved scenario-manager.png');

  // Projection table: try clicking Results or scroll to projection table
  await safeClick('Results');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/projection.png`, fullPage: true });
  console.log('Saved projection.png');

  await browser.close();
  console.log('Done capturing screenshots.');
})();
