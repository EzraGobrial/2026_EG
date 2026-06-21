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
  },

  // ─── Dimension 2: Tropics ──────────────────
  beach: {
    topColor: new THREE.Color(0x2299ee),
    bottomColor: new THREE.Color(0x66ccff),
    sunColor: new THREE.Color(0xffee88),
    sunDirection: new THREE.Vector3(0.6, 0.7, 0.2),
    sunIntensity: 1.4,
    fogColor: new THREE.Color(0x88ccdd),
    ambientColor: 0x88aacc,
    ambientIntensity: 0.7,
    dirLightColor: 0xffee88,
    dirLightIntensity: 1.5
  },
  jungle: {
    topColor: new THREE.Color(0x224422),
    bottomColor: new THREE.Color(0x446633),
    sunColor: new THREE.Color(0xccbb66),
    sunDirection: new THREE.Vector3(0.1, 0.3, 0.4),
    sunIntensity: 0.4,
    fogColor: new THREE.Color(0x445533),
    ambientColor: 0x445533,
    ambientIntensity: 0.8,
    dirLightColor: 0xccbb66,
    dirLightIntensity: 0.6
  },
  swamp: {
    topColor: new THREE.Color(0x334433),
    bottomColor: new THREE.Color(0x556644),
    sunColor: new THREE.Color(0xaaaa66),
    sunDirection: new THREE.Vector3(-0.2, 0.3, 0.4),
    sunIntensity: 0.5,
    fogColor: new THREE.Color(0x445544),
    ambientColor: 0x556644,
    ambientIntensity: 0.7,
    dirLightColor: 0xaaaa66,
    dirLightIntensity: 0.6
  },
  volcano: {
    topColor: new THREE.Color(0x4a3a52),
    bottomColor: new THREE.Color(0xaa5a38),
    sunColor: new THREE.Color(0xff8844),
    sunDirection: new THREE.Vector3(0.3, 0.4, 0.3),
    sunIntensity: 1.3,
    fogColor: new THREE.Color(0x6b4a44),
    ambientColor: 0x8a6a4a,
    ambientIntensity: 0.8,
    dirLightColor: 0xffaa66,
    dirLightIntensity: 1.45
  },
  island: {
    topColor: new THREE.Color(0x1188dd),
    bottomColor: new THREE.Color(0x55bbee),
    sunColor: new THREE.Color(0xffffaa),
    sunDirection: new THREE.Vector3(0.5, 0.8, 0.1),
    sunIntensity: 1.5,
    fogColor: new THREE.Color(0x77bbdd),
    ambientColor: 0x88bbcc,
    ambientIntensity: 0.7,
    dirLightColor: 0xffffaa,
    dirLightIntensity: 1.6
  },

  // ─── Dimension 3: Arctic ───────────────────
  tundra: {
    topColor: new THREE.Color(0x8899bb),
    bottomColor: new THREE.Color(0xccddee),
    sunColor: new THREE.Color(0xddeeff),
    sunDirection: new THREE.Vector3(0.4, 0.2, 0.3),
    sunIntensity: 0.7,
    fogColor: new THREE.Color(0xbbccdd),
    ambientColor: 0xaabbcc,
    ambientIntensity: 0.7,
    dirLightColor: 0xddeeff,
    dirLightIntensity: 0.8
  },
  glacier: {
    topColor: new THREE.Color(0x5577aa),
    bottomColor: new THREE.Color(0xaaccee),
    sunColor: new THREE.Color(0xeeeeff),
    sunDirection: new THREE.Vector3(0.2, 0.5, 0.4),
    sunIntensity: 1.0,
    fogColor: new THREE.Color(0x99bbdd),
    ambientColor: 0x99aacc,
    ambientIntensity: 0.6,
    dirLightColor: 0xeeeeff,
    dirLightIntensity: 1.1
  },
  ice_cave: {
    topColor: new THREE.Color(0x112244),
    bottomColor: new THREE.Color(0x334466),
    sunColor: new THREE.Color(0x6688cc),
    sunDirection: new THREE.Vector3(0.0, 0.8, 0.1),
    sunIntensity: 0.3,
    fogColor: new THREE.Color(0x223355),
    ambientColor: 0x334466,
    ambientIntensity: 0.8,
    dirLightColor: 0x6688cc,
    dirLightIntensity: 0.4
  },
  frozen_lake: {
    topColor: new THREE.Color(0x112255),
    bottomColor: new THREE.Color(0x446688),
    sunColor: new THREE.Color(0x88aaff),
    sunDirection: new THREE.Vector3(-0.3, 0.3, 0.4),
    sunIntensity: 0.6,
    fogColor: new THREE.Color(0x556688),
    ambientColor: 0x667799,
    ambientIntensity: 0.5,
    dirLightColor: 0x88aaff,
    dirLightIntensity: 0.7
  },
  arctic_peak: {
    topColor: new THREE.Color(0x0a1533),
    bottomColor: new THREE.Color(0x5577aa),
    sunColor: new THREE.Color(0xffffff),
    sunDirection: new THREE.Vector3(0.5, 0.9, 0.0),
    sunIntensity: 1.5,
    fogColor: new THREE.Color(0x6688aa),
    ambientColor: 0x7799bb,
    ambientIntensity: 0.5,
    dirLightColor: 0xffffff,
    dirLightIntensity: 1.6
  },

  // ─── Dimension 4: Desert ───────────────────
  oasis: {
    topColor: new THREE.Color(0x3366aa),
    bottomColor: new THREE.Color(0xddaa55),
    sunColor: new THREE.Color(0xffdd66),
    sunDirection: new THREE.Vector3(0.5, 0.8, 0.2),
    sunIntensity: 1.5,
    fogColor: new THREE.Color(0xccaa66),
    ambientColor: 0xbbaa77,
    ambientIntensity: 0.6,
    dirLightColor: 0xffdd66,
    dirLightIntensity: 1.6
  },
  canyon: {
    topColor: new THREE.Color(0x4477aa),
    bottomColor: new THREE.Color(0xcc8844),
    sunColor: new THREE.Color(0xffcc44),
    sunDirection: new THREE.Vector3(0.3, 0.6, 0.3),
    sunIntensity: 1.3,
    fogColor: new THREE.Color(0xbb8855),
    ambientColor: 0xaa8866,
    ambientIntensity: 0.5,
    dirLightColor: 0xffcc44,
    dirLightIntensity: 1.4
  },
  dunes: {
    topColor: new THREE.Color(0x5588bb),
    bottomColor: new THREE.Color(0xeebb66),
    sunColor: new THREE.Color(0xffee44),
    sunDirection: new THREE.Vector3(0.6, 0.9, 0.1),
    sunIntensity: 1.8,
    fogColor: new THREE.Color(0xddbb77),
    ambientColor: 0xccaa66,
    ambientIntensity: 0.5,
    dirLightColor: 0xffee44,
    dirLightIntensity: 1.7
  },
  mesa: {
    topColor: new THREE.Color(0x4466aa),
    bottomColor: new THREE.Color(0xdd8833),
    sunColor: new THREE.Color(0xffaa33),
    sunDirection: new THREE.Vector3(-0.4, 0.5, 0.3),
    sunIntensity: 1.4,
    fogColor: new THREE.Color(0xcc8844),
    ambientColor: 0xbb7744,
    ambientIntensity: 0.5,
    dirLightColor: 0xffaa33,
    dirLightIntensity: 1.3
  },
  ruins: {
    topColor: new THREE.Color(0x553355),
    bottomColor: new THREE.Color(0xcc8844),
    sunColor: new THREE.Color(0xff8833),
    sunDirection: new THREE.Vector3(-0.3, 0.3, 0.5),
    sunIntensity: 1.2,
    fogColor: new THREE.Color(0xaa7744),
    ambientColor: 0x997755,
    ambientIntensity: 0.6,
    dirLightColor: 0xff8833,
    dirLightIntensity: 1.1
  }
};

