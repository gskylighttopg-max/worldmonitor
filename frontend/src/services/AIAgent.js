import { fetchAPI } from './api.js';

export class AIAgent {
  constructor() {
    this.conversationHistory = [];
    this.maxHistoryLength = 10;
    this.sourceCredibilityCache = new Map();
    this.entityCache = new Map();
    this.alertRules = [];
  }

  // ============================================
  // 1. CONFLICT SUMMARIZATION
  // ============================================
  async summarizeConflict(context) {
    const { filteredNews, selectedCountries, selectedCategories, region, timeRange } = context;
    
    const relevantNews = this.filterRelevantNews(context, 'conflict');
    const articles = relevantNews.slice(0, 30);
    
    const prompt = this.buildSummarizationPrompt(articles, context);
    const response = await this.callLLM(this.buildSummarizationSystemPrompt(), this.buildUserPrompt(articles, context));
    
    return this.parseStructuredResponse(response, 'conflict_summary');
  }

  buildSummarizationPrompt(articles, context) {
    const articlesText = articles.map((a, i) => 
      `${i+1}. [${a.source}] ${a.title} (${a.published}) - ${a.country || 'Unknown'}: ${a.description || a.summary || a.title}`
    ).join('\n\n');

    const regionFilter = this.getRegionFilter();
    
    return `You are a geopolitical intelligence analyst. Provide a concise executive summary of the current conflict situation.

CONTEXT:
- Region: ${this.getRegionFilter() || 'Global'}
- Time Range: Last 24 hours
- Sources: ${new Set(context.filteredNews.map(a => a.source)).join(', ')}

ARTICLES TO ANALYZE:
${articles.map((a, i) => `${i+1}. [${a.source}] ${a.title} (${a.published}) - ${a.country || 'Unknown'}: ${a.description || a.title}`).join('\n\n')}

REQUIRED OUTPUT FORMAT:
## Executive Summary
[2-3 sentence high-level overview]

## Key Developments
1. [Most significant development with source]
2. [Second development with source]
3. [Third development with source]

## Regional Breakdown
- [Region 1]: [Key developments]
- [Region 2]: [Key developments]

## Key Actors
- [Actor 1]: [Role/actions]
- [Actor 2]: [Role/actions]

## Escalation Indicators
- [Indicator 1]
- [Indicator 2]

## Confidence Assessment
- Overall confidence: [High/Medium/Low]
- Key uncertainties: [List]

FORMAT: Structured markdown with clear sections. Cite sources with [Source Name] after each claim.
`;
  }

  // ============================================
  // 2. CROSS-SOURCE VERIFICATION
  // ============================================
  async crossSourceVerification(context) {
    const { filteredNews, eventId, entity, claim } = context;
    
    // Find all articles about the same event/entity
    const relatedArticles = this.findRelatedArticles(context);
    const groupedBySource = this.groupBySource(context.filteredNews);
    
    const prompt = `You are a fact-checking analyst. Compare how different sources report on the same event.

EVENT/CLAIM TO VERIFY: ${JSON.stringify({ eventId, entity, claim })}

ARTICLES BY SOURCE:
${Object.entries(this.groupBySource(context.filteredNews)).map(([source, articles]) => 
  `## ${source} (${articles.length} articles)
${articles.slice(0, 5).map(a => `- ${a.title} (${a.published}): ${a.description || a.summary || a.title}`).join('\n')}
`).join('\n\n')}

ANALYSIS REQUIRED:
1. CONSISTENCY CHECK: Do sources agree on core facts (who, what, where, when, casualties)?
2. DISCREPANCIES: Identify specific contradictions in facts, numbers, attribution
3. FRAMING DIFFERENCES: How do sources frame the event differently (word choice, emphasis, blame assignment)?
3. SOURCE RELIABILITY: Note which sources have history of accuracy/bias on this topic
4. CONFIDENCE SCORE: 0-100% confidence in core facts

OUTPUT FORMAT:
## Verification Result
- Core Facts Consensus: [Agreed/Partial/Conflicted]
- Key Discrepancies: [List]
- Framing Differences: [Description]
- Source Reliability Notes: [Per source]
- Overall Confidence: [0-100%]
- Recommended Action: [Trust/Verify Further/Disregard]
`;
    const response = await this.callLLM(this.getVerificationSystemPrompt(), userPrompt);
    return this.parseStructuredResponse(response, 'verification');
  }

