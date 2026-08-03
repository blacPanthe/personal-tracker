import { useRef, useState } from 'react';

const WIDTH = 640;
const HEIGHT = 160;
const PAD_TOP = 20;
const PAD_BOTTOM = 24;
const PAD_X = 12;

// Renders points evenly by index (not by calendar day) - simple trend shape,
// consistent with how sparse tracker entries are usually visualized.
export default function LineChart({ data, color, unit, targetValue, targetLabel }) {
  const svgRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!data.length) {
    return <p className="chart-empty">No entries logged yet.</p>;
  }

  const values = data.map((d) => d.value);
  const allValues = targetValue != null ? [...values, targetValue] : values;
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const span = max - min || 1;
  const yPad = span * 0.15;
  const scaleY = (v) =>
    HEIGHT - PAD_BOTTOM - ((v - (min - yPad)) / (span + yPad * 2)) * (HEIGHT - PAD_TOP - PAD_BOTTOM);
  const scaleX = (i) =>
    data.length === 1 ? WIDTH / 2 : PAD_X + (i / (data.length - 1)) * (WIDTH - PAD_X * 2);

  const points = data.map((d, i) => [scaleX(i), scaleY(d.value)]);
  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  const handleMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach(([x], i) => {
      const dist = Math.abs(x - relX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  };

  const last = data[data.length - 1];
  const hovered = hoverIndex != null ? data[hoverIndex] : null;
  const hoverX = hoverIndex != null ? points[hoverIndex][0] : null;

  return (
    <div className="line-chart">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="line-chart-svg"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {targetValue != null && (
          <>
            <line
              x1={PAD_X}
              x2={WIDTH - PAD_X}
              y1={scaleY(targetValue)}
              y2={scaleY(targetValue)}
              className="line-chart-target"
            />
            <text x={WIDTH - PAD_X} y={scaleY(targetValue) - 6} textAnchor="end" className="line-chart-target-label">
              {targetLabel}
            </text>
          </>
        )}

        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {hoverX != null && (
          <line x1={hoverX} x2={hoverX} y1={PAD_TOP} y2={HEIGHT - PAD_BOTTOM} className="line-chart-crosshair" />
        )}

        {points.map(([x, y], i) => (
          <circle
            key={data[i].date}
            cx={x}
            cy={y}
            r={i === hoverIndex || i === points.length - 1 ? 5 : 3}
            fill={color}
            stroke="var(--bg-card)"
            strokeWidth="2"
          />
        ))}

        <text x={points[points.length - 1][0]} y={points[points.length - 1][1] - 12} textAnchor="end" className="line-chart-end-label">
          {last.value}
          {unit ? ` ${unit}` : ''}
        </text>
      </svg>

      <div className="line-chart-axis">
        <span>{formatShortDate(data[0].date)}</span>
        <span>{formatShortDate(data[data.length - 1].date)}</span>
      </div>

      {hovered && (
        <div className="line-chart-tooltip">
          <strong>
            {hovered.value}
            {unit ? ` ${unit}` : ''}
          </strong>
          <span>{formatShortDate(hovered.date)}</span>
        </div>
      )}
    </div>
  );
}

function formatShortDate(iso) {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
