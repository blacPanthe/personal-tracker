// Date -> YYYY-MM-DD using local time. Date.toISOString() converts to UTC first,
// which rolls "today" over early for any timezone west of UTC - avoid it for date keys.
export function toLocalIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Builds the same week-column / day-row grid GitHub uses for its contribution graph.
export function buildWeeks(days = 371) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  // Shift back to the most recent Sunday so the grid's first row is Sunday.
  start.setDate(start.getDate() - start.getDay());

  const weeks = [];
  let cursor = new Date(start);
  while (cursor <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const iso = toLocalIso(cursor);
      week.push(cursor > today ? null : iso);
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function intensity(metric, value) {
  if (value === undefined || value === null) return 0;
  if (metric.type === 'boolean') return value > 0 ? 4 : 0;
  if (!metric.goal) return value > 0 ? 4 : 0;
  const ratio = value / metric.goal;
  if (ratio <= 0) return 0;
  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 1) return 3;
  return 4;
}

export function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function cellColor(metric, value) {
  const level = intensity(metric, value);
  if (level === 0) return 'rgba(255, 255, 255, 0.06)';
  const alphas = [0, 0.25, 0.5, 0.75, 1];
  return hexToRgba(metric.color, alphas[level]);
}

export function currentStreak(metric, entryMap) {
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (;;) {
    const iso = toLocalIso(cursor);
    const value = entryMap[iso];
    if (intensity(metric, value) > 0) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function monthLabels(weeks) {
  const labels = [];
  let lastMonth = -1;
  weeks.forEach((week, i) => {
    const firstValid = week.find((d) => d);
    if (!firstValid) return;
    const month = new Date(firstValid).getMonth();
    if (month !== lastMonth) {
      labels.push({ index: i, label: new Date(firstValid).toLocaleString('en-US', { month: 'short' }) });
      lastMonth = month;
    }
  });
  return labels;
}
