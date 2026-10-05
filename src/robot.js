// The one place robotjs is loaded, so its delays are configured exactly once.
const robot = require("robotjs");

robot.setMouseDelay(1);
robot.setKeyboardDelay(1);

module.exports = robot;
