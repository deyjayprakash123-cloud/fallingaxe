import { CONFIG } from './config.js';

/**
 * Head-Up Display (HUD)
 * Authentic arcade betting interface matching the reference game:
 * Cash (USD) wallet, Bet controls (- / +), Live Win counter, Depth Multiplier,
 * Bonus Buy button, Info & Rules modal guide, and top-left / top-right pixel branding.
 */
export class HUD {
  constructor() {
    this.cash = CONFIG.WALLET.INITIAL_CASH;
    this.bet = CONFIG.WALLET.DEFAULT_BET;
    this.win = 0.00;
    this.targetWin = 0.00;
    this.depth = 0;
    this.depthMult = 1.0;
    this.gameSpeed = 1.0;
    this.autoDrop = false;
    this.showInfo = false;

    // Interactive Button Hitboxes
    this.buttons = {
      spin: { x: 270, y: 840, r: 44, label: 'SPIN' },
      betMinus: { x: 195, y: 840, w: 54, h: 54, label: '−' },
      betPlus: { x: 345, y: 840, w: 54, h: 54, label: '+' },
      info: { x: 92, y: 760, w: 92, h: 46, label: 'RULES\n& INFO' },
      bonusBuy: { x: 448, y: 760, w: 92, h: 46, label: 'BONUS\nBUY' },
      speed: { x: 65, y: 840, r: 26, label: '1X' },
      auto: { x: 430, y: 840, r: 26, label: 'AUTO' },
      sound: { x: 495, y: 840, r: 22 },
      infoClose: { x: 470, y: 95, r: 20 },
      modalDone: { x: 270, y: 865, w: 180, h: 42 }
    };
  }

  formatMoney(num) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  setBetIndexDelta(delta) {
    const bets = CONFIG.WALLET.BET_OPTIONS;
    let idx = bets.indexOf(this.bet);
    if (idx === -1) idx = 2; // Default 30
    idx = Math.max(0, Math.min(bets.length - 1, idx + delta));
    this.bet = bets[idx];
    return this.bet;
  }

  cycleBet() {
    const bets = CONFIG.WALLET.BET_OPTIONS;
    let idx = (bets.indexOf(this.bet) + 1) % bets.length;
    this.bet = bets[idx];
    return this.bet;
  }

  toggleSpeed() {
    const speeds = [1.0, 2.0, 4.0];
    const nextIdx = (speeds.indexOf(this.gameSpeed) + 1) % speeds.length;
    this.gameSpeed = speeds[nextIdx];
    this.buttons.speed.label = `${this.gameSpeed}X`;
    return this.gameSpeed;
  }

  toggleAuto() {
    this.autoDrop = !this.autoDrop;
    return this.autoDrop;
  }

  handleClick(canvasX, canvasY, onAction) {
    // If Info Modal is open, handle close clicks
    if (this.showInfo) {
      const ic = this.buttons.infoClose;
      const md = this.buttons.modalDone;
      if (Math.hypot(canvasX - ic.x, canvasY - ic.y) <= ic.r + 10 ||
          (canvasX >= md.x - md.w / 2 && canvasX <= md.x + md.w / 2 && canvasY >= md.y - md.h / 2 && canvasY <= md.y + md.h / 2)) {
        this.showInfo = false;
        if (onAction) onAction('modal_closed');
        return true;
      }
      // Tap outside modal box to close
      if (canvasX < 30 || canvasX > CONFIG.CANVAS_WIDTH - 30 || canvasY < 70 || canvasY > 890) {
        this.showInfo = false;
        if (onAction) onAction('modal_closed');
        return true;
      }
      return true; // Absorb clicks while modal is open
    }

    // Info Button (Left side above controls)
    const inf = this.buttons.info;
    if (canvasX >= inf.x - inf.w / 2 && canvasX <= inf.x + inf.w / 2 &&
        canvasY >= inf.y - inf.h / 2 && canvasY <= inf.y + inf.h / 2) {
      this.showInfo = true;
      if (onAction) onAction('info_opened');
      return true;
    }

    // Sound Button
    const sBtn = this.buttons.sound;
    if (Math.hypot(canvasX - sBtn.x, canvasY - sBtn.y) <= sBtn.r + 8) {
      if (onAction) onAction('toggle_sound');
      return true;
    }

    // Speed Button
    const sp = this.buttons.speed;
    if (Math.hypot(canvasX - sp.x, canvasY - sp.y) <= sp.r + 8) {
      if (onAction) onAction('toggle_speed');
      return true;
    }

    // Auto Button
    const au = this.buttons.auto;
    if (Math.hypot(canvasX - au.x, canvasY - au.y) <= au.r + 8) {
      if (onAction) onAction('toggle_auto');
      return true;
    }

    // Bet Minus
    const bm = this.buttons.betMinus;
    if (canvasX >= bm.x - bm.w / 2 && canvasX <= bm.x + bm.w / 2 &&
        canvasY >= bm.y - bm.h / 2 && canvasY <= bm.y + bm.h / 2) {
      this.setBetIndexDelta(-1);
      if (onAction) onAction('bet_changed');
      return true;
    }

    // Bet Plus
    const bp = this.buttons.betPlus;
    if (canvasX >= bp.x - bp.w / 2 && canvasX <= bp.x + bp.w / 2 &&
        canvasY >= bp.y - bp.h / 2 && canvasY <= bp.y + bp.h / 2) {
      this.setBetIndexDelta(1);
      if (onAction) onAction('bet_changed');
      return true;
    }

    // Tapping directly on BET readout at bottom-right also cycles the bet!
    if (canvasX >= 360 && canvasY >= 910) {
      this.cycleBet();
      if (onAction) onAction('bet_changed');
      return true;
    }

    // Bonus Buy
    const bb = this.buttons.bonusBuy;
    if (canvasX >= bb.x - bb.w / 2 && canvasX <= bb.x + bb.w / 2 &&
        canvasY >= bb.y - bb.h / 2 && canvasY <= bb.y + bb.h / 2) {
      if (onAction) onAction('bonus_buy');
      return true;
    }

    // Main Spin / Drop Button
    const mb = this.buttons.spin;
    if (Math.hypot(canvasX - mb.x, canvasY - mb.y) <= mb.r + 10) {
      if (onAction) onAction('spin_drop');
      return true;
    }

    return false;
  }

