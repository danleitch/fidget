const { execFile } = require("child_process");
const robot = require("robotjs");
const desktopIdle = require("desktop-idle");

const START_HOUR = 8;          // 8am
const END_HOUR = 17;           // 5pm
const IDLE_MS = 3 * 60 * 1000; // only nudge after 3 min of no mouse or keyboard input
const POLL_MS = 5 * 1000;      // how often to check the idle time
const CLICK = true;            // set to false if you don't want clicks
const LUNCH_START_HOUR = 13;   // pause for lunch from 1pm
const LUNCH_END_HOUR = 14;     // and come back at 2pm
const LUNCH_JITTER_MIN = 1;    // the lunch window starts/ends this many minutes late, at least
const LUNCH_JITTER_MAX = 10;   // ...and at most, picked fresh each day
const SLEEP_AT_END = true;     // put the machine to sleep when the day finishes
const LOGGING = true;          // set to false to run silently with no console output

function hhmm(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function log(emoji, message, at = new Date()) {
  if (!LOGGING) return;
  console.log(`[${hhmm(at)}] ${emoji}  ${message}`);
}

function randomJitterMinutes() {
  const span = LUNCH_JITTER_MAX - LUNCH_JITTER_MIN + 1;
  return LUNCH_JITTER_MIN + Math.floor(Math.random() * span);
}

// Lunch never starts on the dot - each day gets its own offset into both ends
// of the window, so the pause doesn't look machine-timed.
function planLunch(now) {
  const start = new Date(now);
  start.setHours(LUNCH_START_HOUR, randomJitterMinutes(), 0, 0);

  const end = new Date(now);
  end.setHours(LUNCH_END_HOUR, randomJitterMinutes(), 0, 0);

  return { day: now.toDateString(), start, end };
}

// Each platform has its own way of suspending; none of them need elevation.
function sleepCommand() {
  if (process.platform === "win32") {
    return ["rundll32.exe", ["powrprof.dll,SetSuspendState", "0,1,0"]];
  }
  if (process.platform === "darwin") {
    return ["pmset", ["sleepnow"]];
  }
  return ["systemctl", ["suspend"]];
}

function sleepThenExit() {
  stopping = true;
  clearInterval(timer);

  const [command, args] = sleepCommand();
  log("😴", "Putting the machine to sleep.");

  execFile(command, args, (error) => {
    if (error) {
      log("⚠️", `Could not sleep the machine: ${error.message}`);
    }
    process.exit(0);
  });
}

let lunch = null;
let onLunch = false;
let stopping = false;
let timer = null;

function tick() {
  if (stopping) return;

  const now = new Date();
  const hour = now.getHours();

  if (hour >= END_HOUR) {
    log("🛑", "Past 5pm, stopping.", now);
    if (SLEEP_AT_END) {
      sleepThenExit();
      return;
    }
    process.exit(0);
  }

  if (!lunch || lunch.day !== now.toDateString()) {
    lunch = planLunch(now);
    onLunch = false;
    log("🍽️", `Lunch break planned for ${hhmm(lunch.start)} - ${hhmm(lunch.end)}.`, now);
  }

  if (now >= lunch.start && now < lunch.end) {
    if (!onLunch) {
      onLunch = true;
      log("🍽️", `Lunch break - pausing until ${hhmm(lunch.end)}.`, now);
    }
    return;
  }

  if (onLunch) {
    onLunch = false;
    log("▶️", "Lunch over, back on.", now);
  }

  // OS-level idle time covers typing as well as mouse movement.
  const idleMs = desktopIdle.getIdleTime() * 1000;

  if (hour >= START_HOUR && idleMs >= IDLE_MS) {
    const { x, y } = robot.getMousePos();
    robot.moveMouse(x + 5, y);
    robot.moveMouse(x, y);
    if (CLICK) robot.mouseClick();
    // The nudge resets the OS idle timer, so the next one is IDLE_MS away.
    log("🖱️", "Idle detected, nudged mouse.", now);
  }
}

const startedAt = new Date();
log("🚀", "idle-buster started.", startedAt);
log(
  "⚙️",
  `Active ${String(START_HOUR).padStart(2, "0")}:00 - ${String(END_HOUR).padStart(2, "0")}:00, ` +
    `nudging after ${IDLE_MS / 60000} min idle, click ${CLICK ? "on" : "off"}, ` +
    `sleep at ${String(END_HOUR).padStart(2, "0")}:00 ${SLEEP_AT_END ? "on" : "off"}.`,
  startedAt
);

timer = setInterval(tick, POLL_MS);
tick();
