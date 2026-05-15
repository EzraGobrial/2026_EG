// ═══════════════════════════════════════════════
// Gary's Life — Auth System
// Username/password auth with localStorage
// Per-user game saves
// ═══════════════════════════════════════════════

const USERS_KEY = 'garys_life_users';
const SESSION_KEY = 'garys_life_session';

export class Auth {
  constructor() {
    this.currentUser = null;
    this._loadSession();
  }

  _getUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
    } catch {
      return {};
    }
  }

  _saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  _loadSession() {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      const users = this._getUsers();
      if (users[session]) {
        this.currentUser = session;
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }

  signup(username, password, confirmPassword) {
    username = username.trim();
    if (!username || username.length < 2) {
      return { success: false, error: 'Username must be at least 2 characters' };
    }
    if (!password || password.length < 3) {
      return { success: false, error: 'Password must be at least 3 characters' };
    }
    if (password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match' };
    }
    if (username.length > 20) {
      return { success: false, error: 'Username must be 20 characters or less' };
    }

    const users = this._getUsers();
    const userLower = username.toLowerCase();

    if (users[userLower]) {
      return { success: false, error: 'Username already taken' };
    }

    users[userLower] = {
      username: username,
      password: this._simpleHash(password),
      createdAt: Date.now()
    };

    this._saveUsers(users);
    this.currentUser = userLower;
    localStorage.setItem(SESSION_KEY, userLower);
    return { success: true };
  }

  login(username, password) {
    username = username.trim();
    if (!username || !password) {
      return { success: false, error: 'Please enter username and password' };
    }

    const users = this._getUsers();
    const userLower = username.toLowerCase();
    const user = users[userLower];

    if (!user) {
      return { success: false, error: 'User not found' };
    }
    if (user.password !== this._simpleHash(password)) {
      return { success: false, error: 'Wrong password' };
    }

    this.currentUser = userLower;
    localStorage.setItem(SESSION_KEY, userLower);
    return { success: true };
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem(SESSION_KEY);
  }

  isLoggedIn() {
    return this.currentUser !== null;
  }

  getDisplayName() {
    if (!this.currentUser) return 'Guest';
    const users = this._getUsers();
    return users[this.currentUser]?.username || this.currentUser;
  }

  getSaveKey() {
    if (!this.currentUser) return 'garys_life_save';
    return `garys_life_save_${this.currentUser}`;
  }

  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
}
