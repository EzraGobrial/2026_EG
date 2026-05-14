// ═══════════════════════════════════════════════
// Gary's Life — Bird System
// Procedural 3D bird models with animated wings,
// flight AI, spawning, and hit detection
// ═══════════════════════════════════════════════

import * as THREE from 'three';
import { BIRDS } from './economy.js';

/**
 * Create a single procedural bird mesh from Three.js geometry.
 * Each bird is a Group containing body, head, beak, wings, and tail.
 */
function createBirdModel(birdData) {
  const bird = new THREE.Group();
  const s = birdData.size;

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: birdData.bodyColor,
    roughness: 0.7,
    metalness: 0.0
  });
  const wingMat = new THREE.MeshStandardMaterial({
    color: birdData.wingColor,
    roughness: 0.6,
    metalness: 0.0,
    side: THREE.DoubleSide
  });
  const headMat = new THREE.MeshStandardMaterial({
    color: birdData.headColor,
    roughness: 0.7
  });
  const beakMat = new THREE.MeshStandardMaterial({
    color: birdData.beakColor,
    roughness: 0.4
  });
  const bellyMat = new THREE.MeshStandardMaterial({
    color: birdData.bellyColor,
    roughness: 0.7
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.2,
    metalness: 0.5
  });

  // ─── Body (elongated ellipsoid) ──────────
  const bodyGeo = new THREE.SphereGeometry(s * 0.5, 12, 10);
  // Stretch along Z to make it elongated
  bodyGeo.scale(0.8, 0.7, 1.3);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  bird.add(body);

  // ─── Belly (slightly larger bottom half) ─
  const bellyGeo = new THREE.SphereGeometry(s * 0.48, 10, 8, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5);
  bellyGeo.scale(0.75, 0.5, 1.2);
  const belly = new THREE.Mesh(bellyGeo, bellyMat);
  belly.position.y = -s * 0.05;
  bird.add(belly);

  // ─── Head ────────────────────────────────
  const headGeo = new THREE.SphereGeometry(s * 0.3, 10, 8);
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, s * 0.25, -s * 0.55);
  bird.add(head);

  // ─── Eyes ────────────────────────────────
  const eyeGeo = new THREE.SphereGeometry(s * 0.06, 6, 6);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(s * 0.15, s * 0.3, -s * 0.72);
  bird.add(eyeL);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(-s * 0.15, s * 0.3, -s * 0.72);
  bird.add(eyeR);

  // ─── Beak (cone) ────────────────────────
  const beakGeo = new THREE.ConeGeometry(s * 0.08, s * 0.25, 6);
  beakGeo.rotateX(Math.PI / 2);
  const beak = new THREE.Mesh(beakGeo, beakMat);
  beak.position.set(0, s * 0.2, -s * 0.85);
  bird.add(beak);

  // ─── Wings (shaped triangular panels) ───
  // Custom wing shape
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(s * 0.9, s * 0.15);
  wingShape.lineTo(s * 1.0, -s * 0.1);
  wingShape.lineTo(s * 0.6, -s * 0.15);
  wingShape.lineTo(0, -s * 0.2);
  wingShape.lineTo(0, 0);

  const wingGeo = new THREE.ShapeGeometry(wingShape);

  // Left wing pivot
  const leftWingPivot = new THREE.Group();
  leftWingPivot.position.set(s * 0.3, s * 0.1, 0);
  const leftWing = new THREE.Mesh(wingGeo, wingMat);
  leftWingPivot.add(leftWing);
  bird.add(leftWingPivot);
  bird.userData.leftWingPivot = leftWingPivot;

  // Right wing pivot (mirrored)
  const rightWingPivot = new THREE.Group();
  rightWingPivot.position.set(-s * 0.3, s * 0.1, 0);
  const rightWingGeo = wingGeo.clone();
  rightWingGeo.scale(-1, 1, 1);
  const rightWing = new THREE.Mesh(rightWingGeo, wingMat);
  rightWingPivot.add(rightWing);
  bird.add(rightWingPivot);
  bird.userData.rightWingPivot = rightWingPivot;

  // ─── Tail (fan of planes) ───────────────
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0, s * 0.6);
  for (let i = -2; i <= 2; i++) {
    const tailGeo = new THREE.PlaneGeometry(s * 0.12, s * 0.35);
    const tail = new THREE.Mesh(tailGeo, wingMat);
    tail.rotation.y = i * 0.15;
    tail.rotation.x = 0.3;
    tail.position.z = s * 0.15;
    tailGroup.add(tail);
  }
  bird.add(tailGroup);
  bird.userData.tailGroup = tailGroup;

  // Shadow
  bird.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return bird;
}

