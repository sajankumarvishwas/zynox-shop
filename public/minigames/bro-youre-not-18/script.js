/* ==========================================================================
   BRO, YOU'RE NOT 18+  —  rage platformer engine
   Vanilla JS, canvas 2D. Fully self-contained, no external dependencies.
   All game state is namespaced inside the Bro18 object below so it never
   touches anything else on the Zynox site.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     CONSTANTS (physics spec — do not change casually, see README)
     --------------------------------------------------------------------- */
  const WORLD_W = 1280;
  const WORLD_H = 720;
  const PHYSICS_HZ = 60;
  const PHYSICS_DT = 1000 / PHYSICS_HZ; // ms per physics step

  const PLAYER_W = 28;
  const PLAYER_H = 42;

  const MAX_SPEED = 5.2;
  const ACCEL = 0.65;
  const GROUND_FRICTION = 0.78;
  const AIR_CONTROL = 0.42;
  const ICE_FRICTION = 0.96;

  const JUMP_VELOCITY = -11.5;
  const GRAVITY = 0.52;
  const MAX_FALL = 13;
  const EARLY_RELEASE_MULT = 0.45;
  const COYOTE_MS = 100;
  const JUMP_BUFFER_MS = 120;

  const LAUNCH_VELOCITY = -13.5;
  const DEATH_PAUSE_MS = 450;
  const RESPAWN_MS = 850;
  const DEATH_BOUNDARY_OFFSET = 400; // px below lowest platform in level

  const RAGE_PER_DEATH = 4;
  const RAGE_PER_FALL = 2;
  const RAGE_PER_REPEAT = 1;
  const RAGE_PER_CHECKPOINT = -5;
  const RAGE_PER_CLEAN_SECTION = -3;

  /* ---------------------------------------------------------------------
     LEVEL DATA — structured & easy to edit.
     Types: solid | spike | disappearing | moving | launch | ice | checkpoint
            | fakeFinish | goal | sign
     Moving platforms use phase-based deterministic motion (time-based, not
     frame-based) so timing never drifts with framerate.
     --------------------------------------------------------------------- */
  function buildLevel() {
    const platforms = [];
    const hazards = [];
    const signs = [];
    const checkpoints = [];
    let fakeFinish = null;
    let goal = null;

    // Ground reference for each zone (world y grows downward)
    const GY = 560; // baseline ground line

    // ---------- START ----------
    platforms.push({ id: "start_ground", x: -100, y: GY, w: 500, h: 40, type: "solid" });
    checkpoints.push({ id: "cp0", x: 60, y: GY - 60, w: 40, h: 60, index: 0, label: "START" });

    // ===================== ZONE 1: "EZ BRO" (2/10) =====================
    signs.push({ x: 260, y: GY - 90, text: "THIS PART IS EASY." });
    platforms.push({ id: "z1_p1", x: 420, y: GY, w: 160, h: 40, type: "solid" });
    platforms.push({ id: "z1_p2", x: 660, y: GY - 10, w: 140, h: 40, type: "solid" });
    hazards.push({ id: "z1_spike1", kind: "spike", x: 740, y: GY - 30, w: 40, h: 20 });
    platforms.push({ id: "z1_p3", x: 860, y: GY - 40, w: 130, h: 40, type: "solid" });
    platforms.push({
      id: "z1_move1", x: 1050, y: GY - 60, w: 110, h: 24, type: "moving",
      axis: "horizontal", amplitude: 100, periodMs: 2400, phase: 0
    });
    platforms.push({ id: "z1_p4", x: 1230, y: GY - 40, w: 150, h: 40, type: "solid" });
    hazards.push({ id: "z1_spike2", kind: "spike", x: 1300, y: GY - 60, w: 50, h: 20 });
    platforms.push({
      id: "z1_disappear1", x: 1440, y: GY - 40, w: 110, h: 24, type: "disappearing",
      warnMs: 800, goneMs: 1500, returnMs: 1000
    });
    platforms.push({ id: "z1_p5", x: 1610, y: GY - 40, w: 200, h: 40, type: "solid" });
    checkpoints.push({ id: "cp1", x: 1660, y: GY - 100, w: 40, h: 60, index: 1, label: "CHECKPOINT 1" });

    // ===================== ZONE 2: "YOU SURE?" (5/10) =====================
    signs.push({ x: 1660, y: GY - 130, text: "YOU SURE?" });
    platforms.push({ id: "z2_p1", x: 1870, y: GY - 30, w: 90, h: 40, type: "solid" });
    hazards.push({
      id: "z2_delayed1", kind: "delayedSpike", x: 1900, y: GY - 50, w: 40, h: 20,
      triggerRadius: 60, delayMs: 450, activeMs: 900
    });
    platforms.push({
      id: "z2_move1", x: 2020, y: GY - 90, w: 90, h: 22, type: "moving",
      axis: "vertical", amplitude: 70, periodMs: 2800, phase: 0
    });
    platforms.push({ id: "z2_p2", x: 2170, y: GY - 60, w: 70, h: 30, type: "ice" });
    hazards.push({ id: "z2_spike1", kind: "spike", x: 2245, y: GY - 80, w: 40, h: 20 });
    platforms.push({
      id: "z2_disappear1", x: 2320, y: GY - 100, w: 90, h: 22, type: "disappearing",
      warnMs: 800, goneMs: 1500, returnMs: 1000
    });
    platforms.push({ id: "z2_p3", x: 2460, y: GY - 140, w: 130, h: 30, type: "solid" });
    platforms.push({
      id: "z2_launch1", x: 2620, y: GY - 40, w: 70, h: 20, type: "launch"
    });
    platforms.push({ id: "z2_p4", x: 2620, y: GY - 260, w: 150, h: 30, type: "solid" });
    checkpoints.push({ id: "cp2", x: 2670, y: GY - 320, w: 40, h: 60, index: 2, label: "CHECKPOINT 2" });

    // ================= ZONE 3: "DON'T FUCKING FALL" (7/10) =================
    signs.push({ x: 2670, y: GY - 350, text: "DON'T FALL." });
    platforms.push({ id: "z3_p1", x: 2830, y: GY - 260, w: 60, h: 24, type: "solid" });
    platforms.push({
      id: "z3_move1", x: 2960, y: GY - 320, w: 70, h: 22, type: "moving",
      axis: "horizontal", amplitude: 80, periodMs: 2200, phase: 300
    });
    platforms.push({ id: "z3_p2", x: 3120, y: GY - 400, w: 55, h: 22, type: "solid" });
    hazards.push({ id: "z3_spike1", kind: "spike", x: 3080, y: GY - 380, w: 30, h: 18 });
    platforms.push({ id: "z3_p3", x: 3230, y: GY - 470, w: 55, h: 22, type: "solid" });
    platforms.push({
      id: "z3_disappear1", x: 3330, y: GY - 540, w: 70, h: 20, type: "disappearing",
      warnMs: 800, goneMs: 1500, returnMs: 1000
    });
    // Big vertical climb + hard landing that punishes a miss with a long fall
    platforms.push({ id: "z3_p4", x: 3230, y: GY - 620, w: 120, h: 24, type: "solid" });
    hazards.push({ id: "z3_spikeFloor", kind: "spike", x: 3050, y: GY - 20, w: 260, h: 20 });
    checkpoints.push({ id: "cp3", x: 3270, y: GY - 680, w: 40, h: 60, index: 3, label: "CHECKPOINT 3" });

    // ================ ZONE 4: "GREED IS A TRAP" (8/10) ================
    signs.push({ x: 3270, y: GY - 710, text: "SAFE  vs  SHORTCUT" });
    // Safe route (lower, longer, easier)
    platforms.push({ id: "z4_safe1", x: 3430, y: GY - 600, w: 90, h: 22, type: "solid" });
    platforms.push({
      id: "z4_safe_move", x: 3570, y: GY - 560, w: 90, h: 22, type: "moving",
      axis: "vertical", amplitude: 50, periodMs: 2600, phase: 600
    });
    platforms.push({ id: "z4_safe2", x: 3710, y: GY - 600, w: 90, h: 22, type: "solid" });
    hazards.push({ id: "z4_safe_spike", kind: "spike", x: 3760, y: GY - 622, w: 30, h: 18 });
    platforms.push({ id: "z4_safe3", x: 3850, y: GY - 640, w: 110, h: 24, type: "solid" });
    // Greed route (higher, short, brutal)
    platforms.push({ id: "z4_greed1", x: 3430, y: GY - 760, w: 55, h: 20, type: "solid" });
    hazards.push({
      id: "z4_greed_delayed", kind: "delayedSpike", x: 3510, y: GY - 780, w: 30, h: 18,
      triggerRadius: 55, delayMs: 400, activeMs: 850
    });
    platforms.push({
      id: "z4_greed_move", x: 3580, y: GY - 800, w: 55, h: 20, type: "moving",
      axis: "horizontal", amplitude: 60, periodMs: 1900, phase: 0
    });
    platforms.push({ id: "z4_greed2", x: 3720, y: GY - 760, w: 60, h: 20, type: "solid" });
    platforms.push({ id: "z4_greed3", x: 3850, y: GY - 640, w: 110, h: 24, type: "solid" }); // rejoin
    checkpoints.push({ id: "cp4", x: 3900, y: GY - 700, w: 40, h: 60, index: 4, label: "CHECKPOINT 4" });

    // Fake finish troll, ~90% through
    fakeFinish = {
      id: "fakefinish", x: 4030, y: GY - 660, w: 160, h: 24, type: "solid",
      triggered: false, collapsing: false, collapseAt: 0
    };
    platforms.push(fakeFinish);
    signs.push({ x: 4060, y: GY - 720, text: "YOU MADE IT." });

    // =============== ZONE 5: "THE LAST FUCKING JUMP" (10/10) ===============
    platforms.push({ id: "z5_p1", x: 4260, y: GY - 600, w: 60, h: 22, type: "solid" });
    hazards.push({ id: "z5_spike1", kind: "spike", x: 4300, y: GY - 622, w: 30, h: 18 });
    platforms.push({
      id: "z5_move1", x: 4380, y: GY - 560, w: 60, h: 20, type: "moving",
      axis: "vertical", amplitude: 60, periodMs: 2000, phase: 0
    });
    platforms.push({
      id: "z5_disappear1", x: 4500, y: GY - 600, w: 55, h: 20, type: "disappearing",
      warnMs: 700, goneMs: 1300, returnMs: 900
    });
    platforms.push({ id: "z5_p2", x: 4600, y: GY - 640, w: 50, h: 20, type: "solid" });
    hazards.push({
      id: "z5_delayed1", kind: "delayedSpike", x: 4640, y: GY - 660, w: 26, h: 18,
      triggerRadius: 50, delayMs: 400, activeMs: 800
    });
    platforms.push({
      id: "z5_move2", x: 4700, y: GY - 600, w: 55, h: 20, type: "moving",
      axis: "horizontal", amplitude: 70, periodMs: 1800, phase: 400
    });
    signs.push({ x: 4780, y: GY - 700, text: "ONE FUCKING JUMP." });
    // Final jump: start platform + target platform, deterministic, no gimmicks
    platforms.push({ id: "z5_finalStart", x: 4820, y: GY - 600, w: 100, h: 24, type: "solid" });
    platforms.push({ id: "z5_finalTarget", x: 5040, y: GY - 655, w: 110, h: 24, type: "solid" });
    goal = { x: 5070, y: GY - 715, w: 50, h: 60 };
    hazards.push({ id: "z5_finalFloorSpike", kind: "spike", x: 4920, y: GY - 20, w: 400, h: 20 });

    return {
      platforms, hazards, signs, checkpoints, fakeFinish, goal,
      startX: 80, startY: GY - PLAYER_H,
      worldMinX: -150, worldMaxX: 5200,
      groundLineY: GY
    };
  }

  /* ---------------------------------------------------------------------
     AUDIO — tiny procedural beeps via WebAudio, no external files.
     --------------------------------------------------------------------- */
  const Sound = {
    ctx: null,
    enabled: true,
    ensure() {
      if (!this.ctx) {
        try {
          const AC = window.AudioContext || window.webkitAudioContext;
          this.ctx = AC ? new AC() : null;
        } catch (e) { this.ctx = null; }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    },
    tone(freq, durMs, type, volume) {
      if (!this.enabled) return;
      try {
        this.ensure();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type || "square";
        osc.frequency.value = freq;
        gain.gain.value = volume != null ? volume : 0.08;
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + durMs / 1000);
        osc.start(now);
        osc.stop(now + durMs / 1000);
      } catch (e) { /* audio must never crash gameplay */ }
    },
    jump() { this.tone(520, 90, "square", 0.06); },
    land() { this.tone(160, 60, "sine", 0.05); },
    death() { this.tone(110, 260, "sawtooth", 0.09); },
    checkpoint() { this.tone(700, 140, "triangle", 0.08); this.tone(950, 160, "triangle", 0.06); },
    trap() { this.tone(300, 100, "square", 0.07); },
    victory() { this.tone(660, 150, "triangle", 0.09); setTimeout(() => this.tone(880, 220, "triangle", 0.09), 140); },
    achievement() { this.tone(500, 90, "triangle", 0.07); setTimeout(() => this.tone(760, 140, "triangle", 0.07), 90); }
  };

  /* ---------------------------------------------------------------------
     STORAGE — best-effort, never crashes the game if unavailable.
     --------------------------------------------------------------------- */
  const Store = {
    key: "bro18_stats_v1",
    soundKey: "bro18_sound_v1",
    defaultStats() {
      return {
        gamesStarted: 0, gamesCompleted: 0, totalDeaths: 0,
        bestTimeMs: null, bestHeight: 0, furthestCheckpoint: 0,
        totalFallDistance: 0, highestRage: 0, achievements: []
      };
    },
    load() {
      try {
        const raw = localStorage.getItem(this.key);
        if (!raw) return this.defaultStats();
        const parsed = JSON.parse(raw);
        return Object.assign(this.defaultStats(), parsed);
      } catch (e) {
        return this.defaultStats();
      }
    },
    save(stats) {
      try { localStorage.setItem(this.key, JSON.stringify(stats)); } catch (e) {}
    },
    loadSound() {
      try { return localStorage.getItem(this.soundKey) !== "off"; } catch (e) { return true; }
    },
    saveSound(on) {
      try { localStorage.setItem(this.soundKey, on ? "on" : "off"); } catch (e) {}
    }
  };

  /* ---------------------------------------------------------------------
     ACHIEVEMENTS
     --------------------------------------------------------------------- */
  const ACHIEVEMENTS = {
    FIRST_BLOOD: { title: "FIRST BLOOD", desc: "Die for the first time." },
    FUCK_THIS_SPIKE: { title: "FUCK THIS SPIKE", desc: "Die 5 times to the same obstacle." },
    ONE_MORE_TRY: { title: "ONE MORE TRY", desc: "Reach a checkpoint after 10+ deaths." },
    NICE: { title: "NICE", desc: "Die exactly 69 times." },
    ABSOLUTE_PSYCHOPATH: { title: "ABSOLUTE PSYCHOPATH", desc: "Reach 100 deaths." },
    FINAL_JUMP: { title: "FINAL FUCKING JUMP", desc: "Reach the final jump." },
    HOLY_SHIT: { title: "HOLY SHIT", desc: "Complete the game." },
    NO_FUCKING_WAY: { title: "NO FUCKING WAY", desc: "Complete the game with fewer than 10 deaths." }
  };

  /* ---------------------------------------------------------------------
     GAME ENGINE
     --------------------------------------------------------------------- */
  const Bro18 = {
    canvas: null, ctx: null,
    level: null,
    stats: null,

    // dynamic state (reset on restart)
    player: null,
    camera: { x: 0, y: 0 },
    input: { left: false, right: false, jumpHeld: false, jumpPressedAt: -9999 },
    deaths: 0,
    startTime: 0,
    elapsedMs: 0,
    rage: 0,
    currentCheckpointIndex: 0,
    deathsSinceCheckpoint: 0,
    lastObstacleId: null,
    sameObstacleStreak: 0,
    bestHeightReached: 0, // smaller y = higher; we track "height climbed" as GY - minY
    totalFallDistance: 0,
    unlockedAchievements: new Set(),
    running: false,
    gameOver: false, // victory or dead-frozen
    victory: false,
    debugMode: false,
    accumulatorMs: 0,
    lastFrameTime: 0,
    deathFreezeUntil: 0,
    respawnAt: 0,
    isDying: false,
    obstacleStates: new Map(), // per-obstacle runtime state (timers etc.)
    activeTimers: [],           // tracked timeouts so restart can cancel them

    init() {
      this.canvas = document.getElementById("bro18-canvas");
      this.ctx = this.canvas.getContext("2d");
      this.stats = Store.load();
      Sound.enabled = Store.loadSound();
      this.updateSoundBtn();
      this.level = buildLevel();
      this.bindUI();
      this.resize();
      window.addEventListener("resize", () => this.resize());
      this.renderStatsPreview();
      this.detectMobile();
      requestAnimationFrame((t) => this.loop(t));
    },

    detectMobile() {
      const isTouch = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;
      if (isTouch) document.getElementById("bro18-mobile-controls").classList.remove("bro18-hidden");
    },

    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.floor(rect.width * dpr);
      this.canvas.height = Math.floor(rect.height * dpr);
      this.canvas.style.width = rect.width + "px";
      this.canvas.style.height = rect.height + "px";
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.viewW = rect.width;
      this.viewH = rect.height;
      // uniform scale to fit WORLD_W x WORLD_H aspect inside the viewport
      this.scale = Math.min(this.viewW / WORLD_W, this.viewH / WORLD_H) * 1.15;
    },

    renderStatsPreview() {
      const s = this.stats;
      const el = document.getElementById("bro18-stats-preview");
      if (s.gamesStarted === 0) { el.textContent = ""; return; }
      const best = s.bestTimeMs ? (s.bestTimeMs / 1000).toFixed(1) + "s" : "—";
      el.textContent = `Best time: ${best}  ·  Total deaths: ${s.totalDeaths}  ·  Completed: ${s.gamesCompleted}x`;
    },

    /* -------------------- UI bindings -------------------- */
    bindUI() {
      document.getElementById("bro18-start-btn").addEventListener("click", () => this.startGame());
      document.getElementById("bro18-play-again").addEventListener("click", () => this.startGame());
      document.getElementById("bro18-share").addEventListener("click", () => this.shareResult());
      const soundBtn = document.getElementById("bro18-sound-toggle");
      soundBtn.addEventListener("click", () => {
        Sound.enabled = !Sound.enabled;
        Store.saveSound(Sound.enabled);
        this.updateSoundBtn();
      });

      // keyboard
      window.addEventListener("keydown", (e) => this.onKeyDown(e));
      window.addEventListener("keyup", (e) => this.onKeyUp(e));

      // mobile touch
      const bindHold = (id, onDown, onUp) => {
        const el = document.getElementById(id);
        const down = (ev) => { ev.preventDefault(); onDown(); };
        const up = (ev) => { ev.preventDefault(); onUp(); };
        el.addEventListener("touchstart", down, { passive: false });
        el.addEventListener("touchend", up, { passive: false });
        el.addEventListener("touchcancel", up, { passive: false });
        el.addEventListener("mousedown", down);
        el.addEventListener("mouseup", up);
        el.addEventListener("mouseleave", up);
      };
      bindHold("bro18-btn-left", () => (this.input.left = true), () => (this.input.left = false));
      bindHold("bro18-btn-right", () => (this.input.right = true), () => (this.input.right = false));
      bindHold("bro18-btn-jump", () => this.onJumpPressed(), () => (this.input.jumpHeld = false));

      // prevent page scroll on touch inside the game
      document.getElementById("bro18-root").addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });

      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) this.lastFrameTime = performance.now();
      });
    },

    updateSoundBtn() {
      const btn = document.getElementById("bro18-sound-toggle");
      btn.textContent = Sound.enabled ? "🔊 SOUND ON" : "🔇 SOUND OFF";
    },

    onKeyDown(e) {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (["a", "arrowleft"].includes(k)) this.input.left = true;
      if (["d", "arrowright"].includes(k)) this.input.right = true;
      if ([" ", "w", "arrowup"].includes(k) || e.code === "Space") this.onJumpPressed();
      if (k === "r") this.restart();
      if (e.ctrlKey && e.shiftKey && k === "d") {
        this.debugMode = !this.debugMode;
        document.getElementById("bro18-debug").classList.toggle("bro18-hidden", !this.debugMode);
      }
      if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k) || e.code === "Space") {
        e.preventDefault();
      }
    },
    onKeyUp(e) {
      const k = e.key.toLowerCase();
      if (["a", "arrowleft"].includes(k)) this.input.left = false;
      if (["d", "arrowright"].includes(k)) this.input.right = false;
      if ([" ", "w", "arrowup"].includes(k) || e.code === "Space") this.input.jumpHeld = false;
    },
    onJumpPressed() {
      Sound.ensure();
      this.input.jumpHeld = true;
      this.input.jumpPressedAt = performance.now();
    },

    /* -------------------- Timer tracking (so restart cancels stale ones) -------------------- */
    setTrackedTimeout(fn, ms) {
      const id = setTimeout(() => {
        this.activeTimers = this.activeTimers.filter((t) => t !== id);
        fn();
      }, ms);
      this.activeTimers.push(id);
      return id;
    },
    clearAllTimers() {
      this.activeTimers.forEach((id) => clearTimeout(id));
      this.activeTimers = [];
    },

    /* -------------------- Game lifecycle -------------------- */
    startGame() {
      document.getElementById("bro18-start").classList.add("bro18-hidden");
      document.getElementById("bro18-results").classList.add("bro18-hidden");
      document.getElementById("bro18-hud").classList.remove("bro18-hidden");
      this.stats.gamesStarted++;
      Store.save(this.stats);
      this.restart();
    },

    restart() {
      this.clearAllTimers();
      this.obstacleStates.clear();
      this.player = {
        x: this.level.startX, y: this.level.startY,
        w: PLAYER_W, h: PLAYER_H,
        vx: 0, vy: 0,
        grounded: false,
        lastGroundedAt: -9999,
        onIce: false
      };
      this.camera.x = this.player.x;
      this.camera.y = this.player.y;
      this.deaths = 0;
      this.startTime = performance.now();
      this.elapsedMs = 0;
      this.rage = 0;
      this.currentCheckpointIndex = 0;
      this.deathsSinceCheckpoint = 0;
      this.lastObstacleId = null;
      this.sameObstacleStreak = 0;
      this.bestHeightReached = 0;
      this.totalFallDistance = 0;
      this.running = true;
      this.gameOver = false;
      this.victory = false;
      this.isDying = false;
      if (this.level.fakeFinish) {
        this.level.fakeFinish.triggered = false;
        this.level.fakeFinish.collapsing = false;
      }
      this.hideToast();
      this.hideSign();
      this.updateHud();
      document.getElementById("bro18-results").classList.add("bro18-hidden");
      document.getElementById("bro18-hud").classList.remove("bro18-hidden");
    },

    getCheckpointSpawn() {
      const cp = this.level.checkpoints[this.currentCheckpointIndex] || this.level.checkpoints[0];
      return { x: cp.x, y: cp.y + cp.h - PLAYER_H };
    },

    /* -------------------- Main loop (fixed timestep physics) -------------------- */
    loop(t) {
      if (!this.lastFrameTime) this.lastFrameTime = t;
      let frameDelta = t - this.lastFrameTime;
      this.lastFrameTime = t;
      // clamp huge deltas (tab backgrounded) so physics never jumps
      frameDelta = Math.min(frameDelta, 250);

      if (this.running && !this.gameOver) {
        this.accumulatorMs += frameDelta;
        let steps = 0;
        while (this.accumulatorMs >= PHYSICS_DT && steps < 8) {
          this.update(PHYSICS_DT, t);
          this.accumulatorMs -= PHYSICS_DT;
          steps++;
        }
        this.elapsedMs = t - this.startTime;
      }
      this.render(t);
      requestAnimationFrame((nt) => this.loop(nt));
    },

    /* -------------------- Physics update -------------------- */
    update(dt, now) {
      if (this.isDying) return; // frozen during death animation
      const p = this.player;

      // ---- horizontal input / acceleration ----
      const accel = p.grounded ? ACCEL : ACCEL * AIR_CONTROL;
      const friction = p.onIce ? ICE_FRICTION : GROUND_FRICTION;
      let dir = 0;
      if (this.input.left) dir -= 1;
      if (this.input.right) dir += 1;

      if (dir !== 0) {
        p.vx += dir * accel;
        p.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, p.vx));
      } else if (p.grounded) {
        p.vx *= friction;
        if (Math.abs(p.vx) < 0.02) p.vx = 0;
      }

      // ---- jump buffer / coyote time ----
      const bufferedJump = now - this.input.jumpPressedAt <= JUMP_BUFFER_MS;
      const withinCoyote = now - p.lastGroundedAt <= COYOTE_MS;
      if (bufferedJump && (p.grounded || withinCoyote) && !p.usedJumpForThisPress) {
        p.vy = JUMP_VELOCITY;
        p.grounded = false;
        p.usedJumpForThisPress = true;
        this.input.jumpPressedAt = -9999; // consume buffered jump
        Sound.jump();
      }
      if (!this.input.jumpHeld) p.usedJumpForThisPress = false;

      // variable jump height: early release cuts upward velocity
      if (!this.input.jumpHeld && p.vy < JUMP_VELOCITY * EARLY_RELEASE_MULT) {
        p.vy = JUMP_VELOCITY * EARLY_RELEASE_MULT;
      }

      // ---- gravity ----
      p.vy += GRAVITY;
      if (p.vy > MAX_FALL) p.vy = MAX_FALL;

      // ---- update moving/disappearing obstacle states ----
      this.updateObstacles(now);

      // ---- integrate + collide (axes separately to avoid corner-stick bugs) ----
      p.onIce = false;
      this.moveAndCollideX(p, dt, now);
      this.moveAndCollideY(p, dt, now);

      // ---- track height ----
      const climbed = Math.max(0, this.level.groundLineY - p.y);
      if (climbed > this.bestHeightReached) this.bestHeightReached = climbed;

      // ---- hazards ----
      this.checkHazards(now);

      // ---- checkpoints ----
      this.checkCheckpoints();

      // ---- fake finish ----
      this.checkFakeFinish(now);

      // ---- goal ----
      this.checkGoal();

      // ---- death boundary ----
      const boundary = this.level.groundLineY + DEATH_BOUNDARY_OFFSET;
      if (p.y > boundary) {
        this.killPlayer("fall", null, now);
      }

      // ---- camera ----
      const targetX = p.x - this.viewWorldW() / 2;
      const targetY = p.y - this.viewWorldH() / 2;
      this.camera.x += (targetX - this.camera.x) * 0.12;
      this.camera.y += (targetY - this.camera.y) * 0.12;
      this.camera.x = Math.max(this.level.worldMinX, Math.min(this.level.worldMaxX, this.camera.x));
    },

    viewWorldW() { return WORLD_W; },
    viewWorldH() { return WORLD_H; },

    solidsAt() {
      return this.level.platforms.filter((pl) => {
        if (pl.type === "disappearing") {
          const st = this.obstacleStates.get(pl.id);
          return !st || st.phase !== "gone";
        }
        return pl.type === "solid" || pl.type === "moving" || pl.type === "ice" || pl.type === "launch";
      });
    },

    platformRect(pl, now) {
      if (pl.type === "moving") {
        const t = ((now + (pl.phase || 0)) % pl.periodMs) / pl.periodMs;
        const s = Math.sin(t * Math.PI * 2);
        if (pl.axis === "horizontal") return { x: pl.x + s * pl.amplitude, y: pl.y, w: pl.w, h: pl.h };
        return { x: pl.x, y: pl.y + s * pl.amplitude, w: pl.w, h: pl.h };
      }
      return { x: pl.x, y: pl.y, w: pl.w, h: pl.h };
    },

    moveAndCollideX(p, dt, now) {
      p.x += p.vx;
      const solids = this.solidsAt();
      for (const pl of solids) {
        const r = this.platformRect(pl, now);
        if (this.aabb(p.x, p.y, p.w, p.h, r.x, r.y, r.w, r.h)) {
          if (p.vx > 0) p.x = r.x - p.w;
          else if (p.vx < 0) p.x = r.x + r.w;
          p.vx = 0;
        }
      }
    },

    moveAndCollideY(p, dt, now) {
      const prevBottom = p.y + p.h;
      p.y += p.vy;
      p.grounded = false;
      const solids = this.solidsAt();
      for (const pl of solids) {
        const r = this.platformRect(pl, now);
        if (this.aabb(p.x, p.y, p.w, p.h, r.x, r.y, r.w, r.h)) {
          if (p.vy > 0 && prevBottom <= r.y + 1) {
            p.y = r.y - p.h;
            if (p.vy > 2) Sound.land();
            p.vy = 0;
            p.grounded = true;
            p.lastGroundedAt = now;
            if (pl.type === "ice") p.onIce = true;
            if (pl.type === "launch") { p.vy = LAUNCH_VELOCITY; p.grounded = false; Sound.jump(); }
            this.onLandOnPlatform(pl, now);
          } else if (p.vy < 0) {
            p.y = r.y + r.h;
            p.vy = 0;
          }
        }
      }
    },

    aabb(ax, ay, aw, ah, bx, by, bw, bh) {
      return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    },

    onLandOnPlatform(pl, now) {
      if (pl.type === "disappearing") {
        let st = this.obstacleStates.get(pl.id);
        if (!st || st.phase === "idle") {
          st = { phase: "warn", since: now };
          this.obstacleStates.set(pl.id, st);
        }
      }
    },

    updateObstacles(now) {
      for (const pl of this.level.platforms) {
        if (pl.type === "disappearing") {
          let st = this.obstacleStates.get(pl.id);
          if (!st) continue;
          const elapsed = now - st.since;
          if (st.phase === "warn" && elapsed >= pl.warnMs) {
            st.phase = "gone"; st.since = now;
          } else if (st.phase === "gone" && elapsed >= pl.goneMs) {
            st.phase = "returning"; st.since = now;
          } else if (st.phase === "returning" && elapsed >= pl.returnMs) {
            this.obstacleStates.delete(pl.id);
          }
        }
      }
      for (const hz of this.level.hazards) {
        if (hz.kind === "delayedSpike") {
          const st = this.obstacleStates.get(hz.id);
          if (st) {
            const elapsed = now - st.since;
            if (st.phase === "delay" && elapsed >= hz.delayMs) { st.phase = "active"; st.since = now; Sound.trap(); }
            else if (st.phase === "active" && elapsed >= hz.activeMs) { this.obstacleStates.delete(hz.id); }
          }
        }
      }
    },

    checkHazards(now) {
      const p = this.player;
      for (const hz of this.level.hazards) {
        if (hz.kind === "spike") {
          if (this.aabb(p.x, p.y, p.w, p.h, hz.x, hz.y, hz.w, hz.h)) {
            this.killPlayer("spike", hz.id, now);
            return;
          }
        } else if (hz.kind === "delayedSpike") {
          let st = this.obstacleStates.get(hz.id);
          const cx = hz.x + hz.w / 2, cy = hz.y + hz.h / 2;
          const px = p.x + p.w / 2, py = p.y + p.h / 2;
          const dist = Math.hypot(px - cx, py - cy);
          if (!st && dist <= hz.triggerRadius) {
            st = { phase: "delay", since: now };
            this.obstacleStates.set(hz.id, st);
          }
          if (st && st.phase === "active") {
            if (this.aabb(p.x, p.y, p.w, p.h, hz.x, hz.y, hz.w, hz.h)) {
              this.killPlayer("trap", hz.id, now);
              return;
            }
          }
        }
      }
    },

    checkCheckpoints() {
      const p = this.player;
      for (const cp of this.level.checkpoints) {
        if (cp.index <= this.currentCheckpointIndex) continue;
        if (this.aabb(p.x, p.y, p.w, p.h, cp.x, cp.y, cp.w, cp.h)) {
          this.activateCheckpoint(cp);
        }
      }
    },

    activateCheckpoint(cp) {
      this.currentCheckpointIndex = cp.index;
      const cleanSection = this.deathsSinceCheckpoint === 0;
      this.rage = clamp(this.rage + (cleanSection ? RAGE_PER_CLEAN_SECTION : 0) + RAGE_PER_CHECKPOINT, 0, 100);
      if (this.deathsSinceCheckpoint >= 10) this.unlock("ONE_MORE_TRY");
      this.deathsSinceCheckpoint = 0;
      Sound.checkpoint();
      this.showSign(cp.label + " UNLOCKED", 1200);
      this.updateHud();
    },

    checkFakeFinish(now) {
      const ff = this.level.fakeFinish;
      if (!ff || ff.triggered) return;
      const p = this.player;
      if (this.aabb(p.x, p.y, p.w, p.h, ff.x, ff.y - 4, ff.w, 6) && p.grounded) {
        ff.triggered = true;
        this.showSign("YOU MADE IT.", 700);
        this.setTrackedTimeout(() => {
          this.showToast("YOU REALLY THOUGHT THAT WAS IT?");
          ff.type = "gone-forever";
        }, 650);
      }
      if (ff.type === "gone-forever" && this.aabb(p.x, p.y, p.w, p.h, ff.x, ff.y, ff.w, ff.h + 40)) {
        // floor already removed from solids collision (type no longer 'solid')
      }
    },

    checkGoal() {
      if (!this.level.goal || this.victory) return;
      const p = this.player;
      const g = this.level.goal;
      if (this.aabb(p.x, p.y, p.w, p.h, g.x, g.y, g.w, g.h)) {
        this.winGame();
      }
    },

    /* -------------------- Death / respawn -------------------- */
    killPlayer(cause, obstacleId, now) {
      if (this.isDying || this.victory) return;
      this.isDying = true;
      this.deaths++;
      this.deathsSinceCheckpoint++;
      this.stats.totalDeaths++;

      let fallDistance = 0;
      if (cause === "fall") {
        fallDistance = Math.max(0, this.player.y - this.level.groundLineY);
        this.totalFallDistance += fallDistance;
        this.rage = clamp(this.rage + RAGE_PER_FALL, 0, 100);
      }

      if (obstacleId && obstacleId === this.lastObstacleId) {
        this.sameObstacleStreak++;
      } else {
        this.sameObstacleStreak = 1;
        this.lastObstacleId = obstacleId;
      }
      if (this.sameObstacleStreak >= 5) {
        this.rage = clamp(this.rage + RAGE_PER_REPEAT, 0, 100);
      }

      this.rage = clamp(this.rage + RAGE_PER_DEATH, 0, 100);
      if (this.rage > this.stats.highestRage) this.stats.highestRage = this.rage;

      Sound.death();
      this.showDeathMessage(fallDistance);
      this.checkDeathAchievements();
      this.updateHud();
      Store.save(this.stats);

      this.setTrackedTimeout(() => {
        this.respawn();
      }, DEATH_PAUSE_MS + RESPAWN_MS);
    },

    respawn() {
      const spawn = this.getCheckpointSpawn();
      const p = this.player;
      p.x = spawn.x; p.y = spawn.y;
      p.vx = 0; p.vy = 0;
      p.grounded = false;
      p.lastGroundedAt = -9999;
      this.isDying = false;
      this.hideToast();
    },

    checkDeathAchievements() {
      if (this.deaths === 1) this.unlock("FIRST_BLOOD");
      if (this.sameObstacleStreak === 5) this.unlock("FUCK_THIS_SPIKE");
      if (this.deaths === 69) this.unlock("NICE");
      if (this.deaths === 100) this.unlock("ABSOLUTE_PSYCHOPATH");
    },

    unlock(key) {
      if (this.unlockedAchievements.has(key)) return;
      this.unlockedAchievements.add(key);
      const a = ACHIEVEMENTS[key];
      if (!a) return;
      if (this.stats.achievements.indexOf(key) === -1) this.stats.achievements.push(key);
      Store.save(this.stats);
      Sound.achievement();
      this.showAchievement(a.title, a.desc);
    },

    /* -------------------- Death messages -------------------- */
    showDeathMessage(fallDistance) {
      const msg = this.pickDeathMessage(fallDistance);
      this.showToast(msg);
    },

    pickDeathMessage(fallDistance) {
      const d = this.deaths;
      if (this.sameObstacleStreak === 3) return "THAT FUCKING THING AGAIN.";
      if (this.sameObstacleStreak === 5) return "BRO HAS BEEF WITH THIS SPIKE.";
      if (this.sameObstacleStreak === 8) return `YOU HAVE DIED HERE ${this.sameObstacleStreak} TIMES.`;
      if (this.sameObstacleStreak >= 10) return "THE SPIKE IS YOUR FINAL BOSS.";

      if (fallDistance >= 500) return "BRO JUST LOST HALF HIS LIFE.";
      if (fallDistance >= 300) return "THAT'S A FUCKING LOT OF PROGRESS.";
      if (fallDistance >= 100) return "Okay, that's annoying.";

      if (d === 69) return "NICE.\n69 DEATHS. STILL FUCKED. 💀";
      if (d === 100) return "100 DEATHS 💀 GO TOUCH GRASS.";
      if (d >= 51) return pick(["You have beef with a rectangle.", "Please fucking lock in."]);
      if (d >= 31) return pick(["WHAT THE FUCK ARE YOU DOING?", "This platform owns your ass."]);
      if (d >= 16) return pick(["Bro is getting cooked by geometry.", "Stop doing the same shit."]);
      if (d >= 8) return pick(["THAT SPIKE AGAIN?", "You had ONE FUCKING JOB."]);
      if (d >= 3) return pick(["Bro, what the hell?", "You fucking rushed it.", "Use your fucking brain."]);
      return pick(["Unlucky.", "Okay bro, lock in.", "Okay, now you know."]);
    },

    /* -------------------- Victory -------------------- */
    winGame() {
      this.victory = true;
      this.gameOver = true;
      this.player.vx = 0; this.player.vy = 0;
      this.stats.gamesCompleted++;
      const timeMs = this.elapsedMs;
      if (!this.stats.bestTimeMs || timeMs < this.stats.bestTimeMs) this.stats.bestTimeMs = timeMs;
      if (this.bestHeightReached > this.stats.bestHeight) this.stats.bestHeight = this.bestHeightReached;
      this.stats.furthestCheckpoint = Math.max(this.stats.furthestCheckpoint, this.currentCheckpointIndex);
      this.stats.totalFallDistance += this.totalFallDistance;
      Store.save(this.stats);

      this.unlock("FINAL_JUMP");
      this.unlock("HOLY_SHIT");
      if (this.deaths < 10) this.unlock("NO_FUCKING_WAY");

      Sound.victory();
      this.showSign("HOLY FUCK.", 900);
      this.setTrackedTimeout(() => this.showResults(), 1100);
    },

    showResults() {
      document.getElementById("bro18-hud").classList.add("bro18-hidden");
      const grid = document.getElementById("bro18-results-grid");
      const timeSec = (this.elapsedMs / 1000).toFixed(1);
      grid.innerHTML = "";
      const rows = [
        ["TIME", timeSec + "s"],
        ["DEATHS", String(this.deaths)],
        ["BEST HEIGHT", Math.round(this.bestHeightReached) + "px"],
        ["RAGE", Math.round(this.rage) + "%"]
      ];
      rows.forEach(([label, val]) => {
        const d = document.createElement("div");
        d.className = "bro18-result-stat";
        d.innerHTML = `<b>${val}</b>${label}`;
        grid.appendChild(d);
      });
      const rank = this.computeRank();
      document.getElementById("bro18-rank").textContent = `RANK: ${rank.grade} — ${rank.label}`;
      const achList = document.getElementById("bro18-achievements-list");
      achList.innerHTML = "";
      this.stats.achievements.forEach((key) => {
        const a = ACHIEVEMENTS[key];
        if (!a) return;
        const span = document.createElement("span");
        span.textContent = a.title;
        achList.appendChild(span);
      });
      document.getElementById("bro18-results").classList.remove("bro18-hidden");
      this.renderStatsPreview();
    },

    computeRank() {
      const d = this.deaths;
      const timeSec = this.elapsedMs / 1000;
      if (d === 0 && timeSec < 150) return { grade: "SSS", label: "TOUCH GRASS IMMEDIATELY" };
      if (d <= 3) return { grade: "SS", label: "UNREASONABLE HUMAN" };
      if (d <= 8) return { grade: "S", label: "RAGE MONSTER" };
      if (d <= 15) return { grade: "A", label: "YOU KNOW WHAT YOU'RE DOING" };
      if (d <= 30) return { grade: "B", label: "ACTUALLY LOCKED IN" };
      if (d <= 50) return { grade: "C", label: "NOT TERRIBLE" };
      if (d <= 80) return { grade: "D", label: "YOU SURVIVED SOMEHOW" };
      return { grade: "F", label: "BRO GOT COOKED" };
    },

    shareResult() {
      const rank = this.computeRank();
      const text = `I survived "BRO, YOU'RE NOT 18+" 💀\nDeaths: ${this.deaths}\nRage: ${Math.round(this.rage)}%\nRank: ${rank.grade}\nZynox certified.`;
      if (navigator.share) {
        navigator.share({ text }).catch(() => this.copyToClipboard(text));
      } else {
        this.copyToClipboard(text);
      }
    },

    copyToClipboard(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          () => this.showToast("Copied result to clipboard!"),
          () => this.showToast("Couldn't copy — screenshot it instead.")
        );
      } else {
        this.showToast("Couldn't copy — screenshot it instead.");
      }
    },

    /* -------------------- HUD / toasts -------------------- */
    updateHud() {
      document.getElementById("bro18-hud-deaths").textContent = `DEATHS: ${this.deaths}`;
      const cp = this.level.checkpoints[this.currentCheckpointIndex];
      document.getElementById("bro18-hud-checkpoint").textContent = cp ? cp.label : "START";
      const secs = Math.floor(this.elapsedMs / 1000);
      document.getElementById("bro18-hud-time").textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
      document.getElementById("bro18-rage-fill").style.width = this.rage + "%";
      document.getElementById("bro18-rage-pct").textContent = Math.round(this.rage) + "%";
    },

    showToast(msg) {
      const el = document.getElementById("bro18-death-msg");
      el.textContent = msg;
      el.classList.remove("bro18-hidden");
    },
    hideToast() {
      document.getElementById("bro18-death-msg").classList.add("bro18-hidden");
    },
    showSign(text, durationMs) {
      const el = document.getElementById("bro18-signtext");
      el.textContent = text;
      el.classList.remove("bro18-hidden");
      this.setTrackedTimeout(() => this.hideSign(), durationMs || 1500);
    },
    hideSign() {
      document.getElementById("bro18-signtext").classList.add("bro18-hidden");
    },
    showAchievement(title, desc) {
      const el = document.getElementById("bro18-achievement");
      document.getElementById("bro18-ach-title").textContent = title;
      document.getElementById("bro18-ach-desc").textContent = desc;
      el.classList.remove("bro18-hidden");
      this.setTrackedTimeout(() => el.classList.add("bro18-hidden"), 2600);
    },

    /* -------------------- Rendering -------------------- */
    render(now) {
      const ctx = this.ctx;
      ctx.save();
      ctx.clearRect(0, 0, this.viewW, this.viewH);

      // world-to-screen transform: center world on view using scale, offset by camera
      ctx.translate(this.viewW / 2, this.viewH / 2);
      ctx.scale(this.scale, this.scale);
      ctx.translate(-(this.camera.x + WORLD_W / 2), -(this.camera.y + WORLD_H / 2));

      this.drawBackground();
      this.drawSigns();
      this.drawPlatforms(now);
      this.drawHazards(now);
      this.drawCheckpoints();
      this.drawGoal();
      if (this.player) this.drawPlayer();

      ctx.restore();

      if (this.debugMode) this.renderDebug(now);
    },

    drawBackground() {
      const ctx = this.ctx;
      ctx.fillStyle = "#050710";
      ctx.fillRect(this.camera.x - 200, this.camera.y - 400, WORLD_W + 400, WORLD_H + 800);
      // simple neon grid lines for depth
      ctx.strokeStyle = "rgba(125,255,179,0.05)";
      ctx.lineWidth = 1;
      const startX = Math.floor((this.camera.x - 200) / 80) * 80;
      for (let x = startX; x < this.camera.x + WORLD_W + 200; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, this.camera.y - 400);
        ctx.lineTo(x, this.camera.y + WORLD_H + 400);
        ctx.stroke();
      }
    },

    drawSigns() {
      const ctx = this.ctx;
      ctx.fillStyle = "rgba(59,208,255,0.85)";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      for (const s of this.level.signs) {
        ctx.fillText(s.text, s.x, s.y);
      }
    },

    drawPlatforms(now) {
      const ctx = this.ctx;
      for (const pl of this.level.platforms) {
        const r = this.platformRect(pl, now);
        if (pl.type === "disappearing") {
          const st = this.obstacleStates.get(pl.id);
          if (st && st.phase === "gone") continue;
          if (st && st.phase === "warn") {
            const t = (now - st.since) / pl.warnMs;
            ctx.globalAlpha = 1 - t * 0.6;
            ctx.fillStyle = "#ffcc33";
          } else if (st && st.phase === "returning") {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "#3bd0ff";
          } else {
            ctx.fillStyle = "#3bd0ff";
          }
        } else if (pl.type === "ice") {
          ctx.fillStyle = "#bfefff";
        } else if (pl.type === "launch") {
          ctx.fillStyle = "#ff9933";
        } else if (pl.type === "moving") {
          ctx.fillStyle = "#c99bff";
        } else if (pl.type === "gone-forever") {
          continue;
        } else {
          ctx.fillStyle = "#1c2536";
        }
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = "rgba(125,255,179,0.25)";
        ctx.strokeRect(r.x, r.y, r.w, r.h);
        ctx.globalAlpha = 1;
      }
    },

    drawHazards(now) {
      const ctx = this.ctx;
      for (const hz of this.level.hazards) {
        if (hz.kind === "spike") {
          this.drawSpike(hz.x, hz.y, hz.w, hz.h, "#ff3b6e");
        } else if (hz.kind === "delayedSpike") {
          const st = this.obstacleStates.get(hz.id);
          const active = st && st.phase === "active";
          const warning = st && st.phase === "delay";
          this.drawSpike(hz.x, hz.y, hz.w, hz.h, active ? "#ff3b6e" : warning ? "#ffcc33" : "rgba(255,59,110,0.35)");
        }
      }
    },

    drawSpike(x, y, w, h, color) {
      const ctx = this.ctx;
      ctx.fillStyle = color;
      const teeth = Math.max(1, Math.round(w / 16));
      const tw = w / teeth;
      for (let i = 0; i < teeth; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * tw, y + h);
        ctx.lineTo(x + i * tw + tw / 2, y);
        ctx.lineTo(x + i * tw + tw, y + h);
        ctx.closePath();
        ctx.fill();
      }
    },

    drawCheckpoints() {
      const ctx = this.ctx;
      for (const cp of this.level.checkpoints) {
        const active = cp.index <= this.currentCheckpointIndex;
        ctx.fillStyle = active ? "rgba(125,255,179,0.35)" : "rgba(234,255,240,0.12)";
        ctx.fillRect(cp.x, cp.y, cp.w, cp.h);
        ctx.strokeStyle = active ? "#7dffb3" : "rgba(234,255,240,0.3)";
        ctx.strokeRect(cp.x, cp.y, cp.w, cp.h);
      }
    },

    drawGoal() {
      if (!this.level.goal) return;
      const g = this.level.goal;
      const ctx = this.ctx;
      ctx.fillStyle = "rgba(255,204,51,0.35)";
      ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.strokeStyle = "#ffcc33";
      ctx.strokeRect(g.x, g.y, g.w, g.h);
      ctx.fillStyle = "#ffcc33";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("GOAL", g.x + g.w / 2, g.y - 8);
    },

    drawPlayer() {
      const p = this.player;
      const ctx = this.ctx;
      ctx.fillStyle = this.isDying ? "#ff3b6e" : "#7dffb3";
      ctx.shadowColor = this.isDying ? "#ff3b6e" : "#7dffb3";
      ctx.shadowBlur = 12;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.shadowBlur = 0;
    },

    renderDebug(now) {
      const el = document.getElementById("bro18-debug");
      const p = this.player;
      if (!p) return;
      el.textContent =
        `x: ${p.x.toFixed(1)}  y: ${p.y.toFixed(1)}\n` +
        `vx: ${p.vx.toFixed(2)}  vy: ${p.vy.toFixed(2)}\n` +
        `grounded: ${p.grounded}  onIce: ${p.onIce}\n` +
        `checkpoint: ${this.currentCheckpointIndex}\n` +
        `deaths: ${this.deaths}  rage: ${Math.round(this.rage)}\n` +
        `lastObstacle: ${this.lastObstacleId}  streak: ${this.sameObstacleStreak}`;
    }
  };

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  document.addEventListener("DOMContentLoaded", () => Bro18.init());
})();
