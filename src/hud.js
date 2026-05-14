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
    this.onWeaponSlotClick = null; // callback set by main.js
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
      // Show spread ring — size based on spread value
      // spread 0.12 = 120px ring, 0.10 = 100px, etc.
      const ringSize = Math.round(weaponData.spread * 1000);
      this.crosshairSpread.style.width = ringSize + 'px';
      this.crosshairSpread.style.height = ringSize + 'px';
      this.crosshairSpread.classList.remove('hidden');
    } else {
      this.crosshairSpread.classList.add('hidden');
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
  addKill(birdName, value, color) {
    const entry = document.createElement('div');
    entry.className = 'kill-entry';
    entry.innerHTML = `<span style="color:${color}">${birdName}</span> — $${value}`;
    this.killFeed.appendChild(entry);
    this.killEntries.push(entry);

    // Remove old entries after 4 seconds
    setTimeout(() => {
      entry.classList.add('fade-out');
      setTimeout(() => {
        if (entry.parentNode) entry.parentNode.removeChild(entry);
        const idx = this.killEntries.indexOf(entry);
        if (idx !== -1) this.killEntries.splice(idx, 1);
      }, 500);
    }, 4000);

    // Keep max 5 visible
    while (this.killEntries.length > 5) {
      const old = this.killEntries.shift();
      if (old.parentNode) old.parentNode.removeChild(old);
    }
  }

  /**
   * Floating +$X popup at screen position
   */
  showMoneyPopup(value) {
    const popup = document.createElement('div');
    popup.className = 'money-popup';
    popup.textContent = `+$${value}`;
    popup.style.left = `${window.innerWidth / 2 + (Math.random() - 0.5) * 80}px`;
    popup.style.top = `${window.innerHeight / 2 - 30 + (Math.random() - 0.5) * 40}px`;
    this.moneyPopupContainer.appendChild(popup);

    setTimeout(() => {
      if (popup.parentNode) popup.parentNode.removeChild(popup);
    }, 1200);
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
}