  // ============================================
  // 3. PATTERN DETECTION
  // ============================================
  async detectPatterns(context) {
    const { filteredNews, timeRangeDays = 30, patternTypes = ['escalation', 'geographic', 'actor', 'temporal', 'weapon'] } = context;
    
    const articles = context.filteredNews
      .filter(a => this.isWithinTimeRange(a.published, context.timeRangeDays || 30))
      .slice(0, 100);

    const prompt = `Analyze the following news articles for patterns over the last ${context.timeRangeDays || 30} days.

ARTICLES (${context.filteredNews.length} total, analyzing ${articles.length}):
${context.filteredNews.slice(0, 50).map((a, i) => `${i+1}. [${a.source}] ${a.title} (${a.published}) - ${a.country || 'Unknown'}: ${a.description || a.title}`).join('\n\n')}

PATTERNS TO DETECT:
1. ESCALATION: Increasing frequency/intensity/geographic spread
2. GEOGRAPHIC CLUSTERING: New hotspots, shifting frontlines
3. ACTOR BEHAVIOR: New actors, changed tactics, new alliances
3. TEMPORAL: Cyclical patterns, weekend/weekday effects, anniversary effects
4. WEAPON/TACITCS: New weapons, tactics, delivery methods
5. NARRATIVE SHIFTS: Changing justifications, new propaganda themes
6. CASUALTY TRENDS: Rising/falling, civilian vs military ratios

OUTPUT FORMAT:
## Pattern Analysis Report (${new Date().toLocaleDateString()})

## Executive Summary
[2-3 sentences on most significant pattern]

## Detected Patterns
### 1. [Pattern Name]
- Evidence: [Specific articles/dates]
- Confidence: [High/Med/Low]
- Implication: [What this means]

### 2. [Pattern Name]
...

## Emerging Hotspots
- [Region]: [Why it's heating up]

## Anomalies/Breaks in Pattern
- [Unexpected developments]

## Forecast (Next 7-14 days)
- [Predicted developments based on patterns]

## Confidence Assessment
- Data Quality: [High/Med/Low]
- Pattern Strength: [Strong/Moderate/Weak]
- False Positive Risk: [Low/Med/High]
`;

    const response = await this.callLLM(this.getPatternDetectionPrompt(), userPrompt);
    return this.parseStructuredResponse(response, 'pattern_detection');
  }

  // ============================================
  // 4. ENTITY TRACKING
  // ============================================
  async trackEntities(context) {
    const { filteredNews, entities, timeRangeDays = 30, minMentions = 3 } = context;
    
    const articles = context.filteredNews
      .filter(a => this.isWithinTimeRange(a.published, context.timeRangeDays || 30))
      .slice(0, 200);

    const prompt = `Track the following entities across news sources over the last ${context.timeRangeDays || 30} days.

ENTITIES TO TRACK: ${Array.isArray(context.entities) ? context.entities.join(', ') : 'Auto-detect top entities'}

ARTICLES (${context.filteredNews.length} total, analyzing ${Math.min(200, context.filteredNews.length)}):
${context.filteredNews.slice(0, 100).map((a, i) => `${i+1}. [${a.source}] ${a.title} (${a.published}) - ${a.country || 'Unknown'}: ${a.description || a.title}`).join('\n\n')}

TRACKING REQUIREMENTS:
1. MENTION FREQUENCY: Count mentions per entity per day
2. SENTIMENT TREND: Positive/negative/neutral per entity over time
3. ASSOCIATED ACTIONS: What actions linked to each entity (attacked, negotiated, threatened, deployed, sanctioned)
4. GEOGRAPHIC SPREAD: Where is each entity mentioned/active
5. CO-OCCURRENCE: Which entities appear together
6. SENTIMENT TRAJECTORY: Improving/worsening/neutral over time
6. NEW ENTITIES: Entities appearing for first time in period

OUTPUT FORMAT:
## Entity Tracking Report (${new Date().toLocaleDateString()})

## Top Entities by Mention Count
1. [Entity]: [Count] mentions - [Trend: ↑↓→] - [Sentiment: +/0/-] - [Key Actions]
2. ...

## Entity Profiles (Top 10)
### [Entity Name]
- Mentions: [Count] ([Trend])
- Sentiment: [Score -1 to +1] [Trend]
- Key Actions: [List]
- Locations: [Countries/regions]
- Associated Entities: [Co-mentioned]
- Sentiment Trajectory: [Improving/Worsening/Stable]
- First Seen: [Date] | Last Seen: [Date]

## Emerging Entities (First appearance in period)
- [Entity]: [Context]

## Co-occurrence Network
- [Entity A] ↔ [Entity B]: [Count] co-mentions

## Alert Worthy Changes
- [Entity]: [Significant change in frequency/sentiment/actions]

## Data Quality Notes
- Coverage: [Sources covering entity]
- Reliability: [High/Med/Low per source]
`;

    const response = await this.callLLM(this.getEntityTrackingPrompt(), userPrompt);
    return this.parseStructuredResponse(response, 'entity_tracking');
  }

