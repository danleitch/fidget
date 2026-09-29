const robot = require("robotjs");

const START_HOUR = 8;          // 8am
const END_HOUR = 17;           // 5pm
const IDLE_MS = 3 * 60 * 1000; // only nudge after 3 min of no mouse movement
const POLL_MS = 5 * 1000;      // how often to check for mouse movement
const CLICK = true;            // set to false if you don't want clicks

let last = robot.getMousePos();
let lastActive = Date.now();

function tick() {
  const hour = new Date().getHours();

  if (hour >= END_HOUR) {
    console.log("Past 5pm, stopping.");
    process.exit(0);
  }

  const pos = robot.getMousePos();
  if (pos.x !== last.x || pos.y !== last.y) {
    // You moved the mouse, so you're active: reset the idle timer.
    last = pos;
    lastActive = Date.now();
  } else if (hour >= START_HOUR && Date.now() - lastActive >= IDLE_MS) {
    robot.moveMouse(pos.x + 5, pos.y);
    robot.moveMouse(pos.x, pos.y);
    if (CLICK) robot.mouseClick();
    last = robot.getMousePos(); // our own nudge shouldn't count as activity
    lastActive = Date.now() - IDLE_MS + randomDelay();
    console.log("Idle detected, nudged mouse.");
  }
}

// Wait a random 1 to 1.5 min before the next nudge while still idle.
function randomDelay() {
  return 60 * 1000 + Math.floor(Math.random() * 30 * 1000);
}

setInterval(tick, POLL_MS);
tick();
