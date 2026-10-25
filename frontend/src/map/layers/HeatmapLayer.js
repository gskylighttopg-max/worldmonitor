import maplibregl from 'maplibre-gl';

export function addHeatmapLayer(map, sourceId, data, options = {}) {
  const {
    weightProperty = 'severity',
    radius = 30,
    intensity = 1,
    opacity = 0.6,
    colorStops = [
      [0, 'rgba(33,102,172,0)'],
      [0.2, 'rgb(103,169,207)'],
      [0.4, 'rgb(209,229,228)'],
      [0.6, 'rgb(253,219,199)'],
      [0.8, 'rgb(244,165,130)'],
      [1, 'rgb(215,48,39)']
    ]
  } = options;

  if (!data || !data.features) {
    console.warn('No data for heatmap');
    return { updateData: function() {} };
  }

  var geojson = {
    type: 'FeatureCollection',
    features: data.features
      .filter(function(f) { return f.geometry && f.geometry.coordinates; })
      .map(function(f) {
        return {
          ...f,
          properties: {
            ...f.properties,
            weight: f.properties[weightProperty] || 1
          }
        };
      })
  };

  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: 'geojson',
      data: geojson
    });

    map.addLayer({
      id: sourceId,
      type: 'heatmap',
      source: sourceId,
      paint: {
        'heatmap-weight': ['get', 'weight'],
        'heatmap-intensity': intensity,
        'heatmap-radius': radius,
        'heatmap-opacity': opacity,
        'heatmap-color': colorStops
      }
    });
  }

  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData({
      type: 'FeatureCollection',
      features: data.features
        .filter(function(f) { return f.geometry && f.geometry.coordinates; })
        .map(function(f) {
          return {
            ...f,
            properties: {
              ...f.properties,
              weight: f.properties[weightProperty] || 1
            }
          };
        })
    });
  }

  return {
    updateData: function(newData) { return updateHeatmapLayer(map, sourceId, newData, options); },
    setIntensity: function(intensity) {
      if (map.getLayer(sourceId)) {
        map.setPaintProperty(sourceId, 'heatmap-intensity', intensity);
      }
    },
    setRadius: function(radius) {
      if (map.getLayer(sourceId)) {
        map.setPaintProperty(sourceId, 'heatmap-radius', radius);
      }
    }
  };
}

function updateHeatmapLayer(map, sourceId, newData, options) {
  var weightProperty = options && options.weightProperty ? options.weightProperty : 'severity';
  
  var geojson = {
    type: 'FeatureCollection',
    features: newData.features
      .filter(function(f) { return f.geometry && f.geometry.coordinates; })
      .map(function(f) {
        return {
          ...f,
          properties: {
            ...f.properties,
            weight: f.properties[weightProperty] || 1
          }
        };
      })
  };

  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData(geojson);
  }
}

export function updateHeatmapLayerExport(map, sourceId, data, options) {
  updateHeatmapLayer(map, sourceId, data, options);
}