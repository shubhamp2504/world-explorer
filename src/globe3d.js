import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';

const TEXTURES = {
  day: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_day_4096.jpg',
  night: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_night_4096.jpg',
  normal: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
  specular: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
  clouds: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png',
  moon: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/moon_1024.jpg',
  moonBump: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/moonbump1k.jpg',
  mercury: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/mercurymap.jpg',
  mercuryBump: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/mercurybump.jpg',
  venus: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/venusmap.jpg',
  venusBump: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/venusbump.jpg',
  mars: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/marsmap1k.jpg',
  marsBump: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/marsbump1k.jpg',
  jupiter: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/jupitermap.jpg',
  saturn: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/saturnmap.jpg',
  saturnRing: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/saturnringcolor.jpg',
  saturnRingPattern: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/saturnringpattern.gif',
  uranus: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/uranusmap.jpg',
  neptune: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/neptunemap.jpg',
  sun: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/sunmap.jpg'
};

export class EarthGlobe3D {
  constructor(canvasContainer, onCountryClick, onHover, onPlanetClick) {
    this.container = canvasContainer;
    this.onCountryClick = onCountryClick;
    this.onHover = onHover;
    this.onPlanetClick = onPlanetClick;

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Central Sun & Solar System Groups
    this.solarSystemGroup = null;
    this.sunGroup = null;
    this.sunMesh = null;
    this.sunCorona = null;
    this.sunHalo = null;
    this.sunPointLight = null;
    this.cameraLight = null;

    this.orbitsGroup = null;
    this.asteroidBelt = null;

    // Earth System
    this.earthGroup = null;
    this.earthMesh = null;
    this.cloudsMesh = null;
    this.atmosphereMesh = null;

    this.moonGroup = null;
    this.moonMesh = null;

    // Celestial Bodies Dictionary
    this.planets = {};
    this.interactiveObjects = [];
    this.billboardLabels = [];
    this.lastOrreryState = true;

    // Active Camera Mode ('system', 'sun', 'earth', 'moon', 'mercury', etc.)
    this.activeFocusedBody = 'system';

    // Holographic targeting crosshairs
    this.targetReticleGroup = null;

    this.starfield = null;
    this.markersGroup = null;

    // Inertia & Physics Drag
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.velocityX = 0;
    this.velocityY = 0;
    this.autoRotate = true;
    this.rotationSpeed = 0.00045;

    // Pre-allocated Vector scratchpad (Zero GC thrashing)
    this._tempToSun = new THREE.Vector3();
    this._tempSide = new THREE.Vector3();
    this._tempOffset = new THREE.Vector3();
    this._targetWorldPos = new THREE.Vector3();

    // Spherical Orbit Camera System (360° inspection around any celestial body or entire system)
    this.orbitTheta = 0;           // Azimuthal angle around target (horizontal 360°)
    this.orbitPhi = Math.PI * 0.38; // Polar angle from zenith (vertical pitch)
    this.orbitRadius = 68.0;       // Distance from look-at target
    this.targetOrbitRadius = 68.0;
    this.targetOrbitTheta = 0;
    this.targetOrbitPhi = Math.PI * 0.38;

    // Camera targeting
    this.targetCameraPos = new THREE.Vector3(0, 44, 52);
    this.targetCameraLookAt = new THREE.Vector3(0, 0, 0);
    this.currentCameraLookAt = new THREE.Vector3(0, 0, 0);
    this.zoomDistance = 2.75;
    this.minZoom = 1.35;
    this.maxZoom = 95.0;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.utcMinutes = 720;
    this.textureLoader = new THREE.TextureLoader();
    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera with cinematic 45° field of view
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    this.camera.position.copy(this.targetCameraPos);
    this.camera.lookAt(this.currentCameraLookAt);

    // Camera Key Light for brilliant planetary illumination (Only 1 camera light for entire scene!)
    this.cameraLight = new THREE.DirectionalLight(0xfff8ee, 1.4);
    this.cameraLight.position.set(0, 0, 1);
    this.camera.add(this.cameraLight);
    this.scene.add(this.camera);

    // 3. High-Performance WebGL Renderer (Clean 60 FPS, PixelRatio 1.25)
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.container.appendChild(this.renderer.domElement);

    // Cinematic Post-Processing Pipeline
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const smaaPass = new SMAAPass(width * this.renderer.getPixelRatio(), height * this.renderer.getPixelRatio());
    this.composer.addPass(smaaPass);

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.75, 0.35, 0.88);
    this.composer.addPass(bloomPass);

    const filmPass = new FilmPass(0.12, false);
    this.composer.addPass(filmPass);

    // 4. Root Solar System Group
    this.solarSystemGroup = new THREE.Group();
    this.scene.add(this.solarSystemGroup);

    // 5. Starfield & Cosmic Deep Space Dust
    this.createCinematicCosmos();

    // 6. ☀️ Central Heliocentric Blazing Sun at (0, 0, 0)
    this.createCentralSun();

    // 7. Glowing Concentric Orbital Rings & Asteroid Belt
    this.createOrbitTracks();

    // 8. 🌍 Authentic Razor-Sharp Ultra-HD Earth & Orbiting Moon
    this.createUltraHDEarthSystem();

    // 9. 🪐 All Dynamic Solar System Planets
    this.createOtherPlanets();

    // 10. Interactive Holographic Beacons Layer on Earth
    this.markersGroup = new THREE.Group();
    this.earthMesh.add(this.markersGroup);

    // 11. Interactions with Inertial Physics
    this.setupInteractions();

    // 12. Start in Whole Solar System Orrery View
    this.viewWholeSolarSystem();
    // Start camera far out in deep space for cinematic intro sweep
    this.camera.position.set(0, 800, 1000);

