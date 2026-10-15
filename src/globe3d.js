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
  clouds: '/textures/planets/2k_earth_clouds.jpg',
  moon: '/textures/planets/2k_moon.jpg',
  mercury: '/textures/planets/2k_mercury.jpg',
  venus: '/textures/planets/2k_venus.jpg',
  mars: '/textures/planets/2k_mars.jpg',
  jupiter: '/textures/planets/2k_jupiter.jpg',
  saturn: '/textures/planets/2k_saturn.jpg',
  saturnRing: '/textures/planets/2k_saturn_rings.png',
  saturnRingAlpha: '/textures/planets/8k_saturn_ring_alpha.png',
  uranus: '/textures/planets/2k_uranus.jpg',
  neptune: '/textures/planets/2k_neptune.jpg',
  pluto: '/textures/planets/2k_pluto.jpg',
  sun: '/textures/planets/2k_sun.jpg'
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
    this.lastOrreryState = null;

    // Living Sun & CME Eruption State
    this.sunProminences = null;
    this.cmeActive = false;
    this.cmeRadius = 1.5;
    this.cmeMaxRadius = 24.0;
    this.cmeSpeed = 11.5;
    this.cmeGroup = null;
    this.cmeTorus = null;
    this.cmeParticles = null;
    this._cmeHitEarth = false;
    this.auroraIntensity = 0.0;
    this.screenShakeIntensity = 0.0;
    this.onCmeImpact = null;

    // Solar Eclipse & Totality State
    this.isEclipseActive = false;
    this.isEclipseTotality = false;
    this.totalityCorona = null;
    this.diamondRingGlint = null;
    this.onEclipseTotalityChange = null;

    // Saturn Ring Dive State
    this.saturnBoulders = null;
    this.isRingDiveActive = false;
    this.onRingDiveChange = null;

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

    this.isExternalCamera = false;
    this.externalUpdateHook = null;

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

    // Camera Key Light for brilliant planetary illumination (fill light for dark side inspection)
    this.cameraLight = new THREE.DirectionalLight(0xfff8ee, 0.75);
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
    // Start camera in elevated deep space for smooth cinematic intro sweep
    this.camera.position.set(0, 95, 120);

    // 13. Render Loop
    this.animate();
  }

  createCinematicCosmos() {
    const starsCount = 5500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starsCount * 3);
    const colors = new Float32Array(starsCount * 3);
    const sizes = new Float32Array(starsCount);
    const starIndices = new Float32Array(starsCount);

    for (let i = 0; i < starsCount; i++) {
      const idx = i * 3;
      // 3 depth layers: foreground sparkles (60-120), mid-field (120-220), and deep galactic band (220-450)
      const layer = Math.random();
      const radius = layer > 0.7 ? 60 + Math.random() * 60 : (layer > 0.3 ? 120 + Math.random() * 100 : 220 + Math.random() * 230);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions[idx] = radius * Math.sin(phi) * Math.cos(theta);
      positions[idx + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[idx + 2] = radius * Math.cos(phi);

      const tint = Math.random();
      if (tint > 0.75) {
        colors[idx] = 1.0; colors[idx + 1] = 0.95; colors[idx + 2] = 0.80; // Radiant solar gold
      } else if (tint > 0.40) {
        colors[idx] = 0.55; colors[idx + 1] = 0.85; colors[idx + 2] = 1.0; // Cyan diamond
      } else if (tint > 0.20) {
        colors[idx] = 0.85; colors[idx + 1] = 0.65; colors[idx + 2] = 1.0; // Violet starlight
      } else {
        colors[idx] = 1.0; colors[idx + 1] = 1.0; colors[idx + 2] = 1.0; // Pure white star
      }

      // Delicate, realistic stellar diamonds in deep cosmos (subtle background, not foreground blobs)
      sizes[i] = (layer > 0.7 ? 0.65 : 0.40) + Math.random() * 0.55;
      starIndices[i] = i;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('starIndex', new THREE.BufferAttribute(starIndices, 1));

    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 2, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1.0)');
    grad.addColorStop(0.35, 'rgba(224,242,254,0.85)');
    grad.addColorStop(0.7, 'rgba(56,189,248,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
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
          vTwinkle = 0.75 + 0.25 * sin(uTime * 1.2 + starIndex);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = max(1.6, size * (360.0 / -mvPosition.z)) * vTwinkle;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D starTexture;
        varying vec3 vColor;
        varying float vTwinkle;
        void main() {
          vec4 texColor = texture2D(starTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor * texColor.rgb * 1.15, texColor.a * vTwinkle * 0.85);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    this.starfield = new THREE.Points(geometry, material);
    this.scene.add(this.starfield);

    // Radiant cosmic ambient lighting across all planetary bodies (Balanced for clear feature visibility without bloom washout)
    const cosmicAmbient = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(cosmicAmbient);

    const cosmicHemisphere = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 0.45);
    this.scene.add(cosmicHemisphere);
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
    this.sunPointLight = new THREE.PointLight(0xfff8ee, 3.2, 0, 0);
    this.sunPointLight.position.set(0, 0, 0);
    this.sunGroup.add(this.sunPointLight);

    // Floating Billboard HUD Label
    const sunLabel = this.createBillboardLabel('☀️ Sun', '#f59e0b', 0.95);
    sunLabel.position.set(0, 3.2, 0);
    sunLabel.userData = { celestialId: 'sun' };
    this.sunGroup.add(sunLabel);
    this.billboardLabels.push(sunLabel);
    this.interactiveObjects.push(sunLabel);

    // 7. 3D Magnetic Prominence Plasma Loops
    this.buildSunProminences();

    // 8. Coronal Mass Ejection Shockwave System
    this.buildCmeSystem();

    // 9. Total Solar Eclipse Totality Corona & Diamond Ring
    this.buildTotalityCoronaSystem();
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

  // -------------------------------------------------------------
  // ☀️ LIVING SUN: 3D MAGNETIC PROMINENCE ARCHES & CME BLAST WAVE
  // -------------------------------------------------------------
  buildSunProminences() {
    this.sunProminences = new THREE.Group();
    this.sunProminences.name = 'SolarProminences';

    const loopCount = 6;
    const plasmaMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        baseColor: { value: new THREE.Color(1.0, 0.42, 0.08) },
        flareColor: { value: new THREE.Color(1.0, 0.88, 0.35) }
      },
      vertexShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec3 pos = position + normal * 0.02 * sin(uTime * 4.0 + position.y * 6.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 baseColor;
        uniform vec3 flareColor;
        varying vec3 vNormal;
        varying vec2 vUv;
        void main() {
          float pulse = 0.75 + 0.25 * sin(uTime * 3.5 + vUv.x * 12.0);
          float glow = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 1.8);
          vec3 col = mix(baseColor, flareColor, pulse * 0.6);
          gl_FragColor = vec4(col * 1.8, glow * 0.85);
        }
      `,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < loopCount; i++) {
      const phi = (i / loopCount) * Math.PI * 2 + Math.PI * 0.15;
      const theta = 0.35 + (i % 3) * 0.38;
      const rSun = 1.42;

      const p1 = new THREE.Vector3(
        rSun * Math.sin(theta) * Math.cos(phi),
        rSun * Math.cos(theta),
        rSun * Math.sin(theta) * Math.sin(phi)
      );

      const dPhi = 0.26 + (i % 2) * 0.14;
      const p3 = new THREE.Vector3(
        rSun * Math.sin(theta + 0.12) * Math.cos(phi + dPhi),
        rSun * Math.cos(theta + 0.12),
        rSun * Math.sin(theta + 0.12) * Math.sin(phi + dPhi)
      );

      const rPeak = rSun + 0.42 + (i % 3) * 0.24;
      const midPhi = phi + dPhi * 0.5;
      const midTheta = theta + 0.06;
      const p2 = new THREE.Vector3(
        rPeak * Math.sin(midTheta) * Math.cos(midPhi),
        rPeak * Math.cos(midTheta),
        rPeak * Math.sin(midTheta) * Math.sin(midPhi)
      );

      const curve = new THREE.QuadraticBezierCurve3(p1, p2, p3);
      const tubeGeom = new THREE.TubeGeometry(curve, 32, 0.038, 8, false);
      const tubeMesh = new THREE.Mesh(tubeGeom, plasmaMat);
      this.sunProminences.add(tubeMesh);
    }

    this.sunGroup.add(this.sunProminences);
  }

  buildCmeSystem() {
    this.cmeGroup = new THREE.Group();
    this.cmeGroup.visible = false;
    this.solarSystemGroup.add(this.cmeGroup);

    // 1. Fiery expanding plasma shockwave torus
    const torusGeom = new THREE.TorusGeometry(1.0, 0.28, 16, 64);
    const torusMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uProgress;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          float fade = 1.0 - smoothstep(0.0, 1.0, uProgress);
          vec3 plasma = mix(vec3(1.0, 0.2, 0.02), vec3(1.0, 0.85, 0.2), sin(uTime * 5.0 + vPosition.x * 4.0) * 0.5 + 0.5);
          float rim = pow(1.0 - abs(vNormal.z), 1.5);
          gl_FragColor = vec4(plasma * 2.2, rim * fade * 0.85);
        }
      `,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.cmeTorus = new THREE.Mesh(torusGeom, torusMat);
    this.cmeTorus.rotation.x = Math.PI / 2;
    this.cmeGroup.add(this.cmeTorus);

    // 2. High-energy solar wind particle spray
    const pCount = 600;
    const pPos = new Float32Array(pCount * 3);
    const pVel = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * 0.6;
      const speed = 0.8 + Math.random() * 0.5;
      pPos[i * 3] = 0;
      pPos[i * 3 + 1] = 0;
      pPos[i * 3 + 2] = 0;
      pVel[i * 3] = Math.cos(phi) * Math.cos(theta) * speed;
      pVel[i * 3 + 1] = Math.sin(phi) * speed * 0.35;
      pVel[i * 3 + 2] = Math.cos(phi) * Math.sin(theta) * speed;
    }
    const pGeom = new THREE.BufferGeometry();
    pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeom.userData = { vel: pVel };

    const pMat = new THREE.PointsMaterial({
      color: 0xffaa33,
      size: 0.16,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.85
    });
    this.cmeParticles = new THREE.Points(pGeom, pMat);
    this.cmeGroup.add(this.cmeParticles);
  }

  triggerCoronalMassEjection() {
    this.cmeActive = true;
    this.cmeRadius = 1.5;
    this.cmeGroup.visible = true;
    this._cmeHitEarth = false;

    // Reset particle positions
    const pos = this.cmeParticles.geometry.attributes.position.array;
    for (let i = 0; i < pos.length; i++) pos[i] = 0;
    this.cmeParticles.geometry.attributes.position.needsUpdate = true;
    this.cmeParticles.material.opacity = 0.95;

    // Flash solar corona briefly
    if (this.sunCorona) {
      this.sunCorona.scale.set(9.5, 9.5, 1);
    }
    this.triggerScreenShake(2.0);
  }

  triggerScreenShake(intensity = 3.0) {
    this.screenShakeIntensity = intensity;
  }

  triggerAuroralStorm() {
    this.auroraIntensity = 1.0;
  }

  // -------------------------------------------------------------
  // 🌑 TOTAL SOLAR ECLIPSE & TOTALITY GROUND EXPERIENCE
  // -------------------------------------------------------------
  buildTotalityCoronaSystem() {
    // Ethereal Totality Corona with streaming magnetic filaments
    const totTex = this.createTotalityCoronaTexture();
    const totMat = new THREE.SpriteMaterial({
      map: totTex,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });
    this.totalityCorona = new THREE.Sprite(totMat);
    this.totalityCorona.scale.set(7.5, 7.5, 1);
    this.totalityCorona.visible = false;
    this.sunGroup.add(this.totalityCorona);

    // Diamond Ring glint flare
    const dTex = this.createDiamondRingTexture();
    const dMat = new THREE.SpriteMaterial({
      map: dTex,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });
    this.diamondRingGlint = new THREE.Sprite(dMat);
    this.diamondRingGlint.scale.set(2.4, 2.4, 1);
    this.diamondRingGlint.visible = false;
    this.sunGroup.add(this.diamondRingGlint);
  }

  createTotalityCoronaTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const cx = 512, cy = 512;

    ctx.clearRect(0, 0, 1024, 1024);
    for (let i = 0; i < 96; i++) {
      const angle = (i / 96) * Math.PI * 2;
      const len = 300 + Math.sin(angle * 5.0) * 110 + Math.cos(angle * 8.0) * 55;
      const grad = ctx.createLinearGradient(
        cx + Math.cos(angle) * 140, cy + Math.sin(angle) * 140,
        cx + Math.cos(angle) * len, cy + Math.sin(angle) * len
      );
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.35, 'rgba(220, 240, 255, 0.50)');
      grad.addColorStop(0.70, 'rgba(180, 210, 255, 0.18)');
      grad.addColorStop(1.0, 'rgba(140, 180, 255, 0.0)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 4 + (i % 3) * 3;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * 140, cy + Math.sin(angle) * 140);
      ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
      ctx.stroke();
    }

    const radial = ctx.createRadialGradient(cx, cy, 140, cx, cy, 480);
    radial.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    radial.addColorStop(0.25, 'rgba(210, 235, 255, 0.55)');
    radial.addColorStop(0.60, 'rgba(160, 205, 255, 0.18)');
    radial.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(cx, cy, 480, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  createDiamondRingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const cx = 128, cy = 128;

    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 120);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.15, 'rgba(200, 240, 255, 0.85)');
    grad.addColorStop(0.40, 'rgba(100, 190, 255, 0.35)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, 10); ctx.lineTo(cx, 246);
    ctx.moveTo(10, cy); ctx.lineTo(246, cy);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  alignSolarEclipse() {
    this.isEclipseActive = true;
    const e = this.planets['earth'];
    const m = this.planets['moon'];
    if (!e || !m) return;

    // Align Moon directly on the Sun-Earth syzygy line with matching apparent angular diameter
    const toSunLocal = new THREE.Vector3(-Math.cos(e.angle), 0, -Math.sin(e.angle)).normalize();
    this.moonGroup.position.copy(toSunLocal).multiplyScalar(3.52);

    if (this.earthMesh && this.earthMesh.material?.uniforms?.uEclipseFactor) {
      this.earthMesh.material.uniforms.uEclipseFactor.value = 1.0;
    }
  }

  resumeOrbits() {
    this.isEclipseActive = false;
    if (this.earthMesh && this.earthMesh.material?.uniforms?.uEclipseFactor) {
      this.earthMesh.material.uniforms.uEclipseFactor.value = 0.0;
    }
  }

  enterEclipseTotality() {
    this.isEclipseTotality = true;
    this.alignSolarEclipse();

    if (this.totalityCorona) {
      this.totalityCorona.visible = true;
      this.totalityCorona.material.opacity = 0.98;
    }
    if (this.diamondRingGlint) {
      this.diamondRingGlint.visible = true;
      this.diamondRingGlint.material.opacity = 1.0;
      this.diamondRingGlint.position.set(1.42, 0.48, 0);
    }
    if (this.sunMesh) this.sunMesh.visible = false;
    if (this.sunChromosphere) this.sunChromosphere.visible = false;

    this.activeFocusedBody = 'totality';
    this.autoRotate = false;

    // Look from Earth's daylit surface towards Sun
    const ePos = this.earthGroup.position.clone();
    const toSun = new THREE.Vector3(0, 0, 0).sub(ePos).normalize();

    this.targetCameraLookAt.set(0, 0, 0);
    this.targetCameraPos.copy(ePos).addScaledVector(toSun, 1.22);
    this.camera.position.copy(this.targetCameraPos);
    this.currentCameraLookAt.copy(this.targetCameraLookAt);
    this.camera.lookAt(this.currentCameraLookAt);

    if (this.billboardLabels) {
      this.billboardLabels.forEach(l => { l.visible = false; });
    }
    if (this.orbitsGroup) {
      this.orbitsGroup.visible = false;
    }

    this.onEclipseTotalityChange?.(true);
  }

  exitEclipseTotality() {
    this.isEclipseTotality = false;
    if (this.totalityCorona) {
      this.totalityCorona.visible = false;
      this.totalityCorona.material.opacity = 0.0;
    }
    if (this.diamondRingGlint) {
      this.diamondRingGlint.visible = false;
      this.diamondRingGlint.material.opacity = 0.0;
    }
    if (this.sunMesh) this.sunMesh.visible = true;
    if (this.sunChromosphere) this.sunChromosphere.visible = true;
    if (this.orbitsGroup) {
      this.orbitsGroup.visible = true;
    }

    this.resumeOrbits();
    this.focusOnPlanet('earth');
    this.onEclipseTotalityChange?.(false);
  }

  // 🪐 CONCENTRIC ORBITAL RINGS & ASTEROID BELT
  createOrbitTracks() {
    this.orbitsGroup = new THREE.Group();
    this.solarSystemGroup.add(this.orbitsGroup);
    this.orbitLines = {};

    const orbitRadii = [
      { id: 'mercury', r: 4.5,  col: 0x94a3b8 },
      { id: 'venus',   r: 7.2,  col: 0xfde047 },
      { id: 'earth',   r: 9.8,  col: 0x38bdf8 },
      { id: 'mars',    r: 13.8, col: 0xf87171 },
      { id: 'jupiter', r: 20.8, col: 0xfb923c },
      { id: 'saturn',  r: 27.2, col: 0xfef08a },
      { id: 'uranus',  r: 32.8, col: 0xa5f3fc },
      { id: 'neptune', r: 38.0, col: 0x60a5fa },
      { id: 'pluto',   r: 43.5, col: 0xe2e8f0 }
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

    // Asteroid Belt: 500 fine stardust particles between Mars (13.8) and Jupiter (20.8)
    const asteroidCount = 500;
    const asteroidGeom = new THREE.BufferGeometry();
    const asteroidPositions = new Float32Array(asteroidCount * 3);
    for (let i = 0; i < asteroidCount; i++) {
      const idx = i * 3;
      const r = 16.5 + Math.random() * 2.8;
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

    // Kuiper Belt: 600 icy cometary bodies spanning 40.0 to 48.0 AU where Pluto resides
    const kuiperCount = 600;
    const kuiperGeom = new THREE.BufferGeometry();
    const kuiperPositions = new Float32Array(kuiperCount * 3);
    for (let i = 0; i < kuiperCount; i++) {
      const idx = i * 3;
      const r = 40.0 + Math.random() * 8.0;
      const theta = Math.random() * Math.PI * 2;
      const yOffset = (Math.random() - 0.5) * 1.8;
      kuiperPositions[idx] = Math.cos(theta) * r;
      kuiperPositions[idx + 1] = yOffset;
      kuiperPositions[idx + 2] = Math.sin(theta) * r;
    }
    kuiperGeom.setAttribute('position', new THREE.BufferAttribute(kuiperPositions, 3));
    const kuiperMat = new THREE.PointsMaterial({
      color: 0xbae6fd,
      size: 0.055,
      transparent: true,
      opacity: 0.65
    });
    this.kuiperBelt = new THREE.Points(kuiperGeom, kuiperMat);
    this.solarSystemGroup.add(this.kuiperBelt);
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
    const earthGeometry = new THREE.SphereGeometry(1.18, 80, 80);
    const earthMaterial = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayTex },
        nightTexture: { value: nightTex },
        specularTexture: { value: specularTex },
        sunWorldPosition: { value: new THREE.Vector3(0, 0, 0) },
        moonWorldPosition: { value: new THREE.Vector3(0, 0, 0) },
        uEclipseFactor: { value: 0.0 },
        uAuroraIntensity: { value: 0.0 },
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
        uniform vec3 moonWorldPosition;
        uniform vec3 cameraWorldPosition;
        uniform float uEclipseFactor;
        uniform float uAuroraIntensity;
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

          // Clean, smooth physical day-to-night cosine transition
          float dayFactor = smoothstep(-0.06, 0.12, sunDot);

          // Sample Authentic NASA Blue Marble Textures
          vec4 dayColor = texture2D(dayTexture, vUv);
          vec4 nightColor = texture2D(nightTexture, vUv);
          float specularMask = texture2D(specularTexture, vUv).r;

          // 1. Crystal-Clear Natural Terrain & Deep Sapphire Oceans
          vec3 crispDay = pow(dayColor.rgb, vec3(1.02));
          crispDay = mix(crispDay, crispDay * vec3(0.86, 0.96, 1.10), specularMask * 0.35);

          // 2. Realistic Ocean Specular Sheen
          vec3 halfVector = normalize(sunDir + viewDir);
          float NdotH = max(dot(N, halfVector), 0.0);
          float subtleGlint = pow(NdotH, 160.0) * specularMask * 0.35 * dayFactor;
          vec3 litDay = crispDay + vec3(0.92, 0.96, 1.0) * subtleGlint;

          // 3. Crisp Golden Night City Lights & Radiant Cosmic Spacefill (Earth is NEVER pitch-black)
          float nightLum = max(max(nightColor.r, nightColor.g), nightColor.b);
          vec3 cityLights = vec3(1.0, 0.88, 0.55) * pow(nightLum, 1.2) * 4.2;
          vec3 nightTerrain = dayColor.rgb * vec3(0.38, 0.46, 0.58);
          vec3 darkNight = nightTerrain + cityLights;

          // 4. Natural Physical Blend from Daylight to Night
          vec3 finalSurface = mix(darkNight, litDay, dayFactor);

          // 🌘 Real-time Lunar Eclipse Shadow Projection (Umbra & Penumbra)
          if (uEclipseFactor > 0.001) {
            vec3 rayDir = normalize(vWorldPosition - sunWorldPosition);
            vec3 toMoon = moonWorldPosition - sunWorldPosition;
            float t = dot(toMoon, rayDir);
            if (t > 0.0 && t < length(vWorldPosition - sunWorldPosition)) {
              float distToMoonRay = length((sunWorldPosition + rayDir * t) - moonWorldPosition);
              float penumbra = smoothstep(0.48, 0.16, distToMoonRay);
              float umbra = smoothstep(0.20, 0.05, distToMoonRay);
              float shadowStrength = max(penumbra * 0.75, umbra * 0.96) * uEclipseFactor;
              finalSurface = mix(finalSurface, darkNight * 0.35, shadowStrength);
            }
          }

          // 🌌 Auroral Storm Light Show (CME Impact)
          if (uAuroraIntensity > 0.01) {
            float polarLat = smoothstep(0.26, 0.46, abs(vUv.y - 0.5));
            if (polarLat > 0.0) {
              float ribbon = sin(vUv.x * 32.0 + uTime * 3.5) * cos(vUv.y * 36.0 + uTime * 2.2);
              vec3 auroraTint = mix(vec3(0.08, 0.98, 0.48), vec3(0.68, 0.22, 0.98), sin(vUv.x * 14.0 + uTime * 1.5) * 0.5 + 0.5);
              finalSurface += auroraTint * (polarLat * (0.6 + 0.4 * ribbon) * uAuroraIntensity * 2.8);
            }
          }

          // 5. Authentic Atmospheric Rayleigh Blue Rim (Thin, delicate horizon line)
          float fresnel = 1.0 - max(dot(N, viewDir), 0.0);
          float atmosphericGlow = pow(fresnel, 2.8) * 0.95;
          vec3 atmosphereLimb = vec3(0.24, 0.68, 1.0) * atmosphericGlow;

          gl_FragColor = vec4(finalSurface + atmosphereLimb, 1.0);
        }
      `
    });

    this.earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    this.earthMesh.rotation.y = 0;
    this.earthMesh.userData = { celestialId: 'earth' };
    this.earthGroup.add(this.earthMesh);
    this.interactiveObjects.push(this.earthMesh);

    // Delicate Wispy Cloud Layer (2K Ultra HD Cloud Deck)
    const cloudsGeom = new THREE.SphereGeometry(1.188, 48, 48);
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudsTex,
      alphaMap: cloudsTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      roughness: 0.85,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: cloudsTex,
      emissiveIntensity: 0.12
    });
    this.cloudsMesh = new THREE.Mesh(cloudsGeom, cloudsMat);
    this.cloudsMesh.rotation.y = -Math.PI / 2;
    this.earthGroup.add(this.cloudsMesh);

    // Thin, delicate atmospheric shell hugging Earth
    const atmoGeom = new THREE.SphereGeometry(1.205, 36, 36);
    const atmoMat = new THREE.ShaderMaterial({
      uniforms: {
        uAuroraIntensity: { value: 0.0 },
        uTime: { value: 0.0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uAuroraIntensity;
        uniform float uTime;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
          vec3 baseAtmo = vec3(0.28, 0.72, 1.0) * intensity * 0.85;
          if (uAuroraIntensity > 0.01) {
            vec3 auroraGlow = mix(vec3(0.1, 0.95, 0.4), vec3(0.7, 0.2, 0.95), sin(uTime * 3.0) * 0.5 + 0.5);
            baseAtmo += auroraGlow * (intensity * uAuroraIntensity * 2.5);
          }
          gl_FragColor = vec4(baseAtmo, 1.0);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    this.atmosphereMesh = new THREE.Mesh(atmoGeom, atmoMat);
    this.earthGroup.add(this.atmosphereMesh);

    // 🌙 Real Orbiting 3D Moon (2K Ultra HD LRO Albedo Map)
    this.moonGroup = new THREE.Group();
    this.moonGroup.position.set(2.1, 0.35, 0);
    this.moonGroup.userData = { celestialId: 'moon' };
    this.earthGroup.add(this.moonGroup);

    const moonTex = this.textureLoader.load(TEXTURES.moon);
    moonTex.colorSpace = THREE.SRGBColorSpace;
    const moonGeom = new THREE.SphereGeometry(0.38, 48, 48);
    const moonMat = new THREE.MeshStandardMaterial({
      map: moonTex,
      bumpMap: moonTex,
      bumpScale: 0.025,
      roughness: 0.75,
      metalness: 0.02,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: moonTex,
      emissiveIntensity: 0.12
    });
    this.moonMesh = new THREE.Mesh(moonGeom, moonMat);
    this.moonMesh.userData = { celestialId: 'moon' };
    this.moonGroup.add(this.moonMesh);
    this.interactiveObjects.push(this.moonMesh);

    // Billboard Labels for Earth & Moon
    const earthLabel = this.createBillboardLabel('🌍 Earth', '#38bdf8', 0.95);
    earthLabel.position.set(0, 2.1, 0);
    earthLabel.userData = { celestialId: 'earth' };
    this.earthGroup.add(earthLabel);
    this.billboardLabels.push(earthLabel);
    this.interactiveObjects.push(earthLabel);

    const moonLabel = this.createBillboardLabel('🌕 Moon', '#cbd5e1', 0.65);
    moonLabel.position.set(0, 0.75, 0);
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
      radius: 1.18,
      orbitR: 9.8,
      orbitSpeed: 0.011,
      angle: 0.0,
      rotSpeed: 0.00045
    };

    this.planets['moon'] = {
      id: 'moon',
      group: this.moonGroup,
      mesh: this.moonMesh,
      radius: 0.38,
      orbitR: 2.1,
      orbitSpeed: 0.038,
      angle: 1.2,
      rotSpeed: 0.0002
    };
  }

  // 🪐 OTHER SOLAR SYSTEM PLANETS
  createOtherPlanets() {
    const planetDefs = [
      { id: 'mercury', name: '☿ Mercury', r: 4.5,  radius: 0.52, tex: TEXTURES.mercury, bump: TEXTURES.mercury, bumpScale: 0.035, speed: 0.024, rot: 0.002, col: '#f59e0b', atmoCol: [0.90, 0.65, 0.30] },
      { id: 'venus',   name: '♀ Venus',   r: 7.2,  radius: 0.82, tex: TEXTURES.venus,   speed: 0.016, rot: -0.001, col: '#fbbf24', atmoCol: [1.0, 0.85, 0.35] },
      { id: 'mars',    name: '♂ Mars',    r: 13.8, radius: 0.68, tex: TEXTURES.mars,    bump: TEXTURES.mars,    bumpScale: 0.035, speed: 0.009, rot: 0.003, col: '#f87171', atmoCol: [1.0, 0.45, 0.25] },
      { id: 'jupiter', name: '♃ Jupiter', r: 20.8, radius: 1.75, tex: TEXTURES.jupiter, speed: 0.005, rot: 0.006, col: '#fb923c', atmoCol: [1.0, 0.75, 0.40] },
      { id: 'saturn',  name: '♄ Saturn',  r: 27.2, radius: 1.40, tex: TEXTURES.saturn,  ringTex: TEXTURES.saturnRing, ringAlpha: TEXTURES.saturnRingAlpha, speed: 0.0038, rot: 0.005, col: '#fef08a', atmoCol: [1.0, 0.90, 0.55] },
      { id: 'uranus',  name: '♅ Uranus',  r: 32.8, radius: 1.05, tex: TEXTURES.uranus,  speed: 0.0026, rot: 0.003, col: '#67e8f9', atmoCol: [0.45, 0.95, 1.0] },
      { id: 'neptune', name: '♆ Neptune', r: 38.0, radius: 1.00, tex: TEXTURES.neptune, speed: 0.0020, rot: 0.0032, col: '#3b82f6', atmoCol: [0.35, 0.60, 1.0] },
      { id: 'pluto',   name: '♇ Pluto',   r: 43.5, radius: 0.44, tex: TEXTURES.pluto,   bump: TEXTURES.pluto, bumpScale: 0.035, speed: 0.0016, rot: -0.002, col: '#e2e8f0', atmoCol: [0.70, 0.85, 1.0] }
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
        roughness: 0.68,
        metalness: 0.05,
        emissive: new THREE.Color(0xffffff),
        emissiveMap: tex,
        emissiveIntensity: 0.12
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

        // Atmosphere (Soft limb glow that does not burn or bleed over rings)
        const pAtmoGeom = new THREE.SphereGeometry(p.radius * 1.025, 36, 36);
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
              float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
              float intensity = pow(rim, 4.5);
              gl_FragColor = vec4(uColor, 1.0) * intensity * 0.35;
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
        const innerR = p.radius * 1.20;
        const outerR = p.radius * 2.70;
        const ringGeom = new THREE.RingGeometry(innerR, outerR, 128, 32);
        ringGeom.rotateX(Math.PI / 2);

        // Map radial strip texture coordinates onto ring
        const pos = ringGeom.attributes.position;
        const uvs = ringGeom.attributes.uv;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const z = pos.getZ(i);
          const r = Math.sqrt(x * x + z * z);
          const u = Math.max(0.0, Math.min(1.0, (r - innerR) / (outerR - innerR)));
          uvs.setXY(i, u, 0.5);
        }
        uvs.needsUpdate = true;

        const ringT = this.textureLoader.load(p.ringTex);
        ringT.colorSpace = THREE.SRGBColorSpace;
        const ringAlphaT = p.ringAlpha ? this.textureLoader.load(p.ringAlpha) : null;

        const ringMat = new THREE.ShaderMaterial({
          uniforms: {
            ringMap: { value: ringT },
            ringAlphaMap: { value: ringAlphaT },
            uSaturnPos: { value: group.position },
            uSaturnRadius: { value: p.radius }
          },
          vertexShader: `
            varying vec2 vUv;
            varying vec3 vWorldPos;
            void main() {
              vUv = uv;
              vec4 worldPos = modelMatrix * vec4(position, 1.0);
              vWorldPos = worldPos.xyz;
              gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
          `,
          fragmentShader: `
            uniform sampler2D ringMap;
            uniform sampler2D ringAlphaMap;
            uniform vec3 uSaturnPos;
            uniform float uSaturnRadius;
            varying vec2 vUv;
            varying vec3 vWorldPos;
            void main() {
              vec4 texColor = texture2D(ringMap, vUv);
              float ringAlpha = texture2D(ringAlphaMap, vUv).r;

              // Prominent golden sunlight reflection on ice crystals with pristine ringlet definition
              vec3 icyGold = texColor.rgb * 1.55 + vec3(0.08, 0.06, 0.03);

              // Sharp, distinct density profile with clear Cassini division gap
              float density = max(texColor.a, ringAlpha);
              float edgeFalloff = smoothstep(0.0, 0.02, vUv.x) * smoothstep(1.0, 0.98, vUv.x);
              float finalAlpha = smoothstep(0.05, 0.65, density) * edgeFalloff * 0.95;

              // Realistic, continuous illuminated ring plane with authentic lighting
              vec3 d = vWorldPos - uSaturnPos;
              vec3 toSun = normalize(-uSaturnPos);
              float dotSun = dot(normalize(d), toSun);
              
              // Soft natural planetary self-shading gradient without harsh cuts
              float shadow = 1.0;
              if (dotSun < -0.35) {
                float distCenter = length(d);
                if (distCenter < uSaturnRadius * 1.35) {
                  shadow = smoothstep(uSaturnRadius * 0.95, uSaturnRadius * 1.35, distCenter);
                }
              }
              vec3 finalColor = icyGold * mix(0.45, 1.0, shadow);

              gl_FragColor = vec4(finalColor, finalAlpha);
            }
          `,
          side: THREE.DoubleSide,
          transparent: true,
          depthWrite: false
        });
        ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.rotation.z = 0.465; // Authentic 26.7° axial tilt
        group.add(ringMesh);

        if (p.id === 'saturn') {
          this.buildSaturnRingBoulders(group, p.radius);
        }
      }

      // Billboard HUD Label
      const label = this.createBillboardLabel(p.name, p.col, 0.85);
      label.position.set(0, p.radius + 1.1, 0);
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

    // ❄️ 4 EXOTIC MOONS: Europa, Titan, Io, Enceladus
    this.buildExoticMoons();

    this.planetsList = Object.values(this.planets);
  }

  // -------------------------------------------------------------
  // 🪐 SATURN RING DIVE: 1,400 INSTANCED TUMBLING ICE BOULDERS
  // -------------------------------------------------------------
  buildSaturnRingBoulders(saturnGroup, saturnRadius) {
    const boulderCount = 1400;
    const geom = new THREE.DodecahedronGeometry(0.045, 1);

    const posAttr = geom.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);
      const factor = 0.82 + Math.random() * 0.36;
      posAttr.setXYZ(i, vx * factor, vy * factor, vz * factor);
    }
    posAttr.needsUpdate = true;
    geom.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.28,
      metalness: 0.12,
      flatShading: true
    });

    this.saturnBoulders = new THREE.InstancedMesh(geom, mat, boulderCount);
    this.saturnBoulders.name = 'SaturnRingBoulders';
    this.saturnBoulders.rotation.z = 0.465; // Same 26.7° tilt as rings

    const innerR = saturnRadius * 1.25;
    const outerR = saturnRadius * 2.65;
    const cassiniInner = saturnRadius * 1.94;
    const cassiniOuter = saturnRadius * 2.14;

    const dummy = new THREE.Object3D();
    const boulderData = [];

    for (let i = 0; i < boulderCount; i++) {
      let r;
      do {
        r = innerR + Math.random() * (outerR - innerR);
      } while (r > cassiniInner && r < cassiniOuter && Math.random() > 0.08);

      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 0.048;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      const scale = 0.4 + Math.random() * 1.6;
      dummy.position.set(x, y, z);
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.updateMatrix();

      this.saturnBoulders.setMatrixAt(i, dummy.matrix);

      boulderData.push({
        r,
        theta,
        y,
        scale,
        orbitSpeed: 0.04 / Math.sqrt(r),
        rotX: (Math.random() - 0.5) * 0.8,
        rotY: (Math.random() - 0.5) * 0.8,
        rotZ: (Math.random() - 0.5) * 0.8
      });
    }

    this.saturnBoulders.instanceMatrix.needsUpdate = true;
    this.saturnBoulders.userData = { boulderData, dummy };
    saturnGroup.add(this.saturnBoulders);
  }

  enterSaturnRingDive() {
    this.isRingDiveActive = true;
    this.activeFocusedBody = 'saturn_ring_dive';
    this.autoRotate = false;
    this.updateVisibility(false);

    if (this.billboardLabels) {
      this.billboardLabels.forEach(l => { l.visible = false; });
    }
    this.onRingDiveChange?.(true);
  }

  exitSaturnRingDive() {
    this.isRingDiveActive = false;
    this.focusPlanet('saturn');
    this.onRingDiveChange?.(false);
  }

  // -------------------------------------------------------------
  // ❄️ EXOTIC MOONS: EUROPA, TITAN, IO, ENCELADUS
  // -------------------------------------------------------------
  buildExoticMoons() {
    // 1. IO & EUROPA (Moons of Jupiter)
    const jupiterGroup = this.planets['jupiter']?.group;
    if (jupiterGroup) {
      // IO (Volcanic Cauldron)
      const ioTex = this.createIoTexture();
      const ioGeom = new THREE.SphereGeometry(0.32, 32, 32);
      const ioMat = new THREE.MeshStandardMaterial({
        map: ioTex,
        roughness: 0.85,
        metalness: 0.05
      });
      const ioGroup = new THREE.Group();
      ioGroup.userData = { celestialId: 'io' };
      const ioMesh = new THREE.Mesh(ioGeom, ioMat);
      ioMesh.userData = { celestialId: 'io' };
      ioGroup.add(ioMesh);
      this.interactiveObjects.push(ioMesh);

      const ioPlume = this.createVolcanicPlumeSystem(0.32);
      ioGroup.add(ioPlume);

      const ioLabel = this.createBillboardLabel('🌋 Io', '#fbbf24', 0.65);
      ioLabel.position.set(0, 0.65, 0);
      ioLabel.userData = { celestialId: 'io' };
      ioGroup.add(ioLabel);
      this.billboardLabels.push(ioLabel);
      this.interactiveObjects.push(ioLabel);

      jupiterGroup.add(ioGroup);
      this.planets['io'] = {
        id: 'io',
        parent: 'jupiter',
        group: ioGroup,
        mesh: ioMesh,
        radius: 0.32,
        orbitR: 2.55,
        orbitSpeed: 0.042,
        angle: 0.5,
        rotSpeed: 0.001,
        plume: ioPlume
      };

      // EUROPA (Subsurface Ocean & Cryo-Geysers)
      const europaTex = this.createEuropaTexture();
      const europaGeom = new THREE.SphereGeometry(0.30, 32, 32);
      const europaMat = new THREE.MeshStandardMaterial({
        map: europaTex,
        roughness: 0.30,
        metalness: 0.08
      });
      const europaGroup = new THREE.Group();
      europaGroup.userData = { celestialId: 'europa' };
      const europaMesh = new THREE.Mesh(europaGeom, europaMat);
      europaMesh.userData = { celestialId: 'europa' };
      europaGroup.add(europaMesh);
      this.interactiveObjects.push(europaMesh);

      const europaGeysers = this.createCryoGeyserSystem(0.30, 0x38bdf8);
      europaGroup.add(europaGeysers);

      const europaLabel = this.createBillboardLabel('🌊 Europa', '#38bdf8', 0.65);
      europaLabel.position.set(0, 0.65, 0);
      europaLabel.userData = { celestialId: 'europa' };
      europaGroup.add(europaLabel);
      this.billboardLabels.push(europaLabel);
      this.interactiveObjects.push(europaLabel);

      jupiterGroup.add(europaGroup);
      this.planets['europa'] = {
        id: 'europa',
        parent: 'jupiter',
        group: europaGroup,
        mesh: europaMesh,
        radius: 0.30,
        orbitR: 3.45,
        orbitSpeed: 0.030,
        angle: 2.2,
        rotSpeed: 0.0008,
        geysers: europaGeysers
      };
    }

    // 2. ENCELADUS & TITAN (Moons of Saturn)
    const saturnGroup = this.planets['saturn']?.group;
    if (saturnGroup) {
      // ENCELADUS (Tiger-Stripe Cryo-Plumes)
      const encTex = this.createEnceladusTexture();
      const encGeom = new THREE.SphereGeometry(0.24, 32, 32);
      const encMat = new THREE.MeshStandardMaterial({
        map: encTex,
        roughness: 0.20,
        metalness: 0.15
      });
      const encGroup = new THREE.Group();
      encGroup.userData = { celestialId: 'enceladus' };
      const encMesh = new THREE.Mesh(encGeom, encMat);
      encMesh.userData = { celestialId: 'enceladus' };
      encGroup.add(encMesh);
      this.interactiveObjects.push(encMesh);

      const encPlumes = this.createCryoGeyserSystem(0.24, 0xbae6fd);
      encPlumes.position.set(0, -0.22, 0);
      encGroup.add(encPlumes);

      const encLabel = this.createBillboardLabel('❄️ Enceladus', '#bae6fd', 0.60);
      encLabel.position.set(0, 0.55, 0);
      encLabel.userData = { celestialId: 'enceladus' };
      encGroup.add(encLabel);
      this.billboardLabels.push(encLabel);
      this.interactiveObjects.push(encLabel);

      saturnGroup.add(encGroup);
      this.planets['enceladus'] = {
        id: 'enceladus',
        parent: 'saturn',
        group: encGroup,
        mesh: encMesh,
        radius: 0.24,
        orbitR: 3.95,
        orbitSpeed: 0.026,
        angle: 1.1,
        rotSpeed: 0.001,
        plumes: encPlumes
      };

      // TITAN (Golden Smog & Hydrocarbon Seas)
      const titanTex = this.createTitanTexture();
      const titanGeom = new THREE.SphereGeometry(0.42, 32, 32);
      const titanMat = new THREE.MeshStandardMaterial({
        map: titanTex,
        roughness: 0.65,
        metalness: 0.05
      });
      const titanGroup = new THREE.Group();
      titanGroup.userData = { celestialId: 'titan' };
      const titanMesh = new THREE.Mesh(titanGeom, titanMat);
      titanMesh.userData = { celestialId: 'titan' };
      titanGroup.add(titanMesh);
      this.interactiveObjects.push(titanMesh);

      const titanAtmoGeom = new THREE.SphereGeometry(0.442, 32, 32);
      const titanAtmoMat = new THREE.ShaderMaterial({
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
            float intensity = pow(0.70 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
            vec3 haze = vec3(0.95, 0.68, 0.18) * intensity * 1.25;
            gl_FragColor = vec4(haze, intensity * 0.90);
          }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
      });
      const titanAtmoMesh = new THREE.Mesh(titanAtmoGeom, titanAtmoMat);
      titanGroup.add(titanAtmoMesh);

      const titanLabel = this.createBillboardLabel('🪐 Titan', '#f59e0b', 0.70);
      titanLabel.position.set(0, 0.75, 0);
      titanLabel.userData = { celestialId: 'titan' };
      titanGroup.add(titanLabel);
      this.billboardLabels.push(titanLabel);
      this.interactiveObjects.push(titanLabel);

      saturnGroup.add(titanGroup);
      this.planets['titan'] = {
        id: 'titan',
        parent: 'saturn',
        group: titanGroup,
        mesh: titanMesh,
        atmoMesh: titanAtmoMesh,
        radius: 0.42,
        orbitR: 5.35,
        orbitSpeed: 0.018,
        angle: 3.4,
        rotSpeed: 0.0006
      };
    }
  }

  // 🌋 Volcanic Plume Jet Particle System
  createVolcanicPlumeSystem(radius) {
    const pCount = 280;
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(pCount * 3);
    const vel = new Float32Array(pCount * 3);
    const life = new Float32Array(pCount);

    for (let i = 0; i < pCount; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = radius;
      pos[i * 3 + 2] = 0;

      const angle = Math.random() * Math.PI * 2;
      const spread = 0.06 + Math.random() * 0.08;
      const speed = 0.22 + Math.random() * 0.30;
      vel[i * 3] = Math.cos(angle) * spread;
      vel[i * 3 + 1] = speed;
      vel[i * 3 + 2] = Math.sin(angle) * spread;
      life[i] = Math.random();
    }

    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geom.userData = { vel, life, radius };

    const mat = new THREE.PointsMaterial({
      color: 0xff6611,
      size: 0.045,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.88
    });

    return new THREE.Points(geom, mat);
  }

  // ❄️ Cryo-Geyser Jet Particle System
  createCryoGeyserSystem(radius, color = 0x38bdf8) {
    const pCount = 300;
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(pCount * 3);
    const vel = new Float32Array(pCount * 3);
    const life = new Float32Array(pCount);

    for (let i = 0; i < pCount; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = radius;
      pos[i * 3 + 2] = 0;

      const angle = Math.random() * Math.PI * 2;
      const spread = 0.04 + Math.random() * 0.06;
      const speed = 0.26 + Math.random() * 0.38;
      vel[i * 3] = Math.cos(angle) * spread;
      vel[i * 3 + 1] = speed;
      vel[i * 3 + 2] = Math.sin(angle) * spread;
      life[i] = Math.random();
    }

    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geom.userData = { vel, life, radius };

    const mat = new THREE.PointsMaterial({
      color,
      size: 0.042,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.90
    });

    return new THREE.Points(geom, mat);
  }

  // 🌊 Europa Procedural Ice Shell Texture
  createEuropaTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#e2f1fc';
    ctx.fillRect(0, 0, 512, 256);

    // Chaos terrain mottling
    for (let i = 0; i < 40; i++) {
      const cx = Math.random() * 512;
      const cy = Math.random() * 256;
      const rad = 15 + Math.random() * 35;
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, rad);
      grad.addColorStop(0, 'rgba(180, 100, 60, 0.45)');
      grad.addColorStop(1, 'rgba(226, 241, 252, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Criss-crossing Reddish-Brown Lineae Fractures
    ctx.strokeStyle = 'rgba(150, 65, 35, 0.70)';
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 35; i++) {
      ctx.beginPath();
      let x = Math.random() * 512;
      let y = Math.random() * 256;
      ctx.moveTo(x, y);
      for (let j = 0; j < 4; j++) {
        x += (Math.random() - 0.5) * 120;
        y += (Math.random() - 0.5) * 80;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // 🌋 Io Procedural Sulfurous Volcanic Texture
  createIoTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#fde047';
    ctx.fillRect(0, 0, 512, 256);

    // Orange-ochre volcanic lava deposits
    for (let i = 0; i < 60; i++) {
      const cx = Math.random() * 512;
      const cy = Math.random() * 256;
      const rad = 20 + Math.random() * 45;
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, rad);
      grad.addColorStop(0, 'rgba(234, 88, 12, 0.65)');
      grad.addColorStop(0.6, 'rgba(245, 158, 11, 0.35)');
      grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dark Calderas (Pele, Loki Patera, etc.)
    for (let i = 0; i < 22; i++) {
      const cx = Math.random() * 512;
      const cy = Math.random() * 256;
      const rad = 4 + Math.random() * 10;
      ctx.fillStyle = 'rgba(24, 16, 12, 0.95)';
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 68, 18, 0.85)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // ❄️ Enceladus Procedural Ice & Tiger Stripes Texture
  createEnceladusTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 256);

    // South polar blue tint
    const southGrad = ctx.createLinearGradient(0, 160, 0, 256);
    southGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    southGrad.addColorStop(1, 'rgba(186, 230, 253, 0.45)');
    ctx.fillStyle = southGrad;
    ctx.fillRect(0, 160, 512, 96);

    // 4 Distinct Parallel Tiger Stripe Fractures (Damascus, Baghdad, Alexandria, Cairo)
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      const startX = 180 + i * 40;
      ctx.moveTo(startX, 185);
      ctx.bezierCurveTo(startX + 15, 210, startX - 10, 235, startX + 5, 254);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // 🪐 Titan Procedural Golden Tholin Haze & Methane Seas Texture
  createTitanTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Velvety golden orange surface
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 256);
    bgGrad.addColorStop(0, '#d97706');
    bgGrad.addColorStop(0.5, '#f59e0b');
    bgGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 512, 256);

    // Dark liquid methane seas in north polar region (Kraken Mare, Ligeia Mare)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    for (let i = 0; i < 5; i++) {
      const cx = 160 + i * 55 + (Math.random() - 0.5) * 20;
      const cy = 25 + (Math.random() - 0.5) * 15;
      const rx = 18 + Math.random() * 22;
      const ry = 10 + Math.random() * 12;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, Math.random() * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // Sleek Glassmorphic Floating HUD Label
  createBillboardLabel(text, color = '#38bdf8', scale = 0.85) {
    const canvas = document.createElement('canvas');
    canvas.width = 384; canvas.height = 96;
    const ctx = canvas.getContext('2d');

    // Rounded Pill Glass Background
    ctx.fillStyle = 'rgba(6, 14, 32, 0.92)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(6, 6, 372, 84, 42);
    ctx.fill();
    ctx.stroke();

    // Subtle inner glowing highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(10, 10, 364, 76, 38);
    ctx.stroke();

    // High-contrast crisp text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Space Grotesk", system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 192, 49);

    const labelTex = new THREE.CanvasTexture(canvas);
    const labelMat = new THREE.SpriteMaterial({
      map: labelTex,
      transparent: true,
      depthTest: true,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(labelMat);
    sprite.scale.set(scale * 4.2, scale * 1.05, 1);
    sprite.visible = true;
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
    // Center the entire Solar System expanse in the left viewport away from the right HUD drawer
    this.targetCameraLookAt.set(6.0, 0, 0);
    this.targetOrbitRadius = 66.0;
    this.targetOrbitPhi = 0.72; // Elevated 42° pitch
    this.targetOrbitTheta = 0.0;
    this.updateVisibility(true);
  }

  focusOnPlanet(planetId = 'system') {
    this.focusPlanet(planetId);
  }

  focusPlanet(planetId = 'system') {
    if (this.isEclipseTotality && planetId !== 'totality') {
      this.isEclipseTotality = false;
      if (this.totalityCorona) {
        this.totalityCorona.visible = false;
        this.totalityCorona.material.opacity = 0.0;
      }
      if (this.diamondRingGlint) {
        this.diamondRingGlint.visible = false;
        this.diamondRingGlint.material.opacity = 0.0;
      }
      if (this.sunMesh) this.sunMesh.visible = true;
      if (this.sunChromosphere) this.sunChromosphere.visible = true;
      this.onEclipseTotalityChange?.(false);
    }

    if (this.isRingDiveActive && planetId !== 'saturn_ring_dive') {
      this.isRingDiveActive = false;
      this.onRingDiveChange?.(false);
    }

    if (planetId === 'saturn_ring_dive') {
      this.enterSaturnRingDive();
      return;
    }

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
    } else if (['io', 'europa', 'titan', 'enceladus'].includes(planetId) && this.planets[planetId]) {
      this.autoRotate = false;
      const m = this.planets[planetId];
      m.group.getWorldPosition(this.targetCameraLookAt);
      this.targetOrbitRadius = Math.max(1.15, m.radius * 4.2);
      this.targetOrbitPhi = Math.PI * 0.44;
    } else if (this.planets[planetId]) {
      this.autoRotate = false;
      const p = this.planets[planetId];
      const pPos = p.group.position;
      this.targetCameraLookAt.copy(pPos);
      if (planetId === 'saturn') {
        this.targetOrbitRadius = p.radius * 4.5;
        this.targetOrbitPhi = 0.88; // Elevated 50° angle to reveal full disk of rings
      } else {
        const camDist = Math.max(2.2, p.radius * 3.4);
        this.targetOrbitRadius = camDist;
        this.targetOrbitPhi = Math.PI * 0.42;
      }
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
    if (this.kuiperBelt) {
      this.kuiperBelt.visible = isOrrery;
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
      this.earthMesh.rotation.y = utcAngle;
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
      const isHeritage = (item.category === 'heritage');
      const color = isHeritage ? 0xf59e0b : (type === 'favorite' ? 0xfbbf24 : (item.color || 0x38bdf8));

      const beaconGroup = new THREE.Group();
      beaconGroup.position.copy(pos);
      beaconGroup.userData = { item, type };

      // Holographic vertical beam
      const beamHeight = isHeritage ? 0.11 : 0.08;
      const beamGeom = new THREE.CylinderGeometry(isHeritage ? 0.004 : 0.003, isHeritage ? 0.004 : 0.003, beamHeight, 6);
      const beamMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: isHeritage ? 0.95 : 0.85 });
      const beamMesh = new THREE.Mesh(beamGeom, beamMat);
      beamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      beamMesh.position.addScaledVector(normal, beamHeight * 0.5);
      beaconGroup.add(beamMesh);

      // Top floating gem / monument cap
      const diamondGeom = isHeritage ? new THREE.OctahedronGeometry(0.018, 0) : new THREE.OctahedronGeometry(0.014, 0);
      const diamondMat = new THREE.MeshBasicMaterial({ color: isHeritage ? 0xfffbeb : 0xffffff });
      const diamondMesh = new THREE.Mesh(diamondGeom, diamondMat);
      diamondMesh.position.addScaledVector(normal, beamHeight + 0.005);
      beaconGroup.add(diamondMesh);

      // Pulsing concentric ground rings
      const ringGeom = new THREE.RingGeometry(isHeritage ? 0.018 : 0.015, isHeritage ? 0.030 : 0.024, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: isHeritage ? 0.90 : 0.75 });
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

    // Zero-lag optimization: skip expensive WebGL & post-processing when 3D container is hidden
    if (this.container && (this.container.style.display === 'none' || this.container.offsetParent === null)) {
      return;
    }

    const delta = Math.min(this.clock.getDelta(), 0.05);
    const elapsedTime = this.clock.getElapsedTime();

    if (this.isExternalCamera) {
      if (this.cameraLight) {
        this.cameraLight.visible = false;
      }
      if (this.externalUpdateHook) {
        this.externalUpdateHook(delta, elapsedTime);
      }
      if (this.composer) {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }
      return;
    } else {
      if (this.cameraLight && !this.cameraLight.visible) {
        this.cameraLight.visible = true;
      }
    }

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
              if (this.isEclipseActive) {
                // Keep Moon pinned on the Sun-Earth syzygy line
                const toSunLocal = new THREE.Vector3(-Math.cos(p.angle), 0, -Math.sin(p.angle)).normalize();
                this.moonGroup.position.copy(toSunLocal).multiplyScalar(3.52);
              } else {
                m.angle += m.orbitSpeed * delta * 3.5;
                this.moonGroup.position.set(Math.cos(m.angle) * m.orbitR, 0.25 * Math.sin(m.angle), Math.sin(m.angle) * m.orbitR);
              }
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

        // Active Volcanic Plumes (Io)
        if (p.plume && p.plume.geometry.userData) {
          const pos = p.plume.geometry.attributes.position.array;
          const { vel, life, radius } = p.plume.geometry.userData;
          for (let k = 0; k < pos.length / 3; k++) {
            life[k] += delta * 1.5;
            if (life[k] > 1.0) {
              life[k] = 0;
              pos[k * 3] = 0;
              pos[k * 3 + 1] = radius;
              pos[k * 3 + 2] = 0;
            } else {
              pos[k * 3] += vel[k * 3] * delta;
              pos[k * 3 + 1] += vel[k * 3 + 1] * delta;
              pos[k * 3 + 2] += vel[k * 3 + 2] * delta;
            }
          }
          p.plume.geometry.attributes.position.needsUpdate = true;
        }

        // Active Cryo-Geysers (Europa & Enceladus)
        const geyserSys = p.geysers || p.plumes;
        if (geyserSys && geyserSys.geometry.userData) {
          const pos = geyserSys.geometry.attributes.position.array;
          const { vel, life, radius } = geyserSys.geometry.userData;
          for (let k = 0; k < pos.length / 3; k++) {
            life[k] += delta * 1.4;
            if (life[k] > 1.0) {
              life[k] = 0;
              pos[k * 3] = 0;
              pos[k * 3 + 1] = radius;
              pos[k * 3 + 2] = 0;
            } else {
              pos[k * 3] += vel[k * 3] * delta;
              pos[k * 3 + 1] += vel[k * 3 + 1] * delta;
              pos[k * 3 + 2] += vel[k * 3 + 2] * delta;
            }
          }
          geyserSys.geometry.attributes.position.needsUpdate = true;
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

    // 🪐 Saturn 3D Ice Boulder Tumble & Keplerian Orbit
    if (this.saturnBoulders && this.saturnBoulders.userData) {
      const { boulderData, dummy } = this.saturnBoulders.userData;
      if (boulderData) {
        for (let i = 0; i < boulderData.length; i++) {
          const b = boulderData[i];
          b.theta += b.orbitSpeed * delta * 1.2;
          const x = Math.cos(b.theta) * b.r;
          const z = Math.sin(b.theta) * b.r;
          dummy.position.set(x, b.y, z);
          dummy.scale.set(b.scale, b.scale, b.scale);
          dummy.rotation.x += b.rotX * delta;
          dummy.rotation.y += b.rotY * delta;
          dummy.rotation.z += b.rotZ * delta;
          dummy.updateMatrix();
          this.saturnBoulders.setMatrixAt(i, dummy.matrix);
        }
        this.saturnBoulders.instanceMatrix.needsUpdate = true;
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

    // ☀️ Living Sun: Magnetic Prominences & CME Shockwave
    if (this.sunProminences) {
      this.sunProminences.rotation.y += 0.0012;
      this.sunProminences.children.forEach(child => {
        if (child.material?.uniforms?.uTime) {
          child.material.uniforms.uTime.value = elapsedTime;
        }
      });
    }

    if (this.cmeActive && this.cmeGroup) {
      this.cmeRadius += delta * 7.2;
      if (this.cmeTorus) {
        this.cmeTorus.scale.set(this.cmeRadius, this.cmeRadius, this.cmeRadius * 0.4);
        if (this.cmeTorus.material?.uniforms?.uProgress) {
          this.cmeTorus.material.uniforms.uProgress.value = this.cmeRadius / 45.0;
          this.cmeTorus.material.uniforms.uTime.value = elapsedTime;
        }
      }
      if (this.cmeParticles) {
        const pArr = this.cmeParticles.geometry.attributes.position.array;
        const vArr = this.cmeParticles.geometry.userData?.vel;
        if (vArr) {
          for (let i = 0; i < pArr.length / 3; i++) {
            pArr[i * 3] += vArr[i * 3] * delta * 18.0;
            pArr[i * 3 + 1] += vArr[i * 3 + 1] * delta * 18.0;
            pArr[i * 3 + 2] += vArr[i * 3 + 2] * delta * 18.0;
          }
          this.cmeParticles.geometry.attributes.position.needsUpdate = true;
        }
        this.cmeParticles.material.opacity = Math.max(0, 1.0 - (this.cmeRadius / 45.0));
      }

      // Check CME shockwave collision with Earth orbit (R ~ 9.8)
      if (this.cmeRadius >= 9.6 && !this._cmeHitEarth) {
        this._cmeHitEarth = true;
        this.triggerAuroralStorm();
        this.triggerScreenShake(3.5);
        if (this.onCmeImpact) this.onCmeImpact();
      }

      if (this.cmeRadius > 45.0) {
        this.cmeActive = false;
        this.cmeGroup.visible = false;
      }
    }

    // Dynamic Aurora Storm Intensity Decay
    if (this.auroraIntensity > 0.005) {
      this.auroraIntensity = Math.max(0, this.auroraIntensity - delta * 0.12);
      if (this.earthMesh?.material?.uniforms?.uAuroraIntensity) {
        this.earthMesh.material.uniforms.uAuroraIntensity.value = this.auroraIntensity;
      }
      if (this.atmosphereMesh?.material?.uniforms?.uAuroraIntensity) {
        this.atmosphereMesh.material.uniforms.uAuroraIntensity.value = this.auroraIntensity;
        this.atmosphereMesh.material.uniforms.uTime.value = elapsedTime;
      }
    }

    // Real-time Lunar Eclipse shadow position
    if (this.earthMesh?.material?.uniforms?.moonWorldPosition && this.moonGroup) {
      if (!this._tempMoonPos) this._tempMoonPos = new THREE.Vector3();
      this.moonGroup.getWorldPosition(this._tempMoonPos);
      this.earthMesh.material.uniforms.moonWorldPosition.value.copy(this._tempMoonPos);
    }

    // Asteroid & Kuiper belts slow orbital drift
    if (this.asteroidBelt && this.asteroidBelt.visible) {
      this.asteroidBelt.rotation.y += 0.00018;
    }
    if (this.kuiperBelt && this.kuiperBelt.visible) {
      this.kuiperBelt.rotation.y += 0.00008;
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
    const camEase = 1.0 - Math.exp(-5.0 * delta);

    if (this.activeFocusedBody === 'totality') {
      // Anchored Totality View looking from Earth towards Sun
      if (this.diamondRingGlint) {
        this.diamondRingGlint.material.opacity = 0.85 + 0.15 * Math.sin(elapsedTime * 9.0);
      }
      if (this.totalityCorona) {
        this.totalityCorona.material.rotation += 0.0004;
      }

      const ePos = this.earthGroup.position.clone();
      const toSun = new THREE.Vector3(0, 0, 0).sub(ePos).normalize();
      this.targetCameraLookAt.set(0, 0, 0);
      this.targetCameraPos.copy(ePos).addScaledVector(toSun, 1.22);
      this.camera.position.lerp(this.targetCameraPos, camEase);
      this.currentCameraLookAt.lerp(this.targetCameraLookAt, camEase);
      this.camera.lookAt(this.currentCameraLookAt);
    } else if (this.activeFocusedBody === 'saturn_ring_dive') {
      const sGroup = this.planets['saturn']?.group;
      if (sGroup) {
        const sPos = sGroup.position.clone();
        const tilt = 0.465;
        const ringR = 1.40 * 2.05; // 2.87 units (Cassini division gap)
        const angle = elapsedTime * 0.045;
        const x = Math.cos(angle) * ringR;
        const z = Math.sin(angle) * ringR;
        const camLocal = new THREE.Vector3(x, x * Math.sin(tilt) * 0.22 + 0.048, z);
        this.targetCameraPos.copy(sPos).add(camLocal);
        this.targetCameraLookAt.copy(sPos).addScaledVector(camLocal, 0.22);
        this.targetCameraLookAt.y -= 0.06;

        this.camera.position.lerp(this.targetCameraPos, camEase);
        this.currentCameraLookAt.lerp(this.targetCameraLookAt, camEase);
        this.camera.lookAt(this.currentCameraLookAt);
      }
    } else {
      if (this.activeFocusedBody === 'system') {
        this.targetCameraLookAt.set(6.0, 0, 0);
      } else if (this.activeFocusedBody === 'sun') {
        this.targetCameraLookAt.set(0, 0, 0);
      } else if (this.activeFocusedBody === 'earth') {
        this.targetCameraLookAt.copy(this.earthGroup.position);
      } else if (this.activeFocusedBody === 'moon') {
        this.moonGroup.getWorldPosition(this.targetCameraLookAt);
      } else if (['io', 'europa', 'titan', 'enceladus'].includes(this.activeFocusedBody) && this.planets[this.activeFocusedBody]) {
        this.planets[this.activeFocusedBody].group.getWorldPosition(this.targetCameraLookAt);
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

      this.camera.position.lerp(this.targetCameraPos, camEase);
      this.currentCameraLookAt.lerp(this.targetCameraLookAt, camEase);
      this.camera.lookAt(this.currentCameraLookAt);
    }

    // Dynamic Camera Screen Shake (CME shockwave blast impact)
    if (this.screenShakeIntensity > 0.01) {
      const shakeAmt = this.screenShakeIntensity * 0.06;
      this.camera.position.x += (Math.random() - 0.5) * shakeAmt;
      this.camera.position.y += (Math.random() - 0.5) * shakeAmt;
      this.camera.position.z += (Math.random() - 0.5) * shakeAmt;
      this.screenShakeIntensity *= Math.pow(0.04, delta);
    } else {
      this.screenShakeIntensity = 0;
    }

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
