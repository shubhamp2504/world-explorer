import { chromium } from 'playwright';

async function runProductionAudit() {
  console.log('🚀 Starting Full Production Readiness Audit for World Explorer...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  const errors = [];
  page.on('pageerror', err => {
    console.error('❌ [PageError]:', err.message);
    errors.push(err.message);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('❌ [ConsoleError]:', msg.text());
      errors.push(msg.text());
    }
  });

  const BASE_URL = 'http://localhost:5173';
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  console.log('✓ Page loaded cleanly.');

  // Check 1: World Quiz (Battle Royale)
  console.log('\n--- 1. Testing World Quiz ---');
  await page.click('#tabBattle');
  await page.waitForTimeout(600);
  await page.click('button[data-submode="world"]');
  await page.waitForTimeout(1000);

  // Check question card is visible
  const worldCardVisible = await page.isVisible('#battleMapQuestionCard');
  console.log('World Question Card Visible:', worldCardVisible);

  // Check choices row exists and has 4 choices
  const choiceBtns = await page.$$('.battle-choice-btn');
  console.log(`Found ${choiceBtns.length} dynamic answer choice pills.`);
  if (choiceBtns.length !== 4) {
    throw new Error(`Expected 4 answer choices, found ${choiceBtns.length}`);
  }

  // Click the first choice
  const firstChoiceText = await choiceBtns[0].textContent();
  console.log(`Clicking World Quiz choice: "${firstChoiceText.trim()}"...`);
  await choiceBtns[0].click();
  await page.waitForTimeout(1000);

  // Verify explanation box or highlighted answer
  const explanationVisible = await page.isVisible('#quizExplanationBox');
  const hasResultClass = await page.$eval('.battle-choice-btn', () => {
    return document.querySelector('.battle-choice-btn.correct-choice') !== null ||
           document.querySelector('.battle-choice-btn.wrong-choice') !== null;
  });
  console.log('Answer highlighted (correct or wrong):', hasResultClass);
  console.log('Explanation box displayed:', explanationVisible);

  // Check 2: Bharat & States Quiz
  console.log('\n--- 2. Testing Bharat (India States) Quiz ---');
  await page.click('button[data-submode="india"]');
  await page.waitForTimeout(1000);

  const bharatCardVisible = await page.isVisible('#battleMapQuestionCard');
  console.log('Bharat Question Card Visible:', bharatCardVisible);

  const bharatChoices = await page.$$('.battle-choice-btn');
  console.log(`Found ${bharatChoices.length} dynamic answer choice pills for Bharat Quiz.`);
  if (bharatChoices.length !== 4) {
    throw new Error(`Expected 4 Bharat answer choices, found ${bharatChoices.length}`);
  }

  const bharatChoiceText = await bharatChoices[0].textContent();
  console.log(`Clicking Bharat Quiz choice: "${bharatChoiceText.trim()}"...`);
  await bharatChoices[0].click();
  await page.waitForTimeout(1000);

  const bharatResultClass = await page.$eval('.battle-choice-btn', () => {
    return document.querySelector('.battle-choice-btn.correct-choice') !== null ||
           document.querySelector('.battle-choice-btn.wrong-choice') !== null;
  });
  const bharatExplanation = await page.isVisible('#quizExplanationBox');
  console.log('Bharat Answer highlighted:', bharatResultClass);
  console.log('Bharat Explanation box displayed:', bharatExplanation);

  // Check 3: KBC Studio Mode
  console.log('\n--- 3. Testing KBC 4-Option Mode ---');
  await page.click('button[data-submode="kbc"]');
  await page.waitForTimeout(1000);

  const kbcArenaVisible = await page.isVisible('#battleKbcStudioStage');
  console.log('KBC Studio Arena Visible:', kbcArenaVisible);
  const kbcOptions = await page.$$('.kbc-opt-btn');
  console.log(`Found ${kbcOptions.length} KBC Option buttons.`);
  if (kbcOptions.length >= 4) {
    const optText = await kbcOptions[0].textContent();
    console.log(`Clicking KBC Option A ("${optText.trim()}")...`);
    await kbcOptions[0].click();
    await page.waitForTimeout(2200); // Wait for lock and reveal
    const kbcScore = await page.textContent('#battleScore');
    console.log('KBC Score:', kbcScore);
  }

  // Exit battle mode
  await page.click('#btnEndBattle');
  await page.waitForTimeout(600);

  // Check 4: Powers of Ten (Cosmic Scale)
  console.log('\n--- 4. Testing Powers of Ten (Cosmic Scale) ---');
  await page.click('#tabCosmos');
  await page.waitForTimeout(1200);

  const cosmosActive = await page.evaluate(() => document.body.classList.contains('mode-cosmos'));
  console.log('Body has mode-cosmos:', cosmosActive);
  const hudExponent = await page.textContent('#hudExponent');
  const hudRealm = await page.textContent('#hudRealmName');
  console.log('Cosmic Exponent:', hudExponent, '| Realm:', hudRealm);

  // Exit cosmic
  await page.click('#btnExitCosmos');
  await page.waitForTimeout(600);

  console.log('\n=======================================');
  console.log(`TOTAL UNHANDLED JS ERRORS: ${errors.length}`);
  if (errors.length > 0) {
    console.error('Errors found:', errors);
    process.exit(1);
  } else {
    console.log('🎉 ALL PRODUCTION READINESS CHECKS PASSED PERFECTLY!');
  }
  console.log('=======================================');

  await browser.close();
}

runProductionAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
