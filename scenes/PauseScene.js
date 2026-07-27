
class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  init(data) {
    this.gameSceneKey = data.gameSceneKey || 'GameScene';
  }

  create() {
    const { width, height } = this.scale;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65);

    const panel = this.add.container(width / 2, height / 2);
    const panelBg = this.add.rectangle(0, 0, Math.min(340, width * 0.8), 320, 0x0b4f6c, 1).setStrokeStyle(3, 0xffd43b);
    const title = this.add.text(0, -120, 'PAUSED', {
      fontFamily: 'Arial Black, Arial', fontSize: GameLayout.font(width, height, 0.07, 22, 30) + 'px', color: '#ffd43b'
    }).setOrigin(0.5);

    panel.add([panelBg, title]);
    panel.setScale(0.8).setAlpha(0);
    this.tweens.add({ targets: panel, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' });

    const buttons = [
      { label: 'RESUME', action: () => this.resumeGame() },
      { label: 'MAIN MENU', action: () => this.goMainMenu() }
    ];

    buttons.forEach((def, i) => {
      const y = -30 + i * 70;
      const bg = this.add.rectangle(0, y, 220, 54, 0x2f9e44, 1).setStrokeStyle(2, 0xffffff)
        .setInteractive({ useHandCursor: true });
      const txt = this.add.text(0, y, def.label, { fontFamily: 'Arial Black, Arial', fontSize: GameLayout.font(width, height, 0.042, 14, 18) + 'px', color: '#ffffff' }).setOrigin(0.5);
      bg.on('pointerup', def.action);
      panel.add([bg, txt]);
    });
  }

  resumeGame() {
    this.scene.stop();
    this.scene.resume(this.gameSceneKey);
  }

  goMainMenu() {
    this.scene.stop(this.gameSceneKey);
    this.scene.stop();
    this.scene.start('MainMenu');
  }
}
