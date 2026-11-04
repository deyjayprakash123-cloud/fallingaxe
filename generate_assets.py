import os
import math
import random
from PIL import Image, ImageDraw

# Ensure directories exist
for p in ['assets/pickaxes', 'assets/blocks', 'assets/ui', 'assets/effects', 'assets/backgrounds', 'audio']:
    os.makedirs(p, exist_ok=True)

def create_pixel_grid(w, h):
    return Image.new('RGBA', (w, h), (0, 0, 0, 0))

# -------------------------------------------------------------
# STEP 4: PICKAXE SPRITES (128x128)
# Designed on a 32x32 pixel art grid and upscaled 4x with nearest neighbor
# Side view, diagonal orientation, chunky arcade proportions
# -------------------------------------------------------------

def generate_pickaxe(tier_name, head_colors, handle_colors, highlight_color):
    """
    32x32 pixel base, upscaled to 128x128.
    head_colors: (base, dark, light, shadow)
    handle_colors: (base, dark, light)
    """
    size = 32
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    pixels = img.load()
    
    # Handle runs diagonally from bottom-left (5, 27) to center (19, 13)
    # Thickness: 2-3 pixels
    for i in range(18):
        x = 5 + i
        y = 27 - i
        if 0 <= x < size and 0 <= y < size:
            pixels[x, y] = handle_colors['base']
            if x - 1 >= 0:
                pixels[x - 1, y] = handle_colors['dark']
            if y - 1 >= 0:
                pixels[x, y - 1] = handle_colors['light']

    # Handle end pommel
    for dx in range(-1, 2):
        for dy in range(-1, 2):
            if abs(dx) + abs(dy) <= 1:
                pixels[5 + dx, 27 + dy] = handle_colors['dark']
    pixels[5, 27] = handle_colors['light']

    # Metallic / binding ring where head attaches (around 19, 13)
    ring_color = (60, 60, 75, 255)
    ring_light = (160, 160, 180, 255)
    for ox in [-1, 0, 1]:
        for oy in [-1, 0, 1]:
            if 0 <= 19 + ox < size and 0 <= 13 + oy < size:
                pixels[19 + ox, 13 + oy] = ring_color
    pixels[19, 13] = ring_light

    # Pickaxe curved dual head:
    # Arc from top-left tip (9, 7) curving down through socket (19, 13) to bottom-right tip (26, 20)
    # or arched up to (24, 6)
    head_pts = [
        # Left prong (curved beak pointing slightly down-left)
        (7, 10), (8, 9), (9, 8), (10, 8), (11, 7), (12, 7), (13, 8), (14, 8), (15, 9), (16, 10), (17, 11), (18, 12),
        # Center socket
        (19, 12), (19, 13), (20, 13),
        # Right prong (curved beak pointing slightly down-right)
        (21, 12), (22, 11), (23, 11), (24, 12), (25, 13), (26, 15), (27, 17), (28, 19)
    ]

    # Draw head body with thickness
    for pt in head_pts:
        x, y = pt
        for dy in range(-2, 3):
            for dx in range(-2, 3):
                if dx*dx + dy*dy <= 4:
                    px, py = x + dx, y + dy
                    if 0 <= px < size and 0 <= py < size:
                        pixels[px, py] = head_colors['dark']

    for pt in head_pts:
        x, y = pt
        for dy in [-1, 0, 1]:
            for dx in [-1, 0, 1]:
                px, py = x + dx, y + dy
                if 0 <= px < size and 0 <= py < size:
                    pixels[px, py] = head_colors['base']

    # Highlights along the top edge of head
    for pt in head_pts:
        x, y = pt
        if y - 1 >= 0:
            pixels[x, y - 1] = head_colors['light']
        if y - 2 >= 0 and (x % 3 == 0):
            pixels[x, y - 2] = highlight_color

    # Sharp tips
    pixels[7, 10] = highlight_color
    pixels[6, 11] = head_colors['light']
    pixels[28, 19] = highlight_color
    pixels[29, 20] = head_colors['light']

    # Upscale 4x with nearest neighbor for crisp 128x128 arcade pixel art
    return img.resize((128, 128), Image.Resampling.NEAREST)

