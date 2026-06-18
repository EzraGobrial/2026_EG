// ═══════════════════════════════════════════════
// Gary's Life — World System
// 20 procedural 3D environments
// ═══════════════════════════════════════════════

import * as THREE from 'three';

// ─── Procedural Texture Helpers ──────────────
// Lightweight canvas-based textures (color + bump) used to give
// structures, trees, rocks and ground a more realistic, detailed surface
// without requiring any external image assets.

const _texCache = new Map();

function hexParts(hex) {
  return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
}

function shadeRGB([r, g, b], factor) {
  const cr = Math.min(255, Math.max(0, Math.round(r * factor)));
  const cg = Math.min(255, Math.max(0, Math.round(g * factor)));
  const cb = Math.min(255, Math.max(0, Math.round(b * factor)));
  return `rgb(${cr},${cg},${cb})`;
}

function makeBumpMap(canvas) {
  const w = canvas.width, h = canvas.height;
  const src = canvas.getContext('2d').getImageData(0, 0, w, h);
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = w;
  bumpCanvas.height = h;
  const bctx = bumpCanvas.getContext('2d');
  const dst = bctx.createImageData(w, h);
  for (let i = 0; i < src.data.length; i += 4) {
    const l = src.data[i] * 0.3 + src.data[i + 1] * 0.59 + src.data[i + 2] * 0.11;
    dst.data[i] = dst.data[i + 1] = dst.data[i + 2] = l;
    dst.data[i + 3] = 255;
  }
  bctx.putImageData(dst, 0, 0);
  const tex = new THREE.CanvasTexture(bumpCanvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function buildTexture(key, drawFn, repeat = [1, 1], size = 256) {
  const cacheKey = `${key}_${repeat[0]}x${repeat[1]}`;
  if (_texCache.has(cacheKey)) return _texCache.get(cacheKey);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, size);
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeat[0], repeat[1]);
  map.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = makeBumpMap(canvas);
  bumpMap.repeat.set(repeat[0], repeat[1]);
  const result = { map, bumpMap };
  _texCache.set(cacheKey, result);
  return result;
}

