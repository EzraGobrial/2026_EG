// ═══════════════════════════════════════════════
// Gary's Life — Player Controller
// First-person camera with pointer lock + WASD
// ═══════════════════════════════════════════════

import * as THREE from 'three';

export class Player {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Position & looking
    this.position = new THREE.Vector3(0, 1.6, 0); // eye height ~1.6m (kid)
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();

    // Settings
    this.moveSpeed = 5.0;
    this.mouseSensitivity = 0.002;
    this.sensitivityMultiplier = 1.0;
    this.height = 1.6;
    this.boundsSize = 30; // will be set by world
    this.obstacles = [];
    this.radius = 0.4; // player collision radius

    // Input state
    this.keys = { forward: false, backward: false, left: false, right: false };
    this.isLocked = false;

    // Called when pointer lock is lost unexpectedly (e.g. Escape, alt-tab)
    this.onUnlock = null;

    // Pointer lock
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onLockChange = this._onLockChange.bind(this);

    document.addEventListener('pointerlockchange', this._onLockChange);
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
  }

  lock() {
    this.domElement.requestPointerLock();
  }

  unlock() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  _onLockChange() {
    if (document.pointerLockElement === this.domElement) {
      this.isLocked = true;
      document.addEventListener('mousemove', this._onMouseMove);
    } else {
      const wasLocked = this.isLocked;
      this.isLocked = false;
      document.removeEventListener('mousemove', this._onMouseMove);
      // Reset keys
      this.keys.forward = false;
      this.keys.backward = false;
      this.keys.left = false;
      this.keys.right = false;
      if (wasLocked && typeof this.onUnlock === 'function') {
        this.onUnlock();
      }
    }
  }

  _onMouseMove(e) {
    if (!this.isLocked) return;
    const sens = this.mouseSensitivity * this.sensitivityMultiplier;
    this.euler.y -= e.movementX * sens;
    this.euler.x -= e.movementY * sens;
    // Clamp vertical look
    this.euler.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.euler.x));
  }

  _onKeyDown(e) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    this.keys.forward = true; break;
      case 'KeyS': case 'ArrowDown':  this.keys.backward = true; break;
      case 'KeyA': case 'ArrowLeft':  this.keys.left = true; break;
      case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
    }
  }

  _onKeyUp(e) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    this.keys.forward = false; break;
      case 'KeyS': case 'ArrowDown':  this.keys.backward = false; break;
      case 'KeyA': case 'ArrowLeft':  this.keys.left = false; break;
      case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
    }
  }

  setBounds(size) {
    this.boundsSize = size;
  }

  setObstacles(obstacles) {
    this.obstacles = obstacles || [];
  }

  _checkCollision(x, z) {
    for (const obs of this.obstacles) {
      if (obs.type === 'circle') {
        const dx = x - obs.x;
        const dz = z - obs.z;
        const distSq = dx * dx + dz * dz;
        const minD = this.radius + obs.r;
        if (distSq < minD * minD) return true;
      } else if (obs.type === 'box') {
        // AABB vs Circle
        const closestX = Math.max(obs.minX, Math.min(x, obs.maxX));
        const closestZ = Math.max(obs.minZ, Math.min(z, obs.maxZ));
        const dx = x - closestX;
        const dz = z - closestZ;
        if ((dx * dx + dz * dz) < (this.radius * this.radius)) return true;
      }
    }
    return false;
  }

  getForwardDirection() {
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(this.camera.quaternion);
    return dir.normalize();
  }

  update(dt) {
    if (!this.isLocked) return;

    // Apply rotation to camera
    this.camera.quaternion.setFromEuler(this.euler);

    // Movement direction
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.camera.quaternion);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(this.camera.quaternion);
    right.y = 0;
    right.normalize();

    // Input
    this.direction.set(0, 0, 0);
    if (this.keys.forward) this.direction.add(forward);
    if (this.keys.backward) this.direction.sub(forward);
    if (this.keys.right) this.direction.add(right);
    if (this.keys.left) this.direction.sub(right);

    if (this.direction.lengthSq() > 0) {
      this.direction.normalize();
    }

    // Apply movement with damping
    const accel = this.direction.multiplyScalar(this.moveSpeed * dt * 10);
    this.velocity.add(accel);
    this.velocity.multiplyScalar(0.85); // friction

    // Axis-separated collision resolution
    const velDt = this.velocity.clone().multiplyScalar(dt);
    
    // Check X
    if (!this._checkCollision(this.position.x + velDt.x, this.position.z)) {
      this.position.x += velDt.x;
    } else {
      this.velocity.x = 0;
    }

    // Check Z
    if (!this._checkCollision(this.position.x, this.position.z + velDt.z)) {
      this.position.z += velDt.z;
    } else {
      this.velocity.z = 0;
    }

    // Bound to play area
    const halfBounds = this.boundsSize * 0.45;
    this.position.x = Math.max(-halfBounds, Math.min(halfBounds, this.position.x));
    this.position.z = Math.max(-halfBounds, Math.min(halfBounds, this.position.z));
    this.position.y = this.height;

    // Apply to camera
    this.camera.position.copy(this.position);
  }

  reset() {
    this.position.set(0, this.height, 0);
    this.euler.set(0, 0, 0, 'YXZ');
    this.velocity.set(0, 0, 0);
    this.keys.forward = false;
    this.keys.backward = false;
    this.keys.left = false;
    this.keys.right = false;
    this.camera.position.copy(this.position);
    this.camera.quaternion.setFromEuler(this.euler);
  }

  isMoving() {
    return this.velocity.lengthSq() > 0.01;
  }

  dispose() {
    document.removeEventListener('pointerlockchange', this._onLockChange);
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
    document.removeEventListener('mousemove', this._onMouseMove);
  }
}
