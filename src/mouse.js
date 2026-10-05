const robot = require("./robot");
const { SCREEN_PRESET, SCREEN_PRESETS, EDGE_MARGIN } = require("./config");
const { rand, sleep } = require("./util");

// Pick a random destination within the preset's distance range, kept on screen.
function pickTarget(x, y) {
  const { min, max } = SCREEN_PRESETS[SCREEN_PRESET] || SCREEN_PRESETS.desktop;
  const { width, height } = robot.getScreenSize();

  for (let attempt = 0; attempt < 10; attempt++) {
    const angle = rand(0, Math.PI * 2);
    const dist = rand(min, max);
    const tx = Math.round(x + Math.cos(angle) * dist);
    const ty = Math.round(y + Math.sin(angle) * dist);
    if (
      tx >= EDGE_MARGIN && tx <= width - EDGE_MARGIN &&
      ty >= EDGE_MARGIN && ty <= height - EDGE_MARGIN
    ) {
      return { x: tx, y: ty };
    }
  }

  // Cornered (e.g. mouse in a corner of a small screen): head toward the centre.
  return {
    x: Math.round(x + (width / 2 - x) * rand(0.2, 0.5)),
    y: Math.round(y + (height / 2 - y) * rand(0.2, 0.5)),
  };
}

// Cubic Bézier with two control points pushed off the straight line by a
// random amount, so every path bows a little differently.
function buildCurve(start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length; // unit normal to the straight line
  const ny = dx / length;

  const bow = (t) => {
    const offset = rand(-0.3, 0.3) * length;
    return {
      x: start.x + dx * t + nx * offset,
      y: start.y + dy * t + ny * offset,
    };
  };

  return [start, bow(rand(0.2, 0.4)), bow(rand(0.6, 0.8)), end];
}

function bezierPoint([p0, p1, p2, p3], t) {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

// Slow at both ends, fast in the middle, like a real hand movement.
function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

async function moveHumanLike(target) {
  const start = robot.getMousePos();
  const curve = buildCurve(start, target);
  const distance = Math.hypot(target.x - start.x, target.y - start.y);
  const steps = Math.max(20, Math.min(90, Math.round(distance / rand(5, 9))));
  const totalMs = rand(250, 700) + distance * rand(0.5, 1.2);

  for (let i = 1; i <= steps; i++) {
    const p = bezierPoint(curve, easeInOut(i / steps));
    const last = i === steps;
    // Tiny hand tremor on the way, none on the final point so we land exactly.
    const x = Math.round(p.x + (last ? 0 : rand(-1, 1)));
    const y = Math.round(p.y + (last ? 0 : rand(-1, 1)));
    robot.moveMouse(x, y);
    await sleep((totalMs / steps) * rand(0.7, 1.3));
  }
}

module.exports = { pickTarget, moveHumanLike };
