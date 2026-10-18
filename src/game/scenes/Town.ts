import Phaser from 'phaser';
import { audio } from '../../audio/audio';
import { useGameStore } from '../../store/gameStore';
import { eventBus, type Direction } from '../eventBus';
import { GridMovementController } from '../systems/gridMovement';
import {
  directionBetweenPoints,
  findBfsPath,
  type GridPoint,
} from '../systems/pathfinding';

export const TILE_SIZE = 16;
export const MAP_COLS = 22;
export const MAP_ROWS = 24;

export interface InteractableObject {
  id: string;
  tiles: GridPoint[];
  trigger: () => void;
}

/**
 * Generates a Tiled-compatible JSON map structure (.tmj format) for the Town.
 */
export function createTownTiledMapJson() {
  const groundData = new Array(MAP_COLS * MAP_ROWS).fill(1);
  return {
    compressionlevel: -1,
    height: MAP_ROWS,
    infinite: false,
    layers: [
      {
        data: groundData,
        height: MAP_ROWS,
        id: 1,
        name: 'Ground',
        opacity: 1,
        type: 'tilelayer',
        visible: true,
        width: MAP_COLS,
        x: 0,
        y: 0,
      },
    ],
    nextlayerid: 2,
    nextobjectid: 1,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    tiledversion: '1.10.2',
    tileheight: TILE_SIZE,
    tilesets: [
      {
        columns: 22,
        firstgid: 1,
        image: 'tileset_floor.png',
        imageheight: 417,
        imagewidth: 352,
        margin: 0,
        name: 'floor',
        spacing: 0,
        tilecount: 550,
        tileheight: TILE_SIZE,
        tilewidth: TILE_SIZE,
      },
    ],
    tilewidth: TILE_SIZE,
    type: 'map',
    version: '1.10',
    width: MAP_COLS,
  };
}

export class TownScene extends Phaser.Scene {
  private collisionGrid: boolean[][] = [];
  private interactables: InteractableObject[] = [];
  private movement!: GridMovementController;
  private playerSprite!: Phaser.GameObjects.Sprite;
  private playerShadow!: Phaser.GameObjects.Image;
  private targetMarker!: Phaser.GameObjects.Graphics;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys?: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private uiPaused = false;
  private pendingInteraction: (() => void) | null = null;
  private currentSpriteIdx = 0;
  private cleanupBusListeners: (() => void)[] = [];

  constructor() {
    super({ key: 'TownScene' });
  }

