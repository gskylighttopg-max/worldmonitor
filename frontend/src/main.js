import { MapLibreMap } from './map/MapLibreMap.js';
import { API_URL } from './api.js';
import { NewsFilterService } from './services/NewsFilterService.js';
import { FilterUI } from './ui/FilterUI.js';
import { aiAgent } from './services/AIAgent.js';

async function initApp() {
  try {
    const map = new MapLibreMap('map', {
      center: [0, 20],
      zoom: 1.5,
      style: 'https://demotiles.maplibre.org/style.json'
    });

    // Initialize services
    const newsFilterService = new NewsFilterService();
    const filterUI = new FilterUI('filter-panel', map);

    // Initialize AI Agent
    const aiAgent = new AIAgent();
    
    // Make services globally accessible
    window.newsFilterService = newsFilterService;
    window.filterUI = filterUI;
    window.aiAgent = aiAgent;

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
    console.log('World Monitor initialized with AI Agent');
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
    
    // Load news into filter service
    try {
      const newsData = await fetch(`${API_URL}/api/news`).then(r => r.json());
      window.newsFilterService.loadNews(newsData);
    } catch (e) {
      console.error('Failed to load news into filter service:', e);
    }
    
    // Process news through AI agent for enhanced analysis
    await processNewsWithAI();
    
    updateLastUpdated();
  } catch (error) {
    console.error('Failed to load data:', error);
  }
}

// Process news through AI agent for enhanced analysis
async function processNewsWithAI() {
  try {
    const newsData = await fetch(`${API_URL}/api/news`).then(r => r.json());
    const articles = newsData.articles || [];
    
    // Prepare context for AI agent
    const context = {
      filteredNews: window.newsFilterService?.getFilteredNews() || [],
      selectedCountries: window.newsFilterService?.selectedCountries || new Set(),
      selectedCategories: window.newsFilterService?.selectedCategories || new Set(['conflict']),
      filteredNews: window.newsFilterService?.getFilteredNews() || []
    };
    
    // Run AI analysis in background
    try {
      // 1. Generate conflict summaries
      const conflictSummary = await window.aiAgent.summarizeConflict({
        filteredNews: window.newsFilterService?.getFilteredNews() || [],
        selectedCountries: new Set(),
        selectedCategories: new Set(['conflict'])
      });
      window.aiConflictSummary = conflictSummary;
      
      // 2. Detect patterns
      const patterns = await window.aiAgent.detectPatterns({
        filteredNews: window.newsFilterService?.getFilteredNews() || [],
        timeRangeDays: 30,
        patternTypes: ['escalation', 'geographic', 'actor', 'temporal', 'weapon']
      });
      window.aiPatterns = patterns;
      
      // 3. Track key entities
      const entities = await window.aiAgent.trackEntities({
        entities: ['Hamas', 'IDF', 'Hezbollah', 'Iran', 'Israel', 'Russia', 'Ukraine', 'NATO', 'UN'],
        timeRangeDays: 30
      });
      window.aiEntities = entities;
      
      // 4. Generate alerts
      const alerts = await window.aiAgent.generateAlerts({
        filteredNews: window.newsFilterService?.getFilteredNews() || []
      });
      window.aiAlerts = alerts;
      
      // 4. Cross-source verification for high-priority events
      const verification = await window.aiAgent.crossSourceVerification({
        filteredNews: window.newsFilterService?.getFilteredNews() || [],
        eventId: 'latest-major-event',
        claim: 'Major escalation in conflict zone'
      });
      window.aiVerification = verification;
      
      // 7. Model scenarios
      const scenarios = await window.aiAgent.modelScenario({
        scenario: 'Escalation of conflict in Middle East',
        timeHorizon: '30 days',
        assumptions: ['Continued proxy warfare', 'No direct NATO intervention', 'Oil supply disruption'],
        filteredNews: window.newsFilterService?.getFilteredNews() || []
      });
      window.aiScenarios = scenarios;
      
      // 8. Source credibility scoring
      const credibility = await window.aiAgent.scoreSourceCredibility({
        filteredNews: window.newsFilterService?.getFilteredNews() || [],
        timeRangeDays: 90
      });
      window.aiCredibility = credibility;
      
      // Trigger UI update for AI insights
      document.dispatchEvent(new CustomEvent('ai-analysis-complete', {
        detail: {
          conflictSummary: window.aiConflictSummary,
          patterns: window.aiPatterns,
          entities: window.aiEntities,
          alerts: window.aiAlerts,
          verification: window.aiVerification,
          scenarios: window.aiScenarios,
          credibility: window.aiCredibility
        }
      }));
      
    } catch (error) {
      console.error('AI processing error:', error);
    }
  } catch (error) {
    console.error('AI processing setup error:', error);
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
      
      // Process new data through AI
      if (data.features?.length > 0) {
        await processNewsWithAI();
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

// Make AI agent globally accessible for UI components
window.aiAgent = null;

initApp();