// ═══════════════════════════════════════════════
// Gary's Life — Auth System (Firebase)
// Username/password auth with Firebase Auth
// ═══════════════════════════════════════════════

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { auth } from './firebase.js';

// We convert usernames to fake emails: username@garyslife.app
function usernameToEmail(username) {
  return `${username.toLowerCase().replace(/\s+/g, '')}@garyslife.app`;
}

export class Auth {
  constructor() {
    this.user = null;
  }

  async signup(username, password, confirmPassword) {
    username = username.trim();
    if (!username || username.length < 2) {
      return { success: false, error: 'Username must be at least 2 characters' };
    }
    if (username.length > 20) {
      return { success: false, error: 'Username must be 20 characters or less' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }
    if (password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match' };
    }

    const email = usernameToEmail(username);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: username });
      this.user = cred.user;
      return { success: true };
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        return { success: false, error: 'Username already taken' };
      }
      return { success: false, error: e.message };
    }
  }

  async login(username, password) {
    username = username.trim();
    if (!username || !password) {
      return { success: false, error: 'Please enter username and password' };
    }

    const email = usernameToEmail(username);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      this.user = cred.user;
      return { success: true };
    } catch (e) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        return { success: false, error: 'Invalid username or password' };
      }
      return { success: false, error: e.message };
    }
  }

  async logout() {
    await signOut(auth);
    this.user = null;
  }

  isLoggedIn() {
    return this.user !== null;
  }

  getDisplayName() {
    return this.user?.displayName || 'Player';
  }

  getUid() {
    return this.user?.uid || null;
  }
}