# Generate 4 Tiers
pickaxes = {
    'wooden_pickaxe': {
        'head': {'base': (160, 105, 50, 255), 'dark': (100, 60, 25, 255), 'light': (210, 150, 85, 255), 'shadow': (65, 35, 15, 255)},
        'handle': {'base': (130, 80, 40, 255), 'dark': (80, 45, 20, 255), 'light': (175, 120, 65, 255)},
        'highlight': (235, 185, 120, 255)
    },
    'stone_pickaxe': {
        'head': {'base': (125, 128, 135, 255), 'dark': (70, 72, 80, 255), 'light': (180, 185, 190, 255), 'shadow': (45, 48, 55, 255)},
        'handle': {'base': (130, 85, 45, 255), 'dark': (80, 45, 20, 255), 'light': (170, 120, 70, 255)},
        'highlight': (220, 225, 230, 255)
    },
    'iron_pickaxe': {
        'head': {'base': (190, 195, 205, 255), 'dark': (110, 120, 135, 255), 'light': (240, 245, 255, 255), 'shadow': (70, 75, 90, 255)},
        'handle': {'base': (75, 75, 85, 255), 'dark': (40, 42, 50, 255), 'light': (120, 125, 140, 255)},
        'highlight': (255, 255, 255, 255)
    },
    'diamond_pickaxe': {
        'head': {'base': (0, 210, 230, 255), 'dark': (0, 130, 170, 255), 'light': (140, 250, 255, 255), 'shadow': (0, 80, 120, 255)},
        'handle': {'base': (55, 45, 65, 255), 'dark': (30, 22, 40, 255), 'light': (95, 80, 110, 255)},
        'highlight': (230, 255, 255, 255)
    }
}

for name, cfg in pickaxes.items():
    p_img = generate_pickaxe(name, cfg['head'], cfg['handle'], cfg['highlight'])
    p_img.save(f'assets/pickaxes/{name}.png')
print('Pickaxe sprites generated.')

# -------------------------------------------------------------
# STEP 5: BLOCK SPRITES (64x64)
# Designed on 16x16 pixel art grid and upscaled 4x
# -------------------------------------------------------------

def create_base_stone(palette, seed=42):
    random.seed(seed)
    size = 16
    img = Image.new('RGBA', (size, size))
    pixels = img.load()
    c_base, c_dark, c_light, c_shadow = palette['base'], palette['dark'], palette['light'], palette['shadow']
    
    for y in range(size):
        for x in range(size):
            r = random.random()
            if r < 0.55:
                pixels[x, y] = c_base
            elif r < 0.80:
                pixels[x, y] = c_dark
            elif r < 0.93:
                pixels[x, y] = c_light
            else:
                pixels[x, y] = c_shadow
                
    # Add chunky crack/brick seams
    for x in range(size):
        pixels[x, 0] = c_light
        pixels[x, size - 1] = c_shadow
    for y in range(size):
        pixels[0, y] = c_light
        pixels[size - 1, y] = c_shadow
        
    return img

def generate_ore_block(base_palette, ore_colors, ore_count=6, seed=77):
    img = create_base_stone(base_palette, seed)
    pixels = img.load()
    random.seed(seed)
    clusters = [(random.randint(3, 12), random.randint(3, 12)) for _ in range(ore_count)]
    for cx, cy in clusters:
        for dx in range(-1, 2):
            for dy in range(-1, 2):
                if 1 <= cx+dx < 15 and 1 <= cy+dy < 15 and random.random() < 0.7:
                    pixels[cx+dx, cy+dy] = random.choice(ore_colors)
    return img.resize((64, 64), Image.Resampling.NEAREST)

# Normal stone
stone_palette = {
    'base': (75, 75, 82, 255),
    'dark': (50, 50, 58, 255),
    'light': (105, 108, 118, 255),
    'shadow': (35, 35, 42, 255)
}
stone_img = create_base_stone(stone_palette, 101).resize((64, 64), Image.Resampling.NEAREST)
stone_img.save('assets/blocks/stone.png')

