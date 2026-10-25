export async function healthRoute(request, env) {
  const lastIngest = await env.NEWS_KV.get('meta:lastIngest', 'json');
  const rsshub = await env.NEWS_KV.get('meta:rsshub', 'json');
  
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    lastIngest: lastIngest?.timestamp || null,
    rsshub: rsshub?.status || 'unknown',
    worker: 'ok'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}