/**
 * Flight style enum
 */
const FLIGHT_STYLE = {
  FLYBY: 'flyby',       // Straight across the area
  CIRCLE: 'circle',     // Orbit around a point
  WANDER: 'wander'      // Random zigzag waypoints
};

/**
 * Pick a random flight style. Flyby is most common for natural feel.
 */
function pickFlightStyle() {
  const roll = Math.random();
  if (roll < 0.4) return FLIGHT_STYLE.FLYBY;
  if (roll < 0.7) return FLIGHT_STYLE.CIRCLE;
  return FLIGHT_STYLE.WANDER;
}

/**
 * Generate a smooth flight path based on style
 */
function generateFlightPath(areaSize, currentPos, birdSpeed) {
  const halfArea = areaSize * 0.4;

  // Altitude range based on speed (cheap = low, rare = high)
  const minAlt = birdSpeed < 2.0 ? 2 : (birdSpeed < 3.0 ? 3 : 5);
  const maxAlt = birdSpeed < 2.0 ? 6 : (birdSpeed < 3.0 ? 10 : 18);
  const randAlt = () => minAlt + Math.random() * (maxAlt - minAlt);

  const style = pickFlightStyle();

  if (style === FLIGHT_STYLE.FLYBY) {
    // ─── Flyby: enter from one edge, fly across to opposite edge ───
    // Pick a random entry edge (0=left, 1=right, 2=front, 3=back)
    const edge = Math.floor(Math.random() * 4);
    const altitude = randAlt();
    const crossOffset = (Math.random() - 0.5) * halfArea; // lateral variation

    let start, end;
    switch (edge) {
      case 0: // left → right
        start = new THREE.Vector3(-halfArea, altitude, crossOffset);
        end = new THREE.Vector3(halfArea, altitude + (Math.random() - 0.5) * 2, -crossOffset * 0.5);
        break;
      case 1: // right → left
        start = new THREE.Vector3(halfArea, altitude, crossOffset);
        end = new THREE.Vector3(-halfArea, altitude + (Math.random() - 0.5) * 2, -crossOffset * 0.5);
        break;
      case 2: // front → back
        start = new THREE.Vector3(crossOffset, altitude, -halfArea);
        end = new THREE.Vector3(-crossOffset * 0.5, altitude + (Math.random() - 0.5) * 2, halfArea);
        break;
      case 3: // back → front
        start = new THREE.Vector3(crossOffset, altitude, halfArea);
        end = new THREE.Vector3(-crossOffset * 0.5, altitude + (Math.random() - 0.5) * 2, -halfArea);
        break;
    }

    // Add a slight curve via midpoints so it's not perfectly straight
    const mid1 = start.clone().lerp(end, 0.33).add(
      new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 6)
    );
    const mid2 = start.clone().lerp(end, 0.66).add(
      new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 6)
    );

    return [start, mid1, mid2, end];
  }

  if (style === FLIGHT_STYLE.CIRCLE) {
    // ─── Circle: orbit around a center point ───
    const waypoints = [];
    const centerX = (Math.random() - 0.5) * halfArea * 0.8;
    const centerZ = (Math.random() - 0.5) * halfArea * 0.8;
    const radius = 4 + Math.random() * 8;
    const altitude = randAlt();
    const numPoints = 6 + Math.floor(Math.random() * 4);
    const startAngle = Math.random() * Math.PI * 2;
    const direction = Math.random() < 0.5 ? 1 : -1; // CW or CCW

    for (let i = 0; i < numPoints; i++) {
      const angle = startAngle + direction * (i / numPoints) * Math.PI * 2;
      waypoints.push(new THREE.Vector3(
        centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 2,
        altitude + Math.sin(angle * 0.5) * 1.5 + (Math.random() - 0.5),
        centerZ + Math.sin(angle) * radius + (Math.random() - 0.5) * 2
      ));
    }

    return waypoints;
  }

  // ─── Wander: random zigzag waypoints (original style) ───
  const waypoints = [];
  const numPoints = 4 + Math.floor(Math.random() * 4);

  for (let i = 0; i < numPoints; i++) {
    waypoints.push(new THREE.Vector3(
      (Math.random() - 0.5) * halfArea * 2,
      randAlt(),
      (Math.random() - 0.5) * halfArea * 2
    ));
  }

  return waypoints;
}

