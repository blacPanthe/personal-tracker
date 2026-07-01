import { Platform } from 'react-native';

// iOS simulator can reach the Mac's localhost directly; the Android emulator
// routes host loopback through 10.0.2.2 instead. A physical device needs the
// Mac's LAN IP here (e.g. http://192.168.1.23:4000/api).
const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const API_BASE = `http://${HOST}:4000/api`;

export async function getMetrics() {
  const res = await fetch(`${API_BASE}/metrics`);
  return res.json();
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