// Horizontal wood/vinyl siding with subtle plank lines and grain
function sidingTexture(hex, repeat = [2, 1.5]) {
  const c = hexParts(hex);
  return buildTexture(`siding_${hex}`, (ctx, s) => {
    ctx.fillStyle = shadeRGB(c, 1.0);
    ctx.fillRect(0, 0, s, s);
    const rows = 10;
    for (let i = 0; i < rows; i++) {
      const y = i * (s / rows);
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(0, y, s, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(0, y + 2, s, 1);
      for (let j = 0; j < 5; j++) {
        ctx.fillStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.06})`;
        ctx.fillRect(Math.random() * s, y + 3 + Math.random() * (s / rows - 5), s * (0.15 + Math.random() * 0.4), 1);
      }
    }
  }, repeat);
}

// Roof shingles in staggered rows
function shingleTexture(hex, repeat = [3, 3]) {
  const c = hexParts(hex);
  return buildTexture(`shingle_${hex}`, (ctx, s) => {
    ctx.fillStyle = shadeRGB(c, 0.85);
    ctx.fillRect(0, 0, s, s);
    const rows = 10, cols = 6;
    const rh = s / rows, rw = s / cols;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2 === 0) ? 0 : rw / 2;
      for (let cc = -1; cc <= cols; cc++) {
        const x = cc * rw + offset;
        const y = r * rh;
        const shade = 0.75 + Math.random() * 0.4;
        ctx.fillStyle = shadeRGB(c, shade);
        ctx.fillRect(x + 1, y + 1, rw - 2, rh - 3);
      }
    }
  }, repeat);
}

// Tree bark with vertical fissures and knots
function barkTexture(hex, repeat = [1, 2]) {
  const c = hexParts(hex);
  return buildTexture(`bark_${hex}`, (ctx, s) => {
    ctx.fillStyle = shadeRGB(c, 1.0);
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * s;
      const w = 2 + Math.random() * 6;
      ctx.fillStyle = `rgba(0,0,0,${0.08 + Math.random() * 0.15})`;
      ctx.fillRect(x, 0, w, s);
    }
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = `rgba(0,0,0,${0.1 + Math.random() * 0.1})`;
      ctx.beginPath();
      ctx.ellipse(Math.random() * s, Math.random() * s, 6 + Math.random() * 6, 3 + Math.random() * 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }, repeat);
}

// Mottled stone surface with cracks
function stoneTexture(hex, repeat = [1, 1]) {
  const c = hexParts(hex);
  return buildTexture(`stone_${hex}`, (ctx, s) => {
    ctx.fillStyle = shadeRGB(c, 1.0);
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 60; i++) {
      const shade = 0.7 + Math.random() * 0.5;
      ctx.fillStyle = shadeRGB(c, shade);
      ctx.beginPath();
      ctx.arc(Math.random() * s, Math.random() * s, 4 + Math.random() * 14, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = `rgba(0,0,0,${0.1 + Math.random() * 0.15})`;
      ctx.lineWidth = 1 + Math.random();
      ctx.beginPath();
      ctx.moveTo(Math.random() * s, Math.random() * s);
      ctx.lineTo(Math.random() * s, Math.random() * s);
      ctx.stroke();
    }
  }, repeat);
}

// Speckled ground / grass surface detail
function groundTexture(hex, repeat = [12, 12]) {
  const c = hexParts(hex);
  return buildTexture(`ground_${hex}`, (ctx, s) => {
    ctx.fillStyle = shadeRGB(c, 1.0);
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 400; i++) {
      const shade = 0.6 + Math.random() * 0.7;
      ctx.fillStyle = shadeRGB(c, shade);
      ctx.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1 + Math.random() * 3);
    }
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(60,45,25,${0.05 + Math.random() * 0.08})`;
      ctx.beginPath();
      ctx.arc(Math.random() * s, Math.random() * s, 3 + Math.random() * 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }, repeat, 128);
}

// ─── Shared Helpers ──────────────────────────

function createTree(x, z, scale = 1, treeType = 'oak', obstacles = null) {
  const tree = new THREE.Group();
  
  if (obstacles) {
    const trunkR = (0.08 + 0.04) * scale;
    obstacles.push({ type: 'circle', x, z, r: trunkR * 1.5 });
  }

  // Trunk
  const trunkH = (1.5 + Math.random() * 1.0) * scale;
  const trunkR = (0.08 + Math.random() * 0.04) * scale;
  const trunkGeo = new THREE.CylinderGeometry(trunkR * 0.7, trunkR, trunkH, 7);
  const barkTex = barkTexture(0x5a3a1a, [1, Math.max(1, Math.round(trunkH))]);
  const trunkMat = new THREE.MeshStandardMaterial({
    map: barkTex.map,
    bumpMap: barkTex.bumpMap,
    bumpScale: 0.03,
    color: 0xffffff,
    roughness: 0.9
  });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.set(x, trunkH / 2, z);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  // Helper to add a few stubby branches reaching toward canopy clusters
  function addBranches(positions, branchTex) {
    const branchMat = new THREE.MeshStandardMaterial({
      map: branchTex.map,
      bumpMap: branchTex.bumpMap,
      bumpScale: 0.03,
      color: 0xffffff,
      roughness: 0.9
    });
    const origin = new THREE.Vector3(x, trunkH * 0.82, z);
    for (let i = 0; i < Math.min(3, positions.length); i++) {
      const [px, py, pz] = positions[i];
      const dir = new THREE.Vector3(px - origin.x, py - origin.y, pz - origin.z);
      const len = Math.max(0.3, dir.length() * 0.65);
      const branchGeo = new THREE.CylinderGeometry(trunkR * 0.15, trunkR * 0.5, len, 5);
      const branch = new THREE.Mesh(branchGeo, branchMat);
      branch.position.copy(origin).addScaledVector(dir.clone().normalize(), len * 0.5);
      branch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      branch.castShadow = true;
      tree.add(branch);
    }
  }

  // Canopy
  if (treeType === 'oak' || treeType === 'park_oak') {
    // Round leafy canopy (multiple spheres)
    const leafColor = treeType === 'park_oak' ? 0x2d6b30 : 0x2a5a2a;
    const leafMat = new THREE.MeshStandardMaterial({
      color: leafColor,
      roughness: 0.85
    });

    const numClusters = 3 + Math.floor(Math.random() * 3);
    const leafPositions = [];
    for (let i = 0; i < numClusters; i++) {
      const r = (0.6 + Math.random() * 0.5) * scale;
      const geo = new THREE.SphereGeometry(r, 8, 6);
      const mat = leafMat.clone();
      mat.color.offsetHSL((Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.08);
      const leaf = new THREE.Mesh(geo, mat);
      const pos = [
        x + (Math.random() - 0.5) * scale * 0.6,
        trunkH + r * 0.5 + Math.random() * scale * 0.3,
        z + (Math.random() - 0.5) * scale * 0.6
      ];
      leaf.position.set(pos[0], pos[1], pos[2]);
      leaf.castShadow = true;
      leaf.receiveShadow = true;
      tree.add(leaf);
      leafPositions.push(pos);
    }
    addBranches(leafPositions, barkTex);
  } else if (treeType === 'pine') {
    // Conical pine
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x1a4a1a,
      roughness: 0.85
    });
    for (let i = 0; i < 3; i++) {
      const r = (0.6 - i * 0.15) * scale;
      const h = (0.8 - i * 0.15) * scale;
      const geo = new THREE.ConeGeometry(r, h, 7);
      const mat = leafMat.clone();
      mat.color.offsetHSL(0, (Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.06);
      const cone = new THREE.Mesh(geo, mat);
      cone.position.set(x, trunkH + i * h * 0.6 + h * 0.3, z);
      cone.castShadow = true;
      tree.add(cone);
    }
  } else if (treeType === 'birch') {
    // White trunk with small leaf clusters
    const birchBark = barkTexture(0xddddcc, [1, Math.max(1, Math.round(trunkH))]);
    trunk.material = new THREE.MeshStandardMaterial({
      map: birchBark.map,
      bumpMap: birchBark.bumpMap,
      bumpScale: 0.02,
      color: 0xffffff,
      roughness: 0.7
    });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x55aa44, roughness: 0.8 });
    const leafPositions = [];
    for (let i = 0; i < 4; i++) {
      const r = (0.35 + Math.random() * 0.25) * scale;
      const geo = new THREE.SphereGeometry(r, 7, 5);
      const mat = leafMat.clone();
      mat.color.offsetHSL((Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1);
      const leaf = new THREE.Mesh(geo, mat);
      const pos = [
        x + (Math.random() - 0.5) * scale,
        trunkH + r + Math.random() * 0.5,
        z + (Math.random() - 0.5) * scale
      ];
      leaf.position.set(pos[0], pos[1], pos[2]);
      leaf.castShadow = true;
      tree.add(leaf);
      leafPositions.push(pos);
    }
    addBranches(leafPositions, birchBark);
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

  const repeatN = Math.max(2, Math.round(size / 4));
  const groundTex = groundTexture(color, [repeatN, repeatN]);
  const mat = new THREE.MeshStandardMaterial({
    map: groundTex.map,
    bumpMap: groundTex.bumpMap,
    bumpScale: 0.04,
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0.0
  });
  const plane = new THREE.Mesh(geo, mat);
  plane.rotation.x = -Math.PI / 2;
  plane.receiveShadow = true;
  return plane;
}

export function createInstancedGrass(areaSize, count, baseColor = 0x3a7a3a) {
  const geo = new THREE.PlaneGeometry(0.12, 0.45);
  geo.translate(0, 0.225, 0); // Origin at bottom
  
  const mat = new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.9,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.castShadow = false; // Disable cast for performance
  mesh.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * areaSize;
    const z = (Math.random() - 0.5) * areaSize;
    const y = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.15;
    
    dummy.position.set(x, y, z);
    dummy.rotation.y = Math.random() * Math.PI;
    dummy.rotation.x = (Math.random() - 0.5) * 0.4;
    dummy.rotation.z = (Math.random() - 0.5) * 0.4;
    
    const scale = 0.5 + Math.random() * 1.0;
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    
    color.setHex(baseColor);
    color.offsetHSL((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.15);
    mesh.setColorAt(i, color);
  }
  
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

function createRock(x, y, z, scale = 1, obstacles = null) {
  const geo = new THREE.DodecahedronGeometry(0.3 * scale, 1);
  
  if (obstacles) {
    obstacles.push({ type: 'circle', x, z, r: 0.3 * scale });
  }
  // Deform vertices for natural look
  const posAttr = geo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    posAttr.setX(i, posAttr.getX(i) + (Math.random() - 0.5) * 0.08 * scale);
    posAttr.setY(i, posAttr.getY(i) + (Math.random() - 0.5) * 0.08 * scale);
    posAttr.setZ(i, posAttr.getZ(i) + (Math.random() - 0.5) * 0.08 * scale);
  }
  geo.computeVertexNormals();
  geo.scale(1, 0.6, 1);

  const rockTex = stoneTexture(0x777777, [2, 2]);
  const mat = new THREE.MeshStandardMaterial({
    map: rockTex.map,
    bumpMap: rockTex.bumpMap,
    bumpScale: 0.04,
    color: 0xffffff,
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

function createHouse(x, z, rotY = 0, options = {}, obstacles = null) {
  const house = new THREE.Group();

  if (obstacles) {
    const width = options.width || 6;
    const depth = options.depth || 5;
    // Calculate AABB for house considering rotation (simplified for 90-degree increments)
    const isRotated = Math.abs(rotY) > 0.1 && Math.abs(rotY) < 3.0; // checking if it's 90 or 270 deg
    const w = isRotated ? depth : width;
    const d = isRotated ? width : depth;
    obstacles.push({
      type: 'box',
      minX: x - w / 2,
      maxX: x + w / 2,
      minZ: z - d / 2,
      maxZ: z + d / 2
    });
  }

  const wallColor = options.wallColor || 0xccbb99;
  const roofColor = options.roofColor || 0x664433;
  const width = options.width || 6;
  const depth = options.depth || 5;
  const wallH = options.wallH || 3.5;
  const roofH = options.roofH || 2.0;

  const sideTex = sidingTexture(wallColor, [Math.max(1, Math.round(width / 1.5)), Math.max(1, Math.round(wallH / 1.2))]);
  const wallMat = new THREE.MeshStandardMaterial({
    map: sideTex.map, bumpMap: sideTex.bumpMap, bumpScale: 0.015,
    color: 0xffffff, roughness: 0.85
  });
  const shingleTex = shingleTexture(roofColor, [Math.max(1, Math.round((width + 1) / 1.5)), Math.max(1, Math.round((depth + 1) / 1.5))]);
  const roofMat = new THREE.MeshStandardMaterial({
    map: shingleTex.map, bumpMap: shingleTex.bumpMap, bumpScale: 0.02,
    color: 0xffffff, roughness: 0.8
  });
  const ridgeMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.7 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.7 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x5a3a1a, roughness: 0.8 });
  const doorPanelMat = new THREE.MeshStandardMaterial({ color: 0x3a2410, roughness: 0.85 });
  const knobMat = new THREE.MeshStandardMaterial({ color: 0xddaa33, roughness: 0.3, metalness: 0.8 });
  const gutterMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.4, metalness: 0.6 });
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x88bbdd, roughness: 0.1, metalness: 0.3,
    transparent: true, opacity: 0.5
  });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
  const foundTex = stoneTexture(0x999999, [Math.max(1, Math.round((width + 0.2) / 1.5)), 1]);
  const foundMat = new THREE.MeshStandardMaterial({
    map: foundTex.map, bumpMap: foundTex.bumpMap, bumpScale: 0.03,
    color: 0xffffff, roughness: 0.9
  });

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

  // Roof ridge cap
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, depth + 0.7), ridgeMat);
  ridge.position.set(0, wallH + roofH, -depth / 2 - 0.3);
  ridge.castShadow = true;
  house.add(ridge);

  // Gutters along the eaves
  for (const gx of [-width / 2 - 0.42, width / 2 + 0.42]) {
    const gutter = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, depth + 0.6), gutterMat);
    gutter.position.set(gx, wallH - 0.02, -depth / 2 - 0.3);
    house.add(gutter);
  }

  // Door (front face)
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.1), doorMat);
  door.position.set(0.5, 0.9, -depth / 2 - 0.05);
  house.add(door);

  // Door frame
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 0.06), trimMat);
  frame.position.set(0.5, 1.0, -depth / 2 - 0.06);
  house.add(frame);

  // Door panel detailing + knob
  for (const py of [0.55, 1.35]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.02), doorPanelMat);
    panel.position.set(0.5, py, -depth / 2 - 0.1);
    house.add(panel);
  }
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), knobMat);
  knob.position.set(0.82, 0.95, -depth / 2 - 0.09);
  house.add(knob);

  // Windows (front face)
  for (const wx of [-1.5, 2.2]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.08), windowMat);
    win.position.set(wx, wallH * 0.55, -depth / 2 - 0.04);
    house.add(win);
    // Window frame
    const wframe = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.04), trimMat);
    wframe.position.set(wx, wallH * 0.55, -depth / 2 - 0.06);
    house.add(wframe);
    // Mullions (cross bars)
    const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.7, 0.03), trimMat);
    vBar.position.set(wx, wallH * 0.55, -depth / 2 - 0.02);
    house.add(vBar);
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.03), trimMat);
    hBar.position.set(wx, wallH * 0.55, -depth / 2 - 0.02);
    house.add(hBar);
  }

  // Side window
  const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.8), windowMat);
  sideWin.position.set(width / 2 + 0.04, wallH * 0.55, 0);
  house.add(sideWin);
  const sideVBar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.7, 0.05), trimMat);
  sideVBar.position.set(width / 2 + 0.06, wallH * 0.55, 0);
  house.add(sideVBar);
  const sideHBar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.8), trimMat);
  sideHBar.position.set(width / 2 + 0.06, wallH * 0.55, 0);
  house.add(sideHBar);

  // Chimney (some houses)
  if (options.chimney) {
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.5, 0.6), darkMat);
    chimney.position.set(width / 4, wallH + roofH * 0.6, depth / 4);
    chimney.castShadow = true;
    house.add(chimney);
    // Chimney cap
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.1, 0.74), darkMat);
    cap.position.set(width / 4, wallH + roofH * 0.6 + 0.8, depth / 4);
    house.add(cap);
  }

  // Foundation strip
  const foundGeo = new THREE.BoxGeometry(width + 0.2, 0.25, depth + 0.2);
  const found = new THREE.Mesh(foundGeo, foundMat);
  found.position.y = 0.12;
  found.receiveShadow = true;
  house.add(found);

  // Porch platform + step leading to the front door
  const porch = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.5), foundMat);
  porch.position.set(0.5, 0.1, -depth / 2 - 0.35);
  porch.castShadow = true;
  porch.receiveShadow = true;
  house.add(porch);
  const step = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.4), foundMat);
  step.position.set(0.5, 0.03, -depth / 2 - 0.75);
  step.receiveShadow = true;
  house.add(step);

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