    // 13. Render Loop
    this.animate();
  }

  createCinematicCosmos() {
    const starsCount = 3800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starsCount * 3);
    const colors = new Float32Array(starsCount * 3);
    const sizes = new Float32Array(starsCount);
    const starIndices = new Float32Array(starsCount);

    for (let i = 0; i < starsCount; i++) {
      const idx = i * 3;
      // 2 depth layers: near stars (90-150) and far faint stars (200-400)
      const isFar = Math.random() > 0.5;
      const radius = isFar ? 200 + Math.random() * 200 : 90 + Math.random() * 150;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions[idx] = radius * Math.sin(phi) * Math.cos(theta);
      positions[idx + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[idx + 2] = radius * Math.cos(phi);

      const tint = Math.random();
      if (tint > 0.85) {
        colors[idx] = 1.0; colors[idx + 1] = 0.90; colors[idx + 2] = 0.72; // Solar gold
      } else if (tint > 0.45) {
        colors[idx] = 0.70; colors[idx + 1] = 0.88; colors[idx + 2] = 1.0; // Cyan diamond
      } else {
        colors[idx] = 0.96; colors[idx + 1] = 0.98; colors[idx + 2] = 1.0; // Starlight
      }

      sizes[i] = (isFar ? 0.4 : 0.8) + Math.random() * 0.8;
      starIndices[i] = i;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('starIndex', new THREE.BufferAttribute(starIndices, 1));

    const canvas = document.createElement('canvas');
    canvas.width = 16; canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 1, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255,255,255,1.0)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.7)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    const starTex = new THREE.CanvasTexture(canvas);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        starTexture: { value: starTex }
      },
      vertexShader: `
        uniform float uTime;
        attribute float size;
        attribute float starIndex;
        varying vec3 vColor;
        varying float vTwinkle;
        void main() {
          vColor = color;
          vTwinkle = 0.6 + 0.4 * sin(uTime * 0.8 + starIndex);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z) * vTwinkle;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D starTexture;
        varying vec3 vColor;
        varying float vTwinkle;
        void main() {
          vec4 texColor = texture2D(starTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor * texColor.rgb, texColor.a * vTwinkle * 0.92);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    this.starfield = new THREE.Points(geometry, material);
    this.scene.add(this.starfield);

    const cosmicAmbient = new THREE.AmbientLight(0x283854, 1.25);
    this.scene.add(cosmicAmbient);
  }

  // ☀️ CENTRAL HELIOCENTRIC SUN AT (0, 0, 0)
  createCentralSun() {
    this.sunGroup = new THREE.Group();
    this.sunGroup.position.set(0, 0, 0);
    this.solarSystemGroup.add(this.sunGroup);

    const sunTexture = this.textureLoader.load(TEXTURES.sun);
    sunTexture.colorSpace = THREE.SRGBColorSpace;
    sunTexture.wrapS = THREE.RepeatWrapping;
    sunTexture.wrapT = THREE.RepeatWrapping;

    // 1. Photorealistic Turbulent Solar Convection Core Shader
    const sunGeom = new THREE.SphereGeometry(1.42, 64, 64);
    const sunMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        sunMap: { value: sunTexture }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vPosition;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-mvPos.xyz);
          vPosition = position;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform sampler2D sunMap;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vPosition;

        // 3D Simplex-style procedural noise for solar granulation
        float hash(vec3 p) {
          p = fract(p * 0.3183099 + 0.1);
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }

        float noise(vec3 x) {
          vec3 p = floor(x);
          vec3 w = fract(x);
          vec3 u = w * w * (3.0 - 2.0 * w);
          return mix(
            mix(mix(hash(p + vec3(0,0,0)), hash(p + vec3(1,0,0)), u.x),
                mix(hash(p + vec3(0,1,0)), hash(p + vec3(1,1,0)), u.x), u.y),
            mix(mix(hash(p + vec3(0,0,1)), hash(p + vec3(1,0,1)), u.x),
                mix(hash(p + vec3(0,1,1)), hash(p + vec3(1,1,1)), u.x), u.y), u.z);
        }

        float fbm(vec3 p) {
          float f = 0.0;
          f += 0.5000 * noise(p); p *= 2.02;
          f += 0.2500 * noise(p); p *= 2.03;
          f += 0.1250 * noise(p); p *= 2.01;
          f += 0.0625 * noise(p);
          return f;
        }

        void main() {
          // Flowing convection coordinates with differential rotation
          vec2 uvFlow1 = vUv + vec2(uTime * 0.012, uTime * 0.005);
          vec2 uvFlow2 = vUv + vec2(-uTime * 0.008, uTime * 0.009);

          vec4 tex1 = texture2D(sunMap, uvFlow1);
          vec4 tex2 = texture2D(sunMap, uvFlow2);
          vec3 baseTex = mix(tex1.rgb, tex2.rgb, 0.5);

          // Dynamic solar granulation & sunspots
          vec3 noisePos = vPosition * 4.2 + vec3(uTime * 0.15, uTime * 0.10, -uTime * 0.12);
          float granulation = fbm(noisePos);

          // Solar flares & turbulent bursts
          vec3 flarePos = vPosition * 8.5 + vec3(-uTime * 0.35, uTime * 0.25, uTime * 0.2);
          float flares = fbm(flarePos);

          // Limb darkening & brilliant incandescent core
          float NdotV = max(dot(vNormal, vViewDir), 0.0);
          float limbDarkening = 0.45 + 0.55 * pow(NdotV, 0.7);

          // Solar color palette: Deep magnetic orange -> Vibrant amber -> Golden plasma -> Radiant filaments
          vec3 sunspots = vec3(0.28, 0.05, 0.0) * pow(baseTex, vec3(1.4));
          vec3 convectiveAmber = vec3(0.92, 0.38, 0.02) * (baseTex * 0.9 + granulation * 0.4);
          vec3 goldenPlasma = vec3(1.0, 0.72, 0.12) * (1.0 + flares * 0.35);
          vec3 brightGranules = vec3(1.0, 0.92, 0.65);

          vec3 surfaceColor = mix(sunspots, convectiveAmber, smoothstep(0.12, 0.48, granulation));
          surfaceColor = mix(surfaceColor, goldenPlasma, smoothstep(0.45, 0.82, granulation));
          surfaceColor = mix(surfaceColor, brightGranules, pow(flares, 3.0) * 0.45);

          // Fiery chromospheric limb prominence
          float rim = 1.0 - NdotV;
          vec3 prominenceColor = vec3(1.0, 0.28, 0.02) * pow(rim, 2.0) * 1.5;

          vec3 finalColor = (surfaceColor * limbDarkening) + prominenceColor;
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });
    this.sunMesh = new THREE.Mesh(sunGeom, sunMat);
    this.sunMesh.userData = { celestialId: 'sun' };
    this.sunGroup.add(this.sunMesh);
    this.interactiveObjects.push(this.sunMesh);

    // 2. Animated Radiant Chromosphere Atmosphere Envelope
    const chromoGeom = new THREE.SphereGeometry(1.48, 48, 48);
    const chromoMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-mvPos.xyz);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          float rim = 1.0 - max(dot(vNormal, vViewDir), 0.0);
          float pulse = 0.88 + 0.12 * sin(uTime * 2.5);
          float intensity = pow(rim, 3.2) * pulse;
          vec3 fieryRim = mix(vec3(1.0, 0.35, 0.05), vec3(1.0, 0.75, 0.2), rim);
          gl_FragColor = vec4(fieryRim * intensity * 1.4, intensity);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });
    this.sunChromosphere = new THREE.Mesh(chromoGeom, chromoMat);
    this.sunGroup.add(this.sunChromosphere);

    // 3. Multi-Ray Solar Corona Flare Sprite with organic filaments
    const coronaTex = this.createSolarCoronaTexture();
    const coronaMat = new THREE.SpriteMaterial({
      map: coronaTex,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.82
    });
    this.sunCorona = new THREE.Sprite(coronaMat);
    this.sunCorona.scale.set(6.2, 6.2, 1);
    this.sunGroup.add(this.sunCorona);

    // 4. Secondary Prominence Solar Flare Rays Sprite (Rotates independently)
    const flareRayTex = this.createSolarFlareRaysTexture();
    const flareRayMat = new THREE.SpriteMaterial({
      map: flareRayTex,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.65
    });
    this.sunFlareRays = new THREE.Sprite(flareRayMat);
    this.sunFlareRays.scale.set(8.5, 8.5, 1);
    this.sunGroup.add(this.sunFlareRays);

    // 5. Outer Solar Diffraction Halo
    const haloTex = this.createSolarDiffractionHalo();
    const haloMat = new THREE.SpriteMaterial({
      map: haloTex,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.40
    });
    this.sunHalo = new THREE.Sprite(haloMat);
    this.sunHalo.scale.set(13.0, 13.0, 1);
    this.sunGroup.add(this.sunHalo);

    // 6. Central Omnidirectional Solar PointLight with uniform astronomical reach
    this.sunPointLight = new THREE.PointLight(0xfff8ee, 3.8, 0, 0);
    this.sunPointLight.position.set(0, 0, 0);
    this.sunGroup.add(this.sunPointLight);

    // Floating Billboard HUD Label
    const sunLabel = this.createBillboardLabel('☀️ Sun', '#f59e0b', 0.42);
    sunLabel.position.set(0, 2.1, 0);
    sunLabel.userData = { celestialId: 'sun' };
    this.sunGroup.add(sunLabel);
    this.billboardLabels.push(sunLabel);
    this.interactiveObjects.push(sunLabel);
  }

  createSolarCoronaTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 256);
    grad.addColorStop(0, 'rgba(255, 240, 200, 1.0)');
    grad.addColorStop(0.10, 'rgba(255, 190, 80, 0.90)');
    grad.addColorStop(0.24, 'rgba(255, 130, 25, 0.55)');
    grad.addColorStop(0.45, 'rgba(235, 75, 10, 0.22)');
    grad.addColorStop(0.70, 'rgba(180, 35, 0, 0.06)');
    grad.addColorStop(0.90, 'rgba(120, 20, 0, 0.015)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  createSolarFlareRaysTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const cx = 256;
    const cy = 256;

    // Generate 24 dynamic prominence spike filaments radiating outward
    ctx.save();
    ctx.translate(cx, cy);

    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2 + (Math.sin(i * 3) * 0.08);
      const length = 160 + (i % 3 === 0 ? 80 : (i % 2 === 0 ? 50 : 25));
      const width = (i % 3 === 0 ? 14 : 7);

      ctx.save();
      ctx.rotate(angle);

      const rayGrad = ctx.createLinearGradient(0, 0, length, 0);
      rayGrad.addColorStop(0, 'rgba(255, 215, 120, 0.65)');
      rayGrad.addColorStop(0.3, 'rgba(255, 140, 30, 0.40)');
      rayGrad.addColorStop(0.7, 'rgba(240, 70, 5, 0.15)');
      rayGrad.addColorStop(1.0, 'rgba(180, 30, 0, 0.0)');

      ctx.fillStyle = rayGrad;
      ctx.beginPath();
      ctx.moveTo(35, -width / 2);
      ctx.lineTo(length, 0);
      ctx.lineTo(35, width / 2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();

    // Soft core blend
    const innerGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 140);
    innerGrad.addColorStop(0, 'rgba(255, 235, 180, 0.7)');
    innerGrad.addColorStop(0.5, 'rgba(255, 120, 20, 0.3)');
    innerGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = innerGrad;
    ctx.fillRect(0, 0, 512, 512);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  createSolarDiffractionHalo() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(128, 128, 45, 128, 128, 120);
    grad.addColorStop(0, 'rgba(255, 210, 100, 0)');
    grad.addColorStop(0.45, 'rgba(255, 225, 140, 0.14)');
    grad.addColorStop(0.85, 'rgba(255, 190, 80, 0.04)');
    grad.addColorStop(1.0, 'rgba(255, 180, 50, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // 🪐 CONCENTRIC ORBITAL RINGS & ASTEROID BELT
  createOrbitTracks() {
    this.orbitsGroup = new THREE.Group();
    this.solarSystemGroup.add(this.orbitsGroup);
    this.orbitLines = {};

    const orbitRadii = [
      { id: 'mercury', r: 4.2,  col: 0x94a3b8 },
      { id: 'venus',   r: 6.8,  col: 0xfde047 },
      { id: 'earth',   r: 9.8,  col: 0x38bdf8 },
      { id: 'mars',    r: 13.2, col: 0xf87171 },
      { id: 'jupiter', r: 20.0, col: 0xfb923c },
      { id: 'saturn',  r: 26.0, col: 0xfef08a },
      { id: 'uranus',  r: 31.5, col: 0xa5f3fc },
      { id: 'neptune', r: 36.5, col: 0x60a5fa }
    ];

    orbitRadii.forEach(o => {
      const pts = [];
      const segs = 96;
      for (let i = 0; i <= segs; i++) {
        const theta = (i / segs) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(theta) * o.r, 0, Math.sin(theta) * o.r));
      }
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: o.col,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending
      });
      const orbitLine = new THREE.Line(geom, mat);
      orbitLine.userData = { planetId: o.id };
      this.orbitLines[o.id] = orbitLine;
      this.orbitsGroup.add(orbitLine);
    });

    // Asteroid Belt: 500 fine stardust particles between Mars (13.2) and Jupiter (20.0)
    const asteroidCount = 500;
    const asteroidGeom = new THREE.BufferGeometry();
    const asteroidPositions = new Float32Array(asteroidCount * 3);
    for (let i = 0; i < asteroidCount; i++) {
      const idx = i * 3;
      const r = 15.2 + Math.random() * 2.6;
      const theta = Math.random() * Math.PI * 2;
      const yOffset = (Math.random() - 0.5) * 0.45;
      asteroidPositions[idx] = Math.cos(theta) * r;
      asteroidPositions[idx + 1] = yOffset;
      asteroidPositions[idx + 2] = Math.sin(theta) * r;
    }
    asteroidGeom.setAttribute('position', new THREE.BufferAttribute(asteroidPositions, 3));
    const asteroidMat = new THREE.PointsMaterial({
      color: 0xd4d4d8,
      size: 0.05,
      transparent: true,
      opacity: 0.70
    });
    this.asteroidBelt = new THREE.Points(asteroidGeom, asteroidMat);
    this.solarSystemGroup.add(this.asteroidBelt);
  }

  // 🌍 AUTHENTIC RAZOR-SHARP ULTRA-HD EARTH ENGINE
  createUltraHDEarthSystem() {
    const maxAniso = this.renderer ? Math.min(this.renderer.capabilities.getMaxAnisotropy(), 8) : 4;

    const dayTex = this.textureLoader.load(TEXTURES.day);
    dayTex.colorSpace = THREE.SRGBColorSpace;
    dayTex.anisotropy = maxAniso;
    dayTex.minFilter = THREE.LinearMipmapLinearFilter;
    dayTex.generateMipmaps = true;

    const nightTex = this.textureLoader.load(TEXTURES.night);
    nightTex.colorSpace = THREE.SRGBColorSpace;
    nightTex.anisotropy = maxAniso;
    nightTex.minFilter = THREE.LinearMipmapLinearFilter;
    nightTex.generateMipmaps = true;

    const specularTex = this.textureLoader.load(TEXTURES.specular);
    specularTex.anisotropy = maxAniso;

    const cloudsTex = this.textureLoader.load(TEXTURES.clouds);
    cloudsTex.colorSpace = THREE.SRGBColorSpace;
    cloudsTex.anisotropy = maxAniso;

    // Earth Orbit Anchor Group
    this.earthGroup = new THREE.Group();
    this.earthGroup.position.set(9.8, 0, 0);
    this.earthGroup.userData = { celestialId: 'earth' };
    this.solarSystemGroup.add(this.earthGroup);

    // Optimized 80x80 Sphere Geometry (Smooth, razor-sharp, lightweight)
    const earthGeometry = new THREE.SphereGeometry(1.0, 80, 80);
    const earthMaterial = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayTex },
        nightTexture: { value: nightTex },
        specularTexture: { value: specularTex },
        sunWorldPosition: { value: new THREE.Vector3(0, 0, 0) },
        cameraWorldPosition: { value: this.camera.position },
        uTime: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;

        void main() {
          vUv = uv;
          vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform sampler2D specularTexture;
        uniform vec3 sunWorldPosition;
        uniform vec3 cameraWorldPosition;
        uniform float uTime;

        varying vec2 vUv;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;

        void main() {
          vec3 N = normalize(vWorldNormal);
          vec3 sunDir = normalize(sunWorldPosition - vWorldPosition);
          vec3 viewDir = normalize(cameraWorldPosition - vWorldPosition);

          // Physical Sunlight Incident Angle
          float sunDot = dot(N, sunDir);

          // Clean, smooth physical day-to-night cosine transition (NO artificial orange stripe)
          float dayFactor = smoothstep(-0.04, 0.10, sunDot);

          // Sample Authentic NASA Blue Marble Textures
          vec4 dayColor = texture2D(dayTexture, vUv);
          vec4 nightColor = texture2D(nightTexture, vUv);
          float specularMask = texture2D(specularTexture, vUv).r;

          // 1. Crystal-Clear Natural Terrain & Deep Sapphire Oceans
          vec3 crispDay = pow(dayColor.rgb, vec3(1.02));
          crispDay = mix(crispDay, crispDay * vec3(0.86, 0.96, 1.10), specularMask * 0.35);

          // 2. Realistic Ocean Specular Sheen (Tight physical reflection, ZERO giant blown-out light spot)
          vec3 halfVector = normalize(sunDir + viewDir);
          float NdotH = max(dot(N, halfVector), 0.0);
          float subtleGlint = pow(NdotH, 160.0) * specularMask * 0.32 * dayFactor;
          vec3 litDay = crispDay + vec3(0.92, 0.96, 1.0) * subtleGlint;

          // 3. Crisp Golden Night City Lights & Deep Cosmic Velvet Oceans
          float nightLum = max(max(nightColor.r, nightColor.g), nightColor.b);
          vec3 cityLights = vec3(1.0, 0.88, 0.58) * pow(nightLum, 1.25) * 3.8;
          vec3 nightTerrain = dayColor.rgb * vec3(0.015, 0.03, 0.08);
          vec3 darkNight = nightTerrain + cityLights;

          // 4. Natural Physical Blend from Daylight to Night
          vec3 finalSurface = mix(darkNight, litDay, dayFactor);

          // 5. Authentic Atmospheric Rayleigh Blue Rim (Thin, delicate horizon line)
          float fresnel = 1.0 - max(dot(N, viewDir), 0.0);
          float atmosphericGlow = pow(fresnel, 4.0) * (dayFactor * 0.65 + 0.15);
          vec3 atmosphereLimb = vec3(0.28, 0.68, 1.0) * atmosphericGlow * 0.80;

          gl_FragColor = vec4(finalSurface + atmosphereLimb, 1.0);
        }
      `
    });

    this.earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    this.earthMesh.rotation.y = -Math.PI / 2;
    this.earthMesh.userData = { celestialId: 'earth' };
    this.earthGroup.add(this.earthMesh);
    this.interactiveObjects.push(this.earthMesh);

    // Delicate Wispy Cloud Layer (48x48)
    const cloudsGeom = new THREE.SphereGeometry(1.006, 48, 48);
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudsTex,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      roughness: 0.95
    });
    this.cloudsMesh = new THREE.Mesh(cloudsGeom, cloudsMat);
    this.cloudsMesh.rotation.y = -Math.PI / 2;
    this.earthGroup.add(this.cloudsMesh);

    // Thin, delicate atmospheric shell hugging Earth (36x36)
    const atmoGeom = new THREE.SphereGeometry(1.018, 36, 36);
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.2);
          gl_FragColor = vec4(0.28, 0.72, 1.0, 1.0) * intensity * 0.70;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    this.atmosphereMesh = new THREE.Mesh(atmoGeom, atmoMat);
    this.earthGroup.add(this.atmosphereMesh);

    // 🌙 Real Orbiting 3D Moon
    this.moonGroup = new THREE.Group();
    this.moonGroup.position.set(1.5, 0.25, 0);
    this.moonGroup.userData = { celestialId: 'moon' };
    this.earthGroup.add(this.moonGroup);

    const moonTex = this.textureLoader.load(TEXTURES.moon);
    moonTex.colorSpace = THREE.SRGBColorSpace;
    const moonBump = this.textureLoader.load(TEXTURES.moonBump);
    const moonGeom = new THREE.SphereGeometry(0.24, 36, 36);
    const moonMat = new THREE.MeshStandardMaterial({
      map: moonTex,
      bumpMap: moonBump,
      bumpScale: 0.02,
      roughness: 0.90,
      metalness: 0.02
    });
    this.moonMesh = new THREE.Mesh(moonGeom, moonMat);
    this.moonMesh.userData = { celestialId: 'moon' };
    this.moonGroup.add(this.moonMesh);
    this.interactiveObjects.push(this.moonMesh);

    // Billboard Labels for Earth & Moon
    const earthLabel = this.createBillboardLabel('🌍 Earth', '#38bdf8', 0.38);
    earthLabel.position.set(0, 1.55, 0);
    earthLabel.userData = { celestialId: 'earth' };
    this.earthGroup.add(earthLabel);
    this.billboardLabels.push(earthLabel);
    this.interactiveObjects.push(earthLabel);

    const moonLabel = this.createBillboardLabel('🌕 Moon', '#cbd5e1', 0.28);
    moonLabel.position.set(0, 0.45, 0);
    moonLabel.userData = { celestialId: 'moon' };
    this.moonGroup.add(moonLabel);
    this.billboardLabels.push(moonLabel);
    this.interactiveObjects.push(moonLabel);

    this.planets['earth'] = {
      id: 'earth',
      group: this.earthGroup,
      mesh: this.earthMesh,
      atmoMesh: this.atmosphereMesh,
      cloudsMesh: this.cloudsMesh,
      radius: 1.0,
      orbitR: 9.8,
      orbitSpeed: 0.011,
      angle: 0.0,
      rotSpeed: 0.00045
    };

    this.planets['moon'] = {
      id: 'moon',
      group: this.moonGroup,
      mesh: this.moonMesh,
      radius: 0.24,
      orbitR: 1.5,
      orbitSpeed: 0.038,
      angle: 1.2,
      rotSpeed: 0.0002
    };
  }

  // 🪐 OTHER SOLAR SYSTEM PLANETS
  createOtherPlanets() {
    const planetDefs = [
      { id: 'mercury', name: '☿ Mercury', r: 4.2,  radius: 0.28, tex: TEXTURES.mercury, bump: TEXTURES.mercuryBump, bumpScale: 0.025, speed: 0.024, rot: 0.002, col: '#94a3b8', atmoCol: [0.6, 0.6, 0.7] },
      { id: 'venus',   name: '♀ Venus',   r: 6.8,  radius: 0.42, tex: TEXTURES.venus,   bump: TEXTURES.venusBump,   bumpScale: 0.018, speed: 0.016, rot: -0.001, col: '#fde047', atmoCol: [1.0, 0.85, 0.4] },
      { id: 'mars',    name: '♂ Mars',    r: 13.2, radius: 0.35, tex: TEXTURES.mars,    bump: TEXTURES.marsBump,    bumpScale: 0.035, speed: 0.009, rot: 0.003, col: '#f87171', atmoCol: [1.0, 0.4, 0.2] },
      { id: 'jupiter', name: '♃ Jupiter', r: 20.0, radius: 1.35, tex: TEXTURES.jupiter, speed: 0.005, rot: 0.006, col: '#fb923c', atmoCol: [1.0, 0.7, 0.3] },
      { id: 'saturn',  name: '♄ Saturn',  r: 26.0, radius: 1.10, tex: TEXTURES.saturn,  ringTex: TEXTURES.saturnRing, ringPattern: TEXTURES.saturnRingPattern, speed: 0.0038, rot: 0.005, col: '#fef08a', atmoCol: [1.0, 0.9, 0.5] },
      { id: 'uranus',  name: '♅ Uranus',  r: 31.5, radius: 0.72, tex: TEXTURES.uranus,  speed: 0.0026, rot: 0.003, col: '#a5f3fc', atmoCol: [0.5, 0.9, 1.0] },
      { id: 'neptune', name: '♆ Neptune', r: 36.5, radius: 0.68, tex: TEXTURES.neptune, speed: 0.0020, rot: 0.0032, col: '#60a5fa', atmoCol: [0.3, 0.5, 1.0] }
    ];

    planetDefs.forEach((p, index) => {
      const group = new THREE.Group();
      const initialAngle = (index + 1) * 0.85;
      group.position.set(Math.cos(initialAngle) * p.r, 0, Math.sin(initialAngle) * p.r);
      group.userData = { celestialId: p.id };
      this.solarSystemGroup.add(group);

      const tex = this.textureLoader.load(p.tex);
      tex.colorSpace = THREE.SRGBColorSpace;

      const matConfig = {
        map: tex,
        roughness: 0.78,
        metalness: 0.08
      };
      if (p.bump) {
        matConfig.bumpMap = this.textureLoader.load(p.bump);
        matConfig.bumpScale = p.bumpScale || 0.02;
      }

      const geom = new THREE.SphereGeometry(p.radius, 48, 48);
      const mat = new THREE.MeshStandardMaterial(matConfig);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.userData = { celestialId: p.id };
      group.add(mesh);
      this.interactiveObjects.push(mesh);

      // Atmosphere
      const pAtmoGeom = new THREE.SphereGeometry(p.radius * 1.04, 36, 36);
      const pAtmoMat = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Vector3(p.atmoCol[0], p.atmoCol[1], p.atmoCol[2]) }
        },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          varying vec3 vNormal;
          void main() {
            float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.2);
            gl_FragColor = vec4(uColor, 1.0) * intensity * 0.70;
          }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
      });
      const pAtmoMesh = new THREE.Mesh(pAtmoGeom, pAtmoMat);
      group.add(pAtmoMesh);

      let ringMesh = null;
      if (p.ringTex) {
        const ringGeom = new THREE.RingGeometry(p.radius * 1.35, p.radius * 2.45, 64);
        ringGeom.rotateX(Math.PI / 2);
        const ringT = this.textureLoader.load(p.ringTex);
        ringT.colorSpace = THREE.SRGBColorSpace;
        const ringAlphaT = p.ringPattern ? this.textureLoader.load(p.ringPattern) : null;

        const ringMat = new THREE.ShaderMaterial({
          uniforms: {
            ringMap: { value: ringT },
            ringAlphaMap: { value: ringAlphaT }
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform sampler2D ringMap;
            uniform sampler2D ringAlphaMap;
            varying vec2 vUv;
            void main() {
              vec4 texColor = texture2D(ringMap, vUv);
              float ringAlpha = texture2D(ringAlphaMap, vUv).r;
              float edgeFalloff = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.92, vUv.y);
              float finalAlpha = texColor.a * (0.4 + 0.6 * ringAlpha) * edgeFalloff;
              gl_FragColor = vec4(texColor.rgb * 1.15, finalAlpha * 0.95);
            }
          `,
          side: THREE.DoubleSide,
          transparent: true,
          depthWrite: false
        });
        ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.rotation.z = 0.465; // Authentic 26.7° axial tilt
        group.add(ringMesh);
      }

      // Billboard HUD Label
      const label = this.createBillboardLabel(p.name, p.col, 0.34);
      label.position.set(0, p.radius * 1.5 + 0.35, 0);
      label.userData = { celestialId: p.id };
      group.add(label);
      this.billboardLabels.push(label);
      this.interactiveObjects.push(label);

      this.planets[p.id] = {
        id: p.id,
        group,
        mesh,
        atmoMesh: pAtmoMesh,
        ringMesh: ringMesh,
        radius: p.radius,
        orbitR: p.r,
        orbitSpeed: p.speed,
        angle: initialAngle,
        rotSpeed: p.rot
      };
    });

    this.planetsList = Object.values(this.planets);
  }

  // Sleek Glassmorphic Floating HUD Label
  createBillboardLabel(text, color = '#38bdf8', scale = 0.35) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Rounded Pill Glass Background
    ctx.fillStyle = 'rgba(10, 18, 38, 0.88)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(4, 4, 248, 56, 28);
    ctx.fill();
    ctx.stroke();

    // Text Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 33);

    const labelTex = new THREE.CanvasTexture(canvas);
    const labelMat = new THREE.SpriteMaterial({
      map: labelTex,
      transparent: true,
      depthTest: false
    });
    const sprite = new THREE.Sprite(labelMat);
    sprite.scale.set(scale * 3.8, scale * 0.95, 1);
    return sprite;
  }

  // 🎯 HOLOGRAPHIC TARGETING CROSSHAIRS (NO UGLY BLOBS)
  setTargetCountry(lat, lng, name = '', flag = '') {
    if (this.targetReticleGroup) {
      this.earthMesh.remove(this.targetReticleGroup);
      this.targetReticleGroup = null;
    }

    if (lat === undefined || lng === undefined) return;

    this.targetReticleGroup = new THREE.Group();
    const pos = this.latLngToVector3(lat, lng, 1.002);
    const normal = pos.clone().normalize();
    this.targetReticleGroup.position.copy(pos);

    // 1. Sleek glowing cyan ring
    const ringGeom = new THREE.RingGeometry(0.016, 0.024, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    this.targetReticleGroup.add(ringMesh);

    // 2. Inner pulsating target dot
    const dotGeom = new THREE.CircleGeometry(0.007, 16);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const dotMesh = new THREE.Mesh(dotGeom, dotMat);
    dotMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    this.targetReticleGroup.add(dotMesh);

    // 3. Delicate holographic pointer needle
    const needleGeom = new THREE.CylinderGeometry(0.0015, 0.0015, 0.07, 6);
    const needleMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85
    });
    const needleMesh = new THREE.Mesh(needleGeom, needleMat);
    needleMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    needleMesh.position.addScaledVector(normal, 0.035);
    this.targetReticleGroup.add(needleMesh);

    // 4. Clean Canvas Label at top of needle (Flag & Name)
    if (name) {
      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(4, 4, 248, 56, 28);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${flag} ${name}`.slice(0, 18), 128, 32);

      const labelTex = new THREE.CanvasTexture(canvas);
      const labelMat = new THREE.SpriteMaterial({ map: labelTex, transparent: true, depthTest: false });
      const labelSprite = new THREE.Sprite(labelMat);
      labelSprite.position.addScaledVector(normal, 0.095);
      labelSprite.scale.set(0.24, 0.06, 1);
      this.targetReticleGroup.add(labelSprite);
    }

    this.earthMesh.add(this.targetReticleGroup);
  }

  clearTargetCountry() {
    if (this.targetReticleGroup) {
      this.earthMesh.remove(this.targetReticleGroup);
      this.targetReticleGroup = null;
    }
  }

  // 🌌 WHOLE SOLAR SYSTEM IN ONE SINGLE FRAME
  viewWholeSolarSystem() {
    this.activeFocusedBody = 'system';
    this.autoRotate = false;
    this.targetCameraLookAt.set(0, 0, 0);
    this.targetOrbitRadius = 52.0;
    this.targetOrbitPhi = 0.72; // Elevated 42° pitch
    this.targetOrbitTheta = 0.0;
    this.updateVisibility(true);
  }

  focusPlanet(planetId = 'system') {
    if (planetId === 'system') {
      this.viewWholeSolarSystem();
      return;
    }

    this.activeFocusedBody = planetId;
    this.updateVisibility(false);

    if (planetId === 'sun') {
      this.autoRotate = false;
      this.targetCameraLookAt.set(0, 0, 0);
      this.targetOrbitRadius = 5.5;
      this.targetOrbitPhi = Math.PI * 0.45;
    } else if (planetId === 'earth') {
      this.autoRotate = true;
      const ePos = this.earthGroup.position;
      this.targetCameraLookAt.copy(ePos);
      this.targetOrbitRadius = this.zoomDistance;
      this.targetOrbitPhi = Math.PI * 0.42;
    } else if (planetId === 'moon') {
      this.autoRotate = false;
      const mPos = new THREE.Vector3();
      this.moonGroup.getWorldPosition(mPos);
      this.targetCameraLookAt.copy(mPos);
      this.targetOrbitRadius = 0.88;
      this.targetOrbitPhi = Math.PI * 0.45;
    } else if (this.planets[planetId]) {
      this.autoRotate = false;
      const p = this.planets[planetId];
      const pPos = p.group.position;
      this.targetCameraLookAt.copy(pPos);
      const camDist = Math.max(2.2, p.radius * 3.4);
      this.targetOrbitRadius = camDist;
      this.targetOrbitPhi = Math.PI * 0.42;
    }
  }

  updateVisibility(isOrrery) {
    if (isOrrery === this.lastOrreryState) return;
    this.lastOrreryState = isOrrery;

    if (this.billboardLabels) {
      this.billboardLabels.forEach(l => { l.visible = isOrrery; });
    }
    if (this.asteroidBelt) {
      this.asteroidBelt.visible = isOrrery;
    }
    if (this.orbitsGroup) {
      this.orbitsGroup.children.forEach(line => {
        if (line.material) line.material.opacity = isOrrery ? 0.35 : 0.08;
      });
    }
  }

  focusTarget(targetType = 'system') {
    this.focusPlanet(targetType);
  }

  zoomBy(factor) {
    if (this.activeFocusedBody === 'system') {
      this.targetOrbitRadius = Math.max(20.0, Math.min(150.0, this.targetOrbitRadius * factor));
    } else if (this.activeFocusedBody === 'sun') {
      this.targetOrbitRadius = Math.max(2.2, Math.min(18.0, this.targetOrbitRadius * factor));
    } else if (this.activeFocusedBody === 'earth') {
      this.zoomDistance = Math.max(this.minZoom, Math.min(8.0, this.zoomDistance * factor));
      this.targetOrbitRadius = this.zoomDistance;
    } else if (this.activeFocusedBody === 'moon') {
      this.targetOrbitRadius = Math.max(0.45, Math.min(3.2, this.targetOrbitRadius * factor));
    } else if (this.planets[this.activeFocusedBody]) {
      const p = this.planets[this.activeFocusedBody];
      const minPZoom = Math.max(1.2, p.radius * 1.5);
      const maxPZoom = Math.max(8.0, p.radius * 12.0);
      this.targetOrbitRadius = Math.max(minPZoom, Math.min(maxPZoom, this.targetOrbitRadius * factor));
    }
  }

  resetView() {
    this.viewWholeSolarSystem();
  }

  setUtcTime(minutes) {
    this.utcMinutes = minutes;
    if (this.earthMesh) {
      const utcAngle = (minutes / 1440) * Math.PI * 2;
      this.earthMesh.rotation.y = -Math.PI / 2 + utcAngle;
    }
  }

  setMarkers(markerList, type = 'favorite') {
    while (this.markersGroup.children.length > 0) {
      const obj = this.markersGroup.children[0];
      this.markersGroup.remove(obj);
    }

    if (!markerList || markerList.length === 0) return;

    markerList.forEach(item => {
      const pos = this.latLngToVector3(item.lat, item.lng, 1.002);
      const normal = pos.clone().normalize();
      const color = type === 'favorite' ? 0xfbbf24 : (item.color || 0x38bdf8);

      const beaconGroup = new THREE.Group();
      beaconGroup.position.copy(pos);
      beaconGroup.userData = { item, type };

      const beamGeom = new THREE.CylinderGeometry(0.003, 0.003, 0.08, 6);
      const beamMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
      const beamMesh = new THREE.Mesh(beamGeom, beamMat);
      beamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      beamMesh.position.addScaledVector(normal, 0.04);
      beaconGroup.add(beamMesh);

      const diamondGeom = new THREE.OctahedronGeometry(0.014, 0);
      const diamondMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const diamondMesh = new THREE.Mesh(diamondGeom, diamondMat);
      diamondMesh.position.addScaledVector(normal, 0.082);
      beaconGroup.add(diamondMesh);

      const ringGeom = new THREE.RingGeometry(0.015, 0.024, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.lookAt(normal.clone().multiplyScalar(2));
      beaconGroup.add(ringMesh);

      this.markersGroup.add(beaconGroup);
    });
  }

  clearMarkers() {
    while (this.markersGroup.children.length > 0) {
      const obj = this.markersGroup.children[0];
      this.markersGroup.remove(obj);
    }
  }

  latLngToVector3(lat, lng, radius = 1) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  }

  vector3ToLatLng(vec) {
    const norm = vec.clone().normalize();
    const lat = 90 - (Math.acos(norm.y) * 180 / Math.PI);
    const lng = ((Math.atan2(norm.z, -norm.x) * 180 / Math.PI) - 180 + 540) % 360 - 180;
    return { lat, lng };
  }

  flyTo(lat, lng, zoom = 2.5) {
    this.focusPlanet('earth');
    this.autoRotate = false;
    this.velocityX = 0;
    this.velocityY = 0;

    // Direct camera to look straight at the target latitude and longitude
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 90) * (Math.PI / 180);

    this.targetOrbitPhi = Math.max(0.12, Math.min(Math.PI - 0.12, phi));
    this.targetOrbitTheta = -theta;
    this.zoomDistance = zoom;
    this.targetOrbitRadius = zoom;
  }

  setupInteractions() {
    const dom = this.renderer.domElement;

    let mouseDownPos = { x: 0, y: 0 };

    dom.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.autoRotate = false;
      this.velocityX = 0;
      this.velocityY = 0;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
      mouseDownPos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const hits = this.raycaster.intersectObjects(this.interactiveObjects, true);
      
      let foundHoverId = null;
      if (hits.length > 0) {
        for (const hit of hits) {
          let curr = hit.object;
          while (curr && !curr.userData?.celestialId && curr !== this.solarSystemGroup) {
            curr = curr.parent;
          }
          if (curr && curr.userData?.celestialId) {
            foundHoverId = curr.userData.celestialId;
            break;
          }
        }
      }
      this.hoveredPlanetId = foundHoverId;
      dom.style.cursor = foundHoverId ? 'pointer' : 'grab';

      if (!this.isDragging) return;

      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.velocityX = deltaX * 0.0055;
      this.velocityY = deltaY * 0.0055;

      // True 360° rotational orbit control for ANY celestial body or whole system
      this.targetOrbitTheta -= this.velocityX;
      this.targetOrbitPhi = Math.max(0.08, Math.min(Math.PI - 0.08, this.targetOrbitPhi - this.velocityY));

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
      this.zoomBy(zoomFactor);
    }, { passive: false });

    dom.addEventListener('click', (e) => {
      // If user moved more than 7px, treat as drag release, NOT a country/planet click
      const dragDist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
      if (dragDist > 7) return;

      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);

      // 1. Raycast all celestial bodies and billboard labels
      const hits = this.raycaster.intersectObjects(this.interactiveObjects, true);
      if (hits.length > 0) {
        for (const hit of hits) {
          let curr = hit.object;
          while (curr && !curr.userData?.celestialId && curr !== this.solarSystemGroup) {
            curr = curr.parent;
          }
          if (curr && curr.userData?.celestialId) {
            const cid = curr.userData.celestialId;
            this.focusPlanet(cid);
            if (this.onPlanetClick) this.onPlanetClick(cid);
            return;
          }
        }
      }

      // 2. Raycast Earth surface for countries and markers
      if (this.activeFocusedBody === 'earth' && this.earthMesh) {
        const earthHits = this.raycaster.intersectObjects([this.earthMesh, ...this.markersGroup.children], true);
        if (earthHits.length > 0) {
          const hit = earthHits[0];
          let targetGroup = hit.object;
          while (targetGroup && targetGroup.parent !== this.markersGroup && targetGroup.parent !== this.earthMesh) {
            targetGroup = targetGroup.parent;
          }

          if (targetGroup && targetGroup.userData && targetGroup.userData.item) {
            if (this.onCountryClick) this.onCountryClick(targetGroup.userData.item);
            return;
          }

          const localPoint = this.earthMesh.worldToLocal(hit.point.clone());
          const { lat, lng } = this.vector3ToLatLng(localPoint);
          if (this.onHover) this.onHover(lat, lng);
        }
      }
    });

    // Touch controls with momentum
    dom.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.autoRotate = false;
        this.velocityX = 0;
        this.velocityY = 0;
        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    dom.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
      const deltaY = e.touches[0].clientY - this.previousMousePosition.y;

      this.velocityX = deltaX * 0.0055;
      this.velocityY = deltaY * 0.0055;

      this.targetOrbitTheta -= this.velocityX;
      this.targetOrbitPhi = Math.max(0.08, Math.min(Math.PI - 0.08, this.targetOrbitPhi - this.velocityY));

      this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    dom.addEventListener('touchend', () => { this.isDragging = false; });
  }

  resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (this.camera && this.renderer) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      if (this.composer) {
        this.composer.setSize(width, height);
      }
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.05);
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Pass uTime and cameraWorldPosition to Earth and Sun shaders safely
    if (this.earthMesh && this.earthMesh.material?.uniforms) {
      if (this.earthMesh.material.uniforms.uTime) {
        this.earthMesh.material.uniforms.uTime.value = elapsedTime;
      }
      if (this.earthMesh.material.uniforms.cameraWorldPosition) {
        this.earthMesh.material.uniforms.cameraWorldPosition.value.copy(this.camera.position);
      }
    }
    if (this.sunMesh && this.sunMesh.material?.uniforms?.uTime) {
      this.sunMesh.material.uniforms.uTime.value = elapsedTime;
    }
    if (this.sunChromosphere && this.sunChromosphere.material?.uniforms?.uTime) {
      this.sunChromosphere.material.uniforms.uTime.value = elapsedTime;
    }
    if (this.starfield && this.starfield.material?.uniforms?.uTime) {
      this.starfield.material.uniforms.uTime.value = elapsedTime;
    }

    ['sun', 'earth', 'moon'].forEach(id => {
      const pInfo = this.planets[id];
      if (pInfo) {
         const isHovered = (this.hoveredPlanetId === id);
         const targetScale = isHovered ? 1.08 : 1.0;
         const vec = new THREE.Vector3(targetScale, targetScale, targetScale);
         pInfo.mesh.scale.lerp(vec, 0.1);
         if (pInfo.atmoMesh) pInfo.atmoMesh.scale.lerp(vec, 0.1);
         if (pInfo.cloudsMesh) pInfo.cloudsMesh.scale.lerp(vec, 0.1);
      } else if (id === 'sun') {
         const isHovered = (this.hoveredPlanetId === id);
         const targetScale = isHovered ? 1.08 : 1.0;
         const vec = new THREE.Vector3(targetScale, targetScale, targetScale);
         if (this.sunMesh) this.sunMesh.scale.lerp(vec, 0.1);
         if (this.sunCorona) this.sunCorona.scale.lerp(new THREE.Vector3(targetScale * 6.2, targetScale * 6.2, 1), 0.1);
         if (this.sunFlareRays) this.sunFlareRays.scale.lerp(new THREE.Vector3(targetScale * 8.5, targetScale * 8.5, 1), 0.1);
      }
    });

    // 2. Dynamic Live Orbital Motion for All Planets (Fast zero-allocation loop)
    if (this.planetsList) {
      const len = this.planetsList.length;
      for (let i = 0; i < len; i++) {
        const p = this.planetsList[i];
        const isCurrentlyInspected = (this.activeFocusedBody === p.id);
        if (!isCurrentlyInspected || this.activeFocusedBody === 'system') {
          p.angle += p.orbitSpeed * delta * 2.2;
        }

        if (p.id === 'earth') {
          p.group.position.set(Math.cos(p.angle) * p.orbitR, 0, Math.sin(p.angle) * p.orbitR);
          if (this.moonGroup) {
            const m = this.planets['moon'];
            if (m) {
              m.angle += m.orbitSpeed * delta * 3.5;
              this.moonGroup.position.set(Math.cos(m.angle) * m.orbitR, 0.25 * Math.sin(m.angle), Math.sin(m.angle) * m.orbitR);
            }
          }
        } else if (p.id !== 'moon') {
          p.group.position.set(Math.cos(p.angle) * p.orbitR, 0, Math.sin(p.angle) * p.orbitR);
        }

        if (p.mesh && p.rotSpeed) {
          p.mesh.rotation.y += p.rotSpeed;
          if (p.id !== 'earth' && p.id !== 'moon') {
            const isHovered = (this.hoveredPlanetId === p.id);
            const targetScale = isHovered ? 1.08 : 1.0;
            const vec = new THREE.Vector3(targetScale, targetScale, targetScale);
            p.mesh.scale.lerp(vec, 0.1);
            if (p.atmoMesh) p.atmoMesh.scale.lerp(vec, 0.1);
            if (p.ringMesh) p.ringMesh.scale.lerp(vec, 0.1);
          }
        }
        
        if (this.orbitLines && this.lastOrreryState) {
          const orbitLine = this.orbitLines[p.id];
          if (orbitLine && orbitLine.material) {
             const isHovered = (this.hoveredPlanetId === p.id);
             orbitLine.material.opacity = isHovered ? 0.8 : 0.35;
          }
        }
      }
    }

    // Clouds drift
    if (this.cloudsMesh) {
      this.cloudsMesh.rotation.y += 0.00015;
    }

    // Sun axial rotation and corona/flare rays counter-drift
    if (this.sunMesh) {
      this.sunMesh.rotation.y += 0.0008;
    }
    if (this.sunFlareRays) {
      this.sunFlareRays.material.rotation -= 0.0005;
    }
    if (this.sunCorona) {
      this.sunCorona.material.rotation += 0.0003;
    }
    if (this.sunHalo) {
      this.sunHalo.material.rotation += 0.00015;
    }

    // Asteroid belt slow drift
    if (this.asteroidBelt && this.asteroidBelt.visible) {
      this.asteroidBelt.rotation.y += 0.00018;
    }

    // 3. Smooth momentum drag & auto rotation
    if (!this.isDragging) {
      if (Math.abs(this.velocityX) > 0.0001 || Math.abs(this.velocityY) > 0.0001) {
        this.targetOrbitTheta -= this.velocityX;
        this.targetOrbitPhi = Math.max(0.08, Math.min(Math.PI - 0.08, this.targetOrbitPhi - this.velocityY));
        this.velocityX *= 0.92;
        this.velocityY *= 0.92;
      } else if (this.autoRotate) {
        this.targetOrbitTheta += this.rotationSpeed;
      }
    }

    // 4. Smooth interpolation of spherical orbit coordinates
    const orbitEase = 1.0 - Math.exp(-6.0 * delta);
    this.orbitTheta += (this.targetOrbitTheta - this.orbitTheta) * orbitEase;
    this.orbitPhi += (this.targetOrbitPhi - this.orbitPhi) * orbitEase;
    this.orbitRadius += (this.targetOrbitRadius - this.orbitRadius) * orbitEase;

    // 5. Compute target camera look-at position based on active focused body
    if (this.activeFocusedBody === 'system' || this.activeFocusedBody === 'sun') {
      this.targetCameraLookAt.set(0, 0, 0);
    } else if (this.activeFocusedBody === 'earth') {
      this.targetCameraLookAt.copy(this.earthGroup.position);
    } else if (this.activeFocusedBody === 'moon') {
      this.moonGroup.getWorldPosition(this.targetCameraLookAt);
    } else if (this.planets[this.activeFocusedBody]) {
      this.targetCameraLookAt.copy(this.planets[this.activeFocusedBody].group.position);
    }

    // Convert spherical (orbitRadius, orbitTheta, orbitPhi) to 3D Cartesian coordinates relative to look-at
    const sinPhi = Math.sin(this.orbitPhi);
    const cosPhi = Math.cos(this.orbitPhi);
    const sinTheta = Math.sin(this.orbitTheta);
    const cosTheta = Math.cos(this.orbitTheta);

    this.targetCameraPos.set(
      this.targetCameraLookAt.x + this.orbitRadius * sinPhi * sinTheta,
      this.targetCameraLookAt.y + this.orbitRadius * cosPhi,
      this.targetCameraLookAt.z + this.orbitRadius * sinPhi * cosTheta
    );

    // Camera smoothing
    const camEase = 1.0 - Math.exp(-5.0 * delta);
    this.camera.position.lerp(this.targetCameraPos, camEase);
    this.currentCameraLookAt.lerp(this.targetCameraLookAt, camEase);
    this.camera.lookAt(this.currentCameraLookAt);

    // Keep camera key light pointed in camera forward direction
    if (this.cameraLight) {
      this.cameraLight.position.set(0, 0, 1);
    }

    // 6. Render Scene
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
