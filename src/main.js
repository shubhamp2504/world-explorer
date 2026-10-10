import './style.css';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { COUNTRIES } from './countries.js';
import { CRAZY_FACTS, WILD_COUNTRY_FACTS } from './facts.js';
import { FAVORITE_CATEGORIES, INITIAL_FAVORITES } from './data/favorites.js';
import { BATTLE_QUESTIONS, MYSTERY_LOCATIONS } from './data/games.js';
import { INDIA_STATES_DATA, INDIA_BATTLE_QUESTIONS, KBC_QUIZ_BANK } from './data/indiaData.js';
import { SURPRISE_LOCATIONS } from './data/surprises.js';
import { PLANETS_DATA } from './data/planets.js';
import { EarthGlobe3D } from './globe3d.js';
import { sounds } from './audio.js';

// ============================================================
// GLOBAL STATE & SYSTEM REGISTRIES
// ============================================================
let worldData = null;
let countriesGeo = null;
const allCountries = [...COUNTRIES];
const countryMap = new Map();
const countryByNameLower = new Map();

let globe3dInstance = null;
let currentMode = 'explore';          // explore | favorites | battle | mystery
let currentProjection = 'flat';       // flat | globe
let showDayNightTerminator = true;
let selectedCountry = null;
let lastSurpriseIndex = -1;

// Internet's Favorite Places State (Authentic & Persistent)
const USER_VOTED_KEY = 'we_user_voted_places';
const CUSTOM_PLACES_KEY = 'we_custom_suggested_places';
const PERSISTED_VOTES_KEY = 'we_persisted_place_votes';
let userVotedPlaceIds = new Set(JSON.parse(localStorage.getItem(USER_VOTED_KEY) || '[]'));
let customSuggestedPlaces = JSON.parse(localStorage.getItem(CUSTOM_PLACES_KEY) || '[]');
let favoritesList = [...INITIAL_FAVORITES, ...customSuggestedPlaces];
let selectedFavCategory = 'all';
let selectedFavRegion = 'all';
let favSearchQuery = '';

// Hydrate saved votes immediately on boot so votes never reset across reloads
try {
  const savedVotes = JSON.parse(localStorage.getItem(PERSISTED_VOTES_KEY) || '{}');
  favoritesList.forEach(fav => {
    if (savedVotes[fav.id] !== undefined && savedVotes[fav.id] > fav.votes) {
      fav.votes = savedVotes[fav.id];
    }
  });
} catch (e) {}

// UTC Time Reference for Astronomical Day/Night Terminator
const now = new Date();
let scrubberTimeMinutes = now.getUTCHours() * 60 + now.getUTCMinutes(); // Actual UTC time

// Battle Royale & KBC Quiz Engine State
let battleSubMode = 'world'; // 'world' | 'india' | 'kbc'
let activeQuestionPool = [];
let battleQuestionIndex = 0;
let battleScore = 0;
let battleStreak = 0;
let battleTimerSeconds = 15;
let battleTimerInterval = null;
let currentBattleQuestion = null;
let kbcAnswered = false;
let battleAnswerLocked = false;
let lifeline5050Used = false;
let lifelineHintUsed = false;

// Guess Where Mystery State
let mysteryIndex = 0;
let mysteryClueRound = 1;
let currentMysteryTarget = null;
let mysteryScore = 1000;

// D3 Variables
let svg, g, projection, pathGen, zoom;
let width, height;
let rotateTimer = null;
let isGlobeRotating = false;

const WORLD_TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Aliases mapping for TopoJSON
const NAME_ALIASES = {
  'united states of america': 'united states',
  'dem. rep. congo': 'dr congo',
  'congo': 'congo',
  'dominican rep.': 'dominican republic',
  "côte d'ivoire": 'ivory coast',
  'central african rep.': 'central african republic',
  'eq. guinea': 'equatorial guinea',
  'north korea': 'north korea',
  'south korea': 'south korea',
  'solomon is.': 'solomon islands',
  'bosnia and herz.': 'bosnia and herzegovina',
  'macedonia': 'north macedonia',
  's. sudan': 'south sudan',
  'russia': 'russia',
  'bahamas': 'bahamas',
  'tanzania': 'tanzania',
  'syria': 'syria',
  'laos': 'laos',
  'iran': 'iran',
  'vietnam': 'vietnam',
  'brunei': 'brunei',
  'moldova': 'moldova',
  'bolivia': 'bolivia',
  'venezuela': 'venezuela'
};

// ============================================================
// SYSTEM BOOTSTRAP & DATA SYNC
// ============================================================
async function boot() {
  updateLoading(25, 'Loading textures...');

  // Index countries
  allCountries.forEach(c => {
    countryMap.set(c.code, c);
    countryByNameLower.set(c.name.toLowerCase(), c);
  });

  // Fetch topology
  try {
    const res = await fetch(WORLD_TOPO_URL);
    worldData = await res.json();
    countriesGeo = topojson.feature(worldData, worldData.objects.countries);
  } catch (err) {
    console.warn('Network topology fetch error, continuing gracefully:', err);
  }

  updateLoading(65, 'Building Solar System...');

  if (countriesGeo && countriesGeo.features) {
    countriesGeo.features.forEach(f => {
      const topoName = f.properties?.name || '';
      const rawLower = topoName.toLowerCase().trim();
      const resolvedName = NAME_ALIASES[rawLower] || rawLower;

      let match = countryByNameLower.get(resolvedName);
      if (!match) {
        for (const [key, c] of countryByNameLower.entries()) {
          if (key.includes(rawLower) || rawLower.includes(key)) {
            match = c;
            break;
          }
        }
      }

      if (match) {
        f.properties.countryCode = match.code;
        f.properties.countryObj = match;
      }
    });
  }

  updateLoading(90, 'Initializing Earth...');
  await new Promise(r => setTimeout(r, 120));

  initD3Map();
  initNavigation();
  initSearch();
  initQuickJumpBar();
  initPlanetaryExplorer();
  initFavoritesSystem();
  initSuggestPlaceSystem();
  initBattleRoyale();
  initMysteryGame();
  initRandomSurpriseButton();
  initSharingModal();
  initGuideModal();
  startGlobalClock();
  startFooterTicker();

  updateLoading(100, 'Ready!');
  setTimeout(() => {
    const ls = document.getElementById('loadingScreen');
    if (ls) {
      ls.classList.add('fade-out');
      setTimeout(() => { ls.style.display = 'none'; }, 600);
    }
  }, 2500);

  // Launch directly into Photorealistic 3D Solar System Orrery
  setTimeout(() => {
    document.getElementById('btnGlobeView')?.click();
    setTimeout(() => {
      if (globe3dInstance) {
        globe3dInstance.viewWholeSolarSystem();
      }
      openPlanetDossier('system');
    }, 250);
  }, 2750);
}

function updateLoading(pct, status) {
  const fill = document.getElementById('loadingFill');
  const txt = document.getElementById('loadingStatus');
  if (fill) fill.style.width = `${pct}%`;
  if (txt) txt.textContent = status;
}

// ============================================================
// D3 MAP ENGINE (2D Natural Earth & 3D Globe + Solar Terminator)
// ============================================================
function initD3Map() {
  const container = document.getElementById('mapRenderCanvas');
  svg = d3.select('#earthSvg');
  width = container.clientWidth || 900;
  height = container.clientHeight || 600;

  svg.attr('width', width).attr('height', height);

  zoom = d3.zoom()
    .scaleExtent([0.8, 22])
    .on('zoom', (e) => {
      g.attr('transform', e.transform);
    });
  svg.call(zoom);
  svg.on('dblclick.zoom', null);
  svg.on('dblclick', () => resetMapView());
  svg.on('click', (event) => {
    if (currentMode === 'mystery') {
      const [px, py] = d3.pointer(event, g.node());
      const coords = projection.invert([px, py]);
      if (coords) handleMysteryMapGuess(coords[0], coords[1]);
    }
  });

  g = svg.append('g');

  buildFlatProjection();
  renderMapLayers();

  window.addEventListener('resize', () => {
    width = container.clientWidth;
    height = container.clientHeight;
    svg.attr('width', width).attr('height', height);
    if (currentProjection === 'flat') buildFlatProjection();
    else buildGlobeProjection();
    renderMapLayers();
  });
}

function buildFlatProjection() {
  projection = d3.geoNaturalEarth1()
    .scale(width / 5.8)
    .translate([width / 2, height / 2]);
  pathGen = d3.geoPath().projection(projection);
}

function buildGlobeProjection() {
  projection = d3.geoOrthographic()
    .scale(Math.min(width, height) * 0.44)
    .translate([width / 2, height / 2])
    .clipAngle(90);
  pathGen = d3.geoPath().projection(projection);
}

function renderMapLayers() {
  g.selectAll('*').remove();

  // 1. Ocean Sphere
  g.append('path')
    .datum({ type: 'Sphere' })
    .attr('class', 'sphere')
    .attr('d', pathGen);

  // 2. Graticules
  const graticule = d3.geoGraticule()();
  g.append('path')
    .datum(graticule)
    .attr('class', 'graticule')
    .attr('d', pathGen);

  // 3. Country Geometries
  if (countriesGeo && countriesGeo.features) {
    g.selectAll('.country-path')
      .data(countriesGeo.features)
      .join('path')
      .attr('class', d => {
        const c = d.properties?.countryObj;
        const reg = c ? c.region.replace(/\s+/g, '') : 'Other';
        return `country-path region-${reg}`;
      })
      .attr('d', pathGen)
      .attr('data-code', d => d.properties?.countryCode || '')
      .on('mouseover', handleCountryHover)
      .on('mousemove', handleMouseMove)
      .on('mouseout', handleMouseOut)
      .on('click', handleCountryClick);
  }

  // 4. Solar Terminator Shadow (Day/Night)
  if (showDayNightTerminator) {
    renderSolarTerminator();
  }

  // 5. Active Feature Overlays depending on mode
  if (currentMode === 'favorites') {
    renderFavoriteMarkers();
  }

  // 6. Ocean Border
  g.append('path')
    .datum({ type: 'Sphere' })
    .attr('class', 'sphere-border')
    .attr('d', pathGen);

  if (currentProjection === '2d-globe') {
    startGlobeRotation();
  } else if (rotateTimer) {
    rotateTimer.stop();
  }
}