# Volcanic stone / red rock
volcanic_palette = {
    'base': (70, 25, 28, 255),
    'dark': (45, 15, 18, 255),
    'light': (110, 40, 42, 255),
    'shadow': (30, 10, 12, 255)
}
v_img = create_base_stone(volcanic_palette, 202)
v_pix = v_img.load()
# Glowing lava cracks
lava_glows = [(255, 90, 20, 255), (255, 180, 40, 255), (200, 30, 10, 255)]
for pt in [(4, 5), (5, 6), (6, 6), (7, 7), (8, 6), (11, 10), (12, 11), (13, 10), (10, 3), (11, 4)]:
    v_pix[pt[0], pt[1]] = random.choice(lava_glows)
v_img.resize((64, 64), Image.Resampling.NEAREST).save('assets/blocks/volcanic_stone.png')

# Dirt block
dirt_palette = {
    'base': (110, 70, 45, 255),
    'dark': (75, 45, 28, 255),
    'light': (140, 95, 60, 255),
    'shadow': (50, 30, 18, 255)
}
create_base_stone(dirt_palette, 303).resize((64, 64), Image.Resampling.NEAREST).save('assets/blocks/dirt.png')

# Hard stone / reinforced
hard_palette = {
    'base': (45, 45, 52, 255),
    'dark': (25, 25, 30, 255),
    'light': (70, 75, 85, 255),
    'shadow': (18, 18, 22, 255)
}
hard_img = create_base_stone(hard_palette, 404)
h_pix = hard_img.load()
# Add iron reinforcement studs
for sx, sy in [(3, 3), (12, 3), (3, 12), (12, 12)]:
    h_pix[sx, sy] = (190, 195, 210, 255)
    h_pix[sx+1, sy] = (100, 105, 120, 255)
hard_img.resize((64, 64), Image.Resampling.NEAREST).save('assets/blocks/hard_stone.png')

# Ores
copper_colors = [(210, 115, 60, 255), (240, 150, 90, 255), (150, 70, 30, 255)]
generate_ore_block(stone_palette, copper_colors, 6, 501).save('assets/blocks/copper_ore.png')

gold_colors = [(255, 215, 0, 255), (255, 240, 90, 255), (200, 150, 10, 255), (255, 255, 180, 255)]
generate_ore_block(stone_palette, gold_colors, 8, 502).save('assets/blocks/gold_ore.png')

diamond_colors = [(0, 235, 255, 255), (140, 250, 255, 255), (0, 160, 200, 255), (230, 255, 255, 255)]
generate_ore_block(stone_palette, diamond_colors, 7, 503).save('assets/blocks/diamond_ore.png')

emerald_colors = [(0, 230, 90, 255), (80, 255, 150, 255), (0, 150, 50, 255), (190, 255, 210, 255)]
generate_ore_block(stone_palette, emerald_colors, 7, 504).save('assets/blocks/emerald_ore.png')

# TNT Block (16x16 -> 64x64)
tnt_img = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
t_pix = tnt_img.load()
red_main = (210, 40, 35, 255)
red_dark = (140, 20, 20, 255)
red_light = (250, 80, 70, 255)
yellow_warn = (255, 210, 20, 255)
black_stripe = (35, 35, 40, 255)
wood_brace = (100, 60, 30, 255)

for y in range(16):
    for x in range(16):
        t_pix[x, y] = red_main
        if x in [0, 15] or y in [0, 15]:
            t_pix[x, y] = red_dark
        elif x == 1 or y == 1:
            t_pix[x, y] = red_light

# Diagonal warning stripes band across center
for y in range(6, 11):
    for x in range(1, 15):
        if (x + y) % 4 in [0, 1]:
            t_pix[x, y] = yellow_warn
        else:
            t_pix[x, y] = black_stripe

