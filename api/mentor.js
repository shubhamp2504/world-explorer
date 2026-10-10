// api/mentor.js
// Vercel Serverless Function: High-Speed AI Geography & History Mentor
// Powered by Groq LPU (Llama 3.1 8B Instant) with sub-300ms inference
// Delivers authentic, NCERT/UPSC syllabus-aligned explanations and memorable curiosity hooks.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, chosenAnswer, correctAnswer, explanation, category } = req.body || {};

  if (!question || !correctAnswer) {
    return res.status(400).json({ error: 'Missing required question details' });
  }

  const groqApiKey = process.env.GROQ_API_KEY;

  // If GROQ_API_KEY is not yet provided, return a zero-latency curated fallback
  if (!groqApiKey) {
    return res.status(200).json({
      success: true,
      source: 'curated_fallback',
      mentorInsight: explanation || `The correct answer is ${correctAnswer}. This is an essential geographical concept covered in standard NCERT / UPSC curriculum.`,
      hook: `Did you know? Understanding the geological formations and geographic landmarks helps connect physical terrain with historical trade routes.`
    });
  }

  try {
    const prompt = `You are an elite UPSC & MPSC Geography and History Master Mentor.
A student just answered a question:
Question: "${question}"
Category: "${category || 'Geography & History'}"
User's Answer: "${chosenAnswer || 'Missed'}"
Correct Answer: "${correctAnswer}"
Reference Fact: "${explanation || ''}"

Respond in JSON format with exactly two concise fields:
1. "mentorInsight": A clear, punchy, 2-sentence explanation of WHY the correct answer is right and the underlying geographic/historical mechanism (strictly factual, NCERT/UPSC level).
2. "hook": One fascinating "Did you know?" curiosity fact or memory anchor connecting this location or concept.

Do NOT include markdown formatting or greetings. Output valid JSON only.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are an authentic UPSC/MPSC geography teacher. You only output valid JSON with keys "mentorInsight" and "hook".' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 220,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Groq API returned error:', response.status, errText);
      return res.status(200).json({
        success: true,
        source: 'curated_fallback',
        mentorInsight: explanation || `The correct answer is ${correctAnswer}.`,
        hook: `Remember this key fact for your next UPSC/MPSC quiz round!`
      });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '{}';
    let parsed = {};
    try {
      parsed = JSON.parse(rawContent);
    } catch (e) {
      parsed = { mentorInsight: rawContent, hook: '' };
    }

    return res.status(200).json({
      success: true,
      source: 'groq_llama_3.1_8b',
      mentorInsight: parsed.mentorInsight || explanation,
      hook: parsed.hook || ''
    });
  } catch (err) {
    console.error('Mentor endpoint error:', err);
    return res.status(200).json({
      success: true,
      source: 'curated_fallback',
      mentorInsight: explanation || `The correct answer is ${correctAnswer}.`,
      hook: ''
    });
  }
}
