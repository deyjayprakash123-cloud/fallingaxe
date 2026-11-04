import { CONFIG } from './config.js';

/**
 * Physics Engine & Pickaxe Rigid Body
 * Realistic rotation, angular momentum transfer, glancing collisions,
 * physics-based health (durability) degradation, and anti-stuck guarantees.
 */
export class PickaxePhysics {
  constructor(tierKey = 'stone') {
    this.tier = { ...CONFIG.PICKAXE_TIERS[tierKey] };
    this.durability = this.tier.maxDurability;
    this.maxDurability = this.tier.maxDurability;

    // Rigid body coordinates
    this.x = CONFIG.CANVAS_WIDTH / 2;
    this.y = CONFIG.WHEEL.Y;
    this.vx = (Math.random() - 0.5) * 80;
    this.vy = 80;
    this.angle = Math.random() * Math.PI * 2;
    this.angularVelocity = (Math.random() > 0.5 ? 1 : -1) * (4.0 + Math.random() * 2.5);

    // Physical attributes
    this.radius = this.tier.size / 2;
    this.mass = 1.2;
    this.momentOfInertia = 0.5 * this.mass * this.radius * this.radius;

    // Gameplay timers & states
    this.stuckTimer = 0;
    this.drillTimer = 0;
    this.isStuck = false;
    this.active = false;
    this.hitBlockCooldowns = new Map();
  }

  setTier(tierKey) {
    const prevMax = this.maxDurability;
    this.tier = { ...CONFIG.PICKAXE_TIERS[tierKey] };
    this.radius = this.tier.size / 2;
    this.maxDurability = this.tier.maxDurability;
    this.durability = Math.min(this.maxDurability, this.durability + (this.maxDurability - prevMax) + 40);
  }

  repair(amount) {
    this.durability = Math.min(this.maxDurability, this.durability + amount);
  }

  takeDamage(amount = 1) {
    this.durability = Math.max(0, this.durability - amount);
    return this.durability <= 0;
  }

  nudge(direction) {
    this.vx += direction * CONFIG.PHYSICS.NUDGE_IMPULSE_X;
    this.vy = Math.min(this.vy, this.vy + CONFIG.PHYSICS.NUDGE_IMPULSE_Y);
    this.angularVelocity += direction * 6.0;
  }

  getProbes() {
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);
    const r = this.radius * 0.95;

    // Pickaxe head tips are primary cutting edges
    const tip1X = this.x + (-sin * 0.9 - cos * 0.35) * r;
    const tip1Y = this.y + (cos * 0.9 - sin * 0.35) * r;

    const tip2X = this.x + (sin * 0.9 - cos * 0.35) * r;
    const tip2Y = this.y + (-cos * 0.9 - sin * 0.35) * r;

    const pommelX = this.x + (cos * 0.85) * r;
    const pommelY = this.y + (sin * 0.85) * r;

