// src/conquest/empireEngine.js
// Pure Deterministic Grand-Strategy Engine & Versioned Persistence Manager
// Storage Key: we_empire_conquest_state

import { COUNTRIES, countryByCode } from '../countries.js';
import {
  EMPIRE_THEMES,
  DYNASTY_RANKS,
  STRATEGIC_BUFFS,
  WAR_CARDS_META,
  ADJACENCY_GRAPH,
  getCountryShieldTier,
  getCountryGdpBillions,
  isCountryCoastal
} from '../data/empireData.js';

export const SAVE_STORAGE_KEY = 'we_empire_conquest_state';
export const SAVE_BACKUP_KEY = 'we_empire_conquest_state_backup';
export const SCHEMA_VERSION = 1;
export const REGISTRY_VERSION = '2026.10-195';

const VALID_CODES = new Set(COUNTRIES.map(c => c.code));

function generateCommanderCode() {
  const prefixes = ['KRONOS', 'VANG', 'TITAN', 'APEX', 'ATLAS', 'SOL', 'MAURYA', 'VALOR', 'AEGIS', 'NOVA', 'IND'];
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const n = Math.floor(10 + Math.random() * 89);
  return `${p}-${n}`;
}

function createDefaultCampaignState(theme = 'gold') {
  return {
    schemaVersion: SCHEMA_VERSION,
    registryVersion: REGISTRY_VERSION,
    campaignId: `emp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    commanderCode: generateCommanderCode(),
    dynastyName: 'The Sovereign Realm',
    slot: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      theme: EMPIRE_THEMES[theme] ? theme : 'gold',
      untimedMode: false
    },
    capitalCode: null,
    conqueredCodes: [],
    fortifiedCodes: [],
    stats: {
      totalConquests: 0,
      siegesWon: 0,
      siegesLost: 0,
      questionsAnswered: 0,
      questionsCorrect: 0,
      rebellionsCrushed: 0,
      rebellionsLost: 0
    },
    cards: {
      spy_satellite: 1,
      diplomatic_annex: 0,
      iron_dome: 1,
      amphibious_strike: 1
    },
    activeRebellion: null, // { countryCode: 'BR', triggeredAtConquest: 8 }
    recentQuestionIds: []
  };
}

export class EmpireEngine {
  constructor() {
    this.state = this.loadState();
    this.amphibiousModeActive = false;
    this.listeners = new Set();

    // Cross-tab synchronization
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === SAVE_STORAGE_KEY && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.state = this.sanitizeState(parsed);
            this.notify();
          } catch (_) {}
        }
      });
    }
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    for (const fn of this.listeners) {
      try { fn(this.state); } catch (e) { console.error(e); }
    }
  }

  sanitizeState(raw) {
    if (!raw || typeof raw !== 'object') {
      return createDefaultCampaignState();
    }
    const base = createDefaultCampaignState(raw.settings?.theme || 'gold');
    base.campaignId = typeof raw.campaignId === 'string' ? raw.campaignId : base.campaignId;
    base.createdAt = raw.createdAt || base.createdAt;
    base.updatedAt = new Date().toISOString();
    base.settings.untimedMode = Boolean(raw.settings?.untimedMode);

    const conquered = Array.isArray(raw.conqueredCodes)
      ? Array.from(new Set(raw.conqueredCodes.filter(c => VALID_CODES.has(c))))
      : [];
    const fortified = Array.isArray(raw.fortifiedCodes)
      ? Array.from(new Set(raw.fortifiedCodes.filter(c => conquered.includes(c))))
      : [];

    let capital = raw.capitalCode && VALID_CODES.has(raw.capitalCode) ? raw.capitalCode : null;
    if (capital && !conquered.includes(capital)) {
      conquered.unshift(capital);
    }
    if (!capital && conquered.length > 0) {
      capital = conquered[0];
    }
    if (capital && !fortified.includes(capital)) {
      fortified.push(capital);
    }

    base.capitalCode = capital;
    base.conqueredCodes = conquered;
    base.fortifiedCodes = fortified;

    if (raw.stats && typeof raw.stats === 'object') {
      for (const k of Object.keys(base.stats)) {
        const val = Number(raw.stats[k]);
        base.stats[k] = Number.isFinite(val) && val >= 0 ? Math.floor(val) : 0;
      }
    }

    if (raw.cards && typeof raw.cards === 'object') {
      for (const card of WAR_CARDS_META) {
        const val = Number(raw.cards[card.id]);
        base.cards[card.id] = Number.isFinite(val) ? Math.max(0, Math.min(5, Math.floor(val))) : base.cards[card.id];
      }
    }

    if (
      raw.activeRebellion &&
      typeof raw.activeRebellion.countryCode === 'string' &&
      conquered.includes(raw.activeRebellion.countryCode) &&
      raw.activeRebellion.countryCode !== capital
    ) {
      base.activeRebellion = {
        countryCode: raw.activeRebellion.countryCode,
        triggeredAtConquest: Number(raw.activeRebellion.triggeredAtConquest) || conquered.length
      };
    }

    if (Array.isArray(raw.recentQuestionIds)) {
      base.recentQuestionIds = raw.recentQuestionIds.slice(-50);
    }

    if (typeof raw.commanderCode === 'string' && raw.commanderCode.trim()) {
      base.commanderCode = raw.commanderCode.trim().toUpperCase();
    }
    if (typeof raw.dynastyName === 'string' && raw.dynastyName.trim()) {
      base.dynastyName = raw.dynastyName.trim();
    }
    base.slot = Number(raw.slot) === 2 || Number(raw.slot) === 3 ? Number(raw.slot) : 1;

    return base;
  }

  loadState() {
    try {
      const rawStr = localStorage.getItem(SAVE_STORAGE_KEY);
      if (!rawStr) return createDefaultCampaignState();
      const parsed = JSON.parse(rawStr);
      return this.sanitizeState(parsed);
    } catch (err) {
      console.warn('[EmpireEngine] Corrupted save detected, backing up and resetting:', err);
      try {
        const corrupted = localStorage.getItem(SAVE_STORAGE_KEY);
        if (corrupted) localStorage.setItem(SAVE_BACKUP_KEY, corrupted);
      } catch (_) {}
      return createDefaultCampaignState();
    }
  }

  saveState() {
    this.state.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(this.state));
    } catch (err) {
      console.warn('[EmpireEngine] Storage write warning:', err);
    }
    this.notify();
  }

  resetCampaign(keepTheme = true) {
    const theme = keepTheme ? (this.state.settings?.theme || 'gold') : 'gold';
    this.amphibiousModeActive = false;
    this.state = createDefaultCampaignState(theme);
    this.saveState();
  }

  exportSaveJson() {
    return JSON.stringify(this.state, null, 2);
  }

  importSaveJson(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.conqueredCodes)) {
      throw new Error('Invalid campaign save format.');
    }
    this.state = this.sanitizeState(parsed);
    this.amphibiousModeActive = false;
    this.saveState();
    return this.state;
  }

  setTheme(themeId) {
    if (!EMPIRE_THEMES[themeId]) return;
    this.state.settings.theme = themeId;
    this.saveState();
  }

  setUntimedMode(enabled) {
    this.state.settings.untimedMode = Boolean(enabled);
    this.saveState();
  }

  hasCampaignStarted() {
    return Boolean(this.state.capitalCode && this.state.conqueredCodes.length > 0);
  }

  isConquered(code) {
    return this.state.conqueredCodes.includes(code);
  }

  isFortified(code) {
    return this.state.fortifiedCodes.includes(code);
  }

  establishCapital(code) {
    if (!VALID_CODES.has(code)) return false;
    this.state.capitalCode = code;
    this.state.conqueredCodes = [code];
    this.state.fortifiedCodes = [code]; // Capital is permanently fortified
    this.state.stats.totalConquests = 1;
    this.state.activeRebellion = null;
    this.amphibiousModeActive = false;
    this.saveState();
    return true;
  }

  // Compute active buffs & mastery levels
  getBuffStatuses() {
    const ownedSet = new Set(this.state.conqueredCodes);
    return STRATEGIC_BUFFS.map(buff => {
      const ownedMatching = buff.codes.filter(c => ownedSet.has(c));
      const count = ownedMatching.length;
      return {
        ...buff,
        ownedCount: count,
        ownedMatching,
        unlocked: count >= 1,
        mastery: count >= 3
      };
    });
  }

  setDynastyName(name) {
    if (typeof name === 'string' && name.trim()) {
      this.state.dynastyName = name.trim().slice(0, 32);
      this.saveState();
    }
  }

  setCommanderCode(code) {
    if (typeof code === 'string' && code.trim()) {
      this.state.commanderCode = code.trim().toUpperCase().slice(0, 16);
      this.saveState();
    }
  }

  // Generates a compact base64 hash for instant QR code or URL hash sharing
  getSyncHash() {
    try {
      const payload = {
        c: this.state.commanderCode,
        n: this.state.dynastyName,
        t: this.state.settings.theme,
        cap: this.state.capitalCode,
        con: this.state.conqueredCodes,
        fort: this.state.fortifiedCodes,
        cards: this.state.cards,
        st: this.state.stats
      };
      return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    } catch (_) {
      return '';
    }
  }

  // Restores state from a compact base64 hash or 6-character code
  importSyncHash(hashStr) {
    try {
      const jsonStr = decodeURIComponent(escape(atob(hashStr.trim())));
      const p = JSON.parse(jsonStr);
      if (p && Array.isArray(p.con)) {
        this.state = this.sanitizeState({
          commanderCode: p.c,
          dynastyName: p.n,
          settings: { theme: p.t },
          capitalCode: p.cap,
          conqueredCodes: p.con,
          fortifiedCodes: p.fort,
          cards: p.cards,
          stats: p.st
        });
        this.saveState();
        return true;
      }
    } catch (e) {
      console.warn('Sync hash parse failed:', e);
    }
    return false;
  }

  // Multi-slot local persistence
  saveToSlot(slotNum = 1) {
    this.state.slot = slotNum;
    localStorage.setItem(`we_empire_save_slot_${slotNum}`, JSON.stringify(this.state));
    this.saveState();
  }

  loadFromSlot(slotNum = 1) {
    try {
      const raw = localStorage.getItem(`we_empire_save_slot_${slotNum}`);
      if (raw) {
        this.state = this.sanitizeState(JSON.parse(raw));
        this.state.slot = slotNum;
        this.saveState();
        return true;
      }
    } catch (_) {}
    return false;
  }

  // Compute Siege timer duration in seconds: 35s Standard Baseline for comfortable KBC reading
  getSiegeTimerSeconds() {
    if (this.state.settings.untimedMode) return 999;
    const buffs = this.getBuffStatuses();
    const energy = buffs.find(b => b.id === 'energy');
    if (energy?.mastery) return 50;
    if (energy?.unlocked) return 42;
    return 35; // 35s baseline so users can read KBC question & options with zero stress
  }

  // Compute all reachable Frontline country codes
  getFrontlineSet() {
    if (!this.hasCampaignStarted()) return new Set();
    const ownedSet = new Set(this.state.conqueredCodes);
    const buffs = this.getBuffStatuses();
    const naval = buffs.find(b => b.id === 'naval');

    // If Amphibious Strike card is active OR Naval Tier 2 Mastery is unlocked, ALL unconquered countries are reachable!
    if (this.amphibiousModeActive || naval?.mastery) {
      return new Set(COUNTRIES.map(c => c.code).filter(code => !ownedSet.has(code)));
    }

    const frontline = new Set();

    // 1. Add all direct Land + Maritime Strait neighbors of owned territories
    for (const ownedCode of ownedSet) {
      const neighbors = ADJACENCY_GRAPH[ownedCode];
      if (neighbors) {
        for (const n of neighbors) {
          if (!ownedSet.has(n) && VALID_CODES.has(n)) {
            frontline.add(n);
          }
        }
      }
    }

    // 2. If Global Navy Buff (Tier 1) is unlocked, add all coastal nations globally
    if (naval?.unlocked) {
      for (const c of COUNTRIES) {
        if (!ownedSet.has(c.code) && isCountryCoastal(c.code)) {
          frontline.add(c.code);
        }
      }
    }

    // 3. Safety fallback: if somehow all immediate neighbors are conquered and an island pocket remains, unlock nearest unconquered
    if (frontline.size === 0 && ownedSet.size < COUNTRIES.length) {
      for (const c of COUNTRIES) {
        if (!ownedSet.has(c.code)) frontline.add(c.code);
      }
    }

    return frontline;
  }

  // Compute Dynasty Rank & Next Rank progress
  getDynastyRankInfo() {
    const count = this.state.conqueredCodes.length;
    if (count === 0) {
      return {
        current: { id: 'unfounded', tier: 0, min: 0, max: 0, icon: '🧭', title: 'Unfounded Dynasty', perk: 'Select any nation to establish your Capital' },
        next: DYNASTY_RANKS[0],
        progressPct: 0
      };
    }

    let current = DYNASTY_RANKS[0];
    let next = null;
    for (let i = 0; i < DYNASTY_RANKS.length; i++) {
      if (count >= DYNASTY_RANKS[i].min) {
        current = DYNASTY_RANKS[i];
        next = DYNASTY_RANKS[i + 1] || null;
      }
    }

    const span = next ? (next.min - current.min) : 1;
    const progressPct = next ? Math.min(100, Math.round(((count - current.min) / span) * 100)) : 100;
    return { current, next, progressPct };
  }

  // Compute Superpower Ledger (GDP, Population, Share %, Continental breakdown)
  getEmpireLedger() {
    const ownedCodes = this.state.conqueredCodes;
    const totalNations = COUNTRIES.length; // 195
    let rawGdpBillions = 0;
    let totalPopulation = 0;
    let totalAreaKm2 = 0;

    const continents = {
      Asia: { owned: 0, total: 0 },
      Europe: { owned: 0, total: 0 },
      Africa: { owned: 0, total: 0 },
      Americas: { owned: 0, total: 0 },
      Oceania: { owned: 0, total: 0 }
    };

    const ownedSet = new Set(ownedCodes);
    for (const c of COUNTRIES) {
      const reg = continents[c.region] ? c.region : 'Asia';
      continents[reg].total += 1;
      if (ownedSet.has(c.code)) {
        continents[reg].owned += 1;
        rawGdpBillions += getCountryGdpBillions(c.code);
        totalPopulation += (c.population || 0);
        totalAreaKm2 += (c.area || 0);
      }
    }

    const buffs = this.getBuffStatuses();
    const energyMastery = buffs.find(b => b.id === 'energy')?.mastery;
    const effectiveGdpBillions = energyMastery ? rawGdpBillions * 1.10 : rawGdpBillions;

    const conquestsUntilNextCard = 3 - (this.state.stats.totalConquests % 3);

    return {
      conqueredCount: ownedCodes.length,
      totalNations,
      worldSharePct: ((ownedCodes.length / totalNations) * 100).toFixed(1),
      gdpBillions: effectiveGdpBillions,
      gdpFormatted: effectiveGdpBillions >= 1000
        ? `$${(effectiveGdpBillions / 1000).toFixed(2)}T`
        : `$${Math.round(effectiveGdpBillions).toLocaleString()}B`,
      population: totalPopulation,
      areaKm2: totalAreaKm2,
      continents,
      conquestsUntilNextCard,
      cardProgressStep: this.state.stats.totalConquests % 3
    };
  }

  // Deterministic Strategic Advisor: Recommends the highest-impact frontline target
  getRecommendedTarget() {
    const frontline = Array.from(this.getFrontlineSet());
    if (frontline.length === 0) return null;

    const buffs = this.getBuffStatuses();
    const lockedBuffs = buffs.filter(b => !b.unlocked);

    // Priority 1: A frontline nation that unlocks a locked Strategic Buff!
    for (const buff of lockedBuffs) {
      const matchCode = frontline.find(code => buff.codes.includes(code));
      if (matchCode) {
        return {
          country: countryByCode[matchCode],
          shields: getCountryShieldTier(matchCode),
          gdpB: getCountryGdpBillions(matchCode),
          reason: `Unlocks ${buff.icon} ${buff.name} (${buff.shortLabel})!`
        };
      }
    }

    // Priority 2: Best GDP-to-Shield ratio on the frontline
    const scored = frontline
      .map(code => {
        const c = countryByCode[code];
        const shields = getCountryShieldTier(code);
        const gdpB = getCountryGdpBillions(code);
        return { country: c, shields, gdpB, score: gdpB / shields };
      })
      .filter(x => x.country)
      .sort((a, b) => b.score - a.score);

    const best = scored[0];
    if (!best) return null;
    return {
      country: best.country,
      shields: best.shields,
      gdpB: best.gdpB,
      reason: best.shields === 1
        ? `High-value 1-Shield expansion (+$${best.gdpB}B GDP)`
        : `Major regional economic hub (+$${best.gdpB >= 1000 ? (best.gdpB / 1000).toFixed(1) + 'T' : best.gdpB + 'B'} GDP)`
    };
  }

  // Record a territory annexation and return reward summary
  annexCountry(code, { viaCard = false, questionsAsked = 1, questionsCorrect = 1 } = {}) {
    if (!VALID_CODES.has(code)) return null;
    if (this.isConquered(code)) return null;

    this.state.conqueredCodes.push(code);
    this.state.stats.totalConquests += 1;
    if (!viaCard) {
      this.state.stats.siegesWon += 1;
    }
    this.state.stats.questionsAnswered += questionsAsked;
    this.state.stats.questionsCorrect += questionsCorrect;
    this.amphibiousModeActive = false;

    const shields = getCountryShieldTier(code);
    const isBoss = shields === 3;
    if (isBoss && !this.state.fortifiedCodes.includes(code)) {
      // Conquered Boss Superpowers automatically gain fortified citadel status
      this.state.fortifiedCodes.push(code);
    }

    // Check Tactical War Card Loot Drop (Every 3rd conquest OR Boss defeat)
    const droppedCards = [];
    if (this.state.stats.totalConquests % 3 === 0) {
      const cardId = this.grantRandomWarCard();
      if (cardId) droppedCards.push(cardId);
    }
    if (isBoss) {
      const bossCardId = this.grantRandomWarCard();
      if (bossCardId) droppedCards.push(bossCardId);
    }

    // Check if a Rebellion should trigger (Every 4th conquest, starting from conquest #5)
    let triggeredRebellion = null;
    if (
      !this.state.activeRebellion &&
      this.state.stats.totalConquests >= 5 &&
      this.state.stats.totalConquests % 4 === 0
    ) {
      const candidates = this.state.conqueredCodes.filter(
        c => c !== this.state.capitalCode && c !== code && !this.state.fortifiedCodes.includes(c)
      );
      if (candidates.length > 0) {
        const rebelCode = candidates[Math.floor(Math.random() * candidates.length)];
        this.state.activeRebellion = {
          countryCode: rebelCode,
          triggeredAtConquest: this.state.stats.totalConquests
        };
        triggeredRebellion = rebelCode;
      }
    }

    this.saveState();
    return {
      code,
      country: countryByCode[code],
      gdpAddedB: getCountryGdpBillions(code),
      droppedCards,
      triggeredRebellion
    };
  }

  recordSiegeDefeat(questionsAsked = 1, questionsCorrect = 0) {
    this.state.stats.siegesLost += 1;
    this.state.stats.questionsAnswered += questionsAsked;
    this.state.stats.questionsCorrect += questionsCorrect;
    this.amphibiousModeActive = false;
    this.saveState();
  }

  recordQuestionHistory(questionId) {
    if (!questionId) return;
    this.state.recentQuestionIds.push(questionId);
    if (this.state.recentQuestionIds.length > 50) {
      this.state.recentQuestionIds = this.state.recentQuestionIds.slice(-50);
    }
  }

  grantRandomWarCard() {
    const order = ['spy_satellite', 'diplomatic_annex', 'amphibious_strike', 'iron_dome'];
    const available = order.filter(id => (this.state.cards[id] || 0) < 5);
    if (available.length === 0) return null;
    const chosen = available[Math.floor(Math.random() * available.length)];
    this.state.cards[chosen] = (this.state.cards[chosen] || 0) + 1;
    return chosen;
  }

  consumeCard(cardId) {
    if (!this.state.cards[cardId] || this.state.cards[cardId] <= 0) return false;
    this.state.cards[cardId] -= 1;
    this.saveState();
    return true;
  }

  // Resolve active rebellion (victory fortifies; defeat loses territory)
  resolveRebellion(victory) {
    if (!this.state.activeRebellion) return null;
    const rebelCode = this.state.activeRebellion.countryCode;
    this.state.activeRebellion = null;

    if (victory) {
      if (!this.state.fortifiedCodes.includes(rebelCode)) {
        this.state.fortifiedCodes.push(rebelCode);
      }
      this.state.stats.rebellionsCrushed += 1;
    } else {
      this.state.conqueredCodes = this.state.conqueredCodes.filter(c => c !== rebelCode);
      this.state.fortifiedCodes = this.state.fortifiedCodes.filter(c => c !== rebelCode);
      this.state.stats.rebellionsLost += 1;
    }

    this.saveState();
    return { rebelCode, victory, country: countryByCode[rebelCode] };
  }

  // Fortify an owned territory using Iron Dome card
  fortifyOwnedTerritory(code) {
    if (!this.isConquered(code) || this.isFortified(code)) return false;
    if (!this.consumeCard('iron_dome')) return false;
    this.state.fortifiedCodes.push(code);
    if (this.state.activeRebellion?.countryCode === code) {
      this.state.activeRebellion = null;
      this.state.stats.rebellionsCrushed += 1;
    }
    this.saveState();
    return true;
  }
}
