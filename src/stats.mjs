import { readSessions } from './sessions.mjs';
import { startOfDay, startOfWeek, fmtDuration } from './format.mjs';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function dateKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function aggregate(records) {
  let focusSec = 0;
  let breakSec = 0;
  let focusCount = 0;
  let breakCount = 0;
  for (const r of records) {
    if (r.type === 'focus') {
      focusSec += r.durationSec || 0;
      focusCount += 1;
    } else if (r.type === 'break') {
      breakSec += r.durationSec || 0;
      breakCount += 1;
    }
  }
  return { focusSec, breakSec, focusCount, breakCount, totalSec: focusSec + breakSec };
}

// Compute streak: number of consecutive days, ending today or yesterday, with >=1 focus session.
export function computeStreak(records) {
  if (records.length === 0) return 0;
  const days = new Set(records.filter((r) => r.type === 'focus').map((r) => dateKey(r.start)));
  if (days.size === 0) return 0;
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  // If today has no session, streak can still be valid if yesterday had one.
  if (!days.has(dateKey(cursor.toISOString()))) {
    cursor = new Date(cursor.getTime() - ONE_DAY_MS);
    if (!days.has(dateKey(cursor.toISOString()))) return 0;
  }
  while (days.has(dateKey(cursor.toISOString()))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - ONE_DAY_MS);
  }
  return streak;
}

export function computeStats({ period = 'day', path } = {}) {
  let since;
  if (period === 'day') since = startOfDay();
  else if (period === 'week') since = startOfWeek();
  else if (period === 'month') {
    since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - 30);
  } else if (period === 'all') since = null;
  else throw new Error(`unknown period: ${period}`);

  const records = readSessions({ since, path });
  const agg = aggregate(records);
  const streak = computeStreak(readSessions({ path }));
  return { period, ...agg, streak };
}

export function formatStats(stats, { json = false } = {}) {
  if (json) return JSON.stringify(stats, null, 2);
  const lines = [];
  const label = { day: 'Today', week: 'This week', month: 'Last 30 days', all: 'All time' }[stats.period] || stats.period;
  lines.push(`${label}:`);
  lines.push(`  Focus:   ${stats.focusCount} sessions, ${fmtDuration(stats.focusSec)}`);
  lines.push(`  Breaks:  ${stats.breakCount} sessions, ${fmtDuration(stats.breakSec)}`);
  lines.push(`  Total:   ${fmtDuration(stats.totalSec)}`);
  if (stats.streak > 0) {
    lines.push(`  Streak:  ${stats.streak} day${stats.streak === 1 ? '' : 's'}`);
  }
  return lines.join('\n');
}
