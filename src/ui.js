// ═══════════════════════════════════════════════
// Gary's Life — UI System
// Menu screens: title, morning, results, shop, sleep, win
// ═══════════════════════════════════════════════

import { Economy, BIRDS, RARITY_COLORS, DIMENSIONS, WEAPONS, BANNERS, CONSUMABLES, WEAPON_SKINS, PETS, RANKS } from './economy.js';

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
      friends: document.getElementById('screen-friends'),
      tournament: document.getElementById('screen-tournament'),
      clan: document.getElementById('screen-clan'),
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
    this.onTrade = null;
    this.onFriends = null;
    this.onTournament = null;
    this.onClan = null;

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
    bind('btn-shop-back', () => { this.audio.playUIClick(); if (this.onShopBack) this.onShopBack(); });
    bind('btn-sleep', () => { this.audio.playUIClick(); if (this.onSleep) this.onSleep(); });
    // Shop tab switching
    document.querySelectorAll('.shop-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.audio.playUIClick();
        document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._renderShopTab(tab.dataset.shopTab);
      });
    });
    bind('btn-continue', () => { this.audio.playUIClick(); if (this.onContinueAfterWin) this.onContinueAfterWin(); });
    bind('btn-restart', () => { this.audio.playUIClick(); if (this.onRestart) this.onRestart(); });
    bind('btn-trade', () => { this.audio.playUIClick(); if (this.onTrade) this.onTrade(); });
    bind('btn-trade-back', () => { this.audio.playUIClick(); this.showScreen('results'); });
    bind('btn-friends', () => { this.audio.playUIClick(); if (this.onFriends) this.onFriends(); });
    bind('btn-friends-back', () => { this.audio.playUIClick(); this.showScreen('results'); });
    bind('btn-tournament', () => { this.audio.playUIClick(); if (this.onTournament) this.onTournament(); });
    bind('btn-tournament-back', () => { this.audio.playUIClick(); this.showScreen('results'); });
    bind('btn-clan', () => { this.audio.playUIClick(); if (this.onClan) this.onClan(); });
    bind('btn-clan-back', () => { this.audio.playUIClick(); this.showScreen('results'); });
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

    // Rank display
    const rank = eco.getRank();
    const xpInfo = eco.getXPToNextRank();
    let rankEl = document.getElementById('morning-rank');
    if (!rankEl) {
      rankEl = document.createElement('div');
      rankEl.id = 'morning-rank';
      rankEl.style.cssText = 'margin-top:8px;text-align:center;';
      const morningPanel = document.querySelector('#screen-morning .panel');
      if (morningPanel) {
        // Insert after dimension badge
        if (dimEl && dimEl.nextSibling) {
          dimEl.parentNode.insertBefore(rankEl, dimEl.nextSibling);
        } else if (morningPanel) {
          morningPanel.insertBefore(rankEl, morningPanel.querySelector('.location-list')?.parentNode || null);
        }
      }
    }
    const glowStyle = rank.glow ? `text-shadow: 0 0 8px ${rank.color}, 0 0 16px ${rank.color}40;` : '';
    const holoStyle = rank.holographic ? 'animation: holoShift 2s ease-in-out infinite;' : '';
    rankEl.innerHTML = `
      <span style="font-size:20px;${glowStyle}${holoStyle}">${rank.icon}</span>
      <span style="color:${rank.color};font-weight:700;margin-left:6px;font-size:14px">${rank.name}</span>
      <span style="color:var(--text-secondary);font-size:12px;margin-left:8px">${eco.xp} XP</span>
      ${xpInfo.needed > 0 ? `<div style="width:120px;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;margin:6px auto 0;overflow:hidden"><div style="height:100%;background:${rank.color};width:${xpInfo.progress * 100}%;border-radius:2px;transition:width 0.3s"></div></div>` : '<div style="font-size:11px;color:var(--accent-gold);margin-top:4px">MAX RANK</div>'}
    `;

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

    // Daily Challenges
    eco.refreshChallenges();
    let challengeEl = document.getElementById('morning-challenges');
    if (!challengeEl) {
      challengeEl = document.createElement('div');
      challengeEl.id = 'morning-challenges';
      challengeEl.style.cssText = 'margin-top:16px;';
      const morningPanel = document.querySelector('#screen-morning .panel');
      if (morningPanel) morningPanel.appendChild(challengeEl);
    }
    challengeEl.innerHTML = '<h3 style="color:var(--accent-gold);margin-bottom:8px;font-size:14px">Daily Challenges</h3>';
    for (const c of eco.dailyChallenges) {
      const row = document.createElement('div');
      row.style.cssText = `display:flex;justify-content:space-between;align-items:center;padding:6px 10px;margin-bottom:4px;border-radius:6px;font-size:13px;background:${c.completed ? 'rgba(90,181,90,0.15)' : 'rgba(255,255,255,0.05)'};color:${c.completed ? '#5ab55a' : 'var(--text-secondary)'};`;
      row.innerHTML = `<span>${c.completed ? '\u2713 ' : ''}${c.desc}</span><span style="color:var(--accent-gold)">$${c.reward}</span>`;
      challengeEl.appendChild(row);
    }

    // Consumables activation
    const ownedConsumables = eco.ownedConsumables || {};
    const hasConsumables = Object.keys(ownedConsumables).length > 0;
    if (hasConsumables) {
      let consumEl = document.getElementById('morning-consumables');
      if (!consumEl) {
        consumEl = document.createElement('div');
        consumEl.id = 'morning-consumables';
        consumEl.style.cssText = 'margin-top:16px;';
        const morningPanel = document.querySelector('#screen-morning .panel');
        if (morningPanel) morningPanel.appendChild(consumEl);
      }
      consumEl.innerHTML = '<h3 style="color:var(--accent-gold);margin-bottom:8px;font-size:14px">Consumables</h3>';
      for (const [key, count] of Object.entries(ownedConsumables)) {
        if (count <= 0) continue;
        const cons = CONSUMABLES[key];
        if (!cons) continue;
        const isActive = (eco.activeConsumables || []).includes(key);
        const row = document.createElement('div');
        row.style.cssText = `display:flex;justify-content:space-between;align-items:center;padding:6px 10px;margin-bottom:4px;border-radius:6px;font-size:13px;background:${isActive ? 'rgba(90,181,90,0.15)' : 'rgba(255,255,255,0.05)'};cursor:pointer;`;
        row.innerHTML = `<span>${cons.name} <span style="color:var(--text-secondary)">(x${count})</span></span><span style="color:${isActive ? '#5ab55a' : 'var(--accent-gold)'}">${isActive ? 'ACTIVE' : 'Use'}</span>`;
        if (!isActive) {
          row.addEventListener('click', () => {
            eco.useConsumable(key);
            this.showMorning();
          });
        }
        consumEl.appendChild(row);
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

        // Rank badge
        let rankBadge = '';
        if (entry.rank) {
          const rankData = RANKS.find(r => r.level === entry.rank) || RANKS[0];
          const badgeClass = rankData.holographic ? 'rank-badge holographic' : (rankData.glow ? 'rank-badge glow' : 'rank-badge');
          rankBadge = `<span class="${badgeClass}" title="${rankData.name}">${rankData.icon}</span>`;
        }

        div.innerHTML = `
          <span class="lb-rank">${i + 1}</span>
          <span class="lb-name">${rankBadge}${entry.name}${entry.tag ? ' <span class="og-badge">OG</span>' : ''}${isYou ? ' (you)' : ''}</span>
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
    this.showScreen('shop');

    try {
      const eco = this.economy;
      document.getElementById('shop-money').textContent = `$${eco.money}`;

      const dimHeader = document.getElementById('shop-dimension');
      if (dimHeader) {
        dimHeader.textContent = `Dimension ${eco.dimension} -- ${eco.getDimensionName()}`;
      }

      // Reset to weapons tab
      document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
      const weaponTab = document.querySelector('.shop-tab[data-shop-tab="weapons"]');
      if (weaponTab) weaponTab.classList.add('active');

      // Render dimension advance button
      this._renderDimensionAdvance();

      // Render default tab
      this._renderShopTab('weapons');
    } catch(e) { console.error('showShop error:', e); }
  }

  _renderShopTab(tab) {
    const content = document.getElementById('shop-tab-content');
    content.innerHTML = '';
    const advanceEl = document.getElementById('shop-advance-dim');
    if (advanceEl) advanceEl.style.display = (tab === 'locations') ? '' : 'none';

    switch(tab) {
      case 'weapons': this._renderShopWeapons(content); break;
      case 'locations': this._renderShopLocations(content); break;
      case 'banners': this._renderShopBanners(content); break;
      case 'quests': this._renderShopQuests(content); break;
    }
  }

  _renderShopWeapons(container) {
    const eco = this.economy;
    const grid = document.createElement('div');
    grid.className = 'shop-grid';

    for (const [key, weapon] of Object.entries(eco.weapons)) {
      if (weapon.isLegendary) continue;
      if (weapon.dimension && weapon.dimension > eco.dimension) continue;

      const item = document.createElement('div');
      item.className = 'shop-item';

      if (weapon.owned) {
        item.classList.add('owned');
        const isEquipped = key === eco.currentWeapon;
        const upgradeLevel = eco.getUpgradeLevel(key);
        const upgradeCost = eco.getUpgradeCost(key);
        const maxed = upgradeLevel >= 3;
        const canAffordUpgrade = eco.money >= upgradeCost;
        const stars = '\u2605'.repeat(upgradeLevel) + '\u2606'.repeat(3 - upgradeLevel);

        item.innerHTML = `
          <div class="shop-item-name">${weapon.name} <span style="color:var(--accent-gold);font-size:12px">${stars}</span></div>
          <div class="shop-item-desc">${weapon.description || ''}</div>
          <div class="shop-item-price">${isEquipped ? 'EQUIPPED' : 'OWNED'}</div>
          ${!maxed && weapon.cost > 0 ? `<button class="btn btn-upgrade ${canAffordUpgrade ? '' : 'cant-afford'}" style="margin-top:6px;font-size:11px;padding:4px 8px">Upgrade Lv${upgradeLevel + 1} \u2014 $${upgradeCost}</button>` : (maxed && weapon.cost > 0 ? '<div style="color:var(--accent-gold);font-size:11px;margin-top:4px">MAX LEVEL</div>' : '')}
        `;
        if (!isEquipped) {
          item.style.cursor = 'pointer';
          item.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-upgrade')) return;
            this.audio.playUIClick();
            eco.selectWeapon(key);
            this._renderShopTab('weapons');
          });
        }
        const upgradeBtn = item.querySelector('.btn-upgrade');
        if (upgradeBtn && canAffordUpgrade) {
          upgradeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.audio.playUIClick();
            if (eco.upgradeWeapon(key)) {
              this.audio.playCashRegister();
              document.getElementById('shop-money').textContent = `$${eco.money}`;
              this._renderShopTab('weapons');
            }
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
            document.getElementById('shop-money').textContent = `$${eco.money}`;
            this._renderShopTab('weapons');
          }
        });
      }
      grid.appendChild(item);
    }
    container.appendChild(grid);

    // Consumables section
    const consumableHeader = document.createElement('h3');
    consumableHeader.style.cssText = 'color:var(--accent-gold);margin:20px 0 10px;font-size:14px;';
    consumableHeader.textContent = 'Consumables';
    container.appendChild(consumableHeader);

    const cGrid = document.createElement('div');
    cGrid.className = 'shop-grid';
    for (const [key, cons] of Object.entries(CONSUMABLES)) {
      const owned = eco.ownedConsumables[key] || 0;
      const item = document.createElement('div');
      item.className = `shop-item ${eco.money < cons.cost ? 'cant-afford' : ''}`;
      item.innerHTML = `
        <div class="shop-item-name">${cons.name}${owned > 0 ? ` <span style="color:var(--accent-gold)">(x${owned})</span>` : ''}</div>
        <div class="shop-item-desc">${cons.desc}</div>
        <div class="shop-item-price">$${cons.cost}</div>
      `;
      if (eco.money >= cons.cost) {
        item.addEventListener('click', () => {
          this.audio.playUIClick();
          if (eco.buyConsumable(key)) {
            this.audio.playCashRegister();
            document.getElementById('shop-money').textContent = `$${eco.money}`;
            this._renderShopTab('weapons');
          }
        });
      }
      cGrid.appendChild(item);
    }
    container.appendChild(cGrid);

    // Weapon Skins section
    const skinHeader = document.createElement('h3');
    skinHeader.style.cssText = 'color:var(--accent-gold);margin:20px 0 10px;font-size:14px;';
    skinHeader.textContent = 'Weapon Skins';
    container.appendChild(skinHeader);

    const sGrid = document.createElement('div');
    sGrid.className = 'shop-grid';
    for (const [key, skin] of Object.entries(WEAPON_SKINS)) {
      if (key === 'default' || skin.tournamentOnly) continue;
      const owned = eco.ownedSkins.includes(key);
      const item = document.createElement('div');
      item.className = `shop-item ${owned ? 'owned' : (eco.money < skin.cost ? 'cant-afford' : '')}`;
      const colorPreview = skin.colors ? `<div style="display:inline-flex;gap:3px;vertical-align:middle"><div style="width:14px;height:14px;border-radius:3px;background:#${skin.colors.stock.toString(16).padStart(6,'0')}"></div><div style="width:14px;height:14px;border-radius:3px;background:#${skin.colors.metal.toString(16).padStart(6,'0')}"></div></div>` : '';
      item.innerHTML = `
        <div class="shop-item-name">${skin.name} ${colorPreview}</div>
        <div class="shop-item-price">${owned ? 'OWNED' : `$${skin.cost}`}</div>
      `;
      if (!owned && eco.money >= skin.cost) {
        item.addEventListener('click', () => {
          this.audio.playUIClick();
          if (eco.buyWeaponSkin(key)) {
            this.audio.playCashRegister();
            document.getElementById('shop-money').textContent = `$${eco.money}`;
            this._renderShopTab('weapons');
          }
        });
      }
      sGrid.appendChild(item);
    }
    container.appendChild(sGrid);
  }

  _renderShopLocations(container) {
    const eco = this.economy;
    const grid = document.createElement('div');
    grid.className = 'shop-grid';

    for (let d = 0; d < eco.dimension && d < DIMENSIONS.length; d++) {
      const dim = DIMENSIONS[d];
      const header = document.createElement('div');
      header.className = 'shop-dim-header';
      header.textContent = `${dim.name} (Dimension ${dim.id})`;
      grid.appendChild(header);

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
              this._renderShopTab('locations');
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
              document.getElementById('shop-money').textContent = `$${eco.money}`;
              this._renderShopTab('locations');
            }
          });
        }
        grid.appendChild(item);
      }
    }
    container.appendChild(grid);
  }

  _renderShopBanners(container) {
    const eco = this.economy;
    const grid = document.createElement('div');
    grid.className = 'shop-grid';

    for (const [key, banner] of Object.entries(BANNERS)) {
      if (banner.tournamentOnly) continue;
      if (banner.dimension && banner.dimension > eco.dimension) continue;

      const owned = eco.ownedBanners.includes(key);
      const isEquipped = eco.equippedBanner === key;
      const item = document.createElement('div');
      item.className = `shop-item ${owned ? 'owned' : (eco.money < banner.cost ? 'cant-afford' : '')}`;

      item.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:24px;height:24px;border-radius:4px;background:${banner.color};border:1px solid rgba(255,255,255,0.2)"></div>
          <div class="shop-item-name">${banner.name}</div>
        </div>
        <div class="shop-item-price">${owned ? (isEquipped ? 'EQUIPPED' : 'OWNED') : `$${banner.cost}`}</div>
      `;

      item.addEventListener('click', () => {
        this.audio.playUIClick();
        if (owned) {
          eco.equippedBanner = isEquipped ? null : key;
          eco.save();
          this._renderShopTab('banners');
        } else if (eco.money >= banner.cost) {
          if (eco.buyBanner(key)) {
            this.audio.playCashRegister();
            document.getElementById('shop-money').textContent = `$${eco.money}`;
            this._renderShopTab('banners');
          }
        }
      });
      grid.appendChild(item);
    }
    container.appendChild(grid);
  }

  _renderShopQuests(container) {
    // --- TEMPORARILY HIDDEN: Re-enable when quest is ready for public ---
    container.innerHTML = '<div class="locker-coming-soon" style="text-align:center;padding:40px;color:var(--text-secondary)">Coming Soon</div>';
    return;
    // --- END HIDDEN BLOCK ---

    const grid = document.createElement('div');
    grid.className = 'shop-grid';
    container.appendChild(grid);

    const eco = this.economy;
    const story = this._storyRef;
    const QUEST_COST = 50;
    const phase = story ? story.getPhase() : 'locked';

    const item = document.createElement('div');
    item.className = 'shop-item quest-item';

    if (phase !== 'locked') {
      item.classList.add('owned');
      const phaseLabels = {
        bought:      'UNLOCKED \u2014 Start next morning',
        walking:     'IN PROGRESS \u2014 Trail Walk',
        shed_found:  'IN PROGRESS \u2014 The Shed',
        riding:      'IN PROGRESS \u2014 Riding Home',
        assembling:  'IN PROGRESS \u2014 Assembling the rifle',
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
          document.getElementById('shop-money').textContent = `$${eco.money}`;
          this._renderShopTab('quests');
        }
      });
    }
    grid.appendChild(item);
  }

  _renderDimensionAdvance() {
    const eco = this.economy;
    const advanceContainer = document.getElementById('shop-advance-dim');
    if (!advanceContainer) return;
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

  _renderQuestShop() {
    // Quests are now rendered via shop tabs
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
        item.addEventListener('click', async () => {
          this.audio.playUIClick();
          const { getPlayerSave } = await import('./trading.js');
          const partnerSave = await getPlayerSave(player.uid);
          this.showTradeBuilder(uid, displayName, player, partnerSave);
        });
        playersEl.appendChild(item);
      }
    }

    this.showScreen('trade');
  }

  showTradeBuilder(uid, displayName, partner, partnerSave) {
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

    // Build "You Want" items — only what the partner ACTUALLY owns
    const wantGrid = document.getElementById('trade-want-items');
    wantGrid.innerHTML = '';
    const selectedWant = { weapons: new Set(), locations: new Set() };

    // Partner's owned weapons/locations from their save
    const partnerWeapons = (partnerSave && partnerSave.weaponOwned) || {};
    const partnerLocs = (partnerSave && partnerSave.locationUnlocked) || {};

    // Show partner's weapons that we don't already own
    for (const [key, weapon] of Object.entries(eco.weapons)) {
      if (weapon.isGrandpa || weapon.isLegendary) continue;
      if (weapon.owned) continue; // we already have it
      if (!partnerWeapons[key]) continue; // partner doesn't have it
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

    // Show partner's locations that we don't already have
    for (const [key, loc] of Object.entries(eco.locations)) {
      if (loc.unlocked || key === 'backyard') continue;
      if (!partnerLocs[key]) continue; // partner doesn't have it
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
    } else if (tab === 'loadout') {
      content.innerHTML = '';
      const allOwned = eco.getOwnedWeaponKeys();
      const currentLoadout = eco.loadout || [];

      const desc = document.createElement('div');
      desc.className = 'loadout-desc';
      desc.textContent = 'Select up to 5 weapons for your loadout. These will appear in your weapon bar during hunts.';
      content.appendChild(desc);

      const grid = document.createElement('div');
      grid.className = 'locker-items';

      for (const key of allOwned) {
        const weapon = eco.weapons[key];
        const inLoadout = currentLoadout.includes(key);
        const item = document.createElement('div');
        item.className = `locker-item${inLoadout ? ' equipped' : ''}`;
        item.innerHTML = `
          <div class="locker-item-icon">${inLoadout ? (currentLoadout.indexOf(key) + 1) : '—'}</div>
          <div class="locker-item-name">${weapon.name}</div>
          <div class="locker-item-desc">${weapon.description || ''}</div>
          <button class="btn ${inLoadout ? 'btn-secondary' : 'btn-primary'}">${inLoadout ? 'Remove' : 'Add'}</button>
        `;
        item.querySelector('.btn').addEventListener('click', () => {
          if (inLoadout) {
            eco.loadout = currentLoadout.filter(k => k !== key);
          } else {
            if (currentLoadout.length >= 5) return; // max 5
            eco.loadout = [...currentLoadout, key];
          }
          eco.save();
          this._renderLockerTab('loadout');
        });
        grid.appendChild(item);
      }

      if (allOwned.length === 0) {
        content.innerHTML = '<div class="locker-coming-soon">No weapons owned yet</div>';
        return;
      }

      // Clear all button
      const clearBtn = document.createElement('button');
      clearBtn.className = 'btn btn-secondary';
      clearBtn.style.marginTop = '16px';
      clearBtn.textContent = 'Clear Loadout (Use All Weapons)';
      clearBtn.addEventListener('click', () => {
        eco.loadout = [];
        eco.save();
        this._renderLockerTab('loadout');
      });

      content.appendChild(grid);
      content.appendChild(clearBtn);
    } else if (tab === 'pets') {
      content.innerHTML = '';
      const grid = document.createElement('div');
      grid.className = 'locker-items';
      for (const [key, pet] of Object.entries(PETS)) {
        const owned = eco.ownedPets.includes(key);
        const isActive = eco.activePet === key;
        const item = document.createElement('div');
        item.className = `locker-item${isActive ? ' equipped' : ''}`;
        item.innerHTML = `
          <div class="locker-item-icon" style="font-size:24px">${key === 'hunting_dog' ? '🐕' : key === 'scout_hawk' ? '🦅' : '🦅'}</div>
          <div class="locker-item-name">${pet.name}</div>
          <div class="locker-item-desc" style="font-size:11px;color:var(--text-secondary)">${pet.desc}</div>
          ${owned
            ? `<button class="btn ${isActive ? 'btn-secondary' : 'btn-primary'}">${isActive ? 'Unequip' : 'Equip'}</button>`
            : `<button class="btn btn-primary ${eco.money < pet.cost ? 'cant-afford' : ''}">Buy $${pet.cost}</button>`
          }
        `;
        item.querySelector('.btn').addEventListener('click', () => {
          this.audio.playUIClick();
          if (owned) {
            eco.equipPet(isActive ? null : key);
          } else if (eco.money >= pet.cost) {
            eco.buyPet(key);
            this.audio.playCashRegister();
          }
          this._renderLockerTab('pets');
        });
        grid.appendChild(item);
      }
      content.appendChild(grid);
    } else if (tab === 'banners') {
      content.innerHTML = '';
      if (eco.ownedBanners.length === 0) {
        content.innerHTML = '<div class="locker-coming-soon">No banners owned. Buy them in the Shop!</div>';
        return;
      }
      const grid = document.createElement('div');
      grid.className = 'locker-items';
      for (const key of eco.ownedBanners) {
        const banner = BANNERS[key];
        if (!banner) continue;
        const isEquipped = eco.equippedBanner === key;
        const item = document.createElement('div');
        item.className = `locker-item${isEquipped ? ' equipped' : ''}`;
        item.innerHTML = `
          <div class="locker-item-icon" style="background:${banner.color};width:30px;height:30px;border-radius:6px"></div>
          <div class="locker-item-name">${banner.name}</div>
          <button class="btn ${isEquipped ? 'btn-secondary' : 'btn-primary'}">${isEquipped ? 'Unequip' : 'Equip'}</button>
        `;
        item.querySelector('.btn').addEventListener('click', () => {
          eco.equippedBanner = isEquipped ? null : key;
          eco.save();
          this._renderLockerTab('banners');
        });
        grid.appendChild(item);
      }
      content.appendChild(grid);
    } else if (tab === 'skins') {
      content.innerHTML = '';
      if (eco.ownedSkins.length <= 1) {
        content.innerHTML = '<div class="locker-coming-soon">No skins owned. Buy them in the Shop!</div>';
        return;
      }
      const grid = document.createElement('div');
      grid.className = 'locker-items';
      const ownedWeapons = eco.getOwnedWeaponKeys();
      for (const wKey of ownedWeapons) {
        const weapon = eco.weapons[wKey];
        const currentSkin = eco.equippedSkins[wKey] || 'default';
        const item = document.createElement('div');
        item.className = 'locker-item';
        let skinOptions = eco.ownedSkins.map(sk => {
          const s = WEAPON_SKINS[sk];
          return `<option value="${sk}" ${sk === currentSkin ? 'selected' : ''}>${s ? s.name : sk}</option>`;
        }).join('');
        item.innerHTML = `
          <div class="locker-item-name">${weapon.name}</div>
          <select class="skin-select" style="background:var(--surface);color:var(--text-primary);border:1px solid var(--border);border-radius:4px;padding:4px 8px;font-size:12px">${skinOptions}</select>
        `;
        item.querySelector('.skin-select').addEventListener('change', (e) => {
          eco.equipSkin(wKey, e.target.value);
        });
        grid.appendChild(item);
      }
      content.appendChild(grid);
    } else {
      content.innerHTML = `<div class="locker-coming-soon">Coming Soon</div>`;
    }
  }

  // ─── Friends UI ────────────────────────────────

  async showFriends(uid, displayName) {
    const { getFriends, getPendingFriendRequests, acceptFriendRequest, declineFriendRequest, sendFriendRequest, removeFriend, searchPlayers } = await import('./friends.js');

    // Friend requests
    const reqList = document.getElementById('friend-requests-list');
    reqList.innerHTML = '<div style="color:var(--text-secondary);font-size:13px">Loading...</div>';
    const requests = await getPendingFriendRequests(uid);
    reqList.innerHTML = '';
    if (requests.length === 0) {
      reqList.innerHTML = '<div style="color:var(--text-secondary);font-size:13px">No pending requests</div>';
    }
    for (const req of requests) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px 12px;margin-bottom:4px;background:rgba(255,255,255,0.05);border-radius:6px;';
      row.innerHTML = `<span>${req.fromName}</span><div><button class="btn btn-primary" style="font-size:11px;padding:4px 10px;margin-right:4px">Accept</button><button class="btn btn-secondary" style="font-size:11px;padding:4px 10px">Decline</button></div>`;
      row.querySelector('.btn-primary').addEventListener('click', async () => {
        await acceptFriendRequest(req.id);
        this.showFriends(uid, displayName);
      });
      row.querySelector('.btn-secondary').addEventListener('click', async () => {
        await declineFriendRequest(req.id);
        this.showFriends(uid, displayName);
      });
      reqList.appendChild(row);
    }

    // Friends list
    const friendList = document.getElementById('friend-list');
    friendList.innerHTML = '<div style="color:var(--text-secondary);font-size:13px">Loading...</div>';
    const friends = await getFriends(uid);
    friendList.innerHTML = '';
    if (friends.length === 0) {
      friendList.innerHTML = '<div style="color:var(--text-secondary);font-size:13px">No friends yet — search for players above!</div>';
    }
    for (const friend of friends) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px 12px;margin-bottom:4px;background:rgba(255,255,255,0.05);border-radius:6px;';
      row.innerHTML = `<span>${friend.name}</span><button class="btn btn-secondary" style="font-size:11px;padding:4px 10px">Remove</button>`;
      row.querySelector('.btn').addEventListener('click', async () => {
        await removeFriend(uid, friend.uid);
        this.showFriends(uid, displayName);
      });
      friendList.appendChild(row);
    }

    // Search
    const searchInput = document.getElementById('friend-search-input');
    const searchResults = document.getElementById('friend-search-results');
    searchInput.value = '';
    searchResults.innerHTML = '';
    searchInput.oninput = async () => {
      const q = searchInput.value.trim();
      if (q.length < 2) { searchResults.innerHTML = ''; return; }
      const results = await searchPlayers(q, uid);
      searchResults.innerHTML = '';
      for (const p of results) {
        const isFriend = friends.find(f => f.uid === p.uid);
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:6px 10px;margin-bottom:4px;background:rgba(255,255,255,0.03);border-radius:4px;font-size:13px;';
        row.innerHTML = `<span>${p.name} <span style="color:var(--text-secondary)">(Dim ${p.dimension})</span></span>${isFriend ? '<span style="color:#5ab55a">Friend</span>' : `<button class="btn btn-primary" style="font-size:11px;padding:3px 8px">Add</button>`}`;
        if (!isFriend) {
          row.querySelector('.btn').addEventListener('click', async () => {
            await sendFriendRequest(uid, displayName, p.uid, p.name);
            row.querySelector('.btn').textContent = 'Sent!';
            row.querySelector('.btn').disabled = true;
          });
        }
        searchResults.appendChild(row);
      }
    };

    this.showScreen('friends');
  }

  // ─── Tournament UI ────────────────────────────

  async showTournament(uid, displayName, economy) {
    const { getCurrentTournament, getTournamentLeaderboard, getPlacement, getPrize, claimPrize } = await import('./tournaments.js');

    const tournament = await getCurrentTournament();
    const weaponData = WEAPONS[tournament.weapon];
    const weaponName = weaponData ? weaponData.name : tournament.weapon;

    // Info
    const info = document.getElementById('tournament-info');
    info.innerHTML = `
      <div style="font-size:14px;color:var(--text-secondary);margin-bottom:8px">Week: <strong style="color:var(--text-primary)">${tournament.weekId}</strong></div>
      <div style="font-size:14px;color:var(--text-secondary)">Weapon: <strong style="color:var(--accent-gold)">${weaponName}</strong> • Location: <strong style="color:var(--accent-gold)">${tournament.location}</strong></div>
    `;

    // Prizes
    const prizes = document.getElementById('tournament-prizes');
    prizes.innerHTML = `
      <h3 style="color:var(--accent-gold);font-size:14px;margin-bottom:8px">Prizes</h3>
      <div style="font-size:12px;color:var(--text-secondary);line-height:1.8">
        <div>🥇 1st: $1000 + Champion Banner + Champion Gold Skin</div>
        <div>🥈 2nd: $750 + Champion Banner</div>
        <div>🥉 3rd: $500</div>
        <div>🏅 Top 10: $250</div>
        <div>✓ Participated: $50</div>
      </div>
    `;

    // Leaderboard
    const entries = tournament.entries || [];
    const lbEl = document.getElementById('tournament-leaderboard');
    lbEl.innerHTML = '<h3 style="color:var(--accent-gold);font-size:14px;margin-bottom:8px">Leaderboard</h3>';
    if (entries.length === 0) {
      lbEl.innerHTML += '<div style="color:var(--text-secondary);font-size:13px">No entries yet — be the first!</div>';
    } else {
      for (let i = 0; i < Math.min(entries.length, 10); i++) {
        const e = entries[i];
        const isMe = e.uid === uid;
        const row = document.createElement('div');
        row.style.cssText = `display:flex;justify-content:space-between;padding:6px 10px;margin-bottom:3px;border-radius:4px;font-size:13px;background:${isMe ? 'rgba(212,168,83,0.15)' : 'rgba(255,255,255,0.03)'};`;
        row.innerHTML = `<span>${i + 1}. ${e.name}</span><span style="color:var(--accent-gold)">$${e.score} (${e.kills} kills)</span>`;
        lbEl.appendChild(row);
      }
    }

    // Actions
    const actions = document.getElementById('tournament-actions');
    const myPlacement = getPlacement(entries, uid);
    actions.innerHTML = '';
    if (myPlacement > 0) {
      const prize = getPrize(myPlacement);
      const claimBtn = document.createElement('button');
      claimBtn.className = 'btn btn-primary';
      claimBtn.textContent = `Claim Prize: ${prize.label}`;
      claimBtn.addEventListener('click', async () => {
        const result = await claimPrize(tournament.weekId, uid, economy);
        if (result) {
          claimBtn.textContent = 'Prize Claimed!';
          claimBtn.disabled = true;
        } else {
          claimBtn.textContent = 'Already Claimed';
          claimBtn.disabled = true;
        }
      });
      actions.appendChild(claimBtn);
    }

    this.showScreen('tournament');
  }

  // ─── Clan UI ──────────────────────────────────

  async showClan(uid, displayName, economy) {
    const { findUserClan, createClan, getClan, leaveClan, inviteToClan, getClanInvites, acceptClanInvite } = await import('./clans.js');

    const content = document.getElementById('clan-content');
    content.innerHTML = '<div style="color:var(--text-secondary);font-size:13px">Loading...</div>';

    const myClan = await findUserClan(uid);
    const invites = await getClanInvites(uid);

    content.innerHTML = '';

    // Pending invites
    if (invites.length > 0) {
      const invHeader = document.createElement('h3');
      invHeader.style.cssText = 'color:var(--accent-gold);font-size:14px;margin-bottom:8px';
      invHeader.textContent = 'Clan Invites';
      content.appendChild(invHeader);
      for (const inv of invites) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px 12px;margin-bottom:4px;background:rgba(255,255,255,0.05);border-radius:6px;';
        row.innerHTML = `<span>${inv.clanName} (from ${inv.fromName})</span><button class="btn btn-primary" style="font-size:11px;padding:4px 10px">Join</button>`;
        row.querySelector('.btn').addEventListener('click', async () => {
          await acceptClanInvite(inv.id, uid, displayName);
          economy.clanId = inv.clanId;
          economy.save();
          this.showClan(uid, displayName, economy);
        });
        content.appendChild(row);
      }
    }

    if (myClan) {
      // Show clan details
      const header = document.createElement('div');
      header.innerHTML = `
        <h3 style="color:var(--accent-gold);font-size:18px;margin-bottom:4px">[${myClan.tag}] ${myClan.name}</h3>
        <div style="color:var(--text-secondary);font-size:13px;margin-bottom:12px">${myClan.members.length}/10 members</div>
      `;
      content.appendChild(header);

      // Members
      for (const m of myClan.members) {
        const row = document.createElement('div');
        const isLeader = m.uid === myClan.leader;
        row.style.cssText = 'padding:6px 10px;margin-bottom:3px;background:rgba(255,255,255,0.03);border-radius:4px;font-size:13px;';
        row.innerHTML = `${isLeader ? '👑 ' : ''}${m.name}${m.uid === uid ? ' (you)' : ''}`;
        content.appendChild(row);
      }

      // Invite input
      if (myClan.leader === uid && myClan.members.length < 10) {
        const invDiv = document.createElement('div');
        invDiv.style.cssText = 'margin-top:12px;';
        invDiv.innerHTML = `<input type="text" id="clan-invite-uid" placeholder="Player UID to invite" style="width:100%;padding:8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:13px;margin-bottom:8px"><button class="btn btn-primary" style="font-size:12px">Invite</button>`;
        invDiv.querySelector('.btn').addEventListener('click', async () => {
          const toUid = document.getElementById('clan-invite-uid').value.trim();
          if (toUid) {
            await inviteToClan(myClan.clanId, myClan.name, uid, displayName, toUid);
            invDiv.querySelector('.btn').textContent = 'Invited!';
          }
        });
        content.appendChild(invDiv);
      }

      // Leave button
      const leaveBtn = document.createElement('button');
      leaveBtn.className = 'btn btn-secondary';
      leaveBtn.style.cssText = 'margin-top:12px;';
      leaveBtn.textContent = 'Leave Clan';
      leaveBtn.addEventListener('click', async () => {
        await leaveClan(myClan.clanId, uid);
        economy.clanId = null;
        economy.save();
        this.showClan(uid, displayName, economy);
      });
      content.appendChild(leaveBtn);
    } else {
      // Create clan form
      const form = document.createElement('div');
      form.innerHTML = `
        <h3 style="color:var(--accent-gold);font-size:14px;margin-bottom:8px">Create a Clan</h3>
        <input type="text" id="clan-name-input" placeholder="Clan Name (2-20 chars)" style="width:100%;padding:8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:14px;margin-bottom:8px">
        <input type="text" id="clan-tag-input" placeholder="Tag (3-4 chars, e.g. APEX)" maxlength="4" style="width:100%;padding:8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:14px;margin-bottom:8px">
        <button class="btn btn-primary" id="btn-create-clan">Create Clan</button>
        <div id="clan-create-error" style="color:#ff4444;font-size:12px;margin-top:6px"></div>
      `;
      content.appendChild(form);
      document.getElementById('btn-create-clan').addEventListener('click', async () => {
        const name = document.getElementById('clan-name-input').value.trim();
        const tag = document.getElementById('clan-tag-input').value.trim();
        const result = await createClan(uid, displayName, name, tag);
        if (result.error) {
          document.getElementById('clan-create-error').textContent = result.error;
        } else {
          economy.clanId = result.clanId;
          economy.save();
          this.showClan(uid, displayName, economy);
        }
      });
    }

    this.showScreen('clan');
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
