import maplibregl from 'maplibre-gl';

const OIL_ICONS = {
  rig: '🛢️',
  refinery: '🏭',
  pipeline: '🔗',
  terminal: '📦',
  tanker: '🚢',
  platform: '🏗️'
};

export function addOilLayer(map, sourceId, data) {
  if (!data) {
    console.warn('No oil data provided');
    return { updateData: () => {} };
  }

  const geojson = {
    type: 'FeatureCollection',
    features: []
  };

  // Add rigs
  if (data.rigs) {
    data.rigs.forEach(r => {
      if (r.lat && r.lng) {
        geojson.features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
          properties: {
            type: 'rig',
            name: r.name || 'Oil Rig',
            operator: r.operator,
            status: r.status,
            country: r.country,
            icon: 'rig'
          }
        });
      }
    });
  }

  // Add refineries
  if (data.refineries) {
    data.refineries.forEach(r => {
      if (r.lat && r.lng) {
        geojson.features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
          properties: {
            type: 'refinery',
            name: r.name,
            capacity: r.capacity,
            operator: r.operator,
            country: r.country,
            icon: 'refinery'
          }
        });
      }
    });
  }

  // Add tankers from AIS data
  if (data.tankers) {
    data.tankers.forEach(t => {
      if (t.lat && t.lng) {
        geojson.features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [t.lng, t.lat] },
          properties: {
            type: 'tanker',
            name: t.name || 'Tanker',
            flag: t.flag,
            destination: t.destination,
            speed: t.speed,
            course: t.course,
            icon: 'tanker'
          }
        });
      }
    });
  }

  if (!map.getSource('oil')) {
    map.addSource('oil', {
      type: 'geojson',
      data: geojson,
      cluster: true,
      clusterMaxZoom: 12,
      clusterRadius: 40
    });

    // Cluster circles
    map.addLayer({
      id: 'oil-clusters',
      type: 'circle',
      source: 'oil',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#6c757d',
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
      id: 'oil-cluster-count',
      type: 'symbol',
      source: 'oil',
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

    // Oil icons
    map.addLayer({
      id: 'oil-icons',
      type: 'symbol',
      source: 'oil',
      filter: ['!', ['has', 'point_count']],
      layout: {
        'text-field': ['get', 'icon'],
        'text-font': ['Noto Sans'],
        'text-size': 16,
        'text-allow-overlap': true,
        'icon-allow-overlap': true
      }
    });

    // Oil details on hover
    map.on('mouseenter', 'oil-icons', (e) => {
      map.getCanvas().style.cursor = 'pointer';
      const props = e.features[0].properties;
      const html = `
        <div class="wm-popup oil-popup">
          <h4>${props.name}</h4>
          <p><strong>Type:</strong> ${props.type}</p>
          ${props.operator ? `<p><strong>Operator:</strong> ${props.operator}</p>` : ''}
          ${props.capacity ? `<p><strong>Capacity:</strong> ${props.capacity}</p>` : ''}
          ${props.status ? `<p><strong>Status:</strong> ${props.status}</p>` : ''}
          ${props.country ? `<p><strong>Country:</strong> ${props.country}</p>` : ''}
        </div>
      `;
      new maplibregl.Popup({ closeButton: true, maxWidth: '250px' })
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map);
    });

    map.on('mouseleave', 'oil-icons', () => {
      map.getCanvas().style.cursor = '';
      const popups = document.querySelectorAll('.maplibregl-popup');
      popups.forEach(p => p.remove());
    });
  }

  if (map.getSource('oil')) {
    map.getSource('oil').setData(geojson);
  }

  return {
    updateData: (newData) => updateOilLayer(map, newData)
  };
}

function updateOilLayer(map, newData) {
  const geojson = { type: 'FeatureCollection', features: [] };
  
  if (newData?.rigs) {
    newData.rigs.forEach(r => {
      if (r.lat && r.lng) {
        geojson.features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
          properties: { type: 'rig', name: r.name, operator: r.operator, status: r.status, icon: 'rig' }
        });
      }
    });
  }
  
  if (newData?.tankers) {
    newData.tankers.forEach(t => {
      if (t.lat && t.lng) {
        geojson.features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [t.lng, t.lat] },
          properties: { type: 'tanker', name: t.name, flag: t.flag, destination: t.destination, icon: 'tanker' }
        });
      }
    });
  }
  
  if (map.getSource('oil')) {
    map.getSource('oil').setData(geojson);
  }
}

export function updateOilLayerExport(map, data) {
  updateOilLayer(map, data);
}