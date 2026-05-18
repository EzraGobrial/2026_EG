// ═══════════════════════════════════════════════
// Gary's Life — Trail World
// High-quality forest trail for Lucky Lake quest
// First-person trail, Bunny cat companion, invisible walls
// ═══════════════════════════════════════════════

import * as THREE from 'three';
import { createInstancedGrass } from './world.js';

// ─── Materials ───────────────────────────────

function makeMat(color, rough = 0.85, metal = 0.0, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...opts });
}

// ─── Tree Builder ────────────────────────────

function buildTree(x, z, scale = 1, type = 'oak') {
  const g = new THREE.Group();
  const trunkH = (2.2 + Math.random() * 1.4) * scale;
  const trunkR = (0.09 + Math.random() * 0.04) * scale;
  const trunkMat = makeMat(0x3d2010 + Math.floor(Math.random()*0x080400), 0.95);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(trunkR*0.65, trunkR, trunkH, 8), trunkMat);
  trunk.position.set(x, trunkH/2, z);
  trunk.castShadow = true; trunk.receiveShadow = true;
  g.add(trunk);

  if (type === 'pine') {
    const leafMat = makeMat(0x1a4020 + Math.floor(Math.random()*0x040808), 0.9);
    for (let i = 0; i < 4; i++) {
      const r = (0.7 - i*0.12) * scale;
      const h = (1.0 - i*0.12) * scale;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), leafMat);
      cone.position.set(x, trunkH + i*0.45*scale, z);
      cone.castShadow = true;
      g.add(cone);
    }
  } else {
    // Layered oak canopy — 5-8 overlapping spheres for volume
    const hues = [0x1e5020, 0x245a25, 0x1a4818, 0x2a6030];
    const leafMat = makeMat(hues[Math.floor(Math.random()*hues.length)], 0.9);
    const n = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      const r = (0.55 + Math.random()*0.45) * scale;
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(r, 9, 7), leafMat);
      sphere.position.set(
        x + (Math.random()-0.5)*scale*0.9,
        trunkH + r*0.5 + Math.random()*scale*0.5,
        z + (Math.random()-0.5)*scale*0.9
      );
      sphere.castShadow = true;
      g.add(sphere);
    }
  }
  return g;
}

// ─── Rock Builder ────────────────────────────

function buildRock(x, y, z, s = 1) {
  const mat = makeMat(0x555060 + Math.floor(Math.random()*0x101010), 0.88, 0.05);
  const geo = new THREE.DodecahedronGeometry(s, 0);
  // Squash for flat rock feel
  geo.scale(1 + Math.random()*0.4, 0.5 + Math.random()*0.3, 1 + Math.random()*0.4);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y + s*0.25, z);
  mesh.rotation.y = Math.random() * Math.PI * 2;
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

// ─── Bunny Cat ─────────────────────────────

function buildBunny() {
  const g = new THREE.Group();
  const fur = makeMat(0xc8a060, 0.85); // warm orange tabby
  const darkFur = makeMat(0x7a5030, 0.85);
  const white = makeMat(0xf0f0f0, 0.7);
  const pink = makeMat(0xe87060, 0.7);
  const eye = makeMat(0x111111, 0.2, 0.1);

  // Body
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.32, 6, 8), fur);
  body.rotation.z = Math.PI/2;
  body.position.y = 0.28;
  body.castShadow = true;
  g.add(body);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), fur);
  head.position.set(0.28, 0.42, 0);
  head.castShadow = true;
  g.add(head);

  // Ears
  [-1,1].forEach(side => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.10, 4), fur);
    ear.position.set(0.28, 0.54, side * 0.08);
    ear.rotation.z = side * 0.3;
    g.add(ear);
    const innerEar = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.07, 4), pink);
    innerEar.position.set(0.28, 0.54, side * 0.08);
    innerEar.rotation.z = side * 0.3;
    g.add(innerEar);
  });

  // Eyes
  [-1,1].forEach(side => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), eye);
    e.position.set(0.41, 0.46, side * 0.065);
    g.add(e);
  });

  // Nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.018, 5, 5), pink);
  nose.position.set(0.43, 0.41, 0);
  g.add(nose);

  // Tail
  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.28, 4, 6), darkFur);
  tail.position.set(-0.36, 0.28, 0);
  tail.rotation.z = -0.5;
  tail.rotation.x = 0.3;
  g.add(tail);

  // 4 Legs — front-left has bandage (was shot)
  const legPositions = [
    { x:  0.18, z:  0.10, bandaged: true  },
    { x:  0.18, z: -0.10, bandaged: false },
    { x: -0.12, z:  0.10, bandaged: false },
    { x: -0.12, z: -0.10, bandaged: false },
  ];
  legPositions.forEach(lp => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.18, 4, 6), fur);
    leg.position.set(lp.x, 0.10, lp.z);
    leg.castShadow = true;
    g.add(leg);
    if (lp.bandaged) {
      const bandage = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.10, 8), white);
      bandage.position.set(lp.x, 0.08, lp.z);
      g.add(bandage);
    }
  });

  return g;
}

