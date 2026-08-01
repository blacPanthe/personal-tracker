const API_BASE = '/api';
const TOKEN_KEY = 'pt_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

async function requestJson(path, options) {
  const res = await request(path, options);
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return res.json();
}

export async function signUp(email, password) {
  const result = await requestJson('/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  setToken(result.token);
  return result.user;
}

export async function signIn(email, password) {
  const result = await requestJson('/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  setToken(result.token);
  return result.user;
}

export async function signOut() {
  if (getToken()) await request('/auth/signout', { method: 'POST' });
  setToken(null);
}

export async function getCurrentUser() {
  if (!getToken()) return null;
  const res = await request('/auth/me');
  if (!res.ok) {
    setToken(null);
    return null;
  }
  return (await res.json()).user;
}

export async function getMetrics() {
  return requestJson('/metrics');
}

export async function createMetric(metric) {
  return requestJson('/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metric),
  });
}

export async function deleteMetric(id) {
  await request(`/metrics/${id}`, { method: 'DELETE' });
}

export async function getEntriesSummary(from, to) {
  const params = new URLSearchParams({ from, to });
  return requestJson(`/entries/summary?${params}`);
}

export async function upsertEntry(metric_id, date, value) {
  return requestJson('/entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metric_id, date, value }),
  });
}

export async function generatePlan(profile) {
  return requestJson('/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
}
