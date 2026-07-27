
class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.result = data;
  }

  create() {
    const { width, height } = this.scale;
    this.add.tileSprite(width / 2, height / 2, width, height, 'bg-water');
    this.cameras.main.fadeIn(300);

    const title = this.add.text(width / 2, height * 0.14, 'GAME OVER', {
      fontFamily: 'Arial Black, Arial', fontSize: GameLayout.font(width, height, 0.1, 28, 44) + 'px', color: '#e03131',
      stroke: '#04202c', strokeThickness: 8
    }).setOrigin(0.5).setScale(0.5);
    this.tweens.add({ targets: title, scale: 1, duration: 350, ease: 'Back.easeOut' });

    const mm = String(Math.floor(this.result.survivalSeconds / 60)).padStart(2, '0');
    const ss = String(this.result.survivalSeconds % 60).padStart(2, '0');

    const lines = [
      `Score: ${this.result.score.toLocaleString()}`,
      `Highest Score: ${this.result.highScore.toLocaleString()}`,
      `Survival Time: ${mm}:${ss}`
    ];
    this.add.text(width / 2, height * 0.32, lines.join('\n'), {
      fontFamily: 'Arial', fontSize: GameLayout.font(width, height, 0.05, 15, 21) + 'px', color: '#ffffff', align: 'center', lineSpacing: 8
    }).setOrigin(0.5);

    if (this.result.beatHighScore) {
      const newBest = this.add.text(width / 2, height * 0.46, '★ NEW HIGH SCORE! ★', {
        fontFamily: 'Arial Black, Arial', fontSize: GameLayout.font(width, height, 0.045, 14, 19) + 'px', color: '#ffd43b'
      }).setOrigin(0.5);
      this.tweens.add({ targets: newBest, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });
    }

    // Achievement popups
    if (this.result.newlyUnlocked && this.result.newlyUnlocked.length) {
      const names = this.result.newlyUnlocked
        .map(id => GameData.achievements.find(a => a.id === id))
        .filter(Boolean)
        .map(a => `🏆 ${a.name}`);
      this.add.text(width / 2, height * 0.56, names.join('\n'), {
        fontFamily: 'Arial', fontSize: GameLayout.font(width, height, 0.035, 11, 15) + 'px', color: '#69db7c', align: 'center'
      }).setOrigin(0.5);
    }

    // Buttons
    const buttonDefs = [
      { label: 'PLAY AGAIN', action: () => this.scene.start('GameScene') },
      { label: 'MAIN MENU', action: () => this.scene.start('MainMenu') },
      { label: 'EXIT', action: () => this.showExitMessage() }
    ];

    let y = height * 0.72;
    buttonDefs.forEach(def => {
      const bg = this.add.rectangle(width / 2, y, Math.min(300, width * 0.65), 54, 0x0b4f6c, 1)
        .setStrokeStyle(3, 0xffd43b).setInteractive({ useHandCursor: true });
      const txt = this.add.text(width / 2, y, def.label, { fontFamily: 'Arial Black, Arial', fontSize: GameLayout.font(width, height, 0.042, 14, 18) + 'px', color: '#ffffff' }).setOrigin(0.5);
      bg.on('pointerup', def.action);
      y += height * 0.09;
    });
  }

  showExitMessage() {
    this.add.text(this.scale.width / 2, this.scale.height * 0.95, 'Thanks for playing! You may close this tab.', {
      fontFamily: 'Arial', fontSize: '16px', color: '#ffd43b'
    }).setOrigin(0.5);
  }
}
