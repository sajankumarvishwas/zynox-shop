/* =========================================================
   Progression, achievements, cosmetics, ghosts, leaderboard.
========================================================= */

import { GAME_CONFIG } from "./config.js";

export function xpForRoundResult(label) {
  return GAME_CONFIG.xp.perRoundSuccess[label === "PERFECT MLG" ? "PERFECT MLG" : label] || 0;
}
export function xpForDeath() { return GAME_CONFIG.xp.perDeath; }
export function xpRequiredForLevel(level) { return Math.round(GAME_CONFIG.xp.perLevel * Math.pow(GAME_CONFIG.xp.levelGrowth, level - 1)); }

export function applyXp(progression, gainedXp) {
  let { level, xp } = progression;
  xp += gainedXp;
  let levelsGained = 0;
  let required = xpRequiredForLevel(level);
  while (xp >= required) { xp -= required; level += 1; levelsGained += 1; required = xpRequiredForLevel(level); }
  return { level, xp, leveledUp: levelsGained > 0, levelsGained };
}

export class ProgressionManager {
  constructor(storage) { this.storage = storage; }
  get stats() { return this.storage.get("stats"); }
  get progression() { return this.storage.get("progression"); }
  get achievements() { return this.storage.get("achievements") || {}; }

  recordRoundOutcome({ survived, label, height, comboAfter }) {
    const stats = { ...this.stats };
    stats.totalDrops += 1;
    if (survived) { stats.successfulDrops += 1; if (label === "PERFECT MLG") stats.perfectDrops += 1; }
    else stats.failedDrops += 1;
    stats.bestHeight = Math.max(stats.bestHeight, Math.round(height));
    stats.bestCombo = Math.max(stats.bestCombo, comboAfter);
    this.storage.set("stats", stats);
    const gained = survived ? xpForRoundResult(label) : xpForDeath();
    const xpResult = applyXp(this.progression, gained);
    this.storage.set("progression.level", xpResult.level);
    this.storage.set("progression.xp", xpResult.xp);
    const newlyUnlocked = this._checkUnlocks(xpResult.level);
    const unlockedAchievements = this._checkAchievements({ survived, stats: this.stats, combo: comboAfter, level: xpResult.level });
    return { xpResult, newlyUnlocked, unlockedAchievements };
  }

  recordRunEnd({ finalScore }) {
    const stats = { ...this.stats };
    if (finalScore > stats.bestScore) { stats.bestScore = finalScore; this.storage.set("stats", stats); return true; }
    return false;
  }

  _checkUnlocks(level) {
    const unlocked = [];
    const progression = { ...this.progression };
    progression.unlockedCosmetics = [...(progression.unlockedCosmetics || [])];
    progression.unlockedTitles = [...(progression.unlockedTitles || [])];
    for (const [key, cosmetic] of Object.entries(GAME_CONFIG.cosmetics)) {
      if (level >= cosmetic.unlockLevel && !progression.unlockedCosmetics.includes(key)) { progression.unlockedCosmetics.push(key); unlocked.push({ type: "cosmetic", key, label: cosmetic.label }); }
    }
    for (const [key, title] of Object.entries(GAME_CONFIG.titles)) {
      if (level >= title.unlockLevel && !progression.unlockedTitles.includes(key)) { progression.unlockedTitles.push(key); unlocked.push({ type: "title", key, label: title.label }); }
    }
    if (unlocked.length) this.storage.set("progression", progression);
    return unlocked;
  }

  _checkAchievements({ survived, stats, combo, level }) {
    const current = { ...this.achievements };
    const unlocked = [];
    const tryUnlock = (key) => { if (current[key]) return; current[key] = true; unlocked.push({ key, ...GAME_CONFIG.achievements[key] }); };
    if (survived) tryUnlock("FIRST_CLUTCH");
    if (stats.perfectDrops >= 10) tryUnlock("TEN_PERFECTS");
    if (combo >= 10) tryUnlock("TEN_COMBO");
    if (survived && stats.bestHeight >= GAME_CONFIG.difficulty.maxHeight * GAME_CONFIG.risk.insane.heightFactor - 1) tryUnlock("HIGH_GROUND");
    if (stats.totalDrops >= 20 && stats.successfulDrops / stats.totalDrops >= 0.9) tryUnlock("WATER_GOD");
    if (level >= 10) tryUnlock("ZYNOX_LEGEND");
    if (unlocked.length) this.storage.set("achievements", current);
    return unlocked;
  }

  setSelectedCosmetic(key) { if (!this.progression.unlockedCosmetics.includes(key)) return false; this.storage.set("progression.selectedCosmetic", key); return true; }
  setSelectedTitle(key) { if (!this.progression.unlockedTitles.includes(key)) return false; this.storage.set("progression.selectedTitle", key); return true; }
  saveGhostIfBest(runSummary) { const currentBest = this.storage.get("bestGhost"); if (!currentBest || runSummary.score > currentBest.score) { this.storage.set("bestGhost", runSummary); return true; } return false; }
  getGhost() { return this.storage.get("bestGhost"); }

  recordDailyCompletion(dateKey) {
    const daily = { ...this.storage.get("daily") };
    if (daily.lastCompletedDate === dateKey) return daily;
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
    daily.streak = daily.lastCompletedDate === yKey ? daily.streak + 1 : 1;
    daily.lastCompletedDate = dateKey;
    this.storage.set("daily", daily);
    return daily;
  }
}

export class LeaderboardService {
  constructor(storage) { this.storage = storage; this.mode = "local"; }
  async getLeaderboard(limit = 10) { const entries = this.storage.get("localLeaderboard") || []; return [...entries].sort((a, b) => b.score - a.score).slice(0, limit); }
  async submitScore({ name = "YOU", score, mode, date = new Date().toISOString() }) { const entries = [...(this.storage.get("localLeaderboard") || [])]; entries.push({ name, score, mode, date }); entries.sort((a, b) => b.score - a.score); this.storage.set("localLeaderboard", entries.slice(0, 25)); return this.getPlayerRank(score); }
  async getPlayerRank(score) { const entries = this.storage.get("localLeaderboard") || []; return entries.filter(e => e.score > score).length + 1; }
}
