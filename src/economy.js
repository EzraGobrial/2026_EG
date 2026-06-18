// ═══════════════════════════════════════════════
// Gary's Life — Economy System
// Bird data, weapon data, location data, wallet
// Persistence via Firebase Firestore
// ═══════════════════════════════════════════════

import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase.js';
import { serializeChallenges, deserializeChallenges, generateDailyChallenges, getRealDayKey } from './challenges.js';

export const BIRDS = {
  // ─── Dimension 1: Earth ─────────────────────
  sparrow: {
    name: 'Sparrow', value: 2, speed: 1.8, size: 0.45,
    rarity: 'common', weight: 40, hp: 1,
    bodyColor: 0x8B7355, wingColor: 0x6B5B45, headColor: 0x8B7355,
    beakColor: 0x4a3a2a, bellyColor: 0xd4c4a8,
    flapSpeed: 7, flapAmplitude: 0.5
  },
  pigeon: {
    name: 'Pigeon', value: 3, speed: 1.2, size: 0.55,
    rarity: 'common', weight: 35, hp: 1,
    bodyColor: 0x808890, wingColor: 0x606870, headColor: 0x556B6B,
    beakColor: 0x555555, bellyColor: 0xa0a8b0,
    flapSpeed: 5, flapAmplitude: 0.4
  },
  robin: {
    name: 'Robin', value: 5, speed: 3.0, size: 0.32,
    rarity: 'common', weight: 30, hp: 1,
    bodyColor: 0x6B5B45, wingColor: 0x5a4a35, headColor: 0x3a3a3a,
    beakColor: 0x4a4a30, bellyColor: 0xCC4422,
    flapSpeed: 11, flapAmplitude: 0.65
  },
  bluejay: {
    name: 'Blue Jay', value: 8, speed: 3.8, size: 0.38,
    rarity: 'uncommon', weight: 20, hp: 1,
    bodyColor: 0x3060BB, wingColor: 0x2050AA, headColor: 0x2855A0,
    beakColor: 0x222222, bellyColor: 0xd8d8e0,
    flapSpeed: 10, flapAmplitude: 0.6
  },
  cardinal: {
    name: 'Cardinal', value: 12, speed: 2.8, size: 0.34,
    rarity: 'uncommon', weight: 18, hp: 1,
    bodyColor: 0xCC2222, wingColor: 0xAA1818, headColor: 0xDD2828,
    beakColor: 0xDD8822, bellyColor: 0xBB3030,
    flapSpeed: 10, flapAmplitude: 0.6
  },
  woodpecker: {
    name: 'Woodpecker', value: 15, speed: 2.5, size: 0.35,
    rarity: 'uncommon', weight: 15, hp: 1,
    bodyColor: 0x1a1a1a, wingColor: 0x111111, headColor: 0xCC1111,
    beakColor: 0x333333, bellyColor: 0xeeeeee,
    flapSpeed: 14, flapAmplitude: 0.4
  },
  heron: {
    name: 'Heron', value: 25, speed: 1.8, size: 0.7,
    rarity: 'rare', weight: 10, hp: 1,
    bodyColor: 0x8899AA, wingColor: 0x6677AA, headColor: 0xd0d0e0,
    beakColor: 0xccaa33, bellyColor: 0xc8c8d8,
    flapSpeed: 5, flapAmplitude: 0.9
  },
  eagle: {
    name: 'Eagle', value: 40, speed: 3.5, size: 0.8,
    rarity: 'rare', weight: 8, hp: 1,
    bodyColor: 0x3a2a18, wingColor: 0x2a1a08, headColor: 0xeeeeee,
    beakColor: 0xccaa00, bellyColor: 0x3a2a18,
    flapSpeed: 4, flapAmplitude: 1.0
  },
  hawk: {
    name: 'Hawk', value: 50, speed: 3.8, size: 0.6,
    rarity: 'rare', weight: 6, hp: 1,
    bodyColor: 0x6B4226, wingColor: 0x5a3520, headColor: 0x7a5030,
    beakColor: 0x333333, bellyColor: 0xd4b896,
    flapSpeed: 6, flapAmplitude: 0.8
  },
  falcon: {
    name: 'Falcon', value: 75, speed: 3.8, size: 0.5,
    rarity: 'epic', weight: 4, hp: 1,
    bodyColor: 0x4a5570, wingColor: 0x3a4560, headColor: 0x2a3550,
    beakColor: 0x333333, bellyColor: 0xc8c0b0,
    flapSpeed: 7, flapAmplitude: 0.75
  },
  golden_eagle: {
    name: 'Golden Eagle', value: 150, speed: 3.5, size: 0.9,
    rarity: 'legendary', weight: 2, hp: 1,
    bodyColor: 0x6B4E1F, wingColor: 0x5a3d10, headColor: 0xD4A520,
    beakColor: 0x333333, bellyColor: 0x8B6914,
    flapSpeed: 3.5, flapAmplitude: 1.1
  },
  // ─── Boss Birds: Tier 1 (Mini-Bosses, 2 HP) ──
  shadow_raven: {
    name: 'Shadow Raven', value: 300, speed: 2.0, size: 2.0,
    rarity: 'legendary', weight: 0, hp: 2, bossTier: 1, bossDimension: 1,
    bodyColor: 0x1a1a2a, wingColor: 0x222244, headColor: 0x2a2a3a,
    beakColor: 0x444444, bellyColor: 0x333355,
    flapSpeed: 2.0, flapAmplitude: 0.7
  },
  jungle_warden: {
    name: 'Jungle Warden', value: 800, speed: 2.2, size: 2.2,
    rarity: 'legendary', weight: 0, hp: 2, bossTier: 1, bossDimension: 2,
    bodyColor: 0x226622, wingColor: 0x115511, headColor: 0x338833,
    beakColor: 0xccaa00, bellyColor: 0x44aa44,
    flapSpeed: 2.0, flapAmplitude: 0.75
  },
  blizzard_hawk: {
    name: 'Blizzard Hawk', value: 1000, speed: 2.4, size: 2.3,
    rarity: 'legendary', weight: 0, hp: 2, bossTier: 1, bossDimension: 3,
    bodyColor: 0xbbccdd, wingColor: 0x99aabb, headColor: 0xccddee,
    beakColor: 0x556677, bellyColor: 0xddeeff,
    flapSpeed: 2.0, flapAmplitude: 0.75
  },


  // ─── Boss Birds: Tier 2 (Bosses, 3 HP) ────────
  thunderhawk: {
    name: 'Thunderhawk', value: 500, speed: 1.8, size: 2.5,
    rarity: 'legendary', weight: 0, hp: 3, bossTier: 2, bossDimension: 1,
    bodyColor: 0x2a2a3a, wingColor: 0x4444aa, headColor: 0x3333aa,
    beakColor: 0xddaa22, bellyColor: 0x5555cc,
    flapSpeed: 1.5, flapAmplitude: 0.7
  },
  storm_phoenix: {
    name: 'Storm Phoenix', value: 1300, speed: 2.0, size: 2.8,
    rarity: 'legendary', weight: 0, hp: 3, bossTier: 2, bossDimension: 2,
    bodyColor: 0x553399, wingColor: 0x7744cc, headColor: 0x6633bb,
    beakColor: 0xffcc00, bellyColor: 0x8855dd,
    flapSpeed: 1.8, flapAmplitude: 0.8
  },
  frost_wyrm: {
    name: 'Frost Wyrm', value: 1600, speed: 1.5, size: 3.0,
    rarity: 'legendary', weight: 0, hp: 3, bossTier: 2, bossDimension: 3,
    bodyColor: 0x88bbdd, wingColor: 0xaaddff, headColor: 0x99ccee,
    beakColor: 0x4488aa, bellyColor: 0xbbddff,
    flapSpeed: 1.2, flapAmplitude: 0.9
  },
  sun_dragon: {
    name: 'Sun Dragon', value: 2000, speed: 1.6, size: 3.0,
    rarity: 'legendary', weight: 0, hp: 3, bossTier: 2, bossDimension: 4,
    bodyColor: 0xcc5500, wingColor: 0xff7722, headColor: 0xdd6611,
    beakColor: 0xffaa00, bellyColor: 0xff9933,
    flapSpeed: 1.3, flapAmplitude: 0.85
  },

  // ─── Boss Birds: Tier 3 (Mega-Bosses, 5 HP) ───
  void_reaper: {
    name: 'Void Reaper', value: 2400, speed: 1.4, size: 3.5,
    rarity: 'legendary', weight: 0, hp: 5, bossTier: 3, bossDimension: 3,
    bodyColor: 0x110022, wingColor: 0x220044, headColor: 0x1a0033,
    beakColor: 0x8800ff, bellyColor: 0x330066,
    flapSpeed: 1.0, flapAmplitude: 1.0
  },
  inferno_titan: {
    name: 'Inferno Titan', value: 3500, speed: 1.2, size: 4.0,
    rarity: 'legendary', weight: 0, hp: 5, bossTier: 3, bossDimension: 4,
    bodyColor: 0x881100, wingColor: 0xaa2200, headColor: 0xcc3300,
    beakColor: 0xff6600, bellyColor: 0xff4400,
    flapSpeed: 0.9, flapAmplitude: 1.1
  },

  // ─── Dimension 2: Tropics ──────────────────
  parrot: {
    name: 'Parrot', value: 160, speed: 3.2, size: 0.45,
    rarity: 'common', weight: 35, hp: 1,
    bodyColor: 0x22AA22, wingColor: 0x1188DD, headColor: 0xDD2222,
    beakColor: 0x333333, bellyColor: 0x44CC44,
    flapSpeed: 8, flapAmplitude: 0.5
  },
  toucan: {
    name: 'Toucan', value: 180, speed: 3.0, size: 0.5,
    rarity: 'common', weight: 30, hp: 1,
    bodyColor: 0x1a1a1a, wingColor: 0x111111, headColor: 0x1a1a1a,
    beakColor: 0xFF8800, bellyColor: 0xFFDD00,
    flapSpeed: 6, flapAmplitude: 0.55
  },
  flamingo: {
    name: 'Flamingo', value: 205, speed: 2.8, size: 0.75,
    rarity: 'uncommon', weight: 20, hp: 1,
    bodyColor: 0xFF7799, wingColor: 0xFF5588, headColor: 0xFFAABB,
    beakColor: 0x222222, bellyColor: 0xFF88AA,
    flapSpeed: 4, flapAmplitude: 0.85
  },
  macaw: {
    name: 'Macaw', value: 235, speed: 4.5, size: 0.55,
    rarity: 'uncommon', weight: 15, hp: 1,
    bodyColor: 0xDD2222, wingColor: 0x2266DD, headColor: 0xDD2222,
    beakColor: 0x222222, bellyColor: 0xFFCC00,
    flapSpeed: 9, flapAmplitude: 0.6
  },
  hornbill: {
    name: 'Hornbill', value: 270, speed: 3.8, size: 0.6,
    rarity: 'rare', weight: 10, hp: 1,
    bodyColor: 0x1a1a1a, wingColor: 0x222222, headColor: 0x1a1a1a,
    beakColor: 0xFFAA00, bellyColor: 0xeeeeee,
    flapSpeed: 5, flapAmplitude: 0.7
  },
  quetzal: {
    name: 'Quetzal', value: 320, speed: 4.8, size: 0.4,
    rarity: 'rare', weight: 8, hp: 1,
    bodyColor: 0x00AA55, wingColor: 0x008844, headColor: 0xDD2222,
    beakColor: 0xCCAA00, bellyColor: 0x00CC66,
    flapSpeed: 10, flapAmplitude: 0.65
  },
  harpy_eagle: {
    name: 'Harpy Eagle', value: 360, speed: 4.5, size: 0.85,
    rarity: 'epic', weight: 5, hp: 1,
    bodyColor: 0x4a4a4a, wingColor: 0x333333, headColor: 0xcccccc,
    beakColor: 0x333333, bellyColor: 0xdddddd,
    flapSpeed: 4, flapAmplitude: 1.0
  },
  phoenix_bird: {
    name: 'Bird of Paradise', value: 450, speed: 5.0, size: 0.5,
    rarity: 'legendary', weight: 2, hp: 1,
    bodyColor: 0xFF4400, wingColor: 0xDD2200, headColor: 0xFF6600,
    beakColor: 0x333333, bellyColor: 0xFFAA00,
    flapSpeed: 8, flapAmplitude: 0.7
  },

  // ─── Dimension 3: Arctic ───────────────────
  snow_bunting: {
    name: 'Snow Bunting', value: 20, speed: 3.8, size: 0.3,
    rarity: 'common', weight: 35, hp: 1,
    bodyColor: 0xeeeeee, wingColor: 0x1a1a1a, headColor: 0xeeeeee,
    beakColor: 0xCCAA00, bellyColor: 0xffffff,
    flapSpeed: 10, flapAmplitude: 0.5
  },
  ptarmigan: {
    name: 'Ptarmigan', value: 35, speed: 3.5, size: 0.45,
    rarity: 'common', weight: 30, hp: 1,
    bodyColor: 0xddddee, wingColor: 0xccccdd, headColor: 0xddddee,
    beakColor: 0x333333, bellyColor: 0xffffff,
    flapSpeed: 7, flapAmplitude: 0.5
  },
  snowy_owl: {
    name: 'Snowy Owl', value: 60, speed: 3.8, size: 0.65,
    rarity: 'uncommon', weight: 18, hp: 1,
    bodyColor: 0xf0f0f0, wingColor: 0xe0e0e0, headColor: 0xffffff,
    beakColor: 0x333333, bellyColor: 0xffffff,
    flapSpeed: 5, flapAmplitude: 0.8
  },
  puffin: {
    name: 'Puffin', value: 80, speed: 4.5, size: 0.35,
    rarity: 'uncommon', weight: 15, hp: 1,
    bodyColor: 0x1a1a1a, wingColor: 0x111111, headColor: 0x1a1a1a,
    beakColor: 0xFF6622, bellyColor: 0xeeeeee,
    flapSpeed: 12, flapAmplitude: 0.45
  },
  arctic_tern: {
    name: 'Arctic Tern', value: 110, speed: 5.0, size: 0.35,
    rarity: 'rare', weight: 10, hp: 1,
    bodyColor: 0xcccccc, wingColor: 0xaaaaaa, headColor: 0x1a1a1a,
    beakColor: 0xDD2222, bellyColor: 0xeeeeee,
    flapSpeed: 11, flapAmplitude: 0.55
  },
  gyrfalcon: {
    name: 'Gyrfalcon', value: 180, speed: 5.2, size: 0.6,
    rarity: 'epic', weight: 5, hp: 1,
    bodyColor: 0xdddde0, wingColor: 0xc0c0c8, headColor: 0xdddde0,
    beakColor: 0x333333, bellyColor: 0xeeeeee,
    flapSpeed: 7, flapAmplitude: 0.75
  },
  ice_phoenix: {
    name: 'Ice Phoenix', value: 350, speed: 5.5, size: 0.7,
    rarity: 'legendary', weight: 2, hp: 1,
    bodyColor: 0x88CCFF, wingColor: 0x55AAEE, headColor: 0xAADDFF,
    beakColor: 0x4488AA, bellyColor: 0xCCEEFF,
    flapSpeed: 5, flapAmplitude: 0.9
  },

  // ─── Dimension 4: Desert ───────────────────
  sandgrouse: {
    name: 'Sandgrouse', value: 30, speed: 4.0, size: 0.4,
    rarity: 'common', weight: 35, hp: 1,
    bodyColor: 0xC4A060, wingColor: 0xAA8840, headColor: 0xC4A060,
    beakColor: 0x555555, bellyColor: 0xD8C090,
    flapSpeed: 8, flapAmplitude: 0.5
  },
  roadrunner: {
    name: 'Roadrunner', value: 50, speed: 4.8, size: 0.4,
    rarity: 'common', weight: 28, hp: 1,
    bodyColor: 0x4a5540, wingColor: 0x3a4530, headColor: 0x4a5540,
    beakColor: 0x333333, bellyColor: 0xccccbb,
    flapSpeed: 6, flapAmplitude: 0.4
  },
  vulture: {
    name: 'Vulture', value: 80, speed: 3.2, size: 0.85,
    rarity: 'uncommon', weight: 18, hp: 1,
    bodyColor: 0x3a2a1a, wingColor: 0x2a1a0a, headColor: 0xCC5544,
    beakColor: 0x444444, bellyColor: 0x3a2a1a,
    flapSpeed: 3, flapAmplitude: 1.0
  },
  secretary_bird: {
    name: 'Secretary Bird', value: 120, speed: 4.5, size: 0.7,
    rarity: 'uncommon', weight: 14, hp: 1,
    bodyColor: 0xaaaaaa, wingColor: 0x1a1a1a, headColor: 0xaaaaaa,
    beakColor: 0x444444, bellyColor: 0xcccccc,
    flapSpeed: 5, flapAmplitude: 0.8
  },
  desert_hawk: {
    name: 'Desert Hawk', value: 180, speed: 5.5, size: 0.55,
    rarity: 'rare', weight: 8, hp: 1,
    bodyColor: 0x8B6914, wingColor: 0x7a5810, headColor: 0xAA8820,
    beakColor: 0x333333, bellyColor: 0xD4B896,
    flapSpeed: 7, flapAmplitude: 0.75
  },
  sand_falcon: {
    name: 'Sand Falcon', value: 250, speed: 5.8, size: 0.5,
    rarity: 'epic', weight: 5, hp: 1,
    bodyColor: 0xD4A050, wingColor: 0xC09040, headColor: 0xD4A050,
    beakColor: 0x333333, bellyColor: 0xE8D0A0,
    flapSpeed: 8, flapAmplitude: 0.7
  },
  sun_phoenix: {
    name: 'Sun Phoenix', value: 500, speed: 6.0, size: 0.75,
    rarity: 'legendary', weight: 2, hp: 1,
    bodyColor: 0xFF6600, wingColor: 0xDD4400, headColor: 0xFFAA00,
    beakColor: 0xCC4400, bellyColor: 0xFFCC00,
    flapSpeed: 5, flapAmplitude: 0.9
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
  // ─── Dimension 1: Earth ─────────────────────
  old_rifle: {
    name: "Grandpa's Old Rifle",
    cost: 0, dimension: 1,
    description: 'Slow and inaccurate, but it works.',
    fireRate: 2.0, accuracy: 0.85, ammo: 1, reloadTime: 2.5,
    spread: 0.04, isShotgun: false, owned: true, isGrandpa: true
  },
  grandpas_shotgun: {
    name: "Grandpa's Shotgun",
    cost: 0, dimension: 1,
    description: 'Wide spread, easy to hit. Great for beginners.',
    fireRate: 2.2, accuracy: 0.6, ammo: 2, reloadTime: 2.8,
    spread: 0.12, pellets: 5, isShotgun: true, owned: true, isGrandpa: true
  },
  hunting_rifle: {
    name: 'Hunting Rifle',
    cost: 75, dimension: 1,
    description: 'A proper hunting rifle. Much more reliable.',
    fireRate: 1.5, accuracy: 0.92, ammo: 1, reloadTime: 1.8,
    spread: 0.025, isShotgun: false, owned: false
  },
  combat_shotgun: {
    name: 'Combat Shotgun',
    cost: 200, dimension: 1,
    description: '6 pellets, fast reload. Devastating at close range.',
    fireRate: 1.6, accuracy: 0.65, ammo: 3, reloadTime: 1.8,
    spread: 0.10, pellets: 6, isShotgun: true, owned: false
  },
  scoped_rifle: {
    name: 'Scoped Rifle',
    cost: 500, dimension: 1,
    description: 'Zoom in for deadly precision shots.',
    fireRate: 2.0, accuracy: 0.97, ammo: 1, reloadTime: 2.0,
    spread: 0.01, hasScope: true, isShotgun: false, owned: false
  },
  semi_auto: {
    name: 'Semi-Auto',
    cost: 1200, dimension: 1,
    description: 'Fast firing. 5 shots before reload.',
    fireRate: 0.4, accuracy: 0.88, ammo: 5, reloadTime: 2.5,
    spread: 0.035, isShotgun: false, owned: false
  },
  grandpas_rifle: {
    name: "Great-Grandfather's Rifle",
    cost: 0, dimension: 1,
    description: 'A rifle from another era. Immaculate. Infinite ammo. Never needs reloading.',
    fireRate: 0.6, accuracy: 0.96, ammo: Infinity, reloadTime: 0,
    spread: 0.065, isShotgun: true, crosshairShape: 'square',
    noReload: true, isLegendary: true, owned: false, isGrandpa: true
  },

  // ─── Dimension 2: Tropics ──────────────────
  crossbow: {
    name: 'Crossbow',
    cost: 800, dimension: 2,
    description: 'Silent and deadly. Lightning-fast reload.',
    fireRate: 2.5, accuracy: 0.95, ammo: 1, reloadTime: 0.8,
    spread: 0.015, isShotgun: false, owned: false
  },
  auto_shotgun: {
    name: 'Auto Shotgun',
    cost: 1500, dimension: 2,
    description: 'Rapid-fire shotgun. 4 shots, 8 pellets each.',
    fireRate: 0.6, accuracy: 0.55, ammo: 4, reloadTime: 3.0,
    spread: 0.14, pellets: 8, isShotgun: true, owned: false
  },

  // ─── Dimension 3: Arctic ───────────────────
  rail_gun: {
    name: 'Rail Gun',
    cost: 2000, dimension: 3,
    description: 'Electromagnetic precision. Pierces through anything.',
    fireRate: 3.0, accuracy: 0.99, ammo: 1, reloadTime: 3.5,
    spread: 0.005, hasScope: true, isShotgun: false, owned: false
  },
  slomo_gun: {
    name: 'Slo-Mo Gun',
    cost: 3000, dimension: 3,
    description: 'Slows time when you scope in. 3-second window, 5s cooldown.',
    fireRate: 1.8, accuracy: 0.93, ammo: 2, reloadTime: 2.0,
    spread: 0.02, hasScope: true, isSlomo: true, isShotgun: false, owned: false
  },

  // ─── Dimension 4: Desert ───────────────────
  laser_rifle: {
    name: 'Laser Rifle',
    cost: 4000, dimension: 4,
    description: 'Instant-hit beam. No spread, no bullet travel time.',
    fireRate: 1.2, accuracy: 1.0, ammo: 3, reloadTime: 2.5,
    spread: 0.0, hasScope: true, isShotgun: false, owned: false
  },
  plasma_shotgun: {
    name: 'Plasma Shotgun',
    cost: 5000, dimension: 4,
    description: 'Fires superheated plasma. 10 pellets, massive spread.',
    fireRate: 1.0, accuracy: 0.5, ammo: 2, reloadTime: 3.5,
    spread: 0.18, pellets: 10, isShotgun: true, owned: false
  }
};

export const BANNERS = {
  dev:           { name: 'DEV',           cost: 0,    color: '#7c3aed', devCode: true },
  hunter_green:  { name: 'Hunter Green',  cost: 200,  color: '#2d5a2d' },
  golden_hour:   { name: 'Golden Hour',   cost: 500,  color: '#d4a853' },
  midnight:      { name: 'Midnight',      cost: 300,  color: '#1a1a3a' },
  crimson:       { name: 'Crimson',       cost: 400,  color: '#8b2252' },
  arctic_frost:  { name: 'Arctic Frost',  cost: 600,  color: '#88ccee', dimension: 3 },
  desert_flame:  { name: 'Desert Flame',  cost: 800,  color: '#cc5522', dimension: 4 },
  champion:      { name: 'Champion',      cost: null, color: '#ffd700', tournamentOnly: true },
};

export const TAGS = {
  dev:           { name: 'DEV',         cost: 0,    color: '#7c3aed', textColor: '#a78bfa', devCode: true },
  hunter:        { name: 'Hunter',      cost: 150,  color: '#2d5a2d', textColor: '#6ee76e' },
  tycoon:        { name: 'Tycoon',      cost: 400,  color: '#5a3a05', textColor: '#f5d070' },
  sharpshooter:  { name: 'Sharpshooter',cost: 300,  color: '#1a3060', textColor: '#90b8ff' },
  legend:        { name: 'Legend',      cost: 800,  color: '#5a0a0a', textColor: '#ff8080' },
};

export const CONSUMABLES = {
  // ─── Boosts (general hunt buffs, stack freely) ───
  double_money:   { name: 'Double Money',   cost: 100, desc: '2x earnings this hunt',        category: 'boost', duration: 'full' },
  extra_time:     { name: 'Extra Time',      cost: 75,  desc: '+15 seconds to hunt',          category: 'boost', duration: 'full' },
  bird_magnet:    { name: 'Bird Magnet',     cost: 150, desc: 'Faster bird spawns',            category: 'boost', duration: 'full' },
  steady_hands:   { name: 'Steady Hands',    cost: 125, desc: 'Perfect accuracy for 1 hunt',   category: 'boost', duration: 'full' },

  // ─── Potions (luck/spawn effects, only one equipped at a time) ───
  lucky_charm:    { name: 'Lucky Charm',     cost: 200, desc: '2x rare+ bird chance — whole hunt',                category: 'potion', duration: 'full', luckMult: 2 },

  luck_potion_1:  { name: 'Luck Potion I',   cost: 60,  desc: '+50% rare+ bird chance — first half',              category: 'potion', duration: 'half', tier: 1, luckMult: 1.5 },
  luck_potion_2:  { name: 'Luck Potion II',  cost: 130, desc: '2x rare+ bird chance — first half',                category: 'potion', duration: 'half', tier: 2, luckMult: 2 },
  luck_potion_3:  { name: 'Luck Potion III', cost: 240, desc: '2x rare+ bird chance — whole hunt',                category: 'potion', duration: 'full', tier: 3, luckMult: 2 },
  luck_potion_4:  { name: 'Luck Potion IV',  cost: 400, desc: '3x rare+ bird chance — whole hunt',                category: 'potion', duration: 'full', tier: 4, luckMult: 3 },
  luck_potion_5:  { name: 'Luck Potion V',   cost: 650, desc: '5x rare+ bird chance & extra legendary boost — whole hunt', category: 'potion', duration: 'full', tier: 5, luckMult: 5, legendaryBoost: 3 },

  bird_swarm:     { name: '2x Birds',        cost: 220, desc: 'Doubles active bird count & spawn rate — whole hunt', category: 'potion', duration: 'full', doubleBirds: true },
};

export const WEAPON_SKINS = {
  default:        { name: 'Default',        cost: 0,    colors: null },
  gold:           { name: 'Gold',           cost: 500,  colors: { stock: 0xbfa24d, metal: 0xd4a853 } },
  arctic_camo:    { name: 'Arctic',         cost: 400,  colors: { stock: 0xccddee, metal: 0xaabbcc } },
  shadow:         { name: 'Shadow',         cost: 600,  colors: { stock: 0x1a1a1a, metal: 0x333333 } },
  neon:           { name: 'Neon',           cost: 800,  colors: { stock: 0x00ff88, metal: 0x00ccff } },
  champion_gold:  { name: 'Champion Gold',  cost: null, colors: { stock: 0xffd700, metal: 0xffc107 }, tournamentOnly: true },
};

export const PETS = {
  hunting_dog: {
    name: 'Hunting Dog', cost: 300, ability: 'retrieve',
    desc: 'Auto-retrieves fallen birds (+$5 per bird bonus)',
    color: 0x8B6914
  },
  scout_hawk: {
    name: 'Scout Hawk', cost: 500, ability: 'spot',
    desc: 'Highlights rare birds with a glow',
    color: 0x6B4226
  },
  falcon: {
    name: 'Falcon', cost: 800, ability: 'assist',
    desc: 'Falcon occasionally catches small birds for you',
    color: 0x4a5570
  }
};

export const RANKS = [
  { level: 1, name: 'Bronze',  icon: '🥉', xpRequired: 0,     color: '#CD7F32', glow: false },
  { level: 2, name: 'Silver',  icon: '🥈', xpRequired: 500,   color: '#E5E4E2', glow: false },
  { level: 3, name: 'Gold',    icon: '🥇', xpRequired: 2500,  color: '#FFD700', glow: false },
  { level: 4, name: 'Diamond', icon: '💎', xpRequired: 8000,  color: '#00E5FF', glow: true },
  { level: 5, name: 'Savage',  icon: '👑', xpRequired: 25000, color: '#FFD700', glow: true, holographic: true },
];

// ═══════════════════════════════════════════════
// Dimensions Configuration
// ═══════════════════════════════════════════════

export const DIMENSIONS = [
  {
    id: 1,
    name: 'Earth',
    fee: 0, // Starting dimension
    locations: {
      backyard: {
        name: 'Backyard', cost: 0,
        description: 'Your own backyard. Small but familiar.',
        birds: ['sparrow', 'pigeon'], maxBirds: 4, areaSize: 30, unlocked: true
      },
      park: {
        name: 'City Park', cost: 50,
        description: 'Open fields and old oak trees.',
        birds: ['sparrow', 'pigeon', 'robin', 'bluejay'], maxBirds: 6, areaSize: 50, unlocked: false
      },
      forest: {
        name: 'Forest', cost: 200,
        description: 'Dense woods with rare songbirds.',
        birds: ['robin', 'bluejay', 'cardinal', 'woodpecker'], maxBirds: 7, areaSize: 60, unlocked: false
      },
      lakeside: {
        name: 'Lakeside', cost: 500,
        description: 'Calm waters attract large wading birds.',
        birds: ['robin', 'cardinal', 'heron', 'eagle'], maxBirds: 8, areaSize: 70, unlocked: false
      },
      mountain: {
        name: 'Mountain', cost: 1500,
        description: 'High altitude. Home of birds of prey.',
        birds: ['eagle', 'hawk', 'falcon', 'golden_eagle'], maxBirds: 6, areaSize: 80, unlocked: false
      }
    },
    weapons: ['old_rifle', 'grandpas_shotgun', 'hunting_rifle', 'combat_shotgun', 'scoped_rifle', 'semi_auto', 'grandpas_rifle']
  },
  {
    id: 2,
    name: 'Tropics',
    fee: 2000,
    locations: {
      beach: {
        name: 'Beach', cost: 1000,
        description: 'Sandy shores with seabirds and tropical flyers.',
        birds: ['parrot', 'toucan'], maxBirds: 5, areaSize: 50, unlocked: false
      },
      jungle: {
        name: 'Jungle', cost: 2000,
        description: 'Dense canopy. Colorful birds everywhere.',
        birds: ['parrot', 'toucan', 'flamingo', 'macaw'], maxBirds: 7, areaSize: 55, unlocked: false
      },
      swamp: {
        name: 'Swamp', cost: 3500,
        description: 'Murky waters hide rare species.',
        birds: ['flamingo', 'macaw', 'hornbill'], maxBirds: 6, areaSize: 45, unlocked: false
      },
      volcano: {
        name: 'Volcano', cost: 6000,
        description: 'Volcanic ridges attract fearless hunters.',
        birds: ['hornbill', 'quetzal', 'harpy_eagle'], maxBirds: 5, areaSize: 60, unlocked: false
      },
      island: {
        name: 'Island', cost: 10000,
        description: 'Remote island paradise. Legendary birds nest here.',
        birds: ['quetzal', 'harpy_eagle', 'phoenix_bird'], maxBirds: 5, areaSize: 70, unlocked: false
      }
    },
    weapons: ['crossbow', 'auto_shotgun']
  },
  {
    id: 3,
    name: 'Arctic',
    fee: 5000,
    locations: {
      tundra: {
        name: 'Tundra', cost: 800,
        description: 'Flat, frozen plains. Birds camouflage in the snow.',
        birds: ['snow_bunting', 'ptarmigan'], maxBirds: 5, areaSize: 60, unlocked: false
      },
      glacier: {
        name: 'Glacier', cost: 1500,
        description: 'Icy cliffs and frozen waterfalls.',
        birds: ['snow_bunting', 'ptarmigan', 'snowy_owl'], maxBirds: 6, areaSize: 50, unlocked: false
      },
      ice_cave: {
        name: 'Ice Cave', cost: 2500,
        description: 'Crystal caverns echo with wingbeats.',
        birds: ['snowy_owl', 'puffin', 'arctic_tern'], maxBirds: 5, areaSize: 40, unlocked: false
      },
      frozen_lake: {
        name: 'Frozen Lake', cost: 4000,
        description: 'A vast frozen lake under the northern lights.',
        birds: ['puffin', 'arctic_tern', 'gyrfalcon'], maxBirds: 6, areaSize: 65, unlocked: false
      },
      arctic_peak: {
        name: 'Arctic Peak', cost: 6000,
        description: 'The highest point. Only legendary birds dare fly here.',
        birds: ['arctic_tern', 'gyrfalcon', 'ice_phoenix'], maxBirds: 4, areaSize: 70, unlocked: false
      }
    },
    weapons: ['rail_gun', 'slomo_gun']
  },
  {
    id: 4,
    name: 'Desert',
    fee: 10000,
    locations: {
      oasis: {
        name: 'Oasis', cost: 1500,
        description: 'A green haven in the sand. Birds come to drink.',
        birds: ['sandgrouse', 'roadrunner'], maxBirds: 6, areaSize: 45, unlocked: false
      },
      canyon: {
        name: 'Canyon', cost: 3000,
        description: 'Deep rocky canyons with echoing calls.',
        birds: ['sandgrouse', 'roadrunner', 'vulture'], maxBirds: 6, areaSize: 55, unlocked: false
      },
      dunes: {
        name: 'Dunes', cost: 5000,
        description: 'Endless rolling sand dunes under a blazing sun.',
        birds: ['vulture', 'secretary_bird', 'desert_hawk'], maxBirds: 5, areaSize: 70, unlocked: false
      },
      mesa: {
        name: 'Mesa', cost: 8000,
        description: 'Flat-topped mountains where predators circle.',
        birds: ['secretary_bird', 'desert_hawk', 'sand_falcon'], maxBirds: 5, areaSize: 65, unlocked: false
      },
      ruins: {
        name: 'Ruins', cost: 12000,
        description: 'Ancient ruins. The Sun Phoenix was last seen here.',
        birds: ['desert_hawk', 'sand_falcon', 'sun_phoenix'], maxBirds: 4, areaSize: 75, unlocked: false
      },
      boss_desert: { name: 'Sun Titan', hp: 100, isBoss: true }
    },
    weapons: ['laser_rifle', 'plasma_shotgun']
  }
];

// ═══ Infinite procedural dimensions (id >= 5) ═══
function hslHex(h, s, l) {
    s /= 100; l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
    return ((Math.round((r + m) * 255) << 16) | (Math.round((g + m) * 255) << 8) | Math.round((b + m) * 255));
  }

function generateDimension(id) {
    const tier = id - 4;
    const THEMES = ['Nebula', 'Abyss', 'Mirage', 'Aurora', 'Tempest', 'Verdant', 'Quantum', 'Celestial', 'Phantom', 'Eclipse', 'Obsidian', 'Radiant', 'Spectral', 'Glacial', 'Molten', 'Astral'];
    const ROMAN = ['', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    const cycle = Math.floor((id - 5) / THEMES.length);
    const baseName = THEMES[(id - 5) % THEMES.length];
    const name = cycle > 0 ? (baseName + ' ' + (ROMAN[cycle] || ('x' + (cycle + 1)))) : baseName;
    const topVal = Math.round(500 * Math.pow(2.76, tier));
    const floorVal = Math.round(topVal / 2.3);
    const RAR = ['common', 'common', 'uncommon', 'uncommon', 'rare', 'legendary'];
    const WT = [34, 28, 18, 12, 6, 2];
    const NOUNS = ['Flitter', 'Glider', 'Stalker', 'Drake', 'Wraith', 'Sovereign'];
    const birdKeys = [];
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      const value = Math.round(floorVal + (topVal - floorVal) * t);
      const hue = (id * 47 + i * 61) % 360;
      const key = 'd' + id + '_b' + i;
      BIRDS[key] = {
        name: name + ' ' + NOUNS[i], value, speed: 2.6 + i * 0.45, size: 0.36 + i * 0.06,
        rarity: RAR[i], weight: WT[i], hp: 1,
        bodyColor: hslHex(hue, 70, 50), wingColor: hslHex(hue, 70, 40),
        headColor: hslHex((hue + 20) % 360, 70, 55), beakColor: 0x333333,
        bellyColor: hslHex(hue, 55, 72), flapSpeed: 6 + i, flapAmplitude: 0.55 + i * 0.05
      };
      birdKeys.push(key);
    }
    const wk0 = 'd' + id + '_w0', wk1 = 'd' + id + '_w1';
    WEAPONS[wk0] = {
      name: name + ' Lance', cost: Math.round(topVal * 4), dimension: id,
      description: 'Precision energy weapon from the ' + name + ' dimension.',
      fireRate: Math.max(0.35, 1.4 - 0.04 * tier), accuracy: Math.min(0.99, 0.9 + 0.012 * tier),
      ammo: 3 + tier, reloadTime: Math.max(0.7, 1.9 - 0.08 * tier),
      spread: 0.012, hasScope: true, isShotgun: false, owned: false
    };
    WEAPONS[wk1] = {
      name: name + ' Scattergun', cost: Math.round(topVal * 8), dimension: id,
      description: 'Devastating spread weapon from the ' + name + ' dimension.',
      fireRate: Math.max(0.5, 1.1 - 0.02 * tier), accuracy: 0.6,
      ammo: 4 + Math.floor(tier / 2), reloadTime: Math.max(1.2, 2.6 - 0.06 * tier),
      spread: 0.14, pellets: 8 + tier, isShotgun: true, owned: false
    };
    const LOCN = ['Gateway', 'Wilds', 'Depths', 'Spires', 'Sanctum'];
    const COSTM = [2, 4, 7, 11, 16];
    const SETS = [[0, 1], [0, 1, 2], [1, 2, 3], [2, 3, 4], [3, 4, 5]];
    const locations = {};
    for (let i = 0; i < 5; i++) {
      const key = 'd' + id + '_l' + i;
      locations[key] = {
        name: name + ' ' + LOCN[i], cost: Math.round(topVal * COSTM[i]),
        description: 'A ' + LOCN[i].toLowerCase() + ' in the ' + name + ' dimension.',
        birds: SETS[i].map(j => birdKeys[j]), maxBirds: 5 + (i % 3), areaSize: 50 + i * 5, unlocked: false
      };
    }
    return { id, name, fee: Math.round(10000 * Math.pow(2.6, tier)), locations, weapons: [wk0, wk1] };
  }

// Grandpa weapons cannot be traded
const GRANDPA_WEAPONS = ['old_rifle', 'grandpas_shotgun', 'grandpas_rifle'];

export class Economy {
  constructor() {
    this.uid = null;
    this.money = 0;
    this.day = 1;
    this.dimension = 1;
    this.totalBirdsKilled = 0;
    this.totalMoneyEarned = 0;
    this.currentWeapon = 'old_rifle';
    this.currentLocation = 'backyard';
    this.huntBag = [];
    this.inventory = { tags: [] };
    this.equipped = { tag: null };
    this.loadout = [];
    this.story = null; // serialized story state
    this.weaponUpgrades = {};
    this.weapons = JSON.parse(JSON.stringify(WEAPONS));
    // Initialize locations from dimension 1
    this.locations = JSON.parse(JSON.stringify(DIMENSIONS[0].locations));
    this.ownedBanners = [];
    this.ownedTags = [];
    this.equippedTag = null;
    this.ownedSkins = ['default'];
    this.ownedConsumables = {}; // { key: count }
    this.equippedBanner = null;
    this.equippedSkins = {}; // { weaponKey: skinKey }
    this.activeConsumables = []; // consumed for current hunt
    this.dailyChallenges = [];
    this.challengeDay = 0;
    this.challengeChestClaimed = false;
    this.ownedPets = [];
    this.activePet = null;
    this.clanId = null;
    this.xp = 0;
    this.rank = 1;
    this.seenScopeHint = false;
  }

  setUid(uid) {
    this.uid = uid;
  }

  setDisplayName(name) {
    this.displayName = name;
  }

  save() {
    if (!this.uid) return;
    const data = {
      money: this.money,
      day: this.day,
      dimension: this.dimension,
      totalBirdsKilled: this.totalBirdsKilled,
      totalMoneyEarned: this.totalMoneyEarned,
      currentWeapon: this.currentWeapon,
      currentLocation: this.currentLocation,
      inventory: this.inventory,
      equipped: this.equipped,
      story: this.story || null,
      loadout: this.loadout || [],
      weaponUpgrades: this.weaponUpgrades || {},
      ownedBanners: this.ownedBanners || [],
      ownedTags: this.ownedTags || [],
      equippedTag: this.equippedTag || null,
      ownedSkins: this.ownedSkins || ['default'],
      ownedConsumables: this.ownedConsumables || {},
      equippedBanner: this.equippedBanner || null,
      equippedSkins: this.equippedSkins || {},
      dailyChallenges: serializeChallenges(this.dailyChallenges || []),
      challengeDay: this.challengeDay || 0,
      challengeChestClaimed: this.challengeChestClaimed || false,
      ownedPets: this.ownedPets || [],
      activePet: this.activePet || null,
      clanId: this.clanId || null,
      xp: this.xp || 0,
      rank: this.rank || 1,
      seenScopeHint: this.seenScopeHint || false,
      weaponOwned: {},
      locationUnlocked: {}
    };
    for (const [k, w] of Object.entries(this.weapons)) {
      data.weaponOwned[k] = w.owned;
    }
    for (const [k, l] of Object.entries(this.locations)) {
      data.locationUnlocked[k] = l.unlocked;
    }
    // Fire-and-forget write to Firestore
    setDoc(doc(db, 'saves', this.uid), data).catch(e => console.warn('Save failed:', e));
    // Auto-update leaderboard on every save
    if (this.displayName) {
      this.updateLeaderboard(this.displayName);
    }
  }

  async load() {
    if (!this.uid) return;
    try {
      const snap = await getDoc(doc(db, 'saves', this.uid));
      if (!snap.exists()) return;
      const data = snap.data();
      this.money = data.money || 0;
      this.day = data.day || 1;
      this.dimension = data.dimension || 1;
      this.totalBirdsKilled = data.totalBirdsKilled || 0;
      this.totalMoneyEarned = data.totalMoneyEarned || 0;
      if (this.totalMoneyEarned < this.money) {
        this.totalMoneyEarned = this.money;
      }
      this.currentWeapon = data.currentWeapon || 'old_rifle';
      this.currentLocation = data.currentLocation || 'backyard';
      this.inventory = data.inventory || { tags: [] };
      this.equipped = data.equipped || { tag: null };
      this.story = data.story || null;
      if (data.loadout) this.loadout = data.loadout;
      if (data.weaponUpgrades) this.weaponUpgrades = data.weaponUpgrades;
      if (data.ownedBanners) this.ownedBanners = data.ownedBanners;
      if (data.ownedTags) this.ownedTags = data.ownedTags;
      if (data.equippedTag !== undefined) this.equippedTag = data.equippedTag;
      if (data.ownedSkins) this.ownedSkins = data.ownedSkins;
      if (data.ownedConsumables) this.ownedConsumables = data.ownedConsumables;
      if (data.equippedBanner) this.equippedBanner = data.equippedBanner;
      if (data.equippedSkins) this.equippedSkins = data.equippedSkins;
      if (data.challengeDay) this.challengeDay = data.challengeDay;
      if (data.dailyChallenges) this.dailyChallenges = deserializeChallenges(data.dailyChallenges);
      if (data.challengeChestClaimed !== undefined) this.challengeChestClaimed = data.challengeChestClaimed;
      if (data.ownedPets) this.ownedPets = data.ownedPets;
      if (data.activePet) this.activePet = data.activePet;
      if (data.clanId) this.clanId = data.clanId;
      if (data.xp !== undefined) this.xp = data.xp;
      if (data.rank !== undefined) this.rank = data.rank;
      if (data.seenScopeHint !== undefined) this.seenScopeHint = data.seenScopeHint;

      // Ensure procedurally-generated dimensions exist first
      this._ensureDimensions(this.dimension + 1);
      // Rebuild locations from all unlocked dimensions
      this.locations = {};
      for (let d = 0; d < this.dimension && d < DIMENSIONS.length; d++) {
        const dimLocs = JSON.parse(JSON.stringify(DIMENSIONS[d].locations));
        Object.assign(this.locations, dimLocs);
      }

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
    this.money = 0;
    this.day = 1;
    this.dimension = 1;
    this.totalBirdsKilled = 0;
    this.totalMoneyEarned = 0;
    this.currentWeapon = 'old_rifle';
    this.currentLocation = 'backyard';
    this.weapons = JSON.parse(JSON.stringify(WEAPONS));
    this.locations = JSON.parse(JSON.stringify(DIMENSIONS[0].locations));
    this.huntBag = [];
    this.inventory = { tags: [] };
    this.equipped = { tag: null };
    this.weaponUpgrades = {};
    this.ownedBanners = [];
    this.ownedTags = [];
    this.equippedTag = null;
    this.ownedSkins = ['default'];
    this.ownedConsumables = {};
    this.equippedBanner = null;
    this.equippedSkins = {};
    this.activeConsumables = [];
    this.dailyChallenges = [];
    this.challengeDay = 0;
    this.challengeChestClaimed = false;
    this.loadout = [];
    this.ownedPets = [];
    this.activePet = null;
    this.clanId = null;
    this.xp = 0;
    this.rank = 1;
    this.story = null;
    this.save();
  }

  // ─── Dimension Methods ──────────────────────

  _ensureDimensions(uptoId) {
    while (DIMENSIONS.length < uptoId) {
      const dim = generateDimension(DIMENSIONS.length + 1);
      DIMENSIONS.push(dim);
      for (const wk of dim.weapons) {
        if (!this.weapons[wk] && WEAPONS[wk]) {
          this.weapons[wk] = JSON.parse(JSON.stringify(WEAPONS[wk]));
        }
      }
    }
  }

  getDimensionName() {
    this._ensureDimensions(this.dimension);
    const dim = DIMENSIONS[this.dimension - 1];
    return dim ? dim.name : `Dimension ${this.dimension}`;
  }

  getDimensionFee() {
    this._ensureDimensions(this.dimension + 1);
    const nextDim = DIMENSIONS[this.dimension]; // 0-indexed, so this.dimension points to next
    return nextDim ? nextDim.fee : 0;
  }

  /**
   * Check if all locations in the CURRENT dimension are unlocked
   */
  canAdvanceDimension() {
    this._ensureDimensions(this.dimension + 1);
    if (this.dimension >= DIMENSIONS.length) return false; // no more dimensions
    const currentDimLocs = DIMENSIONS[this.dimension - 1].locations;
    for (const key of Object.keys(currentDimLocs)) {
      const def = currentDimLocs[key];
      if (def.isBoss || def.cost === undefined) continue; // skip non-buyable arenas (e.g. boss_desert)
      if (!this.locations[key] || !this.locations[key].unlocked) return false;
    }
    return true;
  }

  /**
   * Advance to the next dimension (charges fee, merges new content)
   */
  advanceDimension() {
    if (!this.canAdvanceDimension()) return false;
    const fee = this.getDimensionFee();
    if (this.money < fee) return false;

    this.money -= fee;
    this.dimension++;
    this._ensureDimensions(this.dimension + 1);

    // Merge new dimension's locations
    const newDim = DIMENSIONS[this.dimension - 1];
    if (newDim) {
      const newLocs = JSON.parse(JSON.stringify(newDim.locations));
      Object.assign(this.locations, newLocs);
    }

    this.save();
    return true;
  }

  /**
   * Get which dimension a location belongs to
   */
  getDimensionForLocation(locKey) {
    for (const dim of DIMENSIONS) {
      if (dim.locations[locKey]) return dim.id;
    }
    return 1;
  }

  /**
   * Check if a weapon is a grandpa weapon (cannot be traded)
   */
  static isGrandpaWeapon(key) {
    return GRANDPA_WEAPONS.includes(key);
  }

  /**
   * Update the shared leaderboard with current user's stats
   */
  updateLeaderboard(displayName) {
    if (!this.uid) return;
    const data = {
      name: displayName,
      currentMoney: this.money,
      totalEarned: this.totalMoneyEarned,
      day: this.day,
      dimension: this.dimension,
      tag: this.equippedTag || (this.equipped && this.equipped.tag) || null,
      banner: this.equippedBanner || null,
      rank: this.rank || 1,
      updatedAt: Date.now()
    };
    setDoc(doc(db, 'leaderboard', this.uid), data).catch(e => console.warn('Leaderboard update failed:', e));
  }

  /**
   * Get leaderboard data sorted for display
   */
  static async getLeaderboard() {
    try {
      const snap = await getDocs(collection(db, 'leaderboard'));
      const entries = [];
      snap.forEach(d => {
        const data = d.data();
        entries.push({
          uid: d.id,
          name: data.name || 'Unknown',
          currentMoney: data.currentMoney || 0,
          totalEarned: data.totalEarned || 0,
          day: data.day || 1,
          dimension: data.dimension || 1,
          tag: data.tag || null,
          rank: data.rank || 1
        });
      });
      return {
        byCurrentMoney: [...entries].sort((a, b) => b.currentMoney - a.currentMoney),
        byTotalEarned: [...entries].sort((a, b) => b.totalEarned - a.totalEarned)
      };
    } catch (e) {
      console.warn('Failed to read leaderboard:', e);
      return { byCurrentMoney: [], byTotalEarned: [] };
    }
  }

  getWeapon() {
    return this.getWeaponWithUpgrades(this.currentWeapon);
  }

  getUpgradeLevel(weaponKey) {
    return (this.weaponUpgrades[weaponKey] || {}).level || 0;
  }

  getUpgradeCost(weaponKey) {
    const weapon = this.weapons[weaponKey];
    if (!weapon) return Infinity;
    const level = this.getUpgradeLevel(weaponKey);
    if (level >= 3) return Infinity;
    return Math.floor(weapon.cost * (level + 1) * 0.75);
  }

  upgradeWeapon(weaponKey) {
    const cost = this.getUpgradeCost(weaponKey);
    if (this.money < cost) return false;
    const level = this.getUpgradeLevel(weaponKey);
    if (level >= 3) return false;
    this.money -= cost;
    if (!this.weaponUpgrades[weaponKey]) this.weaponUpgrades[weaponKey] = {};
    this.weaponUpgrades[weaponKey].level = level + 1;
    this.save();
    return true;
  }

  getWeaponWithUpgrades(weaponKey) {
    const base = this.weapons[weaponKey];
    if (!base) return base;
    const level = this.getUpgradeLevel(weaponKey);
    if (level === 0) return base;
    const w = { ...base };
    if (level >= 1) { w.accuracy = Math.min(1, w.accuracy * 1.1); w.reloadTime *= 0.9; }
    if (level >= 2) { w.ammo += 1; w.fireRate *= 0.9; }
    if (level >= 3) { w.accuracy = Math.min(1, w.accuracy * 1.1); w.reloadTime *= 0.85; w.fireRate *= 0.9; }
    return w;
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
      let value = Math.round(bird.value * fluctuation);
      // Hunting Dog pet bonus: +$5 per bird
      if (this.activePet === 'hunting_dog') value += 5;
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
    this.currentLocation = key;
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

  getLoadoutWeaponKeys() {
    // If loadout is set and has weapons, return only those (that are still owned)
    if (this.loadout && this.loadout.length > 0) {
      const owned = this.loadout.filter(k => this.weapons[k] && this.weapons[k].owned);
      if (owned.length > 0) return owned;
    }
    // Fallback: all owned weapons
    return this.getOwnedWeaponKeys();
  }

  buyBanner(key) {
    const b = BANNERS[key];
    if (!b || b.cost === null || this.money < b.cost) return false;
    if (b.dimension && b.dimension > this.dimension) return false;
    if (this.ownedBanners.includes(key)) return false;
    this.money -= b.cost;
    this.ownedBanners.push(key);
    this.save();
    return true;
  }

  grantBanner(key) {
    // Grant a banner without charging money (used for code-gated items)
    const b = BANNERS[key];
    if (!b || this.ownedBanners.includes(key)) return false;
    this.ownedBanners.push(key);
    this.save();
    return true;
  }

  buyTag(key) {
    const t = TAGS[key];
    if (!t || t.devCode) return false;
    if (this.ownedTags.includes(key)) return false;
    if (this.money < t.cost) return false;
    this.money -= t.cost;
    this.ownedTags.push(key);
    this.save();
    return true;
  }

  grantTag(key) {
    const t = TAGS[key];
    if (!t || this.ownedTags.includes(key)) return false;
    this.ownedTags.push(key);
    this.save();
    return true;
  }

  equipTag(key) {
    if (!this.ownedTags.includes(key)) return false;
    this.equippedTag = this.equippedTag === key ? null : key;
    this.save();
    return true;
  }

  buyConsumable(key) {
    const c = CONSUMABLES[key];
    if (!c || this.money < c.cost) return false;
    this.money -= c.cost;
    this.ownedConsumables[key] = (this.ownedConsumables[key] || 0) + 1;
    this.save();
    return true;
  }

  useConsumable(key) {
    if (!this.ownedConsumables[key] || this.ownedConsumables[key] <= 0) return false;
    const cons = CONSUMABLES[key];

    // Only one "potion" category item can be equipped at a time —
    // unequipping returns the previous one to inventory.
    if (cons && cons.category === 'potion') {
      for (const activeKey of [...this.activeConsumables]) {
        const activeCons = CONSUMABLES[activeKey];
        if (activeCons && activeCons.category === 'potion' && activeKey !== key) {
          this.unequipConsumable(activeKey);
        }
      }
    }

    this.ownedConsumables[key]--;
    if (this.ownedConsumables[key] <= 0) delete this.ownedConsumables[key];
    this.activeConsumables.push(key);
    this.save();
    return true;
  }

  unequipConsumable(key) {
    const idx = this.activeConsumables.indexOf(key);
    if (idx === -1) return false;
    this.activeConsumables.splice(idx, 1);
    this.ownedConsumables[key] = (this.ownedConsumables[key] || 0) + 1;
    this.save();
    return true;
  }

  clearActiveConsumables() {
    this.activeConsumables = [];
  }

  buyWeaponSkin(skinKey) {
    const s = WEAPON_SKINS[skinKey];
    if (!s || s.cost === null || this.money < s.cost) return false;
    if (this.ownedSkins.includes(skinKey)) return false;
    this.money -= s.cost;
    this.ownedSkins.push(skinKey);
    this.save();
    return true;
  }

  equipSkin(weaponKey, skinKey) {
    if (!this.ownedSkins.includes(skinKey)) return false;
    this.equippedSkins[weaponKey] = skinKey;
    this.save();
    return true;
  }

  refreshChallenges() {
    const dayKey = getRealDayKey();
    if (dayKey !== this.challengeDay) {
      this.dailyChallenges = generateDailyChallenges(this.dimension);
      this.challengeDay = dayKey;
      this.challengeChestClaimed = false;
      this.save();
    }
  }

  allChallengesCompleted() {
    if (!this.dailyChallenges || this.dailyChallenges.length === 0) return false;
    return this.dailyChallenges.every(c => c.completed);
  }

  claimChallengeChest() {
    if (!this.allChallengesCompleted() || this.challengeChestClaimed) return 0;
    this.challengeChestClaimed = true;
    const chestReward = 200;
    this.money += chestReward;
    this.totalMoneyEarned += chestReward;
    this.save();
    return chestReward;
  }

  buyPet(key) {
    const pet = PETS[key];
    if (!pet || this.money < pet.cost) return false;
    if (this.ownedPets.includes(key)) return false;
    this.money -= pet.cost;
    this.ownedPets.push(key);
    this.save();
    return true;
  }

  equipPet(key) {
    if (key === null) {
      this.activePet = null;
      this.save();
      return true;
    }
    if (!this.ownedPets.includes(key)) return false;
    this.activePet = key;
    this.save();
    return true;
  }

  getRank() {
    let currentRank = RANKS[0];
    for (const r of RANKS) {
      if (this.xp >= r.xpRequired) currentRank = r;
    }
    return currentRank;
  }

  getXPToNextRank() {
    const current = this.getRank();
    const nextIdx = RANKS.findIndex(r => r.level === current.level) + 1;
    if (nextIdx >= RANKS.length) return { needed: 0, progress: 1 }; // max rank
    const next = RANKS[nextIdx];
    const needed = next.xpRequired - current.xpRequired;
    const progress = (this.xp - current.xpRequired) / needed;
    return { needed, progress: Math.min(1, progress), nextRank: next };
  }

  addXP(amount) {
    const oldRank = this.getRank();
    this.xp += amount;
    const newRank = this.getRank();
    this.rank = newRank.level;
    this.save();
    if (newRank.level > oldRank.level) {
      return { ranked: true, oldRank, newRank };
    }
    return { ranked: false };
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
  spawnRandomBird(luckMult = 1, legendaryBoost = 0) {
    const available = this.getAvailableBirds();
    let totalWeight = 0;
    const weights = [];
    for (const key of available) {
      let w = BIRDS[key].weight;
      const rarity = BIRDS[key].rarity;
      // Luck potions: multiply weight of rare, epic, and legendary birds
      if (luckMult !== 1 && (rarity === 'rare' || rarity === 'epic' || rarity === 'legendary')) {
        w *= luckMult;
      }
      // Extra boost specifically for legendary birds (Luck Potion V)
      if (legendaryBoost > 0 && rarity === 'legendary') {
        w *= (1 + legendaryBoost);
      }
      weights.push(w);
      totalWeight += w;
    }
    let roll = Math.random() * totalWeight;
    for (let i = 0; i < available.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return available[i];
    }
    return available[available.length - 1];
  }

  hasWon() {
    return false; // Infinite game — never ends
  }
}
