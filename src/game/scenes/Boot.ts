import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Palette:
    // #1B1E38 (Indigo Navy), #252A4E (Card Slate), #8D72B2 (Dusty Violet), #7BC5EA (Pastel Sky), #F39B9B (Pastel Coral)
    const colorTileA = 0x222646;
    const colorTileB = 0x181a33;

    // Retro-feel checkerboard grid
    const graphics = this.add.graphics();
    const tileSize = 20;

    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        const isEven = (x / tileSize + y / tileSize) % 2 === 0;
        graphics.fillStyle(isEven ? colorTileA : colorTileB, 1);
        graphics.fillRect(x, y, tileSize, tileSize);
      }
    }

    // Gentle grid lines
    graphics.lineStyle(1, 0x7bc5ea, 0.2);
    for (let x = 0; x <= width; x += tileSize * 3) {
      graphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += tileSize * 3) {
      graphics.lineBetween(0, y, width, y);
    }

    // Center Hero Badge
    const cardW = 300;
    const cardH = 200;
    const cardX = width / 2 - cardW / 2;
    const cardY = height / 2 - cardH / 2 - 30;

    // Card shadow
    graphics.fillStyle(0x0e0f1d, 0.7);
    graphics.fillRoundedRect(cardX + 6, cardY + 6, cardW, cardH, 14);

    // Card body (#252A4E)
    graphics.fillStyle(0x252a4e, 0.98);
    graphics.fillRoundedRect(cardX, cardY, cardW, cardH, 14);

    // Card border (#8D72B2)
    graphics.lineStyle(3, 0x8d72b2, 1);
    graphics.strokeRoundedRect(cardX, cardY, cardW, cardH, 14);

    // Inner highlight (#7BC5EA)
    graphics.lineStyle(1.5, 0x7bc5ea, 0.5);
    graphics.strokeRoundedRect(cardX + 4, cardY + 4, cardW - 8, cardH - 8, 10);

    // Pill badge (#F39B9B)
    graphics.fillStyle(0xf39b9b, 1);
    graphics.fillRoundedRect(cardX + 20, cardY + 20, 105, 24, 6);

    const badgeText = this.add.text(cardX + 72, cardY + 32, 'SIDE QUEST', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '12px',
      color: '#1b1e38',
      fontStyle: 'bold',
      align: 'center',
    });
    badgeText.setOrigin(0.5);

    // Title: LIFE QUEST (using Plus Jakarta Sans, large and super sharp)
    const title = this.add.text(width / 2, cardY + 86, 'LIFE QUEST', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '34px',
      color: '#7bc5ea',
      fontStyle: '800',
      align: 'center',
    });
    title.setOrigin(0.5);
    title.setShadow(0, 3, '#121426', 4, false, true);

    // Subtitle text (#F39B9B)
    const sub = this.add.text(width / 2, cardY + 130, 'Retro Pixel Engine Ready', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '15px',
      color: '#f39b9b',
      fontStyle: '700',
      align: 'center',
    });
    sub.setOrigin(0.5);

    // Aspect ratio info tag
    const tag = this.add.text(width / 2, cardY + 162, 'Modern 9:16 Mobile Aspect', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '12px',
      color: '#edf2f7',
      align: 'center',
    });
    tag.setOrigin(0.5);
  }
}
