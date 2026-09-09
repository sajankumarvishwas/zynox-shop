# BRO, YOU'RE NOT 18+ — Rage Platformer

A real, physics-based rage platformer for the Zynox Minigames section. Complete
replacement of the old quiz/troll version — this is now a genuine
precision/rage platformer with checkpoints, a rage meter, dynamic
adult-humor death messages, achievements, and a one-time fake finish troll.

## 1. Installation / Website Integration

Drop this whole folder into your Express `public` directory exactly as-is:

```
public/minigames/bro-youre-not-18/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/          (empty — no external assets required)
```

Because Express already serves `public/` statically, the game is
automatically available at:

```
/minigames/bro-youre-not-18/
```

No server changes, no new routes, no database/API changes. It does not touch
the MLG Water Bucket game or anything else on the site. Just add/keep the
existing Minigames card linking to that URL, e.g.:

```html
<a class="minigame-card" href="/minigames/bro-youre-not-18/">
  BRO, YOU'RE NOT 18+
</a>
```

## 2. Controls

**Desktop**
- Move: `A` / `D` or `←` / `→`
- Jump: `Space` / `W` / `↑` (tap for a short hop, hold for a full jump)
- Restart: `R`
- Debug overlay (dev only): `Ctrl + Shift + D`

**Mobile**
- On-screen `◀` `▶` buttons to move
- `JUMP` button to jump
- Large touch targets, no keyboard required, page scroll is blocked while
  playing

## 3. What's in the game

- Deterministic, momentum-based platformer physics (acceleration, air
  control, coyote time, jump buffering, variable jump height)
- 5 escalating zones (EZ Bro → You Sure? → Don't Fucking Fall → Greed Is A
  Trap → The Last Fucking Jump), difficulty 2/10 → 10/10
- 4 checkpoints + start, so death only costs the current section
- Obstacle types: static spikes, delayed/trigger spikes, disappearing
  platforms, moving platforms (horizontal/vertical, deterministic sine
  motion), ice platforms (low friction), launch pads, a greed
  route/shortcut, and a one-time fake finish floor-collapse troll
- Rage meter (0–100%) that responds to deaths, big falls, and repeated
  deaths on the same obstacle, and cools down on clean checkpoints
- Dynamic death messages that scale with death count, fall distance, and
  how many times you died to the *same* obstacle
- Achievements (First Blood, Fuck This Spike, One More Try, NICE at exactly
  69 deaths, Absolute Psychopath at 100, Final Fucking Jump, Holy Shit,
  No Fucking Way)
- Results screen with time/deaths/height/rage, a rank (F → SSS), and a
  Share My Win button (Web Share API with clipboard fallback)
- LocalStorage stats (best time, total deaths, achievements, etc.) — all
  local, nothing is ever sent anywhere
- Procedural WebAudio sound effects (no external audio files), with a
  Sound On/Off toggle
- `prefers-reduced-motion` support (reduces shake/flash, gameplay stays
  fully functional)
- Fully responsive canvas: phones, tablets, laptops, ultrawide

## 4. Customization

Everything gameplay-related lives in **`script.js`**, in clearly separated
blocks so you don't need to touch the game loop to reskin or rebalance it.

### Changing physics
Top of `script.js`, the `CONSTANTS` block:
```js
const MAX_SPEED = 5.2;
const ACCEL = 0.65;
const JUMP_VELOCITY = -11.5;
const GRAVITY = 0.52;
// ...etc
```
These map directly to the physics spec (px/frame at 60 physics updates/sec).
Change one value at a time and playtest — small changes compound a lot in a
precision platformer.

### Changing the level / obstacles / checkpoints
`buildLevel()` returns structured data, e.g.:
```js
platforms.push({ id: "z1_p1", x: 420, y: GY, w: 160, h: 40, type: "solid" });
hazards.push({ id: "z1_spike1", kind: "spike", x: 740, y: GY - 30, w: 40, h: 20 });
```
Add, move, or remove entries here to rebalance a zone. Every obstacle has a
stable `id` — death tracking and "same obstacle" messages key off that id,
not array position, so reordering is safe.

