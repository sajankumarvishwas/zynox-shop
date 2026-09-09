/* =========================================================
   Fixed-capacity particle object pool.
========================================================= */

const POOL_SIZE = 220;

export class ParticleSystem {
  constructor() {
    this.pool = new Array(POOL_SIZE);
    for (let i = 0; i < POOL_SIZE; i++) this.pool[i] = { alive: false };
    this.cursor = 0;
  }

  _spawn(config) {
    const p = this.pool[this.cursor];
    this.cursor = (this.cursor + 1) % POOL_SIZE;
    Object.assign(p, { alive: true, age: 0, ...config });
    return p;
  }

  burst(x, y, { count = 12, color = "#63b8ff", speed = 220, spread = Math.PI * 2, baseAngle = -Math.PI / 2, gravity = 700, life = 0.5, size = 4, shape = "square" } = {}) {
    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (Math.random() - 0.5) * spread;
      const s = speed * (0.4 + Math.random() * 0.6);
      this._spawn({ x, y, vx: Math.cos(angle) * s, vy: Math.sin(angle) * s, gravity, life, maxLife: life, color, size: size * (0.7 + Math.random() * 0.6), shape });
    }
  }

  splash(x, y, color = "#4fa8ff") { this.burst(x, y, { count: 16, color, speed: 260, spread: Math.PI * 0.9, baseAngle: -Math.PI / 2, gravity: 900, life: 0.45, size: 4, shape: "square" }); }
  impactDust(x, y) { this.burst(x, y, { count: 10, color: "#cbbf9a", speed: 140, spread: Math.PI, baseAngle: -Math.PI / 2, gravity: 300, life: 0.4, size: 3, shape: "square" }); }
  perfectFlash(x, y) { this.burst(x, y, { count: 26, color: "#ffd84a", speed: 320, spread: Math.PI * 2, gravity: 500, life: 0.6, size: 5, shape: "diamond" }); }
  comboBurst(x, y) { this.burst(x, y, { count: 10, color: "#a66bff", speed: 180, spread: Math.PI * 2, gravity: 200, life: 0.4, size: 3, shape: "square" }); }

  update(dt) {
    for (let i = 0; i < POOL_SIZE; i++) {
      const p = this.pool[i];
      if (!p.alive) continue;
      p.age += dt;
      if (p.age >= p.life) { p.alive = false; continue; }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  render(ctx) {
    for (let i = 0; i < POOL_SIZE; i++) {
      const p = this.pool[i];
      if (!p.alive) continue;
      const t = p.age / p.maxLife;
      ctx.globalAlpha = Math.max(1 - t, 0);
      ctx.fillStyle = p.color;
      const half = p.size / 2;
      if (p.shape === "diamond") {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.PI / 4); ctx.fillRect(-half, -half, p.size, p.size); ctx.restore();
      } else {
        ctx.fillRect(p.x - half, p.y - half, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
  }

  clear() { for (let i = 0; i < POOL_SIZE; i++) this.pool[i].alive = false; }
}
