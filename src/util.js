function rand(min, max) {
  return min + Math.random() * (max - min);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function hhmm(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

module.exports = { rand, sleep, hhmm };
