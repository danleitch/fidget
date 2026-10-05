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

// Screen preset: how far (in pixels) each nudge travels. Pick the closest match.
const SCREEN_PRESET = "desktop";
const SCREEN_PRESETS = {
  laptop:    { min: 40,  max: 180 },  // ~13-16" panels
  desktop:   { min: 80,  max: 350 },  // ~24-27" 1080p/1440p
  ultrawide: { min: 120, max: 600 },  // 34"+ or 4K
  multi:     { min: 150, max: 800 },  // large or multi-monitor setups
};
const EDGE_MARGIN = 20;              // keep targets this far from the screen edge

// Keyboard activity: short bursts of key presses with uneven, human-ish timing.
const KEYBOARD = true;
const KEYS_CHANCE = 0.6;             // chance a nudge includes a key burst
const KEY_BURST_MIN = 3;             // keys per burst
const KEY_BURST_MAX = 12;
// Keys that do nothing visible. F15 is absent from most keyboards and unbound
// by default on Windows/Linux. On macOS try "f13" if F15 triggers anything.
// Avoid Shift: five quick taps pop up the Windows Sticky Keys dialog.
const KEY_POOL = ["f15"];

// Natural scrolling: a quick flick that decelerates, a pause, then a scroll back.
const SCROLL = true;
const SCROLL_CHANCE = 0.6;           // chance a nudge includes a scroll gesture
const SCROLL_STEP = 1;               // size of one wheel notch; tune if too fast/slow on your OS

robot.setMouseDelay(1);
robot.setKeyboardDelay(1);

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

