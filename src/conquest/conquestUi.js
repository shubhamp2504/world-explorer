// src/conquest/conquestUi.js
// 2026 Grand-Strategy UI Controller for World Domination: Empire Conquest
// Features:
// - Step-by-Step Onboarding Wizard (Homeland -> Dynasty -> Directive)
// - Map-First Floating Recon Dossier (Zero sidebar clutter, direct globe interaction)
// - 20s Blitz Siege Arena with Pause, <9s Fullscreen Emergency Vignette, & Step-by-Step Debrief
// - Zero-Login 6-Character Commander Key & Instant Cross-Device QR Code Sync
// - Collapsible War Cards & Slide-Over Empire Ledger

import * as d3 from 'd3';
import { COUNTRIES, countryByCode } from '../countries.js';
import {
  EMPIRE_THEMES,
  DYNASTY_RANKS,
  WAR_CARDS_META,
  getCountryShieldTier,
  getCountryGdpBillions
} from '../data/empireData.js';
import { EmpireEngine } from './empireEngine.js';
import { generateSiegeQuestionsForCountry, getRecommendedShieldCount } from './siegeQuestions.js';

export class ConquestController {
  constructor(deps) {
    this.deps = deps; // { getSvgG, getProjection, getCurrentMode, getCurrentProjection, getGlobe3d, flyCameraToCoordinates, triggerVictoryParticles, triggerScreenShake, sounds, showToast, openShareCardModal, requestAiMentorInsight }
    this.engine = new EmpireEngine();

    // UI Drawer & Modal State
    this.activeDrawerTab = 'targets'; // 'targets' | 'empire' | 'buffs'
    this.targetFilter = 'frontline';  // 'frontline' | 'all' | 'bosses' | 'microstates'
    this.searchQuery = '';
    this.resetConfirmPending = false;
    this.isDrawerOpen = false;
    this.isPaused = false;

    // Wizard Onboarding State
    this.wizardSelectedCode = null;
    this.wizardStep = 1;

    // Active Siege Session State
    this.activeSiege = null;
    // { countryCode, country, isRebellion, totalShields, currentShieldIndex, questions, timerRemainingMs, lastTickTime, timerId, answered, questionsCorrect, spyUsedThisQuestion }

    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  init() {
    this.applyThemeVariables(this.engine.state.settings.theme);
    this.bindStaticEvents();
    this.engine.subscribe(() => {
      if (this.deps.getCurrentMode() === 'conquest') {
        this.refreshAllUi();
      }
    });
  }

  applyThemeVariables(themeId) {
    const theme = EMPIRE_THEMES[themeId] || EMPIRE_THEMES.gold;
    const root = document.documentElement;
    const primary = theme.border || '#fbbf24';
    const secondary = theme.secondary || '#f59e0b';
    root.style.setProperty('--emp-primary', primary);
    root.style.setProperty('--emp-secondary', secondary);
    root.style.setProperty('--emp-fill', theme.fill || 'rgba(245, 158, 11, 0.58)');
    root.style.setProperty('--emp-stroke', primary);
    root.style.setProperty('--emp-glow', theme.glow || 'rgba(251, 191, 36, 0.55)');

    document.querySelectorAll('.emp-theme-swatch').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme.id);
    });
  }

  bindStaticEvents() {
    // Theme swatches
    document.querySelectorAll('.emp-theme-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        this.deps.sounds.playClick();
        const t = btn.dataset.theme;
        this.engine.setTheme(t);
        this.applyThemeVariables(t);
        this.renderMapOverlay();
      });
    });

    // Top HUD Quick Actions
    document.getElementById('btnEmpOpenDirective')?.addEventListener('click', () => {
      this.deps.sounds.playClick();
      this.openDirectiveModal();
    });

    document.getElementById('btnEmpToggleCards')?.addEventListener('click', () => {
      this.deps.sounds.playClick();
      this.toggleCardsDock();
    });

    document.getElementById('btnCloseCardsDock')?.addEventListener('click', () => {
      this.deps.sounds.playClick();
      this.toggleCardsDock(false);
    });

    document.getElementById('btnEmpToggleDrawer')?.addEventListener('click', () => {
      this.deps.sounds.playClick();
      this.toggleRightDrawer();
    });

    document.getElementById('btnEmpOpenSyncModal')?.addEventListener('click', () => {
      this.deps.sounds.playClick();
      this.openSyncModal();
    });

    document.getElementById('empTopCodeBadge')?.addEventListener('click', () => {
      this.deps.sounds.playClick();
      this.openSyncModal();
    });

    // Campaign Settings Popover Toggle
    const campBtn = document.getElementById('btnEmpCampaignMenu');
    const campMenu = document.getElementById('empCampaignDropdown');
    campBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deps.sounds.playClick();
      if (campMenu) {
        const isOpen = campMenu.style.display === 'flex';
        campMenu.style.display = isOpen ? 'none' : 'flex';
        this.resetConfirmPending = false;
        const resetBtn = document.getElementById('btnEmpResetCampaign');
        if (resetBtn) resetBtn.textContent = '🗑️ Reset Campaign';
      }
    });

    document.addEventListener('click', (e) => {
      if (campMenu && campMenu.style.display === 'flex' && !e.target.closest('.emp-campaign-menu-wrap')) {
        campMenu.style.display = 'none';
      }
    });

    // Untimed Mode Checkbox
    const untimedChk = document.getElementById('chkEmpUntimed');
    if (untimedChk) {
      untimedChk.checked = Boolean(this.engine.state.settings.untimedMode);
      untimedChk.addEventListener('change', () => {
        this.deps.sounds.playClick();
        this.engine.setUntimedMode(untimedChk.checked);
        this.deps.showToast(
          untimedChk.checked
            ? '⏱️ Untimed Accessibility Mode enabled (No siege countdowns)'
            : '⚡ Standard 35s KBC Timer Mode enabled'
        );
      });
    }

    // Share Empire Story Card
    document.getElementById('btnEmpShareStory')?.addEventListener('click', () => {
      this.deps.sounds.playClick();
      if (campMenu) campMenu.style.display = 'none';
      this.shareEmpireProgress();
    });

    document.getElementById('btnEmpSyncMenuTrigger')?.addEventListener('click', () => {
      this.deps.sounds.playClick();
      if (campMenu) campMenu.style.display = 'none';
      this.openSyncModal();
    });

    // Export Campaign JSON
    document.getElementById('btnEmpExportSave')?.addEventListener('click', () => {
      this.deps.sounds.playClick();
      const jsonStr = this.engine.exportSaveJson();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `world-explorer-empire-${this.engine.state.commanderCode || 'save'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.deps.showToast('💾 Campaign save file exported!');
    });

    // Import Campaign JSON
    const importBtn = document.getElementById('btnEmpImportSave');
    const importInput = document.getElementById('inpEmpImportFile');
    importBtn?.addEventListener('click', () => {
      this.deps.sounds.playClick();
      importInput?.click();
    });
    importInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          this.engine.importSaveJson(String(reader.result));
          this.applyThemeVariables(this.engine.state.settings.theme);
          this.refreshAllUi();
          this.deps.showToast('✅ Campaign save imported and restored!');
        } catch (err) {
          this.deps.showToast('⚠️ Invalid campaign JSON file.');
        }
      };
      reader.readAsText(file);
      importInput.value = '';
    });

    // Reset Campaign
    const resetBtn = document.getElementById('btnEmpResetCampaign');
    resetBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.deps.sounds.playClick();
      if (!this.resetConfirmPending) {
        this.resetConfirmPending = true;
        resetBtn.textContent = '⚠️ Click Again to Confirm Reset';
        return;
      }
      this.resetConfirmPending = false;
      resetBtn.textContent = '🗑️ Reset Campaign';
      if (campMenu) campMenu.style.display = 'none';
      this.closeSiegeModal();
      this.closeTargetDossier();
      this.engine.resetCampaign(true);
      this.refreshAllUi();
      this.deps.showToast('🏳️ Campaign reset. Choose your new Capital!');
      this.openOnboardingWizard();
    });

    // -------------------------------------------------------------------------
    // ONBOARDING WIZARD EVENTS
    // -------------------------------------------------------------------------
    document.querySelectorAll('.wiz-starter-card').forEach(card => {
      card.addEventListener('click', () => {
        this.deps.sounds.playClick();
        const code = card.dataset.code;
        this.selectWizardCapital(code);
      });
      card.addEventListener('dblclick', () => {
        this.deps.sounds.playClick();
        const code = card.dataset.code;
        this.selectWizardCapital(code);
        this.launchCampaignWithCapital(code);
      });
    });

    document.getElementById('btnWizQuickStart')?.addEventListener('click', () => {
      this.deps.sounds.playClick();
      if (this.wizardSelectedCode) {
        this.launchCampaignWithCapital(this.wizardSelectedCode);
      }
    });

    const capSearchInput = document.getElementById('wizCapitalSearchInput');
    capSearchInput?.addEventListener('input', (e) => {
      this.renderWizardSearchResults(e.target.value);
    });

    document.getElementById('btnWizStep1Next')?.addEventListener('click', () => {
      this.deps.sounds.playClick();
      if (this.wizardSelectedCode) this.goToWizardStep(2);
    });

    document.getElementById('btnWizStep2Back')?.addEventListener('click', () => {
      this.deps.sounds.playClick();
      this.goToWizardStep(1);
    });

    document.querySelectorAll('input[name="wizThemeChoice"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const theme = e.target.value;
        this.engine.setTheme(theme);
        this.applyThemeVariables(theme);
        document.querySelectorAll('.wiz-theme-choice').forEach(tc => {
          tc.classList.toggle('active', tc.querySelector('input').checked);
        });
      });
    });

    document.getElementById('btnWizStep2Next')?.addEventListener('click', () => {
      this.deps.sounds.playClick();
      const nameInput = document.getElementById('wizDynastyNameInput');
      const val = nameInput?.value?.trim() || 'The Sovereign Realm';
      this.engine.setDynastyName(val);
      this.goToWizardStep(3);
    });

    document.getElementById('btnWizStep3Back')?.addEventListener('click', () => {
      this.deps.sounds.playClick();
      this.goToWizardStep(2);
    });

    document.getElementById('btnWizLaunchCampaign')?.addEventListener('click', () => {
      this.deps.sounds.playClick();
      if (this.wizardSelectedCode) {
        this.launchCampaignWithCapital(this.wizardSelectedCode);
      }
    });

    // -------------------------------------------------------------------------
    // FLOATING RECON DOSSIER EVENTS
    // -------------------------------------------------------------------------
    document.getElementById('btnCloseTargetDossier')?.addEventListener('click', () => {
      this.deps.sounds.playClick();
      this.closeTargetDossier();
    });

    document.getElementById('btnDossierSiege')?.addEventListener('click', () => {
      if (this.activeDossierCode) {
        this.startSiege(this.activeDossierCode, false);
      }
    });

    document.getElementById('btnDossierAnnex')?.addEventListener('click', () => {
      if (this.activeDossierCode) {
        this.executeDirectDiplomaticAnnex(this.activeDossierCode);
      }
    });

    // -------------------------------------------------------------------------
    // REBELLION BANNER EVENTS
    // -------------------------------------------------------------------------
    document.getElementById('btnEmpDefendRebellion')?.addEventListener('click', () => {
      const reb = this.engine.state.activeRebellion;
      if (reb && reb.countryCode) {
        this.startSiege(reb.countryCode, true);
      }
    });

    document.getElementById('btnEmpIronDomeRebellion')?.addEventListener('click', () => {
      const reb = this.engine.state.activeRebellion;
      if (!reb) return;
      if ((this.engine.state.cards.iron_dome || 0) <= 0) {
        this.deps.showToast('⚠️ No 🛡️ Iron Dome Defense cards in inventory! Defend via Siege.');
        return;
      }
      const ok = this.engine.fortifyOwnedTerritory(reb.countryCode);
      if (ok) {
        this.deps.sounds.playConquestHorn();
        const c = countryByCode[reb.countryCode];
        this.deps.showToast(`🛡️ Iron Dome deployed! Uprising in ${c?.flag || ''} ${c?.name || reb.countryCode} crushed & fortified!`);
        this.refreshAllUi();
      }
    });

    // -------------------------------------------------------------------------
    // SIEGE MODAL CONTROLS (Pause, Retreat, Keys, Options)
    // -------------------------------------------------------------------------
    document.getElementById('btnEmpPauseSiege')?.addEventListener('click', () => {
      this.toggleSiegePause();
    });

    document.getElementById('btnResumeSiege')?.addEventListener('click', () => {
      this.toggleSiegePause(false);
    });

    document.getElementById('btnRetreatPause')?.addEventListener('click', () => {
      this.toggleSiegePause(false);
      this.closeSiegeModal();
      this.deps.showToast('🏳️ Tactical retreat executed.');
    });

    document.getElementById('btnEmpRetreatSiege')?.addEventListener('click', () => {
      this.deps.sounds.playClick();
      this.closeSiegeModal();
      this.deps.showToast('🏳️ Tactical retreat executed.');
    });

    document.querySelectorAll('.emp-opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.opt, 10);
        this.handleSiegeAnswer(idx, btn);
      });
    });

    document.getElementById('btnSiegeNextStep')?.addEventListener('click', () => {
      this.deps.sounds.playClick();
      this.advanceSiegeStep();
    });

    document.getElementById('btnSiegeSpyCard')?.addEventListener('click', () => {
      this.useSpySatelliteInSiege();
    });

    document.getElementById('btnSiegeAnnexCard')?.addEventListener('click', () => {
      this.useDiplomaticAnnexInSiege();
    });

    // Tactical Cards Dock click handler
    document.getElementById('empCardsGrid')?.addEventListener('click', (e) => {
      const cardBtn = e.target.closest('.emp-war-card-btn');
      if (!cardBtn) return;
      const cardId = cardBtn.dataset.card;
      this.handleWarCardDockClick(cardId);
    });

    // -------------------------------------------------------------------------
    // CLOUD SYNC & COMMANDER KEY MODAL
    // -------------------------------------------------------------------------
    document.getElementById('btnCloseSyncModal')?.addEventListener('click', () => {
      this.deps.sounds.playClick();
      this.closeSyncModal();
    });

    document.getElementById('btnCopyCommanderCode')?.addEventListener('click', () => {
      const code = this.engine.state.commanderCode;
      if (code) {
        navigator.clipboard?.writeText(code);
        this.deps.showToast(`📋 Commander Key ${code} copied to clipboard!`);
      }
    });

    document.getElementById('btnRestoreCommanderCode')?.addEventListener('click', () => {
      const inp = document.getElementById('empRestoreCodeInput');
      const val = inp?.value?.trim();
      if (!val) return;
      if (this.engine.importSyncHash(val)) {
        this.deps.sounds.playConquestHorn();
        this.deps.showToast('⚡ Campaign restored from Commander Key!');
        this.closeSyncModal();
        this.refreshAllUi();
      } else {
        this.deps.showToast('⚠️ Invalid Commander Key or Save Hash.');
      }
    });

    document.querySelectorAll('.emp-slot-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const slot = parseInt(pill.dataset.slot, 10) || 1;
        this.switchSaveSlot(slot);
      });
    });

    // -------------------------------------------------------------------------
    // MISSION DIRECTIVE MODAL
    // -------------------------------------------------------------------------
    document.getElementById('btnCloseDirectiveModal')?.addEventListener('click', () => {
      this.closeDirectiveModal();
    });
    document.getElementById('btnDismissDirective')?.addEventListener('click', () => {
      this.closeDirectiveModal();
    });

    // Right Command Drawer Sub-Tabs
    document.querySelectorAll('.emp-drawer-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.deps.sounds.playClick();
        this.activeDrawerTab = tab.dataset.emptab || 'targets';
        document.querySelectorAll('.emp-drawer-tab').forEach(t => {
          t.classList.toggle('active', t.dataset.emptab === this.activeDrawerTab);
        });
        this.renderRightDrawer();
      });
    });

    // Right Drawer Search & Filter Pills
    const searchInp = document.getElementById('empTargetSearchInput');
    searchInp?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      this.renderTargetsTabContent();
    });

    document.querySelectorAll('.emp-filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        this.deps.sounds.playClick();
        this.targetFilter = pill.dataset.filter || 'frontline';
        document.querySelectorAll('.emp-filter-pill').forEach(p => {
          p.classList.toggle('active', p.dataset.filter === this.targetFilter);
        });
        this.renderTargetsTabContent();
      });
    });
  }

  enterMode() {
    document.body.classList.add('mode-conquest');
    const hudContainer = document.getElementById('empireHudContainer');
    if (hudContainer) hudContainer.style.display = 'flex';

    document.querySelectorAll('.drawer-view').forEach(v => v.style.display = 'none');
    const viewEmp = document.getElementById('viewEmpireCommand');
    if (viewEmp) viewEmp.style.display = 'flex';

    window.addEventListener('keydown', this.boundKeyDown);
    document.addEventListener('visibilitychange', this.boundVisibilityChange);

    this.applyThemeVariables(this.engine.state.settings.theme);
    this.refreshAllUi();

    if (!this.engine.hasCampaignStarted()) {
      this.openOnboardingWizard();
    } else {
      const cap = countryByCode[this.engine.state.capitalCode];
      if (cap && cap.lat != null && cap.lng != null) {
        setTimeout(() => {
          this.deps.flyCameraToCoordinates(cap.lat, cap.lng, 2.4);
        }, 120);
      }
    }
  }

  exitMode() {
    document.body.classList.remove('mode-conquest');
    document.body.classList.remove('siege-emergency-pulse');
    const hudContainer = document.getElementById('empireHudContainer');
    if (hudContainer) hudContainer.style.display = 'none';

    this.closeSiegeModal();
    this.closeTargetDossier();
    this.closeSyncModal();
    this.closeDirectiveModal();
    this.closeOnboardingWizard();

    const rightDrawer = document.getElementById('rightDrawer');
    if (rightDrawer) rightDrawer.classList.remove('emp-drawer-open');

    window.removeEventListener('keydown', this.boundKeyDown);
    document.removeEventListener('visibilitychange', this.boundVisibilityChange);

    const g = this.deps.getSvgG();
    if (g) {
      g.selectAll('.country-path')
        .classed('emp-capital', false)
        .classed('emp-conquered', false)
        .classed('emp-fortified', false)
        .classed('emp-frontline', false)
        .classed('emp-rebellion', false)
        .classed('emp-fog', false);
      g.selectAll('.emp-microstate-layer').remove();
    }
  }

  refreshAllUi() {
    this.renderTopHud();
    this.renderBanners();
    this.renderCardsDock();
    this.renderRightDrawer();
    this.renderMapOverlay();
  }

  // =========================================================================
  // 1. TOP TELEMETRY HUD
  // =========================================================================
  renderTopHud() {
    const ledger = this.engine.getEmpireLedger();
    const rankInfo = this.engine.getDynastyRankInfo();
    const buffs = this.engine.getBuffStatuses();

    const rankIconEl = document.getElementById('empRankIcon');
    const rankTitleEl = document.getElementById('empRankTitle');
    const dynastyTitle = this.engine.state.dynastyName || rankInfo.current.title;
    if (rankIconEl) rankIconEl.textContent = rankInfo.current.icon;
    if (rankTitleEl) rankTitleEl.textContent = dynastyTitle.toUpperCase();

    const codeBadge = document.getElementById('empTopCodeBadge');
    if (codeBadge) {
      codeBadge.textContent = `#${this.engine.state.commanderCode || 'SYNC'}`;
    }

    const terrEl = document.getElementById('empTerritoryVal');
    if (terrEl) {
      terrEl.textContent = `${ledger.conqueredCount} / ${ledger.totalNations} (${ledger.worldSharePct}%)`;
    }

    const gdpEl = document.getElementById('empGdpVal');
    if (gdpEl) {
      gdpEl.textContent = ledger.gdpFormatted;
    }

    const popEl = document.getElementById('empPopVal');
    if (popEl) {
      popEl.textContent = this.formatPopulation(ledger.population);
    }

    // Top Buffs Icons
    const buffsRow = document.getElementById('empTopBuffsRow');
    if (buffsRow) {
      buffsRow.innerHTML = buffs.map(b => {
        const cls = b.mastery ? 'mastery' : (b.unlocked ? 'unlocked' : 'locked');
        return `
          <div class="emp-top-buff-chip ${cls}" title="${b.name}: ${b.unlocked ? b.shortLabel : 'Locked (Capture Hubs)'}">
            <span class="buff-icon">${b.icon}</span>
            <span class="buff-cnt">${b.ownedCount}/${b.codes.length}</span>
          </div>
        `;
      }).join('');
    }

    // Card Count Badge
    const cardCntBadge = document.getElementById('empTopCardCount');
    if (cardCntBadge) {
      const totalCards = Object.values(this.engine.state.cards).reduce((a, b) => a + (b || 0), 0);
      cardCntBadge.textContent = `(${totalCards})`;
    }
  }

  formatPopulation(n) {
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${Math.round(n / 1e3)}K`;
    return String(n);
  }

  // =========================================================================
  // 2. ONBOARDING WIZARD (Step 1 -> Step 2 -> Step 3)
  // =========================================================================
  openOnboardingWizard() {
    const modal = document.getElementById('empireOnboardingWizard');
    if (modal) modal.style.display = 'flex';
    this.wizardSelectedCode = null;
    this.goToWizardStep(1);
  }

  closeOnboardingWizard() {
    const modal = document.getElementById('empireOnboardingWizard');
    if (modal) modal.style.display = 'none';
  }

  goToWizardStep(step) {
    this.wizardStep = step;
    ['wizPane1', 'wizPane2', 'wizPane3'].forEach((id, idx) => {
      const pane = document.getElementById(id);
      if (pane) pane.style.display = (idx + 1 === step) ? 'flex' : 'none';
    });

    ['wizStepTab1', 'wizStepTab2', 'wizStepTab3'].forEach((id, idx) => {
      const tab = document.getElementById(id);
      if (tab) tab.classList.toggle('active', idx + 1 === step);
    });

    if (step === 2) {
      const c = countryByCode[this.wizardSelectedCode];
      const badge = document.getElementById('wizSelectedCapBadge');
      if (badge && c) badge.textContent = `${c.flag} ${c.name}`;
      const nameInput = document.getElementById('wizDynastyNameInput');
      if (nameInput && (!nameInput.value || nameInput.value === 'The Sovereign Realm')) {
        nameInput.value = `${c?.name || 'Imperial'} Dominion`;
      }
    } else if (step === 3) {
      const codeTag = document.getElementById('wizCommanderCodeTag');
      if (codeTag) codeTag.textContent = this.engine.state.commanderCode || 'KRONOS-7';
    }
  }

  selectWizardCapital(code) {
    const c = countryByCode[code];
    if (!c) return;
    this.wizardSelectedCode = code;

    document.querySelectorAll('.wiz-starter-card').forEach(sc => {
      sc.classList.toggle('selected', sc.dataset.code === code);
    });

    const nextBtn = document.getElementById('btnWizStep1Next');
    if (nextBtn) {
      nextBtn.disabled = false;
      nextBtn.textContent = `Customize Dynasty (${c.flag} ${c.name}) →`;
    }

    const quickBtn = document.getElementById('btnWizQuickStart');
    if (quickBtn) {
      quickBtn.style.display = 'inline-flex';
      quickBtn.textContent = `⚡ Quick-Start as ${c.flag} ${c.name}`;
    }

    if (c.lat != null && c.lng != null) {
      this.deps.flyCameraToCoordinates(c.lat, c.lng, 2.5);
    }
  }

  renderWizardSearchResults(query) {
    const resultsContainer = document.getElementById('wizCapitalSearchResults');
    if (!resultsContainer) return;
    const q = query.trim().toLowerCase();
    if (!q) {
      resultsContainer.style.display = 'none';
      return;
    }

    const matches = COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.capital && c.capital.toLowerCase().includes(q))
    ).slice(0, 6);

    if (matches.length === 0) {
      resultsContainer.innerHTML = `<div class="wiz-sr-item empty">No matching nation found</div>`;
      resultsContainer.style.display = 'flex';
      return;
    }

    resultsContainer.innerHTML = matches.map(c => `
      <div class="wiz-sr-item" data-code="${c.code}">
        <span class="wiz-sr-flag">${c.flag}</span>
        <span class="wiz-sr-name">${c.name}</span>
        <span class="wiz-sr-sub">🏛️ ${c.capital || 'N/A'}</span>
      </div>
    `).join('');
    resultsContainer.style.display = 'flex';

    resultsContainer.querySelectorAll('.wiz-sr-item').forEach(item => {
      item.addEventListener('click', () => {
        const code = item.dataset.code;
        this.selectWizardCapital(code);
        resultsContainer.style.display = 'none';
      });
    });
  }

  launchCampaignWithCapital(code) {
    this.engine.establishCapital(code);
    this.closeOnboardingWizard();
    this.deps.sounds.playConquestHorn();
    this.deps.triggerVictoryParticles(window.innerWidth / 2, window.innerHeight / 2, 80);
    const c = countryByCode[code];
    this.deps.showToast(`👑 ${c?.flag || ''} ${c?.name || code} established as Imperial Capital!`);
    this.refreshAllUi();

    if (c && c.lat != null && c.lng != null) {
      this.deps.flyCameraToCoordinates(c.lat, c.lng, 2.8);
    }
  }

  // =========================================================================
  // 3. MAP-FIRST TARGET DOSSIER (DIRECT GLOBE INTERACTION)
  // =========================================================================
  handleCountryInteraction(countryCode, px, py) {
    if (!this.engine.hasCampaignStarted()) {
      this.openOnboardingWizard();
      this.selectWizardCapital(countryCode);
      return;
    }

    const c = countryByCode[countryCode];
    if (!c) return;

    this.activeDossierCode = countryCode;
    const isOwned = this.engine.isConquered(countryCode);
    const isCapital = countryCode === this.engine.state.capitalCode;
    const isFortified = this.engine.isFortified(countryCode);
    const isFrontline = this.engine.getFrontlineSet().has(countryCode);
    const gdpB = getCountryGdpBillions(countryCode);
    const gdpStr = gdpB >= 1000 ? `$${(gdpB / 1000).toFixed(2)}T` : `$${gdpB}B`;

    const dossier = document.getElementById('empireTargetDossier');
    const flagEl = document.getElementById('targetDossierFlag');
    const nameEl = document.getElementById('targetDossierName');
    const subEl = document.getElementById('targetDossierSub');
    const shieldsEl = document.getElementById('targetDossierShields');
    const gdpEl = document.getElementById('targetDossierGdp');
    const popEl = document.getElementById('targetDossierPop');
    const statusEl = document.getElementById('targetDossierStatus');
    const intelEl = document.getElementById('targetDossierIntel');
    const siegeBtn = document.getElementById('btnDossierSiege');
    const annexBtn = document.getElementById('btnDossierAnnex');

    if (flagEl) flagEl.textContent = c.flag;
    if (nameEl) nameEl.textContent = c.name;
    if (subEl) subEl.textContent = `${c.subregion || c.region} • Capital: ${c.capital || 'N/A'}`;
    const recShields = getRecommendedShieldCount(countryCode);
    if (shieldsEl) shieldsEl.textContent = isOwned ? '🏰 CITADEL' : `🛡️ ${recShields} Defense ${recShields === 1 ? 'Shield' : 'Shields'}`;
    if (gdpEl) gdpEl.textContent = `+${gdpStr}`;
    if (popEl) popEl.textContent = this.formatPopulation(c.population);

    if (intelEl) {
      intelEl.textContent = `Sovereign entity in ${c.subregion || c.region}. Features critical trade corridors, resource reserves, and strategic sovereign chokepoints.`;
    }

    const hasAnnexCard = (this.engine.state.cards.diplomatic_annex || 0) > 0;

    if (isOwned) {
      if (statusEl) {
        statusEl.textContent = isCapital ? '👑 Imperial Capital' : (isFortified ? '🏰 Fortified Citadel' : '✅ Owned Province');
      }
      if (siegeBtn) {
        siegeBtn.textContent = isFortified ? '🏰 Permanently Fortified' : '🛡️ Fortify Citadel';
        siegeBtn.disabled = isFortified;
        siegeBtn.onclick = () => {
          if (!isFortified) {
            if (this.engine.fortifyOwnedTerritory(countryCode)) {
              this.deps.sounds.playConquestHorn();
              this.deps.showToast(`🏰 ${c.flag} ${c.name} fortified against rebellions!`);
              this.closeTargetDossier();
              this.refreshAllUi();
            } else {
              this.deps.showToast('⚠️ Requires 🛡️ Iron Dome card in inventory!');
            }
          }
        };
      }
      if (annexBtn) annexBtn.style.display = 'none';
    } else if (isFrontline) {
      if (statusEl) statusEl.textContent = '⚔️ Active Frontier Target';
      if (siegeBtn) {
        siegeBtn.textContent = `⚔️ INITIATE BORDER SIEGE (${recShields} ${recShields === 1 ? 'SHIELD' : 'SHIELDS'})`;
        siegeBtn.disabled = false;
        siegeBtn.onclick = () => {
          this.closeTargetDossier();
          this.startSiege(countryCode, false);
        };
      }
      if (annexBtn) {
        annexBtn.style.display = hasAnnexCard ? 'inline-flex' : 'none';
      }
    } else {
      if (statusEl) statusEl.textContent = '🔒 Locked in Fog of War';
      if (siegeBtn) {
        siegeBtn.textContent = '🔒 Unreachable (Annex Neighbors First)';
        siegeBtn.disabled = true;
      }
      if (annexBtn) annexBtn.style.display = 'none';
    }

    if (dossier) dossier.style.display = 'flex';

    if (c.lat != null && c.lng != null) {
      this.deps.flyCameraToCoordinates(c.lat, c.lng, 3.2);
    }
  }

  closeTargetDossier() {
    const dossier = document.getElementById('empireTargetDossier');
    if (dossier) dossier.style.display = 'none';
    this.activeDossierCode = null;
  }

  // =========================================================================
  // 4. MAP OVERLAY & 195 MICROSTATE NODES
  // =========================================================================
  renderMapOverlay() {
    const g = this.deps.getSvgG();
    const projection = this.deps.getProjection();
    if (!g || !projection) return;

    const started = this.engine.hasCampaignStarted();
    const ownedSet = new Set(this.engine.state.conqueredCodes);
    const fortifiedSet = new Set(this.engine.state.fortifiedCodes);
    const frontlineSet = this.engine.getFrontlineSet();
    const capitalCode = this.engine.state.capitalCode;
    const rebelCode = this.engine.state.activeRebellion?.countryCode || null;

    const renderedPolygonCodes = new Set();

    g.selectAll('.country-path').each(function (d) {
      const code = d?.properties?.countryCode;
      if (code) renderedPolygonCodes.add(code);
      const el = d3.select(this);

      if (!started || !code) {
        el.classed('emp-capital', false)
          .classed('emp-conquered', false)
          .classed('emp-fortified', false)
          .classed('emp-frontline', !started && Boolean(code))
          .classed('emp-rebellion', false)
          .classed('emp-fog', false);
        return;
      }

      const isCap = code === capitalCode;
      const isOwned = ownedSet.has(code);
      const isFort = fortifiedSet.has(code);
      const isRebel = code === rebelCode;
      const isFront = !isOwned && frontlineSet.has(code);
      const isFog = !isOwned && !isFront;

      el.classed('emp-capital', isCap)
        .classed('emp-conquered', isOwned)
        .classed('emp-fortified', isFort)
        .classed('emp-rebellion', isRebel)
        .classed('emp-frontline', isFront)
        .classed('emp-fog', isFog);
    });

    // Render clickable microstate dots for islands not in 110m TopoJSON
    g.selectAll('.emp-microstate-layer').remove();
    const microGroup = g.append('g').attr('class', 'emp-microstate-layer');

    const missingCountries = COUNTRIES.filter(c => !renderedPolygonCodes.has(c.code) && c.lat != null && c.lng != null);
    missingCountries.forEach(c => {
      const coords = projection([c.lng, c.lat]);
      if (!coords) return;

      const isOwned = ownedSet.has(c.code);
      const isFront = !started || (!isOwned && frontlineSet.has(c.code));
      const isRebel = c.code === rebelCode;

      let stateClass = 'fog';
      if (isRebel) stateClass = 'rebellion';
      else if (isOwned) stateClass = 'conquered';
      else if (isFront) stateClass = 'frontline';

      const node = microGroup.append('g')
        .attr('class', `emp-microstate-node ${stateClass}`)
        .attr('transform', `translate(${coords[0]},${coords[1]})`)
        .on('click', (event) => {
          event.stopPropagation();
          this.handleCountryInteraction(c.code);
        });

      node.append('circle')
        .attr('r', isOwned || isFront ? 4.5 : 3.0)
        .attr('class', 'emp-micro-dot');

      node.append('title')
        .text(`${c.flag} ${c.name} (${c.capital})`);
    });
  }

  // =========================================================================
  // 5. 20-SECOND BLITZ SIEGE ARENA WITH PAUSE & EMERGENCY ALERT
  // =========================================================================
  startSiege(countryCode, isRebellion = false) {
    const c = countryByCode[countryCode];
    if (!c) return;

    this.closeTargetDossier();
    this.isPaused = false;
    document.body.classList.remove('siege-emergency-pulse');

    const totalShields = isRebellion ? 1 : getRecommendedShieldCount(countryCode);
    const questions = generateSiegeQuestionsForCountry(
      countryCode,
      totalShields,
      this.engine.state.recentQuestionIds
    );

    if (questions.length === 0) return;

    const timerSec = this.engine.getSiegeTimerSeconds();
    this.activeSiege = {
      countryCode,
      country: c,
      isRebellion,
      totalShields,
      currentShieldIndex: 0,
      questions,
      timerDurationMs: timerSec * 1000,
      timerRemainingMs: timerSec * 1000,
      lastTickTime: performance.now(),
      timerId: null,
      answered: false,
      questionsCorrect: 0,
      spyUsedThisQuestion: false
    };

    const modal = document.getElementById('empireSiegeModal');
    if (modal) modal.style.display = 'flex';
    this.renderCurrentSiegeQuestion();
  }

  renderCurrentSiegeQuestion() {
    if (!this.activeSiege) return;
    const s = this.activeSiege;
    const q = s.questions[s.currentShieldIndex];
    if (!q) return;

    s.answered = false;
    s.spyUsedThisQuestion = false;
    this.isPaused = false;
    document.body.classList.remove('siege-emergency-pulse');

    const pauseOverlay = document.getElementById('empSiegePauseOverlay');
    if (pauseOverlay) pauseOverlay.style.display = 'none';

    this.engine.recordQuestionHistory(q.id);

    const flagEl = document.getElementById('empSiegeFlag');
    const nameEl = document.getElementById('empSiegeCountryName');
    const subEl = document.getElementById('empSiegeCountrySub');
    const tierBadge = document.getElementById('empSiegeTierBadge');

    const gdpB = getCountryGdpBillions(s.countryCode);
    if (flagEl) flagEl.textContent = s.country.flag || '🏳️';
    if (nameEl) nameEl.textContent = s.isRebellion ? `DEFEND ${s.country.name.toUpperCase()}` : `SIEGE OF ${s.country.name.toUpperCase()}`;
    if (subEl) subEl.textContent = `${s.country.subregion || s.country.region} • +$${gdpB >= 1000 ? (gdpB / 1000).toFixed(2) + 'T' : gdpB + 'B'} Nominal GDP`;

    if (tierBadge) {
      tierBadge.textContent = s.isRebellion ? '🚨 DEFCON UPRISING' : `🛡️ SHIELD ${s.currentShieldIndex + 1} OF ${s.totalShields}`;
    }

    // Shield HP Nodes (5 Shields)
    const shieldBar = document.getElementById('empShieldBar');
    if (shieldBar) {
      const nodes = [];
      for (let i = 0; i < s.totalShields; i++) {
        const state = i < s.currentShieldIndex ? 'breached' : (i === s.currentShieldIndex ? 'active' : 'locked');
        const label = i < s.currentShieldIndex ? '💥 Breached' : `Shield ${i + 1}`;
        nodes.push(`<div class="emp-shield-node ${state}">${label}</div>`);
      }
      shieldBar.innerHTML = nodes.join('');
    }

    // Question Prompt
    const catEl = document.getElementById('empSiegeCategory');
    const promptEl = document.getElementById('empSiegePrompt');
    if (catEl) catEl.textContent = `${q.category} — SHIELD ${s.currentShieldIndex + 1} OF ${s.totalShields}`;
    if (promptEl) promptEl.textContent = q.prompt;

    const expBox = document.getElementById('empSiegeExplainBox');
    if (expBox) expBox.style.display = 'none';

    // 4 Options
    const letters = ['A', 'B', 'C', 'D'];
    const optButtons = document.querySelectorAll('.emp-opt-btn');
    optButtons.forEach((btn, idx) => {
      btn.className = 'emp-opt-btn';
      btn.disabled = false;
      const letEl = btn.querySelector('.emp-opt-letter');
      const txtEl = btn.querySelector('.emp-opt-text');
      if (letEl) letEl.textContent = letters[idx];
      if (txtEl) txtEl.textContent = q.options[idx] || '';
    });

    this.updateSiegeTacticalButtons();
    this.startSiegeTimer();
  }

  startSiegeTimer() {
    this.stopSiegeTimer();
    if (!this.activeSiege) return;

    const timerEl = document.getElementById('empSiegeTimer');
    if (this.engine.state.settings.untimedMode) {
      if (timerEl) timerEl.textContent = '∞';
      return;
    }

    const totalSec = this.engine.getSiegeTimerSeconds();
    this.activeSiege.timerDurationMs = totalSec * 1000;
    this.activeSiege.timerRemainingMs = totalSec * 1000;
    this.activeSiege.lastTickTime = performance.now();

    if (timerEl) {
      timerEl.textContent = `${totalSec}s`;
      timerEl.classList.remove('urgent');
    }

    this.activeSiege.timerId = setInterval(() => {
      if (!this.activeSiege || this.activeSiege.answered || this.isPaused) return;
      const now = performance.now();
      if (document.visibilityState === 'hidden') {
        this.activeSiege.lastTickTime = now;
        return;
      }
      const delta = now - this.activeSiege.lastTickTime;
      this.activeSiege.lastTickTime = now;
      this.activeSiege.timerRemainingMs = Math.max(0, this.activeSiege.timerRemainingMs - delta);

      const secLeft = Math.ceil(this.activeSiege.timerRemainingMs / 1000);
      if (timerEl) {
        timerEl.textContent = `${secLeft}s`;
        timerEl.classList.toggle('urgent', secLeft <= 8);
      }

      // Emergency Alert Vignette (< 9 Seconds)
      if (secLeft <= 8) {
        document.body.classList.add('siege-emergency-pulse');
      } else {
        document.body.classList.remove('siege-emergency-pulse');
      }

      if (this.activeSiege.timerRemainingMs <= 0) {
        this.stopSiegeTimer();
        document.body.classList.remove('siege-emergency-pulse');
        this.handleSiegeTimeout();
      }
    }, 100);
  }

  stopSiegeTimer() {
    if (this.activeSiege?.timerId) {
      clearInterval(this.activeSiege.timerId);
      this.activeSiege.timerId = null;
    }
    document.body.classList.remove('siege-emergency-pulse');
  }

  toggleSiegePause(forceState = null) {
    if (!this.activeSiege || this.activeSiege.answered) return;
    this.isPaused = forceState !== null ? forceState : !this.isPaused;
    const pauseOverlay = document.getElementById('empSiegePauseOverlay');
    if (pauseOverlay) {
      pauseOverlay.style.display = this.isPaused ? 'flex' : 'none';
    }
    if (!this.isPaused) {
      this.activeSiege.lastTickTime = performance.now();
    }
  }

  handleSiegeAnswer(chosenIdx, clickedBtn) {
    if (!this.activeSiege || this.activeSiege.answered || this.isPaused) return;
    this.activeSiege.answered = true;
    this.stopSiegeTimer();
    document.body.classList.remove('siege-emergency-pulse');

    const s = this.activeSiege;
    const q = s.questions[s.currentShieldIndex];
    const isCorrect = chosenIdx === q.answerIndex;

    const optButtons = document.querySelectorAll('.emp-opt-btn');
    optButtons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === q.answerIndex) btn.classList.add('correct');
    });

    if (isCorrect) {
      s.questionsCorrect += 1;
      clickedBtn.classList.add('correct');
      this.deps.sounds.playShieldBreak();
      const rect = clickedBtn.getBoundingClientRect();
      this.deps.triggerVictoryParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 40);
      this.showSiegeExplanation(true, q, null);
    } else {
      clickedBtn.classList.add('wrong');
      this.deps.sounds.playWrong();
      this.deps.triggerScreenShake();
      this.showSiegeExplanation(false, q, null);
    }

    this.updateSiegeTacticalButtons();
  }

  handleSiegeTimeout() {
    if (!this.activeSiege || this.activeSiege.answered) return;
    this.activeSiege.answered = true;
    const q = this.activeSiege.questions[this.activeSiege.currentShieldIndex];
    const optButtons = document.querySelectorAll('.emp-opt-btn');
    optButtons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === q.answerIndex) btn.classList.add('correct');
    });

    this.deps.sounds.playWrong();
    this.deps.triggerScreenShake();
    this.showSiegeExplanation(false, q, '⏱️ Siege Timer Expired! Defense shield held firm.');
  }

  showSiegeExplanation(isCorrect, q, customHeadline = null) {
    const s = this.activeSiege;
    if (!s) return;

    const expBox = document.getElementById('empSiegeExplainBox');
    const expTitle = document.getElementById('empSiegeExplainTitle');
    const expText = document.getElementById('empSiegeExplainText');
    const nextBtn = document.getElementById('btnSiegeNextStep');
    const shieldBar = document.getElementById('empShieldBar');

    if (isCorrect && shieldBar) {
      const nodes = shieldBar.querySelectorAll('.emp-shield-node');
      const currentNode = nodes[s.currentShieldIndex];
      if (currentNode) {
        currentNode.className = 'emp-shield-node breached';
        currentNode.textContent = '💥 Breached';
      }
    }

    const isFinalShield = s.currentShieldIndex + 1 >= s.totalShields;
    s.lastAnswerCorrect = isCorrect;

    if (expTitle) {
      if (customHeadline) {
        expTitle.textContent = customHeadline;
      } else if (isCorrect) {
        expTitle.textContent = isFinalShield
          ? `👑 ALL ${s.totalShields} SHIELDS BREACHED! ${s.country.name.toUpperCase()} CONQUERED!`
          : `💥 SHIELD ${s.currentShieldIndex + 1} OF ${s.totalShields} BREACHED! Prepare for Next Layer`;
      } else {
        expTitle.textContent = s.isRebellion
          ? `❌ DEFENSE FAILED! ${s.country.name} declared independence!`
          : `❌ SIEGE REPULSED! ${s.country.name}'s defense held firm.`;
      }
    }

    if (expText) {
      expText.textContent = q.explanation;
    }

    if (nextBtn) {
      if (isCorrect) {
        nextBtn.textContent = isFinalShield
          ? (s.isRebellion ? '🏰 Fortify & Return to Map' : `👑 Annex ${s.country.flag} ${s.country.name}`)
          : `⚔️ Attack Shield ${s.currentShieldIndex + 2} of ${s.totalShields} ➡️`;
        nextBtn.className = 'emp-btn-siege-next victory';
      } else {
        nextBtn.textContent = '🏳️ Return to War Room';
        nextBtn.className = 'emp-btn-siege-next defeat';
      }
    }

    if (expBox) expBox.style.display = 'flex';
  }

  advanceSiegeStep() {
    if (!this.activeSiege) return;
    const s = this.activeSiege;

    if (!s.lastAnswerCorrect) {
      if (s.isRebellion) {
        this.engine.resolveRebellion(false);
        this.deps.showToast(`🚨 Uprising successful! ${s.country.name} broke free from your empire.`);
      } else {
        this.engine.recordFailedSiege();
      }
      this.closeSiegeModal();
      this.refreshAllUi();
      return;
    }

    s.currentShieldIndex += 1;
    if (s.currentShieldIndex >= s.totalShields) {
      this.closeSiegeModal();
      if (s.isRebellion) {
        const res = this.engine.resolveRebellion(true);
        this.deps.sounds.playConquestHorn();
        this.deps.triggerVictoryParticles(window.innerWidth / 2, window.innerHeight / 2, 70);
        this.deps.showToast(`🏰 Rebellion crushed! ${res.country?.flag || ''} ${res.country?.name || ''} fortified!`);
      } else {
        const res = this.engine.annexCountry(s.countryCode, {
          viaCard: false,
          questionsAsked: s.totalShields,
          questionsCorrect: s.questionsCorrect
        });
        if (res) {
          this.deps.sounds.playConquestHorn();
          this.deps.triggerVictoryParticles(window.innerWidth / 2, window.innerHeight / 2, 90);
          this.deps.showToast(`👑 CONQUERED! ${res.country.flag} ${res.country.name} (+$${res.gdpAddedB}B GDP) annexed into your Empire!`);
          if (res.cardLoot) {
            const cardMeta = WAR_CARDS_META.find(c => c.id === res.cardLoot);
            this.deps.showToast(`🎁 TACTICAL LOOT DROP! Received 1x ${cardMeta?.icon || '🃏'} ${cardMeta?.name || res.cardLoot}!`);
          }
        }
      }
      this.refreshAllUi();
      return;
    }

    this.renderCurrentSiegeQuestion();
  }

  closeSiegeModal() {
    this.stopSiegeTimer();
    const modal = document.getElementById('empireSiegeModal');
    if (modal) modal.style.display = 'none';
    this.activeSiege = null;
    this.isPaused = false;
    document.body.classList.remove('siege-emergency-pulse');
  }

  updateSiegeTacticalButtons() {
    if (!this.activeSiege) return;
    const spyBtn = document.getElementById('btnSiegeSpyCard');
    const annexBtn = document.getElementById('btnSiegeAnnexCard');
    const spyCount = this.engine.state.cards.spy_satellite || 0;
    const annexCount = this.engine.state.cards.diplomatic_annex || 0;

    if (spyBtn) {
      spyBtn.textContent = `🛰️ Spy Satellite 50:50 (${spyCount})`;
      spyBtn.disabled = this.activeSiege.answered || this.activeSiege.spyUsedThisQuestion || spyCount <= 0;
    }
    if (annexBtn) {
      annexBtn.textContent = `🤝 Diplomatic Annex (${annexCount})`;
      annexBtn.disabled = this.activeSiege.answered || annexCount <= 0;
    }
  }

  useSpySatelliteInSiege() {
    if (!this.activeSiege || this.activeSiege.answered || this.activeSiege.spyUsedThisQuestion) return;
    if (!this.engine.consumeCard('spy_satellite')) return;

    this.activeSiege.spyUsedThisQuestion = true;
    this.deps.sounds.playClick();

    const q = this.activeSiege.questions[this.activeSiege.currentShieldIndex];
    const optButtons = Array.from(document.querySelectorAll('.emp-opt-btn'));
    const candidates = [0, 1, 2, 3].filter(
      i => i !== q.answerIndex && !optButtons[i]?.classList.contains('eliminated')
    );
    const toEliminate = candidates.sort(() => Math.random() - 0.5).slice(0, 2);
    toEliminate.forEach(idx => {
      if (optButtons[idx]) {
        optButtons[idx].classList.add('eliminated');
        optButtons[idx].disabled = true;
      }
    });

    this.updateSiegeTacticalButtons();
    this.renderCardsDock();
    this.deps.showToast('🛰️ Spy Satellite 50:50 deployed! Wrong options eliminated.');
  }

  useDiplomaticAnnexInSiege() {
    if (!this.activeSiege || this.activeSiege.answered) return;
    if (!this.engine.consumeCard('diplomatic_annex')) return;

    this.stopSiegeTimer();
    const code = this.activeSiege.countryCode;
    const isReb = this.activeSiege.isRebellion;
    this.closeSiegeModal();

    if (isReb) {
      const res = this.engine.resolveRebellion(true);
      this.deps.sounds.playConquestHorn();
      this.deps.showToast(`🤝 Rebellion in ${res?.country?.flag || ''} ${res?.country?.name || code} peacefully resolved!`);
    } else {
      const res = this.engine.annexCountry(code, { viaCard: true, questionsAsked: 0, questionsCorrect: 0 });
      if (res) {
        this.deps.sounds.playConquestHorn();
        this.deps.triggerVictoryParticles(window.innerWidth / 2, window.innerHeight / 2, 70);
        this.deps.showToast(`🤝 Diplomatic Annexation! ${res.country.flag} ${res.country.name} (+$${res.gdpAddedB}B GDP) joined your Empire!`);
      }
    }
    this.refreshAllUi();
  }

  executeDirectDiplomaticAnnex(countryCode) {
    if (!this.engine.consumeCard('diplomatic_annex')) {
      this.deps.showToast('⚠️ No 🤝 Diplomatic Annex cards available!');
      return;
    }
    this.closeTargetDossier();
    const res = this.engine.annexCountry(countryCode, { viaCard: true, questionsAsked: 0, questionsCorrect: 0 });
    if (res) {
      this.deps.sounds.playConquestHorn();
      this.deps.triggerVictoryParticles(window.innerWidth / 2, window.innerHeight / 2, 70);
      this.deps.showToast(`🤝 Diplomatic Annexation! ${res.country.flag} ${res.country.name} (+$${res.gdpAddedB}B GDP) joined your Empire!`);
      this.refreshAllUi();
    }
  }

  // =========================================================================
  // 6. CLOUD SYNC & 6-CHARACTER KEY MODAL
  // =========================================================================
  openSyncModal() {
    const modal = document.getElementById('empireSyncModal');
    if (!modal) return;
    modal.style.display = 'flex';

    const codeInput = document.getElementById('empSyncCodeInput');
    if (codeInput) codeInput.value = this.engine.state.commanderCode || 'KRONOS-7';

    // Generate Dynamic QR Code image for mobile syncing
    const hash = this.engine.getSyncHash();
    const shareUrl = `${window.location.origin}${window.location.pathname}#empire=${hash}`;
    const qrImg = document.getElementById('empQrCodeImage');
    if (qrImg) {
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
    }

    document.querySelectorAll('.emp-slot-pill').forEach(pill => {
      const slot = parseInt(pill.dataset.slot, 10);
      pill.classList.toggle('active', slot === this.engine.state.slot);
    });
  }

  closeSyncModal() {
    const modal = document.getElementById('empireSyncModal');
    if (modal) modal.style.display = 'none';
  }

  switchSaveSlot(slotNum) {
    this.engine.saveToSlot(this.engine.state.slot);
    const loaded = this.engine.loadFromSlot(slotNum);
    if (!loaded) {
      this.engine.resetCampaign(true);
      this.engine.state.slot = slotNum;
      this.engine.saveState();
    }
    this.closeSyncModal();
    this.refreshAllUi();
    this.deps.showToast(`💾 Switched to Campaign Slot ${slotNum}`);
  }

  // =========================================================================
  // 7. MISSION DIRECTIVE MODAL & WAR CARDS DOCK
  // =========================================================================
  openDirectiveModal() {
    const modal = document.getElementById('empireDirectiveModal');
    if (modal) modal.style.display = 'flex';
  }

  closeDirectiveModal() {
    const modal = document.getElementById('empireDirectiveModal');
    if (modal) modal.style.display = 'none';
  }

  toggleCardsDock(forceState = null) {
    const dock = document.getElementById('empireCardsDock');
    if (!dock) return;
    const isCollapsed = dock.classList.contains('collapsed');
    const targetCollapsed = forceState !== null ? !forceState : !isCollapsed;
    dock.classList.toggle('collapsed', targetCollapsed);
  }

  toggleRightDrawer() {
    const drawer = document.getElementById('rightDrawer');
    if (!drawer) return;
    this.isDrawerOpen = !this.isDrawerOpen;
    drawer.classList.toggle('emp-drawer-open', this.isDrawerOpen);
    if (this.isDrawerOpen) {
      this.renderRightDrawer();
    }
  }

  renderCardsDock() {
    const grid = document.getElementById('empCardsGrid');
    const progText = document.getElementById('empNextCardProgress');
    if (!grid) return;

    if (progText) {
      progText.textContent = `🎁 Next Card Loot: ${this.engine.state.stats.totalConquests % 3}/3 Conquests`;
    }

    grid.innerHTML = WAR_CARDS_META.map(card => {
      const count = this.engine.state.cards[card.id] || 0;
      return `
        <div class="emp-war-card-btn ${count > 0 ? 'ready' : 'empty'}" data-card="${card.id}">
          <div class="emp-card-top">
            <span class="emp-card-icon">${card.icon}</span>
            <span class="emp-card-count">x${count}</span>
          </div>
          <div class="emp-card-title">${card.name}</div>
          <div class="emp-card-desc">${card.desc}</div>
        </div>
      `;
    }).join('');
  }

  handleWarCardDockClick(cardId) {
    this.deps.sounds.playClick();
    const count = this.engine.state.cards[cardId] || 0;
    if (count <= 0) {
      this.deps.showToast(`⚠️ No ${cardId} cards available. Win 3 Sieges to loot new cards!`);
      return;
    }

    if (cardId === 'spy_satellite') {
      if (this.activeSiege) this.useSpySatelliteInSiege();
      else this.deps.showToast('🛰️ Spy Satellite is deployed inside a Border Siege to remove 2 wrong answers!');
    } else if (cardId === 'diplomatic_annex') {
      this.deps.showToast('🤝 Click any Frontier country on the map to Diplomatically Annex it!');
    } else if (cardId === 'iron_dome') {
      const reb = this.engine.state.activeRebellion;
      if (reb && reb.countryCode) {
        this.engine.fortifyOwnedTerritory(reb.countryCode);
        this.deps.sounds.playConquestHorn();
        this.refreshAllUi();
        this.deps.showToast('🛡️ Iron Dome crushed active rebellion & fortified territory!');
      } else {
        this.deps.showToast('🛡️ Click any owned territory on the map to Fortify it against rebellions!');
      }
    } else if (cardId === 'amphibious_strike') {
      this.engine.amphibiousModeActive = !this.engine.amphibiousModeActive;
      this.deps.showToast(this.engine.amphibiousModeActive ? '⚓ Amphibious Strike Armed! All 195 nations are siegeable!' : '⚓ Amphibious Strike Disarmed.');
      this.refreshAllUi();
    }
  }

  renderBanners() {
    const rebBanner = document.getElementById('empireRebellionBanner');
    const reb = this.engine.state.activeRebellion;
    if (rebBanner) {
      if (reb && reb.countryCode) {
        const c = countryByCode[reb.countryCode];
        const text = document.getElementById('empRebellionText');
        if (text) text.textContent = `🚨 DEFCON UPRISING IN ${c?.flag || ''} ${c?.name || reb.countryCode}! Defend or lose sovereignty!`;
        rebBanner.style.display = 'flex';
      } else {
        rebBanner.style.display = 'none';
      }
    }
  }

  // =========================================================================
  // 8. RIGHT DRAWER (TARGETS, MY EMPIRE, BUFFS)
  // =========================================================================
  renderRightDrawer() {
    document.querySelectorAll('.drawer-view').forEach(v => v.style.display = 'none');
    const viewEmp = document.getElementById('viewEmpireCommand');
    if (viewEmp) viewEmp.style.display = 'flex';

    const heroTitle = document.getElementById('empDrawerDynastyTitle');
    const heroSub = document.getElementById('empDrawerDynastySub');
    const rankInfo = this.engine.getDynastyRankInfo();
    const ledger = this.engine.getEmpireLedger();

    if (heroTitle) heroTitle.textContent = this.engine.state.dynastyName || rankInfo.current.title;
    if (heroSub) heroSub.textContent = `${rankInfo.current.title} • Next: ${rankInfo.next ? rankInfo.next.title : 'Supreme'} (${ledger.conqueredCount}/${rankInfo.next ? rankInfo.next.min : 195} Nations)`;

    const bar = document.getElementById('empDrawerDynastyBar');
    if (bar) bar.style.width = `${Math.max(4, rankInfo.progressPct)}%`;

    if (this.activeDrawerTab === 'targets') this.renderTargetsTabContent();
    else if (this.activeDrawerTab === 'empire') this.renderMyEmpireTabContent();
    else if (this.activeDrawerTab === 'buffs') this.renderBuffsAndRanksTabContent();
  }

  renderTargetsTabContent() {
    const listEl = document.getElementById('empTargetList');
    if (!listEl) return;

    const started = this.engine.hasCampaignStarted();
    const ownedSet = new Set(this.engine.state.conqueredCodes);
    const frontlineSet = this.engine.getFrontlineSet();
    const hasAnnex = (this.engine.state.cards.diplomatic_annex || 0) > 0;

    let filtered = COUNTRIES.filter(c => {
      if (this.searchQuery) {
        const q = this.searchQuery;
        return c.name.toLowerCase().includes(q) || (c.capital && c.capital.toLowerCase().includes(q));
      }
      if (this.targetFilter === 'frontline') return frontlineSet.has(c.code) && !ownedSet.has(c.code);
      if (this.targetFilter === 'bosses') return getCountryGdpBillions(c.code) >= 1000;
      if (this.targetFilter === 'microstates') return c.area < 5000;
      return true;
    });

    listEl.innerHTML = filtered.slice(0, 60).map(c => {
      const isOwned = ownedSet.has(c.code);
      const isFront = frontlineSet.has(c.code);
      const gdpB = getCountryGdpBillions(c.code);
      const gdpStr = gdpB >= 1000 ? `$${(gdpB / 1000).toFixed(2)}T` : `$${gdpB}B`;

      let action = '';
      if (isOwned) action = '<span class="emp-row-owned-tag">✅ Owned</span>';
      else if (isFront) {
        action = `
          <div class="emp-row-actions">
            ${hasAnnex ? `<button class="emp-row-btn annex" data-action="annex" data-code="${c.code}">🤝</button>` : ''}
            <button class="emp-row-btn siege" data-action="siege" data-code="${c.code}">⚔️ Siege</button>
          </div>
        `;
      } else action = '<span class="emp-row-fog-tag">🔒 Fog</span>';

      const recShields = getRecommendedShieldCount(c.code);
      return `
        <div class="emp-country-row ${isOwned ? 'owned' : (isFront ? 'frontline' : 'fog')}" data-code="${c.code}">
          <span class="emp-row-flag">${c.flag}</span>
          <div class="emp-row-info">
            <div class="emp-row-name">${c.name}</div>
            <div class="emp-row-sub">🛡️ ${recShields} ${recShields === 1 ? 'Shield' : 'Shields'} • ${gdpStr} GDP • 🏛️ ${c.capital || 'N/A'}</div>
          </div>
          ${action}
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const code = btn.dataset.code;
        const act = btn.dataset.action;
        if (act === 'siege') this.startSiege(code, false);
        else if (act === 'annex') this.executeDirectDiplomaticAnnex(code);
      });
    });

    listEl.querySelectorAll('.emp-country-row').forEach(row => {
      row.addEventListener('click', () => {
        const code = row.dataset.code;
        this.handleCountryInteraction(code);
      });
    });
  }

  renderMyEmpireTabContent() {
    const container = document.getElementById('empTabPanelEmpire');
    if (!container) return;

    const ledger = this.engine.getEmpireLedger();
    const stats = this.engine.state.stats;
    const accuracy = stats.questionsAnswered > 0
      ? Math.round((stats.questionsCorrect / stats.questionsAnswered) * 100)
      : 100;

    const contRows = Object.entries(ledger.continents).map(([reg, data]) => {
      const pct = data.total > 0 ? Math.round((data.owned / data.total) * 100) : 0;
      return `
        <div class="emp-cont-row">
          <div class="emp-cont-top">
            <span>🌍 ${reg}</span>
            <strong>${data.owned} / ${data.total} (${pct}%)</strong>
          </div>
          <div class="emp-cont-track">
            <div class="emp-cont-fill" style="width:${Math.max(2, pct)}%"></div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="emp-ledger-grid">
        <div class="emp-ledger-card">
          <span class="emp-lc-lbl">NOMINAL GDP</span>
          <span class="emp-lc-val">${ledger.gdpFormatted}</span>
        </div>
        <div class="emp-ledger-card">
          <span class="emp-lc-lbl">POPULATION</span>
          <span class="emp-lc-val">${this.formatPopulation(ledger.population)}</span>
        </div>
        <div class="emp-ledger-card">
          <span class="emp-lc-lbl">ACCURACY</span>
          <span class="emp-lc-val">${accuracy}% (${stats.siegesWon}W)</span>
        </div>
        <div class="emp-ledger-card">
          <span class="emp-lc-lbl">LANDMASS</span>
          <span class="emp-lc-val">${(ledger.areaKm2 / 1e6).toFixed(2)}M km²</span>
        </div>
      </div>
      <div class="emp-section-block">
        <h4 class="emp-sec-title">🌐 Continental Sovereignty</h4>
        ${contRows}
      </div>
    `;
  }

  renderBuffsAndRanksTabContent() {
    const container = document.getElementById('empTabPanelBuffs');
    if (!container) return;

    const buffs = this.engine.getBuffStatuses();
    const count = this.engine.state.conqueredCodes.length;

    const buffsHtml = buffs.map(b => `
      <div class="emp-buff-card ${b.mastery ? 'mastery' : (b.unlocked ? 'unlocked' : '')}">
        <div class="emp-bc-header">
          <span class="emp-bc-icon">${b.icon}</span>
          <div class="emp-bc-titles">
            <div class="emp-bc-name">${b.name}</div>
            <div class="emp-bc-status">${b.mastery ? '★ MASTERY ACTIVE' : (b.unlocked ? '✅ UNLOCKED' : `🔒 Locked (${b.ownedCount}/1)`)}</div>
          </div>
        </div>
        <p class="emp-bc-desc">${b.tier1Desc}</p>
      </div>
    `).join('');

    const ranksHtml = DYNASTY_RANKS.map(r => {
      const achieved = count >= r.min;
      return `
        <div class="emp-rank-ladder-item ${achieved ? 'achieved' : ''}">
          <span class="emp-rl-icon">${r.icon}</span>
          <div class="emp-rl-info">
            <div class="emp-rl-title">${r.title} (${r.min}–${r.max} Nations)</div>
            <div class="emp-rl-perk">${r.perk}</div>
          </div>
          <span class="emp-rl-check">${achieved ? '✅' : '🔒'}</span>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="emp-section-block">
        <h4 class="emp-sec-title">⚡ Geopolitical Buffs</h4>
        ${buffsHtml}
      </div>
      <div class="emp-section-block">
        <h4 class="emp-sec-title">👑 Dynasty Hierarchy</h4>
        ${ranksHtml}
      </div>
    `;
  }

  handleKeyDown(e) {
    if (this.deps.getCurrentMode() !== 'conquest') return;

    if (e.key === 'Escape') {
      if (this.activeSiege) this.closeSiegeModal();
      else if (this.activeDossierCode) this.closeTargetDossier();
      else if (this.isDrawerOpen) this.toggleRightDrawer();
      return;
    }

    if (this.activeSiege) {
      if (e.key === ' ' && !this.activeSiege.answered) {
        e.preventDefault();
        this.toggleSiegePause();
        return;
      }

      if (this.activeSiege.answered) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.advanceSiegeStep();
        }
        return;
      }

      const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3, A: 0, B: 1, C: 2, D: 3 };
      if (keyMap[e.key] !== undefined) {
        const idx = keyMap[e.key];
        const btn = document.querySelectorAll('.emp-opt-btn')[idx];
        if (btn && !btn.disabled) {
          this.handleSiegeAnswer(idx, btn);
        }
      }
    }
  }

  handleVisibilityChange() {
    if (this.activeSiege && !this.activeSiege.answered && !this.isPaused) {
      this.activeSiege.lastTickTime = performance.now();
    }
  }

  shareEmpireProgress() {
    if (this.deps.openShareCardModal) {
      const ledger = this.engine.getEmpireLedger();
      const rank = this.engine.getDynastyRankInfo().current;
      this.deps.openShareCardModal({
        headline: `"Commanding ${this.engine.state.dynastyName || 'The Sovereign Realm'} with ${ledger.conqueredCount} conquered nations."`,
        subject: `${rank.icon} ${this.engine.state.dynastyName || rank.title}`,
        subtext: `${ledger.gdpFormatted} Nominal GDP • ${ledger.worldSharePct}% of Earth Unified`,
        icon: rank.icon
      });
    }
  }
}
