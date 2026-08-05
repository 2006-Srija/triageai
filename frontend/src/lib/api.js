const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('triageai_token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const api = {
  // Auth
  signup: (body) => request('/api/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  join: (body) => request('/api/auth/join', { method: 'POST', body: JSON.stringify(body) }),

  // Tickets
  getTickets: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') qs.set(k, v); });
    return request(`/api/tickets?${qs.toString()}`);
  },
  getTicket: (id) => request(`/api/tickets/${id}`),
  createTicket: (body) => request('/api/tickets', { method: 'POST', body: JSON.stringify(body) }),
  updateTicket: (id, body) => request(`/api/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  simulateTickets: () => request('/api/tickets/simulate', { method: 'POST' }),

  // Analytics
  getAnalytics: () => request('/api/analytics'),

  // Settings
  getSettings: () => request('/api/settings'),
  regenerateInvite: () => request('/api/settings/regenerate-invite', { method: 'POST' }),
};
