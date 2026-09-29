# 🖱️ idle-buster

> A tiny Node.js script that stops your PC from going into standby, sleep, or "away" mode by gently nudging the mouse, but only when you've stopped using it.

![Node](https://img.shields.io/badge/node-%3E%3D14-339933?logo=node.js&logoColor=white)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

- **Prevents standby / sleep / screen lock** by simulating small mouse activity.
- **Only acts when you're idle** – watches the mouse and stays completely out of the way while you work.
- **Random timing** – once idle, nudges again every 1 to 1.5 minutes at slightly randomised intervals.
- **Working-hours aware** – only active after 8:00 AM and exits automatically at 5:00 PM.
- **Invisible movement** – the cursor moves 5px and returns straight away.
- **Optional click** – easily disabled with a one-line change.
- **Zero config** – one file, one dependency.

## 📋 Requirements

- [Node.js](https://nodejs.org/) 14 or newer
- Build tools required by [`robotjs`](https://github.com/octalmage/robotjs) (a native module):
  - **Windows:** `npm install --global windows-build-tools` (or Visual Studio Build Tools)
  - **macOS:** Xcode Command Line Tools (`xcode-select --install`) and grant *Accessibility* permission to your terminal
  - **Linux:** `sudo apt install libxtst-dev libpng++-dev build-essential` and an X11 session

## 🚀 Installation

```bash
git clone https://github.com/danleitch/idle-buster.git
cd idle-buster
npm install
```

## ▶️ Usage

```bash
npm start
```

Example output:

```
Idle detected, nudged mouse.
Idle detected, nudged mouse.
Past 5pm, stopping.
```

Stop it any time with `Ctrl + C`.

## ⚙️ Configuration

Edit the constants at the top of `index.js`:

| Setting      | Default    | Description                                            |
| ------------ | ---------- | ------------------------------------------------------ |
| `START_HOUR` | `8`        | Hour (24h clock) after which activity begins           |
| `END_HOUR`   | `17`       | Hour (24h clock) at which the script exits             |
| `IDLE_MS`    | `180000`   | Mouse must be still this long (3 min) before a nudge   |
| `POLL_MS`    | `5000`     | How often the mouse position is checked (5 seconds)    |
| `CLICK`      | `true`     | Whether to also click after nudging                    |

### Disable the click

If you only want mouse movement, set `CLICK = false` in `index.js`.

> **Tip:** keep `IDLE_MS` comfortably below your PC's sleep/lock timeout (e.g. use 3 minutes for a 5-minute timer).

## 🔍 How it works

1. Every `POLL_MS` the script checks the current hour and the mouse position.
2. If it's past `END_HOUR`, it exits.
3. If the mouse moved since the last check, you're active, so the idle timer resets and nothing happens.
4. If the mouse has been still for `IDLE_MS` (and it's past `START_HOUR`), it moves the cursor 5px, moves it back, and (optionally) clicks.
5. While you stay idle, it repeats after a short random delay.

> **Limitation:** only mouse movement counts as activity. If you're typing without touching the mouse for longer than `IDLE_MS`, a nudge can still fire.

## ⚠️ Notes

- The optional click happens wherever the cursor currently is – be careful it isn't resting over something you don't want clicked.
- Please use this responsibly and in line with your employer's policies. It is intended to keep your own machine awake, not to misrepresent activity.

## 📄 License

MIT
