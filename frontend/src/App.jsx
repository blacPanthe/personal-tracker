import { useEffect, useMemo, useState } from 'react';
import { getMetrics, getEntriesSummary, upsertEntry } from './api';
import MetricCard from './components/MetricCard';
import Landing from './components/Landing';
import AuthForm from './components/AuthForm';
import ProfileForm from './components/ProfileForm';
import PlanResults from './components/PlanResults';
import { usePlanForm } from './hooks/usePlanForm';
import { useAuth } from './hooks/useAuth';
import { toLocalIso } from './heatmapUtils';

function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toLocalIso(d);
}

export default function App() {
  const auth = useAuth();
  const [authView, setAuthView] = useState('landing');
  const [tab, setTab] = useState('profile');
  const [metrics, setMetrics] = useState([]);
  const [entries, setEntries] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const planForm = usePlanForm();

  useEffect(() => {
    if (!auth.user) return;
    setDataLoading(true);
    Promise.all([getMetrics(), getEntriesSummary(isoDaysAgo(371), isoDaysAgo(0))])
      .then(([m, e]) => {
        setMetrics(m);
        setEntries(e);
      })
      .finally(() => setDataLoading(false));
  }, [auth.user]);

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

  if (auth.checking) return <div className="loading">Loading…</div>;

  if (!auth.user) {
    if (authView === 'landing') {
      return <Landing onGetStarted={() => setAuthView('signup')} onSignIn={() => setAuthView('signin')} />;
    }
    return (
      <AuthForm
        mode={authView}
        onSubmit={authView === 'signup' ? auth.signUp : auth.signIn}
        onSwitchMode={() => setAuthView(authView === 'signup' ? 'signin' : 'signup')}
        onClose={() => setAuthView('landing')}
      />
    );
  }

  if (dataLoading) return <div className="loading">Loading…</div>;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <img src="/favicon.svg" alt="" className="app-brand-mark" width={32} height={32} />
          <h1>
            Base<span className="accent">line</span>
          </h1>
        </div>
        <p>Your habits, mapped like commits.</p>
        <nav className="app-tabs">
          <button className={`app-tab${tab === 'profile' ? ' active' : ''}`} onClick={() => setTab('profile')}>
            Profile
          </button>
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
          <button className="app-tab" onClick={auth.signOut}>
            Sign out
          </button>
        </nav>
      </header>
      {tab === 'profile' && <ProfileForm {...planForm} />}
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
      {tab === 'meals' && <PlanResults mode="meals" plan={planForm.plan} onGoToProfile={() => setTab('profile')} />}
      {tab === 'workouts' && (
        <PlanResults mode="workouts" plan={planForm.plan} onGoToProfile={() => setTab('profile')} />
      )}
    </div>
  );
}