// ─── Gary (third-person character) ───────────

function buildGary() {
  const g = new THREE.Group();
  const skin = makeMat(0xd4956a, 0.75);
  const shirt = makeMat(0x2255aa, 0.85); // blue flannel
  const pants = makeMat(0x3a3028, 0.85);
  const boots = makeMat(0x1a1008, 0.7, 0.1);
  const hair = makeMat(0x2a1a08, 0.9);
  const hatColor = makeMat(0x4a3010, 0.85);

  // Torso
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.35, 6, 8), shirt);
  torso.position.y = 1.0;
  torso.castShadow = true;
  g.add(torso);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 10, 8), skin);
  head.position.y = 1.48;
  head.castShadow = true;
  g.add(head);

  // Cap
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 10), hatColor);
  cap.position.y = 1.58;
  g.add(cap);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.03, 10), hatColor);
  brim.position.y = 1.54;
  brim.position.z = -0.04;
  g.add(brim);

  // Arms (stored so we can animate them)
  g.leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.32, 4, 6), shirt);
  g.leftArm.position.set(-0.26, 0.95, 0);
  g.leftArm.castShadow = true;
  g.add(g.leftArm);

  g.rightArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.32, 4, 6), shirt);
  g.rightArm.position.set(0.26, 0.95, 0);
  g.rightArm.castShadow = true;
  g.add(g.rightArm);

  // Legs
  g.leftLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.38, 4, 6), pants);
  g.leftLeg.position.set(-0.11, 0.55, 0);
  g.leftLeg.castShadow = true;
  g.add(g.leftLeg);

  g.rightLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.38, 4, 6), pants);
  g.rightLeg.position.set(0.11, 0.55, 0);
  g.rightLeg.castShadow = true;
  g.add(g.rightLeg);

  // Boots
  [-0.11, 0.11].forEach(sx => {
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.22), boots);
    boot.position.set(sx, 0.30, -0.04);
    boot.castShadow = true;
    g.add(boot);
  });

  return g;
}

// ─── Dirt Path ───────────────────────────────

function buildPath(length) {
  const pathMat = makeMat(0x7a5a38, 0.95);
  const path = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, length, 1, 40),
    pathMat
  );
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.01, -length/2);
  path.receiveShadow = true;
  return path;
}

// ─── Trail World ─────────────────────────────

export class TrailWorld {
  constructor(scene, renderer) {
    this.scene    = scene;
    this.renderer = renderer;
    this.objects  = new THREE.Group();

    // Invisible wall segments {minX, maxX, minZ, maxZ} — corridor walls
    this.corridors = [];

    // Interactable end-marker (shed trigger zone)
    this.shedTriggerZ = -132;

    this._build();
    scene.add(this.objects);
  }

