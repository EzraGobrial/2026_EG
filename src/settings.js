// ═══════════════════════════════════════════════
// Gary's Life — Settings
// Persists user preferences (audio, controls, graphics) via localStorage
// ═══════════════════════════════════════════════

const STORAGE_KEY = 'garys_life_settings';

// Guess a sensible graphics quality from the device, used only on first run
// (a saved preference always wins). Chromebooks, phones, and low-core/low-RAM
// machines start on 'low' so the game is smooth out of the box.
function autoDetectQuality() {
  try {
    const ua = navigator.userAgent || '';
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 4; // GB (Chrome only); assume 4 if unknown
    const isChromeOS = /\bCrOS\b/.test(ua);
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    if (isChromeOS || isMobile || cores <= 4 || mem <= 4) return 'low';
    if (cores <= 8 || mem <= 8) return 'medium';
    return 'high';
  } catch (e) {
    return 'medium';
  }
}

const DEFAULTS = {
  masterVolume: 0.4,
  mouseSensitivity: 1.0,
  graphicsQuality: 'high', // 'low' | 'medium' | 'high' (overridden on first run by autoDetectQuality)
  deviceType: 'school', // 'school' = 2D tabbed shop only | 'other' = walk-in market
  seenDevices: false, // has the player opened the Devices setting yet
};

export class Settings {
  constructor() {
    this.values = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // First run (no saved settings): pick a quality that fits this device.
      if (!raw) return { ...DEFAULTS, graphicsQuality: autoDetectQuality() };
      const parsed = JSON.parse(raw);
      return { ...DEFAULTS, ...parsed };
    } catch (e) {
      return { ...DEFAULTS, graphicsQuality: autoDetectQuality() };
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.values));
    } catch (e) {
      // localStorage unavailable — ignore
    }
  }

  get(key) {
    return this.values[key];
  }

  set(key, value) {
    this.values[key] = value;
    this.save();
  }
}
