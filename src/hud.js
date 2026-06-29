// ═══════════════════════════════════════════════
// Gary's Life — HUD System
// In-game overlay: ammo, money, timer, kill feed,
// dynamic crosshair, weapon slot bar
// ═══════════════════════════════════════════════

import { fmtNum } from './economy.js';

export class HUD {
  constructor() {
    this.el = document.getElementById('hud');
    this.crosshair = document.getElementById('crosshair');
    this.crosshairSpread = document.getElementById('crosshair-spread');
    this.dayNum = document.getElementById('day-num');
    this.locationEl = document.getElementById('hud-location');
    this.timerEl = document.getElementById('hud-timer');
    this.timerLabelEl = document.getElementById('hud-timer-label');
    this.moneyDisplay = document.getElementById('money-display');
    this.ammoCurrent = document.getElementById('ammo-current');
    this.ammoMax = document.getElementById('ammo-max');
    this.weaponName = document.getElementById('hud-weapon-name');
    this.killFeed = document.getElementById('kill-feed');
    this.moneyPopupContainer = document.getElementById('money-popup-container');
    this.weaponSlotsEl = document.getElementById('weapon-slots');

    this.killEntries = [];
    this.onWeaponSlotClick = null;

    // Combo display
    this.comboEl = document.createElement('div');
    this.comboEl.id = 'combo-display';
    this.comboEl.className = 'combo-display hidden';
    document.body.appendChild(this.comboEl);

    // Poop splat overlay (bird attacks on higher dimensions)
    this.poopSplatEl = document.createElement('div');
    this.poopSplatEl.id = 'poop-splat';
    this.poopSplatEl.className = 'poop-splat hidden';
    document.body.appendChild(this.poopSplatEl);

    // Lightweight toast for quick callouts (e.g. "Blocked!")
    this.toastEl = document.createElement('div');
    this.toastEl.id = 'hud-toast';
    this.toastEl.className = 'hud-toast hidden';
    document.body.appendChild(this.toastEl);
  }

  show() {
    this.el.classList.remove('hidden');
    this.crosshair.classList.remove('hidden');
  }

  hide() {
    this.el.classList.add('hidden');
    this.crosshair.classList.add('hidden');
  }

  setDay(day) {
    this.dayNum.textContent = day;
  }

  setLocation(name) {
    this.locationEl.textContent = name;
  }

  setTimer(seconds) {
    const s = Math.max(0, Math.ceil(seconds));
    this.timerEl.textContent = s;
    if (s <= 10) {
      this.timerEl.classList.add('warning');
    } else {
      this.timerEl.classList.remove('warning');
    }
  }

  setMoney(amount) {
    this.moneyDisplay.textContent = fmtNum(amount);
  }

  setAmmo(current, max) {
    this.ammoCurrent.textContent = current;
    this.ammoMax.textContent = max;
  }

  setWeaponName(name) {
    this.weaponName.textContent = name;
  }

  /**
   * Update crosshair based on weapon type.
   * Shows a spread ring for shotguns proportional to their spread value.
   */
  setCrosshairForWeapon(weaponData) {
    if (weaponData.isShotgun) {
      const ringSize = Math.round(weaponData.spread * 1000);
      this.crosshairSpread.style.width  = ringSize + 'px';
      this.crosshairSpread.style.height = ringSize + 'px';
      this.crosshairSpread.classList.remove('hidden');
      // Square crosshair for legendary gun
      if (weaponData.crosshairShape === 'square') {
        this.crosshairSpread.classList.add('crosshair-square');
      } else {
        this.crosshairSpread.classList.remove('crosshair-square');
      }
    } else {
      this.crosshairSpread.classList.add('hidden');
      this.crosshairSpread.classList.remove('crosshair-square');
    }
  }

  /**
   * Build weapon slot bar from owned weapons list
   */
  buildWeaponSlots(ownedWeapons, currentWeaponKey) {
    this.weaponSlotsEl.innerHTML = '';
    ownedWeapons.forEach((info, index) => {
      const slot = document.createElement('div');
      slot.className = 'weapon-slot';
      if (info.key === currentWeaponKey) {
        slot.classList.add('active');
      }
      slot.innerHTML = `
        <span class="weapon-slot-key">${index + 1}</span>
        <span class="weapon-slot-name">${info.name}</span>
      `;
      slot.addEventListener('click', () => {
        if (this.onWeaponSlotClick) this.onWeaponSlotClick(info.key);
      });
      this.weaponSlotsEl.appendChild(slot);
    });
  }

