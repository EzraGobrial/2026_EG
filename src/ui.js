// ═══════════════════════════════════════════════
// Gary's Life — UI System
// Menu screens: title, morning, results, shop, sleep, win
// ═══════════════════════════════════════════════

import { Economy, BIRDS, RARITY_COLORS, DIMENSIONS, WEAPONS } from './economy.js';

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
      trade: document.getElementById('screen-trade'),
      tradeBuilder: document.getElementById('trade-builder'),
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
    this.onTrade = null; // callback to open trade screen

    this._bindButtons();
    this._bindAuth();
    this._bindLocker();
  }

  _bindButtons() {
    const bind = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', fn);
      else console.warn(`UI: button #${id} not found`);
    };

    bind('btn-start', () => { this.audio.playUIClick(); if (this.onStartGame) this.onStartGame(); });
    bind('btn-hunt', () => { this.audio.playUIClick(); if (this.onStartHunt) this.onStartHunt(); });
    bind('btn-to-shop', () => { this.audio.playUIClick(); if (this.onGoToShop) this.onGoToShop(); });
    bind('btn-to-locker', () => { this.audio.playUIClick(); if (this.onGoToLocker) this.onGoToLocker(); });
    bind('btn-skip-shop', () => { this.audio.playUIClick(); if (this.onSkipToSleep) this.onSkipToSleep(); });
    bind('btn-sleep', () => { this.audio.playUIClick(); if (this.onSleep) this.onSleep(); });
    bind('btn-continue', () => { this.audio.playUIClick(); if (this.onContinueAfterWin) this.onContinueAfterWin(); });
    bind('btn-restart', () => { this.audio.playUIClick(); if (this.onRestart) this.onRestart(); });
    bind('btn-trade', () => { this.audio.playUIClick(); if (this.onTrade) this.onTrade(); });
    bind('btn-trade-back', () => { this.audio.playUIClick(); this.showShop(); });
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
      if (el) el.classList.add('hidden');
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

    // Dimension badge
    const dimEl = document.getElementById('morning-dimension');
    if (dimEl) {
      dimEl.textContent = `Dimension ${eco.dimension} — ${eco.getDimensionName()}`;
    }

    // Build location list, grouped by dimension
    const locList = document.getElementById('location-list');
    locList.innerHTML = '';

    for (let d = 0; d < eco.dimension && d < DIMENSIONS.length; d++) {
      const dim = DIMENSIONS[d];

      // Dimension header (skip if only 1 dimension)
      if (eco.dimension > 1) {
        const header = document.createElement('div');
        header.className = 'shop-dim-header';
        header.textContent = dim.name;
        locList.appendChild(header);
      }

      for (const key of Object.keys(dim.locations)) {
        const loc = eco.locations[key];
        if (!loc) continue;

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

    // Helper: build a scrollable leaderboard list and scroll to the current player
    const buildList = (entries, container, valueKey) => {
      let youIndex = -1;

      entries.forEach((entry, i) => {
        const isYou = currentUser && entry.name.toLowerCase() === currentUser.toLowerCase();
        if (isYou) youIndex = i;

        const div = document.createElement('div');
        div.className = `lb-entry${isYou ? ' lb-you' : ''}`;
        if (isYou) div.id = `lb-you-${valueKey}`;
        div.innerHTML = `
          <span class="lb-rank">${i + 1}</span>
          <span class="lb-name">${entry.name}${entry.tag ? ' <span class="og-badge">OG</span>' : ''}${isYou ? ' (you)' : ''}</span>
          <span class="lb-money">$${entry[valueKey].toLocaleString()}</span>
        `;
        container.appendChild(div);
      });

      // Auto-scroll so the current player is centered
      if (youIndex >= 0) {
        requestAnimationFrame(() => {
          const youEl = document.getElementById(`lb-you-${valueKey}`);
          if (youEl && container.scrollHeight > container.clientHeight) {
            const scrollTarget = youEl.offsetTop - container.clientHeight / 2 + youEl.offsetHeight / 2;
            container.scrollTop = Math.max(0, scrollTarget);
          }
        });
      }
    };

    buildList(byTotalEarned, totalEl, 'totalEarned');
    buildList(byCurrentMoney, currentEl, 'currentMoney');
  }

  // ─── Shop Screen ────────────────────────────

  showShop() {
    // ALWAYS switch screen first, so the button is never unresponsive
    this.showScreen('shop');

    try {
    const eco = this.economy;
    document.getElementById('shop-money').textContent = `$${eco.money}`;

    // Dimension header
    const dimHeader = document.getElementById('shop-dimension');
    if (dimHeader) {
      dimHeader.textContent = `Dimension ${eco.dimension} -- ${eco.getDimensionName()}`;
    }

    // Weapons — only show weapons from unlocked dimensions
    const weaponGrid = document.getElementById('shop-weapons');
    weaponGrid.innerHTML = '';

    for (const [key, weapon] of Object.entries(eco.weapons)) {
      // Hide legendary weapons (quest rewards)
      if (weapon.isLegendary) continue;
      // Only show weapons from dimensions the player has reached
      if (weapon.dimension && weapon.dimension > eco.dimension) continue;

      const item = document.createElement('div');
      item.className = 'shop-item';

      if (weapon.owned) {
        item.classList.add('owned');
        const isEquipped = key === eco.currentWeapon;
        item.innerHTML = `
          <div class="shop-item-name">${weapon.name}</div>
          <div class="shop-item-desc">${weapon.description || ''}</div>
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
          <div class="shop-item-desc">${weapon.description || ''}</div>
          <div class="shop-item-price">$${weapon.cost}</div>
        `;
      } else {
        item.innerHTML = `
          <div class="shop-item-name">${weapon.name}</div>
          <div class="shop-item-desc">${weapon.description || ''}</div>
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

    // Locations — grouped by dimension
    const locGrid = document.getElementById('shop-locations');
    locGrid.innerHTML = '';

    for (let d = 0; d < eco.dimension && d < DIMENSIONS.length; d++) {
      const dim = DIMENSIONS[d];

      // Dimension section header
      const header = document.createElement('div');
      header.className = 'shop-dim-header';
      header.textContent = `${dim.name} (Dimension ${dim.id})`;
      locGrid.appendChild(header);

      for (const locKey of Object.keys(dim.locations)) {
        const loc = eco.locations[locKey];
        if (!loc) continue;

        const item = document.createElement('div');
        item.className = 'shop-item';

        if (loc.unlocked) {
          item.classList.add('owned');
          const isSelected = locKey === eco.currentLocation;
          item.innerHTML = `
            <div class="shop-item-name">${loc.name}</div>
            <div class="shop-item-desc">${loc.description || ''}</div>
            <div class="shop-item-price">${isSelected ? 'SELECTED' : 'UNLOCKED'}</div>
          `;
          if (!isSelected) {
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
              this.audio.playUIClick();
              eco.selectLocation(locKey);
              this.showShop();
            });
          }
        } else if (eco.money < loc.cost) {
          item.classList.add('cant-afford');
          item.innerHTML = `
            <div class="shop-item-name">${loc.name}</div>
            <div class="shop-item-desc">${loc.description || ''}</div>
            <div class="shop-item-price">$${loc.cost}</div>
          `;
        } else {
          item.innerHTML = `
            <div class="shop-item-name">${loc.name}</div>
            <div class="shop-item-desc">${loc.description || ''}</div>
            <div class="shop-item-price">$${loc.cost}</div>
          `;
          item.addEventListener('click', () => {
            this.audio.playUIClick();
            if (eco.buyLocation(locKey)) {
              this.audio.playCashRegister();
              this.showShop(); // refresh
            }
          });
        }

        locGrid.appendChild(item);
      }
    }

    // ── Next Dimension Button ──────────────────
    const advanceContainer = document.getElementById('shop-advance-dim');
    if (advanceContainer) {
      advanceContainer.innerHTML = '';
      if (eco.canAdvanceDimension() && eco.dimension < DIMENSIONS.length) {
        const nextDim = DIMENSIONS[eco.dimension];
        const fee = eco.getDimensionFee();
        const canAfford = eco.money >= fee;

        const btn = document.createElement('button');
        btn.className = `btn btn-dimension ${canAfford ? '' : 'cant-afford'}`;
        btn.innerHTML = `Travel to Dimension ${nextDim.id} -- ${nextDim.name}<br><span class="dim-fee">$${fee}</span>`;
        if (canAfford) {
          btn.addEventListener('click', () => {
            this.audio.playUIClick();
            if (eco.advanceDimension()) {
              this.audio.playCashRegister();
              this.showShop();
            }
          });
        }
        advanceContainer.appendChild(btn);
      }
    }

    // ── Story Quest Section ────────────────────
    this._renderQuestShop();

    } catch(e) { console.error('showShop error:', e); }
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


  // ─── Trade Screen ──────────────────────────

  async showTradeScreen(uid, displayName, pendingTrades, playersInDim) {
    const eco = this.economy;

    // Left panel — incoming requests
    const requestsEl = document.getElementById('trade-requests');
    requestsEl.innerHTML = '';

    if (pendingTrades.length === 0) {
      requestsEl.innerHTML = '<div class="trade-empty">No incoming trade requests</div>';
    } else {
      for (const trade of pendingTrades) {
        const card = document.createElement('div');
        card.className = 'trade-request-card';

        const offerWeapons = (trade.offering.weapons || []).map(k => eco.weapons[k]?.name || k).join(', ');
        const offerLocs = (trade.offering.locations || []).map(k => eco.locations[k]?.name || k).join(', ');
        const wantWeapons = (trade.requesting.weapons || []).map(k => eco.weapons[k]?.name || k).join(', ');
        const wantLocs = (trade.requesting.locations || []).map(k => eco.locations[k]?.name || k).join(', ');

        let details = '<strong>They offer:</strong> ';
        const offerParts = [];
        if (offerWeapons) offerParts.push(offerWeapons);
        if (offerLocs) offerParts.push(offerLocs);
        if (trade.offering.money) offerParts.push(`$${trade.offering.money}`);
        details += offerParts.join(', ') || 'Nothing';

        details += '<br><strong>They want:</strong> ';
        const wantParts = [];
        if (wantWeapons) wantParts.push(wantWeapons);
        if (wantLocs) wantParts.push(wantLocs);
        if (trade.requesting.money) wantParts.push(`$${trade.requesting.money}`);
        details += wantParts.join(', ') || 'Nothing';

        card.innerHTML = `
          <div class="trade-request-from">From: ${trade.fromName}</div>
          <div class="trade-request-details">${details}</div>
          <div class="trade-request-actions">
            <button class="trade-btn-accept" data-id="${trade.id}">✓ Accept</button>
            <button class="trade-btn-decline" data-id="${trade.id}">✕ Decline</button>
          </div>
        `;

        card.querySelector('.trade-btn-accept').addEventListener('click', async (e) => {
          const { acceptTrade } = await import('./trading.js');
          const success = await acceptTrade(e.target.dataset.id);
          if (success) {
            await eco.load(); // Reload our save after swap
            this.audio.playCashRegister();
          }
          if (this.onTrade) this.onTrade(); // Refresh trade screen
        });

        card.querySelector('.trade-btn-decline').addEventListener('click', async (e) => {
          const { declineTrade } = await import('./trading.js');
          await declineTrade(e.target.dataset.id);
          if (this.onTrade) this.onTrade(); // Refresh
        });

        requestsEl.appendChild(card);
      }
    }

    // Right panel — players in same dimension
    const playersEl = document.getElementById('trade-players');
    playersEl.innerHTML = '';

    if (playersInDim.length === 0) {
      playersEl.innerHTML = '<div class="trade-empty">No other players in your dimension</div>';
    } else {
      for (const player of playersInDim) {
        const item = document.createElement('div');
        item.className = 'trade-player-item';
        item.innerHTML = `
          <span class="trade-player-name">${player.name}</span>
          <span class="trade-player-arrow">→</span>
        `;
        item.addEventListener('click', () => {
          this.audio.playUIClick();
          this.showTradeBuilder(uid, displayName, player);
        });
        playersEl.appendChild(item);
      }
    }

    this.showScreen('trade');
  }

  showTradeBuilder(uid, displayName, partner) {
    const eco = this.economy;

    document.getElementById('trade-partner-name').textContent = `Trading with: ${partner.name}`;

    // Build "You Offer" items — weapons and locations you own
    const offerGrid = document.getElementById('trade-offer-items');
    offerGrid.innerHTML = '';
    const selectedOffer = { weapons: new Set(), locations: new Set() };

    // Weapons you own (excluding grandpa weapons)
    for (const [key, weapon] of Object.entries(eco.weapons)) {
      if (!weapon.owned || weapon.isGrandpa) continue;
      const item = document.createElement('div');
      item.className = 'trade-item';
      item.innerHTML = `<div class="trade-item-type">Weapon</div>${weapon.name}`;
      item.addEventListener('click', () => {
        if (selectedOffer.weapons.has(key)) {
          selectedOffer.weapons.delete(key);
          item.classList.remove('selected');
        } else {
          selectedOffer.weapons.add(key);
          item.classList.add('selected');
        }
      });
      offerGrid.appendChild(item);
    }

    // Locations you own
    for (const [key, loc] of Object.entries(eco.locations)) {
      if (!loc.unlocked) continue;
      // Don't trade the backyard (free starting location)
      if (key === 'backyard') continue;
      const item = document.createElement('div');
      item.className = 'trade-item';
      item.innerHTML = `<div class="trade-item-type">Location</div>${loc.name}`;
      item.addEventListener('click', () => {
        if (selectedOffer.locations.has(key)) {
          selectedOffer.locations.delete(key);
          item.classList.remove('selected');
        } else {
          selectedOffer.locations.add(key);
          item.classList.add('selected');
        }
      });
      offerGrid.appendChild(item);
    }

    // Build "You Want" items — weapons and locations partner might have
    const wantGrid = document.getElementById('trade-want-items');
    wantGrid.innerHTML = '';
    const selectedWant = { weapons: new Set(), locations: new Set() };

    // Show all non-grandpa weapons as potential wants
    for (const [key, weapon] of Object.entries(eco.weapons)) {
      if (weapon.isGrandpa || weapon.isLegendary) continue;
      if (eco.weapons[key].owned) continue; // Don't want what we already have
      const item = document.createElement('div');
      item.className = 'trade-item';
      item.innerHTML = `<div class="trade-item-type">Weapon</div>${weapon.name}`;
      item.addEventListener('click', () => {
        if (selectedWant.weapons.has(key)) {
          selectedWant.weapons.delete(key);
          item.classList.remove('selected');
        } else {
          selectedWant.weapons.add(key);
          item.classList.add('selected');
        }
      });
      wantGrid.appendChild(item);
    }

    // Show locations we don't have
    for (const [key, loc] of Object.entries(eco.locations)) {
      if (loc.unlocked || key === 'backyard') continue;
      const item = document.createElement('div');
      item.className = 'trade-item';
      item.innerHTML = `<div class="trade-item-type">Location</div>${loc.name}`;
      item.addEventListener('click', () => {
        if (selectedWant.locations.has(key)) {
          selectedWant.locations.delete(key);
          item.classList.remove('selected');
        } else {
          selectedWant.locations.add(key);
          item.classList.add('selected');
        }
      });
      wantGrid.appendChild(item);
    }

    // Reset money inputs
    document.getElementById('trade-offer-money').value = 0;
    document.getElementById('trade-want-money').value = 0;

    // Send button
    const sendBtn = document.getElementById('btn-trade-send');
    const newSendBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
    newSendBtn.addEventListener('click', async () => {
      const { sendTrade } = await import('./trading.js');
      const offerMoney = parseInt(document.getElementById('trade-offer-money').value) || 0;
      const wantMoney = parseInt(document.getElementById('trade-want-money').value) || 0;

      // Validate — can't trade nothing for nothing
      if (selectedOffer.weapons.size === 0 && selectedOffer.locations.size === 0 && offerMoney === 0 &&
          selectedWant.weapons.size === 0 && selectedWant.locations.size === 0 && wantMoney === 0) {
        return;
      }

      // Validate — can't offer more money than you have
      if (offerMoney > eco.money) return;

      await sendTrade(
        uid, displayName,
        partner.uid, partner.name,
        eco.dimension,
        { weapons: [...selectedOffer.weapons], locations: [...selectedOffer.locations], money: offerMoney },
        { weapons: [...selectedWant.weapons], locations: [...selectedWant.locations], money: wantMoney }
      );

      this.audio.playUIClick();
      if (this.onTrade) this.onTrade(); // Go back to trade screen
    });

    // Cancel button
    const cancelBtn = document.getElementById('btn-trade-cancel');
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    newCancelBtn.addEventListener('click', () => {
      this.audio.playUIClick();
      if (this.onTrade) this.onTrade();
    });

    this.showScreen('tradeBuilder');
  }

  /**
   * Update the red notification dot on the trade button
   */
  setTradeNotification(hasTrades) {
    const dot = document.getElementById('trade-dot');
    if (dot) {
      dot.classList.toggle('hidden', !hasTrades);
    }
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
