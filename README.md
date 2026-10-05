# 🖱️ fidget

> A tiny Node.js script that stops your PC from going into standby, sleep, or "away" mode by gently nudging the mouse, but only when you've stopped using your mouse and keyboard.

![Node](https://img.shields.io/badge/node-%3E%3D14-339933?logo=node.js&logoColor=white)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

- **Prevents standby / sleep / screen lock** by simulating small mouse activity.
- **Only acts when you're idle** – reads the OS idle timer (mouse **and** keyboard) and stays out of the way while you work.
- **Steady cadence** – once idle, it nudges every `IDLE_MS` (3 minutes) for as long as you stay away.
- **Working-hours aware** – only active after 8:00 AM and exits automatically at 5:00 PM.
- **Lunch break** – pauses between 1:00 PM and 2:00 PM, with a random 1–10 minute offset on each end so it never pauses on the dot.
- **Sleeps your PC at the end of the day** – suspends the machine at 5:00 PM before exiting.
- **Readable log** – timestamped, emoji-tagged lines like `[09:15] 🖱️  Idle detected, nudged mouse.`
- **Invisible movement** – the cursor moves 5px and returns straight away.
- **Optional click** – easily disabled with a one-line change.
- **Zero config** – all settings in one small file, two dependencies.

## 📋 Requirements

- [Node.js](https://nodejs.org/) 14 or newer
- Build tools required by the native modules [`robotjs`](https://github.com/octalmage/robotjs) and [`desktop-idle`](https://github.com/bithavoc/node-desktop-idle):
  - **Windows:** Python 3 and [Visual Studio 2022 Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with the **Desktop development with C++** workload selected
  - **macOS:** Xcode Command Line Tools (`xcode-select --install`) and grant *Accessibility* permission to your terminal
  - **Linux:** `sudo apt install libxtst-dev libpng++-dev build-essential` and an X11 session

## 🚀 Installation

```bash
git clone https://github.com/danleitch/fidget.git
cd fidget
npm install
```

On Windows, close and reopen your terminal after installing Python and Visual Studio Build Tools. If you are using Git Bash and npm cannot find Python, run:

```bash
npm_config_python="$HOME/AppData/Local/Programs/Python/Python312/python.exe" npm install
```

If `npm start` fails with `Cannot find module './build/Release/robotjs.node'`, the install finished without compiling the native modules. Run `npm rebuild robotjs desktop-idle` (with the Python path above if needed) and read any compiler errors. On Windows, `winget install Python.Python.3.12` and `winget install Microsoft.VisualStudio.2022.BuildTools --override "--quiet --wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"` set up the toolchain. Note node-gyp rejects Python 3.8 and older.

The Visual Studio installer must include the **Desktop development with C++** workload. Both `robotjs` and `desktop-idle` contain native code and need this compiler toolchain during installation.

## ▶️ Usage

```bash
npm start
```

Example output:

```text
[08:30] 🚀  fidget started.
[08:30] ⚙️  Active 08:00 - 17:00, nudging after 3 min idle, click on, sleep at 17:00 on.
[08:30] 🍽️  Lunch break planned for 13:04 - 14:09.
[09:12] 🖱️  Idle detected, nudged mouse.
[09:15] 🖱️  Idle detected, nudged mouse.
[13:04] 🍽️  Lunch break - pausing until 14:09.
[14:09] ▶️  Lunch over, back on.
[17:00] 🛑  Past 5pm, stopping.
[17:00] 😴  Putting the machine to sleep.
```

Stop it any time with `Ctrl + C`.

## ⚙️ Configuration

Edit the constants in `src/config.js`:

| Setting             | Default  | Description                                                           |
| ------------------- | -------- | --------------------------------------------------------------------- |
| `START_HOUR`        | `8`      | Hour (24h clock) after which activity begins                          |
| `END_HOUR`          | `17`     | Hour (24h clock) at which the script stops                            |
| `IDLE_MS`           | `180000` | No mouse/keyboard input for this long (3 min) before a nudge          |
| `POLL_MS`           | `5000`   | How often the idle time is checked (5 seconds)                        |
| `CLICK`             | `true`   | Whether to also click after nudging                                   |
| `LUNCH_START_HOUR`  | `13`     | Hour in which the lunch pause begins                                  |
| `LUNCH_END_HOUR`    | `14`     | Hour in which the lunch pause ends                                    |
| `LUNCH_JITTER_MIN`  | `1`      | Fewest random minutes added to each end of the lunch window           |
| `LUNCH_JITTER_MAX`  | `10`     | Most random minutes added to each end of the lunch window             |
| `SLEEP_AT_END`      | `true`   | Put the machine to sleep at `END_HOUR` before exiting                 |
| `LOGGING`           | `true`   | Print status messages to the console; `false` runs silently           |

### Silent mode

Set `LOGGING = false` in `src/config.js` to run with no console output at all (including the startup summary and any warnings).

### Disable the click

If you only want mouse movement, set `CLICK = false` in `src/config.js`.

### Lunch break

Each day the script picks a fresh start and end time for the pause – somewhere
between 1:00–1:10 PM and 2:00–2:10 PM – so the break never lands on the same
minute twice. It logs the planned window on startup and does nothing at all
until lunch is over.

### Skip the end-of-day sleep

Set `SLEEP_AT_END = false` if you want the script to just exit at 5 PM and leave
the machine running. The sleep uses `rundll32 powrprof.dll,SetSuspendState` on
Windows, `pmset sleepnow` on macOS, and `systemctl suspend` on Linux.

> **Tip:** keep `IDLE_MS` comfortably below your PC's sleep/lock timeout (e.g. use 3 minutes for a 5-minute timer).

## 🗂️ Project layout

```text
index.js            entry point – just starts the scheduler
src/
  config.js         every user-editable setting
  scheduler.js      the poll loop: working hours, lunch, idle check, startup banner
  nudge.js          one nudge = mouse move + optional scroll, keys and click
  mouse.js          Bézier-curve cursor movement
  keyboard.js       human-timed key bursts
  scroll.js         decelerating scroll flick and scroll-back
  lunch.js          picks each day's jittered lunch window
  power.js          per-platform suspend command
  robot.js          loads robotjs and sets its delays once
  logger.js         timestamped, emoji-tagged console output
  util.js           rand, sleep, hhmm helpers
```

## 🔍 How it works

1. Every `POLL_MS` the script checks the current hour and the OS idle time (time since your last mouse or keyboard input).
2. If it's past `END_HOUR`, it puts the machine to sleep (unless `SLEEP_AT_END` is off) and exits.
3. If you're inside today's lunch window, it does nothing until the window closes.
4. If you've used the mouse or keyboard recently, nothing happens.
5. If you've been idle for `IDLE_MS` (and it's past `START_HOUR`), it moves the cursor 5px, moves it back, and (optionally) clicks. This resets the OS idle timer, so the next nudge is another `IDLE_MS` away.

## ⚠️ Notes

- The optional click happens wherever the cursor currently is – be careful it isn't resting over something you don't want clicked.
- The 5 PM sleep suspends the machine, so save your work before then or set `SLEEP_AT_END = false`.
- Please use this responsibly and in line with your employer's policies. It is intended to keep your own machine awake, not to misrepresent activity.

## 📄 License

MIT
