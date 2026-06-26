import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { appendSession } from '../src/sessions.mjs';
import { computeStats, computeStreak } from '../src/stats.mjs';

function tempFile() {
  const dir = mkdtempSync(join(tmpdir(), 'pomo-test-'));
  return join(dir, 'sessions.jsonl');
}

function record({ type = 'focus', durationSec = 1500, daysAgo = 0 } = {}) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return {
    type,
    label: '',
    start: d.toISOString(),
    end: d.toISOString(),
    durationSec,
    completed: true,
  };
}

test('aggregate: counts focus and break separately', () => {
  const path = tempFile();
  appendSession(record({ type: 'focus', durationSec: 1500 }), path);
  appendSession(record({ type: 'focus', durationSec: 600 }), path);
  appendSession(record({ type: 'break', durationSec: 300 }), path);
  const s = computeStats({ period: 'all', path });
  assert.equal(s.focusCount, 2);
  assert.equal(s.breakCount, 1);
  assert.equal(s.focusSec, 2100);
  assert.equal(s.breakSec, 300);
});

test('computeStreak: empty -> 0', () => {
  const path = tempFile();
  appendSession(record({ type: 'break', daysAgo: 0 }), path); // breaks don't count
  assert.equal(computeStreak([{ type: 'break', start: new Date().toISOString() }]), 0);
});

test('computeStreak: three consecutive days ending today', () => {
  const records = [
    record({ daysAgo: 0 }),
    record({ daysAgo: 1 }),
    record({ daysAgo: 2 }),
  ];
  assert.equal(computeStreak(records), 3);
});

test('computeStreak: gap breaks the chain', () => {
  const records = [record({ daysAgo: 0 }), record({ daysAgo: 2 })];
  assert.equal(computeStreak(records), 1);
});

test('period filter: month excludes older than 30 days', () => {
  const path = tempFile();
  appendSession(record({ daysAgo: 0 }), path);
  appendSession(record({ daysAgo: 5 }), path);
  appendSession(record({ daysAgo: 40 }), path); // excluded
  const s = computeStats({ period: 'month', path });
  assert.equal(s.focusCount, 2);
});
