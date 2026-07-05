const API_BASE = '/api';

export async function getMetrics() {
  const res = await fetch(`${API_BASE}/metrics`);
  return res.json();
}

export async function createMetric(metric) {
  const res = await fetch(`${API_BASE}/metrics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metric),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to create metric');
  return res.json();
}

export async function deleteMetric(id) {
  await fetch(`${API_BASE}/metrics/${id}`, { method: 'DELETE' });
}

export async function getEntriesSummary(from, to) {
  const params = new URLSearchParams({ from, to });
  const res = await fetch(`${API_BASE}/entries/summary?${params}`);
  return res.json();
}

export async function upsertEntry(metric_id, date, value) {
  const res = await fetch(`${API_BASE}/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metric_id, date, value }),
  });
  return res.json();
}

export async function generatePlan(profile) {
  const res = await fetch(`${API_BASE}/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to generate plan');
  return res.json();
}
