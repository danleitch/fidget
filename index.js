const robot = require("robotjs");

const START_HOUR = 8;  // 8am
const END_HOUR = 17;   // 5pm
const MIN_MS = 60 * 1000;   // 1 min
const MAX_MS = 270 * 1000;  // 4.5 min

function randomDelay() {
  return Math.floor(Math.random() * (MAX_MS - MIN_MS + 1)) + MIN_MS;
}

function tick() {
  const hour = new Date().getHours();

  if (hour >= END_HOUR) {
    console.log("Past 5pm, stopping.");
    process.exit(0);
  }

  if (hour >= START_HOUR) {
    const { x, y } = robot.getMousePos();
    robot.moveMouse(x + 5, y);
    robot.moveMouse(x, y);
    robot.mouseClick(); // remove this line if you don't want clicks
  }

  const delay = randomDelay();
  console.log(`Next run in ${(delay / 1000).toFixed(0)}s`);
  setTimeout(tick, delay);
}

tick();