  // ============================================
  // 5. MULTILINGUAL SYNTHESIS
  // ============================================
  async multilingualSynthesis(context) {
    const { filteredNews, targetLanguages = ['en', 'ar', 'ru', 'zh', 'fr', 'es'], translateTo = 'en' } = context;
    
    const nonEnglishArticles = context.filteredNews.filter(a => 
      a.language && a.language !== 'en' && a.language !== 'en-US'
    ).slice(0, 50);

    if (nonEnglishArticles.length === 0) {
      return { type: 'multilingual_synthesis', message: 'No non-English articles in current dataset', data: { articles: 0 } };
    }

    const prompt = `Translate and synthesize key information from non-English sources.

NON-ENGLISH ARTICLES (${nonEnglishArticles.length}):
${nonEnglishArticles.slice(0, 20).map((a, i) => `${i+1}. [${a.language || 'Unknown'}] [${a.source}] ${a.title} (${a.published}): ${a.description || a.title}`).join('\n\n')}

TASKS:
1. TRANSLATE: Key claims/facts from each article to English
2. SYNTHESIZE: Combine with English sources - do they confirm/contradict?
3. IDENTIFY UNIQUE INFO: What info ONLY appears in non-English sources?
4. BIAS CHECK: Does non-English framing differ from English sources?
4. CREDIBILITY: Assess source reliability

OUTPUT FORMAT:
## Multilingual Synthesis Report

## Translated Key Findings
1. [Source/Lang]: [Key claim in English] - [Original claim in original lang]

## Unique Intelligence (Non-English Only)
- [Finding]: [Source/Lang] - [Why it matters]

## Cross-Language Verification
- [Claim]: [English sources say X] vs [Non-English sources say Y] - [Agreement/Conflict]

## Source Credibility by Language
- [Language/Source]: [Credibility assessment]

## Gaps/Blind Spots
- [Language/Region]: No coverage
`;

    const response = await this.callLLM(this.getMultilingualPrompt(), userPrompt);
    return this.parseStructuredResponse(response, 'multilingual_synthesis');
  }