  /**
   * Highlight the active weapon slot
   */
  setActiveWeaponSlot(weaponKey) {
    const slots = this.weaponSlotsEl.querySelectorAll('.weapon-slot');
    slots.forEach(slot => slot.classList.remove('active'));
    // Find matching slot by data
    const ownedSlots = this.weaponSlotsEl.children;
    for (let i = 0; i < ownedSlots.length; i++) {
      const nameEl = ownedSlots[i].querySelector('.weapon-slot-name');
      // re-highlight based on click callback match
    }
  }

  /**
   * Add a kill to the feed
   */
  addKill(birdName, value, color, comboCount, comboMultiplier) {
    const entry = document.createElement('div');
    entry.className = 'kill-entry';
    let text = `<span style="color:${color}">${birdName}</span> — $${value}`;
    if (comboCount > 1) {
      text += ` <span class="combo-tag">x${comboMultiplier} COMBO</span>`;
    }
    entry.innerHTML = text;
    this.killFeed.appendChild(entry);
    this.killEntries.push(entry);

    setTimeout(() => {
      entry.classList.add('fade-out');
      setTimeout(() => {
        if (entry.parentNode) entry.parentNode.removeChild(entry);
        const idx = this.killEntries.indexOf(entry);
        if (idx !== -1) this.killEntries.splice(idx, 1);
      }, 500);
    }, 4000);

    while (this.killEntries.length > 5) {
      const old = this.killEntries.shift();
      if (old.parentNode) old.parentNode.removeChild(old);
    }
  }

  /**
   * Floating +$X popup at screen position
   */
  showMoneyPopup(value, comboMultiplier) {
    const boostedValue = comboMultiplier > 1 ? Math.round(value * comboMultiplier) : value;
    const popup = document.createElement('div');
    popup.className = 'money-popup';
    if (comboMultiplier > 1) {
      popup.textContent = `+$${fmtNum(boostedValue)}`;
      popup.classList.add('combo-boosted');
    } else {
      popup.textContent = `+$${fmtNum(value)}`;
    }
    popup.style.left = `${window.innerWidth / 2 + (Math.random() - 0.5) * 80}px`;
    popup.style.top = `${window.innerHeight / 2 - 30 + (Math.random() - 0.5) * 40}px`;
    this.moneyPopupContainer.appendChild(popup);

    setTimeout(() => {
      if (popup.parentNode) popup.parentNode.removeChild(popup);
    }, 1200);
  }

  /**
   * Flash the crosshair red briefly on a successful hit
   */
  showHitMarker(headshot) {
    const ch = this.crosshair;
    if (!ch) return;
    ch.style.borderColor = headshot ? '#ffd700' : '#ff4444';
    setTimeout(() => { ch.style.borderColor = ''; }, 100);
  }

