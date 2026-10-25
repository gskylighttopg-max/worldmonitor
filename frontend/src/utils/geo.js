export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function formatCoordinates(lat, lng, precision = 4) {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

export function parseCoordinates(str) {
  const match = str.match(/(-?\d+\.?\d*)\s*[, ]\s*(-?\d+\.?\d*)/);
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
  }
  return null;
}

export function bboxToCoords(bbox) {
  if (!bbox) return null;
  const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
  return { minLng, minLat, maxLng, maxLat };
}

export function coordsToBbox(minLng, minLat, maxLng, maxLat) {
  return `${minLng},${minLat},${maxLng},${maxLat}`;
}

export function getBoundsCenter(bbox) {
  const coords = bboxToCoords(bbox);
  if (!coords) return null;
  return {
    lat: (coords.minLat + coords.maxLat) / 2,
    lng: (coords.minLng + coords.maxLng) / 2
  };
}

export function getBoundsZoom(bbox, mapWidth, mapHeight) {
  const coords = bboxToCoords(bbox);
  if (!coords) return 1;
  
  const WORLD_DIM = { height: 256, width: 256 };
  const ZOOM_MAX = 21;
  
  function latRad(lat) {
    const sin = Math.sin(lat * Math.PI / 180);
    const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
    return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
  }
  
  const latFraction = (latRad(coords.maxLat) - latRad(coords.minLat)) / Math.PI;
  const lngDiff = coords.maxLng - coords.minLng;
  const lngFraction = ((lngDiff < 0 ? lngDiff + 360 : lngDiff) % 360) / 360;
  
  const latZoom = Math.floor(Math.log(mapWidth / 256 / lngFraction) / Math.LN2);
  const lngZoom = Math.floor(Math.log(mapHeight / 256 / latFraction) / Math.LN2);
  
  return Math.min(latZoom, lngZoom, ZOOM_MAX);
}