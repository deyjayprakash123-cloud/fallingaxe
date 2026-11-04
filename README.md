# Falling Pickaxe - Mobile Arcade Mining Game

A mobile-first, physics-driven HTML5 falling pickaxe arcade game designed specifically for 9:16 vertical viewports, short-form video engagement (TikTok, Reels, YouTube Shorts), and zero-friction deployment to Vercel.

---

## 1. Project Structure

```text
d:/PythonProjects/game2/
├── index.html                  # Responsive 9:16 mobile container & entry point
├── vercel.json                 # Vercel deployment configuration & caching headers
├── package.json                # Project manifest and runner scripts
├── README.md                   # Complete architectural and asset replacement guide
├── generate_assets.py          # Standalone Python script for pixel-art regeneration
│
├── assets/                     # Cleanly separated visual game assets
│   ├── pickaxes/               # 4 Pickaxe tiers (128x128 pixel-art sprites)
│   │   ├── wooden_pickaxe.png
│   │   ├── stone_pickaxe.png
│   │   ├── iron_pickaxe.png
│   │   └── diamond_pickaxe.png
│   │
│   ├── blocks/                 # Grid tiles & special objects (64x64 pixel art)
│   │   ├── stone.png
│   │   ├── volcanic_stone.png
│   │   ├── dirt.png
│   │   ├── hard_stone.png
│   │   ├── copper_ore.png
│   │   ├── gold_ore.png
│   │   ├── diamond_ore.png
│   │   ├── emerald_ore.png
│   │   ├── tnt.png
│   │   ├── upgrade.png
│   │   ├── repair.png
│   │   ├── bounce.png
│   │   └── unbreakable.png
│   │
│   ├── ui/                     # UI components, symbols, selector portal
│   │   ├── selector_wheel.png  # 512x512 ancient volcanic mechanical portal
│   │   ├── symbol_pickaxe.png  # 128x128 wheel perk icon
│   │   ├── symbol_upgrade.png  # 128x128 wheel perk icon
│   │   ├── symbol_heart.png    # 128x128 wheel perk icon
│   │   ├── symbol_tnt.png      # 128x128 wheel perk icon
│   │   ├── symbol_jackpot.png  # 128x128 wheel perk icon
│   │   ├── symbol_skull.png    # 128x128 wheel perk icon
│   │   └── heart_icon.png      # 32x32 HUD durability heart
│   │
│   ├── effects/                # Particle & VFX textures
│   │   ├── spark.png
│   │   ├── smoke.png
│   │   └── blast.png
│   │
│   └── backgrounds/            # Vertical cinematic background
│       └── volcanic_shaft_bg.png # 1080x1920 vertical parallax cavern
│
├── audio/                      # Retro 8-bit sound effects (WAV format)
│   ├── bounce.wav              # Springy bounce sound
│   ├── hit_stone.wav           # Rock impact crack
│   ├── hit_ore.wav             # Crystalline metal clink
│   ├── explode.wav             # Low booming explosion
│   ├── upgrade.wav             # Ascending celebratory arpeggio
│   ├── spin.wav                # Mechanical wheel tick
│   └── gameover.wav            # Descending game-over tone
│
└── src/                        # Modular JavaScript source code
    ├── config.js               # Central configuration object for all parameters
    ├── audio.js                # Web Audio API engine with procedural synthesis
    ├── assets.js               # Texture loading, caching, and fallback management
    ├── physics.js              # Rigid body dynamics, angular momentum, anti-stuck
    ├── levelGenerator.js       # Procedural horizontal row generator & patterns
    ├── particles.js            # Particle systems, screen shake, floating score text
    ├── wheel.js                # Top mechanical selector wheel & drop logic
    ├── hud.js                  # Floating durability heart, mobile control dock
    └── game.js                 # Master game loop and state machine
```

---

## 2. Where Every Sprite is Loaded

