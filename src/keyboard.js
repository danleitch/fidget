const robot = require("./robot");
const { KEY_BURST_MIN, KEY_BURST_MAX, KEY_POOL } = require("./config");
const { rand, sleep } = require("./util");

// Gaps between keystrokes follow a log-normal shape: most are short, a few are
// long, which is much closer to real typing than a uniform random delay.
function typingGap() {
  const u1 = Math.random() || 1e-9;
  const u2 = Math.random();
  const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const gap = Math.exp(Math.log(170) + 0.5 * normal); // median ~170 ms
  return Math.min(Math.max(gap, 45), 900);
}

async function pressKey(key) {
  robot.keyToggle(key, "down");
  try {
    await sleep(rand(40, 115)); // key hold time varies too
  } finally {
    robot.keyToggle(key, "up"); // never leave a key stuck down
  }
}

async function typeBurst() {
  const count = Math.round(rand(KEY_BURST_MIN, KEY_BURST_MAX));
  for (let i = 0; i < count; i++) {
    const key = KEY_POOL[Math.floor(Math.random() * KEY_POOL.length)];
    await pressKey(key);
    await sleep(typingGap());
    // Now and then, stop mid-burst as if thinking or reading.
    if (Math.random() < 0.12) await sleep(rand(600, 1800));
  }
}

module.exports = { typeBurst };
