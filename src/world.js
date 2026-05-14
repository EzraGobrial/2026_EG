// ═══════════════════════════════════════════════
// Gary's Life — World System
// 5 procedural 3D environments
// ═══════════════════════════════════════════════

import * as THREE from 'three';

// ─── Shared Helpers ──────────────────────────

function createTree(x, z, scale = 1, treeType = 'oak') {
  const tree = new THREE.Group();

  // Trunk
  const trunkH = (1.5 + Math.random() * 1.0) * scale;
  const trunkR = (0.08 + Math.random() * 0.04) * scale;
  const trunkGeo = new THREE.CylinderGeometry(trunkR * 0.7, trunkR, trunkH, 6);
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x5a3a1a,
    roughness: 0.9
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.set(x, trunkH / 2, z);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  // Canopy
  if (treeType === 'oak' || treeType === 'park_oak') {
    // Round leafy canopy (multiple spheres)
    const leafColor = treeType === 'park_oak' ? 0x2d6b30 : 0x2a5a2a;
    const leafMat = new THREE.MeshStandardMaterial({
      color: leafColor,
      roughness: 0.85
    });

    const numClusters = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numClusters; i++) {
      const r = (0.6 + Math.random() * 0.5) * scale;
      const geo = new THREE.SphereGeometry(r, 8, 6);
      const leaf = new THREE.Mesh(geo, leafMat);
      leaf.position.set(
        x + (Math.random() - 0.5) * scale * 0.6,
        trunkH + r * 0.5 + Math.random() * scale * 0.3,
        z + (Math.random() - 0.5) * scale * 0.6
      );
      leaf.castShadow = true;
      leaf.receiveShadow = true;
      tree.add(leaf);
    }
  } else if (treeType === 'pine') {
    // Conical pine
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x1a4a1a,
      roughness: 0.85
    });
    for (let i = 0; i < 3; i++) {
      const r = (0.6 - i * 0.15) * scale;
      const h = (0.8 - i * 0.15) * scale;
      const geo = new THREE.ConeGeometry(r, h, 6);
      const cone = new THREE.Mesh(geo, leafMat);
      cone.position.set(x, trunkH + i * h * 0.6 + h * 0.3, z);
      cone.castShadow = true;
      tree.add(cone);
    }
  } else if (treeType === 'birch') {
    // White trunk with small leaf clusters
    trunk.material = new THREE.MeshStandardMaterial({ color: 0xddddcc, roughness: 0.7 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x55aa44, roughness: 0.8 });
    for (let i = 0; i < 4; i++) {
      const r = (0.35 + Math.random() * 0.25) * scale;
      const geo = new THREE.SphereGeometry(r, 7, 5);
      const leaf = new THREE.Mesh(geo, leafMat);
      leaf.position.set(
        x + (Math.random() - 0.5) * scale,
        trunkH + r + Math.random() * 0.5,
        z + (Math.random() - 0.5) * scale
      );
      leaf.castShadow = true;
      tree.add(leaf);
    }
  }

  return tree;
}

function createGrassPlane(size, color = 0x3a7a3a) {
  const geo = new THREE.PlaneGeometry(size, size, 32, 32);
  // Add slight terrain variation
  const posAttr = geo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    posAttr.setZ(i, (Math.sin(x * 0.3) * Math.cos(y * 0.3) * 0.15 + Math.random() * 0.03));
  }
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.95,
    metalness: 0.0
  });
  const plane = new THREE.Mesh(geo, mat);
  plane.rotation.x = -Math.PI / 2;
  plane.receiveShadow = true;
  return plane;
}

function createRock(x, y, z, scale = 1) {
  const geo = new THREE.DodecahedronGeometry(0.3 * scale, 1);
  // Deform vertices for natural look
  const posAttr = geo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    posAttr.setX(i, posAttr.getX(i) + (Math.random() - 0.5) * 0.08 * scale);
    posAttr.setY(i, posAttr.getY(i) + (Math.random() - 0.5) * 0.08 * scale);
    posAttr.setZ(i, posAttr.getZ(i) + (Math.random() - 0.5) * 0.08 * scale);
  }
  geo.computeVertexNormals();
  geo.scale(1, 0.6, 1);

  const mat = new THREE.MeshStandardMaterial({
    color: 0x777777,
    roughness: 0.95,
    metalness: 0.0
  });
  const rock = new THREE.Mesh(geo, mat);
  rock.position.set(x, y, z);
  rock.rotation.y = Math.random() * Math.PI * 2;
  rock.castShadow = true;
  rock.receiveShadow = true;
  return rock;
}

