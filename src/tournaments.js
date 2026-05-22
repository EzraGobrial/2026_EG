// ═══════════════════════════════════════════════
// Gary's Life — Tournament System
// Weekly tournaments with placement prizes
// ═══════════════════════════════════════════════

import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * Get the current week ID (ISO week format: "2026-W21")
 */
function getWeekId() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 604800000;
  const week = Math.ceil((diff / oneWeek) + start.getDay() / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

/**
 * Get a seeded weapon/location for this week's tournament
 */
function getTournamentConfig(weekId) {
  // Simple hash to pick weapon and location
  let hash = 0;
  for (let i = 0; i < weekId.length; i++) {
    hash = (hash * 31 + weekId.charCodeAt(i)) & 0xfffffff;
  }

  const weapons = ['hunting_rifle', 'combat_shotgun', 'scoped_rifle', 'semi_auto', 'crossbow'];
  const locations = ['park', 'forest', 'lakeside', 'mountain'];

  return {
    weapon: weapons[hash % weapons.length],
    location: locations[(hash >> 4) % locations.length]
  };
}

/**
 * Get or create the current tournament
 */
export async function getCurrentTournament() {
  const weekId = getWeekId();
  const config = getTournamentConfig(weekId);

  try {
    const snap = await getDoc(doc(db, 'tournaments', weekId));
    if (snap.exists()) {
      return { weekId, ...snap.data(), ...config };
    }

    // Create new tournament
    const tournament = {
      weekId,
      weapon: config.weapon,
      location: config.location,
      startTime: Date.now(),
      entries: []
    };
    await setDoc(doc(db, 'tournaments', weekId), tournament);
    return { ...tournament, ...config };
  } catch (e) {
    console.warn('Failed to get tournament:', e);
    return { weekId, weapon: config.weapon, location: config.location, entries: [] };
  }
}

/**
 * Submit a score to the tournament
 */
export async function submitScore(weekId, uid, name, score, kills, maxCombo) {
  try {
    const snap = await getDoc(doc(db, 'tournaments', weekId));
    if (!snap.exists()) return false;

    const data = snap.data();
    const entries = data.entries || [];

    // Update or add entry (keep best score)
    const existing = entries.find(e => e.uid === uid);
    if (existing) {
      if (score > existing.score) {
        existing.score = score;
        existing.kills = kills;
        existing.maxCombo = maxCombo;
        existing.submittedAt = Date.now();
        existing.name = name;
      }
    } else {
      entries.push({ uid, name, score, kills, maxCombo, submittedAt: Date.now() });
    }

    // Sort by score descending
    entries.sort((a, b) => b.score - a.score);

    await setDoc(doc(db, 'tournaments', weekId), { ...data, entries });
    return true;
  } catch (e) {
    console.warn('Failed to submit tournament score:', e);
    return false;
  }
}

/**
 * Get tournament leaderboard
 */
export async function getTournamentLeaderboard(weekId) {
  try {
    const snap = await getDoc(doc(db, 'tournaments', weekId));
    if (!snap.exists()) return [];
    const entries = snap.data().entries || [];
    return entries.sort((a, b) => b.score - a.score);
  } catch (e) {
    console.warn('Failed to get tournament leaderboard:', e);
    return [];
  }
}

/**
 * Get player's placement
 */
export function getPlacement(entries, uid) {
  const sorted = [...entries].sort((a, b) => b.score - a.score);
  const idx = sorted.findIndex(e => e.uid === uid);
  return idx >= 0 ? idx + 1 : -1;
}

/**
 * Get prize for a placement
 */
export function getPrize(placement) {
  if (placement === 1) return { money: 1000, banner: 'champion', skin: 'champion_gold', label: '1st Place — $1000 + Champion Banner + Champion Gold Skin' };
  if (placement === 2) return { money: 750, banner: 'champion', skin: null, label: '2nd Place — $750 + Champion Banner' };
  if (placement === 3) return { money: 500, banner: null, skin: null, label: '3rd Place — $500' };
  if (placement <= 10) return { money: 250, banner: null, skin: null, label: `${placement}th Place — $250` };
  if (placement > 0) return { money: 50, banner: null, skin: null, label: `${placement}th Place — $50` };
  return null;
}

/**
 * Claim tournament prize
 */
export async function claimPrize(weekId, uid, economy) {
  try {
    const resultId = `${weekId}_${uid}`;
    const resultSnap = await getDoc(doc(db, 'tournamentResults', resultId));
    if (resultSnap.exists() && resultSnap.data().prizeClaimed) return false; // already claimed

    const snap = await getDoc(doc(db, 'tournaments', weekId));
    if (!snap.exists()) return false;

    const entries = snap.data().entries || [];
    const placement = getPlacement(entries, uid);
    if (placement <= 0) return false;

    const prize = getPrize(placement);
    if (!prize) return false;

    // Award prizes
    economy.money += prize.money;
    economy.totalMoneyEarned += prize.money;

    if (prize.banner && !economy.ownedBanners.includes(prize.banner)) {
      economy.ownedBanners.push(prize.banner);
    }
    if (prize.skin && !economy.ownedSkins.includes(prize.skin)) {
      economy.ownedSkins.push(prize.skin);
    }

    economy.save();

    // Mark as claimed
    await setDoc(doc(db, 'tournamentResults', resultId), {
      uid, placement, prizeClaimed: true, claimedAt: Date.now()
    });

    return prize;
  } catch (e) {
    console.warn('Failed to claim prize:', e);
    return false;
  }
}
