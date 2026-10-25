export function createLoadingSpinner(message = 'Loading...') {
  const container = document.createElement('div');
  container.className = 'loading-overlay';
  container.innerHTML = `
    <div class="loading-spinner"></div>
    <p class="loading-message">${message}</p>
  `;
  return container;
}

export function showLoading(container, message = 'Loading...') {
  const loader = createLoadingSpinner(message);
  container.appendChild(loader);
  return () => loader.remove();
}

export function hideLoading(loader) {
  if (loader && loader.parentNode) {
    loader.parentNode.removeChild(loader);
  }
}