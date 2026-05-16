// ═══════════════════════════════════════════════
// Gary's Life — Economy System
// Bird data, weapon data, location data, wallet
// ═══════════════════════════════════════════════

export const BIRDS = {
  sparrow: {
    name: 'Sparrow', value: 2, speed: 1.8, size: 0.45,
    rarity: 'common', weight: 40,
    bodyColor: 0x8B7355, wingColor: 0x6B5B45, headColor: 0x8B7355,
    beakColor: 0x4a3a2a, bellyColor: 0xd4c4a8,
    flapSpeed: 7, flapAmplitude: 0.5
  },
  pigeon: {
    name: 'Pigeon', value: 3, speed: 1.2, size: 0.55,
    rarity: 'common', weight: 35,
    bodyColor: 0x808890, wingColor: 0x606870, headColor: 0x556B6B,
    beakColor: 0x555555, bellyColor: 0xa0a8b0,
    flapSpeed: 5, flapAmplitude: 0.4
  },
  robin: {
    name: 'Robin', value: 5, speed: 3.0, size: 0.32,
    rarity: 'common', weight: 30,
    bodyColor: 0x6B5B45, wingColor: 0x5a4a35, headColor: 0x3a3a3a,
    beakColor: 0x4a4a30, bellyColor: 0xCC4422,
    flapSpeed: 11, flapAmplitude: 0.65
  },
  bluejay: {
    name: 'Blue Jay', value: 8, speed: 3.8, size: 0.38,
    rarity: 'uncommon', weight: 20,
    bodyColor: 0x3060BB, wingColor: 0x2050AA, headColor: 0x2855A0,
    beakColor: 0x222222, bellyColor: 0xd8d8e0,
    flapSpeed: 10, flapAmplitude: 0.6
  },
  cardinal: {
    name: 'Cardinal', value: 12, speed: 2.8, size: 0.34,
    rarity: 'uncommon', weight: 18,
    bodyColor: 0xCC2222, wingColor: 0xAA1818, headColor: 0xDD2828,
    beakColor: 0xDD8822, bellyColor: 0xBB3030,
    flapSpeed: 10, flapAmplitude: 0.6
  },
  woodpecker: {
    name: 'Woodpecker', value: 15, speed: 2.5, size: 0.35,
    rarity: 'uncommon', weight: 15,
    bodyColor: 0x1a1a1a, wingColor: 0x111111, headColor: 0xCC1111,
    beakColor: 0x333333, bellyColor: 0xeeeeee,
    flapSpeed: 14, flapAmplitude: 0.4
  },
  heron: {
    name: 'Heron', value: 25, speed: 1.8, size: 0.7,
    rarity: 'rare', weight: 10,
    bodyColor: 0x8899AA, wingColor: 0x6677AA, headColor: 0xd0d0e0,
    beakColor: 0xccaa33, bellyColor: 0xc8c8d8,
    flapSpeed: 5, flapAmplitude: 0.9
  },
  eagle: {
    name: 'Eagle', value: 40, speed: 3.5, size: 0.8,
    rarity: 'rare', weight: 8,
    bodyColor: 0x3a2a18, wingColor: 0x2a1a08, headColor: 0xeeeeee,
    beakColor: 0xccaa00, bellyColor: 0x3a2a18,
    flapSpeed: 4, flapAmplitude: 1.0
  },
  hawk: {
    name: 'Hawk', value: 50, speed: 4.5, size: 0.6,
    rarity: 'rare', weight: 6,
    bodyColor: 0x6B4226, wingColor: 0x5a3520, headColor: 0x7a5030,
    beakColor: 0x333333, bellyColor: 0xd4b896,
    flapSpeed: 6, flapAmplitude: 0.8
  },
  falcon: {
    name: 'Falcon', value: 75, speed: 5.5, size: 0.5,
    rarity: 'epic', weight: 4,
    bodyColor: 0x4a5570, wingColor: 0x3a4560, headColor: 0x2a3550,
    beakColor: 0x333333, bellyColor: 0xc8c0b0,
    flapSpeed: 7, flapAmplitude: 0.75
  },
  golden_eagle: {
    name: 'Golden Eagle', value: 150, speed: 4.0, size: 0.9,
    rarity: 'legendary', weight: 2,
    bodyColor: 0x6B4E1F, wingColor: 0x5a3d10, headColor: 0xD4A520,
    beakColor: 0x333333, bellyColor: 0x8B6914,
    flapSpeed: 3.5, flapAmplitude: 1.1
  }
};

export const RARITY_COLORS = {
  common: '#aaa',
  uncommon: '#5ab55a',
  rare: '#5a8ab5',
  epic: '#a55ab5',
  legendary: '#d4a853'
};

