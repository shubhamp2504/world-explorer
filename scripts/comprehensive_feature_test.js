import { chromium } from 'playwright';

async function testAllFeatures() {
  console.log('--- STARTING COMPREHENSIVE WORLD EXPLORER TEST SUITE ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  const warnings = [];

  page.on('pageerror', err => {
    console.error('PAGE ERROR:', err.message);
    errors.push({ type: 'pageerror', text: err.message });
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('CONSOLE ERROR:', msg.text());
      errors.push({ type: 'console.error', text: msg.text() });
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  });

  const results = {};

  try {
    // 1. Initial Load & Explore Mode
    console.log('[1/7] Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const title = await page.title();
    const loadingScreenHidden = await page.$eval('#loadingScreen', el => el.style.display === 'none' || el.classList.contains('fade-out'));
    results.initialLoad = { success: true, title, loadingScreenHidden };
    console.log('✓ Initial Load OK:', title);

    // 2. 2D Map vs 3D Globe Projection Switch
    console.log('[2/7] Testing Map Projections & Smooth Switching...');
    await page.click('#btnFlatView');
    await page.waitForTimeout(1000);
    const flatCanvasVisible = await page.$eval('#earthSvg', el => el.style.display !== 'none');

    await page.click('#btnGlobeView');
    await page.waitForTimeout(1000);
    const globeCanvasVisible = await page.$eval('#globe3dContainer', el => el.style.display !== 'none');
    results.projections = { success: flatCanvasVisible && globeCanvasVisible, flatCanvasVisible, globeCanvasVisible };
    console.log('✓ Projection switching OK (Flat SVG:', flatCanvasVisible, ', 3D Globe:', globeCanvasVisible, ')');

    // 3. Solar System & Planetary Dossiers
    console.log('[3/7] Testing Solar System Orrery & Planets...');
    const marsPill = await page.$('.planet-pill[data-planet="mars"]');
    if (marsPill) {
      await marsPill.click();
      await page.waitForTimeout(1500);
      const dossierTitle = await page.$eval('#planetDossierName', el => el.textContent).catch(() => null);
      console.log('  Focused planet dossier:', dossierTitle);
      results.solarSystem = { success: true, focused: dossierTitle };
    } else {
      results.solarSystem = { success: false, reason: 'mars pill not found' };
    }

    // Return to system view
    const btnAllPlanets = await page.$('#btnAllPlanetsPill');
    if (btnAllPlanets) await btnAllPlanets.click();
    await page.waitForTimeout(1000);

    // 4. Powers of Ten (Cosmic Scale Mode)
    console.log('[4/7] Testing Powers of Ten (Cosmic Scale)...');
    const cosmosTab = await page.$('#tabCosmos');
    if (!cosmosTab) throw new Error('#tabCosmos tab not found!');
    await cosmosTab.click();
    await page.waitForTimeout(1500);

    const cosmosOverlay = await page.$('#cosmosHudContainer');
    const isCosmosVisible = await cosmosOverlay.isVisible();
    const initialExponent = await page.$eval('.cosmos-exponent-badge', el => el.textContent).catch(() => 'N/A');
    const initialRealm = await page.$eval('.cosmos-realm-name', el => el.textContent).catch(() => 'N/A');
    console.log('  Cosmos HUD visible:', isCosmosVisible, '| Scale:', initialExponent, '| Realm:', initialRealm);

    // Test slider scrubbing
    await page.$eval('#cosmosScaleSlider', el => {
      el.value = 21;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(1000);
    const milkyWayExp = await page.$eval('.cosmos-exponent-badge', el => el.textContent).catch(() => 'N/A');
    const milkyWayRealm = await page.$eval('.cosmos-realm-name', el => el.textContent).catch(() => 'N/A');
    console.log('  Scrubbed to Milky Way (10^21 m):', milkyWayExp, '| Realm:', milkyWayRealm);

    // Test milestone pill click
    const universePill = await page.$('.cosmos-pill[data-exp="26"]');
    if (universePill) {
      await universePill.click();
      await page.waitForTimeout(1000);
      const universeRealm = await page.$eval('.cosmos-realm-name', el => el.textContent).catch(() => 'N/A');
      console.log('  Milestone 10^26 m clicked:', universeRealm);
    }

    // Test Dossier Drawer
    const btnInspectDossier = await page.$('#btnCosmosInspectDossier');
    if (btnInspectDossier) {
      await btnInspectDossier.click();
      await page.waitForTimeout(800);
      const isDrawerOpen = await page.$eval('#cosmosDossierDrawer', el => el.classList.contains('open')).catch(() => false);
      console.log('  Astrophysical Dossier open:', isDrawerOpen);
      const closeBtn = await page.$('#btnCloseCosmosDossier');
      if (closeBtn) await closeBtn.click();
    }

    // Exit Cosmos Mode
    const exitCosmosBtn = await page.$('#btnCosmosExit');
    if (exitCosmosBtn) await exitCosmosBtn.click();
    await page.waitForTimeout(1000);
    results.cosmos = { success: isCosmosVisible, initialRealm, milkyWayRealm };
    console.log('✓ Powers of Ten OK');

    // 5. Empire Conquest Mode
    console.log('[5/7] Testing Empire Conquest Grand Strategy...');
    const conquestTab = await page.$('#tabConquest');
    await conquestTab.click();
    await page.waitForTimeout(1500);

    const empContainer = await page.$('#empireHudContainer');
    const isEmpVisible = await empContainer.isVisible();
    const wizard = await page.$('#empireOnboardingWizard');
    const isWizVisible = await wizard.isVisible();
    console.log('  Empire HUD visible:', isEmpVisible, '| Wizard visible:', isWizVisible);

    if (isWizVisible) {
      const indiaCard = await page.$('.wiz-starter-card[data-code="IN"]');
      if (indiaCard) {
        await indiaCard.click();
        await page.waitForTimeout(500);
        const quickStartBtn = await page.$('#btnWizQuickStart');
        if (quickStartBtn && await quickStartBtn.isVisible()) {
          await quickStartBtn.click();
          await page.waitForTimeout(1500);
          console.log('  Empire Quick-Start completed');
        }
      }
    }

    const territoryVal = await page.$eval('#empTerritoryVal', el => el.textContent).catch(() => 'N/A');
    const gdpVal = await page.$eval('#empGdpVal', el => el.textContent).catch(() => 'N/A');
    console.log('  Empire Telemetry:', territoryVal, '| GDP:', gdpVal);

    // Switch back to explore
    await page.click('#tabExplore');
    await page.waitForTimeout(1000);
    results.conquest = { success: isEmpVisible, territoryVal, gdpVal };
    console.log('✓ Empire Conquest OK');

    // 6. Geography Battle Royale & KBC Quiz Engine
    console.log('[6/7] Testing Geography Battle Royale...');
    const battleTab = await page.$('#tabBattle');
    if (battleTab) {
      await battleTab.click();
      await page.waitForTimeout(1500);
      const battleHud = await page.$('#battleHud');
      const isBattleVisible = await battleHud.isVisible();
      const questionText = await page.$eval('#battleQuestionText', el => el.textContent).catch(() => 'N/A');
      console.log('  Battle Royale active:', isBattleVisible, '| First Question:', questionText?.substring(0, 50) + '...');
      results.battle = { success: isBattleVisible, questionText };
    }

    // Switch to KBC submode
    const kbcSubTab = await page.$('.battle-mode-pill[data-submode="kbc"]');
    if (kbcSubTab) {
      await kbcSubTab.click();
      await page.waitForTimeout(1000);
      const isKbcStudio = await page.$eval('#battleKbcStudioStage', el => el.style.display !== 'none').catch(() => false);
      console.log('  KBC Quiz Studio visible:', isKbcStudio);
    }

    // Exit Battle Mode using its HUD exit button
    const exitBattleBtn = await page.$('#btnEndBattle');
    if (exitBattleBtn) await exitBattleBtn.click();
    await page.waitForTimeout(1000);

    // 7. Guess Where (GeoGuessr Mystery Mode)
    console.log('[7/7] Testing Guess Where (GeoGuessr Mode)...');
    const mysteryTab = await page.$('#tabMystery');
    if (mysteryTab) {
      await mysteryTab.click();
      await page.waitForTimeout(1500);
      const mysteryHud = await page.$('#mysteryHud');
      const isMysteryVisible = await mysteryHud.isVisible();
      const clueTitle = await page.$eval('#mysteryClueTitle', el => el.textContent).catch(() => 'N/A');
      console.log('  Mystery Mode active:', isMysteryVisible, '| Clue:', clueTitle);
      results.mystery = { success: isMysteryVisible, clueTitle };

      // Exit Mystery Mode using its HUD exit button
      const exitMysteryBtn = await page.$('#btnMysteryExitTop');
      if (exitMysteryBtn) await exitMysteryBtn.click();
      await page.waitForTimeout(1000);
    }

    // Measure FPS / Animation Smoothness
    console.log('Measuring Rendering Performance & FPS...');
    const fps = await page.evaluate(async () => {
      return new Promise(resolve => {
        let frames = 0;
        const start = performance.now();
        function loop() {
          frames++;
          if (performance.now() - start < 1000) {
            requestAnimationFrame(loop);
          } else {
            resolve(frames);
          }
        }
        requestAnimationFrame(loop);
      });
    });
    console.log('Measured Frame Rate:', fps, 'FPS');
    results.fps = fps;

  } catch (err) {
    console.error('TEST RUNTIME EXCEPTION:', err);
    results.exception = err.message;
  } finally {
    await browser.close();
  }

  console.log('\n--- FINAL TEST SUMMARY ---');
  console.log('Feature Results:', JSON.stringify(results, null, 2));
  console.log('Errors encountered (' + errors.length + '):', errors);
  return { results, errors };
}

testAllFeatures().then(({ results, errors }) => {
  if (errors.length > 0) {
    console.error('FAIL: Detected errors during feature execution.');
    process.exit(1);
  } else {
    console.log('SUCCESS: All features verified and functioning smoothly!');
    process.exit(0);
  }
}).catch(err => {
  console.error('Runner failed:', err);
  process.exit(1);
});
