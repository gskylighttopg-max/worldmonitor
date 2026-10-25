export const API_URL = import.meta.env.VITE_API_URL || 'https://your-worker.workers.dev';

export async function fetchAPI(endpoint, params = {}) {
  const url = new URL(`${API_URL}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

export const api = {
  conflict: (params) => fetchAPI('/api/conflict', params),
  oil: (params) => fetchAPI('/api/oil', params),
  news: (params) => fetchAPI('/api/news', params),
  conflicts: (params) => fetchAPI('/api/conflicts', params),
  health: () => fetchAPI('/api/health')
};