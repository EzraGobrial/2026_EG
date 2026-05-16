// ═══════════════════════════════════════════════
// Gary's Life — UI System
// Menu screens: title, morning, results, shop, sleep, win
// ═══════════════════════════════════════════════

import { Economy, BIRDS, RARITY_COLORS, LOCATIONS, WEAPONS } from './economy.js';

export class UI {
  constructor(economy, audio) {
    this.economy = economy;
    this.audio = audio;

    // Screen elements
    this.screens = {
      login: document.getElementById('screen-login'),
      signup: document.getElementById('screen-signup'),
      title: document.getElementById('screen-title'),
      morning: document.getElementById('screen-morning'),
      results: document.getElementById('screen-results'),
      shop: document.getElementById('screen-shop'),
      sleep: document.getElementById('screen-sleep'),
      win: document.getElementById('screen-win')
    };

    // Callbacks (set by main.js)
    this.onStartGame = null;
    this.onStartHunt = null;
    this.onGoToShop = null;
    this.onSkipToSleep = null;
    this.onSleep = null;
    this.onContinueAfterWin = null;
    this.onRestart = null;
    this.onLogin = null;
    this.onSignup = null;
    this.onLogout = null;

    this._bindButtons();
    this._bindAuth();
  }

  _bindButtons() {
    document.getElementById('btn-start').addEventListener('click', () => {
      this.audio.playUIClick();
      if (this.onStartGame) this.onStartGame();
    });

    document.getElementById('btn-hunt').addEventListener('click', () => {
      this.audio.playUIClick();
      if (this.onStartHunt) this.onStartHunt();
    });

    document.getElementById('btn-to-shop').addEventListener('click', () => {
      this.audio.playUIClick();
      if (this.onGoToShop) this.onGoToShop();
    });

    document.getElementById('btn-skip-shop').addEventListener('click', () => {
      this.audio.playUIClick();
      if (this.onSkipToSleep) this.onSkipToSleep();
    });

    document.getElementById('btn-sleep').addEventListener('click', () => {
      this.audio.playUIClick();
      if (this.onSleep) this.onSleep();
    });

    document.getElementById('btn-continue').addEventListener('click', () => {
      this.audio.playUIClick();
      if (this.onContinueAfterWin) this.onContinueAfterWin();
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
      this.audio.playUIClick();
      if (this.onRestart) this.onRestart();
    });
  }

