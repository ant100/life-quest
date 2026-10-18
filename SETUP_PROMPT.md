# Life Quest: Setup Prompt (Boilerplate Only)

## 0. Your role and boundaries
You are preparing the project skeleton for **Life Quest**, a mobile-first pixel-art RPG PWA (FireRed-style) built with Vite + React + TypeScript + Phaser 3. Another agent will build the actual game afterwards using `BUILD_PROMPT.md`. **Read `BUILD_PROMPT.md` §3, §4, and §8 for context, but do NOT implement anything from §5 to §7 or the milestones in §9.**

Work in `/home/ann/projects/life_rpg`. Environment: Node 24, npm 12, git 2.34, GitHub CLI `gh` 2.102 (installed, may not be logged in yet). Linux.

**Forbidden:**
- game logic (XP, quests, badges, etc.)
- Zustand stores
- UI screens and components beyond the placeholders below
- tile maps
- quest content
- the audio module

When something is ambiguous, choose the simplest standard option and write it down in `SETUP_NOTES.md`.

## 1. Repository
- `git init` with default branch `main`. Add a `.gitignore` (node, dist, playwright reports, `.downloads/`, `.env*`), `.nvmrc` (`24`), `.editorconfig` (2 spaces, LF).
- Add `"engines": { "node": ">=22" }` to package.json.

## 2. Scaffold & tooling
- Scaffold with `npm create vite@latest . -- --template react-ts`. Keep `BUILD_PROMPT.md` and `SETUP_PROMPT.md` intact.
- TypeScript `strict: true`, `noUncheckedIndexedAccess: true`. Path alias `@/*` → `src/*`, set in both tsconfig and vite.config.
- ESLint (flat config, typescript-eslint, react-hooks) + Prettier (singleQuote, semi, printWidth 100). Add `eslint-config-prettier`.
- **Runtime deps:** `phaser`, `zustand`, `howler`, `@fontsource/pixelify-sans`. **Dev deps:** `@types/howler`, `vite-plugin-pwa`, `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@playwright/test`. Use the latest stable versions and commit the lockfile.
- Run `npx playwright install chromium`. If that fails because of missing system packages, note it in `SETUP_NOTES.md` and continue.
- **npm scripts:** `dev`, `build` (`tsc -b && vite build`), `preview`, `typecheck` (`tsc -b --noEmit` or equivalent), `lint`, `format`, `test` (`vitest run`), `test:watch`, `test:e2e` (`playwright test`).

## 3. Folder skeleton
Create exactly this layout. Each placeholder file is a stub `export {}` with a one-line comment describing its future purpose.
```
src/
  domain/   types.ts xp.ts rewards.ts daily.ts chains.ts badges.ts returnBonus.ts importExport.ts rng.ts
  data/     questLibrary.ts chainTemplates.ts
  store/    gameStore.ts
  game/     PhaserGame.tsx  eventBus.ts  scenes/Boot.ts  systems/.gitkeep
  audio/    audio.ts
  ui/       .gitkeep
  styles/   global.css
  App.tsx main.tsx
public/assets/ tiles/ characters/ ui/ music/ sfx/ CREDITS.md
seeds/.gitkeep
tests/e2e/smoke.spec.ts
```

