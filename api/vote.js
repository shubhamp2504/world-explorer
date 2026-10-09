// api/vote.js
// Vercel Serverless Function: Atomically record a vote in Upstash Redis

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

  const { placeId } = req.body || {};

  if (!placeId || typeof placeId !== 'string') {
    return res.status(400).json({ error: 'Invalid place ID' });
  }

  try {
    const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (redisUrl && redisToken) {
      // Execute atomic HINCRBY in Redis
      const response = await fetch(`${redisUrl}/hincrby/we:place_votes/${encodeURIComponent(placeId)}/1`, {
        headers: { Authorization: `Bearer ${redisToken}` }
      });
      const data = await response.json();
      const updatedVotes = data.result || 0;

      return res.status(200).json({
        success: true,
        placeId,
        votes: updatedVotes,
        persisted: 'redis'
      });
    }

    // Graceful acknowledgement if Redis is not yet linked
    return res.status(200).json({
      success: true,
      placeId,
      persisted: 'local_only',
      message: 'Vote accepted locally (Link Upstash Redis in Vercel to sync globally)'
    });
  } catch (error) {
    console.error('Error recording vote:', error);
    return res.status(500).json({ error: 'Failed to record vote' });
  }
}
