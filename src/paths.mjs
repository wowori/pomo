import { homedir } from 'node:os';
import { join } from 'node:path';

export const POMO_DIR = join(homedir(), '.pomo');
export const CONFIG_PATH = join(POMO_DIR, 'config.json');
export const SESSIONS_PATH = join(POMO_DIR, 'sessions.jsonl');
export const ACTIVE_PATH = join(POMO_DIR, 'active.json');
