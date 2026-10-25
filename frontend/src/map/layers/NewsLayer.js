import maplibregl from 'maplibre-gl';

export function addNewsLayer(map, sourceId, data) {
  if (!data || !data.articles) {
    console.warn('No news data provided');
    return { updateData: () => {} };
  }

  const geojson = {
    type: 'FeatureCollection',
    features: data.articles
      .filter(a => a.lat && a.lng)
      .map(a => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [a.lng, a.lat] },
        properties: {
          id: a.id,
          title: a.title,
          url: a.url,
          source: a.source,
          published: a.published,
          sentiment: a.sentiment,
          description: a.description,
          icon: '📰'
        }
      })
  };

  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: 'geojson',
      data: geojson,
      cluster: true,
      clusterMaxZoom: 12,
      clusterRadius: 40
    });

    // News clusters
    map.addLayer({
      id: `${sourceId}-clusters`,
      type: 'circle',
      source: sourceId,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#17a2b8',
        'circle-radius': [
          'step', ['get', 'point_count'],
          18, 10,
          24, 30,
          30, 100
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    });

    map.addLayer({
      id: `${sourceId}-cluster-count`,
      type: 'symbol',
      source: sourceId,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 11
      },
      paint: {
        'text-color': '#fff',
        'text-halo-color': '#000',
        'text-halo-width': 1
      }
    });

    // News icons
    map.addLayer({
      id: `${sourceId}-unclustered`,
      type: 'symbol',
      source: sourceId,
      filter: ['!', ['has', 'point_count']],
      layout: {
        'text-field': '📰',
        'text-font': ['Noto Sans'],
        'text-size': 14,
        'text-allow-overlap': true
      }
    });

    // Click handlers
    map.on('click', `${sourceId}-unclustered`, (e) => {
      const props = e.features[0].properties;
      showNewsPopup(e.originalEvent.target, e.lngLat, props);
    });

    map.on('click', `${sourceId}-clusters`, (e) => {
      const source = map.getSource(sourceId);
      const clusterId = e.features[0].properties.cluster_id;
      
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (!err) map.easeTo({ center: e.lngLat, zoom: zoom + 1 });
      });

      source.getClusterLeaves(clusterId, 10, 0, (err, features) => {
        if (!err && features.length) {
          showClusterNewsPopup(e.originalEvent.target, e.lngLat, features.map(f => f.properties));
        }
      });
    });

    // Hover effects
    ['news-unclustered', 'news-clusters'].forEach(layer => {
      map.on('mouseenter', layer, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', layer, () => {
        map.getCanvas().style.cursor = '';
      });
    });
  }

  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData({
      type: 'FeatureCollection',
      features: data.articles
        .filter(a => a.lat && a.lng)
        .map(a => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [a.lng, a.lat] },
          properties: {
            id: a.id,
            title: a.title,
            url: a.url,
            source: a.source,
            published: a.published,
            sentiment: a.sentiment,
            description: a.description,
            icon: '📰'
          }
        })
    });
  }

  return {
    updateData: (newData) => updateNewsLayer(map, sourceId, newData)
  };
}

function showNewsPopup(map, lngLat, article) {
  const html = `
    <div class="wm-popup article-popup">
      <h3>${article.title}</h3>
      <div class="article-meta">
        <span class="source">${article.source}</span>
        <span class="time">${formatTime(article.published)}</span>
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

function showClusterNewsPopup(map, lngLat, articles) {
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

function updateNewsLayer(map, sourceId, newData) {
  const geojson = {
    type: 'FeatureCollection',
    features: newData.articles
      .filter(a => a.lat && a.lng)
      .map(a => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [a.lng, a.lat] },
        properties: {
          id: a.id,
          title: a.title,
          url: a.url,
          source: a.source,
          published: a.published,
          sentiment: a.sentiment,
          description: a.description,
          icon: '📰'
        }
      })
  };

  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData(geojson);
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

export function updateNewsLayerExport(map, sourceId, data) {
  updateNewsLayer(map, sourceId, data);
}