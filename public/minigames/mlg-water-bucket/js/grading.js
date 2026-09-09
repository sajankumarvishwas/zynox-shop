/* =========================================================
   Timing + placement grading and score manager.
========================================================= */

import { GAME_CONFIG } from "./config.js";

export function classifyTiming(secondsToImpact, timingWindowScale) {
  const t = GAME_CONFIG.timing;
  const scale = timingWindowScale || 1;
  if (secondsToImpact < 0) return "TOO_LATE";
  if (secondsToImpact <= t.perfectWindow * scale) return "PERFECT";
  if (secondsToImpact <= t.mlgWindow * scale) return "MLG";
  if (secondsToImpact <= t.goodWindow * scale) return "GOOD";
  if (secondsToImpact <= t.barelyWindow * scale) return "BARELY";
  return "TOO_EARLY";
}

export function classifyPlacement(placementX, zoneCenterX, zoneHalfWidth) {
  const p = GAME_CONFIG.placement;
  const distance = Math.abs(placementX - zoneCenterX);
  const ratio = zoneHalfWidth > 0 ? distance / zoneHalfWidth : 1;
  if (ratio <= p.centerFraction) return "CENTER";
  if (ratio <= p.goodFraction) return "GOOD";
  if (ratio <= p.barelyFraction) return "BARELY";
  return "MISS";
}

const FAIL_TIMING = new Set(["TOO_EARLY", "TOO_LATE"]);
const FAIL_PLACEMENT = new Set(["MISS"]);

export function combineGrade(timingGrade, placementGrade) {
  if (FAIL_TIMING.has(timingGrade) || FAIL_PLACEMENT.has(placementGrade)) {
    let label = "MISS";
    if (timingGrade === "TOO_EARLY") label = "TOO EARLY";
    else if (timingGrade === "TOO_LATE") label = "TOO LATE";
    else if (placementGrade === "MISS") label = "BAD PLACEMENT";
    return { survived: false, label, timingGrade, placementGrade };
  }
  if (timingGrade === "PERFECT" && placementGrade === "CENTER") return { survived: true, label: "PERFECT MLG", timingGrade, placementGrade };
  const strongTiming = timingGrade === "PERFECT" || timingGrade === "MLG";
  const strongPlacement = placementGrade === "CENTER" || placementGrade === "GOOD";
  if (strongTiming && strongPlacement) return { survived: true, label: "MLG", timingGrade, placementGrade };
  if (timingGrade === "BARELY" || placementGrade === "BARELY") return { survived: true, label: "BARELY", timingGrade, placementGrade };
  return { survived: true, label: "GOOD", timingGrade, placementGrade };
}

export class ScoreManager {
  constructor() { this.reset(); }
  reset() { this.totalScore = 0; this.combo = 0; this.bestComboThisRun = 0; this.heat = 0; this.overdriveRoundsLeft = 0; this.streak = 0; }
  get comboMultiplier() { const c = GAME_CONFIG.combo; return 1 + Math.min(this.combo, c.maxComboForMultiplier) * c.multiplierPerCombo; }
  get inOverdrive() { return this.overdriveRoundsLeft > 0; }

  registerSuccess(result, { height, roundConfig, modeScoreMultiplier }) {
    const s = GAME_CONFIG.score;
    const h = GAME_CONFIG.heat;
    this.combo += 1;
    this.streak += 1;
    this.bestComboThisRun = Math.max(this.bestComboThisRun, this.combo);
    const heatGain = { "PERFECT MLG": h.gainPerfectMlg, MLG: h.gainMlg, GOOD: h.gainGood, BARELY: h.gainBarely }[result.label] || 0;
    this.heat = Math.min(h.max, this.heat + heatGain);
    if (this.heat >= h.max && this.overdriveRoundsLeft <= 0) { this.overdriveRoundsLeft = h.overdriveRounds; this.heat = 0; }
    const timingValue = s.timingGradeValue[result.timingGrade] || 0;
    const placementValue = s.placementGradeValue[result.placementGrade] || 0;
    const heightBonus = height * s.heightBonusPerPx;
    const perfectBonus = result.label === "PERFECT MLG" ? s.perfectMlgFlatBonus : 0;
    const streakBonus = this.streak * s.streakBonusPerStreak;
    const raw = s.base + heightBonus + timingValue + placementValue + perfectBonus + streakBonus;
    const riskMultiplier = roundConfig.scoreMultiplier;
    const comboMultiplier = this.comboMultiplier;
    const overdriveMultiplier = this.inOverdrive ? s.overdriveMultiplier : 1;
    const modeMultiplier = modeScoreMultiplier || 1;
    const finalScore = Math.round(raw * riskMultiplier * comboMultiplier * overdriveMultiplier * modeMultiplier);
    this.totalScore += finalScore;
    if (this.overdriveRoundsLeft > 0) this.overdriveRoundsLeft -= 1;
    return finalScore;
  }

  registerFailure() { this.combo = 0; this.streak = 0; this.heat = Math.max(0, this.heat - GAME_CONFIG.heat.decayPerRoundFail); return 0; }
}
