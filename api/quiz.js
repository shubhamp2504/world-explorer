// api/quiz.js
// Vercel Serverless Function: Secure Dynamic Question Engine & Anti-Cheat Validation
// GET /api/quiz?mode=india|world|kbc : Delivers 10 randomized questions with answer choices WITHOUT exposing answerIndex to the browser!
// POST /api/quiz : Validates answers server-side and returns score + authentic UPSC/MPSC explanations.

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // -------------------------------------------------------------
  // 1. GET /api/quiz?mode=india|world|kbc
  // -------------------------------------------------------------
  if (req.method === 'GET') {
    const mode = (req.query.mode || 'world').toLowerCase();
    let pool = [];

    if (mode === 'india') {
      pool = INDIA_BATTLE_QUESTIONS;
    } else if (mode === 'kbc') {
      pool = KBC_QUIZ_BANK;
    } else {
      pool = BATTLE_QUESTIONS;
    }

    const shuffled = shuffle(pool).slice(0, 10);

    // Sanitize questions: DO NOT SEND answerIndex OR targetCode to prevent DevTools cheating
    const clientSafeQuestions = shuffled.map(q => {
      if (mode === 'kbc') {
        return {
          id: q.id,
          question: q.question,
          options: q.options,
          category: q.category,
          difficulty: q.difficulty
        };
      } else if (mode === 'india') {
        return {
          id: q.id,
          text: q.text,
          hint: q.hint,
          difficulty: q.difficulty,
          lat: q.lat,
          lng: q.lng
        };
      } else {
        return {
          id: q.id,
          text: q.text,
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
      total: clientSafeQuestions.length,
      questions: clientSafeQuestions
    });
  }

  // -------------------------------------------------------------
  // 2. POST /api/quiz (Server-side validation)
  // -------------------------------------------------------------
  if (req.method === 'POST') {
    const { questionId, chosenAnswer, subMode } = req.body || {};

    if (!questionId) {
      return res.status(400).json({ error: 'Missing questionId' });
    }

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
        explanation: question.explanation
      });
    } else if (subMode === 'india') {
      question = INDIA_BATTLE_QUESTIONS.find(q => q.id === questionId);
      if (!question) return res.status(404).json({ error: 'Question not found' });

      const isCorrect = (chosenAnswer === 'IN');
      return res.status(200).json({
        success: true,
        isCorrect,
        fact: question.fact,
        hint: question.hint
      });
    } else {
      question = BATTLE_QUESTIONS.find(q => q.id === questionId);
      if (!question) return res.status(404).json({ error: 'Question not found' });

      const isCorrect = (chosenAnswer === question.targetCode);
      return res.status(200).json({
        success: true,
        isCorrect,
        targetCode: question.targetCode
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
