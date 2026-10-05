const robot = require("./robot");
const { ALT_TAB_MIN_MS, ALT_TAB_MAX_MS } = require("./config");
const { rand, sleep } = require("./util");

// On macOS the app switcher is Cmd+Tab; everywhere else it is Alt+Tab.
const MODIFIER = process.platform === "darwin" ? "command" : "alt";

async function switchOnce() {
  robot.keyToggle(MODIFIER, "down");
  try {
    await sleep(rand(80, 200));
    robot.keyTap("tab");
    await sleep(rand(120, 350)); // let the switcher settle, like a person would
  } finally {
    robot.keyToggle(MODIFIER, "up"); // never leave the modifier stuck down
  }
}

// Flip to the previous window, linger a moment, then flip back so focus ends
// where it started (the optional click afterwards lands in the original window).
async function altTab() {
  await switchOnce();
  await sleep(rand(ALT_TAB_MIN_MS, ALT_TAB_MAX_MS));
  await switchOnce();
}

module.exports = { altTab };
