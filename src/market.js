// ═══════════════════════════════════════════════
// Gary's Life — Market Plaza
// Beautiful old-timey walled market with a wide
// Victorian shop stall, cobblestone ground, central
// fountain, lanterns, and stone city walls.
// ═══════════════════════════════════════════════

import * as THREE from 'three';

// ─── Canvas Texture Helpers ───────────────────

function makeCobblestoneTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const stoneColors = ['#7a7268', '#6e6860', '#747062', '#6c6458', '#787068'];
  ctx.fillStyle = '#4a4440';
  ctx.fillRect(0, 0, 512, 512);
  const sw = 42, sh = 34;
  for (let row = 0; row * sh < 512 + sh; row++) {
    const offset = (row % 2) * (sw / 2);
    for (let col = -1; col * sw < 512 + sw; col++) {
      const x = col * sw + offset;
      const y = row * sh;
      const jx = (Math.random() - 0.5) * 5;
      const jy = (Math.random() - 0.5) * 4;
      ctx.fillStyle = stoneColors[Math.floor(Math.random() * stoneColors.length)];
      ctx.fillRect(x + 3 + jx, y + 3 + jy, sw - 7, sh - 7);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(x + 3 + jx, y + 3 + jy, sw - 7, 3);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 5); tex.needsUpdate = true;
  return tex;
}

function makePlankTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const plankH = 86;
  const colors = ['#5c3410', '#55300e', '#4e2c0c', '#5a320f'];
  for (let row = 0; row * plankH < 512; row++) {
    ctx.fillStyle = colors[row % colors.length];
    ctx.fillRect(0, row * plankH, 256, plankH - 3);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const gx = Math.random() * 256;
      ctx.beginPath();
      ctx.moveTo(gx, row * plankH);
      ctx.lineTo(gx + (Math.random() - 0.5) * 18, row * plankH + plankH);
      ctx.stroke();
    }
    ctx.fillStyle = '#251408';
    ctx.fillRect(0, row * plankH + plankH - 3, 256, 3);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function makeStoneTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#6a6258';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#3e3a36';
  ctx.lineWidth = 3;
  const bw = 64, bh = 42;
  for (let row = 0; row * bh < 256 + bh; row++) {
    const off = (row % 2) * (bw / 2);
    for (let col = -1; col * bw < 256 + bw; col++) {
      const x = col * bw + off, y = row * bh;
      ctx.strokeRect(x + 3, y + 3, bw - 6, bh - 6);
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(x + 4, y + 4, bw - 8, 4);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function makeOrnateSignTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 180;
  const ctx = canvas.getContext('2d');
  // Deep mahogany background
  const grad = ctx.createLinearGradient(0, 0, 0, 180);
  grad.addColorStop(0, '#3a1a06');
  grad.addColorStop(1, '#1e0d03');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 180);
  // Outer gold border
  ctx.strokeStyle = '#c8902a';
  ctx.lineWidth = 7;
  ctx.strokeRect(6, 6, 500, 168);
  // Inner line
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#e8b850';
  ctx.strokeRect(16, 16, 480, 148);
  // Corner diamonds
  ctx.fillStyle = '#e8b850';
  [[22,22],[490,22],[22,158],[490,158]].forEach(([cx,cy]) => {
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(Math.PI/4);
    ctx.fillRect(-7,-7,14,14); ctx.restore();
  });
  // Decorative side scrolls
  ctx.fillStyle = '#c8902a';
  ctx.font = '28px serif';
  ctx.fillText('✦', 30, 98);
  ctx.fillText('✦', 468, 98);
  // Main text
  ctx.fillStyle = '#f5d070';
  ctx.font = 'bold 70px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 90);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function makeExitSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 96;
  const ctx = canvas.getContext('2d');
  // Dark green background (classic exit sign)
  const grad = ctx.createLinearGradient(0, 0, 0, 96);
  grad.addColorStop(0, '#0a2a0a');
  grad.addColorStop(1, '#061806');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 96);
  // Glowing green border
  ctx.strokeStyle = '#22ff44';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 248, 88);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#11cc22';
  ctx.strokeRect(10, 10, 236, 76);
  // Small down arrow on left
  ctx.fillStyle = '#22ff44';
  ctx.beginPath();
  ctx.moveTo(34, 36); ctx.lineTo(42, 36); ctx.lineTo(42, 50);
  ctx.lineTo(54, 50); ctx.lineTo(38, 62); ctx.lineTo(22, 50);
  ctx.lineTo(34, 50); ctx.closePath();
  ctx.fill();
  // EXIT text
  ctx.fillStyle = '#33ff55';
  ctx.shadowColor = '#00ff44';
  ctx.shadowBlur = 10;
  ctx.font = 'bold 52px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', 148, 50);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function makeRoofTileTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#2a5530';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#1e3f24';
  ctx.lineWidth = 2;
  for (let y = 0; y < 128; y += 12) {
    const off = ((y / 12) % 2) * 16;
    for (let x = -16 + off; x < 128; x += 32) {
      ctx.strokeRect(x + 2, y + 2, 28, 10);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2); tex.needsUpdate = true;
  return tex;
}

