import { CONFIG } from './config.js';

/**
 * Particle & Visual Effects Engine
 * Handles block debris, impact sparks, explosion blasts,
 * floating score popups, motion ghost trails, and atmospheric volcanic embers.
 */
export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.popups = [];
    this.trail = [];
    this.embers = [];
    this.shakeIntensity = 0;
    this.shakeDecay = 0.9;
    this.initEmbers();
  }

  reset() {
    this.particles = [];
    this.popups = [];
    this.trail = [];
    this.shakeIntensity = 0;
    this.initEmbers();
  }

  initEmbers() {
    this.embers = [];
    for (let i = 0; i < 22; i++) {
      this.embers.push({
        x: Math.random() * CONFIG.CANVAS_WIDTH,
        y: Math.random() * CONFIG.CANVAS_HEIGHT * 2,
        vx: (Math.random() - 0.5) * 15,
        vy: -20 - Math.random() * 35,
        size: 1.5 + Math.random() * 2.5,
        color: Math.random() > 0.4 ? '#ff7b1a' : '#ffd700',
        alpha: 0.2 + Math.random() * 0.45
      });
    }
  }

  addShake(amount) {
    this.shakeIntensity = Math.min(24, this.shakeIntensity + amount);
  }

  recordTrail(x, y, angle, color, speed) {
    if (speed > 180) {
      this.trail.push({ x, y, angle, color, alpha: 0.45 });
      if (this.trail.length > 5) {
        this.trail.shift();
      }
    }
  }

  spawnBlockDebris(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 180;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 24,
        y: y + (Math.random() - 0.5) * 24,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        size: 3 + Math.random() * 4,
        color: color,
        life: 0.35 + Math.random() * 0.3,
        maxLife: 0.65,
        type: 'debris'
      });
    }
  }

  spawnSparks(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 220;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.5 ? '#ffffff' : '#ffd700',
        life: 0.15 + Math.random() * 0.15,
        maxLife: 0.3,
        type: 'spark'
      });
    }
  }

  spawnExplosion(x, y) {
    this.addShake(15);

    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 320;
      const isFire = Math.random() > 0.3;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: isFire ? (6 + Math.random() * 10) : (10 + Math.random() * 14),
        color: isFire ? (Math.random() > 0.5 ? '#ff3d00' : '#ffea00') : '#555560',
        life: 0.4 + Math.random() * 0.35,
        maxLife: 0.75,
        type: isFire ? 'fire' : 'smoke'
      });
    }
  }

  spawnPopup(text, x, y, color = '#ffd700', size = 20) {
    this.popups.push({
      text,
      x,
      y,
      vx: (Math.random() - 0.5) * 30,
      vy: -90,
      color,
      size,
      life: 0.85,
      maxLife: 0.85
    });
  }

  update(dt) {
    // Screen shake decay
    if (this.shakeIntensity > 0.1) {
      this.shakeIntensity *= Math.pow(this.shakeDecay, dt * 60);
    } else {
      this.shakeIntensity = 0;
    }

    // Motion trail decay
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].alpha -= dt * 2.2;
      if (this.trail[i].alpha <= 0) {
        this.trail.splice(i, 1);
      }
    }

    // Update ambient embers
    for (const em of this.embers) {
      em.x += em.vx * dt;
      em.y += em.vy * dt;
      if (em.x < 30) em.x = CONFIG.CANVAS_WIDTH - 30;
      if (em.x > CONFIG.CANVAS_WIDTH - 30) em.x = 30;
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.type === 'debris' || p.type === 'spark') {
        p.vy += 650 * dt;
      } else if (p.type === 'smoke') {
        p.vy -= 40 * dt;
        p.size += 8 * dt;
      }
    }

    // Update popups
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const pop = this.popups[i];
      pop.life -= dt;
      if (pop.life <= 0) {
        this.popups.splice(i, 1);
        continue;
      }
      pop.x += pop.vx * dt;
      pop.y += pop.vy * dt;
      pop.vy *= 0.94;
    }
  }

  getShakeOffset() {
    if (this.shakeIntensity <= 0.1) return { x: 0, y: 0 };
    return {
      x: (Math.random() * 2 - 1) * this.shakeIntensity,
      y: (Math.random() * 2 - 1) * this.shakeIntensity
    };
  }

  renderEmbers(ctx, cameraY) {
    ctx.save();
    for (const em of this.embers) {
      // Wrap embers vertically around camera view
      let screenY = (em.y - cameraY * 0.5) % (CONFIG.CANVAS_HEIGHT + 100);
      if (screenY < 0) screenY += CONFIG.CANVAS_HEIGHT + 100;

      ctx.globalAlpha = em.alpha;
      ctx.fillStyle = em.color;
      ctx.fillRect(Math.floor(em.x), Math.floor(screenY), em.size, em.size);
    }
    ctx.restore();
  }

  renderTrail(ctx, assets, spriteKey, pSize, cameraY) {
    if (this.trail.length === 0) return;
    const pImg = assets.get(spriteKey);
    if (!pImg) return;

    ctx.save();
    for (const tr of this.trail) {
      ctx.globalAlpha = Math.max(0, tr.alpha * 0.4);
      ctx.save();
      ctx.translate(tr.x, tr.y - cameraY);
      ctx.rotate(tr.angle);
      ctx.drawImage(pImg, -pSize / 2, -pSize / 2, pSize, pSize);
      ctx.restore();
    }
    ctx.restore();
  }

  render(ctx, cameraY) {
    ctx.save();

    // Render particles
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      const screenY = p.y - cameraY;
      if (p.type === 'smoke') {
        ctx.beginPath();
        ctx.arc(p.x, screenY, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(Math.floor(p.x - p.size / 2), Math.floor(screenY - p.size / 2), p.size, p.size);
      }
    }

    // Render popups
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 18px "Courier New", monospace';

    for (const pop of this.popups) {
      const alpha = Math.max(0, pop.life / pop.maxLife);
      ctx.globalAlpha = alpha;
      const screenY = pop.y - cameraY;

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(pop.text, pop.x, screenY);

      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, pop.x, screenY);
    }

    ctx.restore();
  }
}
