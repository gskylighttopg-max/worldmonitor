export function dedupe(items, keyFn = item => item.id || item.url || item.guid) {
  const seen = new Set();
  return items.filter(item => {
    const key = keyFn(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function clusterConflicts(items, maxDistanceKm = 50, timeWindowHours = 6) {
  const clusters = [];
  const used = new Set();
  
  for (let i = 0; i < items.length; i++) {
    if (used.has(i)) continue;
    
    const cluster = [items[i]];
    used.add(i);
    
    for (let j = i + 1; j < items.length; j++) {
      if (used.has(j)) continue;
      
      // Time proximity
      const t1 = new Date(items[i].published || items[i].publishedAt || 0);
      const t2 = new Date(items[j].published || items[j].publishedAt || 0);
      if (Math.abs(t1 - t2) > timeWindowHours * 3600 * 1000) continue;
      
      // Geographic proximity
      const lat1 = items[i].lat || items[i].latitude;
      const lng1 = items[i].lng || items[i].longitude;
      const lat2 = items[j].lat || items[j].latitude;
      const lng2 = items[j].lng || items[j].longitude;
      
      if (lat1 && lng1 && lat2 && lng2) {
        const dist = haversine(lat1, lng1, lat2, lng2);
        if (dist <= maxDistanceKm) {
          cluster.push(items[j]);
          used.add(j);
        }
      }
    }
    
    if (cluster.length > 1) {
      clusters.push(cluster);
    }
  }
  
  return clusters;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function normalizeUrl(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    const params = new URLSearchParams(u.search);
    const tracking = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
                      'fbclid', 'gclid', 'ref', 'source', 'amp'];
    tracking.forEach(p => params.delete(p));
    u.search = params.toString();
    return u.toString();
  } catch {
    return url;
  }
}

export function simHash(text, bits = 64) {
  if (!text) return '0'.repeat(bits / 4);
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const hash = Array(bits).fill(0);
  
  for (const word of words) {
    let h = 0;
    for (let i = 0; i < word.length; i++) {
      h = ((h << 5) - h) + word.charCodeAt(i);
      h |= 0;
    }
    for (let i = 0; i < bits; i++) {
      hash[i] += (h >> i) & 1 ? 1 : -1;
    }
  }
  
  return hash.map(v => v > 0 ? '1' : '0').join('');
}

export function clusterBySimHash(items, threshold = 0.85) {
  const hashes = items.map(item => ({
    ...item,
    hash: simHash(item.title || '')
  }));
  
  const clusters = [];
  const used = new Set();
  
  for (let i = 0; i < hashes.length; i++) {
    if (used.has(i)) continue;
    const cluster = [hashes[i]];
    used.add(i);
    
    for (let j = i + 1; j < hashes.length; j++) {
      if (used.has(j)) continue;
      const similarity = hammingSimilarity(hashes[i].hash, hashes[j].hash);
      if (similarity >= threshold) {
        cluster.push(hashes[j]);
        used.add(j);
      }
    }
    clusters.push(cluster.map(c => ({ ...c, hash: undefined })));
  }
  
  return clusters;
}

function hammingSimilarity(a, b) {
  if (a.length !== b.length) return 0;
  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) matches++;
  }
  return matches / a.length;
}