import { fetchAPI } from './api.js';

export class NewsFilterService {
  constructor() {
    this.selectedCountries = new Set();
    this.selectedCategories = new Set();
    this.allNews = [];
    this.filteredNews = [];
  }

  setSelectedCountries(countries) {
    this.selectedCountries = new Set(countries);
    this.applyFilters();
  }

  setSelectedCategories(categories) {
    this.selectedCategories = new Set(categories);
    this.applyFilters();
  }

  async loadNews() {
    try {
      const [conflicts, oil, news] = await Promise.all([
        fetchAPI('/api/conflict').then(r => r.features || []),
        fetchAPI('/api/oil').then(r => r.data || []),
        fetchAPI('/api/news').then(r => r.articles || [])
      ]);

      this.allNews = [
        ...conflicts.map(f => ({ ...f.properties, category: 'conflict', type: 'conflict' })),
        ...oil.map(o => ({ ...o, category: o.type || 'oil', type: 'oil' })),
        ...news.map(n => ({ ...n, category: n.category || 'news', type: 'news' }))
      ];

      this.applyFilters();
      return this.filteredNews;
    } catch (error) {
      console.error('Failed to load news:', error);
      return [];
    }
  }

  applyFilters() {
    let filtered = this.allNews;

    // Category filter
    if (this.selectedCategories.size > 0) {
      filtered = filtered.filter(item => this.selectedCategories.has(item.category));
    } else {
      // If no category selected, show nothing
      filtered = [];
    }

    // Country filter
    if (this.selectedCountries.size > 0) {
      filtered = filtered.filter(item => {
        const country = this.extractCountry(item);
        return country && this.selectedCountries.has(country);
      });
    } else {
      // No country selected: mix one from each country
      filtered = this.mixByCountry(filtered);
    }

    this.filteredNews = filtered;
    return this.filteredNews;
  }

  extractCountry(item) {
    // Extract country from various possible fields
    return item.country || item.countryCode || item.sourceCountry || 
           (item.properties && item.properties.country) ||
           this.inferCountryFromSource(item.source);
  }

  inferCountryFromSource(source) {
    const sourceCountryMap = {
      'Reuters': 'UK',
      'AP': 'US',
      'BBC': 'UK',
      'Al Jazeera': 'Qatar',
      'France 24': 'France',
      'DW': 'Germany',
      'CNN': 'US',
      'Fox News': 'US',
      'NY Times': 'US',
      'Al Jazeera': 'Qatar',
      'Xinhua': 'China',
      'RT': 'Russia',
      'CGTN': 'China',
      'Al Arabiya': 'Saudi Arabia'
    };
    return sourceCountryMap[item.source] || null;
  }

  mixByCountry(items) {
    // Group by country
    const byCountry = {};
    items.forEach(item => {
      const country = this.extractCountry(item);
      if (country) {
        if (!byCountry[country]) byCountry[country] = [];
        byCountry[country].push(item);
      }
    });

    // Take one from each country, round-robin
    const countries = Object.keys(byCountry);
    const result = [];
    let maxItems = Math.max(...Object.values(byCountry).map(arr => arr.length));
    
    for (let i = 0; i < maxItems; i++) {
      for (const country of countries) {
        if (byCountry[country][i]) {
          result.push(byCountry[country][i]);
        }
      }
    }

    return result;
  }

  getFilteredNews() {
    return this.filteredNews;
  }

  getAvailableCountries() {
    const countries = new Set();
    this.allNews.forEach(item => {
      const country = this.extractCountry(item);
      if (country) this.selectedCountries.add(country);
    });
    return Array.from(this.selectedCountries).sort();
  }

  getAvailableCategories() {
    return ['conflict', 'oil', 'energy', 'trade', 'news'];
  }
}

export const newsFilterService = new NewsFilterService();