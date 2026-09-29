# 🖱️ idle-buster

> A tiny Node.js script that stops your PC from going into standby, sleep, or "away" mode by gently nudging the mouse at random intervals during working hours.

![Node](https://img.shields.io/badge/node-%3E%3D14-339933?logo=node.js&logoColor=white)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

- **Prevents standby / sleep / screen lock** by simulating small mouse activity.
- **Random timing** – runs every 1 to 4.5 minutes, so the pattern isn't predictable.
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
Next run in 143s
Next run in 87s
Next run in 231s
Past 5pm, stopping.
```

Stop it any time with `Ctrl + C`.

## ⚙️ Configuration

Edit the constants at the top of `index.js`:

| Setting      | Default    | Description                                   |
| ------------ | ---------- | --------------------------------------------- |
| `START_HOUR` | `8`        | Hour (24h clock) after which activity begins  |
| `END_HOUR`   | `17`       | Hour (24h clock) at which the script exits    |
| `MIN_MS`     | `60000`    | Minimum delay between nudges (1 minute)       |
| `MAX_MS`     | `270000`   | Maximum delay between nudges (4.5 minutes)    |

### Disable the click

If you only want mouse movement, delete or comment out this line:

```js
robot.mouseClick(); // remove this line if you don't want clicks
```

> **Tip:** keep `MAX_MS` comfortably below your PC's idle timeout (e.g. a 5-minute screen-lock timer).

## 🔍 How it works

1. On each tick the script checks the current hour.
2. If it's past `END_HOUR`, it exits.
3. If it's past `START_HOUR`, it reads the cursor position, moves it 5px right, moves it back, and (optionally) clicks.
4. It schedules the next tick after a random delay between `MIN_MS` and `MAX_MS`.

## ⚠️ Notes

- The optional click happens wherever the cursor currently is – be careful it isn't resting over something you don't want clicked.
- Please use this responsibly and in line with your employer's policies. It is intended to keep your own machine awake, not to misrepresent activity.

## 📄 License

MIT
