// ═══════════════════════════════════════════════
// Gary's Life — Rewarded Ads (pluggable)
//
// A tiny wrapper around "rewarded video" ads. Right now it
// plays a short PLACEHOLDER ad overlay and then grants the
// reward. To serve real, paid ads later, replace the body of
// _playAd() with your ad network's rewarded-ad call
// (CrazyGames, GameDistribution, Google Ad Manager, AdinPlay…)
// — nothing else in the game needs to change.
// ═══════════════════════════════════════════════

export class Ads {
  constructor() {
    this._overlay = null;
  }

  /**
   * Show a rewarded ad. Resolves TRUE if the ad was watched to
   * completion (grant the reward), FALSE if the player bailed.
   * @param {string} [label] short text shown under the ad ("Doubling your reward…")
   * @returns {Promise<boolean>}
   */
  showRewardedAd(label = 'Your reward is on the way…') {
    return this._playAd(label);
  }

  // ─── Replace THIS method with a real SDK call for live ads ───
  // Real example (CrazyGames):
  //   return window.CrazyGames.SDK.ad.requestAd('rewarded')
  //     .then(() => true).catch(() => false);
  _playAd(label) {
    return new Promise((resolve) => {
      this._build();
      const { overlay, bar, count, skip } = this._overlay;
      overlay.style.display = 'flex';
      this._labelEl.textContent = label;

      const DURATION = 4; // seconds of "ad"
      let t = 0;
      bar.style.transition = 'none';
      bar.style.width = '0%';
      // force reflow so the transition restarts cleanly
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

      skip.onclick = () => finish(true); // "Claim reward"
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
