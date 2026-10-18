# Life Quest

A mobile-first, installable pixel RPG (PWA) inspired by GBA Pokémon classics (FireRed style) where your real-life goals are side quests. Designed for mindful digital detox, gentle habit formation, and gradual financial well-being.

## Prerequisites
- Node.js >= 22 (tested on Node 24 via `.nvmrc`)
- npm >= 10

## Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Run unit tests
npm test

# Run e2e tests
npm run test:e2e

# Build for production
npm run build
```

## Game Architecture & Implementation
The core gameplay implementation is governed by [BUILD_PROMPT.md](./BUILD_PROMPT.md).
Setup and boilerplate verification are recorded in [SETUP_NOTES.md](./SETUP_NOTES.md).
Asset mappings and frame specs are documented in [public/assets/ASSETS.md](./public/assets/ASSETS.md).

## Deployment
Automated deployment to GitHub Pages is configured via `.github/workflows/deploy.yml`. Pushes to `main` automatically build and publish the live web app.
