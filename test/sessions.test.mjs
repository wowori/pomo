import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { appendSession, readAllSessions, readSessions } from '../src/sessions.mjs';

function tempFile() {
  const dir = mkdtempSync(join(tmpdir(), 'pomo-test-'));
  return join(dir, 'sessions.jsonl');
}

test('append/read round-trip', () => {
  const path = tempFile();
  appendSession({ type: 'focus', durationSec: 1500, start: '2026-06-26T12:00:00Z', end: '2026-06-26T12:25:00Z', label: 'a', completed: true }, path);
  appendSession({ type: 'break', durationSec: 300, start: '2026-06-26T12:30:00Z', end: '2026-06-26T12:35:00Z', label: '', completed: true }, path);
  const all = readAllSessions(path);
  assert.equal(all.length, 2);
  assert.equal(all[0].type, 'focus');
  assert.equal(all[1].type, 'break');
});

test('read skips corrupt lines', () => {
  const path = tempFile();
  appendSession({ type: 'focus', durationSec: 1500, start: '2026-06-26T12:00:00Z', end: '2026-06-26T12:25:00Z', label: '', completed: true }, path);
  appendFileSync(path, '{not valid json\n');
  const all = readAllSessions(path);
  assert.equal(all.length, 1);
});

test('read filters by type and since', () => {
  const path = tempFile();
  const old = { type: 'focus', durationSec: 1500, start: '2020-01-01T00:00:00Z', end: '2020-01-01T00:25:00Z', label: '', completed: true };
  const recent = { type: 'break', durationSec: 300, start: '2026-06-26T12:30:00Z', end: '2026-06-26T12:35:00Z', label: '', completed: true };
  appendSession(old, path);
  appendSession(recent, path);
  const since = new Date('2025-01-01T00:00:00Z');
  const filtered = readSessions({ since, path });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].type, 'break');
  const byType = readSessions({ type: 'focus', path });
  assert.equal(byType.length, 1);
});

test('read respects limit', () => {
  const path = tempFile();
  for (let i = 0; i < 5; i++) {
    appendSession({ type: 'focus', durationSec: 60, start: new Date().toISOString(), end: new Date().toISOString(), label: '', completed: true }, path);
  }
  const last2 = readSessions({ limit: 2, path });
  assert.equal(last2.length, 2);
});
