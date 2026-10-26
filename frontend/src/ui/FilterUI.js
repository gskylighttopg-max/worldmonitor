import { newsFilterService } from '../services/NewsFilterService.js';

export class FilterUI {
  constructor(containerId, map) {
    this.container = document.getElementById(containerId);
    this.map = map;
    this.render();
    this.bindEvents();
    this.listenForAIUpdates();
  }

  render() {
    this.container.innerHTML = `
      <div class="filter-panel">
        <div class="filter-panel-header">
          <h3>World Monitor</h3>
          <button class="panel-toggle" id="panel-toggle" aria-label="Toggle panel">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
        </div>
        
        <div class="filter-panel-content">
          <div class="filter-tabs">
            <div class="category-tabs" id="category-tabs"></div>
            <div class="filter-divider"></div>
            <div class="country-filter">
              <label>Countries:</label>
              <div class="filter-chips" id="country-filters"></div>
            </div>
          </div>
          
          <!-- AI Thesis Panel -->
          <div class="ai-thesis-panel" id="ai-thesis-panel">
            <div class="ai-thesis-header">
              <h3>AI Analysis</h3>
              <span class="ai-status" id="ai-status">Analyzing...</span>
            </div>
            <div class="ai-thesis-content" id="ai-thesis-content">
              <div class="ai-loading">Analyzing news...</div>
            </div>
          </div>
          
          <div class="filter-tabs">
            <div class="category-tabs" id="category-tabs"></div>
            <div class="filter-divider"></div>
            <div class="country-filter">
              <label>Countries:</label>
              <div class="filter-chips" id="country-filters"></div>
            </div>
          </div>
          
          <div class="stats-bar" id="stats-bar">
            <span id="news-count">Loading...</span>
            <span id="last-updated">Updated: --:--:--</span>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.renderTabs();
    this.renderCountryFilters();
  }

  bindEvents() {
    // Category tabs
    this.container.querySelectorAll('.category-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.target.dataset.category;
        newsFilterService.setCategory(category);
        this.renderTabs();
      });
    });

    // Country filters
    this.bindCountryFilters();
  }

  bindCountryFilters() {
    this.container.querySelectorAll('#country-filters .filter-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const country = e.target.dataset.country;
        const selectedCountries = new Set(newsFilterService.selectedCountries);
        
        if (country === 'All') {
          newsFilterService.setSelectedCountries(new Set());
        } else {
          const countries = new Set(newsFilterService.selectedCountries);
          if (countries.has(country)) countries.delete(country);
          else countries.add(country);
          newsFilterService.setSelectedCountries(countries);
        }
      });
    });
  }

  listenForAIUpdates() {
    // Listen for AI analysis complete event
    document.addEventListener('ai-analysis-complete', (e) => {
      this.renderAIThesis(e.detail);
    });
  }

  renderTabs() {
    const tabs = ['conflict', 'oil', 'energy', 'trade'];
    const currentCategory = newsFilterService.getCurrentCategory();
    
    const container = document.getElementById('category-tabs');
    container.innerHTML = ['conflict', 'oil', 'energy', 'trade'].map(cat => 
      `<button class="category-tab ${newsFilterService.getCurrentCategory() === cat ? 'active' : ''}" 
       data-category="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</button>`
    ).join('');