// ─── House Builder ───────────────────────────

function createHouse(x, z, rotY = 0, options = {}) {
  const house = new THREE.Group();

  const wallColor = options.wallColor || 0xccbb99;
  const roofColor = options.roofColor || 0x664433;
  const width = options.width || 6;
  const depth = options.depth || 5;
  const wallH = options.wallH || 3.5;
  const roofH = options.roofH || 2.0;

  const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.85 });
  const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.8 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.7 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.8 });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x88bbdd, roughness: 0.1, metalness: 0.3,
    transparent: true, opacity: 0.5
  });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });

  // Main walls
  const wallGeo = new THREE.BoxGeometry(width, wallH, depth);
  const walls = new THREE.Mesh(wallGeo, wallMat);
  walls.position.y = wallH / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  house.add(walls);

  // Pitched roof (triangular prism via ExtrudeGeometry)
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-width / 2 - 0.4, 0);
  roofShape.lineTo(0, roofH);
  roofShape.lineTo(width / 2 + 0.4, 0);
  roofShape.lineTo(-width / 2 - 0.4, 0);
  const roofExtGeo = new THREE.ExtrudeGeometry(roofShape, { depth: depth + 0.6, bevelEnabled: false });
  const roof = new THREE.Mesh(roofExtGeo, roofMat);
  roof.position.set(0, wallH, -depth / 2 - 0.3);
  roof.castShadow = true;
  house.add(roof);

  // Door (front face)
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.1), doorMat);
  door.position.set(0.5, 0.9, -depth / 2 - 0.05);
  house.add(door);

  // Door frame
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 0.06), trimMat);
  frame.position.set(0.5, 1.0, -depth / 2 - 0.06);
  house.add(frame);

  // Windows (front face)
  for (const wx of [-1.5, 2.2]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.08), windowMat);
    win.position.set(wx, wallH * 0.55, -depth / 2 - 0.04);
    house.add(win);
    // Window frame
    const wframe = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.04), trimMat);
    wframe.position.set(wx, wallH * 0.55, -depth / 2 - 0.06);
    house.add(wframe);
  }

  // Side window
  const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.8), windowMat);
  sideWin.position.set(width / 2 + 0.04, wallH * 0.55, 0);
  house.add(sideWin);

  // Chimney (some houses)
  if (options.chimney) {
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.5, 0.6), darkMat);
    chimney.position.set(width / 4, wallH + roofH * 0.6, depth / 4);
    chimney.castShadow = true;
    house.add(chimney);
  }

  // Foundation strip
  const foundGeo = new THREE.BoxGeometry(width + 0.2, 0.25, depth + 0.2);
  const found = new THREE.Mesh(foundGeo, darkMat);
  found.position.y = 0.12;
  found.receiveShadow = true;
  house.add(found);

  // Driveway
  const driveMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
  const drive = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 3), driveMat);
  drive.rotation.x = -Math.PI / 2;
  drive.position.set(-1.5, 0.01, -depth / 2 - 2);
  house.add(drive);

  house.position.set(x, 0, z);
  house.rotation.y = rotY;

  house.traverse(child => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });

  return house;
}

// ─── Level Builders ──────────────────────────

