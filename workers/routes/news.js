export async function newsRoute(request, env) {
  const url = new URL(request.url);
  const domain = url.searchParams.get('domain');
  const country = url.searchParams.get('country');
  const query = url.searchParams.get('q');
  const limit = parseInt(url.searchParams.get('limit')) || 100;
  const source = url.searchParams.get('source');

  const sources = ['newsapi', 'gnews', 'reddit', 'rss', 'oil'];
  const allNews = [];

  for (const src of sources) {
    const key = `news:${src}`;
    const data = await getKV(key);
    if (data) {
      allNews.push(...data.map(item => ({ ...item, sourceType: src })));
    }
  }

  let filtered = allNews;

  // Filter by country
  if (country) {
    filtered = filtered.filter(item => {
      const text = `${item.title} ${item.description || ''} ${item.summary || ''}`.toLowerCase();
      return text.includes(country.toLowerCase());
    });
  }

  // Filter by query
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(item => 
      item.title?.toLowerCase().includes(q) || 
      item.description?.toLowerCase().includes(q) ||
      item.summary?.toLowerCase().includes(q)
    );
  }

  // Filter by source
  if (source) {
    filtered = filtered.filter(item => item.source === source || item.sourceType === source);
  }

  // Sort by date (newest first)
  filtered.sort((a, b) => {
    const da = new Date(a.published || a.publishedAt || 0);
    const db = new Date(b.published || b.publishedAt || 0);
    return db - da;
  });

  // Limit results
  filtered = filtered.slice(0, limit);

  // Group by source for meta
  const bySource = {};
  allNews.forEach(item => {
    bySource[item.sourceType] = (bySource[item.sourceType] || 0) + 1;
  });

  return new Response(JSON.stringify({
    articles: filtered,
    meta: {
      total: filtered.length,
      bySource,
      lastUpdated: new Date().toISOString()
    }
  }), {
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