// Day/Night Solar Terminator Calculation with Real Sun & Moon Celestial Bodies
function renderSolarTerminator() {
  const now = new Date();
  const utcHours = Math.floor(scrubberTimeMinutes / 60);
  const utcMins = scrubberTimeMinutes % 60;
  
  // Day of year calculation for solar declination
  const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  
  // Solar declination & Zenith longitude
  const declination = -23.44 * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10));
  const sunLng = (12 - (utcHours + utcMins / 60)) * 15;
  const sunLat = declination;

  // True Antipodal point (center of the night hemisphere where Sun is directly on the opposite side)
  let nightCenterLng = sunLng >= 0 ? sunLng - 180 : sunLng + 180;
  const nightCenterLat = -declination;

  // 1. Dark Twilight Shading (Night Hemisphere centered at true antipodal point)
  const circle = d3.geoCircle()
    .center([nightCenterLng, nightCenterLat])
    .radius(90);

  g.append('path')
    .datum(circle())
    .attr('class', 'terminator-shadow')
    .attr('d', pathGen);

  // 2. Update Header Celestial Status Pill
  const sunPill = document.getElementById('sunPositionVal');
  const moonPill = document.getElementById('moonPhaseVal');
  if (sunPill) sunPill.textContent = `${String(utcHours).padStart(2,'0')}:${String(utcMins).padStart(2,'0')} UTC (Zenith)`;
  if (moonPill) {
    const moonPhases = ['New Moon 🌑', 'Waxing Crescent 🌒', 'First Quarter 🌓', 'Waxing Gibbous 🌔', 'Full Moon 🌕', 'Waning Gibbous 🌖', 'Last Quarter 🌗', 'Waning Crescent 🌘'];
    const phaseIdx = Math.floor((now.getDate() % 28) / 3.5);
    moonPill.textContent = moonPhases[phaseIdx] || 'Waxing 🌔';
  }

  // Sync with 3D Globe if active
  if (globe3dInstance) {
    globe3dInstance.setUtcTime(scrubberTimeMinutes);
  }
}

function startGlobeRotation() {
  if (rotateTimer) rotateTimer.stop();
  isGlobeRotating = true;
  let lambda = 0;
  rotateTimer = d3.timer((elapsed) => {
    if (!isGlobeRotating) return;
    lambda = (elapsed / 160) % 360;
    projection.rotate([lambda, -15, 0]);
    g.selectAll('path').attr('d', pathGen);
    // Reposition markers
    g.selectAll('.favorite-marker').attr('transform', d => {
      const p = projection([d.lng, d.lat]);
      return p ? `translate(${p[0]},${p[1]})` : 'translate(-999,-999)';
    });
    g.selectAll('.live-event-marker').attr('transform', d => {
      const p = projection([d.lng, d.lat]);
      return p ? `translate(${p[0]},${p[1]})` : 'translate(-999,-999)';
    });
  });

  svg.on('mousedown.rot touchstart.rot', () => { isGlobeRotating = false; });
}

// Unified 3D and 2D Camera Navigation
function flyCameraToCoordinates(lat, lng, zoomLevel = 4) {
  if (lat == null || lng == null) return;
  if (currentProjection === 'globe' && globe3dInstance) {
    // Smooth cinematic 3D globe camera sweep
    globe3dInstance.flyTo(lat, lng, Math.max(2.2, 5.5 - zoomLevel * 0.6));
  } else {
    // 2D SVG Map transition
    zoomToCoordinates(lng, lat, zoomLevel);
  }
}

// Zoom & Map Transitions for 2D
function zoomToCoordinates(lng, lat, scaleLevel = 4) {
  const p = projection([lng, lat]);
  if (!p) return;
  svg.transition().duration(900).call(
    zoom.transform,
    d3.zoomIdentity.translate(width / 2 - scaleLevel * p[0], height / 2 - scaleLevel * p[1]).scale(scaleLevel)
  );
}

function resetMapView() {
  svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity);
}

// Tooltip handler
function handleCountryHover(event, d) {
  const c = d.properties?.countryObj;
  const name = c ? c.name : d.properties?.name || 'World Landmark';
  const flag = c ? c.flag : '📍';
  const cap = c ? `🏛️ Capital: ${c.capital}` : '';
  const pop = c && c.population ? `👥 Population: ${formatNumber(c.population)}` : '';

  const tt = document.getElementById('earthTooltip');
  if (!tt) return;
  tt.innerHTML = `
    <div style="font-size:1.4rem;margin-bottom:2px;">${flag}</div>
    <div style="font-weight:800;color:#fff;font-size:0.95rem;">${name}</div>
    <div style="color:var(--accent-cyan);font-size:0.75rem;">${cap}</div>
    <div style="color:var(--txt-muted);font-size:0.72rem;">${pop}</div>
  `;
  tt.classList.add('visible');
  positionTooltip(event, tt);
}

function handleMouseMove(event) {
  const tt = document.getElementById('earthTooltip');
  if (tt) positionTooltip(event, tt);
}

function handleMouseOut() {
  document.getElementById('earthTooltip')?.classList.remove('visible');
}

function positionTooltip(event, tt) {
  const x = event.clientX + 16;
  const y = event.clientY - 20;
  const rect = tt.getBoundingClientRect();
  tt.style.left = `${Math.min(x, window.innerWidth - rect.width - 15)}px`;
  tt.style.top  = `${Math.max(10, Math.min(y, window.innerHeight - rect.height - 15))}px`;
}

// Map Click Router (Supports Explore, Battle Royale, Guess Where)
function handleCountryClick(event, d) {
  event.stopPropagation();
  const c = d.properties?.countryObj;
  const code = d.properties?.countryCode;

  // 1. In Battle Royale Mode
  if (currentMode === 'battle') {
    const [px, py] = d3.pointer(event, g.node());
    const coords = projection.invert([px, py]);
    const clickedLng = coords ? coords[0] : null;
    const clickedLat = coords ? coords[1] : null;
    handleBattleMapClick(code, c, clickedLng, clickedLat, px, py);
    return;
  }

  // 2. In Guess Where Mystery Mode
  if (currentMode === 'mystery') {
    const [px, py] = d3.pointer(event, g.node());
    const coords = projection.invert([px, py]);
    if (coords) handleMysteryMapGuess(coords[0], coords[1]);
    return;
  }

  // 3. Normal Explore Mode
  if (c) {
    selectCountry(c);
    highlightCountryPath(c.code);
    zoomToCoordinates(c.lng || 0, c.lat || 0, 3.5);
  }
}

function highlightCountryPath(code) {
  g.selectAll('.country-path').classed('selected', false);
  if (code) {
    g.selectAll(`.country-path[data-code="${code}"]`).classed('selected', true);
  }
}

// ============================================================
// 1. INTERNET'S FAVORITE PLACES SYSTEM (VOTING & FILTERING)
// ============================================================
function loadPersistedVotes() {
  try {
    return JSON.parse(localStorage.getItem(PERSISTED_VOTES_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function savePersistedVote(placeId, count) {
  try {
    const map = loadPersistedVotes();
    map[placeId] = count;
    localStorage.setItem(PERSISTED_VOTES_KEY, JSON.stringify(map));
  } catch (e) {}
}

async function syncGlobalVotes() {
  const localVotes = loadPersistedVotes();
  let localUpdated = false;
  favoritesList.forEach(fav => {
    if (localVotes[fav.id] !== undefined && localVotes[fav.id] > fav.votes) {
      fav.votes = localVotes[fav.id];
      localUpdated = true;
    }
  });
  if (localUpdated) {
    renderFavoritesLeaderboard();
  }

  try {
    const res = await fetch('/api/vote');
    if (!res.ok) return;
    const data = await res.json();
    if (data.success && data.votes && typeof data.votes === 'object') {
      let redisUpdated = false;
      const combined = { ...localVotes };
      favoritesList.forEach(fav => {
        const remoteCount = data.votes[fav.id];
        if (remoteCount !== undefined && remoteCount > fav.votes) {
          fav.votes = remoteCount;
          combined[fav.id] = remoteCount;
          redisUpdated = true;
        }
      });
      if (redisUpdated) {
        localStorage.setItem(PERSISTED_VOTES_KEY, JSON.stringify(combined));
        renderFavoritesLeaderboard();
      }
    }
  } catch (err) {
    // Offline or local development fallback
  }
}

function initFavoritesSystem() {
  syncGlobalVotes();
  const filterScroll = document.getElementById('favFilterScroll');
  if (filterScroll) {
    filterScroll.innerHTML = FAVORITE_CATEGORIES.map(cat => `
      <button class="fav-cat-btn ${cat.id === 'all' ? 'active' : ''}" data-cat="${cat.id}">
        <span>${cat.icon}</span>
        <span>${cat.label}</span>
      </button>
    `).join('');

    filterScroll.querySelectorAll('.fav-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filterScroll.querySelectorAll('.fav-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedFavCategory = btn.dataset.cat;
        renderFavoriteMarkers();
        renderFavoritesLeaderboard();
      });
    });
  }

  // Quick Search Filter within Favorites Drawer
  const searchInput = document.getElementById('favSearchInput');
  searchInput?.addEventListener('input', (e) => {
    favSearchQuery = e.target.value.trim().toLowerCase();
    renderFavoritesLeaderboard();
  });

  // Continent / Region Pills
  const regionBar = document.getElementById('favRegionBar');
  regionBar?.querySelectorAll('.fav-region-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      regionBar.querySelectorAll('.fav-region-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      selectedFavRegion = pill.dataset.region;
      renderFavoritesLeaderboard();
      renderFavoriteMarkers();
    });
  });

  renderFavoritesLeaderboard();
}

function getFilteredFavorites() {
  return favoritesList.filter(f => {
    // 1. Category filter
    if (selectedFavCategory !== 'all' && f.category !== selectedFavCategory) {
      return false;
    }
    // 2. Region / Continent filter
    if (selectedFavRegion !== 'all' && f.continent !== selectedFavRegion) {
      return false;
    }
    // 3. Search query (matches name, city, country, or category)
    if (favSearchQuery) {
      const matchName = f.name.toLowerCase().includes(favSearchQuery);
      const matchCity = (f.city || '').toLowerCase().includes(favSearchQuery);
      const matchCountry = f.country.toLowerCase().includes(favSearchQuery);
      const matchCat = f.category.toLowerCase().includes(favSearchQuery);
      if (!matchName && !matchCity && !matchCountry && !matchCat) return false;
    }
    return true;
  });
}