  // ============================================
  // 6. ALERT GENERATION
  // ============================================
  async generateAlerts(context) {
    const { filteredNews, rules = [] } = context;
    
    // Built-in alert rules
    const defaultRules = [
      { id: 'escalation', name: 'Escalation Detection', condition: 'escalation keywords + geographic clustering', severity: 'high' },
      { id: 'new_actor', name: 'New Actor', condition: 'new entity mentioned >5 times in 24h', severity: 'medium' },
      { id: 'casualty_spike', name: 'Casualty Spike', condition: 'casualty numbers >50% increase in 24h', severity: 'critical' },
      { id: 'new_weapon', name: 'New Weapon/Tactic', condition: 'new weapon system mentioned >3 sources', severity: 'high' },
      { id: 'geographic_spread', name: 'Geographic Spread', condition: 'conflict appears in new region/country', severity: 'high' },
      { id: 'ceasefire_violation', name: 'Ceasefire Violation', condition: 'ceasefire mentioned + violation keywords', severity: 'critical' },
    ];

    const allRules = [...defaultRules, ...(context.customRules || [])];
    
    const prompt = `Evaluate the following news against alert rules and generate alerts.

NEWS DATA (${context.filteredNews.length} items):
${context.filteredNews.slice(0, 50).map((a, i) => `${i+1}. [${a.source}] ${a.title} (${a.published}) - ${a.country || 'Unknown'}: ${a.description || a.title}`).join('\n\n')}

ALERT RULES TO EVALUATE:
${context.customRules ? JSON.stringify(context.customRules, null, 2) : JSON.stringify(this.getDefaultAlertRules(), null, 2)}

FOR EACH RULE, OUTPUT:
- RULE TRIGGERED: [Yes/No]
- TRIGGERED ARTICLES: [List of article indices]
- SEVERITY: [critical/high/medium/low]
- ALERT MESSAGE: [Human-readable alert text]
- RECOMMENDED ACTION: [What user should do]
- CONFIDENCE: [0-100%]

OUTPUT FORMAT:
## Alert Report (${new Date().toLocaleString()})

### Active Alerts
1. [Alert Name] - [SEVERITY]
   - Triggered By: [Article titles/sources]
   - Details: [What happened]
   - Action: [Recommended action]
   - Confidence: [0-100%]

### Watch List (Near Threshold)
- [Rule]: [Close to triggering - details]

### No Alerts
- [Rules evaluated but not triggered]
`;

    const response = await this.callLLM(this.getAlertPrompt(), userPrompt);
    return this.parseStructuredResponse(response, 'alert_generation');
  }

  // ============================================
  // 7. SCENARIO MODELING
  // ============================================
  async modelScenario(context) {
    const { filteredNews, scenario, timeHorizon = '30 days', assumptions = [] } = context;
    
    const relevantNews = this.filterRelevantNews(context, 'all').slice(0, 50);
    
    const prompt = `You are a geopolitical scenario planner. Model the following scenario based on current intelligence.

SCENARIO: ${context.scenario}
TIME HORIZON: ${timeHorizon}
ASSUMPTIONS: ${assumptions.join('; ') || 'None specified'}

CURRENT INTELLIGENCE BASE (${context.filteredNews.length} items, showing top 30):
${context.filteredNews.slice(0, 30).map((a, i) => `${i+1}. [${a.source}] ${a.title} (${a.published}) - ${a.country || 'Unknown'}: ${a.description || a.title}`).join('\n\n')}

ASSUMPTIONS TO TEST:
${context.assumptions.map((a, i) => `${i+1}. ${a}`).join('\n')}

SCENARIO MODELING REQUIRED:
1. PLAUSIBILITY ASSESSMENT: How likely is this scenario (0-100%)?
2. KEY DRIVERS: What factors make this more/less likely?
2. TRIGGERS: What events would initiate/accelerate this scenario?
3. TIMELINE: Probable sequence of events with rough dates
3. SECOND/THIRD ORDER EFFECTS: Economic, political, humanitarian, military ripple effects
4. KEY UNCERTAINTIES: What unknowns most affect outcome
4. INDICATORS TO WATCH: Specific events/signals to monitor
4. CONFIDENCE INTERVALS: Probability ranges for key outcomes
5. CONTINGENCY BRANCHES: Alternative paths if assumptions fail

OUTPUT FORMAT:
## Scenario Analysis: ${context.scenario}

## Executive Assessment
- Plausibility: [0-100%] - [Brief justification]
- Time Horizon: ${timeHorizon}
- Overall Risk Level: [Low/Medium/High/Critical]

## Scenario Tree
### Most Likely Path (${X}%)
1. [Event] → [Consequence] → [Next Event]
2. ...

### Alternative Paths
- Branch A (${Y}%): [Description]
- Branch B (${Z}%): [Description]

## Key Drivers & Triggers
| Driver | Current Status | Trend | Impact if Changes |
|---|---|---|---|

## Key Uncertainties (Ranked by Impact)
1. [Uncertainty] - Impact if resolves favorably/unfavorably
2. ...

## Indicators to Watch (Next ${timeHorizon})
| Indicator | Current Value | Threshold for Concern | Monitoring Frequency |
|---|---|---|---|

## Confidence & Limitations
- Confidence: [0-100%]
- Key Limitations: [Data gaps, assumptions, model limitations]
- Recommended Review Date: [Date]
`;

    const response = await this.callLLM(this.getScenarioPrompt(), userPrompt);
    return this.parseStructuredResponse(response, 'scenario_modeling');
  }

