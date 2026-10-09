// db/seed.js
// Seeds authentic NCERT, UPSC & MPSC geography and history questions into Neon Postgres
// Reads credentials from process.env.DATABASE_URL or process.env.POSTGRES_URL

import { neon } from '@neondatabase/serverless';
import { KBC_QUIZ_BANK, INDIA_BATTLE_QUESTIONS } from '../src/data/indiaData.js';
import { BATTLE_QUESTIONS } from '../src/data/games.js';

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
  console.log('ℹ️  No DATABASE_URL or POSTGRES_URL detected.');
  console.log('   To seed your Neon database:');
  console.log('   1. Link Neon in Vercel Marketplace or copy connection string from https://console.neon.tech');
  console.log('   2. Run: DATABASE_URL="postgres://..." node db/seed.js');
  process.exit(0);
}

const sql = neon(dbUrl);

async function seed() {
  console.log('🌱 Connected to Neon Postgres. Ensuring tables exist...');

  await sql`
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id VARCHAR(64) PRIMARY KEY,
      mode VARCHAR(32) NOT NULL DEFAULT 'kbc',
      category VARCHAR(128) NOT NULL,
      subcategory VARCHAR(128),
      difficulty VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
      question TEXT NOT NULL,
      options JSONB NOT NULL,
      answer_index INTEGER NOT NULL,
      target_code VARCHAR(32),
      lat NUMERIC(9, 6),
      lng NUMERIC(9, 6),
      hint TEXT,
      fact TEXT,
      explanation TEXT NOT NULL,
      source_syllabus VARCHAR(128) DEFAULT 'NCERT / UPSC Prelims',
      is_verified BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS historical_places (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      city VARCHAR(128) NOT NULL,
      state_or_country VARCHAR(128) NOT NULL,
      era VARCHAR(128) NOT NULL,
      lat NUMERIC(9, 6) NOT NULL,
      lng NUMERIC(9, 6) NOT NULL,
      history_hook TEXT NOT NULL,
      architectural_significance TEXT NOT NULL,
      image_url TEXT,
      is_unesco BOOLEAN DEFAULT FALSE,
      is_verified BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  console.log('📦 Seeding KBC Quiz Bank (UPSC & MPSC 4-choice questions)...');
  for (const q of KBC_QUIZ_BANK) {
    await sql`
      INSERT INTO quiz_questions (
        id, mode, category, difficulty, question, options, answer_index, explanation, source_syllabus, is_verified
      ) VALUES (
        ${q.id}, 'kbc', ${q.category}, ${q.difficulty}, ${q.question}, 
        ${JSON.stringify(q.options)}, ${q.answerIndex}, ${q.explanation}, 'NCERT / UPSC Prelims', TRUE
      )
      ON CONFLICT (id) DO UPDATE SET
        question = EXCLUDED.question,
        options = EXCLUDED.options,
        answer_index = EXCLUDED.answer_index,
        explanation = EXCLUDED.explanation,
        updated_at = CURRENT_TIMESTAMP;
    `;
  }

  console.log('📦 Seeding India Battle Questions (State & Landmark Geography)...');
  for (const q of INDIA_BATTLE_QUESTIONS) {
    await sql`
      INSERT INTO quiz_questions (
        id, mode, category, difficulty, question, options, answer_index, target_code, lat, lng, hint, fact, explanation, source_syllabus, is_verified
      ) VALUES (
        ${q.id}, 'india', 'Indian States & Geography', ${q.difficulty}, ${q.text}, 
        '[]'::jsonb, 0, ${q.stateCode}, ${q.lat}, ${q.lng}, ${q.hint}, ${q.fact}, ${q.fact}, 'MPSC / UPSC State Geography', TRUE
      )
      ON CONFLICT (id) DO UPDATE SET
        question = EXCLUDED.question,
        hint = EXCLUDED.hint,
        fact = EXCLUDED.fact,
        updated_at = CURRENT_TIMESTAMP;
    `;
  }

  console.log('📦 Seeding World Battle Questions...');
  for (const q of BATTLE_QUESTIONS) {
    await sql`
      INSERT INTO quiz_questions (
        id, mode, category, difficulty, question, options, answer_index, target_code, lat, lng, hint, explanation, source_syllabus, is_verified
      ) VALUES (
        ${q.id}, 'world', 'World Geography & Capitals', ${q.difficulty}, ${q.text}, 
        '[]'::jsonb, 0, ${q.targetCode}, ${q.lat}, ${q.lng}, ${q.hint}, ${q.hint}, 'Global Physical Geography', TRUE
      )
      ON CONFLICT (id) DO UPDATE SET
        question = EXCLUDED.question,
        hint = EXCLUDED.hint,
        updated_at = CURRENT_TIMESTAMP;
    `;
  }

  console.log('🏛️  Seeding Curated Historical Landmarks & Wow Hooks...');
  const HISTORICAL_LANDMARKS = [
    {
      id: 'hist-dholavira',
      name: 'Dholavira: Harappan Metropolis',
      city: 'Kutch',
      state_or_country: 'Gujarat, India',
      era: 'Indus Valley Civilization (c. 3000–1500 BCE)',
      lat: 23.8864,
      lng: 70.2178,
      history_hook: 'Engineered a cascading rainwater harvesting reservoir system with stepwells in a desert salt marsh over 4,500 years ago.',
      architectural_significance: 'UNESCO World Heritage site featuring stone fortifications and ancient signboard with 10 large Indus script symbols.',
      image_url: '/places/dholavira.png',
      is_unesco: true
    },
    {
      id: 'hist-ellora-kailasa',
      name: 'Kailasa Temple (Cave 16), Ellora',
      city: 'Chhatrapati Sambhajinagar',
      state_or_country: 'Maharashtra, India',
      era: 'Rashtrakuta Dynasty (8th Century CE, King Krishna I)',
      lat: 20.0238,
      lng: 75.1793,
      history_hook: 'Carved top-down from a single volcanic basalt cliff, excavating over 200,000 tonnes of rock with zero scaffolding.',
      architectural_significance: 'World’s largest monolithic rock-cut monument; complex Dravidian multi-story temple architecture.',
      image_url: '/places/ellora.png',
      is_unesco: true
    },
    {
      id: 'hist-hampi',
      name: 'Vijayanagara Ruins & Stone Chariot',
      city: 'Hampi',
      state_or_country: 'Karnataka, India',
      era: 'Vijayanagara Empire (14th–16th Century CE)',
      lat: 15.3350,
      lng: 76.4600,
      history_hook: 'In the 15th century, Vijayanagara was the second largest city in the medieval world after Beijing, trading rubies and diamonds by the quart.',
      architectural_significance: 'UNESCO site set among massive boulder-strewn terrain with the iconic Garuda Stone Chariot and musical pillars of Vittala Temple.',
      image_url: '/places/hampi.png',
      is_unesco: true
    },
    {
      id: 'hist-lothal',
      name: 'Lothal Tidal Dockyard',
      city: 'Ahmedabad District',
      state_or_country: 'Gujarat, India',
      era: 'Harappan Maritime Hub (c. 2400–1900 BCE)',
      lat: 22.5222,
      lng: 72.2497,
      history_hook: 'World’s earliest known tidal basin dockyard, connecting ancient Harappan trade ships to Mesopotamia and ancient Egypt through the Gulf of Khambhat.',
      architectural_significance: 'Sophisticated lock-gate engineering that used tidal flow to float ocean-going trading vessels.',
      image_url: '/places/lothal.png',
      is_unesco: false
    }
  ];

  for (const h of HISTORICAL_LANDMARKS) {
    await sql`
      INSERT INTO historical_places (
        id, name, city, state_or_country, era, lat, lng, history_hook, architectural_significance, image_url, is_unesco, is_verified
      ) VALUES (
        ${h.id}, ${h.name}, ${h.city}, ${h.state_or_country}, ${h.era}, ${h.lat}, ${h.lng}, 
        ${h.history_hook}, ${h.architectural_significance}, ${h.image_url}, ${h.is_unesco}, TRUE
      )
      ON CONFLICT (id) DO UPDATE SET
        history_hook = EXCLUDED.history_hook,
        architectural_significance = EXCLUDED.architectural_significance;
    `;
  }

  console.log('✅ Seeding completed successfully! Total questions and historical places synced.');
}

seed().catch(err => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