/**
 * Catmull-Rom spline interpolation for smooth flight
 */
function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return new THREE.Vector3(
    0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
    0.5 * ((2 * p1.z) + (-p0.z + p2.z) * t + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3)
  );
}

export class BirdSystem {
  constructor(scene) {
    this.scene = scene;
    this.birds = [];
    this.areaSize = 30;
  }

  setAreaSize(size) {
    this.areaSize = size;
  }

  /**
   * Get a random edge position (behind/beyond houses) for entry/exit
   */
  _getEdgePosition(altitude) {
    const edge = this.areaSize * 0.5 + 5; // Beyond boundary (behind houses)
    const side = Math.floor(Math.random() * 4);
    const lateral = (Math.random() - 0.5) * this.areaSize * 0.6;
    switch (side) {
      case 0: return new THREE.Vector3(-edge, altitude, lateral);
      case 1: return new THREE.Vector3(edge, altitude, lateral);
      case 2: return new THREE.Vector3(lateral, altitude, -edge);
      case 3: return new THREE.Vector3(lateral, altitude, edge);
    }
  }

  /**
   * Build an ENTRY path: starts off-screen, flies into the play area
   */
  _buildEntryPath(birdSpeed) {
    const minAlt = birdSpeed < 2.0 ? 3 : (birdSpeed < 3.0 ? 4 : 6);
    const maxAlt = birdSpeed < 2.0 ? 7 : (birdSpeed < 3.0 ? 12 : 20);
    const alt = minAlt + Math.random() * (maxAlt - minAlt);

    const start = this._getEdgePosition(alt);
    const halfInner = this.areaSize * 0.25;

    // Fly into center area
    const mid1 = new THREE.Vector3(
      start.x * 0.4 + (Math.random() - 0.5) * 4,
      alt + (Math.random() - 0.5) * 2,
      start.z * 0.4 + (Math.random() - 0.5) * 4
    );
    const target = new THREE.Vector3(
      (Math.random() - 0.5) * halfInner * 2,
      alt + (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * halfInner * 2
    );

    return [start, mid1, target];
  }

  /**
   * Build an EXIT path: from current position, fly out beyond boundary
   */
  _buildExitPath(currentPos, birdSpeed) {
    const alt = currentPos.y + (Math.random() - 0.5) * 3;
    const exitPos = this._getEdgePosition(Math.max(3, alt));

    // Midpoint between current and exit
    const mid = currentPos.clone().lerp(exitPos, 0.5).add(
      new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 5)
    );

    return [currentPos.clone(), mid, exitPos];
  }

  /**
   * Spawn a bird — starts off-screen and flies in
   */
  spawn(birdKey) {
    const data = BIRDS[birdKey];
    if (!data) return null;

    const mesh = createBirdModel(data);
    const entryPath = this._buildEntryPath(data.speed);

    // Start at the first waypoint (off-screen)
    mesh.position.copy(entryPath[0]);
    this.scene.add(mesh);

    const birdObj = {
      mesh,
      data,
      birdKey,
      waypoints: entryPath,
      waypointIndex: 0,
      pathT: 0,
      alive: true,
      state: 'ENTERING',   // ENTERING → FLYING → EXITING or FALLING
      flapPhase: Math.random() * Math.PI * 2,
      speed: data.speed,
      startled: false,
      startledTimer: 0,
      loopsCompleted: 0,
      fallVelocity: 0,     // For death tumble
      fallRotation: 0
    };

    this.birds.push(birdObj);
    return birdObj;
  }

