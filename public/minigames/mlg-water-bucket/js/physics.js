/* =========================================================
   Physics + round difficulty.
========================================================= */

import { GAME_CONFIG, WORLD } from "./config.js";

export function createPlayer(spawnX, spawnY) {
  return { x: spawnX, y: spawnY, velocityX: 0, velocityY: 0, facing: 1, width: GAME_CONFIG.player.width, height: GAME_CONFIG.player.height };
}

export function stepPhysics(player, input, roundConfig, dt) {
  const cfg = GAME_CONFIG.physics;
  const gravity = cfg.gravity * roundConfig.fallSpeedMult * roundConfig.gravityScale;
  const maxFall = cfg.maxFallSpeed * roundConfig.fallSpeedMult;
  player.velocityY = Math.min(player.velocityY + gravity * dt, maxFall);

  let targetVX = 0;
  if (input.left && !input.right) targetVX = -cfg.horizontalSpeed;
  if (input.right && !input.left) targetVX = cfg.horizontalSpeed;
  if (roundConfig.windForce) targetVX += roundConfig.windForce;

  if (targetVX !== 0) {
    const accel = cfg.horizontalAcceleration * dt;
    if (player.velocityX < targetVX) player.velocityX = Math.min(player.velocityX + accel, targetVX);
    else if (player.velocityX > targetVX) player.velocityX = Math.max(player.velocityX - accel, targetVX);
  } else {
    const decel = cfg.friction * dt;
    if (player.velocityX > 0) player.velocityX = Math.max(0, player.velocityX - decel);
    else if (player.velocityX < 0) player.velocityX = Math.min(0, player.velocityX + decel);
  }

  if (player.velocityX !== 0) player.facing = player.velocityX > 0 ? 1 : -1;
  player.x += player.velocityX * dt;
  player.y += player.velocityY * dt;

  const halfW = player.width / 2;
  const minX = halfW + 10;
  const maxX = WORLD.width - halfW - 10;
  if (player.x < minX) { player.x = minX; player.velocityX = 0; }
  if (player.x > maxX) { player.x = maxX; player.velocityX = 0; }
  return player;
}

export function timeToImpact(distance, velocityY, gravity) {
  if (distance <= 0) return 0;
  if (gravity <= 0) return velocityY > 0 ? distance / velocityY : Infinity;
  const a = 0.5 * gravity;
  const b = velocityY;
  const c = -distance;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return Infinity;
  const sqrtD = Math.sqrt(discriminant);
  const t1 = (-b + sqrtD) / (2 * a);
  const t2 = (-b - sqrtD) / (2 * a);
  const candidates = [t1, t2].filter(t => t >= 0);
  return candidates.length ? Math.min(...candidates) : Infinity;
}

function pickModifier(rng, roundNumber, diffCfg) {
  if (roundNumber < diffCfg.modifierStartRound) return null;
  const chance = Math.min(diffCfg.modifierBaseChance + (roundNumber - diffCfg.modifierStartRound) * diffCfg.modifierChancePerRound, diffCfg.maxModifierChance);
  if (rng() > chance) return null;
  const keys = Object.keys(GAME_CONFIG.modifiers);
  return keys[Math.floor(rng() * keys.length)];
}

export function buildRoundConfig({ roundNumber, riskKey, rng, forceModifier = undefined }) {
  const diff = GAME_CONFIG.difficulty;
  const risk = GAME_CONFIG.risk[riskKey] || GAME_CONFIG.risk.risky;
  const groundY = WORLD.height - WORLD.groundMargin;
  const rawHeight = Math.min(diff.baseHeight + diff.heightPerRound * (roundNumber - 1), diff.maxHeight);
  const height = rawHeight * risk.heightFactor;
  const rawPlatform = Math.max(diff.minPlatformWidth, diff.basePlatformWidth - diff.platformShrinkPerRound * (roundNumber - 1));
  let platformWidth = rawPlatform * risk.zoneWidthFactor;
  const fallSpeedMult = Math.min(diff.maxFallSpeedMult, diff.baseFallSpeedMult + diff.fallSpeedGrowthPerRound * (roundNumber - 1));
  const timingWindowScale = Math.max(diff.minTimingWindowScale, diff.baseTimingWindowScale - diff.timingShrinkPerRound * (roundNumber - 1)) * risk.timingScale;

  let horizontalOffset = 0;
  if (roundNumber >= diff.horizontalOffsetStartRound) {
    const progress = Math.min(1, (roundNumber - diff.horizontalOffsetStartRound) / 20);
    horizontalOffset = (rng() * 2 - 1) * diff.maxHorizontalOffset * progress;
  }

  const modifier = forceModifier !== undefined ? forceModifier : pickModifier(rng, roundNumber, diff);
  let gravityScale = 1;
  let windForce = 0;
  if (modifier === "LOW_GRAVITY") gravityScale = 0.62;
  if (modifier === "FAST_FALL") gravityScale = 1.55;
  if (modifier === "WIND") windForce = (rng() > 0.5 ? 1 : -1) * 90;
  if (modifier === "TINY_LANDING_ZONE") platformWidth = Math.max(diff.minPlatformWidth * 0.6, platformWidth * 0.55);

  const zoneCenterX = WORLD.width / 2 + horizontalOffset;
  const spawnX = WORLD.width / 2;
  const spawnY = groundY - height;
  return { roundNumber, riskKey, height, groundY, spawnX, spawnY, platformWidth, zoneCenterX, zoneHalfWidth: platformWidth / 2, fallSpeedMult, timingWindowScale, gravityScale, windForce, modifier, modifierMoving: modifier === "MOVING_PLATFORM", scoreMultiplier: risk.scoreMultiplier, darkDrop: modifier === "DARK_DROP" };
}

export function updateMovingPlatform(roundConfig, elapsed) {
  if (!roundConfig.modifierMoving) return roundConfig.zoneCenterX;
  const range = 90;
  const speed = 1.6;
  const base = WORLD.width / 2 + (roundConfig.zoneCenterX - WORLD.width / 2);
  return base + Math.sin(elapsed * speed) * range;
}
