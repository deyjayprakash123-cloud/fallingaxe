import { CONFIG } from './config.js';

/**
 * Level Generator
 * Generates procedural, completely randomized mine layouts every run.
 * Dynamic depth scaling: rock hardness, ore value, and obstacle frequency increase with depth.
 */
export class LevelGenerator {
  constructor() {
    this.blocks = new Map();
    this.maxGeneratedRow = -1;
    this.seed = Math.random() * 10000;
    this.nextFeatureRow = 6; // Row where the first random feature appears
  }

  reset() {
    this.blocks.clear();
    this.maxGeneratedRow = -1;
    // New randomized seed for 100% unique layouts on every single run!
    this.seed = Math.random() * 100000;
    this.nextFeatureRow = 5 + Math.floor(Math.random() * 4);
    this.generateInitialSection();
  }

  getBlock(col, row) {
    return this.blocks.get(`${col},${row}`) || null;
  }

  setBlock(col, row, type) {
    if (col < 0 || col >= CONFIG.SHAFT.COLUMNS) return;
    const def = CONFIG.BLOCKS[type];
    if (!def) return;

    this.blocks.set(`${col},${row}`, {
      col,
      row,
      type,
      hp: def.hp,
      maxHp: def.hp,
      mult: def.mult,
      wear: def.wear !== undefined ? def.wear : 1.0,
      shake: 0
    });
  }

  generateInitialSection() {
    this.generateUpToRow(26);
  }

  generateUpToRow(targetRow) {
    while (this.maxGeneratedRow < targetRow) {
      this.maxGeneratedRow++;
      this.generateRow(this.maxGeneratedRow);
    }
  }

  generateRow(row) {
    // Columns 0 and 10 are indestructible border pillars
    this.setBlock(CONFIG.SHAFT.LEFT_WALL_COL, row, 'unbreakable');
    this.setBlock(CONFIG.SHAFT.RIGHT_WALL_COL, row, 'unbreakable');

    // Rows 0-3: Funnel entrance under the selector wheel
    if (row <= 3) {
      if (row === 0) {
        // Platform with randomized 3-block center chute
        const centerOffset = Math.floor(Math.random() * 2) - 1; // -1, 0, or 1
        const chuteStart = 4 + centerOffset;
        const chuteEnd = 6 + centerOffset;
        for (let c = 1; c <= 9; c++) {
          if (c < chuteStart || c > chuteEnd) {
            this.setBlock(c, row, 'volcanic_stone');
          }
        }
      }
      return;
    }

    // Depth in meters (each row is ~4.8 meters)
    const depthMeters = (row * CONFIG.SHAFT.BLOCK_SIZE) / 10;

    // Check if this row is a randomized special feature
    if (row === this.nextFeatureRow) {
      this.generateRandomFeature(row, depthMeters);
      // Schedule next feature in 7 to 12 rows
      this.nextFeatureRow = row + 7 + Math.floor(Math.random() * 6);
      return;
    }

    // Standard Organic Procedural Row
    this.generateStandardRow(row, depthMeters);
  }

  /**
   * Randomized Architectural Features:
   * Zigzag shelves, Geodes, Bounce funnels, Chutes, and TNT clusters
   */
  generateRandomFeature(row, depthMeters) {
    const featureRoll = Math.random();

    if (featureRoll < 0.28) {
      // 1. Zigzag Rock Shelf (forces sideways bouncing)
      const isLeft = Math.random() < 0.5;
      const wallWidth = 4 + Math.floor(Math.random() * 2); // 4-5 blocks
      const startC = isLeft ? 1 : (10 - wallWidth);
      const endC = isLeft ? (1 + wallWidth) : 9;

      for (let c = 1; c <= 9; c++) {
        if (c >= startC && c <= endC) {
          // Harder blocks deeper down
          const isHard = Math.random() < (0.3 + depthMeters * 0.001);
          this.setBlock(c, row, isHard ? 'hard_stone' : 'volcanic_stone');
        } else if (c === (isLeft ? endC + 1 : startC - 1)) {
          // Occasional corner bumper (reduced frequency)
          if (Math.random() < 0.35) {
            this.setBlock(c, row, 'bounce');
          } else {
            this.setBlock(c, row, 'volcanic_stone');
          }
        }
      }
    } else if (featureRoll < 0.52) {
      // 2. Ore Cache with TNT Trap
      const oreList = depthMeters > 150
        ? ['diamond_ore', 'emerald_ore', 'gold_ore']
        : ['gold_ore', 'copper_ore', 'diamond_ore'];

      const cacheCenter = 3 + Math.floor(Math.random() * 5); // 3 to 7
      for (let c = 1; c <= 9; c++) {
        if (c === cacheCenter) {
          this.setBlock(c, row, 'tnt');
        } else if (Math.abs(c - cacheCenter) <= 2) {
          const ore = oreList[Math.floor(Math.random() * oreList.length)];
          this.setBlock(c, row, ore);
        } else {
          this.setBlock(c, row, 'hard_stone');
        }
      }
    } else if (featureRoll < 0.76) {
      // 3. Narrow Speed Chute
      const chuteCol = 3 + Math.floor(Math.random() * 4); // Chute center 3-6
      for (let c = 1; c <= 9; c++) {
        if (c === chuteCol || c === chuteCol + 1) {
          // Air gap
          continue;
        } else if (c === chuteCol - 1 || c === chuteCol + 2) {
          this.setBlock(c, row, Math.random() < 0.2 ? 'bounce' : 'gold_ore');
        } else {
          this.setBlock(c, row, 'hard_stone');
        }
      }
    } else {
      // 4. Crystal Geode (Diamond/Emerald clusters surrounded by Hard Stone)
      for (let c = 1; c <= 9; c++) {
        if (c >= 3 && c <= 7) {
          if (c === 5) {
            this.setBlock(c, row, Math.random() < 0.5 ? 'upgrade' : 'diamond_ore');
          } else {
            this.setBlock(c, row, depthMeters > 200 ? 'emerald_ore' : 'diamond_ore');
          }
        } else {
          this.setBlock(c, row, 'hard_stone');
        }
      }
    }
  }

