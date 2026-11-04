/**
 * Game Configuration
 * Centralized configurations for demo betting, wallet, 4-chance wheel, physics, and mine shaft.
 */
export const CONFIG = {
  // Virtual Canvas Resolution (9:16 mobile aspect ratio)
  CANVAS_WIDTH: 540,
  CANVAS_HEIGHT: 960,
  TARGET_FPS: 60,

  // Demo Betting & Wallet System
  WALLET: {
    INITIAL_CASH: 50000.00,
    CURRENCY_LABEL: 'DMO',
    BET_OPTIONS: [10, 20, 30, 50, 100, 250, 500, 1000],
    DEFAULT_BET: 30,
    BONUS_BUY_COST_MULTIPLIER: 5.0
  },

  // Mine Shaft Layout
  SHAFT: {
    COLUMNS: 11,            // 1 left border + 9 playable mine columns + 1 right border
    BLOCK_SIZE: 48,         // 48px square blocks
    LEFT_WALL_COL: 0,
    RIGHT_WALL_COL: 10,
    START_ROW_Y: 340,       // Y position where the mine starts below selector wheel
    ROW_SPACING: 48,
    BUFFER_ROWS_BELOW: 24,
    CLEANUP_ROWS_ABOVE: 14
  },

  // Strict Physical Limits
  BOUNDARIES: {
    MIN_X: 48,
    MAX_X: 480
  },

  // Physics Tunings (Satisfying, high-energy, unpredictable falling rigid body)
  PHYSICS: {
    GRAVITY: 1050,          // Pixels / s^2
    MAX_FALL_SPEED: 800,    // Terminal fall velocity
    AIR_DRAG: 0.995,
    ROTATION_DRAG: 0.990,
    DEFAULT_BOUNCE: 0.65,
    WALL_BOUNCE: 0.82,
    COLLISION_TORQUE: 9.0,
    MIN_SPIN: 3.2,
    MAX_SPIN: 11.0,
    RANDOM_BOUNCE_JITTER: 0.12,
    ANTI_STUCK_TIME: 0.35,  // Fast anti-stuck response
    ANTI_STUCK_SPEED_THRESHOLD: 32,
    NUDGE_IMPULSE_X: 220,
    NUDGE_IMPULSE_Y: -100
  },

  // Camera Settings
  CAMERA: {
    LERP_SPEED: 0.14,
    OFFSET_Y_RATIO: 0.38,
    MIN_Y: 0
  },

  // Pickaxe Tiers (Wear multipliers scale durability loss based on tier material)
  PICKAXE_TIERS: {
    wooden: {
      id: 'wooden',
      name: 'Wooden Pickaxe',
      maxDurability: 60,
      damage: 1.0,
      wearMult: 1.5,        // Soft wood wears down faster
      size: 50,
      fallSpeedMult: 0.95,
      bounceStrength: 0.52,
      spriteKey: 'wooden_pickaxe',
      accentColor: '#d29655'
    },
    stone: {
      id: 'stone',
      name: 'Stone Pickaxe',
      maxDurability: 110,
      damage: 1.6,
      wearMult: 1.0,        // Standard wear
      size: 52,
      fallSpeedMult: 1.05,
      bounceStrength: 0.60,
      spriteKey: 'stone_pickaxe',
      accentColor: '#a0a5ad'
    },
    iron: {
      id: 'iron',
      name: 'Iron Pickaxe',
      maxDurability: 200,
      damage: 2.6,
      wearMult: 0.72,       // Reinforced metal resists wear
      size: 55,
      fallSpeedMult: 1.22,
      bounceStrength: 0.70,
      spriteKey: 'iron_pickaxe',
      accentColor: '#e0e6ed'
    },
    diamond: {
      id: 'diamond',
      name: 'Diamond Pickaxe',
      maxDurability: 350,
      damage: 4.2,
      wearMult: 0.45,       // Ultra-durable diamond cuts effortlessly
      size: 58,
      fallSpeedMult: 1.40,
      bounceStrength: 0.80,
      spriteKey: 'diamond_pickaxe',
      accentColor: '#00e5ff'
    }
  },

  // Block Types: hp, mult (payout relative to bet), wear (hardness wear on pickaxe)
  BLOCKS: {
    stone: {
      name: 'Stone',
      hp: 2,
      mult: 0.15,
      wear: 0.85,           // Standard stone wear
      spriteKey: 'stone',
      debrisColor: '#6c6f78',
      sound: 'hit_stone'
    },
    volcanic_stone: {
      name: 'Volcanic Rock',
      hp: 2,
      mult: 0.25,
      wear: 1.0,            // Rough volcanic stone
      spriteKey: 'volcanic_stone',
      debrisColor: '#8a2828',
      sound: 'hit_stone'
    },
    dirt: {
      name: 'Dirt',
      hp: 1,
      mult: 0.08,
      wear: 0.35,           // Soft dirt barely wears pickaxe
      spriteKey: 'dirt',
      debrisColor: '#845334',
      sound: 'hit_stone'
    },
    hard_stone: {
      name: 'Hard Stone',
      hp: 3,
      mult: 0.60,
      wear: 2.2,            // High wear! Dangerous for weak pickaxes
      spriteKey: 'hard_stone',
      debrisColor: '#3a3a44',
      sound: 'hit_stone'
    },
    copper_ore: {
      name: 'Copper Ore',
      hp: 2,
      mult: 1.20,
      wear: 1.1,
      spriteKey: 'copper_ore',
      debrisColor: '#d2733c',
      sound: 'hit_ore'
    },
    gold_ore: {
      name: 'Gold Ore',
      hp: 2,
      mult: 3.50,
      wear: 1.3,
      spriteKey: 'gold_ore',
      debrisColor: '#ffd700',
      sound: 'hit_ore'
    },
    diamond_ore: {
      name: 'Diamond Ore',
      hp: 3,
      mult: 10.00,
      wear: 2.0,            // Dense crystalline ore
      spriteKey: 'diamond_ore',
      debrisColor: '#00e5ff',
      sound: 'hit_ore'
    },
    emerald_ore: {
      name: 'Emerald Ore',
      hp: 3,
      mult: 25.00,
      wear: 2.4,
      spriteKey: 'emerald_ore',
      debrisColor: '#00e65a',
      sound: 'hit_ore'
    },
    tnt: {
      name: 'TNT',
      hp: 1,
      mult: 2.50,
      wear: 0.1,            // Detonates on impact, very low direct wear
      spriteKey: 'tnt',
      debrisColor: '#d42828',
      sound: 'explode',
      isExplosive: true,
      explosionRadius: 2.2
    },
    upgrade: {
      name: 'Upgrade Block',
      hp: 1,
      mult: 5.00,
      wear: 0.2,
      spriteKey: 'upgrade',
      debrisColor: '#00e5ff',
      sound: 'upgrade',
      isUpgrade: true
    },
    repair: {
      name: 'Repair Block',
      hp: 1,
      mult: 1.50,
      wear: 0.1,
      spriteKey: 'repair',
      debrisColor: '#ff2d55',
      sound: 'repair',
      isRepair: true,
      repairAmount: 50
    },
    bounce: {
      name: 'Bounce Block',
      hp: 999999,
      mult: 0.10,
      wear: 0.0,            // Elastic rubber/slime: ZERO wear!
      spriteKey: 'bounce',
      debrisColor: '#76ff03',
      sound: 'bounce',
      isBounce: true,
      bounceBoost: 1.70
    },
    unbreakable: {
      name: 'Bedrock Border',
      hp: 999999,
      mult: 0,
      wear: 0.15,           // Polished border wall: minimal wear
      spriteKey: 'border_pillar',
      debrisColor: '#303038',
      sound: 'hit_stone',
      isBorder: true
    }
  },

  // Level Generator Probabilities
  GENERATION: {
    EMPTY_RATIO: 0.20,
    NORMAL_RATIO: 0.45,
    VALUABLE_ORE_RATIO: 0.15,
    REINFORCED_RATIO: 0.08,
    BOUNCE_RATIO: 0.05,
    UPGRADE_RATIO: 0.03,
    TNT_RATIO: 0.02,
    REPAIR_RATIO: 0.02
  },

  // 4-Chance Selector Wheel
  WHEEL: {
    X: 270,
    Y: 175,
    RADIUS: 125,
    SPIN_DURATION: 1.6,
    SECTORS: [
      { id: 'miss_1', type: 'MISS', label: 'MISS (0X)', color: '#d32f2f', angleRange: [180, 270] },
      { id: 'miss_2', type: 'MISS', label: 'MISS (0X)', color: '#d32f2f', angleRange: [270, 360] },
      { id: 'miss_3', type: 'MISS', label: 'MISS (0X)', color: '#d32f2f', angleRange: [90, 180] },
      { id: 'win_drop', type: 'WIN', label: 'PICKAXE DROP', color: '#2e7d32', angleRange: [0, 90] }
    ]
  }
};
