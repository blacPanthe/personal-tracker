import { Platform } from 'react-native';
import Constants from 'expo-constants';

// A physical device can't reach the Mac via "localhost" - that resolves to the
// device itself. Expo Go already knows the Mac's LAN IP (it's how the device
// downloaded the JS bundle in the first place), so reuse that instead of
// hardcoding one that'll go stale whenever the router reassigns it.
function resolveHost() {
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;
  if (hostUri) return hostUri.split(':')[0];
  // Fallback for simulators/emulators when hostUri isn't available.
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

const API_BASE = `http://${resolveHost()}:4000/api`;

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

export async function generatePlan(profile) {
  const res = await fetch(`${API_BASE}/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!res.ok) {
    const body = await res.json();
    throw new Error(body.error || 'Failed to generate plan');
  }
  return res.json();
}