  /**
   * Standard Procedural Row with Dynamic Depth Scaling
   */
  generateStandardRow(row, depthMeters) {
    // Probability adjustments scaling with depth:
    // - Hard stone ratio: 9% near surface -> up to 30% deep down (challenging!)
    // - Valuable ore ratio: 15% near surface -> up to 24% deep down
    // - High tier ores (Diamond/Emerald) appear significantly more often deep down
    const hardStoneChance = Math.min(0.30, 0.09 + (depthMeters / 1100));
    const oreChance = Math.min(0.24, 0.15 + (depthMeters / 1500));
    const emptyChance = 0.20;

    for (let c = 1; c <= 9; c++) {
      const roll = Math.random();

      // 1. Air / Empty space
      if (roll < emptyChance) {
        continue;
      }

      const blockRoll = (roll - emptyChance) / (1 - emptyChance);

      // 2. Valuable Ores
      if (blockRoll < oreChance) {
        const oreRoll = Math.random();
        if (depthMeters > 250) {
          // Deep Strata: Diamonds & Emeralds dominate!
          if (oreRoll < 0.25) this.setBlock(c, row, 'gold_ore');
          else if (oreRoll < 0.65) this.setBlock(c, row, 'diamond_ore');
          else if (oreRoll < 0.90) this.setBlock(c, row, 'emerald_ore');
          else this.setBlock(c, row, 'copper_ore');
        } else if (depthMeters > 100) {
          // Mid Strata: Gold & Diamonds
          if (oreRoll < 0.35) this.setBlock(c, row, 'copper_ore');
          else if (oreRoll < 0.70) this.setBlock(c, row, 'gold_ore');
          else if (oreRoll < 0.92) this.setBlock(c, row, 'diamond_ore');
          else this.setBlock(c, row, 'emerald_ore');
        } else {
          // Shallow Strata: Copper & Gold
          if (oreRoll < 0.50) this.setBlock(c, row, 'copper_ore');
          else if (oreRoll < 0.85) this.setBlock(c, row, 'gold_ore');
          else this.setBlock(c, row, 'diamond_ore');
        }
      }
      // 3. Reinforced Hard Stone (Difficult rock!)
      else if (blockRoll < oreChance + hardStoneChance) {
        this.setBlock(c, row, 'hard_stone');
      }
      // 4. Bounce Pads (~2% - rare, tactical placement)
      else if (blockRoll < oreChance + hardStoneChance + 0.02) {
        this.setBlock(c, row, 'bounce');
      }
      // 5. Upgrade Runes (~2.5%)
      else if (blockRoll < oreChance + hardStoneChance + 0.045) {
        this.setBlock(c, row, 'upgrade');
      }
      // 6. TNT Explosives (~2.5%)
      else if (blockRoll < oreChance + hardStoneChance + 0.07) {
        this.setBlock(c, row, 'tnt');
      }
      // 7. Repair Hearts (~2%)
      else if (blockRoll < oreChance + hardStoneChance + 0.09) {
        this.setBlock(c, row, 'repair');
      }
      // 8. Normal Stone / Volcanic / Dirt
      else {
        const sub = Math.random();
        if (depthMeters > 180) {
          // Deeper is predominantly dark volcanic rock
          this.setBlock(c, row, sub < 0.70 ? 'volcanic_stone' : 'stone');
        } else {
          if (sub < 0.45) this.setBlock(c, row, 'stone');
          else if (sub < 0.75) this.setBlock(c, row, 'volcanic_stone');
          else this.setBlock(c, row, 'dirt');
        }
      }
    }
  }

  /**
   * Safe, Non-Recursive BFS Explosion
   */
  explodeTNT(startCol, startRow, onBlockDestroyed) {
    const queue = [{ col: startCol, row: startRow }];
    const visitedSet = new Set();
    const destroyed = [];

    visitedSet.add(`${startCol},${startRow}`);
    const startBlock = this.getBlock(startCol, startRow);
    if (startBlock) startBlock.hp = 0;

    while (queue.length > 0) {
      const center = queue.shift();
      const radius = 2;

      for (let c = center.col - radius; c <= center.col + radius; c++) {
        for (let r = center.row - radius; r <= center.row + radius; r++) {
          const key = `${c},${r}`;
          if (visitedSet.has(key)) continue;

          const dist = Math.hypot(c - center.col, r - center.row);
          if (dist <= radius + 0.35) {
            const b = this.getBlock(c, r);
            if (b && b.type !== 'unbreakable' && b.hp > 0) {
              visitedSet.add(key);
              b.hp = 0;
              destroyed.push(b);

              if (b.type === 'tnt') {
                queue.push({ col: c, row: r });
              }

              if (onBlockDestroyed) {
                onBlockDestroyed(b);
              }
            }
          }
        }
      }
    }
    return destroyed;
  }

  cleanupAboveRow(minRow) {
    for (const [key, block] of this.blocks.entries()) {
      if (block.row < minRow) {
        this.blocks.delete(key);
      }
    }
  }
}