  /**
   * Kill a bird — starts falling/tumbling instead of instant removal
   */
  kill(birdObj) {
    birdObj.state = 'FALLING';
    birdObj.fallVelocity = 0;
    birdObj.fallRotation = (Math.random() - 0.5) * 8;
  }

  /**
   * Startle nearby birds — they fly away and exit
   */
  startleNear(position, radius = 15) {
    for (const bird of this.birds) {
      if (!bird.alive || bird.state === 'FALLING' || bird.state === 'EXITING') continue;
      const dist = bird.mesh.position.distanceTo(position);
      if (dist < radius) {
        bird.startled = true;
        bird.startledTimer = 1.5 + Math.random();
        // Escape upward and away, then return to normal
        const escapeDir = bird.mesh.position.clone().sub(position).normalize();
        bird.waypoints = [
          bird.mesh.position.clone(),
          bird.mesh.position.clone().add(escapeDir.clone().multiplyScalar(8)).add(new THREE.Vector3(0, 6, 0)),
          new THREE.Vector3(
            (Math.random() - 0.5) * this.areaSize * 0.5,
            6 + Math.random() * 6,
            (Math.random() - 0.5) * this.areaSize * 0.5
          )
        ];
        bird.waypointIndex = 0;
        bird.pathT = 0;
        bird.state = 'FLYING';
      }
    }
  }

  /**
   * Raycast hit check
   */
  raycastHit(raycaster) {
    let closestBird = null;
    let closestDist = Infinity;

    for (const bird of this.birds) {
      if (!bird.alive || bird.state === 'FALLING') continue;
      const pos = bird.mesh.position;
      const hitRadius = bird.data.speed < 2.0 ? bird.data.size * 1.2 : bird.data.size * 0.8;
      const sphere = new THREE.Sphere(pos, hitRadius);
      const intersectPoint = new THREE.Vector3();
      if (raycaster.ray.intersectSphere(sphere, intersectPoint)) {
        const dist = raycaster.ray.origin.distanceTo(intersectPoint);
        if (dist < closestDist) {
          closestDist = dist;
          closestBird = { bird, point: intersectPoint.clone() };
        }
      }
    }

    return closestBird;
  }

