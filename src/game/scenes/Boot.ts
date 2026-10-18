import Phaser from 'phaser';

const BASE = import.meta.env.BASE_URL || '/';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Load 4 playable hero spritesheets (64x112, 16x16 frames)
    this.load.spritesheet('hero-0', `${BASE}assets/characters/ninja_blue.png`, {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('hero-1', `${BASE}assets/characters/samurai_blue.png`, {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('hero-2', `${BASE}assets/characters/samurai_green.png`, {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('hero-3', `${BASE}assets/characters/boy.png`, {
      frameWidth: 16,
      frameHeight: 16,
    });

    // Load NPC spritesheets
    this.load.spritesheet('npc-master', `${BASE}assets/characters/master.png`, {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('npc-elder', `${BASE}assets/characters/old_man.png`, {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('npc-woman', `${BASE}assets/characters/woman.png`, {
      frameWidth: 16,
      frameHeight: 16,
    });
    this.load.spritesheet('npc-villager', `${BASE}assets/characters/villager.png`, {
      frameWidth: 16,
      frameHeight: 16,
    });

    this.load.image('shadow', `${BASE}assets/characters/shadow.png`);
    this.load.image('tileset-floor', `${BASE}assets/tiles/tileset_floor.png`);
    this.load.image(
      'tileset-village',
      `${BASE}assets/tiles/tileset_village_abandoned.png`,
    );
  }

  create(): void {
    this.scene.start('TownScene');
  }
}
