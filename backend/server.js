const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const { hashPassword, verifyPassword, generateToken, requireAuth } = require('./auth');

const db = new Database(path.join(__dirname, 'tracker.db'));
db.pragma('journal_mode = WAL');

// Metrics used to belong to a single global user. Multi-account support needs
// each metric scoped to its owner, which isn't a compatible schema change -
// rebuild from scratch rather than trying to migrate old single-user rows.
const hasUserScopedMetrics = db.prepare("PRAGMA table_info(metrics)").all().some((c) => c.name === 'user_id');
if (!hasUserScopedMetrics) {
  db.exec('DROP TABLE IF EXISTS entries; DROP TABLE IF EXISTS metrics;');
}

// Same story for adding a name to accounts that were created before this
// column existed - rebuild rather than migrate in place.
const hasUserName = db.prepare("PRAGMA table_info(users)").all().some((c) => c.name === 'name');
if (!hasUserName) {
  db.exec('DROP TABLE IF EXISTS sessions; DROP TABLE IF EXISTS users;');
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    name TEXT NOT NULL,
    unit TEXT,
    type TEXT NOT NULL CHECK(type IN ('numeric', 'boolean')),
    goal REAL,
    color TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    UNIQUE(user_id, key)
  );

  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_id INTEGER NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    value REAL NOT NULL,
    UNIQUE(metric_id, date)
  );

  CREATE TABLE IF NOT EXISTS profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const defaultMetrics = [
  { key: 'protein', name: 'Protein', unit: 'g', type: 'numeric', goal: 150, color: '#39ff14', sort_order: 1 },
  { key: 'water', name: 'Water', unit: 'ml', type: 'numeric', goal: 3000, color: '#00e5ff', sort_order: 2 },
  { key: 'steps', name: 'Steps', unit: 'steps', type: 'numeric', goal: 10000, color: '#ff6ec7', sort_order: 3 },
  { key: 'no_instagram', name: 'No Instagram', unit: null, type: 'boolean', goal: null, color: '#bd00ff', sort_order: 4 },
  { key: 'sleep', name: 'Sleep', unit: 'hrs', type: 'numeric', goal: 8, color: '#7c4dff', sort_order: 6 },
  { key: 'workout', name: 'Workout', unit: null, type: 'boolean', goal: null, color: '#ff9100', sort_order: 7 },
  { key: 'reading', name: 'Reading', unit: 'min', type: 'numeric', goal: 30, color: '#2bff88', sort_order: 9 },
  { key: 'studying', name: 'Studying', unit: 'min', type: 'numeric', goal: 60, color: '#00fff0', sort_order: 10 },
  { key: 'weight', name: 'Weight', unit: 'kg', type: 'numeric', goal: null, color: '#2979ff', sort_order: 0 },
];

const insertMetric = db.prepare(`
  INSERT INTO metrics (user_id, key, name, unit, type, goal, color, sort_order)
  VALUES (@user_id, @key, @name, @unit, @type, @goal, @color, @sort_order)
`);
const seedDefaultMetricsForUser = db.transaction((userId) => {
  for (const m of defaultMetrics) insertMetric.run({ ...m, user_id: userId });
});

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, and password are required' });
  if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'email already registered' });

  const info = db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name, email, hashPassword(password));
  seedDefaultMetricsForUser(info.lastInsertRowid);

  const token = generateToken();
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, info.lastInsertRowid);
  res.status(201).json({ token, user: { id: info.lastInsertRowid, name, email } });
});

app.post('/api/auth/signin', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'invalid email or password' });
  }

  const token = generateToken();
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, user.id);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/auth/signout', requireAuth(db), (req, res) => {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(req.get('authorization').slice(7));
  res.status(204).end();
});

app.get('/api/auth/me', requireAuth(db), (req, res) => {
  const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.userId);
  res.json({ user });
});

app.get('/api/profile', requireAuth(db), (req, res) => {
  const row = db.prepare('SELECT data FROM profiles WHERE user_id = ?').get(req.userId);
  res.json({ profile: row ? JSON.parse(row.data) : null });
});

app.put('/api/profile', requireAuth(db), (req, res) => {
  db.prepare(`
    INSERT INTO profiles (user_id, data, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
  `).run(req.userId, JSON.stringify(req.body));
  res.status(204).end();
});

