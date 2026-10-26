import { fetchAPI } from './api.js';

export class AIAgent {
  constructor() {
    this.conversationHistory = [];
    this.maxHistoryLength = 10;
  }

  async processQuery(userQuery, context = {}) {
    const { selectedCountries, selectedCategories, filteredNews } = context;

    const systemPrompt = this.buildSystemPrompt(filteredNews, selectedCountries, selectedCategories);
    
    try {
      const response = await this.callLLM(systemPrompt, userQuery);
      this.addToHistory(userQuery, response);
      return this.parseResponse(response);
    } catch (error) {
      console.error('AI Agent error:', error);
      return {
        type: 'error',
        message: 'I encountered an error processing your request. Please try again.',
        data: null
      };
    }
  }

  buildSystemPrompt(filteredNews, selectedCountries, selectedCategories) {
    const countryFilter = selectedCountries.size > 0 
      ? 'Countries selected: ' + Array.from(selectedCountries).join(', ') 
      : 'No country filter (showing mixed countries)';
    const categoryFilter = selectedCategories.size > 0
      ? 'Categories: ' + Array.from(selectedCategories).join(', ')
      : 'No category filter (showing nothing - user must select category)';

    const newsLines = filteredNews.slice(0, 20).map(function(item, i) {
      return (i+1) + '. [' + item.category.toUpperCase() + '] ' + item.title + ' (' + item.source + ', ' + item.published + ') - ' + (item.country || 'Unknown country');
    }).join('\n');

    return 'You are a geopolitical intelligence analyst. Analyze the provided news data and answer the user\'s question.\n\n' +
      'FILTERS APPLIED:\n' +
      '- ' + countryFilter + '\n' +
      '- ' + categoryFilter + '\n\n' +
      'NEWS DATA (' + filteredNews.length + ' items):\n' +
      newsLines + '\n\n' +
      'RULES:\n' +
      '1. Only use the provided news data - do not hallucinate\n' +
      '2. If no countries selected, explain you are showing mixed countries (one from each)\n' +
      '3. If no categories selected, explain user must select a category\n' +
      '4. Organize response by category: CONFLICT, OIL, ENERGY, TRADE\n' +
      '5. Cite sources with [source] notation\n' +
      '6. Be concise but comprehensive\n' +
      '7. If asked about specific country/category not in filter, explain it is filtered out';
  }

  async callLLM(systemPrompt, userQuery) {
    // This would call your LLM endpoint (OpenAI, Anthropic, etc.)
    // For now, return a structured response based on keywords
    return this.generateStructuredResponse(userQuery);
  }

  generateStructuredResponse(userQuery) {
    const query = userQuery.toLowerCase();
    
    if (query.includes('conflict') || query.includes('war') || query.includes('attack')) {
      return {
        type: 'conflict_summary',
        message: 'Here are the current conflict updates...',
        data: { category: 'conflict' }
      };
    }
    
    if (query.includes('oil') || query.includes('energy') || query.includes('price')) {
      return {
        type: 'energy_summary',
        message: 'Here are the current energy market updates...',
        data: { category: 'energy' }
      };
    }
    
    if (query.includes('trade') || query.includes('tariff') || query.includes('sanction')) {
      return {
        type: 'trade_summary',
        message: 'Here are the current trade developments...',
        data: { category: 'trade' }
      };
    }
    
    return {
      type: 'general',
      message: 'I can provide updates on conflicts, oil/energy markets, or trade developments. What would you like to know?',
      data: null
    };
  }

  parseResponse(response) {
    return response;
  }

  addToHistory(userQuery, response) {
    this.conversationHistory.push({ role: 'user', content: userQuery });
    this.conversationHistory.push({ role: 'assistant', content: JSON.stringify(response) });
    if (this.conversationHistory.length > this.maxHistoryLength * 2) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength * 2);
    }
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}

export const aiAgent = new AIAgent();