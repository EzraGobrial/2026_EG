// ═══════════════════════════════════════════════
// Gary's Life — Weapon System
// 3D gun models, shooting, recoil, raycasting
// ═══════════════════════════════════════════════

import * as THREE from 'three';

/**
 * Build a procedural gun model from Three.js geometry
 */
function buildGunModel(weaponKey) {
  const gun = new THREE.Group();
  
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x6B4226,
    roughness: 0.8,
    metalness: 0.1
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.3,
    metalness: 0.8
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.4,
    metalness: 0.7
  });

  // Adjust appearance per weapon type
  let stockLength = 0.3;
  let barrelLength = 0.5;
  let barrelRadius = 0.012;
  let hasScope = false;
  let stockColor = 0x6B4226;

  let isShotgunModel = false;

  switch (weaponKey) {
    case 'old_rifle':
      stockColor = 0x5a3a1a; // darker, aged wood
      stockLength = 0.28;
      barrelLength = 0.45;
      barrelRadius = 0.014;
      break;
    case 'grandpas_shotgun':
      stockColor = 0x5a3a1a; // matching old wood
      stockLength = 0.3;
      barrelLength = 0.42;
      barrelRadius = 0.02;
      isShotgunModel = true;
      break;
    case 'hunting_rifle':
      stockColor = 0x7B5030;
      stockLength = 0.3;
      barrelLength = 0.5;
      barrelRadius = 0.012;
      break;
    case 'combat_shotgun':
      stockColor = 0x6B4226;
      stockLength = 0.3;
      barrelLength = 0.45;
      barrelRadius = 0.018;
      isShotgunModel = true;
      break;
    case 'scoped_rifle':
      stockColor = 0x5a4020;
      barrelLength = 0.55;
      barrelRadius = 0.011;
      hasScope = true;
      break;
    case 'semi_auto':
      stockColor = 0x333333;
      stockLength = 0.22;
      barrelLength = 0.4;
      barrelRadius = 0.013;
      break;
    // ─── Dimension 2: Tropics ──────────────
    case 'crossbow':
      stockColor = 0x5a3a1a;
      stockLength = 0.2;
      barrelLength = 0.35;
      barrelRadius = 0.008;
      break;
    case 'auto_shotgun':
      stockColor = 0x2a2a2a;
      stockLength = 0.25;
      barrelLength = 0.4;
      barrelRadius = 0.016;
      isShotgunModel = true;
      break;
    // ─── Dimension 3: Arctic ──────────────
    case 'rail_gun':
      stockColor = 0x2a3a4a;
      stockLength = 0.25;
      barrelLength = 0.6;
      barrelRadius = 0.014;
      hasScope = true;
      break;
    case 'slomo_gun':
      stockColor = 0x3a2a4a;
      stockLength = 0.22;
      barrelLength = 0.45;
      barrelRadius = 0.012;
      hasScope = true;
      break;
    // ─── Dimension 4: Desert ──────────────
    case 'laser_rifle':
      stockColor = 0x2a4a2a;
      stockLength = 0.2;
      barrelLength = 0.5;
      barrelRadius = 0.01;
      hasScope = true;
      break;
    case 'plasma_shotgun':
      stockColor = 0x4a3a1a;
      stockLength = 0.28;
      barrelLength = 0.38;
      barrelRadius = 0.022;
      isShotgunModel = true;
      break;
  }

  woodMat.color.setHex(stockColor);

  // ─── Stock (wooden body) ──────────────
  const stockGeo = new THREE.BoxGeometry(0.03, 0.06, stockLength);
  const stock = new THREE.Mesh(stockGeo, woodMat);
  stock.position.set(0, -0.02, stockLength * 0.5);
  gun.add(stock);

  // Stock curve (grip area)
  const gripGeo = new THREE.BoxGeometry(0.028, 0.08, 0.06);
  const grip = new THREE.Mesh(gripGeo, woodMat);
  grip.position.set(0, -0.05, 0.08);
  grip.rotation.x = -0.3;
  gun.add(grip);

  // ─── Barrel ───────────────────────────
  const barrelGeo = new THREE.CylinderGeometry(barrelRadius, barrelRadius, barrelLength, 8);
  barrelGeo.rotateX(Math.PI / 2);
  const barrel = new THREE.Mesh(barrelGeo, metalMat);
  barrel.position.set(0, 0.01, -barrelLength * 0.5 + 0.02);
  gun.add(barrel);

  // Barrel tip
  const tipGeo = new THREE.CylinderGeometry(barrelRadius * 1.3, barrelRadius, 0.02, 8);
  tipGeo.rotateX(Math.PI / 2);
  const tip = new THREE.Mesh(tipGeo, darkMetalMat);
  tip.position.set(0, 0.01, -barrelLength + 0.01);
  gun.add(tip);

  // ─── Trigger guard ────────────────────
  const guardGeo = new THREE.TorusGeometry(0.015, 0.003, 6, 8, Math.PI);
  const guard = new THREE.Mesh(guardGeo, metalMat);
  guard.position.set(0, -0.04, 0.04);
  guard.rotation.z = Math.PI;
  gun.add(guard);

  // ─── Trigger ──────────────────────────
  const triggerGeo = new THREE.BoxGeometry(0.004, 0.015, 0.004);
  const trigger = new THREE.Mesh(triggerGeo, metalMat);
  trigger.position.set(0, -0.035, 0.04);
  gun.add(trigger);

  // ─── Scope (if applicable) ────────────
  if (hasScope) {
    const scopeBody = new THREE.CylinderGeometry(0.015, 0.015, 0.15, 8);
    scopeBody.rotateX(Math.PI / 2);
    const scope = new THREE.Mesh(scopeBody, darkMetalMat);
    scope.position.set(0, 0.04, -0.1);
    gun.add(scope);

    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x4488aa, roughness: 0.1, metalness: 0.9,
      transparent: true, opacity: 0.6
    });
    const lensGeo = new THREE.CircleGeometry(0.014, 8);
    const frontLens = new THREE.Mesh(lensGeo, lensMat);
    frontLens.position.set(0, 0.04, -0.175);
    gun.add(frontLens);
    const rearLens = new THREE.Mesh(lensGeo, lensMat);
    rearLens.position.set(0, 0.04, -0.025);
    rearLens.rotation.y = Math.PI;
    gun.add(rearLens);

    for (const z of [-0.06, -0.14]) {
      const ringGeo = new THREE.TorusGeometry(0.018, 0.004, 6, 8);
      ringGeo.rotateX(Math.PI / 2);
      const ring = new THREE.Mesh(ringGeo, metalMat);
      ring.position.set(0, 0.04, z);
      gun.add(ring);
    }
  }

  // Shotgun: double barrel
  if (isShotgunModel) {
    const barrel2Geo = new THREE.CylinderGeometry(barrelRadius, barrelRadius, barrelLength, 8);
    barrel2Geo.rotateX(Math.PI / 2);
    const barrel2 = new THREE.Mesh(barrel2Geo, metalMat);
    barrel2.position.set(0.022, 0.01, -barrelLength * 0.5 + 0.02);
    gun.add(barrel2);
    barrel.position.x = -0.011;
    barrel2.position.x = 0.011;
  }

  // Semi-auto: magazine
  if (weaponKey === 'semi_auto' || weaponKey === 'auto_shotgun') {
    const magGeo = new THREE.BoxGeometry(0.02, 0.08, 0.035);
    const mag = new THREE.Mesh(magGeo, darkMetalMat);
    mag.position.set(0, -0.06, 0.01);
    gun.add(mag);
  }

  // Crossbow: limbs and string
  if (weaponKey === 'crossbow') {
    const limbMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.7, metalness: 0.2 });
    const limbGeo = new THREE.BoxGeometry(0.18, 0.015, 0.015);
    const limb = new THREE.Mesh(limbGeo, limbMat);
    limb.position.set(0, 0.01, -0.28);
    gun.add(limb);
    // Bowstring
    const stringMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.5 });
    const stringGeo = new THREE.CylinderGeometry(0.001, 0.001, 0.18, 4);
    const string = new THREE.Mesh(stringGeo, stringMat);
    string.position.set(0, 0.01, -0.2);
    string.rotation.z = Math.PI / 2;
    gun.add(string);
    // Bolt
    const boltGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.25, 4);
    boltGeo.rotateX(Math.PI / 2);
    const bolt = new THREE.Mesh(boltGeo, metalMat);
    bolt.position.set(0, 0.02, -0.15);
    gun.add(bolt);
  }

  // Rail Gun: glowing blue energy rails
  if (weaponKey === 'rail_gun') {
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x2288ff, emissive: 0x1144aa, emissiveIntensity: 0.8,
      roughness: 0.2, metalness: 0.9
    });
    for (const x of [-0.015, 0.015]) {
      const railGeo = new THREE.BoxGeometry(0.006, 0.006, barrelLength * 0.8);
      const rail = new THREE.Mesh(railGeo, glowMat);
      rail.position.set(x, 0.01, -barrelLength * 0.4);
      gun.add(rail);
    }
  }

  // Slo-Mo Gun: purple crystal energy
  if (weaponKey === 'slomo_gun') {
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x9944ff, emissive: 0x6622cc, emissiveIntensity: 0.6,
      roughness: 0.1, metalness: 0.5, transparent: true, opacity: 0.8
    });
    const crystalGeo = new THREE.OctahedronGeometry(0.02, 0);
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.set(0, 0.04, -0.08);
    gun.add(crystal);
  }

  // Laser Rifle: green tech prism
  if (weaponKey === 'laser_rifle') {
    const laserMat = new THREE.MeshStandardMaterial({
      color: 0x22ff44, emissive: 0x118822, emissiveIntensity: 0.7,
      roughness: 0.1, metalness: 0.8
    });
    const prismGeo = new THREE.ConeGeometry(0.012, 0.03, 6);
    const prism = new THREE.Mesh(prismGeo, laserMat);
    prism.position.set(0, 0.01, -barrelLength + 0.02);
    prism.rotation.x = Math.PI / 2;
    gun.add(prism);
  }

  // Plasma Shotgun: orange energy core
  if (weaponKey === 'plasma_shotgun') {
    const plasmaMat = new THREE.MeshStandardMaterial({
      color: 0xff6600, emissive: 0xcc4400, emissiveIntensity: 0.5,
      roughness: 0.2, metalness: 0.6, transparent: true, opacity: 0.7
    });
    const coreGeo = new THREE.SphereGeometry(0.018, 8, 8);
    const core = new THREE.Mesh(coreGeo, plasmaMat);
    core.position.set(0, 0.01, -0.1);
    gun.add(core);
  }

  gun.userData.barrelTip = new THREE.Vector3(0, 0.01, -barrelLength);

  return gun;
}