  // ============================================
  // 8. SOURCE CREDIBILITY SCORING
  // ============================================
  async scoreSourceCredibility(context) {
    const { filteredNews, sources: providedSources = null, timeRangeDays = 90 } = context;
    
    // Get unique sources from recent articles
    const recentArticles = context.filteredNews
      .filter(a => this.isWithinTimeRange(a.published, timeRangeDays))
      .slice(0, 500);
    
    const uniqueSources = [...new Set(recentArticles.map(a => a.source).filter(Boolean))];

    const prompt = `Assess the credibility of each news source based on their recent reporting.

SOURCES TO EVALUATE (${uniqueSources.length}):
${uniqueSources.join(', ')}

RECENT ARTICLES BY SOURCE (last 90 days, sample of ${Math.min(200, context.filteredNews.length)}):
${this.groupBySource(context.filteredNews.filter(a => this.isWithinTimeRange(a.published, 90))).map(([source, articles]) => 
  `## ${source} (${articles.length} articles)
${articles.slice(0, 5).map(a => `- ${a.title} (${a.published}): ${a.description || a.title}`).join('\n')}
`).join('\n\n')}

EVALUATION CRITERIA:
1. FACTUAL ACCURACY: Historical accuracy of claims (cross-referenced)
2. BIAS/LEANING: Political/ideological slant (Left/Center/Right, Pro/Anti specific actors)
3. SOURCING QUALITY: Uses primary sources, on-the-ground reporters, official statements vs hearsay
3. CORRECTION POLICY: Issues corrections transparently
4. TRANSPARENCY: Clear ownership, funding, editorial independence
4. CONSISTENCY: Internal consistency over time
4. TIMELINESS: Speed of reporting vs accuracy tradeoff
4. EXPERTISE: Subject matter expertise of reporters

OUTPUT FORMAT:
## Source Credibility Assessment (${new Date().toLocaleDateString()})

## Overall Rankings
| Rank | Source | Credibility Score (0-100) | Bias | Reliability Tier | Key Strengths | Key Concerns |
|---|---|---|---|---|---|---|

## Detailed Assessments
### [Source Name]
- **Credibility Score**: [0-100]
- **Bias Rating**: [Left/Center/Right + Pro/Neutral/Anti specific actors]
- **Reliability Tier**: [Tier 1: Highly Reliable / Tier 2: Generally Reliable / Tier 3: Use With Caution / Tier 4: Unreliable]
- **Evidence Base**: [Number of articles analyzed, time period]
- **Strengths**: [Specific strengths with examples]
- **Concerns**: [Specific concerns with examples]
- **Sample Articles Analyzed**: [Count]
- **Correction History**: [Known corrections/retractions]
- **Recommended Usage**: [Primary source / Corroboration only / Avoid]

## Bias Matrix
| Source | Political Lean | Geographic Focus | Actor Alignment |
|---|---|---|---|

## Recommendations
- **Primary Sources**: [List - use for primary facts]
- **Corroboration Sources**: [List - use for verification]
- **Avoid/Use With Extreme Caution**: [List]
`;

    const response = await this.callLLM(this.getCredibilityPrompt(), userPrompt);
    return this.parseStructuredResponse(response, 'credibility_scoring');
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  filterRelevantNews(context, type) {
    const { filteredNews, selectedCountries, selectedCategories } = context;
    let filtered = context.filteredNews || [];
    
    if (type === 'conflict') {
      return context.filteredNews.filter(a => 
        a.category === 'conflict' || 
        a.type === 'conflict' ||
        (a.themes && a.themes.some(t => ['war', 'conflict', 'attack', 'battle', 'ceasefire'].some(kw => t.toLowerCase().includes(kw))))
      );
    }
    if (type === 'oil') {
      return context.filteredNews.filter(a => a.category === 'oil' || a.type === 'oil');
    }
    if (type === 'energy') {
      return context.filteredNews.filter(a => a.category === 'energy' || a.type === 'energy');
    }
    if (type === 'trade') {
      return context.filteredNews.filter(a => a.category === 'trade' || a.type === 'trade');
    }
    return context.filteredNews || [];
  }

  findRelatedArticles(context) {
    // Find articles about same event/entity
    const { eventId, entity, claim } = context;
    return context.filteredNews.filter(a => {
      if (eventId && a.id === eventId) return true;
      if (entity && (a.title.includes(entity) || a.description?.includes(entity))) return true;
      if (claim && (a.title.includes(claim) || a.description?.includes(claim))) return true;
      return false;
    });
  }

  groupBySource(articles) {
    const grouped = {};
    (articles || []).forEach(a => {
      const source = a.source || 'Unknown';
      if (!grouped[source]) grouped[source] = [];
      grouped[source].push(a);
    });
    return grouped;
  }

  isWithinTimeRange(dateStr, days) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = (now - date) / (1000 * 60 * 60 * 24);
    return diffDays <= days;
  }