# Fuse at top
t_pix[7, 0] = (150, 140, 120, 255)
t_pix[8, 0] = (255, 200, 50, 255)
tnt_img.resize((64, 64), Image.Resampling.NEAREST).save('assets/blocks/tnt.png')

# Upgrade Block (16x16 -> 64x64)
# Metallic dark frame with glowing cyan arrow
up_img = Image.new('RGBA', (16, 16), (30, 35, 50, 255))
u_pix = up_img.load()
for x in range(16):
    u_pix[x, 0] = (80, 140, 210, 255)
    u_pix[x, 15] = (20, 25, 40, 255)
for y in range(16):
    u_pix[0, y] = (80, 140, 210, 255)
    u_pix[15, y] = (20, 25, 40, 255)

cyan_glow = (0, 240, 255, 255)
cyan_bright = (200, 255, 255, 255)
cyan_soft = (0, 160, 200, 255)

arrow_pixels = [
    (7, 3), (8, 3),
    (6, 4), (7, 4), (8, 4), (9, 4),
    (5, 5), (6, 5), (7, 5), (8, 5), (9, 5), (10, 5),
    (7, 6), (8, 6),
    (7, 7), (8, 7),
    (7, 8), (8, 8),
    (7, 9), (8, 9),
    (7, 10), (8, 10),
    (7, 11), (8, 11),
    (7, 12), (8, 12)
]
for x, y in arrow_pixels:
    u_pix[x, y] = cyan_glow
u_pix[7, 3] = cyan_bright
u_pix[8, 3] = cyan_bright
up_img.resize((64, 64), Image.Resampling.NEAREST).save('assets/blocks/upgrade.png')

# Repair Block (Heart block)
rep_img = Image.new('RGBA', (16, 16), (40, 30, 35, 255))
r_pix = rep_img.load()
for x in range(16):
    r_pix[x, 0] = (160, 60, 90, 255)
    r_pix[x, 15] = (25, 15, 20, 255)
for y in range(16):
    r_pix[0, y] = (160, 60, 90, 255)
    r_pix[15, y] = (25, 15, 20, 255)

heart_pts = [
    (4, 5), (5, 4), (6, 4), (7, 5), (8, 5), (9, 4), (10, 4), (11, 5),
    (3, 6), (4, 6), (5, 6), (6, 6), (7, 6), (8, 6), (9, 6), (10, 6), (11, 6), (12, 6),
    (3, 7), (4, 7), (5, 7), (6, 7), (7, 7), (8, 7), (9, 7), (10, 7), (11, 7), (12, 7),
    (4, 8), (5, 8), (6, 8), (7, 8), (8, 8), (9, 8), (10, 8), (11, 8),
    (5, 9), (6, 9), (7, 9), (8, 9), (9, 9), (10, 9),
    (6, 10), (7, 10), (8, 10), (9, 10),
    (7, 11), (8, 11),
    (7, 12), (8, 12)
]
pink_light = (255, 130, 160, 255)
red_glow = (255, 40, 80, 255)
for x, y in heart_pts:
    r_pix[x, y] = red_glow
r_pix[5, 5] = pink_light
r_pix[9, 5] = pink_light
rep_img.resize((64, 64), Image.Resampling.NEAREST).save('assets/blocks/repair.png')

# Bounce Block (Green slime bounce pad)
bnc_img = Image.new('RGBA', (16, 16), (25, 45, 25, 255))
b_pix = bnc_img.load()
for y in range(16):
    for x in range(16):
        b_pix[x, y] = (40, 160, 60, 255)
        if x in [0, 15] or y in [0, 15]:
            b_pix[x, y] = (20, 80, 30, 255)
        elif x == 1 or y == 1:
            b_pix[x, y] = (120, 240, 140, 255)
# Chevron / spring bounce symbol
chevron = [(7, 4), (8, 4), (6, 5), (9, 5), (5, 6), (10, 6),
           (7, 8), (8, 8), (6, 9), (9, 9), (5, 10), (10, 10)]
for cx, cy in chevron:
    b_pix[cx, cy] = (255, 255, 120, 255)
