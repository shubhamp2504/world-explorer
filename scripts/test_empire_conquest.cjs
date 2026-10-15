const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/spathak/.gemini/antigravity/brain/e56f1f5a-7ef3-40ce-b096-26fb3823e115';

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Clear local storage for fresh test run
  await page.evaluate(() => {
    localStorage.removeItem('world_explorer_empire_conquest_v1');
    localStorage.removeItem('world_explorer_empire_conquest_v2');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('Switching to Empire Conquest Tab (#tabConquest)...');
  await page.click('#tabConquest');
  await page.waitForTimeout(800);

  // 1. Verify Onboarding Wizard Step 1
  console.log('Taking screenshot of Step 1 Wizard...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_v2_wizard_step1.png') });

  // Select India starter card
  console.log('Selecting India starter card...');
  const indCard = page.locator('.wiz-starter-card[data-code="IN"]');
  await indCard.click();
  await page.waitForTimeout(400);

  // Click Step 1 Next
  console.log('Advancing to Step 2...');
  await page.click('#btnWizStep1Next');
  await page.waitForTimeout(500);

  // Take screenshot of Step 2
  console.log('Taking screenshot of Step 2...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_v2_wizard_step2.png') });

  // Click Step 2 Next
  console.log('Advancing to Step 3...');
  await page.click('#btnWizStep2Next');
  await page.waitForTimeout(500);

  // Take screenshot of Step 3
  console.log('Taking screenshot of Step 3...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_v2_wizard_step3.png') });

  // Launch Empire
  console.log('Launching Empire Campaign...');
  await page.click('#btnWizLaunchCampaign');
  await page.waitForTimeout(1000);

  // 2. Verify Holo-Globe War Room
  console.log('Taking screenshot of Holo-Globe War Room...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_v2_war_room.png') });

  // 3. Test Cloud Sync Modal
  console.log('Opening Cloud Sync modal (#btnEmpOpenSyncModal)...');
  await page.click('#btnEmpOpenSyncModal');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_v2_sync_modal.png') });
  await page.click('#btnCloseSyncModal');
  await page.waitForTimeout(400);

  // 4. Test Directive Modal
  console.log('Opening Directive modal (#btnEmpOpenDirective)...');
  await page.click('#btnEmpOpenDirective');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_v2_directive_modal.png') });
  await page.click('#btnCloseDirectiveModal');
  await page.waitForTimeout(400);

  // 5. Test Target Selection & Dossier
  console.log('Inspecting frontier target Pakistan (PK)...');
  await page.evaluate(() => {
    if (window.conquestController && window.conquestController.handleCountryInteraction) {
      window.conquestController.handleCountryInteraction('PK', 0, 0);
    }
  });
  await page.waitForTimeout(600);
  console.log('Taking screenshot of Target Dossier...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_v2_target_dossier.png') });

  // 6. Launch Siege
  console.log('Launching Siege on PAK (#btnDossierSiege)...');
  await page.click('#btnDossierSiege');
  await page.waitForTimeout(600);

  // Take screenshot of Siege Arena (20s timer, 5 shields)
  console.log('Taking screenshot of Siege Arena...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_v2_siege_arena.png') });

  // 7. Test Strategic Pause
  console.log('Clicking Pause (#btnEmpPauseSiege)...');
  await page.click('#btnEmpPauseSiege');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_v2_siege_paused.png') });

  console.log('Resuming siege (#btnResumeSiege)...');
  await page.click('#btnResumeSiege');
  await page.waitForTimeout(400);

  // 8. Answer question and check debrief + Next Shield button
  console.log('Answering siege question...');
  const firstOpt = page.locator('.emp-opt-btn').first();
  await firstOpt.click();
  await page.waitForTimeout(600);

  console.log('Taking screenshot of Answer Debrief & Next Shield button...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verified_v2_siege_debrief.png') });

  console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
  await browser.close();
}

run().catch(err => {
  console.error('Test script failed:', err);
  process.exit(1);
});
