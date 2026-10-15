// src/cosmos/cosmosScene.js
// Museum-Grade Photorealistic 3D Cosmic Scale Engine (10^7 m to 10^26 m)
// Seamlessly unifies the user's authentic high-resolution Solar System Orrery & 3D Earth
// with the deep cosmic scales: Oort Cloud -> 120,000-particle Milky Way -> Local Group -> Cosmic Web
import * as THREE from 'three';
import { NEARBY_STARS, LOCAL_GROUP_GALAXIES, COSMIC_WEB_LANDMARKS } from '../data/cosmosData.js';

export class CosmosScene {
  constructor(parentScene, camera, renderer, globe3d) {
    this.parentScene = parentScene;
    this.camera = camera;
    this.renderer = renderer;
    this.globe3d = globe3d; // Authentic Earth & Solar System Orrery ground truth

    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'CosmosScaleRoot';

    // Deep Space Scale Groups (Beyond Solar System)
    this.groupInterstellar = new THREE.Group(); // 10^16 m (Oort Cloud, Voyager, Nearest Stars)
    this.groupMilkyWay = new THREE.Group();     // 10^21 m (120k-star Spiral Galaxy & Sgr A*)
    this.groupLocalGroup = new THREE.Group();   // 10^23 m (Milky Way, Andromeda M31, Triangulum)
    this.groupCosmicWeb = new THREE.Group();    // 10^26 m (Galaxy Filaments, Boötes Void, CMB)
    this.groupMarkers = new THREE.Group();      // Interactive 3D pins

    this.rootGroup.add(this.groupInterstellar);
    this.rootGroup.add(this.groupMilkyWay);
    this.rootGroup.add(this.groupLocalGroup);
    this.rootGroup.add(this.groupCosmicWeb);
    this.rootGroup.add(this.groupMarkers);

    // Active Scale Exponent: 7.0 (Earth) -> 26.0 (Observable Universe)
    this.currentExponent = 7.0;
    this.targetExponent = 7.0;
    this.isTransitioning = false;

    // Camera Orbit Controller state
    this.orbitRadius = 18.0;
    this.targetOrbitRadius = 18.0;
    this.orbitTheta = 0.3;
    this.orbitPhi = Math.PI * 0.42;
    this.targetOrbitTheta = 0.3;
    this.targetOrbitPhi = Math.PI * 0.42;

    this.targetLookAt = new THREE.Vector3(0, 0, 0);
    this.currentLookAt = new THREE.Vector3(0, 0, 0);

    // Particle references for animation
    this.milkyWayStars = null;
    this.milkyWayStarPositions = null;
    this.milkyWayAngularSpeeds = null;
    this.andromedaStars = null;
    this.oortCloud = null;
    this.cosmicFilaments = null;
    this.cmbSphere = null;
    this.solPulsarPin = null;

    this.isInitialized = false;
    this.clock = new THREE.Clock();
  }

  init() {
    if (this.isInitialized) return;

    this.parentScene.add(this.rootGroup);

    // 1. Build Scale 3: Oort Cloud & Interstellar Neighborhood (10^16 m)
    this.buildInterstellarNeighborhood();

    // 2. Build Scale 4: The Milky Way Galaxy (10^21 m)
    this.buildMilkyWayGalaxy();

    // 3. Build Scale 5: The Local Galactic Group (10^23 m)
    this.buildLocalGroup();

    // 4. Build Scale 6: The Observable Universe & Cosmic Web (10^26 m)
    this.buildCosmicWeb();

    // 5. Interactive 3D Marker Pins
    this.buildMarkerPins();

    this.updateScaleBlend(this.currentExponent);
    this.isInitialized = true;
  }