function makeHangingSignTexture(label) {
  const canvas = document.createElement('canvas');
  canvas.width = 384; canvas.height = 192;
  const ctx = canvas.getContext('2d');

  // Wooden plank background
  const bg = ctx.createLinearGradient(0, 0, 0, 192);
  bg.addColorStop(0, '#6b3a12');
  bg.addColorStop(0.5, '#4e2a0b');
  bg.addColorStop(1, '#3a1e07');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 384, 192);

  // Wood grain lines
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 28 * i + 10);
    ctx.lineTo(384, 28 * i + 10 + (Math.random() - 0.5) * 8);
    ctx.stroke();
  }

  // Border nails / peg holes
  ctx.fillStyle = '#9a8060';
  [[18, 18], [366, 18], [18, 174], [366, 174]].forEach(([x, y]) => {
    ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#555030';
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9a8060';
  });

  // Carved border
  ctx.strokeStyle = '#c88040';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, 368, 176);
  ctx.strokeStyle = '#7a4010';
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 14, 356, 164);

  // Label text (two lines if needed: icon line + text line)
  const icons = { WEAPONS: '⚔', SKINS: '✦', LOCATIONS: '◉', BANNERS: '⚑', POTIONS: '⚗', TAGS: '🏷' };
  const icon = icons[label] || '★';

  ctx.fillStyle = '#f5d070';
  ctx.shadowColor = '#c88040';
  ctx.shadowBlur = 6;
  ctx.font = 'bold 52px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, 192, 68);

  ctx.font = 'bold 38px Georgia, serif';
  ctx.fillText(label, 192, 138);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function buildShopkeeper(bodyColor) {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xf5c89a, roughness: 0.8 });
  const outfit = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.85 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1008, roughness: 0.9 });
  const hatMat = new THREE.MeshStandardMaterial({ color: 0x1a1008, roughness: 0.7 });

  // Legs
  [-0.1, 0.1].forEach(x => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.14), dark);
    leg.position.set(x, 0.275, 0);
    leg.castShadow = true;
    g.add(leg);
  });

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.52, 0.2), outfit);
  torso.position.set(0, 0.81, 0);
  torso.castShadow = true;
  g.add(torso);

  // Apron (white front panel over torso)
  const apronMat = new THREE.MeshStandardMaterial({ color: 0xe8e0cc, roughness: 0.9 });
  const apron = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.42, 0.03), apronMat);
  apron.position.set(0, 0.78, 0.12);
  g.add(apron);

  // Arms
  [-0.26, 0.26].forEach(x => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.44, 0.13), outfit);
    arm.position.set(x, 0.78, 0);
    arm.rotation.z = x > 0 ? -0.15 : 0.15;
    arm.castShadow = true;
    g.add(arm);
    // Hand
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), skin);
    hand.position.set(x * 1.05, 0.54, 0.02);
    g.add(hand);
  });

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.07, 0.12, 8), skin);
  neck.position.set(0, 1.1, 0);
  g.add(neck);

  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.26), skin);
  head.position.set(0, 1.29, 0);
  head.castShadow = true;
  g.add(head);

  // Eyes
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
  [-0.065, 0.065].forEach(x => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), eyeMat);
    eye.position.set(x, 1.3, 0.135);
    g.add(eye);
  });

  // Top hat
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 16), hatMat);
  brim.position.set(0, 1.445, 0);
  g.add(brim);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.28, 12), hatMat);
  crown.position.set(0, 1.59, 0);
  g.add(crown);
  // Hat band
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.06, 12),
    new THREE.MeshStandardMaterial({ color: 0xc8902a, roughness: 0.5, metalness: 0.3 }));
  band.position.set(0, 1.46, 0);
  g.add(band);

  return g;
}