function buildBackyard(scene) {
  const group = new THREE.Group();

  // Larger ground for neighborhood
  const grass = createGrassPlane(60, 0x4a8a35);
  group.add(grass);

  // Sidewalk ring around the yards
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xbbbbaa, roughness: 0.85 });
  for (let i = 0; i < 4; i++) {
    const sw = new THREE.Mesh(new THREE.BoxGeometry(i < 2 ? 40 : 0.8, 0.05, i >= 2 ? 40 : 0.8), sidewalkMat);
    const pos = 17;
    if (i === 0) sw.position.set(0, 0.02, -pos);
    else if (i === 1) sw.position.set(0, 0.02, pos);
    else if (i === 2) sw.position.set(-pos, 0.02, 0);
    else sw.position.set(pos, 0.02, 0);
    group.add(sw);
  }

  // Player's yard area (fenced)
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.85 });
  const fenceH = 1.2;
  const fenceSize = 14;
  for (let side = 0; side < 4; side++) {
    for (let i = -fenceSize / 2; i < fenceSize / 2; i += 0.6) {
      const postGeo = new THREE.BoxGeometry(0.06, fenceH, 0.06);
      const post = new THREE.Mesh(postGeo, fenceMat);
      post.castShadow = true;
      if (side === 0) post.position.set(i, fenceH / 2, -fenceSize / 2);
      else if (side === 1) post.position.set(i, fenceH / 2, fenceSize / 2);
      else if (side === 2) post.position.set(-fenceSize / 2, fenceH / 2, i);
      else post.position.set(fenceSize / 2, fenceH / 2, i);
      group.add(post);
    }
    for (const h of [0.3, 0.8]) {
      const railGeo = new THREE.BoxGeometry(
        side < 2 ? fenceSize : 0.04, 0.06, side >= 2 ? fenceSize : 0.04
      );
      const rail = new THREE.Mesh(railGeo, fenceMat);
      if (side === 0) rail.position.set(0, h, -fenceSize / 2);
      else if (side === 1) rail.position.set(0, h, fenceSize / 2);
      else if (side === 2) rail.position.set(-fenceSize / 2, h, 0);
      else rail.position.set(fenceSize / 2, h, 0);
      group.add(rail);
    }
  }

  // ─── NEIGHBORHOOD HOUSES ────────────────
  // Ring of houses around the yard perimeter
  const houseConfigs = [
    // Back row (behind fence, facing player)
    { x: -10, z: -12, rot: 0, wall: 0xccbb99, roof: 0x664433, chimney: true },
    { x: 0, z: -13, rot: 0, wall: 0xbb9977, roof: 0x553322, chimney: false },
    { x: 10, z: -12, rot: 0, wall: 0xddccaa, roof: 0x884444, chimney: true },

    // Left side (facing right)
    { x: -13, z: -2, rot: Math.PI / 2, wall: 0xaabb99, roof: 0x556644, chimney: false },
    { x: -13, z: 8, rot: Math.PI / 2, wall: 0xccaaaa, roof: 0x665544, chimney: true },

    // Right side (facing left)
    { x: 13, z: -2, rot: -Math.PI / 2, wall: 0x99aabb, roof: 0x445566, chimney: false },
    { x: 13, z: 8, rot: -Math.PI / 2, wall: 0xddddbb, roof: 0x776655, chimney: true },

    // Behind player (far back)
    { x: 0, z: 14, rot: Math.PI, wall: 0xbbbbcc, roof: 0x555566, chimney: false },
  ];

  for (const cfg of houseConfigs) {
    group.add(createHouse(cfg.x, cfg.z, cfg.rot, {
      wallColor: cfg.wall,
      roofColor: cfg.roof,
      chimney: cfg.chimney,
      width: 5 + Math.random() * 2,
      depth: 4 + Math.random() * 1.5,
      wallH: 3 + Math.random() * 1,
      roofH: 1.5 + Math.random() * 1
    }));
  }

  // Trees in neighboring yards
  group.add(createTree(-11, -6, 1.2, 'oak'));
  group.add(createTree(11, -6, 1.0, 'birch'));
  group.add(createTree(-11, 4, 0.9, 'oak'));
  group.add(createTree(11, 4, 1.1, 'oak'));
  group.add(createTree(3, 12, 0.8, 'birch'));
  group.add(createTree(-3, -10, 1.0, 'oak'));

  // Player's yard features
  // Shed
  const shedMat = new THREE.MeshStandardMaterial({ color: 0x884422, roughness: 0.9 });
  const shedBody = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2, 2), shedMat);
  shedBody.position.set(-5, 1, 5);
  shedBody.castShadow = true;
  group.add(shedBody);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
  const shedRoof = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 2.5), roofMat);
  shedRoof.position.set(-5, 2.1, 5);
  shedRoof.rotation.x = 0.1;
  group.add(shedRoof);

  // Clothesline
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5, metalness: 0.5 });
  for (const px of [2, 6]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.5, 6), poleMat);
    pole.position.set(px, 1.25, -2);
    group.add(pole);
  }
  const lineGeo = new THREE.CylinderGeometry(0.005, 0.005, 4, 4);
  lineGeo.rotateZ(Math.PI / 2);
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xcccccc });
  const line = new THREE.Mesh(lineGeo, lineMat);
  line.position.set(4, 2.4, -2);
  group.add(line);

  // Dirt path from back door to yard
  const pathMat = new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 0.95 });
  const pathGeo = new THREE.PlaneGeometry(1.5, 8);
  const path = new THREE.Mesh(pathGeo, pathMat);
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.01, 5);
  group.add(path);

  // Scattered rocks
  for (let i = 0; i < 5; i++) {
    group.add(createRock(
      (Math.random() - 0.5) * 10,
      0.1,
      (Math.random() - 0.5) * 10,
      0.4 + Math.random() * 0.4
    ));
  }

  // Mailbox near sidewalk
  const mailboxMat = new THREE.MeshStandardMaterial({ color: 0x2255aa, roughness: 0.5 });
  const mbPost = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 5), darkMetalMat());
  mbPost.position.set(2, 0.6, -8);
  group.add(mbPost);
  const mbBox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.5), mailboxMat);
  mbBox.position.set(2, 1.25, -8);
  group.add(mbBox);

  scene.add(group);
  return group;
}

