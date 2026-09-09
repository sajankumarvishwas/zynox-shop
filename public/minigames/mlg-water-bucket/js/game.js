/* =========================================================
   ZYNOX MLG WATER BUCKET — camera framing integration
========================================================= */

import { GAME_CONFIG, WORLD } from "./config.js";
import { createPlayer, stepPhysics, timeToImpact, buildRoundConfig, updateMovingPlatform } from "./physics.js";
import { classifyTiming, classifyPlacement, combineGrade, ScoreManager } from "./grading.js";
import { mulberry32, dailySeedFor, todayDateKey } from "./rng.js";

export const STATE = {
  MENU: "MENU", COUNTDOWN: "COUNTDOWN", FALLING: "FALLING",
  WATER_PLACED: "WATER_PLACED", RESOLVED: "RESOLVED",
  PAUSED: "PAUSED", RESULT: "RESULT"
};

const BUCKET = { READY: "READY", PLACED: "PLACED", USED: "USED" };
const COUNTDOWN_STEPS = [
  { label: "3", duration: 0.65 }, { label: "2", duration: 0.65 },
  { label: "1", duration: 0.65 }, { label: "GO!", duration: 0.45 }
];

export class Game {
  constructor({ ui, renderer, audio, storage, particles, progression, leaderboard }) {
    this.ui = ui; this.renderer = renderer; this.audio = audio; this.storage = storage;
    this.particles = particles; this.progression = progression; this.leaderboard = leaderboard;
    this.state = STATE.MENU; this.stateBeforePause = null;
    this.scoreManager = new ScoreManager();
    this.player = createPlayer(WORLD.width / 2, 100);
    this.roundConfig = null; this.bucket = BUCKET.READY; this.pendingWater = null;
    this.round = 1; this.livesRemaining = 1; this.elapsedRunTime = 0;
    this.modeKey = "CLASSIC"; this.riskKey = "risky"; this.isDaily = false;
    this.dailyRng = null; this.dailyDateKey = null; this.maxHeightThisRun = 0;
    this.roundsThisRun = 0; this.successThisRun = 0;
    this.countdownStepIndex = 0; this.countdownStepTimer = 0; this.resolveDelayTimer = 0;
    this.currentTrail = []; this.ghostPlayback = null;
    this.cameraZoom = 1; this.slowMoFactor = 1; this.slowMoTimer = 0;
    this._practiceDiffMs = null; this._lastFrameTime = null;
    this._boundLoop = this._loop.bind(this);

    this._wireUiCallbacks(); this._wireLifecycleEvents(); this._setupResize();
    this._loadSettingsIntoUi(); this.ui.showScreen("menu"); this._refreshMenu();
    requestAnimationFrame(this._boundLoop);
  }

  _wireUiCallbacks() {
    this.ui.cb = {
      onButtonClick: () => this.audio.button(),
      onStartGameClicked: () => this._beginModeFlow("CLASSIC"),
      onModeChosen: key => this._beginModeFlow(key),
      onDailyChosen: () => this._beginDailyFlow(),
      onRiskChosen: riskKey => this._onRiskChosen(riskKey),
      onResume: () => this._resume(), onRestart: () => this._restartRun(),
      onExitToMenu: () => this._exitToMenu(), onPlayAgain: () => this._restartRun(),
      onEscapePressed: () => this._togglePause(),
      onWaterPlaceRequested: () => this._handleWaterPlace(),
      onSettingChange: (key, value) => this._onSettingChange(key, value),
      getStatsSnapshot: () => this.storage.get("stats"),
      getAchievementsSnapshot: () => this.storage.get("achievements") || {},
      getProgressionSnapshot: () => this.storage.get("progression"),
      onSelectCosmetic: key => this.progression.setSelectedCosmetic(key),
      onSelectTitle: key => this.progression.setSelectedTitle(key)
    };
  }

