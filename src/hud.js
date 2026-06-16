// ═══════════════════════════════════════════════
// Gary's Life — HUD System
// In-game overlay: ammo, money, timer, kill feed,
// dynamic crosshair, weapon slot bar
// ═══════════════════════════════════════════════

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
    this.moneyDisplay.textContent = amount;
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
      popup.textContent = `+$${boostedValue}`;
      popup.classList.add('combo-boosted');
    } else {
      popup.textContent = `+$${value}`;
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
  showHitMarker() {
    const ch = this.crosshair;
    if (!ch) return;
    ch.style.borderColor = '#ff4444';
    setTimeout(() => { ch.style.borderColor = ''; }, 100);
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