function darkMetalMat() {
  return new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5, metalness: 0.5 });
}

function buildPark(scene) {
  const group = new THREE.Group();

  // Ground
  const grass = createGrassPlane(60, 0x3d8535);
  group.add(grass);

  // Gravel path (winding)
  const pathMat = new THREE.MeshStandardMaterial({ color: 0xb0a888, roughness: 0.9 });
  for (let i = -20; i < 20; i += 2) {
    const pathGeo = new THREE.PlaneGeometry(3, 2.5);
    const seg = new THREE.Mesh(pathGeo, pathMat);
    seg.rotation.x = -Math.PI / 2;
    seg.position.set(Math.sin(i * 0.2) * 3, 0.01, i);
    group.add(seg);
  }

  // Trees (big park oaks)
  const treePositions = [
    [-8, -10], [10, -8], [-12, 5], [15, 3], [0, 18],
    [-18, -5], [18, -15], [-5, 15], [8, 12], [-15, 12]
  ];
  for (const [tx, tz] of treePositions) {
    group.add(createTree(tx, tz, 1.5 + Math.random() * 0.5, 'park_oak'));
  }

  // Fountain in center
  const fountainMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.5, metalness: 0.3 });
  const basinGeo = new THREE.CylinderGeometry(2, 2.2, 0.6, 16);
  const basin = new THREE.Mesh(basinGeo, fountainMat);
  basin.position.set(0, 0.3, 0);
  basin.castShadow = true;
  group.add(basin);

  // Water in basin
  const waterGeo = new THREE.CircleGeometry(1.8, 16);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x4488aa,
    roughness: 0.1,
    metalness: 0.3,
    transparent: true,
    opacity: 0.7
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.55, 0);
  group.add(water);

  // Fountain pillar
  const pillarGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 8);
  const pillar = new THREE.Mesh(pillarGeo, fountainMat);
  pillar.position.set(0, 1.05, 0);
  group.add(pillar);

  // Benches
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.85 });
  const benchMetalMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.4, metalness: 0.6 });
  for (const [bx, bz, ry] of [[5, 4, 0.5], [-5, -4, -0.5], [3, -6, 1]]) {
    const bench = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.4), benchMat);
    seat.position.y = 0.45;
    bench.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.06), benchMat);
    back.position.set(0, 0.7, -0.17);
    bench.add(back);
    for (const lx of [-0.7, 0.7]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.35), benchMetalMat);
      leg.position.set(lx, 0.22, 0);
      bench.add(leg);
    }
    bench.position.set(bx, 0, bz);
    bench.rotation.y = ry;
    bench.castShadow = true;
    group.add(bench);
  }

  // Rocks
  for (let i = 0; i < 10; i++) {
    group.add(createRock(
      (Math.random() - 0.5) * 40,
      0.1,
      (Math.random() - 0.5) * 40,
      0.4 + Math.random() * 0.7
    ));
  }

  scene.add(group);
  return group;
}

