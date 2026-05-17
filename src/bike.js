// ═══════════════════════════════════════════════
// Gary's Life — Dirtbike Controller
// Third-person vehicle for BIKE_RIDE state
// ═══════════════════════════════════════════════

import * as THREE from 'three';

function makeMat(color, rough = 0.5, metal = 0.5) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
}

function buildBikeModel() {
  const g = new THREE.Group();
  const chrome = makeMat(0xccccdd, 0.2, 0.95);
  const rubber = makeMat(0x111111, 0.95, 0.0);
  const red    = makeMat(0xaa2222, 0.4, 0.6);
  const black  = makeMat(0x222222, 0.6, 0.3);

  // Frame
  const frame = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.65, 4, 8), red);
  frame.rotation.z = Math.PI/2; frame.position.set(0, 0.6, 0); frame.castShadow = true;
  g.add(frame);

  const tank = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.32, 6, 8), red);
  tank.rotation.z = Math.PI/2; tank.position.set(0.06, 0.77, 0); tank.castShadow = true;
  g.add(tank);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.23), black);
  seat.position.set(-0.14, 0.91, 0); seat.castShadow = true;
  g.add(seat);

  const engine = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.26, 0.32), makeMat(0x555566, 0.4, 0.75));
  engine.position.set(0.05, 0.46, 0); engine.castShadow = true;
  g.add(engine);

  // Exhaust
  const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.042, 0.65, 8), chrome);
  ex.rotation.z = 0.3; ex.position.set(-0.1, 0.38, 0.20); ex.castShadow = true;
  g.add(ex);

  // Wheels
  [-0.57, 0.47].forEach(xOff => {
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.09, 10, 24), rubber);
    tire.rotation.y = Math.PI/2; tire.position.set(xOff, 0.33, 0); tire.castShadow = true;
    g.add(tire);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.028, 8, 18), chrome);
    rim.rotation.y = Math.PI/2; rim.position.set(xOff, 0.33, 0);
    g.add(rim);
  });

  // Handlebars
  const bars = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.58, 8), chrome);
  bars.rotation.z = Math.PI/2; bars.position.set(0.52, 1.02, 0); bars.castShadow = true;
  g.add(bars);

  // Gary on bike (simple seated figure)
  const skin = makeMat(0xd4956a, 0.8, 0);
  const shirt = makeMat(0x2255aa, 0.85, 0);
  const pants = makeMat(0x3a3028, 0.85, 0);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.30, 6, 8), shirt);
  body.position.set(-0.12, 1.18, 0); body.rotation.z = -0.3; body.castShadow = true;
  g.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), skin);
  head.position.set(0.22, 1.42, 0); head.castShadow = true;
  g.add(head);

  // Helmet tint
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xaa0000, roughness: 0.3, metalness: 0.4 }));
  helmet.position.set(0.22, 1.44, 0); g.add(helmet);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.07, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.1, metalness: 0.5, opacity: 0.7, transparent: true }));
  visor.position.set(0.35, 1.42, 0); g.add(visor);

  // Arms reaching forward
  [-0.1, 0.1].forEach(zOff => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.3, 4, 6), shirt);
    arm.rotation.z = -1.1; arm.position.set(0.34, 1.25, zOff); arm.castShadow = true;
    g.add(arm);
  });

  // Legs bent
  [[-0.23, 0.55, -0.14], [-0.23, 0.55, 0.14]].forEach(([x,y,z]) => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.32, 4, 6), pants);
    leg.position.set(x, y, z); leg.rotation.z = 0.7; leg.castShadow = true;
    g.add(leg);
  });

  return g;
}

export class BikeController {
  constructor(scene, camera) {
    this.scene    = scene;
    this.camera   = camera;
    this.group    = new THREE.Group();
    this.keys     = { forward: false, backward: false, left: false, right: false };
    this.speed    = 0;
    this.maxSpeed = 14;
    this.steer    = 0;
    this.heading  = Math.PI; // pointing back toward home

    // Home trigger — arrive when Z > 10
    this.homeZ    = 12;
    this.onArriveHome = null;

    // Build world
    this._buildReturnPath();
    this.bikeModel = buildBikeModel();
    this.group.add(this.bikeModel);
    this.group.position.set(6, 0, -130); // start at shed
    scene.add(this.group);

    this._bindKeys();
  }

  _buildReturnPath() {
    // Straight-ish road back home — fog, trees, golden hour
    const scene = this.scene;
    scene.fog = new THREE.FogExp2(0xffcc88, 0.014);
    scene.background = new THREE.Color(0xff9944);

    // Sun low on horizon (golden hour)
    const sun = new THREE.DirectionalLight(0xffaa44, 2.0);
    sun.position.set(-40, 20, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    this.group.add(sun);
    scene.add(new THREE.AmbientLight(0x885533, 0.8));

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x3d5228, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI/2; ground.receiveShadow = true;
    scene.add(ground);

    // Path
    const path = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 160),
      new THREE.MeshStandardMaterial({ color: 0x6a4828, roughness: 0.9 })
    );
    path.rotation.x = -Math.PI/2; path.position.set(3, 0.01, -65);
    path.receiveShadow = true; scene.add(path);