// ─── Prop Builders ────────────────────────────

function buildLantern() {
  const g = new THREE.Group();
  const iron = new THREE.MeshStandardMaterial({ color: 0x111008, roughness: 0.6, metalness: 0.9 });
  // Top cap
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.15, 8), iron);
  cap.position.y = 0.28;
  g.add(cap);
  // Four vertical bars
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.32, 0.025), iron);
    bar.position.set(Math.sin(a) * 0.11, 0, Math.cos(a) * 0.11);
    g.add(bar);
  }
  // Bottom base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.08, 8), iron);
  base.position.y = -0.2;
  g.add(base);
  // Glowing flame
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xff8822, emissive: 0xff5500, emissiveIntensity: 2.0, roughness: 0.3 }));
  g.add(flame);
  return g;
}

function buildBarrel() {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x5c3a18, roughness: 0.88 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x8a8070, roughness: 0.45, metalness: 0.65 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.2, 0.58, 12), wood);
  body.position.y = 0.29;
  body.castShadow = true;
  g.add(body);
  [0.1, 0.29, 0.48].forEach(y => {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.022, 6, 14), metal);
    hoop.rotation.x = Math.PI / 2; hoop.position.y = y;
    g.add(hoop);
  });
  return g;
}

function buildCrate(plankTex) {
  const mat = new THREE.MeshStandardMaterial({ map: plankTex, roughness: 0.9 });
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.48), mat);
  crate.castShadow = true;
  return crate;
}

function buildFountain() {
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0xa09488, roughness: 0.92 });
  const darkStone = new THREE.MeshStandardMaterial({ color: 0x706860, roughness: 0.95 });
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x5599cc, emissive: 0x2244aa, emissiveIntensity: 0.25,
    roughness: 0.1, transparent: true, opacity: 0.82
  });

  // Basin base ring
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.2, 0.35, 24), darkStone);
  base.position.y = 0.175; base.receiveShadow = true; base.castShadow = true;
  g.add(base);
  // Basin body
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.9, 0.55, 24), stone);
  basin.position.y = 0.625; basin.castShadow = true;
  g.add(basin);
  // Rim lip
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.76, 0.11, 8, 24), stone);
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.9;
  g.add(rim);
  // Water surface
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.62, 24), waterMat);
  water.rotation.x = -Math.PI / 2; water.position.y = 0.88;
  g.add(water);
  // Center pillar
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 2.0, 12), stone);
  pillar.position.y = 1.9; pillar.castShadow = true;
  g.add(pillar);
  // Upper bowl
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.48, 0.32, 16), stone);
  bowl.position.y = 3.06; bowl.castShadow = true;
  g.add(bowl);
  const bowlRim = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.08, 8, 16), stone);
  bowlRim.rotation.x = Math.PI / 2; bowlRim.position.y = 3.22;
  g.add(bowlRim);
  // Fountain spray orb
  const sprayMat = new THREE.MeshStandardMaterial({ color: 0xaaddff, emissive: 0x88ccff, emissiveIntensity: 1.2, transparent: true, opacity: 0.65 });
  const spray = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), sprayMat);
  spray.position.y = 3.6;
  g.add(spray);
  // Warm water-light
  const wl = new THREE.PointLight(0x66aadd, 0.6, 5);
  wl.position.y = 1.0;
  g.add(wl);

  return g;
}