  update(dt) {
    if (this.win < this.targetWin) {
      this.winTickTimer = (this.winTickTimer || 0) + dt;
      // Controlled 1-USD increment every tick so the player sees the score increase cleanly by 1 USD
      const interval = (this.targetWin - this.win > 25) ? 0.04 : 0.08;
      if (this.winTickTimer >= interval) {
        this.winTickTimer = 0;
        this.win = Math.min(this.targetWin, Math.floor(this.win + 1.00));
      }
    }
  }

  render(ctx, assets, gameState, pickaxe, cameraY, isMuted) {
    ctx.save();

    // 1. Floating Durability Badge beside Pickaxe
    if (gameState === 'FALLING' && pickaxe.active) {
      const screenX = pickaxe.x;
      const screenY = pickaxe.y - cameraY - 42;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 15px "Courier New", monospace';

      const durText = `♥ ${Math.ceil(pickaxe.durability)}/${pickaxe.maxDurability}`;
      const ratio = pickaxe.durability / pickaxe.maxDurability;
      let durColor = '#ffffff';
      if (ratio < 0.25) durColor = '#ff3344';
      else if (ratio < 0.5) durColor = '#ffbb33';

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(durText, screenX, screenY);

      ctx.fillStyle = durColor;
      ctx.fillText(durText, screenX, screenY);
      ctx.restore();
    }

    // 2. Top-Left: "FALLING PICKAXE" Logo Badge
    const logoImg = assets.get('logo');
    if (logoImg) {
      ctx.drawImage(logoImg, 14, 16, 140, 60);
    }

    // 3. Top-Right: Active Pickaxe + Target Modifier Frame
    const bFrameX = CONFIG.CANVAS_WIDTH - 130;
    const bFrameY = 18;
    ctx.fillStyle = 'rgba(25, 25, 35, 0.75)';
    ctx.fillRect(bFrameX, bFrameY, 116, 56);
    ctx.strokeStyle = 'rgba(120, 125, 145, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(bFrameX, bFrameY, 116, 56);

    const pickImg = assets.get(pickaxe.tier.spriteKey);
    if (pickImg) {
      ctx.drawImage(pickImg, bFrameX + 8, bFrameY + 8, 40, 40);
    }

    ctx.beginPath();
    ctx.moveTo(bFrameX + 58, bFrameY + 4);
    ctx.lineTo(bFrameX + 58, bFrameY + 52);
    ctx.strokeStyle = '#454858';
    ctx.stroke();

    const targetIcon = assets.get('bonus_pumpkin');
    if (targetIcon) {
      ctx.drawImage(targetIcon, bFrameX + 66, bFrameY + 8, 40, 40);
    }

    // 4. Live Depth & Point Multiplier Ribbon
    if (gameState === 'FALLING') {
      ctx.fillStyle = 'rgba(16, 14, 22, 0.75)';
      ctx.fillRect(CONFIG.CANVAS_WIDTH / 2 - 110, 80, 220, 28);
      ctx.strokeStyle = '#3d3a4d';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(CONFIG.CANVAS_WIDTH / 2 - 110, 80, 220, 28);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 13px "Courier New", monospace';
      ctx.fillStyle = '#ffd700';
      ctx.fillText(`DEPTH: ${Math.floor(this.depth)}m`, CONFIG.CANVAS_WIDTH / 2 - 45, 94);

      ctx.fillStyle = '#00e5ff';
      ctx.fillText(`MULT: ${this.depthMult.toFixed(1)}X`, CONFIG.CANVAS_WIDTH / 2 + 50, 94);
    }

    // 5. Left: Rules & Info Button
    const inf = this.buttons.info;
    ctx.fillStyle = 'rgba(20, 24, 34, 0.9)';
    ctx.fillRect(inf.x - inf.w / 2, inf.y - inf.h / 2, inf.w, inf.h);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(inf.x - inf.w / 2, inf.y - inf.h / 2, inf.w, inf.h);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('RULES', inf.x, inf.y - 7);
    ctx.fillText('& INFO ℹ', inf.x, inf.y + 9);

    // Right: Bonus Buy Button
    const bb = this.buttons.bonusBuy;
    ctx.fillStyle = 'rgba(20, 22, 30, 0.9)';
    ctx.fillRect(bb.x - bb.w / 2, bb.y - bb.h / 2, bb.w, bb.h);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.strokeRect(bb.x - bb.w / 2, bb.y - bb.h / 2, bb.w, bb.h);

    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('BONUS', bb.x, bb.y - 7);
    ctx.fillText('BUY', bb.x, bb.y + 9);

    // 6. Bottom Control Dock
    const sp = this.buttons.speed;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30, 32, 42, 0.85)';
    ctx.fill();
    ctx.strokeStyle = '#606575';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillText(sp.label, sp.x, sp.y);

