// ═══════════════════════════════════════════════
// Gary's Life — Economy System
// Bird data, weapon data, location data, wallet
// Persistence via Firebase Firestore
// ═══════════════════════════════════════════════

import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './firebase.js';
import { serializeChallenges, deserializeChallenges, generateDailyChallenges, getRealDayKey } from './challenges.js';

// ═══════════════════════════════════════════════
// Number / money formatting
// Values >= 1,000,000 are shown compactly as #.###M
// (and #.###B / #.###T for billions / trillions) so big
// numbers never overflow their UI slot. Smaller values keep
// thousands separators.
// ═══════════════════════════════════════════════
export function fmtNum(n) {
  n = Number(n) || 0;
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1e12) return sign + (abs / 1e12).toFixed(3) + 'T';
  if (abs >= 1e9)  return sign + (abs / 1e9).toFixed(3) + 'B';
  if (abs >= 1e6)  return sign + (abs / 1e6).toFixed(3) + 'M';
  return sign + Math.round(abs).toLocaleString();
}

// Same as fmtNum but with a leading "$".
export function fmtMoney(n) {
  return '$' + fmtNum(n);
}

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
    name: 'Snow Bunting', value: 480, speed: 3.8, size: 0.3,
    rarity: 'common', weight: 35, hp: 1,
    bodyColor: 0xeeeeee, wingColor: 0x1a1a1a, headColor: 0xeeeeee,
    beakColor: 0xCCAA00, bellyColor: 0xffffff,
    flapSpeed: 10, flapAmplitude: 0.5
  },
  ptarmigan: {
    name: 'Ptarmigan', value: 540, speed: 3.5, size: 0.45,
    rarity: 'common', weight: 30, hp: 1,
    bodyColor: 0xddddee, wingColor: 0xccccdd, headColor: 0xddddee,
    beakColor: 0x333333, bellyColor: 0xffffff,
    flapSpeed: 7, flapAmplitude: 0.5
  },
  snowy_owl: {
    name: 'Snowy Owl', value: 620, speed: 3.8, size: 0.65,
    rarity: 'uncommon', weight: 18, hp: 1,
    bodyColor: 0xf0f0f0, wingColor: 0xe0e0e0, headColor: 0xffffff,
    beakColor: 0x333333, bellyColor: 0xffffff,
    flapSpeed: 5, flapAmplitude: 0.8
  },
  puffin: {
    name: 'Puffin', value: 700, speed: 4.5, size: 0.35,
    rarity: 'uncommon', weight: 15, hp: 1,
    bodyColor: 0x1a1a1a, wingColor: 0x111111, headColor: 0x1a1a1a,
    beakColor: 0xFF6622, bellyColor: 0xeeeeee,
    flapSpeed: 12, flapAmplitude: 0.45
  },
  arctic_tern: {
    name: 'Arctic Tern', value: 800, speed: 5.0, size: 0.35,
    rarity: 'rare', weight: 10, hp: 1,
    bodyColor: 0xcccccc, wingColor: 0xaaaaaa, headColor: 0x1a1a1a,
    beakColor: 0xDD2222, bellyColor: 0xeeeeee,
    flapSpeed: 11, flapAmplitude: 0.55
  },
  gyrfalcon: {
    name: 'Gyrfalcon', value: 920, speed: 5.2, size: 0.6,
    rarity: 'epic', weight: 5, hp: 1,
    bodyColor: 0xdddde0, wingColor: 0xc0c0c8, headColor: 0xdddde0,
    beakColor: 0x333333, bellyColor: 0xeeeeee,
    flapSpeed: 7, flapAmplitude: 0.75
  },
  ice_phoenix: {
    name: 'Ice Phoenix', value: 1080, speed: 5.5, size: 0.7,
    rarity: 'legendary', weight: 2, hp: 1,
    bodyColor: 0x88CCFF, wingColor: 0x55AAEE, headColor: 0xAADDFF,
    beakColor: 0x4488AA, bellyColor: 0xCCEEFF,
    flapSpeed: 5, flapAmplitude: 0.9
  },

  // ─── Dimension 4: Desert ───────────────────
  sandgrouse: {
    name: 'Sandgrouse', value: 1150, speed: 4.0, size: 0.4,
    rarity: 'common', weight: 35, hp: 1,
    bodyColor: 0xC4A060, wingColor: 0xAA8840, headColor: 0xC4A060,
    beakColor: 0x555555, bellyColor: 0xD8C090,
    flapSpeed: 8, flapAmplitude: 0.5
  },
  roadrunner: {
    name: 'Roadrunner', value: 1300, speed: 4.8, size: 0.4,
    rarity: 'common', weight: 28, hp: 1,
    bodyColor: 0x4a5540, wingColor: 0x3a4530, headColor: 0x4a5540,
    beakColor: 0x333333, bellyColor: 0xccccbb,
    flapSpeed: 6, flapAmplitude: 0.4
  },
  vulture: {
    name: 'Vulture', value: 1500, speed: 3.2, size: 0.85,
    rarity: 'uncommon', weight: 18, hp: 1,
    bodyColor: 0x3a2a1a, wingColor: 0x2a1a0a, headColor: 0xCC5544,
    beakColor: 0x444444, bellyColor: 0x3a2a1a,
    flapSpeed: 3, flapAmplitude: 1.0
  },
  secretary_bird: {
    name: 'Secretary Bird', value: 1700, speed: 4.5, size: 0.7,
    rarity: 'uncommon', weight: 14, hp: 1,
    bodyColor: 0xaaaaaa, wingColor: 0x1a1a1a, headColor: 0xaaaaaa,
    beakColor: 0x444444, bellyColor: 0xcccccc,
    flapSpeed: 5, flapAmplitude: 0.8
  },
  desert_hawk: {
    name: 'Desert Hawk', value: 1950, speed: 5.5, size: 0.55,
    rarity: 'rare', weight: 8, hp: 1,
    bodyColor: 0x8B6914, wingColor: 0x7a5810, headColor: 0xAA8820,
    beakColor: 0x333333, bellyColor: 0xD4B896,
    flapSpeed: 7, flapAmplitude: 0.75
  },
  sand_falcon: {
    name: 'Sand Falcon', value: 2200, speed: 5.8, size: 0.5,
    rarity: 'epic', weight: 5, hp: 1,
    bodyColor: 0xD4A050, wingColor: 0xC09040, headColor: 0xD4A050,
    beakColor: 0x333333, bellyColor: 0xE8D0A0,
    flapSpeed: 8, flapAmplitude: 0.7
  },
  sun_phoenix: {
    name: 'Sun Phoenix', value: 2600, speed: 6.0, size: 0.75,
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

// Weapons progress in clear tiers. `power` = damage per hit (boss birds have
// 2–3 HP, so higher-power guns drop them faster); `tier` drives the star
// rating shown in the shop. Stats improve monotonically with cost, and the
// flavour of each gun matches its name (scopes zoom, shotguns spread, the
// Rail Gun and Laser Rifle pierce straight through multiple birds).
export const WEAPONS = {
  // ─── Dimension 1: Earth ─────────────────────
  old_rifle: {
    name: "Grandpa's Old Rifle",
    cost: 0, dimension: 1, tier: 1, power: 1,
    description: 'Slow and inaccurate, but it works.',
    fireRate: 2.0, accuracy: 0.85, ammo: 1, reloadTime: 2.5,
    spread: 0.04, isShotgun: false, owned: true, isGrandpa: true
  },
  grandpas_shotgun: {
    name: "Grandpa's Shotgun",
    cost: 0, dimension: 1, tier: 1, power: 1,
    description: 'Wide spread, easy to hit. Great for beginners.',
    fireRate: 2.2, accuracy: 0.6, ammo: 2, reloadTime: 2.8,
    spread: 0.12, pellets: 5, isShotgun: true, owned: true, isGrandpa: true
  },
  hunting_rifle: {
    name: 'Hunting Rifle',
    cost: 75, dimension: 1, tier: 2, power: 1,
    description: 'A proper hunting rifle. Faster, tighter, far more reliable.',
    fireRate: 1.4, accuracy: 0.92, ammo: 1, reloadTime: 1.6,
    spread: 0.022, isShotgun: false, owned: false
  },
  combat_shotgun: {
    name: 'Combat Shotgun',
    cost: 200, dimension: 1, tier: 2, power: 1,
    description: '6 pellets, fast reload. Devastating at close range.',
    fireRate: 1.5, accuracy: 0.66, ammo: 3, reloadTime: 1.7,
    spread: 0.10, pellets: 6, isShotgun: true, owned: false
  },
  scoped_rifle: {
    name: 'Scoped Rifle',
    cost: 500, dimension: 1, tier: 3, power: 2,
    description: 'Zoom in for deadly precision. Hits hard enough to stagger bosses.',
    fireRate: 1.8, accuracy: 0.97, ammo: 1, reloadTime: 1.8,
    spread: 0.008, hasScope: true, isShotgun: false, owned: false
  },
  semi_auto: {
    name: 'Semi-Auto',
    cost: 1200, dimension: 1, tier: 3, power: 1,
    description: 'Rapid trigger. 6 shots before reload — melt whole flocks.',
    fireRate: 0.35, accuracy: 0.90, ammo: 6, reloadTime: 2.0,
    spread: 0.03, isShotgun: false, owned: false
  },
  grandpas_rifle: {
    name: "Great-Grandfather's Rifle",
    cost: 0, dimension: 1, tier: 4, power: 2,
    description: 'A rifle from another era. Immaculate. Infinite ammo. Never needs reloading.',
    fireRate: 0.6, accuracy: 0.96, ammo: Infinity, reloadTime: 0,
    spread: 0.065, isShotgun: true, crosshairShape: 'square',
    noReload: true, isLegendary: true, owned: false, isGrandpa: true
  },

  // ─── Dimension 2: Tropics ──────────────────
  crossbow: {
    name: 'Crossbow',
    cost: 800, dimension: 2, tier: 4, power: 2,
    description: 'Silent and deadly. Lightning-fast reload and a heavy bolt.',
    fireRate: 2.0, accuracy: 0.95, ammo: 1, reloadTime: 0.6,
    spread: 0.012, isShotgun: false, owned: false
  },
  auto_shotgun: {
    name: 'Auto Shotgun',
    cost: 1500, dimension: 2, tier: 4, power: 2,
    description: 'Rapid-fire shotgun. 5 shots, 9 pellets each.',
    fireRate: 0.5, accuracy: 0.58, ammo: 5, reloadTime: 2.6,
    spread: 0.13, pellets: 9, isShotgun: true, owned: false
  },

  // ─── Dimension 3: Arctic ───────────────────
  rail_gun: {
    name: 'Rail Gun',
    cost: 2000, dimension: 3, tier: 5, power: 4, pierce: true,
    description: 'Electromagnetic beam. Pierces straight through every bird in line.',
    fireRate: 2.5, accuracy: 0.99, ammo: 1, reloadTime: 3.0,
    spread: 0.004, hasScope: false, isShotgun: false, owned: false
  },
  slomo_gun: {
    name: 'Slo-Mo Gun',
    cost: 3000, dimension: 3, tier: 5, power: 3,
    description: 'Slows time when you scope in. 3-second window, 5s cooldown.',
    fireRate: 1.6, accuracy: 0.94, ammo: 2, reloadTime: 1.8,
    spread: 0.016, hasScope: true, isSlomo: true, isShotgun: false, owned: false
  },

  // ─── Dimension 4: Desert ───────────────────
  laser_rifle: {
    name: 'Laser Rifle',
    cost: 4000, dimension: 4, tier: 6, power: 4, pierce: true,
    description: 'Instant-hit beam. No spread, no travel time — burns through a whole row.',
    fireRate: 1.0, accuracy: 1.0, ammo: 4, reloadTime: 2.0,
    spread: 0.0, hasScope: true, isShotgun: false, owned: false
  },
  plasma_shotgun: {
    name: 'Plasma Shotgun',
    cost: 5000, dimension: 4, tier: 6, power: 3,
    description: 'Fires superheated plasma. 12 scorching pellets, massive spread.',
    fireRate: 0.9, accuracy: 0.56, ammo: 3, reloadTime: 3.0,
    spread: 0.17, pellets: 12, isShotgun: true, owned: false
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
  // ─── Premium banners (high-end money sinks) ───
  royal_violet:  { name: 'Royal Violet',  cost: 5000,    color: '#6d28d9' },
  emberglow:     { name: 'Emberglow',     cost: 20000,   color: '#b91c1c' },
  aurora:        { name: 'Aurora',        cost: 75000,   color: '#10b981' },
  void_black:    { name: 'Void',          cost: 300000,  color: '#0a0a12' },
  prismatic:     { name: 'Prismatic',     cost: 2000000, color: '#ec4899' },
  champion:      { name: 'Champion',      cost: null, color: '#ffd700', tournamentOnly: true },
};

export const TAGS = {
  dev:           { name: 'DEV',         cost: 0,    color: '#7c3aed', textColor: '#a78bfa', devCode: true },
  hunter:        { name: 'Hunter',      cost: 150,  color: '#2d5a2d', textColor: '#6ee76e' },
  tycoon:        { name: 'Tycoon',      cost: 400,  color: '#5a3a05', textColor: '#f5d070' },
  sharpshooter:  { name: 'Sharpshooter',cost: 300,  color: '#1a3060', textColor: '#90b8ff' },
  legend:        { name: 'Legend',      cost: 800,  color: '#5a0a0a', textColor: '#ff8080' },
  // ─── Premium tags (high-end money sinks) ───
  apex:          { name: 'Apex',        cost: 10000,   color: '#3a0a5a', textColor: '#c98bff' },
  mogul:         { name: 'Mogul',       cost: 50000,   color: '#5a4a05', textColor: '#ffe070' },
  mythic:        { name: 'Mythic',      cost: 250000,  color: '#0a3a5a', textColor: '#70d8ff' },
  immortal:      { name: 'Immortal',    cost: 1000000, color: '#5a0a2a', textColor: '#ff80b0' },
  billionaire:   { name: 'Billionaire', cost: 5000000, color: '#1a3a1a', textColor: '#7dffa0' },
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
  rainbowwave:    { name: 'Rainbow Wave',  cost: 0, colors: { stock: 0xff3366, metal: 0xff66aa }, anim: 'rainbow' },
  chromaflow:     { name: 'Chromaflow',    cost: 0, colors: { stock: 0x33ddff, metal: 0x9966ff }, anim: 'pattern' },
  default:        { name: 'Default',        cost: 0,    colors: null },
  gold:           { name: 'Gold',           cost: 500,  colors: { stock: 0xbfa24d, metal: 0xd4a853 } },
  arctic_camo:    { name: 'Arctic',         cost: 400,  colors: { stock: 0xccddee, metal: 0xaabbcc } },
  shadow:         { name: 'Shadow',         cost: 600,  colors: { stock: 0x1a1a1a, metal: 0x333333 } },
  neon:           { name: 'Neon',           cost: 800,  colors: { stock: 0x00ff88, metal: 0x00ccff } },
  // ─── Premium cosmetics (pure money sinks) ───
  rose_gold:      { name: 'Rose Gold',      cost: 2500,   colors: { stock: 0xb76e79, metal: 0xe8b4b8 } },
  obsidian:       { name: 'Obsidian',       cost: 5000,   colors: { stock: 0x0b0b10, metal: 0x2a2a3a } },
  emerald:        { name: 'Emerald',        cost: 12000,  colors: { stock: 0x0c5c3a, metal: 0x2ee59d } },
  molten:         { name: 'Molten',         cost: 30000,  colors: { stock: 0x5a1500, metal: 0xff5a1e } },
  galaxy:         { name: 'Galaxy',         cost: 90000,  colors: { stock: 0x1a0b3a, metal: 0x9a5cff } },
  prismatic:      { name: 'Prismatic',      cost: 250000, colors: { stock: 0x222233, metal: 0xff5ad4 } },
  diamond:        { name: 'Diamond',        cost: 1000000,colors: { stock: 0xbfe9ff, metal: 0xeafaff } },
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
  },
  // ─── Prestige companions (big-ticket; give a passive earnings cut) ───
  golden_retriever: {
    name: 'Golden Retriever', cost: 25000, ability: 'retrieve', earnBonus: 0.05,
    desc: 'Loyal prestige companion. +5% earnings every hunt.',
    color: 0xE3B563
  },
  phoenix_companion: {
    name: 'Phoenix Companion', cost: 250000, ability: 'spot', earnBonus: 0.10,
    desc: 'A reborn phoenix at your side. +10% earnings every hunt.',
    color: 0xff6a1e
  },
  diamond_drone: {
    name: 'Diamond Drone', cost: 2000000, ability: 'assist', earnBonus: 0.20,
    desc: 'Top-tier flex. Auto-collects and grants +20% earnings every hunt.',
    color: 0x9fe8ff
  }
};

// ─── Pet rarities (per-equipped-pet money multiplier, combined multiplicatively) ───
export const PET_RARITIES = {
  common:     { name: 'Common',       mult: 0.05, color: '#9aa0a6' },
  uncommon:   { name: 'Uncommon',     mult: 0.12, color: '#43c34a' },
  rare:       { name: 'Rare',         mult: 0.25, color: '#3b9dff' },
  epic:       { name: 'Epic',         mult: 0.50, color: '#b15cff' },
  legendary:  { name: 'Legendary',    mult: 1.00, color: '#ffb02e' },
  unique:     { name: 'Unique',       mult: 2.00, color: '#ff4d4d' },
  outofwhack: { name: 'Out of Whack', mult: 3.00, color: '#00f5d4', hidden: true }
};
const PET_RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'unique'];