bnc_img.resize((64, 64), Image.Resampling.NEAREST).save('assets/blocks/bounce.png')

# Unbreakable Block (Basalt border brick)
unb_img = Image.new('RGBA', (16, 16), (30, 30, 35, 255))
ub_pix = unb_img.load()
for y in range(16):
    for x in range(16):
        if (x + y) % 3 == 0:
            ub_pix[x, y] = (45, 45, 52, 255)
        elif (x * y) % 5 == 0:
            ub_pix[x, y] = (20, 20, 25, 255)
        if x == 0 or y == 0:
            ub_pix[x, y] = (70, 70, 80, 255)
        if x == 15 or y == 15:
            ub_pix[x, y] = (12, 12, 15, 255)
unb_img.resize((64, 64), Image.Resampling.NEAREST).save('assets/blocks/unbreakable.png')

print('All block sprites generated.')

# -------------------------------------------------------------
# STEP 6: SELECTOR WHEEL AT THE TOP (512x512)
# Ancient mechanical portal: black volcanic stone, dark metal, glowing orange lava runes, red crystals, large circular frame, empty center
# -------------------------------------------------------------

def generate_selector_wheel():
    w, h = 512, 512
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = w // 2, h // 2
    
    # Outer radius 240, inner radius 140 (donut frame)
    r_out = 236
    r_in = 136
    
    # Draw dark volcanic stone outer ring
    draw.ellipse([cx - r_out, cy - r_out, cx + r_out, cy + r_out], fill=(24, 22, 28, 255), outline=(50, 48, 56, 255), width=8)
    
    # Draw metallic layered ring
    r_mid_out = 220
    r_mid_in = 150
    draw.ellipse([cx - r_mid_out, cy - r_mid_out, cx + r_mid_out, cy + r_mid_out], fill=(42, 38, 48, 255), outline=(90, 80, 100, 255), width=6)
    
    # Glowing lava rune channels (segmented ring)
    num_segments = 16
    for i in range(num_segments):
        start_deg = i * (360 / num_segments) + 3
        end_deg = (i + 1) * (360 / num_segments) - 3
        # Alternate orange lava and dark bronze
        color = (255, 110, 20, 255) if i % 2 == 0 else (210, 60, 15, 255)
        draw.arc([cx - 185, cy - 185, cx + 185, cy + 185], start=start_deg, end=end_deg, fill=color, width=12)

    # Red crystal rivets around the perimeter
    num_crystals = 12
    for i in range(num_crystals):
        rad = math.radians(i * (360 / num_crystals))
        gx = cx + int(math.cos(rad) * 210)
        gy = cy + int(math.sin(rad) * 210)
        draw.ellipse([gx - 12, gy - 12, gx + 12, gy + 12], fill=(220, 30, 45, 255), outline=(255, 120, 140, 255), width=3)
        draw.point((gx - 3, gy - 3), fill=(255, 240, 250, 255))
        
    # Inner border of the portal
    draw.ellipse([cx - r_in, cy - r_in, cx + r_in, cy + r_in], fill=(0, 0, 0, 0), outline=(120, 110, 130, 255), width=6)
    
    # Lava glow accent on inner edge
    draw.ellipse([cx - (r_in + 4), cy - (r_in + 4), cx + (r_in + 4), cy + (r_in + 4)], fill=None, outline=(255, 140, 30, 160), width=4)

    # Ensure central area is strictly transparent
    # Mask out center circle
    mask = Image.new('L', (w, h), 255)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse([cx - r_in + 2, cy - r_in + 2, cx + r_in - 2, cy + r_in - 2], fill=0)
    img.putalpha(Image.composite(img.split()[3], mask, mask))
    
    return img

wheel_img = generate_selector_wheel()
wheel_img.save('assets/ui/selector_wheel.png')
print('Selector wheel generated.')

# -------------------------------------------------------------
# WHEEL SYMBOLS (128x128)
# Separate PNGs for swapping content inside selector wheel
# -------------------------------------------------------------

