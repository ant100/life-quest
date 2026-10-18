import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Option 3 Palette:
    // Base: #101C2E (Abyss Navy)
    // Tiles: #15243b / #0d1624
    // Accents: #3F6B88 (Steel Teal), #88E2DB (Pastel Cyan / Ice), #C2A0D9 (Soft Lilac)
    const colorTileA = 0x15243b;
    const colorTileB = 0x0d1624;

    const graphics = this.add.graphics();
    const tileSize = 20;

    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        const isEven = (x / tileSize + y / tileSize) % 2 === 0;
        graphics.fillStyle(isEven ? colorTileA : colorTileB, 1);
        graphics.fillRect(x, y, tileSize, tileSize);
      }
    }

    // Soft serene grid accent lines (#88e2db)
    graphics.lineStyle(1, 0x88e2db, 0.18);
    for (let x = 0; x <= width; x += tileSize * 3) {
      graphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += tileSize * 3) {
      graphics.lineBetween(0, y, width, y);
    }
  }
}
