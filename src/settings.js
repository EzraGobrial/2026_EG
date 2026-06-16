// ═══════════════════════════════════════════════
// Gary's Life — Settings
// Persists user preferences (audio, controls, graphics) via localStorage
// ═══════════════════════════════════════════════

const STORAGE_KEY = 'garys_life_settings';

const DEFAULTS = {
  masterVolume: 0.4,
  mouseSensitivity: 1.0,
  graphicsQuality: 'high', // 'low' | 'medium' | 'high'
};

export class Settings {
  constructor() {
    this.values = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULTS };
      const parsed = JSON.parse(raw);
      return { ...DEFAULTS, ...parsed };
    } catch (e) {
      return { ...DEFAULTS };
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