  showHeadshot() {
    const el = document.createElement('div');
    el.textContent = 'HEADSHOT!';
    el.style.cssText = 'position:fixed;left:50%;top:44%;transform:translate(-50%,0);font:900 26px system-ui,sans-serif;color:#ffd700;text-shadow:0 0 8px rgba(0,0,0,.85);letter-spacing:1px;pointer-events:none;z-index:9999;opacity:1;transition:transform .6s ease-out,opacity .6s ease-out;';
    document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.transform = 'translate(-50%,-30px)'; el.style.opacity = '0'; });
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 650);
  }

  showGolden(value) {
    const el = document.createElement('div');
    el.textContent = 'GOLDEN BIRD!';
    el.style.cssText = 'position:fixed;left:50%;top:36%;transform:translate(-50%,0);font:900 30px system-ui,sans-serif;color:#ffd700;text-shadow:0 0 12px rgba(255,180,0,.9),0 2px 0 #7a5a00;letter-spacing:1px;pointer-events:none;z-index:9999;opacity:1;transition:transform .9s ease-out,opacity .9s ease-out;';
    document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.transform = 'translate(-50%,-44px) scale(1.15)'; el.style.opacity = '0'; });
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 950);
  }

  /**
   * Show hit flash overlay
   */
  showHitFlash() {
    const flash = document.createElement('div');
    flash.className = 'hit-flash';
    document.body.appendChild(flash);
    setTimeout(() => {
      if (flash.parentNode) flash.parentNode.removeChild(flash);
    }, 150);
  }

  showCombo(count, multiplier) {
    if (count < 2) {
      this.hideCombo();
      return;
    }
    this.comboEl.classList.remove('hidden');
    this.comboEl.innerHTML = `
      <div class="combo-count">${count} HIT COMBO</div>
      <div class="combo-mult">x${multiplier}</div>
    `;
    // Pop animation
    this.comboEl.classList.remove('combo-pop');
    void this.comboEl.offsetWidth; // force reflow
    this.comboEl.classList.add('combo-pop');
  }

  hideCombo() {
    this.comboEl.classList.add('hidden');
  }

  /**
   * Splatter the screen when a bird dropping hits the player.
   * Creates 5 unique, randomly-shaped splotches that partially cover the view
   * (so vision is impaired but not blocked). They hold for ~5s, then each one
   * drips off the bottom of the screen with its own animation.
   */
  showPoopSplat() {
    const el = this.poopSplatEl;
    clearTimeout(this._poopSplatT);
    clearTimeout(this._poopDripT);
    el.innerHTML = '';
    el.classList.remove('hidden');
    // Faint full-screen wash = "bad vision"
    el.style.transition = '';
    el.style.background = 'rgba(70,56,30,0.10)';

    const rPct = () => (18 + Math.random() * 64).toFixed(1) + '%';
    const blobs = [];
    for (let i = 0; i < 5; i++) {
      const b = document.createElement('div');
      b.className = 'poop-blob';
      const size = 150 + Math.random() * 210;
      const x = 6 + Math.random() * 88;          // % across screen
      const y = 6 + Math.random() * 78;          // % down screen
      const rot = (Math.random() * 360) | 0;
      // 8-value border-radius = organic, never-the-same blob shape
      const br = `${rPct()} ${rPct()} ${rPct()} ${rPct()} / ${rPct()} ${rPct()} ${rPct()} ${rPct()}`;
      const tone = 38 + ((Math.random() * 16) | 0); // brown lightness jitter
      b.style.position = 'absolute';
      b.style.left = x + '%';
      b.style.top = y + '%';
      b.style.width = size + 'px';
      b.style.height = (size * (0.78 + Math.random() * 0.5)) + 'px';
      b.style.borderRadius = br;
      b.style.background = `radial-gradient(closest-side, rgba(${tone + 30},${tone + 12},${tone - 8},0.92), rgba(${tone + 14},${tone},${tone - 14},0.8) 55%, rgba(${tone + 14},${tone},${tone - 14},0) 76%)`;
      b.style.transform = `translate(-50%, -50%) rotate(${rot}deg)`;
      b.style.opacity = '0';
      b.style.transition = 'opacity 0.3s ease';
      el.appendChild(b);
      // fade in
      requestAnimationFrame(() => { b.style.opacity = (0.78 + Math.random() * 0.18).toFixed(2); });
      blobs.push({ b, rot });
    }

    // Hold ~5s, then drip each splotch off the screen, each one differently.
    this._poopSplatT = setTimeout(() => {
      let maxMs = 0;
      const eases = ['cubic-bezier(.55,.06,.68,.19)', 'cubic-bezier(.4,0,.7,1)', 'cubic-bezier(.6,.04,.98,.34)', 'ease-in'];
      blobs.forEach(({ b, rot }) => {
        const dur = 1.6 + Math.random() * 1.3;     // seconds
        const delay = Math.random() * 0.8;
        const driftX = (Math.random() - 0.5) * 70; // px sideways wander
        const stretch = (1.5 + Math.random() * 1.3).toFixed(2); // vertical smear
        const ease = eases[(Math.random() * eases.length) | 0];
        b.style.transition = `transform ${dur}s ${ease} ${delay}s, opacity ${dur}s ease ${delay}s`;
        b.style.transform = `translate(calc(-50% + ${driftX}px), 135vh) rotate(${rot}deg) scaleY(${stretch})`;
        b.style.opacity = '0';
        maxMs = Math.max(maxMs, (dur + delay) * 1000);
      });
      // Clear the vision wash as the drips run
      el.style.transition = 'background 1.2s ease';
      el.style.background = 'rgba(70,56,30,0)';
      this._poopDripT = setTimeout(() => {
        el.classList.add('hidden');
        el.innerHTML = '';
        el.style.transition = '';
      }, maxMs + 250);
    }, 5000);
  }

  /**
   * Quick centered toast message (auto-hides).
   */
  showToast(text) {
    this.toastEl.textContent = text;
    this.toastEl.classList.remove('hidden', 'toast-pop');
    void this.toastEl.offsetWidth;
    this.toastEl.classList.add('toast-pop');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => this.toastEl.classList.add('hidden'), 1400);
  }

  /**
   * Clear kill feed
   */
  clearKillFeed() {
    this.killFeed.innerHTML = '';
    this.killEntries = [];
  }

  /**
   * Show/hide reloading indicator
   */
  showReloading(show) {
    let bar = document.getElementById('reload-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'reload-bar';
      bar.innerHTML = '<div id="reload-bar-fill"></div>';
      document.body.appendChild(bar);
    }
    if (show) {
      bar.classList.add('active');
    } else {
      bar.classList.remove('active');
    }
  }

  setReloadProgress(progress) {
    const fill = document.getElementById('reload-bar-fill');
    if (fill) {
      fill.style.width = `${progress * 100}%`;
    }
  }

  /**
   * Show/update the story assembly XP bar.
   * fraction = 0.0 to 1.0
   */
  showXPBar(fraction) {
    const bar  = document.getElementById('story-xp-bar');
    const fill = document.getElementById('story-xp-fill');
    if (!bar || !fill) return;
    bar.classList.remove('hidden');
    fill.style.width = `${Math.min(fraction * 100, 100)}%`;
  }

  hideXPBar() {
    const bar = document.getElementById('story-xp-bar');
    if (bar) bar.classList.add('hidden');
  }

  // ─── Boss Bird HUD ───────────────────────────

  showBossAlert(bossName) {
    let alert = document.getElementById('boss-alert');
    if (!alert) {
      // Inject keyframes once
      if (!document.getElementById('boss-alert-style')) {
        const style = document.createElement('style');
        style.id = 'boss-alert-style';
        style.textContent = `
          @keyframes bossAlertPulse {
            0% { transform: translateX(-50%) scale(2); opacity: 0; }
            50% { transform: translateX(-50%) scale(1.1); opacity: 1; }
            100% { transform: translateX(-50%) scale(1); opacity: 1; }
          }
          @keyframes bossAlertFade {
            0% { opacity: 1; }
            100% { opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }
      alert = document.createElement('div');
      alert.id = 'boss-alert';
      alert.style.cssText = `
        position: fixed; top: 20%; left: 50%; transform: translateX(-50%);
        font-family: var(--font-display, sans-serif); font-size: 28px; font-weight: 900;
        color: #ff4444; text-shadow: 0 0 20px rgba(255,0,0,0.8), 0 0 40px rgba(255,0,0,0.4);
        text-transform: uppercase; letter-spacing: 4px;
        pointer-events: none; z-index: 100;
      `;
      document.body.appendChild(alert);
    }
    alert.textContent = `⚠ BOSS: ${bossName} ⚠`;
    alert.style.display = 'block';
    alert.style.animation = 'bossAlertPulse 0.5s ease-out';
    setTimeout(() => {
      alert.style.animation = 'bossAlertFade 0.5s ease-out forwards';
    }, 2500);
    setTimeout(() => { alert.style.display = 'none'; }, 3000);
  }

  showBossHP(current, max) {
    let bar = document.getElementById('boss-hp-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'boss-hp-bar';
      bar.style.cssText = `
        position: fixed; top: 12%; left: 50%; transform: translateX(-50%);
        width: 200px; height: 8px; background: rgba(0,0,0,0.6);
        border-radius: 4px; overflow: hidden; z-index: 100;
        border: 1px solid rgba(255,60,60,0.4);
      `;
      const fill = document.createElement('div');
      fill.id = 'boss-hp-fill';
      fill.style.cssText = `
        height: 100%; background: linear-gradient(90deg, #ff2222, #ff6644);
        border-radius: 4px; transition: width 0.2s ease;
      `;
      bar.appendChild(fill);
      document.body.appendChild(bar);
    }
    bar.style.display = 'block';
    const fill = document.getElementById('boss-hp-fill');
    if (fill) fill.style.width = `${(current / max) * 100}%`;
  }

  hideBossHP() {
    const bar = document.getElementById('boss-hp-bar');
    if (bar) bar.style.display = 'none';
  }

  // ─── First-time Scope Hint ──────────────────
  showScopeHint() {
    let hint = document.getElementById('scope-hint');
    if (!hint) {
      if (!document.getElementById('scope-hint-style')) {
        const style = document.createElement('style');
        style.id = 'scope-hint-style';
        style.textContent = `
          @keyframes scopeHintFlash {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.2; }
          }
        `;
        document.head.appendChild(style);
      }
      hint = document.createElement('div');
      hint.id = 'scope-hint';
      hint.textContent = 'PRESS [SPACE] TO SCOPE IN';
      hint.style.cssText = `
        position: fixed; top: 72%; left: 50%; transform: translateX(-50%);
        font-family: var(--font-display, sans-serif); font-size: 22px; font-weight: 900;
        color: #ffffff; text-shadow: 0 0 10px rgba(0,0,0,0.85), 0 0 20px rgba(255,255,255,0.4);
        text-transform: uppercase; letter-spacing: 3px; text-align: center;
        pointer-events: none; z-index: 100;
        animation: scopeHintFlash 1s ease-in-out infinite;
      `;
      document.body.appendChild(hint);
    }
    hint.style.display = 'block';
  }

  hideScopeHint() {
    const hint = document.getElementById('scope-hint');
    if (hint) hint.style.display = 'none';
  }
}
