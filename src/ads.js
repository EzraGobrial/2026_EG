// ═══════════════════════════════════════════════
// Gary's Life — Rewarded Ads + CrazyGames SDK bridge
//
// On CrazyGames, ads are served by the CrazyGames SDK (real,
// paid rewarded + midgame ads). Everywhere else — including the
// standalone web game on your own site — the SDK is never loaded
// and every ad call is a no-op, so the web game is unaffected.
// A short placeholder overlay is used as the rewarded fallback
// off-platform so the wheel's "double it" still works there.
// ═══════════════════════════════════════════════

// ─── CrazyGames SDK bridge (portal-only) ─────────────
// Sets window.CG = { available, env, showAd(type, cb), gameplay(on) }.
// The SDK script is loaded ONLY when a portal (CrazyGames) hosts the
// game — never on github.io / localhost — so your site stays pristine.
(function () {
  if (window.CG) return;
  var api = { available: false, env: 'disabled' };
  var own = /(?:^|\.)github\.io$|^localhost$|^127\.0\.0\.1$/i;
  var standalone = (window.self === window.top) && own.test(location.hostname);

  api.showAd = function (type, cb) {
    try {
      if (api.available && window.CrazyGames && window.CrazyGames.SDK && api.env !== 'disabled') {
        window.CrazyGames.SDK.ad.requestAd(type, {
          adStarted: function () {},
          adFinished: function () { if (cb) cb(true); },
          adError: function () { if (cb) cb(false); },
        });
        return;
      }
    } catch (e) { /* ignore */ }
    if (cb) cb(false); // not on a portal → caller falls back
  };

  api.gameplay = function (on) {
    try {
      if (api.available && window.CrazyGames && window.CrazyGames.SDK && api.env !== 'disabled') {
        on ? window.CrazyGames.SDK.game.gameplayStart()
           : window.CrazyGames.SDK.game.gameplayStop();
      }
    } catch (e) { /* ignore */ }
  };

  window.CG = api;

  if (!standalone) {
    var s = document.createElement('script');
    s.src = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
    s.onload = function () {
      try {
        window.CrazyGames.SDK.init().then(function () {
          api.available = true;
          api.env = window.CrazyGames.SDK.environment;
        }).catch(function () {});
      } catch (e) { /* ignore */ }
    };
    document.head.appendChild(s);
  }
})();

export class Ads {
  constructor() {
    this._overlay = null;
  }

  /**
   * Show a rewarded ad. Resolves TRUE if the ad was watched to
   * completion (grant the reward), FALSE if the player bailed.
   * @param {string} [label] short text shown under the placeholder ad
   * @returns {Promise<boolean>}
   */
  showRewardedAd(label = 'Your reward is on the way…') {
    return this._playAd(label);
  }

  _playAd(label) {
    // On CrazyGames: real rewarded ad via the SDK.
    if (window.CG && window.CG.available && window.CG.env !== 'disabled') {
      return new Promise(function (resolve) {
        window.CG.showAd('rewarded', function (ok) { resolve(!!ok); });
      });
    }
    // Off-platform (your site): short placeholder so "double it" still works.
    return new Promise((resolve) => {
      this._build();
      const { overlay, bar, count, skip } = this._overlay;
      overlay.style.display = 'flex';
      this._labelEl.textContent = label;

      const DURATION = 4; // seconds of "ad"
      let t = 0;
      bar.style.transition = 'none';
      bar.style.width = '0%';
      void bar.offsetWidth;
      bar.style.transition = `width ${DURATION}s linear`;
      bar.style.width = '100%';

      skip.style.display = 'none';
      const finish = (ok) => {
        clearInterval(iv);
        overlay.style.display = 'none';
        resolve(ok);
      };

      const iv = setInterval(() => {
        t += 1;
        count.textContent = Math.max(0, DURATION - t);
        if (t >= DURATION - 1) skip.style.display = 'inline-block';
        if (t >= DURATION) finish(true);
      }, 1000);
      count.textContent = DURATION;

      skip.onclick = () => finish(true);
    });
  }

  _build() {
    if (this._overlay) return;
    const overlay = document.createElement('div');
    overlay.id = 'ad-overlay';
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:10000', 'display:none',
      'align-items:center', 'justify-content:center',
      'background:rgba(8,6,4,0.92)', 'font-family:Outfit,sans-serif', 'color:#f5e6d0',
    ].join(';');

    const box = document.createElement('div');
    box.style.cssText = [
      'width:90%', 'max-width:520px', 'text-align:center', 'padding:28px',
      'background:#221a12', 'border:1px solid rgba(212,168,83,0.3)', 'border-radius:16px',
    ].join(';');

    const adSlot = document.createElement('div');
    adSlot.style.cssText = [
      'height:220px', 'border-radius:12px', 'margin-bottom:16px',
      'display:flex', 'align-items:center', 'justify-content:center',
      'background:linear-gradient(135deg,#3a2c1c,#221a12)',
      'border:1px dashed rgba(212,168,83,0.35)', 'position:relative',
    ].join(';');
    adSlot.innerHTML = `
      <div style="font-family:'Special Elite',cursive;font-size:22px;color:#d4a853">Advertisement</div>
      <div id="ad-count" style="position:absolute;top:10px;right:14px;font-size:14px;color:#a89a80"></div>`;

    const label = document.createElement('div');
    label.style.cssText = 'font-size:15px;color:#d8c8ac;margin-bottom:14px';

    const track = document.createElement('div');
    track.style.cssText = 'height:8px;background:rgba(255,255,255,0.12);border-radius:4px;overflow:hidden';
    const bar = document.createElement('div');
    bar.style.cssText = 'height:100%;width:0%;background:linear-gradient(90deg,#d4a853,#b8892e)';
    track.appendChild(bar);

    const skip = document.createElement('button');
    skip.textContent = 'Claim reward →';
    skip.style.cssText = [
      'margin-top:16px', 'display:none', 'padding:10px 24px', 'border:none', 'border-radius:10px',
      'background:linear-gradient(135deg,#d4a853,#b8892e)', 'color:#1a1410', 'font-weight:700',
      'font-size:15px', 'cursor:pointer',
    ].join(';');

    box.appendChild(adSlot);
    box.appendChild(label);
    box.appendChild(track);
    box.appendChild(skip);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    this._labelEl = label;
    this._overlay = { overlay, bar, count: adSlot.querySelector('#ad-count'), skip };
  }
}