export class WeaponSystem {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    this.gunGroup = new THREE.Group();
    this.camera.add(this.gunGroup);
    this.scene.add(this.camera); // camera must be in scene for children to render

    this.currentGun = null;
    this.currentWeaponKey = null;
    this.weaponData = null;

    // Shooting state
    this.ammo = 1;
    this.maxAmmo = 1;
    this.canShoot = true;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.fireCooldown = 0;

    // Recoil animation
    this.recoilAmount = 0;
    this.recoilRecovery = 0;

    // Bob animation
    this.bobPhase = 0;
    this.bobIntensity = 0;

    // Gun resting position (in camera space)
    this.restPosition = new THREE.Vector3(0.25, -0.2, -0.4);
    this.adsPosition = new THREE.Vector3(0, -0.12, -0.35); // center, below crosshair
    this.scopeAdsPosition = new THREE.Vector3(0, -0.035, -0.25); // looking through scope
    this.restRotation = new THREE.Euler(0, 0, 0);

    // ADS state
    this.isADS = false;
    this._adsLerp = 0; // 0 = hip, 1 = fully ADS
    this.hasScope = false;

    // Raycaster for shooting
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 200;
  }

  equipWeapon(weaponKey, weaponData) {
    // Remove old gun
    if (this.currentGun) {
      this.gunGroup.remove(this.currentGun);
      this.currentGun.traverse(child => {
        if (child.isMesh) {
          child.geometry.dispose();
          if (child.material.dispose) child.material.dispose();
        }
      });
    }

    this.currentWeaponKey = weaponKey;
    this.weaponData = weaponData;
    this.currentGun = buildGunModel(weaponKey);

    // Position in camera space
    this.currentGun.position.copy(this.restPosition);
    this.currentGun.rotation.set(0, 0, 0);
    this.gunGroup.add(this.currentGun);

    // Reset ammo
    this.ammo = weaponData.ammo;
    this.maxAmmo = weaponData.ammo;
    this.canShoot = true;
    this.isReloading = false;
    this.recoilAmount = 0;
    this.hasScope = !!(weaponData.hasScope);
  }

  /**
   * Try to fire. Returns raycaster if successful, null if not.
   */
  shoot() {
    if (!this.canShoot || this.isReloading) {
      return null;
    }

    // Recoil kick
    this.recoilAmount = 1.0;

    // Raycaster from screen center
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    // Apply weapon spread
    const spread = this.weaponData.spread;
    const spreadVec = new THREE.Vector3(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread,
      0
    );
    this.raycaster.ray.direction.add(spreadVec).normalize();

    // For shotgun, return multiple raycasters
    if (this.weaponData.pellets) {
      const casters = [this.raycaster];
      for (let i = 1; i < this.weaponData.pellets; i++) {
        const rc = new THREE.Raycaster();
        rc.far = 200;
        rc.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const s = new THREE.Vector3(
          (Math.random() - 0.5) * spread * 2,
          (Math.random() - 0.5) * spread * 2,
          0
        );
        rc.ray.direction.add(s).normalize();
        casters.push(rc);
      }
      return casters;
    }

    return [this.raycaster];
  }

  startReload() {
    if (this.isReloading || this.ammo >= this.maxAmmo) return;
    this.isReloading = true;
    this.reloadTimer = this.weaponData.reloadTime;
    this.canShoot = false;
  }

  /**
   * Get barrel tip world position for muzzle flash
   */
  getBarrelWorldPos() {
    if (!this.currentGun) return new THREE.Vector3();
    const tipLocal = this.currentGun.userData.barrelTip || new THREE.Vector3(0, 0, -0.5);
    const worldPos = tipLocal.clone();
    this.currentGun.localToWorld(worldPos);
    return worldPos;
  }

  update(dt, isMoving) {
    // Fire cooldown
    if (this.fireCooldown > 0) {
      this.fireCooldown -= dt;
    }

    // Reload
    if (this.isReloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        this.ammo = this.maxAmmo;
        this.canShoot = true;
      }
    }

    if (!this.currentGun) return;

    // ─── Recoil animation ────────────────
    if (this.recoilAmount > 0) {
      this.recoilAmount -= dt * 6;
      if (this.recoilAmount < 0) this.recoilAmount = 0;
    }

    const recoilZ = this.recoilAmount * 0.06;
    const recoilX = this.recoilAmount * -0.15;

    // ─── Walk bob ────────────────────────
    if (isMoving) {
      this.bobIntensity = Math.min(1, this.bobIntensity + dt * 5);
    } else {
      this.bobIntensity = Math.max(0, this.bobIntensity - dt * 3);
    }

    this.bobPhase += dt * 8;
    const bobX = Math.sin(this.bobPhase) * 0.003 * this.bobIntensity;
    const bobY = Math.abs(Math.sin(this.bobPhase * 2)) * 0.004 * this.bobIntensity;

    // ─── Reload dip ─────────────────────
    let reloadDip = 0;
    if (this.isReloading) {
      const reloadProgress = 1 - (this.reloadTimer / this.weaponData.reloadTime);
      reloadDip = Math.sin(reloadProgress * Math.PI) * 0.08;
    }

    // ─── ADS lerp ────────────────────────
    const adsTarget = this.isADS ? 1 : 0;
    this._adsLerp += (adsTarget - this._adsLerp) * 10 * dt;
    this._adsLerp = Math.max(0, Math.min(1, this._adsLerp));

    const targetPos = this.hasScope ? this.scopeAdsPosition : this.adsPosition;
    const hipX = this.restPosition.x + bobX;
    const hipY = this.restPosition.y + bobY - reloadDip;
    const hipZ = this.restPosition.z + recoilZ;

    const adsX = targetPos.x;
    const adsY = targetPos.y - reloadDip;
    const adsZ = targetPos.z + recoilZ * 0.3; // less recoil in ADS

    // ─── Apply transforms ────────────────
    this.currentGun.position.set(
      hipX + (adsX - hipX) * this._adsLerp,
      hipY + (adsY - hipY) * this._adsLerp,
      hipZ + (adsZ - hipZ) * this._adsLerp
    );

    // Reduce bob in ADS
    const adsRecoilScale = 1 - this._adsLerp * 0.6;
    this.currentGun.rotation.set(
      (recoilX - reloadDip * 2) * adsRecoilScale,
      0,
      0
    );
  }

  getReloadProgress() {
    if (!this.isReloading) return -1;
    return 1 - (this.reloadTimer / this.weaponData.reloadTime);
  }

  dispose() {
    if (this.currentGun) {
      this.gunGroup.remove(this.currentGun);
      this.currentGun.traverse(child => {
        if (child.isMesh) {
          child.geometry.dispose();
          if (child.material.dispose) child.material.dispose();
        }
      });
    }
  }
}