function buildCircularWall(stoneTex) {
  const wallH = 2.1; // just above player eye level (1.6) — you can see over it
  const wallR = 13.0;
  const g = new THREE.Group();

  // Main tube wall — open cylinder, visible from inside (BackSide) and outside
  const wallMat = new THREE.MeshStandardMaterial({
    map: stoneTex, roughness: 0.95, side: THREE.DoubleSide
  });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(wallR, wallR, wallH, 72, 1, true), wallMat);
  tube.position.y = wallH / 2;
  tube.castShadow = true; tube.receiveShadow = true;
  g.add(tube);

  // Rim on top of wall
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(wallR, 0.18, 4, 72),
    new THREE.MeshStandardMaterial({ color: 0x5a5248, roughness: 0.95 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = wallH;
  g.add(rim);

  // Merlons evenly spaced around top
  const merlonCount = 40;
  const merlonMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.95 });
  for (let i = 0; i < merlonCount; i++) {
    const a = (i / merlonCount) * Math.PI * 2;
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.45), merlonMat);
    m.position.set(Math.cos(a) * wallR, wallH + 0.275, Math.sin(a) * wallR);
    m.rotation.y = a;
    g.add(m);
  }

  return g;
}

// ─── Main Stand Builder ───────────────────────
// Wide Victorian market stall, front faces local +Z.
// roofColor: hex int for the roof tile base color