function buildBackyard(scene, obstacles) {
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

  if (obstacles) {
    const t = 0.5;
    const h = fenceSize / 2;
    obstacles.push({ type: 'box', minX: -h, maxX: h, minZ: -h - t, maxZ: -h + t });
    obstacles.push({ type: 'box', minX: -h, maxX: h, minZ: h - t, maxZ: h + t });
    obstacles.push({ type: 'box', minX: -h - t, maxX: -h + t, minZ: -h, maxZ: h });
    obstacles.push({ type: 'box', minX: h - t, maxX: h + t, minZ: -h, maxZ: h });
  }

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
    }, obstacles));
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

function buildPark(scene, obstacles) {
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

function buildForest(scene, obstacles) {
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

function buildLakeside(scene, obstacles) {
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

function buildMountain(scene, obstacles) {
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

// ─── Dimension 2: Tropics ────────────────────

function buildBeach(scene, obstacles) {
  const group = new THREE.Group();

  // Sandy ground
  const sandGeo = new THREE.PlaneGeometry(70, 70, 32, 32);
  const sandPosAttr = sandGeo.attributes.position;
  for (let i = 0; i < sandPosAttr.count; i++) {
    sandPosAttr.setZ(i, Math.random() * 0.04);
  }
  sandGeo.computeVertexNormals();
  const sandMat = new THREE.MeshStandardMaterial({ color: 0xd4c088, roughness: 0.95 });
  const sand = new THREE.Mesh(sandGeo, sandMat);
  sand.rotation.x = -Math.PI / 2;
  sand.receiveShadow = true;
  group.add(sand);

  // Ocean water on one side
  const oceanGeo = new THREE.PlaneGeometry(80, 40);
  const oceanMat = new THREE.MeshStandardMaterial({
    color: 0x1177bb, roughness: 0.05, metalness: 0.3,
    transparent: true, opacity: 0.8
  });
  const ocean = new THREE.Mesh(oceanGeo, oceanMat);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.set(0, 0.04, -35);
  group.add(ocean);

  // Palm trees (tall thin trunks with sphere clusters)
  const palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.9 });
  const palmLeafMat = new THREE.MeshStandardMaterial({ color: 0x33aa33, roughness: 0.8 });
  for (const [px, pz] of [[-8, 5], [6, 3], [-3, 10], [12, 8], [-14, 7], [0, 15]]) {
    const palm = new THREE.Group();
    const h = 4 + Math.random() * 2;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, h, 6), palmTrunkMat);
    trunk.position.set(px, h / 2, pz);
    trunk.rotation.z = (Math.random() - 0.5) * 0.15;
    trunk.castShadow = true;
    palm.add(trunk);
    for (let c = 0; c < 5; c++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.6 + Math.random() * 0.3, 6, 5), palmLeafMat);
      leaf.position.set(
        px + (Math.random() - 0.5) * 1.2,
        h + 0.2 + Math.random() * 0.4,
        pz + (Math.random() - 0.5) * 1.2
      );
      leaf.castShadow = true;
      palm.add(leaf);
    }
    if (obstacles) obstacles.push({ type: 'circle', x: px, z: pz, r: 0.3 });
    group.add(palm);
  }

  // Driftwood
  const driftMat = new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 0.95 });
  for (let i = 0; i < 4; i++) {
    const dw = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2 + Math.random(), 5), driftMat);
    dw.rotation.z = Math.PI / 2;
    dw.position.set((Math.random() - 0.5) * 30, 0.06, -10 + Math.random() * 5);
    dw.rotation.y = Math.random() * Math.PI;
    group.add(dw);
  }

  // Seashells (small white spheres)
  const shellMat = new THREE.MeshStandardMaterial({ color: 0xfff5ee, roughness: 0.6 });
  for (let i = 0; i < 12; i++) {
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.05, 5, 4), shellMat);
    shell.position.set((Math.random() - 0.5) * 30, 0.03, -8 + Math.random() * 20);
    group.add(shell);
  }

  // Beach huts
  const hutMat = new THREE.MeshStandardMaterial({ color: 0xaa7744, roughness: 0.9 });
  const hutRoofMat = new THREE.MeshStandardMaterial({ color: 0x886633, roughness: 0.9 });
  for (const [hx, hz] of [[-18, 12], [18, 10]]) {
    const hut = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 3), hutMat);
    body.position.set(hx, 1.25, hz);
    body.castShadow = true;
    hut.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.8, 1.5, 4), hutRoofMat);
    roof.position.set(hx, 3.25, hz);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    hut.add(roof);
    if (obstacles) obstacles.push({ type: 'box', minX: hx - 1.5, maxX: hx + 1.5, minZ: hz - 1.5, maxZ: hz + 1.5 });
    group.add(hut);
  }

  // Rocks on beach
  for (let i = 0; i < 6; i++) {
    group.add(createRock((Math.random() - 0.5) * 30, 0.1, -5 + Math.random() * 20, 0.5 + Math.random() * 0.8));
  }

  scene.add(group);
  return group;
}

function buildJungle(scene, obstacles) {
  const group = new THREE.Group();

  // Dark tropical ground
  const grass = createGrassPlane(70, 0x1a3a1a);
  group.add(grass);

  // Dense canopy trees
  for (let i = 0; i < 35; i++) {
    const x = (Math.random() - 0.5) * 55;
    const z = (Math.random() - 0.5) * 55;
    if (Math.sqrt(x * x + z * z) < 5) continue;
    group.add(createTree(x, z, 1.2 + Math.random() * 1.2, 'oak', obstacles));
  }

  // Thick vines (thin cylinders hanging from trees)
  const vineMat = new THREE.MeshStandardMaterial({ color: 0x2a5a1a, roughness: 0.9 });
  for (let i = 0; i < 15; i++) {
    const vineH = 2 + Math.random() * 3;
    const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, vineH, 4), vineMat);
    vine.position.set(
      (Math.random() - 0.5) * 40,
      vineH / 2 + 1.5,
      (Math.random() - 0.5) * 40
    );
    vine.rotation.z = (Math.random() - 0.5) * 0.3;
    group.add(vine);
  }

  // Colorful flowers (small spheres)
  const flowerColors = [0xff3333, 0xffcc00, 0xff69b4, 0xff5500, 0xee2299];
  for (let i = 0; i < 20; i++) {
    const fMat = new THREE.MeshStandardMaterial({ color: flowerColors[i % flowerColors.length], roughness: 0.7 });
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.08 + Math.random() * 0.06, 6, 5), fMat);
    flower.position.set(
      (Math.random() - 0.5) * 35,
      0.1 + Math.random() * 0.15,
      (Math.random() - 0.5) * 35
    );
    group.add(flower);
  }

  // Fallen logs
  const logMat = new THREE.MeshStandardMaterial({ color: 0x3a2a15, roughness: 0.9 });
  for (let i = 0; i < 4; i++) {
    const logGeo = new THREE.CylinderGeometry(0.2, 0.25, 3 + Math.random() * 2, 6);
    logGeo.rotateZ(Math.PI / 2);
    const log = new THREE.Mesh(logGeo, logMat);
    log.position.set((Math.random() - 0.5) * 25, 0.2, (Math.random() - 0.5) * 25);
    log.rotation.y = Math.random() * Math.PI;
    log.castShadow = true;
    group.add(log);
  }

  // Leaf litter patches
  const litterMat = new THREE.MeshStandardMaterial({ color: 0x2a3518, roughness: 1.0 });
  for (let i = 0; i < 15; i++) {
    const litter = new THREE.Mesh(new THREE.PlaneGeometry(2 + Math.random() * 2, 2 + Math.random() * 2), litterMat);
    litter.rotation.x = -Math.PI / 2;
    litter.position.set((Math.random() - 0.5) * 45, 0.02, (Math.random() - 0.5) * 45);
    litter.rotation.z = Math.random() * Math.PI;
    group.add(litter);
  }

  scene.add(group);
  return group;
}

