import maplibregl from 'maplibre-gl';

export function addConflictLayer(map, sourceId, data) {
  if (!data || !data.features) {
    console.warn('No conflict data provided');
    return { onClusterClick: () => {}, onPointClick: () => {} };
  }

  const geojson = data.features ? data : { type: 'FeatureCollection', features: data };
  
  // Remove existing source/layer if exists
  if (map.getSource(sourceId)) {
    if (map.getLayer(`${sourceId}-clusters`)) map.removeLayer(`${sourceId}-clusters`);
    if (map.getLayer(`${sourceId}-cluster-count`)) map.removeLayer(`${sourceId}-cluster-count`);
    if (map.getLayer(`${sourceId}-unclustered`)) map.removeLayer(`${sourceId}-unclustered`);
    map.removeSource(sourceId);
  }

  map.addSource(sourceId, {
    type: 'geojson',
    data: geojson,
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50
  });

  // Cluster circles
  map.addLayer({
    id: `${sourceId}-clusters`,
    type: 'circle',
    source: sourceId,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'step', ['get', 'point_count'],
        '#51bbd6', 10,
        '#f1f075', 30,
        '#f28cb1', 100
      ],
      'circle-radius': [
        'step', ['get', 'point_count'],
        20, 10,
        30, 30,
        40, 100
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff'
    }
  });

  // Cluster count labels
  map.addLayer({
    id: `${sourceId}-cluster-count`,
    type: 'symbol',
    source: sourceId,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12,
      'text-allow-overlap': true
    },
    paint: {
      'text-color': '#fff',
      'text-halo-color': '#000',
      'text-halo-width': 1
    }
  });

  // Unclustered points
  map.addLayer({
    id: `${sourceId}-unclustered`,
    type: 'circle',
    source: sourceId,
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': [
        'match',
        ['get', 'severity'],
        -1, '#dc3545',
        -0.5, '#fd7e14',
        0, '#ffc107',
        0.5, '#20c997',
        1, '#28a745',
        '#6c757d'
      ],
      'circle-radius': 8,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff'
    }
  });

  return {
    onClusterClick: (e) => handleClusterClick(map, e, sourceId),
    onPointClick: (e) => handlePointClick(map, e, sourceId),
    updateData: (newData) => updateConflictLayer(map, sourceId, newData)
  };
}

function handleClusterClick(map, e, sourceId) {
  const clusterId = e.features[0].properties.cluster_id;
  const source = map.getSource(sourceId);
  
  source.getClusterExpansionZoom(clusterId, (err, zoom) => {
    if (err) return;
    map.easeTo({ center: e.lngLat, zoom: zoom + 1 });
  });

  source.getClusterLeaves(clusterId, 10, 0, (err, features) => {
    if (err || !features.length) return;
    showClusterPopup(map, e.lngLat, features.map(f => f.properties));
  });
}

function handlePointClick(map, e, sourceId) {
  const props = e.features[0].properties;
  showArticlePopup(map, e.lngLat, props);
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

function updateConflictLayer(map, sourceId, newData) {
  const source = map.getSource(sourceId);
  if (source) {
    source.setData(newData.features ? newData : { type: 'FeatureCollection', features: newData });
  }
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

export function updateConflictLayerExport(map, sourceId, data) {
  updateConflictLayer(map, sourceId, data);
}