// Published mystery-box odds (percent). Identical in every dimension; only price scales.
export const MYSTERY_BOXES = {
  1: { common: 67, uncommon: 17, rare: 9.45, epic: 4.5, legendary: 2, unique: 0.05 },
  2: { common: 60, uncommon: 15, rare: 12, epic: 8, legendary: 4.5, unique: 0.5 },
  3: { common: 50, uncommon: 15, rare: 17.5, epic: 10, legendary: 6, unique: 1.5 }
};
const OOW_CHANCE = 0.00005; // 0.005% hidden out-of-whack, rolled before the published table
const OOW_EFFECTS = ['infiniteAmmo', 'noCooldown', 'autoReload', 'luck'];
const PET_NOUNS = ['Cub','Sprite','Wisp','Hound','Drake','Owl','Fox','Moth','Serpent','Imp','Golem','Phantom','Yeti','Raven','Lynx','Beetle','Stag','Toad','Crane','Mole'];
const OOW_NAMES = ['Glitch','Anomaly','Paradox','Voidling','Static','Null'];
const MAX_PETS = 10;

// ---- Battle Pass config ----
export const BP_MAX_TIER = 100;
const REFERRALS_NEEDED = 5;
function bpTierCost(n) { return n >= BP_MAX_TIER ? Infinity : Math.round((300 + (n - 1) * 55) * 0.87); }
const BP_GUN_NAMES = { rail_gun: 'Rail Gun', slomo_gun: 'Slo-Mo Gun', laser_rifle: 'Laser Rifle', plasma_shotgun: 'Plasma Shotgun' };
function buildBattlePassRewards() {
  const SKIN_LABELS = { emerald: 'Emerald Skin', molten: 'Molten Skin', obsidian: 'Obsidian Skin', rose_gold: 'Rose Gold Skin', gold: 'Gold Skin', arctic_camo: 'Arctic Camo Skin', shadow: 'Shadow Skin', neon: 'Neon Skin', galaxy: 'Galaxy Skin', prismatic: 'Prismatic Skin', diamond: 'Diamond Skin', champion_gold: 'Champion Gold Skin', rainbowwave: 'Rainbow Wave (Animated)', chromaflow: 'Chromaflow (Animated)' };
  const POTION_LABELS = { double_money: 'Double Money', extra_time: 'Extra Time', bird_magnet: 'Bird Magnet', steady_hands: 'Steady Hands', lucky_charm: 'Lucky Charm', bird_swarm: 'Bird Swarm' };
  const skin = (k) => ({ type: 'skin', skin: k, label: SKIN_LABELS[k] || 'Skin' });
  const potion = (k, n) => ({ type: 'potion', potion: k, amount: n || 1, label: ((n || 1) > 1 ? (n + 'x ') : '') + (POTION_LABELS[k] || 'Potion') + ' Potion' });
  const box = (n) => ({ type: 'box', box: n, label: 'Mystery Box ' + (n === 1 ? 'I' : (n === 2 ? 'II' : 'III')) });
  const gun = (k) => ({ type: 'gun', weapon: k, label: (BP_GUN_NAMES[k] || 'Weapon') });
  const free = new Array(BP_MAX_TIER).fill(null);
  const prem = new Array(BP_MAX_TIER).fill(null);
  const F = {}; const P = {};
  F[100] = { type: 'slot', amount: 1, label: '+1 Pet Slot' };
  F[50] = gun('rail_gun');
  F[20] = skin('emerald'); F[40] = skin('molten'); F[60] = skin('rose_gold'); F[80] = skin('obsidian'); F[10] = skin('gold'); F[70] = skin('arctic_camo');
  F[25] = box(1); F[75] = box(1);
  F[8] = potion('extra_time', 1); F[28] = potion('steady_hands', 1); F[48] = potion('bird_magnet', 1); F[68] = potion('extra_time', 1); F[88] = potion('steady_hands', 1);
  P[100] = { type: 'slot', amount: 5, label: '+5 Pet Slots' };
  P[45] = skin('rainbowwave'); P[90] = skin('chromaflow');
  P[5] = skin('shadow'); P[15] = skin('galaxy'); P[35] = skin('prismatic'); P[55] = skin('neon'); P[65] = skin('diamond'); P[85] = skin('champion_gold');
  P[25] = gun('slomo_gun'); P[50] = gun('laser_rifle'); P[75] = gun('plasma_shotgun');
  P[8] = potion('double_money', 2); P[18] = potion('lucky_charm', 2); P[28] = potion('bird_swarm', 2); P[38] = potion('double_money', 2); P[58] = potion('lucky_charm', 2); P[68] = potion('bird_swarm', 2); P[78] = potion('double_money', 2); P[95] = potion('lucky_charm', 3);
  [20, 30, 40, 60, 70, 80].forEach((t) => { if (!P[t]) P[t] = box(3); });
  [12, 32, 52, 72, 92].forEach((t) => { if (!P[t]) P[t] = box(2); });
  for (let t = 1; t <= BP_MAX_TIER; t++) { if (F[t]) free[t - 1] = F[t]; if (P[t]) prem[t - 1] = P[t]; }
  function fillTickets(arr, count) {
    const idx = [];
    for (let i = 0; i < arr.length; i++) if (arr[i] === null) idx.push(i);
    const set = new Set();
    if (count > 0 && idx.length > 0) {
      const step = idx.length / count;
      for (let k = 0; k < count; k++) set.add(idx[Math.min(idx.length - 1, Math.floor(k * step))]);
    }
    for (const i of idx) arr[i] = set.has(i) ? { type: 'ticket', amount: 1, label: '1 Ticket' } : { type: 'empty', label: '\u2014' };
  }
  fillTickets(free, 33);
  fillTickets(prem, 50);
  return { free: free, premium: prem };
}
export const BATTLE_PASS = buildBattlePassRewards();