function buildForest(scene) {
  const group = new THREE.Group();

  // Ground (darker forest floor)
  const grass = createGrassPlane(80, 0x2a4a22);
  group.add(grass);

  // Dense forest floor details (leaf litter)
  const leafLitterMat = new THREE.MeshStandardMaterial({ color: 0x3a3520, roughness: 1.0 });
  for (let i = 0; i < 30; i++) {
    const litter = new THREE.Mesh(
      new THREE.PlaneGeometry(1 + Math.random() * 2, 1 + Math.random() * 2),
      leafLitterMat
    );
    litter.rotation.x = -Math.PI / 2;
    litter.position.set(
      (Math.random() - 0.5) * 50,
      0.02,
      (Math.random() - 0.5) * 50
    );
    litter.rotation.z = Math.random() * Math.PI;
    group.add(litter);
  }

  // Dense trees
  for (let i = 0; i < 40; i++) {
    const x = (Math.random() - 0.5) * 55;
    const z = (Math.random() - 0.5) * 55;
    // Leave clearing in center
    if (Math.sqrt(x * x + z * z) < 5) continue;
    const type = Math.random() < 0.4 ? 'pine' : (Math.random() < 0.5 ? 'oak' : 'birch');
    group.add(createTree(x, z, 1.0 + Math.random() * 1.0, type));
  }

  // Fallen logs
  const logMat = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.9 });
  for (let i = 0; i < 3; i++) {
    const logGeo = new THREE.CylinderGeometry(0.15, 0.2, 3 + Math.random() * 2, 6);
    logGeo.rotateZ(Math.PI / 2);
    const log = new THREE.Mesh(logGeo, logMat);
    log.position.set(
      (Math.random() - 0.5) * 20,
      0.15,
      (Math.random() - 0.5) * 20
    );
    log.rotation.y = Math.random() * Math.PI;
    log.castShadow = true;
    group.add(log);
  }

  // Mushrooms
  const mushMat = new THREE.MeshStandardMaterial({ color: 0xcc4422, roughness: 0.75 });
  const stemMat = new THREE.MeshStandardMaterial({ color: 0xddddcc, roughness: 0.8 });
  for (let i = 0; i < 12; i++) {
    const mush = new THREE.Group();
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.5), mushMat);
    cap.position.y = 0.12;
    mush.add(cap);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.12, 5), stemMat);
    stem.position.y = 0.06;
    mush.add(stem);
    mush.position.set(
      (Math.random() - 0.5) * 30,
      0,
      (Math.random() - 0.5) * 30
    );
    mush.scale.setScalar(0.5 + Math.random() * 1.0);
    group.add(mush);
  }

  // Rocks
  for (let i = 0; i < 15; i++) {
    group.add(createRock(
      (Math.random() - 0.5) * 40,
      0.1,
      (Math.random() - 0.5) * 40,
      0.5 + Math.random() * 1.0
    ));
  }

  scene.add(group);
  return group;
}

function buildLakeside(scene) {
  const group = new THREE.Group();

  // Ground (one half grass, one half sandy)
  const grass = createGrassPlane(80, 0x4a7a35);
  group.add(grass);

  // Lake water
  const waterGeo = new THREE.CircleGeometry(20, 32);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x2266aa,
    roughness: 0.05,
    metalness: 0.4,
    transparent: true,
    opacity: 0.75
  });
  const lake = new THREE.Mesh(waterGeo, waterMat);
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(15, 0.05, 0);
  group.add(lake);

  // Sandy shore
  const shoreMat = new THREE.MeshStandardMaterial({ color: 0xc4a868, roughness: 0.95 });
  const shoreGeo = new THREE.RingGeometry(18, 23, 32);
  shoreGeo.rotateX(-Math.PI / 2);
  const shore = new THREE.Mesh(shoreGeo, shoreMat);
  shore.position.set(15, 0.02, 0);
  group.add(shore);

  // Dock
  const dockMat = new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.85 });
  const deckGeo = new THREE.BoxGeometry(1.5, 0.08, 6);
  const deck = new THREE.Mesh(deckGeo, dockMat);
  deck.position.set(-3, 0.5, 0);
  deck.castShadow = true;
  group.add(deck);
  // Dock posts
  for (const [px, pz] of [[-3.5, -2.5], [-3.5, 2.5], [-2.5, -2.5], [-2.5, 2.5]]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.2, 5), dockMat);
    post.position.set(px, 0.1, pz);
    group.add(post);
  }

  // Reeds along shoreline
  const reedMat = new THREE.MeshStandardMaterial({ color: 0x557733, roughness: 0.9 });
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 19 + Math.random() * 3;
    const reedGeo = new THREE.CylinderGeometry(0.01, 0.02, 1.0 + Math.random() * 0.5, 4);
    const reed = new THREE.Mesh(reedGeo, reedMat);
    reed.position.set(
      15 + Math.cos(angle) * radius,
      0.4,
      Math.sin(angle) * radius
    );
    reed.rotation.x = (Math.random() - 0.5) * 0.2;
    reed.rotation.z = (Math.random() - 0.5) * 0.2;
    group.add(reed);
  }

  // Trees (willows near water, others scattered)
  group.add(createTree(-10, -10, 1.5, 'oak'));
  group.add(createTree(-15, 5, 1.3, 'birch'));
  group.add(createTree(-8, 12, 1.4, 'oak'));
  group.add(createTree(-20, -5, 1.2, 'birch'));
  group.add(createTree(-12, 18, 1.0, 'oak'));

  // Rocks near water
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 16 + Math.random() * 5;
    group.add(createRock(
      15 + Math.cos(angle) * r,
      0.1,
      Math.sin(angle) * r,
      0.6 + Math.random() * 1.0
    ));
  }

  scene.add(group);
  return group;
}

