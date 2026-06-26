import { readFileSync, existsSync, appendFileSync, mkdirSync } from 'node:fs';
import { POMO_DIR, SESSIONS_PATH } from './paths.mjs';

function ensureDir(dir = POMO_DIR) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function resolvePath(p) {
  return p || SESSIONS_PATH;
}

function ensureFile(p = SESSIONS_PATH) {
  ensureDir();
  if (!existsSync(p)) appendFileSync(p, '');
}

// Append one record atomically (single write of one line).
export function appendSession(record, pathOverride) {
  const p = resolvePath(pathOverride);
  ensureFile(p);
  const line = JSON.stringify(record) + '\n';
  appendFileSync(p, line);
  return record;
}

// Read all sessions as objects. Skips blank and malformed lines.
export function readAllSessions(pathOverride) {
  const p = resolvePath(pathOverride);
  ensureFile(p);
  const text = readFileSync(p, 'utf8');
  const out = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      // skip corrupt line
    }
  }
  return out;
}

export function readSessions({ since, type, limit, path } = {}) {
  const all = readAllSessions(path);
  const filtered = all.filter((s) => {
    if (type && s.type !== type) return false;
    if (since && new Date(s.start) < since) return false;
    return true;
  });
  if (limit && limit > 0) return filtered.slice(-limit);
  return filtered;
}