export const TICKET_SHOP = [
  { key: 'pet_legendary', name: 'Legendary Pet', desc: 'A guaranteed Legendary pet for your current dimension.', cost: 35, type: 'pet', rarity: 'legendary' },
  { key: 'pet_unique', name: 'Unique Pet', desc: 'A guaranteed Unique pet \u2014 top tier.', cost: 60, type: 'pet', rarity: 'unique' },
  { key: 'skin_rainbowwave', name: 'Rainbow Wave Skin', desc: 'Animated rainbow gun skin.', cost: 25, type: 'skin', skin: 'rainbowwave' },
  { key: 'skin_chromaflow', name: 'Chromaflow Skin', desc: 'Animated moving-pattern gun skin.', cost: 25, type: 'skin', skin: 'chromaflow' },
  { key: 'petslot', name: '+1 Pet Slot', desc: 'Equip one more pet (stacks beyond the shop max).', cost: 40, type: 'slot', amount: 1 }
];

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(str)));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Temporary pet-slot boosts: each grants +1 equip slot for a rarity-based duration (up to 24h).
export const PET_BOOSTS = {
  boost_common:    { name: 'Tiny Whistle',  rarity: 'common',    hours: 1,  cost: 50000 },
  boost_uncommon:  { name: 'Brass Whistle', rarity: 'uncommon',  hours: 3,  cost: 500000 },
  boost_rare:      { name: 'Silver Horn',   rarity: 'rare',      hours: 6,  cost: 5000000 },
  boost_epic:      { name: 'Golden Horn',   rarity: 'epic',      hours: 12, cost: 50000000 },
  boost_legendary: { name: 'Crystal Horn',  rarity: 'legendary', hours: 18, cost: 500000000 },
  boost_unique:    { name: 'Eternal Horn',  rarity: 'unique',    hours: 24, cost: 5000000000 }
};

