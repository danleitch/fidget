const { LOGGING } = require("./config");
const { hhmm } = require("./util");

function log(emoji, message, at = new Date()) {
  if (!LOGGING) return;
  console.log(`[${hhmm(at)}] ${emoji}  ${message}`);
}

module.exports = { log };
