// ═══════════════════════════════════════════════
// Gary's Life — Shed Interactive System
// I-key inspect, ordered interactions, XP grants
// ═══════════════════════════════════════════════

import * as THREE from 'three';

function makeMat(color, rough = 0.85, metal = 0.0, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...opts });
}

function buildDirtbike() {
  const g = new THREE.Group();
  const chrome  = makeMat(0xbbbbcc, 0.25, 0.9);
  const rubber  = makeMat(0x111111, 0.95);
  const frame   = makeMat(0x882222, 0.5, 0.7); // red frame under dust
  const dustMat = makeMat(0x998877, 0.95, 0.0, { opacity: 0.85, transparent: true });

  // Frame
  const mainFrame = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.6, 4, 8), frame);
  mainFrame.rotation.z = Math.PI/2;
  mainFrame.position.set(0, 0.58, 0);
  mainFrame.castShadow = true;
  g.add(mainFrame);

  // Fuel tank (upper)
  const tank = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.30, 6, 8), frame);
  tank.rotation.z = Math.PI/2;
  tank.position.set(0.05, 0.75, 0);
  tank.castShadow = true;
  g.add(tank);

  // Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.07, 0.22), makeMat(0x111111, 0.9));
  seat.position.set(-0.12, 0.88, 0);
  seat.castShadow = true;
  g.add(seat);

  // Engine block
  const engine = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.30), makeMat(0x555566, 0.45, 0.7));
  engine.position.set(0.04, 0.45, 0);
  engine.castShadow = true;
  g.add(engine);

  // Exhaust pipe
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.6, 8), chrome);
  exhaust.rotation.z = 0.3;
  exhaust.position.set(-0.1, 0.38, 0.18);
  exhaust.castShadow = true;
  g.add(exhaust);

  // Wheels
  [-0.55, 0.45].forEach(xOff => {
    const tireGeo = new THREE.TorusGeometry(0.32, 0.085, 10, 22);
    const tire = new THREE.Mesh(tireGeo, rubber);
    tire.rotation.y = Math.PI/2;
    tire.position.set(xOff, 0.32, 0);
    tire.castShadow = true;
    g.add(tire);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 8, 18), chrome);
    rim.rotation.y = Math.PI/2;
    rim.position.set(xOff, 0.32, 0);
    g.add(rim);

    // Spokes
    for (let i = 0; i < 8; i++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.44, 4), chrome);
      spoke.rotation.z = (i/8)*Math.PI;
      spoke.position.set(xOff, 0.32, 0);
      g.add(spoke);
    }
  });

  // Handlebars
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.55, 8), chrome);
  bar.rotation.z = Math.PI/2;
  bar.position.set(0.50, 1.0, 0);
  bar.castShadow = true;
  g.add(bar);

  // Fork legs
  [-0.12, 0.12].forEach(zOff => {
    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 6), chrome);
    fork.position.set(0.46, 0.65, zOff);
    g.add(fork);
  });

  // Headlight
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), makeMat(0xffffcc, 0.1, 0.2));
  light.position.set(0.56, 0.92, 0);
  g.add(light);

  // Dust cover (layer on top — removed when cleaned)
  g.dustMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.9, 0.5),
    dustMat
  );
  g.dustMesh.position.set(0, 0.55, 0);
  g.add(g.dustMesh);

  return g;
}

function buildWeaponParts() {
  const g = new THREE.Group();
  const metal = makeMat(0x445566, 0.35, 0.8);
  const wood  = makeMat(0x6B4226, 0.85);

  // Barrel
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.020, 0.7, 8), metal);
  barrel.rotation.z = 0.3;
  barrel.position.set(0, 0.04, 0.1);
  g.add(barrel);

  // Stock (wooden)
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.35), wood);
  stock.rotation.y = 0.4;
  stock.position.set(0.1, 0.03, -0.15);
  g.add(stock);

  // Receiver
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.07, 0.18), metal);
  receiver.rotation.y = 0.1;
  receiver.position.set(0, 0.035, 0);
  g.add(receiver);

  // Small parts (screws, springs etc)
  for (let i = 0; i < 5; i++) {
    const part = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.04+Math.random()*0.08, 5),
      metal
    );
    part.position.set((Math.random()-0.5)*0.3, 0.01, (Math.random()-0.5)*0.3);
    part.rotation.set(Math.random(), Math.random(), Math.random());
    g.add(part);
  }

  return g;
}

