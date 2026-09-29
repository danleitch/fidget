const robot = require("robotjs");
const desktopIdle = require("desktop-idle");

const START_HOUR = 8;          // 8am
const END_HOUR = 17;           // 5pm
const IDLE_MS = 3 * 60 * 1000; // only nudge after 3 min of no mouse or keyboard input
const POLL_MS = 5 * 1000;      // how often to check the idle time
const CLICK = true;            // set to false if you don't want clicks

function tick() {
  const hour = new Date().getHours();

  if (hour >= END_HOUR) {
    console.log("Past 5pm, stopping.");
    process.exit(0);
  }

  // OS-level idle time covers typing as well as mouse movement.
  const idleMs = desktopIdle.getIdleTime() * 1000;

  if (hour >= START_HOUR && idleMs >= IDLE_MS) {
    const { x, y } = robot.getMousePos();
    robot.moveMouse(x + 5, y);
    robot.moveMouse(x, y);
    if (CLICK) robot.mouseClick();
    // The nudge resets the OS idle timer, so the next one is IDLE_MS away.
    console.log("Idle detected, nudged mouse.");
  }
}

setInterval(tick, POLL_MS);
tick();
