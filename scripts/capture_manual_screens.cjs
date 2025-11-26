const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const outDir = 'public/manual-screens';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });

  const base = 'http://localhost:5173/';
  console.log('Opening', base);
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  async function safeClick(text) {
    try {
      await page.click(`text=${text}`);
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