function buildMountain(scene) {
  const group = new THREE.Group();

  // Rocky ground
  const groundGeo = new THREE.PlaneGeometry(100, 100, 50, 50);
  const posAttr = groundGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    // Mountainous terrain
    const height = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 1.5
                 + Math.sin(x * 0.3 + 1) * 0.5
                 + Math.random() * 0.1;
    posAttr.setZ(i, Math.max(0, height));
  }
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x6a6a60,
    roughness: 0.95
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Grass patches on rocky ground
  const grassPatchMat = new THREE.MeshStandardMaterial({ color: 0x5a7a4a, roughness: 0.9 });
  for (let i = 0; i < 20; i++) {
    const patch = new THREE.Mesh(
      new THREE.CircleGeometry(1 + Math.random() * 2, 8),
      grassPatchMat
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(
      (Math.random() - 0.5) * 40,
      0.03,
      (Math.random() - 0.5) * 40
    );
    group.add(patch);
  }

  // Mountain backdrop (large cones in background)
  const mountainMat = new THREE.MeshStandardMaterial({ color: 0x555560, roughness: 0.9 });
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xeeeeff, roughness: 0.7 });

  for (const [mx, mz, ms] of [[-30, -40, 25], [20, -45, 30], [50, -35, 20], [-50, -30, 18]]) {
    const mountainGeo = new THREE.ConeGeometry(ms, ms * 1.5, 8);
    // Deform for natural look
    const mpos = mountainGeo.attributes.position;
    for (let i = 0; i < mpos.count; i++) {
      mpos.setX(i, mpos.getX(i) + (Math.random() - 0.5) * ms * 0.1);
      mpos.setZ(i, mpos.getZ(i) + (Math.random() - 0.5) * ms * 0.1);
    }
    mountainGeo.computeVertexNormals();

    const mountain = new THREE.Mesh(mountainGeo, mountainMat);
    mountain.position.set(mx, ms * 0.4, mz);
    group.add(mountain);

    // Snow cap
    const snowGeo = new THREE.ConeGeometry(ms * 0.3, ms * 0.4, 8);
    const snow = new THREE.Mesh(snowGeo, snowMat);
    snow.position.set(mx, ms * 1.0, mz);
    group.add(snow);
  }

  // Large boulders
  for (let i = 0; i < 20; i++) {
    group.add(createRock(
      (Math.random() - 0.5) * 50,
      0.2,
      (Math.random() - 0.5) * 50,
      1.0 + Math.random() * 2.0
    ));
  }

  // Sparse mountain trees
  for (let i = 0; i < 8; i++) {
    group.add(createTree(
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 40,
      0.8 + Math.random() * 0.5,
      'pine'
    ));
  }

  // Cliff edge detail
  const cliffMat = new THREE.MeshStandardMaterial({ color: 0x5a5a55, roughness: 0.95 });
  const cliffGeo = new THREE.BoxGeometry(60, 8, 4);
  const cliff = new THREE.Mesh(cliffGeo, cliffMat);
  cliff.position.set(0, -4, 40);
  group.add(cliff);

  scene.add(group);
  return group;
}

// ─── Exports ─────────────────────────────────

const BUILDERS = {
  backyard: buildBackyard,
  park: buildPark,
  forest: buildForest,
  lakeside: buildLakeside,
  mountain: buildMountain
};

export class WorldSystem {
  constructor(scene) {
    this.scene = scene;
    this.currentWorld = null;
    this.currentKey = null;
  }

  load(locationKey) {
    this.unload();
    const builder = BUILDERS[locationKey];
    if (!builder) {
      console.warn('Unknown location:', locationKey);
      return;
    }
    this.currentKey = locationKey;
    this.currentWorld = builder(this.scene);
  }

  unload() {
    if (this.currentWorld) {
      this.scene.remove(this.currentWorld);
      this.currentWorld.traverse(child => {
        if (child.isMesh) {
          child.geometry.dispose();
          if (child.material.dispose) child.material.dispose();
        }
      });
      this.currentWorld = null;
      this.currentKey = null;
    }
  }
}
