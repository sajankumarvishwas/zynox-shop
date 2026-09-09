/* =========================================================
   Zynox MLG Water Bucket — single browser entry point.
========================================================= */

import { StorageManager } from "./storage.js";
import { AudioManager } from "./audio.js";
import { ParticleSystem } from "./particles.js";
import { Renderer } from "./render.js";
import { ProgressionManager, LeaderboardService } from "./progression.js";
import { UI } from "./ui.js";
import { Game } from "./game.js";

function boot() {
  const canvas = document.getElementById("game-canvas");
  if (!canvas) { console.error("[Zynox MLG] Canvas not found — game cannot start."); return; }
  const storage = new StorageManager();
  const audio = new AudioManager({ getSettings: () => storage.get("settings") });
  const particles = new ParticleSystem();
  const renderer = new Renderer(canvas);
  const progression = new ProgressionManager(storage);
  const leaderboard = new LeaderboardService(storage);
  const ui = new UI({});
  try {
    new Game({ ui, renderer, audio, storage, particles, progression, leaderboard });
  } catch (error) {
    console.error("[Zynox MLG] Failed to start game:", error);
    const menu = document.getElementById("screen-menu");
    if (menu) { const notice = document.createElement("p"); notice.style.color = "var(--mc-red, #ff5757)"; notice.style.fontSize = "11px"; notice.textContent = "The game failed to load. Please refresh the page."; menu.querySelector(".mlg-menu-panel")?.appendChild(notice); }
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
