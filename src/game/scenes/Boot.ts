import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Palette:
    // #D68FBC, #935D7E, #53A0C4, #AFD7FA, #042F40, #051C30, #0F1026
    const colorBg = 0x051c30;
    const colorTileA = 0x042f40;
    const colorTileB = 0x072238;

    // Render pixel grid at 32px virtual blocks (crisp 2x scaling of 16px retro tiles)
    const graphics = this.add.graphics();
    const tileSize = 32;

    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        const isEven = (x / tileSize + y / tileSize) % 2 === 0;
        graphics.fillStyle(isEven ? colorTileA : colorTileB, 1);
        graphics.fillRect(x, y, tileSize, tileSize);
      }
    }

    // Grid accent lines (#53A0C4 with subtle opacity)
    graphics.lineStyle(2, 0x53a0c4, 0.25);
    for (let x = 0; x <= width; x += tileSize * 2) {
      graphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += tileSize * 2) {
      graphics.lineBetween(0, y, width, y);
    }

    // Central card container (High resolution vector card in canvas)
    const cardW = 500;
    const cardH = 260;
    const cardX = width / 2 - cardW / 2;
    const cardY = height / 2 - cardH / 2 - 40;

    // Outer shadow (#0F1026)
    graphics.fillStyle(0x0f1026, 0.85);
    graphics.fillRoundedRect(cardX + 8, cardY + 8, cardW, cardH, 16);

    // Card background (#051C30)
    graphics.fillStyle(colorBg, 0.98);
    graphics.fillRoundedRect(cardX, cardY, cardW, cardH, 16);

    // Border (#53A0C4)
    graphics.lineStyle(4, 0x53a0c4, 1);
    graphics.strokeRoundedRect(cardX, cardY, cardW, cardH, 16);

    // Inner subtle highlight border (#AFD7FA)
    graphics.lineStyle(2, 0xafd7fa, 0.5);
    graphics.strokeRoundedRect(cardX + 6, cardY + 6, cardW - 12, cardH - 12, 12);

    // Category badge (#935D7E)
    graphics.fillStyle(0x935d7e, 1);
    graphics.fillRoundedRect(cardX + 30, cardY + 28, 140, 32, 6);

    const badgeText = this.add.text(cardX + 100, cardY + 44, 'SIDE QUEST', {
      fontFamily: '"Pixelify Sans", sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
    });
    badgeText.setOrigin(0.5);

    // Main Title: LIFE QUEST (#AFD7FA with crisp shadow)
    const title = this.add.text(width / 2, cardY + 115, 'LIFE QUEST', {
      fontFamily: '"Pixelify Sans", sans-serif',
      fontSize: '54px',
      color: '#afd7fa',
      fontStyle: 'bold',
      align: 'center',
    });
    title.setOrigin(0.5);
    title.setShadow(4, 4, '#0f1026', 0, false, true);

    // Subtitle badge text (#D68FBC)
    const sub = this.add.text(width / 2, cardY + 175, 'RETRO PIXEL ENGINE READY', {
      fontFamily: '"Pixelify Sans", sans-serif',
      fontSize: '26px',
      color: '#d68fbc',
      fontStyle: 'bold',
      align: 'center',
    });
    sub.setOrigin(0.5);

    // Resolution info tag (#53A0C4)
    const tag = this.add.text(width / 2, cardY + 218, 'High-DPI Canvas [ 640 x 960 ]', {
      fontFamily: '"Pixelify Sans", sans-serif',
      fontSize: '20px',
      color: '#53a0c4',
      align: 'center',
    });
    tag.setOrigin(0.5);
  }
}
