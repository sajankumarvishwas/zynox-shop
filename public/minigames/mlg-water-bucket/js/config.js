/* =========================================================
   ZYNOX MLG WATER BUCKET — central game configuration.
========================================================= */

export const STORAGE_KEY = "zynox_mlg_v1";

export const WORLD = {
  width: 420,
  height: 720,
  groundMargin: 96
};

export const GAME_CONFIG = {
  physics: {
    gravity: 980,
    maxFallSpeed: 1450,
    horizontalSpeed: 260,
    horizontalAcceleration: 2200,
    friction: 1800,
    maxDeltaTime: 1 / 20
  },

  player: {
    width: 34,
    height: 46
  },

  timing: {
    perfectWindow: 0.11,
    mlgWindow: 0.22,
    goodWindow: 0.40,
    barelyWindow: 0.62
  },

  placement: {
    centerFraction: 0.28,
    goodFraction: 0.60,
    barelyFraction: 1.00
  },

  risk: {
    safe: {
      heightFactor: 0.82,
      zoneWidthFactor: 1.35,
      timingScale: 1.22,
      scoreMultiplier: 0.80
    },
    risky: {
      heightFactor: 1.00,
      zoneWidthFactor: 1.00,
      timingScale: 1.00,
      scoreMultiplier: 1.00
    },
    insane: {
      heightFactor: 1.28,
      zoneWidthFactor: 0.78,
      timingScale: 0.80,
      scoreMultiplier: 1.55
    }
  },

  difficulty: {
    baseHeight: 230,
    heightPerRound: 14,
    maxHeight: 620,
    basePlatformWidth: 156,
    platformShrinkPerRound: 2.6,
    minPlatformWidth: 64,
    baseFallSpeedMult: 1,
    fallSpeedGrowthPerRound: 0.028,
    maxFallSpeedMult: 2.20,
    baseTimingWindowScale: 1,
    timingShrinkPerRound: 0.012,
    minTimingWindowScale: 0.56,
    horizontalOffsetStartRound: 3,
    maxHorizontalOffset: 125,
    modifierStartRound: 6,
    modifierBaseChance: 0.16,
    modifierChancePerRound: 0.018,
    maxModifierChance: 0.52
  },

  score: {
    base: 120,
    heightBonusPerPx: 0.9,
    timingGradeValue: {
      PERFECT: 260,
      MLG: 170,
      GOOD: 90,
      BARELY: 35
    },
    placementGradeValue: {
      CENTER: 180,
      GOOD: 110,
      BARELY: 35
    },
    perfectMlgFlatBonus: 500,
    streakBonusPerStreak: 7,
    overdriveMultiplier: 1.5
  },

  combo: {
    multiplierPerCombo: 0.09,
    maxComboForMultiplier: 20
  },

  heat: {
    max: 100,
    gainPerfectMlg: 34,
    gainMlg: 24,
    gainGood: 15,
    gainBarely: 8,
    decayPerRoundFail: 28,
    overdriveRounds: 3
  },

  xp: {
    perRoundSuccess: {
      "PERFECT MLG": 30,
      PERFECT: 30,
      MLG: 22,
      GOOD: 16,
      BARELY: 10
    },
    perDeath: 3,
    perLevel: 220,
    levelGrowth: 1.14
  },

  modes: {
    CLASSIC: { label: "CLASSIC", lives: 3, scoreMultiplier: 1, ranked: true },
    TIME_ATTACK: { label: "TIME ATTACK", lives: Infinity, scoreMultiplier: 0.92, timeLimit: 60, ranked: true },
    ONE_LIFE: { label: "ONE LIFE", lives: 1, scoreMultiplier: 1.18, ranked: true },
    PERFECT_RUN: { label: "PERFECT RUN", lives: 1, scoreMultiplier: 1.28, requireGoodOrBetter: true, ranked: true },
    DAILY_CLUTCH: { label: "TODAY'S CLUTCH", lives: 1, fixedRounds: 10, scoreMultiplier: 1.12, ranked: true },
    PRACTICE: { label: "PRACTICE", lives: Infinity, scoreMultiplier: 0.5, ranked: false }
  },

  modifiers: {
    WIND: { label: "WIND", description: "Crosswind pushes your movement." },
    LOW_GRAVITY: { label: "LOW GRAVITY", description: "Longer fall, later impact." },
    FAST_FALL: { label: "FAST FALL", description: "The drop accelerates hard." },
    DARK_DROP: { label: "DARK DROP", description: "The world goes dim." },
    MOVING_PLATFORM: { label: "MOVING PLATFORM", description: "The landing zone drifts." },
    TINY_LANDING_ZONE: { label: "TINY ZONE", description: "Your water target is smaller." }
  },

  achievements: {
    FIRST_CLUTCH: { label: "FIRST CLUTCH", desc: "Survive your first drop." },
    TEN_PERFECTS: { label: "TEN PERFECTS", desc: "Land 10 Perfect MLG drops." },
    TEN_COMBO: { label: "TEN COMBO", desc: "Reach a 10x combo." },
    HIGH_GROUND: { label: "HIGH GROUND", desc: "Reach the highest insane-tier height." },
    WATER_GOD: { label: "WATER GOD", desc: "Keep a 90% success rate over 20 drops." },
    ZYNOX_LEGEND: { label: "ZYNOX LEGEND", desc: "Reach level 10." }
  },

  cosmetics: {
    classic: { label: "CLASSIC BUCKET", unlockLevel: 1, color: "#8a8a8a" },
    diamond: { label: "DIAMOND BUCKET", unlockLevel: 3, color: "#63b8ff" },
    emerald: { label: "EMERALD BUCKET", unlockLevel: 5, color: "#55d63f" },
    nether: { label: "NETHER BUCKET", unlockLevel: 7, color: "#ff5757" },
    zynox: { label: "ZYNOX BUCKET", unlockLevel: 10, color: "#a66bff" }
  },

  titles: {
    rookie: { label: "ROOKIE", unlockLevel: 1 },
    clutcher: { label: "CLUTCHER", unlockLevel: 2 },
    mlg_player: { label: "MLG PLAYER", unlockLevel: 4 },
    clutch_master: { label: "CLUTCH MASTER", unlockLevel: 6 },
    water_god: { label: "WATER GOD", unlockLevel: 8 },
    zynox_legend: { label: "ZYNOX LEGEND", unlockLevel: 10 }
  }
};

export const TIMING_GRADES = Object.keys(GAME_CONFIG.timing);
export const PLACEMENT_GRADES = Object.keys(GAME_CONFIG.placement);
