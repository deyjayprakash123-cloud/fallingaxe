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
    GRAVITY: 1160,          // Faster downward pull for increased challenge
    MAX_FALL_SPEED: 820,    // Terminal fall velocity
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
    NUDGE_IMPULSE_Y: -100,
    JUMP_IMPULSE_Y: -360,   // Active jump hop velocity
    JUMP_IMPULSE_X: 240,    // Active directional steering velocity
    JUMP_COOLDOWN: 0.20     // Cooldown between jumps prevents infinite hovering
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
      maxDurability: 45,    // Challenging starter durability
      damage: 1.0,
      wearMult: 1.85,       // Fragile wood wears quickly against underground rock
      size: 50,
      fallSpeedMult: 0.95,
      bounceStrength: 0.52,
      spriteKey: 'wooden_pickaxe',
      accentColor: '#d29655'
    },
    stone: {
      id: 'stone',
      name: 'Stone Pickaxe',
      maxDurability: 85,
      damage: 1.6,
      wearMult: 1.25,
      size: 52,
      fallSpeedMult: 1.05,
      bounceStrength: 0.60,
      spriteKey: 'stone_pickaxe',
      accentColor: '#a0a5ad'
    },
    iron: {
      id: 'iron',
      name: 'Iron Pickaxe',
      maxDurability: 160,
      damage: 2.6,
      wearMult: 0.85,
      size: 55,
      fallSpeedMult: 1.22,
      bounceStrength: 0.70,
      spriteKey: 'iron_pickaxe',
      accentColor: '#e0e6ed'
    },
    diamond: {
      id: 'diamond',
      name: 'Diamond Pickaxe',
      maxDurability: 260,
      damage: 4.2,
      wearMult: 0.55,
      size: 58,
      fallSpeedMult: 1.40,
      bounceStrength: 0.80,
      spriteKey: 'diamond_pickaxe',
      accentColor: '#00e5ff'
    }
  },

  // Block Types: hp, rupeeReward (clean 1-rupee scaling payouts), wear (hardness wear on pickaxe)
  BLOCKS: {
    stone: {
      name: 'Stone',
      hp: 2,
      rupeeReward: 1.0,     // Increases by 1 rupee
      wear: 1.0,            // Standard stone wear
      spriteKey: 'stone',
      debrisColor: '#6c6f78',
      sound: 'hit_stone'
    },
    volcanic_stone: {
      name: 'Volcanic Rock',
      hp: 2,
      rupeeReward: 1.0,     // Increases by 1 rupee
      wear: 1.4,            // Rough volcanic stone deals higher wear
      spriteKey: 'volcanic_stone',
      debrisColor: '#8a2828',
      sound: 'hit_stone'
    },
    dirt: {
      name: 'Dirt',
      hp: 1,
      rupeeReward: 1.0,     // Increases by 1 rupee
      wear: 0.4,            // Soft dirt
      spriteKey: 'dirt',
      debrisColor: '#845334',
      sound: 'hit_stone'
    },
    hard_stone: {
      name: 'Hard Stone',
      hp: 3,
      rupeeReward: 2.0,     // 2 rupees
      wear: 3.0,            // Heavy wear! Punishes mindless crashing
      spriteKey: 'hard_stone',
      debrisColor: '#3a3a44',
      sound: 'hit_stone'
    },
    copper_ore: {
      name: 'Copper Ore',
      hp: 2,
      rupeeReward: 3.0,     // 3 rupees
      wear: 1.3,
      spriteKey: 'copper_ore',
      debrisColor: '#d2733c',
      sound: 'hit_ore'
    },
    gold_ore: {
      name: 'Gold Ore',
      hp: 2,
      rupeeReward: 5.0,     // 5 rupees
      wear: 1.5,
      spriteKey: 'gold_ore',
      debrisColor: '#ffd700',
      sound: 'hit_ore'
    },
    diamond_ore: {
      name: 'Diamond Ore',
      hp: 3,
      rupeeReward: 8.0,     // 8 rupees
      wear: 2.2,
      spriteKey: 'diamond_ore',
      debrisColor: '#00e5ff',
      sound: 'hit_ore'
    },
    emerald_ore: {
      name: 'Emerald Ore',
      hp: 3,
      rupeeReward: 12.0,    // 12 rupees
      wear: 2.6,
      spriteKey: 'emerald_ore',
      debrisColor: '#00e65a',
      sound: 'hit_ore'
    },
    tnt: {
      name: 'TNT',
      hp: 1,
      rupeeReward: 3.0,
      wear: 0.1,
      spriteKey: 'tnt',
      debrisColor: '#d42828',
      sound: 'explode',
      isExplosive: true,
      explosionRadius: 2.2
    },
    upgrade: {
      name: 'Upgrade Block',
      hp: 1,
      rupeeReward: 2.0,
      wear: 0.2,
      spriteKey: 'upgrade',
      debrisColor: '#00e5ff',
      sound: 'upgrade',
      isUpgrade: true
    },
    repair: {
      name: 'Repair Block',
      hp: 1,
      rupeeReward: 1.0,
      wear: 0.1,
      spriteKey: 'repair',
      debrisColor: '#ff2d55',
      sound: 'repair',
      isRepair: true,
      repairAmount: 35      // Precious repair health
    },
    bounce: {
      name: 'Bounce Block',
      hp: 999999,
      rupeeReward: 0,
      wear: 0.0,
      spriteKey: 'bounce',
      debrisColor: '#76ff03',
      sound: 'bounce',
      isBounce: true,
      bounceBoost: 1.20
    },
    unbreakable: {
      name: 'Bedrock Border',
      hp: 999999,
      rupeeReward: 0,
      wear: 0.2,
      spriteKey: 'border_pillar',
      debrisColor: '#303038',
      sound: 'hit_stone',
      isBorder: true
    }
  },

  // Level Generator Probabilities (Increased challenge with more hard obstacles)
  GENERATION: {
    EMPTY_RATIO: 0.20,
    NORMAL_RATIO: 0.44,
    VALUABLE_ORE_RATIO: 0.14,
    REINFORCED_RATIO: 0.16, // More hard stone barriers
    BOUNCE_RATIO: 0.015,    // Reduced bounce pads
    UPGRADE_RATIO: 0.02,
    TNT_RATIO: 0.02,
    REPAIR_RATIO: 0.015
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
