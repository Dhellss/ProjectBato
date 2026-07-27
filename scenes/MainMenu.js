
class MainMenu extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create() {
    const { width, height } = this.scale;

    this.add.tileSprite(width / 2, height / 2, width, height, 'bg-menu');
    this.spawnAmbientBubbles();

    // Title
    this.add.text(width / 2, height * 0.16, 'PROJECT BATO', {
      fontFamily: 'Arial Black, Arial',
      fontSize: GameLayout.font(width, height, 0.11, 26, 46) + 'px',
      color: '#ffd43b',
      stroke: '#04202c',
      strokeThickness: 8
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.16 + GameLayout.font(width, height, 0.11, 26, 46) * 0.65, 'Crocodile Under Funds', {
      fontFamily: 'Arial',
      fontSize: GameLayout.font(width, height, 0.045, 13, 20) + 'px',
      color: '#e7f5ff',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    // Mascot preview
    const croc = this.add.image(width / 2, height * 0.38, 'croc-crocodile').setScale(GameLayout.isLandscape(width, height) ? 0.95 : 1.25);
    this.tweens.add({
      targets: croc,
      y: croc.y - 14,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // High score
    const scoreSys = this.game.registry.get('scoreSystem') || new ScoreSystem();
    this.game.registry.set('scoreSystem', scoreSys);
    this.add.text(width / 2, height * 0.5, `High Score: ${scoreSys.highScore.toLocaleString()}`, {
      fontFamily: 'Arial',
      fontSize: GameLayout.font(width, height, 0.045, 13, 20) + 'px',
      color: '#ffd43b'
    }).setOrigin(0.5);

    // Buttons
    const buttonDefs = [
      { label: 'PLAY', action: () => this.scene.start('CharacterSelection', { intent: 'play' }) },
      { label: 'CHARACTERS', action: () => this.scene.start('CharacterSelection', { intent: 'browse' }) },
      { label: 'SETTINGS', action: () => this.scene.start('SettingsScene') },
      { label: 'CREDITS', action: () => this.scene.start('CreditsScene') },
      { label: 'EXIT', action: () => this.handleExit() }
    ];

    const startY = height * 0.6;
    const gap = Math.min(58, height * 0.075);
    buttonDefs.forEach((def, i) => {
      this.createMenuButton(width / 2, startY + i * gap, def.label, def.action, width);
    });

    this.add.text(width / 2, height * 0.97,
      'corruption never sleeps.',
      { fontFamily: 'Arial', fontSize: GameLayout.font(width, height, 0.028, 10, 13) + 'px', color: '#a5d8ff' }
    ).setOrigin(0.5);
  }

  createMenuButton(x, y, label, onClick, screenWidth) {
    const btnWidth = Math.min(360, screenWidth * 0.72);
    const btnHeight = Math.min(52, Math.max(40, this.scale.height * 0.075));

    const bg = this.add.rectangle(x, y, btnWidth, btnHeight, 0x0b4f6c, 0.9)
      .setStrokeStyle(3, 0xffd43b)
      .setInteractive({ useHandCursor: true });

    const text = this.add.text(x, y, label, {
      fontFamily: 'Arial Black, Arial',
      fontSize: GameLayout.font(screenWidth, this.scale.height, 0.05, 15, 20) + 'px',
      color: '#ffffff'
    }).setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(0x1971c2, 0.9));
    bg.on('pointerout', () => bg.setFillStyle(0x0b4f6c, 0.9));
    bg.on('pointerdown', () => {
      bg.setScale(0.96);
      text.setScale(0.96);
    });
    bg.on('pointerup', () => {
      bg.setScale(1);
      text.setScale(1);
      onClick();
    });

    return { bg, text };
  }

  spawnAmbientBubbles() {
    const { width, height } = this.scale;
    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        const bubble = this.add.image(
          Phaser.Math.Between(0, width),
          height + 20,
          'bubble'
        ).setAlpha(0.5).setScale(Phaser.Math.FloatBetween(0.5, 1.5));

        this.tweens.add({
          targets: bubble,
          y: -30,
          x: bubble.x + Phaser.Math.Between(-40, 40),
          duration: Phaser.Math.Between(4000, 7000),
          onComplete: () => bubble.destroy()
        });
      }
    });
  }

  handleExit() {
    // Browsers can't force-close a tab opened by the user; give useful feedback instead.
    this.add.text(this.scale.width / 2, this.scale.height * 0.9,
      'Thanks for playing! You may close this tab.',
      { fontFamily: 'Arial', fontSize: '18px', color: '#ffd43b' }
    ).setOrigin(0.5);
  }
}
