// ═══════════════════════════════════════════════
// Gary's Life — Main Game Engine
// State machine, render loop, ties everything
// ═══════════════════════════════════════════════

import * as THREE from 'three';
import { Economy, BIRDS, RARITY_COLORS } from './economy.js';
import { AudioSystem } from './audio.js';
import { SkySystem } from './skybox.js';
import { ParticleSystem } from './particles.js';
import { Player } from './player.js';
import { BirdSystem } from './birds.js';
import { WeaponSystem } from './weapons.js';
import { WorldSystem } from './world.js';
import { HUD } from './hud.js';
import { UI } from './ui.js';
import { Auth } from './auth.js';

// ─── Game States ─────────────────────────────
const STATE = {
  AUTH: 'AUTH',
  TITLE: 'TITLE',
  MORNING: 'MORNING',
  HUNTING: 'HUNTING',
  RESULTS: 'RESULTS',
  SHOP: 'SHOP',
  SLEEP: 'SLEEP',
  WIN: 'WIN'
};

class Game {
  constructor() {
    this.state = STATE.TITLE;
    this.canvas = document.getElementById('game-canvas');

    // ─── Three.js Setup ────────────────────
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 600);
    this.camera.position.set(0, 1.6, 0);

    // ─── Systems ───────────────────────────
    this.auth = new Auth();
    this.economy = new Economy();
    this.audio = new AudioSystem();
    this.sky = new SkySystem(this.scene);
    this.particles = new ParticleSystem(this.scene);
    this.player = new Player(this.camera, this.canvas);
    this.birds = new BirdSystem(this.scene);
    this.weapons = new WeaponSystem(this.camera, this.scene);
    this.world = new WorldSystem(this.scene);
    this.hud = new HUD();
    this.ui = new UI(this.economy, this.audio);

    // ─── Hunt state ────────────────────────
    this.huntTimer = 60;
    this.huntBag = [];
    this.spawnTimer = 0;
    this.spawnInterval = 3;
    this.maxActiveBirds = 4;
    this.winShown = false;

    // Combo system
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboTimeout = 3; // seconds to keep combo alive

    // Double-pump: per-weapon ammo tracking
    this.weaponAmmo = {};

    // ─── Clock ─────────────────────────────
    this.clock = new THREE.Clock();

    // ─── Events ────────────────────────────
    window.addEventListener('resize', () => this._onResize());
    this.canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
    document.addEventListener('keydown', (e) => this._onKeyDown(e));

    // ─── Auth Callbacks ────────────────────
    this.ui.onLogin = (u, p) => this._handleLogin(u, p);
    this.ui.onSignup = (u, p, c) => this._handleSignup(u, p, c);
    this.ui.onLogout = () => this._handleLogout();

    // ─── UI Callbacks ──────────────────────
    this.ui.onStartGame = () => this._startGame();
    this.ui.onStartHunt = () => this._startHunt();
    this.ui.onGoToShop = () => this._goToShop();
    this.ui.onSkipToSleep = () => this._goToSleep();
    this.ui.onSleep = () => this._goToSleep();
    this.ui.onContinueAfterWin = () => {
      this.winShown = true;
      this._showMorning();
    };
    this.ui.onRestart = () => {
      this.economy.reset();
      this.winShown = false;
      this._showMorning();
    };

    // ─── Initial state ─────────────────────
    this.sky.setPreset('backyard');
    this.ui.showScreen('login');
    this.state = STATE.AUTH;

