const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'tracker.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    unit TEXT,
    type TEXT NOT NULL CHECK(type IN ('numeric', 'boolean')),
    goal REAL,
    color TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_id INTEGER NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    value REAL NOT NULL,
    UNIQUE(metric_id, date)
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
  INSERT OR IGNORE INTO metrics (key, name, unit, type, goal, color, sort_order)
  VALUES (@key, @name, @unit, @type, @goal, @color, @sort_order)
`);
const seedTx = db.transaction((metrics) => {
  for (const m of metrics) insertMetric.run(m);
});
seedTx(defaultMetrics);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/metrics', (req, res) => {
  const metrics = db.prepare('SELECT * FROM metrics ORDER BY sort_order, id').all();
  res.json(metrics);
});

app.post('/api/metrics', (req, res) => {
  const { key, name, unit, type, goal, color, sort_order } = req.body;
  if (!key || !name || !type || !color) {
    return res.status(400).json({ error: 'key, name, type, color are required' });
  }
  if (!['numeric', 'boolean'].includes(type)) {
    return res.status(400).json({ error: 'type must be numeric or boolean' });
  }
  try {
    const info = db.prepare(`
      INSERT INTO metrics (key, name, unit, type, goal, color, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(key, name, unit || null, type, goal ?? null, color, sort_order ?? 0);
    const metric = db.prepare('SELECT * FROM metrics WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(metric);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/metrics/:id', (req, res) => {
  db.prepare('DELETE FROM metrics WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// Entries for a single metric, optionally bounded by date range (YYYY-MM-DD)
app.get('/api/entries', (req, res) => {
  const { metric_id, from, to } = req.query;
  if (!metric_id) return res.status(400).json({ error: 'metric_id is required' });
  let query = 'SELECT * FROM entries WHERE metric_id = ?';
  const params = [metric_id];
  if (from) { query += ' AND date >= ?'; params.push(from); }
  if (to) { query += ' AND date <= ?'; params.push(to); }
  query += ' ORDER BY date';
  res.json(db.prepare(query).all(...params));
});

// All entries for all metrics within a date range - used to render the full grid in one call
app.get('/api/entries/summary', (req, res) => {
  const { from, to } = req.query;
  let query = 'SELECT * FROM entries WHERE 1=1';
  const params = [];
  if (from) { query += ' AND date >= ?'; params.push(from); }
  if (to) { query += ' AND date <= ?'; params.push(to); }
  res.json(db.prepare(query).all(...params));
});

// Upsert today's (or any date's) value for a metric
app.post('/api/entries', (req, res) => {
  const { metric_id, date, value } = req.body;
  if (!metric_id || !date || value === undefined) {
    return res.status(400).json({ error: 'metric_id, date, value are required' });
  }
  db.prepare(`
    INSERT INTO entries (metric_id, date, value)
    VALUES (?, ?, ?)
    ON CONFLICT(metric_id, date) DO UPDATE SET value = excluded.value
  `).run(metric_id, date, value);
  const entry = db.prepare('SELECT * FROM entries WHERE metric_id = ? AND date = ?').get(metric_id, date);
  res.status(200).json(entry);
});

app.delete('/api/entries/:id', (req, res) => {
  db.prepare('DELETE FROM entries WHERE id = ?').run(req.params.id);
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