  /**
   * Main update loop
   */
  update(dt) {
    const toRemove = [];

    for (const bird of this.birds) {
      if (!bird.alive && bird.state !== 'FALLING') continue;

      // ─── FALLING (death tumble) ─────────
      if (bird.state === 'FALLING') {
        bird.fallVelocity += 9.8 * dt;
        bird.mesh.position.y -= bird.fallVelocity * dt;
        bird.mesh.rotation.x += bird.fallRotation * dt;
        bird.mesh.rotation.z += bird.fallRotation * 0.7 * dt;

        // Wing tuck
        const leftWing = bird.mesh.userData.leftWingPivot;
        const rightWing = bird.mesh.userData.rightWingPivot;
        if (leftWing && rightWing) {
          leftWing.rotation.z = Math.PI * 0.3;
          rightWing.rotation.z = -Math.PI * 0.3;
        }

        // Hit ground — remove after brief delay
        if (bird.mesh.position.y <= 0.1) {
          bird.mesh.position.y = 0.1;
          bird.alive = false;
          // Schedule removal
          setTimeout(() => {
            this.scene.remove(bird.mesh);
            bird.mesh.traverse(child => {
              if (child.isMesh) {
                child.geometry.dispose();
                if (child.material.dispose) child.material.dispose();
              }
            });
            bird.state = 'REMOVED';
          }, 800);
          bird.state = 'GROUNDED';
        }
        continue;
      }

      if (bird.state === 'GROUNDED' || bird.state === 'REMOVED') continue;

      // ─── Flight path following ──────────
      const wp = bird.waypoints;
      if (wp.length < 2) continue;

      const speed = bird.startled ? bird.speed * 2.5 : bird.speed;
      bird.pathT += dt * speed * 0.15;

      if (bird.pathT >= 1.0) {
        bird.pathT = 0;
        bird.waypointIndex++;

        // Startled recovery
        if (bird.startled) {
          bird.startledTimer -= dt;
          if (bird.startledTimer <= 0) bird.startled = false;
        }

        // End of path
        if (bird.waypointIndex >= wp.length - 1) {
          if (bird.state === 'EXITING') {
            // Bird has flown out of the area — remove silently
            toRemove.push(bird);
            continue;
          }

          bird.loopsCompleted++;

          if (bird.state === 'ENTERING') {
            bird.state = 'FLYING';
          }

          // After 2-4 loops, 40% chance to exit naturally
          if (bird.loopsCompleted >= 2 && Math.random() < 0.4) {
            bird.waypoints = this._buildExitPath(bird.mesh.position, bird.speed);
            bird.waypointIndex = 0;
            bird.pathT = 0;
            bird.state = 'EXITING';
          } else {
            // Stay in area — new flight pattern
            bird.waypoints = generateFlightPath(this.areaSize, bird.mesh.position, bird.speed);
            bird.waypointIndex = 0;
            bird.pathT = 0;
          }
        }
      }

      // Catmull-Rom interpolation
      const idx = bird.waypointIndex;
      const p0 = wp[Math.max(0, idx - 1)];
      const p1 = wp[idx];
      const p2 = wp[Math.min(wp.length - 1, idx + 1)];
      const p3 = wp[Math.min(wp.length - 1, idx + 2)];

      const newPos = catmullRom(p0, p1, p2, p3, bird.pathT);

      // NO boundary clamping — birds fly freely during enter/exit
      newPos.y = Math.max(1.5, newPos.y);

      // Face direction of travel
      const moveDir = newPos.clone().sub(bird.mesh.position);
      if (moveDir.lengthSq() > 0.0001) {
        const targetQuat = new THREE.Quaternion();
        const lookMatrix = new THREE.Matrix4();
        lookMatrix.lookAt(bird.mesh.position, newPos, new THREE.Vector3(0, 1, 0));
        targetQuat.setFromRotationMatrix(lookMatrix);

        // Banking
        const cross = new THREE.Vector3();
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(bird.mesh.quaternion);
        cross.crossVectors(forward, moveDir.normalize());
        const bankAngle = Math.max(-0.4, Math.min(0.4, cross.y * 2));

        bird.mesh.quaternion.slerp(targetQuat, Math.min(1, dt * 4));
        bird.mesh.rotation.z = -bankAngle;
      }

      bird.mesh.position.copy(newPos);

      // ─── Wing flap ─────────────────────
      bird.flapPhase += dt * bird.data.flapSpeed;
      const flapAngle = Math.sin(bird.flapPhase) * bird.data.flapAmplitude;
      const flapMul = bird.startled ? 1.5 : 1.0;

      const leftWing = bird.mesh.userData.leftWingPivot;
      const rightWing = bird.mesh.userData.rightWingPivot;
      if (leftWing && rightWing) {
        leftWing.rotation.z = flapAngle * flapMul;
        rightWing.rotation.z = -flapAngle * flapMul;
        const secondaryFlap = Math.sin(bird.flapPhase * 1.5) * 0.15;
        leftWing.rotation.x = secondaryFlap;
        rightWing.rotation.x = secondaryFlap;
      }

      // Tail bob
      const tail = bird.mesh.userData.tailGroup;
      if (tail) {
        tail.rotation.x = 0.3 + Math.sin(bird.flapPhase * 0.5) * 0.1;
      }

      // Body bob
      bird.mesh.position.y += Math.sin(bird.flapPhase * 0.8) * 0.02;
    }

    // Silent cleanup of exited birds
    for (const bird of toRemove) {
      bird.alive = false;
      bird.state = 'REMOVED';
      this.scene.remove(bird.mesh);
      bird.mesh.traverse(child => {
        if (child.isMesh) {
          child.geometry.dispose();
          if (child.material.dispose) child.material.dispose();
        }
      });
    }
  }

  clear() {
    for (const bird of this.birds) {
      if (bird.state !== 'REMOVED') {
        this.scene.remove(bird.mesh);
        bird.mesh.traverse(child => {
          if (child.isMesh) {
            child.geometry.dispose();
            if (child.material.dispose) child.material.dispose();
          }
        });
      }
    }
    this.birds = [];
  }

  getLivingCount() {
    return this.birds.filter(b => b.alive && b.state !== 'EXITING').length;
  }
}