function buildSwamp(scene, obstacles) {
  const group = new THREE.Group();

  // Muddy brown terrain
  const grass = createGrassPlane(65, 0x4a3a22);
  group.add(grass);

  // Murky water patches
  const swampWaterMat = new THREE.MeshStandardMaterial({
    color: 0x224422, roughness: 0.2, metalness: 0.1,
    transparent: true, opacity: 0.6
  });
  for (let i = 0; i < 6; i++) {
    const r = 3 + Math.random() * 5;
    const pond = new THREE.Mesh(new THREE.CircleGeometry(r, 16), swampWaterMat);
    pond.rotation.x = -Math.PI / 2;
    pond.position.set((Math.random() - 0.5) * 35, 0.04, (Math.random() - 0.5) * 35);
    group.add(pond);
  }

  // Dead trees (gray trunks, no leaves)
  const deadTrunkMat = new THREE.MeshStandardMaterial({ color: 0x666660, roughness: 0.9 });
  for (let i = 0; i < 12; i++) {
    const h = 2 + Math.random() * 3;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, h, 6), deadTrunkMat);
    const tx = (Math.random() - 0.5) * 45;
    const tz = (Math.random() - 0.5) * 45;
    trunk.position.set(tx, h / 2, tz);
    trunk.rotation.z = (Math.random() - 0.5) * 0.2;
    trunk.castShadow = true;
    group.add(trunk);
    if (obstacles) obstacles.push({ type: 'circle', x: tx, z: tz, r: 0.2 });
    // Bare branches
    for (let b = 0; b < 2; b++) {
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.2, 4), deadTrunkMat);
      branch.position.set(tx + (Math.random() - 0.5) * 0.5, h * 0.7 + b * 0.5, tz + (Math.random() - 0.5) * 0.5);
      branch.rotation.z = (Math.random() - 0.5) * 1.2;
      group.add(branch);
    }
  }

  // Lily pads (green circles on water)
  const lilyMat = new THREE.MeshStandardMaterial({ color: 0x337733, roughness: 0.8 });
  for (let i = 0; i < 15; i++) {
    const lily = new THREE.Mesh(new THREE.CircleGeometry(0.15 + Math.random() * 0.15, 8), lilyMat);
    lily.rotation.x = -Math.PI / 2;
    lily.position.set((Math.random() - 0.5) * 30, 0.06, (Math.random() - 0.5) * 30);
    group.add(lily);
  }

  // Fog-like ground (semi-transparent white planes)
  const fogMat = new THREE.MeshStandardMaterial({
    color: 0xaabb99, roughness: 0.5, transparent: true, opacity: 0.15
  });
  for (let i = 0; i < 8; i++) {
    const fog = new THREE.Mesh(new THREE.PlaneGeometry(8 + Math.random() * 6, 8 + Math.random() * 6), fogMat);
    fog.rotation.x = -Math.PI / 2;
    fog.position.set((Math.random() - 0.5) * 40, 0.3, (Math.random() - 0.5) * 40);
    group.add(fog);
  }

  // Rocks
  for (let i = 0; i < 8; i++) {
    group.add(createRock((Math.random() - 0.5) * 35, 0.1, (Math.random() - 0.5) * 35, 0.5 + Math.random() * 0.8));
  }

  scene.add(group);
  return group;
}

function buildVolcano(scene, obstacles) {
  const group = new THREE.Group();

  // Dark volcanic rock ground
  const groundGeo = new THREE.PlaneGeometry(75, 75, 32, 32);
  const gPosAttr = groundGeo.attributes.position;
  for (let i = 0; i < gPosAttr.count; i++) {
    gPosAttr.setZ(i, Math.random() * 0.08);
  }
  groundGeo.computeVertexNormals();
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.95 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Volcano cone in background
  const volcanoMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 });
  const volcanoGeo = new THREE.ConeGeometry(20, 30, 8);
  const volcanoPosAttr = volcanoGeo.attributes.position;
  for (let i = 0; i < volcanoPosAttr.count; i++) {
    volcanoPosAttr.setX(i, volcanoPosAttr.getX(i) + (Math.random() - 0.5) * 2);
    volcanoPosAttr.setZ(i, volcanoPosAttr.getZ(i) + (Math.random() - 0.5) * 2);
  }
  volcanoGeo.computeVertexNormals();
  const volcano = new THREE.Mesh(volcanoGeo, volcanoMat);
  volcano.position.set(0, 10, -40);
  group.add(volcano);

  // Lava rivers (glowing orange/red emissive)
  const lavaMat = new THREE.MeshStandardMaterial({
    color: 0xff4400, roughness: 0.3, emissive: 0xff2200, emissiveIntensity: 0.8
  });
  for (let i = 0; i < 5; i++) {
    const lava = new THREE.Mesh(new THREE.PlaneGeometry(1.5 + Math.random(), 12 + Math.random() * 10), lavaMat);
    lava.rotation.x = -Math.PI / 2;
    lava.position.set((Math.random() - 0.5) * 30, 0.06, (Math.random() - 0.5) * 20);
    lava.rotation.z = Math.random() * Math.PI;
    group.add(lava);
  }

  // Smoke columns (gray semi-transparent spheres)
  const smokeMat = new THREE.MeshStandardMaterial({
    color: 0x777777, roughness: 0.5, transparent: true, opacity: 0.3
  });
  for (let i = 0; i < 3; i++) {
    const smoke = new THREE.Mesh(new THREE.SphereGeometry(1 + Math.random() * 1.5, 7, 6), smokeMat);
    smoke.position.set(
      (Math.random() - 0.5) * 30,
      2 + Math.random() * 4,
      (Math.random() - 0.5) * 30
    );
    group.add(smoke);
  }

  // Volcanic boulders
  for (let i = 0; i < 15; i++) {
    const rock = createRock((Math.random() - 0.5) * 40, 0.15, (Math.random() - 0.5) * 40, 0.8 + Math.random() * 1.5, obstacles);
    rock.material = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.95 });
    group.add(rock);
  }

  // Charred dead trees
  const charMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.95 });
  for (let i = 0; i < 6; i++) {
    const h = 1.5 + Math.random() * 2;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, h, 5), charMat);
    const tx = (Math.random() - 0.5) * 35;
    const tz = (Math.random() - 0.5) * 35;
    trunk.position.set(tx, h / 2, tz);
    trunk.castShadow = true;
    group.add(trunk);
  }

  scene.add(group);
  return group;
}

function buildIsland(scene, obstacles) {
  const group = new THREE.Group();

  // Surrounding ocean
  const oceanGeo = new THREE.PlaneGeometry(90, 90);
  const oceanMat = new THREE.MeshStandardMaterial({
    color: 0x1177cc, roughness: 0.05, metalness: 0.3,
    transparent: true, opacity: 0.8
  });
  const ocean = new THREE.Mesh(oceanGeo, oceanMat);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.y = 0.02;
  group.add(ocean);

  // White sand beach ring
  const sandMat = new THREE.MeshStandardMaterial({ color: 0xeeddbb, roughness: 0.95 });
  const sandRingGeo = new THREE.RingGeometry(14, 20, 24);
  sandRingGeo.rotateX(-Math.PI / 2);
  const sandRing = new THREE.Mesh(sandRingGeo, sandMat);
  sandRing.position.y = 0.04;
  group.add(sandRing);

  // Island ground (green)
  const islandGeo = new THREE.CircleGeometry(14, 24);
  const islandMat = new THREE.MeshStandardMaterial({ color: 0x3a8a2a, roughness: 0.9 });
  const island = new THREE.Mesh(islandGeo, islandMat);
  island.rotation.x = -Math.PI / 2;
  island.position.y = 0.06;
  group.add(island);

  // Central lagoon
  const lagoonGeo = new THREE.CircleGeometry(3, 16);
  const lagoonMat = new THREE.MeshStandardMaterial({
    color: 0x33aacc, roughness: 0.1, metalness: 0.2,
    transparent: true, opacity: 0.7
  });
  const lagoon = new THREE.Mesh(lagoonGeo, lagoonMat);
  lagoon.rotation.x = -Math.PI / 2;
  lagoon.position.y = 0.07;
  group.add(lagoon);

  // Palm trees
  const palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.9 });
  const palmLeafMat = new THREE.MeshStandardMaterial({ color: 0x33aa33, roughness: 0.8 });
  for (const [px, pz] of [[-5, -6], [7, -4], [-3, 8], [6, 7], [-8, 2], [0, -10]]) {
    const h = 4 + Math.random() * 2;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, h, 6), palmTrunkMat);
    trunk.position.set(px, h / 2, pz);
    trunk.castShadow = true;
    group.add(trunk);
    for (let c = 0; c < 5; c++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.55 + Math.random() * 0.3, 6, 5), palmLeafMat);
      leaf.position.set(px + (Math.random() - 0.5) * 1.0, h + 0.3, pz + (Math.random() - 0.5) * 1.0);
      leaf.castShadow = true;
      group.add(leaf);
    }
    if (obstacles) obstacles.push({ type: 'circle', x: px, z: pz, r: 0.25 });
  }

  // Tropical flowers
  const fColors = [0xff4466, 0xffaa22, 0xff66aa, 0xffdd00];
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 4 + Math.random() * 8;
    const fMat = new THREE.MeshStandardMaterial({ color: fColors[i % fColors.length], roughness: 0.7 });
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), fMat);
    flower.position.set(Math.cos(angle) * r, 0.12, Math.sin(angle) * r);
    group.add(flower);
  }

  // Wooden bridges
  const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x7a5a2a, roughness: 0.85 });
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 6), bridgeMat);
  bridge.position.set(0, 0.12, -3);
  bridge.castShadow = true;
  group.add(bridge);

  // Rocks
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 12 + Math.random() * 4;
    group.add(createRock(Math.cos(angle) * r, 0.08, Math.sin(angle) * r, 0.5 + Math.random() * 0.6));
  }

  scene.add(group);
  return group;
}

