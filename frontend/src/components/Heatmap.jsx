import { buildWeeks, cellColor, monthLabels } from '../heatmapUtils';

export default function Heatmap({ metric, entryMap, onSelectDay }) {
  const weeks = buildWeeks();
  const months = monthLabels(weeks);

  return (
    <div className="heatmap">
      <div className="heatmap-months">
        {months.map((m) => (
          <span key={m.index} style={{ gridColumnStart: m.index + 1 }}>
            {m.label}
          </span>
        ))}
      </div>
      <div className="heatmap-grid">
        {weeks.map((week, wi) => (
          <div className="heatmap-col" key={wi}>
            {week.map((iso, di) =>
              iso ? (
                <div
                  key={di}
                  className="heatmap-cell"
                  style={{ background: cellColor(metric, entryMap[iso]) }}
                  title={`${iso}: ${entryMap[iso] ?? 'no data'}`}
                  onClick={() => onSelectDay(iso)}
                />
              ) : (
                <div key={di} className="heatmap-cell heatmap-cell--empty" />
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
