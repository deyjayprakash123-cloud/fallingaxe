import { CONFIG } from './config.js';

/**
 * 4-Chance Selector Wheel
 * 4 quadrant sectors with Win vs Red 'X' Miss chances, rotating dial,
 * and high-stakes casino arcade presentation matching the reference game.
 */
export class SelectorWheel {
  constructor(audio) {
    this.audio = audio;
    this.x = CONFIG.WHEEL.X;
    this.y = CONFIG.WHEEL.Y;
    this.radius = CONFIG.WHEEL.RADIUS;

    this.pointerAngle = 0;
    this.pointerSpeed = 0;
    this.isSpinning = false;
    this.timer = 0;
    this.duration = CONFIG.WHEEL.SPIN_DURATION;

    this.sectors = CONFIG.WHEEL.SECTORS;
    this.selectedSector = null;
    this.tickTimer = 0;
    this.onComplete = null;
    this.flashColor = null;
    this.flashTimer = 0;
  }

  spin(forceWin = false, onComplete) {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.timer = 0;
    this.pointerSpeed = 30.0; // Fast initial spin
    this.onComplete = onComplete;
    this.selectedSector = null;
    this.flashColor = null;

    // Pick target sector
    if (forceWin) {
      // Bonus Buy guarantees the WIN sector
      this.targetSector = this.sectors.find(s => s.type === 'WIN');
    } else {
      // 4 chances: 3 Misses + 1 Win (25% hit rate for high arcade tension)
      const roll = Math.random();
      if (roll < 0.35) {
        // 35% chance to win pickaxe drop on regular spin!
        this.targetSector = this.sectors.find(s => s.type === 'WIN');
      } else {
        // Land on one of the 3 Miss sectors
        const missSectors = this.sectors.filter(s => s.type === 'MISS');
        this.targetSector = missSectors[Math.floor(Math.random() * missSectors.length)];
      }
    }

    // Calculate final resting angle inside target sector
    const [minDeg, maxDeg] = this.targetSector.angleRange;
    const midDeg = (minDeg + maxDeg) / 2;
    // Add multiple full rotations (e.g. 4-6 full spins)
    const extraRotations = (4 + Math.floor(Math.random() * 2)) * Math.PI * 2;
    this.targetFinalAngle = extraRotations + (midDeg * Math.PI / 180);
    this.startAngle = this.pointerAngle % (Math.PI * 2);
  }

  update(dt) {
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        this.flashColor = null;
      }
    }

    if (!this.isSpinning) return;

    this.timer += dt;
    const progress = Math.min(1.0, this.timer / this.duration);

    // Ease-out cubic deceleration
    const easeOut = 1.0 - Math.pow(1.0 - progress, 3);
    this.pointerAngle = this.startAngle + (this.targetFinalAngle - this.startAngle) * easeOut;

    // Audio ticking on sector crossing
    this.tickTimer += dt;
    const tickInterval = 0.04 + 0.22 * progress;
    if (this.tickTimer >= tickInterval) {
      this.tickTimer = 0;
      if (this.audio) {
        this.audio.play('spin');
      }
    }

    // Spin Finished
    if (progress >= 1.0) {
      this.isSpinning = false;
      this.selectedSector = this.targetSector;

      if (this.selectedSector.type === 'WIN') {
        this.flashColor = '#00e5ff';
        this.flashTimer = 0.8;
        if (this.audio) this.audio.play('upgrade');
      } else {
        this.flashColor = '#ff1744';
        this.flashTimer = 0.8;
        if (this.audio) this.audio.play('hit_stone', 1.8);
      }

      if (this.onComplete) {
        this.onComplete({
          isWin: this.selectedSector.type === 'WIN',
          sector: this.selectedSector
        });
      }
    }
  }

  render(ctx, assets, cameraY) {
    const screenY = this.y - cameraY;
    if (screenY < -320 || screenY > CONFIG.CANVAS_HEIGHT + 320) return;

    ctx.save();
    ctx.translate(this.x, screenY);

    // 1. Render 4-Sector Portal Texture
    const wheelImg = assets.get('wheel_4sector') || assets.get('selector_wheel');
    if (wheelImg) {
      ctx.drawImage(wheelImg, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
    } else {
      // Fallback 4-sector frame
      ctx.strokeStyle = '#252936';
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius - 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Flash Glow on Result
    if (this.flashColor) {
      ctx.strokeStyle = this.flashColor;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius - 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. Rotating Dial / Needle Pointer
    ctx.save();
    ctx.rotate(this.pointerAngle);

    // Golden indicator needle pointing to the active quadrant
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.radius * 0.85, 0);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(this.radius * 0.85 + 14, 0);
    ctx.lineTo(this.radius * 0.85 - 8, -12);
    ctx.lineTo(this.radius * 0.85 - 8, 12);
    ctx.closePath();
    ctx.fillStyle = '#ffea00';
    ctx.fill();
    ctx.strokeStyle = '#d48800';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center pivot ball
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#222530';
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();

    // 4. Top Crown / Pumpkin slot icon (matching reference!)
    const pIcon = assets.get('bonus_pumpkin');
    if (pIcon) {
      ctx.drawImage(pIcon, -22, -this.radius - 28, 44, 44);
    }

    // 5. Result Banner if settled
    if (!this.isSpinning && this.selectedSector) {
      ctx.textAlign = 'center';
      ctx.font = 'bold 15px "Courier New", monospace';
      if (this.selectedSector.type === 'MISS') {
        ctx.fillStyle = '#ff1744';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText('NO WIN (0X)', 0, 68);
        ctx.fillText('NO WIN (0X)', 0, 68);
      } else {
        ctx.fillStyle = '#76ff03';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText('PICKAXE UNLOCKED!', 0, 68);
        ctx.fillText('PICKAXE UNLOCKED!', 0, 68);
      }
    }

    ctx.restore();
  }
}
