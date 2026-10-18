import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Cyberpunk grid palette: deep tech navy + cyan grid lines
    const graphics = this.add.graphics();
    const tileSize = 16;
    const colorBg = 0x070e20; // Deep midnight navy
    const colorGrid = 0x0d1a38; // Subtle digital grid contrast

    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        const isEven = (x / tileSize + y / tileSize) % 2 === 0;
        graphics.fillStyle(isEven ? colorBg : colorGrid, 1);
        graphics.fillRect(x, y, tileSize, tileSize);
      }
    }

    // Neon accent lines (Cyberpunk neon blue / cyan grid highlights)
    graphics.lineStyle(1, 0x00f0ff, 0.25);
    for (let x = 0; x <= width; x += tileSize * 2) {
      graphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += tileSize * 2) {
      graphics.lineBetween(0, y, width, y);
    }

    // High-contrast central tech badge
    // Deep backing box
    graphics.fillStyle(0x050b18, 0.95);
    graphics.fillRect(width / 2 - 70, height / 2 - 42, 140, 68);

    // Neon Cyan border
    graphics.lineStyle(1.5, 0x00f0ff, 0.9);
    graphics.strokeRect(width / 2 - 70, height / 2 - 42, 140, 68);

    // Cyber Yellow corner notches
    graphics.fillStyle(0xfcee0a, 1);
    graphics.fillRect(width / 2 - 70, height / 2 - 42, 6, 6);
    graphics.fillRect(width / 2 + 64, height / 2 + 20, 6, 6);

    // Main Logo Text (Pixel art font, bold with shadow)
    const title = this.add.text(width / 2, height / 2 - 20, 'LIFE QUEST', {
      fontFamily: '"Pixelify Sans", monospace',
      fontSize: '20px',
      color: '#fcee0a', // Cyber Yellow
      fontStyle: 'bold',
      align: 'center',
    });
    title.setOrigin(0.5);
    title.setShadow(2, 2, '#000000', 0, false, true);

    // Subtitle badge text
    const sub = this.add.text(width / 2, height / 2 + 4, 'NEON CITY ENGINE', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#00f0ff', // Cyber Cyan
      fontStyle: 'bold',
      align: 'center',
    });
    sub.setOrigin(0.5);

    // Clear resolution tag
    const res = this.add.text(width / 2, height / 2 + 16, '[ 160 x 240 PIXELS ]', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#ffffff',
      align: 'center',
    });
    res.setOrigin(0.5);
  }
}
