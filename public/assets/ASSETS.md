# Assets Catalog (For Build Agent)

All sprites are 16×16 pixel grid based.

## Character Spritesheets (`public/assets/characters/`)
All humanoid character spritesheets are **64×112 px**, comprising 4 columns × 7 rows of **16×16 px** frames:
- **Columns (4 frames per direction animation)**:
  - Frame 0: Idle / walk frame 1
  - Frame 1: Walk frame 2
  - Frame 2: Walk frame 3
  - Frame 3: Walk frame 4
- **Rows (Directions & actions)**:
  - Row 0 (y: 0..16): Down (South)
  - Row 1 (y: 16..32): Up (North)
  - Row 2 (y: 32..48): Left (West)
  - Row 3 (y: 48..64): Right (East)
  - Rows 4-6: Attack/Special/Damage animations

| File | Size | Frame Size | Recommended Usage |
|---|---|---|---|
| `ninja_blue.png` | 64×112 px | 16×16 px (4×7 grid) | Player sprite candidate 0 |
| `samurai_blue.png` | 64×112 px | 16×16 px (4×7 grid) | Player sprite candidate 1 |
| `samurai_green.png` | 64×112 px | 16×16 px (4×7 grid) | Player sprite candidate 2 |
| `boy.png` | 64×112 px | 16×16 px (4×7 grid) | Player sprite candidate 3 |
| `master.png` | 64×112 px | 16×16 px (4×7 grid) | Mentor NPC ("Professor Rowan") |
| `old_man.png` | 64×112 px | 16×16 px (4×7 grid) | Innkeeper / Village elder NPC |
| `woman.png` | 64×112 px | 16×16 px (4×7 grid) | Villager / Quest guide NPC |
| `villager.png` | 64×112 px | 16×16 px (4×7 grid) | Townsperson NPC |
| `noble.png` | 64×112 px | 16×16 px (4×7 grid) | Wealth/Banker NPC |
| `pig.png` | 32×16 px | 16×16 px (2 frames) | Ambient pet / animal |
| `shadow.png` | 12×8 px | Single image | Player/NPC ground shadow |

## Tilesets (`public/assets/tiles/`)
- `tileset_floor.png`: 352×417 px, 16×16 terrain, grass, dirt paths, water edges, foliage.
- `tileset_village_abandoned.png`: 320×192 px, 16×16 roofs, wooden houses, doors, fences.
- `tileset_interior_floor.png`: 352×272 px, interior floors, mats, indoor objects.
- `tileset_wall_simple.png`: 160×176 px, stone and wooden walls.
- `tileset_animated.png`: 64×64 px, animated water/flower tiles.

## Music (`public/assets/music/`)
Cozy, relaxing chiptune loops in `.ogg` format:
- `theme_plain.ogg` (953 KB): Primary cozy Town Theme.
- `theme_dream.ogg` (2.3 MB): Mentor / Onboarding Theme.
- `theme_lost_village.ogg` (858 KB): Inn / House interior or evening theme.
- `theme_swamp.ogg` (1.4 MB): Ambient alternative theme.

## Sound Effects (`public/assets/sfx/`)
16-bit sound effects in `.wav` format:
- `text_blip.wav`: Typewriter dialog text blip.
- `accept.wav`: Menu selection / confirmation.
- `cancel.wav`: Menu back / cancel.
- `coin.wav`: Quest reward / gold gain.
- `success.wav`: Quest completed fanfare.
- `level_up.wav`: Level up jingle.

## UI Sprites (`public/assets/ui/`)
- `heart.png`, `heart_2.png`, `heart_3.png`: Pixel hearts / health markers.
