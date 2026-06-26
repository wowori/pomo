// Detached worker: waits until the deadline stored in active.json,
// then finalizes the session (writes a record, fires beep+notification).
// Self-deletes: re-reads active.json right before acting to ensure it is still
// pointed at this PID; if not, exits silently.

import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { appendSession } from '../src/sessions.mjs';
import { beep, notify } from '../src/notify.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const activePath = process.argv[2];
if (!activePath) process.exit(1);

function readActive() {
  if (!existsSync(activePath)) return null;
  try {
    return JSON.parse(readFileSync(activePath, 'utf8'));
  } catch {
    return null;
  }
}

function finalize(active) {
  const record = {
    type: active.type,
    label: active.label || '',
    start: active.start,
    end: active.deadline,
    durationSec: active.durationSec,
    completed: true,
  };
  appendSession(record);
  try {
    unlinkSync(activePath);
  } catch {}
  if (active.notifyOnDone) {
    beep();
    notify({
      title: 'Pomodoro',
      body: `${active.type === 'focus' ? 'Focus' : 'Break'} complete${active.label ? `: ${active.label}` : ''}`,
    });
  }
}

(async () => {
  const initial = readActive();
  if (!initial) process.exit(0);
  const deadline = new Date(initial.deadline).getTime();
  const delay = deadline - Date.now();
  if (delay > 0) await new Promise((r) => setTimeout(r, delay));
  // Re-read right before acting. If someone replaced/stopped the session, bail.
  const current = readActive();
  if (!current) process.exit(0);
  if (current.start !== initial.start || current.deadline !== initial.deadline) process.exit(0);
  finalize(current);
})();
