import { useEffect, useMemo, useState } from 'react';
import { getMetrics, getEntriesSummary, upsertEntry } from './api';
import MetricCard from './components/MetricCard';
import PlanForm from './components/PlanForm';
import { usePlanForm } from './hooks/usePlanForm';
import { toLocalIso } from './heatmapUtils';

function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toLocalIso(d);
}

export default function App() {
  const [tab, setTab] = useState('trackers');
  const [metrics, setMetrics] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const planForm = usePlanForm();

  useEffect(() => {
    Promise.all([getMetrics(), getEntriesSummary(isoDaysAgo(371), isoDaysAgo(0))])
      .then(([m, e]) => {
        setMetrics(m);
        setEntries(e);
      })
      .finally(() => setLoading(false));
  }, []);

  const entryMapsByMetric = useMemo(() => {
    const map = {};
    for (const metric of metrics) map[metric.id] = {};
    for (const entry of entries) {
      if (!map[entry.metric_id]) map[entry.metric_id] = {};
      map[entry.metric_id][entry.date] = entry.value;
    }
    return map;
  }, [metrics, entries]);

  const handleLog = async (metric_id, date, value) => {
    const saved = await upsertEntry(metric_id, date, value);
    setEntries((prev) => {
      const withoutOld = prev.filter((e) => !(e.metric_id === metric_id && e.date === date));
      return [...withoutOld, saved];
    });
  };

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          Personal <span className="accent">Tracker</span>
        </h1>
        <p>Your habits, mapped like commits.</p>
        <nav className="app-tabs">
          <button
            className={`app-tab${tab === 'trackers' ? ' active' : ''}`}
            onClick={() => setTab('trackers')}
          >
            Trackers
          </button>
          <button className={`app-tab${tab === 'meals' ? ' active' : ''}`} onClick={() => setTab('meals')}>
            Meal Plan
          </button>
          <button className={`app-tab${tab === 'workouts' ? ' active' : ''}`} onClick={() => setTab('workouts')}>
            Workout Plan
          </button>
        </nav>
      </header>
      {tab === 'trackers' && (
        <main className="metric-list">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.id}
              metric={metric}
              entryMap={entryMapsByMetric[metric.id] || {}}
              onLog={handleLog}
            />
          ))}
        </main>
      )}
      {tab === 'meals' && <PlanForm mode="meals" {...planForm} />}
      {tab === 'workouts' && <PlanForm mode="workouts" {...planForm} />}
    </div>
  );
}
