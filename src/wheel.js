// ═══════════════════════════════════════════════
// Gary's Life — Daily Spin Wheel
//
// One free spin per day. Land on a reward (cash or a potion),
// then optionally DOUBLE it by watching a rewarded ad.
//
// Self-contained: builds its own launcher button, modal, and
// SVG wheel, and injects its own styles. Daily lock is stored
// per-account in localStorage (keyed by uid + date).
//
// Usage (see WHEEL_SETUP.md):
//   import { DailyWheel } from './wheel.js';
//   import { Ads } from './ads.js';
//   this.dailyWheel = new DailyWheel(this.economy, new Ads(), () => {
//     // called after a reward is granted — refresh visible money
//     if (this.state === 'MORNING') this.ui.showMorning();
//     this.hud.setMoney(this.economy.money);
//   });
//   // show the launcher on menus, hide it during hunts:
//   this.dailyWheel.setLauncherVisible(true);   // in _showMorning()
//   this.dailyWheel.setLauncherVisible(false);  // in _startHunt()
// ═══════════════════════════════════════════════

// Wheel segments (order = clockwise from the top pointer).
// weight = relative odds. type 'cash' grants money; 'potion'
// grants one of that consumable key (must exist in CONSUMABLES).
const SEGMENTS = [
  { label: '$50',        type: 'cash',   amt: 50,             weight: 22, color: '#2a2218' },
  { label: '$150',       type: 'cash',   amt: 150,            weight: 18, color: '#3a2c1c' },
  { label: 'Potion',     type: 'potion', key: 'luck_potion_1', weight: 12, color: '#4a2c5a' },
  { label: '$300',       type: 'cash',   amt: 300,            weight: 14, color: '#2a2218' },
  { label: '2x Money',   type: 'potion', key: 'double_money',  weight: 10, color: '#1a3a2a' },
  { label: '$600',       type: 'cash',   amt: 600,            weight: 9,  color: '#3a2c1c' },
  { label: 'Potion',     type: 'potion', key: 'lucky_charm',   weight: 6,  color: '#4a2c5a' },
  { label: 'JACKPOT\n$1500', type: 'cash', amt: 1500,         weight: 3,  color: '#5a3a05' },
];

export class DailyWheel {
  constructor(economy, ads, onReward) {
    this.economy = economy;
    this.ads = ads;
    this.onReward = onReward || (() => {});
    this.spinning = false;
    this.rotation = 0;
    this._injectStyles();
    this._buildLauncher();
    this._buildModal();
  }

