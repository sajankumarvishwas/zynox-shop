/* =========================================================
   Defensive, versioned localStorage wrapper.
========================================================= */

import { STORAGE_KEY } from "./config.js";

const DEFAULT_STATE = {
  version: 1,
  stats: {
    totalDrops: 0,
    successfulDrops: 0,
    failedDrops: 0,
    perfectDrops: 0,
    bestScore: 0,
    bestCombo: 0,
    bestHeight: 0
  },
  progression: {
    level: 1,
    xp: 0,
    unlockedCosmetics: ["classic"],
    selectedCosmetic: "classic",
    unlockedTitles: ["rookie"],
    selectedTitle: "rookie"
  },
  achievements: {},
  daily: {
    lastCompletedDate: null,
    streak: 0
  },
  settings: {
    soundOn: true,
    reducedMotion: false,
    sfxVolume: 0.5
  },
  bestGhost: null,
  localLeaderboard: []
};

function deepMerge(target, source) {
  if (!source || typeof source !== "object") return target;
  const output = Array.isArray(target) ? [...target] : { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === "object" && !Array.isArray(value) && output[key] && typeof output[key] === "object" && !Array.isArray(output[key])) {
      output[key] = deepMerge(output[key], value);
    } else {
      output[key] = Array.isArray(value) ? [...value] : value;
    }
  }
  return output;
}

export class StorageManager {
  constructor() {
    this.available = this._checkAvailability();
    this.state = this._load();
  }

  _checkAvailability() {
    try {
      const probe = "__zynox_mlg_probe__";
      localStorage.setItem(probe, "1");
      localStorage.removeItem(probe);
      return true;
    } catch (_) {
      return false;
    }
  }

  _load() {
    const fallback = structuredClone ? structuredClone(DEFAULT_STATE) : JSON.parse(JSON.stringify(DEFAULT_STATE));
    if (!this.available) return fallback;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return deepMerge(fallback, parsed);
    } catch (_) {
      return fallback;
    }
  }

  save() {
    if (!this.available) return false;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      return true;
    } catch (_) {
      return false;
    }
  }

  get(path = null) {
    if (!path) return this.state;
    return path.split(".").reduce((acc, key) => acc == null ? undefined : acc[key], this.state);
  }

  set(path, value) {
    const parts = path.split(".");
    let target = this.state;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      if (!target[key] || typeof target[key] !== "object") target[key] = {};
      target = target[key];
    }
    target[parts[parts.length - 1]] = value;
    this.save();
    return value;
  }
}