function renderFavoriteMarkers() {
  g.selectAll('.favorite-marker-group').remove();

  const filtered = getFilteredFavorites();
  const markerGroup = g.append('g').attr('class', 'favorite-marker-group');

  filtered.forEach(fav => {
    const p = projection([fav.lng, fav.lat]);
    if (!p) return;

    const isHeritage = (fav.category === 'heritage');
    const badgeColor = isHeritage ? '#f59e0b' : '#38bdf8';
    const badgeGlow = isHeritage ? 'rgba(245, 158, 11, 0.6)' : 'rgba(56, 189, 248, 0.6)';

    const gMarker = markerGroup.append('g')
      .datum(fav)
      .attr('class', 'favorite-marker')
      .attr('transform', `translate(${p[0]},${p[1]})`)
      .style('cursor', 'pointer')
      .on('click', (e) => {
        e.stopPropagation();
        openPlaceModal(fav);
        flyCameraToCoordinates(fav.lat, fav.lng, 4.5);
      });

    // Elegant Pulsing Glowing Outer Halo
    gMarker.append('circle')
      .attr('class', 'marker-glow-circle')
      .attr('r', 12)
      .attr('fill', 'none')
      .attr('stroke', badgeColor)
      .attr('stroke-width', 1.8)
      .attr('opacity', 0.85);

    // Inner Glowing Badge Center
    gMarker.append('circle')
      .attr('r', 9)
      .attr('fill', '#0b152d')
      .attr('stroke', badgeColor)
      .attr('stroke-width', 1.5)
      .style('filter', `drop-shadow(0 0 8px ${badgeGlow})`);

    // Cultural / Wonder Symbol
    gMarker.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 3.5)
      .attr('font-size', '10px')
      .attr('fill', '#fff')
      .text(isHeritage ? '🏛️' : '✨');
  });
}

function renderFavoritesLeaderboard() {
  const container = document.getElementById('favLeaderboard');
  const subEl = document.getElementById('favLeaderboardSubtitle');
  if (!container) return;

  const filtered = getFilteredFavorites().sort((a, b) => b.votes - a.votes);

  if (subEl) {
    subEl.textContent = `Showing ${filtered.length} authentic destinations worldwide.`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 32px 16px; color: var(--txt-muted);">
        <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
        <p style="font-size: 0.88rem; font-weight: 600; color: #fff;">No places found</p>
        <p style="font-size: 0.78rem;">Try clearing your search query or choosing another region.</p>
      </div>
    `;
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];

  container.innerHTML = filtered.map((fav, i) => {
    const displayLocation = fav.city ? `${fav.city}, ${fav.country}` : fav.country;
    return `
      <div class="fav-leader-item" data-id="${fav.id}">
        <span class="fav-lead-rank">${medals[i] || `#${i + 1}`}</span>
        <img class="fav-lead-thumb" src="${fav.image}" alt="${fav.name}" loading="lazy" />
        <div class="fav-lead-info">
          <div class="fav-lead-name" title="${fav.name}">${fav.name}</div>
          <div class="fav-lead-sub" title="${displayLocation}">
            <span>📍 ${displayLocation}</span>
          </div>
          <div style="margin-top: 4px;">
            <span class="fav-lead-tag">${fav.category.toUpperCase()}</span>
          </div>
        </div>
        <div class="fav-lead-votes">❤️ ${fav.votes.toLocaleString()}</div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.fav-leader-item').forEach(el => {
    el.addEventListener('click', () => {
      const fav = favoritesList.find(f => f.id === el.dataset.id);
      if (fav) {
        openPlaceModal(fav);
        flyCameraToCoordinates(fav.lat, fav.lng, 4.5);
      }
    });
  });
}

function openPlaceModal(fav) {
  const modal = document.getElementById('placeModal');
  if (!modal) return;

  document.getElementById('placeModalImg').src = fav.image;
  document.getElementById('placeModalTitle').textContent = fav.name;
  const locationText = fav.city ? `${fav.city}, ${fav.country}` : fav.country;
  document.getElementById('placeModalCountry').textContent = `📍 ${locationText}`;
  document.getElementById('placeModalCat').textContent = fav.category.toUpperCase();
  document.getElementById('placeModalVoteCount').textContent = fav.votes.toLocaleString();
  document.getElementById('placeModalDesc').textContent = fav.description;
  document.getElementById('placeModalWhy').textContent = fav.whyLoved;

  const nearbyList = document.getElementById('placeModalNearby');
  nearbyList.innerHTML = (fav.nearby || []).map(n => `<li>${n}</li>`).join('');

  const voteBtn = document.getElementById('btnVotePlace');
  const alreadyVoted = userVotedPlaceIds.has(fav.id);
  if (alreadyVoted) {
    voteBtn.textContent = '❤️ Voted by You';
    voteBtn.style.opacity = '0.65';
    voteBtn.style.pointerEvents = 'none';
  } else {
    voteBtn.textContent = '❤️ Upvote Place';
    voteBtn.style.opacity = '1';
    voteBtn.style.pointerEvents = 'auto';
  }

  voteBtn.onclick = () => {
    if (userVotedPlaceIds.has(fav.id)) {
      showToast('⚠️ You have already voted for this destination!');
      return;
    }
    fav.votes += 1;
    userVotedPlaceIds.add(fav.id);
    localStorage.setItem(USER_VOTED_KEY, JSON.stringify([...userVotedPlaceIds]));
    savePersistedVote(fav.id, fav.votes);
    
    // If it's a custom place, update stored custom places as well
    const custIdx = customSuggestedPlaces.findIndex(p => p.id === fav.id);
    if (custIdx !== -1) {
      customSuggestedPlaces[custIdx].votes = fav.votes;
      localStorage.setItem(CUSTOM_PLACES_KEY, JSON.stringify(customSuggestedPlaces));
    }

    document.getElementById('placeModalVoteCount').textContent = fav.votes.toLocaleString();
    voteBtn.textContent = '❤️ Voted by You';
    voteBtn.style.opacity = '0.65';
    voteBtn.style.pointerEvents = 'none';
    renderFavoritesLeaderboard();
    showToast(`❤️ Genuine vote registered for ${fav.name}! Total: ${fav.votes.toLocaleString()}`);

    // Asynchronously sync to Vercel Serverless Redis API if online
    fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeId: fav.id })
    }).catch(() => {
      // Offline or local development fallback without serverless runtime
    });
  };

  document.getElementById('btnSharePlace').onclick = () => {
    openShareCardModal({
      headline: `The Internet voted this one of Earth's greatest places!`,
      subject: fav.name,
      subtext: `${fav.country} • ${fav.votes.toLocaleString()} Community Votes`,
      highlight: `Category Champion: ${fav.category.toUpperCase()} 🌟`,
      icon: '❤️'
    });
  };

  document.getElementById('btnFlyPlace').onclick = () => {
    modal.close();
    flyCameraToCoordinates(fav.lat, fav.lng, 5);
  };

  modal.showModal();
}

function initSuggestPlaceSystem() {
  const openBtn = document.getElementById('btnOpenSuggestModal');
  const closeBtn = document.getElementById('btnCloseSuggestModal');
  const cancelBtn = document.getElementById('btnCancelSuggest');
  const modal = document.getElementById('suggestPlaceModal');
  const form = document.getElementById('suggestPlaceForm');

  openBtn?.addEventListener('click', () => {
    sounds.playClick();
    modal?.showModal();
  });

  closeBtn?.addEventListener('click', () => modal?.close());
  cancelBtn?.addEventListener('click', () => modal?.close());

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('sugPlaceName')?.value.trim();
    const country = document.getElementById('sugPlaceCountry')?.value.trim();
    const category = document.getElementById('sugPlaceCategory')?.value;
    const lat = parseFloat(document.getElementById('sugPlaceLat')?.value);
    const lng = parseFloat(document.getElementById('sugPlaceLng')?.value);
    const desc = document.getElementById('sugPlaceDesc')?.value.trim();

    if (!name || !country || isNaN(lat) || isNaN(lng) || !desc) {
      showToast('⚠️ Please fill out all required fields with authentic data.');
      return;
    }

    const newPlace = {
      id: `custom-${Date.now()}`,
      name,
      country,
      category,
      lat,
      lng,
      votes: 1, // Start with submitter's initial vote
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
      description: desc,
      whyLoved: `Authentically suggested by community explorer: "${desc}"`,
      nearby: ['Scenic lookouts', 'Local cultural landmarks']
    };

    userVotedPlaceIds.add(newPlace.id);
    localStorage.setItem(USER_VOTED_KEY, JSON.stringify([...userVotedPlaceIds]));

    customSuggestedPlaces.push(newPlace);
    localStorage.setItem(CUSTOM_PLACES_KEY, JSON.stringify(customSuggestedPlaces));

    favoritesList.push(newPlace);
    renderFavoritesLeaderboard();
    renderFavoriteMarkers();

    // Asynchronously broadcast to Vercel Serverless Redis API if online
    fetch('/api/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        country,
        category,
        lat,
        lng,
        description: desc
      })
    }).catch(() => {
      // Offline or local development fallback
    });

    form.reset();
    modal?.close();
    sounds.playWhoosh();
    showToast(`🎉 "${name}" added to authentic global community leaderboard!`);

    // Jump camera to newly added place
    if (currentProjection === 'globe' && globe3dInstance) {
      globe3dInstance.flyTo(lat, lng, 3.2);
    } else {
      zoomToCoordinates(lng, lat, 4.5);
    }
  });
}

// ============================================================
// 2. GEOGRAPHY BATTLE ROYALE & KBC QUIZ ENGINE
// ============================================================
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function initBattleRoyale() {
  const exitBtn = document.getElementById('btnEndBattle');
  if (exitBtn) {
    exitBtn.addEventListener('click', () => {
      endBattleRoyale();
    });
  }

  // Sub-mode pill switchers
  const modePills = document.querySelectorAll('.battle-mode-pill');
  modePills.forEach(pill => {
    pill.addEventListener('click', () => {
      sounds.playClick();
      modePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const targetSubMode = pill.dataset.submode;
      startBattleRoyale(targetSubMode);
    });
  });

  // KBC 4-Option Buttons
  const optButtons = document.querySelectorAll('.kbc-opt-btn');
  optButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (kbcAnswered || !currentBattleQuestion || battleSubMode !== 'kbc') return;
      const chosenIdx = parseInt(btn.dataset.opt, 10);
      handleKbcOptionClick(chosenIdx, btn);
    });
  });

  // Lifelines
  document.getElementById('btnLifeline5050')?.addEventListener('click', () => {
    if (lifeline5050Used || kbcAnswered || battleSubMode !== 'kbc' || !currentBattleQuestion) return;
    lifeline5050Used = true;
    const btn = document.getElementById('btnLifeline5050');
    if (btn) btn.classList.add('used');
    sounds.playClick();
    apply5050Lifeline();
  });

  document.getElementById('btnLifelineHint')?.addEventListener('click', () => {
    if (lifelineHintUsed || kbcAnswered || battleSubMode !== 'kbc' || !currentBattleQuestion) return;
    lifelineHintUsed = true;
    const btn = document.getElementById('btnLifelineHint');
    if (btn) btn.classList.add('used');
    sounds.playClick();
    showToast(`💡 Hint: Think about ${currentBattleQuestion.category || 'physical geography'}!`);
  });
}