  _wireLifecycleEvents() {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this._isRoundActiveState()) this._pause();
    });
  }

  _setupResize() {
    const stage = document.getElementById("mlg-stage");
    const apply = () => {
      const rect = stage.getBoundingClientRect();
      const aspect = WORLD.width / WORLD.height;
      let w = rect.width, h = w / aspect;
      if (h > rect.height) { h = rect.height; w = h * aspect; }
      this.renderer.resize(Math.round(w), Math.round(h));
    };
    apply();
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    if (window.ResizeObserver) new ResizeObserver(apply).observe(stage);
  }

  _loadSettingsIntoUi() {
    const settings = this.storage.get("settings");
    this.ui.applySettingsToInputs(settings);
    document.body.classList.toggle("mlg-reduced-motion", !!settings.reducedMotion);
  }

  _onSettingChange(key, value) { this.storage.set(`settings.${key}`, value); }

  _refreshMenu() {
    const stats = this.storage.get("stats"), progression = this.storage.get("progression");
    this.ui.refreshMenuStats({ bestScore: stats.bestScore, bestCombo: stats.bestCombo, level: progression.level });
  }

  _beginModeFlow(modeKey) {
    this.audio.unlock(); this.modeKey = modeKey; this.isDaily = false;
    if (modeKey === "PRACTICE") { this._onRiskChosen("risky"); return; }
    this.ui.setRiskBackTarget(modeKey === "CLASSIC" ? "menu" : "modeSelect");
    this.ui.showRiskSelect(GAME_CONFIG.modes[modeKey].label);
  }

  _beginDailyFlow() {
    this.audio.unlock();
    const dateKey = todayDateKey(), daily = this.storage.get("daily");
    this._beginDailyRun(dateKey, daily.lastCompletedDate === dateKey);
  }

  _beginDailyRun(dateKey, alreadyCompleted) {
    this.modeKey = "DAILY_CLUTCH"; this.isDaily = true; this.dailyDateKey = dateKey;
    this.dailyRng = mulberry32(dailySeedFor(dateKey)); this.riskKey = "risky";
    this._alreadyCompletedDailyToday = alreadyCompleted; this._startRun();
  }

  _onRiskChosen(riskKey) { this.riskKey = riskKey; this._startRun(); }

  _startRun() {
    this.scoreManager.reset(); this.round = 1; this.roundsThisRun = 0; this.successThisRun = 0;
    this.maxHeightThisRun = 0; this.elapsedRunTime = 0; this._practiceDiffMs = null;
    this.livesRemaining = GAME_CONFIG.modes[this.modeKey].lives;
    this.ghostPlayback = this.progression.getGhost();
    this.ui.hideAllScreens(); this.ui.setHudVisible(true); this._beginRound();
  }

  _restartRun() { this.ui.hideAllScreens(); this._startRun(); }

  _exitToMenu() {
    this.state = STATE.MENU; this.ui.setHudVisible(false);
    this.ui.hideAllScreens(); this.ui.showScreen("menu"); this._refreshMenu();
  }

  _beginRound() {
    const rng = this.isDaily ? this.dailyRng : Math.random;
    this.roundConfig = buildRoundConfig({ roundNumber: this.round, riskKey: this.riskKey, rng });
    this.player = createPlayer(this.roundConfig.spawnX, this.roundConfig.spawnY);
    this.bucket = BUCKET.READY; this.pendingWater = null; this.currentTrail = [];
    this.particles.clear(); this.slowMoFactor = 1; this.slowMoTimer = 0; this.cameraZoom = 1;
    this.renderer.setCamera({ playerY: this.player.y, groundY: this.roundConfig.groundY, active: false });
    this.ui.showModifier(this.roundConfig.modifier); this.ui.onRoundStart(); this.ui.resetInput();
    this._updateHud(); this.countdownStepIndex = 0;
    this.countdownStepTimer = COUNTDOWN_STEPS[0].duration;
    this.ui.showCountdown(COUNTDOWN_STEPS[0].label); this.audio.countdownTick(false);
    this.state = STATE.COUNTDOWN;
  }

  _handleWaterPlace() {
    if (this.state !== STATE.FALLING || this.bucket !== BUCKET.READY) return;
    this.bucket = BUCKET.USED;
    const gravity = GAME_CONFIG.physics.gravity * this.roundConfig.fallSpeedMult * this.roundConfig.gravityScale;
    const distance = this.roundConfig.groundY - (this.player.y + this.player.height / 2);
    const secondsToImpact = timeToImpact(Math.max(distance, 0), this.player.velocityY, gravity);
    const timingGrade = classifyTiming(secondsToImpact, this.roundConfig.timingWindowScale);
    const placementGrade = classifyPlacement(this.player.x, this._currentZoneCenterX(), this.roundConfig.zoneHalfWidth);
    const result = combineGrade(timingGrade, placementGrade);

    this.pendingWater = { x: this.player.x, result, placedAt: performance.now() };
    this.renderer.triggerWaterPlace?.(this.player.x, this.roundConfig.groundY);
    this.audio.waterPlace(); this.state = STATE.WATER_PLACED;
  }

  _currentZoneCenterX() {
    return this.roundConfig.modifierMoving
      ? updateMovingPlatform(this.roundConfig, this.elapsedRunTime)
      : this.roundConfig.zoneCenterX;
  }

  _finalizeLanding() {
    const result = this.pendingWater ? this.pendingWater.result : combineGrade("TOO_LATE", "MISS");
    const x = this.pendingWater ? this.pendingWater.x : this.player.x, y = this.roundConfig.groundY;
    this.player.y = y - this.player.height / 2;
    this.renderer.triggerLandingImpact?.(x, y, result.label);

    if (result.survived) {
      this.successThisRun += 1;
      const finalScore = this.scoreManager.registerSuccess(result, {
        height: this.roundConfig.height, roundConfig: this.roundConfig,
        modeScoreMultiplier: GAME_CONFIG.modes[this.modeKey].scoreMultiplier
      });
      this.particles.splash(x, y);
      if (result.label === "PERFECT MLG") {
        this.particles.perfectFlash(x, y - 20); this.audio.gradePerfect(); this._triggerPerfectFx();
      } else if (result.label === "MLG") this.audio.gradeMlg();
      else this.audio.gradeGood();
      if (this.scoreManager.combo >= 2) { this.particles.comboBurst(x, y - 10); this.audio.comboTick(); }
      this.ui.showGrade(result); this.ui.showCombo(this.scoreManager.combo);
      this._handleProgressionOutcome(this.progression.recordRoundOutcome({
        survived: true, label: result.label, height: this.roundConfig.height,
        comboAfter: this.scoreManager.combo, scoreThisRound: finalScore
      }));
      this.maxHeightThisRun = Math.max(this.maxHeightThisRun, this.roundConfig.height);
    } else {
      this.particles.impactDust(x, y); this.audio.death(); this.ui.showGrade(result);
      this.scoreManager.registerFailure();
      this._handleProgressionOutcome(this.progression.recordRoundOutcome({
        survived: false, label: result.label, height: this.roundConfig.height,
        comboAfter: 0, scoreThisRound: 0
      }));
      this.livesRemaining -= 1;
    }

    this.roundsThisRun += 1; this._updateHud(); this.ui.onRoundEnd(); this.state = STATE.RESOLVED;
    const modeCfg = GAME_CONFIG.modes[this.modeKey];
    const perfectRunFail = modeCfg.requireGoodOrBetter && result.survived && result.label === "BARELY";
    this._runShouldEndNext = ((!result.survived && this.livesRemaining <= 0) ||
      perfectRunFail || (this.isDaily && (!result.survived || this.roundsThisRun >= modeCfg.fixedRounds)));
    this._lastResultSurvived = result.survived; this.resolveDelayTimer = 1.05;
  }

  _handleProgressionOutcome(outcome) {
    outcome.newlyUnlocked.forEach(u => this.ui.queueAchievementToast({ label: `${u.type === "cosmetic" ? "UNLOCKED" : "TITLE"}: ${u.label}` }));
    outcome.unlockedAchievements.forEach(a => { this.audio.achievementUnlock(); this.ui.queueAchievementToast(a); });
  }

  _triggerPerfectFx() { this.slowMoFactor = 0.35; this.slowMoTimer = 0.28; this.cameraZoom = 1.05; }

  _endRun() {
    const finalScore = this.scoreManager.totalScore;
    const isNewRecord = this.progression.recordRunEnd({ finalScore });
    if (this.isDaily && this._lastResultSurvived !== false) this.progression.recordDailyCompletion(this.dailyDateKey);

    const totalXp = this.roundsThisRun > 0 ? Math.round(this.successThisRun * 30) : 0;
    this.progression.saveGhostIfBest({ score: finalScore, trail: this.currentTrail, height: this.maxHeightThisRun, mode: this.modeKey });

    if (GAME_CONFIG.modes[this.modeKey].ranked) this.leaderboard.submitScore({ score: finalScore, mode: this.modeKey });

    const stats = this.storage.get("stats");
    const summary = {
      modeLabel: GAME_CONFIG.modes[this.modeKey].label, score: finalScore, best: stats.bestScore,
      round: this.roundsThisRun, bestCombo: this.scoreManager.bestComboThisRun,
      maxHeight: this.maxHeightThisRun,
      successRate: this.roundsThisRun ? this.successThisRun / this.roundsThisRun : 0,
      xpEarned: totalXp
    };

    if (isNewRecord) this.audio.newRecord();
    this.state = STATE.RESULT; this.ui.setHudVisible(false);
    this.ui.showResult({ survived: this._lastResultSurvived, summary, isNewRecord }); this._refreshMenu();
  }

  _togglePause() {
    if (this.state === STATE.PAUSED) this._resume();
    else if (this._isRoundActiveState()) this._pause();
  }

  _isRoundActiveState() { return [STATE.COUNTDOWN, STATE.FALLING, STATE.WATER_PLACED].includes(this.state); }

  _pause() { if (!this._isRoundActiveState()) return; this.stateBeforePause = this.state; this.state = STATE.PAUSED; this.ui.showScreen("pause"); }

  _resume() {
    if (this.state !== STATE.PAUSED) return;
    this.state = this.stateBeforePause || STATE.FALLING; this.ui.hideAllScreens(); this._lastFrameTime = null;
  }

  _updateHud() {
    const stats = this.storage.get("stats"), mode = GAME_CONFIG.modes[this.modeKey];
    this.ui.updateHud({
      score: this.scoreManager.totalScore, best: stats.bestScore, round: this.round,
      height: this.roundConfig ? this.roundConfig.height : 0, combo: this.scoreManager.combo,
      heatPercent: this.scoreManager.heat, overdrive: this.scoreManager.inOverdrive,
      timeLeft: mode.timeLimit ? mode.timeLimit - this.elapsedRunTime : undefined
    });
    this.ui.updatePracticePanel(this.modeKey === "PRACTICE", this._practiceDiffMs);
  }

  _loop(timestamp) {
    if (this._lastFrameTime === null) this._lastFrameTime = timestamp;
    let dt = (timestamp - this._lastFrameTime) / 1000;
    this._lastFrameTime = timestamp;
    dt = Math.min(dt, GAME_CONFIG.physics.maxDeltaTime);
    this._update(dt); this._render(); requestAnimationFrame(this._boundLoop);
  }

  _update(dt) {
    this.renderer.updateClouds(dt); this.particles.update(dt);
    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= dt;
      if (this.slowMoTimer <= 0) { this.slowMoFactor = 1; this.cameraZoom = 1; }
    }

    switch (this.state) {
      case STATE.COUNTDOWN: this._updateCountdown(dt); break;
      case STATE.FALLING:
      case STATE.WATER_PLACED: this._updateFalling(dt * this.slowMoFactor); break;
      case STATE.RESOLVED:
        this.resolveDelayTimer -= dt;
        if (this.resolveDelayTimer <= 0) {
          if (this._runShouldEndNext) this._endRun();
          else { this.round += 1; this._beginRound(); }
        }
        break;
      default: break;
    }
  }

  _updateCountdown(dt) {
    this.countdownStepTimer -= dt;
    if (this.countdownStepTimer <= 0) {
      this.countdownStepIndex += 1;
      if (this.countdownStepIndex >= COUNTDOWN_STEPS.length) {
        this.ui.hideCountdown(); this.state = STATE.FALLING; this.audio.bucketReady(); return;
      }
      const step = COUNTDOWN_STEPS[this.countdownStepIndex];
      this.countdownStepTimer = step.duration; this.ui.showCountdown(step.label);
      this.audio.countdownTick(step.label === "GO!");
    }
  }

  _updateFalling(dt) {
    const mode = GAME_CONFIG.modes[this.modeKey];
    this.elapsedRunTime += dt;

    if (mode.timeLimit && this.elapsedRunTime >= mode.timeLimit) {
      this._runShouldEndNext = true; this._lastResultSurvived = this.successThisRun > 0;
      this.state = STATE.RESOLVED; this.resolveDelayTimer = 0; this._endRun(); return;
    }

    if (this.state === STATE.FALLING) stepPhysics(this.player, this.ui.input, this.roundConfig, dt);
    else stepPhysics(this.player, { left: false, right: false }, this.roundConfig, dt);

    const progress = Math.min(1, Math.max(0,
      (this.player.y - this.roundConfig.spawnY) / (this.roundConfig.groundY - this.roundConfig.spawnY)
    ));

    if (this.currentTrail.length === 0 || progress - this.currentTrail[this.currentTrail.length - 1].progress > 0.02) {
      this.currentTrail.push({ progress, x: this.player.x, y: this.player.y });
    }

    if (this.modeKey === "PRACTICE" && this.bucket === BUCKET.READY) {
      const gravity = GAME_CONFIG.physics.gravity * this.roundConfig.fallSpeedMult * this.roundConfig.gravityScale;
      const distance = this.roundConfig.groundY - (this.player.y + this.player.height / 2);
      const t = timeToImpact(Math.max(distance, 0), this.player.velocityY, gravity);
      this._practiceDiffMs = t === Infinity ? null : t * 1000;
    }

    this._updateHud();

    const bottom = this.player.y + this.player.height / 2;
    if (bottom >= this.roundConfig.groundY) this._finalizeLanding();
  }

  _render() {
    const r = this.renderer;
    const settings = this.storage.get("settings") || {};
    const active = this._isRoundActiveState() || this.state === STATE.RESOLVED;

    r.clear();
    r.setCamera({
      playerY: this.player?.y ?? WORLD.height / 2,
      groundY: this.roundConfig?.groundY ?? WORLD.height - WORLD.groundMargin,
      roundHeight: this.roundConfig?.height ?? 300,
      active,
      reducedMotion: !!settings.reducedMotion,
      playerVelocityY: this.player?.velocityY ?? 0
    });
    r.beginCamera();

    r.drawBackground(this.roundConfig ? this.roundConfig.darkDrop : false);

    if (this.roundConfig) {
      r.drawGround(this.roundConfig.groundY);
      r.drawLandingZone(this._currentZoneCenterX(), this.roundConfig.zoneHalfWidth, this.roundConfig.groundY);
      r.drawHeightMarkers?.(this.roundConfig);

      if (this.ghostPlayback && this.state === STATE.FALLING) {
        const progress = Math.min(1, Math.max(0,
          (this.player.y - this.roundConfig.spawnY) / (this.roundConfig.groundY - this.roundConfig.spawnY)
        ));
        const sample = this._sampleGhost(progress);
        if (sample) r.drawGhost(sample.x, sample.y, this.player.width, this.player.height);
      }

      if (active) {
        const cosmeticKey = this.storage.get("progression.selectedCosmetic");
        const cosmeticColor = GAME_CONFIG.cosmetics[cosmeticKey]?.color;
        r.drawPlayer(this.player, cosmeticColor, this.bucket === BUCKET.USED);

        if (this.pendingWater) {
          const elapsedSincePlaced = (performance.now() - this.pendingWater.placedAt) / 400;
          r.drawWater(this.pendingWater.x, this.roundConfig.groundY, elapsedSincePlaced);
        }
      }
    }

    this.particles.render(r.ctx);
    r.endCamera();
  }

  _sampleGhost(progress) {
    const trail = this.ghostPlayback?.trail;
    if (!trail || !trail.length) return null;
    let closest = trail[0], closestDiff = Infinity;
    for (const sample of trail) {
      const diff = Math.abs(sample.progress - progress);
      if (diff < closestDiff) { closestDiff = diff; closest = sample; }
    }
    return closest;
  }
}