function buildWorkbench() {
  const g = new THREE.Group();
  const wood = makeMat(0x5a3812, 0.9);
  const metal = makeMat(0x444444, 0.6, 0.5);

  const top = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.7), wood);
  top.position.y = 0.9; top.castShadow = true; top.receiveShadow = true;
  g.add(top);

  const legs = [[-0.9,0.2],[-0.9,-0.2],[0.9,0.2],[0.9,-0.2]];
  legs.forEach(([x,z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.9,6), wood);
    leg.position.set(x, 0.45, z);
    leg.castShadow = true;
    g.add(leg);
  });

  // Vice
  const vice = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.12), metal);
  vice.position.set(0.8, 0.98, 0.3);
  vice.castShadow = true;
  g.add(vice);

  return g;
}

function buildTarp() {
  const mat = makeMat(0x446644, 0.9, 0, { opacity: 0.92, transparent: true });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.55), mat);
  mesh.castShadow = true;
  return mesh;
}

// ─── Shed Interior ────────────────────────────

export class ShedInterior {
  constructor(scene) {
    this.scene  = scene;
    this.group  = new THREE.Group();
    this.interactables = []; // {mesh, label, action, done, position}
    this.step   = 0; // 0=door, 1=tarp, 2=clean, 3=parts, 4=start_bike
    this.onXPGrant = null; // callback(amount, label)
    this.onComplete = null; // bike ride start callback

    this._build();
    scene.add(this.group);
  }

