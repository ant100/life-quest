import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Option 1: Lo-Fi Midnight Palette
    // Base: #16192B (Midnight Slate)
    // Secondary: #20243D (Deep Slate Card)
    // Frame: #5B6C9A (Slate Blue)
    // Highlight A: #7DE2D1 (Powder Mint)
    // Highlight B: #D8A7CA (Pastel Lavender/Rose)
    // Text Accent: #F5F0BB (Warm Cream)

    const colorTileA = 0x1d2138;
    const colorTileB = 0x141727;

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

    // Soft grid accent lines (#7de2d1 with gentle opacity)
    graphics.lineStyle(2, 0x7de2d1, 0.18);
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
    graphics.fillStyle(0x0c0e17, 0.85);
    graphics.fillRoundedRect(cardX + 8, cardY + 8, cardW, cardH, 16);

    // Card background (#20243D)
    graphics.fillStyle(0x20243d, 0.98);
    graphics.fillRoundedRect(cardX, cardY, cardW, cardH, 16);

    // Border (#5b6c9a)
    graphics.lineStyle(4, 0x5b6c9a, 1);
    graphics.strokeRoundedRect(cardX, cardY, cardW, cardH, 16);

    // Inner subtle highlight border (#7de2d1)
    graphics.lineStyle(2, 0x7de2d1, 0.5);
    graphics.strokeRoundedRect(cardX + 6, cardY + 6, cardW - 12, cardH - 12, 12);

    // Category badge (#d8a7ca pastel lavender/rose)
    graphics.fillStyle(0xd8a7ca, 1);
    graphics.fillRoundedRect(cardX + 30, cardY + 28, 140, 32, 6);

    const badgeText = this.add.text(cardX + 100, cardY + 44, 'SIDE QUEST', {
      fontFamily: '"Pixelify Sans", sans-serif',
      fontSize: '20px',
      color: '#16192b',
      fontStyle: 'bold',
      align: 'center',
    });
    badgeText.setOrigin(0.5);

    // Main Title: LIFE QUEST (#7de2d1 powder mint with deep shadow)
    const title = this.add.text(width / 2, cardY + 115, 'LIFE QUEST', {
      fontFamily: '"Pixelify Sans", sans-serif',
      fontSize: '54px',
      color: '#7de2d1',
      fontStyle: 'bold',
      align: 'center',
    });
    title.setOrigin(0.5);
    title.setShadow(4, 4, '#10121f', 0, false, true);

    // Subtitle badge text (#f5f0bb warm cream)
    const sub = this.add.text(width / 2, cardY + 175, 'RETRO PIXEL ENGINE READY', {
      fontFamily: '"Pixelify Sans", sans-serif',
      fontSize: '24px',
      color: '#f5f0bb',
      fontStyle: 'bold',
      align: 'center',
    });
    sub.setOrigin(0.5);

    // Resolution info tag (#d8a7ca)
    const tag = this.add.text(width / 2, cardY + 218, 'Lo-Fi Midnight Palette [ 640 x 960 ]', {
      fontFamily: '"Pixelify Sans", sans-serif',
      fontSize: '18px',
      color: '#d8a7ca',
      align: 'center',
    });
    tag.setOrigin(0.5);
  }
}
