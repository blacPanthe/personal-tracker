import { useMemo, useState } from 'react';
import LineChart from './LineChart';
import { toLocalIso, intensity } from '../heatmapUtils';

const RANGE_PRESETS = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toLocalIso(d);
}

function seriesInRange(entryMap, fromIso) {
  return Object.entries(entryMap)
    .filter(([date, value]) => date >= fromIso && value !== undefined && value !== null)
    .map(([date, value]) => ({ date, value: Number(value) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export default function Analytics({ metrics, entryMapsByMetric, targetWeightKg }) {
  const [rangeDays, setRangeDays] = useState(30);
  const fromIso = useMemo(() => isoDaysAgo(rangeDays), [rangeDays]);

  const numericMetrics = metrics.filter((m) => m.type === 'numeric');
  const booleanMetrics = metrics.filter((m) => m.type === 'boolean');
  const weightMetric = numericMetrics.find((m) => m.key === 'weight');
  const otherNumericMetrics = numericMetrics.filter((m) => m.key !== 'weight');

  const weightSeries = weightMetric ? seriesInRange(entryMapsByMetric[weightMetric.id] || {}, fromIso) : [];
  const weightDelta =
    weightSeries.length >= 2 ? weightSeries[weightSeries.length - 1].value - weightSeries[0].value : null;

  return (
    <div className="analytics-page">
      <div className="analytics-range-row">
        {RANGE_PRESETS.map((p) => (
          <button
            key={p.days}
            type="button"
            className={`analytics-range-btn${rangeDays === p.days ? ' active' : ''}`}
            onClick={() => setRangeDays(p.days)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {weightMetric && (
        <div className="analytics-hero-card" style={{ '--metric-color': weightMetric.color }}>
          <div className="analytics-hero-header">
            <div>
              <h2>Weight</h2>
              {weightDelta != null && (
                <span className={`analytics-delta${weightDelta <= 0 ? ' down' : ' up'}`}>
                  {weightDelta > 0 ? '+' : ''}
                  {weightDelta.toFixed(1)} kg over {rangeDays}d
                </span>
              )}
            </div>
          </div>
          <LineChart
            data={weightSeries}
            color={weightMetric.color}
            unit={weightMetric.unit}
            targetValue={targetWeightKg || undefined}
            targetLabel={targetWeightKg ? `Target ${targetWeightKg}kg` : undefined}
          />
        </div>
      )}

      {otherNumericMetrics.length > 0 && (
        <div className="analytics-grid">
          {otherNumericMetrics.map((metric) => (
            <div className="analytics-card" key={metric.id} style={{ '--metric-color': metric.color }}>
              <h3>{metric.name}</h3>
              <LineChart data={seriesInRange(entryMapsByMetric[metric.id] || {}, fromIso)} color={metric.color} unit={metric.unit} />
            </div>
          ))}
        </div>
      )}

      {booleanMetrics.length > 0 && (
        <div className="analytics-grid">
          {booleanMetrics.map((metric) => {
            const entryMap = entryMapsByMetric[metric.id] || {};
            const series = seriesInRange(entryMap, fromIso);
            const daysLogged = series.filter((d) => intensity(metric, d.value) > 0).length;
            const totalDays = Math.min(
              rangeDays,
              Math.ceil((Date.now() - new Date(`${fromIso}T00:00:00`)) / 86400000) + 1
            );
            const pct = totalDays > 0 ? Math.round((daysLogged / totalDays) * 100) : 0;
            return (
              <div className="analytics-card analytics-completion-card" key={metric.id} style={{ '--metric-color': metric.color }}>
                <h3>{metric.name}</h3>
                <div className="analytics-completion-value">
                  {daysLogged}/{totalDays}
                </div>
                <div className="analytics-completion-bar">
                  <div className="analytics-completion-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="analytics-completion-pct">{pct}% of days</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
