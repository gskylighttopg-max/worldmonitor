import { newsFilterService } from '../services/NewsFilterService.js';

export class FilterUI {
  constructor(containerId, map) {
    this.container = document.getElementById(containerId);
    this.map = map;
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="filter-panel">
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
      btn.onclick = (e) => {
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
      };
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

  refreshNews() {
    newsFilterService.loadNews().then(() => {
      // Update stats
      const count = newsFilterService.getFilteredNews().length;
      const countEl = document.getElementById('news-count');
      if (countEl) countEl.textContent = `${newsFilterService.getFilteredNews().length} items`;
    });
  }

  updateStats(count) {
    const countEl = document.getElementById('news-count');
    if (countEl) countEl.textContent = `${count} items`;
  }

  updateLastUpdated(time) {
    const el = document.getElementById('last-updated');
    if (el) el.textContent = `Updated: ${time}`;
  }
}

export function createFilterUI(containerId, map) {
  return new FilterUI(containerId);
}