    // Bet Minus `−`
    const bm = this.buttons.betMinus;
    ctx.fillStyle = 'rgba(40, 44, 58, 0.95)';
    ctx.fillRect(bm.x - bm.w / 2, bm.y - bm.h / 2, bm.w, bm.h);
    ctx.strokeStyle = '#a0a8be';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(bm.x - bm.w / 2, bm.y - bm.h / 2, bm.w, bm.h);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('−', bm.x, bm.y);

    // Center Large Circular Spin Button
    const mb = this.buttons.spin;
    const canSpin = gameState === 'IDLE' || gameState === 'GAME_OVER';

    ctx.beginPath();
    ctx.arc(mb.x, mb.y, mb.r, 0, Math.PI * 2);
    ctx.fillStyle = canSpin ? '#222532' : '#14151c';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = canSpin ? '#ffffff' : '#454858';
    ctx.stroke();

    ctx.save();
    ctx.translate(mb.x, mb.y);
    ctx.beginPath();
    ctx.arc(0, 0, 22, -Math.PI * 0.7, Math.PI * 0.9);
    ctx.strokeStyle = canSpin ? '#ffffff' : '#606575';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(14, 18);
    ctx.lineTo(24, 10);
    ctx.lineTo(24, 26);
    ctx.closePath();
    ctx.fillStyle = canSpin ? '#ffffff' : '#606575';
    ctx.fill();
    ctx.restore();

    // Bet Plus `+`
    const bp = this.buttons.betPlus;
    ctx.fillStyle = 'rgba(40, 44, 58, 0.95)';
    ctx.fillRect(bp.x - bp.w / 2, bp.y - bp.h / 2, bp.w, bp.h);
    ctx.strokeStyle = '#a0a8be';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(bp.x - bp.w / 2, bp.y - bp.h / 2, bp.w, bp.h);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('+', bp.x, bp.y);

    // Auto Button
    const au = this.buttons.auto;
    ctx.beginPath();
    ctx.arc(au.x, au.y, au.r, 0, Math.PI * 2);
    ctx.fillStyle = this.autoDrop ? 'rgba(0, 200, 100, 0.85)' : 'rgba(30, 32, 42, 0.85)';
    ctx.fill();
    ctx.strokeStyle = this.autoDrop ? '#76ff03' : '#606575';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('▷', au.x, au.y);

    // Sound Button
    const sBtn = this.buttons.sound;
    ctx.beginPath();
    ctx.arc(sBtn.x, sBtn.y, sBtn.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30, 32, 42, 0.85)';
    ctx.fill();
    ctx.strokeStyle = '#606575';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(isMuted ? '🔇' : '🔊', sBtn.x, sBtn.y);

