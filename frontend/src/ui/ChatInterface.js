import { newsFilterService } from '../services/NewsFilterService.js';
import { aiAgent } from '../services/AIAgent.js';

export class ChatInterface {
  constructor(containerId, map) {
    this.container = document.getElementById(containerId);
    this.map = map;
    this.isOpen = false;
    this.messages = [];
    this.isLoading = false;
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="chat-interface" style="display: ${this.isOpen ? 'flex' : 'none'}">
        <div class="chat-header">
          <h3>World Monitor AI</h3>
          <button class="chat-toggle" id="chat-close">×</button>
        </div>
        
        <div class="chat-filters">
          <div class="filter-group">
            <label>Countries:</label>
            <div class="filter-chips" id="country-filters"></div>
          </div>
          <div class="filter-group">
            <label>Categories:</label>
            <div class="filter-chips" id="category-filters"></div>
          </div>
        </div>

        <div class="chat-messages" id="chat-messages">
          <div class="message assistant">
            <div class="message-content">
              <p>Welcome to World Monitor AI. I can help you analyze conflicts, energy markets, and trade developments.</p>
              <p>Select countries and categories above to filter the news, then ask me questions like:</p>
              <ul>
                <li>"What conflicts are happening in Ukraine?"</li>
                <li>"What's happening with oil prices?"</li>
                <li>"Any trade disputes between US and China?"</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="chat-input-area">
          <input type="text" id="chat-input" placeholder="Ask about conflicts, oil, energy, trade..." disabled>
          <button id="chat-send" disabled>Send</button>
        </div>
      </div>
      
      <button class="chat-fab" id="chat-open" style="display: ${this.isOpen ? 'none' : 'flex'}">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>
    `;

    this.bindEvents();
    this.renderFilters();
  }

  bindEvents() {
    // Toggle chat
    this.container.querySelector('#chat-open')?.addEventListener('click', () => this.toggle());
    this.container.querySelector('#chat-close')?.addEventListener('click', () => this.toggle());

    // Send message
    const input = this.container.querySelector('#chat-input');
    const sendBtn = this.container.querySelector('#chat-send');
    
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !this.isLoading) this.sendMessage();
    });
    
    sendBtn?.addEventListener('click', () => this.sendMessage());

    // Filter chips
    this.bindFilterEvents();
  }

  bindFilterEvents() {
    // Country filters
    const countryContainer = this.container.querySelector('#country-filters');
    const countries = ['USA', 'China', 'Russia', 'Ukraine', 'Israel', 'Iran', 'Taiwan', 'Syria', 'Yemen'];
    
    countryContainer.innerHTML = ['All', ...new Set(['USA', 'China', 'Russia', 'Ukraine', 'Israel', 'Iran', 'Taiwan', 'Syria', 'Yemen'])].map(c => 
      `<button class="filter-chip ${!this.newsFilterService.selectedCountries.has(c) && c !== 'All' ? '' : 'active'}" data-country="${c}">${c}</button>`
    ).join('');

    this.container.querySelectorAll('#country-filters .filter-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const country = e.target.dataset.country;
        if (country === 'All') {
          this.newsFilterService.setSelectedCountries(new Set());
        } else {
          const countries = new Set(this.newsFilterService.selectedCountries);
          if (countries.has(country)) countries.delete(country);
          else countries.add(country);
          this.newsFilterService.setSelectedCountries(countries);
        }
        this.renderFilters();
        this.refreshNews();
      });
    });

    // Category filters
    const categoryContainer = this.container.querySelector('#category-filters');
    const categories = ['conflict', 'oil', 'energy', 'trade', 'news'];
    
    categoryContainer.innerHTML = categories.map(c => 
      `<button class="filter-chip ${this.newsFilterService.selectedCategories.has(c) ? 'active' : ''}" data-category="${c}">${c.charAt(0).toUpperCase() + c.slice(1)}</button>`
    ).join('');

    this.container.querySelectorAll('#category-filters .filter-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.target.dataset.category;
        const categories = new Set(this.newsFilterService.selectedCategories);
        if (categories.has(category)) categories.delete(category);
        else categories.add(category);
        this.newsFilterService.setSelectedCategories(categories);
        this.renderFilters();
        this.refreshNews();
      });
    });
  }

  async refreshNews() {
    const input = this.container.querySelector('#chat-input');
    const sendBtn = this.container.querySelector('#chat-send');
    
    if (this.newsFilterService.selectedCategories.size === 0) {
      input.disabled = true;
      this.container.querySelector('#chat-send').disabled = true;
      this.addMessage('assistant', 'Please select at least one category to view news and chat.');
      return;
    }

    input.disabled = false;
    sendBtn.disabled = false;
    
    this.addMessage('system', 'Loading news...');
    
    try {
      await this.newsFilterService.loadNews();
      this.addMessage('assistant', `Loaded ${this.newsFilterService.filteredNews.length} news items. ${this.newsFilterService.selectedCountries.size === 0 ? 'Showing mixed countries.' : `Filtering by: ${Array.from(this.newsFilterService.selectedCountries).join(', ')}`}. What would you like to know?`);
    } catch (error) {
      this.addMessage('assistant', 'Failed to load news. Please try again.');
    }
  }

  async sendMessage() {
    const input = this.container.querySelector('#chat-input');
    const msgText = input.value.trim();
    if (!msgText || this.isLoading) return;

    this.isLoading = true;
    input.disabled = true;
    this.container.querySelector('#chat-send').disabled = true;

    this.addMessage('user', msgText);

    const response = await aiAgent.processQuery(msgText, {
      selectedCountries: this.newsFilterService.selectedCountries,
      selectedCategories: this.newsFilterService.selectedCategories,
      filteredNews: this.newsFilterService.getFilteredNews()
    });

    this.addMessage('assistant', response.message, response.data);
    
    this.isLoading = false;
    input.disabled = false;
    this.container.querySelector('#chat-send').disabled = false;
    input.value = '';
    input.focus();
  }

  addMessage(role, msgContent, data = null) {
    const container = this.container.querySelector('#chat-messages');
    const div = document.createElement('div');
    div.className = `message ${role}`;
    
    let msgHtml = `<div class="message-content">${this.formatMessage(msgContent)}</div>`;
    
    if (data) {
      msgHtml += `<div class="message-data">${JSON.stringify(data, null, 2)}</div>`;
    }
    
    div.innerHTML = msgHtml;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  formatMessage(msgContent) {
    if (typeof msgContent === 'object') return JSON.stringify(msgContent, null, 2);
    return msgContent.replace(/\n/g, '<br>');
  }

  renderFilters() {
    // Country filters
    const countryContainer = this.container.querySelector('#country-filters');
    const countries = ['USA', 'China', 'Russia', 'Ukraine', 'Israel', 'Iran', 'Taiwan', 'Syria', 'Yemen'];
    
    const uniqueCountries = [...new Set(['USA', 'China', 'Russia', 'Ukraine', 'Israel', 'Iran', 'Taiwan', 'Syria', 'Yemen'])];
    const selectedCountries = this.newsFilterService.selectedCountries;
    
    countryContainer.innerHTML = ['All', ...uniqueCountries].map(c => 
      `<button class="filter-chip ${selectedCountries.has(c) || (c === 'All' && this.newsFilterService.selectedCountries.size === 0) ? 'active' : ''}" data-country="${c}">${c}</button>`
    ).join('');

    this.container.querySelectorAll('#country-filters .filter-chip').forEach(btn => {
      btn.onclick = (e) => {
        const country = e.target.dataset.country;
        if (country === 'All') {
          this.newsFilterService.setSelectedCountries(new Set());
        } else {
          const countries = new Set(this.newsFilterService.selectedCountries);
          if (countries.has(country)) countries.delete(country);
          else countries.add(country);
          this.newsFilterService.setSelectedCountries(countries);
        }
        this.renderFilters();
        this.refreshNews();
      };
    });

    // Category filters
    const categories = ['conflict', 'oil', 'energy', 'trade', 'news'];
    const selectedCategories = this.newsFilterService.selectedCategories;
    const categoryContainer = this.container.querySelector('#category-filters');
    categoryContainer.innerHTML = categories.map(c => 
      `<button class="filter-chip ${selectedCategories.has(c) ? 'active' : ''}" data-category="${c}">${c.charAt(0).toUpperCase() + c.slice(1)}</button>`
    ).join('');

    this.container.querySelectorAll('#category-filters .filter-chip').forEach(btn => {
      btn.onclick = (e) => {
        const category = e.target.dataset.category;
        const categories = new Set(this.newsFilterService.selectedCategories);
        if (categories.has(category)) categories.delete(category);
        else categories.add(category);
        this.newsFilterService.setSelectedCategories(categories);
        this.renderFilters();
        this.refreshNews();
      };
    });
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.container.querySelector('.chat-interface').style.display = this.isOpen ? 'flex' : 'none';
    this.container.querySelector('.chat-fab').style.display = this.isOpen ? 'none' : 'flex';
    
    if (this.isOpen) {
      this.container.querySelector('#chat-input')?.focus();
    }
  }
}

export function createChatInterface(containerId, map, newsFilterService) {
  return new ChatInterface(containerId, map, newsFilterService);
}