async function fetchServerQuizQuestions(mode) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`/api/quiz?mode=${encodeURIComponent(mode)}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
      return data.questions;
    }
  } catch (err) {
    console.warn(`[Quiz Engine] Serverless /api/quiz unreachable (${err.message}). Using verified local syllabus bank.`);
  }
  return null;
}

async function validateAnswerServerless(questionId, chosenAnswer, subMode) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, chosenAnswer, subMode }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success) {
      return data;
    }
  } catch (err) {
    console.warn(`[Quiz Engine] Serverless validation offline (${err.message}). Evaluating locally.`);
  }
  return null;
}

// ============================================================
// ASYNCHRONOUS ZERO-LAG GROQ AI MENTOR CALL
// ============================================================
async function requestAiMentorInsight(question, chosenAnswer, correctAnswer, explanation, category) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2800); // 2.8s strict ceiling
    const res = await fetch('/api/mentor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, chosenAnswer, correctAnswer, explanation, category }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success) {
      return data;
    }
  } catch (err) {
    // Non-blocking background failure: UI continues effortlessly
  }
  return null;
}

async function startBattleRoyale(subMode = 'world') {
  battleSubMode = subMode;
  battleScore = 0;
  battleStreak = 0;
  battleQuestionIndex = 0;
  lifeline5050Used = false;
  lifelineHintUsed = false;

  document.getElementById('battleScore').textContent = '0';
  document.getElementById('battleStreak').textContent = '🔥 0';
  document.getElementById('battleHud').style.display = 'flex';

  // Reset lifeline buttons UI
  document.getElementById('btnLifeline5050')?.classList.remove('used');
  document.getElementById('btnLifelineHint')?.classList.remove('used');

  // Sync mode pill active state
  document.querySelectorAll('.battle-mode-pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.submode === battleSubMode);
  });

  // Camera orientation
  if (battleSubMode === 'india') {
    if (currentProjection === 'globe' && globe3dInstance) {
      globe3dInstance.flyTo(20.59, 78.96, 2.65);
    } else {
      zoomToCoordinates(78.96, 20.59, 3.8);
    }
  }

  // Show quick loading state in question text
  document.getElementById('battleQuestionText').textContent = 'Connecting to Quiz Engine...';
  document.getElementById('battleHintText').textContent = 'Preparing authentic syllabus challenge...';

  // Try fetching fresh randomized, client-safe questions from Vercel Serverless
  const serverQuestions = await fetchServerQuizQuestions(battleSubMode);

  if (serverQuestions && serverQuestions.length > 0) {
    activeQuestionPool = serverQuestions;
  } else {
    // Verified local offline fallback
    if (battleSubMode === 'india') {
      activeQuestionPool = shuffleArray(INDIA_BATTLE_QUESTIONS);
    } else if (battleSubMode === 'kbc') {
      activeQuestionPool = shuffleArray(KBC_QUIZ_BANK);
    } else {
      activeQuestionPool = shuffleArray(BATTLE_QUESTIONS);
    }
    activeQuestionPool = activeQuestionPool.slice(0, 10);
  }

  nextBattleQuestion();
}

function nextBattleQuestion() {
  kbcAnswered = false;
  battleAnswerLocked = false;
  g.selectAll('.battle-feedback-mark').remove();

  if (battleQuestionIndex >= activeQuestionPool.length) {
    // Completed full set!
    showToast(`🏆 Challenge Finished! Final Score: ${battleScore.toLocaleString()}`);
    const subModeTitle = battleSubMode === 'india' 
      ? 'Bharat & States (UPSC/MPSC)' 
      : battleSubMode === 'kbc' 
        ? 'KBC 4-Option Quiz' 
        : 'World Geography Challenge';

    openShareCardModal({
      headline: `I scored ${battleScore.toLocaleString()} in ${subModeTitle}! 🌍`,
      subject: `Geography Master`,
      subtext: `Authentic knowledge verified across ${activeQuestionPool.length} rounds.`,
      highlight: `Max Streak: 🔥 ${battleStreak} in a row`,
      icon: '🧠'
    });
    endBattleRoyale();
    return;
  }

  currentBattleQuestion = activeQuestionPool[battleQuestionIndex];
  battleQuestionIndex++;

  document.getElementById('battleLevel').textContent = `Q ${battleQuestionIndex}/${activeQuestionPool.length}`;

  const kbcGrid = document.getElementById('kbcOptionsGrid');
  const lifelinesWrap = document.getElementById('battleLifelines');
  const catBadge = document.getElementById('battleCategoryBadge');
  const expBox = document.getElementById('quizExplanationBox');

  if (expBox) expBox.style.display = 'none';

  if (battleSubMode === 'kbc') {
    // KBC 4-Option Mode
    kbcGrid.style.display = 'grid';
    lifelinesWrap.style.display = 'flex';
    if (catBadge) {
      catBadge.style.display = 'inline-block';
      catBadge.textContent = currentBattleQuestion.category || 'UPSC/MPSC';
    }

    document.getElementById('battleQuestionText').textContent = currentBattleQuestion.question;
    document.getElementById('battleHintText').textContent = 'Select one of the 4 options below or use your 50:50 lifeline!';
    document.getElementById('battleDiffBadge').textContent = currentBattleQuestion.difficulty || 'MEDIUM';

    // Populate options
    const optButtons = document.querySelectorAll('.kbc-opt-btn');
    const letters = ['A', 'B', 'C', 'D'];
    optButtons.forEach((btn, idx) => {
      btn.className = 'kbc-opt-btn'; // reset states
      btn.querySelector('.kbc-opt-letter').textContent = letters[idx];
      btn.querySelector('.kbc-opt-text').textContent = currentBattleQuestion.options[idx] || '';
    });
  } else {
    // Map Click Modes (World or India)
    kbcGrid.style.display = 'none';
    lifelinesWrap.style.display = 'none';
    if (catBadge) {
      catBadge.style.display = battleSubMode === 'india' ? 'inline-block' : 'none';
      catBadge.textContent = 'BHARAT STATES';
    }

    document.getElementById('battleQuestionText').textContent = currentBattleQuestion.text;
    document.getElementById('battleHintText').textContent = currentBattleQuestion.hint;
    document.getElementById('battleDiffBadge').textContent = currentBattleQuestion.difficulty || 'EASY';
  }

  // Reset countdown timer (15 seconds for thoughtful play)
  clearInterval(battleTimerInterval);
  battleTimerSeconds = 15;
  const timerCircle = document.getElementById('battleTimer');
  timerCircle.textContent = battleTimerSeconds;

  battleTimerInterval = setInterval(() => {
    battleTimerSeconds--;
    timerCircle.textContent = battleTimerSeconds;
    if (battleTimerSeconds <= 0) {
      clearInterval(battleTimerInterval);
      battleStreak = 0;
      document.getElementById('battleStreak').textContent = '🔥 0';
      sounds.playClick();
      showToast(`⏱️ Time expired! Moving to next question...`);
      setTimeout(nextBattleQuestion, 1400);
    }
  }, 1000);
}

async function handleKbcOptionClick(chosenIdx, clickedBtn) {
  kbcAnswered = true;
  clearInterval(battleTimerInterval);

  const optButtons = document.querySelectorAll('.kbc-opt-btn');

  // Verify server-side if online, with fallback to local static bank
  let isCorrect = false;
  let correctIndex = -1;
  let explanation = currentBattleQuestion.explanation || '';

  const serverValidation = await validateAnswerServerless(currentBattleQuestion.id, chosenIdx, 'kbc');

  if (serverValidation) {
    isCorrect = serverValidation.isCorrect;
    correctIndex = serverValidation.correctIndex;
    if (serverValidation.explanation) explanation = serverValidation.explanation;
  } else {
    // Local fallback check
    const localQ = KBC_QUIZ_BANK.find(q => q.id === currentBattleQuestion.id) || currentBattleQuestion;
    correctIndex = localQ.answerIndex ?? 0;
    isCorrect = (chosenIdx === correctIndex);
    if (localQ.explanation) explanation = localQ.explanation;
  }

  if (isCorrect) {
    clickedBtn.classList.add('correct');
    sounds.playWhoosh();
    const points = 500 + (battleTimerSeconds * 50) + (battleStreak * 100);
    battleScore += points;
    battleStreak += 1;
    document.getElementById('battleScore').textContent = battleScore.toLocaleString();
    document.getElementById('battleStreak').textContent = `🔥 ${battleStreak}`;
    showToast(`✅ SAHI JAWAB! (Correct) +${points} pts!`);
  } else {
    clickedBtn.classList.add('wrong');
    if (correctIndex >= 0 && optButtons[correctIndex]) {
      optButtons[correctIndex].classList.add('correct');
    }
    battleStreak = 0;
    document.getElementById('battleStreak').textContent = '🔥 0';
    const correctText = currentBattleQuestion.options[correctIndex] || 'Correct Option';
    showToast(`❌ Galat Jawab! The correct answer was: ${correctText}`);
  }

  // Display initial authentic UPSC/MPSC explanation immediately (0ms latency)
  const expBox = document.getElementById('quizExplanationBox');
  const expText = document.getElementById('quizExplanationText');
  const expMentorBadge = document.getElementById('expMentorBadge');
  const expHookBox = document.getElementById('expHookBox');
  const expHookText = document.getElementById('expHookText');

  if (expBox && expText) {
    if (expMentorBadge) expMentorBadge.style.display = 'none';
    if (expHookBox) expHookBox.style.display = 'none';
    if (explanation) {
      expText.textContent = explanation;
      expBox.style.display = 'flex';
    }
  }

  // ASYNCHRONOUS GROQ AI MENTOR ENRICHMENT (Zero-lag: runs in parallel while user reads)
  const qPrompt = currentBattleQuestion.question || '';
  const chosenText = currentBattleQuestion.options?.[chosenIdx] || '';
  const correctText = currentBattleQuestion.options?.[correctIndex] || '';
  const qCategory = currentBattleQuestion.category || 'UPSC/MPSC';

  requestAiMentorInsight(qPrompt, chosenText, correctText, explanation, qCategory).then(aiData => {
    if (aiData && kbcAnswered && expBox && expBox.style.display !== 'none') {
      if (aiData.mentorInsight) {
        expText.textContent = aiData.mentorInsight;
      }
      if (expMentorBadge) expMentorBadge.style.display = 'inline-block';
      if (aiData.hook && expHookBox && expHookText) {
        expHookText.textContent = aiData.hook;
        expHookBox.style.display = 'flex';
      }
    }
  });

  setTimeout(nextBattleQuestion, 3800);
}

function apply5050Lifeline() {
  if (!currentBattleQuestion || battleSubMode !== 'kbc') return;

  let eliminateIndices = [];

  // If server sent secure precomputed eliminate list
  if (Array.isArray(currentBattleQuestion.lifeline5050Eliminate) && currentBattleQuestion.lifeline5050Eliminate.length > 0) {
    eliminateIndices = currentBattleQuestion.lifeline5050Eliminate;
  } else {
    // Local fallback computation
    const localQ = KBC_QUIZ_BANK.find(q => q.id === currentBattleQuestion.id) || currentBattleQuestion;
    const correctIdx = localQ.answerIndex ?? 0;
    const wrongIndices = [0, 1, 2, 3].filter(i => i !== correctIdx);
    eliminateIndices = shuffleArray(wrongIndices).slice(0, 2);
  }

  const optButtons = document.querySelectorAll('.kbc-opt-btn');
  eliminateIndices.forEach(idx => {
    optButtons[idx]?.classList.add('eliminated');
  });

  showToast('50:50 Lifeline applied! Two wrong options eliminated.');
}

async function handleBattleMapClick(clickedCode, countryObj, clickedLng = null, clickedLat = null, px = null, py = null) {
  if (!currentBattleQuestion || kbcAnswered || battleAnswerLocked || battleSubMode === 'kbc') return;
  battleAnswerLocked = true;
  clearInterval(battleTimerInterval);

  let isCorrect = false;

  if (battleSubMode === 'india') {
    const localQ = INDIA_BATTLE_QUESTIONS.find(q => q.id === currentBattleQuestion.id) || currentBattleQuestion;
    const targetStateLat = currentBattleQuestion.lat || localQ.lat;
    const targetStateLng = currentBattleQuestion.lng || localQ.lng;
    const fact = localQ.fact || 'Authenticated geographic site in India.';
    const hint = localQ.hint || 'Locate within the Indian subcontinent.';

    // Distance in km from click point to state centroid
    let distKm = Infinity;
    if (clickedLng != null && clickedLat != null && targetStateLat != null && targetStateLng != null) {
      distKm = calculateDistanceKm(clickedLat, clickedLng, targetStateLat, targetStateLng);
    }

    // Determine the closest Indian state to the user's click
    let closestState = null;
    if (clickedLat != null && clickedLng != null) {
      closestState = INDIA_STATES_DATA.reduce((best, s) => {
        const d = calculateDistanceKm(clickedLat, clickedLng, s.lat, s.lng);
        return (!best || d < best.d) ? { state: s, d } : best;
      }, null);
    }

    // Pass condition: inside India AND within 450 km of state center or matches closest state
    const matchesClosest = closestState && closestState.state.code === localQ.stateCode;
    isCorrect = (clickedCode === 'IN' && (distKm <= 450 || matchesClosest));

    // Draw visual feedback ring on the map at the click coordinates
    g.selectAll('.battle-feedback-mark').remove();
    if (px != null && py != null) {
      g.append('circle')
        .attr('class', 'battle-feedback-mark')
        .attr('cx', px).attr('cy', py)
        .attr('r', 18)
        .attr('fill', isCorrect ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)')
        .attr('stroke', isCorrect ? '#10b981' : '#ef4444')
        .attr('stroke-width', 2.8)
        .style('filter', `drop-shadow(0 0 10px ${isCorrect ? '#10b981' : '#ef4444'})`);
    }

    if (isCorrect) {
      const points = 600 + (battleTimerSeconds * 50) + (battleStreak * 100);
      battleScore += points;
      battleStreak += 1;
      document.getElementById('battleScore').textContent = battleScore.toLocaleString();
      document.getElementById('battleStreak').textContent = `🔥 ${battleStreak}`;
      showToast(`✅ PERFECT STATE TARGET! ${fact}`);
      zoomToCoordinates(targetStateLng, targetStateLat, 4.8);
    } else {
      battleStreak = 0;
      document.getElementById('battleStreak').textContent = '🔥 0';
      if (clickedCode !== 'IN') {
        showToast(`❌ That wasn't India! Look inside the Indian subcontinent.`);
      } else {
        const nearName = closestState?.state?.name ? `near ${closestState.state.name}` : 'another state';
        showToast(`❌ Wrong State Region! You clicked ${nearName} (~${Math.round(distKm)} km away). ${hint}`);
      }
    }
  } else {
    // World Challenge mode
    const serverValidation = await validateAnswerServerless(currentBattleQuestion.id, clickedCode, battleSubMode);
    const localQ = BATTLE_QUESTIONS.find(q => q.id === currentBattleQuestion.id) || currentBattleQuestion;
    const targetCode = serverValidation?.targetCode || localQ.targetCode;
    isCorrect = serverValidation ? serverValidation.isCorrect : (clickedCode === targetCode);

    if (isCorrect) {
      const points = 500 + (battleTimerSeconds * 50) + (battleStreak * 100);
      battleScore += points;
      battleStreak += 1;
      document.getElementById('battleScore').textContent = battleScore.toLocaleString();
      document.getElementById('battleStreak').textContent = `🔥 ${battleStreak}`;
      showToast(`✅ CORRECT! +${points} pts!`);
      zoomToCoordinates(currentBattleQuestion.lng, currentBattleQuestion.lat, 3.8);
    } else {
      battleStreak = 0;
      document.getElementById('battleStreak').textContent = '🔥 0';
      showToast(`❌ WRONG! That was ${countryObj?.name || 'an incorrect place'}`);
      if (targetCode) highlightCountryPath(targetCode);
    }
  }

  setTimeout(nextBattleQuestion, 2400);
}