  create(): void {
    this.createAnimations();
    this.buildTownWorld();

    const startX = 11;
    const startY = 12;
    this.movement = new GridMovementController(startX, startY, 'down');

    this.currentSpriteIdx = useGameStore.getState().player.sprite ?? 0;

    this.playerShadow = this.add
      .image(
        startX * TILE_SIZE + TILE_SIZE / 2,
        startY * TILE_SIZE + TILE_SIZE - 2,
        'shadow',
      )
      .setDepth(9)
      .setAlpha(0.6);

    this.playerSprite = this.add
      .sprite(
        startX * TILE_SIZE + TILE_SIZE / 2,
        startY * TILE_SIZE + TILE_SIZE / 2,
        `hero-${this.currentSpriteIdx}`,
        0,
      )
      .setDepth(10);

    this.targetMarker = this.add.graphics().setDepth(8);

    // Configure camera for crisp 2x integer pixel scaling
    const worldW = MAP_COLS * TILE_SIZE;
    const worldH = MAP_ROWS * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setZoom(2);
    this.cameras.main.startFollow(this.playerSprite, true, 0.15, 0.15);

    this.setupInputs();
    this.setupBusListeners();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cleanupBusListeners.forEach((fn) => fn());
      this.cleanupBusListeners = [];
    });
  }

  private createAnimations(): void {
    // Ninja Adventure character sheet: 4 columns (0: Down, 1: Up, 2: Left, 3: Right) x 7 rows
    const dirCols: Record<Direction, number> = {
      down: 0,
      up: 1,
      left: 2,
      right: 3,
    };

    for (let s = 0; s < 4; s++) {
      const sheetKey = `hero-${s}`;
      (Object.keys(dirCols) as Direction[]).forEach((dir) => {
        const col = dirCols[dir];
        const animKey = `${sheetKey}-walk-${dir}`;
        if (!this.anims.exists(animKey)) {
          this.anims.create({
            key: animKey,
            frames: [
              { key: sheetKey, frame: col },
              { key: sheetKey, frame: 4 + col },
              { key: sheetKey, frame: 8 + col },
              { key: sheetKey, frame: 12 + col },
            ],
            frameRate: 8,
            repeat: -1,
          });
        }
      });
    }
  }

  private getIdleFrame(dir: Direction): number {
    switch (dir) {
      case 'down':
        return 0;
      case 'up':
        return 1;
      case 'left':
        return 2;
      case 'right':
        return 3;
    }
  }

  private buildTownWorld(): void {
    // Initialize collision grid
    this.collisionGrid = Array.from({ length: MAP_ROWS }, () =>
      new Array<boolean>(MAP_COLS).fill(false),
    );
    this.interactables = [];

    const g = this.add.graphics().setDepth(1);

    // 1. Base grass terrain (cozy GBA-meets-Option-3 twilight meadow)
    for (let y = 0; y < MAP_ROWS; y++) {
      for (let x = 0; x < MAP_COLS; x++) {
        const checker = (x + y) % 2 === 0;
        g.fillStyle(checker ? 0x1e3a3a : 0x1a3335, 1);
        g.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

        // Subtle pixel grass blades
        if ((x * 7 + y * 13) % 5 === 0) {
          g.fillStyle(0x2d5a58, 1);
          g.fillRect(x * TILE_SIZE + 4, y * TILE_SIZE + 5, 2, 3);
          g.fillRect(x * TILE_SIZE + 7, y * TILE_SIZE + 6, 2, 2);
        }
      }
    }

    // 2. Cobblestone paths (Central Plaza + branches to House, Inn, and East Road)
    const drawPathTile = (tx: number, ty: number) => {
      const px = tx * TILE_SIZE;
      const py = ty * TILE_SIZE;
      g.fillStyle(0x3b4d63, 1);
      g.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      g.fillStyle(0x4c637d, 1);
      g.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      g.fillStyle(0x2c3a4d, 1);
      g.fillRect(px + 7, py + 2, 2, 2);
      g.fillRect(px + 3, py + 10, 2, 2);
    };

    // Central plaza (x: 8..14, y: 9..14)
    for (let y = 9; y <= 14; y++) {
      for (let x = 8; x <= 14; x++) {
        drawPathTile(x, y);
      }
    }
    // Path to Your House (x: 4..8, y: 8..10)
    for (let x = 4; x <= 8; x++) {
      drawPathTile(x, 8);
      drawPathTile(x, 9);
    }
    // Path to Inn (x: 14..18, y: 8..10)
    for (let x = 14; x <= 18; x++) {
      drawPathTile(x, 8);
      drawPathTile(x, 9);
    }
    // Path East toward "The Long Road" (x: 15..20, y: 11..12)
    for (let x = 15; x <= 20; x++) {
      drawPathTile(x, 11);
      drawPathTile(x, 12);
    }
    // Path South toward pond garden (x: 10..12, y: 15..18)
    for (let y = 15; y <= 18; y++) {
      drawPathTile(10, y);
      drawPathTile(11, y);
      drawPathTile(12, y);
    }

    // 3. Perimeter trees (with East Road gap at y=11..12)
    const drawTree = (tx: number, ty: number) => {
      this.markBlocked(tx, ty);
      const px = tx * TILE_SIZE;
      const py = ty * TILE_SIZE;
      g.fillStyle(0x0f2429, 1);
      g.fillRect(px + 1, py + 2, 14, 13);
      g.fillStyle(0x1f4e52, 1);
      g.fillRect(px + 2, py + 1, 12, 11);
      g.fillStyle(0x3f6b88, 1);
      g.fillRect(px + 4, py + 2, 8, 5);
    };

    for (let x = 0; x < MAP_COLS; x++) {
      drawTree(x, 0);
      drawTree(x, 1);
      drawTree(x, MAP_ROWS - 2);
      drawTree(x, MAP_ROWS - 1);
    }
    for (let y = 2; y < MAP_ROWS - 2; y++) {
      drawTree(0, y);
      drawTree(1, y);
      if (y !== 11 && y !== 12) {
        drawTree(MAP_COLS - 2, y);
        drawTree(MAP_COLS - 1, y);
      }
    }

    // 4. Serene Pond in South-West (x: 3..6, y: 15..18)
    for (let y = 15; y <= 18; y++) {
      for (let x = 3; x <= 6; x++) {
        this.markBlocked(x, y);
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        g.fillStyle(0x1b466b, 1);
        g.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        g.fillStyle(0x88e2db, 0.35);
        g.fillRect(px + 3, py + 6, 8, 2);
      }
    }

    // 5. Building 1: YOUR HOUSE (x: 3..6, y: 4..7)
    this.drawBuilding(g, {
      startX: 3,
      startY: 4,
      widthTiles: 4,
      heightTiles: 4,
      roofColor: 0x3f6b88,
      roofHighlight: 0x88e2db,
      wallColor: 0xe2e8f0,
      doorX: 4,
    });
    const houseTiles: GridPoint[] = [];
    for (let y = 4; y <= 7; y++) {
      for (let x = 3; x <= 6; x++) {
        this.markBlocked(x, y);
        houseTiles.push({ x, y });
      }
    }
    this.interactables.push({
      id: 'house',
      tiles: houseTiles,
      trigger: () => eventBus.emit('interact:house', undefined),
    });

    // 6. Building 2: THE HEARTHSTONE INN (x: 15..18, y: 4..7)
    this.drawBuilding(g, {
      startX: 15,
      startY: 4,
      widthTiles: 4,
      heightTiles: 4,
      roofColor: 0x6b4c7a,
      roofHighlight: 0xc2a0d9,
      wallColor: 0xfef3c7,
      doorX: 16,
    });
    const innTiles: GridPoint[] = [];
    for (let y = 4; y <= 7; y++) {
      for (let x = 15; x <= 18; x++) {
        this.markBlocked(x, y);
        innTiles.push({ x, y });
      }
    }
    this.interactables.push({
      id: 'inn',
      tiles: innTiles,
      trigger: () => eventBus.emit('interact:inn', undefined),
    });

    // 7. Central Plaza QUEST BOARD (x: 11, y: 10)
    this.markBlocked(11, 10);
    const bx = 11 * TILE_SIZE;
    const by = 10 * TILE_SIZE;
    // Wooden sign frame + pinned parchment scrolls
    g.fillStyle(0x5c3a21, 1);
    g.fillRect(bx + 1, by + 2, 14, 11);
    g.fillRect(bx + 3, by + 13, 2, 3);
    g.fillRect(bx + 11, by + 13, 2, 3);
    g.fillStyle(0x88e2db, 1);
    g.fillRect(bx + 2, by + 1, 12, 2);
    g.fillStyle(0xfdfbf7, 1);
    g.fillRect(bx + 3, by + 4, 4, 5);
    g.fillRect(bx + 9, by + 4, 4, 6);
    this.interactables.push({
      id: 'board',
      tiles: [{ x: 11, y: 10 }],
      trigger: () => eventBus.emit('interact:board', undefined),
    });

    // 8. Locked East Road Barricade & Sign ("The Long Road (coming soon)")
    this.markBlocked(20, 11);
    this.markBlocked(20, 12);
    for (const ry of [11, 12]) {
      const rx = 20 * TILE_SIZE;
      const rpy = ry * TILE_SIZE;
      g.fillStyle(0x5c3a21, 1);
      g.fillRect(rx + 4, rpy + 2, 8, 12);
      g.fillStyle(0xc2a0d9, 1);
      g.fillRect(rx + 5, rpy + 4, 6, 4);
    }
    this.interactables.push({
      id: 'east-road-sign',
      tiles: [
        { x: 20, y: 11 },
        { x: 20, y: 12 },
      ],
      trigger: () =>
        eventBus.emit('interact:sign', {
          title: 'East Gate Signpost',
          text: 'The Long Road (coming soon) — Complete your epic chains to prepare for the grand expedition beyond town.',
        }),
    });

    // 9. Decorative Town NPCs (3 friendly villagers with one-line wisdom)
    this.spawnNpc({
      id: 'npc-rowan',
      spriteKey: 'npc-master',
      tileX: 9,
      tileY: 11,
      name: 'Professor Rowan',
      text: 'Your life is the adventure. The game just keeps score.',
    });

    this.spawnNpc({
      id: 'npc-mira',
      spriteKey: 'npc-woman',
      tileX: 14,
      tileY: 13,
      name: 'Villager Mira',
      text: 'Boredom is where ideas hatch. Try leaving your phone in another room for an hour!',
    });

    this.spawnNpc({
      id: 'npc-elder',
      spriteKey: 'npc-elder',
      tileX: 7,
      tileY: 9,
      name: 'Elder Kael',
      text: 'Even a 10-minute walk counts. Days Adventured never resets—every single day you show up stays with you forever.',
    });
  }

  private drawBuilding(
    g: Phaser.GameObjects.Graphics,
    cfg: {
      startX: number;
      startY: number;
      widthTiles: number;
      heightTiles: number;
      roofColor: number;
      roofHighlight: number;
      wallColor: number;
      doorX: number;
    },
  ): void {
    const px = cfg.startX * TILE_SIZE;
    const py = cfg.startY * TILE_SIZE;
    const w = cfg.widthTiles * TILE_SIZE;
    const h = cfg.heightTiles * TILE_SIZE;
    const roofH = TILE_SIZE * 2;

    // Shadow
    g.fillStyle(0x0a121e, 0.55);
    g.fillRect(px + 2, py + 4, w, h);

    // Walls
    g.fillStyle(cfg.wallColor, 1);
    g.fillRect(px + 2, py + roofH, w - 4, h - roofH);

    // Roof
    g.fillStyle(cfg.roofColor, 1);
    g.fillRect(px, py, w, roofH + 2);
    g.fillStyle(cfg.roofHighlight, 1);
    g.fillRect(px + 2, py + 2, w - 4, 4);

    // Door
    const doorPx = cfg.doorX * TILE_SIZE + 2;
    const doorPy = (cfg.startY + cfg.heightTiles - 1) * TILE_SIZE + 2;
    g.fillStyle(0x3b2314, 1);
    g.fillRect(doorPx, doorPy, 12, 14);
    g.fillStyle(0xf6c86a, 1);
    g.fillRect(doorPx + 9, doorPy + 7, 2, 2);

    // Glowing Window
    const winPx = px + w - 18;
    const winPy = py + roofH + 6;
    g.fillStyle(0x101c2e, 1);
    g.fillRect(winPx, winPy, 10, 10);
    g.fillStyle(0x88e2db, 0.9);
    g.fillRect(winPx + 1, winPy + 1, 8, 8);
  }

  private spawnNpc(cfg: {
    id: string;
    spriteKey: string;
    tileX: number;
    tileY: number;
    name: string;
    text: string;
  }): void {
    this.markBlocked(cfg.tileX, cfg.tileY);
    this.add
      .image(
        cfg.tileX * TILE_SIZE + TILE_SIZE / 2,
        cfg.tileY * TILE_SIZE + TILE_SIZE - 2,
        'shadow',
      )
      .setDepth(8)
      .setAlpha(0.5);

    this.add
      .sprite(
        cfg.tileX * TILE_SIZE + TILE_SIZE / 2,
        cfg.tileY * TILE_SIZE + TILE_SIZE / 2,
        cfg.spriteKey,
        0,
      )
      .setDepth(9);

    this.interactables.push({
      id: cfg.id,
      tiles: [{ x: cfg.tileX, y: cfg.tileY }],
      trigger: () =>
        eventBus.emit('interact:npc', {
          name: cfg.name,
          text: cfg.text,
        }),
    });
  }

  private markBlocked(x: number, y: number): void {
    if (this.collisionGrid[y]) {
      this.collisionGrid[y]![x] = true;
    }
  }

  private findInteractableAt(x: number, y: number): InteractableObject | undefined {
    return this.interactables.find((obj) =>
      obj.tiles.some((t) => t.x === x && t.y === y),
    );
  }

  private isAdjacentToInteractable(obj: InteractableObject): boolean {
    const pos = this.movement.getPosition();
    return obj.tiles.some(
      (t) => Math.abs(t.x - pos.x) + Math.abs(t.y - pos.y) === 1,
    );
  }

  private setupInputs(): void {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };

      this.input.keyboard.on('keydown-SPACE', () => {
        if (!this.uiPaused) this.interactWithFacingTile();
      });
      this.input.keyboard.on('keydown-ENTER', () => {
        if (!this.uiPaused) this.interactWithFacingTile();
      });
    }

    // Tap-to-walk or tap-to-interact on canvas
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.uiPaused) return;
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const tx = Math.floor(worldPoint.x / TILE_SIZE);
      const ty = Math.floor(worldPoint.y / TILE_SIZE);
      if (tx < 0 || ty < 0 || tx >= MAP_COLS || ty >= MAP_ROWS) return;

      const tappedInteractable = this.findInteractableAt(tx, ty);
      if (tappedInteractable && this.isAdjacentToInteractable(tappedInteractable)) {
        const pos = this.movement.getPosition();
        this.movement.facing = directionBetweenPoints(pos, { x: tx, y: ty });
        this.updateIdleFrame();
        tappedInteractable.trigger();
        return;
      }

      const path = findBfsPath(
        this.collisionGrid,
        this.movement.getPosition(),
        { x: tx, y: ty },
      );

      if (path.length > 0) {
        this.movement.setPath(path);
        this.pendingInteraction = tappedInteractable
          ? () => tappedInteractable.trigger()
          : null;
        const dest = path[path.length - 1]!;
        this.drawTargetHighlight(dest.x, dest.y);
      } else if (tappedInteractable) {
        tappedInteractable.trigger();
      }
    });
  }

  private drawTargetHighlight(tx: number, ty: number): void {
    this.targetMarker.clear();
    this.targetMarker.lineStyle(1, 0x88e2db, 0.85);
    this.targetMarker.strokeRect(
      tx * TILE_SIZE + 2,
      ty * TILE_SIZE + 2,
      TILE_SIZE - 4,
      TILE_SIZE - 4,
    );
  }

  private setupBusListeners(): void {
    this.cleanupBusListeners.push(
      eventBus.on('ui:open', () => {
        this.uiPaused = true;
        this.movement.clearPath();
        this.targetMarker.clear();
      }),
      eventBus.on('ui:close', () => {
        this.uiPaused = false;
        const latestSprite = useGameStore.getState().player.sprite ?? 0;
        if (latestSprite !== this.currentSpriteIdx) {
          this.currentSpriteIdx = latestSprite;
          this.updateIdleFrame();
        }
      }),
      eventBus.on('dpad:move', (dir) => {
        if (this.uiPaused) return;
        this.movement.clearPath();
        this.pendingInteraction = null;
        this.startDirectionalStep(dir);
      }),
      eventBus.on('dpad:action', () => {
        if (this.uiPaused) return;
        this.interactWithFacingTile();
      }),
    );
  }

  private interactWithFacingTile(): void {
    const facingTile = this.movement.getFacingTile();
    const target = this.findInteractableAt(facingTile.x, facingTile.y);
    if (target) {
      target.trigger();
      return;
    }
    // Also check if standing directly adjacent to any interactable
    const adjacent = this.interactables.find((obj) =>
      this.isAdjacentToInteractable(obj),
    );
    if (adjacent) {
      adjacent.trigger();
    }
  }

  private updateIdleFrame(): void {
    this.playerSprite.anims.stop();
    this.playerSprite.setTexture(
      `hero-${this.currentSpriteIdx}`,
      this.getIdleFrame(this.movement.facing),
    );
  }

  private startDirectionalStep(dir: Direction): void {
    const nextTile = this.movement.tryStepDirection(dir, this.collisionGrid);
    if (!nextTile) {
      this.updateIdleFrame();
      return;
    }
    this.animateStepTo(nextTile);
  }

  private animateStepTo(dest: GridPoint): void {
    const animKey = `hero-${this.currentSpriteIdx}-walk-${this.movement.facing}`;
    this.playerSprite.play(animKey, true);
    audio.playSfx('step');

    const targetX = dest.x * TILE_SIZE + TILE_SIZE / 2;
    const targetY = dest.y * TILE_SIZE + TILE_SIZE / 2;

    this.tweens.add({
      targets: this.playerSprite,
      x: targetX,
      y: targetY,
      duration: 150,
      ease: 'Linear',
      onUpdate: () => {
        this.playerShadow.setPosition(
          this.playerSprite.x,
          this.playerSprite.y + TILE_SIZE / 2 - 2,
        );
      },
      onComplete: () => {
        this.movement.completeStep();
        if (!this.movement.hasQueuedSteps()) {
          this.targetMarker.clear();
          this.updateIdleFrame();
          if (this.pendingInteraction) {
            const fn = this.pendingInteraction;
            this.pendingInteraction = null;
            fn();
          }
        }
      },
    });
  }

  update(): void {
    if (this.uiPaused || this.movement.isMoving) {
      return;
    }

    // Check keyboard directional input first
    let heldDir: Direction | null = null;
    if (this.cursors?.up.isDown || this.wasdKeys?.W.isDown) {
      heldDir = 'up';
    } else if (this.cursors?.down.isDown || this.wasdKeys?.S.isDown) {
      heldDir = 'down';
    } else if (this.cursors?.left.isDown || this.wasdKeys?.A.isDown) {
      heldDir = 'left';
    } else if (this.cursors?.right.isDown || this.wasdKeys?.D.isDown) {
      heldDir = 'right';
    }

    if (heldDir) {
      this.movement.clearPath();
      this.pendingInteraction = null;
      this.targetMarker.clear();
      this.startDirectionalStep(heldDir);
      return;
    }

    // Otherwise process queued BFS tap-to-walk steps
    const nextQueued = this.movement.popNextQueuedStep(this.collisionGrid);
    if (nextQueued) {
      this.animateStepTo(nextQueued);
    }
  }
}
