// ═══════════════════════════════════════════════
// Gary's Life — Skybox System
// Procedural gradient sky with sun + clouds
// ═══════════════════════════════════════════════

import * as THREE from 'three';

const SKY_VERTEX = `
varying vec3 vWorldPosition;
void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SKY_FRAGMENT = `
uniform vec3 uTopColor;
uniform vec3 uBottomColor;
uniform vec3 uSunColor;
uniform vec3 uSunDirection;
uniform float uSunIntensity;
varying vec3 vWorldPosition;

void main() {
  vec3 dir = normalize(vWorldPosition);
  float y = dir.y * 0.5 + 0.5;

  // Gradient sky
  vec3 color = mix(uBottomColor, uTopColor, pow(y, 0.6));

  // Sun glow
  float sunDot = max(dot(dir, normalize(uSunDirection)), 0.0);
  float sunDisc = pow(sunDot, 256.0) * 2.0;
  float sunGlow = pow(sunDot, 8.0) * uSunIntensity;

  color += uSunColor * (sunDisc + sunGlow * 0.15);

  // Horizon haze
  float horizonFactor = pow(1.0 - abs(dir.y), 12.0);
  color = mix(color, uSunColor * 0.6 + vec3(0.3), horizonFactor * 0.3);

  gl_FragColor = vec4(color, 1.0);
}
`;

export const SKY_PRESETS = {
  backyard: {
    topColor: new THREE.Color(0x4488cc),
    bottomColor: new THREE.Color(0x88bbdd),
    sunColor: new THREE.Color(0xffeedd),
    sunDirection: new THREE.Vector3(0.5, 0.6, 0.3),
    sunIntensity: 1.0,
    fogColor: new THREE.Color(0x9ec5d6),
    ambientColor: 0x8899aa,
    ambientIntensity: 0.6,
    dirLightColor: 0xffeedd,
    dirLightIntensity: 1.2
  },
  park: {
    topColor: new THREE.Color(0x3377bb),
    bottomColor: new THREE.Color(0x77aacc),
    sunColor: new THREE.Color(0xfff5e0),
    sunDirection: new THREE.Vector3(0.4, 0.7, 0.2),
    sunIntensity: 1.1,
    fogColor: new THREE.Color(0x8ab5c8),
    ambientColor: 0x7799aa,
    ambientIntensity: 0.5,
    dirLightColor: 0xfff5e0,
    dirLightIntensity: 1.3
  },
  forest: {
    topColor: new THREE.Color(0x335566),
    bottomColor: new THREE.Color(0x556655),
    sunColor: new THREE.Color(0xddcc88),
    sunDirection: new THREE.Vector3(0.2, 0.4, 0.5),
    sunIntensity: 0.6,
    fogColor: new THREE.Color(0x556655),
    ambientColor: 0x556655,
    ambientIntensity: 0.7,
    dirLightColor: 0xddcc88,
    dirLightIntensity: 0.8
  },
  lakeside: {
    topColor: new THREE.Color(0x553366),
    bottomColor: new THREE.Color(0xdd8844),
    sunColor: new THREE.Color(0xff9944),
    sunDirection: new THREE.Vector3(-0.3, 0.25, 0.5),
    sunIntensity: 1.5,
    fogColor: new THREE.Color(0xcc8855),
    ambientColor: 0x886655,
    ambientIntensity: 0.5,
    dirLightColor: 0xff9944,
    dirLightIntensity: 1.0
  },
  mountain: {
    topColor: new THREE.Color(0x1a2244),
    bottomColor: new THREE.Color(0x6688bb),
    sunColor: new THREE.Color(0xffffff),
    sunDirection: new THREE.Vector3(0.3, 0.8, 0.1),
    sunIntensity: 1.3,
    fogColor: new THREE.Color(0x8899bb),
    ambientColor: 0x8899bb,
    ambientIntensity: 0.6,
    dirLightColor: 0xffffff,
    dirLightIntensity: 1.4
  }
};

export class SkySystem {
  constructor(scene) {
    this.scene = scene;

    // Sky dome
    const skyGeo = new THREE.SphereGeometry(500, 32, 32);
    this.skyMat = new THREE.ShaderMaterial({
      vertexShader: SKY_VERTEX,
      fragmentShader: SKY_FRAGMENT,
      uniforms: {
        uTopColor: { value: new THREE.Color(0x4488cc) },
        uBottomColor: { value: new THREE.Color(0x88bbdd) },
        uSunColor: { value: new THREE.Color(0xffeedd) },
        uSunDirection: { value: new THREE.Vector3(0.5, 0.6, 0.3) },
        uSunIntensity: { value: 1.0 }
      },
      side: THREE.BackSide,
      depthWrite: false
    });

    this.skyMesh = new THREE.Mesh(skyGeo, this.skyMat);
    scene.add(this.skyMesh);

    // Lights
    this.ambientLight = new THREE.AmbientLight(0x8899aa, 0.6);
    scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    this.dirLight.position.set(30, 50, 20);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.left = -60;
    this.dirLight.shadow.camera.right = 60;
    this.dirLight.shadow.camera.top = 60;
    this.dirLight.shadow.camera.bottom = -60;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 150;
    this.dirLight.shadow.bias = -0.002;
    scene.add(this.dirLight);

    // Clouds (simple flat planes)
    this.clouds = [];
    this.createClouds();
  }

  createClouds() {
    // Remove old clouds
    for (const c of this.clouds) {
      this.scene.remove(c);
    }
    this.clouds = [];

    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });

    for (let i = 0; i < 15; i++) {
      const w = 20 + Math.random() * 40;
      const h = 5 + Math.random() * 10;
      const geo = new THREE.PlaneGeometry(w, h);
      const cloud = new THREE.Mesh(geo, cloudMat.clone());
      cloud.position.set(
        (Math.random() - 0.5) * 400,
        80 + Math.random() * 60,
        (Math.random() - 0.5) * 400
      );
      cloud.rotation.x = -Math.PI / 2;
      cloud.material.opacity = 0.15 + Math.random() * 0.2;
      cloud.userData.speed = 0.5 + Math.random() * 1.5;
      this.scene.add(cloud);
      this.clouds.push(cloud);
    }
  }

  setPreset(presetName) {
    const p = SKY_PRESETS[presetName];
    if (!p) return;

    this.skyMat.uniforms.uTopColor.value.copy(p.topColor);
    this.skyMat.uniforms.uBottomColor.value.copy(p.bottomColor);
    this.skyMat.uniforms.uSunColor.value.copy(p.sunColor);
    this.skyMat.uniforms.uSunDirection.value.copy(p.sunDirection);
    this.skyMat.uniforms.uSunIntensity.value = p.sunIntensity;

    this.scene.fog = new THREE.FogExp2(p.fogColor, 0.008);

    this.ambientLight.color.setHex(p.ambientColor);
    this.ambientLight.intensity = p.ambientIntensity;

    this.dirLight.color.setHex(p.dirLightColor);
    this.dirLight.intensity = p.dirLightIntensity;

    const sunDir = p.sunDirection.clone().normalize().multiplyScalar(50);
    this.dirLight.position.copy(sunDir);
  }

  update(dt) {
    for (const cloud of this.clouds) {
      cloud.position.x += cloud.userData.speed * dt;
      if (cloud.position.x > 250) cloud.position.x = -250;
    }
  }
}
