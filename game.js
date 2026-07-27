
const GameLayout = {
  unit(width, height) {
    return Math.min(width, height);
  },

  font(width, height, ratio, min, max) {
    return Phaser.Math.Clamp(Math.round(this.unit(width, height) * ratio), min, max);
  },

  isLandscape(width, height) {
    return width > height;
  }
};

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#04202c',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  input: {
    activePointers: 2
  },
  scene: [
    BootScene,
    MainMenu,
    CharacterSelection,
    SettingsScene,
    CreditsScene,
    GameScene,
    PauseScene,
    GameOverScene
  ]
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});

document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
