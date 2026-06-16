// ═══════════════════════════════════════════════
// Gary's Life — Trading System
// Firebase-backed player-to-player trading
// ═══════════════════════════════════════════════

import { doc, setDoc, getDoc, getDocs, deleteDoc, collection, query, where } from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * Send a trade proposal to another player
 */
export async function sendTrade(fromUid, fromName, toUid, toName, dimension, offering, requesting) {
  const tradeId = `${fromUid}_${toUid}_${Date.now()}`;
  const tradeData = {
    from: fromUid,
    fromName,
    to: toUid,
    toName,
    dimension,
    offering: {
      weapons: offering.weapons || [],
      locations: offering.locations || [],
      money: offering.money || 0
    },
    requesting: {
      weapons: requesting.weapons || [],
      locations: requesting.locations || [],
      money: requesting.money || 0
    },
    status: 'pending',
    createdAt: Date.now()
  };
  await setDoc(doc(db, 'trades', tradeId), tradeData);
  return tradeId;
}

/**
 * Get all pending trades for a user (incoming)
 */
export async function getPendingTrades(uid) {
  try {
    const snap = await getDocs(collection(db, 'trades'));
    const trades = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.to === uid && data.status === 'pending') {
        trades.push({ id: d.id, ...data });
      }
    });
    return trades;
  } catch (e) {
    console.warn('Failed to load trades:', e);
    return [];
  }
}

/**
 * Accept a trade — swap items between both players' saves
 */
export async function acceptTrade(tradeId) {
  try {
    const tradeSnap = await getDoc(doc(db, 'trades', tradeId));
    if (!tradeSnap.exists()) return false;
    const trade = tradeSnap.data();
    if (trade.status !== 'pending') return false;

    // Load both players' saves
    const fromSnap = await getDoc(doc(db, 'saves', trade.from));
    const toSnap = await getDoc(doc(db, 'saves', trade.to));
    if (!fromSnap.exists() || !toSnap.exists()) return false;

    const fromSave = fromSnap.data();
    const toSave = toSnap.data();

    // Transfer money
    fromSave.money = (fromSave.money || 0) - (trade.offering.money || 0) + (trade.requesting.money || 0);
    toSave.money = (toSave.money || 0) + (trade.offering.money || 0) - (trade.requesting.money || 0);

    // Transfer weapons (ownership flags)
    const fromWeapons = fromSave.weaponOwned || {};
    const toWeapons = toSave.weaponOwned || {};

    // Validate: reject if receiver already owns what they'd get
    for (const wk of (trade.offering.weapons || [])) {
      if (toWeapons[wk]) return false; // recipient already has this weapon
    }
    for (const wk of (trade.requesting.weapons || [])) {
      if (fromWeapons[wk]) return false; // sender already has this weapon
    }

    // Transfer locations (unlock flags)
    const fromLocs = fromSave.locationUnlocked || {};
    const toLocs = toSave.locationUnlocked || {};

    for (const lk of (trade.offering.locations || [])) {
      if (toLocs[lk]) return false; // recipient already has this location
    }
    for (const lk of (trade.requesting.locations || [])) {
      if (fromLocs[lk]) return false; // sender already has this location
    }

    // All clear — do the transfers
    for (const wk of (trade.offering.weapons || [])) {
      fromWeapons[wk] = false;
      toWeapons[wk] = true;
    }
    for (const wk of (trade.requesting.weapons || [])) {
      toWeapons[wk] = false;
      fromWeapons[wk] = true;
    }

    fromSave.weaponOwned = fromWeapons;
    toSave.weaponOwned = toWeapons;

    // Transfer locations
    for (const lk of (trade.offering.locations || [])) {
      fromLocs[lk] = false;
      toLocs[lk] = true;
    }
    for (const lk of (trade.requesting.locations || [])) {
      toLocs[lk] = false;
      fromLocs[lk] = true;
    }

    fromSave.locationUnlocked = fromLocs;
    toSave.locationUnlocked = toLocs;

    // Write both saves + mark trade as accepted
    await Promise.all([
      setDoc(doc(db, 'saves', trade.from), fromSave),
      setDoc(doc(db, 'saves', trade.to), toSave),
      setDoc(doc(db, 'trades', tradeId), { ...trade, status: 'accepted' })
    ]);

    return true;
  } catch (e) {
    console.warn('Failed to accept trade:', e);
    return false;
  }
}

/**
 * Decline a trade
 */
export async function declineTrade(tradeId) {
  try {
    const tradeSnap = await getDoc(doc(db, 'trades', tradeId));
    if (!tradeSnap.exists()) return false;
    const trade = tradeSnap.data();
    await setDoc(doc(db, 'trades', tradeId), { ...trade, status: 'declined' });
    return true;
  } catch (e) {
    console.warn('Failed to decline trade:', e);
    return false;
  }
}

/**
 * Get players in a specific dimension (for trade partner selection)
 */
export async function getPlayersInDimension(dimension, excludeUid) {
  try {
    const snap = await getDocs(collection(db, 'leaderboard'));
    const players = [];
    const targetDim = Number(dimension) || 1;
    snap.forEach(d => {
      const data = d.data();
      const playerDim = Number(data.dimension) || 1;
      if (playerDim === targetDim && d.id !== excludeUid) {
        players.push({
          uid: d.id,
          name: data.name || 'Unknown',
          dimension: playerDim
        });
      }
    });
    return players;
  } catch (e) {
    console.warn('Failed to load players:', e);
    return [];
  }
}

/**
 * Check if there are any pending trades for a user (for notification dot)
 */
export async function hasPendingTrades(uid) {
  const trades = await getPendingTrades(uid);
  return trades.length > 0;
}

/**
 * Load a player's save data (for checking what they own)
 */
export async function getPlayerSave(uid) {
  try {
    const snap = await getDoc(doc(db, 'saves', uid));
    if (!snap.exists()) return null;
    return snap.data();
  } catch (e) {
    console.warn('Failed to load player save:', e);
    return null;
  }
}