    return [
      { x: tip1X, y: tip1Y, type: 'head', isTip: true },
      { x: tip2X, y: tip2Y, type: 'head', isTip: true },
      { x: pommelX, y: pommelY, type: 'handle', isTip: false },
      { x: this.x, y: this.y, type: 'center', isTip: false }
    ];
  }

  update(dt, level, onCollision) {
    if (!this.active) return;

    // 4 physics sub-steps per frame for high-speed precision
    const steps = 4;
    const subDt = dt / steps;

    for (let s = 0; s < steps; s++) {
      this.subUpdate(subDt, level, onCollision);
    }

    // Cooldown cleanup
    for (const [key, time] of this.hitBlockCooldowns.entries()) {
      if (time - dt <= 0) {
        this.hitBlockCooldowns.delete(key);
      } else {
        this.hitBlockCooldowns.set(key, time - dt);
      }
    }
  }

  subUpdate(dt, level, onCollision) {
    // 1. Gravity and Drag
    this.vy += CONFIG.PHYSICS.GRAVITY * this.tier.fallSpeedMult * dt;
    if (this.vy > CONFIG.PHYSICS.MAX_FALL_SPEED * this.tier.fallSpeedMult) {
      this.vy = CONFIG.PHYSICS.MAX_FALL_SPEED * this.tier.fallSpeedMult;
    }

    this.vx *= Math.pow(CONFIG.PHYSICS.AIR_DRAG, dt * 60);
    this.angularVelocity *= Math.pow(CONFIG.PHYSICS.ROTATION_DRAG, dt * 60);

    // Natural tumbling rotation in freefall
    if (Math.abs(this.angularVelocity) < CONFIG.PHYSICS.MIN_SPIN) {
      const dir = this.angularVelocity >= 0 ? 1 : -1;
      this.angularVelocity += dir * 3.5 * dt;
    }

    // 2. Position and Rotation Integration
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.angle += this.angularVelocity * dt;

    // 3. STRICT UNBREACHABLE BOUNDARY ENFORCEMENT
    const minSafeX = CONFIG.BOUNDARIES.MIN_X + this.radius;
    const maxSafeX = CONFIG.BOUNDARIES.MAX_X - this.radius;

    if (this.x < minSafeX) {
      this.x = minSafeX;
      this.vx = Math.abs(this.vx) * CONFIG.PHYSICS.WALL_BOUNCE + 45;
      this.angularVelocity = (Math.random() > 0.5 ? 1 : -1) * (5.5 + Math.random() * 4.0);
      if (onCollision) {
        onCollision({ x: this.x - this.radius, y: this.y, isTip: true }, { type: 'unbreakable', hp: 999999 }, 0, 0, Math.abs(this.vx), 0.1, 0);
      }
    } else if (this.x > maxSafeX) {
      this.x = maxSafeX;
      this.vx = -Math.abs(this.vx) * CONFIG.PHYSICS.WALL_BOUNCE - 45;
      this.angularVelocity = (Math.random() > 0.5 ? 1 : -1) * (5.5 + Math.random() * 4.0);
      if (onCollision) {
        onCollision({ x: this.x + this.radius, y: this.y, isTip: true }, { type: 'unbreakable', hp: 999999 }, 10, 0, Math.abs(this.vx), 0.1, 0);
      }
    }

    // 4. Block Collisions in Mine Interior
    const probes = this.getProbes();

    for (const probe of probes) {
      const col = Math.floor(probe.x / CONFIG.SHAFT.BLOCK_SIZE);
      const row = Math.floor((probe.y - CONFIG.SHAFT.START_ROW_Y) / CONFIG.SHAFT.BLOCK_SIZE);

      if (row < 0) continue;

      const block = level.getBlock(col, row);
      if (block && block.hp > 0) {
        const blockLeft = col * CONFIG.SHAFT.BLOCK_SIZE;
        const blockTop = CONFIG.SHAFT.START_ROW_Y + row * CONFIG.SHAFT.BLOCK_SIZE;
        const blockRight = blockLeft + CONFIG.SHAFT.BLOCK_SIZE;
        const blockBottom = blockTop + CONFIG.SHAFT.BLOCK_SIZE;

        if (probe.x >= blockLeft && probe.x <= blockRight && probe.y >= blockTop && probe.y <= blockBottom) {
          this.resolveBlockCollision(probe, block, col, row, blockLeft, blockTop, blockRight, blockBottom, onCollision);
          break;
        }
      }
    }

    // 5. Anti-Stall / Continuous Surface Carving
    // If sitting on top of a block with slow downward speed, rotational tip cuts into the block
    if (this.vy < 50 && this.vy > -30) {
      this.drillTimer += dt;
      if (this.drillTimer > 0.10) {
        this.drillTimer = 0;
        const downCol = Math.floor(this.x / CONFIG.SHAFT.BLOCK_SIZE);
        const downRow = Math.floor((this.y + this.radius + 4 - CONFIG.SHAFT.START_ROW_Y) / CONFIG.SHAFT.BLOCK_SIZE);
        const b = level.getBlock(downCol, downRow);
        if (b && b.hp > 0 && b.type !== 'unbreakable') {
          // Drill damage and sideways roll
          b.hp -= this.tier.damage * 0.6;
          this.takeDamage((b.wear || 1.0) * (this.tier.wearMult || 1.0) * 0.4);
          this.vx += (Math.random() - 0.5) * 80;
          this.vy += 25;
          if (onCollision) {
            onCollision({ x: this.x, y: this.y + this.radius, isTip: true }, b, downCol, downRow, 80, 0.4, this.tier.damage * 0.6);
          }
        }
      }
    } else {
      this.drillTimer = 0;
    }

    // 6. Anti-Stuck Detection & Fail-Safe
    const speedSq = this.vx * this.vx + this.vy * this.vy;
    if (speedSq < CONFIG.PHYSICS.ANTI_STUCK_SPEED_THRESHOLD * CONFIG.PHYSICS.ANTI_STUCK_SPEED_THRESHOLD) {
      this.stuckTimer += dt;
      if (this.stuckTimer >= CONFIG.PHYSICS.ANTI_STUCK_TIME) {
        this.triggerAntiStuck(level, onCollision);
      }
    } else {
      this.stuckTimer = Math.max(0, this.stuckTimer - dt * 1.5);
    }
  }

  resolveBlockCollision(probe, block, col, row, bLeft, bTop, bRight, bBottom, onCollision) {
    const dLeft = probe.x - bLeft;
    const dRight = bRight - probe.x;
    const dTop = probe.y - bTop;
    const dBottom = bBottom - probe.y;

    const minPen = Math.min(dLeft, dRight, dTop, dBottom);
    let nx = 0;
    let ny = 0;

    if (minPen === dTop) {
      ny = -1;
      this.y -= dTop + 1.5;
    } else if (minPen === dBottom) {
      ny = 1;
      this.y += dBottom + 1.5;
    } else if (minPen === dLeft) {
      nx = -1;
      this.x -= dLeft + 1.5;
    } else {
      nx = 1;
      this.x += dRight + 1.5;
    }

    // Angular jitter for unpredictable bouncing
    const jitter = (Math.random() - 0.5) * CONFIG.PHYSICS.RANDOM_BOUNCE_JITTER;
    const jCos = Math.cos(jitter);
    const jSin = Math.sin(jitter);
    nx = nx * jCos - ny * jSin;
    ny = nx * jSin + ny * jCos;

    const rx = probe.x - this.x;
    const ry = probe.y - this.y;

    const vpX = this.vx - this.angularVelocity * ry;
    const vpY = this.vy + this.angularVelocity * rx;
    const vn = vpX * nx + vpY * ny;

    if (vn < 0) {
      const blockDef = CONFIG.BLOCKS[block.type];
      let restitution = this.tier.bounceStrength * (blockDef.bounceBoost || 1.0);
      if (block.type === 'bounce') {
        restitution = 1.55;
      }

      const impulse = -(1 + restitution) * vn;
      this.vx += nx * impulse * 0.9;
      this.vy += ny * impulse * 0.9;

      // Angular Momentum Transfer
      const torque = (rx * (ny * impulse) - ry * (nx * impulse)) / (this.momentOfInertia * 0.08);
      this.angularVelocity += torque * CONFIG.PHYSICS.COLLISION_TORQUE;

      const maxSpin = CONFIG.PHYSICS.MAX_SPIN * 1.5;
      this.angularVelocity = Math.max(-maxSpin, Math.min(maxSpin, this.angularVelocity));

      if (probe.isTip) {
        const sideKick = (Math.random() > 0.5 ? 1 : -1) * (70 + Math.random() * 90);
        this.vx += sideKick;
      }

      const blockKey = `${col},${row}`;
      if (!this.hitBlockCooldowns.has(blockKey)) {
        this.hitBlockCooldowns.set(blockKey, 0.12);

        // --- HEALTH (DURABILITY) DEGRADATION ACCORDING TO PHYSICS & BLOCKS ---
        const impactSpeed = Math.abs(vn);
        const speedFactor = Math.min(1.8, Math.max(0.4, impactSpeed / 250));
        const blockWear = blockDef.wear !== undefined ? blockDef.wear : 1.0;
        const tierWear = this.tier.wearMult !== undefined ? this.tier.wearMult : 1.0;
        const tipFactor = probe.isTip ? 1.0 : 0.7;

        let durabilityLoss = blockWear * speedFactor * tierWear * tipFactor;
        // Bounce block deals 0 wear
        if (block.type === 'bounce') durabilityLoss = 0;
        // Unbreakable wall minimal wear
        if (block.type === 'unbreakable') durabilityLoss = 0.1;

        durabilityLoss = Math.round(durabilityLoss * 10) / 10;
        this.takeDamage(durabilityLoss);

        // --- BLOCK DAMAGE ACCORDING TO PHYSICS (MOMENTUM BONUS) ---
        const kineticBonus = Math.min(2.5, Math.max(0.8, impactSpeed / 220));
        const blockDamage = this.tier.damage * kineticBonus * (probe.isTip ? 1.35 : 0.85);

        if (onCollision) {
          onCollision(probe, block, col, row, impactSpeed, durabilityLoss, blockDamage);
        }
      }
    }
  }

  triggerAntiStuck(level, onCollision) {
    this.stuckTimer = 0;
    const col = Math.floor(this.x / CONFIG.SHAFT.BLOCK_SIZE);
    const row = Math.floor((this.y - CONFIG.SHAFT.START_ROW_Y) / CONFIG.SHAFT.BLOCK_SIZE);

    // Shatter immediate 3x3 cracked blocks
    for (let c = col - 1; c <= col + 1; c++) {
      for (let r = row; r <= row + 1; r++) {
        const b = level.getBlock(c, r);
        if (b && b.type !== 'unbreakable') {
          b.hp = 0;
        }
      }
    }

    // Downward & sideways ejection kick
    this.vy = 420 + Math.random() * 80;
    this.vx = (Math.random() - 0.5) * 320;
    this.angularVelocity = (Math.random() > 0.5 ? 1 : -1) * 10.0;

    if (onCollision) {
      onCollision({ x: this.x, y: this.y, isTip: true }, { type: 'tnt', hp: 0 }, col, row, 450, 0, 99);
    }
  }
}