app.get('/api/metrics', requireAuth(db), (req, res) => {
  const metrics = db.prepare('SELECT * FROM metrics WHERE user_id = ? ORDER BY sort_order, id').all(req.userId);
  res.json(metrics);
});

app.post('/api/metrics', requireAuth(db), (req, res) => {
  const { key, name, unit, type, goal, color, sort_order } = req.body;
  if (!key || !name || !type || !color) {
    return res.status(400).json({ error: 'key, name, type, color are required' });
  }
  if (!['numeric', 'boolean'].includes(type)) {
    return res.status(400).json({ error: 'type must be numeric or boolean' });
  }
  try {
    const info = db.prepare(`
      INSERT INTO metrics (user_id, key, name, unit, type, goal, color, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.userId, key, name, unit || null, type, goal ?? null, color, sort_order ?? 0);
    const metric = db.prepare('SELECT * FROM metrics WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(metric);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/metrics/:id', requireAuth(db), (req, res) => {
  db.prepare('DELETE FROM metrics WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.status(204).end();
});

// Entries for a single metric, optionally bounded by date range (YYYY-MM-DD)
app.get('/api/entries', requireAuth(db), (req, res) => {
  const { metric_id, from, to } = req.query;
  if (!metric_id) return res.status(400).json({ error: 'metric_id is required' });
  const metric = db.prepare('SELECT id FROM metrics WHERE id = ? AND user_id = ?').get(metric_id, req.userId);
  if (!metric) return res.status(404).json({ error: 'metric not found' });
  let query = 'SELECT * FROM entries WHERE metric_id = ?';
  const params = [metric_id];
  if (from) { query += ' AND date >= ?'; params.push(from); }
  if (to) { query += ' AND date <= ?'; params.push(to); }
  query += ' ORDER BY date';
  res.json(db.prepare(query).all(...params));
});

// All entries for all metrics within a date range - used to render the full grid in one call
app.get('/api/entries/summary', requireAuth(db), (req, res) => {
  const { from, to } = req.query;
  let query = 'SELECT entries.* FROM entries JOIN metrics ON metrics.id = entries.metric_id WHERE metrics.user_id = ?';
  const params = [req.userId];
  if (from) { query += ' AND date >= ?'; params.push(from); }
  if (to) { query += ' AND date <= ?'; params.push(to); }
  res.json(db.prepare(query).all(...params));
});

// Upsert today's (or any date's) value for a metric
app.post('/api/entries', requireAuth(db), (req, res) => {
  const { metric_id, date, value } = req.body;
  if (!metric_id || !date || value === undefined) {
    return res.status(400).json({ error: 'metric_id, date, value are required' });
  }
  const metric = db.prepare('SELECT id FROM metrics WHERE id = ? AND user_id = ?').get(metric_id, req.userId);
  if (!metric) return res.status(404).json({ error: 'metric not found' });
  db.prepare(`
    INSERT INTO entries (metric_id, date, value)
    VALUES (?, ?, ?)
    ON CONFLICT(metric_id, date) DO UPDATE SET value = excluded.value
  `).run(metric_id, date, value);
  const entry = db.prepare('SELECT * FROM entries WHERE metric_id = ? AND date = ?').get(metric_id, date);
  res.status(200).json(entry);
});

app.delete('/api/entries/:id', requireAuth(db), (req, res) => {
  db.prepare(`
    DELETE FROM entries WHERE id = ? AND metric_id IN (SELECT id FROM metrics WHERE user_id = ?)
  `).run(req.params.id, req.userId);
  res.status(204).end();
});

const { generatePlan } = require('./planGenerator');

app.post('/api/plan', (req, res) => {
  const { heightCm, age, sex, weightKg, targetWeightKg, bodyFatPercent, activityLevel, schedule } = req.body;
  if (!heightCm || !age || !sex || !weightKg || !targetWeightKg) {
    return res.status(400).json({ error: 'heightCm, age, sex, weightKg, and targetWeightKg are required' });
  }
  if (!['male', 'female'].includes(sex)) {
    return res.status(400).json({ error: 'sex must be male or female' });
  }
  try {
    const plan = generatePlan({ heightCm, age, sex, weightKg, targetWeightKg, bodyFatPercent, activityLevel, schedule });
    res.json(plan);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Tracker listening on http://localhost:${PORT}`));
