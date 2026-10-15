// src/cosmos/cosmosUi.js
// Museum-Grade Glassmorphic HUD & AI Controller for Powers of Ten: Cosmic Scale
import { CosmosScene } from './cosmosScene.js';
import { COSMOS_SCALES, COSMIC_AI_QUESTIONS } from '../data/cosmosData.js';
import { sounds } from '../audio.js';

export class CosmosController {
  constructor({ getGlobe3d, onExit }) {
    this.getGlobe3d = getGlobe3d;
    this.onExit = onExit;

    this.sceneEngine = null;
    this.isActive = false;
    this.container = null;

    // Flight state
    this.isAutoFlying = false;
    this.flightDirection = 1; // 1 = outward to 10^26, -1 = inward to 10^7
    this.flightSpeed = 1.0;
    this.flightInterval = null;

    // Active scale state
    this.currentScaleData = COSMOS_SCALES[0];
  }

  mount() {
    this.container = document.getElementById('cosmosHudContainer');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'cosmosHudContainer';
      this.container.className = 'cosmos-hud-container';
      document.getElementById('mapViewport')?.appendChild(this.container);
    }

    this.render();
    this.bindEvents();
  }

  enterMode() {
    this.isActive = true;
    document.body.classList.add('mode-cosmos');
    const globe3d = this.getGlobe3d();
    if (!globe3d) return;

    if (globe3d.resize) {
      setTimeout(() => globe3d.resize(), 50);
    }

    // Keep authentic Solar System & Earth visible and active!
    globe3d.solarSystemGroup.visible = true;
    if (globe3d.earthGroup) globe3d.earthGroup.visible = true;
    globe3d.isExternalCamera = true;

    // Hide billboard labels so floating labels from Orrery don't overlap cosmic scale
    if (globe3d.billboardLabels) {
      globe3d.billboardLabels.forEach(lbl => { if (lbl) lbl.visible = false; });
    }

    // Instantiate or initialize CosmosScene with globe3d reference
    if (!this.sceneEngine) {
      this.sceneEngine = new CosmosScene(globe3d.scene, globe3d.camera, globe3d.renderer, globe3d);
      this.sceneEngine.init();
    } else {
      this.sceneEngine.rootGroup.visible = true;
    }

    // Connect animation hook
    globe3d.externalUpdateHook = (delta, elapsedTime) => {
      if (this.isActive && this.sceneEngine) {
        this.sceneEngine.update(delta);
        this.syncTelemetryUi();
      }
    };

    if (this.container) {
      this.container.style.display = 'block';
    }

    // Start at Earth scale (10^7 m) or resume
    this.setScale(7.0);
    sounds.playWhoosh();
  }

  exitMode() {
    this.isActive = false;
    this.stopAutoFlight();
    document.body.classList.remove('mode-cosmos');

    const globe3d = this.getGlobe3d();
    if (globe3d) {
      globe3d.isExternalCamera = false;
      globe3d.externalUpdateHook = null;
      globe3d.solarSystemGroup.visible = true;
      globe3d.solarSystemGroup.scale.set(1, 1, 1);
      if (globe3d.earthGroup) globe3d.earthGroup.visible = true;
      if (globe3d.billboardLabels) {
        globe3d.billboardLabels.forEach(lbl => { if (lbl) lbl.visible = true; });
      }
      globe3d.viewWholeSolarSystem();
      if (globe3d.resize) {
        setTimeout(() => globe3d.resize(), 50);
      }
    }

    if (this.sceneEngine) {
      this.sceneEngine.rootGroup.visible = false;
    }

    if (this.container) {
      this.container.style.display = 'none';
    }

    if (this.onExit) this.onExit();
  }

  render() {
    this.container.innerHTML = `
      <!-- TOP TELEMETRY HUD -->
      <div class="cosmos-top-hud">
        <div class="cosmos-brand-badge">
          <span class="cosmos-icon">🌌</span>
          <div class="cosmos-brand-text">
            <span class="cosmos-title">POWERS OF TEN</span>
            <span class="cosmos-subtitle">Cosmic Scale • 10⁷ to 10²⁶ Meters</span>
          </div>
        </div>

        <!-- HERO SCALE METER -->
        <div class="cosmos-hero-scale" id="cosmosHeroScale">
          <div class="cosmos-exponent-badge" id="hudExponent">10⁷ m</div>
          <div class="cosmos-telemetry-col">
            <div class="cosmos-realm-name" id="hudRealmName">Earth & Low Orbit</div>
            <div class="cosmos-metrics-row">
              <span class="metric-item">📏 <strong id="hudSizeFormatted">12,742 km</strong></span>
              <span class="metric-sep">•</span>
              <span class="metric-item">⚡ Light Travel: <strong id="hudLightTime">0.04 sec</strong></span>
            </div>
          </div>
        </div>

        <div class="cosmos-top-actions">
          <button class="btn-cosmos-top dossier-toggle" id="btnToggleDossier" title="Toggle Astrophysical Dossier">
            📖 Science Dossier
          </button>
          <button class="btn-cosmos-top exit-btn" id="btnExitCosmos" title="Return to Earth Explorer">
            ✕ Exit Cosmic View
          </button>
        </div>
      </div>

      <!-- BOTTOM CONTROL CONSOLE -->
      <div class="cosmos-bottom-console">
        <!-- Scale Milestones Pills -->
        <div class="cosmos-milestones-row">
          <button class="cosmos-pill active" data-exp="7">🌍 10⁷m Earth</button>
          <button class="cosmos-pill" data-exp="11">☀️ 10¹¹m Inner Solar</button>
          <button class="cosmos-pill" data-exp="13">🪐 10¹³m Solar System</button>
          <button class="cosmos-pill" data-exp="16">🛰️ 10¹⁶m Interstellar</button>
          <button class="cosmos-pill" data-exp="21">🌀 10²¹m Milky Way</button>
          <button class="cosmos-pill" data-exp="23">🌌 10²³m Local Group</button>
          <button class="cosmos-pill" data-exp="26">🕸️ 10²⁶m Cosmic Web</button>
        </div>

        <!-- Continuous Scrubber Bar -->
        <div class="cosmos-scrubber-wrap">
          <button class="btn-step-zoom" id="btnZoomIn10x" title="Step 10x Inward (Closer)">− 10×</button>
          <div class="slider-track-wrap">
            <input type="range" id="cosmosScaleSlider" min="7.0" max="26.0" step="0.05" value="7.0" />
            <div class="scale-ticks-row">
              <span>Earth</span>
              <span>Solar</span>
              <span>Interstellar</span>
              <span>Milky Way</span>
              <span>Local Group</span>
              <span>Observable Universe</span>
            </div>
          </div>
          <button class="btn-step-zoom" id="btnZoomOut10x" title="Step 10x Outward (Broader)">+ 10×</button>
        </div>

        <!-- Cinematic Flight Bar -->
        <div class="cosmos-flight-bar">
          <button class="btn-flight-play" id="btnFlyOutward">
            🚀 Fly Outward to Edge of Universe
          </button>
          <button class="btn-flight-play" id="btnFlyInward" style="display: none;">
            🌍 Fly Inward to Earth
          </button>
          <div class="flight-speed-group">
            <span class="speed-label">WARP:</span>
            <button class="btn-speed active" data-speed="1.0">1×</button>
            <button class="btn-speed" data-speed="2.5">2.5×</button>
            <button class="btn-speed" data-speed="5.0">5×</button>
          </div>
        </div>
      </div>

      <!-- ASTROPHYSICAL DOSSIER DRAWER (RIGHT) -->
      <aside class="cosmos-dossier-drawer" id="cosmosDossierDrawer">
        <div class="dossier-header">
          <div class="dossier-title-group">
            <span class="dossier-tag" id="dosTag">ORDER OF MAGNITUDE: 10⁷ m</span>
            <h2 class="dossier-title" id="dosTitle">Earth & Low Orbit</h2>
            <div class="dossier-subtitle" id="dosSubtitle">Planetary Realm • The Blue Marble</div>
          </div>
          <button class="btn-close-dossier" id="btnCloseDossier">✕</button>
        </div>

        <div class="dossier-content-scroll">
          <div class="dossier-section">
            <div class="section-label">DOMINANT FORCE</div>
            <div class="force-badge" id="dosForce">Planetary Gravity & Electromagnetism</div>
          </div>

          <div class="dossier-section">
            <div class="section-label">ASTROPHYSICAL OVERVIEW</div>
            <p class="dossier-desc" id="dosDesc"></p>
          </div>

          <div class="dossier-section">
            <div class="section-label">KEY PHYSICAL MILESTONES</div>
            <div class="milestones-table" id="dosMilestonesTable"></div>
          </div>

          <div class="dossier-fact-card">
            <div class="fact-card-title">💡 MIND-EXPANDING FACT</div>
            <p class="fact-card-text" id="dosDeepFact"></p>
          </div>

          <!-- AI COSMIC GUIDE -->
          <div class="cosmos-ai-box">
            <div class="ai-box-header">
              <span class="ai-sparkle">✨</span>
              <span class="ai-box-title">AI COSMIC INTELLIGENCE</span>
            </div>
            <p class="ai-box-intro">Tap any cosmic inquiry to warp the camera across light-years:</p>
            <div class="ai-query-chips" id="aiQueryChips"></div>

            <div class="ai-answer-card" id="aiAnswerCard" style="display: none;">
              <div class="ai-answer-q" id="aiAnswerQ"></div>
              <div class="ai-answer-body" id="aiAnswerBody"></div>
            </div>
          </div>
        </div>
      </aside>
    `;
  }

  bindEvents() {
    // 1. Slider change & input
    const slider = document.getElementById('cosmosScaleSlider');
    slider?.addEventListener('input', (e) => {
      const exp = parseFloat(e.target.value);
      this.setScale(exp, false);
    });

    // 2. Milestone pills
    this.container.querySelectorAll('.cosmos-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        sounds.playClick();
        const exp = parseFloat(btn.dataset.exp);
        this.setScale(exp, true);
      });
    });

    // 3. Step buttons
    document.getElementById('btnZoomIn10x')?.addEventListener('click', () => {
      sounds.playClick();
      const current = this.sceneEngine ? this.sceneEngine.targetExponent : 7.0;
      this.setScale(Math.max(7.0, current - 1.0), true);
    });
    document.getElementById('btnZoomOut10x')?.addEventListener('click', () => {
      sounds.playClick();
      const current = this.sceneEngine ? this.sceneEngine.targetExponent : 7.0;
      this.setScale(Math.min(26.0, current + 1.0), true);
    });

    // 4. Dossier Drawer Toggle
    document.getElementById('btnToggleDossier')?.addEventListener('click', () => {
      sounds.playClick();
      const drawer = document.getElementById('cosmosDossierDrawer');
      drawer?.classList.toggle('open');
    });
    document.getElementById('btnCloseDossier')?.addEventListener('click', () => {
      sounds.playClick();
      document.getElementById('cosmosDossierDrawer')?.classList.remove('open');
    });

    // 5. Exit button
    document.getElementById('btnExitCosmos')?.addEventListener('click', () => {
      sounds.playClick();
      this.exitMode();
    });

    // 6. Cinematic Flight Controls
    const btnFlyOut = document.getElementById('btnFlyOutward');
    const btnFlyIn = document.getElementById('btnFlyInward');

    btnFlyOut?.addEventListener('click', () => {
      if (this.isAutoFlying) {
        this.stopAutoFlight();
      } else {
        this.startAutoFlight(1);
      }
    });

    btnFlyIn?.addEventListener('click', () => {
      if (this.isAutoFlying) {
        this.stopAutoFlight();
      } else {
        this.startAutoFlight(-1);
      }
    });

    // Speed buttons
    this.container.querySelectorAll('.btn-speed').forEach(btn => {
      btn.addEventListener('click', () => {
        sounds.playClick();
        this.container.querySelectorAll('.btn-speed').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.flightSpeed = parseFloat(btn.dataset.speed);
      });
    });

    // 7. Mouse drag rotation on 3D viewport
    const viewport = document.getElementById('mapRenderCanvas');
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    viewport?.addEventListener('mousedown', (e) => {
      if (!this.isActive) return;
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isActive || !isDragging || !this.sceneEngine) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      prevMouse = { x: e.clientX, y: e.clientY };
      this.sceneEngine.rotateBy(dx, dy);
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Wheel zoom
    viewport?.addEventListener('wheel', (e) => {
      if (!this.isActive || !this.sceneEngine) return;
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1 : -1;
      this.sceneEngine.zoomBy(factor);
      const slider = document.getElementById('cosmosScaleSlider');
      if (slider) slider.value = this.sceneEngine.targetExponent;
    }, { passive: false });

    // 8. Populate AI Query Chips
    this.populateAiQueries();
  }

  setScale(exp, updateSlider = true) {
    if (this.sceneEngine) {
      this.sceneEngine.setExponent(exp);
    }
    const slider = document.getElementById('cosmosScaleSlider');
    if (slider && updateSlider) {
      slider.value = exp;
    }

    // Find nearest scale data
    this.updateActiveScaleData(exp);
    this.updateMilestonePillStates(exp);
  }

  updateActiveScaleData(exp) {
    let best = COSMOS_SCALES[0];
    let bestDist = 999;
    COSMOS_SCALES.forEach(s => {
      const dist = Math.abs(s.exponent - exp);
      if (dist < bestDist) {
        bestDist = dist;
        best = s;
      }
    });

    this.currentScaleData = best;
    this.updateDossierContent(best);
  }

  updateMilestonePillStates(exp) {
    this.container.querySelectorAll('.cosmos-pill').forEach(btn => {
      const bExp = parseFloat(btn.dataset.exp);
      const isActive = Math.abs(bExp - exp) < 1.4;
      btn.classList.toggle('active', isActive);
    });
  }

  syncTelemetryUi() {
    if (!this.sceneEngine) return;
    const exp = this.sceneEngine.currentExponent;

    // Exponent Badge
    const hudExp = document.getElementById('hudExponent');
    if (hudExp) {
      hudExp.innerText = `10^${exp.toFixed(1)} m`;
    }

    const s = this.currentScaleData;
    const hudRealm = document.getElementById('hudRealmName');
    const hudSize = document.getElementById('hudSizeFormatted');
    const hudLight = document.getElementById('hudLightTime');

    if (hudRealm) hudRealm.innerText = s.name;
    if (hudSize) hudSize.innerText = s.sizeFormatted;
    if (hudLight) hudLight.innerText = s.lightTime;

    // Toggle Fly Outward / Inward button visibility depending on scale
    const btnFlyOut = document.getElementById('btnFlyOutward');
    const btnFlyIn = document.getElementById('btnFlyInward');
    if (exp >= 25.5) {
      if (btnFlyOut) btnFlyOut.style.display = 'none';
      if (btnFlyIn) btnFlyIn.style.display = 'inline-flex';
    } else {
      if (btnFlyOut) btnFlyOut.style.display = 'inline-flex';
      if (btnFlyIn) btnFlyIn.style.display = 'none';
    }
  }

  updateDossierContent(s) {
    const dosTag = document.getElementById('dosTag');
    const dosTitle = document.getElementById('dosTitle');
    const dosSubtitle = document.getElementById('dosSubtitle');
    const dosForce = document.getElementById('dosForce');
    const dosDesc = document.getElementById('dosDesc');
    const dosDeepFact = document.getElementById('dosDeepFact');
    const table = document.getElementById('dosMilestonesTable');

    if (dosTag) dosTag.innerText = `ORDER OF MAGNITUDE: ${s.meters}`;
    if (dosTitle) dosTitle.innerText = s.name;
    if (dosSubtitle) dosSubtitle.innerText = s.subtitle;
    if (dosForce) dosForce.innerText = s.dominantForce;
    if (dosDesc) dosDesc.innerText = s.description;
    if (dosDeepFact) dosDeepFact.innerText = s.deepFact;

    if (table) {
      table.innerHTML = s.milestones.map(m => `
        <div class="m-row">
          <span class="m-name">${m.name}</span>
          <span class="m-val">${m.value}</span>
        </div>
      `).join('');
    }
  }

  populateAiQueries() {
    const chipsContainer = document.getElementById('aiQueryChips');
    if (!chipsContainer) return;

    chipsContainer.innerHTML = COSMIC_AI_QUESTIONS.map((item, idx) => `
      <button class="ai-query-chip" data-idx="${idx}">
        ${item.q}
      </button>
    `).join('');

    chipsContainer.querySelectorAll('.ai-query-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        sounds.playClick();
        const idx = parseInt(btn.dataset.idx);
        const item = COSMIC_AI_QUESTIONS[idx];

        // Animate card
        const card = document.getElementById('aiAnswerCard');
        const qElem = document.getElementById('aiAnswerQ');
        const bElem = document.getElementById('aiAnswerBody');

        if (card && qElem && bElem) {
          card.style.display = 'block';
          qElem.innerText = `Q: ${item.q}`;
          bElem.innerText = item.answer;
        }

        // Warp camera to the target exponent
        this.setScale(item.targetExponent, true);
        sounds.playWhoosh();
      });
    });
  }

  startAutoFlight(direction = 1) {
    this.isAutoFlying = true;
    this.flightDirection = direction;

    const btnOut = document.getElementById('btnFlyOutward');
    const btnIn = document.getElementById('btnFlyInward');
    if (direction === 1 && btnOut) btnOut.innerText = '⏸ Pause Cosmic Flight';
    if (direction === -1 && btnIn) btnIn.innerText = '⏸ Pause Cosmic Flight';

    if (this.flightInterval) clearInterval(this.flightInterval);
    this.flightInterval = setInterval(() => {
      if (!this.isAutoFlying || !this.sceneEngine) return;
      const step = 0.08 * this.flightSpeed * this.flightDirection;
      const nextExp = this.sceneEngine.targetExponent + step;

      if (nextExp >= 26.0) {
        this.setScale(26.0, true);
        this.stopAutoFlight();
      } else if (nextExp <= 7.0) {
        this.setScale(7.0, true);
        this.stopAutoFlight();
      } else {
        this.setScale(nextExp, true);
      }
    }, 30);
  }

  stopAutoFlight() {
    this.isAutoFlying = false;
    if (this.flightInterval) {
      clearInterval(this.flightInterval);
      this.flightInterval = null;
    }

    const btnOut = document.getElementById('btnFlyOutward');
    const btnIn = document.getElementById('btnFlyInward');
    if (btnOut) btnOut.innerText = '🚀 Fly Outward to Edge of Universe';
    if (btnIn) btnIn.innerText = '🌍 Fly Inward to Earth';
  }
}