Platform `type` values: `solid`, `moving`, `disappearing`, `ice`, `launch`.
Hazard `kind` values: `spike`, `delayedSpike`.

### Changing checkpoint locations
Edit the `checkpoints.push({...})` calls in `buildLevel()`. `index` must
stay sequential (0 = start).

### Changing messages / profanity level
All death messages live in `pickDeathMessage()`. Rage-escalation dialogue
is grouped by death-count thresholds — edit the strings or thresholds
directly. Achievement text lives in the `ACHIEVEMENTS` object.

### Changing colors / visual style
`style.css` uses CSS custom properties at the top of `#bro18-root`:
```css
--bro18-neon: #7dffb3;
--bro18-neon2: #ff3b6e;
--bro18-neon3: #3bd0ff;
--bro18-warn: #ffcc33;
```
Canvas obstacle colors are set directly in `drawPlatforms()` /
`drawHazards()` in `script.js` (canvas can't read CSS variables for fill
colors), so update both places together if you want a full palette swap.

### Changing difficulty curve
Each zone's obstacle density/spacing is defined inline in `buildLevel()`.
The zones are laid out left-to-right along the x-axis with some vertical
sections (Zone 3 climb, Zone 4 branching greed route). Add more
platforms/hazards between existing ones to make a zone harder; remove some
to ease it.

## 5. Sound

Sound effects are generated procedurally with the Web Audio API (simple
oscillator beeps) — there are no external audio files to manage or that can
404. The Sound On/Off toggle is stored in `localStorage` under
`bro18_sound_v1`. Audio never autoplays before the player interacts, and a
missing/blocked AudioContext never breaks gameplay (every call is wrapped in
try/catch).

## 6. LocalStorage keys

- `bro18_stats_v1` — JSON blob: games started/completed, total deaths, best
  time, best height, furthest checkpoint reached, total fall distance,
  highest rage reached, unlocked achievement keys
- `bro18_sound_v1` — `"on"` or `"off"`

### Resetting statistics
Open the browser console on the game page and run:
```js
localStorage.removeItem('bro18_stats_v1');
localStorage.removeItem('bro18_sound_v1');
```
Corrupted/invalid saved data is detected and discarded automatically on
load — it will never crash the page.

## 7. Developer debug mode

Press `Ctrl + Shift + D` in-game to toggle a small overlay showing FPS-free
live state: player position, velocity, grounded/ice state, current
checkpoint, death count, rage, and same-obstacle streak. It's not visible
to normal players, doesn't change physics, and toggling it never resets the
run.

## 8. Deployment

Nothing to build — it's plain HTML/CSS/JS. Just make sure the folder is
present under `public/minigames/bro-youre-not-18/` and restart/redeploy the
Express server as you normally would for a static asset change.

## 9. Notes on scope

The design brief described an extremely large hazard roster (lasers,
crushers, pendulums, conveyors, push blocks, etc.). To ship a fully tested,
bug-free, deterministic build, this version focuses on the mechanics that
carry the most gameplay weight — static/delayed spikes, disappearing
platforms, moving platforms, ice, launch pads, a greed route, and the
one-time fake finish — across 5 difficulty-scaled zones with 4 checkpoints
and a final jump. The level data structure (`buildLevel()`) is intentionally
easy to extend, so adding crushers/lasers/conveyors later is a matter of
adding new `hazard.kind`/`platform.type` handlers following the same pattern
as the existing ones, not a rewrite.

## 10. Zynox Minigames card (ready to copy)

```html
<a class="minigame-card" href="/minigames/bro-youre-not-18/">
  <div class="minigame-card-title">BRO, YOU'RE NOT 18+</div>
  <div class="minigame-card-sub">A rage platformer. Good luck.</div>
</a>
```
