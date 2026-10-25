export async function oilRoute(request, env) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'all';
  const limit = parseInt(url.searchParams.get('limit')) || 1000;

  const types = ['wti', 'brent', 'inventory', 'rigs', 'production', 'natural_gas_storage', 'natural_gas_price', 'electricity', 'yahoo', 'rigs_bh'];
  const data = {};

  for (const t of types) {
    const key = t === 'yahoo' ? 'oil_yahoo' : t === 'rigs_bh' ? 'oil_rigs' : `oil:${t}`;
    const val = await getKV(key);
    if (val) {
      data[t] = val;
    }
  }

  // Process based on type
  let responseData;
  if (type === 'price' || type === 'all') {
    responseData = {
      wti: data.wti?.slice(-100) || [],
      brent: data.brent?.slice(-100) || [],
      latest: {
        wti: data.wti?.[data.wti.length - 1] || null,
        brent: data.brent?.[data.brent.length - 1] || null
      }
    };
  } else if (type === 'inventory') {
    responseData = { inventory: data.inventory?.slice(-100) || [] };
  } else if (type === 'rigs') {
    responseData = { 
      eia: data.rigs?.slice(-100) || [],
      baker_hughes: data.rigs_bh?.slice(-100) || []
    };
  } else if (type === 'production') {
    responseData = { production: data.production?.slice(-100) || [] };
  } else if (type === 'infrastructure') {
    responseData = {
      rigs: data.rigs_bh?.slice(-100) || [],
      production: data.production?.slice(-100) || []
    };
  } else {
    responseData = data;
  }

  return new Response(JSON.stringify({
    data: responseData,
    meta: {
      types: Object.keys(data),
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