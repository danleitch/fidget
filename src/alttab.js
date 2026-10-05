const robot = require("./robot");
const { rand, sleep } = require("./util");

// On macOS the app switcher is Cmd+Tab; everywhere else it is Alt+Tab.
const MODIFIER = process.platform === "darwin" ? "command" : "alt";

// Flip to the previous window.
async function altTab() {
  robot.keyToggle(MODIFIER, "down");
  try {
    await sleep(rand(80, 200));
    robot.keyTap("tab");
    await sleep(rand(120, 350)); // let the switcher settle, like a person would
  } finally {
    robot.keyToggle(MODIFIER, "up"); // never leave the modifier stuck down
  }
}

module.exports = { altTab };
