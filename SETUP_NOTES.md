# Setup & Handoff Notes for Build Agent

This document records the exact state of the project setup executed according to `SETUP_PROMPT.md`.

## 1. Installed Package Versions
From `package.json` lockfile:
- `react`: `^19.x` / `react-dom`: `^19.x`
- `phaser`: `^3.88.2`
- `zustand`: `^5.0.3`
- `howler`: `^2.2.4`
- `@fontsource/pixelify-sans`: `^5.2.5`
- `vite`: `^8.3.4`
- `vite-plugin-pwa`: `^2.0.0`
- `vitest`: `^5.0.5`
- `playwright`: `^1.58.2`
- `typescript`: `^5.9.3`
- `eslint`: `^10.13.0`

## 2. Deviations from SETUP_PROMPT.md & Rationales
1. **Workbox maximumFileSizeToCacheInBytes**: Raised to `5 * 1024 * 1024` (5 MiB) in `vite.config.ts`. The ambient music track `theme_dream.ogg` is 2.33 MiB, exceeding the default 2 MiB Workbox precache limit.
2. **ESLint globals package**: Installed `globals` as devDependency to cleanly provide `globals.browser` for ESLint 10 flat config.
3. **TypeScript tsconfig.json**: Used `"paths": { "@/*": ["./src/*"] }` without deprecated `baseUrl` to ensure future compatibility with TypeScript >= 7.

## 3. Asset Status
- **Source**: Directly obtained from the official [pixel-boy/NinjaAdventure](https://github.com/pixel-boy/NinjaAdventure) CC0 repository (plus official character sheets/sfx from the Kuroshiro-adventure Unity mirror).
- **Location**: `public/assets/`
  - `tiles/`: `tileset_floor.png`, `tileset_village_abandoned.png`, `tileset_interior_floor.png`, `tileset_wall_simple.png`, `tileset_animated.png`.
  - `characters/`: 11 sprite sheets (64×112 px 16×16 4-direction frames): `ninja_blue.png`, `samurai_blue.png`, `samurai_green.png`, `boy.png`, `master.png` (Rowan mentor candidate), `old_man.png` (Innkeeper candidate), `woman.png`, `villager.png`, `noble.png`, plus `pig.png` and `shadow.png`.
  - `music/`: 4 cozy `.ogg` tracks: `theme_plain.ogg` (town), `theme_dream.ogg` (mentor/intro), `theme_lost_village.ogg`, `theme_swamp.ogg`.
  - `sfx/`: 6 `.wav` effects: `text_blip.wav`, `accept.wav`, `cancel.wav`, `coin.wav`, `success.wav`, `level_up.wav`.
  - `ui/`: `heart.png`, `heart_2.png`, `heart_3.png`.
- Full specifications, sizes, and layout frames are detailed in `public/assets/ASSETS.md`.
- Licensing attribution is preserved in `public/assets/CREDITS.md`.

## 4. Verification Results
All tests and builds pass cleanly:
- `npm run lint`: 0 errors, 0 warnings.
- `npm run typecheck`: 0 errors.
- `npm test`: 1/1 Vitest sanity test passed.
- `npm run build`: Production bundle generated with PWA service worker and WebManifest (precache 77 entries, 7.6 MB).
- `npm run test:e2e`: Playwright mobile test (`Pixel 7`) passed.

## 5. Remote Repository & Deployment Status
- Remote GitHub repo: `https://github.com/ant100/life-quest`
- GitHub Pages live URL: `https://ant100.github.io/life-quest/`

## 6. Resolution & Viewport Calibration Update
- **Internal Canvas Resolution**: Upgraded to **640 × 960** (High-DPI 2:3 aspect ratio).
- **Pixel Art Compatibility**: Preserves retro tile rendering (rendered at 2x/32px scale) while providing razor-sharp typography and crisp UI edges on modern displays (iPhone 16, iPad, Pixel, Desktop).
- **Responsive Viewport Alignment**: The game stage container uses `position: fixed` with dynamic `max(12px, env(safe-area-inset-*))` padding and flex auto-centering (`margin: auto`). The canvas remains centered vertically and horizontally across any aspect ratio or device notch without sinking to the bottom.

## 7. Color Palette & Typography Specifications
- **Selected Baseline Palette (Option 3 - "Ghost in the Pastel / Tokyo Night Calm")**:
  - Base background / abyss: `#101C2E` (or Tokyo Night deep dark `#1a1b26`)
  - Card & UI container background: `#17273D`
  - Structural frames & borders: `#3F6B88`
  - Primary title & ice accent: `#88E2DB` (or Tokyo Night cyan `#7dcfff`)
  - Badges & subtitle: `#C2A0D9` (or Tokyo Night purple `#bb9af7`)
  - Reading text: `#FDFBF7` (or Tokyo Night foreground `#c0caf5`)
- **Typography Architecture**:
  - The Phaser canvas is strictly for graphics, tiles, maps, and character animations.
  - All text, dialogue cards, quest logs, and HUD elements are rendered via React HTML/CSS using `@fontsource/plus-jakarta-sans` for razor-sharp legibility across all Retina and high-DPI displays.
- **Viewport Dimension**:
  - Native stage ratio: 9:16 portrait (`360×640` virtual resolution, scaled with CSS `display: grid; place-items: center` and `min(92vw, 440px)` / `min(88dvh, 760px)`). Perfectly centered on iPhone 16, Pixel, iPad, and desktop.