// ─── Dimension 3: Arctic ─────────────────────

function buildTundra(scene, obstacles) {
  const group = new THREE.Group();

  // Flat white/light blue ground
  const groundGeo = new THREE.PlaneGeometry(75, 75, 32, 32);
  const tPosAttr = groundGeo.attributes.position;
  for (let i = 0; i < tPosAttr.count; i++) {
    tPosAttr.setZ(i, Math.random() * 0.05);
  }
  groundGeo.computeVertexNormals();
  const groundMat = new THREE.MeshStandardMaterial({ color: 0xddddee, roughness: 0.85 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Snow-covered rocks
  const snowRockMat = new THREE.MeshStandardMaterial({ color: 0xccccdd, roughness: 0.85 });
  for (let i = 0; i < 12; i++) {
    const rock = createRock((Math.random() - 0.5) * 45, 0.1, (Math.random() - 0.5) * 45, 0.6 + Math.random() * 1.2, obstacles);
    rock.material = snowRockMat;
    group.add(rock);
  }

  // Sparse dead brush (small brown sticks)
  const brushMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.9 });
  for (let i = 0; i < 15; i++) {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.02, 0.4 + Math.random() * 0.3, 4), brushMat);
    stick.position.set((Math.random() - 0.5) * 40, 0.2, (Math.random() - 0.5) * 40);
    stick.rotation.z = (Math.random() - 0.5) * 0.6;
    group.add(stick);
  }

  // Frozen puddles
  const icePuddleMat = new THREE.MeshStandardMaterial({
    color: 0xbbccee, roughness: 0.05, metalness: 0.2,
    transparent: true, opacity: 0.6
  });
  for (let i = 0; i < 5; i++) {
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(1 + Math.random() * 2, 12), icePuddleMat);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set((Math.random() - 0.5) * 35, 0.03, (Math.random() - 0.5) * 35);
    group.add(puddle);
  }

  // Wind-swept snow drifts (elongated white bumps)
  const driftMat = new THREE.MeshStandardMaterial({ color: 0xeeeef5, roughness: 0.8 });
  for (let i = 0; i < 8; i++) {
    const drift = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 5), driftMat);
    drift.scale.set(3 + Math.random() * 2, 0.3, 1);
    drift.position.set((Math.random() - 0.5) * 45, 0.15, (Math.random() - 0.5) * 45);
    drift.rotation.y = Math.random() * 0.5;
    drift.receiveShadow = true;
    group.add(drift);
  }

  scene.add(group);
  return group;
}

function buildGlacier(scene, obstacles) {
  const group = new THREE.Group();

  // Blue-white ice ground
  const groundGeo = new THREE.PlaneGeometry(70, 70, 32, 32);
  const glPosAttr = groundGeo.attributes.position;
  for (let i = 0; i < glPosAttr.count; i++) {
    glPosAttr.setZ(i, Math.random() * 0.06);
  }
  groundGeo.computeVertexNormals();
  const groundMat = new THREE.MeshStandardMaterial({ color: 0xaaccee, roughness: 0.3, metalness: 0.1 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Massive ice walls/cliffs (translucent blue boxes)
  const iceWallMat = new THREE.MeshStandardMaterial({
    color: 0x88bbdd, roughness: 0.15, metalness: 0.1,
    transparent: true, opacity: 0.7
  });
  for (const [wx, wz, ww, wh] of [[-25, -10, 5, 12], [25, 5, 4, 10], [-15, 20, 6, 14], [20, -20, 5, 11]]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(ww, wh, 3 + Math.random() * 2), iceWallMat);
    wall.position.set(wx, wh / 2, wz);
    wall.castShadow = true;
    group.add(wall);
    if (obstacles) obstacles.push({ type: 'box', minX: wx - ww / 2, maxX: wx + ww / 2, minZ: wz - 2, maxZ: wz + 2 });
  }

  // Crevasses (dark gaps)
  const crevMat = new THREE.MeshStandardMaterial({ color: 0x112233, roughness: 0.9 });
  for (let i = 0; i < 3; i++) {
    const crev = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 8 + Math.random() * 5), crevMat);
    crev.position.set((Math.random() - 0.5) * 30, -0.1, (Math.random() - 0.5) * 30);
    crev.rotation.y = Math.random() * Math.PI;
    group.add(crev);
  }

  // Icicles (inverted cones)
  const icicleMat = new THREE.MeshStandardMaterial({
    color: 0xccddff, roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.75
  });
  for (let i = 0; i < 15; i++) {
    const h = 0.5 + Math.random() * 1.5;
    const icicle = new THREE.Mesh(new THREE.ConeGeometry(0.08 + Math.random() * 0.06, h, 5), icicleMat);
    icicle.rotation.x = Math.PI; // inverted
    icicle.position.set(
      (Math.random() - 0.5) * 40,
      6 + Math.random() * 5,
      (Math.random() - 0.5) * 40
    );
    group.add(icicle);
  }

  // Frozen waterfalls (blue/white columns)
  const frozenFallMat = new THREE.MeshStandardMaterial({
    color: 0xaaddff, roughness: 0.1, transparent: true, opacity: 0.6
  });
  for (const [fx, fz] of [[-22, 0], [22, -8]]) {
    const fall = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 10, 8), frozenFallMat);
    fall.position.set(fx, 5, fz);
    group.add(fall);
  }

  scene.add(group);
  return group;
}

function buildIceCave(scene, obstacles) {
  const group = new THREE.Group();

  // Ice floor
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x99bbdd, roughness: 0.2, metalness: 0.1 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Ice walls on sides (translucent blue) to create enclosed feeling
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x6699cc, roughness: 0.15, metalness: 0.1,
    transparent: true, opacity: 0.55
  });
  for (const [wx, wz, rw, rh, rd] of [
    [-22, 0, 2, 10, 50], [22, 0, 2, 10, 50],
    [0, -22, 50, 10, 2], [0, 22, 50, 10, 2]
  ]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(rw, rh, rd), wallMat);
    wall.position.set(wx, 5, wz);
    group.add(wall);
    if (obstacles) {
      obstacles.push({ type: 'box', minX: wx - rw / 2, maxX: wx + rw / 2, minZ: wz - rd / 2, maxZ: wz + rd / 2 });
    }
  }

  // Ice ceiling
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), wallMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 10;
  group.add(ceiling);

  // Crystal formations (octahedron with emissive blue)
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x4488ff, roughness: 0.1, metalness: 0.3,
    emissive: 0x2244aa, emissiveIntensity: 0.6,
    transparent: true, opacity: 0.7
  });
  for (let i = 0; i < 8; i++) {
    const s = 0.3 + Math.random() * 0.5;
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(s), crystalMat);
    crystal.position.set(
      (Math.random() - 0.5) * 30,
      s + Math.random() * 0.3,
      (Math.random() - 0.5) * 30
    );
    crystal.rotation.y = Math.random() * Math.PI;
    crystal.castShadow = true;
    group.add(crystal);
  }

  // Stalactites (inverted cones from ceiling)
  const stalMat = new THREE.MeshStandardMaterial({
    color: 0xaaccee, roughness: 0.15, transparent: true, opacity: 0.65
  });
  for (let i = 0; i < 12; i++) {
    const h = 1 + Math.random() * 2;
    const stal = new THREE.Mesh(new THREE.ConeGeometry(0.15 + Math.random() * 0.1, h, 5), stalMat);
    stal.rotation.x = Math.PI;
    stal.position.set((Math.random() - 0.5) * 35, 10 - h / 2, (Math.random() - 0.5) * 35);
    group.add(stal);
  }

  // Stalagmites (cones from floor)
  for (let i = 0; i < 10; i++) {
    const h = 0.8 + Math.random() * 1.5;
    const stag = new THREE.Mesh(new THREE.ConeGeometry(0.15 + Math.random() * 0.12, h, 5), stalMat);
    const sx = (Math.random() - 0.5) * 30;
    const sz = (Math.random() - 0.5) * 30;
    stag.position.set(sx, h / 2, sz);
    stag.castShadow = true;
    group.add(stag);
    if (obstacles) obstacles.push({ type: 'circle', x: sx, z: sz, r: 0.3 });
  }

  scene.add(group);
  return group;
}