function endBattleRoyale() {
  clearInterval(battleTimerInterval);
  document.getElementById('battleHud').style.display = 'none';
  document.getElementById('tabExplore')?.click();
}

// ============================================================
// 4. GUESS WHERE I AM (GEOGUESSR PROGRESSIVE MYSTERY)
// ============================================================
let lastMysteryScore = 0;
let lastMysteryDistance = 0;

function initMysteryGame() {
  document.getElementById('btnNextClue')?.addEventListener('click', () => {
    if (mysteryClueRound < 6) {
      mysteryClueRound++;
      mysteryScore = Math.max(200, mysteryScore - 150);
      showMysteryClue();
    } else {
      showToast('All 6 clues already revealed! Take your guess!');
    }
  });

  document.getElementById('btnMysteryReveal')?.addEventListener('click', () => {
    if (!currentMysteryTarget) return;
    revealMysteryTarget(0, 8000);
  });

  document.getElementById('btnNextMysteryTarget')?.addEventListener('click', () => {
    startMysteryGame();
  });

  document.getElementById('btnShareMystery')?.addEventListener('click', () => {
    if (currentMysteryTarget) {
      openShareCardModal({
        headline: `I solved Mystery Geo with Clue Round ${mysteryClueRound}! 🕵️`,
        subject: currentMysteryTarget.name,
        subtext: `${currentMysteryTarget.country} • Accuracy: ${lastMysteryScore}/1000 pts`,
        highlight: `Guess was ${Math.round(lastMysteryDistance).toLocaleString()} km away!`,
        icon: '📍'
      });
    }
  });

  document.getElementById('btnExitMystery')?.addEventListener('click', () => {
    document.getElementById('mysteryHud').style.display = 'none';
    document.getElementById('tabExplore')?.click();
  });
}

function startMysteryGame() {
  mysteryIndex = (mysteryIndex + 1) % MYSTERY_LOCATIONS.length;
  currentMysteryTarget = MYSTERY_LOCATIONS[mysteryIndex];
  mysteryClueRound = 1;
  mysteryScore = 1000;

  // Reset HUD visibility
  const hud = document.getElementById('mysteryHud');
  const resBox = document.getElementById('mysteryResultBox');
  const topBar = document.getElementById('mysteryTopBar');
  const hintPill = document.getElementById('mysteryHintPill');

  if (hud) hud.style.display = 'flex';
  if (resBox) resBox.style.display = 'none';
  if (topBar) topBar.style.display = 'block';
  if (hintPill) {
    hintPill.style.display = 'block';
    hintPill.textContent = '📍 Click your guess anywhere on the world map below!';
  }

  g.selectAll('.guess-line').remove();
  g.selectAll('.guess-marker').remove();

  showMysteryClue();
}

function showMysteryClue() {
  document.getElementById('mysteryRoundBadge').textContent = `CLUE ${mysteryClueRound} OF 6 (Value: ${mysteryScore} pts)`;
  const clue = currentMysteryTarget.clues.find(c => c.round === mysteryClueRound);
  document.getElementById('mysteryClueContent').textContent = clue ? `${clue.label}: ${clue.text}` : '';
}

