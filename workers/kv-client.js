export async function getKV(env, key, parseJson = true) {
  try {
    const value = await env.NEWS_KV.get(key, parseJson ? 'json' : 'text');
    return value;
  } catch (error) {
    console.error(`KV get failed for ${key}:`, error);
    return null;
  }
}

export async function putKV(env, key, value, expirationTtl = null) {
  try {
    const options = {};
    if (expirationTtl) {
      options.expirationTtl = expirationTtl;
    }
    const value = typeof value === 'string' ? value : JSON.stringify(value);
    await env.NEWS_KV.put(key, value, options);
    return true;
  } catch (error) {
    console.error(`KV put failed for ${key}:`, error);
    return false;
  }
}

export async function getKVRaw(env, key) {
  return getKV(env, key, false);
}