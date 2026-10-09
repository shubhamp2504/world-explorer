// api/quiz.js
// Vercel Serverless Function: Secure Dynamic Question Engine & Anti-Cheat Validation
// Integrated with Neon Postgres + Transparent Offline / In-Memory Fallback
//
// GET /api/quiz?mode=india|world|kbc[&category=...][&limit=10]
// Delivers sanitized questions with answer choices WITHOUT exposing answerIndex to the browser.
//
// POST /api/quiz
// Validates answers server-side against Neon (or fallback) and returns authentic UPSC/MPSC explanations.

import { neon } from '@neondatabase/serverless';
import { BATTLE_QUESTIONS } from '../src/data/games.js';
import { INDIA_BATTLE_QUESTIONS, KBC_QUIZ_BANK } from '../src/data/indiaData.js';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Helper to get Neon DB client if environment credentials are present
function getDb() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) return null;
  try {
    return neon(connectionString);
  } catch (e) {
    console.warn('Neon connection initialization warning:', e.message);
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = getDb();

  // -------------------------------------------------------------
  // 1. GET /api/quiz?mode=india|world|kbc[&category=...][&limit=10]
  // -------------------------------------------------------------
  if (req.method === 'GET') {
    const mode = (req.query.mode || 'world').toLowerCase();
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 30);
    const category = req.query.category || null;

    let questions = [];
    let source = 'local_bundled';

    // A. Attempt fetching from Neon Postgres if connected
    if (sql) {
      try {
        let rows = [];
        if (category) {
          rows = await sql`
            SELECT id, mode, category, difficulty, question, options, answer_index, target_code, lat, lng, hint, fact, explanation
            FROM quiz_questions
            WHERE mode = ${mode} AND is_verified = TRUE AND category = ${category}
            ORDER BY RANDOM()
            LIMIT ${limit};
          `;
        } else {
          rows = await sql`
            SELECT id, mode, category, difficulty, question, options, answer_index, target_code, lat, lng, hint, fact, explanation
            FROM quiz_questions
            WHERE mode = ${mode} AND is_verified = TRUE
            ORDER BY RANDOM()
            LIMIT ${limit};
          `;
        }

        if (rows && rows.length > 0) {
          source = 'neon_postgres';
          questions = rows.map(r => ({
            id: r.id,
            question: r.question,
            text: r.question,
            options: typeof r.options === 'string' ? JSON.parse(r.options) : r.options,
            answerIndex: r.answer_index,
            category: r.category,
            difficulty: r.difficulty,
            targetCode: r.target_code,
            lat: r.lat ? parseFloat(r.lat) : undefined,
            lng: r.lng ? parseFloat(r.lng) : undefined,
            hint: r.hint,
            fact: r.fact,
            explanation: r.explanation
          }));
        }
      } catch (dbErr) {
        console.warn('Neon DB query failed, falling back to local dataset:', dbErr.message);
      }
    }

    // B. Local In-Memory Fallback if database is offline or not yet connected
    if (questions.length === 0) {
      let pool = [];
      if (mode === 'india') {
        pool = INDIA_BATTLE_QUESTIONS;
      } else if (mode === 'kbc') {
        pool = KBC_QUIZ_BANK;
      } else {
        pool = BATTLE_QUESTIONS;
      }
      questions = shuffle(pool).slice(0, limit);
    }

    // Sanitize questions: DO NOT SEND answerIndex OR targetCode to prevent DevTools cheating
    const clientSafeQuestions = questions.map(q => {
      if (mode === 'kbc') {
        // Compute 2 wrong indices for 50:50 lifeline without revealing the correct index
        const correctIdx = q.answerIndex;
        const wrongIndices = [0, 1, 2, 3].filter(i => i !== correctIdx);
        const shuffledWrong = shuffle(wrongIndices).slice(0, 2);
        return {
          id: q.id,
          question: q.question,
          options: q.options,
          category: q.category,
          difficulty: q.difficulty,
          lifeline5050Eliminate: shuffledWrong // Indices to eliminate when user uses 50:50!
        };
      } else if (mode === 'india') {
        return {
          id: q.id,
          text: q.text || q.question,
          hint: q.hint,
          difficulty: q.difficulty,
          lat: q.lat,
          lng: q.lng
        };
      } else {
        return {
          id: q.id,
          text: q.text || q.question,
          hint: q.hint,
          difficulty: q.difficulty,
          lat: q.lat,
          lng: q.lng
        };
      }
    });

    return res.status(200).json({
      success: true,
      mode,
      source,
      total: clientSafeQuestions.length,
      questions: clientSafeQuestions
    });
  }

  // -------------------------------------------------------------
  // 2. POST /api/quiz (Server-side answer validation & grading)
  // -------------------------------------------------------------
  if (req.method === 'POST') {
    const { questionId, chosenAnswer, subMode } = req.body || {};

    if (!questionId) {
      return res.status(400).json({ error: 'Missing questionId' });
    }

    // A. Check Neon Postgres first if configured
    if (sql) {
      try {
        const rows = await sql`
          SELECT id, mode, question, options, answer_index, target_code, hint, fact, explanation
          FROM quiz_questions
          WHERE id = ${questionId}
          LIMIT 1;
        `;
        if (rows && rows.length > 0) {
          const row = rows[0];
          const options = typeof row.options === 'string' ? JSON.parse(row.options) : row.options;

          if (row.mode === 'kbc' || subMode === 'kbc') {
            const isCorrect = (parseInt(chosenAnswer, 10) === row.answer_index);
            return res.status(200).json({
              success: true,
              isCorrect,
              correctIndex: row.answer_index,
              correctAnswer: options ? options[row.answer_index] : null,
              explanation: row.explanation,
              source: 'neon_postgres'
            });
          } else if (row.mode === 'india' || subMode === 'india') {
            const isCorrect = (chosenAnswer === row.target_code || chosenAnswer === 'IN');
            return res.status(200).json({
              success: true,
              isCorrect,
              fact: row.fact,
              hint: row.hint,
              explanation: row.explanation,
              source: 'neon_postgres'
            });
          } else {
            const isCorrect = (chosenAnswer === row.target_code);
            return res.status(200).json({
              success: true,
              isCorrect,
              targetCode: row.target_code,
              explanation: row.explanation,
              source: 'neon_postgres'
            });
          }
        }
      } catch (dbErr) {
        console.warn('Neon DB validation query failed, falling back to local files:', dbErr.message);
      }
    }

    // B. Local In-Memory Fallback Validation
    let question = null;
    if (subMode === 'kbc') {
      question = KBC_QUIZ_BANK.find(q => q.id === questionId);
      if (!question) return res.status(404).json({ error: 'Question not found' });

      const isCorrect = (parseInt(chosenAnswer, 10) === question.answerIndex);
      return res.status(200).json({
        success: true,
        isCorrect,
        correctIndex: question.answerIndex,
        correctAnswer: question.options[question.answerIndex],
        explanation: question.explanation,
        source: 'local_bundled'
      });
    } else if (subMode === 'india') {
      question = INDIA_BATTLE_QUESTIONS.find(q => q.id === questionId);
      if (!question) return res.status(404).json({ error: 'Question not found' });

      const isCorrect = (chosenAnswer === question.stateCode || chosenAnswer === 'IN');
      return res.status(200).json({
        success: true,
        isCorrect,
        fact: question.fact,
        hint: question.hint,
        source: 'local_bundled'
      });
    } else {
      question = BATTLE_QUESTIONS.find(q => q.id === questionId);
      if (!question) return res.status(404).json({ error: 'Question not found' });

      const isCorrect = (chosenAnswer === question.targetCode);
      return res.status(200).json({
        success: true,
        isCorrect,
        targetCode: question.targetCode,
        source: 'local_bundled'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
