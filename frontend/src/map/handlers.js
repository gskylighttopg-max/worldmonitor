import maplibregl from 'maplibre-gl';
import { API_URL } from '../api.js';

export async function handleClusterClick(map, e, sourceId) {
  const clusterId = e.features[0].properties.cluster_id;
  const source = map.getSource(sourceId);
  
  if (!source) return;
  
  source.getClusterExpansionZoom(clusterId, (err, zoom) => {
    if (err) return;
    map.easeTo({ center: e.lngLat, zoom: zoom + 1 });
  });

  source.getClusterLeaves(clusterId, 10, 0, (err, features) => {
    if (err || !features.length) return;
    showClusterPopup(map, e.lngLat, features.map(f => f.properties));
  });
}

export async function handlePointClick(map, e, sourceId) {
  const props = e.features[0].properties;
  showArticlePopup(map, e.lngLat, props);
}

export async function handleCountryClick(map, e, apiUrl) {
  const country = e.features[0].properties;
  const isoCode = country.ISO_A2 || country.ISO_A3;
  const name = country.NAME || country.ADMIN;
  
  try {
    const res = await fetch(`${apiUrl}/api/news?country=${isoCode}&limit=20`);
    const { articles } = await res.json();
    showCountryPopup(map, e.lngLat, name, isoCode, articles);
  } catch (error) {
    console.error('Failed to fetch country news:', error);
    showCountryPopup(map, e.lngLat, name, isoCode, []);
  }
}

function showClusterPopup(map, lngLat, articles) {
  const html = `
    <div class="wm-popup cluster-popup">
      <h3>${articles.length} Articles</h3>
      <ul class="article-list">
        ${articles.map(a => `
          <li class="article-item">
            <a href="${a.url}" target="_blank" rel="noopener">
              <span class="article-title">${a.title}</span>
              <span class="article-source">${a.source}</span>
              <span class="article-time">${formatTime(a.published)}</span>
              ${a.sentiment !== undefined ? `<span class="sentiment ${sentimentClass(a.sentiment)}">${a.sentiment > 0 ? '▲' : a.sentiment < 0 ? '▼' : '●'}</span>` : ''}
            </a>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
  
  new maplibregl.Popup({ closeButton: true, maxWidth: '320px' })
    .setLngLat(lngLat)
    .setHTML(html)
    .addTo(map);
}

function showArticlePopup(map, lngLat, article) {
  const html = `
    <div class="wm-popup article-popup">
      <h3>${article.title}</h3>
      <div class="article-meta">
        <span class="source">${article.source}</span>
        <span class="time">${formatTime(article.published)}</span>
        ${article.conflictScore !== undefined ? `<span class="conflict-score">Conflict: ${(article.conflictScore * 100).toFixed(0)}%</span>` : ''}
      </div>
      ${article.description ? `<p class="description">${article.description}</p>` : ''}
      <a href="${article.url}" target="_blank" class="read-more">Read Full Article →</a>
    </div>
  `;
  
  new maplibregl.Popup({ closeButton: true, maxWidth: '400px' })
    .setLngLat(lngLat)
    .setHTML(html)
    .addTo(map);
}

function showCountryPopup(map, lngLat, name, isoCode, articles) {
  const conflictCount = articles.filter(a => a.conflictScore > 0.6).length;
  const sources = [...new Set(articles.map(a => a.source).filter(Boolean))].slice(0, 5);
  
  const html = `
    <div class="wm-popup country-popup">
      <h2>${name} (${isoCode})</h2>
      <div class="country-stats">
        <span class="stat"><strong>${articles.length}</strong> articles</span>
        <span class="stat conflict">${conflictCount} conflicting</span>
        <span class="stat sources">${sources.length} sources</span>
      </div>
      <div class="source-tags">
        ${sources.map(s => `<span class="tag">${s}</span>`).join('')}
      </div>
      <button class="view-all" onclick="window.location.href='/country/${isoCode}'">
        View All News →
      </button>
    </div>
  `;
  
  new maplibregl.Popup({ closeButton: true, maxWidth: '300px' })
    .setLngLat(lngLat)
    .setHTML(html)
    .addTo(map);
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  } catch {
    return '';
  }
}

function sentimentClass(sentiment) {
  if (sentiment > 0.2) return 'positive';
  if (sentiment < -0.2) return 'negative';
  return 'neutral';
}