export async function conflictRoute(request, env) {
  const url = new URL(request.url);
  const bbox = url.searchParams.get('bbox');
  const zoom = parseInt(url.searchParams.get('zoom')) || 3;
  const since = url.searchParams.get('since');
  const limit = parseInt(url.searchParams.get('limit')) || 5000;

  const data = await getKV('conflict:gdelt');
  
  if (!data) {
    return new Response(JSON.stringify({ 
      type: 'FeatureCollection', 
      features: [],
      meta: { error: 'No data available', lastUpdated: null }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let features = data;
  
  // Filter by bounding box if provided
  if (bbox) {
    const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
    features = features.filter(f => {
      const lat = f.lat || f.latitude;
      const lng = f.lng || f.longitude;
      return lat && lng && lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
    });
  }

  // Filter by time if provided
  if (since) {
    const sinceDate = new Date(since);
    features = features.filter(f => {
      const pub = f.published || f.publishedAt;
      return pub && new Date(pub) >= sinceDate;
    });
  }

  // Limit results
  features = features.slice(0, limit);

  // Convert to GeoJSON
  const geojson = {
    type: 'FeatureCollection',
    features: features.map(f => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [f.lng || f.longitude, f.lat || f.latitude]
      },
      properties: {
        id: f.id,
        title: f.title,
        url: f.url,
        source: f.source,
        published: f.published,
        severity: f.severity || f.sentiment,
        actors: f.actors || [f.actor1, f.actor2].filter(Boolean),
        themes: f.themes,
        conflictScore: f.conflictScore
      }
    })),
    meta: {
      total: features.length,
      lastUpdated: new Date().toISOString()
    }
  };

  return new Response(JSON.stringify(geojson), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' }
  });
}

async function getKV(env, key) {
  try {
    return await env.NEWS_KV.get(key, 'json');
  } catch {
    return null;
  }
}