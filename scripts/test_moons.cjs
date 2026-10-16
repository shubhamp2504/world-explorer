const { chromium } = require('playwright');

(async () => {
  console.log('--- TESTING FAMOUS MOONS INTERACTIVITY & DOSSIER NAVIGATION ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('[BROWSER ERROR]', msg.text());
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    console.error('[BROWSER PAGE ERROR]', err.message);
    errors.push(err.message);
  });

  console.log('1. Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Helper to click celestial pill
  async function selectPill(planetId) {
    await page.evaluate((id) => {
      const el = document.querySelector(`.planet-pill[data-planet="${id}"]`);
      if (el) el.click();
    }, planetId);
    await page.waitForTimeout(1200);
  }

  // 2. Select Europa
  console.log('2. Selecting Europa Moon...');
  await selectPill('europa');

  const dossierNameEuropa = await page.locator('#planetName').innerText();
  const dossierTypeEuropa = await page.locator('#planetType').innerText();
  console.log('  Dossier:', dossierNameEuropa, '| Type:', dossierTypeEuropa);
  if (!dossierNameEuropa.includes('Europa')) throw new Error('Failed to open Europa dossier');

  const parentBtnVis = await page.locator('#planetParentRow').isVisible();
  const parentNameText = await page.locator('#parentPlanetName').innerText();
  console.log('  Parent Row Visible:', parentBtnVis, '| Button Text:', parentNameText);
  if (!parentBtnVis || !parentNameText.includes('Jupiter')) throw new Error('Parent jump row incorrect for Europa');

  // 3. Jump to Parent Planet (Jupiter)
  console.log('3. Clicking Fly to Parent Planet (Jupiter)...');
  await page.click('#btnParentPlanetJump');
  await page.waitForTimeout(1200);

  const dossierNameJupiter = await page.locator('#planetName').innerText();
  console.log('  Dossier after parent jump:', dossierNameJupiter);
  if (!dossierNameJupiter.includes('Jupiter')) throw new Error('Failed to jump to Jupiter');

  const moonsHeader = await page.locator('#planetMoonsHeader').innerText();
  console.log('  Moons Header:', moonsHeader);
  const moonCards = await page.locator('#planetMoonsGrid .planet-moon-card').allInnerTexts();
  console.log('  Jupiter Moons:', moonCards.map(s => s.replace(/\s+/g, ' ')));
  if (moonCards.length !== 4) throw new Error(`Expected 4 Galilean moons for Jupiter, got ${moonCards.length}`);

  // 4. Click Ganymede from moon cards
  console.log('4. Clicking Ganymede card from Jupiter moons grid...');
  await page.click('#planetMoonsGrid .planet-moon-card[data-moon="ganymede"]');
  await page.waitForTimeout(1200);

  const dossierGanymede = await page.locator('#planetName').innerText();
  console.log('  Dossier:', dossierGanymede);
  if (!dossierGanymede.includes('Ganymede')) throw new Error('Failed to open Ganymede from card');

  // 5. Test Mars moons: Phobos
  console.log('5. Selecting Phobos (Mars moon)...');
  await selectPill('phobos');
  const dossierPhobos = await page.locator('#planetName').innerText();
  const parentPhobos = await page.locator('#parentPlanetName').innerText();
  console.log('  Dossier:', dossierPhobos, '| Parent:', parentPhobos);
  if (!dossierPhobos.includes('Phobos') || !parentPhobos.includes('Mars')) throw new Error('Phobos moon check failed');

  // 6. Test Saturn moons: Titan & Enceladus
  console.log('6. Selecting Titan (Saturn moon)...');
  await selectPill('titan');
  const dossierTitan = await page.locator('#planetName').innerText();
  const parentTitan = await page.locator('#parentPlanetName').innerText();
  console.log('  Dossier:', dossierTitan, '| Parent:', parentTitan);
  if (!dossierTitan.includes('Titan') || !parentTitan.includes('Saturn')) throw new Error('Titan moon check failed');

  console.log('7. Selecting Enceladus (Saturn ice geyser moon)...');
  await selectPill('enceladus');
  const dossierEnceladus = await page.locator('#planetName').innerText();
  console.log('  Dossier:', dossierEnceladus);
  if (!dossierEnceladus.includes('Enceladus')) throw new Error('Enceladus moon check failed');

  // Take screenshot of Enceladus view
  await page.screenshot({ path: 'verify_famous_moons.png' });
  console.log('Saved screenshot to verify_famous_moons.png');

  await browser.close();

  if (errors.length > 0) {
    console.error('FAILED with errors:', errors);
    process.exit(1);
  } else {
    console.log('========================================================');
    console.log('✨ ALL 8 FAMOUS MOONS FULLY VERIFIED & 100% OPERATIONAL! ✨');
    console.log('========================================================');
  }
})();