    // Re-bind click events
    document.querySelectorAll('.category-tab').forEach(btn => {
      btn.onclick = (e) => {
        const category = e.target.dataset.category;
        newsFilterService.setCategory(category);
        this.renderTabs();
        this.refreshNews();
      };
    });
  }

  renderCountryFilters() {
    const countryContainer = document.getElementById('country-filters');
    const countries = ['USA', 'China', 'Russia', 'Ukraine', 'Israel', 'Iran', 'Taiwan', 'Syria', 'Yemen'];
    const selectedCountries = newsFilterService.selectedCountries;
    
    const uniqueCountries = [...new Set(['USA', 'China', 'Russia', 'Ukraine', 'Israel', 'Iran', 'Taiwan', 'Syria', 'Yemen'])];
    
    countryContainer.innerHTML = ['All', 'USA', 'China', 'Russia', 'Ukraine', 'Israel', 'Iran', 'Taiwan', 'Syria', 'Yemen'].map(c => 
      `<button class="filter-chip ${newsFilterService.selectedCountries.has(c) || (c === 'All' && newsFilterService.selectedCountries.size === 0) ? 'active' : ''}" data-country="${c}">${c}</button>`
    ).join('');

    // Re-bind click events
    document.querySelectorAll('#country-filters .filter-chip').forEach(btn => {
      btn.onclick = (e) => {
        const country = e.target.dataset.country;
        if (country === 'All') {
          newsFilterService.setSelectedCountries(new Set());
        } else {
          const countries = new Set(newsFilterService.selectedCountries);
          if (countries.has(country)) countries.delete(country);
          else countries.add(country);
          newsFilterService.setSelectedCountries(countries);
        }
      };
    });
  }

  renderAIThesis(aiData) {
    const container = document.getElementById('ai-thesis-content');
    const statusEl = document.getElementById('ai-status');
    
    if (!aiData) {
      container.innerHTML = '<div class="ai-loading">No AI analysis available</div>';
      if (statusEl) statusEl.textContent = 'No analysis';
      return;
    }

    statusEl.textContent = 'Updated just now';
    
    const {
      conflictSummary,
      patterns,
      entities,
      alerts,
      verification,
      scenarios,
      credibility
    } = aiData;

    let html = '';

    // Conflict Summary
    if (conflictSummary) {
      html += this.renderConflictSummary(conflictSummary);
    }

    // Pattern Detection
    if (patterns && patterns.patterns) {
      html += this.renderPatterns(patterns);
    }

    // Entity Tracking
    if (entities && entities.entities) {
      html += this.renderEntities(entities);
    }

    // Alerts
    if (alerts && alerts.alerts) {
      html += this.renderAlerts(alerts);
    }

    // Cross-source Verification
    if (verification) {
      html += this.renderVerification(verification);
    }

    // Scenarios
    if (scenarios && scenarios.scenario) {
      html += this.renderScenarios(scenarios);
    }

    // Credibility Scoring
    if (credibility) {
      html += this.renderCredibility(credibility);
    }

    // Alerts
    if (alerts && alerts.alerts && alerts.alerts.length > 0) {
      html += this.renderAlertsPanel(alerts);
    }

    if (!html) {
      html = '<div class="ai-empty">No AI analysis available yet</div>';
    }

    document.getElementById('ai-thesis-content').innerHTML = html;
  }

  renderConflictSummary(summary) {
    if (!summary || !summary.summary) return '';
    return `
      <div class="ai-section">
        <h4>Conflict Summary</h4>
        <div class="ai-summary">${summary.summary || summary}</div>
        ${summary.keyDevelopments ? `
          <h5>Key Developments</h5>
          <ul>${summary.keyDevelopments.map(d => `<li>${d}</li>`).join('')}</ul>
        ` : ''}
        ${summary.regionalBreakdown ? `
          <h5>Regional Breakdown</h5>
          <ul>${Object.entries(summary.regionalBreakdown).map(([region, details]) => 
            `<li><strong>${region}:</strong> ${details}</li>`).join('')}</ul>
        ` : ''}
      </div>
    `;
  }

  renderPatterns(patterns) {
    if (!patterns.patterns || !patterns.patterns.length) return '';
    return `
      <div class="ai-section">
        <h4>Pattern Detection</h4>
        ${patterns.patterns.map(p => `
          <div class="pattern-item">
            <h5>${p.name || 'Pattern'}</h5>
            <p>${p.description || p.evidence || ''}</p>
            <span class="pattern-confidence">Confidence: ${p.confidence || 'Medium'}</span>
            ${p.implication ? `<p class="implication">Implication: ${p.implication}</p>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  renderEntities(entities) {
    if (!entities.entities || !entities.entities.length) return '';
    return `
      <div class="ai-section">
        <h4>Entity Tracking</h4>
        <div class="entities-grid">
          ${entities.entities.slice(0, 10).map(e => `
            <div class="entity-card">
              <h5>${e.name || e.entity}</h5>
              <span class="entity-mentions">${e.mentions || 0} mentions</p>
              <p class="entity-sentiment">Sentiment: ${e.sentiment || 'Neutral'}</p>
              ${e.keyActions ? `<p class="entity-actions">${e.keyActions.join(', ')}</p>` : ''}
              ${e.locations ? `<p class="entity-locations">Locations: ${e.locations.join(', ')}</p>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderAlerts(alerts) {
    if (!alerts.alerts || !alerts.alerts.length) return '';
    return `
      <div class="ai-section alerts-section">
        <h4>🚨 Active Alerts</h4>
        ${alerts.alerts.map(a => `
          <div class="alert-item alert-${a.severity || 'medium'}">
            <h5>${a.name || 'Alert'}</h5>
            <p>${a.message || a.details || ''}</p>
            <span class="alert-severity severity-${a.severity || 'medium'}">${a.severity || 'Medium'}</p>
            ${a.action ? `<p class="alert-action">Action: ${a.action}</p>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  renderVerification(verification) {
    if (!verification) return '';
    return `
      <div class="ai-section verification-section">
        <h4>Cross-Source Verification</h4>
        <p>${verification.summary || verification.result || ''}</p>
        <div class="verification-details">
          <p><strong>Consensus:</strong> ${verification.consensus || 'Partial'}</p>
          <p><strong>Confidence:</strong> ${verification.confidence || 'Medium'}</p>
          ${verification.discrepancies ? `
            <h5>Discrepancies:</h5>
            <ul>${verification.discrepancies.map(d => `<li>${d}</li>`).join('')}</ul>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderScenarios(scenarios) {
    if (!scenarios || !scenarios.scenario) return '';
    return `
      <div class="ai-section scenarios-section">
        <h4>Scenario Modeling</h4>
        <div class="scenario-card">
          <h5>${scenarios.scenario}</h5>
          <p><strong>Plausibility:</strong> ${scenarios.plausibility || 'N/A'}%</p>
          <p><strong>Time Horizon:</strong> ${scenarios.timeHorizon || 'N/A'}</p>
          <p><strong>Risk Level:</strong> ${scenarios.riskLevel || 'Medium'}</p>
          ${scenarios.keyDrivers ? `<p><strong>Key Drivers:</strong> ${scenarios.keyDrivers.join(', ')}</p>` : ''}
          ${scenarios.indicators ? `
            <h5>Indicators to Watch</h5>
            <ul>${scenarios.indicators.map(i => `<li>${i}</li>`).join('')}</ul>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderCredibility(credibility) {
    if (!credibility) return '';
    return `
      <div class="ai-section credibility-section">
        <h4>Source Credibility</h4>
        ${credibility.rankings ? `
          <table class="credibility-table">
            <thead><tr><th>Rank</th><th>Source</th><th>Score</th><th>Bias</th><th>Tier</th></tr></thead>
            <tbody>
              ${credibility.rankings.map((r, i) => `
                <tr>
                  <td>${i+1}</td>
                  <td>${r.source}</td>
                  <td>${r.score}/100</td>
                  <td>${r.bias || 'Center'}</td>
                  <td>${r.tier || 'Tier 2'}</td>
                </tr>
              `).join('')}
            </tbody></table>
        ` : ''}
        ${credibility.details ? `
          <details>
            <summary>Detailed Assessments</summary>
            ${credibility.details.map(d => `
              <div class="credibility-detail">
                <h5>${d.source}</h5>
                <p>Score: ${d.score}/100 | Bias: ${d.bias} | Tier: ${d.tier}</p>
                <p>Strengths: ${d.strengths?.join(', ') || 'N/A'}</p>
                <p>Concerns: ${d.concerns?.join(', ') || 'N/A'}</p>
              </div>
            `).join('')}
          </details>
        ` : ''}
      </div>
    `;
  }

  renderAlertsPanel(alerts) {
    if (!alerts.alerts || !alerts.alerts.length) return '';
    return `
      <div class="ai-section alerts-panel">
        <h4>🚨 Active Alerts</h4>
        ${alerts.alerts.map(a => `
          <div class="alert-item alert-${a.severity || 'medium'}">
            <div class="alert-header">
              <h5>${a.name || 'Alert'}</h5>
              <span class="alert-severity severity-${a.severity || 'medium'}">${a.severity || 'Medium'}</span>
            </div>
            <p>${a.message || a.details || ''}</p>
            ${a.action ? `<p class="alert-action"><strong>Action:</strong> ${a.action}</p>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }
}

export function createFilterUI(containerId, map) {
  return new FilterUI(containerId);
}