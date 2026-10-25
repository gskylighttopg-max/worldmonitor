export class Sidebar {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.conflicts = [];
    this.filtered = [];
    this.activeFilter = 'all';
  }
  
  setConflicts(conflicts) {
    this.conflicts = conflicts;
    this.filtered = conflicts;
    this.render();
  }
  
  setFilter(filter) {
    this.activeFilter = filter;
    this.filtered = this.conflicts.filter(c => {
      if (filter === 'all') return true;
      if (filter === 'high') return c.conflictScore >= 0.8;
      if (filter === 'medium') return c.conflictScore >= 0.5 && c.conflictScore < 0.8;
      if (filter === 'low') return c.conflictScore < 0.5;
      return true;
    });
    this.render();
  }
  
  render() {
    if (!this.container) return;
    
    this.container.innerHTML = `
      <div class="sidebar-header">
        <h3>Conflicting Narratives</h3>
        <div class="sidebar-filters">
          <button class="filter-btn ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
          <button class="filter-btn ${this.activeFilter === 'high' ? 'active' : ''}" data-filter="high">High</button>
          <button class="filter-btn ${this.activeFilter === 'medium' ? 'active' : ''}" data-filter="medium">Medium</button>
          <button class="filter-btn ${this.activeFilter === 'low' ? 'active' : ''}" data-filter="low">Low</button>
        </div>
      </div>
      <div class="sidebar-list">
        ${this.filtered.map(c => `
          <div class="conflict-card" data-id="${c.id}">
            <div class="conflict-header">
              <span class="conflict-score ${c.conflictScore >= 0.8 ? 'high' : c.conflictScore >= 0.5 ? 'medium' : 'low'}">
                ${(c.conflictScore * 100).toFixed(0)}%
              </span>
              <span class="conflict-location">${c.country || 'Unknown'}</span>
            </div>
            <div class="conflict-summary">${c.summary}</div>
            <div class="conflict-narratives">
              ${c.dominantNarratives?.slice(0, 3).map(n => `
                <span class="narrative-tag">${n.theme} (${n.count})</span>
              `).join('') || ''}
            </div>
            <button class="view-conflict-btn" data-id="${c.id}">View Details</button>
          </div>
        `).join('')}
      </div>
    `;
    
    // Add event listeners
    this.container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => this.setFilter(btn.dataset.filter));
    });
    
    this.container.querySelectorAll('.view-conflict-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const conflict = this.conflicts.find(c => c.id === btn.dataset.id);
        if (conflict) this.showConflictDetail(conflict);
      });
    });
  }
  
  showConflictDetail(conflict) {
    // Could open a modal or navigate to detail view
    console.log('View conflict:', conflict);
  }
}

export function createSidebar(containerId) {
  return new Sidebar(containerId);
}