export const LOCATIONS = {
  backyard: {
    name: 'Backyard',
    cost: 0,
    description: 'Your own backyard. Small but familiar.',
    birds: ['sparrow', 'pigeon'],
    maxBirds: 4,
    areaSize: 30,
    unlocked: true
  },
  park: {
    name: 'City Park',
    cost: 50,
    description: 'Open fields and old oak trees.',
    birds: ['sparrow', 'pigeon', 'robin', 'bluejay'],
    maxBirds: 6,
    areaSize: 50,
    unlocked: false
  },
  forest: {
    name: 'Forest',
    cost: 200,
    description: 'Dense woods with rare songbirds.',
    birds: ['robin', 'bluejay', 'cardinal', 'woodpecker'],
    maxBirds: 7,
    areaSize: 60,
    unlocked: false
  },
  lakeside: {
    name: 'Lakeside',
    cost: 500,
    description: 'Calm waters attract large wading birds.',
    birds: ['robin', 'cardinal', 'heron', 'eagle'],
    maxBirds: 8,
    areaSize: 70,
    unlocked: false
  },
  mountain: {
    name: 'Mountain',
    cost: 1500,
    description: 'High altitude. Home of birds of prey.',
    birds: ['eagle', 'hawk', 'falcon', 'golden_eagle'],
    maxBirds: 6,
    areaSize: 80,
    unlocked: false
  }
};

export const WEAPONS = {
  old_rifle: {
    name: "Grandpa's Old Rifle",
    cost: 0,
    description: 'Slow and inaccurate, but it works.',
    fireRate: 2.0,
    accuracy: 0.85,
    ammo: 1,
    reloadTime: 2.5,
    spread: 0.04,
    isShotgun: false,
    owned: true
  },
  grandpas_shotgun: {
    name: "Grandpa's Shotgun",
    cost: 0,
    description: 'Wide spread, easy to hit. Great for beginners.',
    fireRate: 2.2,
    accuracy: 0.6,
    ammo: 2,
    reloadTime: 2.8,
    spread: 0.12,
    pellets: 5,
    isShotgun: true,
    owned: true
  },
  hunting_rifle: {
    name: 'Hunting Rifle',
    cost: 75,
    description: 'A proper hunting rifle. Much more reliable.',
    fireRate: 1.5,
    accuracy: 0.92,
    ammo: 1,
    reloadTime: 1.8,
    spread: 0.025,
    isShotgun: false,
    owned: false
  },
  combat_shotgun: {
    name: 'Combat Shotgun',
    cost: 200,
    description: '6 pellets, fast reload. Devastating at close range.',
    fireRate: 1.6,
    accuracy: 0.65,
    ammo: 3,
    reloadTime: 1.8,
    spread: 0.10,
    pellets: 6,
    isShotgun: true,
    owned: false
  },
  scoped_rifle: {
    name: 'Scoped Rifle',
    cost: 500,
    description: 'Zoom in for deadly precision shots.',
    fireRate: 2.0,
    accuracy: 0.97,
    ammo: 1,
    reloadTime: 2.0,
    spread: 0.01,
    hasScope: true,
    isShotgun: false,
    owned: false
  },
  semi_auto: {
    name: 'Semi-Auto',
    cost: 1200,
    description: 'Fast firing. 5 shots before reload.',
    fireRate: 0.4,
    accuracy: 0.88,
    ammo: 5,
    reloadTime: 2.5,
    spread: 0.035,
    isShotgun: false,
    owned: false
  }
};

export class Economy {
  constructor() {
    this.saveKey = 'garys_life_save';
    this.money = 0;
    this.day = 1;
    this.totalBirdsKilled = 0;
    this.totalMoneyEarned = 0;
    this.currentWeapon = 'old_rifle';
    this.currentLocation = 'backyard';
    this.huntBag = [];
    this.inventory = { tags: [] };
    this.equipped = { tag: null };
    this.weapons = JSON.parse(JSON.stringify(WEAPONS));
    this.locations = JSON.parse(JSON.stringify(LOCATIONS));
    this.load();
  }

  setSaveKey(key) {
    this.saveKey = key;
  }

  setDisplayName(name) {
    this.displayName = name;
  }

  save() {
    const data = {
      money: this.money,
      day: this.day,
      totalBirdsKilled: this.totalBirdsKilled,
      totalMoneyEarned: this.totalMoneyEarned,
      currentWeapon: this.currentWeapon,
      currentLocation: this.currentLocation,
      inventory: this.inventory,
      equipped: this.equipped,
      weaponOwned: {},
      locationUnlocked: {}
    };
    for (const [k, w] of Object.entries(this.weapons)) {
      data.weaponOwned[k] = w.owned;
    }
    for (const [k, l] of Object.entries(this.locations)) {
      data.locationUnlocked[k] = l.unlocked;
    }
    localStorage.setItem(this.saveKey, JSON.stringify(data));
    // Auto-update leaderboard on every save
    if (this.displayName) {
      this.updateLeaderboard(this.displayName);
    }
  }

