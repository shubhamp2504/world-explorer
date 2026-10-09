// api/favorites.js
// Vercel Serverless Function: Get global favorites with Redis caching + authentic fallback

import { INITIAL_FAVORITES } from '../src/data/favorites.js';

export default async function handler(req, res) {
  // CORS & Cache headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=59');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    // If Upstash Redis is connected in Vercel
    if (redisUrl && redisToken) {
      // Fetch dynamic votes and custom submitted places from Upstash Redis REST API
      const votesRes = await fetch(`${redisUrl}/hgetall/we:place_votes`, {
        headers: { Authorization: `Bearer ${redisToken}` }
      });
      const votesData = await votesRes.json();
      const liveVotes = votesData.result || {};

      const customRes = await fetch(`${redisUrl}/get/we:custom_places`, {
        headers: { Authorization: `Bearer ${redisToken}` }
      });
      const customData = await customRes.json();
      const customPlaces = customData.result ? JSON.parse(customData.result) : [];

      const merged = [...INITIAL_FAVORITES, ...customPlaces].map(place => {
        const dynamicVote = liveVotes[place.id] ? parseInt(liveVotes[place.id], 10) : 0;
        return {
          ...place,
          votes: Math.max(place.votes || 0, dynamicVote)
        };
      });

      return res.status(200).json({
        success: true,
        source: 'redis_cloud',
        favorites: merged
      });
    }

    // Fallback if Redis credentials are not yet configured
    return res.status(200).json({
      success: true,
      source: 'initial_catalog',
      favorites: INITIAL_FAVORITES
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return res.status(200).json({
      success: true,
      source: 'fallback_error',
      favorites: INITIAL_FAVORITES
    });
  }
}
