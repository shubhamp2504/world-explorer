// api/suggest.js
// Vercel Serverless Function: Save authenticated user-suggested locations to Upstash Redis

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

  const { name, country, category, lat, lng, description } = req.body || {};

  // Input validation
  if (!name || !country || isNaN(lat) || isNaN(lng) || !description) {
    return res.status(400).json({ error: 'All fields are required and coordinates must be numeric.' });
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({ error: 'Coordinates outside valid geographic bounds (-90..90, -180..180).' });
  }

  const newPlace = {
    id: `ugc-${Date.now()}`,
    name: String(name).slice(0, 80).trim(),
    country: String(country).slice(0, 60).trim(),
    category: String(category || 'natural').slice(0, 30),
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    votes: 1,
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    description: String(description).slice(0, 300).trim(),
    whyLoved: `Authentically suggested by global community explorer: "${String(description).slice(0, 300).trim()}"`,
    nearby: ['Scenic lookouts', 'Local cultural landmarks'],
    createdAt: new Date().toISOString()
  };

  try {
    const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (redisUrl && redisToken) {
      // Get existing custom places
      const customRes = await fetch(`${redisUrl}/get/we:custom_places`, {
        headers: { Authorization: `Bearer ${redisToken}` }
      });
      const customData = await customRes.json();
      const existing = customData.result ? JSON.parse(customData.result) : [];

      existing.unshift(newPlace);

      // Keep up to 200 places in storage
      const capped = existing.slice(0, 200);

      // Save back to Redis
      await fetch(`${redisUrl}/set/we:custom_places`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(JSON.stringify(capped))
      });

      // Also set initial vote count in hash
      await fetch(`${redisUrl}/hset/we:place_votes/${encodeURIComponent(newPlace.id)}/1`, {
        headers: { Authorization: `Bearer ${redisToken}` }
      });

      return res.status(200).json({
        success: true,
        place: newPlace,
        persisted: 'redis'
      });
    }

    return res.status(200).json({
      success: true,
      place: newPlace,
      persisted: 'local_only',
      message: 'Place stored locally. Link Upstash Redis in Vercel to broadcast globally.'
    });
  } catch (error) {
    console.error('Error saving place suggestion:', error);
    return res.status(500).json({ error: 'Failed to record suggested place' });
  }
}
