export async function webhookRoute(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Verify secret token
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (token !== env.WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const payload = await request.json();
    
    // RSSHub sends: { items: [...] }
    const items = payload.items || payload;
    
    if (!Array.isArray(items)) {
      return new Response('Invalid payload', { status: 400 });
    }

    // Transform and deduplicate
    const existing = await env.NEWS_KV.get('news:rss', 'json') || [];
    const existingIds = new Set(existing.map(i => i.id || i.url));
    
    const newItems = items
      .map(item => ({
        id: item.guid || item.link || item.url,
        title: item.title,
        url: item.link || item.url,
        published: item.pubDate || item.published,
        source: item.source || item.feedTitle || 'RSS',
        summary: item.contentSnippet || item.summary || item.description,
        tags: item.categories || item.tags,
        raw: item
      }))
      .filter(item => item.id && !existingIds.has(item.id))
      .filter(Boolean);

    if (newItems.length > 0) {
      // Merge with existing (keep latest 1000)
      const merged = [...newItems, ...existing].slice(0, 1000);
      await env.NEWS_KV.put('news:rss', JSON.stringify(merged));
    }

    return new Response(JSON.stringify({ 
      received: items.length,
      new: newItems.length,
      total: (await env.NEWS_KV.get('news:rss', 'json'))?.length || 0
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}