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
    this.showBetModal = false;

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
    // If Bet Selection Modal is open, handle bet selection clicks
    if (this.showBetModal) {
      const mx = 32;
      const my = 290;
      const mw = CONFIG.CANVAS_WIDTH - 64;
      const mh = 430;

      // Close [X] Button on header
      const ic = { x: mx + mw - 24, y: my + 26, r: 18 };
      if (Math.hypot(canvasX - ic.x, canvasY - ic.y) <= ic.r + 8) {
        this.showBetModal = false;
        if (onAction) onAction('bet_menu_closed');
        return true;
      }

      // Confirm & Close Button
      const doneBx = CONFIG.CANVAS_WIDTH / 2 - 110;
      const doneBy = my + 322;
      const doneBw = 220;
      const doneBh = 48;
      if (canvasX >= doneBx && canvasX <= doneBx + doneBw && canvasY >= doneBy && canvasY <= doneBy + doneBh) {
        this.showBetModal = false;
        if (onAction) onAction('bet_changed');
        return true;
      }

      // MIN Button ($10)
      const minBx = mx + 20;
      const minBy = my + 252;
      const minBw = 135;
      const minBh = 42;
      if (canvasX >= minBx && canvasX <= minBx + minBw && canvasY >= minBy && canvasY <= minBy + minBh) {
        this.bet = 10;
        this.showBetModal = false;
        if (onAction) onAction('bet_changed');
        return true;
      }

      // MAX Button ($1,000)
      const maxBw = 135;
      const maxBh = 42;
      const maxBx = mx + mw - 20 - maxBw;
      const maxBy = my + 252;
      if (canvasX >= maxBx && canvasX <= maxBx + maxBw && canvasY >= maxBy && canvasY <= maxBy + maxBh) {
        this.bet = 1000;
        this.showBetModal = false;
        if (onAction) onAction('bet_changed');
        return true;
      }

      // Bet Options Grid (4 cols x 2 rows)
      const cols = 4;
      const chipW = 98;
      const chipH = 62;
      const gapX = 14;
      const gapY = 16;
      const startX = mx + 20;
      const startY = my + 78;

      const options = CONFIG.WALLET.BET_OPTIONS;
      for (let i = 0; i < options.length; i++) {
        const val = options[i];
        const c = i % cols;
        const r = Math.floor(i / cols);
        const bx = startX + c * (chipW + gapX);
        const by = startY + r * (chipH + gapY);

        if (canvasX >= bx && canvasX <= bx + chipW && canvasY >= by && canvasY <= by + chipH) {
          this.bet = val;
          this.showBetModal = false;
          if (onAction) onAction('bet_changed');
          return true;
        }
      }

      // Tap outside modal box to close
      if (canvasX < mx || canvasX > mx + mw || canvasY < my || canvasY > my + mh) {
        this.showBetModal = false;
        if (onAction) onAction('bet_menu_closed');
        return true;
      }

      return true; // Absorb any click inside modal
    }

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

    // Tapping directly on BET readout at bottom-right opens the interactive Bet Selection Modal!
    if (canvasX >= 320 && canvasY >= 905) {
      this.showBetModal = true;
      if (onAction) onAction('bet_menu_opened');
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

    // 2. Top-Left: "FALLING PICKAXE" Logo Badge (High-Visibility Solid Card)
    const logoX = 12;
    const logoY = 14;
    const logoW = 156;
    const logoH = 62;

    // Solid dark slate backing card
    ctx.fillStyle = 'rgba(16, 18, 28, 0.94)';
    ctx.fillRect(logoX, logoY, logoW, logoH);
    ctx.strokeStyle = '#4a567a';
    ctx.lineWidth = 2;
    ctx.strokeRect(logoX, logoY, logoW, logoH);

    // Cyan highlight on top border
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(logoX + 2, logoY + 2);
    ctx.lineTo(logoX + logoW - 2, logoY + 2);
    ctx.stroke();

    const logoImg = assets.get('logo');
    if (logoImg) {
      ctx.drawImage(logoImg, logoX + 3, logoY + 3, logoW - 6, logoH - 6);
    } else {
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('FALLING', logoX + 16, logoY + 22);
      ctx.font = 'bold 18px "Courier New", monospace';
      ctx.fillStyle = '#00e5ff';
      ctx.fillText('PICKAXE ⛏', logoX + 16, logoY + 44);
    }

    // 3. Top-Right: Active Pickaxe + Target Modifier Frame (Dual High-Contrast Compartments)
    const bFrameX = CONFIG.CANVAS_WIDTH - 146; // 394
    const bFrameY = 14;
    const bFrameW = 134;
    const bFrameH = 62;

    // Outer backing card
    ctx.fillStyle = 'rgba(16, 17, 26, 0.96)';
    ctx.fillRect(bFrameX, bFrameY, bFrameW, bFrameH);
    ctx.strokeStyle = '#8a95b8';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(bFrameX, bFrameY, bFrameW, bFrameH);

    // Left Slot: Active Pickaxe (Warm slate high-contrast backing)
    const slot1X = bFrameX + 4;
    const slot1Y = bFrameY + 4;
    const slotW = 58;
    const slotH = 54;
    ctx.fillStyle = '#42475e';
    ctx.fillRect(slot1X, slot1Y, slotW, slotH);
    ctx.strokeStyle = '#6c7596';
    ctx.lineWidth = 1;
    ctx.strokeRect(slot1X, slot1Y, slotW, slotH);

    const pickImg = assets.get(pickaxe.tier.spriteKey);
    if (pickImg) {
      ctx.drawImage(pickImg, slot1X + 5, slot1Y + 3, 48, 48);
    } else {
      ctx.fillStyle = pickaxe.tier.accentColor || '#ffffff';
      ctx.fillRect(slot1X + 14, slot1Y + 14, 30, 30);
    }

    // Tier name badge at bottom of left slot
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = 'bold 9px "Courier New", monospace';
    ctx.fillStyle = pickaxe.tier.accentColor || '#ffffff';
    ctx.fillText(pickaxe.tier.id.toUpperCase(), slot1X + slotW / 2, slot1Y + slotH - 1);

    // Center dividing line
    ctx.beginPath();
    ctx.moveTo(bFrameX + 66, bFrameY + 2);
    ctx.lineTo(bFrameX + 66, bFrameY + bFrameH - 2);
    ctx.strokeStyle = '#252938';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Right Slot: Target Bonus Modifier / Glowing Pumpkin (Rich amber backing)
    const slot2X = bFrameX + 70;
    const slot2Y = bFrameY + 4;
    ctx.fillStyle = '#4c1a05';
    ctx.fillRect(slot2X, slot2Y, slotW, slotH);
    ctx.strokeStyle = '#d4460c';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(slot2X, slot2Y, slotW, slotH);

    const targetIcon = assets.get('bonus_pumpkin');
    if (targetIcon) {
      ctx.drawImage(targetIcon, slot2X + 5, slot2Y + 3, 48, 48);
    }

    // Modifier label
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = 'bold 9px "Courier New", monospace';
    ctx.fillStyle = '#ff9800';
    ctx.fillText('TARGET', slot2X + slotW / 2, slot2Y + slotH - 1);

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

    // BET (Interactive Clickable Button Pill)
    const betBx = CONFIG.CANVAS_WIDTH - 120;
    const betBy = 918;
    const betBw = 110;
    const betBh = 40;
    ctx.fillStyle = 'rgba(32, 28, 18, 0.95)';
    ctx.fillRect(betBx, betBy, betBw, betBh);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(betBx, betBy, betBw, betBh);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('BET ✎ (CHANGE)', betBx + betBw / 2, betBy + 4);
    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`$${this.formatMoney(this.bet)}`, betBx + betBw / 2, betBy + 19);

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

    // 9. Interactive Bet Selection Modal Sheet
    if (this.showBetModal) {
      this.renderBetModal(ctx, assets);
    }

    // 10. Comprehensive Info & Rules Modal Overlay
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

  renderBetModal(ctx, assets) {
    // Backdrop shadow
    ctx.fillStyle = 'rgba(6, 6, 12, 0.82)';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Modal Box
    const mx = 32;
    const my = 290;
    const mw = CONFIG.CANVAS_WIDTH - 64; // 476
    const mh = 430;

    // Dark obsidian modal background with golden border
    ctx.fillStyle = '#141724';
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.strokeRect(mx, my, mw, mh);

    // Modal Header Bar
    ctx.fillStyle = '#1e2336';
    ctx.fillRect(mx + 3, my + 3, mw - 6, 54);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('★ SELECT BET AMOUNT (USD) ★', CONFIG.CANVAS_WIDTH / 2, my + 24);

    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = '#a0a8be';
    ctx.fillText('Choose your stake for the upcoming round:', CONFIG.CANVAS_WIDTH / 2, my + 44);

    // Close [X] Button on header
    const ic = { x: mx + mw - 24, y: my + 26, r: 16 };
    ctx.beginPath();
    ctx.arc(ic.x, ic.y, ic.r, 0, Math.PI * 2);
    ctx.fillStyle = '#ff1744';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('✕', ic.x, ic.y);

    // Bet Options Grid: 4 columns x 2 rows
    const cols = 4;
    const chipW = 98;
    const chipH = 62;
    const gapX = 14;
    const gapY = 16;
    const startX = mx + 20;
    const startY = my + 78;

    const options = CONFIG.WALLET.BET_OPTIONS;
    for (let i = 0; i < options.length; i++) {
      const val = options[i];
      const c = i % cols;
      const r = Math.floor(i / cols);
      const bx = startX + c * (chipW + gapX);
      const by = startY + r * (chipH + gapY);

      const isSelected = (val === this.bet);

      // Chip Background
      if (isSelected) {
        // Glowing Gold Active Chip
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(bx, by, chipW, chipH);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(bx, by, chipW, chipH);

        // Chip Value Text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillStyle = '#0a0b12';
        ctx.fillText(`$${val}`, bx + chipW / 2, by + 24);

        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.fillStyle = '#0a0b12';
        ctx.fillText('✓ ACTIVE', bx + chipW / 2, by + 46);
      } else {
        // Unselected Slate Chip
        ctx.fillStyle = '#202538';
        ctx.fillRect(bx, by, chipW, chipH);
        ctx.strokeStyle = '#4a5478';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, chipW, chipH);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`$${val}`, bx + chipW / 2, by + 26);

        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = '#8a94b0';
        ctx.fillText('SELECT', bx + chipW / 2, by + 46);
      }
    }

    // Quick Select Buttons: MIN ($10) & MAX ($1000)
    // MIN
    const minBx = mx + 20;
    const minBy = my + 252;
    const minBw = 135;
    const minBh = 42;
    ctx.fillStyle = '#1e2436';
    ctx.fillRect(minBx, minBy, minBw, minBh);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(minBx, minBy, minBw, minBh);
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('MIN ($10)', minBx + minBw / 2, minBy + minBh / 2);

    // Current Bet display in middle
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillStyle = '#a0a8be';
    ctx.fillText(`ROUND BET:`, CONFIG.CANVAS_WIDTH / 2, minBy + 12);
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillStyle = '#76ff03';
    ctx.fillText(`$${this.formatMoney(this.bet)}`, CONFIG.CANVAS_WIDTH / 2, minBy + 30);

    // MAX
    const maxBw = 135;
    const maxBh = 42;
    const maxBx = mx + mw - 20 - maxBw;
    const maxBy = my + 252;
    ctx.fillStyle = '#1e2436';
    ctx.fillRect(maxBx, maxBy, maxBw, maxBh);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(maxBx, maxBy, maxBw, maxBh);
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('MAX ($1,000)', maxBx + maxBw / 2, maxBy + maxBh / 2);

    // Confirm & Close Button
    const doneBx = CONFIG.CANVAS_WIDTH / 2 - 110;
    const doneBy = my + 322;
    const doneBw = 220;
    const doneBh = 48;
    ctx.fillStyle = '#22283c';
    ctx.fillRect(doneBx, doneBy, doneBw, doneBh);
    ctx.strokeStyle = '#76ff03';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(doneBx, doneBy, doneBw, doneBh);
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillStyle = '#76ff03';
    ctx.fillText('CONFIRM STAKE ✓', CONFIG.CANVAS_WIDTH / 2, doneBy + doneBh / 2);

    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = '#8a92aa';
    ctx.fillText('Applies to upcoming round / spins', CONFIG.CANVAS_WIDTH / 2, my + 395);
  }
}