def generate_symbol(name):
    img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    pix = img.load()
    if name == 'symbol_pickaxe':
        # Glowing golden pickaxe
        for i in range(12):
            pix[10 + i, 22 - i] = (160, 100, 40, 255)
        for ox in range(-3, 4):
            for oy in range(-2, 3):
                if ox*ox + oy*oy <= 6:
                    pix[20 + ox, 10 + oy] = (255, 215, 0, 255)
        pix[20, 10] = (255, 255, 200, 255)
    elif name == 'symbol_upgrade':
        # Triple glowing cyan chevron
        for cy in [10, 16, 22]:
            for x in range(-5, 6):
                y = cy - (5 - abs(x))
                if 0 <= y < 32 and 0 <= 16 + x < 32:
                    pix[16 + x, y] = (0, 240, 255, 255)
                    pix[16 + x, y + 1] = (140, 250, 255, 255)
    elif name == 'symbol_heart':
        # Glowing big heart
        for y in range(32):
            for x in range(32):
                nx, ny = (x - 16) / 10, (y - 14) / 10
                if (nx**2 + ny**2 - 1)**3 - nx**2 * ny**3 <= 0:
                    pix[x, y] = (255, 45, 85, 255)
                    if (nx + 0.3)**2 + (ny + 0.3)**2 < 0.2:
                        pix[x, y] = (255, 190, 210, 255)
    elif name == 'symbol_tnt':
        # Bomb / explosion icon
        for y in range(32):
            for x in range(32):
                dx, dy = x - 16, y - 17
                if dx*dx + dy*dy <= 64:
                    pix[x, y] = (220, 35, 30, 255)
        pix[16, 8] = (255, 200, 0, 255)
        pix[18, 6] = (255, 255, 100, 255)
    elif name == 'symbol_jackpot':
        # Crown / Diamond trophy
        for y in range(32):
            for x in range(32):
                if 10 <= y <= 22 and 8 <= x <= 24:
                    if y >= 17 or x in [9, 10, 15, 16, 17, 22, 23]:
                        pix[x, y] = (255, 220, 40, 255)
                        if x in [10, 16, 22] and y == 11:
                            pix[x, y] = (255, 255, 220, 255)
    elif name == 'symbol_skull':
        # Red hazard cross / skull
        for i in range(-7, 8):
            pix[16 + i, 16 + i] = (230, 30, 30, 255)
            pix[16 + i, 16 + i + 1] = (255, 100, 100, 255)
            pix[16 + i, 16 - i] = (230, 30, 30, 255)
            pix[16 + i, 16 - i + 1] = (255, 100, 100, 255)

    return img.resize((128, 128), Image.Resampling.NEAREST)

for sym in ['symbol_pickaxe', 'symbol_upgrade', 'symbol_heart', 'symbol_tnt', 'symbol_jackpot', 'symbol_skull']:
    generate_symbol(sym).save(f'assets/ui/{sym}.png')

# Heart icon for HUD
generate_symbol('symbol_heart').resize((32, 32), Image.Resampling.NEAREST).save('assets/ui/heart_icon.png')
print('Symbols generated.')

# -------------------------------------------------------------
# STEP 7: BACKGROUND (1080x1920)
# Gigantic underground volcanic cavern, glowing lava river, distant ruins, lava waterfalls, deep red atmospheric haze, dark cliffs, clean center
# -------------------------------------------------------------

