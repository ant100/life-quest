import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Option 2: Cyber Dawn Palette
    // Base: #1B1E38 (Deep Indigo Navy)
    // Secondary: #252A4E (Slate Indigo Card)
    // Frame: #8D72B2 (Dusty Violet)
    // Highlight A: #7BC5EA (Pastel Sky)
    // Highlight B: #F39B9B (Pastel Coral / Peach)
    // Text Accent: #EDF2F7 (Soft Cloud White)

    const colorTileA = 0x222646;
    const colorTileB = 0x181a33;

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

    // Soft dawn grid accent lines (#7bc5ea with gentle opacity)
    graphics.lineStyle(2, 0x7bc5ea, 0.2);
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
    graphics.fillStyle(0x0e0f1d, 0.85);
    graphics.fillRoundedRect(cardX + 8, cardY + 8, cardW, cardH, 16);

    // Card background (#252A4E)
    graphics.fillStyle(0x252a4e, 0.98);
    graphics.fillRoundedRect(cardX, cardY, cardW, cardH, 16);

    // Border (#8d72b2 dusty violet)
    graphics.lineStyle(4, 0x8d72b2, 1);
    graphics.strokeRoundedRect(cardX, cardY, cardW, cardH, 16);

    // Inner subtle highlight border (#7bc5ea pastel sky)
    graphics.lineStyle(2, 0x7bc5ea, 0.5);
    graphics.strokeRoundedRect(cardX + 6, cardY + 6, cardW - 12, cardH - 12, 12);

    // Category badge (#f39b9b pastel coral/peach)
    graphics.fillStyle(0xf39b9b, 1);
    graphics.fillRoundedRect(cardX + 30, cardY + 28, 140, 32, 6);

    const badgeText = this.add.text(cardX + 100, cardY + 44, 'SIDE QUEST', {
      fontFamily: '"Pixelify Sans", sans-serif',
      fontSize: '20px',
      color: '#1b1e38',
      fontStyle: 'bold',
      align: 'center',
    });
    badgeText.setOrigin(0.5);

    // Main Title: LIFE QUEST (#7bc5ea pastel sky with deep shadow)
    const title = this.add.text(width / 2, cardY + 115, 'LIFE QUEST', {
      fontFamily: '"Pixelify Sans", sans-serif',
      fontSize: '54px',
      color: '#7bc5ea',
      fontStyle: 'bold',
      align: 'center',
    });
    title.setOrigin(0.5);
    title.setShadow(4, 4, '#121426', 0, false, true);

    // Subtitle badge text (#f39b9b pastel coral/peach)
    const sub = this.add.text(width / 2, cardY + 175, 'RETRO PIXEL ENGINE READY', {
      fontFamily: '"Pixelify Sans", sans-serif',
      fontSize: '24px',
      color: '#f39b9b',
      fontStyle: 'bold',
      align: 'center',
    });
    sub.setOrigin(0.5);

    // Resolution info tag (#edf2f7 soft cloud white)
    const tag = this.add.text(width / 2, cardY + 218, 'Cyber Dawn Palette [ 640 x 960 ]', {
      fontFamily: '"Pixelify Sans", sans-serif',
      fontSize: '18px',
      color: '#edf2f7',
      align: 'center',
    });
    tag.setOrigin(0.5);
  }
}
