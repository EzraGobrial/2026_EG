// ═══════════════════════════════════════════════
// Gary's Life — Main Game Engine
// State machine, render loop, ties everything
// ═══════════════════════════════════════════════

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { Economy, BIRDS, RARITY_COLORS } from './economy.js';
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
import { BikeController } from './bike.js';

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
  BIKE_RIDE:  'BIKE_RIDE'
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

    // ─── Post-Processing ───────────────────
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.8,  // strength
      0.5,  // radius
      0.6   // threshold
    );
    this.composer.addPass(this.bloomPass);

    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);

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
    this.ui._storyRef = this.story; // give UI access to story for quest shop

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

    // Slo-Mo Gun state
    this._slomoTimer = 0;        // how long scoped (max 3s)
    this._slomoCooldown = 0;     // cooldown before can scope again
    this._slomoActive = false;   // is slomo effect currently on
    this.birdSpeedMultiplier = 1; // passed to bird system

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
    this.ui.onGoToShop = () => this._goToShop();
    this.ui.onGoToLocker = () => {
      this.ui.showLocker();
      this.state = STATE.LOCKER;
    };
    this.ui.onLockerBack = () => {
      this.ui.showScreen('results');
      this.state = STATE.RESULTS;
    };
    this.ui.onSkipToSleep = () => this._goToSleep();
    this.ui.onShopBack = () => { this.ui.showScreen('results'); };
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
      // Restore story state from cloud save
      if (this.economy.story) this.story.deserialize(this.economy.story);
      this._grantOGTag();
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
      this._grantOGTag();
      this.economy.updateLeaderboard(this.auth.getDisplayName());
      this.ui.showTitle(this.auth.getDisplayName());
      this.state = STATE.TITLE;
    } else {
      this.ui.showSignupError(result.error);
    }
  }

  _grantOGTag() {
    // For testing: give OG tag to everyone who logs in
    // TODO: Later, check if within first 30 days of game launch
    if (!this.economy.inventory) this.economy.inventory = { tags: [] };
    if (!this.economy.inventory.tags.includes('og')) {
      this.economy.inventory.tags.push('og');
      this.economy.save();
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

  _showMorning() {
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
    
    // Update PBR environment map
    if (this.pmremGenerator && this.scene.background) {
      this.scene.environment = this.pmremGenerator.fromScene(this.scene).texture;
    }

    this.birds.setAreaSize(locData.areaSize);
    this.player.setBounds(locData.areaSize);
    this.player.setObstacles(this.world.obstacles);
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
    this._cheatBuffer = '';
    this._bossSpawned = false;
    this.huntStats = { totalKills: 0, maxCombo: 0, missCount: 0, bossKills: 0, earlyKills: 0, moneyEarned: 0 };
    this.hud.hideBossHP();

    // Apply consumable effects
    const consumables = this.economy.activeConsumables || [];
    if (consumables.includes('extra_time')) {
      this.huntTimer = 75;
    }
    if (consumables.includes('bird_magnet')) {
      this.spawnInterval = 1;
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
    this.hud.hideBossHP();
    this.audio.stopAmbience();

    // Clear active consumables after hunt
    this.economy.clearActiveConsumables();

    // Show results — the UI will handle adding money
    this.ui.showResults(this.huntBag, this.auth.getDisplayName());

    // Check daily challenges
    if (this.economy.dailyChallenges && this.economy.dailyChallenges.length > 0) {
      const challengeReward = checkChallenges(this.economy.dailyChallenges, this.huntStats);
      if (challengeReward > 0) {
        this.economy.money += challengeReward;
        this.economy.totalMoneyEarned += challengeReward;
        this.economy.save();
      }
    }

    // Award XP based on hunt performance (10 per kill, 50 per boss)
    const huntXP = (this.huntStats.totalKills * 10) + (this.huntStats.bossKills * 50);
    if (huntXP > 0) {
      const result = this.economy.addXP(huntXP);
      if (result.ranked) {
        setTimeout(() => {
          this.ui.showSpeechBubble(`🎖️ RANK UP! ${result.newRank.icon} ${result.newRank.name}`, 5000);
        }, 1500);
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
    if (e.button === 2) {
      // Right-click: scope
      this._scoping = true;
      return;
    }
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

    // Shell casing
    const rightDir = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const ejectPos = this.camera.position.clone()
      .add(dir.clone().multiplyScalar(0.4))
      .add(rightDir.clone().multiplyScalar(0.2))
      .add(new THREE.Vector3(0, -0.2, 0));
    this.particles.spawnShellCasing(ejectPos, rightDir);

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

        // Hit the bird (boss birds take multiple hits)
        const killed = this.birds.hit(bird);

        if (!killed) {
          // Boss took a hit but isn't dead — show HP bar
          this.hud.showBossHP(bird.hp, birdData.hp || 1);
          break;
        }

        // Bird is dead — hide boss HP if it was a boss
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

        // Combo system — increase combo on hit
        this.comboCount++;
        this.comboTimer = this.comboTimeout;
        const comboMultiplier = this._getComboMultiplier();

        // Add to bag with combo info
        this.huntBag.push({ key: bird.birdKey, combo: comboMultiplier });
        this.economy.totalBirdsKilled++;

        // Hunt stats tracking
        this.huntStats.totalKills++;
        if (this.huntTimer >= 40) this.huntStats.earlyKills++;
        if (this.comboCount > this.huntStats.maxCombo) this.huntStats.maxCombo = this.comboCount;

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
      // Missed — reset combo, lose ammo (unless grandpas_rifle: no reload)
      this.comboCount = 0;
      this.comboTimer = 0;
      this.hud.hideCombo();
      this.huntStats.missCount++;
      const wd = this.economy.getWeapon();
      if (!wd.noReload) {
        this.weapons.ammo--;
        if (this.weapons.ammo <= 0) {
          this.weapons.startReload();
        }
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
    this.composer.setSize(window.innerWidth, window.innerHeight);
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
    }

    // Always update visual systems
    this.sky.update(dt);
    this.particles.update(dt);

    // Render with post-processing
    this.composer.render();
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
        this._slomoCooldown = 5.0;
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

    // Spawn new birds
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval && this.birds.getLivingCount() < this.maxActiveBirds) {
      this.spawnTimer = 0;

      // Boss spawn logic — after 30s mark, 15% chance, once per hunt
      let birdKey;
      if (this.huntTimer <= 30 && Math.random() < 0.15 && !this._bossSpawned) {
        const bossBirds = ['thunderhawk', 'storm_phoenix', 'frost_wyrm', 'sun_dragon'];
        birdKey = bossBirds[Math.min(this.economy.dimension - 1, bossBirds.length - 1)];
        this._bossSpawned = true;
        const bossData = BIRDS[birdKey];
        if (bossData) this.hud.showBossAlert(bossData.name);
      } else {
        birdKey = this.economy.spawnRandomBird();
      }

      this.birds.spawn(birdKey);
      this.spawnInterval = 2 + Math.random() * 3; // randomize next spawn
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
    // Spacebar scope (hold)
    if (e.code === 'Space' && this.state === STATE.HUNTING && !e.repeat) {
      e.preventDefault();
      this._scoping = true;
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
  }

  _onKeyUp(e) {
    if (e.code === 'Space') {
      this._scoping = false;
    }
  }
}

// --- Start -----------------------------------------
const game = new Game();
