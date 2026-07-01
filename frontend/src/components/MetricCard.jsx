import { useState } from 'react';
import Heatmap from './Heatmap';
import { currentStreak, toLocalIso } from '../heatmapUtils';

const todayIso = () => toLocalIso(new Date());

export default function MetricCard({ metric, entryMap, onLog }) {
  const [date, setDate] = useState(todayIso());
  const [value, setValue] = useState('');
  const streak = currentStreak(metric, entryMap);

  const handleSubmit = (e) => {
    e.preventDefault();
    const v = metric.type === 'boolean' ? 1 : Number(value);
    if (metric.type === 'numeric' && Number.isNaN(v)) return;
    onLog(metric.id, date, v);
    if (metric.type === 'numeric') setValue('');
  };

  return (
    <div className="metric-card" style={{ '--metric-color': metric.color }}>
      <div className="metric-card-header">
        <div>
          <h2>{metric.name}</h2>
          <span className="metric-streak">
            {streak > 0 ? `${streak} day${streak === 1 ? '' : 's'} streak` : 'no streak yet'}
          </span>
        </div>
        <form className="metric-form" onSubmit={handleSubmit}>
          <input
            type="date"
            value={date}
            max={todayIso()}
            onChange={(e) => setDate(e.target.value)}
          />
          {metric.type === 'numeric' ? (
            <input
              type="number"
              placeholder={metric.unit ? `${metric.unit}` : 'value'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          ) : (
            <span className="metric-unit">done?</span>
          )}
          <button type="submit" style={{ background: metric.color }}>
            {metric.type === 'boolean' ? '✓' : 'Log'}
          </button>
        </form>
      </div>
      <Heatmap metric={metric} entryMap={entryMap} onSelectDay={setDate} />
    </div>
  );
}
