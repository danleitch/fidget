const robot = require("./robot");
const {
  SCREEN_PRESET,
  CLICK,
  KEYBOARD,
  KEYS_CHANCE,
  SCROLL,
  SCROLL_CHANCE,
} = require("./config");
const { rand, sleep } = require("./util");
const { log } = require("./logger");
const { pickTarget, moveHumanLike } = require("./mouse");
const { scrollGesture } = require("./scroll");
const { typeBurst } = require("./keyboard");

async function nudge(now) {
  const did = [];

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
}

module.exports = { nudge };