function handleMysteryMapGuess(lng, lat) {
  if (!currentMysteryTarget) return;

  // Calculate Haversine distance
  const dKm = calculateDistanceKm(lat, lng, currentMysteryTarget.lat, currentMysteryTarget.lng);
  const accuracyScore = Math.max(50, Math.round(mysteryScore * Math.max(0, 1 - (dKm / 5000))));
  lastMysteryScore = accuracyScore;
  lastMysteryDistance = dKm;

  // Draw animated trajectory & pins from guess to target on SVG
  g.selectAll('.guess-line').remove();
  g.selectAll('.guess-marker').remove();

  const pGuess = projection([lng, lat]);
  const pTarget = projection([currentMysteryTarget.lng, currentMysteryTarget.lat]);

  if (pGuess && pTarget) {
    g.append('line')
      .attr('class', 'guess-line')
      .attr('x1', pGuess[0]).attr('y1', pGuess[1])
      .attr('x2', pTarget[0]).attr('y2', pTarget[1])
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '6,6');

    // Guess pin
    g.append('circle')
      .attr('class', 'guess-marker')
      .attr('cx', pGuess[0]).attr('cy', pGuess[1])
      .attr('r', 8)
      .attr('fill', '#f59e0b')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Target pin
    g.append('circle')
      .attr('class', 'guess-marker')
      .attr('cx', pTarget[0]).attr('cy', pTarget[1])
      .attr('r', 10)
      .attr('fill', '#10b981')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);
  }

  zoomToCoordinates(currentMysteryTarget.lng, currentMysteryTarget.lat, 4.5);

  // Proximity radar assessment
  const isHot = dKm < 350;
  const isWarm = dKm < 1200;
  const radarIcon = isHot ? '🔥' : (isWarm ? '🌡️' : '❄️');
  const tempWord = isHot ? '🔥 BURNING HOT!' : (isWarm ? '🌡️ WARM & CLOSE!' : '❄️ CHILLY / FAR!');

  // Display Round Result Box
  const resBox = document.getElementById('mysteryResultBox');
  if (resBox) {
    document.getElementById('mresRadar').textContent = radarIcon;
    document.getElementById('mresTitle').textContent = `Target: ${currentMysteryTarget.name}, ${currentMysteryTarget.country}`;
    document.getElementById('mresSub').textContent = `${tempWord} Distance: ~${Math.round(dKm).toLocaleString()} km • Score: +${accuracyScore} pts`;
    resBox.style.display = 'flex';
  }

  const hintPill = document.getElementById('mysteryHintPill');
  if (hintPill) {
    hintPill.textContent = `🎯 Revealed: ${currentMysteryTarget.name}, ${currentMysteryTarget.country}! See result above.`;
  }

  showToast(`${radarIcon} ${tempWord} ${Math.round(dKm).toLocaleString()} km away! +${accuracyScore} pts`);
}

function revealMysteryTarget(score, distanceKm = 0) {
  lastMysteryScore = score;
  lastMysteryDistance = distanceKm;
  if (!currentMysteryTarget) return;

  const resBox = document.getElementById('mysteryResultBox');
  if (resBox) {
    document.getElementById('mresRadar').textContent = '💡';
    document.getElementById('mresTitle').textContent = `Target: ${currentMysteryTarget.name}, ${currentMysteryTarget.country}`;
    document.getElementById('mresSub').textContent = `Revealed Location! Full answer unlocked.`;
    resBox.style.display = 'flex';
  }

  zoomToCoordinates(currentMysteryTarget.lng, currentMysteryTarget.lat, 4.5);
  showToast(`💡 Target Revealed: ${currentMysteryTarget.name}, ${currentMysteryTarget.country}`);
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ============================================================
// 5. THE ULTIMATE RANDOM SURPRISE BUTTON
// ============================================================
function initRandomSurpriseButton() {
  const btn = document.getElementById('btnSurpriseHero');
  if (btn) {
    btn.addEventListener('click', triggerUltimateSurprise);
  }

  document.getElementById('btnSurpClose')?.addEventListener('click', () => {
    document.getElementById('surpriseModal')?.close();
  });

  document.getElementById('btnSurpNext')?.addEventListener('click', triggerUltimateSurprise);
}

function triggerUltimateSurprise() {
  let nextIdx;
  do {
    nextIdx = Math.floor(Math.random() * SURPRISE_LOCATIONS.length);
  } while (nextIdx === lastSurpriseIndex && SURPRISE_LOCATIONS.length > 1);
  lastSurpriseIndex = nextIdx;

  const item = SURPRISE_LOCATIONS[nextIdx];

  // Satisfying rapid camera zoom/spin animation before modal opens
  showToast(`🎲 Spinning the Earth to discover ${item.name}...`);
  sounds.playWhoosh();
  if (currentProjection === 'globe' && globe3dInstance) {
    globe3dInstance.flyTo(item.lat, item.lng, 2.2);
  } else {
    zoomToCoordinates(item.lng, item.lat, 4.5);
  }

  setTimeout(() => {
    populateSurpriseModal(item);
  }, 850);
}

function populateSurpriseModal(item) {
  const modal = document.getElementById('surpriseModal');
  if (!modal) return;

  document.getElementById('surpName').textContent = item.name.toUpperCase();
  document.getElementById('surpCountry').textContent = `${item.country} • ${item.category}`;
  document.getElementById('surpTagline').textContent = `"${item.tagline}"`;

  const factsGrid = document.getElementById('surpFactsGrid');
  factsGrid.innerHTML = item.facts.map(f => `
    <div class="surp-fact-pill">
      <div class="surp-fact-lbl">${f.label}</div>
      <div class="surp-fact-val">${f.value}</div>
    </div>
  `).join('');

  document.getElementById('surpQuote').textContent = item.funQuote;

  document.getElementById('btnSurpExplore').onclick = () => {
    modal.close();
    flyCameraToCoordinates(item.lat, item.lng, 4.5);
  };

  document.getElementById('btnSurpShare').onclick = () => {
    openShareCardModal({
      headline: `I just discovered this using the Ultimate Random Button! 🎲`,
      subject: item.name,
      subtext: `${item.country} • ${item.category}`,
      highlight: item.tagline,
      icon: '🌍'
    });
  };

  modal.showModal();
}

// ============================================================
// 6. VIRAL 9:16 SOCIAL SHARE CARD MODAL
// ============================================================
function initSharingModal() {
  document.getElementById('btnCloseShareCard')?.addEventListener('click', () => {
    document.getElementById('shareCardModal')?.close();
  });

  document.getElementById('btnCopyShareText')?.addEventListener('click', () => {
    const text = document.getElementById('shareStoryHeadline').textContent + ' Play here: ' + window.location.href;
    navigator.clipboard?.writeText(text);
    showToast('📋 Copied caption & link to clipboard!');
  });

  document.getElementById('btnDownloadStoryCard')?.addEventListener('click', () => {
    showToast('📸 Card ready for Instagram / TikTok stories!');
  });
}

function openShareCardModal({ headline, subject, subtext, highlight, icon }) {
  document.getElementById('shareStoryHeadline').textContent = headline;
  document.getElementById('shareStorySubject').textContent = subject;
  document.getElementById('shareStorySubtext').textContent = subtext;
  document.getElementById('shareStoryHighlight').textContent = highlight;
  document.getElementById('shareStoryIcon').textContent = icon || '🌍';

  document.getElementById('shareCardModal')?.showModal();
}

function initGuideModal() {
  const modal = document.getElementById('guideModal');
  const openBtn = document.getElementById('btnOpenGuide');
  const closeBtn = document.getElementById('btnCloseGuideModal');
  const startBtn = document.getElementById('btnGuideStartExplore');

  openBtn?.addEventListener('click', () => {
    modal?.showModal();
  });

  closeBtn?.addEventListener('click', () => {
    modal?.close();
  });

  startBtn?.addEventListener('click', () => {
    modal?.close();
  });
}

// ============================================================
// GLOBAL NAVIGATION & SEARCH ROUTER
// ============================================================
function initNavigation() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentMode = tab.dataset.mode;
      handleModeSwitch(currentMode);
    });
  });

  // Flat vs Globe toggle with Three.js WebGL integration
  const btnFlat = document.getElementById('btnFlatView');
  const btnGlobe = document.getElementById('btnGlobeView');
  const svgMap = document.getElementById('earthSvg');
  const globeContainer = document.getElementById('globe3dContainer');

  btnFlat?.addEventListener('click', () => {
    currentProjection = 'flat';
    if (rotateTimer) rotateTimer.stop();
    btnFlat.classList.add('active');
    btnGlobe?.classList.remove('active');

    // Switch viewports
    if (svgMap) svgMap.style.display = 'block';
    if (globeContainer) globeContainer.style.display = 'none';

    buildFlatProjection();
    renderMapLayers();
    resetMapView();
  });

  btnGlobe?.addEventListener('click', () => {
    currentProjection = 'globe';
    if (rotateTimer) rotateTimer.stop();
    btnGlobe.classList.add('active');
    btnFlat?.classList.remove('active');

    // Switch viewports
    if (svgMap) svgMap.style.display = 'none';
    if (globeContainer) {
      globeContainer.style.display = 'block';

      // Lazy initialize 3D Globe instance on first click
      if (!globe3dInstance) {
        globe3dInstance = new EarthGlobe3D(
          globeContainer,
          (item) => {
            // Clicked a 3D marker
            openPlaceModal(item);
          },
          (lat, lng) => {
            // Clicked surface point -> route based on active mode
            if (currentMode === 'mystery') {
              handleMysteryMapGuess(lng, lat);
              return;
            }
            if (currentMode === 'battle') {
              const c = findCountryAt(lat, lng);
              handleBattleMapClick(c ? c.code : null, c, lng, lat);
              return;
            }
            const c = findCountryAt(lat, lng);
            if (c) {
              selectCountry(c);
              highlightCountryPath(c.code);
            }
          },
          (planetId) => {
            // Clicked a 3D celestial planet in deep space
            openPlanetDossier(planetId);
            document.querySelectorAll('.planet-pill').forEach(b => {
              b.classList.toggle('active', b.dataset.planet === planetId);
            });
          }
        );
        globe3dInstance.setUtcTime(scrubberTimeMinutes);
        globe3dInstance.clearMarkers(); // Start pristine in Explore mode
      } else {
        globe3dInstance.resize();
        globe3dInstance.setUtcTime(scrubberTimeMinutes);
      }
    }
  });

  // Whole Solar System Orrery Shortcut Button
  const btnOrrery = document.getElementById('btnOrreryView');
  btnOrrery?.addEventListener('click', () => {
    sounds.playWhoosh();
    if (currentProjection !== 'globe') {
      btnGlobe?.click();
    }
    if (globe3dInstance) {
      globe3dInstance.viewWholeSolarSystem();
      document.querySelectorAll('.planet-pill').forEach(b => {
        b.classList.toggle('active', b.dataset.planet === 'system');
      });
      openPlanetDossier('system');
    }
  });

  // Day/Night toggle
  document.getElementById('btnDayNightToggle')?.addEventListener('click', () => {
    sounds.playClick();
    showDayNightTerminator = !showDayNightTerminator;
    document.getElementById('btnDayNightToggle').classList.toggle('active', showDayNightTerminator);
    renderMapLayers();
  });

  // Zoom controls (Works on both 3D Globe and 2D SVG Map)
  document.getElementById('btnZoomIn')?.addEventListener('click', () => {
    sounds.playClick();
    if (currentProjection === 'globe' && globe3dInstance) {
      globe3dInstance.zoomBy(0.82);
    } else {
      svg.transition().duration(300).call(zoom.scaleBy, 1.4);
    }
  });

  document.getElementById('btnZoomOut')?.addEventListener('click', () => {
    sounds.playClick();
    if (currentProjection === 'globe' && globe3dInstance) {
      globe3dInstance.zoomBy(1.22);
    } else {
      svg.transition().duration(300).call(zoom.scaleBy, 0.7);
    }
  });

  document.getElementById('btnZoomReset')?.addEventListener('click', () => {
    sounds.playClick();
    if (currentProjection === 'globe' && globe3dInstance) {
      globe3dInstance.resetView();
    } else {
      resetMapView();
    }
  });

  // Celestial Focus Telemetry Handlers
  document.getElementById('badgeSunFocus')?.addEventListener('click', () => {
    sounds.playWhoosh();
    if (globe3dInstance) {
      globe3dInstance.focusTarget('sun');
      showToast('☀️ Focused on the Radiant Sun');
    }
  });

  document.getElementById('badgeMoonFocus')?.addEventListener('click', () => {
    sounds.playWhoosh();
    if (globe3dInstance) {
      globe3dInstance.focusTarget('moon');
      showToast('🌙 Focused on the 3D Cratered Moon');
    }
  });

  document.getElementById('btnFocusEarth')?.addEventListener('click', () => {
    sounds.playWhoosh();
    if (globe3dInstance) {
      globe3dInstance.focusTarget('earth');
      showToast('🌍 Centered on Planet Earth');
    }
  });

  // Audio Ambience & Sound Toggle
  document.getElementById('btnSoundToggle')?.addEventListener('click', () => {
    const isMuted = sounds.toggleMute();
    const btn = document.getElementById('btnSoundToggle');
    if (btn) {
      btn.textContent = isMuted ? '🔇' : '🔊';
      btn.classList.toggle('active', !isMuted);
    }
    showToast(isMuted ? '🔇 Audio muted' : '🔊 Cosmic soundscape activated');
  });

  // Close modals
  document.getElementById('btnClosePlaceModal')?.addEventListener('click', () => { sounds.playClick(); document.getElementById('placeModal')?.close(); });
  document.getElementById('themeToggle')?.addEventListener('click', () => { sounds.playClick(); document.body.classList.toggle('ambience-mystic'); });
}