def generate_background():
    w, h = 540, 960  # create at half res and upscale to 1080x1920 with crisp pixel aesthetic
    img = Image.new('RGBA', (w, h), (18, 12, 16, 255))
    draw = ImageDraw.Draw(img)
    
    # Atmospheric red/purple gradient
    for y in range(h):
        ratio = y / h
        r = int(18 + 55 * ratio + 30 * math.sin(ratio * 3.14))
        g = int(12 + 15 * ratio)
        b = int(16 + 25 * (1 - ratio))
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))
        
    # Distant volcanic cavern walls and cliffs (sides)
    cliff_color = (28, 18, 24, 255)
    cliff_dark = (14, 8, 12, 255)
    cliff_highlight = (65, 30, 35, 255)
    
    # Left jagged cliff
    left_cliff = [(0, 0)]
    cur_x = 70
    for y in range(0, h, 20):
        cur_x += random.randint(-8, 8)
        cur_x = max(40, min(110, cur_x))
        left_cliff.append((cur_x, y))
    left_cliff.append((0, h))
    draw.polygon(left_cliff, fill=cliff_color)
    
    # Right jagged cliff
    right_cliff = [(w, 0)]
    cur_x = w - 70
    for y in range(0, h, 20):
        cur_x += random.randint(-8, 8)
        cur_x = max(w - 110, min(w - 40, cur_x))
        right_cliff.append((cur_x, y))
    right_cliff.append((w, h))
    draw.polygon(right_cliff, fill=cliff_color)
    
    # Distant glowing lava waterfalls on the sides
    for y in range(80, h - 80, 4):
        # Left lava fall
        lx = 25 + int(5 * math.sin(y * 0.05))
        draw.rectangle([lx - 3, y, lx + 3, y + 3], fill=(255, 90, 15, 200))
        draw.point((lx, y), fill=(255, 210, 60, 255))
        # Right lava fall
        rx = w - 25 + int(5 * math.cos(y * 0.05))
        draw.rectangle([rx - 3, y, rx + 3, y + 3], fill=(255, 90, 15, 200))
        draw.point((rx, y), fill=(255, 210, 60, 255))

    # Glowing orange cracks and windows in background
    for _ in range(35):
        gx = random.choice([random.randint(15, 80), random.randint(w - 80, w - 15)])
        gy = random.randint(50, h - 50)
        draw.rectangle([gx, gy, gx + random.randint(3, 8), gy + random.randint(2, 6)], fill=(255, 130, 20, 220))

    # Molten lava pool glow at the bottom
    for y in range(h - 100, h):
        glow_alpha = int(220 * (y - (h - 100)) / 100)
        draw.line([(0, y), (w, y)], fill=(240, 70, 10, glow_alpha))
        if y > h - 40:
            draw.line([(0, y), (w, y)], fill=(255, 170, 30, glow_alpha))

    # The central area (x between 120 and w-120) is left calm and dark for crystal clarity of falling blocks
    return img.resize((1080, 1920), Image.Resampling.NEAREST)

bg_img = generate_background()
bg_img.save('assets/backgrounds/volcanic_shaft_bg.png')
print('Background generated.')

# -------------------------------------------------------------
# EFFECTS (Sparks, Smoke, Blasts)
# -------------------------------------------------------------

def generate_effects():
    # Spark
    spark = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(spark)
    s_draw.line([(16, 4), (16, 28)], fill=(255, 255, 200, 255), width=3)
    s_draw.line([(4, 16), (28, 16)], fill=(255, 255, 200, 255), width=3)
    s_draw.line([(8, 8), (24, 24)], fill=(255, 180, 40, 255), width=2)
    s_draw.line([(8, 24), (24, 8)], fill=(255, 180, 40, 255), width=2)
    spark.save('assets/effects/spark.png')

    # Smoke particle
    smoke = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    sm_draw = ImageDraw.Draw(smoke)
    sm_draw.ellipse([4, 4, 28, 28], fill=(80, 75, 85, 200), outline=(50, 45, 55, 255), width=2)
    sm_draw.ellipse([8, 8, 20, 20], fill=(130, 125, 135, 180))
    smoke.save('assets/effects/smoke.png')

    # Explosion blast
    blast = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    b_draw = ImageDraw.Draw(blast)
    b_draw.ellipse([6, 6, 58, 58], fill=(255, 80, 20, 230), outline=(255, 220, 50, 255), width=4)
    b_draw.ellipse([14, 14, 50, 50], fill=(255, 200, 40, 240))
    b_draw.ellipse([22, 22, 42, 42], fill=(255, 255, 200, 255))
    blast.save('assets/effects/blast.png')

generate_effects()
print('All effects generated successfully.')