// ─── Defensive gear (persistent; counters bird attacks on higher dimensions) ───
// Owned once, always active. `poopBlock` is the chance (0–1) to fully avoid an
// incoming poop hit; `slowImmune` removes the movement-slow penalty.
export const GEAR = {
  umbrella: {
    name: 'Hunting Umbrella', cost: 1500, poopBlock: 0.4, slowImmune: false,
    desc: 'Pops open overhead — blocks 40% of incoming bird droppings.'
  },
  rain_jacket: {
    name: 'Oilskin Jacket', cost: 6000, poopBlock: 0.4, slowImmune: true,
    desc: 'Slick coat: 40% block and you never get bogged down by splatter.'
  },
  riot_shield: {
    name: 'Riot Shield', cost: 25000, poopBlock: 0.7, slowImmune: true,
    desc: 'Angled polycarbonate canopy. Blocks 70% of droppings, no slowdown.'
  },
  hazmat_suit: {
    name: 'Hazmat Suit', cost: 120000, poopBlock: 0.9, slowImmune: true,
    desc: 'Sealed head to toe. Blocks 90% of droppings and shrugs off the rest.'
  },
  auto_canopy: {
    name: 'Auto-Canopy Drone', cost: 1000000, poopBlock: 1.0, slowImmune: true,
    desc: 'A hovering drone vaporises droppings before they land. Total immunity.'
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
        name: 'Tundra', cost: 25000,
        description: 'Flat, frozen plains. Birds camouflage in the snow.',
        birds: ['snow_bunting', 'ptarmigan'], maxBirds: 5, areaSize: 60, unlocked: false
      },
      glacier: {
        name: 'Glacier', cost: 45000,
        description: 'Icy cliffs and frozen waterfalls.',
        birds: ['snow_bunting', 'ptarmigan', 'snowy_owl'], maxBirds: 6, areaSize: 50, unlocked: false
      },
      ice_cave: {
        name: 'Ice Cave', cost: 70000,
        description: 'Crystal caverns echo with wingbeats.',
        birds: ['snowy_owl', 'puffin', 'arctic_tern'], maxBirds: 5, areaSize: 40, unlocked: false
      },
      frozen_lake: {
        name: 'Frozen Lake', cost: 105000,
        description: 'A vast frozen lake under the northern lights.',
        birds: ['puffin', 'arctic_tern', 'gyrfalcon'], maxBirds: 6, areaSize: 65, unlocked: false
      },
      arctic_peak: {
        name: 'Arctic Peak', cost: 150000,
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
        name: 'Oasis', cost: 50000,
        description: 'A green haven in the sand. Birds come to drink.',
        birds: ['sandgrouse', 'roadrunner'], maxBirds: 6, areaSize: 45, unlocked: false
      },
      canyon: {
        name: 'Canyon', cost: 90000,
        description: 'Deep rocky canyons with echoing calls.',
        birds: ['sandgrouse', 'roadrunner', 'vulture'], maxBirds: 6, areaSize: 55, unlocked: false
      },
      dunes: {
        name: 'Dunes', cost: 140000,
        description: 'Endless rolling sand dunes under a blazing sun.',
        birds: ['vulture', 'secretary_bird', 'desert_hawk'], maxBirds: 5, areaSize: 70, unlocked: false
      },
      mesa: {
        name: 'Mesa', cost: 210000,
        description: 'Flat-topped mountains where predators circle.',
        birds: ['secretary_bird', 'desert_hawk', 'sand_falcon'], maxBirds: 5, areaSize: 65, unlocked: false
      },
      ruins: {
        name: 'Ruins', cost: 300000,
        description: 'Ancient ruins. The Sun Phoenix was last seen here.',
        birds: ['desert_hawk', 'sand_falcon', 'sun_phoenix'], maxBirds: 4, areaSize: 75, unlocked: false
      }
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
    const birdTop = Math.round(3000 * Math.pow(2.6, tier));
    const birdFloor = Math.round(birdTop / 2.2);
    const RAR = ['common', 'common', 'uncommon', 'uncommon', 'rare', 'legendary'];
    const WT = [34, 28, 18, 12, 6, 2];
    const NOUNS = ['Flitter', 'Glider', 'Stalker', 'Drake', 'Wraith', 'Sovereign'];
    const birdKeys = [];
    for (let i = 0; i < 6; i++) {
      const t = i / 5;
      const value = Math.round(birdFloor + (birdTop - birdFloor) * t);
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
    // Every dimension unlocks 2 distinct weapons drawn from real, implemented
    // mechanics. Each description matches exactly what the weapon does.
    const _acc = Math.min(0.99, 0.88 + 0.012 * tier);
    const _fr = (base, dec, floor) => Math.max(floor, base - dec * tier);
    const ARCH = {
      sniper:     { suffix: ' Marksman', power: 4 + tier, hasScope: true, spread: 0.006, ammo: 2, reload: _fr(1.8,0.04,1.0), rate: _fr(1.4,0.02,0.8), desc: 'Scope in for a pinpoint shot. Tiny spread, hits hard enough to drop a boss fast.' },
      autocannon: { suffix: ' Autocannon', power: 2 + Math.floor(tier/2), spread: 0.03, ammo: 10 + tier, reload: _fr(2.4,0.05,1.3), rate: _fr(0.28,0.004,0.12), desc: 'Rapid-fire. Hold the trigger and melt whole flocks. Huge magazine, empties fast.' },
      scatter:    { suffix: ' Scattergun', power: 3 + Math.floor(tier/2), spread: 0.15, pellets: 9 + tier, isShotgun: true, ammo: 4 + Math.floor(tier/2), reload: _fr(2.6,0.06,1.2), rate: _fr(1.0,0.02,0.5), desc: 'Fires a wide cone of pellets. Devastating up close, useless at range.' },
      lance:      { suffix: ' Lance', power: 4 + tier, pierce: true, hasScope: true, spread: 0.012, ammo: 3 + tier, reload: _fr(1.9,0.08,0.7), rate: _fr(1.4,0.04,0.35), desc: 'A piercing energy lance. The shot passes straight through every bird in a line.' },
      laser:      { suffix: ' Laser', power: 5 + tier, pierce: true, spread: 0, ammo: 4 + tier, reload: _fr(1.6,0.05,0.8), rate: _fr(0.9,0.02,0.4), desc: 'Instant-hit beam. No spread, no travel time, burns through a whole row at once.' },
      grenade:    { suffix: ' Grenade Launcher', power: 3 + Math.floor(tier/2), explosive: true, blastRadius: 6 + tier*0.3, spread: 0.02, ammo: 2, reload: _fr(2.6,0.05,1.3), rate: _fr(1.6,0.03,0.9), desc: 'Lobs an explosive round that detonates on impact, killing every bird in the blast.' },
      tesla:      { suffix: ' Tesla Coil', power: 3 + Math.floor(tier/2), chain: 3 + Math.floor(tier/3), chainRange: 9 + tier*0.3, spread: 0.02, ammo: 5 + tier, reload: _fr(2.0,0.04,1.0), rate: _fr(1.0,0.02,0.5), desc: 'Arcs a bolt of lightning that chains between nearby birds, frying several at once.' },
      seeker:     { suffix: ' Seeker', power: 3 + Math.floor(tier/2), seek: true, seekAngle: 0.93, spread: 0.01, ammo: 6 + tier, reload: _fr(2.0,0.04,1.0), rate: _fr(0.7,0.012,0.35), desc: 'Auto-targeting rounds curve toward the nearest bird. Just aim roughly and fire.' },
      chrono:     { suffix: ' Chrono Rifle', power: 3 + Math.floor(tier/2), isSlomo: true, hasScope: true, spread: 0.016, ammo: 2 + Math.floor(tier/2), reload: _fr(1.8,0.04,1.0), rate: _fr(1.6,0.03,0.9), desc: 'Slows time the instant you scope in, giving you a window to line up every shot.' },
      cannon:     { suffix: ' Hand Cannon', power: 7 + tier, spread: 0.02, ammo: 1, reload: _fr(3.0,0.05,1.6), rate: _fr(1.8,0.03,1.0), desc: 'One devastating shot. Enormous damage, but slow to reload.' }
    };
    const ORDER = ['lance','scatter','sniper','grenade','autocannon','tesla','laser','seeker','chrono','cannon'];
    const CURATED = [['scatter','sniper'],['grenade','autocannon'],['lance','tesla'],['seeker','cannon'],['laser','scatter'],['chrono','grenade'],['sniper','tesla'],['autocannon','seeker'],['lance','cannon'],['grenade','laser'],['tesla','chrono'],['scatter','seeker'],['cannon','sniper'],['laser','autocannon'],['grenade','tesla'],['seeker','chrono'],['lance','scatter'],['sniper','cannon'],['autocannon','grenade'],['tesla','laser'],['chrono','seeker'],['scatter','cannon'],['lance','sniper'],['grenade','seeker'],['laser','chrono'],['tesla','autocannon']];
    const idx = id - 5;
    const pair = (idx >= 0 && idx < CURATED.length) ? CURATED[idx] : [ORDER[id % ORDER.length], ORDER[(id + 4) % ORDER.length]];
    const mkW = (key, costMult) => {
      const a = ARCH[key];
      const w = { name: name + a.suffix, cost: Math.round(topVal * costMult), dimension: id, tier: 6 + tier, power: a.power, description: a.desc, fireRate: a.rate, accuracy: _acc, ammo: a.ammo, reloadTime: a.reload, spread: a.spread, isShotgun: !!a.isShotgun, owned: false };
      if (a.pellets) w.pellets = a.pellets;
      if (a.hasScope) w.hasScope = true;
      if (a.pierce) w.pierce = true;
      if (a.isSlomo) w.isSlomo = true;
      if (a.explosive) { w.explosive = true; w.blastRadius = a.blastRadius; }
      if (a.chain) { w.chain = a.chain; w.chainRange = a.chainRange; }
      if (a.seek) { w.seek = true; w.seekAngle = a.seekAngle; }
      return w;
    };
    WEAPONS[wk0] = mkW(pair[0], 8);
    WEAPONS[wk1] = mkW(pair[1], 16);
    const LOCN = ['Gateway', 'Wilds', 'Depths', 'Spires', 'Sanctum'];
    const COSTM = [72, 130, 210, 330, 480];
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

// Maximum weapon upgrade level (stars shown in the shop)
const SEASON_LEN_MS = 28 * 24 * 60 * 60 * 1000;
const SEASON_ANCHOR = Date.UTC(2026, 5, 29, 0, 0, 0);
export function bpSeasonInfo(now) {
  const t = (now || Date.now());
  let idx = Math.floor((t - SEASON_ANCHOR) / SEASON_LEN_MS);
  if (idx < 0) idx = 0;
  const start = SEASON_ANCHOR + idx * SEASON_LEN_MS;
  return { season: idx + 1, index: idx, start: start, end: start + SEASON_LEN_MS };
}

const EVENT_PERIOD_MS = 14 * 24 * 60 * 60 * 1000;
const EVENT_ANCHOR = Date.UTC(2026, 6, 4, 23, 0, 0);
const EVENT_JOIN_MS = 5 * 60 * 1000;
const EVENT_HUNT_MS = 3 * 60 * 1000;
export function eventInfo(now) {
  const t = now || Date.now();
  let idx = Math.floor((t - EVENT_ANCHOR) / EVENT_PERIOD_MS);
  if (idx < 0) idx = 0;
  let start = EVENT_ANCHOR + idx * EVENT_PERIOD_MS;
  const fullEnd = start + EVENT_JOIN_MS + EVENT_HUNT_MS;
  let phase;
  if (t < start) phase = 'upcoming';
  else if (t < start + EVENT_JOIN_MS) phase = 'join';
  else if (t < fullEnd) phase = 'live';
  else { idx += 1; start = EVENT_ANCHOR + idx * EVENT_PERIOD_MS; phase = 'upcoming'; }
  const joinEnd = start + EVENT_JOIN_MS;
  const eventEnd = joinEnd + EVENT_HUNT_MS;
  return { eventId: 'evt_' + idx, index: idx, start: start, joinEnd: joinEnd, eventEnd: eventEnd, phase: phase, now: t };
}

export const DAILY_REWARDS = [
  { money: 250, pct: 0.004, label: 'Cash' },
  { money: 400, pct: 0.006, label: 'Cash' },
  { money: 700, pct: 0.009, label: 'Cash' },
  { ticket: 1, label: '1 Ticket' },
  { money: 1200, pct: 0.014, label: 'Cash' },
  { money: 2000, pct: 0.02, label: 'Cash' },
  { ticket: 3, label: '3 Tickets' }
];

export const ACHIEVEMENTS = [
  { id: 'k100', name: 'First Flock', desc: 'Kill 100 birds', stat: 'kills', goal: 100, reward: { type: 'money', amount: 5000 } },
  { id: 'k1000', name: 'Bird Brain', desc: 'Kill 1,000 birds', stat: 'kills', goal: 1000, reward: { type: 'ticket', amount: 2 } },
  { id: 'k10000', name: 'Sky Cleaner', desc: 'Kill 10,000 birds', stat: 'kills', goal: 10000, reward: { type: 'ticket', amount: 5 } },
  { id: 'e100k', name: 'Pocket Money', desc: 'Earn $100,000 total', stat: 'earned', goal: 100000, reward: { type: 'money', amount: 25000 } },
  { id: 'e1m', name: 'Millionaire', desc: 'Earn $1,000,000 total', stat: 'earned', goal: 1000000, reward: { type: 'ticket', amount: 3 } },
  { id: 'e10m', name: 'Tycoon', desc: 'Earn $10,000,000 total', stat: 'earned', goal: 10000000, reward: { type: 'box', box: 3 } },
  { id: 's25', name: 'On a Roll', desc: 'Reach a 25 killstreak', stat: 'streak', goal: 25, reward: { type: 'money', amount: 8000 } },
  { id: 's50', name: 'Unstoppable', desc: 'Reach a 50 killstreak', stat: 'streak', goal: 50, reward: { type: 'ticket', amount: 3 } },
  { id: 's100', name: 'Legendary Aim', desc: 'Reach a 100 killstreak', stat: 'streak', goal: 100, reward: { type: 'ticket', amount: 6 } },
  { id: 'd3', name: 'Explorer', desc: 'Reach dimension 3', stat: 'dimension', goal: 3, reward: { type: 'box', box: 2 } },
  { id: 'd5', name: 'Dimension Hopper', desc: 'Reach dimension 5', stat: 'dimension', goal: 5, reward: { type: 'box', box: 3 } },
  { id: 'bp50', name: 'Halfway There', desc: 'Reach Battle Pass tier 50', stat: 'bptier', goal: 50, reward: { type: 'ticket', amount: 3 } },
  { id: 'bp100', name: 'Pass Master', desc: 'Reach Battle Pass tier 100', stat: 'bptier', goal: 100, reward: { type: 'ticket', amount: 8 } },
  { id: 'p10', name: 'Pet Collector', desc: 'Own 10 pets', stat: 'pets', goal: 10, reward: { type: 'money', amount: 15000 } },
  { id: 'p25', name: 'Zookeeper', desc: 'Own 25 pets', stat: 'pets', goal: 25, reward: { type: 'ticket', amount: 4 } }
];

export const MAX_WEAPON_LEVEL = 5;

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
    this.ownedGear = [];          // persistent defensive gear (anti-bird)
    this.bestKillstreak = 0;      // longest kill streak in a single game (hunt)
    this.petInventory = [];
    this.equippedPets = [];
    this.petSlotUpgrades = 0;
    this.petBoosts = [];
    this.clanId = null;
    this.xp = 0;
    this.rank = 1;
    this.seenScopeHint = false;
    this.battlePassXP = 0;
    this.bpClaimedFree = [];
    this.bpClaimedPremium = [];
    this.premiumPass = false;
    this.referredBy = null;
    this.referralQualified = false;
    this.referralCount = 0;
    this.createdAt = 0;
    this.tickets = 0;
    this.firstMonthLogins = 0;
    this.lastLoginDay = null;
    this.lastDailyDay = null;
    this.dailyStreak = 0;
    this.bpSeason = 1;
    this.achievementsClaimed = [];
    this.minigameDay = null;
    this.minigamePlaysToday = 0;
    this.minigameBest = {};
    this.coopSessionId = null;
    this.coopRole = null;
    this.eventId = null;
    this.bpPremiumLedger = [];
    this.bonusPetSlots = 0;
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
        petInventory: this.petInventory || [],
        equippedPets: this.equippedPets || [],
        petSlotUpgrades: this.petSlotUpgrades || 0,
        petBoosts: this.petBoosts || [],
      activePet: this.activePet || null,
      ownedGear: this.ownedGear || [],
      bestKillstreak: this.bestKillstreak || 0,
      clanId: this.clanId || null,
      xp: this.xp || 0,
      rank: this.rank || 1,
      seenScopeHint: this.seenScopeHint || false,
      battlePassXP: this.battlePassXP || 0,
      bpClaimedFree: this.bpClaimedFree || [],
      bpClaimedPremium: this.bpClaimedPremium || [],
      bonusPetSlots: this.bonusPetSlots || 0,
      tickets: this.tickets || 0,
      premiumPass: this.premiumPass || false,
      referredBy: this.referredBy || null,
      referralQualified: this.referralQualified || false,
      createdAt: this.createdAt || 0,
      firstMonthLogins: this.firstMonthLogins || 0,
      lastLoginDay: this.lastLoginDay || null,
      lastDailyDay: this.lastDailyDay || null,
      dailyStreak: this.dailyStreak || 0,
      bpSeason: this.bpSeason || 1,
      achievementsClaimed: this.achievementsClaimed || [],
      minigameDay: this.minigameDay || null,
      minigamePlaysToday: this.minigamePlaysToday || 0,
      minigameBest: this.minigameBest || {},
      bpPremiumLedger: this.bpPremiumLedger || [],
      weaponOwned: {},
      locationUnlocked: {}
    };
    for (const [k, w] of Object.entries(this.weapons)) {
      data.weaponOwned[k] = w.owned;
    }
    for (const [k, l] of Object.entries(this.locations)) {
      if (l.isBoss || l.cost === undefined) continue; // non-buyable arenas (e.g. boss_desert) have no unlocked flag
      data.locationUnlocked[k] = !!l.unlocked;        // coerce to boolean — Firestore rejects `undefined`
    }
    // Fire-and-forget write to Firestore. setDoc validates synchronously and
    // THROWS on invalid data (e.g. an undefined field), which .catch() can't
    // catch — so wrap it, otherwise a bad save aborts advancing/buying.
    try {
      setDoc(doc(db, 'saves', this.uid), data).catch(e => console.warn('Save failed:', e));
    } catch (e) {
      console.warn('Save failed (invalid data):', e);
    }
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
        if (data.petInventory) this.petInventory = data.petInventory;
        if (data.equippedPets) this.equippedPets = data.equippedPets;
        if (data.petSlotUpgrades !== undefined) this.petSlotUpgrades = data.petSlotUpgrades;
        if (data.petBoosts) this.petBoosts = data.petBoosts;
      if (data.activePet) this.activePet = data.activePet;
      if (data.ownedGear) this.ownedGear = data.ownedGear;
      if (data.bestKillstreak !== undefined) this.bestKillstreak = data.bestKillstreak;
      if (data.clanId) this.clanId = data.clanId;
      if (data.xp !== undefined) this.xp = data.xp;
      if (data.rank !== undefined) this.rank = data.rank;
      if (data.seenScopeHint !== undefined) this.seenScopeHint = data.seenScopeHint;
      if (data.battlePassXP !== undefined) this.battlePassXP = data.battlePassXP;
      if (data.bpClaimedFree) this.bpClaimedFree = data.bpClaimedFree;
      if (data.bpClaimedPremium) this.bpClaimedPremium = data.bpClaimedPremium;
      if (data.bonusPetSlots !== undefined) this.bonusPetSlots = data.bonusPetSlots;
      if (data.tickets !== undefined) this.tickets = data.tickets;
      if (data.premiumPass !== undefined) this.premiumPass = data.premiumPass;
      if (data.referredBy !== undefined) this.referredBy = data.referredBy;
      if (data.referralQualified !== undefined) this.referralQualified = data.referralQualified;
      if (data.createdAt !== undefined) this.createdAt = data.createdAt;
      if (data.firstMonthLogins !== undefined) this.firstMonthLogins = data.firstMonthLogins;
      if (data.lastLoginDay !== undefined) this.lastLoginDay = data.lastLoginDay;
    if (data.lastDailyDay !== undefined) this.lastDailyDay = data.lastDailyDay;
    if (data.dailyStreak !== undefined) this.dailyStreak = data.dailyStreak;
    if (data.bpSeason !== undefined) this.bpSeason = data.bpSeason;
    if (data.achievementsClaimed) this.achievementsClaimed = data.achievementsClaimed;
    if (data.minigameDay !== undefined) this.minigameDay = data.minigameDay; this.minigameBest = data.minigameBest || {};
    if (data.minigamePlaysToday !== undefined) this.minigamePlaysToday = data.minigamePlaysToday;
      if (data.bpPremiumLedger) this.bpPremiumLedger = data.bpPremiumLedger;

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
    this.petInventory = [];
    this.equippedPets = [];
    this.petSlotUpgrades = 0;
    this.petBoosts = [];
    this.clanId = null;
    this.xp = 0;
    this.rank = 1;
    this.battlePassXP = 0;
    this.bpClaimedFree = [];
    this.bpClaimedPremium = [];
    this.bonusPetSlots = 0;
    this.tickets = 0;
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
      killstreak: this.bestKillstreak || 0,
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
          killstreak: data.killstreak || 0,
          day: data.day || 1,
          dimension: data.dimension || 1,
          tag: data.tag || null,
          rank: data.rank || 1
        });
      });
      return {
        byCurrentMoney: [...entries].sort((a, b) => b.currentMoney - a.currentMoney),
        byTotalEarned: [...entries].sort((a, b) => b.totalEarned - a.totalEarned),
        byKillstreak: [...entries].sort((a, b) => b.killstreak - a.killstreak)
      };
    } catch (e) {
      console.warn('Failed to read leaderboard:', e);
      return { byCurrentMoney: [], byTotalEarned: [], byKillstreak: [] };
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
    if (level >= MAX_WEAPON_LEVEL) return Infinity;
    // Cost ramps up with each level so deep upgrades stay a real money sink.
    return Math.floor(weapon.cost * (level + 1) * 0.6 * Math.pow(1.4, level));
  }

  upgradeWeapon(weaponKey) {
    const cost = this.getUpgradeCost(weaponKey);
    if (this.money < cost) return false;
    const level = this.getUpgradeLevel(weaponKey);
    if (level >= MAX_WEAPON_LEVEL) return false;
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
    if (level >= 4) { w.spread *= 0.7; w.ammo += 1; w.reloadTime *= 0.85; }
    if (level >= 5) { w.fireRate *= 0.85; w.power = (w.power || 1) + 1; w.accuracy = Math.min(1, w.accuracy * 1.05); }
    return w;
  }

  // ─── Defensive gear (anti-bird) ───
  buyGear(key) {
    const g = GEAR[key];
    if (!g || this.money < g.cost) return false;
    if (this.ownedGear.includes(key)) return false;
    this.money -= g.cost;
    this.ownedGear.push(key);
    this.save();
    return true;
  }

  hasGear(key) {
    return this.ownedGear.includes(key);
  }

  // Best protection across all owned gear: highest block chance, and whether
  // any owned piece grants slow-immunity. Used by the bird-attack system.
  getPoopDefense() {
    let block = 0, slowImmune = false;
    for (const key of this.ownedGear) {
      const g = GEAR[key];
      if (!g) continue;
      if (g.poopBlock > block) block = g.poopBlock;
      if (g.slowImmune) slowImmune = true;
    }
    return { block, slowImmune };
  }

  // Passive earnings bonus from the currently-equipped pet (0 = none).
  // ─── Pets & mystery boxes ───────────────────────────────
  mysteryBoxCost(dim, boxNum) {
    const base = [50000, 300000, 1500000][boxNum - 1] || 50000;
    return Math.round(base * Math.pow(1.7, Math.max(0, dim - 1)));
  }

  _makePet(dim, rarity) {
    const theme = (DIMENSIONS[dim - 1] && DIMENSIONS[dim - 1].name) || ('Dim ' + dim);
    const isOOW = rarity === 'outofwhack';
    const pool = isOOW ? OOW_NAMES : PET_NOUNS;
    const noun = pool[Math.floor(Math.random() * pool.length)];
    return {
      id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36),
      dim, rarity,
      name: isOOW ? noun : (theme + ' ' + noun),
      isOOW,
      mult: Math.round(PET_RARITIES[rarity].mult * (1 + (dim - 1) * 0.25) * 1000) / 1000,
      effects: isOOW ? OOW_EFFECTS.slice() : []
    };
  }

  _refParam() {
    try { return new URLSearchParams(location.search).get('ref'); } catch (e) { return null; }
  }
  referralLink() {
    return location.origin + location.pathname + '?ref=' + (this.uid || '');
  }
  async captureReferral() {
    const ref = this._refParam();
    if (!ref || ref === this.uid || this.referredBy) return;
    this.referredBy = ref;
    try { await setDoc(doc(db, 'referrals', this.uid), { referrer: ref, qualified: false, ts: Date.now() }); } catch (e) {}
    this.save();
  }
  async qualifyReferral() {
    if (!this.referredBy || this.referralQualified) return;
    if (this.createdAt && (Date.now() - this.createdAt > 30 * 24 * 60 * 60 * 1000)) return;
    this.referralQualified = true;
    try { await setDoc(doc(db, 'referrals', this.uid), { referrer: this.referredBy, qualified: true, ts: Date.now() }, { merge: true }); } catch (e) {}
    this.save();
  }  recordLogin() {
    const now = Date.now();
    if (!this.createdAt) this.createdAt = now;
    const today = new Date().toISOString().slice(0, 10);
    const withinFirstMonth = (now - this.createdAt) <= 30 * 24 * 60 * 60 * 1000;
    if (this.lastLoginDay !== today) {
      this.lastLoginDay = today;
      if (withinFirstMonth) this.firstMonthLogins = (this.firstMonthLogins || 0) + 1;
    }
    if (this.referredBy && this.uid) {
      try { setDoc(doc(db, 'referrals', this.uid), { referrer: this.referredBy, createdAt: this.createdAt, firstMonthLogins: this.firstMonthLogins || 0 }, { merge: true }); } catch (e) {}
    }
    this.save();
  }
  checkSeasonReset() {
    const info = bpSeasonInfo();
    if (!this.bpSeason) this.bpSeason = info.season;
    if (info.season > this.bpSeason) {
      this.battlePassXP = 0;
      this.bpClaimedFree = [];
      this.bpClaimedPremium = [];
      this.bpPremiumLedger = [];
      this.bpSeason = info.season;
      this.save();
      return true;
    }
    return false;
  }

  _achStat(key) {
    if (key === 'kills') return this.totalBirdsKilled || 0;
    if (key === 'earned') return this.totalMoneyEarned || 0;
    if (key === 'streak') return this.bestKillstreak || 0;
    if (key === 'dimension') return this.dimension || 1;
    if (key === 'bptier') return this.bpTier();
    if (key === 'pets') return (this.petInventory || []).length;
    return 0;
  }

  achievementList() {
    const claimed = this.achievementsClaimed || [];
    return ACHIEVEMENTS.map((a) => {
      const cur = this._achStat(a.stat);
      const done = cur >= a.goal;
      const isClaimed = claimed.indexOf(a.id) >= 0;
      return { id: a.id, name: a.name, desc: a.desc, goal: a.goal, current: cur, done: done, claimed: isClaimed, claimable: done && !isClaimed, reward: a.reward };
    });
  }

  claimAchievement(id) {
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (!a) return { error: 'Unknown achievement.' };
    this.achievementsClaimed = this.achievementsClaimed || [];
    if (this.achievementsClaimed.indexOf(id) >= 0) return { error: 'Already claimed.' };
    if (this._achStat(a.stat) < a.goal) return { error: 'Not completed yet.' };
    const r = a.reward; let msg = '';
    if (r.type === 'money') { this.money += r.amount; this.totalMoneyEarned += r.amount; msg = 'Earned $' + r.amount.toLocaleString(); }
    else if (r.type === 'ticket') { this.tickets = (this.tickets || 0) + r.amount; msg = '+' + r.amount + ' Ticket' + (r.amount > 1 ? 's' : '') + '!'; }
    else if (r.type === 'box') { const pet = this.grantPetFromBox(this.dimension, r.box); msg = pet ? ('Unboxed ' + pet.name + '!') : 'Mystery box opened.'; }
    this.achievementsClaimed.push(id);
    this.save();
    return { ok: true, message: msg };
  }

  async eventJoin() {
    if (!this.uid) return { error: 'You are not signed in.' };
    const info = eventInfo();
    if (info.phase !== 'join') return { error: 'No event is open right now.' };
    const myName = await this._myName();
    this.eventId = info.eventId;
    try { const obj = {}; obj[this.uid] = { uid: this.uid, name: myName, joined: true }; await setDoc(doc(db, 'events', info.eventId), { id: info.eventId, participants: obj }, { merge: true }); } catch (e) {}
    return { ok: true, eventId: info.eventId };
  }

  async eventSubmit(money, kills) {
    const info = eventInfo();
    const eid = this.eventId || info.eventId;
    if (!this.uid || !eid) return;
    const myName = await this._myName();
    try { const obj = {}; obj[this.uid] = { uid: this.uid, name: myName, money: money || 0, kills: kills || 0, done: true }; await setDoc(doc(db, 'events', eid), { contributions: obj }, { merge: true }); } catch (e) {}
  }

  async eventSettle() {
    const eid = this.eventId;
    if (!this.uid || !eid) return { settled: false };
    let data;
    try { const s = await getDoc(doc(db, 'events', eid)); if (!s.exists()) return { settled: false }; data = s.data(); } catch (e) { return { settled: false }; }
    const c = data.contributions || {};
    const mine = c[this.uid];
    if (!mine || !mine.done) return { settled: false };
    let pool = 0, mvpUid = null, mvpKills = -1, mvpName = '', count = 0;
    for (const k in c) { const en = c[k]; if (!en || !en.done) continue; count++; pool += (en.money || 0); if ((en.kills || 0) > mvpKills) { mvpKills = en.kills || 0; mvpUid = k; mvpName = en.name || 'Player'; } }
    if (mine.settled) return { settled: true, already: true };
    const iAmMvp = (mvpUid === this.uid);
    if (iAmMvp) { this.money += pool; this.totalMoneyEarned += pool; }
    try { const obj = {}; obj[this.uid] = Object.assign({}, mine, { settled: true }); await setDoc(doc(db, 'events', eid), { contributions: obj }, { merge: true }); } catch (e) {}
    this.save();
    const res = { settled: true, pool: pool, players: count, mvpName: mvpName, mvpKills: mvpKills, iAmMvp: iAmMvp, myKills: mine.kills || 0 };
    this.eventId = null;
    return res;
  }

  async eventParticipantCount() {
    const info = eventInfo();
    try { const s = await getDoc(doc(db, 'events', info.eventId)); if (s.exists()) { const p = s.data().participants || {}; return Object.keys(p).length; } } catch (e) {}
    return 0;
  }

  submitMinigameScore() {
    if (!this.uid) return;
    const b = this.minigameBest || {};
    const data = { name: this.displayName || 'Player', skeet: b['Skeet Shooting'] || 0, quickdraw: b['Quick Draw'] || 0, dodge: b['Dodge the Dookie'] || 0, updatedAt: Date.now() };
    setDoc(doc(db, 'minigameScores', this.uid), data, { merge: true }).catch((e) => console.warn('Minigame score submit failed:', e));
  }

  static async getMinigameLeaderboard() {
    try {
      const snap = await getDocs(collection(db, 'minigameScores'));
      const rows = [];
      snap.forEach((d) => { const x = d.data(); rows.push({ uid: d.id, name: x.name || 'Unknown', skeet: x.skeet || 0, quickdraw: x.quickdraw || 0, dodge: x.dodge || 0 }); });
      return rows;
    } catch (e) { console.warn('Minigame leaderboard fetch failed:', e); return []; }
  }

  minigameReward(gameId, score) {
    this.minigameBest = this.minigameBest || {}; if (score > (this.minigameBest[gameId] || 0)) this.minigameBest[gameId] = score; this.submitMinigameScore();
    const today = new Date().toISOString().slice(0, 10);
    if (this.minigameDay !== today) { this.minigameDay = today; this.minigamePlaysToday = 0; }
    const CAP = 20;
    if ((this.minigamePlaysToday || 0) >= CAP) { this.save(); return { reward: 'Daily reward limit reached \u2014 keep playing for fun!' }; }
    this.minigamePlaysToday = (this.minigamePlaysToday || 0) + 1;
    let cash = 0, tickets = 0;
    if (gameId === 'Skeet Shooting') cash = score * 120;
    else if (gameId === 'Quick Draw') cash = Math.round(score / 8);
    else cash = score * 100;
    cash = Math.max(0, Math.round(cash));
    if (score > 0 && Math.random() < 0.15) tickets = 1;
    this.money += cash; this.totalMoneyEarned += cash;
    if (tickets) this.tickets = (this.tickets || 0) + tickets;
    this.save();
    let msg = 'Earned $' + cash.toLocaleString();
    if (tickets) msg += ' + ' + tickets + ' Ticket';
    return { reward: msg, cash: cash, tickets: tickets };
  }

  claimDailyReward() {
    const today = new Date().toISOString().slice(0, 10);
    if (this.lastDailyDay === today) return { claimed: false };
    const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (this.lastDailyDay === yest) this.dailyStreak = (this.dailyStreak || 0) + 1;
    else this.dailyStreak = 1;
    this.lastDailyDay = today;
    const idx = ((this.dailyStreak - 1) % 7);
    const r = DAILY_REWARDS[idx] || DAILY_REWARDS[0];
    let money = 0, tickets = 0;
    if (r.money) { const amt = Math.max(r.money, Math.round((this.totalMoneyEarned || 0) * (r.pct || 0))); this.money += amt; this.totalMoneyEarned += amt; money = amt; }
    if (r.ticket) { this.tickets = (this.tickets || 0) + r.ticket; tickets = r.ticket; }
    this.save();
    return { claimed: true, day: this.dailyStreak, dayInCycle: idx + 1, money, tickets };
  }

  revokePremium() {
    this.premiumPass = false;
    const led = this.bpPremiumLedger || [];
    for (const g of led) {
      if (g.type === 'money') { this.money = Math.max(0, this.money - (g.amount || 0)); }
      else if (g.type === 'ticket') { this.tickets = Math.max(0, (this.tickets || 0) - (g.amount || 0)); }
      else if (g.type === 'slot') { this.bonusPetSlots = Math.max(0, (this.bonusPetSlots || 0) - (g.amount || 0)); }
      else if (g.type === 'gun') { if (g.weapon && this.weapons[g.weapon]) this.weapons[g.weapon].owned = false; }
      else if (g.type === 'potion' && g.potion) { if (this.ownedConsumables && this.ownedConsumables[g.potion]) { this.ownedConsumables[g.potion] = Math.max(0, this.ownedConsumables[g.potion] - (g.amount || 0)); if (this.ownedConsumables[g.potion] <= 0) delete this.ownedConsumables[g.potion]; } }
      else if (g.type === 'skin') {
        this.ownedSkins = (this.ownedSkins || []).filter(s => s !== g.skin);
        for (const k in (this.equippedSkins || {})) { if (this.equippedSkins[k] === g.skin) this.equippedSkins[k] = 'default'; }
      }
      else if (g.type === 'box' && g.petId) {
        this.petInventory = (this.petInventory || []).filter(p => p.id !== g.petId);
        this.equippedPets = (this.equippedPets || []).filter(id => id !== g.petId);
      }
    }
    this.bpPremiumLedger = [];
    this.bpClaimedPremium = [];
    const cap = this.petSlotCap();
    if ((this.equippedPets || []).length > cap) this.equippedPets = this.equippedPets.slice(0, cap);
    if (this.currentWeapon && this.weapons[this.currentWeapon] && !this.weapons[this.currentWeapon].owned) this.currentWeapon = 'old_rifle';
    this.save();
  }
  async refreshReferrals() {
    if (!this.uid) return this.referralCount || 0;
    try {
      const q = query(collection(db, 'referrals'), where('referrer', '==', this.uid));
      const snap = await getDocs(q);
      let n = 0;
      snap.forEach(d => { if (d.data().qualified) n++; });
      this.referralCount = n;
      if (n >= REFERRALS_NEEDED) { if (!this.premiumPass) { this.premiumPass = true; this.save(); } }
      else if (this.premiumPass) { this.revokePremium(); }
    } catch (e) {}
    return this.referralCount || 0;
  }

  async redeemPremiumCode(input) {
    const code = String(input || '').trim();
    if (!code) return { error: 'Enter a code.' };
    const h = await sha256(code);
    let valid = false;
    try {
      const snap = await getDoc(doc(db, 'config', 'premium'));
      if (snap.exists() && snap.data().codeHash === h) valid = true;
    } catch (e) {}
    if (valid) { this.premiumPass = true; this.save(); return { ok: true }; }
    return { error: 'Invalid code.' };
  }

  grantPet(dim, rarity) {
    const pet = this._makePet(dim, rarity);
    this.petInventory = this.petInventory || [];
    this.petInventory.push(pet);
    return pet;
  }
  buyTicketItem(key) {
    const item = TICKET_SHOP.find(i => i.key === key);
    if (!item) return { error: 'Unknown item.' };
    if ((this.tickets || 0) < item.cost) return { error: 'Not enough tickets.' };
    if (item.type === 'pet') { const pet = this.grantPet(this.dimension, item.rarity); this.tickets -= item.cost; this.save(); return { ok: true, message: pet ? ('Got ' + pet.name + '!') : 'Pet granted!' }; }
    if (item.type === 'skin') { this.ownedSkins = this.ownedSkins || ['default']; if (this.ownedSkins.includes(item.skin)) return { error: 'Already owned.' }; this.ownedSkins.push(item.skin); this.tickets -= item.cost; this.save(); return { ok: true, message: item.name + ' unlocked!' }; }
    if (item.type === 'slot') { this.bonusPetSlots = (this.bonusPetSlots || 0) + item.amount; this.tickets -= item.cost; this.save(); return { ok: true, message: '+' + item.amount + ' pet slot!' }; }
    return { error: 'Cannot buy.' };
  }

  grantPetFromBox(dim, boxNum) {
    let rarity;
    if (Math.random() < OOW_CHANCE) { rarity = 'outofwhack'; }
    else {
      const odds = MYSTERY_BOXES[boxNum] || MYSTERY_BOXES[1];
      const r = Math.random() * 100; let acc = 0; rarity = 'common';
      for (const k of PET_RARITY_ORDER) { acc += odds[k] || 0; if (r <= acc) { rarity = k; break; } }
    }
    const pet = this._makePet(dim, rarity);
    this.petInventory = this.petInventory || [];
    this.petInventory.push(pet);
    return pet;
  }

  rollMysteryBox(dim, boxNum) {
    const cost = this.mysteryBoxCost(dim, boxNum);
    if (this.money < cost) return null;
    this.money -= cost;
    let rarity;
    if (Math.random() < OOW_CHANCE) {
      rarity = 'outofwhack';
    } else {
      const odds = MYSTERY_BOXES[boxNum] || MYSTERY_BOXES[1];
      const r = Math.random() * 100;
      let acc = 0;
      rarity = 'common';
      for (const k of PET_RARITY_ORDER) {
        acc += odds[k] || 0;
        if (r <= acc) { rarity = k; break; }
      }
    }
    const pet = this._makePet(dim, rarity);
    this.petInventory = this.petInventory || [];
    this.petInventory.push(pet);
    this.save();
    return pet;
  }

  getPet(id) { return (this.petInventory || []).find(p => p.id === id) || null; }

  activeBoostCount() {
    const now = Date.now();
    this.petBoosts = (this.petBoosts || []).filter(b => b.expiresAt > now);
    return this.petBoosts.length;
  }

  // ---- Battle Pass ----
  bpTier() {
    let xp = this.battlePassXP || 0, t = 1;
    while (t < BP_MAX_TIER && xp >= bpTierCost(t)) { xp -= bpTierCost(t); t++; }
    return t;
  }
  bpProgress() {
    let xp = this.battlePassXP || 0, t = 1;
    while (t < BP_MAX_TIER && xp >= bpTierCost(t)) { xp -= bpTierCost(t); t++; }
    const need = bpTierCost(t);
    return { tier: t, into: xp, need: need === Infinity ? 0 : need };
  }
  addBattlePassXP(amount) {
    this.battlePassXP = (this.battlePassXP || 0) + Math.max(0, Math.round(amount || 0));
  }
  bpRewardAt(tier, track) {
    const arr = track === 'premium' ? BATTLE_PASS.premium : BATTLE_PASS.free;
    return arr[tier - 1] || null;
  }
  bpIsClaimed(tier, track) {
    const list = track === 'premium' ? (this.bpClaimedPremium || []) : (this.bpClaimedFree || []);
    return list.includes(tier);
  }
  bpCanClaim(tier, track) {
    if (tier < 1 || tier > BP_MAX_TIER) return false;
    const _r = this.bpRewardAt(tier, track); if (!_r || _r.type === 'empty') return false;
    if (this.bpTier() < tier) return false;
    if (track === 'premium' && !this.premiumPass) return false;
    return !this.bpIsClaimed(tier, track);
  }
  bpClaim(tier, track) {
    if (!this.bpCanClaim(tier, track)) return { error: 'Not available.' };
    const r = this.bpRewardAt(tier, track);
    if (!r) return { error: 'No reward.' };
    let msg = ''; const led = { tier: tier, type: r.type };
    if (r.type === 'money') { this.money += r.amount; this.totalMoneyEarned += r.amount; led.amount = r.amount; msg = 'Earned $' + r.amount.toLocaleString(); }
    else if (r.type === 'ticket') { this.tickets = (this.tickets || 0) + r.amount; led.amount = r.amount; msg = '+' + r.amount + ' Ticket' + (r.amount > 1 ? 's' : '') + '!'; }
    else if (r.type === 'box') { const pet = this.grantPetFromBox(this.dimension, r.box); if (pet) led.petId = pet.id; msg = pet ? ('Unboxed ' + pet.name + '!') : 'Mystery box opened.'; }
    else if (r.type === 'gun') { if (this.weapons[r.weapon]) this.weapons[r.weapon].owned = true; led.weapon = r.weapon; msg = (r.label || 'Weapon') + ' unlocked!'; }
    else if (r.type === 'slot') { this.bonusPetSlots = Math.min(6, (this.bonusPetSlots || 0) + r.amount); led.amount = r.amount; msg = '+' + r.amount + ' pet slot' + (r.amount > 1 ? 's' : '') + '!'; }
    else if (r.type === 'skin') { this.ownedSkins = this.ownedSkins || ['default']; if (!this.ownedSkins.includes(r.skin)) this.ownedSkins.push(r.skin); led.skin = r.skin; msg = (r.label || 'Skin') + ' unlocked!'; }
    else if (r.type === 'potion') { const n = r.amount || 1; this.ownedConsumables = this.ownedConsumables || {}; this.ownedConsumables[r.potion] = (this.ownedConsumables[r.potion] || 0) + n; led.potion = r.potion; led.amount = n; msg = 'Got ' + (r.label || 'Potion') + '!'; }
    const list = track === 'premium' ? (this.bpClaimedPremium = this.bpClaimedPremium || []) : (this.bpClaimedFree = this.bpClaimedFree || []);
    list.push(tier);
    if (track === 'premium') { this.bpPremiumLedger = this.bpPremiumLedger || []; this.bpPremiumLedger.push(led); }
    this.save();
    return { ok: true, message: msg, reward: r };
  }

  petSlotCap() {
    return Math.min(MAX_PETS, 1 + (this.petSlotUpgrades || 0) + this.activeBoostCount()) + (this.bonusPetSlots || 0);
  }

  equipPetInstance(id) {
    this.equippedPets = (this.equippedPets || []).filter(x => this.getPet(x));
    if (this.equippedPets.includes(id)) return true;
    if (!this.getPet(id)) return false;
    if (this.equippedPets.length >= this.petSlotCap()) return false;
    this.equippedPets.push(id);
    this.save();
    return true;
  }

  unequipPet(id) {
    this.equippedPets = (this.equippedPets || []).filter(x => x !== id);
    this.save();
  }

  petMultiplier() {
    let m = 1;
    const cap = this.petSlotCap();
    for (const id of (this.equippedPets || []).slice(0, cap)) {
      const p = this.getPet(id);
      if (p) m *= (1 + p.mult);
    }
    return m;
  }

  hasPetEffect(effect) {
    const cap = this.petSlotCap();
    for (const id of (this.equippedPets || []).slice(0, cap)) {
      const p = this.getPet(id);
      if (p && p.effects && p.effects.includes(effect)) return true;
    }
    return false;
  }

  petUpgradeCost() {
    if ((this.petSlotUpgrades || 0) >= MAX_PETS - 1) return null;
    return Math.round(20e9 * Math.pow(1.75, this.petSlotUpgrades || 0));
  }

  buyPetSlotUpgrade() {
    const cost = this.petUpgradeCost();
    if (cost == null || this.money < cost) return false;
    this.money -= cost;
    this.petSlotUpgrades = (this.petSlotUpgrades || 0) + 1;
    this.save();
    return true;
  }

  buyPetBoost(key) {
    const b = PET_BOOSTS[key];
    if (!b || this.money < b.cost) return false;
    this.money -= b.cost;
    this.petBoosts = this.petBoosts || [];
    this.petBoosts.push({ rarity: b.rarity, expiresAt: Date.now() + b.hours * 3600 * 1000 });
    this.save();
    return true;
  }

  // ─── Pet trading (global; any player, any dimension) ───
  async _myName() {
    if (this._cachedName) return this._cachedName;
    try { const s = await getDoc(doc(db, 'leaderboard', this.uid)); if (s.exists()) this._cachedName = s.data().name || 'Player'; } catch (e) {}
    return this._cachedName || 'Player';
  }

  async findPlayerByName(name) {
    try {
      const snap = await getDocs(collection(db, 'leaderboard'));
      const lower = (name || '').trim().toLowerCase();
      let found = null;
      snap.forEach(d => { const n = (d.data().name || ''); if (n.toLowerCase() === lower) found = { uid: d.id, name: n }; });
      return found;
    } catch (e) { return null; }
  }

  async sendPetTrade(toName, petId) {
    if (!this.uid) return { error: 'You are not signed in.' };
    const pet = this.getPet(petId);
    if (!pet) return { error: 'Pet not found.' };
    const target = await this.findPlayerByName(toName);
    if (!target) return { error: 'No player found with that name.' };
    if (target.uid === this.uid) return { error: 'You cannot trade with yourself.' };
    const fromName = await this._myName();
    this.petInventory = (this.petInventory || []).filter(p => p.id !== petId);
    this.equippedPets = (this.equippedPets || []).filter(id => id !== petId);
    const id = 't' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
    try {
      await setDoc(doc(db, 'trades', id), { id, fromUid: this.uid, fromName, toUid: target.uid, toName: target.name, pet, status: 'pending', createdAt: Date.now() });
      this.save();
      return { ok: true, toName: target.name };
    } catch (e) {
      this.petInventory.push(pet);
      this.save();
      return { error: 'Trade failed (network or permissions).' };
    }
  }

  async getMyTrades() {
    const incoming = [], outgoing = [];
    if (!this.uid) return { incoming, outgoing };
    try {
      const snap = await getDocs(collection(db, 'trades'));
      const reclaim = [];
      snap.forEach(d => {
        const t = d.data();
        if (t.toUid === this.uid && t.status === 'pending') incoming.push(t);
        else if (t.fromUid === this.uid) {
          if (t.status === 'returned') reclaim.push(t);
          else if (t.status === 'pending') outgoing.push(t);
        }
      });
      for (const t of reclaim) {
        if (t.pet && !this.getPet(t.pet.id)) this.petInventory.push(t.pet);
        try { await deleteDoc(doc(db, 'trades', t.id)); } catch (e) {}
      }
      if (reclaim.length) this.save();
    } catch (e) {}
    return { incoming, outgoing };
  }

  async acceptTrade(tradeId) {
    if (!this.uid) return false;
    try {
      const s = await getDoc(doc(db, 'trades', tradeId));
      if (!s.exists()) return false;
      const t = s.data();
      if (t.toUid !== this.uid || t.status !== 'pending') return false;
      if (t.pet && !this.getPet(t.pet.id)) this.petInventory.push(t.pet);
      await deleteDoc(doc(db, 'trades', tradeId));
      this.save();
      return true;
    } catch (e) { return false; }
  }

  async declineTrade(tradeId) {
    try { await setDoc(doc(db, 'trades', tradeId), { status: 'returned' }, { merge: true }); return true; } catch (e) { return false; }
  }

  async cancelTrade(tradeId) {
    if (!this.uid) return false;
    try {
      const s = await getDoc(doc(db, 'trades', tradeId));
      if (!s.exists()) return false;
      const t = s.data();
      if (t.fromUid !== this.uid) return false;
      if (t.pet && !this.getPet(t.pet.id)) this.petInventory.push(t.pet);
      await deleteDoc(doc(db, 'trades', tradeId));
      this.save();
      return true;
    } catch (e) { return false; }
  }

  async sendHuntRequest(toName) {
    if (!this.uid) return { error: 'You are not signed in.' };
    const target = await this.findPlayerByName(toName);
    if (!target) return { error: 'No player found with that name.' };
    if (target.uid === this.uid) return { error: 'You cannot hunt with yourself.' };
    const myName = await this._myName();
    const sessionId = 'coop_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    try {
      await setDoc(doc(db, 'coopSessions', sessionId), { id: sessionId, hostUid: this.uid, hostName: myName, guestUid: target.uid, guestName: target.name, status: 'waiting', contributions: {}, createdAt: Date.now() });
      const reqId = 'req_' + this.uid + '_' + target.uid;
      await setDoc(doc(db, 'coopRequests', reqId), { id: reqId, fromUid: this.uid, fromName: myName, toUid: target.uid, toName: target.name, sessionId: sessionId, status: 'pending', createdAt: Date.now() });
      this.coopSessionId = sessionId; this.coopRole = 'host';
      return { sessionId: sessionId, toName: target.name };
    } catch (e) { return { error: 'Could not send request (network or permissions).' }; }
  }

  async getIncomingHuntRequests() {
    if (!this.uid) return [];
    try {
      const snap = await getDocs(collection(db, 'coopRequests'));
      const out = []; const now = Date.now();
      snap.forEach(d => { const rq = d.data();
        if (rq.toUid === this.uid && rq.status === 'pending') {
          if (now - (rq.createdAt || 0) > 120000) { try { deleteDoc(doc(db, 'coopRequests', rq.id)); } catch (e) {} }
          else out.push(rq);
        } });
      return out;
    } catch (e) { return []; }
  }

  async acceptHuntRequest(reqId) {
    try {
      const s = await getDoc(doc(db, 'coopRequests', reqId));
      if (!s.exists()) return { error: 'That request is no longer available.' };
      const rq = s.data();
      await setDoc(doc(db, 'coopSessions', rq.sessionId), { status: 'active' }, { merge: true });
      await deleteDoc(doc(db, 'coopRequests', reqId));
      this.coopSessionId = rq.sessionId; this.coopRole = 'guest';
      return { sessionId: rq.sessionId, fromName: rq.fromName };
    } catch (e) { return { error: 'Could not accept (network).' }; }
  }

  async declineHuntRequest(reqId) {
    try {
      const s = await getDoc(doc(db, 'coopRequests', reqId));
      if (s.exists()) { const rq = s.data(); await setDoc(doc(db, 'coopSessions', rq.sessionId), { status: 'declined' }, { merge: true }); }
      await deleteDoc(doc(db, 'coopRequests', reqId));
    } catch (e) {}
  }

  async coopSessionStatus() {
    if (!this.coopSessionId) return null;
    try { const s = await getDoc(doc(db, 'coopSessions', this.coopSessionId)); return s.exists() ? s.data() : null; } catch (e) { return null; }
  }

  cancelCoop() {
    const id = this.coopSessionId; this.coopSessionId = null; this.coopRole = null;
    if (id) { try { setDoc(doc(db, 'coopSessions', id), { status: 'cancelled' }, { merge: true }); } catch (e) {} }
  }

  async coopSubmit(money, kills, xp) {
    if (!this.coopSessionId || !this.uid) return;
    const myName = await this._myName();
    try {
      const obj = {}; obj[this.uid] = { uid: this.uid, name: myName, money: money || 0, kills: kills || 0, xp: xp || 0, done: true };
      await setDoc(doc(db, 'coopSessions', this.coopSessionId), { contributions: obj }, { merge: true });
    } catch (e) {}
  }

  async coopCheckSettle() {
    if (!this.coopSessionId || !this.uid) return { settled: false };
    let data;
    try { const s = await getDoc(doc(db, 'coopSessions', this.coopSessionId)); if (!s.exists()) return { settled: false, gone: true }; data = s.data(); } catch (e) { return { settled: false }; }
    const c = data.contributions || {};
    const mine = c[this.uid];
    if (!mine || !mine.done) return { settled: false };
    const partnerUid = (this.uid === data.hostUid) ? data.guestUid : data.hostUid;
    const partnerName = (this.uid === data.hostUid) ? data.guestName : data.hostName;
    const partner = c[partnerUid];
    if (!partner || !partner.done) return { settled: false, waitingFor: partnerName };
    if (mine.settled) return { settled: true, already: true };
    const bonusMoney = partner.money || 0;
    const total = (mine.money || 0) + (partner.money || 0);
    const myKills = mine.kills || 0, pKills = partner.kills || 0;
    const tie = myKills === pKills;
    const iAmMvp = myKills > pKills;
    const coopBonusXP = Math.round((mine.xp || 0) * 0.5);
    const mvpBonusXP = (iAmMvp || tie) ? Math.round((mine.xp || 0) * 0.5) : 0;
    const totalBonusXP = coopBonusXP + mvpBonusXP;
    this.money += bonusMoney;
    this.totalMoneyEarned = (this.totalMoneyEarned || 0) + bonusMoney;
    let rankUp = null;
    if (totalBonusXP > 0) rankUp = this.addXP(totalBonusXP);
    try { const obj = {}; obj[this.uid] = Object.assign({}, mine, { settled: true }); await setDoc(doc(db, 'coopSessions', this.coopSessionId), { contributions: obj }, { merge: true }); } catch (e) {}
    this.save();
    try { this.updateLeaderboard(this.displayName); } catch (e) {}
    const res = { settled: true, myMoney: mine.money || 0, partnerMoney: partner.money || 0, total: total, partnerName: partner.name || partnerName, myKills: myKills, partnerKills: pKills, mvpName: tie ? null : (iAmMvp ? (mine.name || 'You') : (partner.name || partnerName)), iAmMvp: iAmMvp, tie: tie, bonusXP: totalBonusXP, rankUp: rankUp };
    this.coopSessionId = null; this.coopRole = null;
    return res;
  }

  getEarnBonus() {
    const pet = this.activePet && PETS[this.activePet];
    return (pet && pet.earnBonus) ? pet.earnBonus : 0;
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
    // Skip non-buyable arenas (e.g. boss_desert) — they have no cost and must
    // never be "purchased" (subtracting an undefined cost corrupts money to NaN).
    if (!loc || loc.isBoss || loc.cost === undefined) return false;
    if (loc.unlocked || this.money < loc.cost) return false;
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
