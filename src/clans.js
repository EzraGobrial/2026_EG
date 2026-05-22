// ═══════════════════════════════════════════════
// Gary's Life — Clan System
// Groups of up to 10 players with shared stats
// ═══════════════════════════════════════════════

import { doc, setDoc, getDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * Create a new clan
 */
export async function createClan(uid, userName, name, tag) {
  // Validate tag (3-4 alphanumeric chars)
  if (!tag || tag.length < 3 || tag.length > 4 || !/^[A-Za-z0-9]+$/.test(tag)) {
    return { error: 'Tag must be 3-4 alphanumeric characters' };
  }
  if (!name || name.length < 2 || name.length > 20) {
    return { error: 'Name must be 2-20 characters' };
  }

  const clanId = `${tag.toUpperCase()}_${Date.now()}`;
  const clan = {
    name,
    tag: tag.toUpperCase(),
    leader: uid,
    members: [{ uid, name: userName, joinedAt: Date.now() }],
    totalEarned: 0,
    totalKills: 0,
    createdAt: Date.now()
  };

  try {
    await setDoc(doc(db, 'clans', clanId), clan);
    return { clanId, clan };
  } catch (e) {
    console.warn('Failed to create clan:', e);
    return { error: 'Failed to create clan' };
  }
}

/**
 * Invite a player to a clan
 */
export async function inviteToClan(clanId, clanName, fromUid, fromName, toUid) {
  const inviteId = `${toUid}_${clanId}`;
  try {
    await setDoc(doc(db, 'clanInvites', inviteId), {
      clanId, clanName, fromUid, fromName, toUid, createdAt: Date.now()
    });
    return true;
  } catch (e) {
    console.warn('Failed to send clan invite:', e);
    return false;
  }
}

/**
 * Get pending clan invites for a player
 */
export async function getClanInvites(uid) {
  try {
    const snap = await getDocs(collection(db, 'clanInvites'));
    const invites = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.toUid === uid) {
        invites.push({ id: d.id, ...data });
      }
    });
    return invites;
  } catch (e) {
    console.warn('Failed to get clan invites:', e);
    return [];
  }
}

/**
 * Accept a clan invite
 */
export async function acceptClanInvite(inviteId, uid, userName) {
  try {
    const invSnap = await getDoc(doc(db, 'clanInvites', inviteId));
    if (!invSnap.exists()) return false;
    const invite = invSnap.data();

    const clanSnap = await getDoc(doc(db, 'clans', invite.clanId));
    if (!clanSnap.exists()) return false;
    const clan = clanSnap.data();

    if (clan.members.length >= 10) return false; // max 10
    if (clan.members.find(m => m.uid === uid)) return false; // already in

    clan.members.push({ uid, name: userName, joinedAt: Date.now() });
    await setDoc(doc(db, 'clans', invite.clanId), clan);
    await deleteDoc(doc(db, 'clanInvites', inviteId));

    return { clanId: invite.clanId, clan };
  } catch (e) {
    console.warn('Failed to accept clan invite:', e);
    return false;
  }
}

/**
 * Leave a clan
 */
export async function leaveClan(clanId, uid) {
  try {
    const clanSnap = await getDoc(doc(db, 'clans', clanId));
    if (!clanSnap.exists()) return false;
    const clan = clanSnap.data();

    clan.members = clan.members.filter(m => m.uid !== uid);

    if (clan.members.length === 0) {
      // Delete empty clan
      await deleteDoc(doc(db, 'clans', clanId));
    } else {
      // If leader left, promote first remaining member
      if (clan.leader === uid) {
        clan.leader = clan.members[0].uid;
      }
      await setDoc(doc(db, 'clans', clanId), clan);
    }
    return true;
  } catch (e) {
    console.warn('Failed to leave clan:', e);
    return false;
  }
}

/**
 * Get clan details
 */
export async function getClan(clanId) {
  try {
    const snap = await getDoc(doc(db, 'clans', clanId));
    if (!snap.exists()) return null;
    return { clanId, ...snap.data() };
  } catch (e) {
    console.warn('Failed to get clan:', e);
    return null;
  }
}

/**
 * Get clan leaderboard (all clans sorted by totalEarned)
 */
export async function getClanLeaderboard() {
  try {
    const snap = await getDocs(collection(db, 'clans'));
    const clans = [];
    snap.forEach(d => {
      clans.push({ clanId: d.id, ...d.data() });
    });
    return clans.sort((a, b) => b.totalEarned - a.totalEarned);
  } catch (e) {
    console.warn('Failed to get clan leaderboard:', e);
    return [];
  }
}

/**
 * Find which clan a user belongs to
 */
export async function findUserClan(uid) {
  try {
    const snap = await getDocs(collection(db, 'clans'));
    let found = null;
    snap.forEach(d => {
      if (found) return;
      const data = d.data();
      if (data.members && data.members.find(m => m.uid === uid)) {
        found = { clanId: d.id, ...data };
      }
    });
    return found;
  } catch (e) {
    console.warn('Failed to find user clan:', e);
    return null;
  }
}
