// ═══════════════════════════════════════════════
// Gary's Life — Main Game Engine
// State machine, render loop, ties everything
// ═══════════════════════════════════════════════

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { Economy, BIRDS, RARITY_COLORS, WEAPON_SKINS, CONSUMABLES } from './economy.js';
import { checkChallenges } from './challenges.js';
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
import { Story } from './story.js';
import { TrailWorld } from './trail_world.js';
import { ShedInterior } from './shed.js';
import { MarketWorld } from './market.js';
import { BikeController } from './bike.js';
import { Settings } from './settings.js';

// ─── Game States ─────────────────────────────
const STATE = {
  AUTH:       'AUTH',
  TITLE:      'TITLE',
  MORNING:    'MORNING',
  HUNTING:    'HUNTING',
  RESULTS:    'RESULTS',
  SHOP:       'SHOP',
  LOCKER:     'LOCKER',
  SLEEP:      'SLEEP',
  WIN:        'WIN',
  TRAIL_WALK: 'TRAIL_WALK',
  SHED:       'SHED',
  BIKE_RIDE:  'BIKE_RIDE',
  MARKET:     'MARKET',
  PAUSED:     'PAUSED'
};

class Game {
  constructor() {
    this.state = STATE.TITLE;
    this.canvas = document.getElementById('game-canvas');

    // Settings load first — the chosen graphics quality decides renderer
    // options below (antialias is set at construction and can't change later).
    this.settings = new Settings();
    const _q = this.settings.get('graphicsQuality');

    // ─── Three.js Setup ────────────────────
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: _q !== 'low',           // MSAA is expensive on weak GPUs (Chromebooks)
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(1); // real value applied by _applyGraphicsQuality()
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = _q === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    // Shadows are static (the sun never moves), so don't recompute them every
    // frame — we re-render the shadow map only when the world changes.
    this.renderer.shadowMap.autoUpdate = false;
    this._lastShadowKey = null;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 600);
    this.camera.position.set(0, 1.6, 0);

    // ─── Post-Processing ───────────────────
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();

