# Personal Tracker

A GitHub-contribution-graph-style habit tracker: protein, water, steps, no-Instagram, no-porn,
sleep, workout, low screen time, reading, studying — each with its own color, dark background,
neon-yellow accents.

## Structure

- `backend/` — Express + SQLite API (source of truth for both apps)
- `frontend/` — React (Vite) web app
- `mobile/` — Expo (React Native) app for iOS/Android

## Running

```bash
# 1. Backend (start first, both apps depend on it)
cd backend && npm install && npm run dev   # http://localhost:4000

# 2. Web app
cd frontend && npm install && npm run dev  # http://localhost:5173

# 3. Mobile app
cd mobile && npm install && npx expo start # scan QR with Expo Go, or press i/a for simulator
```

Mobile connects to the backend via `localhost` (iOS simulator) or `10.0.2.2` (Android emulator).
For a physical device, edit `mobile/src/api.js` and point `HOST` at your Mac's LAN IP.

## Adding a new tracker

`POST /api/metrics` with `{ key, name, unit, type: "numeric" | "boolean", goal, color }`.
Numeric metrics color in by `value / goal`; boolean metrics are full-color on any day you log them.
