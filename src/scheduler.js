const desktopIdle = require("desktop-idle");
const {
  START_HOUR,
  END_HOUR,
  IDLE_MS,
  POLL_MS,
  CLICK,
  SLEEP_AT_END,
  SCREEN_PRESET,
  KEYBOARD,
  SCROLL,
} = require("./config");
const { hhmm } = require("./util");
const { log } = require("./logger");
const { planLunch } = require("./lunch");
const { nudge } = require("./nudge");
const { suspendMachine } = require("./power");

let lunch = null;
let onLunch = false;
let nudging = false;
let stopping = false;
let timer = null;

function sleepThenExit() {
  stopping = true;
  clearInterval(timer);
  suspendMachine().then(() => process.exit(0));
}

function startNudge(now) {
  nudging = true;
  nudge(now)
    .catch((error) => log("⚠️", `Nudge failed: ${error.message}`, now))
    .finally(() => {
      nudging = false;
    });
}

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
    startNudge(now);
  }
}

function start() {
  const startedAt = new Date();
  log("🚀", "fidget started.", startedAt);
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
}

module.exports = { start };
