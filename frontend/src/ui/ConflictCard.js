export function createConflictCard(conflict, onClick) {
  const card = document.createElement('div');
  card.className = 'conflict-card';
  card.innerHTML = `
    <div class="conflict-header">
      <span class="conflict-score ${conflict.conflictScore >= 0.8 ? 'high' : conflict.conflictScore >= 0.5 ? 'medium' : 'low'}">
        ${(conflict.conflictScore * 100).toFixed(0)}%
      </span>
      <span class="conflict-location">${conflict.country || 'Unknown'}</span>
    </div>
    <div class="conflict-summary">${conflict.summary}</div>
    <div class="conflict-narratives">
      ${conflict.dominantNarratives?.slice(0, 3).map(n => `
        <span class="narrative-tag">${n.theme} (${n.count})</span>
      `).join('') || ''}
    </div>
    <button class="view-conflict-btn">View Details</button>
  `;
  
  if (onClick) {
    card.querySelector('.view-conflict-btn').addEventListener('click', () => onClick(conflict));
  }
  
  return card;
}

export function createConflictList(conflicts, onClick) {
  const container = document.createElement('div');
  container.className = 'conflict-list';
  
  conflicts.forEach(conflict => {
    const card = createConflictCard(conflict, onClick);
    container.appendChild(card);
  });
  
  return container;
}