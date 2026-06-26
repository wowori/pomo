# @wowori/pomo

[![npm](https://img.shields.io/npm/v/@wowori/pomo)](https://www.npmjs.com/package/@wowori/pomo)
[![node](https://img.shields.io/node/v/@wowori/pomo)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/@wowori/pomo)](./LICENSE)
[![no deps](https://img.shields.io/badge/dependencies-zero-blue)]()

A cross-platform Pomodoro timer CLI. **Zero dependencies** — just Node.js ≥18.

- Foreground-free: `pomo start` returns immediately, the session runs detached.
- Beep + desktop notification when time's up.
- Local session log + daily/weekly/monthly stats + streak.
- Shell completions for bash, zsh, fish.
- Windows, macOS, Linux.

## Install

```bash
npm install -g @wowori/pomo
```

Or run without installing:

```bash
npx @wowori/pomo start 25
```

## Quick start

```bash
pomo start                    # focus, 25 min (default)
pomo start 1h30m --label "deep work"
pomo break 10
pomo stop                     # cancel the active session
pomo status                   # what's running + time left
pomo stats                    # today
pomo stats week
pomo log -n 5                 # last 5 sessions
pomo config set focusMinutes 50
pomo completions bash > ~/.pomo-completion.bash
```

## Commands

| Command | What it does |
| --- | --- |
| `pomo start [duration] [--label "..."] [--auto-break] [--force]` | Start a focus session. |
| `pomo break [duration] [--label "..."] [--force]` | Start a break. |
| `pomo stop` | Cancel the active session (logged as stopped). |
| `pomo status [--json]` | Show active session + remaining time. |
| `pomo stats [day\|week\|month\|all] [--json]` | Aggregate stats for the period. |
| `pomo log [--limit N] [--today] [--type focus\|break] [--json]` | List sessions. |
| `pomo config get\|set\|list\|reset [key] [value]` | Manage config. |
| `pomo completions <bash\|zsh\|fish>` | Print a completion script. |
| `pomo --version` | Print version. |
| `pomo --help` | Show usage. |

### Duration syntax

- Bare number → minutes: `25` = 25 min
- With suffix: `90s`, `25m`, `1h`, `1h30m`, `1h30m15s`
- Omitted → uses the value from `config focusMinutes` (or `breakMinutes` for `pomo break`)

## Configuration

Config lives in `~/.pomo/config.json`. Defaults:

| Key | Default | Meaning |
| --- | --- | --- |
| `focusMinutes` | `25` | Default focus length. |
| `breakMinutes` | `5` | Default break length. |
| `longBreakMinutes` | `15` | (Reserved for future use.) |
| `longBreakEvery` | `4` | (Reserved for future use.) |
| `autoBreak` | `false` | (Reserved for future use.) |
| `notify` | `true` | Send a desktop notification on completion. |
| `beep` | `true` | Audible beep on completion. |
| `label` | `""` | Default label applied to new sessions. |

```bash
pomo config set focusMinutes 50
pomo config set notify false
pomo config get focusMinutes
pomo config list
pomo config reset
```

## Where data lives

| File | Purpose |
| --- | --- |
| `~/.pomo/config.json` | Configuration. |
| `~/.pomo/active.json` | The currently active session (deleted on completion). |
| `~/.pomo/sessions.jsonl` | One JSON record per completed/stopped session. |

## Notifications

- **Windows:** beep via PowerShell `[Console]::Beep`. Notification via BurntToast if installed; otherwise a balloon-tip fallback. To enable rich toasts: `Install-Module -Scope CurrentUser BurntToast` (one-time, in an elevated PowerShell).
- **macOS:** beep via terminal bell; notification via `osascript`.
- **Linux:** beep via terminal bell; notification via `notify-send` (libnotify).

## How it runs in the background

`pomo start` writes the session to `~/.pomo/active.json`, spawns a detached worker (`bin/pomo-worker.mjs`) and exits. The worker sleeps until the deadline, then writes the session to `sessions.jsonl`, removes `active.json`, and fires beep+notification. Any subsequent `pomo` command reconciles `active.json` — if the worker died unexpectedly before the deadline, the session is logged as `stopped`; if past the deadline, as `done`.

`pomo stop` removes `active.json` and kills the worker.

## Development

```bash
git clone https://github.com/wowori/pomo
cd pomo
npm test           # node --test test/
npm start -- start 5s
```

## License

[MIT](./LICENSE)
