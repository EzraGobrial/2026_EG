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
      locker: document.getElementById('screen-locker'),
      sleep: document.getElementById('screen-sleep'),
      win: document.getElementById('screen-win')
    };

    // Callbacks (set by main.js)
    this.onStartGame = null;
    this.onStartHunt = null;
    this.onGoToShop = null;
    this.onGoToLocker = null;
    this.onLockerBack = null;
    this.onSkipToSleep = null;
    this.onSleep = null;
    this.onContinueAfterWin = null;
    this.onRestart = null;
    this.onLogin = null;
    this.onSignup = null;
    this.onLogout = null;

    this._bindButtons();
    this._bindAuth();
    this._bindLocker();
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

    document.getElementById('btn-to-locker').addEventListener('click', () => {
      this.audio.playUIClick();
      if (this.onGoToLocker) this.onGoToLocker();
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

    // Render leaderboard (async from Firestore)
    this._renderLeaderboard(displayName);

    this.showScreen('results');

    if (total > 0) {
      this.audio.playCashRegister();
    }
  }

  async _renderLeaderboard(currentUser) {
    const totalEl = document.getElementById('lb-total-earned');
    const currentEl = document.getElementById('lb-current-money');

    totalEl.innerHTML = '<div class="lb-empty">Loading...</div>';
    currentEl.innerHTML = '<div class="lb-empty">Loading...</div>';

    const { byCurrentMoney, byTotalEarned } = await Economy.getLeaderboard();

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
        <span class="lb-name">${entry.name}${entry.tag ? ' <span class="og-badge">OG</span>' : ''}${isYou ? ' (you)' : ''}</span>
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
        <span class="lb-name">${entry.name}${entry.tag ? ' <span class="og-badge">OG</span>' : ''}${isYou ? ' (you)' : ''}</span>
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
      // Hide the legendary gun from the shop (quest-only reward)
      if (weapon.isLegendary) continue;

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

    // ── Story Quest Section ────────────────────
    this._renderQuestShop();

    this.showScreen('shop');
  }

  _renderQuestShop() {
    // Find or create quest section
    let questSection = document.getElementById('shop-quests-section');
    if (!questSection) {
      const shopScreen = document.getElementById('screen-shop');
      questSection = document.createElement('div');
      questSection.id = 'shop-quests-section';
      questSection.innerHTML = '<h3 class="shop-section-title" style="margin-top:60px; padding-top:24px; border-top:1px solid rgba(255,255,255,0.1)">Story Quests</h3>';
      const grid = document.createElement('div');
      grid.id = 'shop-quests';
      grid.className = 'shop-grid';
      questSection.appendChild(grid);
      // Insert before the back button
      const backBtn = shopScreen.querySelector('.btn-secondary');
      if (backBtn) shopScreen.insertBefore(questSection, backBtn);
      else shopScreen.appendChild(questSection);
    }

    const grid = document.getElementById('shop-quests');
    if (!grid) return;
    grid.innerHTML = '';

    const eco   = this.economy;
    const story = this._storyRef; // set by main.js

    const QUEST_COST = 50;
    const phase = story ? story.getPhase() : 'locked';

    const item = document.createElement('div');
    item.className = 'shop-item quest-item';

    if (phase !== 'locked') {
      item.classList.add('owned');
      const phaseLabels = {
        bought:      'UNLOCKED — Start next morning',
        walking:     'IN PROGRESS — Trail Walk',
        shed_found:  'IN PROGRESS — The Shed',
        riding:      'IN PROGRESS — Riding Home',
        assembling:  'IN PROGRESS — Assembling the rifle',
        complete:    'COMPLETE'
      };
      item.innerHTML = `
        <div class="shop-item-name" style="color:var(--accent-gold)">The Lucky Lake</div>
        <div class="shop-item-desc">A walk into the woods with your injured cat. Something strange waits at the end of the trail.</div>
        <div class="shop-item-price">${phaseLabels[phase] || 'ACTIVE'}</div>
      `;
    } else if (eco.money < QUEST_COST) {
      item.classList.add('cant-afford');
      item.innerHTML = `
        <div class="shop-item-name">The Lucky Lake</div>
        <div class="shop-item-desc">A walk into the woods with your injured cat. Something strange waits at the end of the trail.</div>
        <div class="shop-item-price">$${QUEST_COST}</div>
      `;
    } else {
      item.innerHTML = `
        <div class="shop-item-name">The Lucky Lake</div>
        <div class="shop-item-desc">A walk into the woods with your injured cat. Something strange waits at the end of the trail.</div>
        <div class="shop-item-price">$${QUEST_COST}</div>
      `;
      item.addEventListener('click', () => {
        this.audio.playUIClick();
        if (eco.money >= QUEST_COST && story && story.buyQuest()) {
          eco.money -= QUEST_COST;
          eco.save();
          this.audio.playCashRegister();
          this._renderQuestShop();
        }
      });
    }

    grid.appendChild(item);
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

  // ─── Locker Screen ─────────────────────────

  _bindLocker() {
    // Tab switching
    document.querySelectorAll('.locker-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.locker-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._renderLockerTab(tab.dataset.tab);
      });
    });

    // Back button
    document.getElementById('btn-locker-back').addEventListener('click', () => {
      this.audio.playUIClick();
      if (this.onLockerBack) this.onLockerBack();
    });
  }

  showLocker() {
    // Reset to tags tab
    document.querySelectorAll('.locker-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.locker-tab[data-tab="tags"]').classList.add('active');
    this._renderLockerTab('tags');
    this.showScreen('locker');
  }

  _renderLockerTab(tab) {
    const content = document.getElementById('locker-content');
    const eco = this.economy;

    if (tab === 'tags') {
      content.innerHTML = '';
      const grid = document.createElement('div');
      grid.className = 'locker-items';

      // OG Tag
      if (eco.inventory && eco.inventory.tags && eco.inventory.tags.includes('og')) {
        const isEquipped = eco.equipped && eco.equipped.tag === 'og';
        const item = document.createElement('div');
        item.className = `locker-item${isEquipped ? ' equipped' : ''}`;
        item.innerHTML = `
          <div class="locker-item-icon">OG</div>
          <div class="locker-item-name">OG Tag</div>
          <div class="locker-item-desc">Played in the first 30 days</div>
          <button class="btn ${isEquipped ? 'btn-secondary' : 'btn-primary'}">${isEquipped ? 'Unequip' : 'Equip'}</button>
        `;
        item.querySelector('.btn').addEventListener('click', () => {
          if (isEquipped) {
            eco.equipped.tag = null;
          } else {
            eco.equipped.tag = 'og';
          }
          eco.save();
          this._renderLockerTab('tags');
        });
        grid.appendChild(item);
      } else {
        content.innerHTML = '<div class="locker-coming-soon">No tags earned yet</div>';
        return;
      }

      content.appendChild(grid);
    } else {
      content.innerHTML = `<div class="locker-coming-soon">Coming Soon</div>`;
    }
  }

  // ─── Story UI Methods ────────────────────────

  /**
   * Show a speech bubble at the bottom of the screen.
   * Auto-hides after `duration` ms (default 4s).
   */
  showSpeechBubble(text, duration = 4500) {
    const bubble = document.getElementById('speech-bubble');
    const textEl = document.getElementById('speech-text');
    if (!bubble || !textEl) return;

    textEl.textContent = text;
    bubble.classList.remove('hidden');
    bubble.style.animation = 'none';
    void bubble.offsetWidth; // force reflow
    bubble.style.animation = '';

    clearTimeout(this._speechTimer);
    this._speechTimer = setTimeout(() => {
      bubble.classList.add('hidden');
    }, duration);
  }

  /**
   * Show/hide the [I] inspect hint. Optionally set specific label text.
   */
  showInspectHint(visible) {
    const el = document.getElementById('inspect-hint');
    if (!el) return;
    if (visible) el.classList.remove('hidden');
    else el.classList.add('hidden');
  }

  setInspectLabel(text) {
    const el = document.getElementById('inspect-label');
    if (!el) return;
    const hint = document.getElementById('inspect-hint');
    if (!hint) return;
    if (text) {
      el.textContent = text;
      hint.classList.remove('hidden');
    } else {
      hint.classList.add('hidden');
    }
  }

  /**
   * Show the grandpa reveal cutscene with staggered lines,
   * then call onDone when the player clicks Continue.
   */
  showRevealCutscene(onDone) {
    const overlay = document.getElementById('reveal-overlay');
    const linesEl = document.getElementById('reveal-lines');
    const btn     = document.getElementById('reveal-continue');
    if (!overlay || !linesEl || !btn) { if (onDone) onDone(); return; }

    const LINES = [
      { text: 'You dip a rag in water from your canteen.', gold: false },
      { text: 'You wipe the dust off the receiver — slowly.', gold: false },
      { text: 'Under the grime: an engraved brass plate.', gold: false },
      { text: 'A name.', gold: false },
      { text: 'Your great-grandfather\'s name.', gold: true },
      { text: 'He disappeared when he was sixteen.', gold: false },
      { text: 'Nobody ever found out what happened.', gold: false },
      { text: 'This gun has been sitting in that shed ever since.', gold: false },
      { text: 'It\'s yours now.', gold: true },
    ];

    linesEl.innerHTML = '';
    overlay.classList.remove('hidden');
    btn.classList.add('hidden');

    LINES.forEach((l, i) => {
      const div = document.createElement('div');
      div.className = 'reveal-line' + (l.gold ? ' gold' : '');
      div.textContent = l.text;
      div.style.animationDelay = `${i * 0.75}s`;
      linesEl.appendChild(div);
    });

    // Show button after all lines played
    setTimeout(() => {
      btn.classList.remove('hidden');
    }, LINES.length * 750 + 500);

    btn.onclick = () => {
      overlay.classList.add('hidden');
      if (onDone) onDone();
    };
  }
}