    this.bloomPass = new UnrealBloomPass(
      // Half-resolution bloom — visually near-identical, ~4x cheaper.
      new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2),
      0.8,  // strength
      0.5,  // radius
      0.6   // threshold
    );
    this.composer.addPass(this.bloomPass);

    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);

    // (Settings were created above, before the renderer.)

    // ─── Systems ───────────────────────────
    this.auth = new Auth();
    this.economy = new Economy();
    this.story = new Story();
    this.audio = new AudioSystem();
    this.sky = new SkySystem(this.scene);
    this.particles = new ParticleSystem(this.scene);
    this.player = new Player(this.camera, this.canvas);
    this.birds = new BirdSystem(this.scene);
    this.weapons = new WeaponSystem(this.camera, this.scene);
    this.world = new WorldSystem(this.scene);
    this.hud = new HUD();
    this.ui = new UI(this.economy, this.audio);
    this.ui._storyRef = this.story;
    this.ui._settings = this.settings; // give UI access to story for quest shop

    // Story-specific active systems (null when inactive)
    this.trailWorld = null;
    this.shedInterior = null;
    this.bikeController = null;

    // Speech bubble timing
    this.speechTimer = 0;

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

    // Killstreak — consecutive kills without a miss (for the leaderboard).
    // Unlike the combo it does NOT reset on the 3s timer, only on a miss.
    this._killstreak = 0;

    // Double-pump: per-weapon ammo tracking
    this.weaponAmmo = {};

    // Admin cheat
    this._cheatBuffer = '';

    // Scope / ADS
    this._scoping = false;
    this._scopeFOV = 30;   // zoomed-in FOV
    this._normalFOV = 70;  // default FOV
    this._currentFOV = 70;
    this._normalSens = this.player.mouseSensitivity;

    // ─── Pause state ───────────────────────
    this._pauseReturnState = null;
    this._settingsFromPause = false;
    this.player.onUnlock = () => this._onPointerUnlock();

    // Apply saved settings
    this.audio.setMasterVolume(this.settings.get('masterVolume'));
    this.player.sensitivityMultiplier = this.settings.get('mouseSensitivity');
    this._applyGraphicsQuality(this.settings.get('graphicsQuality'));

    // Slo-Mo Gun state
    this._slomoTimer = 0;        // how long scoped (max 3s)
    this._slomoCooldown = 0;     // cooldown before can scope again
    this._slomoActive = false;   // is slomo effect currently on
    // Rail Gun continuous beam state
    this._beamFiring = false;
    this._beamHeat = 0;
    this._beamCooldown = 0;
    this._beamRaycaster = new THREE.Raycaster();
    this._beamRaycaster.far = 200;
    this._beamMesh = null;
    this.birdSpeedMultiplier = 1; // passed to bird system

    // ─── Bird attack / poop system (higher dimensions) ───
    this._poops = [];                 // active falling droppings
    this._poopTimer = 0;              // time until next attack attempt
    this._poopSlowUntil = 0;         // timestamp: movement slowed until
    this._basePlayerSpeed = this.player.moveSpeed; // restore point for slow
    this.BIRD_ATTACK_MIN_DIM = 3;     // dimensions >= this get aggressive birds

    // ─── Clock ─────────────────────────────
    this.clock = new THREE.Clock();

    // ─── Events ────────────────────────────
    window.addEventListener('resize', () => this._onResize());
    this.canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
    this.canvas.addEventListener('mouseup', (e) => this._onMouseUp(e));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('keydown', (e) => this._onKeyDown(e));
    document.addEventListener('keyup', (e) => this._onKeyUp(e));

    // ─── Auth Callbacks ────────────────────
    this.ui.onLogin = (u, p) => this._handleLogin(u, p);
    this.ui.onSignup = (u, p, c) => this._handleSignup(u, p, c);
    this.ui.onLogout = () => this._handleLogout();

    // ─── UI Callbacks ──────────────────────
    this.ui.onStartGame = () => this._startGame();
    this.ui.onStartHunt = () => {
      // If story quest is bought and it's morning, start trail walk instead
      if (this.story.getPhase() === 'bought' || this.story.getPhase() === 'walking') {
        this._startTrailWalk();
      } else {
        this._startHunt();
      }
    };
    this.ui.onGoToShop = () => {
      if (this.settings.get('deviceType') === 'other') {
        this._goToMarket();
      } else {
        this._shopReturnsToMarket = false;
        this.state = STATE.SHOP;
        this.ui.showShop();
      }
    };
    this.ui.onGoToLocker = () => {
      this.ui.showLocker();
      this.state = STATE.LOCKER;
    };
    this.ui.onLockerBack = () => {
      this.ui.showScreen('results');
      this.state = STATE.RESULTS;
    };
    this.ui.onSkipToSleep = () => this._goToSleep();
    this.ui.onShopBack = () => this._exitShop();
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

    this.ui.onTrade = async () => {
      try {
        const { getPendingTrades, getPlayersInDimension } = await import('./trading.js');
        const uid = this.auth.getUid();
        const displayName = this.auth.getDisplayName();
        const pending = await getPendingTrades(uid);
        const players = await getPlayersInDimension(this.economy.dimension, uid);
        this.ui.showTradeScreen(uid, displayName, pending, players);
      } catch (e) {
        console.warn('Trade screen failed:', e);
      }
    };

    this.ui.onFriends = () => {
      const uid = this.auth.getUid();
      const displayName = this.auth.getDisplayName();
      if (uid) this.ui.showFriends(uid, displayName);
    };

    this.ui.onTournament = () => {
      const uid = this.auth.getUid();
      const displayName = this.auth.getDisplayName();
      if (uid) this.ui.showTournament(uid, displayName, this.economy);
    };

    this.ui.onClan = () => {
      const uid = this.auth.getUid();
      const displayName = this.auth.getDisplayName();
      if (uid) this.ui.showClan(uid, displayName, this.economy);
    };

    // ─── Pause / Settings / Credits Callbacks
    this.ui.onResume = () => this._resumeGame();
    this.ui.onQuitToTitle = () => this._quitToTitle();
    this.ui.onEndHunt = () => this._endHuntFromPause();
    this.ui.onPauseSettings = () => this._openSettings(true);
    this.ui.onPauseCredits = () => this._openCredits(true);
    this.ui.onTitleSettings = () => this._openSettings(false);
    this.ui.onTitleCredits = () => this._openCredits(false);
    this.ui.onSettingsBack = () => this._closeSettings();
    this.ui.onCreditsBack = () => this._closeCredits();
    this.ui.onSettingChange = (key, value) => this._applySetting(key, value);
    this.ui.onFullscreenToggle = () => this._toggleFullscreen();

    // ─── Initial state ─────────────────────
    this.sky.setPreset('backyard');
    this.ui.showScreen('login');
    this.state = STATE.AUTH;

    // Start render loop
    this._animate();
  }

  // ─── Auth Handlers ───────────────────────────

  async _handleLogin(username, password) {
    const result = await this.auth.login(username, password);
    if (result.success) {
      this.economy.setUid(this.auth.getUid());
      this.economy.setDisplayName(this.auth.getDisplayName());
      await this.economy.load();
      try { await this.economy.captureReferral(); this.economy.recordLogin(); await this.economy.refreshReferrals(); } catch (e) {}
      // Restore story state from cloud save
      if (this.economy.story) this.story.deserialize(this.economy.story);

      this.economy.updateLeaderboard(this.auth.getDisplayName());
      this.ui.showTitle(this.auth.getDisplayName());
      this.state = STATE.TITLE;
    } else {
      this.ui.showLoginError(result.error);
    }
  }

  async _handleSignup(username, password, confirm) {
    const result = await this.auth.signup(username, password, confirm);
    if (result.success) {
      this.economy.setUid(this.auth.getUid());
      this.economy.setDisplayName(this.auth.getDisplayName());

      this.economy.updateLeaderboard(this.auth.getDisplayName());
      this.ui.showTitle(this.auth.getDisplayName());
      this.state = STATE.TITLE;
    } else {
      this.ui.showSignupError(result.error);
    }
  }



  async _handleLogout() {
    await this.auth.logout();
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

  _disposeMarket() {
    if (this.marketWorld) {
      this.marketWorld.dispose();
      this.marketWorld = null;
    }
    this._shopReturnsToMarket = false;
  }

  _showMorning() {
    this._disposeMarket();
    this.state = STATE.MORNING;
    this.player.unlock();
    this.hud.hide();
    this.ui.showMorning();

    // Load world preview
    const locKey = this.economy.currentLocation;
    this.world.load(locKey);
    this.sky.setPreset(locKey);
    
    if (this.pmremGenerator && this.scene.background) {
      this.scene.environment = this.pmremGenerator.fromScene(this.scene).texture;
    }

    this.player.setObstacles(this.world.obstacles);
    this.player.reset();
    this.birds.clear();
    this.particles.clear();
  }

  // ─── Story: Trail Walk ─────────────────────────

  _startTrailWalk() {
    this.story.startWalking();
    this.state = STATE.TRAIL_WALK;
    this.ui.hideAll();
    this.hud.hide();
    this.audio.stopAmbience();

    // Clear existing world
    this.world.clear && this.world.clear();
    this.world.unload();
    this.birds.clear();
    this.particles.clear();

    // Build trail
    this.trailWorld = new TrailWorld(this.scene, this.renderer);
    const { gary, bunny } = this.trailWorld.spawnCharacters();

    // Hide Gary model -- we ARE Gary in first person
    if (this.trailWorld.gary) this.trailWorld.gary.visible = false;

    if (this.pmremGenerator && this.scene.background) {
      this.scene.environment = this.pmremGenerator.fromScene(this.scene).texture;
    }

    // First-person: use normal player controller
    this.player.reset();
    this.player.position.set(0, 1.6, 0);
    this.player.moveSpeed = 10; // running speed
    this.player.setBounds(200); // large bounds, corridor walls handle clamping
    this.player.setObstacles([]); // trail has its own clamping
    this.camera.position.copy(this.player.position);

    // Place Bunny slightly ahead and to the right
    if (this.trailWorld.bunny) {
      this.trailWorld.bunny.position.set(1.0, 0, -1.5);
    }

    // Request pointer lock so the player can move
    this.player.lock();

    // Show first dialogue
    this.ui.showSpeechBubble('Come on Bunny. It\'s not that far.');
    this.speechTimer = 3;
    this._dialogueGlanceTimer = 0;
  }

  _updateTrailWalk(dt) {
    if (!this.trailWorld) return;

    // Normal first-person movement
    this.player.update(dt);

    // Clamp player to trail corridor
    this.trailWorld.clampPlayer(this.player.position);
    this.camera.position.copy(this.player.position);

    const isMoving = this.player.isMoving();
    const playerPos = this.player.position;

    // Bunny follows player, walking slightly ahead and to the right
    if (this.trailWorld.bunny) {
      const bunny = this.trailWorld.bunny;
      const targetX = playerPos.x + 1.0;
      const targetZ = playerPos.z - 1.5;
      bunny.position.x += (targetX - bunny.position.x) * 3.0 * dt;
      bunny.position.z += (targetZ - bunny.position.z) * 3.0 * dt;
      // Face forward (down the trail)
      bunny.rotation.y = Math.PI;
    }

    // Animate Bunny (limping bob)
    this.trailWorld.animateCharacters(this.clock.elapsedTime, isMoving);

    // Check dialogue triggers
    const line = this.story.checkDialogue(playerPos.z);
    if (line) {
      this.ui.showSpeechBubble(line);
      this._dialogueGlanceTimer = 2.0; // glance at cat for 2 seconds
    }

    // During dialogue, gently tilt camera down toward Bunny
    if (this._dialogueGlanceTimer > 0) {
      this._dialogueGlanceTimer -= dt;
    }

    // Check shed trigger
    if (this.trailWorld.checkShedTrigger(playerPos.z)) {
      this._startShed();
    }
  }

  // ─── Story: Shed ──────────────────────────────

  _startShed() {
    this.story.shedFound();
    this.state = STATE.SHED;
    this.player.unlock();

    // Remove trail world, keep scene
    if (this.trailWorld) { this.trailWorld.dispose(); this.trailWorld = null; }

    // Build shed interior
    this.shedInterior = new ShedInterior(this.scene);
    this.shedInterior.onXPGrant = (xp, label) => {
      const flash = this.story.addXP(xp);
      this.hud.showXPBar(this.story.getXPFraction());
      if (flash) {
        if (flash.text) {
          this.ui.showSpeechBubble(flash.text);
        } else {
          // Final reveal
          this._doGrandpaReveal();
        }
      }
    };
    this.shedInterior.onComplete = () => this._startBikeRide();

    // Place camera inside shed
    this.camera.position.set(0, 1.4, 1.8);
    this.camera.lookAt(0, 1, 0);
    this.player.lock();

    // Show inspect hint
    this.ui.showSpeechBubble('You open the shed door. Inside, under a tarp... something.');
    this.ui.showInspectHint(true);
  }

  _updateShed(dt) {
    if (!this.shedInterior) return;

    // Simple first-person movement inside shed
    this.player.update(dt);
    this.player.position.y = 1.4;
    // Clamp inside shed bounds
    this.player.position.x = Math.max(-2, Math.min(2, this.player.position.x));
    this.player.position.z = Math.max(-2, Math.min(2, this.player.position.z));

    // Check for nearby interactable
    const near = this.shedInterior.getNearestInteractable(this.player.position);
    if (near) {
      this.ui.setInspectLabel(near.label);
    } else {
      this.ui.setInspectLabel('');
    }
  }

  _doGrandpaReveal() {
    this.story.completeQuest();
    this.economy.inventory = this.economy.inventory || { tags: [] };
    // Grant gun
    if (this.economy.weapons['grandpas_rifle']) {
      this.economy.weapons['grandpas_rifle'].owned = true;
    }
    this.economy.save();
    this.ui.showRevealCutscene(() => {
      // After reveal, continue to bike ride
      this._startBikeRide();
    });
  }

  // ─── Story: Bike Ride ─────────────────────────

  _startBikeRide() {
    this.story.startRiding();
    this.state = STATE.BIKE_RIDE;
    if (this.shedInterior) { this.shedInterior.dispose(); this.shedInterior = null; }
    this.ui.showInspectHint(false);
    this.ui.showSpeechBubble('The engine turns over. Time to get home.');

    this.bikeController = new BikeController(this.scene, this.camera);
    this.bikeController.onArriveHome = () => {
      if (this.bikeController) { this.bikeController.dispose(); this.bikeController = null; }
      this.story.startAssembling();
      this.economy.story = this.story.serialize();
      this.economy.save();
      this._goToSleep();
    };
  }

  _updateBikeRide(dt) {
    if (this.bikeController) this.bikeController.update(dt);
  }

  /**
   * Compute currently-active potion effects, accounting for potions whose
   * duration is "half" (only active during the first half of the hunt).
   */
  _getActivePotionEffects() {
    const consumables = this.economy.activeConsumables || [];
    const startTimer = this._huntStartTimer || this.huntTimer || 60;
    const pastHalfway = this.huntTimer <= startTimer / 2;

    let luckMult = 1;
    let legendaryBoost = 0;
    let birdSwarm = false;

    for (const key of consumables) {
      const cons = CONSUMABLES[key];
      if (!cons) continue;
      const isActiveNow = cons.duration === 'full' || (cons.duration === 'half' && !pastHalfway);
      if (!isActiveNow) continue;

      if (cons.luckMult) luckMult = Math.max(luckMult, cons.luckMult);
      if (cons.legendaryBoost) legendaryBoost = Math.max(legendaryBoost, cons.legendaryBoost);
      if (cons.doubleBirds) birdSwarm = true;
    }

    return { luckMult, legendaryBoost, birdSwarm };
  }

  _startHunt() {
    this._disposeMarket();
    this.state = STATE.HUNTING;
    this.ui.hideAll();
    this.hud.show();
    this.ui.showControlsHint();

    const locKey = this.economy.currentLocation;
    const locData = this.economy.getLocation();
    const weaponData = this.economy.getWeapon();

    // Setup world
    this.world.load(locKey);
    this.sky.setPreset(locKey);
    
    // Update PBR environment map
    if (this.pmremGenerator && this.scene.background) {
      this.scene.environment = this.pmremGenerator.fromScene(this.scene).texture;
    }

    this.birds.setAreaSize(locData.areaSize);
    this.player.setBounds(locData.areaSize);
    this.player.setObstacles(this.world.obstacles);
    this.player.reset();
    this.maxActiveBirds = locData.maxBirds + 4;

    // School Device: stationary - aim & shoot, no walking
    this.player.moveSpeed = (this.settings.get('deviceType') === 'school') ? 0 : 5;

    // Apply consumable effects (declared early — used below for steadyHands)
    const consumables = this.economy.activeConsumables || [];

    // Equip weapon with skin
    const skinColors = this._getSkinColors(this.economy.currentWeapon);
    const steadyHands = consumables.includes('steady_hands');
    this.weapons.equipWeapon(this.economy.currentWeapon, weaponData, skinColors, steadyHands);

    // Reset hunt
    this.huntTimer = 60;
    this.huntBag = [];
    this.spawnTimer = 0;
    this._huntEnded = false;
    this.birds.clear();
    this.particles.clear();
    this.hud.clearKillFeed();
    this._cheatBuffer = '';
    this.huntStats = { totalKills: 0, maxCombo: 0, maxKillstreak: 0, missCount: 0, bossKills: 0, earlyKills: 0, moneyEarned: 0 };
    this.hud.hideBossHP();

    // Apply consumable effects
    if (consumables.includes('extra_time')) {
      this.huntTimer = 75;
    }
    if (consumables.includes('bird_magnet')) {
      this.spawnInterval = 1;
    }
    this._doubleMoneyActive = consumables.includes('double_money');
    this._steadyHandsActive = steadyHands;

    // Track hunt duration so "first half" potions know when to wear off
    this._huntStartTimer = this.huntTimer;

    // 2x Birds potion: doubles max active birds & spawns faster all hunt
    const startEffects = this._getActivePotionEffects();
    this._birdSwarmActive = startEffects.birdSwarm;
    if (this._birdSwarmActive) {
      this.maxActiveBirds = Math.max(1, this.maxActiveBirds * 2);
      this.spawnInterval = Math.max(0.5, this.spawnInterval * 0.5);
    }

    // HUD initial values
    this.hud.setDay(this.economy.day);
    this.hud.setLocation(locData.name);
    this.hud.setMoney(this.economy.money);
    this.hud.setAmmo(weaponData.ammo, weaponData.ammo);
    this.hud.setWeaponName(weaponData.name);
    this.hud.setTimer(this.huntTimer);
    this.hud.setCrosshairForWeapon(weaponData);

    // Build weapon slot bar
    this._buildWeaponSlots();

    // Weapon slot click handler
    this.hud.onWeaponSlotClick = (key) => this._switchWeapon(key);

    // Reset combo and double-pump state
    this.comboCount = 0;
    this.comboTimer = 0;
    this._killstreak = 0;
    this.weaponAmmo = {};

    // Reset bird-attack state for the new hunt
    this._clearPoops();
    this._poopTimer = 2 + Math.random() * 3;
    this._poopSlowUntil = 0;
    this.player.moveSpeed = this._basePlayerSpeed;

    // Lock pointer
    this.player.lock();

    // Start ambient audio
    this.audio.startAmbience();

    // Spawn initial birds (2x Birds potion doubles the starting flock)
    const initialBirdCount = this._birdSwarmActive ? 4 : 2;
    for (let i = 0; i < initialBirdCount; i++) {
      const effects = this._getActivePotionEffects();
      const birdKey = this.economy.spawnRandomBird(effects.luckMult, effects.legendaryBoost);
      this.birds.spawn(birdKey);
    }

    // Rebuild weapon slot bar on the next frame too — pointer-lock can
    // suppress the initial paint of newly-added HUD elements in some
    // browsers, so this ensures it's visible immediately rather than
    // only after the first keypress/interaction.
    requestAnimationFrame(() => this._buildWeaponSlots());

    // First-ever hunt: show scope-in hint until the player scopes in once
    if (!this.economy.seenScopeHint) {
      this.hud.showScopeHint();
    } else {
      this.hud.hideScopeHint();
    }
  }

  _fireBeamTick() {
    this._beamRaycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const hit = this.birds.raycastHit(this._beamRaycaster);
    if (!hit) return;
    const { bird, point } = hit;
    const birdData = bird.data;
    this.particles.spawnFeatherBurst(point, birdData.bodyColor, birdData.wingColor);
    this.audio.playBirdHit();
    const killed = this.birds.hit(bird, this.economy.getWeapon().power || 1);
    if (!killed) { this.hud.showBossHP(bird.hp, birdData.hp || 1); return; }
    if (this.birds.isBoss(bird)) { this.hud.hideBossHP(); this.huntStats.bossKills++; }
    this.comboCount++;
    this.comboTimer = this.comboTimeout;
    this._killstreak++;
    if (this._killstreak > this.huntStats.maxKillstreak) this.huntStats.maxKillstreak = this._killstreak;
    const comboMultiplier = this._getComboMultiplier();
    const fluctuation = 0.85 + Math.random() * 0.3;
    let earnedValue = Math.round(birdData.value * fluctuation);
    if (this._doubleMoneyActive) earnedValue *= 2;
    earnedValue = Math.round(earnedValue * (1 + this.economy.getEarnBonus()));
    earnedValue = Math.round(earnedValue * this.economy.petMultiplier());
    this.huntBag.push({ key: bird.birdKey, combo: comboMultiplier, earnedValue: earnedValue });
    this.economy.totalBirdsKilled++;
      this.economy.addBattlePassXP(8 + Math.round(comboMultiplier || 1));
    this.huntStats.moneyEarned += earnedValue;
    this.huntStats.totalKills++;
    if (this.comboCount > this.huntStats.maxCombo) this.huntStats.maxCombo = this.comboCount;
    const rarityColor = RARITY_COLORS[birdData.rarity] || '#aaa';
    this.hud.addKill(birdData.name, earnedValue, rarityColor, this.comboCount, comboMultiplier);
    this.hud.showMoneyPopup(earnedValue, comboMultiplier);
    this.hud.showHitMarker();
    this.hud.showCombo(this.comboCount, comboMultiplier);
  }

  _showBeam(on) {
    if (!on) { if (this._beamMesh) this._beamMesh.visible = false; return; }
    const length = 120;
    if (!this._beamMesh) {
      const g = new THREE.Group();
      const addMat = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
      // Bright inner core (runs the length of the beam, base at local y=0).
      // Translate the geometry so it spans y:[0,1] — a plain position offset is
      // NOT scaled, so scaling y to `length` later would push a centered
      // cylinder half its length *behind* the muzzle (beam shooting backward).
      const coreGeo = new THREE.CylinderGeometry(0.03, 0.03, 1, 8); coreGeo.translate(0, 0.5, 0);
      const core = new THREE.Mesh(coreGeo, addMat(0x9fe8ff, 0.5));
      g.add(core);
      // Soft outer glow
      const glowGeo = new THREE.CylinderGeometry(0.11, 0.11, 1, 8); glowGeo.translate(0, 0.5, 0);
      const glow = new THREE.Mesh(glowGeo, addMat(0x2aa0ff, 0.16));
      g.add(glow);
      // Traveling energy nodes that pulse + jitter along the beam
      const nodes = [];
      for (let i = 0; i < 12; i++) {
        const n = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), addMat(0xbfeeff, 0.5));
        g.add(n); nodes.push(n);
      }
      g.userData = { core, glow, nodes };
      this.scene.add(g);
      this._beamMesh = g;
    }
    const g = this._beamMesh;
    g.visible = true;
    // Start at the muzzle and aim at the crosshair point so the beam comes out
    // of the gun tip and converges at screen center (not off-axis from a corner).
    const origin = this.weapons.getBarrelWorldPos ? this.weapons.getBarrelWorldPos() : this.camera.position.clone();
    const camDir = this.player.getForwardDirection().clone().normalize();
    const aimPoint = this.camera.position.clone().add(camDir.multiplyScalar(150));
    const dir = aimPoint.clone().sub(origin).normalize();
    // Push the start forward to the actual barrel tip so the beam begins at the
    // muzzle (not behind the gun, near the camera).
    g.position.copy(origin.clone().add(dir.clone().multiplyScalar(-0.4)));
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const t = performance.now() / 1000;
    const { core, glow, nodes } = g.userData;
    // Core: rapid thickness pulse + flicker + slight elliptical jitter (shake)
    const cp = 0.7 + 0.5 * Math.abs(Math.sin(t * 24));
    core.scale.set(cp + Math.random() * 0.3, length, cp + Math.random() * 0.3);
    core.material.opacity = 0.45 + Math.random() * 0.15;
    // Glow: slower pulse, flickering opacity + hue drift (cyan to electric blue)
    const gp = 0.8 + 0.45 * Math.sin(t * 13);
    glow.scale.set(gp + Math.random() * 0.4, length, gp + Math.random() * 0.4);
    glow.material.opacity = 0.1 + 0.12 * Math.abs(Math.sin(t * 9));
    glow.material.color.setHSL(0.55 + 0.06 * Math.sin(t * 5), 1.0, 0.6);
    // Nodes: stream of pulses traveling outward with lateral shake
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.position.y = (t * 70 + i * (length / nodes.length)) % length;
      n.position.x = (Math.random() - 0.5) * 0.14;
      n.position.z = (Math.random() - 0.5) * 0.14;
      n.scale.setScalar(0.5 + 0.9 * Math.abs(Math.sin(t * 18 + i * 1.7)));
      n.material.opacity = 0.3 + 0.4 * Math.abs(Math.sin(t * 26 + i * 2.1));
    }
  }

  _updateBeamHeatUI() {
    let el = document.getElementById('beam-heat');
    const cooling = this._beamCooldown > 0;
    const firing = this._beamFiring && this._beamHeat > 0;
    if (cooling || firing) {
      if (!el) {
        el = document.createElement('div');
        el.id = 'beam-heat';
        el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-120px);z-index:60;background:rgba(18,18,28,0.82);color:#fff;font-family:sans-serif;font-size:18px;font-weight:800;padding:8px 18px;border-radius:10px;border:2px solid #66e0ff;text-align:center;pointer-events:none;text-shadow:0 1px 3px #000;';
        document.body.appendChild(el);
      }
      el.style.display = 'block';
      if (cooling) {
        el.style.borderColor = '#ff5544';
        el.textContent = 'OVERHEATED - ' + Math.ceil(this._beamCooldown) + 's';
      } else {
        el.style.borderColor = '#66e0ff';
        el.textContent = 'Rail Gun: ' + (Math.round((5 - this._beamHeat) * 10) / 10) + 's left';
      }
    } else if (el) {
      el.style.display = 'none';
    }
  }

  _updateSlomoCooldownUI(isSlomo) {
    let el = document.getElementById('slomo-cooldown');
    if (isSlomo && this._slomoCooldown > 0) {
      if (!el) {
        el = document.createElement('div');
        el.id = 'slomo-cooldown';
        el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-110px);z-index:60;background:rgba(18,18,28,0.82);color:#fff;font-family:sans-serif;font-size:20px;font-weight:800;padding:10px 20px;border-radius:10px;border:2px solid #ff5544;text-align:center;pointer-events:none;text-shadow:0 1px 3px #000;';
        document.body.appendChild(el);
      }
      el.style.display = 'block';
      el.textContent = 'Wait for the cooldown — ' + Math.ceil(this._slomoCooldown) + 's';
    } else if (el) {
      el.style.display = 'none';
    }
  }

  _resetScope() {
    const _cd = document.getElementById('slomo-cooldown');
    if (_cd) _cd.style.display = 'none';
    this._beamFiring = false;
    if (this._beamMesh) this._beamMesh.visible = false;
    const _bh = document.getElementById('beam-heat');
    if (_bh) _bh.style.display = 'none';
    this._scoping = false;
    this._slomoActive = false;
    this._slomoTimer = 0;
    this._slomoCooldown = 0;
    this.birdSpeedMultiplier = 1;
    this._currentFOV = this._normalFOV;
    if (this.camera) { this.camera.fov = this._normalFOV; this.camera.updateProjectionMatrix(); }
    if (this.player) this.player.mouseSensitivity = this._normalSens;
    if (this.weapons) { this.weapons.isADS = false; if (this.weapons.currentGun) this.weapons.currentGun.visible = true; }
    const vig = document.getElementById('scope-vignette');
    if (vig) { vig.classList.remove('active'); vig.classList.remove('scoped'); }
    const ret = document.getElementById('scope-reticle');
    if (ret) ret.style.display = 'none';
    const ch = document.getElementById('crosshair');
    if (ch) { ch.classList.add('hidden'); ch.style.display = ''; }
  }

  _endHunt() {
    let rankUpResult = null;
    try {
      this.state = STATE.RESULTS;
      this.player.unlock();
      this.hud.hide();
      this._resetScope();
      this.hud.hideBossHP();
      this.hud.hideScopeHint();
      this.hud.hideCombo();
      this.hud.showReloading(false);
      this.ui.hideControlsHint();
      this.audio.stopAmbience();

      // Clear active consumables after hunt
      this.economy.clearActiveConsumables();

      // Record the longest killstreak of this hunt for the leaderboard
      if (this.huntStats.maxKillstreak > (this.economy.bestKillstreak || 0)) {
        this.economy.bestKillstreak = this.huntStats.maxKillstreak;
        this.economy.save();
      }

      // Clean up bird-attack state
      this._clearPoops();
      this.player.moveSpeed = this._basePlayerSpeed;
      this._poopSlowUntil = 0;
      this.audio.stopRailgun();

      // Calculate XP earned from hunt (10 per kill, 50 per boss)
      const huntXP = (this.huntStats.totalKills * 10) + (this.huntStats.bossKills * 50);

      // Award XP FIRST so the results screen shows the updated rank
      if (huntXP > 0) {
        rankUpResult = this.economy.addXP(huntXP);
      }

      // Show results — the UI will handle adding money
      try {
        this.ui.showResults(this.huntBag, this.auth.getDisplayName(), huntXP);
      } catch (err) {
        console.error('[endHunt] showResults error:', err);
        // Fallback: force results screen visible so player is never stuck
        this.ui.showScreen('results');
      }
    } catch (fatalErr) {
      console.error('[endHunt] FATAL ERROR:', fatalErr);
      // Last resort: force results screen
      this.state = STATE.RESULTS;
      try { this.player.unlock(); } catch(_) {}
      try { this.hud.hide(); } catch(_) {}
      try { this.ui.showScreen('results'); } catch(_) {}
    }

    // Show rank-up notification after the screen settles
    if (rankUpResult && rankUpResult.ranked) {
      setTimeout(() => {
        this.ui.showSpeechBubble(`🎖️ RANK UP! ${rankUpResult.newRank.icon} ${rankUpResult.newRank.name}`, 5000);
      }, 1500);
    }

    // Check daily challenges
    if (this.economy.dailyChallenges && this.economy.dailyChallenges.length > 0) {
      const challengeReward = checkChallenges(this.economy.dailyChallenges, this.huntStats);
      if (challengeReward > 0) {
        this.economy.money += challengeReward;
        this.economy.totalMoneyEarned += challengeReward;
        this.economy.save();
      }
    }

    // Check for pending trades (async, non-blocking)
    import('./trading.js').then(({ hasPendingTrades }) => {
      const uid = this.auth.getUid();
      if (uid) {
        hasPendingTrades(uid).then(has => this.ui.setTradeNotification(has)).catch(() => {});
      }
    }).catch(e => console.warn('Trading module load failed:', e));
  }

  // ─── Market Plaza ───────────────────────────

  _goToMarket() {
    this._startMarket();
  }

  _startMarket() {
    this.state = STATE.MARKET;
    this._preMarketLocation = this.economy.currentLocation;
    this.ui.hideAll();
    this.hud.hide();
    this.audio.stopAmbience();

    // Clear existing world
    this.world.clear && this.world.clear();
    this.world.unload();
    this.birds.clear();
    this.particles.clear();

    // Build market plaza
    this.marketWorld = new MarketWorld(this.scene);

    if (this.pmremGenerator && this.scene.background) {
      this.scene.environment = this.pmremGenerator.fromScene(this.scene).texture;
    }

    // First-person controls, spawn near the edge facing the center
    this.player.reset();
    this.player.position.set(0, 1.6, 11);
    this.player.moveSpeed = 6;
    this.player.setBounds(this.marketWorld.size); // 24 — walls block at ~13.5
    this.player.setObstacles(this.marketWorld.obstacles);
    this.camera.position.copy(this.player.position);
    this.player.lock();

    this._eHeld = false;
    this._eHoldTimer = 0;
    this._returnHoldTimer = 0;
    this._shopReturnsToMarket = false;
    this.ui.hideInteractPrompt();
  }

  _updateMarket(dt) {
    if (!this.marketWorld) return;

    this.player.update(dt);
    this.camera.position.copy(this.player.position);

    const playerPos = this.player.position;

    // Billboard the EXIT sign toward the player
    this.marketWorld.update(playerPos);

    // Nearby stand -- hold E to enter that section of the shop
    const stand = this.marketWorld.getNearestStand(playerPos);
    if (stand) {
      if (this._eHeld) {
        this._eHoldTimer += dt;
        const progress = Math.min(this._eHoldTimer / 1.0, 1);
        this.ui.showInteractPrompt(stand.label);
        this.ui.setInteractProgress(progress);
        if (progress >= 1) {
          this._eHoldTimer = 0;
          this._eHeld = false;
          this._enterShopFromStand(stand.category);
          return;
        }
      } else {
        this._eHoldTimer = 0;
        this.ui.showInteractPrompt(stand.label);
        this.ui.setInteractProgress(0);
      }
    } else {
      this._eHoldTimer = 0;
      this.ui.hideInteractPrompt();
    }

    // Center pad -- stand for 2 seconds to return home
    if (this.marketWorld.isInReturnPad(playerPos)) {
      this._returnHoldTimer += dt;
      const progress = Math.min(this._returnHoldTimer / 2.0, 1);
      this.ui.showReturnPrompt('RETURN TO HOME');
      this.ui.setReturnProgress(progress);
      if (progress >= 1) {
        this._exitMarket();
        return;
      }
    } else {
      this._returnHoldTimer = 0;
      this.ui.hideReturnPrompt();
    }
  }

  _enterShopFromStand(category) {
    this.player.unlock();
    this.ui.hideInteractPrompt();
    this.ui.hideReturnPrompt();
    this.state = STATE.SHOP;
    this._shopReturnsToMarket = true;
    // 'all' = open full shop with no section filter
    this.ui.showShop(category);
  }

  _exitShop() {
    if (this._shopReturnsToMarket) {
      this._shopReturnsToMarket = false;
      this.ui.hideAll();
      this.state = STATE.MARKET;
      this._eHeld = false;
      this._eHoldTimer = 0;
      this._returnHoldTimer = 0;
      this.player.lock();
    } else {
      this.ui.showScreen('results');
    }
  }

  _exitMarket() {
    this.player.unlock();
    this.ui.hideInteractPrompt();
    this.ui.hideReturnPrompt();

    if (this.marketWorld) {
      this.marketWorld.dispose();
      this.marketWorld = null;
    }
    this._shopReturnsToMarket = false;

    // Show the location the player was in BEFORE shopping. Buying a new
    // location selects it for the next hunt but shouldn't change surroundings yet.
    const locKey = this._preMarketLocation || this.economy.currentLocation;
    this.world.load(locKey);
    this.sky.setPreset(locKey);
    this.player.setObstacles(this.world.obstacles);

    this.ui.showScreen('results');
    this.state = STATE.RESULTS;
  }

  _goToSleep() {
    this._disposeMarket();
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

  /**
   * Common accounting when a bird is killed (shared by normal shots, piercing
   * shots and the rail-gun beam): boss flags, story XP, combo + killstreak,
   * money (with double-money + pet earn bonus), hunt stats and HUD feedback.
   */
  _awardKill(bird) {
    const birdData = bird.data;

    if (this.birds.isBoss(bird)) {
      this.hud.hideBossHP();
      this.huntStats.bossKills++;
    }

    // Story XP for bird kills
    if (this.story.getPhase() === 'assembling') {
      const flash = this.story.addXP(5);
      this.hud.showXPBar(this.story.getXPFraction());
      if (flash) {
        if (flash.text) {
          this.ui.showSpeechBubble(flash.text);
        } else {
          this._doGrandpaReveal();
        }
      }
      this.economy.story = this.story.serialize();
    }

    // Combo + killstreak
    this.comboCount++;
    this.comboTimer = this.comboTimeout;
    this._killstreak++;
    if (this._killstreak > this.huntStats.maxKillstreak) this.huntStats.maxKillstreak = this._killstreak;
    const comboMultiplier = this._getComboMultiplier();

    // Value (fluctuation, double-money potion, then pet earn bonus)
    const fluctuation = 0.85 + Math.random() * 0.3;
    let earnedValue = Math.round(birdData.value * fluctuation);
    if (this._doubleMoneyActive) earnedValue *= 2;
    earnedValue = Math.round(earnedValue * (1 + this.economy.getEarnBonus()));
    earnedValue = Math.round(earnedValue * this.economy.petMultiplier());
    this.huntBag.push({ key: bird.birdKey, combo: comboMultiplier, earnedValue });
    this.economy.totalBirdsKilled++;
      this.economy.addBattlePassXP(8 + Math.round(comboMultiplier || 1));
    this.huntStats.moneyEarned += earnedValue;

    // Hunt stats
    this.huntStats.totalKills++;
    if (this.huntTimer >= 40) this.huntStats.earlyKills++;
    if (this.comboCount > this.huntStats.maxCombo) this.huntStats.maxCombo = this.comboCount;

    // HUD feedback
    const rarityColor = RARITY_COLORS[birdData.rarity] || '#aaa';
    this.hud.addKill(birdData.name, earnedValue, rarityColor, this.comboCount, comboMultiplier);
    this.hud.showMoneyPopup(earnedValue, comboMultiplier);
    this.hud.showHitFlash();
    this.hud.showHitMarker();
    this.hud.showCombo(this.comboCount, comboMultiplier);
  }

  // ─── Bird attacks: dive-bombing + poop (higher dimensions) ───

  _clearPoops() {
    if (!this._poops) { this._poops = []; return; }
    for (const p of this._poops) {
      if (p.mesh) {
        this.scene.remove(p.mesh);
        if (p.mesh.geometry) p.mesh.geometry.dispose();
        if (p.mesh.material && p.mesh.material.dispose) p.mesh.material.dispose();
      }
    }
    this._poops = [];
  }

  _updatePoop(dt) {
    const dim = this.economy.dimension || 1;
    if (dim < this.BIRD_ATTACK_MIN_DIM) return; // only higher dimensions

    // Difficulty ramps with dimension: attacks come more often deeper in.
    const ramp = Math.min(1, (dim - this.BIRD_ATTACK_MIN_DIM) / 8);
    const interval = 6.5 - 4 * ramp; // ~6.5s down to ~2.5s between attacks

    this._poopTimer -= dt;
    if (this._poopTimer <= 0) {
      this._poopTimer = interval * (0.7 + Math.random() * 0.6);
      const bird = this.birds.diveBomb(this.camera.position.clone());
      if (bird) {
        // Drop the payload a beat after the dive begins, near the low point.
        setTimeout(() => {
          if (this.state === STATE.HUNTING && bird.alive) this._spawnPoopFromBird(bird);
        }, 450);
        // Tougher dimensions can launch a second dropping.
        if (Math.random() < ramp * 0.6) {
          const b2 = this.birds.diveBomb(this.camera.position.clone());
          if (b2) setTimeout(() => {
            if (this.state === STATE.HUNTING && b2.alive) this._spawnPoopFromBird(b2);
          }, 750);
        }
      }
    }

    // Advance existing droppings
    const cam = this.camera.position;
    for (let i = this._poops.length - 1; i >= 0; i--) {
      const p = this._poops[i];
      p.vel.y -= 16 * dt;                 // gravity
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += 6 * dt;

      const hitCam = p.mesh.position.distanceTo(cam) < 1.3 && p.mesh.position.y < cam.y + 0.5;
      const hitGround = p.mesh.position.y <= 0.12;
      if (hitCam || hitGround) {
        if (hitCam) this._splatPlayer();
        else this.particles.spawnFeatherBurst(p.mesh.position.clone(), 0x6b5638, 0x4a3a22);
        this.scene.remove(p.mesh);
        if (p.mesh.geometry) p.mesh.geometry.dispose();
        if (p.mesh.material && p.mesh.material.dispose) p.mesh.material.dispose();
        this._poops.splice(i, 1);
      }
    }
  }

  _spawnPoopFromBird(bird) {
    if (!bird || !bird.mesh) return;
    const start = bird.mesh.position.clone();
    const target = this.camera.position.clone();
    // Aim roughly at the player with a little spread, then let gravity finish.
    const dir = target.sub(start);
    const horiz = Math.hypot(dir.x, dir.z) || 1;
    const vel = new THREE.Vector3(
      (dir.x / horiz) * 3 + (Math.random() - 0.5) * 2,
      -2,
      (dir.z / horiz) * 3 + (Math.random() - 0.5) * 2
    );
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xece6d0, roughness: 1.0 })
    );
    mesh.position.copy(start);
    this.scene.add(mesh);
    this._poops.push({ mesh, vel });
  }

  _splatPlayer() {
    // Defensive gear reduces or negates the hit.
    const def = this.economy.getPoopDefense ? this.economy.getPoopDefense() : { block: 0, slowImmune: false };
    if (Math.random() < def.block) {
      if (this.hud.showToast) this.hud.showToast('🛡️ Blocked!');
      this.audio.playUIClick && this.audio.playUIClick();
      return;
    }
    // Screen splatter + wet splat sound (distinct from a bird hit)
    if (this.hud.showPoopSplat) this.hud.showPoopSplat();
    this.audio.playPoopSplat && this.audio.playPoopSplat();
    // Movement slow (unless gear grants immunity) — mild, lasts as long as the
    // splat is on screen (~5s).
    if (!def.slowImmune) {
      this._poopSlowUntil = (typeof performance !== 'undefined' ? performance.now() : Date.now()) + 5000;
    }
  }

  // ─── Input ─────────────────────────────────
  _applyHitEffects(wpn, point, power, primary) {
    if (wpn.explosive) {
      const r = wpn.blastRadius || 6;
      for (const b of this.birds.birdsInRadius(point, r, primary)) {
        this.particles.spawnFeatherBurst(b.mesh.position.clone(), b.data.bodyColor, b.data.wingColor);
        if (this.birds.hit(b, power)) this._awardKill(b);
      }
    }
    if (wpn.chain) {
      const range = wpn.chainRange || 9;
      let from = point.clone();
      const seen = new Set([primary]);
      for (let i = 0; i < wpn.chain; i++) {
        const cands = this.birds.birdsInRadius(from, range).filter(b => !seen.has(b));
        if (!cands.length) break;
        let nb = cands[0], nd = nb.mesh.position.distanceToSquared(from);
        for (const c of cands) { const d = c.mesh.position.distanceToSquared(from); if (d < nd) { nd = d; nb = c; } }
        seen.add(nb);
        this.particles.spawnFeatherBurst(nb.mesh.position.clone(), nb.data.bodyColor, nb.data.wingColor);
        if (this.birds.hit(nb, power)) this._awardKill(nb);
        from = nb.mesh.position.clone();
      }
    }
  }


  _onMouseDown(e) {
    if (this.state !== STATE.HUNTING) return;
    if (e.button === 2) {
      // Right-click: scope — don't engage while the Slo-Mo Gun is cooling down (prevents flicker)
      if (this.economy.currentWeapon === 'slomo_gun' && this._slomoCooldown > 0) return;
      if (this.economy.currentWeapon === 'slomo_gun' && !this._scoping) this.audio.playSloMoWhoosh();
      this._scoping = true;
      return;
    }
    if (e.button !== 0) return; // left click only

    if (!this.player.isLocked) {
      this.player.lock();
      return;
    }

    // Rail Gun: hold to fire a continuous beam (overheats after 5s)
    if (this.economy.currentWeapon === 'rail_gun') {
      if (this._beamCooldown > 0) { this.audio.playEmptyClick(); return; }
      this._beamFiring = true;
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

    // Shell casing
    const rightDir = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const ejectPos = this.camera.position.clone()
      .add(dir.clone().multiplyScalar(0.4))
      .add(rightDir.clone().multiplyScalar(0.2))
      .add(new THREE.Vector3(0, -0.2, 0));
    this.particles.spawnShellCasing(ejectPos, rightDir);

    // Check hits
    const wpn = this.economy.getWeapon();
    const power = wpn.power || 1;
    let hitSomething = false;

    if (wpn.seek && raycasters[0]) {
      const tgt = this.birds.nearestAimBird(raycasters[0], wpn.seekAngle || 0.9);
      if (tgt) raycasters[0].ray.direction.copy(tgt.mesh.position.clone().sub(raycasters[0].ray.origin).normalize());
    }

    if (wpn.pierce) {
      // Piercing weapon — the shot passes through every bird in line.
      const pierced = this.birds.raycastPierce(raycasters[0]);
      for (const { bird, point } of pierced) {
        const birdData = bird.data;
        this.particles.spawnFeatherBurst(point, birdData.bodyColor, birdData.wingColor);
        hitSomething = true;
        const killed = this.birds.hit(bird, power);
        if (killed) {
          this._awardKill(bird);
        } else {
          this.hud.showBossHP(bird.hp, birdData.hp || 1);
        }
      }
      if (hitSomething) { this.audio.playBirdHit(); this.hud.showHitMarker(); }
    } else {
      for (const rc of raycasters) {
        const hit = this.birds.raycastHit(rc);
        if (hit) {
          hitSomething = true;
          const { bird, point } = hit;
          const birdData = bird.data;

          // Feather burst at hit position
          this.particles.spawnFeatherBurst(point, birdData.bodyColor, birdData.wingColor);
          this.audio.playBirdHit();

          // Hit the bird (boss birds take multiple hits; power = weapon damage)
          const killed = this.birds.hit(bird, power);
          if (wpn.explosive || wpn.chain) this._applyHitEffects(wpn, point, power, bird);

          if (!killed) {
            // Boss took a hit but isn't dead — show HP bar
            this.hud.showBossHP(bird.hp, birdData.hp || 1);
            break;
          }

          this._awardKill(bird);
          break; // One hit per shot
        }
      }
    }

    // Deduct ammo only on a MISS — hitting a bird doesn't cost a bullet
    const wd = this.economy.getWeapon();
    if (!wd.noReload && !hitSomething && !this.economy.hasPetEffect('infiniteAmmo')) {
      this.weapons.ammo--;
      if (this.weapons.ammo <= 0) {
        this.weapons.startReload();
      }
    }

    // Missed — reset combo and killstreak
    if (!hitSomething) {
      this.comboCount = 0;
      this.comboTimer = 0;
      this._killstreak = 0;
      this.hud.hideCombo();
      this.huntStats.missCount++;
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
    this.composer.setSize(window.innerWidth, window.innerHeight);
    this.bloomPass.resolution.set(window.innerWidth / 2, window.innerHeight / 2);
  }

  // ─── Main Loop ─────────────────────────────

  _animate() {
    requestAnimationFrame(() => this._animate());
    const dt = Math.min(this.clock.getDelta(), 0.05); // cap dt

    if (this.state === STATE.HUNTING) {
      this._updateHunt(dt);
    } else if (this.state === STATE.TRAIL_WALK) {
      this._updateTrailWalk(dt);
    } else if (this.state === STATE.SHED) {
      this._updateShed(dt);
    } else if (this.state === STATE.BIKE_RIDE) {
      this._updateBikeRide(dt);
    } else if (this.state === STATE.MARKET) {
      this._updateMarket(dt);
    }

    // Always update visual systems
    this.sky.update(dt);
    this.particles.update(dt);

    // Static shadows: re-render the shadow map only when the world changes
    // (the sun is fixed, so per-frame shadow passes are wasted work).
    if (this.renderer.shadowMap.enabled && this.world && this.world.currentKey !== this._lastShadowKey) {
      this._lastShadowKey = this.world.currentKey;
      this.renderer.shadowMap.needsUpdate = true;
    }

    // Render — skip the post-processing composer entirely when bloom is off
    // (low/medium), which avoids several full-screen passes per frame.
    if (this.bloomPass.enabled) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  _updateHunt(dt) {
    // Timer
    this.huntTimer -= dt;
    this.hud.setTimer(this.huntTimer);

    if (this.huntTimer <= 0 && !this._huntEnded) {
      this._huntEnded = true;
      // Defer out of the animation frame to avoid blocking the renderer
      setTimeout(() => this._endHunt(), 0);
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

    // Scope FOV interpolation
    const isScoped = this._scoping && this.weapons.hasScope;
    const isSlomo = this.economy.currentWeapon === 'slomo_gun';

    // Slo-Mo Gun timer logic
    if (isSlomo && isScoped) {
      this._slomoTimer += dt;
      this._slomoActive = true;
      this.birdSpeedMultiplier = 0.25; // 25% speed

      if (this._slomoTimer >= 3.0) {
        // Auto-unscope after 3 seconds
        this._scoping = false;
        this._slomoTimer = 0;
        this._slomoActive = false;
        this._slomoCooldown = this.economy.hasPetEffect('noCooldown') ? 0 : 5.0;
        this.birdSpeedMultiplier = 1;
      }
    } else {
      if (this._slomoActive) {
        this._slomoActive = false;
        this.birdSpeedMultiplier = 1;
      }
      if (this._slomoCooldown > 0) {
        this._slomoCooldown -= dt;
      }
      this._slomoTimer = 0;
    }

    // Block scoping if slomo is on cooldown
    if (isSlomo && this._slomoCooldown > 0 && this._scoping) {
      this._scoping = false;
    }

    // Slo-Mo cooldown indicator (shows countdown while cooling down)
    this._updateSlomoCooldownUI(isSlomo);

    // Rail Gun continuous beam
    if (this.economy.currentWeapon === 'rail_gun') {
      if (this._beamCooldown > 0) { this._beamCooldown -= dt; this._beamFiring = false; }
      if (this._beamFiring) {
        if (!this.economy.hasPetEffect('noCooldown')) this._beamHeat += dt;
        this._fireBeamTick();
        this._showBeam(true);
        this.audio.startRailgun();   // loop the beam sound while firing
        if (this._beamHeat >= 5) { this._beamFiring = false; this._beamHeat = 0; this._beamCooldown = 4; this.audio.stopRailgun(); }
      } else {
        this._showBeam(false);
        this.audio.stopRailgun();    // released or cooling down
      }
      this._updateBeamHeatUI();
    } else {
      this._showBeam(false);
      this._beamFiring = false;
      this.audio.stopRailgun();
    }

    const targetFOV = this._scoping
      ? (isScoped ? 15 : this._scopeFOV)  // scoped weapons zoom in much more
      : this._normalFOV;
    this._currentFOV += (targetFOV - this._currentFOV) * 8 * dt;
    this.camera.fov = this._currentFOV;
    this.camera.updateProjectionMatrix();

    // Sensitivity scales with zoom
    const sensScale = isScoped ? 0.2 : (this._scoping ? 0.4 : 1);
    this.player.mouseSensitivity = this._normalSens * sensScale;

    // Scope overlay
    const vigEl = document.getElementById('scope-vignette');
    if (vigEl) {
      vigEl.classList.toggle('active', this._scoping);
      vigEl.classList.toggle('scoped', isScoped);
    }

    // Hide gun model when looking through scope (full scope takeover)
    if (this.weapons.currentGun) {
      this.weapons.currentGun.visible = !isScoped;
    }

    // Hide normal crosshair when in scope view, show scope reticle instead
    const crosshairEl = document.getElementById('crosshair');
    const reticleEl = document.getElementById('scope-reticle');
    if (crosshairEl) crosshairEl.style.display = isScoped ? 'none' : '';
    if (reticleEl) reticleEl.style.display = isScoped ? 'block' : 'none';

    // Tell weapon system about ADS state
    this.weapons.isADS = this._scoping;

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

    // Bird updates (pass slo-mo multiplier)
    this.birds.update(dt * this.birdSpeedMultiplier);

    // Bird attacks (dive-bomb + poop) — only on higher dimensions.
    // Wrapped so a problem here can never break the core hunt loop.
    try { this._updatePoop(dt); } catch (e) { console.warn('Bird attack update error:', e); }

    // Apply or clear the poop movement-slow penalty
    const _nowMs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    this.player.moveSpeed = (this._poopSlowUntil > _nowMs)
      ? this._basePlayerSpeed * 0.9   // barely-noticeable slow while splattered
      : this._basePlayerSpeed;

    // Spawn new birds
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval && this.birds.getLivingCount() < this.maxActiveBirds) {
      this.spawnTimer = 0;

      // Boss spawn logic — rarity scales with dimension
      // Dim 1: 5%, Dim 2: 10%, Dim 3: 18%, Dim 4: 25%
      let birdKey;
      const dim = this.economy.dimension;
      const bossChance = [0.05, 0.10, 0.18, 0.25][Math.min(dim - 1, 3)];
      const elapsed = this.huntTimer;
      const potionEffects = this._getActivePotionEffects();

      // Must be past 20s mark, and roll the chance
      if (elapsed <= 40 && Math.random() < bossChance) {
        // Build boss pool for current dimension
        const allBosses = Object.entries(BIRDS).filter(([, b]) => b.bossTier && b.bossDimension <= dim);
        if (allBosses.length > 0) {
          // Weight by tier — lower tiers more common
          // Tier 1: 60%, Tier 2: 30%, Tier 3: 10%
          const tierRoll = Math.random();
          let targetTier;
          if (tierRoll < 0.10 && allBosses.some(([, b]) => b.bossTier === 3)) {
            targetTier = 3;
          } else if (tierRoll < 0.40 && allBosses.some(([, b]) => b.bossTier === 2)) {
            targetTier = 2;
          } else {
            targetTier = 1;
          }

          // Pick a boss from the selected tier that matches current dimension (prefer) or lower
          const tierBosses = allBosses.filter(([, b]) => b.bossTier === targetTier);
          if (tierBosses.length > 0) {
            // Prefer bosses from current dimension
            const dimBosses = tierBosses.filter(([, b]) => b.bossDimension === dim);
            const pool = dimBosses.length > 0 ? dimBosses : tierBosses;
            const pick = pool[Math.floor(Math.random() * pool.length)];
            birdKey = pick[0];
            const bossData = BIRDS[birdKey];
            if (bossData) this.hud.showBossAlert(bossData.name);
          } else {
            birdKey = this.economy.spawnRandomBird(potionEffects.luckMult, potionEffects.legendaryBoost);
          }
        } else {
          birdKey = this.economy.spawnRandomBird(potionEffects.luckMult, potionEffects.legendaryBoost);
        }
      } else {
        birdKey = this.economy.spawnRandomBird(potionEffects.luckMult, potionEffects.legendaryBoost);
      }

      // Flock spawn: 25% chance, max 2 active flocks, not for bosses
      const isBossSpawn = birdKey && BIRDS[birdKey] && (BIRDS[birdKey].hp || 1) > 1;
      if (!isBossSpawn && Math.random() < 0.25 && this.birds.getFlockCount() < 2) {
        this.birds.spawnFlock(birdKey);
      } else {
        this.birds.spawn(birdKey);
      }

      // 2x Birds potion: occasionally spawn a bonus bird alongside this one
      if (this._birdSwarmActive && Math.random() < 0.5 && this.birds.getLivingCount() < this.maxActiveBirds) {
        const bonusKey = this.economy.spawnRandomBird(potionEffects.luckMult, potionEffects.legendaryBoost);
        this.birds.spawn(bonusKey);
      }

      this.spawnInterval = 0.6 + Math.random() * 1.0; // randomize next spawn
    }

    // Keyboard reload (R key)
    // Already handled via natural ammo depletion auto-reload
  }

  // ─── Weapon Switching ─────────────────────────

  _buildWeaponSlots() {
    const ownedKeys = this.economy.getLoadoutWeaponKeys();
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
    const skinColors = this._getSkinColors(weaponKey);
    this.weapons.equipWeapon(weaponKey, weaponData, skinColors);

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

  _getSkinColors(weaponKey) {
    const skinKey = this.economy.equippedSkins[weaponKey];
    if (!skinKey || skinKey === 'default') return null;
    const skin = WEAPON_SKINS[skinKey];
    return skin ? skin.colors : null;
  }

  // ─── Pause / Settings / Credits / Fullscreen ────

  _isPausable(state) {
    return state === STATE.HUNTING || state === STATE.TRAIL_WALK ||
           state === STATE.SHED || state === STATE.BIKE_RIDE ||
           state === STATE.MARKET;
  }

  _pauseGame() {
    if (!this._isPausable(this.state)) return;
    this._pauseReturnState = this.state;
    this.state = STATE.PAUSED;
    this._beamFiring = false;
    this.audio.stopRailgun();    // don't let the beam loop resume after unpausing
    if (this.player.isLocked) this.player.unlock();
    if (this.audio.ctx && this.audio.ctx.state === 'running') this.audio.ctx.suspend();
    this.ui.hideInteractPrompt();
    this.ui.hideReturnPrompt();
    this.ui.showPauseOverlay();
  }

  _resumeGame() {
    if (this.state !== STATE.PAUSED) return;
    this.ui.hideAll();
    this.ui.hidePauseOverlay();
    this.state = this._pauseReturnState || STATE.HUNTING;
    this._pauseReturnState = null;
    if (this.audio.ctx && this.audio.ctx.state === 'suspended') this.audio.ctx.resume();
    this.player.lock();
  }

  _onPointerUnlock() {
    // Fired when pointer lock is lost unexpectedly (e.g. browser auto-exits on Escape)
    if (this._isPausable(this.state)) {
      this._pauseGame();
    }
  }

  _endHuntFromPause() {
    if (this._pauseReturnState !== STATE.HUNTING) return;
    this.ui.hidePauseOverlay();
    this.ui.hideAll();
    if (this.audio.ctx && this.audio.ctx.state === 'suspended') this.audio.ctx.resume();
    this._pauseReturnState = null;
    this._huntEnded = true;
    this._endHunt();
  }

  _quitToTitle() {
    this.ui.hidePauseOverlay();
    this.ui.hideAll();
    this._resetScope();
    this.audio.stopAmbience();
    if (this.audio.ctx && this.audio.ctx.state === 'suspended') this.audio.ctx.resume();
    this._clearPoops();
    this.player.moveSpeed = this._basePlayerSpeed;
    this._poopSlowUntil = 0;
    this.audio.stopRailgun();
    this.hud.hide();
    this.hud.hideBossHP();
    this.hud.hideScopeHint();
    this.hud.hideCombo();
    this.hud.showReloading(false);
    // Dispose story-mode worlds before dropping the references, otherwise their
    // meshes stay parented to the scene and show up as ghost objects (and leak
    // GPU memory) the next time a world is loaded.
    if (this.trailWorld) { this.trailWorld.dispose(); this.trailWorld = null; }
    if (this.shedInterior) { this.shedInterior.dispose(); this.shedInterior = null; }
    if (this.bikeController) { this.bikeController.dispose(); this.bikeController = null; }
    if (this.marketWorld) { this.marketWorld.dispose(); this.marketWorld = null; }
    this._pauseReturnState = null;
    this._shopReturnsToMarket = false;
    this.state = STATE.TITLE;
    this.ui.showTitle(this.auth.getDisplayName());
  }

  _openSettings(fromPause) {
    this._settingsFromPause = fromPause;
    this.ui.showSettings(this.settings.values);
  }

  _closeSettings() {
    this._returnFromSubScreen();
  }

  _openCredits(fromPause) {
    this._settingsFromPause = fromPause;
    this.ui.showCredits();
  }

  _closeCredits() {
    this._returnFromSubScreen();
  }

  _returnFromSubScreen() {
    this.ui.hideAll();
    if (this._settingsFromPause) {
      this.ui.showPauseOverlay();
    } else {
      this.ui.showScreen('title');
    }
  }

  _applySetting(key, value) {
    this.settings.set(key, value);
    switch (key) {
      case 'masterVolume':
        this.audio.setMasterVolume(value);
        break;
      case 'mouseSensitivity':
        this.player.sensitivityMultiplier = value;
        break;
      case 'graphicsQuality':
        this._applyGraphicsQuality(value);
        break;
    }
  }

  _applyGraphicsQuality(quality) {
    switch (quality) {
      case 'low':
        this.renderer.shadowMap.enabled = false;   // no shadows at all
        this.renderer.setPixelRatio(1);            // 1:1 pixels — huge win on HiDPI
        this.bloomPass.enabled = false;            // bypasses the whole composer
        break;
      case 'medium':
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap; // cheaper than PCFSoft
        this.renderer.setPixelRatio(1);
        this.bloomPass.enabled = false;
        break;
      default: // 'high'
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.bloomPass.enabled = true;
        break;
    }
    // Force the static shadow map to re-render for the new setting.
    this._lastShadowKey = null;
    if (this.renderer.shadowMap.enabled) this.renderer.shadowMap.needsUpdate = true;
  }

  _toggleFullscreen() {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  _onKeyDown(e) {
    // Escape -- pause / resume / back out of settings & credits
    if (e.code === 'Escape') {
      if (this.state === STATE.PAUSED) {
        if (this.ui.isSubScreenOpen()) {
          this._closeSettings();
        } else {
          this._resumeGame();
        }
      } else if (this._isPausable(this.state)) {
        this._pauseGame();
      }
      return;
    }

    // Spacebar scope (hold)
    if (e.code === 'Space' && this.state === STATE.HUNTING && !e.repeat) {
      e.preventDefault();
      if (this.economy.currentWeapon === 'slomo_gun' && !this._scoping && this._slomoCooldown <= 0) this.audio.playSloMoWhoosh();
      this._scoping = true;

      // First time scoping in: dismiss the hint for good
      if (!this.economy.seenScopeHint) {
        this.economy.seenScopeHint = true;
        this.hud.hideScopeHint();
        this.economy.save();
      }
    }

    // E key -- hold to interact in market
    if (e.code === 'KeyE' && this.state === STATE.MARKET && !e.repeat) {
      this._eHeld = true;
    }

    // I key -- inspect in shed
    if (e.code === 'KeyI' && this.state === STATE.SHED && this.shedInterior) {
      const near = this.shedInterior.getNearestInteractable(this.player.position);
      if (near) {
        const result = this.shedInterior.triggerAction(near.action);
        if (result) {
          if (result.text) this.ui.showSpeechBubble(result.text);
          if (result.xp > 0) {
            const flash = this.story.addXP(result.xp);
            this.hud.showXPBar(this.story.getXPFraction());
            if (flash) {
              if (flash.text) setTimeout(() => this.ui.showSpeechBubble(flash.text), 1500);
              else setTimeout(() => this._doGrandpaReveal(), 1500);
            }
            this.economy.story = this.story.serialize();
          }
        }
      }
      return;
    }

    // Admin cheat: type 'qwerty' in the first 10 seconds of a hunt for $500
    if (this.state === STATE.HUNTING && !e.repeat && this.huntTimer >= 50) {
      const letter = e.key.toLowerCase();
      const target = 'qwerty';
      if (letter.length === 1 && letter >= 'a' && letter <= 'z') {
        if (target[this._cheatBuffer.length] === letter) {
          this._cheatBuffer += letter;
          if (this._cheatBuffer === target) {
            this.economy.money += 500;
            this.economy.save();
            this.hud.setMoney(this.economy.money);
            this.hud.showMoneyPopup(500, 1);
            this._cheatBuffer = '';
          }
        } else {
          this._cheatBuffer = letter === target[0] ? letter : '';
        }
      }
    }

    if (this.state !== STATE.HUNTING) return;

    // Number keys 1-9 for weapon switching
    const num = parseInt(e.key);
    if (num >= 1 && num <= 9) {
      const ownedKeys = this.economy.getLoadoutWeaponKeys();
      const idx = num - 1;
      if (idx < ownedKeys.length) {
        this._switchWeapon(ownedKeys[idx]);
      }
    }

    // R for manual reload (skip if noReload weapon)
    if (e.code === 'KeyR') {
      const wd = this.economy.getWeapon();
      if (!wd.noReload) this.weapons.startReload();
    }

  }

  _onMouseUp(e) {
    if (e.button === 2) {
      this._scoping = false;
    }
    if (e.button === 0 && this._beamFiring) {
      this._beamFiring = false;
      if (this._beamHeat < 5) this._beamHeat = 0; // released early - no cooldown
    }
  }

  _onKeyUp(e) {
    if (e.code === 'Space') {
      this._scoping = false;
    }
    if (e.code === 'KeyE') {
      this._eHeld = false;
      this._eHoldTimer = 0;
    }
  }
}

// --- Start -----------------------------------------
const game = new Game();
