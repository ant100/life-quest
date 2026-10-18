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

    // Checkerboard tile grid (16x16 tiles)
    const graphics = this.add.graphics();
    const tileSize = 16;

    for (let x = 0; x < width; x += tileSize) {
      for (let y = 0; y < height; y += tileSize) {
        const isEven = (x / tileSize + y / tileSize) % 2 === 0;
        graphics.fillStyle(isEven ? colorTileA : colorTileB, 1);
        graphics.fillRect(x, y, tileSize, tileSize);
      }
    }

    // Grid accent lines (#53A0C4 with low opacity)
    graphics.lineStyle(1, 0x53a0c4, 0.2);
    for (let x = 0; x <= width; x += tileSize * 4) {
      graphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += tileSize * 4) {
      graphics.lineBetween(0, y, width, y);
    }

    // Central card container (deep navy with subtle plum shadow & sky blue border)
    const cardW = 260;
    const cardH = 140;
    const cardX = width / 2 - cardW / 2;
    const cardY = height / 2 - cardH / 2 - 20;

    // Outer shadow
    graphics.fillStyle(0x0f1026, 0.7);
    graphics.fillRoundedRect(cardX + 4, cardY + 4, cardW, cardH, 10);

    // Card background (#051C30)
    graphics.fillStyle(colorBg, 0.98);
    graphics.fillRoundedRect(cardX, cardY, cardW, cardH, 10);

    // Border (#53A0C4)
    graphics.lineStyle(2, 0x53a0c4, 1);
    graphics.strokeRoundedRect(cardX, cardY, cardW, cardH, 10);

    // Inner subtle highlight border (#AFD7FA)
    graphics.lineStyle(1, 0xafd7fa, 0.4);
    graphics.strokeRoundedRect(cardX + 3, cardY + 3, cardW - 6, cardH - 6, 8);

    // Header badge (#935D7E)
    graphics.fillStyle(0x935d7e, 1);
    graphics.fillRoundedRect(cardX + 16, cardY + 14, 80, 18, 4);

    const badgeText = this.add.text(cardX + 56, cardY + 23, 'SIDE QUEST', {
      fontFamily: '"Pixelify Sans", monospace',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
    });
    badgeText.setOrigin(0.5);

    // Main Title: LIFE QUEST (using #AFD7FA with #D68FBC accent shadow)
    const title = this.add.text(width / 2, cardY + 58, 'LIFE QUEST', {
      fontFamily: '"Pixelify Sans", monospace',
      fontSize: '28px',
      color: '#afd7fa',
      fontStyle: 'bold',
      align: 'center',
    });
    title.setOrigin(0.5);
    title.setShadow(2, 2, '#0f1026', 0, false, true);

    // Subtitle badge text (#D68FBC) - large and clear
    const sub = this.add.text(width / 2, cardY + 92, 'PIXEL ENGINE READY', {
      fontFamily: '"Pixelify Sans", monospace',
      fontSize: '15px',
      color: '#d68fbc',
      fontStyle: 'bold',
      align: 'center',
    });
    sub.setOrigin(0.5);

    // Footer scale info tag (#53A0C4)
    const tag = this.add.text(width / 2, cardY + 116, '320 x 480 Native Scale', {
      fontFamily: '"Pixelify Sans", monospace',
      fontSize: '12px',
      color: '#53a0c4',
      align: 'center',
    });
    tag.setOrigin(0.5);
  }
}
