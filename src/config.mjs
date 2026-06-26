import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { POMO_DIR, CONFIG_PATH } from './paths.mjs';

export const DEFAULTS = {
  focusMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4, // every Nth focus -> long break
  autoBreak: false, // prompt for break after focus
  notify: true, // desktop notification on completion
  beep: true, // console beep on completion
  label: '', // default label for sessions
};

function ensureDir() {
  if (!existsSync(POMO_DIR)) mkdirSync(POMO_DIR, { recursive: true });
}

export function loadConfig() {
  ensureDir();
  if (!existsSync(CONFIG_PATH)) return { ...DEFAULTS };
  try {
    const raw = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
    return { ...DEFAULTS, ...raw };
  } catch (err) {
    throw new Error(
      `failed to parse ${CONFIG_PATH}: ${err.message}\n` +
        `To recover, run 'pomo config reset' (this will overwrite the file with defaults).`,
    );
  }
}

export function saveConfig(cfg) {
  ensureDir();
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2) + '\n');
}

// Pure validator: returns the coerced value or throws. No filesystem access.
export function coerceConfigValue(key, value) {
  if (!(key in DEFAULTS)) {
    const allowed = Object.keys(DEFAULTS).join(', ');
    throw new Error(`unknown config key "${key}". Allowed: ${allowed}`);
  }
  const def = DEFAULTS[key];
  if (typeof def === 'number') {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new Error(`${key} must be a number`);
    if (parsed <= 0) throw new Error(`${key} must be greater than 0`);
    return parsed;
  }
  if (typeof def === 'boolean') {
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    throw new Error(`${key} must be true or false`);
  }
  return String(value);
}

export function setKey(key, value) {
  const parsed = coerceConfigValue(key, value);
  const cfg = loadConfig();
  cfg[key] = parsed;
  saveConfig(cfg);
  return parsed;
}

export function resetConfig() {
  saveConfig({ ...DEFAULTS });
  return { ...DEFAULTS };
}