  load() {
    const raw = localStorage.getItem(this.saveKey);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      this.money = data.money || 0;
      this.day = data.day || 1;
      this.totalBirdsKilled = data.totalBirdsKilled || 0;
      this.totalMoneyEarned = data.totalMoneyEarned || 0;
      if (this.totalMoneyEarned < this.money) {
        this.totalMoneyEarned = this.money;
      }
      this.currentWeapon = data.currentWeapon || 'old_rifle';
      this.currentLocation = data.currentLocation || 'backyard';
      this.inventory = data.inventory || { tags: [] };
      this.equipped = data.equipped || { tag: null };
      if (data.weaponOwned) {
        for (const [k, v] of Object.entries(data.weaponOwned)) {
          if (this.weapons[k]) this.weapons[k].owned = v;
        }
      }
      if (data.locationUnlocked) {
        for (const [k, v] of Object.entries(data.locationUnlocked)) {
          if (this.locations[k]) this.locations[k].unlocked = v;
        }
      }
    } catch (e) {
      console.warn('Failed to load save:', e);
    }
  }

  reset() {
    localStorage.removeItem(this.saveKey);
    this.money = 0;
    this.day = 1;
    this.totalBirdsKilled = 0;
    this.totalMoneyEarned = 0;
    this.currentWeapon = 'old_rifle';
    this.currentLocation = 'backyard';
    this.weapons = JSON.parse(JSON.stringify(WEAPONS));
    this.locations = JSON.parse(JSON.stringify(LOCATIONS));
    this.huntBag = [];
  }

  /**
   * Update the shared leaderboard with current user's stats
   */
  updateLeaderboard(displayName) {
    try {
      const lb = JSON.parse(localStorage.getItem('garys_life_leaderboard') || '{}');
      lb[displayName] = {
        currentMoney: this.money,
        totalEarned: this.totalMoneyEarned,
        day: this.day,
        tag: this.equipped && this.equipped.tag ? this.equipped.tag : null,
        updatedAt: Date.now()
      };
      localStorage.setItem('garys_life_leaderboard', JSON.stringify(lb));
    } catch (e) {
      console.warn('Failed to update leaderboard:', e);
    }
  }

  /**
   * Get leaderboard data sorted for display
   */
  static getLeaderboard() {
    try {
      const lb = JSON.parse(localStorage.getItem('garys_life_leaderboard') || '{}');
      const entries = Object.entries(lb).map(([name, data]) => ({
        name,
        currentMoney: data.currentMoney || 0,
        totalEarned: data.totalEarned || 0,
        day: data.day || 1,
        tag: data.tag || null
      }));
      return {
        byCurrentMoney: [...entries].sort((a, b) => b.currentMoney - a.currentMoney),
        byTotalEarned: [...entries].sort((a, b) => b.totalEarned - a.totalEarned)
      };
    } catch {
      return { byCurrentMoney: [], byTotalEarned: [] };
    }
  }

  getWeapon() {
    return this.weapons[this.currentWeapon];
  }

  getLocation() {
    return this.locations[this.currentLocation];
  }

  addBirdToBag(birdKey) {
    this.huntBag.push(birdKey);
    this.totalBirdsKilled++;
  }

  sellBag() {
    let total = 0;
    for (const key of this.huntBag) {
      const bird = BIRDS[key];
      // Small random fluctuation ±15%
      const fluctuation = 0.85 + Math.random() * 0.3;
      const value = Math.round(bird.value * fluctuation);
      total += value;
    }
    this.money += total;
    const bag = [...this.huntBag];
    this.huntBag = [];
    return { total, bag };
  }

  buyWeapon(key) {
    const weapon = this.weapons[key];
    if (!weapon || weapon.owned || this.money < weapon.cost) return false;
    this.money -= weapon.cost;
    weapon.owned = true;
    this.currentWeapon = key;
    this.save();
    return true;
  }

  buyLocation(key) {
    const loc = this.locations[key];
    if (!loc || loc.unlocked || this.money < loc.cost) return false;
    this.money -= loc.cost;
    loc.unlocked = true;
    this.save();
    return true;
  }

  selectWeapon(key) {
    if (this.weapons[key] && this.weapons[key].owned) {
      this.currentWeapon = key;
    }
  }

  getOwnedWeaponKeys() {
    return Object.entries(this.weapons)
      .filter(([k, w]) => w.owned)
      .map(([k]) => k);
  }

  selectLocation(key) {
    if (this.locations[key] && this.locations[key].unlocked) {
      this.currentLocation = key;
    }
  }

  getAvailableBirds() {
    const loc = this.getLocation();
    return loc.birds;
  }

  /**
   * Pick a random bird based on location rarity weights
   */
  spawnRandomBird() {
    const available = this.getAvailableBirds();
    let totalWeight = 0;
    for (const key of available) {
      totalWeight += BIRDS[key].weight;
    }
    let roll = Math.random() * totalWeight;
    for (const key of available) {
      roll -= BIRDS[key].weight;
      if (roll <= 0) return key;
    }
    return available[available.length - 1];
  }

  hasWon() {
    return this.money >= 5000;
  }
}