function handleModeSwitch(mode) {
  sounds.playClick();
  // Hide all dynamic docks
  const favDock = document.getElementById('favoritesFilterDock');
  if (favDock) favDock.style.display = 'none';
  const battleHud = document.getElementById('battleHud');
  if (battleHud) battleHud.style.display = 'none';
  const mysteryHud = document.getElementById('mysteryHud');
  if (mysteryHud) mysteryHud.style.display = 'none';

  if (mode === 'explore') {
    if (globe3dInstance) globe3dInstance.clearMarkers();
    showDrawerSection('viewCountryDossier');
    renderMapLayers();
  } else if (mode === 'favorites') {
    // Directly show 2D flat map for responsive destination viewing and voting
    if (currentProjection !== 'flat') {
      document.getElementById('btnFlatView')?.click();
    }
    if (globe3dInstance) globe3dInstance.setMarkers(favoritesList, 'favorite');
    document.getElementById('favoritesFilterDock').style.display = 'block';
    showDrawerSection('viewFavoritesList');
    renderFavoriteMarkers();
  } else if (mode === 'battle') {
    // Switch to 2D flat map for instant full-world click precision
    if (currentProjection !== 'flat') {
      document.getElementById('btnFlatView')?.click();
    }
    if (globe3dInstance) globe3dInstance.clearMarkers();
    startBattleRoyale();
  } else if (mode === 'mystery') {
    // Switch to 2D flat map so entire world is immediately visible and clickable
    if (currentProjection !== 'flat') {
      document.getElementById('btnFlatView')?.click();
    }
    if (globe3dInstance) globe3dInstance.clearMarkers();
    startMysteryGame();
  }
}

function showDrawerSection(viewId) {
  document.querySelectorAll('.drawer-view').forEach(v => v.style.display = 'none');
  const target = document.getElementById(viewId);
  if (target) target.style.display = 'flex';
}

// Global Search
function initSearch() {
  const input = document.getElementById('globalSearch');
  const dropdown = document.getElementById('searchResultsDropdown');
  if (!input || !dropdown) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { dropdown.classList.remove('open'); return; }

    const matches = allCountries
      .filter(c => c.name.toLowerCase().includes(q) || (c.capital && c.capital.toLowerCase().includes(q)))
      .slice(0, 8);

    dropdown.innerHTML = matches.map(c => `
      <div class="search-item" data-code="${c.code}">
        <span class="search-item-flag">${c.flag || '📍'}</span>
        <div class="search-item-info">
          <span class="search-item-name">${c.name}</span>
          <span class="search-item-sub">🏛️ ${c.capital || 'N/A'} • ${c.region || ''}</span>
        </div>
      </div>
    `).join('');

    dropdown.querySelectorAll('.search-item').forEach(el => {
      el.addEventListener('click', () => {
        const c = countryMap.get(el.dataset.code);
        if (c) {
          input.value = c.name;
          dropdown.classList.remove('open');
          selectCountry(c);
          highlightCountryPath(c.code);
          if (currentProjection === 'globe' && globe3dInstance) {
            document.querySelectorAll('.planet-pill').forEach(b => b.classList.toggle('active', b.dataset.planet === 'earth'));
            globe3dInstance.flyTo(c.lat, c.lng, 2.65);
          } else {
            zoomToCoordinates(c.lng || 0, c.lat || 0, 4);
          }
        }
      });
    });

    dropdown.classList.add('open');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-pill-wrap')) dropdown.classList.remove('open');
  });
}

// Quick Country Jump HUD
function initQuickJumpBar() {
  const bar = document.getElementById('quickJumpBar');
  if (!bar) return;

  bar.querySelectorAll('.quick-jump-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      sounds.playClick();
      const code = btn.dataset.code;
      const c = countryMap.get(code);
      if (c) {
        selectCountry(c);
        highlightCountryPath(c.code);
        if (currentProjection === 'globe' && globe3dInstance) {
          // Sync bottom planetary navigation pill to Earth
          document.querySelectorAll('.planet-pill').forEach(b => b.classList.toggle('active', b.dataset.planet === 'earth'));
          globe3dInstance.flyTo(c.lat, c.lng, 2.65);
        } else {
          zoomToCoordinates(c.lng || 0, c.lat || 0, 4);
        }
      }
    });
  });
}