function buildFrozenLake(scene, obstacles) {
  const group = new THREE.Group();

  // Snow-covered shore ground
  const grass = createGrassPlane(75, 0xccccdd);
  group.add(grass);

  // Frozen lake surface
  const lakeGeo = new THREE.CircleGeometry(22, 32);
  const lakeMat = new THREE.MeshStandardMaterial({
    color: 0xddeeff, roughness: 0.05, metalness: 0.2,
    transparent: true, opacity: 0.5
  });
  const lake = new THREE.Mesh(lakeGeo, lakeMat);
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(5, 0.04, 0);
  group.add(lake);

  // Northern lights (colored emissive planes in sky)
  const auroraColors = [0x22ff88, 0x44aaff, 0x8855ff, 0x22ffbb];
  for (let i = 0; i < 4; i++) {
    const auroraMat = new THREE.MeshStandardMaterial({
      color: auroraColors[i], emissive: auroraColors[i], emissiveIntensity: 0.5,
      transparent: true, opacity: 0.2, side: THREE.DoubleSide
    });
    const aurora = new THREE.Mesh(new THREE.PlaneGeometry(15 + Math.random() * 10, 3 + Math.random() * 2), auroraMat);
    aurora.position.set((Math.random() - 0.5) * 30, 25 + Math.random() * 10, -20 + Math.random() * 10);
    aurora.rotation.x = -0.3;
    aurora.rotation.z = (Math.random() - 0.5) * 0.3;
    group.add(aurora);
  }

  // Snow-covered pine trees
  const snowPineMat = new THREE.MeshStandardMaterial({ color: 0xeeeeff, roughness: 0.7 });
  for (let i = 0; i < 10; i++) {
    const x = (Math.random() - 0.5) * 50;
    const z = (Math.random() - 0.5) * 50;
    if (Math.sqrt((x - 5) * (x - 5) + z * z) < 24) continue;
    const tree = createTree(x, z, 1.0 + Math.random() * 0.5, 'pine', obstacles);
    group.add(tree);
    // Snow cap on tree
    const snowCap = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.3, 6), snowPineMat);
    snowCap.position.set(x, 3 + Math.random(), z);
    group.add(snowCap);
  }

  // Snow drifts around shore
  const driftMat = new THREE.MeshStandardMaterial({ color: 0xeeeef5, roughness: 0.8 });
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 23 + Math.random() * 5;
    const drift = new THREE.Mesh(new THREE.SphereGeometry(1.5, 7, 5), driftMat);
    drift.scale.set(2, 0.3, 1);
    drift.position.set(5 + Math.cos(angle) * r, 0.15, Math.sin(angle) * r);
    group.add(drift);
  }

  // Rocks
  for (let i = 0; i < 6; i++) {
    const rock = createRock((Math.random() - 0.5) * 40, 0.1, (Math.random() - 0.5) * 40, 0.5 + Math.random() * 0.8);
    rock.material = new THREE.MeshStandardMaterial({ color: 0xaaaabb, roughness: 0.9 });
    group.add(rock);
  }

  scene.add(group);
  return group;
}

function buildArcticPeak(scene, obstacles) {
  const group = new THREE.Group();

  // Snow-covered rocky terrain
  const groundGeo = new THREE.PlaneGeometry(80, 80, 40, 40);
  const apPosAttr = groundGeo.attributes.position;
  for (let i = 0; i < apPosAttr.count; i++) {
    const x = apPosAttr.getX(i);
    const y = apPosAttr.getY(i);
    const h = Math.sin(x * 0.15) * Math.cos(y * 0.15) * 1.5 + Math.random() * 0.15;
    apPosAttr.setZ(i, Math.max(0, h));
  }
  groundGeo.computeVertexNormals();
  const groundMat = new THREE.MeshStandardMaterial({ color: 0xccccdd, roughness: 0.85 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Peak mountain backdrop
  const peakMat = new THREE.MeshStandardMaterial({ color: 0x8888aa, roughness: 0.9 });
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xeeeeff, roughness: 0.7 });
  for (const [mx, mz, ms] of [[-20, -35, 22], [15, -40, 28], [40, -30, 18]]) {
    const mGeo = new THREE.ConeGeometry(ms, ms * 1.6, 8);
    const mPosAttr = mGeo.attributes.position;
    for (let i = 0; i < mPosAttr.count; i++) {
      mPosAttr.setX(i, mPosAttr.getX(i) + (Math.random() - 0.5) * ms * 0.08);
      mPosAttr.setZ(i, mPosAttr.getZ(i) + (Math.random() - 0.5) * ms * 0.08);
    }
    mGeo.computeVertexNormals();
    const mtn = new THREE.Mesh(mGeo, peakMat);
    mtn.position.set(mx, ms * 0.5, mz);
    group.add(mtn);
    const snowCap = new THREE.Mesh(new THREE.ConeGeometry(ms * 0.35, ms * 0.5, 8), snowMat);
    snowCap.position.set(mx, ms * 1.1, mz);
    group.add(snowCap);
  }

  // Ice crystals
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x88bbff, roughness: 0.1, metalness: 0.2,
    emissive: 0x3366aa, emissiveIntensity: 0.3,
    transparent: true, opacity: 0.65
  });
  for (let i = 0; i < 8; i++) {
    const s = 0.2 + Math.random() * 0.4;
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(s), crystalMat);
    crystal.position.set((Math.random() - 0.5) * 30, s, (Math.random() - 0.5) * 30);
    crystal.rotation.set(Math.random(), Math.random(), Math.random());
    group.add(crystal);
  }

  // Wind-carved rock formations
  for (let i = 0; i < 10; i++) {
    const rock = createRock((Math.random() - 0.5) * 40, 0.2, (Math.random() - 0.5) * 40, 1.0 + Math.random() * 1.5, obstacles);
    rock.material = new THREE.MeshStandardMaterial({ color: 0x8888aa, roughness: 0.9 });
    rock.scale.y = 1.5 + Math.random(); // Tall, wind-carved shapes
    group.add(rock);
  }

  // Eagle nest structures (stick bundles on high rocks)
  const nestMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.95 });
  for (const [nx, nz] of [[-10, -8], [12, -5]]) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.5, 0.3, 8), nestMat);
    base.position.set(nx, 2.5, nz);
    group.add(base);
    for (let s = 0; s < 6; s++) {
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.8, 3), nestMat);
      stick.position.set(nx + (Math.random() - 0.5) * 0.6, 2.6, nz + (Math.random() - 0.5) * 0.6);
      stick.rotation.set(Math.random() * 0.5, Math.random(), Math.PI / 2);
      group.add(stick);
    }
  }

  scene.add(group);
  return group;
}

// ─── Dimension 4: Desert ─────────────────────

