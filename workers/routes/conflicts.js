import { dedupe, clusterConflicts } from '../utils/dedupe.js';

export async function conflictsRoute(request, env) {
  const url = new URL(request.url);
  const minScore = parseFloat(url.searchParams.get('minScore')) || 0.6;
  const limit = parseInt(url.searchParams.get('limit')) || 100;

  const conflictData = await getKV('conflict:gdelt');
  if (!conflictData) {
    return new Response(JSON.stringify({ conflicts: [], meta: { error: 'No conflict data' } }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Simple conflict detection based on narrative divergence
  const conflicts = detectConflicts(conflictData, minScore);
  
  return new Response(JSON.stringify({
    conflicts: conflicts.slice(0, limit),
    meta: {
      total: conflicts.length,
      minScore,
      lastUpdated: new Date().toISOString()
    }
  }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age: 60' }
  });
}

function detectConflicts(events, minScore) {
  // Group events by location proximity and time window
  const clusters = clusterEvents(events, 50, 6);
  
  const conflicts = [];
  
  for (const cluster of clusters) {
    if (cluster.length < 2) continue;
    
    // Analyze narrative divergence
    const sources = [...new Set(cluster.map(e => e.source || e.domain).filter(Boolean))];
    const sentiments = cluster.map(e => e.sentiment || e.tone || 0).filter(s => s !== 0);
    const themes = cluster.flatMap(e => e.themes || []);
    
    // Simple conflict scoring
    const sourceDiversity = sources.length / Math.max(cluster.length, 1);
    const sentimentVariance = sentiments.length > 1 ? 
      Math.max(...sentiments) - Math.min(...sentiments) : 0;
    const themeOverlap = themes.length > 0 ? 
      new Set(themes).size / themes.length : 0;
    
    const conflictScore = (
      sourceDiversity * 0.4 + 
      (sentimentVariance / 2) * 0.4 + 
      (1 - themeOverlap) * 0.2
    );
    
    if (conflictScore >= minScore) {
      conflicts.push({
        id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        location: {
          lat: cluster[0].lat || cluster[0].latitude,
          lng: cluster[0].lng || cluster[0].longitude
        },
        country: cluster[0].country || cluster[0].source_country,
        sources: sources,
        articles: cluster.map(e => ({
          title: e.title,
          url: e.url,
          source: e.source,
          published: e.published,
          sentiment: e.sentiment
        })),
        conflictScore: Math.round(conflictScore * 100) / 100,
        dominantNarratives: extractNarratives(cluster),
        summary: generateSummary(cluster)
      });
    }
  }
  
  return conflicts.sort((a, b) => b.conflictScore - a.conflictScore);
}

function extractNarratives(cluster) {
  const themes = cluster.flatMap(e => e.themes || []);
  const themeCounts = {};
  themes.forEach(t => themeCounts[t] = (themeCounts[t] || 0) + 1);
  return Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme, count]) => ({ theme, count }));
}

function generateSummary(cluster) {
  const titles = cluster.map(e => e.title).slice(0, 3);
  const sources = [...new Set(cluster.map(e => e.source).filter(Boolean))];
  return `${cluster.length} sources (${sources.join(', ')}) report on: ${titles.join('; ')}`;
}

async function getKV(env, key) {
  try {
    return await env.NEWS_KV.get(key, 'json');
  } catch {
    return null;
  }
}