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
  if (weaponKey === 'semi_auto') {
    const magGeo = new THREE.BoxGeometry(0.02, 0.08, 0.035);
    const mag = new THREE.Mesh(magGeo, darkMetalMat);
    mag.position.set(0, -0.06, 0.01);
    gun.add(mag);
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
    this.restRotation = new THREE.Euler(0, 0, 0);

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
  }

  /**
   * Try to fire. Returns raycaster if successful, null if not.
   */
  shoot() {
    if (!this.canShoot || this.isReloading || this.ammo <= 0 || this.fireCooldown > 0) {
      return null;
    }

    this.ammo--;
    this.fireCooldown = this.weaponData.fireRate;

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

    // ─── Apply transforms ────────────────
    this.currentGun.position.set(
      this.restPosition.x + bobX,
      this.restPosition.y + bobY - reloadDip,
      this.restPosition.z + recoilZ
    );

    this.currentGun.rotation.set(
      recoilX - reloadDip * 2,
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