    // Trees lining road
    const oakMat = new THREE.MeshStandardMaterial({ color: 0x1e4a20, roughness: 0.9 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 0.95 });
    for (let z = 0; z > -140; z -= 5 + Math.random()*4) {
      [-1,1].forEach(side => {
        const h = 2.5 + Math.random()*1.5;
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.10,h,7), trunkMat);
        trunk.position.set(side*(4.5+Math.random()*5), h/2, z);
        trunk.castShadow = true; scene.add(trunk);
        const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.8+Math.random()*0.5, 8, 7), oakMat);
        canopy.position.set(side*(4.5+Math.random()*5), h+0.5, z);
        canopy.castShadow = true; scene.add(canopy);
      });
    }

    // Gary's house at end
    this.house = this._buildHouse();
    this.house.position.set(3, 0, 8);
    scene.add(this.house);
  }

  _buildHouse() {
    const g = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xddd0b8, roughness: 0.85 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x883322, roughness: 0.7 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x886644, roughness: 0.8 });

    const walls = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 6), wallMat);
    walls.position.y = 2; walls.castShadow = true; walls.receiveShadow = true;
    g.add(walls);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.8, 2.5, 4), roofMat);
    roof.position.y = 5.25; roof.rotation.y = Math.PI/4; roof.castShadow = true;
    g.add(roof);

    const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.1, 0.1), trimMat);
    door.position.set(0, 1.05, 3.05); door.castShadow = true;
    g.add(door);

    // Porch light glow
    const light = new THREE.PointLight(0xffdd88, 1.5, 6);
    light.position.set(0, 3.5, 3.5);
    g.add(light);

    return g;
  }

  _bindKeys() {
    this._kd = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp':    this.keys.forward  = true; break;
        case 'KeyS': case 'ArrowDown':  this.keys.backward = true; break;
        case 'KeyA': case 'ArrowLeft':  this.keys.left     = true; break;
        case 'KeyD': case 'ArrowRight': this.keys.right    = true; break;
      }
    };
    this._ku = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp':    this.keys.forward  = false; break;
        case 'KeyS': case 'ArrowDown':  this.keys.backward = false; break;
        case 'KeyA': case 'ArrowLeft':  this.keys.left     = false; break;
        case 'KeyD': case 'ArrowRight': this.keys.right    = false; break;
      }
    };
    document.addEventListener('keydown', this._kd);
    document.addEventListener('keyup',   this._ku);
  }

  update(dt) {
    // Acceleration
    if (this.keys.forward)  this.speed = Math.min(this.speed + 8*dt, this.maxSpeed);
    if (this.keys.backward) this.speed = Math.max(this.speed - 6*dt, -4);
    if (!this.keys.forward && !this.keys.backward) {
      this.speed *= 0.92;
    }

    // Steering
    const steerRate = 1.8 * (this.speed / this.maxSpeed);
    if (this.keys.left)  this.heading += steerRate * dt;
    if (this.keys.right) this.heading -= steerRate * dt;

    // Lean
    if (this.keys.left)       this.bikeModel.rotation.z =  0.18;
    else if (this.keys.right) this.bikeModel.rotation.z = -0.18;
    else this.bikeModel.rotation.z *= 0.85;

    // Move
    this.group.position.x += Math.sin(this.heading) * this.speed * dt;
    this.group.position.z += Math.cos(this.heading) * this.speed * dt;
    this.group.rotation.y  = this.heading;

    // Third-person camera
    const camOffset = new THREE.Vector3(
      -Math.sin(this.heading) * 5,
      3.2,
       Math.cos(this.heading) * 5  // wait — follow from behind
    );
    // Actually: behind means opposite of forward direction
    camOffset.set(
      -Math.sin(this.heading) * 5,
      3.0,
      -Math.cos(this.heading) * 5
    );
    this.camera.position.lerp(
      this.group.position.clone().add(camOffset),
      0.08
    );
    this.camera.lookAt(this.group.position.clone().add(new THREE.Vector3(0, 1, 0)));

    // Check home arrival
    if (this.group.position.z >= this.homeZ) {
      if (this.onArriveHome) {
        this.onArriveHome();
        this.onArriveHome = null;
      }
    }
  }

  dispose() {
    document.removeEventListener('keydown', this._kd);
    document.removeEventListener('keyup',   this._ku);
    this.scene.remove(this.group);
    this.scene.fog = null;
    this.scene.background = new THREE.Color(0x87ceeb);
  }
}
