
class CharacterSelection extends Phaser.Scene {
  constructor() {
    super('CharacterSelection');
  }

  init(data) {
    this.intent = (data && data.intent) || 'play';
    this.index = 0;
  }

  create() {
    const { width, height } = this.scale;
    this.add.tileSprite(width / 2, height / 2, width, height, 'bg-water');

    this.achievementSystem = this.game.registry.get('achievementSystem') || new AchievementSystem();
    this.game.registry.set('achievementSystem', this.achievementSystem);

    this.add.text(width / 2, height * 0.08, 'CHOOSE YOUR CROCODILE', {
      fontFamily: 'Arial Black, Arial',
      fontSize: GameLayout.font(width, height, 0.06, 20, 32) + 'px',
      color: '#ffd43b'
    }).setOrigin(0.5);

    this.portrait = this.add.image(width / 2, height * 0.32, '').setScale(GameLayout.isLandscape(width, height) ? 1.35 : 2.0);
    this.nameText = this.add.text(width / 2, height * 0.5, '', {
      fontFamily: 'Arial Black, Arial', fontSize: GameLayout.font(width, height, 0.07, 22, 34) + 'px', color: '#ffffff'
    }).setOrigin(0.5);

    this.abilityNameText = this.add.text(width / 2, height * 0.58, '', {
      fontFamily: 'Arial', fontSize: GameLayout.font(width, height, 0.045, 14, 20) + 'px', color: '#ffd43b', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.descText = this.add.text(width / 2, height * 0.64, '', {
      fontFamily: 'Arial', fontSize: GameLayout.font(width, height, 0.038, 12, 17) + 'px', color: '#e7f5ff',
      align: 'center', wordWrap: { width: width * 0.85 }
    }).setOrigin(0.5);

    this.lockText = this.add.text(width / 2, height * 0.72, '', {
      fontFamily: 'Arial', fontSize: GameLayout.font(width, height, 0.035, 11, 15) + 'px', color: '#ff8787',
      align: 'center', wordWrap: { width: width * 0.85 }
    }).setOrigin(0.5);

    // Prev / Next arrows
    this.createArrow(width * 0.1, height * 0.32, -1);
    this.createArrow(width * 0.9, height * 0.32, 1);

    // Select button
    this.selectBtnBg = this.add.rectangle(width / 2, height * 0.85, Math.min(300, width * 0.6), 60, 0x2f9e44, 1)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.selectBtnText = this.add.text(width / 2, height * 0.85, 'SELECT & PLAY', {
      fontFamily: 'Arial Black, Arial', fontSize: GameLayout.font(width, height, 0.045, 15, 19) + 'px', color: '#ffffff'
    }).setOrigin(0.5);
    this.selectBtnBg.on('pointerup', () => this.onSelect());

    // Back
    const back = this.add.text(width * 0.08, height * 0.05, '< BACK', {
      fontFamily: 'Arial', fontSize: GameLayout.font(width, height, 0.045, 14, 18) + 'px', color: '#ffffff'
    }).setInteractive({ useHandCursor: true });
    back.on('pointerup', () => this.scene.start('MainMenu'));

    this.refreshDisplay();
  }

  createArrow(x, y, dir) {
    const arrow = this.add.text(x, y, dir < 0 ? '◀' : '▶', {
      fontFamily: 'Arial', fontSize: GameLayout.font(this.scale.width, this.scale.height, 0.11, 30, 42) + 'px', color: '#ffffff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    arrow.on('pointerup', () => {
      this.index = (this.index + dir + GameData.characters.length) % GameData.characters.length;
      this.refreshDisplay();
    });
  }

  refreshDisplay() {
    const char = GameData.characters[this.index];
    const unlocked = this.achievementSystem.isCharacterUnlocked(char.id);

    this.portrait.setTexture(`croc-${char.id}`);
    this.portrait.setTint(unlocked ? 0xffffff : 0x555555);
    this.nameText.setText(char.name);
    this.abilityNameText.setText(`Ability: ${char.ability.name}`);
    this.descText.setText(`${char.description}\n${char.ability.description}`);

    if (unlocked) {
      this.lockText.setText('');
      this.selectBtnBg.setFillStyle(0x2f9e44, 1);
      this.selectBtnText.setText(this.intent === 'play' ? 'SELECT & PLAY' : 'SELECTED');
    } else {
      const cond = char.unlockCondition;
      let condText = 'Complete a challenge to unlock.';
      if (cond && cond.type === 'survive_seconds') condText = `Unlock by surviving ${cond.value} seconds in one run.`;
      if (cond && cond.type === 'money_total') condText = `Unlock by collecting ${cond.value} total money in one run.`;
      this.lockText.setText(`🔒 LOCKED — ${condText}`);
      this.selectBtnBg.setFillStyle(0x495057, 1);
      this.selectBtnText.setText('LOCKED');
    }
  }

  onSelect() {
    const char = GameData.characters[this.index];
    const unlocked = this.achievementSystem.isCharacterUnlocked(char.id);
    if (!unlocked) return;

    this.game.registry.set('selectedCharacterId', char.id);

    if (this.intent === 'play') {
      this.scene.start('GameScene');
    } else {
      this.scene.start('MainMenu');
    }
  }
}