  _build() {
    const s = this.scene;
    const o = this.objects;
    const TRAIL_LEN = 140;

    // ── Lighting ──────────────────────────────
    // Warm afternoon sun
    const sun = new THREE.DirectionalLight(0xfff4cc, 1.8);
    sun.position.set(30, 60, -20);
    sun.castShadow = true;
    sun.shadow.mapSize.width  = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left   = -60; sun.shadow.camera.right = 60;
    sun.shadow.camera.top    =  60; sun.shadow.camera.bottom = -60;
    sun.shadow.camera.far    = 200;
    sun.shadow.bias = -0.0005;
    o.add(sun);

    // Ambient + hemisphere for sky bounce
    o.add(new THREE.AmbientLight(0x88aabb, 0.55));
    const hemi = new THREE.HemisphereLight(0x90c0ff, 0x406030, 0.6);
    o.add(hemi);

    // ── Fog ───────────────────────────────────
    s.fog = new THREE.FogExp2(0x8aaa88, 0.018);
    s.background = new THREE.Color(0x8aaa88);

    // ── Ground ────────────────────────────────
    const groundMat = makeMat(0x3d5228, 0.95);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, TRAIL_LEN + 40, 1, 1),
      groundMat
    );
    ground.rotation.x = -Math.PI/2;
    ground.position.set(0, 0, -TRAIL_LEN/2);
    ground.receiveShadow = true;
    o.add(ground);

    // ── Dirt Path ─────────────────────────────
    o.add(buildPath(TRAIL_LEN));

    // ── Instanced Grass ───────────────────────
    // We'll create several large patches of grass along the trail
    for (let z = 0; z < TRAIL_LEN; z += 40) {
      const blades = createInstancedGrass(45, 2000, 0x3d5228);
      blades.position.set(0, 0, -z - 20);
      o.add(blades);
    }

    // ── Dense Forest on Both Sides ────────────
    const WALL_DIST = 5.5; // inner edge of tree wall
    for (let z = 4; z < TRAIL_LEN + 10; z += 3.5 + Math.random()*2) {
      [-1, 1].forEach(side => {
        const spread = 2 + Math.random()*12;
        const px = side * (WALL_DIST + spread);
        const pz = -z + (Math.random()-0.5)*2;
        const sc = 0.7 + Math.random()*0.8;
        const type = Math.random() < 0.4 ? 'pine' : 'oak';
        o.add(buildTree(px, pz, sc, type));
      });
      // second layer behind
      if (Math.random() < 0.6) {
        [-1,1].forEach(side => {
          const px = side * (WALL_DIST + 10 + Math.random()*8);
          o.add(buildTree(px, -z + (Math.random()-0.5)*3, 0.8+Math.random()*0.6, Math.random()<0.3?'pine':'oak'));
        });
      }
    }

    // ── Rocks and Roots Along Path ────────────
    for (let z = 5; z < TRAIL_LEN; z += 4 + Math.random()*6) {
      [-1,1].forEach(side => {
        if (Math.random() < 0.5) {
          const px = side * (2.5 + Math.random()*2);
          o.add(buildRock(px, 0, -z, 0.15 + Math.random()*0.25));
        }
      });
    }

    // ── Fallen Log ────────────────────────────
    const logMat = makeMat(0x3a1e0a, 0.95);
    for (let i = 0; i < 4; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.14,2.5+Math.random(),8), logMat);
      log.position.set(
        (Math.random()<0.5?-1:1) * (3.5+Math.random()*2),
        0.08,
        -15 - i*28 - Math.random()*8
      );
      log.rotation.z = Math.PI/2;
      log.rotation.y = (Math.random()-0.5)*0.5;
      log.castShadow = true; log.receiveShadow = true;
      o.add(log);
    }

    // ── Fence Posts (old broken fence) ────────
    const postMat = makeMat(0x5a3a18, 0.9);
    for (let z = 30; z < 55; z += 3 + Math.random()*2) {
      [-1,1].forEach(side => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.05,1.2,6), postMat);
        post.position.set(side*3.2, 0.6, -z);
        post.rotation.z = (Math.random()-0.5)*0.15;
        post.castShadow = true;
        o.add(post);
      });
    }

    // ── Rusted Mailbox ────────────────────────
    const mailboxG = new THREE.Group();
    const mbBody = new THREE.Mesh(new THREE.BoxGeometry(0.4,0.28,0.6), makeMat(0x884422, 0.7, 0.15));
    mbBody.position.y = 0.14; mbBody.castShadow = true;
    mailboxG.add(mbBody);
    const mbPost = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,1.1,6), postMat);
    mbPost.position.y = -0.42; mbPost.castShadow = true;
    mailboxG.add(mbPost);
    mailboxG.position.set(2.2, 1.0, -105);
    o.add(mailboxG);

    // ── Corridor Wall Data (invisible) ────────
    // Simple: keep player within ±3.5 X the whole way
    this.corridorHalfWidth = 3.5;

    // ── The Shed ──────────────────────────────
    this.shedGroup = this._buildShedExterior();
    this.shedGroup.position.set(6, 0, -130);
    this.shedGroup.rotation.y = -0.4;
    o.add(this.shedGroup);
  }

  _buildShedExterior() {
    const g = new THREE.Group();
    const plank = makeMat(0x5a3812, 0.9);
    const roof  = makeMat(0x2a1a08, 0.85, 0.1);
    const darkPlank = makeMat(0x3a2208, 0.92);

    // Walls
    const walls = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3, 4), plank);
    walls.position.y = 1.5;
    walls.castShadow = true; walls.receiveShadow = true;
    g.add(walls);

    // Roof
    const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.6, 4), roof);
    roofMesh.position.y = 3.8;
    roofMesh.rotation.y = Math.PI/4;
    roofMesh.castShadow = true;
    g.add(roofMesh);

    // Door (closed, will open in shed state)
    this.shedDoor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.08), darkPlank);
    this.shedDoor.position.set(0, 1.1, 2.04);
    this.shedDoor.castShadow = true;
    g.add(this.shedDoor);

    // Window (dark glass)
    const windowMat = makeMat(0x203040, 0.1, 0.3, { opacity: 0.6, transparent: true });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.6), windowMat);
    win.position.set(-1.2, 2.0, 2.05);
    g.add(win);

    // Vines on wall
    const vine = makeMat(0x285020, 0.95);
    for (let i = 0; i < 5; i++) {
      const v = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4+Math.random()*0.6, 0.06), vine);
      v.position.set(-2.2+Math.random()*0.3, 0.5+i*0.5, 2.1);
      g.add(v);
    }
    return g;
  }

  // ─── Gary + Bunny ──────────────────────────

  spawnCharacters() {
    this.gary   = buildGary();
    this.bunny = buildBunny();
    this.gary.position.set(0, 0, 0);
    this.bunny.position.set(0, 0, 1.8); // behind Gary
    this.objects.add(this.gary);
    this.objects.add(this.bunny);
    return { gary: this.gary, bunny: this.bunny };
  }

  // ─── Animate Characters ───────────────────

  animateCharacters(t, isMoving) {
    if (!this.gary) return;
    const speed = isMoving ? 1 : 0;
    const swing = Math.sin(t * 8) * 0.55 * speed;

    // Arm swing
    if (this.gary.leftArm)  this.gary.leftArm.rotation.x  =  swing;
    if (this.gary.rightArm) this.gary.rightArm.rotation.x = -swing;
    // Leg swing
    if (this.gary.leftLeg)  this.gary.leftLeg.rotation.x  = -swing;
    if (this.gary.rightLeg) this.gary.rightLeg.rotation.x  = swing;

    // Bunny: limping bob (hurt leg, slightly uneven)
    if (this.bunny) {
      this.bunny.position.y = isMoving ? Math.abs(Math.sin(t*5)) * 0.04 : 0;
      this.bunny.rotation.z = isMoving ? Math.sin(t*5) * 0.04 : 0;
    }
  }

  // ─── Collision (invisible walls) ─────────

  clampPlayer(pos) {
    pos.x = Math.max(-this.corridorHalfWidth, Math.min(this.corridorHalfWidth, pos.x));
    // Don't let player go past the shed
    pos.z = Math.max(-137, pos.z);
    return pos;
  }

  // ─── Check Shed Trigger ──────────────────

  checkShedTrigger(playerZ) {
    return playerZ <= this.shedTriggerZ;
  }

  dispose() {
    this.scene.fog = null;
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.remove(this.objects);
  }
}