function buildOasis(scene, obstacles) {
  const group = new THREE.Group();

  // Sand ground
  const sandGeo = new THREE.PlaneGeometry(70, 70, 32, 32);
  const sPosAttr = sandGeo.attributes.position;
  for (let i = 0; i < sPosAttr.count; i++) {
    const x = sPosAttr.getX(i);
    const y = sPosAttr.getY(i);
    sPosAttr.setZ(i, Math.sin(x * 0.1) * Math.cos(y * 0.12) * 0.4 + Math.random() * 0.05);
  }
  sandGeo.computeVertexNormals();
  const sandMat = new THREE.MeshStandardMaterial({ color: 0xd4a853, roughness: 0.95 });
  const sand = new THREE.Mesh(sandGeo, sandMat);
  sand.rotation.x = -Math.PI / 2;
  sand.receiveShadow = true;
  group.add(sand);

  // Water pool
  const poolGeo = new THREE.CircleGeometry(5, 20);
  const poolMat = new THREE.MeshStandardMaterial({
    color: 0x2288aa, roughness: 0.05, metalness: 0.3,
    transparent: true, opacity: 0.7
  });
  const pool = new THREE.Mesh(poolGeo, poolMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, 0.05, 0);
  group.add(pool);

  // Lush green grass patches near water
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x4a8a35, roughness: 0.9 });
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 5 + Math.random() * 3;
    const patch = new THREE.Mesh(new THREE.CircleGeometry(1.5 + Math.random(), 8), grassMat);
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(Math.cos(angle) * r, 0.03, Math.sin(angle) * r);
    group.add(patch);
  }

  // Palm trees around water
  const palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.9 });
  const palmLeafMat = new THREE.MeshStandardMaterial({ color: 0x33aa33, roughness: 0.8 });
  for (const [px, pz] of [[-4, -5], [5, -3], [-2, 6], [6, 5], [-6, 1], [3, -7]]) {
    const h = 4 + Math.random() * 2;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, h, 6), palmTrunkMat);
    trunk.position.set(px, h / 2, pz);
    trunk.castShadow = true;
    group.add(trunk);
    for (let c = 0; c < 4; c++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.55, 6, 5), palmLeafMat);
      leaf.position.set(px + (Math.random() - 0.5) * 1.0, h + 0.3, pz + (Math.random() - 0.5) * 1.0);
      leaf.castShadow = true;
      group.add(leaf);
    }
    if (obstacles) obstacles.push({ type: 'circle', x: px, z: pz, r: 0.25 });
  }

  // Desert rocks
  for (let i = 0; i < 10; i++) {
    const rock = createRock((Math.random() - 0.5) * 40, 0.1, (Math.random() - 0.5) * 40, 0.5 + Math.random() * 1.0);
    rock.material = new THREE.MeshStandardMaterial({ color: 0x998866, roughness: 0.95 });
    group.add(rock);
  }

  // Sand dunes in distance
  const duneMat = new THREE.MeshStandardMaterial({ color: 0xccaa55, roughness: 0.9 });
  for (let i = 0; i < 5; i++) {
    const dune = new THREE.Mesh(new THREE.SphereGeometry(4 + Math.random() * 3, 8, 6), duneMat);
    dune.scale.set(2, 0.3, 1);
    dune.position.set((Math.random() - 0.5) * 50, 0.5, -25 + Math.random() * 5);
    group.add(dune);
  }

  scene.add(group);
  return group;
}

function buildCanyon(scene, obstacles) {
  const group = new THREE.Group();

  // Red/brown rock ground
  const groundGeo = new THREE.PlaneGeometry(65, 65, 24, 24);
  const cPosAttr = groundGeo.attributes.position;
  for (let i = 0; i < cPosAttr.count; i++) {
    cPosAttr.setZ(i, Math.random() * 0.08);
  }
  groundGeo.computeVertexNormals();
  const groundMat = new THREE.MeshStandardMaterial({ color: 0xaa6633, roughness: 0.95 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Red/orange rock walls on sides (tall boxes)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x994422, roughness: 0.9 });
  for (const [wx, wz, ww, wd, wh] of [
    [-25, 0, 4, 60, 18], [25, 0, 4, 60, 16],
    [-15, -25, 8, 4, 12], [18, -20, 6, 4, 14]
  ]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(ww, wh, wd), wallMat);
    wall.position.set(wx, wh / 2, wz);
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);
    if (obstacles) obstacles.push({ type: 'box', minX: wx - ww / 2, maxX: wx + ww / 2, minZ: wz - wd / 2, maxZ: wz + wd / 2 });
  }

  // Layered rock formations
  const layerMat1 = new THREE.MeshStandardMaterial({ color: 0xbb6633, roughness: 0.9 });
  const layerMat2 = new THREE.MeshStandardMaterial({ color: 0xcc8844, roughness: 0.9 });
  for (let i = 0; i < 4; i++) {
    const w = 3 + Math.random() * 3;
    const h = 2 + Math.random() * 4;
    const layer = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2 + Math.random() * 2), i % 2 === 0 ? layerMat1 : layerMat2);
    layer.position.set((Math.random() - 0.5) * 30, h / 2, (Math.random() - 0.5) * 20);
    layer.castShadow = true;
    group.add(layer);
  }

  // Cacti (green cylinders with arms)
  const cactusMat = new THREE.MeshStandardMaterial({ color: 0x337733, roughness: 0.8 });
  for (let i = 0; i < 6; i++) {
    const cactus = new THREE.Group();
    const cx = (Math.random() - 0.5) * 35;
    const cz = (Math.random() - 0.5) * 35;
    const ch = 1.5 + Math.random() * 1.5;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, ch, 6), cactusMat);
    body.position.set(cx, ch / 2, cz);
    body.castShadow = true;
    cactus.add(body);
    // Arms
    for (let a = 0; a < 2; a++) {
      const armH = 0.5 + Math.random() * 0.5;
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, armH, 5), cactusMat);
      arm.position.set(cx + (a === 0 ? 0.25 : -0.25), ch * 0.5 + a * 0.3, cz);
      arm.rotation.z = a === 0 ? -0.8 : 0.8;
      cactus.add(arm);
    }
    if (obstacles) obstacles.push({ type: 'circle', x: cx, z: cz, r: 0.3 });
    group.add(cactus);
  }

  // Tumbleweeds (brown wireframe spheres)
  const tumbleMat = new THREE.MeshStandardMaterial({ color: 0x8a7a55, roughness: 0.9, wireframe: true });
  for (let i = 0; i < 4; i++) {
    const tw = new THREE.Mesh(new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 6, 5), tumbleMat);
    tw.position.set((Math.random() - 0.5) * 30, 0.3, (Math.random() - 0.5) * 30);
    group.add(tw);
  }

  scene.add(group);
  return group;
}

function buildDunes(scene, obstacles) {
  const group = new THREE.Group();

  // Endless rolling sand dunes (wavy terrain)
  const duneGeo = new THREE.PlaneGeometry(80, 80, 40, 40);
  const dPosAttr = duneGeo.attributes.position;
  for (let i = 0; i < dPosAttr.count; i++) {
    const x = dPosAttr.getX(i);
    const y = dPosAttr.getY(i);
    const h = Math.sin(x * 0.15) * Math.cos(y * 0.12) * 1.8
            + Math.sin(x * 0.08 + y * 0.06) * 0.8
            + Math.random() * 0.05;
    dPosAttr.setZ(i, Math.max(0, h));
  }
  duneGeo.computeVertexNormals();
  const duneMat = new THREE.MeshStandardMaterial({ color: 0xd4a853, roughness: 0.95 });
  const dunes = new THREE.Mesh(duneGeo, duneMat);
  dunes.rotation.x = -Math.PI / 2;
  dunes.receiveShadow = true;
  group.add(dunes);

  // Sparse cacti
  const cactusMat = new THREE.MeshStandardMaterial({ color: 0x447744, roughness: 0.8 });
  for (let i = 0; i < 5; i++) {
    const cx = (Math.random() - 0.5) * 50;
    const cz = (Math.random() - 0.5) * 50;
    const ch = 1 + Math.random() * 1.5;
    const cactus = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, ch, 6), cactusMat);
    cactus.position.set(cx, ch / 2, cz);
    cactus.castShadow = true;
    group.add(cactus);
    if (obstacles) obstacles.push({ type: 'circle', x: cx, z: cz, r: 0.25 });
  }

  // Bleached bones (white cylinders)
  const boneMat = new THREE.MeshStandardMaterial({ color: 0xeeeedd, roughness: 0.7 });
  for (let i = 0; i < 6; i++) {
    const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.5 + Math.random() * 0.4, 4), boneMat);
    bone.position.set((Math.random() - 0.5) * 30, 0.05, (Math.random() - 0.5) * 30);
    bone.rotation.z = Math.PI / 2;
    bone.rotation.y = Math.random() * Math.PI;
    group.add(bone);
  }

  // Heat shimmer effect (subtle transparent planes)
  const shimmerMat = new THREE.MeshStandardMaterial({
    color: 0xffeecc, roughness: 0.1, transparent: true, opacity: 0.06, side: THREE.DoubleSide
  });
  for (let i = 0; i < 4; i++) {
    const shimmer = new THREE.Mesh(new THREE.PlaneGeometry(20, 5), shimmerMat);
    shimmer.position.set((Math.random() - 0.5) * 40, 2 + Math.random() * 2, (Math.random() - 0.5) * 30);
    group.add(shimmer);
  }

  // Vulture perches (tall dead sticks)
  const perchMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.9 });
  for (let i = 0; i < 3; i++) {
    const px = (Math.random() - 0.5) * 40;
    const pz = (Math.random() - 0.5) * 40;
    const ph = 3 + Math.random() * 2;
    const perch = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, ph, 5), perchMat);
    perch.position.set(px, ph / 2, pz);
    perch.castShadow = true;
    group.add(perch);
    // Cross bar
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 4), perchMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(px, ph - 0.2, pz);
    group.add(bar);
  }

  // Desert rocks
  for (let i = 0; i < 6; i++) {
    const rock = createRock((Math.random() - 0.5) * 40, 0.15, (Math.random() - 0.5) * 40, 0.6 + Math.random() * 1.0);
    rock.material = new THREE.MeshStandardMaterial({ color: 0xaa8855, roughness: 0.95 });
    group.add(rock);
  }

  scene.add(group);
  return group;
}

