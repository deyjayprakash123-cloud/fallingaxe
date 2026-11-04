import { CONFIG } from './config.js';
import { AudioManager } from './audio.js';
import { AssetManager } from './assets.js';
import { PickaxePhysics } from './physics.js';
import { LevelGenerator } from './levelGenerator.js';
import { ParticleSystem } from './particles.js';
import { SelectorWheel } from './wheel.js';
import { HUD } from './hud.js';

/**
 * Main Game Controller
 * Integrates 4-chance wheel, demo betting wallet, continuous boundary physics,
 * real-time win accumulation, and arcade audiovisuals.
 */
export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Subsystems
    this.audio = new AudioManager();
    this.assets = new AssetManager();
    this.physics = new PickaxePhysics('wooden');
    this.level = new LevelGenerator();
    this.particles = new ParticleSystem();
    this.wheel = new SelectorWheel(this.audio);
    this.hud = new HUD();

    // Game States: 'IDLE' | 'SPINNING_WHEEL' | 'FALLING' | 'GAME_OVER'
    this.state = 'IDLE';
    this.cameraY = 0;
    this.targetCameraY = 0;
    this.depth = 0;
    this.maxDepthReached = 0;
    this.lastTime = 0;
    this.autoTimer = 0;
    this.totalRunWin = 0;

    this.initCanvas();
    this.bindEvents();
  }

  async start() {
    await this.assets.loadAll();
    this.resetRun();
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  initCanvas() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;

    const targetRatio = CONFIG.CANVAS_WIDTH / CONFIG.CANVAS_HEIGHT;
    const currentRatio = windowW / windowH;

    let displayW, displayH;
    if (currentRatio < targetRatio) {
      displayW = windowW;
      displayH = windowW / targetRatio;
    } else {
      displayH = windowH;
      displayW = windowH * targetRatio;
    }

    this.canvas.width = CONFIG.CANVAS_WIDTH;
    this.canvas.height = CONFIG.CANVAS_HEIGHT;
    this.canvas.style.width = `${displayW}px`;
    this.canvas.style.height = `${displayH}px`;

    // Razor-sharp pixel art rendering
    this.ctx.imageSmoothingEnabled = false;
  }

  resetRun() {
    this.state = 'IDLE';
    this.depth = 0;
    this.maxDepthReached = 0;
    this.cameraY = 0;
    this.targetCameraY = 0;
    this.totalRunWin = 0;

    this.level.reset();
    this.particles.reset();
    this.physics = new PickaxePhysics('wooden');
    this.physics.active = false;
    this.physics.x = CONFIG.CANVAS_WIDTH / 2;
    this.physics.y = CONFIG.WHEEL.Y;

    this.hud.win = 0.00;
    this.hud.targetWin = 0.00;
  }

  startWheelSequence(forceBonusBuy = false) {
    if (this.state !== 'IDLE' && this.state !== 'GAME_OVER') return;
    this.audio.resume();

    if (this.state === 'GAME_OVER') {
      this.resetRun();
    }

    // Check Bet Cost
    const cost = forceBonusBuy
      ? this.hud.bet * CONFIG.WALLET.BONUS_BUY_COST_MULTIPLIER
      : this.hud.bet;

    if (this.hud.cash < cost) {
      this.particles.spawnPopup('INSUFFICIENT DMO CASH!', CONFIG.CANVAS_WIDTH / 2, 800, '#ff1744', 22);
      this.audio.play('hit_stone', 1.5);
      return;
    }

    // Deduct Bet from Cash Wallet
    this.hud.cash -= cost;
    this.hud.win = 0.00;
    this.hud.targetWin = 0.00;
    this.totalRunWin = 0;

    this.state = 'SPINNING_WHEEL';

    // Spin the 4-chance wheel!
    this.wheel.spin(forceBonusBuy, (result) => {
      if (result.isWin) {
        // HIT: Pickaxe unlocked and drops!
        if (forceBonusBuy) {
          this.physics.setTier('diamond');
          this.particles.spawnPopup('DIAMOND DROP GUARANTEED!', CONFIG.CANVAS_WIDTH / 2, CONFIG.WHEEL.Y + 60, '#00e5ff', 22);
        } else {
          // Standard starter pickaxe begins with Wooden Pickaxe (with small 15% lucky chance for Stone!)
          this.physics.setTier(Math.random() < 0.15 ? 'stone' : 'wooden');
          const tierName = this.physics.tier.name.toUpperCase();
          this.particles.spawnPopup(`${tierName} UNLOCKED!`, CONFIG.CANVAS_WIDTH / 2, CONFIG.WHEEL.Y + 60, this.physics.tier.accentColor, 22);
        }
        this.launchPickaxe();
      } else {
        // MISS (0X): No score / zero win!
        this.state = 'IDLE';
        this.hud.win = 0.00;
        this.hud.targetWin = 0.00;
        this.particles.spawnPopup('MISS - ZERO WIN (0X)', CONFIG.CANVAS_WIDTH / 2, CONFIG.WHEEL.Y + 60, '#ff1744', 24);
      }
    });
  }

  launchPickaxe() {
    this.state = 'FALLING';
    this.depth = 0;
    this.maxDepthReached = 0;
    this.physics.active = true;
    this.physics.x = CONFIG.CANVAS_WIDTH / 2;
    this.physics.y = CONFIG.WHEEL.Y + 35;
    this.physics.vx = (Math.random() - 0.5) * 120;
    this.physics.vy = 200;
    this.physics.angularVelocity = (Math.random() > 0.5 ? 1 : -1) * (4.5 + Math.random() * 3.5);
  }

  bindEvents() {
    const handlePointer = (clientX, clientY) => {
      this.audio.resume();
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = CONFIG.CANVAS_WIDTH / rect.width;
      const scaleY = CONFIG.CANVAS_HEIGHT / rect.height;
      const canvasX = (clientX - rect.left) * scaleX;
      const canvasY = (clientY - rect.top) * scaleY;

      const handled = this.hud.handleClick(canvasX, canvasY, (action) => {
        if (action === 'toggle_sound') {
          this.audio.toggleMute();
        } else if (action === 'toggle_speed') {
          this.hud.toggleSpeed();
        } else if (action === 'toggle_auto') {
          this.hud.toggleAuto();
        } else if (action === 'spin_drop') {
          this.startWheelSequence(false);
        } else if (action === 'bonus_buy') {
          this.startWheelSequence(true);
        } else if (action === 'bet_changed') {
          this.audio.play('spin');
        }
      });

      if (!handled && this.state === 'FALLING') {
        if (canvasX < CONFIG.CANVAS_WIDTH / 2) {
          this.physics.nudge(-1);
          this.particles.spawnSparks(this.physics.x, this.physics.y, 4);
        } else {
          this.physics.nudge(1);
          this.particles.spawnSparks(this.physics.x, this.physics.y, 4);
        }
      }
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handlePointer(e.clientX, e.clientY);
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        this.startWheelSequence(false);
      } else if (e.code === 'ArrowLeft') {
        if (this.state === 'FALLING') this.physics.nudge(-1);
      } else if (e.code === 'ArrowRight') {
        if (this.state === 'FALLING') this.physics.nudge(1);
      } else if (e.code === 'ArrowUp') {
        this.hud.setBetIndexDelta(1);
        this.audio.play('spin');
      } else if (e.code === 'ArrowDown') {
        this.hud.setBetIndexDelta(-1);
        this.audio.play('spin');
      } else if (e.code === 'KeyB') {
        this.startWheelSequence(true);
      }
    });
  }

  onCollision(probe, block, col, row, impactSpeed, durabilityLoss = 1, blockDamage = 1) {
    const blockDef = CONFIG.BLOCKS[block.type];
    const blockCenterX = col * CONFIG.SHAFT.BLOCK_SIZE + CONFIG.SHAFT.BLOCK_SIZE / 2;
    const blockCenterY = CONFIG.SHAFT.START_ROW_Y + row * CONFIG.SHAFT.BLOCK_SIZE + CONFIG.SHAFT.BLOCK_SIZE / 2;

    this.particles.addShake(Math.min(7, impactSpeed * 0.015));

    if (blockDef.sound) {
      this.audio.play(blockDef.sound, Math.min(1.5, impactSpeed * 0.005));
    }

    this.particles.spawnSparks(probe.x, probe.y, 5);

    // Floating durability wear feedback on heavy hits
    if (durabilityLoss >= 0.8 && block.type !== 'unbreakable' && block.type !== 'bounce') {
      this.particles.spawnPopup(`-${durabilityLoss.toFixed(1)}`, probe.x, probe.y - 18, '#ff3344', 15);
    }

    if (block.type !== 'unbreakable' && block.type !== 'bounce') {
      block.hp -= blockDamage;
      block.shake = 0.15;
      this.particles.spawnBlockDebris(blockCenterX, blockCenterY, blockDef.debrisColor, 5);

      if (block.hp <= 0) {
        this.handleBlockDestroyed(block, false);
      }
    } else if (block.type === 'bounce') {
      this.particles.spawnPopup('BOING!', blockCenterX, blockCenterY - 20, '#76ff03', 18);
      this.particles.spawnBlockDebris(blockCenterX, blockCenterY, '#76ff03', 4);
    }

    // Check pickaxe durability expiration
    if (this.physics.durability <= 0) {
      this.handleGameOver();
    }
  }

  handleBlockDestroyed(block, isExplosion = false) {
    const blockDef = CONFIG.BLOCKS[block.type];
    const blockCenterX = block.col * CONFIG.SHAFT.BLOCK_SIZE + CONFIG.SHAFT.BLOCK_SIZE / 2;
    const blockCenterY = CONFIG.SHAFT.START_ROW_Y + block.row * CONFIG.SHAFT.BLOCK_SIZE + CONFIG.SHAFT.BLOCK_SIZE / 2;

    // Depth multiplier: points scale up significantly as pickaxe falls deeper!
    const depthMeters = Math.max(0, (block.row * CONFIG.SHAFT.BLOCK_SIZE) / 10);
    const depthMultiplier = 1.0 + (depthMeters / 40.0);

    // Calculate win based on user's active bet, block multiplier, and depth multiplier
    const payout = Math.round(this.hud.bet * (blockDef.mult || 0.1) * depthMultiplier * 100) / 100;
    this.totalRunWin += payout;
    this.hud.targetWin = this.totalRunWin;

    if (payout > 0) {
      const depthTag = depthMultiplier >= 2.0 ? ` (${depthMultiplier.toFixed(1)}x)` : '';
      this.particles.spawnPopup(`+${payout.toFixed(2)}${depthTag}`, blockCenterX, blockCenterY, blockDef.debrisColor, isExplosion ? 16 : 21);
    }

    this.particles.spawnBlockDebris(blockCenterX, blockCenterY, blockDef.debrisColor, isExplosion ? 6 : 10);

    // Special Block Behaviours
    if (blockDef.isExplosive) {
      if (!isExplosion) {
        // Direct hit on TNT - trigger massive explosive blast!
        this.audio.play('explode');
        this.particles.spawnExplosion(blockCenterX, blockCenterY);
        this.particles.addShake(16);
        this.particles.spawnPopup('BOOM!', blockCenterX, blockCenterY - 30, '#ff3d00', 28);

        // Explosive kinetic impulse propels pickaxe downward out of the blast crater
        this.physics.vy = Math.max(this.physics.vy, 460);
        this.physics.vx += (Math.random() - 0.5) * 240;
        this.physics.angularVelocity = (Math.random() > 0.5 ? 1 : -1) * 9.5;

        // Non-recursive safe chain-explosion
        this.level.explodeTNT(block.col, block.row, (explodedBlock) => {
          this.handleBlockDestroyed(explodedBlock, true);
        });
      }
    } else if (blockDef.isUpgrade) {
      this.audio.play('upgrade');
      if (this.physics.tier.id === 'wooden') this.physics.setTier('stone');
      else if (this.physics.tier.id === 'stone') this.physics.setTier('iron');
      else this.physics.setTier('diamond');

      this.particles.spawnPopup('TIER UPGRADE!', blockCenterX, blockCenterY - 30, '#00e5ff', 24);
      this.particles.spawnSparks(blockCenterX, blockCenterY, 15);
    } else if (blockDef.isRepair) {
      this.audio.play('repair');
      this.physics.repair(blockDef.repairAmount || 50);
      this.particles.spawnPopup(`♥ +${blockDef.repairAmount || 50}`, blockCenterX, blockCenterY - 20, '#ff2d55', 22);
    }
  }

  handleGameOver() {
    this.state = 'GAME_OVER';
    this.physics.active = false;
    this.audio.play('gameover');
    this.particles.spawnExplosion(this.physics.x, this.physics.y);
    this.particles.spawnPopup('DURABILITY DEPLETED!', this.physics.x, this.physics.y - 30, '#ff3344', 24);

    // Credit Final Win Amount to Cash Wallet
    if (this.totalRunWin > 0) {
      this.hud.cash += this.totalRunWin;
    }

    this.autoTimer = 0;
  }

  loop(currentTime) {
    const rawDt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    const dt = rawDt * this.hud.gameSpeed;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    // 1. Selector Wheel
    if (this.state === 'SPINNING_WHEEL') {
      this.wheel.update(dt);
    }

    // 2. Physics & Falling
    if (this.state === 'FALLING') {
      this.physics.update(dt, this.level, (probe, block, col, row, speed) => {
        this.onCollision(probe, block, col, row, speed);
      });

      // Record pickaxe motion ghost trail for enhanced arcade graphics
      const speed = Math.hypot(this.physics.vx, this.physics.vy);
      this.particles.recordTrail(this.physics.x, this.physics.y, this.physics.angle, this.physics.tier.accentColor, speed);

      // Height / Depth Descent Scoring:
      // Score ONLY increments as the pickaxe descends into NEW deeper territory (falling downward).
      // If the pickaxe bounces up or stays at the same vertical height, NO score is added!
      const currentDepth = Math.max(0, (this.physics.y - CONFIG.SHAFT.START_ROW_Y) / 10);
      if (currentDepth > this.maxDepthReached) {
        const delta = currentDepth - this.maxDepthReached;

        // Celebratory depth milestone popups every 50m
        const prevMilestone = Math.floor(this.maxDepthReached / 50);
        const newMilestone = Math.floor(currentDepth / 50);
        if (newMilestone > prevMilestone && newMilestone > 0) {
          const depthM = newMilestone * 50;
          const mult = (1.0 + depthM / 40.0).toFixed(1);
          this.particles.spawnPopup(`⚡ ${depthM}m DEPTH! (${mult}X)`, this.physics.x, this.physics.y - 35, '#00e5ff', 22);
          this.audio.play('hit_ore', 1.3);
        }

        this.maxDepthReached = currentDepth;
        this.depth = currentDepth;

        // Downward descent score: scales with bet and depth multiplier
        const descentPoints = delta * (this.hud.bet * 0.035) * (1.0 + currentDepth / 60.0);
        this.totalRunWin += descentPoints;
        this.hud.targetWin = Math.round(this.totalRunWin * 100) / 100;
      }

      const currentRow = Math.floor((this.physics.y - CONFIG.SHAFT.START_ROW_Y) / CONFIG.SHAFT.BLOCK_SIZE);
      this.level.generateUpToRow(currentRow + CONFIG.SHAFT.BUFFER_ROWS_BELOW);
      this.level.cleanupAboveRow(currentRow - CONFIG.SHAFT.CLEANUP_ROWS_ABOVE);

      this.targetCameraY = Math.max(0, this.physics.y - CONFIG.CANVAS_HEIGHT * CONFIG.CAMERA.OFFSET_Y_RATIO);
    }

    this.cameraY += (this.targetCameraY - this.cameraY) * CONFIG.CAMERA.LERP_SPEED;

    // 3. Particles & Popups
    this.particles.update(dt);

    // 4. Update HUD
    this.hud.depth = this.depth;
    this.hud.depthMult = 1.0 + (this.depth / 40.0);
    this.hud.update(dt);

    // 5. Auto-drop automation
    if (this.hud.autoDrop) {
      if (this.state === 'IDLE') {
        this.startWheelSequence(false);
      } else if (this.state === 'GAME_OVER') {
        this.autoTimer += dt;
        if (this.autoTimer > 2.2) {
          this.startWheelSequence(false);
        }
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    const shake = this.particles.getShakeOffset();
    ctx.save();
    ctx.translate(shake.x, shake.y);

    // 1. Background Parallax
    this.renderBackground(ctx);

    // 2. World Elements
    this.renderWorld(ctx);

    ctx.restore();

    // 3. UI and HUD Overlay
    this.hud.render(ctx, this.assets, this.state, this.physics, this.cameraY, this.audio.muted);
  }

  renderBackground(ctx) {
    const bgImg = this.assets.get('volcanic_shaft_bg');
    if (bgImg) {
      const bgY = -(this.cameraY * 0.35) % CONFIG.CANVAS_HEIGHT;
      ctx.drawImage(bgImg, 0, bgY, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
      ctx.drawImage(bgImg, 0, bgY + CONFIG.CANVAS_HEIGHT, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
      if (bgY > 0) {
        ctx.drawImage(bgImg, 0, bgY - CONFIG.CANVAS_HEIGHT, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
      }
    } else {
      ctx.fillStyle = '#140c14';
      ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    }
  }

  renderWorld(ctx) {
    // 1. Ambient Volcanic Floating Embers (Background atmosphere layer)
    this.particles.renderEmbers(ctx, this.cameraY);

    // 2. 4-Chance Selector Wheel at Top
    this.wheel.render(ctx, this.assets, this.cameraY);

    // 3. Glowing Lava Rim Entrance across top of mine shaft
    const lavaImg = this.assets.get('lava_rim');
    const lavaY = CONFIG.SHAFT.START_ROW_Y - this.cameraY - 14;
    if (lavaImg) {
      for (let c = 0; c < CONFIG.SHAFT.COLUMNS; c++) {
        ctx.drawImage(lavaImg, c * CONFIG.SHAFT.BLOCK_SIZE, lavaY, CONFIG.SHAFT.BLOCK_SIZE, 18);
      }
    }

    // 4. Blocks in View
    const startRow = Math.max(0, Math.floor((this.cameraY - 60) / CONFIG.SHAFT.BLOCK_SIZE));
    const endRow = Math.ceil((this.cameraY + CONFIG.CANVAS_HEIGHT + 60) / CONFIG.SHAFT.BLOCK_SIZE);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = 0; c < CONFIG.SHAFT.COLUMNS; c++) {
        const block = this.level.getBlock(c, r);
        if (block && block.hp > 0) {
          const bx = c * CONFIG.SHAFT.BLOCK_SIZE;
          const by = CONFIG.SHAFT.START_ROW_Y + r * CONFIG.SHAFT.BLOCK_SIZE - this.cameraY;

          const blockImg = this.assets.get(block.type);
          if (blockImg) {
            ctx.drawImage(blockImg, bx, by, CONFIG.SHAFT.BLOCK_SIZE, CONFIG.SHAFT.BLOCK_SIZE);
          } else {
            ctx.fillStyle = CONFIG.BLOCKS[block.type]?.debrisColor || '#555';
            ctx.fillRect(bx, by, CONFIG.SHAFT.BLOCK_SIZE, CONFIG.SHAFT.BLOCK_SIZE);
          }

          // Damage overlay indicator if block has taken hits
          if (block.hp < block.maxHp && block.maxHp > 1) {
            const crackRatio = 1 - (block.hp / block.maxHp);
            ctx.fillStyle = `rgba(0, 0, 0, ${0.25 + crackRatio * 0.35})`;
            ctx.fillRect(bx + 4, by + 4, CONFIG.SHAFT.BLOCK_SIZE - 8, 4);
          }
        }
      }
    }

    // 5. Mine Shaft Side Depth Vignette (Shades outer wall columns to focus on the center action)
    const shaftTopY = Math.max(0, CONFIG.SHAFT.START_ROW_Y - this.cameraY);
    if (shaftTopY < CONFIG.CANVAS_HEIGHT) {
      const leftGrad = ctx.createLinearGradient(0, 0, 52, 0);
      leftGrad.addColorStop(0, 'rgba(8, 6, 14, 0.7)');
      leftGrad.addColorStop(1, 'rgba(8, 6, 14, 0)');
      ctx.fillStyle = leftGrad;
      ctx.fillRect(0, shaftTopY, 52, CONFIG.CANVAS_HEIGHT - shaftTopY);

      const rightGrad = ctx.createLinearGradient(CONFIG.CANVAS_WIDTH, 0, CONFIG.CANVAS_WIDTH - 52, 0);
      rightGrad.addColorStop(0, 'rgba(8, 6, 14, 0.7)');
      rightGrad.addColorStop(1, 'rgba(8, 6, 14, 0)');
      ctx.fillStyle = rightGrad;
      ctx.fillRect(CONFIG.CANVAS_WIDTH - 52, shaftTopY, 52, CONFIG.CANVAS_HEIGHT - shaftTopY);
    }

    // 6. Falling Pickaxe Visuals (Ghost Trail + Dynamic Radial Light Halo + Sprite)
    if (this.physics.active) {
      const px = this.physics.x;
      const py = this.physics.y - this.cameraY;
      const pSize = this.physics.tier.size;

      // A. Pickaxe Ghost Motion Trail
      this.particles.renderTrail(ctx, this.assets, this.physics.tier.spriteKey, pSize, this.cameraY);

      // B. Dynamic Radial Lighting Halo (Custom tinted per tier)
      const lightGrad = ctx.createRadialGradient(px, py, 6, px, py, 115);
      if (this.physics.tier.id === 'diamond') {
        lightGrad.addColorStop(0, 'rgba(0, 229, 255, 0.35)');
        lightGrad.addColorStop(0.4, 'rgba(0, 150, 255, 0.14)');
        lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (this.physics.tier.id === 'iron') {
        lightGrad.addColorStop(0, 'rgba(230, 240, 255, 0.32)');
        lightGrad.addColorStop(0.4, 'rgba(120, 140, 190, 0.12)');
        lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (this.physics.tier.id === 'stone') {
        lightGrad.addColorStop(0, 'rgba(200, 210, 225, 0.28)');
        lightGrad.addColorStop(0.4, 'rgba(140, 150, 165, 0.10)');
        lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        // Wooden
        lightGrad.addColorStop(0, 'rgba(255, 210, 110, 0.32)');
        lightGrad.addColorStop(0.4, 'rgba(255, 110, 25, 0.12)');
        lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.arc(px, py, 115, 0, Math.PI * 2);
      ctx.fill();

      // C. Rotating Pickaxe Sprite
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(this.physics.angle);

      const pImg = this.assets.get(this.physics.tier.spriteKey);
      if (pImg) {
        ctx.drawImage(pImg, -pSize / 2, -pSize / 2, pSize, pSize);
      } else {
        ctx.fillStyle = this.physics.tier.accentColor;
        ctx.fillRect(-pSize / 2, -pSize / 2, pSize, pSize);
      }
      ctx.restore();
    }

    // 7. Particles and Floating Popups
    this.particles.render(ctx, this.cameraY);
  }
}
