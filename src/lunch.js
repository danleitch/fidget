const { LUNCH_START_HOUR, LUNCH_END_HOUR, LUNCH_JITTER_MIN, LUNCH_JITTER_MAX } = require("./config");

function randomJitterMinutes() {
  const span = LUNCH_JITTER_MAX - LUNCH_JITTER_MIN + 1;
  return LUNCH_JITTER_MIN + Math.floor(Math.random() * span);
}

// Lunch never starts on the dot - each day gets its own offset into both ends
// of the window, so the pause doesn't look machine-timed.
function planLunch(now) {
  const start = new Date(now);
  start.setHours(LUNCH_START_HOUR, randomJitterMinutes(), 0, 0);

  const end = new Date(now);
  end.setHours(LUNCH_END_HOUR, randomJitterMinutes(), 0, 0);

  return { day: now.toDateString(), start, end };
}

module.exports = { planLunch };
