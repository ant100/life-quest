import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Palette:
    // #5c58b6 (Indigo Violet), #b957ce (Magenta/Purple), #5994ce (Sky Blue), #3a4e93 (Deep Navy Blue)
    const colorBg = 0x1b2042;
    const colorTileA = 0x222852;
    const colorTileB = 0x181c3b;

    // Render 32px virtual blocks (crisp 2x scaling of 16px retro tiles)
    const graphics = this.add.graphics();
    const tileSize = 32;

    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        const isEven = (x / tileSize + y / tileSize) % 2 === 0;
        graphics.fillStyle(isEven ? colorTileA : colorTileB, 1);
        graphics.fillRect(x, y, tileSize, tileSize);
      }
    }

    // Grid accent lines (#5994ce with soft opacity)
    graphics.lineStyle(2, 0x5994ce, 0.25);
    for (let x = 0; x <= width; x += tileSize * 2) {
      graphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += tileSize * 2) {
      graphics.lineBetween(0, y, width, y);
    }

    // Central card container (High resolution vector card)
    const cardW = 500;
    const cardH = 260;
    const cardX = width / 2 - cardW / 2;
    const cardY = height / 2 - cardH / 2 - 40;

    // Outer shadow
    graphics.fillStyle(0x0e1124, 0.85);
    graphics.fillRoundedRect(cardX + 8, cardY + 8, cardW, cardH, 16);

    // Card background
    graphics.fillStyle(colorBg, 0.98);
    graphics.fillRoundedRect(cardX, cardY, cardW, cardH, 16);

    // Border (#5c58b6)
    graphics.lineStyle(4, 0x5c58b6, 1);
    graphics.strokeRoundedRect(cardX, cardY, cardW, cardH, 16);

    // Inner highlight border (#5994ce)
    graphics.lineStyle(2, 0x5994ce, 0.6);
    graphics.strokeRoundedRect(cardX + 6, cardY + 6, cardW - 12, cardH - 12, 12);

    // Category badge (#b957ce)
    graphics.fillStyle(0xb957ce, 1);
    graphics.fillRoundedRect(cardX + 30, cardY + 28, 140, 32, 6);

    const badgeText = this.add.text(cardX + 100, cardY + 44, 'SIDE QUEST', {
      fontFamily: '"Pixelify Sans", sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
    });
    badgeText.setOrigin(0.5);

    // Main Title: LIFE QUEST (using #ffffff with #b957ce neon drop shadow)
    const title = this.add.text(width / 2, cardY + 115, 'LIFE QUEST', {
      fontFamily: '"Pixelify Sans", sans-serif',
      fontSize: '54px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
    });
    title.setOrigin(0.5);
    title.setShadow(4, 4, '#3a4e93', 0, false, true);

    // Subtitle badge text (#5994ce)
    const sub = this.add.text(width / 2, cardY + 175, 'RETRO PIXEL ENGINE READY', {
      fontFamily: '"Pixelify Sans", sans-serif',
      fontSize: '26px',
      color: '#5994ce',
      fontStyle: 'bold',
      align: 'center',
    });
    sub.setOrigin(0.5);

    // Resolution info tag (#b957ce)
    const tag = this.add.text(width / 2, cardY + 218, 'High-DPI Canvas [ 640 x 960 ]', {
      fontFamily: '"Pixelify Sans", sans-serif',
      fontSize: '20px',
      color: '#b957ce',
      align: 'center',
    });
    tag.setOrigin(0.5);
  }
}