// ─── Procedural sky for generated dimensions (id >= 5) ───
// Before this, any location without an explicit preset fell back to the
// "backyard" blue sky — which made every infinite dimension look identical.
// We now derive a distinct, deterministic palette from the location key so
// each generated dimension gets its own coloured sky, fog and lighting.
function _hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0);
}

export function proceduralSkyPreset(key) {
  key = key || 'unknown';
  // Share a hue family across a whole dimension (d7_l0, d7_l1, …) so locations
  // feel related, with a small per-location shift. The base hue matches the
  // bird-colour seed used when the dimension is generated (id * 47).
  const m = /^d(\d+)_l?(\d+)?/.exec(key);
  const dimNum = m ? parseInt(m[1], 10) : _hashStr(key) % 97;
  const locIdx = m && m[2] ? parseInt(m[2], 10) : 0;
  const baseHue = ((dimNum * 47) % 360) / 360;
  const hue = (baseHue + locIdx * 0.05) % 1;
  const style = _hashStr(key) % 4;            // 4 distinct moods
  const comp = (hue + 0.5) % 1;               // complementary hue
  const c = (h, s, l) => new THREE.Color().setHSL(((h % 1) + 1) % 1, s, l);

  let topColor, bottomColor, sunColor, sunIntensity, dirLightColor, dirLightIntensity, ambientColor, ambientIntensity, sunDirection;
  if (style === 0) {           // vivid daylight
    topColor = c(hue, 0.6, 0.45); bottomColor = c(hue + 0.06, 0.5, 0.7);
    sunColor = c(hue + 0.08, 0.5, 0.85); sunIntensity = 1.3;
    dirLightColor = 0xffffff; dirLightIntensity = 1.4;
    ambientColor = c(hue, 0.35, 0.6).getHex(); ambientIntensity = 0.7;
    sunDirection = new THREE.Vector3(0.4, 0.7, 0.2);
  } else if (style === 1) {    // alien sunset
    topColor = c(hue, 0.55, 0.4); bottomColor = c(comp, 0.7, 0.62);
    sunColor = c(comp, 0.7, 0.7); sunIntensity = 1.7;
    dirLightColor = c(comp, 0.6, 0.7).getHex(); dirLightIntensity = 1.4;
    ambientColor = c(hue, 0.4, 0.55).getHex(); ambientIntensity = 0.65;
    sunDirection = new THREE.Vector3(-0.3, 0.35, 0.5);
  } else if (style === 2) {    // electric dusk
    topColor = c(hue + 0.55, 0.6, 0.4); bottomColor = c(hue, 0.6, 0.6);
    sunColor = c(hue, 0.6, 0.8); sunIntensity = 1.4;
    dirLightColor = c(hue, 0.5, 0.75).getHex(); dirLightIntensity = 1.3;
    ambientColor = c(hue + 0.55, 0.4, 0.55).getHex(); ambientIntensity = 0.7;
    sunDirection = new THREE.Vector3(0.3, 0.55, 0.35);
  } else {                     // luminous twilight
    topColor = c(hue, 0.5, 0.42); bottomColor = c(hue + 0.12, 0.55, 0.66);
    sunColor = c(hue + 0.1, 0.55, 0.82); sunIntensity = 1.5;
    dirLightColor = 0xfff0e0; dirLightIntensity = 1.35;
    ambientColor = c(hue, 0.35, 0.58).getHex(); ambientIntensity = 0.68;
    sunDirection = new THREE.Vector3(0.5, 0.8, 0.1);
  }

  return {
    topColor, bottomColor, sunColor, sunDirection, sunIntensity,
    fogColor: bottomColor.clone(),
    ambientColor, ambientIntensity,
    dirLightColor, dirLightIntensity
  };
}

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
    // Known hand-authored presets (Dimensions 1–4) use their tuned palette;
    // anything else (the infinite generated dimensions) gets a unique
    // procedurally-derived sky instead of defaulting to backyard blue.
    const p = SKY_PRESETS[presetName] || proceduralSkyPreset(presetName);

    // Brightness floor: lift any sky color / light that is too dark, so birds
    // stay visible in every level (and generated dimensions get a bright sky).
    const lift = (color, minL) => {
      const c = (color && color.isColor) ? color.clone() : new THREE.Color(color);
      const hsl = {}; c.getHSL(hsl);
      if (hsl.l < minL) c.setHSL(hsl.h, hsl.s, minL);
      return c;
    };

    this.skyMat.uniforms.uTopColor.value.copy(lift(p.topColor, 0.42));
    this.skyMat.uniforms.uBottomColor.value.copy(lift(p.bottomColor, 0.48));
    this.skyMat.uniforms.uSunColor.value.copy(p.sunColor);
    this.skyMat.uniforms.uSunDirection.value.copy(p.sunDirection);
    this.skyMat.uniforms.uSunIntensity.value = Math.max(p.sunIntensity, 1.0);

    this.scene.fog = new THREE.FogExp2(lift(p.fogColor, 0.42), 0.008);

    this.ambientLight.color.copy(lift(p.ambientColor, 0.5));
    this.ambientLight.intensity = Math.max(p.ambientIntensity, 0.8);

    this.dirLight.color.setHex(p.dirLightColor);
    this.dirLight.intensity = Math.max(p.dirLightIntensity, 1.2);

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
