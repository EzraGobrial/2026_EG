// ═══════════════════════════════════════════════
// Gary's Life — UI System
// Menu screens: title, morning, results, shop, sleep, win
// ═══════════════════════════════════════════════

import { Economy, BIRDS, RARITY_COLORS, DIMENSIONS, WEAPONS, BANNERS, TAGS, CONSUMABLES, WEAPON_SKINS, PETS, GEAR, RANKS, MAX_WEAPON_LEVEL, PET_RARITIES, MYSTERY_BOXES, PET_BOOSTS, BATTLE_PASS, BP_MAX_TIER, TICKET_SHOP, fmtMoney, fmtNum } from './economy.js';

/**
 * Generate HTML for a rank badge (CSS-styled, not emoji)
 * @param {number} level - Rank level (1-5)
 * @param {boolean} large - Whether to use large variant (for morning screen)
 */
function getRankBadgeHTML(level, large = false) {
  const wrap = large ? 'rank-badge-large' : '';

  switch (level) {
    case 1: // Bronze
      return `<span class="rank-badge ${wrap}" title="Bronze"><div class="rank-badge-medal rank-badge-bronze"><span class="medal-star">★</span></div></span>`;
    case 2: // Silver
      return `<span class="rank-badge ${wrap}" title="Silver"><div class="rank-badge-medal rank-badge-silver"><span class="medal-star">★</span></div></span>`;
    case 3: // Gold
      return `<span class="rank-badge ${wrap}" title="Gold"><div class="rank-badge-medal rank-badge-gold"><span class="medal-star">★</span></div></span>`;
    case 4: // Diamond
      return `<span class="rank-badge ${wrap}" title="Diamond"><span class="rank-badge-diamond-wrap"><div class="rank-badge-diamond"></div></span></span>`;
    case 5: // Savage
      return `<span class="rank-badge ${wrap}" title="Savage"><div class="rank-badge-apex"><div class="rank-badge-apex-points"><div class="rank-badge-apex-point"></div><div class="rank-badge-apex-point"></div><div class="rank-badge-apex-point"></div><div class="rank-badge-apex-point"></div><div class="rank-badge-apex-point"></div></div><div class="rank-badge-apex-base"><div class="rank-badge-apex-gem"></div></div></div></span>`;
    default:
      return '';
  }
}

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
      win: document.getElementById('screen-win'),
      settings: document.getElementById('screen-settings'),
      credits: document.getElementById('screen-credits')
    };

    this.pauseOverlay = document.getElementById('pause-overlay');

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
    this.onResume = null;
    this.onQuitToTitle = null;
    this.onPauseSettings = null;
    this.onPauseCredits = null;
    this.onTitleSettings = null;
    this.onTitleCredits = null;
    this.onSettingsBack = null;
    this.onCreditsBack = null;
    this.onSettingChange = null;
    this.onFullscreenToggle = null;

    this._bindButtons();
    this._bindAuth();
    this._bindLocker();
    this._bindPauseAndSettings();
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

    // Title screen — Settings & Credits
    bind('btn-title-settings', () => { this.audio.playUIClick(); if (this.onTitleSettings) this.onTitleSettings(); });
    bind('btn-title-credits', () => { this.audio.playUIClick(); if (this.onTitleCredits) this.onTitleCredits(); });
  }

  // ─── Pause Menu, Settings & Credits ─────────

  _bindPauseAndSettings() {
    const bind = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', fn);
      else console.warn(`UI: button #${id} not found`);
    };

    // Pause overlay buttons
    bind('btn-resume', () => { this.audio.playUIClick(); if (this.onResume) this.onResume(); });
    bind('btn-pause-settings', () => { this.audio.playUIClick(); if (this.onPauseSettings) this.onPauseSettings(); });
    bind('btn-pause-credits', () => { this.audio.playUIClick(); if (this.onPauseCredits) this.onPauseCredits(); });
    bind('btn-quit-to-title', () => { this.audio.playUIClick(); if (this.onQuitToTitle) this.onQuitToTitle(); });

    // Settings screen
    bind('btn-settings-back', () => { this.audio.playUIClick(); if (this.onSettingsBack) this.onSettingsBack(); });
    bind('btn-settings-fullscreen', () => { this.audio.playUIClick(); if (this.onFullscreenToggle) this.onFullscreenToggle(); });

    const volSlider = document.getElementById('setting-volume');
    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        document.getElementById('setting-volume-value').textContent = `${Math.round(v * 100)}%`;
        if (this.onSettingChange) this.onSettingChange('masterVolume', v);
      });
    }

    const sensSlider = document.getElementById('setting-sensitivity');
    if (sensSlider) {
      sensSlider.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        document.getElementById('setting-sensitivity-value').textContent = `${v.toFixed(1)}x`;
        if (this.onSettingChange) this.onSettingChange('mouseSensitivity', v);
      });
    }

    const qualitySelect = document.getElementById('setting-quality');
    if (qualitySelect) {
      qualitySelect.addEventListener('change', (e) => {
        if (this.onSettingChange) this.onSettingChange('graphicsQuality', e.target.value);
      });
    }

    // Credits screen
    bind('btn-credits-back', () => { this.audio.playUIClick(); if (this.onCreditsBack) this.onCreditsBack(); });
  }

  showPauseOverlay() {
    if (this.pauseOverlay) this.pauseOverlay.classList.remove('hidden');
    this._updateSettingsDot();
    this._setupEndHuntButton();
    // "End the Hunt" only applies when paused mid-hunt (HUD is visible)
    const endBtn = document.getElementById('btn-end-hunt');
    if (endBtn) {
      const hud = document.getElementById('hud');
      const inHunt = hud && !hud.classList.contains('hidden');
      endBtn.style.display = inHunt ? '' : 'none';
    }
  }

  _setupEndHuntButton() {
    if (document.getElementById('btn-end-hunt')) return;
    const panel = this.pauseOverlay && this.pauseOverlay.querySelector('.pause-panel');
    if (!panel) return;
    const btn = document.createElement('button');
    btn.id = 'btn-end-hunt';
    btn.className = 'btn btn-secondary';
    btn.textContent = 'End the Hunt';
    const resume = document.getElementById('btn-resume');
    if (resume) resume.after(btn); else panel.appendChild(btn);
    btn.addEventListener('click', () => {
      this.audio.playUIClick();
      if (this.onEndHunt) this.onEndHunt();
    });
  }

  hidePauseOverlay() {
    if (this.pauseOverlay) this.pauseOverlay.classList.add('hidden');
  }

  isSubScreenOpen() {
    const settingsOpen = this.screens.settings && !this.screens.settings.classList.contains('hidden');
    const creditsOpen = this.screens.credits && !this.screens.credits.classList.contains('hidden');
    return !!(settingsOpen || creditsOpen);
  }

  showSettings(values) {
    this.showScreen('settings');
    // Opening Settings clears the "new" notification dot for this player (persisted)
    if (this._settings) this._settings.set('seenSettings', true);
    this._updateSettingsDot();
    const volSlider = document.getElementById('setting-volume');
    const sensSlider = document.getElementById('setting-sensitivity');
    const qualitySelect = document.getElementById('setting-quality');
    if (volSlider) {
      volSlider.value = values.masterVolume;
      document.getElementById('setting-volume-value').textContent = `${Math.round(values.masterVolume * 100)}%`;
    }
    if (sensSlider) {
      sensSlider.value = values.mouseSensitivity;
      document.getElementById('setting-sensitivity-value').textContent = `${values.mouseSensitivity.toFixed(1)}x`;
    }
    if (qualitySelect) {
      qualitySelect.value = values.graphicsQuality;
    }
    this._renderDeviceSetting(values);
  }

  _renderDeviceSetting(values) {
    const panel = this.screens.settings && this.screens.settings.querySelector('.settings-panel');
    if (!panel) return;
    const settings = this._settings;
    const seen = settings ? settings.get('seenDevices') : true;
    const device = (values && values.deviceType) || (settings && settings.get('deviceType')) || 'school';

    const old = document.getElementById('setting-device-row');
    if (old) old.remove();

    const row = document.createElement('div');
    row.id = 'setting-device-row';
    row.className = 'settings-row';
    if (!seen) {
      row.style.cssText = 'border:1px solid var(--accent-gold);border-radius:8px;padding:8px;box-shadow:0 0 14px rgba(212,168,83,0.7)';
    }
    row.innerHTML =
      '<label>Device' + (seen ? '' : ' <span style="color:#ff3b30;font-size:11px;font-weight:700">● NEW</span>') + '</label>' +
      '<div class="settings-control" style="display:flex;gap:8px">' +
        '<button id="device-school" class="btn btn-secondary" style="flex:1;margin:0">School Device</button>' +
        '<button id="device-other" class="btn btn-secondary" style="flex:1;margin:0">Other</button>' +
      '</div>';
    const backBtn = document.getElementById('btn-settings-back');
    if (backBtn && backBtn.parentNode === panel) panel.insertBefore(row, backBtn);
    else panel.appendChild(row);

    const paint = (d) => {
      [['device-school', 'school'], ['device-other', 'other']].forEach(([id, val]) => {
        const b = document.getElementById(id);
        if (!b) return;
        b.style.opacity = (d === val) ? '1' : '0.45';
        b.style.outline = (d === val) ? '2px solid var(--accent-gold)' : 'none';
      });
    };
    paint(device);
    const choose = (d) => {
      paint(d);
      if (this.onSettingChange) this.onSettingChange('deviceType', d);
    };
    const schoolBtn = document.getElementById('device-school');
    const otherBtn = document.getElementById('device-other');
    if (schoolBtn) schoolBtn.onclick = () => choose('school');
    if (otherBtn) otherBtn.onclick = () => choose('other');

    // Opening the Settings screen counts as discovering the new Devices option
    if (settings && !seen) settings.set('seenDevices', true);
    this._updateSettingsDot();
  }

  _updateSettingsDot() {
    const show = this._settings ? !this._settings.get('seenSettings') : false;
    ['btn-title-settings', 'btn-pause-settings'].forEach(id => {
      const btn = document.getElementById(id);
      if (!btn) return;
      let dot = btn.querySelector('.settings-dot');
      if (show) {
        if (!dot) {
          dot = document.createElement('span');
          dot.className = 'settings-dot';
          dot.style.cssText = 'position:absolute;top:-5px;right:-5px;width:11px;height:11px;background:#ff3b30;border-radius:50%;box-shadow:0 0 6px #ff3b30;pointer-events:none';
          btn.style.position = 'relative';
          btn.appendChild(dot);
        }
      } else if (dot) {
        dot.remove();
      }
    });
  }

  showCredits() {
    this.showScreen('credits');
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
    const loginBtn = document.getElementById('btn-login');
    loginBtn.addEventListener('click', async () => {
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;
      if (!this.onLogin) return;
      loginBtn.disabled = true;
      const origText = loginBtn.textContent;
      loginBtn.textContent = 'Logging in...';
      try {
        await this.onLogin(username, password);
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = origText;
      }
    });

    // Signup
    const signupBtn = document.getElementById('btn-signup');
    signupBtn.addEventListener('click', async () => {
      const username = document.getElementById('signup-username').value;
      const password = document.getElementById('signup-password').value;
      const confirm = document.getElementById('signup-confirm').value;
      if (!this.onSignup) return;
      signupBtn.disabled = true;
      const origText = signupBtn.textContent;
      signupBtn.textContent = 'Signing up...';
      try {
        await this.onSignup(username, password, confirm);
      } finally {
        signupBtn.disabled = false;
        signupBtn.textContent = origText;
      }
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
    this._updateSettingsDot();
  }

  showScreen(name) {
    for (const el of Object.values(this.screens)) {
      if (el) el.classList.add('hidden');
    }
    if (this.screens[name]) {
      const el = this.screens[name];
      el.classList.remove('screen-fade-in');
      el.classList.remove('hidden');
      // Defer adding the animation class so the browser has a frame to register the unhide
      requestAnimationFrame(() => el.classList.add('screen-fade-in'));
    }
  }

  // ─── Toast Notifications ─────────────────────

  toast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    container.appendChild(el);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add('show'));
    });
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 200);
    }, 2200);
  }

  // ─── Controls Hint ───────────────────────────

  showControlsHint() {
    if (localStorage.getItem('gl_seen_controls')) return;
    const el = document.getElementById('controls-hint');
    if (!el) return;
    el.classList.remove('hidden');
    const dismiss = () => {
      localStorage.setItem('gl_seen_controls', '1');
      el.classList.add('fade-out');
      setTimeout(() => el.classList.add('hidden'), 320);
      el.removeEventListener('click', dismiss);
    };
    el.addEventListener('click', dismiss);
    setTimeout(dismiss, 6000);
  }

  hideControlsHint() {
    const el = document.getElementById('controls-hint');
    if (el) el.classList.add('hidden');
  }

  hideAll() {
    for (const el of Object.values(this.screens)) {
      if (el) el.classList.add('hidden');
    }
  }

  // ─── Morning Screen ─────────────────────────

  _setupMorningLayout() {
    const panel = document.querySelector('#screen-morning .challenges-panel');
    if (!panel || panel.dataset.huntLayout === '1') return;
    const huntBtn = document.getElementById('btn-hunt');
    if (!huntBtn) return;

    // Right panel becomes a fixed-height column: scrolling content + pinned button
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.maxHeight = '85vh';

    const title = panel.querySelector('.panel-title');
    const scroll = document.createElement('div');
    scroll.id = 'challenges-scroll';
    scroll.style.cssText = 'flex:1 1 auto;overflow-y:auto;min-height:0;padding-right:6px';

    // Move everything except the title and the hunt button into the scroll area
    Array.from(panel.children).forEach(ch => {
      if (ch === title || ch === huntBtn) return;
      scroll.appendChild(ch);
    });
    if (title) title.after(scroll); else panel.prepend(scroll);

    // Pinned footer that always shows the Go Hunting button
    const footer = document.createElement('div');
    footer.id = 'hunt-footer';
    footer.style.cssText = 'flex:0 0 auto;border-top:1px solid rgba(212,168,83,0.25);margin-top:12px;padding-top:12px';
    huntBtn.style.marginTop = '0';
    huntBtn.style.width = '100%';
    footer.appendChild(huntBtn);
    panel.appendChild(footer);

    panel.dataset.huntLayout = '1';
  }

  _setupEscHint() {
    if (this._escHintReady) return;
    this._escHintReady = true;
    let hint = document.getElementById('esc-pause-hint');
    if (!hint) {
      hint = document.createElement('div');
      hint.id = 'esc-pause-hint';
      hint.style.cssText = 'position:fixed;top:52px;right:16px;z-index:60;display:none;padding:6px 12px;background:rgba(26,20,16,0.72);border:1px solid rgba(212,168,83,0.4);border-radius:8px;color:#f5e6d0;font-family:Outfit,sans-serif;font-size:12px;font-weight:600;pointer-events:none;backdrop-filter:blur(4px)';
      hint.innerHTML = 'Press <span style="display:inline-block;padding:1px 6px;margin:0 2px;background:rgba(212,168,83,0.25);border:1px solid rgba(212,168,83,0.55);border-radius:4px;font-weight:700">ESC</span> to pause';
      document.body.appendChild(hint);
    }
    // Show whenever the player is in first-person gameplay (pointer locked)
    document.addEventListener('pointerlockchange', () => {
      hint.style.display = document.pointerLockElement ? 'block' : 'none';
    });
  }

  showMorning() {
    this._setupMorningLayout();
    this._setupEscHint();
    const eco = this.economy;
    document.getElementById('morning-day').textContent = `Day ${eco.day}`;
    document.getElementById('morning-money').textContent = fmtMoney(eco.money);
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
      rankEl.style.cssText = 'margin-top:8px;margin-bottom:16px;text-align:center;';
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
    rankEl.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:4px">
        ${getRankBadgeHTML(rank.level, true)}
        <span style="color:${rank.color};font-weight:700;font-size:16px">${rank.name}</span>
        <span style="color:var(--text-secondary);font-size:12px">${eco.xp} XP</span>
      </div>
      ${xpInfo.needed > 0 ? `<div style="width:120px;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;margin:4px auto 0;overflow:hidden"><div style="height:100%;background:${rank.color};width:${xpInfo.progress * 100}%;border-radius:2px;transition:width 0.3s"></div></div>` : '<div style="font-size:11px;color:var(--accent-gold);margin-top:4px">MAX RANK</div>'}
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
        if (loc.isBoss || loc.cost === undefined) continue; // boss arenas aren't selectable locations

        const card = document.createElement('div');
        card.className = 'location-card';

        if (!loc.unlocked) {
          card.classList.add('locked');
          card.innerHTML = `
            <div class="loc-name">${loc.name}</div>
            <div class="loc-info">Locked — ${fmtMoney(loc.cost)}</div>
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

    // ─── Daily Challenges Panel (right side) ───
    eco.refreshChallenges();
    const challenges = eco.dailyChallenges || [];
    const completedCount = challenges.filter(c => c.completed).length;
    const allDone = completedCount === challenges.length && challenges.length > 0;

    // Date display
    const dateEl = document.getElementById('challenges-date');
    if (dateEl) {
      const now = new Date();
      dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }

    // Challenge list
    const listEl = document.getElementById('challenges-list');
    if (listEl) {
      listEl.innerHTML = '';
      for (const c of challenges) {
        const item = document.createElement('div');
        item.className = `challenge-item${c.completed ? ' completed' : ''}`;
        item.innerHTML = `
          <div class="challenge-check${c.completed ? ' done' : ''}">${c.completed ? '✓' : ''}</div>
          <div class="challenge-desc">${c.desc}</div>
          <div class="challenge-reward">+$${c.reward}</div>
        `;
        listEl.appendChild(item);
      }
    }

    // Progress dots + line + chest
    const dotsEl = document.getElementById('challenge-dots');
    if (dotsEl) {
      dotsEl.innerHTML = '';
      for (let i = 0; i < challenges.length; i++) {
        // Fill the first N segments by completed COUNT, not by which quest — so
        // line 1 fills first, then 2, then 3, regardless of completion order.
        const filled = i < completedCount;
        // Dot
        const dot = document.createElement('div');
        dot.className = `challenge-dot${filled ? ' filled' : ''}`;
        dotsEl.appendChild(dot);
        // Line after dot (except last)
        const line = document.createElement('div');
        line.className = `challenge-dot-line${filled ? ' filled' : ''}`;
        dotsEl.appendChild(line);
      }
    }

    // Chest state
    const chestEl = document.getElementById('challenge-chest');
    if (chestEl) {
      chestEl.className = 'challenge-chest';
      if (eco.challengeChestClaimed) {
        chestEl.classList.add('claimed');
        chestEl.querySelector('.chest-icon').textContent = '✅';
        chestEl.querySelector('.chest-label').textContent = 'Claimed';
      } else if (allDone) {
        chestEl.classList.add('ready');
      }
    }

    // Claim button
    const rewardArea = document.getElementById('challenge-reward-area');
    if (rewardArea) {
      rewardArea.innerHTML = '';
      if (allDone && !eco.challengeChestClaimed) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-primary';
        btn.style.cssText = 'font-size:13px;padding:8px 20px;';
        btn.textContent = '🎁 Claim Chest — $200';
        btn.addEventListener('click', () => {
          this.audio.playCashRegister();
          const reward = eco.claimChallengeChest();
          if (reward > 0) {
            btn.textContent = `Claimed! +$${reward}`;
            btn.disabled = true;
            document.getElementById('morning-money').textContent = fmtMoney(eco.money);
            if (chestEl) {
              chestEl.className = 'challenge-chest claimed';
              chestEl.querySelector('.chest-icon').textContent = '✅';
              chestEl.querySelector('.chest-label').textContent = 'Claimed';
            }
          }
        });
        rewardArea.appendChild(btn);
      } else if (eco.challengeChestClaimed) {
        rewardArea.innerHTML = '<div style="font-size:12px;color:var(--accent-green)">Chest claimed! New challenges tomorrow.</div>';
      } else {
        rewardArea.innerHTML = `<div style="font-size:12px;color:var(--text-muted)">${completedCount}/${challenges.length} completed</div>`;
      }
    }

    // ─── Equip Potions / Boosts (under Daily Challenges) ───
    const potionsEl = document.getElementById('morning-potions');
    if (potionsEl) {
      const ownedConsumables = eco.ownedConsumables || {};
      const activeConsumables = eco.activeConsumables || [];
      const ownedEntries = Object.entries(ownedConsumables).filter(([, count]) => count > 0);

      if (ownedEntries.length === 0) {
        potionsEl.innerHTML = '';
      } else {
        potionsEl.innerHTML = '<h3 class="potions-title">Potions &amp; Boosts</h3>';

        const durationLabel = (cons) => cons.duration === 'half' ? 'First Half' : 'Whole Hunt';

        // Potions: only one may be equipped at a time
        const potionEntries = ownedEntries.filter(([key]) => CONSUMABLES[key] && CONSUMABLES[key].category === 'potion');
        if (potionEntries.length > 0) {
          const group = document.createElement('div');
          group.className = 'potions-group';
          group.innerHTML = '<div class="potions-group-label">Potions (equip one)</div>';
          for (const [key, count] of potionEntries) {
            const cons = CONSUMABLES[key];
            const isActive = activeConsumables.includes(key);
            const row = document.createElement('div');
            row.className = `potion-item${isActive ? ' equipped' : ''}`;
            row.innerHTML = `
              <div class="potion-info">
                <span class="potion-name">${cons.name}${cons.tier ? `<span class="potion-tier">Tier ${cons.tier}</span>` : ''}</span>
                <span class="potion-desc">${cons.desc}</span>
                <span class="potion-duration">${durationLabel(cons)} · x${count}</span>
              </div>
              <button class="btn-potion-equip">${isActive ? 'Equipped' : 'Equip'}</button>
            `;
            const btn = row.querySelector('.btn-potion-equip');
            btn.addEventListener('click', () => {
              this.audio.playUIClick();
              if (isActive) {
                eco.unequipConsumable(key);
              } else {
                eco.useConsumable(key);
              }
              this.showMorning();
            });
            group.appendChild(row);
          }
          potionsEl.appendChild(group);
        }

        // Boosts: stack freely, no exclusivity
        const boostEntries = ownedEntries.filter(([key]) => CONSUMABLES[key] && CONSUMABLES[key].category === 'boost');
        if (boostEntries.length > 0) {
          const group = document.createElement('div');
          group.className = 'potions-group';
          group.innerHTML = '<div class="potions-group-label">Boosts</div>';
          for (const [key, count] of boostEntries) {
            const cons = CONSUMABLES[key];
            const isActive = activeConsumables.includes(key);
            const row = document.createElement('div');
            row.className = `potion-item${isActive ? ' equipped' : ''}`;
            row.innerHTML = `
              <div class="potion-info">
                <span class="potion-name">${cons.name}</span>
                <span class="potion-desc">${cons.desc}</span>
                <span class="potion-duration">${durationLabel(cons)} · x${count}</span>
              </div>
              <button class="btn-potion-equip">${isActive ? 'Equipped' : 'Equip'}</button>
            `;
            if (!isActive) {
              const btn = row.querySelector('.btn-potion-equip');
              btn.addEventListener('click', () => {
                this.audio.playUIClick();
                eco.useConsumable(key);
                this.showMorning();
              });
            } else {
              row.querySelector('.btn-potion-equip').disabled = true;
            }
            group.appendChild(row);
          }
          potionsEl.appendChild(group);
        }
      }
    }

    // Rotating tip
    const tips = [
      'Headshots on birds pay more — aim carefully!',
      'Combos multiply your payout. Hit birds back to back for a bonus.',
      'Visit the Market in-game to browse special stalls.',
      'Upgrade your weapon to take down rarer, higher-value birds.',
      'Potions can double your birds or boost your luck — buy them in the Potions stall.',
      'Complete Daily Challenges for bonus rewards.',
      'Unlock new locations to find rarer bird species.',
      'Right-click to aim down sights for better accuracy.',
      'Reload (R) before entering a new area — don\'t get caught empty!',
      'Banners and Tags are cosmetic — show off your style.',
    ];
    const tipEl = document.getElementById('morning-tip-box');
    if (tipEl) {
      const tip = tips[(this.economy.day - 1) % tips.length];
      tipEl.innerHTML = `<div class="morning-tip-label">💡 Tip</div>${tip}`;
    }

    this.showScreen('morning');
  }

  // ─── Results Screen ─────────────────────────

  _setupResultsButtons() {
    const panel = this.screens.results && this.screens.results.querySelector('.results-panel');
    if (!panel || document.getElementById('results-actions')) return;
    // Lay the action buttons out in a compact 2-column grid (pairs side by side),
    // with "Skip to Sleep" spanning the full width at the bottom.
    const grid = document.createElement('div');
    grid.id = 'results-actions';
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px';
    ['btn-to-shop', 'btn-to-locker', 'btn-trade', 'btn-friends', 'btn-tournament', 'btn-clan', 'btn-skip-shop'].forEach(id => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.style.width = 'auto';
      btn.style.margin = '0';
      if (id === 'btn-skip-shop') btn.style.gridColumn = '1 / -1';
      grid.appendChild(btn);
    });
    panel.appendChild(grid);
  }

  renderBattlePass() {
    const eco = this.economy;
    const host = document.getElementById('battlepass-section');
    if (!host) return;
    const tier = eco.bpTier();
    const prog = eco.bpProgress();
    const pct = prog.need ? Math.min(100, Math.round(prog.into / prog.need * 100)) : 100;
    const premium = !!eco.premiumPass;
    const rdisp = (r) => {
      if (!r) return '';
      if (r.type === 'money') return '$' + (r.amount >= 1000000 ? +(r.amount / 1000000).toFixed(2) + 'M' : r.amount.toLocaleString());
      if (r.type === 'box') return 'Box ' + (r.box === 1 ? 'I' : r.box === 2 ? 'II' : 'III');
      return r.label || '';
    };
    let cols = '';
    for (let t = 1; t <= BP_MAX_TIER; t++) {
      const pr = BATTLE_PASS.premium[t - 1];
      const fr = BATTLE_PASS.free[t - 1];
      const isCur = (t === tier);
      const pClaimed = eco.bpIsClaimed(t, 'premium');
      const pCan = eco.bpCanClaim(t, 'premium');
      const pState = pClaimed ? 'claimed' : (t <= tier ? 'unlocked' : 'locked');
      const pClaim = pCan ? ('<button class="bp-claim" data-bp-tier="' + t + '" data-bp-track="premium">Claim</button>') : (pClaimed ? '<div class="bp-claimed-tag">Claimed</div>' : '');
      const fClaimed = eco.bpIsClaimed(t, 'free');
      const fCan = eco.bpCanClaim(t, 'free');
      const fState = fClaimed ? 'claimed' : (t <= tier ? 'unlocked' : 'locked');
      const fClaim = fCan ? ('<button class="bp-claim" data-bp-tier="' + t + '" data-bp-track="free">Claim</button>') : (fClaimed ? '<div class="bp-claimed-tag">Claimed</div>' : '');
      cols +=
        '<div class="bp-col' + (isCur ? ' bp-current' : '') + '" data-bp-col="' + t + '">' +
          '<div class="bp-cell bp-prem bp-' + pState + (premium ? '' : ' bp-noprem') + ' bp-type-' + pr.type + '">' +
            '<div class="bp-reward">' + rdisp(pr) + '</div>' + pClaim +
          '</div>' +
          '<div class="bp-tiernum">' + t + '</div>' +
          '<div class="bp-cell bp-free bp-' + fState + ' bp-type-' + fr.type + '">' +
            '<div class="bp-reward">' + rdisp(fr) + '</div>' + fClaim +
          '</div>' +
        '</div>';
    }
    const premBtn = premium
      ? '<div class="bp-premium-status">\u2605 Premium Active</div>'
      : '<div class="bp-share-wrap"><span class="bp-share-text">Share with 5 friends to unlock Premium &mdash; ' + (eco.referralCount || 0) + '/5 joined</span><span class="bp-share-warn">Invite real friends only. Fake or one-time accounts are detected and your Premium (and its rewards) will be removed.</span><button id="bp-go-premium" class="bp-premium-btn">Share My Link</button></div>';
    const SEASON_END = new Date('2026-09-01T00:00:00').getTime();
    const daysLeft = Math.max(0, Math.ceil((SEASON_END - Date.now()) / 86400000));
    host.innerHTML =
      '<div class="bp-seasonbar"><span class="bp-season">Season 1 \u00b7 First Flight</span><span class="bp-countdown">Season ends in ' + daysLeft + ' days</span></div>' +
      '<div class="bp-header">' +
        '<div class="bp-titlewrap"><span class="bp-title">Battle Pass</span><span class="bp-tier-badge">Tier ' + tier + '</span></div>' +
        '<div class="bp-xpwrap"><div class="bp-xpbar"><div class="bp-xpfill" style="width:' + pct + '%"></div></div>' +
        '<span class="bp-xptext">' + (prog.need ? (prog.into + ' / ' + prog.need + ' XP') : 'MAX') + '</span></div>' +
        premBtn +
      '</div>' +
      '<div class="bp-rowlabels"><span class="bp-rowlabel bp-rowlabel-prem">PREMIUM</span><span class="bp-rowlabel bp-rowlabel-free">FREE</span></div>' +
      '<div class="bp-scroll"><div class="bp-columns">' + cols + '</div></div>';
    host.querySelectorAll('.bp-claim').forEach(btn => {
      btn.addEventListener('click', () => {
        const tt = parseInt(btn.getAttribute('data-bp-tier'), 10);
        const tk = btn.getAttribute('data-bp-track');
        const res = eco.bpClaim(tt, tk);
        if (res && res.ok) {
          if (this.audio && this.audio.playCashRegister) this.audio.playCashRegister();
          this.renderBattlePass();
        }
      });
    });
    const gp = document.getElementById('bp-go-premium');
    if (gp) gp.addEventListener('click', () => this._goPremium());
    const scroll = host.querySelector('.bp-scroll');
    if (scroll) {
      requestAnimationFrame(() => {
        const target = host.querySelector('.bp-col[data-bp-col="' + Math.max(1, tier - 1) + '"]') || host.querySelector('.bp-col[data-bp-col="' + tier + '"]');
        if (!target) return;
        const sRect = scroll.getBoundingClientRect();
        const tRect = target.getBoundingClientRect();
        scroll.scrollLeft += (tRect.left - sRect.left) - 8;
      });
    }
  }
  async _goPremium() {
    const link = this.economy.referralLink();
    try {
      if (navigator.share) {
        await navigator.share({ title: "Gary's Life", text: 'Play Gary\'s Life with me and help me unlock Premium!', url: link });
      } else {
        await navigator.clipboard.writeText(link);
        alert('Your invite link was copied! Share it with 5 friends:\n\n' + link);
      }
    } catch (e) {
      try { await navigator.clipboard.writeText(link); alert('Your invite link was copied!\n\n' + link); }
      catch (e2) { window.prompt('Copy your invite link:', link); }
    }
  }

  showResults(huntBag, displayName, xpEarned = 0) {
    this._setupResultsButtons();
    const summary = document.getElementById('results-summary');
    summary.innerHTML = '';

    let total = 0;
    const counts = {};

    for (const entry of huntBag) {
      const key = typeof entry === 'string' ? entry : entry.key;
      const combo = typeof entry === 'string' ? 1 : (entry.combo || 1);
      if (!counts[key]) counts[key] = { count: 0, totalValue: 0 };
      // Use pre-calculated earnedValue if available (no re-roll)
      const baseValue = (entry.earnedValue) ? entry.earnedValue : Math.round(BIRDS[key].value * (0.85 + Math.random() * 0.3));
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
          <span class="result-bird-price">${fmtMoney(data.totalValue)}</span>
        `;
        summary.appendChild(row);
      }
    }

    document.getElementById('results-total-money').textContent = fmtMoney(total);
    this.economy.money += total;
    this.economy.totalMoneyEarned += total;
    this.economy.huntBag = [];

    // Rank / XP progress section
    const rank = this.economy.getRank();
    const xpInfo = this.economy.getXPToNextRank();
    const xpSection = document.createElement('div');
    xpSection.style.cssText = 'margin-top:16px;padding:12px;background:rgba(255,255,255,0.05);border-radius:8px;text-align:center;';
    xpSection.innerHTML = `
      <div style="color:var(--text-secondary);font-size:12px;margin-bottom:4px">Rank Progress</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:4px">
        ${getRankBadgeHTML(rank.level, false)}
        <span style="color:${rank.color};font-weight:700;font-size:16px">${rank.name}</span>
      </div>
      <div style="color:var(--text-muted);font-size:11px;margin-top:4px">${this.economy.xp} XP</div>
      ${xpInfo.needed > 0 ? `<div style="width:120px;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;margin:6px auto 0;overflow:hidden"><div style="height:100%;background:${rank.color};width:${xpInfo.progress * 100}%;border-radius:2px;transition:width 0.3s"></div></div>` : '<div style="font-size:11px;color:var(--accent-gold);margin-top:4px">MAX RANK</div>'}
    `;
    summary.appendChild(xpSection);

    // Update leaderboard
    if (displayName) {
      this.economy.updateLeaderboard(displayName);
    }

    // Render leaderboard (async from Firestore)
    this._renderLeaderboard(displayName);

    this.showScreen('results');
    this.economy.qualifyReferral();
    this.economy.refreshReferrals().then(() => this.renderBattlePass());
    this.renderBattlePass();

    if (total > 0) {
      this.audio.playCashRegister();
    }
  }

  async _renderLeaderboard(currentUser) {
    const totalEl = document.getElementById('lb-total-earned');
    const currentEl = document.getElementById('lb-current-money');
    const streakEl = document.getElementById('lb-killstreak');
    const cols = [totalEl, currentEl, streakEl].filter(Boolean);

    cols.forEach(el => { el.innerHTML = '<div class="lb-empty">Loading...</div>'; });

    const { byCurrentMoney, byTotalEarned, byKillstreak } = await Economy.getLeaderboard();

    cols.forEach(el => { el.innerHTML = ''; });

    if (byTotalEarned.length === 0) {
      cols.forEach(el => { el.innerHTML = '<div class="lb-empty">No players yet</div>'; });
      return;
    }

    // Helper: build a scrollable leaderboard list and scroll to the current
    // player. `fmtVal` formats the right-hand value for that column.
    const buildList = (entries, container, valueKey, fmtVal) => {
      if (!container) return;
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
          rankBadge = getRankBadgeHTML(entry.rank, false);
        }

        // Banner accent
        let bannerStyle = '';
        if (entry.banner && BANNERS[entry.banner]) {
          bannerStyle = `border-left:3px solid ${BANNERS[entry.banner].color};padding-left:10px;`;
        }

        div.style.cssText += bannerStyle;
        div.innerHTML = `
          <span class="lb-rank">${i + 1}</span>
          <span class="lb-name">${rankBadge}${entry.name}${entry.tag ? ` <span style="display:inline-block;padding:1px 7px;margin-left:5px;border-radius:6px;font-size:10px;font-weight:800;letter-spacing:0.5px;vertical-align:middle;${TAGS[entry.tag] ? `color:${TAGS[entry.tag].textColor || TAGS[entry.tag].color};border:1px solid ${TAGS[entry.tag].color};background:${TAGS[entry.tag].color}22` : `color:var(--accent-gold);border:1px solid var(--accent-gold)`}">${TAGS[entry.tag] ? TAGS[entry.tag].name : 'OG'}</span>` : ''}${isYou ? ' (you)' : ''}</span>
          <span class="lb-money">${fmtVal(entry[valueKey])}</span>
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

    buildList(byTotalEarned, totalEl, 'totalEarned', v => fmtMoney(v));
    buildList(byCurrentMoney, currentEl, 'currentMoney', v => fmtMoney(v));
    buildList(byKillstreak, streakEl, 'killstreak', v => `${v} 🔥`);
  }

  // ─── Shop Screen ────────────────────────────

  _setupShopLayout() {
    const panel = document.querySelector('#screen-shop .shop-panel');
    if (!panel || panel.dataset.shopLayout === '1') return;
    const content = document.getElementById('shop-tab-content');
    if (!content) return;
    // Fixed-height column: header + tabs stay, tab content scrolls,
    // the Back / Go to Sleep buttons stay pinned and always visible.
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.maxHeight = '88vh';
    content.style.flex = '1 1 auto';
    content.style.overflowY = 'auto';
    content.style.minHeight = '0';
    panel.dataset.shopLayout = '1';
  }

  showShop(category) {
    // category is null when opened normally (full shop), or a stall category string
    this._shopCategory = category || null;
    this.showScreen('shop');
    this._setupShopLayout();

    try {
      const eco = this.economy;
      document.getElementById('shop-money').textContent = fmtMoney(eco.money);

      const dimHeader = document.getElementById('shop-dimension');
      if (dimHeader) {
        dimHeader.textContent = `Dimension ${eco.dimension} -- ${eco.getDimensionName()}`;
      }

      // In stall mode: hide the tab bar — only one category is visible
      const tabBar = document.querySelector('.shop-tabs');
      if (tabBar) tabBar.style.display = category ? 'none' : '';

      // Determine which tab to activate/render
      const tab = (category === 'locations') ? 'locations'
               : (category === 'banners')   ? 'banners'
               : (category === 'tags')      ? 'tags'
               : 'weapons';

      document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
      const activeTab = document.querySelector(`.shop-tab[data-shop-tab="${tab}"]`);
      if (activeTab) activeTab.classList.add('active');

      // Render dimension advance button
      this._renderDimensionAdvance();

      // Render tab (filtered by this._shopCategory inside _renderShopWeapons)
      this._renderShopTab(tab);

    } catch(e) { console.error('showShop error:', e); }
  }

  _renderShopTab(tab) {
    const content = document.getElementById('shop-tab-content');
    content.innerHTML = '';
    const advanceEl = document.getElementById('shop-advance-dim');
    if (advanceEl) advanceEl.style.display = (tab === 'locations') ? '' : 'none';
    if (tab === 'locations') this._renderDimensionAdvance();

    switch(tab) {
      case 'weapons': this._renderShopWeapons(content); break;
        case 'pets': this._renderShopPets(content); break;
      case 'tickets': this._renderShopTickets(content); break;
      case 'locations': this._renderShopLocations(content); break;
      case 'banners': this._renderShopBanners(content); break;
      case 'tags': this._renderShopTags(content); break;
      case 'quests': this._renderShopQuests(content); break;
    }
  }

  _renderShopWeapons(container) {
    const eco = this.economy;
    // When entered from a market stall, only show that stall's category
    const restrict = this._shopCategory || null; // 'weapons'|'skins'|'potions'|null
    const showWeapons  = !restrict || restrict === 'weapons';
    const showSkins    = !restrict || restrict === 'skins';
    const showPotions  = !restrict || restrict === 'potions';

    if (!showWeapons && !showSkins && !showPotions) return;

    const grid = document.createElement('div');
    grid.className = 'shop-grid';

    if (!showWeapons) {
      // Skip straight to the relevant section
    } else
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
        const maxed = upgradeLevel >= MAX_WEAPON_LEVEL;
        const canAffordUpgrade = eco.money >= upgradeCost;
        const stars = '\u2605'.repeat(upgradeLevel) + '\u2606'.repeat(Math.max(0, MAX_WEAPON_LEVEL - upgradeLevel));

        item.innerHTML = `
          <div class="shop-item-name">${weapon.name} <span style="color:var(--accent-gold);font-size:12px">${stars}</span></div>
          <div class="shop-item-desc">${weapon.description || ''}</div>
          <div class="shop-item-price">${isEquipped ? 'EQUIPPED' : 'OWNED'}</div>
          ${!maxed && weapon.cost > 0 ? `<button class="btn btn-upgrade ${canAffordUpgrade ? '' : 'cant-afford'}" style="margin-top:6px;font-size:11px;padding:4px 8px">Upgrade Lv${upgradeLevel + 1} \u2014 ${fmtMoney(upgradeCost)}</button>` : (maxed && weapon.cost > 0 ? '<div style="color:var(--accent-gold);font-size:11px;margin-top:4px">MAX LEVEL</div>' : '')}
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
              document.getElementById('shop-money').textContent = fmtMoney(eco.money);
              this._renderShopTab('weapons');
            }
          });
        }
      } else if (eco.money < weapon.cost) {
        item.classList.add('cant-afford');
        item.innerHTML = `
          <div class="shop-item-name">${weapon.name}</div>
          <div class="shop-item-desc">${weapon.description || ''}</div>
          <div class="shop-item-price">${fmtMoney(weapon.cost)}</div>
        `;
      } else {
        item.innerHTML = `
          <div class="shop-item-name">${weapon.name}</div>
          <div class="shop-item-desc">${weapon.description || ''}</div>
          <div class="shop-item-price">${fmtMoney(weapon.cost)}</div>
        `;
        item.addEventListener('click', () => {
          this.audio.playUIClick();
          if (eco.buyWeapon(key)) {
            this.audio.playCashRegister();
            this.toast(`✓ ${weapon.name} purchased!`, 'gold');
            document.getElementById('shop-money').textContent = fmtMoney(eco.money);
            this._renderShopTab('weapons');
          }
        });
      }
      grid.appendChild(item);
    }
    if (showWeapons) container.appendChild(grid);

    // Boosts + Potions section (only shown for potions stall or full shop)
    if (showPotions) {
      const boostHeader = document.createElement('h3');
      boostHeader.id = 'shop-section-boosts';
      boostHeader.style.cssText = 'color:var(--accent-gold);margin:20px 0 10px;font-size:14px;';
      boostHeader.textContent = 'Boosts';
      container.appendChild(boostHeader);

      const bGrid = document.createElement('div');
      bGrid.className = 'shop-grid';
      for (const [key, cons] of Object.entries(CONSUMABLES)) {
        if (cons.category !== 'boost') continue;
        const owned = eco.ownedConsumables[key] || 0;
        const item = document.createElement('div');
        item.className = `shop-item ${eco.money < cons.cost ? 'cant-afford' : ''}`;
        item.innerHTML = `
          <div class="shop-item-name">${cons.name}${owned > 0 ? ` <span style="color:var(--accent-gold)">(x${owned})</span>` : ''}</div>
          <div class="shop-item-desc">${cons.desc}</div>
          <div class="shop-item-price">${fmtMoney(cons.cost)}</div>
        `;
        if (eco.money >= cons.cost) {
          item.addEventListener('click', () => {
            this.audio.playUIClick();
            if (eco.buyConsumable(key)) {
              this.audio.playCashRegister();
              this.toast(`✓ ${cons.name} purchased!`, 'success');
              document.getElementById('shop-money').textContent = fmtMoney(eco.money);
              this._renderShopTab('weapons');
            }
          });
        }
        bGrid.appendChild(item);
      }
      container.appendChild(bGrid);

      const potionHeader = document.createElement('h3');
      potionHeader.id = 'shop-section-potions';
      potionHeader.style.cssText = 'color:var(--accent-gold);margin:20px 0 10px;font-size:14px;';
      potionHeader.textContent = 'Potions';
      container.appendChild(potionHeader);

      const pGrid = document.createElement('div');
      pGrid.className = 'shop-grid';
      for (const [key, cons] of Object.entries(CONSUMABLES)) {
        if (cons.category !== 'potion') continue;
        const owned = eco.ownedConsumables[key] || 0;
        const item = document.createElement('div');
        item.className = `shop-item ${eco.money < cons.cost ? 'cant-afford' : ''}`;
        const durationBadge = cons.duration === 'half' ? 'First Half' : 'Whole Hunt';
        const tierBadge = cons.tier ? `<span class="shop-tier-badge">Tier ${cons.tier}</span>` : '';
        item.innerHTML = `
          <div class="shop-item-name">${cons.name}${tierBadge}${owned > 0 ? ` <span style="color:var(--accent-gold)">(x${owned})</span>` : ''}</div>
          <div class="shop-item-desc">${cons.desc}</div>
          <div class="shop-item-duration">${durationBadge}</div>
          <div class="shop-item-price">${fmtMoney(cons.cost)}</div>
        `;
        if (eco.money >= cons.cost) {
          item.addEventListener('click', () => {
            this.audio.playUIClick();
            if (eco.buyConsumable(key)) {
              this.audio.playCashRegister();
              this.toast(`✓ ${cons.name} purchased!`, 'success');
              document.getElementById('shop-money').textContent = fmtMoney(eco.money);
              this._renderShopTab('weapons');
            }
          });
        }
        pGrid.appendChild(item);
      }
      container.appendChild(pGrid);
    }

    // Weapon Skins section (only shown for skins stall or full shop)
    if (showSkins) {
      const skinHeader = document.createElement('h3');
      skinHeader.id = 'shop-section-skins';
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
        <div class="shop-item-price">${owned ? 'OWNED' : fmtMoney(skin.cost)}</div>
      `;
      if (!owned && eco.money >= skin.cost) {
        item.addEventListener('click', () => {
          this.audio.playUIClick();
          if (eco.buyWeaponSkin(key)) {
            this.audio.playCashRegister();
            document.getElementById('shop-money').textContent = fmtMoney(eco.money);
            this._renderShopTab('weapons');
          }
        });
      }
      sGrid.appendChild(item);
    }
    container.appendChild(sGrid);
    } // end if (showSkins)

    // ─── Defensive Gear (anti-bird) — full shop only ───
    if (!restrict) {
      const gearHeader = document.createElement('h3');
      gearHeader.style.cssText = 'color:var(--accent-gold);margin:20px 0 10px;font-size:14px;';
      gearHeader.textContent = 'Defensive Gear';
      container.appendChild(gearHeader);

      const gGrid = document.createElement('div');
      gGrid.className = 'shop-grid';
      for (const [key, g] of Object.entries(GEAR)) {
        const owned = eco.ownedGear.includes(key);
        const item = document.createElement('div');
        item.className = `shop-item ${owned ? 'owned' : (eco.money < g.cost ? 'cant-afford' : '')}`;
        item.innerHTML = `
          <div class="shop-item-name">${g.name}</div>
          <div class="shop-item-desc">${g.desc}</div>
          <div class="shop-item-price">${owned ? 'OWNED' : fmtMoney(g.cost)}</div>
        `;
        if (!owned && eco.money >= g.cost) {
          item.addEventListener('click', () => {
            this.audio.playUIClick();
            if (eco.buyGear(key)) {
              this.audio.playCashRegister();
              this.toast(`✓ ${g.name} purchased!`, 'gold');
              document.getElementById('shop-money').textContent = fmtMoney(eco.money);
              this._renderShopTab('weapons');
            }
          });
        }
        gGrid.appendChild(item);
      }
      container.appendChild(gGrid);

      // ─── Companions (prestige pets) ───
      const petHeader = document.createElement('h3');
      petHeader.style.cssText = 'color:var(--accent-gold);margin:20px 0 10px;font-size:14px;';
      petHeader.textContent = 'Companions';
      container.appendChild(petHeader);

      const petGrid = document.createElement('div');
      petGrid.className = 'shop-grid';
      for (const [key, pet] of Object.entries(PETS)) {
        const owned = eco.ownedPets.includes(key);
        const isActive = eco.activePet === key;
        const item = document.createElement('div');
        item.className = `shop-item ${owned ? 'owned' : (eco.money < pet.cost ? 'cant-afford' : '')}`;
        item.innerHTML = `
          <div class="shop-item-name">${pet.name}</div>
          <div class="shop-item-desc">${pet.desc}</div>
          <div class="shop-item-price">${owned ? (isActive ? 'EQUIPPED' : 'EQUIP') : fmtMoney(pet.cost)}</div>
        `;
        if (!owned && eco.money >= pet.cost) {
          item.addEventListener('click', () => {
            this.audio.playUIClick();
            if (eco.buyPet(key)) {
              eco.equipPet(key);
              this.audio.playCashRegister();
              this.toast(`✓ ${pet.name} purchased!`, 'gold');
              document.getElementById('shop-money').textContent = fmtMoney(eco.money);
              this._renderShopTab('weapons');
            }
          });
        } else if (owned && !isActive) {
          item.style.cursor = 'pointer';
          item.addEventListener('click', () => {
            this.audio.playUIClick();
            eco.equipPet(key);
            this._renderShopTab('weapons');
          });
        }
        petGrid.appendChild(item);
      }
      container.appendChild(petGrid);
    }
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
        if (loc.isBoss || loc.cost === undefined) continue; // boss arenas aren't purchasable shop items

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
            <div class="shop-item-price">${fmtMoney(loc.cost)}</div>
          `;
        } else {
          item.innerHTML = `
            <div class="shop-item-name">${loc.name}</div>
            <div class="shop-item-desc">${loc.description || ''}</div>
            <div class="shop-item-price">${fmtMoney(loc.cost)}</div>
          `;
          item.addEventListener('click', () => {
            this.audio.playUIClick();
            if (eco.buyLocation(locKey)) {
              this.audio.playCashRegister();
              this.toast(`✓ ${loc.name} unlocked!`, 'gold');
              document.getElementById('shop-money').textContent = fmtMoney(eco.money);
              this._renderShopTab('locations');
            }
          });
        }
        grid.appendChild(item);
      }
    }
    container.appendChild(grid);
  }

  _renderShopTickets(container) {
    const eco = this.economy;
    const owned = new Set(eco.ownedSkins || []);
    let html = '<div class="ticket-balance">\ud83c\udf9f Tickets: <b>' + (eco.tickets || 0) + '</b></div>';
    html += '<p class="ticket-note">Earn purple tickets from the Battle Pass. Spend them here on exclusives.</p>';
    html += '<div class="ticket-grid">';
    for (const item of TICKET_SHOP) {
      const already = item.type === 'skin' && owned.has(item.skin);
      const afford = (eco.tickets || 0) >= item.cost;
      html += '<div class="ticket-item">' +
        '<div class="ticket-item-name">' + item.name + '</div>' +
        '<div class="ticket-item-desc">' + item.desc + '</div>' +
        '<div class="ticket-item-cost">' + item.cost + ' \ud83c\udf9f</div>' +
        (already ? '<div class="ticket-owned">Owned</div>' : '<button class="btn btn-primary ticket-buy" data-ticket="' + item.key + '"' + (afford ? '' : ' disabled') + '>Buy</button>') +
        '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
    container.querySelectorAll('.ticket-buy').forEach(btn => {
      btn.addEventListener('click', () => {
        const res = eco.buyTicketItem(btn.getAttribute('data-ticket'));
        if (res && res.ok && this.audio && this.audio.playCashRegister) this.audio.playCashRegister();
        this._renderShopTickets(container);
      });
    });
  }

  _renderShopPets(container) {
    const eco = this.economy;
    const dim = eco.dimension || 1;
    const order = ['common','uncommon','rare','epic','legendary','unique'];
    const t1 = document.createElement('div');
    t1.className = 'loadout-desc';
    t1.textContent = 'Mystery Boxes — Dimension ' + dim + '. Better boxes give better odds; prices rise each dimension. Pets only come from boxes.';
    container.appendChild(t1);
    const grid = document.createElement('div');
    grid.className = 'shop-grid';
    for (let n = 1; n <= 3; n++) {
      const cost = eco.mysteryBoxCost(dim, n);
      const odds = MYSTERY_BOXES[n];
      const cant = eco.money < cost;
      const item = document.createElement('div');
      item.className = 'shop-item' + (cant ? ' cant-afford' : '');
      let oddsStr = '';
      for (const k of order) { const rr = PET_RARITIES[k]; oddsStr += '<span style="color:' + rr.color + '">' + rr.name + ' ' + odds[k] + '%</span> '; }
      item.innerHTML = '<div class="shop-item-name">Box ' + n + '</div>' +
        '<div style="font-size:11px;opacity:0.85;margin:4px 0;line-height:1.6">' + oddsStr + '</div>' +
        '<div class="shop-item-price">' + fmtMoney(cost) + '</div>';
      if (!cant) item.addEventListener('click', () => {
        this.audio.playUIClick();
        const pet = eco.rollMysteryBox(dim, n);
        if (!pet) return;
        this.audio.playCashRegister();
        document.getElementById('shop-money').textContent = fmtMoney(eco.money);
        this._showPetReveal(pet);
        this._renderShopTab('pets');
      });
      grid.appendChild(item);
    }
    container.appendChild(grid);
    const cap = eco.petSlotCap();
    const t2 = document.createElement('div');
    t2.className = 'loadout-desc';
    t2.textContent = 'Pet Slots — you can equip ' + cap + ' pet(s). Buy permanent slots (max 10).';
    container.appendChild(t2);
    const sgrid = document.createElement('div');
    sgrid.className = 'shop-grid';
    const upCost = eco.petUpgradeCost();
    const up = document.createElement('div');
    if (upCost == null) {
      up.className = 'shop-item owned';
      up.innerHTML = '<div class="shop-item-name">Pet Slots Maxed</div><div class="shop-item-price">10 / 10</div>';
    } else {
      const cant = eco.money < upCost;
      up.className = 'shop-item' + (cant ? ' cant-afford' : '');
      up.innerHTML = '<div class="shop-item-name">+1 Permanent Pet Slot</div><div class="shop-item-price">' + fmtMoney(upCost) + '</div>';
      if (!cant) up.addEventListener('click', () => {
        this.audio.playUIClick();
        if (eco.buyPetSlotUpgrade()) { this.audio.playCashRegister(); document.getElementById('shop-money').textContent = fmtMoney(eco.money); this._renderShopTab('pets'); }
      });
    }
    sgrid.appendChild(up);
    container.appendChild(sgrid);
    const t3 = document.createElement('div');
    t3.className = 'loadout-desc';
    t3.textContent = 'Slot Boosts — each grants +1 equip slot for a limited time (by rarity).';
    container.appendChild(t3);
    const bgrid = document.createElement('div');
    bgrid.className = 'shop-grid';
    for (const key of Object.keys(PET_BOOSTS)) {
      const b = PET_BOOSTS[key];
      const cant = eco.money < b.cost;
      const it = document.createElement('div');
      it.className = 'shop-item' + (cant ? ' cant-afford' : '');
      it.innerHTML = '<div class="shop-item-name" style="color:' + PET_RARITIES[b.rarity].color + '">' + b.name + '</div>' +
        '<div style="font-size:11px;opacity:0.8">+1 slot for ' + b.hours + 'h</div>' +
        '<div class="shop-item-price">' + fmtMoney(b.cost) + '</div>';
      if (!cant) it.addEventListener('click', () => {
        this.audio.playUIClick();
        if (eco.buyPetBoost(key)) { this.audio.playCashRegister(); document.getElementById('shop-money').textContent = fmtMoney(eco.money); this._renderShopTab('pets'); }
      });
      bgrid.appendChild(it);
    }
    container.appendChild(bgrid);
  }

  _showPetReveal(pet) {
    const rar = PET_RARITIES[pet.rarity] || PET_RARITIES.common;
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.78);display:flex;align-items:center;justify-content:center;z-index:99999';
    const inner = document.createElement('div');
    inner.style.cssText = 'background:#1a1d24;border:2px solid ' + rar.color + ';border-radius:14px;padding:26px 34px;text-align:center;max-width:340px;box-shadow:0 0 50px ' + rar.color;
    inner.innerHTML = '<div style="font-size:13px;letter-spacing:2px;color:' + rar.color + ';text-transform:uppercase">' + rar.name + (pet.isOOW ? ' — OUT OF WHACK' : '') + '</div>' +
      '<div style="font-size:22px;margin:10px 0;color:#fff">' + pet.name + '</div>' +
      '<div style="font-size:14px;color:#cfd3da">+' + Math.round(pet.mult * 100) + '% money per kill' + (pet.isOOW ? '<br>Special powers: infinite ammo, no cooldown!' : '') + '</div>';
    const btn = document.createElement('button');
    btn.className = 'btn btn-accent';
    btn.style.marginTop = '18px';
    btn.textContent = 'Add to Locker';
    btn.addEventListener('click', () => { this.audio.playUIClick(); ov.remove(); });
    inner.appendChild(btn);
    ov.appendChild(inner);
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
  }

  _renderLockerPets(content) {
    const eco = this.economy;
    content.innerHTML = '';
    const cap = eco.petSlotCap();
    const equipped = (eco.equippedPets || []).filter(id => eco.getPet(id));
    const mult = eco.petMultiplier();
    const order = ['outofwhack','unique','legendary','epic','rare','uncommon','common'];
    const desc = document.createElement('div');
    desc.className = 'loadout-desc';
    desc.textContent = 'Equipped ' + equipped.length + ' / ' + cap + ' pets  -  Money multiplier ' + mult.toFixed(2) + 'x. Tap a pet to equip or unequip.';
    content.appendChild(desc);
    const inv = (eco.petInventory || []).slice().sort((a, b) => order.indexOf(a.rarity) - order.indexOf(b.rarity));
    if (!inv.length) {
      const e = document.createElement('div');
      e.className = 'loadout-desc';
      e.textContent = 'No pets yet — open mystery boxes in the shop to find some!';
      content.appendChild(e);
      return;
    }
    const grid = document.createElement('div');
    grid.className = 'locker-items';
    for (const pet of inv) {
      const isEq = equipped.includes(pet.id);
      const rar = PET_RARITIES[pet.rarity] || PET_RARITIES.common;
      const it = document.createElement('div');
      it.className = 'shop-item' + (isEq ? ' owned' : '');
      it.style.borderColor = rar.color;
      it.innerHTML = '<div class="shop-item-name" style="color:' + rar.color + '">' + pet.name + '</div>' +
        '<div style="font-size:11px;opacity:0.85">' + rar.name + ' - +' + Math.round(pet.mult * 100) + '% money' + (pet.isOOW ? ' - special' : '') + '</div>' +
        '<div class="shop-item-price">' + (isEq ? 'EQUIPPED' : 'Equip') + '</div>';
      it.addEventListener('click', () => {
        this.audio.playUIClick();
        if (isEq) eco.unequipPet(pet.id);
        else if (!eco.equipPetInstance(pet.id)) this.toast('No free pet slots — unequip one or buy a slot.', 'error');
        this._renderLockerTab('pets');
      });
      grid.appendChild(it);
    }
    content.appendChild(grid);
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
      const cantAfford = !owned && !banner.devCode && eco.money < banner.cost;
      item.className = `shop-item ${owned ? 'owned' : (cantAfford ? 'cant-afford' : '')}`;
      if (banner.devCode && !owned) item.classList.add('dev-banner-item');

      const priceLabel = owned
        ? (isEquipped ? 'EQUIPPED' : 'OWNED')
        : (banner.devCode ? '🔐 ENTER CODE' : fmtMoney(banner.cost));

      item.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:24px;height:24px;border-radius:4px;background:${banner.color};border:1px solid rgba(255,255,255,0.2)"></div>
          <div class="shop-item-name">${banner.name}</div>
        </div>
        <div class="shop-item-price">${priceLabel}</div>
      `;

      item.addEventListener('click', () => {
        this.audio.playUIClick();
        if (owned) {
          eco.equippedBanner = isEquipped ? null : key;
          eco.save();
          this._renderShopTab('banners');
        } else if (banner.devCode) {
          this._showDevCodeModal(() => {
            if (eco.grantBanner(key)) {
              this.audio.playCashRegister();
              this.toast(`🔓 DEV Banner unlocked!`, 'info');
              this._renderShopTab('banners');
            }
          });
        } else if (eco.money >= banner.cost) {
          if (eco.buyBanner(key)) {
            this.audio.playCashRegister();
            this.toast(`✓ ${banner.name} banner purchased!`, 'gold');
            document.getElementById('shop-money').textContent = fmtMoney(eco.money);
            this._renderShopTab('banners');
          }
        }
      });
      grid.appendChild(item);
    }
    container.appendChild(grid);
  }

  _renderShopTags(container) {
    const eco = this.economy;
    const grid = document.createElement('div');
    grid.className = 'shop-grid';

    for (const [key, tag] of Object.entries(TAGS)) {
      const owned = eco.ownedTags.includes(key);
      const isEquipped = eco.equippedTag === key;
      const item = document.createElement('div');
      const cantAfford = !owned && !tag.devCode && eco.money < tag.cost;
      item.className = `shop-item ${owned ? 'owned' : (cantAfford ? 'cant-afford' : '')}`;
      if (tag.devCode && !owned) item.classList.add('dev-banner-item');

      const priceLabel = owned
        ? (isEquipped ? 'EQUIPPED' : 'OWNED')
        : (tag.devCode ? '🔐 ENTER CODE' : fmtMoney(tag.cost));

      item.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:auto;padding:2px 8px;border-radius:4px;background:${tag.color};border:1px solid rgba(255,255,255,0.2);color:${tag.textColor || '#fff'};font-size:12px;font-weight:bold">${tag.name}</div>
        </div>
        <div class="shop-item-price">${priceLabel}</div>
      `;

      item.addEventListener('click', () => {
        this.audio.playUIClick();
        if (owned) {
          eco.equipTag(key);
          this._renderShopTab('tags');
        } else if (tag.devCode) {
          this._showDevCodeModal(() => {
            if (eco.grantTag(key)) {
              this.audio.playCashRegister();
              this.toast(`🔓 DEV Tag unlocked!`, 'info');
              this._renderShopTab('tags');
            }
          });
        } else if (eco.money >= tag.cost) {
          if (eco.buyTag(key)) {
            this.audio.playCashRegister();
            this.toast(`✓ ${tag.name} tag purchased!`, 'gold');
            document.getElementById('shop-money').textContent = fmtMoney(eco.money);
            this._renderShopTab('tags');
          }
        }
      });
      grid.appendChild(item);
    }
    container.appendChild(grid);
  }

  _showDevCodeModal(onSuccess) {
    // Remove any existing modal
    const existing = document.getElementById('dev-code-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'dev-code-modal';
    overlay.className = 'dev-code-overlay';
    overlay.innerHTML = `
      <div class="dev-code-box">
        <div class="dev-code-title">🔐 Developer Access</div>
        <div class="dev-code-subtitle">Enter the developer code to unlock this banner</div>
        <input type="text" id="dev-code-input" class="dev-code-input" placeholder="Enter code..." autocomplete="off" spellcheck="false" />
        <div id="dev-code-error" class="dev-code-error"></div>
        <div class="dev-code-buttons">
          <button id="dev-code-confirm" class="btn btn-primary btn-small">Confirm</button>
          <button id="dev-code-cancel" class="btn btn-secondary btn-small">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = document.getElementById('dev-code-input');
    const errorEl = document.getElementById('dev-code-error');
    input.focus();

    const DEV_CODE = '1q2w3e4r5t6y7u8i9o0p';

    const confirm = () => {
      if (input.value.trim() === DEV_CODE) {
        overlay.remove();
        onSuccess();
      } else {
        errorEl.textContent = 'Incorrect code. Try again.';
        input.value = '';
        input.focus();
      }
    };

    document.getElementById('dev-code-confirm').addEventListener('click', confirm);
    document.getElementById('dev-code-cancel').addEventListener('click', () => overlay.remove());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') confirm();
      if (e.key === 'Escape') overlay.remove();
    });
    // Close on backdrop click
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
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
          document.getElementById('shop-money').textContent = fmtMoney(eco.money);
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
            this.toast(`✓ Traveled to Dimension ${eco.dimension} — ${eco.getDimensionName()}!`, 'gold');
            // Refresh in place on the Locations tab so the new dimension's
            // locations appear immediately. (showShop() with no arg resets to
            // the Weapons tab, which is why they only appeared after re-opening.)
            document.getElementById('shop-money').textContent = fmtMoney(eco.money);
            const dimHeader = document.getElementById('shop-dimension');
            if (dimHeader) dimHeader.textContent = `Dimension ${eco.dimension} -- ${eco.getDimensionName()}`;
            this._renderShopTab('locations');
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
        const offerPets = (trade.offering.pets || []).map(p => p.name).join(', ');
        const wantWeapons = (trade.requesting.weapons || []).map(k => eco.weapons[k]?.name || k).join(', ');
        const wantLocs = (trade.requesting.locations || []).map(k => eco.locations[k]?.name || k).join(', ');
        const wantPets = (trade.requesting.pets || []).map(p => p.name).join(', ');

        let details = '<strong>They offer:</strong> ';
        const offerParts = [];
        if (offerWeapons) offerParts.push(offerWeapons);
        if (offerLocs) offerParts.push(offerLocs);
          if (offerPets) offerParts.push(offerPets);
        if (trade.offering.money) offerParts.push(`$${trade.offering.money}`);
        details += offerParts.join(', ') || 'Nothing';

        details += '<br><strong>They want:</strong> ';
        const wantParts = [];
        if (wantWeapons) wantParts.push(wantWeapons);
        if (wantLocs) wantParts.push(wantLocs);
          if (wantPets) wantParts.push(wantPets);
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
      playersEl.innerHTML = '<div class="trade-empty">No other players found</div>';
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
    const selectedOffer = { weapons: new Set(), locations: new Set(), pets: new Set() };

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
    const selectedWant = { weapons: new Set(), locations: new Set(), pets: new Set() };
    const partnerPetsById = {};

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
    // Pets you can offer
      for (const pet of (eco.petInventory || [])) {
        const it = document.createElement('div');
        it.className = 'trade-item';
        const rc = (PET_RARITIES[pet.rarity] || PET_RARITIES.common).color;
        it.innerHTML = '<div class="trade-item-type" style="color:' + rc + '">Pet</div>' + pet.name + ' (+' + Math.round(pet.mult * 100) + '%)';
        it.addEventListener('click', () => {
          if (selectedOffer.pets.has(pet.id)) { selectedOffer.pets.delete(pet.id); it.classList.remove('selected'); }
          else { selectedOffer.pets.add(pet.id); it.classList.add('selected'); }
        });
        offerGrid.appendChild(it);
      }
      for (const pet of ((partnerSave && partnerSave.petInventory) || [])) {
        partnerPetsById[pet.id] = pet;
        const it = document.createElement('div');
        it.className = 'trade-item';
        const rc = (PET_RARITIES[pet.rarity] || PET_RARITIES.common).color;
        it.innerHTML = '<div class="trade-item-type" style="color:' + rc + '">Pet</div>' + pet.name + ' (+' + Math.round(pet.mult * 100) + '%)';
        it.addEventListener('click', () => {
          if (selectedWant.pets.has(pet.id)) { selectedWant.pets.delete(pet.id); it.classList.remove('selected'); }
          else { selectedWant.pets.add(pet.id); it.classList.add('selected'); }
        });
        wantGrid.appendChild(it);
      }
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
      if (selectedOffer.weapons.size === 0 && selectedOffer.locations.size === 0 && offerMoney === 0 && selectedOffer.pets.size === 0 &&
          selectedWant.weapons.size === 0 && selectedWant.locations.size === 0 && wantMoney === 0 && selectedWant.pets.size === 0) {
        return;
      }

      // Validate — can't offer more money than you have
      if (offerMoney > eco.money) return;

      await sendTrade(
        uid, displayName,
        partner.uid, partner.name,
        eco.dimension,
        { weapons: [...selectedOffer.weapons], locations: [...selectedOffer.locations], money: offerMoney, pets: [...selectedOffer.pets].map(id => eco.getPet(id)).filter(Boolean) },
        { weapons: [...selectedWant.weapons], locations: [...selectedWant.locations], money: wantMoney, pets: [...selectedWant.pets].map(id => partnerPetsById[id]).filter(Boolean) }
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

    // Progress bar — fixed-width track placed ABOVE the text so the words
    // stay put and only the gold line fills.
    const track = document.createElement('div');
    track.style.cssText = 'width:240px;max-width:60vw;height:3px;background:rgba(255,255,255,0.12);border-radius:2px;margin:0 auto 20px;overflow:hidden;';
    const fill = document.createElement('div');
    fill.style.cssText = 'width:0%;height:100%;background:var(--accent-gold);border-radius:2px;transition:width 2.8s linear;';
    track.appendChild(fill);
    const content = document.getElementById('screen-sleep').querySelector('.sleep-content') || document.getElementById('screen-sleep');
    content.insertBefore(track, content.firstChild);
    requestAnimationFrame(() => { fill.style.width = '100%'; });

    setTimeout(() => {
      track.remove();
      eco.day++;
      eco.save();
      if (callback) callback();
    }, 3000);
  }

  // ─── Win Screen ─────────────────────────────

  showWin() {
    const eco = this.economy;
    document.getElementById('win-money').textContent = fmtMoney(eco.money);
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
    // Reset to loadout tab
    document.querySelectorAll('.locker-tab').forEach(t => t.classList.remove('active'));
    const defaultTab = document.querySelector('.locker-tab[data-tab="loadout"]');
    if (defaultTab) defaultTab.classList.add('active');
    this._renderLockerTab('loadout');
    this.showScreen('locker');
  }

  _renderLockerTab(tab) {
    const content = document.getElementById('locker-content');
    const eco = this.economy;

    if (tab === 'pets') { this._renderLockerPets(content); return; }

    if (tab === 'loadout') {
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
            if (currentLoadout.length >= 5) {
              const toast = document.createElement('div');
              toast.textContent = 'Loadout full! (max 5 weapons)';
              toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:var(--accent-red, #ff4444);color:white;padding:8px 20px;border-radius:8px;font-size:13px;z-index:9999;animation:fadeIn 0.2s ease;';
              document.body.appendChild(toast);
              setTimeout(() => toast.remove(), 2000);
              return;
            }
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
        content.innerHTML = '<div class="locker-coming-soon">No skins owned yet. Buy them in the Shop!</div>';
        return;
      }

      const desc = document.createElement('div');
      desc.className = 'loadout-desc';
      desc.textContent = 'Assign skins to your weapons. Each weapon can have its own skin.';
      content.appendChild(desc);

      const grid = document.createElement('div');
      grid.className = 'locker-items';
      const ownedWeapons = eco.getOwnedWeaponKeys();
      for (const wKey of ownedWeapons) {
        const weapon = eco.weapons[wKey];
        const currentSkin = eco.equippedSkins[wKey] || 'default';
        const item = document.createElement('div');
        item.className = `locker-item${currentSkin !== 'default' ? ' equipped' : ''}`;

        // Build skin options from owned skins
        let skinOptions = eco.ownedSkins.map(sk => {
          const s = WEAPON_SKINS[sk];
          return `<option value="${sk}" ${sk === currentSkin ? 'selected' : ''}>${s ? s.name : sk}</option>`;
        }).join('');

        // Color preview swatch
        const skinData = WEAPON_SKINS[currentSkin];
        const previewColor = skinData && skinData.colors ? `#${skinData.colors.stock.toString(16).padStart(6, '0')}` : 'var(--text-muted)';

        item.innerHTML = `
          <div class="locker-item-icon" style="width:30px;height:30px;border-radius:6px;background:${previewColor};margin:0 auto 8px;border:2px solid rgba(255,255,255,0.1)"></div>
          <div class="locker-item-name">${weapon.name}</div>
          <select class="skin-select" style="width:100%;background:var(--surface);color:var(--text-primary);border:1px solid var(--border);border-radius:6px;padding:6px 8px;font-size:12px;margin-top:8px;cursor:pointer">${skinOptions}</select>
        `;
        item.querySelector('.skin-select').addEventListener('change', (e) => {
          eco.equipSkin(wKey, e.target.value);
          this._renderLockerTab('skins');
        });
        grid.appendChild(item);
      }
      content.appendChild(grid);
    } else if (tab === 'tags') {
      content.innerHTML = '';
      const grid = document.createElement('div');
      grid.className = 'locker-items';
      let anyTags = false;

      // Migrate legacy OG equip into the unified single-tag field (one tag at a time)
      if (eco.equipped && eco.equipped.tag === 'og' && !eco.equippedTag) {
        eco.equippedTag = 'og';
        eco.equipped.tag = null;
        eco.save();
      }

      // Owned tags purchased or granted in the shop (DEV, Hunter, etc.)
      for (const tagKey of (eco.ownedTags || [])) {
        const tagData = TAGS[tagKey];
        if (!tagData) continue;
        anyTags = true;
        const tagEquipped = eco.equippedTag === tagKey;
        const tItem = document.createElement('div');
        tItem.className = 'locker-item' + (tagEquipped ? ' equipped' : '');
        tItem.innerHTML =
          '<div class="locker-item-icon" style="font-family:var(--font-display);font-size:20px;color:' + (tagData.textColor || tagData.color) + '">' + tagData.name + '</div>' +
          '<div class="locker-item-name">' + tagData.name + ' Tag</div>' +
          '<button class="btn ' + (tagEquipped ? 'btn-secondary' : 'btn-primary') + '">' + (tagEquipped ? 'Unequip' : 'Equip') + '</button>';
        tItem.querySelector('.btn').addEventListener('click', () => {
          eco.equipTag(tagKey);
          this._renderLockerTab('tags');
        });
        grid.appendChild(tItem);
      }

      // Legacy OG tag (kept from the old inventory structure)
      if (eco.inventory && eco.inventory.tags && eco.inventory.tags.includes('og')) {
        anyTags = true;
        const ogEquipped = eco.equippedTag === 'og';
        const ogItem = document.createElement('div');
        ogItem.className = 'locker-item' + (ogEquipped ? ' equipped' : '');
        ogItem.innerHTML =
          '<div class="locker-item-icon" style="font-family:var(--font-display);font-size:24px;color:var(--accent-gold)">OG</div>' +
          '<div class="locker-item-name">OG Tag</div>' +
          '<div class="locker-item-desc">Played in the first 30 days</div>' +
          '<button class="btn ' + (ogEquipped ? 'btn-secondary' : 'btn-primary') + '">' + (ogEquipped ? 'Unequip' : 'Equip') + '</button>';
        ogItem.querySelector('.btn').addEventListener('click', () => {
          eco.equippedTag = ogEquipped ? null : 'og';
          eco.equipped.tag = null;
          eco.save();
          this._renderLockerTab('tags');
        });
        grid.appendChild(ogItem);
      }

      if (anyTags) {
        content.appendChild(grid);
      } else {
        content.innerHTML = '<div class="locker-coming-soon">No tags earned yet</div>';
      }
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

    // Search + suggestions
    const searchInput = document.getElementById('friend-search-input');
    const searchResults = document.getElementById('friend-search-results');
    searchInput.value = '';
    searchResults.innerHTML = '<div style="color:var(--text-secondary);font-size:13px">Loading players…</div>';

    // Render a list of players into the results area.
    const renderPlayerRows = (list, emptyMsg) => {
      searchResults.innerHTML = '';
      if (!list || list.length === 0) {
        searchResults.innerHTML = `<div style="color:var(--text-secondary);font-size:13px">${emptyMsg}</div>`;
        return;
      }
      for (const p of list) {
        const isFriend = friends.find(f => f.uid === p.uid);
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:6px 10px;margin-bottom:4px;background:rgba(255,255,255,0.03);border-radius:4px;font-size:13px;';
        row.innerHTML = `<span>${p.name} <span style="color:var(--text-secondary)">(Dimension ${p.dimension})</span></span>${isFriend ? '<span style="color:#5ab55a">Friend</span>' : `<button class="btn btn-primary" style="font-size:11px;padding:3px 8px">Add</button>`}`;
        if (!isFriend) {
          row.querySelector('.btn').addEventListener('click', async () => {
            const b = row.querySelector('.btn');
            b.textContent = 'Sent!';
            b.disabled = true;
            await sendFriendRequest(uid, displayName, p.uid, p.name);
          });
        }
        searchResults.appendChild(row);
      }
    };

    // Default suggestions: pull players from the leaderboard (empty query
    // matches everyone) so there's always a list to add from.
    let suggestions = [];
    try { suggestions = await searchPlayers('', uid); } catch (e) { console.warn('player suggestions failed:', e); }
    renderPlayerRows(suggestions, 'No other players found yet.');

    let searchTimeout = null;
    searchInput.oninput = () => {
      clearTimeout(searchTimeout);
      const q = searchInput.value.trim();
      if (q === '') { renderPlayerRows(suggestions, 'No other players found yet.'); return; }
      searchResults.innerHTML = '<div style="color:var(--text-secondary);font-size:13px">Searching…</div>';
      searchTimeout = setTimeout(async () => {
        let results = [];
        try { results = await searchPlayers(q, uid); } catch (e) { console.warn('player search failed:', e); }
        renderPlayerRows(results, `No players match “${q}”.`);
      }, 250);
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

  // ─── Market Interact / Return Prompts ───────

  /** Show the hold-E ring prompt with a given label. Progress 0-1. */
  showInteractPrompt(label) {
    const el = document.getElementById('market-interact-prompt');
    const lbl = document.getElementById('mip-label');
    if (!el) return;
    if (lbl) lbl.textContent = label;
    el.classList.remove('hidden');
  }

  setInteractProgress(progress) {
    const arc = document.getElementById('mip-fill-arc');
    if (!arc) return;
    const circumference = 125.66; // 2π×20
    arc.setAttribute('stroke-dashoffset', String(circumference * (1 - progress)));
  }

  hideInteractPrompt() {
    const el = document.getElementById('market-interact-prompt');
    if (!el) return;
    el.classList.add('hidden');
    const arc = document.getElementById('mip-fill-arc');
    if (arc) arc.setAttribute('stroke-dashoffset', '125.66');
  }

  /** Show the auto-fill return ring prompt with a given label. */
  showReturnPrompt(label) {
    const el = document.getElementById('market-return-prompt');
    const lbl = document.getElementById('mrp-label');
    if (!el) return;
    if (lbl) lbl.textContent = label;
    el.classList.remove('hidden');
  }

  setReturnProgress(progress) {
    const arc = document.getElementById('mrp-fill-arc');
    if (!arc) return;
    const circumference = 125.66;
    arc.setAttribute('stroke-dashoffset', String(circumference * (1 - progress)));
  }

  hideReturnPrompt() {
    const el = document.getElementById('market-return-prompt');
    if (!el) return;
    el.classList.add('hidden');
    const arc = document.getElementById('mrp-fill-arc');
    if (arc) arc.setAttribute('stroke-dashoffset', '125.66');
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