  // ============================================================
  // SCALE 3: OORT CLOUD & INTERSTELLAR NEIGHBORHOOD (10^16 m)
  // ============================================================
  buildInterstellarNeighborhood() {
    // 1. Oort Cloud Spherical Shell of Icy Bodies surrounding the Solar System
    const oortCount = 10000;
    const oortGeo = new THREE.BufferGeometry();
    const oortPos = new Float32Array(oortCount * 3);
    for (let i = 0; i < oortCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 24.0 + Math.random() * 12.0; // Encloses the Solar System orbits
      oortPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      oortPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      oortPos[i * 3 + 2] = r * Math.cos(phi);
    }
    oortGeo.setAttribute('position', new THREE.BufferAttribute(oortPos, 3));
    const oortMat = new THREE.PointsMaterial({
      color: 0x77d4ff,
      size: 0.14,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });
    this.oortCloud = new THREE.Points(oortGeo, oortMat);
    this.groupInterstellar.add(this.oortCloud);

    // 2. Voyager 1 Interstellar Trajectory Vector (163 AU from Sun)
    const voyPts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(2.5, 4.2, -3.2)
    ];
    const voyGeo = new THREE.BufferGeometry().setFromPoints(voyPts);
    const voyMat = new THREE.LineDashedMaterial({
      color: 0x00ffcc,
      dashSize: 0.3,
      gapSize: 0.15,
      transparent: true,
      opacity: 0.85
    });
    const voyLine = new THREE.Line(voyGeo, voyMat);
    voyLine.computeLineDistances();
    this.groupInterstellar.add(voyLine);

    // Voyager Marker Beacon
    const voyBeaconGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const voyBeaconMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
    const voyBeacon = new THREE.Mesh(voyBeaconGeo, voyBeaconMat);
    voyBeacon.position.set(2.5, 4.2, -3.2);
    this.groupInterstellar.add(voyBeacon);

    // 3. Nearby Stars (Proxima, Alpha Centauri, Sirius, Barnard's Star, etc.)
    NEARBY_STARS.forEach(star => {
      const sGeo = new THREE.SphereGeometry(0.35, 16, 16);
      const sMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(star.color) });
      const sMesh = new THREE.Mesh(sGeo, sMat);
      sMesh.position.set(star.x * 3.5, star.y * 3.5, star.z * 3.5);

