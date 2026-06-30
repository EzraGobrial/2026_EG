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
  const bd = birdData;
  const s = bd.size;
  const bird = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: bd.bodyColor, roughness: 0.55, metalness: 0.04 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: bd.bellyColor, roughness: 0.6 });
  const headMat = new THREE.MeshStandardMaterial({ color: bd.headColor, roughness: 0.5 });
  const wingMat = new THREE.MeshStandardMaterial({ color: bd.wingColor, roughness: 0.5, side: THREE.DoubleSide });
  const beakMat = new THREE.MeshStandardMaterial({ color: bd.beakColor, roughness: 0.3, metalness: 0.1 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.6 });
  const legMat = new THREE.MeshStandardMaterial({ color: bd.beakColor, roughness: 0.4 });

  // Body: slim streamlined ellipsoid, tapered to the tail
  const bodyGeo = new THREE.SphereGeometry(s * 0.5, 24, 18);
  const bp = bodyGeo.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    let x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i);
    z *= 1.55;
    const zn = (z + s * 0.78) / (s * 1.55);
    const taper = 1 - Math.pow(Math.max(0, zn - 0.45) / 0.55, 1.4) * 0.7;
    const front = zn < 0.35 ? 1 + (0.35 - zn) * 0.5 : 1;
    x *= 0.62 * taper * front; y *= 0.6 * taper * front;
    if (zn < 0.4) y -= s * 0.02;
    bp.setXYZ(i, x, y, z);
  }
  bodyGeo.computeVertexNormals();
  const body = new THREE.Mesh(bodyGeo, bodyMat); body.position.set(0, 0, s * 0.05); bird.add(body);
  const bellyGeo = new THREE.SphereGeometry(s * 0.3, 16, 12); bellyGeo.scale(0.62, 0.5, 1.1);
  const belly = new THREE.Mesh(bellyGeo, bellyMat); belly.position.set(0, -s * 0.16, -s * 0.05); bird.add(belly);

  // Neck + head
  const neckGeo = new THREE.CylinderGeometry(s * 0.13, s * 0.2, s * 0.32, 12);
  const neck = new THREE.Mesh(neckGeo, headMat); neck.position.set(0, s * 0.16, -s * 0.5); neck.rotation.x = 0.7; bird.add(neck);
  const headGeo = new THREE.SphereGeometry(s * 0.21, 18, 16); headGeo.scale(0.95, 1, 1.05);
  const head = new THREE.Mesh(headGeo, headMat); head.position.set(0, s * 0.34, -s * 0.66); bird.add(head);
  const beakGeo = new THREE.ConeGeometry(s * 0.08, s * 0.32, 12); beakGeo.rotateX(-Math.PI / 2);
  const beak = new THREE.Mesh(beakGeo, beakMat); beak.position.set(0, s * 0.32, -s * 0.92); bird.add(beak);
  const eyeGeo = new THREE.SphereGeometry(s * 0.045, 10, 8);
  [1, -1].forEach((d) => { const e = new THREE.Mesh(eyeGeo, eyeMat); e.position.set(d * s * 0.13, s * 0.4, -s * 0.74); bird.add(e); });

  // Wings: flat swept wings lying horizontal (flap via pivot rotation.z)
  function wing(sign) {
    const sh = new THREE.Shape();
    sh.moveTo(0, -s * 0.28);
    sh.bezierCurveTo(s * 0.5, -s * 0.34, s * 0.95, -s * 0.18, s * 1.15, s * 0.02);
    sh.bezierCurveTo(s * 1.0, s * 0.12, s * 0.7, s * 0.16, s * 0.4, s * 0.22);
    sh.bezierCurveTo(s * 0.2, s * 0.26, s * 0.08, s * 0.28, 0, s * 0.34);
    sh.lineTo(0, -s * 0.28);
    const g = new THREE.ExtrudeGeometry(sh, { depth: s * 0.02, bevelEnabled: true, bevelThickness: s * 0.006, bevelSize: s * 0.006, bevelSegments: 1 });
    const piv = new THREE.Group(); piv.position.set(sign * s * 0.2, s * 0.12, -s * 0.05);
    const m = new THREE.Mesh(g, wingMat);
    m.rotation.x = -Math.PI / 2;
    if (sign < 0) m.scale.x = -1;
    piv.add(m);
    bird.add(piv);
    return piv;
  }
  bird.userData.leftWingPivot = wing(1);
  bird.userData.rightWingPivot = wing(-1);

  // Tail: flat fanned feathers trailing behind
  const tail = new THREE.Group(); tail.position.set(0, s * 0.02, s * 0.62); tail.rotation.x = -0.1;
  for (let i = -3; i <= 3; i++) {
    const fs = new THREE.Shape(); fs.moveTo(0, 0);
    fs.bezierCurveTo(s * 0.05, s * 0.15, s * 0.04, s * 0.4, 0, s * 0.55);
    fs.bezierCurveTo(-s * 0.04, s * 0.4, -s * 0.05, s * 0.15, 0, 0);
    const fg = new THREE.ShapeGeometry(fs, 6); const f = new THREE.Mesh(fg, wingMat);
    f.rotation.y = i * 0.16; f.rotation.x = 0.12;
    tail.add(f);
  }
  bird.add(tail); bird.userData.tailGroup = tail;

  // Legs (tucked under the body)
  [1, -1].forEach((d) => {
    const lg = new THREE.CylinderGeometry(s * 0.025, s * 0.025, s * 0.22, 6);
    const l = new THREE.Mesh(lg, legMat); l.position.set(d * s * 0.1, -s * 0.22, s * 0.12); l.rotation.x = 0.5; bird.add(l);
    const ft = new THREE.CylinderGeometry(s * 0.02, s * 0.01, s * 0.12, 6);
    const foot = new THREE.Mesh(ft, legMat); foot.position.set(d * s * 0.1, -s * 0.32, s * 0.04); foot.rotation.x = 1.3; bird.add(foot);
  });

  bird.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  return bird;
}
function pickFlightStyle() {
  // Favor predictable, shootable paths: mostly straight fly-bys, some gentle
  // circles. The chaotic random-zigzag 'wander' style is no longer used.
  const roll = Math.random();
  if (roll < 0.7) return FLIGHT_STYLE.FLYBY;
  return FLIGHT_STYLE.CIRCLE;
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
    this.flocks = [];       // Active flocks
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
    // Fly well beyond the boundary and climb, so the bird visibly recedes
    // into the distance (out of view) before it is removed.
    exitPos.x *= 2.4;
    exitPos.z *= 2.4;
    exitPos.y += 10;

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

    // Boss birds are much larger
    if (data.size > 2) {
      mesh.scale.setScalar(data.size / 1.5);
    }

    const entryPath = this._buildEntryPath(data.speed);

    // Start at the first waypoint (off-screen)
    mesh.position.copy(entryPath[0]);
    this.scene.add(mesh);

    const birdObj = {
      mesh,
      data,
      birdKey,
      hp: data.hp || 1,
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
   * Spawn a flock — group of 3-6 same-type birds with a designated leader
   */
  spawnGolden(birdKey) {
    const bird = this.spawn(birdKey);
    if (!bird) return null;
    bird.isGolden = true;
    bird.goldMult = 8;
    bird.speed = bird.speed * 1.35;
    bird.mesh.traverse((c) => {
      if (c.isMesh && c.material) {
        const mat = c.material.clone();
        if (mat.color) mat.color.set(0xffd700);
        if (mat.emissive) { mat.emissive.set(0xffaa00); mat.emissiveIntensity = 0.6; }
        mat.metalness = 0.9;
        mat.roughness = 0.25;
        c.material = mat;
      }
    });
    return bird;
  }

  spawnFlock(birdKey, count) {
    const data = BIRDS[birdKey];
    if (!data) return null;

    count = Math.max(2, Math.min(6, count || (3 + Math.floor(Math.random() * 4))));
    const flockId = `flock_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const flock = {
      id: flockId,
      birdKey,
      members: [],
      leader: null,
      scattered: false
    };

    // Spawn leader first
    const leaderBird = this.spawn(birdKey);
    if (!leaderBird) return null;
    leaderBird.flockId = flockId;
    leaderBird.isFlockLeader = true;
    flock.leader = leaderBird;
    flock.members.push(leaderBird);

    // Spawn followers in formation around leader
    for (let i = 1; i < count; i++) {
      const follower = this.spawn(birdKey);
      if (!follower) continue;
      follower.flockId = flockId;
      follower.isFlockLeader = false;

      // Offset position slightly from leader (V-formation)
      const side = i % 2 === 0 ? 1 : -1;
      const row = Math.ceil(i / 2);
      const offset = new THREE.Vector3(
        side * row * data.size * 2.5,
        (Math.random() - 0.5) * 0.5,
        row * data.size * 2
      );
      follower.mesh.position.add(offset);

      flock.members.push(follower);
    }

    this.flocks.push(flock);
    return flock;
  }

  /**
   * Scatter a flock — called when leader is killed
   */
  scatterFlock(flockId) {
    const flock = this.flocks.find(f => f.id === flockId);
    if (!flock || flock.scattered) return;
    flock.scattered = true;

    for (const member of flock.members) {
      if (!member.alive || member.state === 'FALLING') continue;

      // Each bird startles and flies in a random direction
      member.startled = true;
      member.startledTimer = 3 + Math.random() * 2;
      member.flockId = null; // Leave the flock
      member.isFlockLeader = false;

      // Build a panic exit path
      const escapeDir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        0.5 + Math.random(),
        (Math.random() - 0.5) * 2
      ).normalize();

      member.waypoints = [
        member.mesh.position.clone(),
        member.mesh.position.clone().add(escapeDir.clone().multiplyScalar(12)).add(new THREE.Vector3(0, 8, 0)),
        this._getEdgePosition(8 + Math.random() * 6)
      ];
      member.waypointIndex = 0;
      member.pathT = 0;
      member.state = 'EXITING';
    }
  }

  /**
   * Kill a bird — starts falling/tumbling instead of instant removal
   */
  kill(birdObj) {
    birdObj.state = 'FALLING';
    birdObj.fallVelocity = 0;
    birdObj.fallRotation = (Math.random() - 0.5) * 8;

    // If this bird was a flock leader, scatter the flock
    if (birdObj.isFlockLeader && birdObj.flockId) {
      this.scatterFlock(birdObj.flockId);
    }
  }

  /**
   * Hit a bird — decrements HP by `dmg` (weapon power), returns true if killed
   */
  hit(birdObj, dmg = 1) {
    birdObj.hp -= Math.max(1, dmg);
    if (birdObj.hp <= 0) {
      this.kill(birdObj);
      return true; // dead
    }
    // Hit flash — briefly make bird white. Guard against re-entrancy: if a flash
    // is already running (e.g. a second shotgun pellet or rapid shot lands within
    // 150ms), don't re-capture the now-white color — that would store white as
    // the "original" and leave the bird permanently white.
    if (!birdObj._flashing) {
      birdObj._flashing = true;
      birdObj.mesh.traverse(child => {
        if (child.isMesh && child.material) {
          child.userData._origColor = child.material.color.getHex();
          child.material.color.setHex(0xffffff);
        }
      });
      setTimeout(() => {
        birdObj.mesh.traverse(child => {
          if (child.isMesh && child.material && child.userData._origColor !== undefined) {
            child.material.color.setHex(child.userData._origColor);
            delete child.userData._origColor;
          }
        });
        birdObj._flashing = false;
      }, 150);
    }
    return false; // still alive
  }

  /**
   * Check if a bird is a boss (multi-HP)
   */
  isBoss(birdObj) {
    return birdObj.data && (birdObj.data.hp || 1) > 1;
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
  // ── Helpers for area/chain/seeking weapon effects ──
  birdsInRadius(point, radius, exclude) {
    const r2 = radius * radius;
    const out = [];
    for (const b of this.birds) {
      if (!b.alive || b.state === 'FALLING' || b === exclude) continue;
      if (b.mesh.position.distanceToSquared(point) <= r2) out.push(b);
    }
    return out;
  }

  nearestAimBird(raycaster, cosThreshold) {
    const origin = raycaster.ray.origin;
    const dir = raycaster.ray.direction;
    let best = null, bestDot = cosThreshold || 0.9;
    for (const b of this.birds) {
      if (!b.alive || b.state === 'FALLING') continue;
      const to = b.mesh.position.clone().sub(origin);
      const dist = to.length();
      if (dist < 0.001) continue;
      to.divideScalar(dist);
      const d = to.dot(dir);
      if (d > bestDot) { bestDot = d; best = b; }
    }
    return best;
  }

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
   * Pierce raycast — returns EVERY bird the ray passes through, nearest first.
   * Used by piercing weapons (Rail Gun, Laser Rifle, dimension Lances).
   */
  raycastPierce(raycaster) {
    const hits = [];
    for (const bird of this.birds) {
      if (!bird.alive || bird.state === 'FALLING') continue;
      const pos = bird.mesh.position;
      const hitRadius = bird.data.speed < 2.0 ? bird.data.size * 1.2 : bird.data.size * 0.8;
      const sphere = new THREE.Sphere(pos, hitRadius);
      const intersectPoint = new THREE.Vector3();
      if (raycaster.ray.intersectSphere(sphere, intersectPoint)) {
        const dist = raycaster.ray.origin.distanceTo(intersectPoint);
        hits.push({ bird, point: intersectPoint.clone(), dist });
      }
    }
    hits.sort((a, b) => a.dist - b.dist);
    return hits;
  }

  /**
   * Send a random flying bird into a dive toward the player (visual "attack").
   * Reuses the waypoint system (same approach as startleNear) so it stays
   * compatible with normal flight. Returns the diving bird, or null.
   */
  diveBomb(playerPos) {
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const candidates = this.birds.filter(b =>
      b.alive && (b.state === 'FLYING' || b.state === 'ENTERING') &&
      (!b._diveUntil || b._diveUntil < now)
    );
    if (candidates.length === 0) return null;
    const bird = candidates[Math.floor(Math.random() * candidates.length)];

    const start = bird.mesh.position.clone();
    // Swoop low over the player, then climb back out the far side.
    const overHead = new THREE.Vector3(playerPos.x, Math.max(3, playerPos.y + 3.5), playerPos.z);
    const past = new THREE.Vector3(
      playerPos.x + (start.x - playerPos.x) * -0.6,
      Math.max(8, start.y + 4),
      playerPos.z + (start.z - playerPos.z) * -0.6
    );
    bird.waypoints = [start, overHead, past];
    bird.waypointIndex = 0;
    bird.pathT = 0;
    bird.state = 'FLYING';
    bird.startled = false;
    bird._diveUntil = now + 4000; // don't re-pick this bird for 4s
    return bird;
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
            // Only remove once the bird is far from the play area (out of view).
            const distFromCenter = Math.hypot(bird.mesh.position.x, bird.mesh.position.z);
            if (distFromCenter > this.areaSize * 0.5 + 18) {
              toRemove.push(bird);
            } else {
              // Not far enough yet — keep flying outward.
              bird.waypoints = this._buildExitPath(bird.mesh.position, bird.speed);
              bird.waypointIndex = 0;
              bird.pathT = 0;
            }
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
            // Stay in area — new flight pattern. Begin it at the current
            // position so the bird flows smoothly instead of snapping/zooming
            // to a random new spot.
            const _np = generateFlightPath(this.areaSize, bird.mesh.position, bird.speed);
            _np.unshift(bird.mesh.position.clone());
            bird.waypoints = _np;
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

      // ─── Realistic wing flap ──────────────
      bird.flapPhase += dt * bird.data.flapSpeed;
      const flapMul = bird.startled ? 1.6 : 1.0;
      const amp = bird.data.flapAmplitude * flapMul;

      // Asymmetric wingbeat: fast downstroke, slow upstroke
      // Uses a shaped sine wave — downstroke is ~40% of cycle, upstroke ~60%
      const phase = bird.flapPhase % (Math.PI * 2);
      let flapRaw;
      if (phase < Math.PI * 0.8) {
        // Downstroke (fast, powerful) — compressed into 40% of cycle
        flapRaw = Math.sin(phase / 0.8 * Math.PI);
      } else {
        // Upstroke (slower, wing folds slightly) — spans 60% of cycle
        const upPhase = (phase - Math.PI * 0.8) / (Math.PI * 1.2);
        flapRaw = -Math.sin(upPhase * Math.PI) * 0.7;
      }
      const flapAngle = flapRaw * amp;

      const leftWing = bird.mesh.userData.leftWingPivot;
      const rightWing = bird.mesh.userData.rightWingPivot;
      if (leftWing && rightWing) {
        // Primary flap (Z rotation)
        leftWing.rotation.z = flapAngle;
        rightWing.rotation.z = -flapAngle;

        // Wing sweep forward/back during stroke
        const sweepAngle = Math.sin(bird.flapPhase * 0.5) * 0.08;
        leftWing.rotation.y = sweepAngle;
        rightWing.rotation.y = -sweepAngle;

        // Slight wing fold on upstroke (X rotation tucks wingtips)
        const foldAmount = flapRaw < 0 ? Math.abs(flapRaw) * 0.2 : 0;
        leftWing.rotation.x = foldAmount;
        rightWing.rotation.x = foldAmount;
      }

      // Tail movement — gentle follow-through + turn response
      const tail = bird.mesh.userData.tailGroup;
      if (tail) {
        // Gentle pitch with wingbeat
        tail.rotation.x = 0.25 + Math.sin(bird.flapPhase * 0.5) * 0.08;
        // Slight fan spread on downstroke
        const spread = flapRaw > 0.5 ? 0.05 : 0;
        tail.rotation.y = spread * Math.sin(bird.flapPhase * 0.3);
      }

      // Body pitch — nose dips slightly on downstroke, lifts on upstroke
      const pitchOffset = flapRaw * 0.03;
      bird.mesh.position.y += Math.sin(bird.flapPhase * 0.8) * 0.015 + pitchOffset * 0.1;

      // ─── Boids flocking behavior for flock members ───
      if (bird.flockId && !bird.startled && bird.state === 'FLYING') {
        const flock = this.flocks.find(f => f.id === bird.flockId);
        if (flock && !flock.scattered && flock.leader && flock.leader.alive) {
          const leader = flock.leader;

          // Only apply to followers, not the leader
          if (!bird.isFlockLeader) {
            const pos = bird.mesh.position;
            const leaderPos = leader.mesh.position;
            const separation = new THREE.Vector3();
            const alignment = new THREE.Vector3();
            const cohesion = new THREE.Vector3();
            let neighborCount = 0;

            for (const other of flock.members) {
              if (other === bird || !other.alive || other.state === 'FALLING') continue;
              const diff = pos.clone().sub(other.mesh.position);
              const dist = diff.length();

              if (dist < bird.data.size * 6 && dist > 0.01) {
                // Separation — avoid getting too close
                separation.add(diff.normalize().multiplyScalar(1.0 / Math.max(dist, 0.5)));

                // Alignment — match velocity direction
                const otherVel = other.mesh.position.clone().sub(other._prevPos || other.mesh.position);
                alignment.add(otherVel);

                // Cohesion — steer toward center of neighbors
                cohesion.add(other.mesh.position);
                neighborCount++;
              }
            }

            const steer = new THREE.Vector3();

            // Separation force
            if (separation.lengthSq() > 0) {
              steer.add(separation.normalize().multiplyScalar(0.8));
            }

            // Alignment force
            if (neighborCount > 0) {
              alignment.divideScalar(neighborCount);
              if (alignment.lengthSq() > 0) {
                steer.add(alignment.normalize().multiplyScalar(0.3));
              }

              // Cohesion force
              cohesion.divideScalar(neighborCount);
              const toCenter = cohesion.sub(pos);
              steer.add(toCenter.normalize().multiplyScalar(0.2));
            }

            // Follow the leader (strongest force)
            const toLeader = leaderPos.clone().sub(pos);
            const leaderDist = toLeader.length();
            if (leaderDist > bird.data.size * 3) {
              steer.add(toLeader.normalize().multiplyScalar(1.2));
            }

            // Apply forces gently
            bird.mesh.position.add(steer.multiplyScalar(dt * bird.speed * 0.3));
          }
        }
      }

      // Store previous position for alignment calculations
      bird._prevPos = bird.mesh.position.clone();
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
    this.flocks = [];
  }

  getLivingCount() {
    return this.birds.filter(b => b.alive && b.state !== 'EXITING').length;
  }

  getFlockCount() {
    return this.flocks.filter(f => !f.scattered && f.members.some(m => m.alive)).length;
  }
}
