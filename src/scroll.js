const robot = require("./robot");
const { SCROLL_STEP } = require("./config");
const { rand, sleep } = require("./util");

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

module.exports = { scrollGesture };
