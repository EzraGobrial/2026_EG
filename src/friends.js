// ═══════════════════════════════════════════════
// Gary's Life — Friend System
// Firebase-backed friend list with requests
// ═══════════════════════════════════════════════

import { doc, setDoc, getDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * Send a friend request
 */
export async function sendFriendRequest(fromUid, fromName, toUid, toName) {
  const id = `${toUid}_${fromUid}`;
  await setDoc(doc(db, 'friendRequests', id), {
    from: fromUid,
    fromName,
    to: toUid,
    toName,
    createdAt: Date.now()
  });
}

/**
 * Get pending friend requests for a user
 */
export async function getPendingFriendRequests(uid) {
  try {
    const snap = await getDocs(collection(db, 'friendRequests'));
    const requests = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.to === uid) {
        requests.push({ id: d.id, ...data });
      }
    });
    return requests;
  } catch (e) {
    console.warn('Failed to get friend requests:', e);
    return [];
  }
}

/**
 * Accept a friend request — adds to both friend lists
 */
export async function acceptFriendRequest(requestId) {
  try {
    const reqSnap = await getDoc(doc(db, 'friendRequests', requestId));
    if (!reqSnap.exists()) return false;
    const req = reqSnap.data();

    // Add to both friend lists
    const myFriendsDoc = await getDoc(doc(db, 'friends', req.to));
    const theirFriendsDoc = await getDoc(doc(db, 'friends', req.from));

    const myFriends = myFriendsDoc.exists() ? myFriendsDoc.data().friends || [] : [];
    const theirFriends = theirFriendsDoc.exists() ? theirFriendsDoc.data().friends || [] : [];

    // Avoid duplicates
    if (!myFriends.find(f => f.uid === req.from)) {
      myFriends.push({ uid: req.from, name: req.fromName, addedAt: Date.now() });
    }
    if (!theirFriends.find(f => f.uid === req.to)) {
      theirFriends.push({ uid: req.to, name: req.toName, addedAt: Date.now() });
    }

    await setDoc(doc(db, 'friends', req.to), { friends: myFriends });
    await setDoc(doc(db, 'friends', req.from), { friends: theirFriends });
    await deleteDoc(doc(db, 'friendRequests', requestId));
    return true;
  } catch (e) {
    console.warn('Failed to accept friend request:', e);
    return false;
  }
}

/**
 * Decline a friend request
 */
export async function declineFriendRequest(requestId) {
  try {
    await deleteDoc(doc(db, 'friendRequests', requestId));
    return true;
  } catch (e) {
    console.warn('Failed to decline friend request:', e);
    return false;
  }
}

/**
 * Get friends list for a user
 */
export async function getFriends(uid) {
  try {
    const snap = await getDoc(doc(db, 'friends', uid));
    if (!snap.exists()) return [];
    return snap.data().friends || [];
  } catch (e) {
    console.warn('Failed to get friends:', e);
    return [];
  }
}

/**
 * Remove a friend (from both lists)
 */
export async function removeFriend(myUid, friendUid) {
  try {
    const mySnap = await getDoc(doc(db, 'friends', myUid));
    const theirSnap = await getDoc(doc(db, 'friends', friendUid));

    if (mySnap.exists()) {
      const myFriends = (mySnap.data().friends || []).filter(f => f.uid !== friendUid);
      await setDoc(doc(db, 'friends', myUid), { friends: myFriends });
    }
    if (theirSnap.exists()) {
      const theirFriends = (theirSnap.data().friends || []).filter(f => f.uid !== myUid);
      await setDoc(doc(db, 'friends', friendUid), { friends: theirFriends });
    }
    return true;
  } catch (e) {
    console.warn('Failed to remove friend:', e);
    return false;
  }
}

/**
 * Search players by name (from leaderboard)
 */
export async function searchPlayers(queryStr, excludeUid) {
  try {
    const snap = await getDocs(collection(db, 'leaderboard'));
    const results = [];
    const q = queryStr.toLowerCase();
    snap.forEach(d => {
      const data = d.data();
      if (d.id === excludeUid) return;
      if (data.name && data.name.toLowerCase().includes(q)) {
        results.push({ uid: d.id, name: data.name, dimension: data.dimension || 1 });
      }
    });
    return results.slice(0, 20);
  } catch (e) {
    console.warn('Failed to search players:', e);
    return [];
  }
}

/**
 * Check if there are pending friend requests
 */
export async function hasPendingFriendRequests(uid) {
  const requests = await getPendingFriendRequests(uid);
  return requests.length > 0;
}