    // 7. Bottom Status Bar (CASH, WIN, BET)
    ctx.fillStyle = '#0a0b10';
    ctx.fillRect(0, 915, CONFIG.CANVAS_WIDTH, 45);

    // CASH (USD)
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillStyle = '#8a90a0';
    ctx.fillText('CASH (USD)', 18, 922);
    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.formatMoney(this.cash), 18, 936);

    // WIN
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillStyle = '#8a90a0';
    ctx.fillText('WIN', CONFIG.CANVAS_WIDTH / 2, 922);
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillStyle = this.win > 0 ? '#76ff03' : '#ffffff';
    ctx.fillText(this.formatMoney(this.win), CONFIG.CANVAS_WIDTH / 2, 936);

    // BET (Clickable area!)
    ctx.textAlign = 'right';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('BET ✎', CONFIG.CANVAS_WIDTH - 18, 922);
    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.formatMoney(this.bet), CONFIG.CANVAS_WIDTH - 18, 936);

    // 8. Victory Banner
    if (gameState === 'GAME_OVER' && this.win > 0 && !this.showInfo) {
      ctx.fillStyle = 'rgba(12, 14, 20, 0.88)';
      ctx.fillRect(40, 370, CONFIG.CANVAS_WIDTH - 80, 210);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.strokeRect(40, 370, CONFIG.CANVAS_WIDTH - 80, 210);

      ctx.textAlign = 'center';
      ctx.font = 'bold 26px "Courier New", monospace';
      ctx.fillStyle = '#ffd700';
      ctx.fillText(this.win >= this.bet * 3 ? '★ MEGA WIN! ★' : 'RUN COMPLETE!', CONFIG.CANVAS_WIDTH / 2, 415);

      ctx.font = 'bold 22px "Courier New", monospace';
      ctx.fillStyle = '#76ff03';
      ctx.fillText(`+${this.formatMoney(this.win)} USD`, CONFIG.CANVAS_WIDTH / 2, 465);

      ctx.font = '15px "Courier New", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`FINAL MULTIPLIER: ${(this.win / Math.max(1, this.bet)).toFixed(2)}x`, CONFIG.CANVAS_WIDTH / 2, 505);

      ctx.fillStyle = '#00e5ff';
      ctx.font = '13px "Courier New", monospace';
      ctx.fillText('TAP SPIN TO DROP AGAIN', CONFIG.CANVAS_WIDTH / 2, 545);
    }

    // 9. Comprehensive Info & Rules Modal Overlay
    if (this.showInfo) {
      this.renderInfoModal(ctx, assets);
    }

    ctx.restore();
  }

  renderInfoModal(ctx, assets) {
    // Backdrop shadow
    ctx.fillStyle = 'rgba(5, 4, 8, 0.88)';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Modal Box
    const mx = 24;
    const my = 75;
    const mw = CONFIG.CANVAS_WIDTH - 48;
    const mh = 810;

    ctx.fillStyle = '#141620';
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.strokeRect(mx, my, mw, mh);

    // Modal Header
    ctx.fillStyle = '#1c1f2e';
    ctx.fillRect(mx + 3, my + 3, mw - 6, 50);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('★ RULES & MINING ACADEMY ★', CONFIG.CANVAS_WIDTH / 2, my + 28);

    // Close [X] Button on header
    const ic = this.buttons.infoClose;
    ctx.beginPath();
    ctx.arc(ic.x, ic.y, ic.r, 0, Math.PI * 2);
    ctx.fillStyle = '#ff1744';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('✕', ic.x, ic.y);

    let curY = my + 72;

    // --- Section 1: Core Game & Wheel ---
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('1. HOW TO PLAY & 4-CHANCE WHEEL', mx + 16, curY);
    curY += 18;
    ctx.font = '11.5px "Courier New", monospace';
    ctx.fillStyle = '#d0d4e0';
    ctx.fillText('• Choose BET with [−] / [+] or tap the BET counter.', mx + 16, curY);
    curY += 16;
    ctx.fillText('• Tap SPIN to spin the ancient 4-sector portal wheel.', mx + 16, curY);
    curY += 16;
    ctx.fillText('• WIN Sector: Pickaxe unlocks and drops into the mine!', mx + 16, curY);
    curY += 16;
    ctx.fillText('• MISS (0X) Sectors: No drop, zero win. Spin again!', mx + 16, curY);
    curY += 16;
    ctx.fillText('• BONUS BUY: Pay 5x Bet for guaranteed Diamond Drop!', mx + 16, curY);
    curY += 24;

    // --- Section 2: Pickaxes & Durability ---
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('2. PICKAXE TIERS & HEALTH (DURABILITY)', mx + 16, curY);
    curY += 18;
    ctx.font = '11.5px "Courier New", monospace';
    ctx.fillStyle = '#d29655';
    ctx.fillText('• WOOD:    45 HP | 1.0 Dmg | 1.8x Wear (Fragile starter)', mx + 16, curY);
    curY += 16;
    ctx.fillStyle = '#b0b5be';
    ctx.fillText('• STONE:   85 HP | 1.6 Dmg | 1.2x Wear (Solid balanced)', mx + 16, curY);
    curY += 16;
    ctx.fillStyle = '#e0e6ed';
    ctx.fillText('• IRON:   160 HP | 2.6 Dmg | 0.8x Wear (Heavy duty steel)', mx + 16, curY);
    curY += 16;
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('• DIAMOND:260 HP | 4.2 Dmg | 0.5x Wear (Slices rock!)', mx + 16, curY);
    curY += 16;
    ctx.fillStyle = '#ff8a80';
    ctx.fillText('• Warning: Crashing into Hard Stone deals -3 HP wear!', mx + 16, curY);
    curY += 24;

    // --- Section 3: Blocks & USD Rewards ---
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('3. BLOCKS & USD REWARDS', mx + 16, curY);
    curY += 18;
    ctx.font = '11.5px "Courier New", monospace';
    ctx.fillStyle = '#d0d4e0';
    ctx.fillText('• Dirt / Stone / Volcanic: +$1 USD payout', mx + 16, curY);
    curY += 16;
    ctx.fillStyle = '#ff8a80';
    ctx.fillText('• Hard Stone: +$2 USD | High wear (-3 HP!)', mx + 16, curY);
    curY += 16;
    ctx.fillStyle = '#ffd700';
    ctx.fillText('• Copper: +$3 | Gold: +$5 | Diamond: +$8 | Emerald: +$12 USD', mx + 16, curY);
    curY += 16;
    ctx.fillStyle = '#ff5252';
    ctx.fillText('• TNT: +$3 USD | 3x3 blast clears path and awards blocks!', mx + 16, curY);
    curY += 16;
    ctx.fillStyle = '#76ff03';
    ctx.fillText('• Upgrade: Tier Up! | Repair: +35 HP | Bounce: 0 wear pad', mx + 16, curY);
    curY += 24;

    // --- Section 4: Depth & Descent Score ---
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('4. STEADY $1 USD DESCENT SCORING', mx + 16, curY);
    curY += 18;
    ctx.font = '11.5px "Courier New", monospace';
    ctx.fillStyle = '#d0d4e0';
    ctx.fillText('• Score increases steadily by $1 USD every 3.5m descended!', mx + 16, curY);
    curY += 16;
    ctx.fillText('• Bouncing up or staying at same height gives NO score!', mx + 16, curY);
    curY += 16;
    ctx.fillText('• You must push down into new depths to earn USD!', mx + 16, curY);
    curY += 16;
    ctx.fillText('• Depth milestones at 50m, 100m, 150m celebrate records!', mx + 16, curY);
    curY += 24;

    // --- Section 5: Screen Tap Controls ---
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('5. ACTIVE JUMP & DIRECTION CONTROLS', mx + 16, curY);
    curY += 18;
    ctx.font = '11.5px "Courier New", monospace';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('• Click Left / Right: Jump & Steer axe sideways!', mx + 16, curY);
    curY += 16;
    ctx.fillText('• Click Above Axe: High vertical jump hop!', mx + 16, curY);
    curY += 16;
    ctx.fillText('• Click Below Axe: Downward dive smash!', mx + 16, curY);
    curY += 16;
    ctx.fillStyle = '#d0d4e0';
    ctx.fillText('• Keyboard: [A]/[D] Steer, [W]/[Space] Jump, [S] Slam', mx + 16, curY);
    curY += 30;
    curY += 16;
    ctx.fillText('• [Space]: Spin/Drop | [↑]/[↓]: Change Bet | [B]: Bonus Buy', mx + 16, curY);
    curY += 16;
    ctx.fillText('• [1X / 2X / 4X]: Fast forward speed | [AUTO]: Hands-free drop', mx + 16, curY);
    curY += 30;

    // Bottom "GOT IT!" Button
    const md = this.buttons.modalDone;
    ctx.fillStyle = '#22273a';
    ctx.fillRect(md.x - md.w / 2, md.y - md.h / 2, md.w, md.h);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(md.x - md.w / 2, md.y - md.h / 2, md.w, md.h);

    ctx.textAlign = 'center';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('GOT IT! [CLOSE]', md.x, md.y);
  }
}
