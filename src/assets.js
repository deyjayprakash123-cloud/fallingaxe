/**
 * Asset Manager
 * Handles loading, caching, and querying textures with fallback support.
 */
export class AssetManager {
  constructor() {
    this.images = new Map();
    this.loaded = false;
    this.loadPromises = [];
  }

  loadImage(key, url) {
    const p = new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        this.images.set(key, img);
        resolve(img);
      };
      img.onerror = () => {
        console.warn(`Failed to load asset: ${url}. Fallback will be used.`);
        resolve(null);
      };
    });
    this.loadPromises.push(p);
  }

  async loadAll() {
    // Pickaxes
    this.loadImage('wooden_pickaxe', 'assets/pickaxes/wooden_pickaxe.png');
    this.loadImage('stone_pickaxe', 'assets/pickaxes/stone_pickaxe.png');
    this.loadImage('iron_pickaxe', 'assets/pickaxes/iron_pickaxe.png');
    this.loadImage('diamond_pickaxe', 'assets/pickaxes/diamond_pickaxe.png');

    // Blocks
    this.loadImage('stone', 'assets/blocks/stone.png');
    this.loadImage('volcanic_stone', 'assets/blocks/volcanic_stone.png');
    this.loadImage('dirt', 'assets/blocks/dirt.png');
    this.loadImage('hard_stone', 'assets/blocks/hard_stone.png');
    this.loadImage('copper_ore', 'assets/blocks/copper_ore.png');
    this.loadImage('gold_ore', 'assets/blocks/gold_ore.png');
    this.loadImage('diamond_ore', 'assets/blocks/diamond_ore.png');
    this.loadImage('emerald_ore', 'assets/blocks/emerald_ore.png');
    this.loadImage('tnt', 'assets/blocks/tnt.png');
    this.loadImage('upgrade', 'assets/blocks/upgrade.png');
    this.loadImage('repair', 'assets/blocks/repair.png');
    this.loadImage('bounce', 'assets/blocks/bounce.png');
    this.loadImage('unbreakable', 'assets/blocks/unbreakable.png');
    this.loadImage('lava_rim', 'assets/blocks/lava_rim.png');
    this.loadImage('border_pillar', 'assets/blocks/border_pillar.png');

    // UI & Symbols
    this.loadImage('selector_wheel', 'assets/ui/selector_wheel.png');
    this.loadImage('wheel_4sector', 'assets/ui/wheel_4sector.png');
    this.loadImage('logo', 'assets/ui/logo.png');
    this.loadImage('bonus_pumpkin', 'assets/ui/bonus_pumpkin.png');
    this.loadImage('symbol_pickaxe', 'assets/ui/symbol_pickaxe.png');
    this.loadImage('symbol_upgrade', 'assets/ui/symbol_upgrade.png');
    this.loadImage('symbol_heart', 'assets/ui/symbol_heart.png');
    this.loadImage('symbol_tnt', 'assets/ui/symbol_tnt.png');
    this.loadImage('symbol_jackpot', 'assets/ui/symbol_jackpot.png');
    this.loadImage('symbol_skull', 'assets/ui/symbol_skull.png');
    this.loadImage('heart_icon', 'assets/ui/heart_icon.png');

    // Effects
    this.loadImage('spark', 'assets/effects/spark.png');
    this.loadImage('smoke', 'assets/effects/smoke.png');
    this.loadImage('blast', 'assets/effects/blast.png');

    // Backgrounds
    this.loadImage('volcanic_shaft_bg', 'assets/backgrounds/volcanic_shaft_bg.png');

    await Promise.all(this.loadPromises);
    this.loaded = true;
    return true;
  }

  get(key) {
    return this.images.get(key) || null;
  }
}