  // ─── Daily lock (per account, per calendar day) ──────
  _dayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }
  _storeKey() {
    return `gl_wheel_${(this.economy && this.economy.uid) || 'anon'}_${this._dayKey()}`;
  }
  canSpin() {
    return localStorage.getItem(this._storeKey()) !== '1';
  }
  _markSpun() {
    localStorage.setItem(this._storeKey(), '1');
  }

  // ─── Public ──────────────────────────────────────────
  setLauncherVisible(v) {
    if (this.launcher) this.launcher.style.display = v ? 'flex' : 'none';
    this._refreshLauncher();
  }

  open() {
    this.overlay.style.display = 'flex';
    this._resetForState();
  }

  close() {
    this.overlay.style.display = 'none';
  }

  // ─── Launcher button ─────────────────────────────────
  _buildLauncher() {
    const b = document.createElement('button');
    b.id = 'wheel-launcher';
    b.innerHTML = `<span class="wl-icon">🎡</span><span class="wl-text">Daily Spin</span><span class="wl-dot"></span>`;
    b.style.display = 'none';
    b.addEventListener('click', () => this.open());
    document.body.appendChild(b);
    this.launcher = b;
    this._refreshLauncher();
  }
  _refreshLauncher() {
    if (!this.launcher) return;
    const ready = this.canSpin();
    this.launcher.classList.toggle('ready', ready);
    const dot = this.launcher.querySelector('.wl-dot');
    if (dot) dot.style.display = ready ? 'block' : 'none';
  }

  // ─── Modal + wheel ───────────────────────────────────
  _buildModal() {
    const overlay = document.createElement('div');
    overlay.id = 'wheel-overlay';

    const card = document.createElement('div');
    card.id = 'wheel-card';
    card.innerHTML = `
      <button id="wheel-close" aria-label="Close">×</button>
      <h2 id="wheel-title">Daily Spin</h2>
      <p id="wheel-sub">One free spin every day. Good luck!</p>
      <div id="wheel-stage">
        <div id="wheel-pointer"></div>
        <div id="wheel-rotor">${this._buildWheelSVG()}</div>
      </div>
      <div id="wheel-result"></div>
      <div id="wheel-actions">
        <button id="wheel-spin" class="wheel-btn wheel-btn-primary">SPIN</button>
        <button id="wheel-double" class="wheel-btn wheel-btn-ad" style="display:none">🎬 Double it — Watch Ad</button>
        <button id="wheel-claim" class="wheel-btn wheel-btn-secondary" style="display:none">Claim</button>
      </div>`;
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    this.overlay = overlay;
    this.rotor = card.querySelector('#wheel-rotor');
    this.resultEl = card.querySelector('#wheel-result');
    this.spinBtn = card.querySelector('#wheel-spin');
    this.doubleBtn = card.querySelector('#wheel-double');
    this.claimBtn = card.querySelector('#wheel-claim');
    this.subEl = card.querySelector('#wheel-sub');

    card.querySelector('#wheel-close').addEventListener('click', () => this.close());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this.close(); });
    this.spinBtn.addEventListener('click', () => this._spin());
    this.claimBtn.addEventListener('click', () => this.close());
    this.doubleBtn.addEventListener('click', () => this._doubleViaAd());
  }

  _resetForState() {
    this._lastReward = null;
    this.resultEl.textContent = '';
    this.resultEl.classList.remove('show');
    this.doubleBtn.style.display = 'none';
    this.claimBtn.style.display = 'none';
    if (this.canSpin()) {
      this.spinBtn.style.display = 'inline-block';
      this.spinBtn.disabled = false;
      this.subEl.textContent = 'One free spin every day. Good luck!';
    } else {
      this.spinBtn.style.display = 'none';
      this.subEl.textContent = 'You already spun today — come back tomorrow!';
    }
  }

  _spin() {
    if (this.spinning || !this.canSpin()) return;
    this.spinning = true;
    this.spinBtn.disabled = true;
    this._markSpun();
    this._refreshLauncher();

    const idx = this._weightedPick();
    const seg = SEGMENTS[idx];
    const segAngle = 360 / SEGMENTS.length;
    // land the chosen segment's center under the top pointer
    const jitter = (Math.random() - 0.5) * (segAngle * 0.6);
    const target = 360 * 6 + (360 - (idx * segAngle + segAngle / 2)) + jitter;
    this.rotation += target;
    this.rotor.style.transform = `rotate(${this.rotation}deg)`;

    setTimeout(() => {
      this.spinning = false;
      this._grant(seg, false);
      this._lastReward = seg;
      this._showResult(seg, false);
      // offer the 2x
      this.doubleBtn.style.display = 'inline-block';
      this.claimBtn.style.display = 'inline-block';
    }, 4200); // must match CSS transition duration
  }

  async _doubleViaAd() {
    if (!this._lastReward) return;
    this.doubleBtn.disabled = true;
    const ok = await this.ads.showRewardedAd('Doubling your reward…');
    if (ok) {
      this._grant(this._lastReward, true); // grant the reward a second time
      this._showResult(this._lastReward, true);
    }
    this.doubleBtn.style.display = 'none';
    this.doubleBtn.disabled = false;
  }

  _weightedPick() {
    const total = SEGMENTS.reduce((s, x) => s + x.weight, 0);
    let r = Math.random() * total;
    for (let i = 0; i < SEGMENTS.length; i++) {
      r -= SEGMENTS[i].weight;
      if (r <= 0) return i;
    }
    return SEGMENTS.length - 1;
  }

  _grant(seg, isDouble) {
    const eco = this.economy;
    if (!eco) return;
    if (seg.type === 'cash') {
      eco.money += seg.amt;
      if (eco.totalMoneyEarned !== undefined) eco.totalMoneyEarned += seg.amt;
    } else if (seg.type === 'potion') {
      eco.ownedConsumables = eco.ownedConsumables || {};
      eco.ownedConsumables[seg.key] = (eco.ownedConsumables[seg.key] || 0) + 1;
    }
    if (eco.save) eco.save();
    this.onReward(seg, isDouble);
  }

  _showResult(seg, doubled) {
    const label = seg.type === 'cash'
      ? `$${doubled ? seg.amt * 2 : seg.amt}`
      : `${seg.label} ×${doubled ? 2 : 1}`;
    this.resultEl.textContent = doubled ? `Doubled!  ${label}` : `You won  ${label}!`;
    this.resultEl.classList.add('show');
  }

  // ─── SVG wheel ───────────────────────────────────────
  _buildWheelSVG() {
    const n = SEGMENTS.length;
    const seg = 360 / n;
    const cx = 150, cy = 150, r = 150;
    const toXY = (deg, rad) => {
      const a = (deg - 90) * Math.PI / 180;
      return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
    };
    let paths = '';
    let labels = '';
    for (let i = 0; i < n; i++) {
      const a0 = i * seg, a1 = (i + 1) * seg;
      const [x0, y0] = toXY(a0, r);
      const [x1, y1] = toXY(a1, r);
      paths += `<path d="M${cx},${cy} L${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 0 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z" fill="${SEGMENTS[i].color}" stroke="#d4a853" stroke-width="1.5"/>`;
      const mid = a0 + seg / 2;
      const [lx, ly] = toXY(mid, r * 0.62);
      const lines = SEGMENTS[i].label.split('\n');
      const tspans = lines.map((ln, k) =>
        `<tspan x="${lx.toFixed(2)}" dy="${k === 0 ? 0 : 14}">${ln}</tspan>`).join('');
      labels += `<text x="${lx.toFixed(2)}" y="${(ly - (lines.length - 1) * 7).toFixed(2)}" transform="rotate(${mid} ${lx.toFixed(2)} ${ly.toFixed(2)})" text-anchor="middle" fill="#f5e6d0" font-family="Outfit,sans-serif" font-size="15" font-weight="700">${tspans}</text>`;
    }
    return `<svg viewBox="0 0 300 300" width="300" height="300">
      ${paths}
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#d4a853" stroke-width="4"/>
      <circle cx="${cx}" cy="${cy}" r="26" fill="#221a12" stroke="#d4a853" stroke-width="3"/>
      ${labels}
    </svg>`;
  }

  // ─── Styles ──────────────────────────────────────────
  _injectStyles() {
    if (document.getElementById('wheel-styles')) return;
    const s = document.createElement('style');
    s.id = 'wheel-styles';
    s.textContent = `
      #wheel-launcher{position:fixed;left:20px;bottom:20px;z-index:70;display:none;align-items:center;gap:8px;
        padding:10px 16px;border:none;border-radius:12px;cursor:pointer;font-family:Outfit,sans-serif;font-weight:700;
        font-size:14px;color:#1a1410;background:linear-gradient(135deg,#d4a853,#b8892e);box-shadow:0 6px 18px rgba(0,0,0,0.4)}
      #wheel-launcher .wl-icon{font-size:18px}
      #wheel-launcher.ready{animation:wl-pulse 1.6s ease-in-out infinite}
      #wheel-launcher .wl-dot{width:9px;height:9px;border-radius:50%;background:#e14b3c;display:none}
      @keyframes wl-pulse{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
      #wheel-overlay{position:fixed;inset:0;z-index:9998;display:none;align-items:center;justify-content:center;
        background:rgba(10,8,6,0.7);font-family:Outfit,sans-serif;color:#f5e6d0}
      #wheel-card{position:relative;width:92%;max-width:420px;padding:26px 24px 22px;text-align:center;
        background:#2a2218;border:1px solid rgba(212,168,83,0.35);border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,0.55)}
      #wheel-close{position:absolute;top:12px;right:14px;background:none;border:none;color:#a89a80;font-size:24px;cursor:pointer}
      #wheel-close:hover{color:#f5e6d0}
      #wheel-title{margin:0 0 4px;font-family:'Special Elite',cursive;font-size:28px;color:#d4a853}
      #wheel-sub{margin:0 0 16px;font-size:13px;color:#c8bca8}
      #wheel-stage{position:relative;width:300px;height:300px;margin:0 auto 8px}
      #wheel-rotor{width:300px;height:300px;transition:transform 4.2s cubic-bezier(0.16,1,0.3,1)}
      #wheel-pointer{position:absolute;top:-6px;left:50%;transform:translateX(-50%);z-index:2;
        width:0;height:0;border-left:14px solid transparent;border-right:14px solid transparent;border-top:24px solid #e14b3c;
        filter:drop-shadow(0 2px 3px rgba(0,0,0,0.5))}
      #wheel-result{min-height:26px;margin:10px 0 4px;font-family:'Special Elite',cursive;font-size:22px;color:#d4a853;
        opacity:0;transform:scale(0.9);transition:opacity .3s,transform .3s}
      #wheel-result.show{opacity:1;transform:scale(1)}
      #wheel-actions{display:flex;flex-direction:column;gap:8px;margin-top:6px}
      .wheel-btn{padding:12px 20px;border:none;border-radius:10px;font-family:Outfit,sans-serif;font-weight:700;
        font-size:15px;cursor:pointer}
      .wheel-btn-primary{background:linear-gradient(135deg,#d4a853,#b8892e);color:#1a1410}
      .wheel-btn-primary:disabled{opacity:0.5;cursor:default}
      .wheel-btn-ad{background:linear-gradient(135deg,#3fae5a,#2e8c46);color:#0e1a10}
      .wheel-btn-secondary{background:#3a2f22;color:#e8dcc6}
    `;
    document.head.appendChild(s);
  }
}