// Real-Time Open-Meteo Weather Integration
let weatherFetchAbortController = null;
async function fetchLiveWeather(lat, lng) {
  const descEl = document.getElementById('weatherDesc');
  const tempEl = document.getElementById('weatherTemp');
  const humidEl = document.getElementById('weatherHumidity');
  const windEl = document.getElementById('weatherWind');
  const iconEl = document.getElementById('weatherIcon');

  if (weatherFetchAbortController) weatherFetchAbortController.abort();
  weatherFetchAbortController = new AbortController();

  if (descEl) descEl.textContent = 'Fetching live telemetry...';

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`,
      { signal: weatherFetchAbortController.signal }
    );
    if (!res.ok) throw new Error('Weather feed error');
    const data = await res.json();
    const cur = data.current;
    if (!cur) return;

    if (tempEl) tempEl.textContent = `${Math.round(cur.temperature_2m)}°C`;
    if (humidEl) humidEl.textContent = `💧 ${cur.relative_humidity_2m}% Humidity`;
    if (windEl) windEl.textContent = `💨 ${cur.wind_speed_10m} km/h Wind`;

    const code = cur.weather_code;
    let desc = 'Clear Sky (Live)';
    let icon = '☀️';
    if (code >= 1 && code <= 3) { desc = 'Partly Cloudy'; icon = '⛅'; }
    else if (code >= 45 && code <= 48) { desc = 'Foggy / Hazy'; icon = '🌫️'; }
    else if (code >= 51 && code <= 67) { desc = 'Rain / Drizzle'; icon = '🌧️'; }
    else if (code >= 71 && code <= 77) { desc = 'Snow Showers'; icon = '❄️'; }
    else if (code >= 80 && code <= 82) { desc = 'Heavy Downpour'; icon = '⛈️'; }
    else if (code >= 95) { desc = 'Thunderstorm'; icon = '⚡'; }

    if (descEl) descEl.textContent = `${desc} (Live)`;
    if (iconEl) iconEl.textContent = icon;
  } catch (err) {
    if (err.name !== 'AbortError') {
      if (descEl) descEl.textContent = 'Live telemetry sync';
    }
  }
}

// Accurately resolve clicked Earth coordinates to nearest country
function findCountryAt(lat, lng) {
  let nearest = null;
  let minDist = Infinity;
  for (const c of allCountries) {
    if (c.lat === undefined || c.lng === undefined) continue;
    const dLat = (c.lat - lat) * (Math.PI / 180);
    const dLng = (c.lng - lng) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat * (Math.PI / 180)) * Math.cos(c.lat * (Math.PI / 180)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (d < minDist) {
      minDist = d;
      nearest = c;
    }
  }
  return nearest;
}

// Solar System Planetary Explorer
function initPlanetaryExplorer() {
  const scroll = document.getElementById('planetSelectorScroll');
  if (!scroll) return;

  scroll.querySelectorAll('.planet-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      sounds.playWhoosh();
      const planetId = btn.dataset.planet;

      scroll.querySelectorAll('.planet-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      btn.classList.add('just-selected');
      setTimeout(() => btn.classList.remove('just-selected'), 500);

      if (currentProjection !== 'globe') {
        document.getElementById('btnGlobeView')?.click();
      }

      if (globe3dInstance) {
        globe3dInstance.focusPlanet(planetId);
      }

      if (planetId === 'earth') {
        if (!selectedCountry) {
          const defaultC = countryMap.get('IN') || allCountries[0];
          if (defaultC) selectCountry(defaultC);
        }
        showDrawerSection('viewCountryDossier');
      } else {
        openPlanetDossier(planetId);
      }
    });
  });

  document.getElementById('btnReturnToEarth')?.addEventListener('click', () => {
    sounds.playWhoosh();
    scroll.querySelectorAll('.planet-pill').forEach(b => b.classList.remove('active'));
    scroll.querySelector('[data-planet="earth"]')?.classList.add('active');
    if (globe3dInstance) globe3dInstance.focusPlanet('earth');
    if (!selectedCountry) {
      const defaultC = countryMap.get('IN') || allCountries[0];
      if (defaultC) selectCountry(defaultC);
    }
    showDrawerSection('viewCountryDossier');
  });
}

function openPlanetDossier(planetId) {
  const p = PLANETS_DATA.find(x => x.id === planetId);
  if (!p) return;

  showDrawerSection('viewPlanetDossier');

  document.getElementById('planetSymbol').textContent = p.symbol || '🪐';
  document.getElementById('planetName').textContent = p.name;
  document.getElementById('planetType').textContent = p.type;
  document.getElementById('planetDistBadge').textContent = p.distanceSun;
  document.getElementById('planetMoonsBadge').textContent = p.moons;
  document.getElementById('planetTagline').textContent = `"${p.tagline}"`;

  const tempDisplay = (p.temperature || '').includes('•') ? p.temperature.split('•')[0].trim() : (p.temperature || 'N/A');
  const atmoDisplay = (p.atmosphere || '').includes(',') ? p.atmosphere.split(',')[0].trim() : (p.atmosphere || 'Interplanetary Medium');

  document.getElementById('planetStatsGrid').innerHTML = [
    { lbl: 'Diameter', val: p.diameter, sub: 'Equatorial Width' },
    { lbl: 'Surface Temp', val: tempDisplay, sub: 'Thermal Climate' },
    { lbl: 'Day Length', val: p.rotationPeriod, sub: 'Rotation Period' },
    { lbl: 'Year Length', val: p.orbitalPeriod, sub: 'Orbital Transit' },
    { lbl: 'Surface Gravity', val: p.gravity, sub: 'Gravitational Pull' },
    { lbl: 'Atmosphere', val: atmoDisplay, sub: 'Primary Elements' }
  ].map(s => `
    <div class="stat-box">
      <div class="stat-box-lbl">${s.lbl}</div>
      <div class="stat-box-val" style="font-size:0.88rem;">${s.val}</div>
      <div class="stat-box-sub">${s.sub}</div>
    </div>
  `).join('');

  document.getElementById('planetFactsList').innerHTML = p.facts.map((fact, i) => `
    <div class="wild-fact-card">
      <div class="wild-fact-emoji">${i === 0 ? '🌌' : i === 1 ? '🔭' : '⚡'}</div>
      <div class="wild-fact-text">${fact}</div>
    </div>
  `).join('');
}

// ============================================================
// COUNTRY DOSSIER FILLER
// ============================================================
function selectCountry(c) {
  selectedCountry = c;
  showDrawerSection('viewCountryDossier');
  sounds.playWhoosh();

  if (currentProjection === 'globe' && globe3dInstance && c.lat !== undefined && c.lng !== undefined) {
    globe3dInstance.flyTo(c.lat, c.lng, 2.65);
    globe3dInstance.setTargetCountry(c.lat, c.lng, c.name, c.flag);
  }

  // Fetch real-time live weather
  if (c.lat !== undefined && c.lng !== undefined) {
    fetchLiveWeather(c.lat, c.lng);
  }

  document.getElementById('dossierFlag').textContent = c.flag || '🌍';
  document.getElementById('dossierName').textContent = c.name;
  document.getElementById('dossierOfficial').textContent = c.official || c.name;
  document.getElementById('dossierRegion').textContent = c.region || 'World';
  document.getElementById('dossierCapital').textContent = `🏛️ ${c.capital || 'N/A'}`;

  // Fill tabs
  fillStatsTab(c);
  fillWildFactsTab(c);
  fillEconomyTab(c);
  fillCultureTab(c);

  // Tabs switching
  document.querySelectorAll('.dtab').forEach(t => {
    t.onclick = () => {
      document.querySelectorAll('.dtab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      t.classList.add('active');
      const targetPanel = document.getElementById(`tabContent${t.dataset.tab.charAt(0).toUpperCase() + t.dataset.tab.slice(1)}`);
      if (targetPanel) targetPanel.classList.add('active');
    };
  });

  // Wikipedia link
  document.getElementById('btnWikiCountry').onclick = () => {
    window.open(`https://en.wikipedia.org/wiki/${encodeURIComponent(c.name)}`, '_blank');
  };

  // Share card
  document.getElementById('btnShareCountry').onclick = () => {
    openShareCardModal({
      headline: `I discovered ${c.flag} ${c.name} on World Explorer!`,
      subject: c.name,
      subtext: `Capital: ${c.capital} • Population: ${formatNumber(c.population)}`,
      highlight: `Spans ${(c.timezones || []).length} time zones • ${c.region}`,
      icon: c.flag
    });
  };
}

function fillStatsTab(c) {
  const density = c.area > 0 ? (c.population / c.area).toFixed(1) : 'N/A';
  document.getElementById('statsMiniGrid').innerHTML = [
    { lbl: 'Population', val: formatNumber(c.population), sub: `${((c.population / 8100000000) * 100).toFixed(2)}% of Earth` },
    { lbl: 'Land Area', val: `${formatNumber(c.area)} km²`, sub: 'National Territory' },
    { lbl: 'Density', val: `${density}/km²`, sub: 'People per km²' },
    { lbl: 'Timezones', val: (c.timezones || []).length, sub: (c.timezones && c.timezones[0]) || 'UTC' }
  ].map(s => `
    <div class="stat-box">
      <div class="stat-box-lbl">${s.lbl}</div>
      <div class="stat-box-val">${s.val}</div>
      <div class="stat-box-sub">${s.sub}</div>
    </div>
  `).join('');

  const popRank = [...allCountries].sort((a,b) => b.population - a.population).findIndex(x => x.code === c.code) + 1;
  const areaRank = [...allCountries].sort((a,b) => b.area - a.area).findIndex(x => x.code === c.code) + 1;

  document.getElementById('progressRankings').innerHTML = [
    { label: 'Global Population Standing', val: `#${popRank} of ${allCountries.length}`, pct: ((allCountries.length - popRank) / allCountries.length) * 100, col: 'var(--accent-cyan)' },
    { label: 'Global Landmass Rank', val: `#${areaRank} of ${allCountries.length}`, pct: ((allCountries.length - areaRank) / allCountries.length) * 100, col: 'var(--accent-purple)' }
  ].map(r => `
    <div class="rank-row-item">
      <div class="rank-row-top"><span>${r.label}</span><strong>${r.val}</strong></div>
      <div class="rank-progress-track">
        <div class="rank-progress-bar" style="width:${Math.max(5, r.pct)}%;background:${r.col}"></div>
      </div>
    </div>
  `).join('');
}

function fillWildFactsTab(c) {
  const facts = WILD_COUNTRY_FACTS[c.code] || [
    { emoji: '✨', text: `<strong>Unique Geography:</strong> Sits prominently in the ${c.region} territory with a vibrant heritage.` },
    { emoji: '🏛️', text: `<strong>Historic Epicenter:</strong> Capital city <strong>${c.capital}</strong> functions as the cultural heart of the nation.` }
  ];
  document.getElementById('wildFactsList').innerHTML = facts.map(f => `
    <div class="wild-fact-card">
      <div class="wild-fact-emoji">${f.emoji}</div>
      <div class="wild-fact-text">${f.text}</div>
    </div>
  `).join('');
}

function fillEconomyTab(c) {
  document.getElementById('econList').innerHTML = `
    <div class="econ-item-card">
      <div class="card-lbl">Official Currencies</div>
      <div class="card-val">${(c.currencies || []).join(', ') || 'N/A'}</div>
      <div class="card-sub">Medium of exchange across commercial zones</div>
    </div>
    <div class="econ-item-card">
      <div class="card-lbl">Driving Direction</div>
      <div class="card-val">${c.driveSide === 'left' ? '← Left Side Driving' : '→ Right Side Driving'}</div>
      <div class="card-sub">${c.driveSide === 'left' ? 'Like UK, Japan, Australia' : 'Standard continental traffic'}</div>
    </div>
  `;
}

function fillCultureTab(c) {
  document.getElementById('cultureList').innerHTML = `
    <div class="cult-item-card">
      <div class="card-lbl">Recognized Languages</div>
      <div class="card-val">${(c.languages || []).join(', ') || 'N/A'}</div>
      <div class="card-sub">Constitutional & regional dialects</div>
    </div>
  `;
}

// ============================================================
// TIMERS, CLOCKS & TOASTS
// ============================================================
function startGlobalClock() {
  const clock = document.getElementById('liveUtcClock');
  const localClock = document.getElementById('localTimeDisplay');
  const city = document.getElementById('localTimeCity');
  const tzTag = document.getElementById('localTimeTz');

  setInterval(() => {
    const now = new Date();
    if (clock) clock.textContent = `${now.toUTCString().slice(17, 25)} UTC`;

    if (selectedCountry && localClock) {
      const tzStr = (selectedCountry.timezones && selectedCountry.timezones[0]) || 'UTC';
      const offset = parseTimezoneOffset(tzStr);
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const loc = new Date(utc + offset * 3600000);
      localClock.textContent = `${String(loc.getHours()).padStart(2,'0')}:${String(loc.getMinutes()).padStart(2,'0')}:${String(loc.getSeconds()).padStart(2,'0')}`;
      if (city) city.textContent = `Capital Time (${selectedCountry.capital || selectedCountry.name})`;
      if (tzTag) tzTag.textContent = tzStr;
    }
  }, 1000);
}

function parseTimezoneOffset(tzStr) {
  if (!tzStr || tzStr === 'UTC') return 0;
  const m = tzStr.match(/UTC([+-])(\d{2}):?(\d{2})?/);
  if (!m) return 0;
  const sign = m[1] === '+' ? 1 : -1;
  return sign * (parseInt(m[2] || '0', 10) + parseInt(m[3] || '0', 10) / 60);
}

function startFooterTicker() {
  const el = document.getElementById('footerTickerText');
  if (!el) return;
  let idx = 0;
  const tickerItems = [...CRAZY_FACTS];
  setInterval(() => {
    el.textContent = tickerItems[idx % tickerItems.length];
    idx++;
  }, 7500);
  el.textContent = tickerItems[0];
}

function showToast(msg, duration = 3200) {
  const stream = document.getElementById('toastStream');
  if (!stream) return;
  const card = document.createElement('div');
  card.className = 'toast-card';
  card.textContent = msg;
  stream.appendChild(card);
  setTimeout(() => {
    card.classList.add('out');
    setTimeout(() => card.remove(), 300);
  }, duration);
}

function formatNumber(n) {
  if (n == null || isNaN(n) || n === 0) return '0';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

// Launch the entire Earth Playground
boot();
