import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Draw a 16x16 2-color checkerboard background pattern to prove crisp pixel scaling
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

    // Text label rendered cleanly in Phaser
    this.add
      .text(width / 2, height / 2 - 20, 'Life Quest', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#f0e6cf',
        align: 'center',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 10, '160x240 Pixel Scale', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#9c8c9e',
        align: 'center',
      })
      .setOrigin(0.5);
  }
}
