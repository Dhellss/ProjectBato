

const GameData = {

  // ---------------------------------------------------------------------
  // CHARACTERS
  // ---------------------------------------------------------------------
  characters: [
    {
      id: 'crocodile',
      name: 'Crocodile',
      color: 0x2f9e44,
      bellyColor: 0xd8f5c8,
      // This file is already included in the project. Change this path when
      // using a different character image (see ASSETS_GUIDE.md).
      image: 'assets/characters/Crocodile/crocodile.png' ,
      description: 'The original bagman. Steady, greedy, reliable.',
      ability: {
        id: 'money_frenzy',
        name: 'Money Frenzy',
        description: 'All money is worth 3x points for 5 seconds.',
        duration: 5000,
        multiplier: 3,
        cooldown: 18000
       
      },
      unlocked: true,
      unlockCondition: null
      
    },
    {
      id: 'manny_fish',
      name: 'Manny Fish',
      color: 0xf59f00,
      bellyColor: 0xfff3bf,
      image: 'assets/characters/manny_fish.png',
      description: 'A slippery middleman. Slower frenzy, longer con.',
      ability: {
        id: 'double_money',
        name: 'Double Money',
        description: 'All money is worth 2x points for 10 seconds.',
        duration: 10000,
        multiplier: 2,
        cooldown: 16000
      },
      unlocked: false,
      unlockCondition: { type: 'survive_seconds', value: 60 }
    }
  ],

  // ---------------------------------------------------------------------
  // MONEY (increases score + greed)
  // ---------------------------------------------------------------------
  moneyTypes: [
    {
      id: 'normal_money',
      name: 'Cash Bundle',
      score: 10,
      greed: 10,
      color: 0x2b8a3e,
      radius: 10,
      image: 'assets/money/normal_money.webp',
      weight: 25 // relative spawn weight
    },
    {
      id: 'golden_money',
      name: 'Golden Bundle',
      score: 15,
      greed: 25,
      color: 0xf1c40f,
      radius: 26,
      image: 'assets/money/Gold.png',
      weight: 15
    },
    {
      id: 'treasure_chest',
      name: 'Treasure Chest',
      score: 50,
      greed: 30,
      color: 0xc9963c,
      radius: 30,
      image: 'assets/money/treasure_chest.png',
      weight: 5
    }
  ],

  // ---------------------------------------------------------------------
  // OBSTACLES (decrease greed — represent accountability catching up)
  // ---------------------------------------------------------------------
  obstacleTypes: [
    {
      id: 'audit_papers',
      name: 'Audit Papers',
      greedPenalty: -60,
      color: 0xe03131,
      radius: 24,
      image: 'assets/obstacles/kalaban.png',
      weight: 15
    },
    {
      id: 'transparency_report',
      name: 'Transparency Report',
      greedPenalty: -30,
      color: 0x1971c2,
      radius: 24,
      image: 'assets/obstacles/kalaban.png',
      weight: 20
    },
    {
      id: 'fake_money',
      name: 'Fake Money',
      greedPenalty: -30,
      color: 0x862e9c,
      radius: 22,
      image: 'assets/obstacles/bato.png',
      weight: 30
    },
    {
      id: 'news_paper',
      name: 'News Paper',
      greedPenalty: -25,
      color: 0x495057,
      radius: 22,
      image: 'assets/obstacles/bato.png',
      weight: 30
    },
    {
      id: 'tax_document',
      name: 'Tax Document',
      greedPenalty: -40,
      color: 0x343a40,
      radius: 22,
      image: 'assets/obstacles/kalaban.png',
      weight: 15
    }
  ],


  backgrounds: {
    gameplay: { key: 'bg-water', image: 'assets/backgrounds/background.png' },
    menu: { key: 'bg-menu', image: 'assets/backgrounds/menu_background.png' }
  },

  // ---------------------------------------------------------------------
  // DIFFICULTY CURVE (time in ms -> tuning)
  // ---------------------------------------------------------------------
  difficultyStages: [
    { label: 'Easy',    at: 0,      spawnRateMoney: 900,  spawnRateObstacle: 1600, speedMult: 1.0, greedDrainMult: 1.0 },
    { label: 'Medium',  at: 30000,  spawnRateMoney: 750,  spawnRateObstacle: 1300, speedMult: 2.15, greedDrainMult: 2.15 },
    { label: 'Hard',    at: 60000,  spawnRateMoney: 620,  spawnRateObstacle: 1000, speedMult: 3.3, greedDrainMult: 3.3 },
    { label: 'Extreme', at: 120000, spawnRateMoney: 500,  spawnRateObstacle: 750,  speedMult: 4.5, greedDrainMult: 3.5 },
    { label: 'Chaos',   at: 180000, spawnRateMoney: 400,  spawnRateObstacle: 600,  speedMult: 5.7, greedDrainMult: 3.7 }
  ],

  // ---------------------------------------------------------------------
  // ACHIEVEMENTS
  // ---------------------------------------------------------------------
  achievements: [
    { id: 'first_money', name: 'First Money Collected', description: 'Eat your first bundle of cash.', type: 'money_count', value: 1 },
    { id: 'survive_1min', name: 'Survive for 1 Minute', description: 'Stay afloat for 60 seconds.', type: 'survive_seconds', value: 60 },
    { id: 'collect_1000', name: 'Collect 1,000 Money', description: 'Collect a total of 1,000 in money value.', type: 'money_total', value: 1000 },
    { id: 'survive_5min', name: 'Survive for 5 Minutes', description: 'Stay afloat for 300 seconds.', type: 'survive_seconds', value: 300 },
    { id: 'avoid_50', name: 'Avoid 50 Papers', description: 'Successfully dodge 50 obstacles.', type: 'avoid_count', value: 50 },
    { id: 'unlock_character', name: 'Unlock New Character', description: 'Unlock a new playable character.', type: 'character_unlocked', value: 1 }
  ],

  // Helper: weighted random pick from an array of items with a `weight` field
  weightedPick(items) {
    const total = items.reduce((sum, i) => sum + i.weight, 0);
    let roll = Math.random() * total;
    for (const item of items) {
      if (roll < item.weight) return item;
      roll -= item.weight;
    }
    return items[items.length - 1];
  },

  // Helper: get current difficulty stage for a given elapsed ms
  getDifficultyStage(elapsedMs) {
    let stage = this.difficultyStages[0];
    for (const s of this.difficultyStages) {
      if (elapsedMs >= s.at) stage = s;
    }
    return stage;
  },

  getCharacter(id) {
    return this.characters.find(c => c.id === id);
  }
};
