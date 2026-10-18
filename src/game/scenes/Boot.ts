import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Draw a 16x16 2-color checkerboard background pattern
    const graphics = this.add.graphics();
    const tileSize = 16;
    const colorA = 0x241829;
    const colorB = 0x2d1b2e;

    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        const isEven = (x / tileSize + y / tileSize) % 2 === 0;
        graphics.fillStyle(isEven ? colorA : colorB, 1);
        graphics.fillRect(x, y, tileSize, tileSize);
      }
    }

    // Centered retro emblem / badge
    graphics.fillStyle(0x3d2640, 0.9);
    graphics.fillRoundedRect(width / 2 - 68, height / 2 - 36, 136, 72, 8);
    graphics.lineStyle(2, 0xd84828, 1);
    graphics.strokeRoundedRect(width / 2 - 68, height / 2 - 36, 136, 72, 8);

    // Title using bitmap/pixel styled rendering with shadow
    const title = this.add.text(width / 2, height / 2 - 14, 'LIFE QUEST', {
      fontFamily: '"Pixelify Sans", monospace',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
    });
    title.setOrigin(0.5);
    title.setShadow(1, 1, '#110614', 0, false, true);

    // Clear, bold subtitle badge
    const sub = this.add.text(width / 2, height / 2 + 12, '160 x 240 Scale', {
      fontFamily: '"Pixelify Sans", monospace',
      fontSize: '12px',
      color: '#ffcb05',
      fontStyle: 'bold',
      align: 'center',
    });
    sub.setOrigin(0.5);
    sub.setShadow(1, 1, '#110614', 0, false, true);
  }
}