  _bindAuth() {
    // Switch links
    document.getElementById('link-to-signup').addEventListener('click', (e) => {
      e.preventDefault();
      this._clearAuthErrors();
      this.showScreen('signup');
    });

    document.getElementById('link-to-login').addEventListener('click', (e) => {
      e.preventDefault();
      this._clearAuthErrors();
      this.showScreen('login');
    });

    // Login
    document.getElementById('btn-login').addEventListener('click', () => {
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;
      if (this.onLogin) this.onLogin(username, password);
    });

    // Signup
    document.getElementById('btn-signup').addEventListener('click', () => {
      const username = document.getElementById('signup-username').value;
      const password = document.getElementById('signup-password').value;
      const confirm = document.getElementById('signup-confirm').value;
      if (this.onSignup) this.onSignup(username, password, confirm);
    });

    // Enter key
    document.getElementById('login-password').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('btn-login').click();
    });
    document.getElementById('signup-confirm').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('btn-signup').click();
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', () => {
      if (this.onLogout) this.onLogout();
    });
  }

  showLoginError(msg) {
    const el = document.getElementById('login-error');
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  showSignupError(msg) {
    const el = document.getElementById('signup-error');
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  _clearAuthErrors() {
    document.getElementById('login-error').classList.add('hidden');
    document.getElementById('signup-error').classList.add('hidden');
  }

  showTitle(displayName) {
    const welcome = document.getElementById('title-welcome');
    welcome.textContent = `Welcome back, ${displayName}!`;
    this.showScreen('title');
  }

  showScreen(name) {
    for (const el of Object.values(this.screens)) {
      el.classList.add('hidden');
    }
    if (this.screens[name]) {
      this.screens[name].classList.remove('hidden');
    }
  }

  hideAll() {
    for (const el of Object.values(this.screens)) {
      el.classList.add('hidden');
    }
  }

  // ─── Morning Screen ─────────────────────────

  showMorning() {
    const eco = this.economy;
    document.getElementById('morning-day').textContent = `Day ${eco.day}`;
    document.getElementById('morning-money').textContent = `$${eco.money}`;
    document.getElementById('morning-weapon').textContent = eco.getWeapon().name;

    // Build location list
    const locList = document.getElementById('location-list');
    locList.innerHTML = '';

    for (const [key, loc] of Object.entries(eco.locations)) {
      const card = document.createElement('div');
      card.className = 'location-card';

      if (!loc.unlocked) {
        card.classList.add('locked');
        card.innerHTML = `
          <div class="loc-name">${loc.name}</div>
          <div class="loc-info">Locked — $${loc.cost}</div>
        `;
      } else {
        if (key === eco.currentLocation) {
          card.classList.add('selected');
        }
        card.innerHTML = `
          <div class="loc-name">${loc.name}</div>
          <div class="loc-info">${loc.birds.length} bird types</div>
        `;
        card.addEventListener('click', () => {
          this.audio.playUIClick();
          eco.selectLocation(key);
          // Update selection
          locList.querySelectorAll('.location-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
        });
      }

      locList.appendChild(card);
    }

    this.showScreen('morning');
  }

  // ─── Results Screen ─────────────────────────

  showResults(huntBag, displayName) {
    const summary = document.getElementById('results-summary');
    summary.innerHTML = '';

    let total = 0;
    const counts = {};

    for (const entry of huntBag) {
      const key = typeof entry === 'string' ? entry : entry.key;
      const combo = typeof entry === 'string' ? 1 : (entry.combo || 1);
      if (!counts[key]) counts[key] = { count: 0, totalValue: 0 };
      const fluctuation = 0.85 + Math.random() * 0.3;
      const baseValue = Math.round(BIRDS[key].value * fluctuation);
      const value = Math.round(baseValue * combo);
      counts[key].count++;
      counts[key].totalValue += value;
      total += value;
    }

    if (huntBag.length === 0) {
      summary.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">No birds caught today. Better luck tomorrow!</p>';
    } else {
      for (const [key, data] of Object.entries(counts)) {
        const bird = BIRDS[key];
        const rarityColor = RARITY_COLORS[bird.rarity] || '#aaa';
        const row = document.createElement('div');
        row.className = 'result-row';
        row.innerHTML = `
          <div class="result-bird">
            <div class="result-bird-dot" style="background:${rarityColor}"></div>
            <span class="result-bird-name">${bird.name} x${data.count}</span>
          </div>
          <span class="result-bird-price">$${data.totalValue}</span>
        `;
        summary.appendChild(row);
      }
    }

    document.getElementById('results-total-money').textContent = `$${total}`;
    this.economy.money += total;
    this.economy.totalMoneyEarned += total;
    this.economy.huntBag = [];

    // Update leaderboard
    if (displayName) {
      this.economy.updateLeaderboard(displayName);
    }

    // Render leaderboard
    this._renderLeaderboard(displayName);

    this.showScreen('results');

    if (total > 0) {
      this.audio.playCashRegister();
    }
  }

  _renderLeaderboard(currentUser) {
    const { byCurrentMoney, byTotalEarned } = Economy.getLeaderboard();

    const totalEl = document.getElementById('lb-total-earned');
    const currentEl = document.getElementById('lb-current-money');

    totalEl.innerHTML = '';
    currentEl.innerHTML = '';

    if (byTotalEarned.length === 0) {
      totalEl.innerHTML = '<div class="lb-empty">No players yet</div>';
      currentEl.innerHTML = '<div class="lb-empty">No players yet</div>';
      return;
    }

    // Total earned column
    byTotalEarned.forEach((entry, i) => {
      const isYou = currentUser && entry.name.toLowerCase() === currentUser.toLowerCase();
      const div = document.createElement('div');
      div.className = `lb-entry${isYou ? ' lb-you' : ''}`;
      div.innerHTML = `
        <span class="lb-rank">${i + 1}</span>
        <span class="lb-name">${entry.name}${isYou ? ' (you)' : ''}</span>
        <span class="lb-money">$${entry.totalEarned.toLocaleString()}</span>
      `;
      totalEl.appendChild(div);
    });

    // Current money column
    byCurrentMoney.forEach((entry, i) => {
      const isYou = currentUser && entry.name.toLowerCase() === currentUser.toLowerCase();
      const div = document.createElement('div');
      div.className = `lb-entry${isYou ? ' lb-you' : ''}`;
      div.innerHTML = `
        <span class="lb-rank">${i + 1}</span>
        <span class="lb-name">${entry.name}${isYou ? ' (you)' : ''}</span>
        <span class="lb-money">$${entry.currentMoney.toLocaleString()}</span>
      `;
      currentEl.appendChild(div);
    });
  }

  // ─── Shop Screen ────────────────────────────

  showShop() {
    const eco = this.economy;
    document.getElementById('shop-money').textContent = `$${eco.money}`;

    // Weapons
    const weaponGrid = document.getElementById('shop-weapons');
    weaponGrid.innerHTML = '';

    for (const [key, weapon] of Object.entries(eco.weapons)) {
      const item = document.createElement('div');
      item.className = 'shop-item';

      if (weapon.owned) {
        item.classList.add('owned');
        const isEquipped = key === eco.currentWeapon;
        item.innerHTML = `
          <div class="shop-item-name">${weapon.name}</div>
          <div class="shop-item-desc">${weapon.description}</div>
          <div class="shop-item-price">${isEquipped ? 'EQUIPPED' : 'OWNED'}</div>
        `;
        if (!isEquipped) {
          item.style.cursor = 'pointer';
          item.addEventListener('click', () => {
            this.audio.playUIClick();
            eco.selectWeapon(key);
            this.showShop(); // refresh
          });
        }
      } else if (eco.money < weapon.cost) {
        item.classList.add('cant-afford');
        item.innerHTML = `
          <div class="shop-item-name">${weapon.name}</div>
          <div class="shop-item-desc">${weapon.description}</div>
          <div class="shop-item-price">$${weapon.cost}</div>
        `;
      } else {
        item.innerHTML = `
          <div class="shop-item-name">${weapon.name}</div>
          <div class="shop-item-desc">${weapon.description}</div>
          <div class="shop-item-price">$${weapon.cost}</div>
        `;
        item.addEventListener('click', () => {
          this.audio.playUIClick();
          if (eco.buyWeapon(key)) {
            this.audio.playCashRegister();
            this.showShop(); // refresh
          }
        });
      }

      weaponGrid.appendChild(item);
    }

    // Locations
    const locGrid = document.getElementById('shop-locations');
    locGrid.innerHTML = '';

    for (const [key, loc] of Object.entries(eco.locations)) {
      const item = document.createElement('div');
      item.className = 'shop-item';

      if (loc.unlocked) {
        item.classList.add('owned');
        item.innerHTML = `
          <div class="shop-item-name">${loc.name}</div>
          <div class="shop-item-desc">${loc.description}</div>
          <div class="shop-item-price">UNLOCKED</div>
        `;
      } else if (eco.money < loc.cost) {
        item.classList.add('cant-afford');
        item.innerHTML = `
          <div class="shop-item-name">${loc.name}</div>
          <div class="shop-item-desc">${loc.description}</div>
          <div class="shop-item-price">$${loc.cost}</div>
        `;
      } else {
        item.innerHTML = `
          <div class="shop-item-name">${loc.name}</div>
          <div class="shop-item-desc">${loc.description}</div>
          <div class="shop-item-price">$${loc.cost}</div>
        `;
        item.addEventListener('click', () => {
          this.audio.playUIClick();
          if (eco.buyLocation(key)) {
            this.audio.playCashRegister();
            this.showShop(); // refresh
          }
        });
      }

      locGrid.appendChild(item);
    }

    this.showScreen('shop');
  }

  // ─── Sleep Screen ───────────────────────────

  showSleep(callback) {
    const eco = this.economy;
    document.getElementById('sleep-text').textContent = `Day ${eco.day} Complete`;
    this.showScreen('sleep');

    setTimeout(() => {
      eco.day++;
      eco.save();
      if (callback) callback();
    }, 3000);
  }

  // ─── Win Screen ─────────────────────────────

  showWin() {
    const eco = this.economy;
    document.getElementById('win-money').textContent = `$${eco.money}`;
    document.getElementById('win-days').textContent = eco.day;
    document.getElementById('win-birds').textContent = eco.totalBirdsKilled;
    this.showScreen('win');
  }
}