## 4. Phaser + React shell (integration proof only)
- `PhaserGame.tsx` mounts a single Phaser.Game into a div ref, destroys it on unmount (it must be safe under React StrictMode's double mount), and uses this config:
  - `pixelArt: true`, `roundPixels: true`
  - `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }`
  - a base resolution of **160×240** (portrait), exported as constants `GAME_WIDTH` / `GAME_HEIGHT`
  - background colour `#2d1b2e`
- `scenes/Boot.ts`: draws a placeholder 16×16 checker of 2 colours and shows the text "Life Quest", to prove pixel scaling is crisp.
- `App.tsx` layout: a full-viewport container (`100dvh`). The Phaser canvas sits at the bottom layer, and above it is an absolutely positioned `#ui-layer` div with `pointer-events: none`; children re-enable pointer events. Inside the overlay, render one placeholder FireRed-style text box ("Setup complete ▼") using `Pixelify Sans`: a white box with a thick dark rounded border.
- `eventBus.ts`: a tiny typed emitter (`on`, `off`, `emit`) generic over an `Events` interface that is currently empty (`// events defined by the build agent`). Don't use any dependency for it.
- `global.css`: a reset, `image-rendering: pixelated` on the canvas, no scrollbars, `touch-action: manipulation`, safe-area padding with `env(safe-area-inset-*)`.

## 5. PWA
- Configure `vite-plugin-pwa`:
  - `registerType: 'autoUpdate'`
  - manifest: name "Life Quest", short_name "Life Quest", `display: 'standalone'`, `orientation: 'portrait'`, theme/background `#2d1b2e`
  - workbox `globPatterns` covering js, css, html, png, svg, woff2, ogg, mp3, wav, json
- Placeholder icons: generate simple pixel-style 192, 512, and 512-maskable PNGs (a coloured square with "LQ") with a small Node script in `scripts/`, or provide an SVG source. Final icons are the build agent's job.

## 6. Tests
- Vitest: `environment: 'jsdom'` with a setup file that imports jest-dom, and one trivial test at `src/domain/rng.test.ts` (`expect(true).toBe(true)`, marked `// placeholder`).
- Playwright: Pixel 7 device profile with a `webServer` running `npm run build && npm run preview`. `smoke.spec.ts` checks that the page loads, a `canvas` exists, and the "Setup complete" text is visible.

## 7. CI/CD (GitHub Actions)
- `.github/workflows/ci.yml`: runs on push and PR, using Node from `.nvmrc`, `npm ci`, lint, typecheck, test, build. Run e2e in CI as well, after installing Chromium with deps.
- `.github/workflows/deploy.yml`: runs on push to `main` and builds with `VITE_BASE=/<repo-name>/` (use `${{ github.event.repository.name }}`). Deploy with `actions/upload-pages-artifact` + `actions/deploy-pages`.
- `vite.config.ts`: `base: process.env.VITE_BASE ?? '/'`. The PWA `scope` and `start_url` must respect the base.
- **Remote repo via `gh`:** at the end, run `gh auth status`. If you're not logged in, **stop and ask the user** to run `gh auth login` (it's interactive, so don't run it yourself). Then:
  - `gh repo create life-quest --public --source=. --remote=origin --push`. The repo must be public, because free GitHub Pages requires it. If the name is taken, ask the user.
  - Enable Pages with Actions as the source: `gh api -X POST repos/{owner}/life-quest/pages -f build_type=workflow`. If it already exists, use `-X PUT`.
  - Watch the first runs with `gh run watch`. Both CI and deploy must go green. Record the live URL (`https://<owner>.github.io/life-quest/`) in `SETUP_NOTES.md` and the README.

## 8. Assets
- Get the CC0 **Ninja Adventure** asset pack by pixel-boy & AAA (itch.io: `pixel-boy.itch.io/ninja-adventure-asset-pack`). Try the direct download, then a GitHub mirror. If both fail, **stop and ask the user** to put the zip in `life_rpg/.downloads/`.
- Unzip into `.downloads/` (gitignored). Then copy only what's useful into `public/assets/`:
  - `tiles/`: overworld tilesets (grass, paths, houses, trees, water, fences)
  - `characters/`: 6 to 8 character sprite sheets (4 candidates for the player plus NPCs, including an elder/professor-looking one and an innkeeper)
  - `ui/`: dialog/box/heart/icon sprites, if present
  - `music/`: 4 to 6 calm/cozy tracks (one town candidate, one gentle "mentor" candidate) plus 2 or 3 short jingles (victory, level-up-like)
  - `sfx/`: text blip/menu select, confirm, cancel, success/coin, footstep
- Keep the total under ~15 MB. Prefer `.ogg` and add `.mp3` fallbacks only if they're provided.
- `public/assets/CREDITS.md`: pack name, authors, license (CC0), source URL, and a list of which files were copied.
- Add `public/assets/ASSETS.md`: a table with path, what it is, frame size (e.g. 16×16, 4 directions × 4 frames), and the suggested use. **The build agent depends on this file**, so inspect the sprite sheets and record frame layouts accurately.

## 9. Docs & handoff
- `README.md`: what the project is (2 lines), requirements, scripts, how to deploy, and a link to BUILD_PROMPT.md.
- **`SETUP_NOTES.md`** (the handoff for the build agent):
  - installed package versions
  - any deviations from this prompt and why
  - asset status (complete / partial / missing)
  - known issues
  - the remote repo status
  - output of the final verification commands

## 10. Definition of done
All of these pass locally:
```
npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e
```
- `npm run dev` shows a crisp pixel checker, "Life Quest" in Phaser, and the FireRed-style "Setup complete ▼" box on top, on both a phone-sized viewport and desktop.
- The production build includes a manifest and service worker, and Chrome DevTools reports the app as installable.
- Commit with the message `chore: project setup and boilerplate`, push it, and confirm CI and the Pages deploy are green. The live URL must load the placeholder screen.
- No game logic exists anywhere. The placeholder files are still stubs.