  _build() {
    const g = this.group;
    const plank = new THREE.MeshStandardMaterial({ color: 0x4a3010, roughness: 0.92 });
    const dirt  = new THREE.MeshStandardMaterial({ color: 0x3a2a18, roughness: 0.98 });

    // Dim interior lighting
    const bulb = new THREE.PointLight(0xffdd88, 1.2, 8);
    bulb.position.set(0, 2.8, 0);
    bulb.castShadow = true;
    g.add(bulb);
    g.add(new THREE.AmbientLight(0x332211, 1.0));

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 4.5), dirt);
    floor.rotation.x = -Math.PI/2;
    floor.receiveShadow = true;
    g.add(floor);

    // Walls (3 sides — front is door)
    [
      { geo: [4.5, 3.2, 0.12], pos: [0, 1.6, -2.25] },
      { geo: [0.12, 3.2, 4.5], pos: [-2.25, 1.6, 0] },
      { geo: [0.12, 3.2, 4.5], pos: [ 2.25, 1.6, 0] },
    ].forEach(({ geo, pos }) => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(...geo), plank);
      w.position.set(...pos);
      w.castShadow = true; w.receiveShadow = true;
      g.add(w);
    });

    // Ceiling
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 4.5), plank);
    ceil.rotation.x = Math.PI/2;
    ceil.position.y = 3.2;
    g.add(ceil);

    // ── Door ──────────────────────────────────
    this.door = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 2.3, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x3a2208, roughness: 0.92 })
    );
    this.door.position.set(0.4, 1.15, 2.21);
    this.door.castShadow = true;
    g.add(this.door);
    this.doorOpen = false;

    this.interactables.push({
      mesh: this.door,
      label: '[I] Open shed door',
      action: 'open_door',
      position: new THREE.Vector3(0.4, 1.15, 2.21),
      done: false
    });

    // ── Workbench ─────────────────────────────
    const bench = buildWorkbench();
    bench.position.set(-1.2, 0, -1.5);
    bench.castShadow = true;
    g.add(bench);

    // ── Dirtbike (under tarp) ─────────────────
    this.bike = buildDirtbike();
    this.bike.position.set(0.5, 0, 0.2);
    this.bike.rotation.y = -0.3;
    g.add(this.bike);

    // Tarp over bike
    this.tarp = buildTarp();
    this.tarp.position.set(0.5, 0.55, 0.2);
    g.add(this.tarp);

    this.interactables.push({
      mesh: this.tarp,
      label: '[I] Pull off tarp',
      action: 'remove_tarp',
      position: new THREE.Vector3(0.5, 0.55, 0.2),
      done: false
    });

    // Dust layer on bike
    this.dustVisible = true;

    this.interactables.push({
      mesh: this.bike.dustMesh,
      label: '[I] Clean the dirtbike',
      action: 'clean_bike',
      position: new THREE.Vector3(0.5, 0.55, 0.2),
      done: false
    });

    // ── Weapon Parts on shelf ─────────────────
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.05, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x4a3010, roughness: 0.9 })
    );
    shelf.position.set(-1.5, 1.4, -1.8);
    g.add(shelf);

    this.weaponParts = buildWeaponParts();
    this.weaponParts.position.set(-1.5, 1.43, -1.8);
    g.add(this.weaponParts);

    this.interactables.push({
      mesh: this.weaponParts,
      label: '[I] Examine weapon parts',
      action: 'examine_parts',
      position: new THREE.Vector3(-1.5, 1.43, -1.8),
      done: false
    });

    // ── Bike start interactable (added after parts) ─
    this.bikeStartMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xffdd00, emissive: 0xffaa00, emissiveIntensity: 0.5, roughness: 0.3 })
    );
    this.bikeStartMarker.position.set(0.5, 1.1, 0.2);
    this.bikeStartMarker.visible = false;
    g.add(this.bikeStartMarker);

    this.interactables.push({
      mesh: this.bikeStartMarker,
      label: '[I] Try to start the bike',
      action: 'start_bike',
      position: new THREE.Vector3(0.5, 1.1, 0.2),
      done: false
    });
  }

  // ─── Get nearest available interactable ──────

  getNearestInteractable(playerPos, maxDist = 2.5) {
    const current = this.interactables[this.step];
    if (!current || current.done) return null;
    const d = playerPos.distanceTo(current.position);
    if (d <= maxDist) return current;
    return null;
  }

  // ─── Trigger action ──────────────────────────

  triggerAction(action) {
    switch (action) {
      case 'open_door':
        this._openDoor();
        this.step = 1;
        return { text: "The hinges squeal. Inside — dark shapes covered in dust.", xp: 0 };

      case 'remove_tarp':
        this._removeTarp();
        this.step = 2;
        return { text: "A dirtbike. Old, dusty. But it looks intact.", xp: 0 };

      case 'clean_bike':
        this._cleanBike();
        this.step = 3;
        return { text: "The frame is red underneath all that grime. Somebody kept this nice once.", xp: 20 };

      case 'examine_parts':
        this.step = 4;
        this.bikeStartMarker.visible = true;
        return { text: "Gun parts. A barrel, a stock, receiver pieces — all high-grade. These don't belong in a shed.", xp: 10 };

      case 'start_bike':
        this.step = 5;
        setTimeout(() => { if (this.onComplete) this.onComplete(); }, 1800);
        return { text: "It takes a few tries, but the engine turns over. She's alive.", xp: 0 };

      default:
        return null;
    }
  }

  _openDoor() {
    this.doorOpen = true;
    // Rotate door open (pivot at left edge)
    this.door.position.x = -0.2;
    this.door.rotation.y = -Math.PI / 2.2;
  }

  _removeTarp() {
    this.group.remove(this.tarp);
    this.tarp = null;
  }

  _cleanBike() {
    if (this.bike.dustMesh) {
      this.bike.remove(this.bike.dustMesh);
      this.bike.dustMesh = null;
    }
  }

  dispose() {
    this.scene.remove(this.group);
  }
}
