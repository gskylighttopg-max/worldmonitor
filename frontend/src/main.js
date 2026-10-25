import { MapLibreMap } from './map/MapLibreMap.js';
import { API_URL } from './api.js';

async function initApp() {
  try {
    const map = new MapLibreMap('map', {
      center: [0, 20],
      zoom: 1.5,
      style: 'https://demotiles.maplibre.org/style.json'
    });

    // Load initial data
    await loadAllData(map);
    
    // Start smart polling
    startSmartPolling(map);
    
    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        loadAllData(map);
      }
    });
    
    window.map = map;
    console.log('World Monitor initialized');
  } catch (error) {
    console.error('Failed to initialize app:', error);
    document.getElementById('app').innerHTML = `
      <div style="padding: 20px; text-align: center; color: #dc3545;">
        <h2>Failed to initialize</h2>
        <p>${error.message}</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  }
}

async function loadAllData(map) {
  try {
    const [conflicts, oil, news] = await Promise.all([
      fetch(`${API_URL}/api/conflict`).then(r => r.json()),
      fetch(`${API_URL}/api/oil?type=infrastructure`).then(r => r.json()),
      fetch(`${API_URL}/api/news`).then(r => r.json())
    ]);
    
    if (window.conflictLayer) {
      window.conflictLayer.updateData(conflicts);
    } else {
      window.conflictLayer = map.addConflictLayer(conflicts);
    }
    
    if (window.oilLayer) {
      window.oilLayer.updateData(oil);
    } else {
      window.oilLayer = map.addOilLayer(oil);
    }
    
    if (window.newsLayer) {
      window.newsLayer.updateData(news);
    } else {
      window.newsLayer = map.addNewsLayer(news);
    }
    
    updateLastUpdated();
  } catch (error) {
    console.error('Failed to load data:', error);
  }
}

function startSmartPolling(map) {
  let pollInterval = 30000;
  
  async function poll() {
    if (document.hidden) return;
    
    try {
      const data = await fetch(`${API_URL}/api/conflict`).then(r => r.json());
      const hasBreaking = data.features?.some(f => f.properties.breaking === true);
      
      if (window.conflictLayer) {
        window.conflictLayer.updateData(data);
      }
      
      if (hasBreaking) {
        pollInterval = 10000;
      } else if (data.features?.length === 0) {
        pollInterval = 60000;
      } else {
        pollInterval = 30000;
      }
      
      updateLastUpdated();
    } catch (error) {
      console.error('Poll error:', error);
    }
    
    setTimeout(poll, pollInterval);
  }
  
  poll();
  
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) poll();
  });
}

function updateLastUpdated() {
  const el = document.getElementById('last-updated');
  if (el) {
    el.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
  }
}

initApp();