function rand(min, max) {
  return min + Math.random() * (max - min);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Lunch never starts on the dot - each day gets its own offset into both ends
// of the window, so the pause doesn't look machine-timed.
function planLunch(now) {
  const start = new Date(now);
  start.setHours(LUNCH_START_HOUR, randomJitterMinutes(), 0, 0);

  const end = new Date(now);
  end.setHours(LUNCH_END_HOUR, randomJitterMinutes(), 0, 0);

  return { day: now.toDateString(), start, end };
}

// ---------- Human-like mouse movement ----------

// Pick a random destination within the preset's distance range, kept on screen.
function pickTarget(x, y) {
  const { min, max } = SCREEN_PRESETS[SCREEN_PRESET] || SCREEN_PRESETS.desktop;
  const { width, height } = robot.getScreenSize();

  for (let attempt = 0; attempt < 10; attempt++) {
    const angle = rand(0, Math.PI * 2);
    const dist = rand(min, max);
    const tx = Math.round(x + Math.cos(angle) * dist);
    const ty = Math.round(y + Math.sin(angle) * dist);
    if (
      tx >= EDGE_MARGIN && tx <= width - EDGE_MARGIN &&
      ty >= EDGE_MARGIN && ty <= height - EDGE_MARGIN
    ) {
      return { x: tx, y: ty };
    }
  }

  // Cornered (e.g. mouse in a corner of a small screen): head toward the centre.
  return {
    x: Math.round(x + (width / 2 - x) * rand(0.2, 0.5)),
    y: Math.round(y + (height / 2 - y) * rand(0.2, 0.5)),
  };
}

// Cubic Bézier with two control points pushed off the straight line by a
// random amount, so every path bows a little differently.
function buildCurve(start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length; // unit normal to the straight line
  const ny = dx / length;

  const bow = (t) => {
    const offset = rand(-0.3, 0.3) * length;
    return {
      x: start.x + dx * t + nx * offset,
      y: start.y + dy * t + ny * offset,
    };
  };

  return [start, bow(rand(0.2, 0.4)), bow(rand(0.6, 0.8)), end];
}

function bezierPoint([p0, p1, p2, p3], t) {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

// Slow at both ends, fast in the middle, like a real hand movement.
function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

async function moveHumanLike(target) {
  const start = robot.getMousePos();
  const curve = buildCurve(start, target);
  const distance = Math.hypot(target.x - start.x, target.y - start.y);
  const steps = Math.max(20, Math.min(90, Math.round(distance / rand(5, 9))));
  const totalMs = rand(250, 700) + distance * rand(0.5, 1.2);

  for (let i = 1; i <= steps; i++) {
    const p = bezierPoint(curve, easeInOut(i / steps));
    const last = i === steps;
    // Tiny hand tremor on the way, none on the final point so we land exactly.
    const x = Math.round(p.x + (last ? 0 : rand(-1, 1)));
    const y = Math.round(p.y + (last ? 0 : rand(-1, 1)));
    robot.moveMouse(x, y);
    await sleep((totalMs / steps) * rand(0.7, 1.3));
  }
}

// ---------- Human-like keyboard activity ----------

// Gaps between keystrokes follow a log-normal shape: most are short, a few are
// long, which is much closer to real typing than a uniform random delay.
function typingGap() {
  const u1 = Math.random() || 1e-9;
  const u2 = Math.random();
  const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const gap = Math.exp(Math.log(170) + 0.5 * normal); // median ~170 ms
  return Math.min(Math.max(gap, 45), 900);
}

async function pressKey(key) {
  robot.keyToggle(key, "down");
  try {
    await sleep(rand(40, 115)); // key hold time varies too
  } finally {
    robot.keyToggle(key, "up"); // never leave a key stuck down
  }
}

async function typeBurst() {
  const count = Math.round(rand(KEY_BURST_MIN, KEY_BURST_MAX));
  for (let i = 0; i < count; i++) {
    const key = KEY_POOL[Math.floor(Math.random() * KEY_POOL.length)];
    await pressKey(key);
    await sleep(typingGap());
    // Now and then, stop mid-burst as if thinking or reading.
    if (Math.random() < 0.12) await sleep(rand(600, 1800));
  }
}

// ---------- Natural scrolling ----------

// A run of wheel notches that starts quick and slows down, like a flick.
async function scrollRun(direction, notches) {
  let delay = rand(15, 40);
  for (let i = 0; i < notches; i++) {
    robot.scrollMouse(0, direction * SCROLL_STEP);
    await sleep(delay);
    delay *= rand(1.1, 1.45); // decelerate
  }
}

// Scroll one way, pause as if reading, then scroll most of the way back. The
// sign convention differs between OSes and natural-scrolling settings, but
// because the gesture undoes itself the page never drifts far either way.
async function scrollGesture() {
  const direction = Math.random() < 0.5 ? 1 : -1;
  const notches = Math.round(rand(3, 9));
  await scrollRun(direction, notches);
  await sleep(rand(800, 2500));
  await scrollRun(-direction, Math.max(1, Math.round(notches * rand(0.8, 1.1))));
}

// ---------- Nudge ----------

let nudging = false;

async function nudge(now) {
  nudging = true;
  const did = [];
  try {
    const { x, y } = robot.getMousePos();
    await moveHumanLike(pickTarget(x, y));
    did.push("mouse");

    if (SCROLL && Math.random() < SCROLL_CHANCE) {
      await sleep(rand(200, 600));
      await scrollGesture();
      did.push("scroll");
    }

    if (KEYBOARD && Math.random() < KEYS_CHANCE) {
      await sleep(rand(300, 900));
      await typeBurst();
      did.push("keys");
    }

    if (CLICK) {
      await sleep(rand(60, 200)); // short settle before clicking
      robot.mouseClick();
      did.push("click");
    }

    // The nudge resets the OS idle timer, so the next one is IDLE_MS away.
    log("🖱️", `Idle detected (${SCREEN_PRESET} preset): ${did.join(" + ")}.`, now);
  } finally {
    nudging = false;
  }
}

// ---------- Sleep / schedule ----------

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
  if (stopping || nudging) return;

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
    nudge(now).catch((error) => log("⚠️", `Nudge failed: ${error.message}`, now));
  }
}

const startedAt = new Date();
log("🚀", "idle-buster started.", startedAt);
log(
  "⚙️",
  `Active ${String(START_HOUR).padStart(2, "0")}:00 - ${String(END_HOUR).padStart(2, "0")}:00, ` +
    `nudging after ${IDLE_MS / 60000} min idle, preset ${SCREEN_PRESET}, click ${CLICK ? "on" : "off"}, ` +
    `keys ${KEYBOARD ? "on" : "off"}, scroll ${SCROLL ? "on" : "off"}, ` +
    `sleep at ${String(END_HOUR).padStart(2, "0")}:00 ${SLEEP_AT_END ? "on" : "off"}.`,
  startedAt
);

timer = setInterval(tick, POLL_MS);
tick();