function buildStand(label, roofColor = 0x2a5530, keeperColor = 0x2a3a5a) {
  const g = new THREE.Group();
  const W = 6.0; // wide stall
  const richWood = new THREE.MeshStandardMaterial({ color: 0x5c3010, roughness: 0.82 });
  const darkWood  = new THREE.MeshStandardMaterial({ color: 0x3a1e08, roughness: 0.9 });
  const goldTrim  = new THREE.MeshStandardMaterial({ color: 0xc8902a, roughness: 0.28, metalness: 0.7 });
  const ironMat   = new THREE.MeshStandardMaterial({ color: 0x222018, roughness: 0.55, metalness: 0.85 });
  const plankTex  = makePlankTexture();
  const roofTex   = makeRoofTileTexture();

  // ── Counter ──────────────────────────────────
  const counter = new THREE.Mesh(new THREE.BoxGeometry(W, 0.95, 0.9), richWood);
  counter.position.set(0, 0.475, 0.35);
  counter.castShadow = true; counter.receiveShadow = true;
  g.add(counter);

  // Counter front apron (carved)
  const apron = new THREE.Mesh(new THREE.BoxGeometry(W, 0.4, 0.09), darkWood);
  apron.position.set(0, 0.2, 0.78);
  g.add(apron);

  // Gold apron trim rail
  const rail = new THREE.Mesh(new THREE.BoxGeometry(W + 0.08, 0.06, 0.06), goldTrim);
  rail.position.set(0, 0.4, 0.81);
  g.add(rail);

  // Counter top surface (slightly lighter)
  const top = new THREE.Mesh(new THREE.BoxGeometry(W + 0.12, 0.07, 1.02),
    new THREE.MeshStandardMaterial({ color: 0x6e4520, roughness: 0.7 }));
  top.position.set(0, 0.985, 0.35);
  g.add(top);

  // ── Back wall ────────────────────────────────
  const back = new THREE.Mesh(new THREE.BoxGeometry(W, 3.0, 0.16),
    new THREE.MeshStandardMaterial({ map: plankTex, roughness: 0.85 }));
  back.position.set(0, 1.5, -0.48);
  back.castShadow = true; back.receiveShadow = true;
  g.add(back);

  // ── Ornate sign ──────────────────────────────
  const signTex = makeOrnateSignTexture(label);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.5, 0.95),
    new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.45 }));
  sign.position.set(0, 2.72, -0.47);
  g.add(sign);

  // Gold molding above and below sign
  const topMold = new THREE.Mesh(new THREE.BoxGeometry(W + 0.1, 0.09, 0.09), goldTrim);
  topMold.position.set(0, 3.22, -0.44);
  g.add(topMold);
  const botMold = new THREE.Mesh(new THREE.BoxGeometry(W + 0.1, 0.09, 0.09), goldTrim);
  botMold.position.set(0, 2.24, -0.44);
  g.add(botMold);

  // ── Support columns (3: left, center, right) ─
  const colPositions = [-(W / 2 - 0.2), 0, W / 2 - 0.2];
  colPositions.forEach(x => {
    // Column shaft
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 3.8, 12), darkWood);
    col.position.set(x, 1.9, 0.35);
    col.castShadow = true;
    g.add(col);
    // Capital (gold)
    const capital = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.11, 0.2, 12), goldTrim);
    capital.position.set(x, 3.82, 0.35);
    g.add(capital);
    // Base (gold)
    const colBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.18, 12), goldTrim);
    colBase.position.set(x, 0.09, 0.35);
    g.add(colBase);
  });

  // ── Horizontal entablature beam ───────────────
  const beam = new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, 0.2, 0.2), darkWood);
  beam.position.set(0, 3.93, 0.35);
  g.add(beam);

  // Gold cornice trim strip
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(W + 0.55, 0.12, 0.28), goldTrim);
  cornice.position.set(0, 4.05, 0.35);
  g.add(cornice);

  // ── Pitched roof (front + back panels) ───────
  const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, map: roofTex, roughness: 0.8 });

  const roofFront = new THREE.Mesh(new THREE.BoxGeometry(W + 0.7, 0.13, 1.7), roofMat);
  roofFront.rotation.x = 0.38;
  roofFront.position.set(0, 4.32, 0.85);
  roofFront.castShadow = true;
  g.add(roofFront);

  const roofBack = new THREE.Mesh(new THREE.BoxGeometry(W + 0.7, 0.13, 1.7), roofMat);
  roofBack.rotation.x = -0.38;
  roofBack.position.set(0, 4.32, -0.72);
  roofBack.castShadow = true;
  g.add(roofBack);

  // Roof ridge
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(W + 0.7, 0.18, 0.16), darkWood);
  ridge.position.set(0, 4.58, 0.1);
  g.add(ridge);

  // ── Hanging lanterns on outer columns ────────
  [-W / 2 + 0.2, W / 2 - 0.2].forEach(x => {
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.35, 4), ironMat);
    chain.position.set(x, 3.42, 0.6);
    g.add(chain);
    const lantern = buildLantern();
    lantern.position.set(x, 3.1, 0.6);
    g.add(lantern);
    // Warm point light
    const pl = new THREE.PointLight(0xff9944, 1.0, 5);
    pl.position.set(x, 2.9, 0.6);
    g.add(pl);
  });

  // ── Display goods on counter ──────────────────
  const barrel1 = buildBarrel();
  barrel1.position.set(W / 2 - 0.55, 0.95, 0.38);
  g.add(barrel1);
  const barrel2 = buildBarrel();
  barrel2.position.set(-(W / 2 - 0.55), 0.95, 0.38);
  g.add(barrel2);

  // Crates stacked beside stall
  const crate1 = buildCrate(plankTex);
  crate1.position.set(W / 2 + 0.4, 0.24, 0.3);
  crate1.rotation.y = 0.25;
  g.add(crate1);
  const crate2 = buildCrate(plankTex);
  crate2.scale.setScalar(0.78);
  crate2.position.set(W / 2 + 0.38, 0.66, 0.32);
  crate2.rotation.y = -0.1;
  g.add(crate2);
  const crate3 = buildCrate(plankTex);
  crate3.position.set(-(W / 2 + 0.4), 0.24, 0.3);
  crate3.rotation.y = -0.35;
  g.add(crate3);

  // ── Decorative flag banner above sign ────────
  const flagMat = new THREE.MeshStandardMaterial({
    color: 0x8b1515, roughness: 0.9, side: THREE.DoubleSide
  });
  // Small pennants hanging from beam
  [-2.2, -0.75, 0.75, 2.2].forEach(x => {
    const flag = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 3), flagMat);
    flag.rotation.x = Math.PI;
    flag.position.set(x, 3.85, 0.35);
    g.add(flag);
  });

  // ── Hanging interior sign (from ceiling) ─────
  // Hangs inside the stall facing the customer (+Z direction)
  const hangSignTex = makeHangingSignTexture(label);
  const hangSignMat = new THREE.MeshStandardMaterial({
    map: hangSignTex, roughness: 0.6, side: THREE.DoubleSide
  });
  const hangSign = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), hangSignMat);
  hangSign.position.set(0, 2.7, -0.1);
  g.add(hangSign);

  // Two rope/chain pieces from ceiling beam to sign top
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0x8a6040, roughness: 0.95 });
  [-0.8, 0.8].forEach(x => {
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.88, 5), ropeMat);
    rope.position.set(x, 3.48, -0.1);
    g.add(rope);
    // Small wooden dowel at top attachment point
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.09, 6),
      new THREE.MeshStandardMaterial({ color: 0x5c3010, roughness: 0.9 }));
    peg.rotation.z = Math.PI / 2;
    peg.position.set(x, 3.92, -0.1);
    g.add(peg);
  });

  // ── Shopkeeper NPC ────────────────────────────
  const keeper = buildShopkeeper(keeperColor);
  // Stand behind the counter (z = -0.18 = between back wall and counter)
  keeper.position.set(0, 0, -0.18);
  g.add(keeper);

  return g;
}