      // Star Halo
      const haloGeo = new THREE.SphereGeometry(0.7, 12, 12);
      const haloMat = new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          uniform vec3 uColor;
          void main() {
            float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            gl_FragColor = vec4(uColor, 1.0) * intensity * 2.2;
          }
        `,
        uniforms: {
          uColor: { value: new THREE.Color(star.color) }
        },
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
      });
      sMesh.add(new THREE.Mesh(haloGeo, haloMat));
      this.groupInterstellar.add(sMesh);
    });
  }

  // ============================================================
  // SCALE 4: THE MILKY WAY GALAXY (10^21 m)
  // ============================================================
  buildMilkyWayGalaxy() {
    // 120,000 GPU Particles organized into 4 Logarithmic Spiral Arms + Galactic Bar + Bulge
    const starCount = 120000;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const angularSpeeds = new Float32Array(starCount);

    const armCount = 4;
    const armWinding = 3.2;
    const galaxyRadius = 26.0;
    const coreRadius = 4.5;

    const coreColor = new THREE.Color('#ffe8a3');   // Golden warm central bulge
    const diskColor = new THREE.Color('#a0c8ff');   // Blue-white young stars
    const armEdgeColor = new THREE.Color('#d4bfff'); // Violet outer spiral arms
    const dustColor = new THREE.Color('#ff80bf');   // Glowing H II emission nebulae

    for (let i = 0; i < starCount; i++) {
      let r, theta, y;

      if (i < starCount * 0.25) {
        // Central Bar & Bulge
        r = Math.pow(Math.random(), 2.0) * coreRadius;
        theta = Math.random() * Math.PI * 2;
        const barFactor = 1.0 + 0.6 * Math.cos(2.0 * theta);
        r *= barFactor;
        y = (Math.random() - 0.5) * 1.8 * Math.exp(-r / 3.0);

        colors[i * 3]     = coreColor.r + (Math.random() - 0.5) * 0.15;
        colors[i * 3 + 1] = coreColor.g + (Math.random() - 0.5) * 0.15;
        colors[i * 3 + 2] = coreColor.b + (Math.random() - 0.5) * 0.15;
      } else {
        // Spiral Arms
        const armIndex = i % armCount;
        const armOffset = (armIndex / armCount) * Math.PI * 2;
        r = coreRadius + Math.pow(Math.random(), 1.1) * (galaxyRadius - coreRadius);

        const logSpiralAngle = Math.log(r / coreRadius) * armWinding;
        const dispersion = (Math.random() - 0.5) * (0.35 + (r / galaxyRadius) * 0.4);
        theta = armOffset + logSpiralAngle + dispersion;
        y = (Math.random() - 0.5) * 0.85 * Math.exp(-r / 12.0);

        let c = diskColor;
        if (Math.random() < 0.08) {
          c = dustColor;
        } else if (r > galaxyRadius * 0.7) {
          c = armEdgeColor;
        }

        colors[i * 3]     = c.r + (Math.random() - 0.5) * 0.1;
        colors[i * 3 + 1] = c.g + (Math.random() - 0.5) * 0.1;
        colors[i * 3 + 2] = c.b + (Math.random() - 0.5) * 0.1;
      }

      positions[i * 3]     = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r;

      // Flat rotation curve: v ~ const, omega ~ 1 / r
      angularSpeeds[i] = 0.0016 / Math.max(r, 1.5);
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.milkyWayStars = new THREE.Points(geo, mat);
    this.milkyWayStarPositions = positions;
    this.milkyWayAngularSpeeds = angularSpeeds;
    this.groupMilkyWay.add(this.milkyWayStars);

    // Supermassive Black Hole Sagittarius A* Accretion Glow at Core
    const sgrGeo = new THREE.SphereGeometry(0.75, 32, 32);
    const sgrMat = new THREE.ShaderMaterial({
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
          float rim = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
          gl_FragColor = vec4(1.0, 0.85, 0.4, 1.0) * rim * 3.5;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    this.groupMilkyWay.add(new THREE.Mesh(sgrGeo, sgrMat));

    // "YOU ARE HERE 📍" Pulsating Pin for Sol / Earth (Orion Spur, 13.5 units from center)
    const solPinGeo = new THREE.SphereGeometry(0.26, 16, 16);
    const solPinMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
    this.solPulsarPin = new THREE.Mesh(solPinGeo, solPinMat);
    this.solPulsarPin.position.set(13.2, 0.1, -2.8);
    this.groupMilkyWay.add(this.solPulsarPin);

    // Pulsing target circle around Sol
    const solRingGeo = new THREE.RingGeometry(0.5, 0.6, 32);
    const solRingMat = new THREE.MeshBasicMaterial({ color: 0xffea00, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    this.solRing = new THREE.Mesh(solRingGeo, solRingMat);
    this.solRing.position.copy(this.solPulsarPin.position);
    this.solRing.rotation.x = Math.PI / 2;
    this.groupMilkyWay.add(this.solRing);
  }

  // ============================================================
  // SCALE 5: THE LOCAL GALACTIC GROUP (10^23 m)
  // ============================================================
  buildLocalGroup() {
    // 1. Milky Way Mini Model on the Left
    const mwMiniGeo = new THREE.BufferGeometry();
    const mwMiniCount = 14000;
    const mwPos = new Float32Array(mwMiniCount * 3);
    const mwCol = new Float32Array(mwMiniCount * 3);
    for (let i = 0; i < mwMiniCount; i++) {
      const r = Math.pow(Math.random(), 1.2) * 5.2;
      const theta = Math.random() * Math.PI * 2 + Math.log(Math.max(r, 0.5)) * 2.8;
      mwPos[i * 3]     = -15.0 + Math.cos(theta) * r;
      mwPos[i * 3 + 1] = 2.0 + (Math.random() - 0.5) * 0.4;
      mwPos[i * 3 + 2] = -5.0 + Math.sin(theta) * r;
      mwCol[i * 3]     = 0.6;
      mwCol[i * 3 + 1] = 0.8;
      mwCol[i * 3 + 2] = 1.0;
    }
    mwMiniGeo.setAttribute('position', new THREE.BufferAttribute(mwPos, 3));
    mwMiniGeo.setAttribute('color', new THREE.BufferAttribute(mwCol, 3));
    const mwMini = new THREE.Points(mwMiniGeo, new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending }));
    this.groupLocalGroup.add(mwMini);

    // 2. Andromeda Galaxy (M31, 2.5 Million ly away, tilted disk)
    const andGeo = new THREE.BufferGeometry();
    const andCount = 30000;
    const andPos = new Float32Array(andCount * 3);
    const andCol = new Float32Array(andCount * 3);
    for (let i = 0; i < andCount; i++) {
      const r = Math.pow(Math.random(), 1.1) * 7.8;
      const theta = Math.random() * Math.PI * 2 + Math.log(Math.max(r, 0.5)) * 3.0;
      const lx = Math.cos(theta) * r;
      const lz = Math.sin(theta) * r;
      const ly = (Math.random() - 0.5) * 0.5;

      const cosT = Math.cos(Math.PI * 0.42);
      const sinT = Math.sin(Math.PI * 0.42);
      andPos[i * 3]     = 22.0 + lx;
      andPos[i * 3 + 1] = 12.0 + (ly * cosT - lz * sinT);
      andPos[i * 3 + 2] = 18.0 + (ly * sinT + lz * cosT);

      if (r < 2.0) {
        andCol[i * 3]     = 1.0;
        andCol[i * 3 + 1] = 0.9;
        andCol[i * 3 + 2] = 0.6;
      } else {
        andCol[i * 3]     = 0.7;
        andCol[i * 3 + 1] = 0.85;
        andCol[i * 3 + 2] = 1.0;
      }
    }
    andGeo.setAttribute('position', new THREE.BufferAttribute(andPos, 3));
    andGeo.setAttribute('color', new THREE.BufferAttribute(andCol, 3));
    this.andromedaStars = new THREE.Points(andGeo, new THREE.PointsMaterial({ size: 0.13, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }));
    this.groupLocalGroup.add(this.andromedaStars);

    // 3. Triangulum Galaxy (M33)
    const triGeo = new THREE.BufferGeometry();
    const triCount = 7000;
    const triPos = new Float32Array(triCount * 3);
    for (let i = 0; i < triCount; i++) {
      const r = Math.pow(Math.random(), 1.2) * 3.5;
      const theta = Math.random() * Math.PI * 2;
      triPos[i * 3]     = 28.0 + Math.cos(theta) * r;
      triPos[i * 3 + 1] = -16.0 + (Math.random() - 0.5) * 0.3;
      triPos[i * 3 + 2] = 12.0 + Math.sin(theta) * r;
    }
    triGeo.setAttribute('position', new THREE.BufferAttribute(triPos, 3));
    const triMesh = new THREE.Points(triGeo, new THREE.PointsMaterial({ size: 0.1, color: 0x88ddff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending }));
    this.groupLocalGroup.add(triMesh);

    // 4. Magellanic Clouds (LMC & SMC)
    const lmcGeo = new THREE.BufferGeometry();
    const lmcCount = 3500;
    const lmcPos = new Float32Array(lmcCount * 3);
    for (let i = 0; i < lmcCount; i++) {
      lmcPos[i * 3]     = -13.0 + (Math.random() - 0.5) * 2.5;
      lmcPos[i * 3 + 1] = -4.0 + (Math.random() - 0.5) * 1.5;
      lmcPos[i * 3 + 2] = -2.0 + (Math.random() - 0.5) * 2.0;
    }
    lmcGeo.setAttribute('position', new THREE.BufferAttribute(lmcPos, 3));
    const lmcMesh = new THREE.Points(lmcGeo, new THREE.PointsMaterial({ size: 0.1, color: 0xffaacc, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending }));
    this.groupLocalGroup.add(lmcMesh);

    // 5. Gravitational Collision Vector Stream
    const streamPts = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const x = -15.0 + t * (22.0 - (-15.0));
      const y = 2.0 + t * (12.0 - 2.0) + Math.sin(t * Math.PI) * 4.0;
      const z = -5.0 + t * (18.0 - (-5.0));
      streamPts.push(new THREE.Vector3(x, y, z));
    }
    const streamGeo = new THREE.BufferGeometry().setFromPoints(streamPts);
    const streamMat = new THREE.LineDashedMaterial({
      color: 0xffaa00,
      dashSize: 0.8,
      gapSize: 0.4,
      transparent: true,
      opacity: 0.5
    });
    const streamLine = new THREE.Line(streamGeo, streamMat);
    streamLine.computeLineDistances();
    this.groupLocalGroup.add(streamLine);
  }

  // ============================================================
  // SCALE 6: THE OBSERVABLE UNIVERSE & COSMIC WEB (10^26 m)
  // ============================================================
  buildCosmicWeb() {
    const clusterNodes = [];
    const nodeCount = 300;
    const radius = 34.0;

    for (let i = 0; i < nodeCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.pow(Math.random(), 0.75) * radius;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      const distToVoid = Math.sqrt((x + 18) ** 2 + (y - 22) ** 2 + (z - 10) ** 2);
      if (distToVoid < 9.0) continue;

      clusterNodes.push(new THREE.Vector3(x, y, z));
    }

    const linePoints = [];
    const lineColors = [];
    const maxLinkDist = 11.0;

    for (let i = 0; i < clusterNodes.length; i++) {
      for (let j = i + 1; j < clusterNodes.length; j++) {
        const d = clusterNodes[i].distanceTo(clusterNodes[j]);
        if (d < maxLinkDist && Math.random() < 0.65) {
          linePoints.push(clusterNodes[i]);
          linePoints.push(clusterNodes[j]);

          const c1 = new THREE.Color().setHSL(0.55 + (clusterNodes[i].length() / radius) * 0.25, 0.9, 0.6);
          const c2 = new THREE.Color().setHSL(0.55 + (clusterNodes[j].length() / radius) * 0.25, 0.9, 0.6);
          lineColors.push(c1.r, c1.g, c1.b);
          lineColors.push(c2.r, c2.g, c2.b);
        }
      }
    }

    const filamentGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    filamentGeo.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
    const filamentMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    this.cosmicFilaments = new THREE.LineSegments(filamentGeo, filamentMat);
    this.groupCosmicWeb.add(this.cosmicFilaments);

    // Glowing Galaxy Cluster Nodes
    const nodePts = [];
    clusterNodes.forEach(p => nodePts.push(p.x, p.y, p.z));
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.Float32BufferAttribute(nodePts, 3));
    const nodeMat = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.24,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    this.groupCosmicWeb.add(new THREE.Points(nodeGeo, nodeMat));

    // Boötes Void Outline Ring
    const voidRingGeo = new THREE.RingGeometry(8.5, 8.8, 48);
    const voidRingMat = new THREE.MeshBasicMaterial({
      color: 0x8a2be2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55
    });
    const voidRing = new THREE.Mesh(voidRingGeo, voidRingMat);
    voidRing.position.set(-18, 22, 10);
    voidRing.lookAt(0, 0, 0);
    this.groupCosmicWeb.add(voidRing);

    // CMB Outer Boundary Sphere (Planck WMAP temperature anisotropy)
    const cmbGeo = new THREE.SphereGeometry(38.0, 48, 48);
    const cmbMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPos;
        float hash(vec3 p) {
          p = fract(p * 0.3183099 + 0.1);
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }
        float noise(vec3 x) {
          vec3 i = floor(x);
          vec3 f = fract(x);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
            mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
        }
        void main() {
          vec3 norm = normalize(vWorldPos);
          float n = noise(norm * 14.0) * 0.6 + noise(norm * 28.0) * 0.4;
          vec3 coldBlue = vec3(0.05, 0.2, 0.6);
          vec3 warmOrange = vec3(0.9, 0.45, 0.1);
          vec3 hotRed = vec3(0.95, 0.1, 0.1);
          vec3 c = mix(coldBlue, warmOrange, smoothstep(0.3, 0.7, n));
          c = mix(c, hotRed, smoothstep(0.7, 0.95, n));
          gl_FragColor = vec4(c, 0.38);
        }
      `,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
    this.cmbSphere = new THREE.Mesh(cmbGeo, cmbMat);
    this.groupCosmicWeb.add(this.cmbSphere);
  }

  // ============================================================
  // INTERACTIVE 3D MARKER PINS
  // ============================================================
  buildMarkerPins() {
    this.markers = [];
    const createMarker = (name, exp, pos, colorHex) => {
      const pinGroup = new THREE.Group();
      pinGroup.position.copy(pos);
      pinGroup.userData = { name, exp };

      const dotGeo = new THREE.SphereGeometry(0.2, 12, 12);
      const dotMat = new THREE.MeshBasicMaterial({ color: colorHex });
      pinGroup.add(new THREE.Mesh(dotGeo, dotMat));

      const ringGeo = new THREE.RingGeometry(0.35, 0.42, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
      pinGroup.add(new THREE.Mesh(ringGeo, ringMat));

      this.groupMarkers.add(pinGroup);
      this.markers.push(pinGroup);
      return pinGroup;
    };

    createMarker('Earth (10⁷ m)', 7, new THREE.Vector3(0, 0, 0), 0x44aaff);
    createMarker('The Sun (10¹¹ m)', 11, new THREE.Vector3(0, 0, 0), 0xffcc00);
    createMarker('Voyager 1 (163 AU)', 16, new THREE.Vector3(2.5, 4.2, -3.2), 0x00ffcc);
    createMarker('Proxima Centauri (4.2 ly)', 16, new THREE.Vector3(4.2, -1.4, 14.0), 0xff6644);
    createMarker('Sol / Orion Spur (You Are Here)', 21, new THREE.Vector3(13.2, 0.1, -2.8), 0xffea00);
    createMarker('Sagittarius A* (Galactic Core)', 21, new THREE.Vector3(0, 0, 0), 0xff8800);
    createMarker('Andromeda Galaxy (M31)', 23, new THREE.Vector3(22.0, 12.0, 18.0), 0xffd59e);
    createMarker('Laniakea Supercluster Core', 26, new THREE.Vector3(0, 0, 0), 0x00ffff);
    createMarker('Boötes Void ("Great Nothing")', 26, new THREE.Vector3(-18, 22, 10), 0x8a2be2);
  }

  // ============================================================
  // UNIFIED LOGARITHMIC SCALE BLENDING (10^7 -> 10^26)
  // Preserves 100% of the authentic Solar System & Earth feel!
  // ============================================================
  updateScaleBlend(exp) {
    this.currentExponent = exp;

    const getWeight = (minE, peakE, maxE) => {
      if (exp <= minE || exp >= maxE) return 0.0;
      if (exp <= peakE) {
        return THREE.MathUtils.smoothstep(exp, minE, peakE);
      } else {
        return 1.0 - THREE.MathUtils.smoothstep(exp, peakE, maxE);
      }
    };

    // 1. Authentic Solar System & Earth from globe3d
    if (this.globe3d) {
      if (exp <= 13.5) {
        // Full, gorgeous Solar System Orrery & Earth active!
        this.globe3d.solarSystemGroup.visible = true;
        this.globe3d.solarSystemGroup.scale.set(1, 1, 1);

        if (exp <= 8.5) {
          // Focus camera on Earth
          this.targetOrbitRadius = THREE.MathUtils.lerp(5.5, 14.0, (exp - 7.0) / 1.5);
          if (this.globe3d.earthGroup) {
            this.targetLookAt.copy(this.globe3d.earthGroup.position);
          }
        } else {
          // Frame entire Solar System Orrery
          const t = (exp - 8.5) / (13.5 - 8.5);
          this.targetOrbitRadius = THREE.MathUtils.lerp(18.0, 58.0, t);
          this.targetLookAt.set(0, 0, 0);
        }
      } else if (exp <= 19.0) {
        // Beyond Pluto: Solar system smoothly shrinks into the central star of the Oort Cloud
        this.globe3d.solarSystemGroup.visible = true;
        const shrink = Math.max(0.005, 1.0 - (exp - 13.5) / 5.5);
        this.globe3d.solarSystemGroup.scale.set(shrink, shrink, shrink);
        this.targetOrbitRadius = 38.0;
        this.targetLookAt.set(0, 0, 0);
      } else {
        // Deep space (Milky Way to Cosmic Web): hide solar system to focus on galaxy
        this.globe3d.solarSystemGroup.visible = false;
        this.targetOrbitRadius = 32.0;
      }
    }

    // 2. Interstellar & Oort Cloud: appears at 13.0, peaks at 16.0, vanishes by 19.5
    const wInter = getWeight(13.2, 16.0, 19.5);
    this.groupInterstellar.visible = wInter > 0.01;
    this.setGroupOpacity(this.groupInterstellar, wInter);

    // 3. Milky Way Galaxy: appears at 18.0, peaks at 21.0, vanishes by 23.8
    const wMilky = getWeight(18.0, 21.0, 23.8);
    this.groupMilkyWay.visible = wMilky > 0.01;
    this.setGroupOpacity(this.groupMilkyWay, wMilky);

    // 4. Local Group: appears at 21.8, peaks at 23.2, vanishes by 25.2
    const wLocal = getWeight(21.8, 23.2, 25.2);
    this.groupLocalGroup.visible = wLocal > 0.01;
    this.setGroupOpacity(this.groupLocalGroup, wLocal);

    // 5. Cosmic Web & CMB: appears at 23.8, peaks at 26.0
    const wCosmic = exp >= 26.0 ? 1.0 : THREE.MathUtils.smoothstep(exp, 23.8, 26.0);
    this.groupCosmicWeb.visible = wCosmic > 0.01;
    this.setGroupOpacity(this.groupCosmicWeb, wCosmic);

    // Marker Pins visibility
    this.markers.forEach(m => {
      const pinExp = m.userData.exp;
      const dist = Math.abs(exp - pinExp);
      const alpha = Math.max(0.0, 1.0 - dist / 2.2);
      m.visible = alpha > 0.05;
      if (m.children[1]) {
        m.children[1].material.opacity = alpha * 0.8;
      }
    });

    if (exp >= 20.0 && exp < 22.5) {
      this.targetLookAt.set(5.0, 0, -1.0);
    } else if (exp > 8.5) {
      this.targetLookAt.set(0, 0, 0);
    }
  }

  setGroupOpacity(group, opacity) {
    group.traverse(child => {
      if (child.isMesh || child.isPoints || child.isLine) {
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => {
              m.transparent = true;
              m.opacity = (m.userData?.baseOpacity || 1.0) * opacity;
            });
          } else {
            child.material.transparent = true;
            child.material.opacity = (child.material.userData?.baseOpacity || 1.0) * opacity;
          }
        }
      }
    });
  }

  setExponent(targetExp) {
    this.targetExponent = THREE.MathUtils.clamp(targetExp, 7.0, 26.0);
    this.isTransitioning = true;
  }

  update(delta) {
    if (!this.isInitialized) return;

    if (Math.abs(this.currentExponent - this.targetExponent) > 0.005) {
      this.currentExponent += (this.targetExponent - this.currentExponent) * (1.0 - Math.exp(-4.5 * delta));
      this.updateScaleBlend(this.currentExponent);
    } else {
      this.currentExponent = this.targetExponent;
      this.isTransitioning = false;
    }

    // 1. Interstellar Oort Cloud rotation
    if (this.oortCloud && this.groupInterstellar.visible) {
      this.oortCloud.rotation.y += 0.0002;
    }

    // 2. Milky Way Differential Rotation
    if (this.milkyWayStars && this.groupMilkyWay.visible) {
      const pos = this.milkyWayStarPositions;
      const speeds = this.milkyWayAngularSpeeds;
      const count = speeds.length;
      const rotStep = delta * 0.8;

      for (let i = 0; i < count; i += 2) {
        const x = pos[i * 3];
        const z = pos[i * 3 + 2];
        const ang = speeds[i] * rotStep;
        const cosA = Math.cos(ang);
        const sinA = Math.sin(ang);
        pos[i * 3]     = x * cosA - z * sinA;
        pos[i * 3 + 2] = x * sinA + z * cosA;
      }
      this.milkyWayStars.geometry.attributes.position.needsUpdate = true;

      // Pulse Sol "You Are Here" beacon
      if (this.solPulsarPin && this.solRing) {
        const time = this.clock.getElapsedTime();
        const pulse = 1.0 + 0.3 * Math.sin(time * 4.0);
        this.solPulsarPin.scale.setScalar(pulse);
        this.solRing.scale.setScalar(pulse * 1.2);
        this.solRing.material.opacity = 0.5 + 0.4 * Math.cos(time * 4.0);
      }
    }

    // 3. Andromeda Slow Rotation
    if (this.andromedaStars && this.groupLocalGroup.visible) {
      this.andromedaStars.rotation.y += 0.00025;
    }

    // 4. Cosmic Web Drift
    if (this.cosmicFilaments && this.groupCosmicWeb.visible) {
      this.cosmicFilaments.rotation.y += 0.0001;
      if (this.cmbSphere) {
        this.cmbSphere.rotation.y += 0.00008;
      }
    }

    // Orbit Camera Smooth Interpolation
    this.orbitRadius += (this.targetOrbitRadius - this.orbitRadius) * (1.0 - Math.exp(-5.0 * delta));
    this.orbitTheta += (this.targetOrbitTheta - this.orbitTheta) * (1.0 - Math.exp(-5.0 * delta));
    this.orbitPhi += (this.targetOrbitPhi - this.orbitPhi) * (1.0 - Math.exp(-5.0 * delta));
    this.currentLookAt.lerp(this.targetLookAt, 1.0 - Math.exp(-4.0 * delta));

    const cx = this.currentLookAt.x + this.orbitRadius * Math.sin(this.orbitPhi) * Math.sin(this.orbitTheta);
    const cy = this.currentLookAt.y + this.orbitRadius * Math.cos(this.orbitPhi);
    const cz = this.currentLookAt.z + this.orbitRadius * Math.sin(this.orbitPhi) * Math.cos(this.orbitTheta);

    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(this.currentLookAt);

    this.markers.forEach(m => {
      m.quaternion.copy(this.camera.quaternion);
    });
  }

  rotateBy(deltaX, deltaY) {
    this.targetOrbitTheta -= deltaX * 0.005;
    this.targetOrbitPhi = THREE.MathUtils.clamp(
      this.targetOrbitPhi - deltaY * 0.005,
      0.08,
      Math.PI * 0.92
    );
  }

  zoomBy(factor) {
    const expChange = factor > 0 ? 0.35 : -0.35;
    this.setExponent(this.targetExponent + expChange);
  }

  dispose() {
    if (this.rootGroup && this.parentScene) {
      this.parentScene.remove(this.rootGroup);
    }
    if (this.globe3d) {
      this.globe3d.solarSystemGroup.scale.set(1, 1, 1);
      this.globe3d.solarSystemGroup.visible = true;
      if (this.globe3d.earthGroup) this.globe3d.earthGroup.visible = true;
    }
    this.isInitialized = false;
  }
}
