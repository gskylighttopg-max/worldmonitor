import { handleCors, corsHeaders } from './cors.js';
import { getKV } from './kv-client.js';
import { conflictRoute } from './routes/conflict.js';
import { oilRoute } from './routes/oil.js';
import { newsRoute } from './routes/news.js';
import { conflictsRoute } from './routes/conflicts.js';
import { webhookRoute } from './routes/webhook.js';
import { healthRoute } from './routes/health.js';

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCors(request);
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Route to appropriate handler
    try {
      let response;
      
      if (path === '/api/conflict' || path === '/api/conflict/') {
        response = await conflictRoute(request, env);
      } else if (path === '/api/oil' || path === '/api/oil/') {
        response = await oilRoute(request, env);
      } else if (path === '/api/news' || path === '/api/news/') {
        response = await newsRoute(request, env);
      } else if (path === '/api/conflicts' || path === '/api/conflicts/') {
        response = await conflictsRoute(request, env);
      } else if (path === '/webhook/rss' || path === '/webhook/rss/') {
        response = await webhookRoute(request, env);
      } else if (path === '/api/health' || path === '/health') {
        response = await healthRoute(request, env);
      } else {
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Add CORS headers to response
      const headers = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};