// ─── Market World ─────────────────────────────

export class MarketWorld {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.stands = [];
    this.obstacles = [];
    this.returnPadRadius = 2.2;
    this.returnPadPosition = new THREE.Vector3(0, 0, 0);
    this.size = 26;
    this.exitSign = null; // billboard, updated each frame in _updateMarket // player bounds (halfExtent ≈ 11.7, circular wall at r=13)

    this._build();
    scene.add(this.group);
  }

  _build() {
    const g = this.group;
    const stoneTex  = makeStoneTexture();
    const cobbleTex = makeCobblestoneTexture();

    stoneTex.repeat.set(6, 1);

    // ── Ground ────────────────────────────────
    const groundMat = new THREE.MeshStandardMaterial({ map: cobbleTex, roughness: 0.95 });
    const ground = new THREE.Mesh(new THREE.CircleGeometry(13.5, 64), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    g.add(ground);

    // Stone path from south spawn inward (lighter strip)
    const pathMat = new THREE.MeshStandardMaterial({ color: 0x9a9080, roughness: 0.98 });
    const path = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 10), pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.005, 7);
    g.add(path);

    // ── Warm ambient ──────────────────────────
    g.add(new THREE.AmbientLight(0xffd8a8, 0.55));

    // ── Circular stone wall (player height) ───
    const circWall = buildCircularWall(stoneTex);
    g.add(circWall);

    // ── 5 Market stands in a U-shape ─────────
    // Angle measured clockwise from north (0°=N, 90°=E, 180°=S, 270°=W).
    // px = R*sin(a), pz = -R*cos(a). Front of stand faces inward (+Z local).
    // rotation.y = atan2(-px, -pz) makes the stand face the center.
    const R = 8.5;
    const standDefs = [
      { label: 'WEAPONS',   category: 'weapons',   angleDeg:   0, roofColor: 0x1e3a8a, keeperColor: 0x152a6a },  // N  — navy
      { label: 'SKINS',     category: 'skins',     angleDeg:  50, roofColor: 0x7a1a1a, keeperColor: 0x5a1010 },  // NE — crimson
      { label: 'LOCATIONS', category: 'locations', angleDeg: 310, roofColor: 0x1a5c2a, keeperColor: 0x0e3a18 },  // NW — forest green
      { label: 'BANNERS',   category: 'banners',   angleDeg:  95, roofColor: 0x7a5a0a, keeperColor: 0x5a3a05 },  // E  — amber
      { label: 'POTIONS',   category: 'potions',   angleDeg: 265, roofColor: 0x4a1a7a, keeperColor: 0x30105a },  // W  — purple
      { label: 'TAGS',      category: 'tags',      angleDeg: 145, roofColor: 0x2a0a5a, keeperColor: 0x1a0540 },  // SE — deep violet
    ];

    standDefs.forEach(def => {
      const a = def.angleDeg * Math.PI / 180;
      const px = R * Math.sin(a);
      const pz = -R * Math.cos(a);
      const rotY = Math.atan2(-px, -pz);

      const stand = buildStand(def.label, def.roofColor, def.keeperColor);
      stand.position.set(px, 0, pz);
      stand.rotation.y = rotY;
      g.add(stand);

      this.stands.push({
        category: def.category,
        label: def.label,
        position: new THREE.Vector3(px, 1.6, pz)
      });

      // Circle obstacle blocks player from walking through stand
      this.obstacles.push({ type: 'circle', x: px, z: pz, r: 2.6 });
    });

    // ── Central Fountain (return-to-home pad) ─
    const fountain = buildFountain();
    g.add(fountain);

    // ── Billboard EXIT sign above fountain ────
    // Floats at y=5.2, always faces the player (rotated each frame in update()).
    const exitSignTex = makeExitSignTexture();
    const exitSignMat = new THREE.MeshStandardMaterial({
      map: exitSignTex,
      emissive: 0x00ff44, emissiveIntensity: 0.35,
      roughness: 0.4, transparent: true, alphaTest: 0.05,
      side: THREE.DoubleSide
    });
    const exitSign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.68), exitSignMat);
    exitSign.position.set(0, 5.2, 0);
    g.add(exitSign);
    this.exitSign = exitSign;

    // Subtle green glow light from the sign
    const signLight = new THREE.PointLight(0x00ff44, 0.5, 4);
    signLight.position.set(0, 5.0, 0);
    g.add(signLight);

    // Gold glow ring at base (return indicator)
    const padMat = new THREE.MeshStandardMaterial({
      color: 0xf0c556, emissive: 0xf0c556, emissiveIntensity: 0.4, roughness: 0.3
    });
    const padGlow = new THREE.Mesh(new THREE.RingGeometry(1.9, 2.25, 32), padMat);
    padGlow.rotation.x = -Math.PI / 2;
    padGlow.position.y = 0.015;
    g.add(padGlow);

    // ── Benches around fountain ───────────────
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x4a3010, roughness: 0.85 });
    [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach(angle => {
      const bench = new THREE.Group();
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.45), benchMat);
      seat.position.y = 0.55; bench.add(seat);
      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.4), benchMat);
      legL.position.set(-0.6, 0.275, 0); bench.add(legL);
      const legR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.4), benchMat);
      legR.position.set(0.6, 0.275, 0); bench.add(legR);
      bench.rotation.y = angle;
      bench.position.set(Math.sin(angle) * 3.4, 0, Math.cos(angle) * 3.4);
      g.add(bench);
    });

    // ── Street lantern poles ──────────────────
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1a1810, roughness: 0.5, metalness: 0.9 });
    // Poles placed at 45° intervals at radius 5.5 (between fountain and stands)
    [45, 135, 225, 315].forEach(deg => {
      const a = deg * Math.PI / 180;
      const px = Math.cos(a) * 5.5;
      const pz = Math.sin(a) * 5.5;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.5, 8), poleMat);
      pole.position.set(px, 1.75, pz);
      pole.castShadow = true;
      g.add(pole);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6), poleMat);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(px + 0.4, 3.42, pz);
      g.add(arm);
      const lantern = buildLantern();
      lantern.scale.setScalar(1.2);
      lantern.position.set(px + 0.8, 3.42, pz);
      g.add(lantern);
      const pl = new THREE.PointLight(0xff9944, 1.0, 7);
      pl.position.set(px + 0.8, 3.2, pz);
      g.add(pl);
    });
  }

  getNearestStand(playerPos, maxDist = 4.0) {
    let nearest = null, nearestDist = Infinity;
    for (const stand of this.stands) {
      const dx = playerPos.x - stand.position.x;
      const dz = playerPos.z - stand.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= maxDist && dist < nearestDist) {
        nearest = stand; nearestDist = dist;
      }
    }
    return nearest;
  }

  /** Call each frame with the player's world position to billboard the EXIT sign. */
  update(playerPos) {
    if (!this.exitSign) return;
    const dx = playerPos.x - this.exitSign.position.x;
    const dz = playerPos.z - this.exitSign.position.z;
    this.exitSign.rotation.y = Math.atan2(dx, dz);
  }

  isInReturnPad(playerPos) {
    const dx = playerPos.x - this.returnPadPosition.x;
    const dz = playerPos.z - this.returnPadPosition.z;
    return (dx * dx + dz * dz) <= (this.returnPadRadius * this.returnPadRadius);
  }

  dispose() {
    this.scene.remove(this.group);
  }
}
