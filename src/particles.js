// ═══════════════════════════════════════════════
// Gary's Life — Particle System
// Feather bursts, muzzle flash, and effects
// ═══════════════════════════════════════════════

import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.activeSystems = [];
  }

  /**
   * Spawn a burst of feathers at the bird position
   */
  spawnFeatherBurst(position, birdColor, birdWingColor) {
    const featherCount = 15 + Math.floor(Math.random() * 10);
    const group = new THREE.Group();
    group.position.copy(position);

    const colors = [
      new THREE.Color(birdColor),
      new THREE.Color(birdWingColor),
      new THREE.Color(0xffffff)
    ];

    const feathers = [];

    for (let i = 0; i < featherCount; i++) {
      // Feather shape: thin elongated plane
      const length = 0.08 + Math.random() * 0.15;
      const width = 0.02 + Math.random() * 0.04;
      const geo = new THREE.PlaneGeometry(width, length);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1.0
      });

      const feather = new THREE.Mesh(geo, mat);

      // Random initial rotation
      feather.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      // Velocity: burst outward
      const speed = 2 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      feather.userData.velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed * 0.5 + 1.5,
        Math.cos(phi) * speed
      );

      feather.userData.rotSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );

      feather.userData.drag = 0.96 + Math.random() * 0.03;

      group.add(feather);
      feathers.push(feather);
    }

    this.scene.add(group);

    this.activeSystems.push({
      type: 'feathers',
      group,
      feathers,
      age: 0,
      maxAge: 2.5
    });
  }

  /**
   * Muzzle flash at gun barrel
   */
  spawnMuzzleFlash(position, direction) {
    // Point light flash
    const light = new THREE.PointLight(0xffaa44, 3, 8);
    light.position.copy(position);
    this.scene.add(light);

    // Flash sprite
    const spriteMat = new THREE.SpriteMaterial({
      color: 0xffcc66,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.4, 0.4, 0.4);
    sprite.position.copy(position);
    this.scene.add(sprite);

    // Small smoke puffs
    const smokeGroup = new THREE.Group();
    const smokePuffs = [];
    for (let i = 0; i < 5; i++) {
      const geo = new THREE.SphereGeometry(0.03 + Math.random() * 0.05, 6, 6);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.3
      });
      const puff = new THREE.Mesh(geo, mat);
      puff.position.copy(position);
      puff.userData.velocity = new THREE.Vector3(
        direction.x * 2 + (Math.random() - 0.5) * 0.5,
        direction.y * 2 + Math.random() * 0.5,
        direction.z * 2 + (Math.random() - 0.5) * 0.5
      );
      smokeGroup.add(puff);
      smokePuffs.push(puff);
    }
    this.scene.add(smokeGroup);

    this.activeSystems.push({
      type: 'muzzle',
      light,
      sprite,
      smokeGroup,
      smokePuffs,
      age: 0,
      maxAge: 0.5
    });
  }

  update(dt) {
    for (let i = this.activeSystems.length - 1; i >= 0; i--) {
      const sys = this.activeSystems[i];
      sys.age += dt;

      if (sys.age >= sys.maxAge) {
        this.removeSys(sys);
        this.activeSystems.splice(i, 1);
        continue;
      }

      const progress = sys.age / sys.maxAge;

      if (sys.type === 'feathers') {
        for (const f of sys.feathers) {
          const v = f.userData.velocity;
          // Gravity
          v.y -= 4.0 * dt;
          // Air resistance
          v.multiplyScalar(Math.pow(f.userData.drag, dt * 60));

          f.position.x += v.x * dt;
          f.position.y += v.y * dt;
          f.position.z += v.z * dt;

          // Tumble
          const rs = f.userData.rotSpeed;
          f.rotation.x += rs.x * dt;
          f.rotation.y += rs.y * dt;
          f.rotation.z += rs.z * dt;

          // Fade out in last 40%
          if (progress > 0.6) {
            f.material.opacity = 1.0 - (progress - 0.6) / 0.4;
          }
        }
      }

      if (sys.type === 'muzzle') {
        // Quick light fade
        sys.light.intensity = 3 * (1 - progress * 4);
        if (sys.light.intensity < 0) sys.light.intensity = 0;

        sys.sprite.material.opacity = Math.max(0, 0.8 - progress * 4);
        sys.sprite.scale.multiplyScalar(1 + dt * 10);

        for (const p of sys.smokePuffs) {
          p.position.add(p.userData.velocity.clone().multiplyScalar(dt));
          p.userData.velocity.multiplyScalar(0.95);
          p.scale.multiplyScalar(1 + dt * 3);
          p.material.opacity = Math.max(0, 0.3 * (1 - progress));
        }
      }
    }
  }

  removeSys(sys) {
    if (sys.type === 'feathers') {
      this.scene.remove(sys.group);
      for (const f of sys.feathers) {
        f.geometry.dispose();
        f.material.dispose();
      }
    }
    if (sys.type === 'muzzle') {
      this.scene.remove(sys.light);
      this.scene.remove(sys.sprite);
      sys.sprite.material.dispose();
      this.scene.remove(sys.smokeGroup);
      for (const p of sys.smokePuffs) {
        p.geometry.dispose();
        p.material.dispose();
      }
    }
  }

  clear() {
    for (const sys of this.activeSystems) {
      this.removeSys(sys);
    }
    this.activeSystems = [];
  }
}