  getRegionFilter() {
    // Implement based on your context
    return 'Global';
  }

  isWithinTimeRange(dateStr, days) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = (now - date) / (1000 * 60 * 60 * 24);
    return diffDays <= days;
  }

  groupBySource(articles) {
    const grouped = {};
    (articles || []).forEach(a => {
      const source = a.source || 'Unknown';
      if (!grouped[source]) grouped[source] = [];
      grouped[source].push(a);
    });
    return grouped;
  }

  // ============================================
  // LLM CALLING & PARSING
  // ============================================
  async callLLM(systemPrompt, userPrompt) {
    // PLACEHOLDER: Replace with actual LLM call
    // Example for OpenAI:
    /*
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });
    const data = await response.json();
    return data.choices[0].message.content;
    */
    
    // MOCK for development/testing
    return this.generateMockResponse(context?.taskType || 'general');
  }

  generateMockResponse(type) {
    const mocks = {
      conflict_summary: { type: 'conflict_summary', message: 'Mock conflict summary', data: { summary: 'Mock summary' }},
      verification: { type: 'verification', message: 'Mock verification', data: { verified: true }},
      pattern_detection: { type: 'pattern_detection', message: 'Mock pattern detection', data: { patterns: [] }},
      entity_tracking: { type: 'entity_tracking', message: 'Mock entity tracking', data: { entities: [] }},
      multilingual_synthesis: { type: 'multilingual_synthesis', message: 'Mock multilingual', data: {} },
      alert_generation: { type: 'alert_generation', message: 'Mock alerts', data: { alerts: [] }},
      scenario_modeling: { type: 'scenario_modeling', message: 'Mock scenario', data: { scenario: 'mock' }},
      credibility_scoring: { type: 'credibility_scoring', message: 'Mock credibility', data: { scores: {} }},
    };
    return mocks[type] || { type: 'general', message: 'Mock response', data: {} };
  }

  parseStructuredResponse(response, type) {
    // Parse LLM response into structured format
    return { type, raw: response, parsed: true };
  }

  addToHistory(userQuery, response) {
    this.conversationHistory.push({ role: 'user', content: userQuery });
    this.conversationHistory.push({ role: 'assistant', content: JSON.stringify(response) });
    if (this.conversationHistory.length > this.maxHistoryLength * 2) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength * 2);
    }
  }

  // ============================================
  // SYSTEM PROMPTS
  // ============================================

  getVerificationSystemPrompt() {
    return `You are a fact-checking analyst for a geopolitical intelligence platform. 
Your job is to compare how different news sources report on the same event/entity.
Be objective, precise, and evidence-based. Cite specific articles.`;
  }

  getPatternDetectionPrompt() {
    return `You are a geopolitical pattern detection analyst. 
Identify meaningful patterns in news data over time.
Focus on actionable patterns with clear evidence. Avoid false positives.`;
  }

  getEntityTrackingPrompt() {
    return `You are an entity tracking analyst for geopolitical intelligence.
Track entities (people, organizations, locations) across news sources over time.
Focus on mention frequency, sentiment trends, co-occurrence, and behavioral changes.`;
  }

  getMultilingualPrompt() {
    return `You are a multilingual intelligence analyst. 
Translate and synthesize key information from non-English sources.
Identify unique intelligence only available in non-English sources.
Cross-verify with English-language sources.`;
  }

  getAlertPrompt() {
    return `You are an alert generation system for geopolitical monitoring.
Evaluate news against alert rules and generate actionable alerts.
Minimize false positives. Provide actionable recommendations.`;
  }

  getScenarioPrompt() {
    return `You are a geopolitical scenario planner for intelligence analysis.
Model scenarios based on current intelligence, with clear probabilities and indicators.
Be explicit about assumptions, uncertainties, and confidence levels.`;
  }

  getCredibilityPrompt() {
    return `You are a media credibility analyst for geopolitical intelligence.
Assess news source credibility based on accuracy, bias, sourcing, transparency.
Be evidence-based. Cite specific examples. Avoid political bias in your assessment.`;
  }

  getPatternDetectionPrompt() {
    return `You are a pattern detection analyst for geopolitical intelligence.
Identify meaningful patterns in news data over time.
Focus on actionable patterns with clear evidence. Avoid false positives.`;
  }

  getEntityTrackingPrompt() {
    return `You are an entity tracking analyst for geopolitical intelligence.
Track entities (people, organizations, locations) across news sources over time.
Focus on mention frequency, sentiment trends, co-occurrence, and behavioral changes.`;
  }

  getMultilingualPrompt() {
    return `You are a multilingual intelligence analyst. 
Translate and synthesize key information from non-English sources.
Identify unique intelligence only available in non-English sources.
Cross-verify with English-language sources.`;
  }

  getAlertPrompt() {
    return `You are an alert generation system for geopolitical monitoring.
Evaluate news against alert rules and generate actionable alerts.
Minimize false positives. Provide actionable recommendations.`;
  }

  getScenarioPrompt() {
    return `You are a geopolitical scenario planner for intelligence analysis.
Model scenarios based on current intelligence, with clear probabilities and indicators.
Be explicit about assumptions, uncertainties, and confidence levels.`;
  }

  getCredibilityPrompt() {
    return `You are a media credibility analyst for geopolitical intelligence.
Assess news source credibility based on accuracy, bias, sourcing, transparency.
Be evidence-based. Cite specific examples. Avoid political bias in your assessment.`;
  }

  getPatternDetectionPrompt() {
    return `You are a pattern detection analyst for geopolitical intelligence.
Identify meaningful patterns in news data over time.
Focus on actionable patterns with clear evidence. Avoid false positives.`;
  }

  getEntityTrackingPrompt() {
    return `You are an entity tracking analyst for geopolitical intelligence.
Track entities (people, organizations, locations) across news sources over time.
Focus on mention frequency, sentiment trends, co-occurrence, and behavioral changes.`;
  }

  getMultilingualPrompt() {
    return `You are a multilingual intelligence analyst. 
Translate and synthesize key information from non-English sources.
Identify unique intelligence only available in non-English sources.
Cross-verify with English-language sources.`;
  }

  getAlertPrompt() {
    return `You are an alert generation system for geopolitical monitoring.
Evaluate news against alert rules and generate actionable alerts.
Minimize false positives. Provide actionable recommendations.`;
  }

  getScenarioPrompt() {
    return `You are a geopolitical scenario planner for intelligence analysis.
Model scenarios based on current intelligence, with clear probabilities and indicators.
Be explicit about assumptions, uncertainties, and confidence levels.`;
  }

  getCredibilityPrompt() {
    return `You are a media credibility analyst for geopolitical intelligence.
Assess news source credibility based on accuracy, bias, sourcing, transparency.
Be evidence-based. Cite specific examples. Avoid political bias in your assessment.`;
  }

  // ============================================
  // UTILITY
  // ============================================
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