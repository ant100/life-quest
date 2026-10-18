import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Background tile grid (The canvas is strictly for game world pixel art graphics!)
    // Palette: #1B1E38 (Indigo Navy), #222646 / #181a33 tile blocks
    const colorTileA = 0x222646;
    const colorTileB = 0x181a33;

    const graphics = this.add.graphics();
    const tileSize = 20;

    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        const isEven = (x / tileSize + y / tileSize) % 2 === 0;
        graphics.fillStyle(isEven ? colorTileA : colorTileB, 1);
        graphics.fillRect(x, y, tileSize, tileSize);
      }
    }

    // Soft aesthetic grid accent lines (#7bc5ea)
    graphics.lineStyle(1, 0x7bc5ea, 0.2);
    for (let x = 0; x <= width; x += tileSize * 3) {
      graphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += tileSize * 3) {
      graphics.lineBetween(0, y, width, y);
    }

    // Notice: NO TEXT in canvas. All text and UI cards are rendered as crisp HTML/CSS in React!
  }
}
