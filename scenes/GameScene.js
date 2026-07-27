
class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init() {
    this.elapsedMs = 0;
    this.avoidCount = 0;
    this.isGameOver = false;
    this.moveInput = { x: 0, y: 0 };
    this.joystickPointerId = null;
  }

  create() {
    const { width, height } = this.scale;
    this.settings = GameSettings.load();

    // ---- Systems ----
    this.scoreSystem = this.game.registry.get('scoreSystem') || new ScoreSystem();
    this.game.registry.set('scoreSystem', this.scoreSystem);
    this.scoreSystem.reset();

    this.hungerSystem = new HungerSystem(100, 4);

    this.achievementSystem = this.game.registry.get('achievementSystem') || new AchievementSystem();
    this.game.registry.set('achievementSystem', this.achievementSystem);

    const characterId = this.game.registry.get('selectedCharacterId') || 'crocodile';
    this.character = GameData.getCharacter(characterId);
    this.abilitySystem = new AbilitySystem(this.character.ability);

    // ---- World ----
    this.bg = this.add.tileSprite(width / 2, height / 2, width, height, 'bg-water');
    this.moneyGroup = this.physics.add.group();
    this.obstacleGroup = this.physics.add.group();

    // ---- Crocodile ----
    this.croc = this.physics.add.image(width / 2, height / 2, `croc-${this.character.id}`);
    
    this.croc.setCollideWorldBounds(true);
    this.croc.body.setSize(80, 40).setOffset(20, 15);
    // ---- Input ----
    // Movement comes from the virtual joystick; keyboard arrows/WASD remain
    // available for desktop testing.
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');

    // ---- Physics overlaps ----
    this.physics.add.overlap(this.croc, this.moneyGroup, this.onCollectMoney, null, this);
    this.physics.add.overlap(this.croc, this.obstacleGroup, this.onHitObstacle, null, this);

    // ---- Spawning timers (re-created when difficulty stage changes) ----
    this.currentStage = null;
    this.applyDifficultyStage(true);

    // ---- Ambient bubbles ----
    this.bubbleTimer = this.time.addEvent({ delay: 400, loop: true, callback: () => this.spawnAmbientBubble() });

    // ---- HUD ----
    this.buildHud();
    this.buildJoystick();

    // ---- Pause button ----
    this.buildPauseButton();

    // Resume from pause if this scene is re-entered
    this.events.on('resume', () => { this.isGameOver = false; });
  }

  buildHud() {
    const { width, height } = this.scale;
    const unit = GameLayout.unit(width, height);
    const pad = Math.max(10, Math.round(unit * 0.035));
    const scoreSize = GameLayout.font(width, height, 0.055, 14, 22);
    const bodySize = GameLayout.font(width, height, 0.04, 11, 16);
    const labelSize = GameLayout.font(width, height, 0.035, 10, 14);

    this.scoreText = this.add.text(pad, pad, 'SCORE: 0', {
      fontFamily: 'Arial Black, Arial', fontSize: scoreSize + 'px', color: '#ffffff'
    }).setScrollFactor(0).setDepth(10);

    this.timeText = this.add.text(pad, pad + scoreSize + 4, 'TIME: 00:00', {
      fontFamily: 'Arial', fontSize: bodySize + 'px', color: '#e7f5ff'
    }).setScrollFactor(0).setDepth(10);

    const difficultyX = GameLayout.isLandscape(width, height) ? width - 56 : width - pad;
    this.difficultyText = this.add.text(difficultyX, pad, 'EASY', {
      fontFamily: 'Arial Black, Arial', fontSize: bodySize + 'px', color: '#ffd43b'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10);

    // Greed bar
    const barWidth = Math.min(190, width * (GameLayout.isLandscape(width, height) ? 0.3 : 0.5));
    const greedY = pad + scoreSize + bodySize + 17;
    this.add.text(pad, greedY, 'GREED', { fontFamily: 'Arial', fontSize: labelSize + 'px', color: '#ffffff' }).setDepth(10);
    this.greedBarBg = this.add.rectangle(pad, greedY + 17, barWidth, 13, 0x222222).setOrigin(0, 0.5).setDepth(10);
    this.greedBarFill = this.add.rectangle(pad + 2, greedY + 17, barWidth - 4, 9, 0x2f9e44).setOrigin(0, 0.5).setDepth(10);
    this.greedBarMaxWidth = barWidth - 4;

    // Ability meter
    this.add.text(pad, greedY + 31, `ABILITY: ${this.character.ability.name}`, { fontFamily: 'Arial', fontSize: labelSize + 'px', color: '#ffffff' }).setDepth(10);
    this.abilityBarBg = this.add.rectangle(pad, greedY + 48, barWidth, 13, 0x222222).setOrigin(0, 0.5).setDepth(10);
    this.abilityBarFill = this.add.rectangle(pad + 2, greedY + 48, barWidth - 4, 9, 0x4dabf7).setOrigin(0, 0.5).setDepth(10);

    // Tap ability button (mobile-friendly big hit area, bottom-right)
    const buttonRadius = Math.max(30, Math.min(40, unit * 0.115));
    this.abilityBtn = this.add.circle(width - pad - buttonRadius, height - pad - buttonRadius, buttonRadius, 0x4dabf7, 0.85)
      .setStrokeStyle(3, 0xffffff).setDepth(10).setInteractive({ useHandCursor: true });
    this.add.text(this.abilityBtn.x, this.abilityBtn.y, 'USE', {
      fontFamily: 'Arial Black, Arial', fontSize: labelSize + 'px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(11);
    this.abilityBtn.on('pointerup', () => this.tryActivateAbility());
  }

  buildJoystick() {
    const { width, height } = this.scale;
    const unit = GameLayout.unit(width, height);
    this.joystickRadius = Math.max(42, Math.min(64, unit * 0.18));
    this.joystickCenter = {
      x: 18 + this.joystickRadius,
      y: height - 18 - this.joystickRadius
    };

    this.joystickBase = this.add.circle(this.joystickCenter.x, this.joystickCenter.y, this.joystickRadius, 0x0b4f6c, 0.52)
      .setStrokeStyle(2, 0xffffff, 0.65).setDepth(10);
    this.joystickKnob = this.add.circle(this.joystickCenter.x, this.joystickCenter.y, this.joystickRadius * 0.42, 0xffffff, 0.68)
      .setStrokeStyle(2, 0x4dabf7).setDepth(11);
    this.add.text(this.joystickCenter.x, this.joystickCenter.y + this.joystickRadius + 7, 'MOVE', {
      fontFamily: 'Arial Black, Arial', fontSize: GameLayout.font(width, height, 0.03, 9, 12) + 'px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(11);

    this.input.on('pointerdown', pointer => {
      if (Phaser.Math.Distance.Between(pointer.x, pointer.y, this.joystickCenter.x, this.joystickCenter.y) <= this.joystickRadius * 1.35) {
        this.joystickPointerId = pointer.id;
        this.updateJoystick(pointer);
      }
    });
    this.input.on('pointermove', pointer => {
      if (pointer.id === this.joystickPointerId && pointer.isDown) this.updateJoystick(pointer);
    });
    this.input.on('pointerup', pointer => {
      if (pointer.id === this.joystickPointerId) this.resetJoystick();
    });
  }

  updateJoystick(pointer) {
    const dx = pointer.x - this.joystickCenter.x;
    const dy = pointer.y - this.joystickCenter.y;
    const length = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(length, this.joystickRadius);
    this.joystickKnob.setPosition(
      this.joystickCenter.x + (dx / length) * clamped,
      this.joystickCenter.y + (dy / length) * clamped
    );
    this.moveInput.x = dx / length * (clamped / this.joystickRadius);
    this.moveInput.y = dy / length * (clamped / this.joystickRadius);
  }

  resetJoystick() {
    this.joystickPointerId = null;
    this.moveInput.x = 0;
    this.moveInput.y = 0;
    this.joystickKnob.setPosition(this.joystickCenter.x, this.joystickCenter.y);
  }

  buildPauseButton() {
    const btn = this.add.text(this.scale.width - 12, 10, '⏸', {
      fontFamily: 'Arial', fontSize: GameLayout.font(this.scale.width, this.scale.height, 0.07, 20, 28) + 'px', color: '#ffffff'
    }).setOrigin(1, 0).setDepth(10).setInteractive({ useHandCursor: true });
    btn.on('pointerup', () => this.pauseGame());
  }

  pauseGame() {
    if (this.isGameOver) return;
    this.scene.pause();
    this.scene.launch('PauseScene', { gameSceneKey: this.scene.key });
  }

  tryActivateAbility() {
    if (this.abilitySystem.activate()) {
      this.cameras.main.flash(200, 255, 212, 59, false);
    }
  }

  applyDifficultyStage(force = false) {
    const stage = GameData.getDifficultyStage(this.elapsedMs);
    if (!force && stage === this.currentStage) return;
    this.currentStage = stage;
    this.difficultyText && this.difficultyText.setText(stage.label.toUpperCase());

    if (this.moneyTimer) this.moneyTimer.remove(false);
    if (this.obstacleTimer) this.obstacleTimer.remove(false);

    this.moneyTimer = this.time.addEvent({ delay: stage.spawnRateMoney, loop: true, callback: () => this.spawnMoney() });
    this.obstacleTimer = this.time.addEvent({ delay: stage.spawnRateObstacle, loop: true, callback: () => this.spawnObstacle() });
  }

  spawnMoney() {
    if (this.isGameOver) return;
    const def = GameData.weightedPick(GameData.moneyTypes);
    this.spawnFloatingItem(`money-${def.id}`, def, this.moneyGroup, def.radius);
  }

  spawnObstacle() {
    if (this.isGameOver) return;
    const def = GameData.weightedPick(GameData.obstacleTypes);
    this.spawnFloatingItem(`obstacle-${def.id}`, def, this.obstacleGroup, def.radius);
  }

  spawnFloatingItem(textureKey, def, group, radius) {
    const { width, height } = this.scale;
    const fromLeft = Math.random() < 0.5;
    const x = fromLeft ? -radius : width + radius;
    const topClearance = Math.min(140, Math.max(90, height * 0.28));
    const y = Phaser.Math.Between(topClearance, Math.max(topClearance + 1, height - 45));

    const item = this.physics.add.image(x, y, textureKey);
    item.setData('def', def);
    item.setData('avoided', false);
    group.add(item);

    const speed = Phaser.Math.Between(50, 90) * this.currentStage.speedMult * (fromLeft ? 1 : -1);
    item.body.setVelocityX(speed);
    item.body.setVelocityY(Phaser.Math.Between(-15, 15));

    // Gentle bobbing
    this.tweens.add({
      targets: item, y: y + Phaser.Math.Between(-20, 20),
      duration: Phaser.Math.Between(1200, 2000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Cull + count as "avoided" once it exits the far side
    item.setData('cullCheck', this.time.addEvent({
      delay: 200, loop: true,
      callback: () => {
        if (!item.active) return;
        if (item.x < -radius * 2 || item.x > width + radius * 2) {
          if (group === this.obstacleGroup && !item.getData('avoided')) {
            item.setData('avoided', true);
            this.avoidCount++;
          }
          item.getData('cullCheck').remove(false);
          item.destroy();
        }
      }
    }));
  }

  onCollectMoney(croc, item) {
    if (this.isGameOver || !item.active) return;
    const def = item.getData('def');
    const mult = this.abilitySystem.getMultiplier();

    this.scoreSystem.addScore(def.score * mult);
    this.scoreSystem.registerMoneyCollected(def.score);
    this.hungerSystem.change(def.greed);

    this.spawnCollectBurst(item.x, item.y, mult > 1 ? 0xffd43b : 0xffffff);
    item.getData('cullCheck') && item.getData('cullCheck').remove(false);
    item.destroy();
  }

  onHitObstacle(croc, item) {
    if (this.isGameOver || !item.active) return;
    const def = item.getData('def');
    this.hungerSystem.change(def.greedPenalty);

    this.cameras.main.shake(180, 0.01);
    this.spawnHitRing(item.x, item.y);
    item.getData('cullCheck') && item.getData('cullCheck').remove(false);
    item.destroy();
  }

  spawnCollectBurst(x, y, tint) {
    for (let i = 0; i < 8; i++) {
      const s = this.add.image(x, y, 'sparkle').setTint(tint);
      const angle = (i / 8) * Math.PI * 2;
      this.tweens.add({
        targets: s,
        x: x + Math.cos(angle) * 40,
        y: y + Math.sin(angle) * 40,
        alpha: 0,
        duration: 350,
        onComplete: () => s.destroy()
      });
    }
  }

  spawnHitRing(x, y) {
    const ring = this.add.image(x, y, 'hit-ring').setAlpha(0.9);
    this.tweens.add({ targets: ring, scale: 2, alpha: 0, duration: 300, onComplete: () => ring.destroy() });
  }

  spawnAmbientBubble() {
    const { width, height } = this.scale;
    const bubble = this.add.image(Phaser.Math.Between(0, width), height + 20, 'bubble')
      .setAlpha(0.4).setScale(Phaser.Math.FloatBetween(0.4, 1.2));
    this.tweens.add({
      targets: bubble, y: -30, x: bubble.x + Phaser.Math.Between(-30, 30),
      duration: Phaser.Math.Between(3500, 6000), onComplete: () => bubble.destroy()
    });
  }

  update(time, delta) {
    if (this.isGameOver) return;

    this.elapsedMs += delta;
    this.applyDifficultyStage();

    // Virtual joystick movement. The speed is time-based, so it feels the
    // same at different frame rates and on landscape/portrait screens.
    let moveX = this.moveInput.x;
    let moveY = this.moveInput.y;
    if (this.cursors.left.isDown || this.wasd.A.isDown) moveX = -1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) moveX = 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) moveY = -1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) moveY = 1;
    const magnitude = Math.hypot(moveX, moveY);
    if (magnitude > 0) {
      const speed = Math.min(this.scale.width, this.scale.height) * 0.52;
      this.croc.x += (moveX / magnitude) * speed * (delta / 1000);
      this.croc.y += (moveY / magnitude) * speed * (delta / 1000);
      this.croc.x = Phaser.Math.Clamp(this.croc.x, 45, this.scale.width - 45);
      this.croc.y = Phaser.Math.Clamp(this.croc.y, 75, this.scale.height - 40);
      if (moveX !== 0) this.croc.flipX = moveX < 0;
    }

    // Systems tick
    this.hungerSystem.update(delta / 1000, this.currentStage.greedDrainMult);
    this.abilitySystem.update(delta);

    // HUD refresh
    this.scoreText.setText(`SCORE: ${this.scoreSystem.score.toLocaleString()}`);
    const totalSeconds = Math.floor(this.elapsedMs / 1000);
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    this.timeText.setText(`TIME: ${mm}:${ss}`);

    const greedPct = this.hungerSystem.getPercent();
    this.greedBarFill.width = this.greedBarMaxWidth * greedPct;
    this.greedBarFill.setFillStyle(greedPct > 0.5 ? 0x2f9e44 : greedPct > 0.2 ? 0xf59f00 : 0xe03131);

    const abilityPct = this.abilitySystem.getMeterFill();
    this.abilityBarFill.width = this.greedBarMaxWidth * abilityPct;
    this.abilityBtn.setFillStyle(this.abilitySystem.canActivate() ? 0x4dabf7 : 0x495057, 0.85);

    // Achievement evaluation (live)
    this.achievementSystem.evaluate({
      moneyCount: this.scoreSystem.moneyCollectedCount,
      moneyTotal: this.scoreSystem.moneyCollectedTotal,
      survivalSeconds: totalSeconds,
      avoidCount: this.avoidCount
    });

    if (this.hungerSystem.isDepleted()) {
      this.triggerGameOver();
    }
  }

  triggerGameOver() {
    this.isGameOver = true;
    this.physics.pause();
    if (this.moneyTimer) this.moneyTimer.remove(false);
    if (this.obstacleTimer) this.obstacleTimer.remove(false);
    if (this.bubbleTimer) this.bubbleTimer.remove(false);

    const beatHighScore = (() => {
      const before = this.scoreSystem.highScore;
      this.scoreSystem.commitHighScoreIfBeaten();
      return this.scoreSystem.score > before;
    })();

    const newlyUnlocked = this.achievementSystem.consumeNewlyUnlocked();

    this.cameras.main.shake(300, 0.02);
    this.time.delayedCall(400, () => {
      this.scene.start('GameOverScene', {
        score: this.scoreSystem.score,
        highScore: this.scoreSystem.highScore,
        beatHighScore,
        survivalSeconds: Math.floor(this.elapsedMs / 1000),
        newlyUnlocked
      });
    });
  }
}
