# Life Quest

> *"Your life is the adventure. The game just keeps score."*

**Life Quest** is a mobile-first, installable pixel-art RPG Progressive Web App (PWA) inspired by GBA classics (*Pokémon FireRed*) where your real-life goals are side quests. Built for people who want calm, guilt-free momentum across digital detox, health, personal growth, and financial well-being—with zero streak shaming, zero feeds, and zero dark patterns.

**Live App:** [https://ant100.github.io/life-quest/](https://ant100.github.io/life-quest/)

---

## Key Features (P0)

- **≤ 60-Second Onboarding:** Meet Professor Rowan, pick your name, choose 1 of 4 pixel-art sprites, share how you've been feeling, select your focus areas, and automatically receive 3 starter quests tailored to your energy.
- **≤ 3-Tap Quest Logging:** Tap **📜 Quests** in the top HUD from anywhere → tap **Done ✓** on a quest card → enjoy the celebratory reward sequence (variable Critical Hit / Lucky Find rolls, animated EXP bar, stat rises, level-up fanfare, badge unlocks, and a warm nudge to put your phone away).
- **Walkable Top-Down Pixel Town:**
  - **Tap-to-Walk (BFS Pathfinding)** on mobile, optional on-screen **D-Pad + A button**, or **Arrow Keys / WASD + Space/Enter** on desktop.
  - **Town Quest Board:** 3 deterministic daily suggestions weighted by your focus categories, 1 free reroll per day, custom quest creator, and 4 built-in Epic Quest Chains (*Gold Pouch*, *The Long Walk*, *Career Growth*, *Study Program*).
  - **Your House:** View your Level, 4 core stats (*Body*, *Mind*, *Spirit*, *Wealth*), cumulative **Days Adventured** (which never resets), all **8 Guild Badges**, and your completed quest chronicle.
  - **The Hearthstone Inn:** Claim a warm **Welcome-Back Rest Bonus** when returning after 2+ days away, adjust Music & SFX volumes, rename your adventurer, export/import your full save file, or merge in custom **Quest Packs**.
- **Installable Offline PWA:** Full service worker precaching (including chiptune music and 16-bit sound effects) powered by `vite-plugin-pwa`.

---

## How to Import a Quest Pack (e.g. `seeds/ann.json`)

You can add personal quests and multi-step epic chains at any time without resetting your existing level or progress:

1. Open **Life Quest** and enter **The Hearthstone Inn** (either walk up to the purple-roofed Inn in the northeast of town and press **A**/tap it, or tap **🏮 Inn** in the quick-travel bar at the bottom).
2. Scroll to the **📦 Save File & Quest Packs** card.
3. Tap **📂 Import JSON File** and select [`seeds/ann.json`](./seeds/ann.json) (or tap **📋 Or Paste QuestPack / Save JSON** and paste the JSON contents).
4. The Innkeeper immediately merges the pack into your adventure:
   - Adds the **Road to Santiago** (10-step pilgrimage chain) and **Get Promoted** (6-step career growth chain) to your **Epics** tab (unlocking step 1 of each in your active quest log).
   - Adds the weekly **Master's study session (1 h)** quest to your **Active** tab.
   - Preserves all of your current Level, EXP, Gold, Badges, and Days Adventured.

### Custom QuestPack JSON Format

```json
{
  "packVersion": 1,
  "name": "My Custom Pack",
  "quests": [
    {
      "id": "custom-weekly-study",
      "title": "Master's study session (1 h)",
      "category": "personal",
      "difficulty": 2,
      "recurrence": "weekly",
      "stats": { "mind": 2 },
      "flavor": "Candlelight flickers over the scholar's desk."
    }
  ],
  "chains": [
    {
      "id": "custom-chain-1",
      "title": "Road to Santiago",
      "steps": [
        {
          "id": "step-1",
          "title": "5 km walk",
          "category": "body",
          "difficulty": 1,
          "recurrence": "once",
          "stats": { "body": 1 }
        }
      ]
    }
  ]
}
```

---

## Development & Verification

### Prerequisites
- Node.js >= 22 (tested on Node 24 via `.nvmrc`)
- npm >= 10

### Commands

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run ESLint & TypeScript strict typecheck
npm run lint
npm run typecheck

# Run Vitest unit & component test suite
npm test

# Build production PWA bundle
npm run build

# Run Playwright mobile-viewport E2E smoke test
npm run test:e2e
```

## Credits
All pixel-art tilesets, character spritesheets, chiptune music tracks, and 16-bit SFX are CC0 Public Domain from the **Ninja Adventure** asset pack by **pixel-boy and AAA**. See [public/assets/CREDITS.md](./public/assets/CREDITS.md) and [public/assets/ASSETS.md](./public/assets/ASSETS.md) for details.
