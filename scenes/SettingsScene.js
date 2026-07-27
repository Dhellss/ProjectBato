
const GameSettings = {
  defaults: { musicVolume: 0.6, sfxVolume: 0.8, vibration: true, fullscreen: false },

  load() {
    try {
      const raw = localStorage.getItem('bato_settings');
      return raw ? Object.assign({}, this.defaults, JSON.parse(raw)) : Object.assign({}, this.defaults);
    } catch (e) {
      return Object.assign({}, this.defaults);
    }
  },

  save(settings) {
    try {
      localStorage.setItem('bato_settings', JSON.stringify(settings));
    } catch (e) { /* ignore */ }
  }
};

class SettingsScene extends Phaser.Scene {
  constructor() {
    super('SettingsScene');
  }

  create() {
    const { width, height } = this.scale;
    this.add.tileSprite(width / 2, height / 2, width, height, 'bg-water');
    this.settings = GameSettings.load();

    this.add.text(width / 2, height * 0.1, 'SETTINGS', {
      fontFamily: 'Arial Black, Arial', fontSize: GameLayout.font(width, height, 0.07, 24, 34) + 'px', color: '#ffd43b'
    }).setOrigin(0.5);

    let y = height * 0.25;
    const gap = Math.min(72, height * 0.12);

    this.createSlider('Music Volume', 'musicVolume', width / 2, y); y += gap;
    this.createSlider('Sound Effects', 'sfxVolume', width / 2, y); y += gap;
    this.createToggle('Vibration', 'vibration', width / 2, y); y += gap;
    this.createToggle('Full Screen Mode', 'fullscreen', width / 2, y); y += gap;

    // Reset data button
    const resetBtn = this.add.rectangle(width / 2, y, Math.min(320, width * 0.65), 54, 0xe03131, 1)
      .setStrokeStyle(3, 0xffffff).setInteractive({ useHandCursor: true });
    this.add.text(width / 2, y, 'RESET DATA', {
      fontFamily: 'Arial Black, Arial', fontSize: GameLayout.font(width, height, 0.042, 14, 18) + 'px', color: '#ffffff'
    }).setOrigin(0.5);
    resetBtn.on('pointerup', () => this.confirmReset());

    const back = this.add.text(width * 0.08, height * 0.05, '< BACK', {
      fontFamily: 'Arial', fontSize: GameLayout.font(width, height, 0.045, 14, 18) + 'px', color: '#ffffff'
    }).setInteractive({ useHandCursor: true });
    back.on('pointerup', () => this.scene.start('MainMenu'));
  }

  createSlider(label, key, x, y) {
    const width = Math.min(320, this.scale.width * 0.7);
    this.add.text(x, y - 30, label, { fontFamily: 'Arial', fontSize: GameLayout.font(this.scale.width, this.scale.height, 0.045, 14, 18) + 'px', color: '#ffffff' }).setOrigin(0.5);

    const track = this.add.rectangle(x, y, width, 10, 0x333333).setOrigin(0.5);
    const fill = this.add.rectangle(x - width / 2, y, width * this.settings[key], 10, 0xffd43b).setOrigin(0, 0.5);
    const handle = this.add.circle(x - width / 2 + width * this.settings[key], y, 16, 0xffffff)
      .setStrokeStyle(3, 0xffd43b)
      .setInteractive({ draggable: true, useHandCursor: true });

    this.input.setDraggable(handle);
    handle.on('drag', (pointer, dragX) => {
      const minX = x - width / 2, maxX = x + width / 2;
      const clamped = Phaser.Math.Clamp(dragX, minX, maxX);
      handle.x = clamped;
      const pct = (clamped - minX) / width;
      fill.width = width * pct;
      this.settings[key] = pct;
      GameSettings.save(this.settings);
    });
  }

  createToggle(label, key, x, y) {
    this.add.text(x - 90, y, label, { fontFamily: 'Arial', fontSize: GameLayout.font(this.scale.width, this.scale.height, 0.045, 14, 18) + 'px', color: '#ffffff' }).setOrigin(0, 0.5);

    const track = this.add.rectangle(x + 110, y, 64, 32, this.settings[key] ? 0x2f9e44 : 0x555555)
      .setInteractive({ useHandCursor: true });
    const knob = this.add.circle(x + 110 + (this.settings[key] ? 16 : -16), y, 13, 0xffffff);

    track.on('pointerup', () => {
      this.settings[key] = !this.settings[key];
      track.setFillStyle(this.settings[key] ? 0x2f9e44 : 0x555555);
      this.tweens.add({ targets: knob, x: x + 110 + (this.settings[key] ? 16 : -16), duration: 120 });
      GameSettings.save(this.settings);

      if (key === 'fullscreen') {
        if (this.settings.fullscreen && !this.scale.isFullscreen) {
          this.scale.startFullscreen();
        } else if (!this.settings.fullscreen && this.scale.isFullscreen) {
          this.scale.stopFullscreen();
        }
      }
    });
  }

  confirmReset() {
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7).setInteractive();
    const box = this.add.rectangle(width / 2, height / 2, width * 0.8, height * 0.3, 0x0b4f6c, 1).setStrokeStyle(3, 0xffd43b);
    const msg = this.add.text(width / 2, height / 2 - 30, 'Reset all progress and settings?', {
      fontFamily: 'Arial', fontSize: '18px', color: '#ffffff', align: 'center', wordWrap: { width: width * 0.7 }
    }).setOrigin(0.5);

    const yesBtn = this.add.rectangle(width / 2 - 70, height / 2 + 40, 100, 44, 0xe03131).setInteractive({ useHandCursor: true });
    const yesTxt = this.add.text(width / 2 - 70, height / 2 + 40, 'YES', { fontFamily: 'Arial Black', fontSize: '16px', color: '#fff' }).setOrigin(0.5);
    const noBtn = this.add.rectangle(width / 2 + 70, height / 2 + 40, 100, 44, 0x2f9e44).setInteractive({ useHandCursor: true });
    const noTxt = this.add.text(width / 2 + 70, height / 2 + 40, 'CANCEL', { fontFamily: 'Arial Black', fontSize: '14px', color: '#fff' }).setOrigin(0.5);

    const group = [overlay, box, msg, yesBtn, yesTxt, noBtn, noTxt];
    const closeDialog = () => group.forEach(g => g.destroy());

    yesBtn.on('pointerup', () => {
      try {
        localStorage.removeItem('bato_high_score');
        localStorage.removeItem('bato_achievements');
        localStorage.removeItem('bato_characters');
        localStorage.removeItem('bato_settings');
      } catch (e) { /* ignore */ }
      closeDialog();
      this.scene.restart();
    });
    noBtn.on('pointerup', closeDialog);
  }
}