All assets are preloaded through [`src/assets.js`](file:///d:/PythonProjects/game2/src/assets.js) via the `AssetManager.loadAll()` method:

- **Pickaxes**: Loaded by key in `assets.js` (`wooden_pickaxe`, `stone_pickaxe`, `iron_pickaxe`, `diamond_pickaxe`) and rendered by [`src/game.js`](file:///d:/PythonProjects/game2/src/game.js#L370-L390) using the active tier from [`src/config.js`](file:///d:/PythonProjects/game2/src/config.js#L50-L100).
- **Blocks**: Loaded by key matching the block type (`stone`, `gold_ore`, `tnt`, etc.) and rendered in `renderWorld()` in [`src/game.js`](file:///d:/PythonProjects/game2/src/game.js#L330-L368).
- **Selector Wheel**: Loaded as `selector_wheel` in `assets.js` and rendered by [`src/wheel.js`](file:///d:/PythonProjects/game2/src/wheel.js#L68-L95).
- **Wheel Perk Symbols**: Loaded as `symbol_pickaxe`, `symbol_upgrade`, `symbol_heart`, `symbol_tnt`, `symbol_jackpot`, `symbol_skull` and drawn in the transparent center of the wheel portal.
- **Background**: Loaded as `volcanic_shaft_bg` and drawn with parallax scroll in `renderBackground()` in [`src/game.js`](file:///d:/PythonProjects/game2/src/game.js#L318-L332).
- **Effects**: Loaded as `spark`, `smoke`, and `blast` in `assets.js` for particle rendering.

---

## 3. Recommended Dimensions for Every Image

| Category | Filename | Recommended Dimensions | Format | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Pickaxes** | `assets/pickaxes/*.png` | **128 x 128 px** | PNG (Transparent) | Side view, diagonal orientation, sharp pixel edges |
| **Blocks** | `assets/blocks/*.png` | **64 x 64 px** | PNG (Transparent/Opaque) | Seamless front-facing square tile, no border |
| **Selector Wheel** | `assets/ui/selector_wheel.png` | **512 x 512 px** | PNG (Transparent) | Circular portal frame with empty/transparent center |
| **Wheel Symbols**| `assets/ui/symbol_*.png` | **128 x 128 px** | PNG (Transparent) | Centered iconic glyphs displayed inside the wheel |
| **HUD Heart** | `assets/ui/heart_icon.png` | **32 x 32 px** | PNG (Transparent) | Pixel-art heart icon |
| **Effects** | `assets/effects/*.png` | **32x32 to 64x64 px** | PNG (Transparent) | Sparks, smoke puffs, and explosion blasts |
| **Background** | `assets/backgrounds/volcanic_shaft_bg.png` | **1080 x 1920 px** | PNG (Opaque) | Vertical 9:16 composition, dark center for readability |

---

## 4. Which Files to Replace for Custom Artwork

Simply overwrite any PNG in the `assets/` subfolders while maintaining the filename and transparent background:

1. **Pickaxes**: Replace `assets/pickaxes/wooden_pickaxe.png`, `stone_pickaxe.png`, `iron_pickaxe.png`, `diamond_pickaxe.png`.
2. **Blocks**: Replace `assets/blocks/stone.png`, `volcanic_stone.png`, `dirt.png`, `hard_stone.png`, `copper_ore.png`, `gold_ore.png`, `diamond_ore.png`, `emerald_ore.png`, `tnt.png`, `upgrade.png`, `repair.png`, `bounce.png`, `unbreakable.png`.
3. **Selector Portal**: Replace `assets/ui/selector_wheel.png` (ensure the center $\sim 280\text{px}$ is fully transparent).
4. **Perk Icons**: Replace `assets/ui/symbol_*.png`.
5. **Background**: Replace `assets/backgrounds/volcanic_shaft_bg.png`.

> Note: Image smoothing is disabled (`imageSmoothingEnabled = false` and `image-rendering: pixelated;`), ensuring pixel art always stays razor-sharp.

---

## 5. How to Deploy to Vercel

The project is structured for zero-configuration static deployment:

### Option A: Via GitHub & Vercel Dashboard (Easiest)
1. Push this folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Falling Pickaxe mobile game"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
2. Log into [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Select your GitHub repository.
4. Leave all build settings as default (Framework Preset: **Other**, Build Command: empty, Output Directory: `./`).
5. Click **"Deploy"**. Your game is live in seconds!

### Option B: Via Vercel CLI
1. Install Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```
2. In the `game2` directory, run:
   ```bash
   vercel
   ```
3. Follow the CLI prompts to deploy directly.

