---
name: idle-buster
description: Install, configure, run, and troubleshoot idle-buster — the Node script that keeps a PC awake by nudging the mouse during idle periods. Use when asked to get idle-buster running, fix a failed `npm install` of robotjs or desktop-idle, change the working hours, lunch break, nudge interval, or end-of-day sleep behaviour.
---

# idle-buster

A small Node script (`index.js` starts it; the code lives in `src/`) that polls
the OS idle timer and nudges the mouse, keyboard and scroll wheel when the user
has been away, so the machine does not sleep or lock. It is working-hours aware,
pauses over lunch, and can suspend the machine at the end of the day.

Where things live: `src/config.js` (all settings), `src/scheduler.js` (the poll
loop in `tick()`), `src/nudge.js` (one nudge), `src/mouse.js` / `keyboard.js` /
`scroll.js` (the input behaviours), `src/lunch.js`, `src/power.js` (suspend
command), `src/robot.js` (robotjs setup), `src/logger.js`, `src/util.js`.

## Getting it running

1. Check Node 14+ is present: `node --version`.
2. Install dependencies: `npm install` in the repo root.
3. Start it: `npm start` (equivalent to `node index.js`).

Both dependencies (`robotjs`, `desktop-idle`) are **native modules**, so the
install step compiles C++. A missing toolchain is the usual failure.

### Install prerequisites by platform

- **Windows:** Python 3 and Visual Studio 2022 Build Tools with the *Desktop
  development with C++* workload. Reopen the terminal after installing them.
- **macOS:** `xcode-select --install`, then grant *Accessibility* permission to
  the terminal app, or `robot.moveMouse` silently does nothing.
- **Linux:** `sudo apt install libxtst-dev libpng++-dev build-essential`, and an
  X11 session (Wayland is not supported by robotjs).

## Troubleshooting install failures

| Symptom | Fix |
| ------- | --- |
| `gyp ERR! find Python` in Git Bash | `npm_config_python="$HOME/AppData/Local/Programs/Python/Python312/python.exe" npm install` |
| `MSB4019` / missing `Microsoft.Cpp.Default.props` | The C++ workload is not installed — rerun the VS Build Tools installer and tick *Desktop development with C++* |
| `gyp ERR! find Python ... NOT SUPPORTED` | Only an old Python (e.g. 3.8) is found — `winget install Python.Python.3.12`, then point `npm_config_python` at it |
| `Cannot find module './build/Release/robotjs.node'` | `npm install` finished without compiling — run `npm rebuild robotjs desktop-idle` |
| `Cannot find module 'robotjs'` at runtime | `npm install` never completed; re-run it and read the compile errors, do not ignore them |
| Script runs but the cursor never moves (macOS) | Accessibility permission missing for the terminal |

## Configuration

All settings are constants in `src/config.js` — there are no CLI flags. To
change behaviour, edit the constant.

| Constant | Default | Meaning |
| -------- | ------- | ------- |
| `START_HOUR` | `8` | Nudging begins at this hour (24h clock) |
| `END_HOUR` | `17` | Script stops at this hour |
| `IDLE_MS` | `180000` | Idle time required before a nudge (3 min) |
| `POLL_MS` | `5000` | How often the idle timer is checked |
| `CLICK` | `true` | Also click after the nudge |
| `LUNCH_START_HOUR` | `13` | Lunch pause begins in this hour |
| `LUNCH_END_HOUR` | `14` | Lunch pause ends in this hour |
| `LUNCH_JITTER_MIN` / `LUNCH_JITTER_MAX` | `1` / `10` | Random minutes added to both ends of the lunch window, re-rolled each day |
| `SLEEP_AT_END` | `true` | Suspend the machine when `END_HOUR` arrives |

Keep `IDLE_MS` comfortably below the machine's own sleep/lock timeout — 3 minutes
against a 5-minute timer.

## How it behaves

Every `POLL_MS` the script:

1. Exits if the hour is `>= END_HOUR`, suspending the machine first when
   `SLEEP_AT_END` is on (`rundll32 powrprof.dll,SetSuspendState` on Windows,
   `pmset sleepnow` on macOS, `systemctl suspend` elsewhere).
2. Plans that day's lunch window if it has not already — `LUNCH_START_HOUR` and
   `LUNCH_END_HOUR` each offset by a fresh random 1–10 minutes.
3. Does nothing while inside the lunch window.
4. Nudges if the hour is `>= START_HOUR` and the OS idle time (mouse **and**
   keyboard) is at least `IDLE_MS`.

Log lines are `[HH:MM] <emoji>  <message>`, e.g.
`[09:15] 🖱️  Idle detected, nudged mouse.` Startup prints a banner with the
active hours and settings; lunch, resume, stop, and sleep each get their own line.

## Gotchas when editing

- The nudge resets the OS idle timer, so cadence is driven by `IDLE_MS`, not by
  a separate schedule.
- `CLICK` clicks wherever the cursor happens to rest — warn the user before
  enabling it if that matters.
- Lunch state is tracked with `onLunch` so the pause/resume lines log once per
  transition, not on every poll. Preserve that if you refactor `tick()` in
  `src/scheduler.js`.
- The scheduler owns the run state (`nudging`, `stopping`, `timer`); `nudge()`
  and `suspendMachine()` are stateless and just do their one job.
- The lunch plan is keyed on `toDateString()`, which is what makes an overnight
  run re-roll the jitter for the new day.
