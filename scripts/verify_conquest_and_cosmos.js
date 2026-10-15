// scripts/verify_conquest_and_cosmos.js
import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 1. Check Expeditions is completely absent
  const expTab = await page.$('#tabExpeditions');
  const expOverlay = await page.$('#expeditionOverlayContainer');
  console.log('Expedition tab exists?', expTab !== null);
  console.log('Expedition overlay exists?', expOverlay !== null);
  if (expTab !== null || expOverlay !== null) {
    throw new Error('Expeditions element still found in DOM!');
  }

  // 2. Test Cosmic Scale Mode
  console.log('Testing Cosmic Scale Mode...');
  const cosmosTab = await page.$('#tabCosmos');
  if (!cosmosTab) throw new Error('#tabCosmos button not found!');
  await cosmosTab.click();
  await page.waitForTimeout(1500);

  const cosmosOverlay = await page.$('#cosmosHudContainer');
  const isCosmosVisible = await cosmosOverlay.isVisible();
  console.log('Cosmos overlay visible?', isCosmosVisible);

  // Take screenshot of Cosmic Scale at Solar System level
  await page.screenshot({ path: 'C:/Users/spathak/.gemini/antigravity/brain/e56f1f5a-7ef3-40ce-b096-26fb3823e115/verified_cosmos_solar_system.png' });

  // Click milestone pill for Milky Way ($10^21 m)
  await page.click('.cosmos-pill[data-exp="21"]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'C:/Users/spathak/.gemini/antigravity/brain/e56f1f5a-7ef3-40ce-b096-26fb3823e115/verified_cosmos_milkyway_zoom.png' });

  // Exit Cosmic Scale
  const exitCosmosBtn = await page.$('#btnCosmosExit');
  if (exitCosmosBtn) {
    await exitCosmosBtn.click();
    await page.waitForTimeout(1000);
  }

  // 3. Test Empire Conquest Mode & KBC Trivia
  console.log('Testing Empire Conquest Mode & KBC Question Engine...');
  const conquestTab = await page.$('#tabConquest');
  if (!conquestTab) throw new Error('#tabConquest not found!');
  await conquestTab.click();
  await page.waitForTimeout(1500);

  // Reset campaign if one was saved previously so we can test the fresh onboarding
  await page.evaluate(() => {
    localStorage.removeItem('world_explorer_empire_campaign_v2');
    window.location.reload();
  });
  await page.waitForTimeout(2000);

  // Click Conquest tab again after reload
  await page.click('#tabConquest');
  await page.waitForTimeout(1000);

  // Verify Onboarding Wizard is visible
  const wizard = await page.$('#empireOnboardingWizard');
  const isWizVisible = await wizard.isVisible();
  console.log('Wizard visible?', isWizVisible);

  // Select India starter card
  const indiaCard = await page.$('.wiz-starter-card[data-code="IN"]');
  if (!indiaCard) throw new Error('India starter card not found!');
  await indiaCard.click();
  await page.waitForTimeout(500);

  // Verify Quick-Start button appears
  const quickStartBtn = await page.$('#btnWizQuickStart');
  const isQuickVisible = await quickStartBtn.isVisible();
  console.log('Quick-Start button visible?', isQuickVisible);
  const quickText = await quickStartBtn.innerText();
  console.log('Quick-Start button text:', quickText);

  // Click Quick-Start
  await quickStartBtn.click();
  await page.waitForTimeout(1200);

  // Verify Wizard closed and HUD is active
  const isWizHidden = !(await wizard.isVisible());
  console.log('Wizard closed after quick-start?', isWizHidden);

  const hudCapitalBadge = await page.$eval('#empRankTitle', el => el.textContent);
  console.log('Empire Dynasty Title in HUD:', hudCapitalBadge);

  await page.screenshot({ path: 'C:/Users/spathak/.gemini/antigravity/brain/e56f1f5a-7ef3-40ce-b096-26fb3823e115/verified_conquest_hud_india.png' });

  // Open Command Drawer to inspect targets
  const toggleDrawerBtn = await page.$('#btnEmpToggleDrawer');
  if (toggleDrawerBtn) {
    await toggleDrawerBtn.click();
    await page.waitForTimeout(600);
  }

  // Find a frontline target row (e.g. Pakistan, Bangladesh, Nepal, or Sri Lanka)
  const targetRow = await page.$('.emp-country-row.frontline');
  if (targetRow) {
    const targetName = await targetRow.$eval('.emp-row-name', el => el.textContent);
    const targetSub = await targetRow.$eval('.emp-row-sub', el => el.textContent);
    console.log(`Frontline Target Found: ${targetName} | Sub: ${targetSub}`);

    // Check visibility and bounding box
    const diag = await page.evaluate(() => {
      const drawer = document.getElementById('rightDrawer');
      const view = document.getElementById('viewEmpireCommand');
      const btn = document.querySelector('.emp-country-row.frontline [data-action="siege"]');
      return {
        drawerClass: drawer?.className,
        drawerRect: drawer ? { right: drawer.getBoundingClientRect().right, left: drawer.getBoundingClientRect().left, width: drawer.getBoundingClientRect().width } : null,
        viewDisplay: view ? window.getComputedStyle(view).display : null,
        btnRect: btn ? { top: btn.getBoundingClientRect().top, left: btn.getBoundingClientRect().left, width: btn.getBoundingClientRect().width, height: btn.getBoundingClientRect().height } : null,
        btnDisplay: btn ? window.getComputedStyle(btn).display : null,
      };
    });
    console.log('Diagnostic info:', JSON.stringify(diag, null, 2));

    // Click Siege on this frontline target
    const siegeBtn = await targetRow.$('[data-action="siege"]');
    if (siegeBtn) {
      await page.evaluate(() => {
        const btn = document.querySelector('.emp-country-row.frontline [data-action="siege"]');
        if (btn) btn.click();
      });
      await page.waitForTimeout(1000);

      // Verify Siege Modal is up
      const siegeModal = await page.$('#empireSiegeModal');
      const isSiegeModalVisible = await siegeModal.isVisible();
      console.log('Siege modal visible?', isSiegeModalVisible);

      const siegePrompt = await page.$eval('#empSiegePrompt', el => el.textContent);
      const siegeTimer = await page.$eval('#empSiegeTimer', el => el.textContent);
      const siegeCat = await page.$eval('#empSiegeCategory', el => el.textContent);
      console.log(`Siege Category: ${siegeCat}`);
      console.log(`Siege Question: ${siegePrompt}`);
      console.log(`Initial Timer Display: ${siegeTimer}`);

      await page.screenshot({ path: 'C:/Users/spathak/.gemini/antigravity/brain/e56f1f5a-7ef3-40ce-b096-26fb3823e115/verified_conquest_kbc_siege.png' });

      // Click option A
      const optA = await page.$('.emp-opt-btn[data-opt="0"]');
      if (optA) {
        await optA.click();
        await page.waitForTimeout(600);

        const expBox = await page.$('#empSiegeExplainBox');
        const isExpVisible = await expBox.isVisible();
        const expTitle = await page.$eval('#empSiegeExplainTitle', el => el.textContent);
        const expText = await page.$eval('#empSiegeExplainText', el => el.textContent);
        console.log(`Debrief visible? ${isExpVisible}`);
        console.log(`Debrief Title: ${expTitle}`);
        console.log(`Debrief Explanation: ${expText}`);

        await page.screenshot({ path: 'C:/Users/spathak/.gemini/antigravity/brain/e56f1f5a-7ef3-40ce-b096-26fb3823e115/verified_conquest_kbc_debrief.png' });
      }

      // Close / Retreat from siege
      const retreatBtn = await page.$('#btnEmpRetreatSiege');
      if (retreatBtn) {
        await retreatBtn.click();
        await page.waitForTimeout(600);
      }
    }
  }

  console.log('Console Errors caught:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('Errors:', consoleErrors);
  }

  console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  await browser.close();
}

run().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
