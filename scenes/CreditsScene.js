
class CreditsScene extends Phaser.Scene {
  constructor() {
    super('CreditsScene');
  }

  create() {
    const { width, height } = this.scale;
    this.add.tileSprite(width / 2, height / 2, width, height, 'bg-water');

    this.add.text(width / 2, height * 0.12, 'CREDITS', {
      fontFamily: 'Arial Black, Arial', fontSize: GameLayout.font(width, height, 0.08, 26, 38) + 'px', color: '#ffd43b'
    }).setOrigin(0.5);

    const lines = [
      'PROJECT BATO',
      'Crocodile Under Funds',
      '',
      'A satirical survival game about',
      'public funds, accountability,',
      'and transparency.',
      '',
      'Built with Phaser 3',
      '',
      'Game Design & Programming',
      'Mahilum Dhellmar',
      '',
      'Inspired by classic "eat to survive"',
      'Hungry shark.',
      '',
      'Thank you for playing —',
      'Malulupet na Hacker'
    ];

    this.add.text(width / 2, height * 0.24, lines.join('\n'), {
      fontFamily: 'Arial', fontSize: GameLayout.font(width, height, 0.04, 12, 17) + 'px', color: '#e7f5ff',
      align: 'center', lineSpacing: 6
    }).setOrigin(0.5, 0);

    const back = this.add.text(width * 0.08, height * 0.05, '< BACK', {
      fontFamily: 'Arial', fontSize: GameLayout.font(width, height, 0.045, 14, 18) + 'px', color: '#ffffff'
    }).setInteractive({ useHandCursor: true });
    back.on('pointerup', () => this.scene.start('MainMenu'));
  }
}