    // Start render loop
    this._animate();
  }

  // ─── Auth Handlers ───────────────────────────

  _handleLogin(username, password) {
    const result = this.auth.login(username, password);
    if (result.success) {
      this.economy.setSaveKey(this.auth.getSaveKey());
      this.economy.load();
      this.ui.showTitle(this.auth.getDisplayName());
      this.state = STATE.TITLE;
    } else {
      this.ui.showLoginError(result.error);
    }
  }

  _handleSignup(username, password, confirm) {
    const result = this.auth.signup(username, password, confirm);
    if (result.success) {
      this.economy.setSaveKey(this.auth.getSaveKey());
      this.ui.showTitle(this.auth.getDisplayName());
      this.state = STATE.TITLE;
    } else {
      this.ui.showSignupError(result.error);
    }
  }

  _handleLogout() {
    this.auth.logout();
    this.economy = new Economy();
    this.ui.economy = this.economy;
    this.winShown = false;
    this.ui.showScreen('login');
    this.state = STATE.AUTH;
  }

  // ─── State Transitions ───────────────────────

  _startGame() {
    this.audio.init();
    this._showMorning();
  }

  _showMorning() {
    this.state = STATE.MORNING;
    this.player.unlock();
    this.hud.hide();
    this.ui.showMorning();

    // Load world preview
    const locKey = this.economy.currentLocation;
    this.world.load(locKey);
    this.sky.setPreset(locKey);
    this.player.reset();
    this.birds.clear();
    this.particles.clear();
  }

  _startHunt() {
    this.state = STATE.HUNTING;
    this.ui.hideAll();
    this.hud.show();

    const locKey = this.economy.currentLocation;
    const locData = this.economy.getLocation();
    const weaponData = this.economy.getWeapon();

    // Setup world
    this.world.load(locKey);
    this.sky.setPreset(locKey);
    this.birds.setAreaSize(locData.areaSize);
    this.player.setBounds(locData.areaSize);
    this.player.reset();
    this.maxActiveBirds = locData.maxBirds;

    // Equip weapon
    this.weapons.equipWeapon(this.economy.currentWeapon, weaponData);

    // Reset hunt
    this.huntTimer = 60;
    this.huntBag = [];
    this.spawnTimer = 0;
    this.birds.clear();
    this.particles.clear();
    this.hud.clearKillFeed();

    // HUD initial values
    this.hud.setDay(this.economy.day);
    this.hud.setLocation(locData.name);
    this.hud.setMoney(this.economy.money);
    this.hud.setAmmo(weaponData.ammo, weaponData.ammo);
    this.hud.setWeaponName(weaponData.name);
    this.hud.setTimer(60);
    this.hud.setCrosshairForWeapon(weaponData);

    // Build weapon slot bar
    this._buildWeaponSlots();

    // Weapon slot click handler
    this.hud.onWeaponSlotClick = (key) => this._switchWeapon(key);

    // Reset combo and double-pump state
    this.comboCount = 0;
    this.comboTimer = 0;
    this.weaponAmmo = {};

    // Lock pointer
    this.player.lock();

    // Start ambient audio
    this.audio.startAmbience();

    // Spawn initial birds
    for (let i = 0; i < 2; i++) {
      const birdKey = this.economy.spawnRandomBird();
      this.birds.spawn(birdKey);
    }
  }

  _endHunt() {
    this.state = STATE.RESULTS;
    this.player.unlock();
    this.hud.hide();
    this.audio.stopAmbience();

    // Show results — the UI will handle adding money
    this.ui.showResults(this.huntBag, this.auth.getDisplayName());
  }

  _goToShop() {
    this.state = STATE.SHOP;
    this.ui.showShop();
  }

  _goToSleep() {
    this.state = STATE.SLEEP;

    // Check for win condition
    if (this.economy.hasWon() && !this.winShown) {
      this.economy.save();
      this.ui.showWin();
      this.state = STATE.WIN;
      return;
    }

    this.ui.showSleep(() => {
      this._showMorning();
    });
  }

  // ─── Combo System ───────────────────────────

  _getComboMultiplier() {
    if (this.comboCount <= 1) return 1;
    if (this.comboCount === 2) return 1.5;
    if (this.comboCount === 3) return 2;
    if (this.comboCount === 4) return 2.5;
    return Math.min(3 + (this.comboCount - 5) * 0.5, 5); // caps at 5x
  }

  // ─── Input ─────────────────────────────────

  _onMouseDown(e) {
    if (this.state !== STATE.HUNTING) return;
    if (e.button !== 0) return; // left click only

    if (!this.player.isLocked) {
      this.player.lock();
      return;
    }

    // Try to shoot
    const raycasters = this.weapons.shoot();
    if (!raycasters) {
      // Empty / reloading
      this.audio.playEmptyClick();
      return;
    }

    // Fire sound
    const weaponData2 = this.economy.getWeapon();
    this.audio.playGunshot(weaponData2.isShotgun ? 'shotgun' : 'rifle');

    // Muzzle flash
    const barrelPos = this.weapons.getBarrelWorldPos();
    const dir = this.player.getForwardDirection();
    this.particles.spawnMuzzleFlash(barrelPos, dir);

    // Check hits
    let hitSomething = false;
    for (const rc of raycasters) {
      const hit = this.birds.raycastHit(rc);
      if (hit) {
        hitSomething = true;
        const { bird, point } = hit;
        const birdData = bird.data;

        // Feather burst at hit position
        this.particles.spawnFeatherBurst(point, birdData.bodyColor, birdData.wingColor);
        this.audio.playBirdHit();

        // Kill the bird
        this.birds.kill(bird);

        // Combo system — increase combo on hit
        this.comboCount++;
        this.comboTimer = this.comboTimeout;
        const comboMultiplier = this._getComboMultiplier();

        // Add to bag with combo info
        this.huntBag.push({ key: bird.birdKey, combo: comboMultiplier });
        this.economy.totalBirdsKilled++;

        // HUD feedback with combo
        const rarityColor = RARITY_COLORS[birdData.rarity] || '#aaa';
        const fluctuation = 0.85 + Math.random() * 0.3;
        const value = Math.round(birdData.value * fluctuation);
        this.hud.addKill(birdData.name, value, rarityColor, this.comboCount, comboMultiplier);
        this.hud.showMoneyPopup(value, comboMultiplier);
        this.hud.showHitFlash();
        this.hud.showCombo(this.comboCount, comboMultiplier);

        break; // One hit per shot
      }
    }

    // Hit = keep shooting (ammo untouched). Miss = lose a bullet.
    if (hitSomething) {
      // Nothing to do — ammo stays full, gun stays ready
    } else {
      // Missed — reset combo, lose ammo
      this.comboCount = 0;
      this.comboTimer = 0;
      this.hud.hideCombo();
      this.weapons.ammo--;
      if (this.weapons.ammo <= 0) {
        this.weapons.startReload();
      }
    }

    // Startle nearby birds
    this.birds.startleNear(this.camera.position, 20);

    // Update ammo display
    this.hud.setAmmo(this.weapons.ammo, this.weapons.maxAmmo);
  }

  // ─── Resize ────────────────────────────────

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // ─── Main Loop ─────────────────────────────

  _animate() {
    requestAnimationFrame(() => this._animate());
    const dt = Math.min(this.clock.getDelta(), 0.05); // cap dt

    if (this.state === STATE.HUNTING) {
      this._updateHunt(dt);
    }

    // Always update visual systems
    this.sky.update(dt);
    this.particles.update(dt);

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  _updateHunt(dt) {
    // Timer
    this.huntTimer -= dt;
    this.hud.setTimer(this.huntTimer);

    if (this.huntTimer <= 0) {
      this._endHunt();
      return;
    }

    // Combo timer decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.comboTimer = 0;
        this.hud.hideCombo();
      }
    }

    // Player movement
    this.player.update(dt);

    // Weapon update
    this.weapons.update(dt, this.player.isMoving());

    // Reload indicator
    const reloadProgress = this.weapons.getReloadProgress();
    if (reloadProgress >= 0) {
      this.hud.showReloading(true);
      this.hud.setReloadProgress(reloadProgress);
      if (reloadProgress >= 0.99) {
        this.audio.playReload();
      }
    } else {
      this.hud.showReloading(false);
    }

    // Update ammo display continuously
    this.hud.setAmmo(this.weapons.ammo, this.weapons.maxAmmo);

    // Bird updates
    this.birds.update(dt);

    // Spawn new birds
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval && this.birds.getLivingCount() < this.maxActiveBirds) {
      this.spawnTimer = 0;
      const birdKey = this.economy.spawnRandomBird();
      this.birds.spawn(birdKey);
      this.spawnInterval = 2 + Math.random() * 3; // randomize next spawn
    }

    // Keyboard reload (R key)
    // Already handled via natural ammo depletion auto-reload
  }

  // ─── Weapon Switching ─────────────────────────

  _buildWeaponSlots() {
    const ownedKeys = this.economy.getOwnedWeaponKeys();
    const ownedInfo = ownedKeys.map(key => ({
      key,
      name: this.economy.weapons[key].name
    }));
    this.hud.buildWeaponSlots(ownedInfo, this.economy.currentWeapon);
  }

  _switchWeapon(weaponKey) {
    if (this.state !== STATE.HUNTING) return;
    if (weaponKey === this.economy.currentWeapon) return;
    if (!this.economy.weapons[weaponKey] || !this.economy.weapons[weaponKey].owned) return;

    this.economy.selectWeapon(weaponKey);
    const weaponData = this.economy.getWeapon();
    this.weapons.equipWeapon(weaponKey, weaponData);

    // Double-pump: always full ammo, no reload, ready to fire
    this.weapons.ammo = weaponData.ammo;
    this.weapons.isReloading = false;
    this.weapons.canShoot = true;
    this.weapons.fireCooldown = 0; // instant ready — double pump

    this.hud.setWeaponName(weaponData.name);
    this.hud.setAmmo(this.weapons.ammo, this.weapons.maxAmmo);
    this.hud.setCrosshairForWeapon(weaponData);
    this._buildWeaponSlots();
    this.audio.playReload();
  }

  _onKeyDown(e) {
    if (this.state !== STATE.HUNTING) return;

    // Number keys 1-9 for weapon switching
    const num = parseInt(e.key);
    if (num >= 1 && num <= 9) {
      const ownedKeys = this.economy.getOwnedWeaponKeys();
      const idx = num - 1;
      if (idx < ownedKeys.length) {
        this._switchWeapon(ownedKeys[idx]);
      }
    }

    // R for manual reload
    if (e.code === 'KeyR') {
      this.weapons.startReload();
    }
  }
}

// ─── Start ─────────────────────────────────────
const game = new Game();
