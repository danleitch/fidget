// Everything you might want to tweak lives here.

const START_HOUR = 8;          // 8am
const END_HOUR = 17;           // 5pm
const IDLE_MS = 3 * 60 * 1000; // only nudge after 3 min of no mouse or keyboard input
const POLL_MS = 5 * 1000;      // how often to check the idle time
const CLICK = true;            // set to false if you don't want clicks
const LUNCH_START_HOUR = 13;   // pause for lunch from 1pm
const LUNCH_END_HOUR = 14;     // and come back at 2pm
const LUNCH_JITTER_MIN = 1;    // the lunch window starts/ends this many minutes late, at least
const LUNCH_JITTER_MAX = 10;   // ...and at most, picked fresh each day
const SLEEP_AT_END = true;     // put the machine to sleep when the day finishes
const LOGGING = true;          // set to false to run silently with no console output

// Screen preset: how far (in pixels) each nudge travels. Pick the closest match.
const SCREEN_PRESET = "desktop";
const SCREEN_PRESETS = {
  laptop:    { min: 40,  max: 180 },  // ~13-16" panels
  desktop:   { min: 80,  max: 350 },  // ~24-27" 1080p/1440p
  ultrawide: { min: 120, max: 600 },  // 34"+ or 4K
  multi:     { min: 150, max: 800 },  // large or multi-monitor setups
};
const EDGE_MARGIN = 20;              // keep targets this far from the screen edge

// Keyboard activity: short bursts of key presses with uneven, human-ish timing.
const KEYBOARD = true;
const KEYS_CHANCE = 0.6;             // chance a nudge includes a key burst
const KEY_BURST_MIN = 3;             // keys per burst
const KEY_BURST_MAX = 12;
// Keys that do nothing visible. F15 is absent from most keyboards and unbound
// by default on Windows/Linux. On macOS try "f13" if F15 triggers anything.
// Avoid Shift: five quick taps pop up the Windows Sticky Keys dialog.
const KEY_POOL = ["f15"];

// Natural scrolling: a quick flick that decelerates, a pause, then a scroll back.
const SCROLL = true;
const SCROLL_CHANCE = 0.6;           // chance a nudge includes a scroll gesture
const SCROLL_STEP = 1;               // size of one wheel notch; tune if too fast/slow on your OS

// Alt+Tab: flip to the previous window.
const ALT_TAB = true;
const ALT_TAB_CHANCE = 0.3;          // chance a nudge includes a window switch

module.exports = {
  ALT_TAB,
  ALT_TAB_CHANCE,
  START_HOUR,
  END_HOUR,
  IDLE_MS,
  POLL_MS,
  CLICK,
  LUNCH_START_HOUR,
  LUNCH_END_HOUR,
  LUNCH_JITTER_MIN,
  LUNCH_JITTER_MAX,
  SLEEP_AT_END,
  LOGGING,
  SCREEN_PRESET,
  SCREEN_PRESETS,
  EDGE_MARGIN,
  KEYBOARD,
  KEYS_CHANCE,
  KEY_BURST_MIN,
  KEY_BURST_MAX,
  KEY_POOL,
  SCROLL,
  SCROLL_CHANCE,
  SCROLL_STEP,
};