function buildMesa(scene, obstacles) {
  const group = new THREE.Group();

  // Red rock ground
  const groundGeo = new THREE.PlaneGeometry(75, 75, 24, 24);
  const mPosAttr = groundGeo.attributes.position;
  for (let i = 0; i < mPosAttr.count; i++) {
    mPosAttr.setZ(i, Math.random() * 0.06);
  }
  groundGeo.computeVertexNormals();
  const groundMat = new THREE.MeshStandardMaterial({ color: 0xbb6644, roughness: 0.95 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Flat-topped mountains (mesa formations)
  const mesaMat = new THREE.MeshStandardMaterial({ color: 0x994433, roughness: 0.9 });
  const mesaTopMat = new THREE.MeshStandardMaterial({ color: 0xaa5544, roughness: 0.85 });
  for (const [mx, mz, mw, mh] of [[-22, -18, 12, 15], [20, -22, 10, 12], [-8, 25, 14, 10], [28, 18, 8, 13]]) {
    // Mesa body (slight taper)
    const mesa = new THREE.Mesh(new THREE.BoxGeometry(mw, mh, mw * 0.8), mesaMat);
    mesa.position.set(mx, mh / 2, mz);
    mesa.castShadow = true;
    group.add(mesa);
    // Flat top cap
    const top = new THREE.Mesh(new THREE.BoxGeometry(mw + 1, 0.5, mw * 0.8 + 1), mesaTopMat);
    top.position.set(mx, mh, mz);
    group.add(top);
    if (obstacles) obstacles.push({ type: 'box', minX: mx - mw / 2, maxX: mx + mw / 2, minZ: mz - mw * 0.4, maxZ: mz + mw * 0.4 });
  }

  // Desert scrub (small green tufts)
  const scrubMat = new THREE.MeshStandardMaterial({ color: 0x556633, roughness: 0.9 });
  for (let i = 0; i < 15; i++) {
    const scrub = new THREE.Mesh(new THREE.SphereGeometry(0.2 + Math.random() * 0.15, 5, 4), scrubMat);
    scrub.scale.y = 0.5;
    scrub.position.set((Math.random() - 0.5) * 40, 0.1, (Math.random() - 0.5) * 40);
    group.add(scrub);
  }

  // Abandoned mine entrance (dark box opening)
  const mineMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.95 });
  const mineFrameMat = new THREE.MeshStandardMaterial({ color: 0x5a4a2a, roughness: 0.9 });
  const mineEntrance = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.5, 1.5), mineMat);
  mineEntrance.position.set(8, 1.25, 10);
  group.add(mineEntrance);
  // Mine frame
  const mineFrame = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 0.2), mineFrameMat);
  mineFrame.position.set(8, 1.5, 9.2);
  group.add(mineFrame);
  if (obstacles) obstacles.push({ type: 'box', minX: 6.5, maxX: 9.5, minZ: 9, maxZ: 11 });

  // Desert rocks
  for (let i = 0; i < 10; i++) {
    const rock = createRock((Math.random() - 0.5) * 40, 0.12, (Math.random() - 0.5) * 40, 0.6 + Math.random() * 1.2);
    rock.material = new THREE.MeshStandardMaterial({ color: 0x996644, roughness: 0.95 });
    group.add(rock);
  }

  // Cacti
  const cactusMat = new THREE.MeshStandardMaterial({ color: 0x447744, roughness: 0.8 });
  for (let i = 0; i < 4; i++) {
    const cx = (Math.random() - 0.5) * 35;
    const cz = (Math.random() - 0.5) * 35;
    const ch = 1 + Math.random() * 1;
    const cactus = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, ch, 6), cactusMat);
    cactus.position.set(cx, ch / 2, cz);
    cactus.castShadow = true;
    group.add(cactus);
    if (obstacles) obstacles.push({ type: 'circle', x: cx, z: cz, r: 0.25 });
  }

  scene.add(group);
  return group;
}

function buildRuins(scene, obstacles) {
  const group = new THREE.Group();

  // Sand-covered floor
  const groundGeo = new THREE.PlaneGeometry(65, 65, 24, 24);
  const rPosAttr = groundGeo.attributes.position;
  for (let i = 0; i < rPosAttr.count; i++) {
    rPosAttr.setZ(i, Math.random() * 0.05);
  }
  groundGeo.computeVertexNormals();
  const groundMat = new THREE.MeshStandardMaterial({ color: 0xc4a868, roughness: 0.95 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Broken columns (cylinders of varying heights)
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xaaa088, roughness: 0.9 });
  for (let i = 0; i < 10; i++) {
    const ch = 1 + Math.random() * 4;
    const cr = 0.3 + Math.random() * 0.15;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(cr * 0.9, cr, ch, 8), stoneMat);
    const cx = (Math.random() - 0.5) * 30;
    const cz = (Math.random() - 0.5) * 30;
    col.position.set(cx, ch / 2, cz);
    col.castShadow = true;
    col.receiveShadow = true;
    group.add(col);
    if (obstacles) obstacles.push({ type: 'circle', x: cx, z: cz, r: cr });
  }

  // Crumbled walls (boxes with gaps)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x999077, roughness: 0.9 });
  for (const [wx, wz, ww, wh, wd, ry] of [
    [-8, -5, 8, 3, 0.8, 0], [5, -10, 6, 2.5, 0.8, 0.3],
    [10, 5, 0.8, 3.5, 7, 0], [-12, 8, 5, 2, 0.8, -0.2]
  ]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(ww, wh, wd), wallMat);
    wall.position.set(wx, wh / 2, wz);
    wall.rotation.y = ry;
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);
    if (obstacles) obstacles.push({ type: 'box', minX: wx - ww / 2, maxX: wx + ww / 2, minZ: wz - wd / 2, maxZ: wz + wd / 2 });
  }

  // Fallen column pieces on ground
  for (let i = 0; i < 5; i++) {
    const piece = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 1.5 + Math.random(), 7), stoneMat);
    piece.rotation.z = Math.PI / 2;
    piece.position.set((Math.random() - 0.5) * 25, 0.25, (Math.random() - 0.5) * 25);
    piece.rotation.y = Math.random() * Math.PI;
    group.add(piece);
  }

  // Mysterious glowing artifacts (emissive purple spheres)
  const artifactMat = new THREE.MeshStandardMaterial({
    color: 0x8844cc, roughness: 0.2, metalness: 0.3,
    emissive: 0x6622aa, emissiveIntensity: 0.8
  });
  for (let i = 0; i < 4; i++) {
    const artifact = new THREE.Mesh(new THREE.SphereGeometry(0.15 + Math.random() * 0.1, 8, 6), artifactMat);
    artifact.position.set((Math.random() - 0.5) * 20, 0.5 + Math.random() * 0.5, (Math.random() - 0.5) * 20);
    group.add(artifact);
  }

  // Buried treasure hints (half-buried boxes)
  const treasureMat = new THREE.MeshStandardMaterial({ color: 0xaa8833, roughness: 0.6, metalness: 0.3 });
  for (let i = 0; i < 3; i++) {
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.35), treasureMat);
    chest.position.set((Math.random() - 0.5) * 20, 0.05, (Math.random() - 0.5) * 20);
    chest.rotation.y = Math.random() * Math.PI;
    group.add(chest);
  }

  // Desert rocks scattered
  for (let i = 0; i < 8; i++) {
    const rock = createRock((Math.random() - 0.5) * 35, 0.1, (Math.random() - 0.5) * 35, 0.5 + Math.random() * 0.8);
    rock.material = new THREE.MeshStandardMaterial({ color: 0x998866, roughness: 0.95 });
    group.add(rock);
  }

  scene.add(group);
  return group;
}

// ─── Exports ─────────────────────────────────

const BUILDERS = {
  backyard: buildBackyard,
  park: buildPark,
  forest: buildForest,
  lakeside: buildLakeside,
  mountain: buildMountain,
  // Dim 2: Tropics
  beach: buildBeach,
  jungle: buildJungle,
  swamp: buildSwamp,
  volcano: buildVolcano,
  island: buildIsland,
  // Dim 3: Arctic
  tundra: buildTundra,
  glacier: buildGlacier,
  ice_cave: buildIceCave,
  frozen_lake: buildFrozenLake,
  arctic_peak: buildArcticPeak,
  // Dim 4: Desert
  oasis: buildOasis,
  canyon: buildCanyon,
  dunes: buildDunes,
  mesa: buildMesa,
  ruins: buildRuins
};

export class WorldSystem {
  constructor(scene) {
    this.scene = scene;
    this.currentWorld = null;
    this.currentKey = null;
    this.obstacles = [];
  }

  load(locationKey) {
    this.unload();
    const builder = BUILDERS[locationKey];
    if (!builder) {
      console.warn('Unknown location:', locationKey);
      return;
    }
    this.currentKey = locationKey;
    this.obstacles = [];
    this.currentWorld = builder(this.scene, this.obstacles);
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
      this.obstacles = [];
    }
  }
}
