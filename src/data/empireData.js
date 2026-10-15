// src/data/empireData.js
// Canonical 195-Country Grand Strategy Registry:
// - 2024 IMF/World Bank Nominal GDP (in USD Billions)
// - Defense Shield Tiers (1 = Standard, 2 = Regional Power, 3 = Superpower Boss)
// - Hybrid Land + Maritime Strait Adjacency Graph (Zero Orphaned Islands)
// - Strategic Country Buff Families, 6 Dynasty Ranks & Tactical War Cards

export const EMPIRE_THEMES = {
  gold: {
    id: 'gold',
    name: 'Imperial Gold',
    icon: '👑',
    fill: 'rgba(245, 158, 11, 0.44)',
    border: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.55)',
    hex: 0xf59e0b
  },
  cyan: {
    id: 'cyan',
    name: 'Cyber Sovereign',
    icon: '⚡',
    fill: 'rgba(6, 182, 212, 0.44)',
    border: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.55)',
    hex: 0x38bdf8
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson Dynasty',
    icon: '🔥',
    fill: 'rgba(244, 63, 94, 0.44)',
    border: '#fb7185',
    glow: 'rgba(244, 63, 94, 0.55)',
    hex: 0xf43f5e
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Hegemony',
    icon: '🐉',
    fill: 'rgba(16, 185, 129, 0.44)',
    border: '#34d399',
    glow: 'rgba(16, 185, 129, 0.55)',
    hex: 0x10b981
  }
};

export const DYNASTY_RANKS = [
  { id: 'rising',      tier: 1, min: 1,   max: 4,   icon: '🏳️', title: 'Rising State',           perk: 'Establish your capital & secure initial borders' },
  { id: 'hegemon',     tier: 2, min: 5,   max: 14,  icon: '🛡️', title: 'Regional Hegemon',       perk: '+10% Siege Score & Dynasty Banner Unlocked' },
  { id: 'continental', tier: 3, min: 15,  max: 39,  icon: '⚓', title: 'Continental Power',      perk: '+25% Siege Score & Strategic Recon Priority' },
  { id: 'superpower',  tier: 4, min: 40,  max: 99,  icon: '🌐', title: 'Global Superpower',      perk: '+50% Siege Score & Global Command Prestige' },
  { id: 'sovereign',   tier: 5, min: 100, max: 194, icon: '👑', title: 'Supreme Sovereign',      perk: 'Dominates over half of Earth’s sovereign nations' },
  { id: 'planetary',   tier: 6, min: 195, max: 999, icon: '🌌', title: 'Planetary Civilization', perk: '100% of Earth Unified Under One Banner!' }
];

export const STRATEGIC_BUFFS = [
  {
    id: 'energy',
    name: 'Energy Monopoly',
    icon: '🛢️',
    shortLabel: '+5s Timer',
    codes: ['SA', 'RU', 'AE', 'NO', 'QA', 'KW'],
    tier1Desc: '+5 Seconds on all Siege & Rebellion timers (15s → 20s)',
    tier2Desc: 'Mastery (3+ Nations): +10 Seconds on timers (25s) & +10% Empire GDP bonus'
  },
  {
    id: 'tech',
    name: 'Orbital Recon',
    icon: '🛰️',
    shortLabel: 'Auto-50:50',
    codes: ['US', 'JP', 'KR', 'DE', 'IL', 'TW'],
    tier1Desc: 'Automatically eliminates 1 wrong answer option on Shield 1 of every Siege',
    tier2Desc: 'Mastery (3+ Nations): Eliminates 1 wrong option on ALL shields (including Boss fights)'
  },
  {
    id: 'naval',
    name: 'Global Navy',
    icon: '⚓',
    shortLabel: 'Ocean Jump',
    codes: ['EG', 'PA', 'SG', 'GB', 'TR', 'DJ'],
    tier1Desc: 'Controls Global Chokepoints: Any coastal nation on Earth becomes attackable!',
    tier2Desc: 'Mastery (3+ Nations): Unrestricted Global Projection — attack any nation on Earth!'
  }
];

export const WAR_CARDS_META = [
  {
    id: 'spy_satellite',
    name: 'Spy Satellite',
    icon: '🛰️',
    badge: 'INTEL ASSIST',
    desc: 'Instantly breaks the current shield during any Siege or Rebellion defense.',
    usageContext: 'siege'
  },
  {
    id: 'diplomatic_annex',
    name: 'Diplomatic Annex',
    icon: '🤝',
    badge: 'INSTANT ANNEX',
    desc: 'Peacefully annex any 1-Shield frontline country without fighting a siege.',
    usageContext: 'map_1shield'
  },
  {
    id: 'iron_dome',
    name: 'Iron Dome',
    icon: '🛡️',
    badge: 'FORTIFY & DEFEND',
    desc: 'Auto-crushes an active Rebellion OR permanently fortifies any owned territory.',
    usageContext: 'rebellion_or_owned'
  },
  {
    id: 'amphibious_strike',
    name: 'Amphibious Strike',
    icon: '🌊',
    badge: 'DEEP INVASION',
    desc: 'Launch a cross-ocean D-Day invasion on ANY unconquered country on Earth.',
    usageContext: 'map_any'
  }
];

// Tier 3 Global Superpower Bosses (3 Shields)
export const TIER_3_BOSS_CODES = new Set(['US', 'CN', 'RU', 'IN', 'JP', 'DE']);

// Tier 2 Regional Powers (2 Shields)
export const TIER_2_POWER_CODES = new Set([
  'GB', 'FR', 'BR', 'IT', 'CA', 'KR', 'AU', 'ES', 'MX', 'ID',
  'TR', 'SA', 'NL', 'CH', 'PL', 'SE', 'BE', 'AR', 'NG', 'EG',
  'ZA', 'IR', 'TH', 'AE', 'SG', 'IL', 'NO', 'UA'
]);

// Landlocked sovereign countries (44 countries + Vatican) — all others are coastal (eligible for Global Navy Tier 1)
export const LANDLOCKED_CODES = new Set([
  'AF', 'AD', 'AM', 'AT', 'AZ', 'BY', 'BT', 'BO', 'BW', 'BF',
  'BI', 'CF', 'TD', 'CZ', 'SZ', 'ET', 'HU', 'KZ', 'KG', 'LA',
  'LS', 'LI', 'LU', 'MW', 'ML', 'MD', 'MN', 'NP', 'NE', 'MK',
  'PY', 'RW', 'SM', 'RS', 'SK', 'SS', 'CH', 'TJ', 'TM', 'UG',
  'UZ', 'VA', 'ZM', 'ZW'
]);

// 2024 IMF / World Bank Nominal GDP in USD Billions (Verified Baseline)
export const COUNTRY_GDP_BILLIONS = {
  US: 28781, CN: 18533, DE: 4591, JP: 4110, IN: 3937, GB: 3495, FR: 3130, BR: 2331, IT: 2328, CA: 2242,
  RU: 2057, MX: 2017, AU: 1790, KR: 1761, ES: 1647, ID: 1476, NL: 1143, TR: 1114, SA: 1106, CH: 938,
  PL: 845, TW: 803, BE: 655, AR: 604, SE: 604, IE: 564, AE: 537, AT: 526, SG: 525, TH: 549,
  IL: 530, NO: 527, PH: 472, VN: 465, BD: 455, MY: 440, IR: 434, DK: 409, CO: 386, HK: 380,
  ZA: 373, RO: 369, EG: 348, PK: 338, CL: 334, CZ: 326, FI: 308, PT: 299, KZ: 296, PE: 282,
  NG: 253, IQ: 265, NZ: 252, GR: 251, QA: 245, DZ: 267, HU: 223, UA: 189, KW: 160, MA: 152,
  ET: 145, SK: 141, EC: 121, DO: 127, PR: 118, KE: 104, AO: 93, UZ: 102, GT: 110, OM: 114,
  BG: 108, VE: 102, CR: 95, LU: 90, HR: 89, PA: 87, CI: 86, LK: 85, TM: 82, LT: 81,
  UY: 82, RS: 82, BY: 73, AZ: 78, CD: 74, SI: 73, GH: 75, TZ: 79, MM: 68, TN: 54,
  JO: 53, CM: 53, BO: 49, UG: 56, BH: 47, LV: 45, PY: 44, LY: 45, NP: 44, EE: 43,
  SV: 36, HN: 37, PG: 32, KH: 42, CY: 34, IS: 33, ZB: 32, ZM: 29, SN: 35, TT: 29,
  GE: 33, BA: 29, LA: 15, GN: 25, AL: 25, HT: 24, AM: 25, ML: 22, BF: 22, MZ: 23,
  MT: 22, BW: 21, BJ: 21, GA: 21, PS: 19, MN: 22, JM: 20, NI: 19, NE: 19, GY: 21,
  MD: 18, LB: 22, MG: 17, KP: 16, MU: 16, BN: 16, TD: 18, RW: 14, NA: 13, MW: 12,
  CG: 15, MR: 11, BS: 14, KG: 14, TJ: 13, SO: 12, TG: 10, MC: 9.2, ME: 8.0, MV: 7.2,
  BB: 6.8, FJ: 5.8, SZ: 5.1, SL: 4.6, DJ: 4.3, SR: 4.3, AD: 3.9, LI: 7.8, BI: 3.1,
  BZ: 3.3, BT: 3.1, CF: 2.8, CV: 2.7, LC: 2.5, GM: 2.4, LS: 2.3, ER: 2.4, SC: 2.2,
  TL: 2.1, AG: 2.0, GW: 2.0, SM: 1.9, SB: 1.7, KN: 1.1, VC: 1.1, WS: 1.0, KM: 1.4,
  VU: 1.1, ST: 0.7, DM: 0.7, TO: 0.6, FM: 0.5, PW: 0.3, MH: 0.3, KI: 0.3, NR: 0.2,
  TV: 0.1, VA: 0.2, SY: 20, SD: 26, YE: 21, GQ: 12, LR: 4.5, SS: 6.5, GD: 1.3, ZW: 32
};

// Deterministic Bidirectional Land + Maritime Strait Adjacency Graph (All 195 Sovereign Nations Connected)
const RAW_ADJACENCY = {
  AF: ['PK', 'IR', 'TM', 'UZ', 'TJ', 'CN'],
  AL: ['ME', 'RS', 'MK', 'GR', 'IT'],
  DZ: ['MA', 'TN', 'LY', 'NE', 'ML', 'MR', 'ES'],
  AD: ['FR', 'ES'],
  AO: ['CD', 'CG', 'ZM', 'NA'],
  AG: ['KN', 'DM', 'GD', 'BB'],
  AR: ['CL', 'BO', 'PY', 'BR', 'UY'],
  AM: ['GE', 'AZ', 'IR', 'TR'],
  AU: ['ID', 'TL', 'PG', 'SB', 'VU', 'FJ', 'NZ'],
  AT: ['DE', 'CZ', 'SK', 'HU', 'SI', 'IT', 'CH', 'LI'],
  AZ: ['RU', 'GE', 'AM', 'IR', 'TR', 'TM', 'KZ'],
  BS: ['US', 'CU', 'HT', 'JM'],
  BH: ['SA', 'QA', 'IR'],
  BD: ['IN', 'MM', 'LK'],
  BB: ['LC', 'VC', 'GD', 'TT', 'AG'],
  BY: ['LV', 'LT', 'PL', 'UA', 'RU'],
  BE: ['FR', 'LU', 'DE', 'NL', 'GB'],
  BZ: ['MX', 'GT', 'HN'],
  BJ: ['TG', 'BF', 'NE', 'NG'],
  BT: ['IN', 'CN', 'NP'],
  BO: ['PE', 'BR', 'PY', 'AR', 'CL'],
  BA: ['HR', 'RS', 'ME'],
  BW: ['NA', 'ZA', 'ZW', 'ZM'],
  BR: ['UY', 'AR', 'PY', 'BO', 'PE', 'CO', 'VE', 'GY', 'SR', 'FR'],
  BN: ['MY', 'ID', 'PH', 'SG'],
  BG: ['RO', 'RS', 'MK', 'GR', 'TR'],
  BF: ['ML', 'NE', 'BJ', 'TG', 'GH', 'CI'],
  BI: ['RW', 'TZ', 'CD'],
  CV: ['SN', 'MR', 'GM', 'GW', 'PT'],
  KH: ['TH', 'LA', 'VN'],
  CM: ['NG', 'TD', 'CF', 'CG', 'GA', 'GQ'],
  CA: ['US', 'DK', 'IS', 'RU'],
  CF: ['TD', 'SD', 'SS', 'CD', 'CG', 'CM'],
  TD: ['LY', 'SD', 'CF', 'CM', 'NG', 'NE'],
  CL: ['PE', 'BO', 'AR', 'NZ'],
  CN: ['RU', 'MN', 'KP', 'VN', 'LA', 'MM', 'IN', 'BT', 'NP', 'PK', 'AF', 'TJ', 'KG', 'KZ', 'TW', 'JP', 'KR', 'PH'],
  CO: ['PA', 'VE', 'BR', 'PE', 'EC'],
  KM: ['MZ', 'TZ', 'MG', 'SC', 'MU'],
  CG: ['GA', 'CM', 'CF', 'CD', 'AO'],
  CD: ['CG', 'CF', 'SS', 'UG', 'RW', 'BI', 'TZ', 'ZM', 'AO'],
  CR: ['NI', 'PA'],
  CI: ['LR', 'GN', 'ML', 'BF', 'GH'],
  HR: ['SI', 'HU', 'RS', 'BA', 'ME', 'IT'],
  CU: ['US', 'BS', 'MX', 'JM', 'HT'],
  CY: ['TR', 'GR', 'SY', 'LB', 'IL', 'EG'],
  CZ: ['DE', 'PL', 'SK', 'AT'],
  DK: ['DE', 'SE', 'NO', 'GB', 'IS', 'CA'],
  DJ: ['ER', 'ET', 'SO', 'YE'],
  DM: ['AG', 'LC', 'BB', 'KN'],
  DO: ['HT', 'CU', 'JM', 'VE'],
  EC: ['CO', 'PE'],
  EG: ['LY', 'SD', 'IL', 'PS', 'JO', 'SA', 'CY', 'GR'],
  SV: ['GT', 'HN', 'NI'],
  GQ: ['CM', 'GA', 'ST', 'NG'],
  ER: ['SD', 'ET', 'DJ', 'SA', 'YE'],
  EE: ['RU', 'LV', 'FI', 'SE'],
  SZ: ['ZA', 'MZ'],
  ET: ['ER', 'DJ', 'SO', 'KE', 'SS', 'SD'],
  FJ: ['VU', 'TO', 'WS', 'TV', 'NZ', 'AU'],
  FI: ['SE', 'NO', 'RU', 'EE'],
  FR: ['BE', 'LU', 'DE', 'CH', 'IT', 'MC', 'ES', 'AD', 'GB', 'BR', 'SR'],
  GA: ['GQ', 'CM', 'CG', 'ST'],
  GM: ['SN', 'CV', 'GW'],
  GE: ['RU', 'AZ', 'AM', 'TR'],
  DE: ['DK', 'PL', 'CZ', 'AT', 'CH', 'FR', 'LU', 'BE', 'NL', 'SE'],
  GH: ['CI', 'BF', 'TG'],
  GR: ['AL', 'MK', 'BG', 'TR', 'CY', 'IT', 'EG'],
  GD: ['VC', 'TT', 'BB', 'VE'],
  GT: ['MX', 'BZ', 'HN', 'SV'],
  GN: ['GW', 'SN', 'ML', 'CI', 'LR', 'SL'],
  GW: ['SN', 'GN', 'CV', 'GM'],
  GY: ['VE', 'BR', 'SR', 'TT'],
  HT: ['DO', 'CU', 'JM', 'BS'],
  HN: ['GT', 'SV', 'NI', 'BZ'],
  HU: ['AT', 'SK', 'UA', 'RO', 'RS', 'HR', 'SI'],
  IS: ['NO', 'GB', 'IE', 'DK', 'CA'],
  IN: ['PK', 'CN', 'NP', 'BT', 'BD', 'MM', 'LK', 'MV', 'ID', 'TH'],
  ID: ['MY', 'PG', 'TL', 'SG', 'AU', 'PH', 'IN', 'BN'],
  IR: ['IQ', 'TR', 'AM', 'AZ', 'TM', 'AF', 'PK', 'OM', 'AE', 'SA', 'QA', 'BH', 'KW'],
  IQ: ['IR', 'TR', 'SY', 'JO', 'SA', 'KW'],
  IE: ['GB', 'IS', 'FR'],
  IL: ['LB', 'SY', 'JO', 'PS', 'EG', 'CY'],
  IT: ['FR', 'CH', 'AT', 'SI', 'SM', 'VA', 'MT', 'TN', 'GR', 'HR', 'AL'],
  JM: ['CU', 'HT', 'BS', 'DO'],
  JP: ['KR', 'KP', 'RU', 'CN', 'TW', 'PH', 'US'],
  JO: ['SY', 'IQ', 'SA', 'IL', 'PS', 'EG'],
  KZ: ['RU', 'CN', 'KG', 'UZ', 'TM', 'AZ'],
  KE: ['ET', 'SO', 'TZ', 'UG', 'SS'],
  KI: ['MH', 'TV', 'NR', 'FJ', 'WS', 'TO'],
  KP: ['CN', 'RU', 'KR', 'JP'],
  KR: ['KP', 'JP', 'CN', 'TW'],
  KW: ['IQ', 'SA', 'IR'],
  KG: ['KZ', 'UZ', 'TJ', 'CN'],
  LA: ['MM', 'CN', 'VN', 'KH', 'TH'],
  LV: ['EE', 'RU', 'BY', 'LT', 'SE'],
  LB: ['SY', 'IL', 'CY'],
  LS: ['ZA'],
  LR: ['SL', 'GN', 'CI'],
  LY: ['TN', 'DZ', 'NE', 'TD', 'SD', 'EG', 'MT', 'IT'],
  LI: ['CH', 'AT'],
  LT: ['LV', 'BY', 'PL', 'RU', 'SE'],
  LU: ['BE', 'DE', 'FR'],
  MG: ['MZ', 'KM', 'MU', 'SC', 'TZ'],
  MW: ['TZ', 'MZ', 'ZM'],
  MY: ['TH', 'SG', 'ID', 'BN', 'PH', 'VN'],
  MV: ['IN', 'LK', 'MU', 'SC'],
  ML: ['DZ', 'NE', 'BF', 'CI', 'GN', 'SN', 'MR'],
  MT: ['IT', 'TN', 'LY'],
  MH: ['FM', 'KI', 'NR'],
  MR: ['MA', 'DZ', 'ML', 'SN', 'CV'],
  MU: ['MG', 'KM', 'SC', 'MV'],
  MX: ['US', 'GT', 'BZ', 'CU'],
  FM: ['PW', 'PG', 'MH', 'NR'],
  MD: ['RO', 'UA'],
  MC: ['FR', 'IT'],
  MN: ['RU', 'CN'],
  ME: ['HR', 'BA', 'RS', 'AL', 'IT'],
  MA: ['DZ', 'MR', 'ES', 'PT'],
  MZ: ['TZ', 'MW', 'ZM', 'ZW', 'ZA', 'SZ', 'MG', 'KM'],
  MM: ['IN', 'BD', 'CN', 'LA', 'TH'],
  NA: ['AO', 'ZM', 'BW', 'ZA'],
  NR: ['MH', 'FM', 'KI', 'SB', 'TV'],
  NP: ['IN', 'CN', 'BT'],
  NL: ['DE', 'BE', 'GB'],
  NZ: ['AU', 'FJ', 'TO', 'WS', 'CL'],
  NI: ['HN', 'CR', 'SV'],
  NE: ['DZ', 'LY', 'TD', 'NG', 'BJ', 'BF', 'ML'],
  NG: ['BJ', 'NE', 'TD', 'CM', 'GQ'],
  MK: ['RS', 'BG', 'GR', 'AL'],
  NO: ['SE', 'FI', 'RU', 'DK', 'GB', 'IS'],
  OM: ['AE', 'SA', 'YE', 'IR', 'PK'],
  PK: ['IN', 'AF', 'IR', 'CN', 'OM'],
  PW: ['PH', 'ID', 'FM', 'PG'],
  PS: ['IL', 'EG', 'JO'],
  PA: ['CR', 'CO'],
  PG: ['ID', 'AU', 'SB', 'FM', 'PW'],
  PY: ['AR', 'BO', 'BR'],
  PE: ['EC', 'CO', 'BR', 'BO', 'CL'],
  PH: ['TW', 'MY', 'ID', 'VN', 'BN', 'PW', 'JP', 'CN'],
  PL: ['DE', 'CZ', 'SK', 'UA', 'BY', 'LT', 'RU', 'SE'],
  PT: ['ES', 'MA', 'CV'],
  QA: ['SA', 'AE', 'BH', 'IR'],
  RO: ['UA', 'MD', 'BG', 'RS', 'HU'],
  RU: ['NO', 'FI', 'EE', 'LV', 'LT', 'PL', 'BY', 'UA', 'GE', 'AZ', 'KZ', 'CN', 'MN', 'KP', 'JP', 'US', 'CA'],
  RW: ['UG', 'TZ', 'BI', 'CD'],
  KN: ['AG', 'DM'],
  LC: ['VC', 'BB', 'DM'],
  VC: ['LC', 'BB', 'GD'],
  WS: ['TO', 'FJ', 'TV', 'KI', 'NZ'],
  SM: ['IT'],
  ST: ['GA', 'GQ', 'NG', 'CM'],
  SA: ['JO', 'IQ', 'KW', 'QA', 'BH', 'AE', 'OM', 'YE', 'EG', 'ER', 'IR'],
  SN: ['MR', 'ML', 'GN', 'GW', 'GM', 'CV'],
  RS: ['HU', 'RO', 'BG', 'MK', 'AL', 'ME', 'BA', 'HR'],
  SC: ['MG', 'KM', 'MU', 'MV', 'SO', 'KE'],
  SL: ['GN', 'LR'],
  SG: ['MY', 'ID', 'BN'],
  SK: ['PL', 'UA', 'HU', 'AT', 'CZ'],
  SI: ['IT', 'AT', 'HU', 'HR'],
  SB: ['PG', 'VU', 'AU', 'NR', 'TV'],
  SO: ['DJ', 'ET', 'KE', 'YE', 'SC'],
  ZA: ['NA', 'BW', 'ZW', 'MZ', 'SZ', 'LS'],
  SS: ['SD', 'ET', 'KE', 'UG', 'CD', 'CF'],
  ES: ['PT', 'FR', 'AD', 'MA', 'DZ'],
  LK: ['IN', 'MV', 'BD'],
  SD: ['EG', 'LY', 'TD', 'CF', 'SS', 'ET', 'ER', 'SA'],
  SR: ['GY', 'BR', 'FR'],
  SE: ['NO', 'FI', 'DK', 'DE', 'PL', 'LT', 'LV', 'EE'],
  CH: ['DE', 'AT', 'LI', 'IT', 'FR'],
  SY: ['TR', 'IQ', 'JO', 'IL', 'LB', 'CY'],
  TW: ['CN', 'JP', 'PH', 'KR'],
  TJ: ['AF', 'UZ', 'KG', 'CN'],
  TZ: ['KE', 'UG', 'RW', 'BI', 'CD', 'ZM', 'MW', 'MZ', 'KM', 'MG'],
  TH: ['MM', 'LA', 'KH', 'MY', 'IN'],
  TL: ['ID', 'AU'],
  TG: ['GH', 'BF', 'BJ'],
  TO: ['FJ', 'WS', 'NZ', 'KI'],
  TT: ['VE', 'GD', 'BB', 'GY'],
  TN: ['DZ', 'LY', 'IT', 'MT'],
  TR: ['GR', 'BG', 'GE', 'AM', 'AZ', 'IR', 'IQ', 'SY', 'CY', 'UA', 'RU'],
  TM: ['KZ', 'UZ', 'AF', 'IR', 'AZ'],
  TV: ['FJ', 'WS', 'KI', 'SB', 'NR'],
  UG: ['SS', 'KE', 'TZ', 'RW', 'CD'],
  UA: ['PL', 'SK', 'HU', 'RO', 'MD', 'BY', 'RU', 'TR'],
  AE: ['SA', 'OM', 'QA', 'IR'],
  GB: ['IE', 'FR', 'BE', 'NL', 'DK', 'NO', 'IS', 'ES'],
  US: ['CA', 'MX', 'BS', 'CU', 'RU', 'JP'],
  UY: ['AR', 'BR'],
  UZ: ['KZ', 'KG', 'TJ', 'AF', 'TM'],
  VU: ['SB', 'FJ', 'AU'],
  VA: ['IT'],
  VE: ['CO', 'BR', 'GY', 'TT', 'GD', 'DO'],
  VN: ['CN', 'LA', 'KH', 'PH', 'MY'],
  YE: ['SA', 'OM', 'DJ', 'ER', 'SO'],
  ZM: ['CD', 'TZ', 'MW', 'MZ', 'ZW', 'BW', 'NA', 'AO'],
  ZW: ['ZM', 'MZ', 'ZA', 'BW']
};

// Build symmetric bidirectional adjacency map
export const ADJACENCY_GRAPH = {};
for (const [code, list] of Object.entries(RAW_ADJACENCY)) {
  if (!ADJACENCY_GRAPH[code]) ADJACENCY_GRAPH[code] = new Set();
  for (const neighbor of list) {
    ADJACENCY_GRAPH[code].add(neighbor);
    if (!ADJACENCY_GRAPH[neighbor]) ADJACENCY_GRAPH[neighbor] = new Set();
    ADJACENCY_GRAPH[neighbor].add(code);
  }
}

// Helper to get country defense tier (5 shields for authentic 5-question blitz siege)
export function getCountryShieldTier(code) {
  return 5;
}

// Helper to get country Nominal GDP in Billions USD
export function getCountryGdpBillions(code) {
  return COUNTRY_GDP_BILLIONS[code] ?? 5.0;
}

// Helper to check if country has a coastline
export function isCountryCoastal(code) {
  return !LANDLOCKED_CODES.has(code);
}

// Curated High-Stakes Boss & Strategic Chokepoint Questions for Shield 3
export const COUNTRY_SIEGE_INTEL = {
  IN: {
    q: 'Which narrow strategic maritime channel separates India’s Andaman & Nicobar Islands from Indonesia’s Sumatra at the entrance of the Strait of Malacca?',
    options: ['Six Degree Channel (Great Channel)', 'Palk Strait', 'Ten Degree Channel', 'Duncan Passage'],
    answer: 0,
    fact: 'The Six Degree Channel (Great Channel) between Indira Point (Great Nicobar) and Aceh (Sumatra) is one of Earth’s most vital shipping chokepoints.'
  },
  US: {
    q: 'Which vast river basin drains roughly 41% of the contiguous United States across 31 states before emptying into the Gulf of Mexico?',
    options: ['Mississippi-Missouri River Basin', 'Colorado River Basin', 'Columbia River Basin', 'Rio Grande Basin'],
    answer: 0,
    fact: 'The Mississippi-Missouri system is the 4th longest river system on Earth and forms the agricultural and navigable freight backbone of North America.'
  },
  CN: {
    q: 'Which massive hydroelectric structure on the Yangtze River in Hubei Province is the largest power station in the world by installed capacity (22,500 MW)?',
    options: ['Three Gorges Dam', 'Baihetan Dam', 'Gezhouba Dam', 'Xiluodu Dam'],
    answer: 0,
    fact: 'The Three Gorges Dam spans the Yangtze River and generates over 80–100 TWh of clean hydroelectricity annually while controlling downstream flooding.'
  },
  RU: {
    q: 'Which tectonic freshwater lake in southern Siberia is both the deepest (1,642 m) and holds ~22% of the world’s unfrozen surface freshwater?',
    options: ['Lake Baikal', 'Lake Ladoga', 'Lake Onega', 'Caspian Sea'],
    answer: 0,
    fact: 'Lake Baikal is an ancient continental rift lake estimated at 25 million years old, containing more water than all five North American Great Lakes combined.'
  },
  JP: {
    q: 'Which four main islands (from north to south) form the core archipelago of Japan?',
    options: ['Hokkaido, Honshu, Shikoku, Kyushu', 'Honshu, Okinawa, Sakhalin, Kyushu', 'Hokkaido, Ryukyu, Honshu, Shikoku', 'Kyushu, Formosa, Honshu, Hokkaido'],
    answer: 0,
    fact: 'Honshu is the largest and most populous island, containing Tokyo, Kyoto, Osaka, and Mount Fuji (3,776 m).'
  },
  DE: {
    q: 'Which major European river flows north through Germany’s industrial Ruhr heartland before entering the North Sea via the Netherlands?',
    options: ['The Rhine', 'The Danube', 'The Elbe', 'The Oder'],
    answer: 0,
    fact: 'The Rhine is Europe’s busiest inland waterway, linking Swiss and German industrial centers directly to the Port of Rotterdam.'
  },
  EG: {
    q: 'The Suez Canal connects the Mediterranean Sea directly to the Red Sea across which strategic Egyptian peninsula’s western isthmus?',
    options: ['Sinai Peninsula', 'Arabian Peninsula', 'Anatolian Peninsula', 'Cyrenaica Peninsula'],
    answer: 0,
    fact: 'Opened in 1869, the 193-km Suez Canal carries ~12% of global trade without requiring any locks because the Mediterranean and Red Sea are at virtually the same level.'
  },
  PA: {
    q: 'Which artificial lake forms the high-elevation freshwater transit channel of the Panama Canal between the Atlantic and Pacific locks?',
    options: ['Gatun Lake', 'Lake Nicaragua', 'Lake Maracaibo', 'Lake Titicaca'],
    answer: 0,
    fact: 'Gatun Lake sits 26 meters above sea level; ships are raised into it via triple locks and lowered back down on the opposite ocean.'
  },
  SG: {
    q: 'Singapore sits at the southern tip of the Malay Peninsula guarding which vital maritime passage between the Indian and Pacific Oceans?',
    options: ['Strait of Malacca & Singapore Strait', 'Sunda Strait', 'Lombok Strait', 'Strait of Hormuz'],
    answer: 0,
    fact: 'Over 90,000 vessels pass through the Strait of Malacca and Singapore Strait each year, carrying ~30% of all global seaborne trade.'
  },
  SA: {
    q: 'Which super-giant oil field in eastern Saudi Arabia is the largest conventional onshore oil field ever discovered on Earth?',
    options: ['Ghawar Field', 'Burgan Field', 'Safaniya Field', 'Rumaila Field'],
    answer: 0,
    fact: 'Measuring 280 km by 30 km, the Ghawar Field has produced more than half of Saudi Arabia’s cumulative oil output since 1951.'
  },
  GB: {
    q: 'Which narrow 33-kilometer maritime strait is the busiest shipping lane in the world, separating Great Britain from continental France?',
    options: ['Strait of Dover (English Channel)', 'St George’s Channel', 'North Channel', 'Pentland Firth'],
    answer: 0,
    fact: 'Over 400 commercial vessels transit the Strait of Dover daily while the Channel Tunnel runs beneath its chalk seabed.'
  },
  TR: {
    q: 'Which two Turkish straits connect the Black Sea to the Aegean and Mediterranean Seas, dividing European Thrace from Asian Anatolia?',
    options: ['Bosporus & Dardanelles', 'Kerch & Otranto', 'Messina & Bonifacio', 'Gibraltar & Hormuz'],
    answer: 0,
    fact: 'Regulated by the 1936 Montreux Convention, the Bosporus and Dardanelles (via the Sea of Marmara) are the sole maritime outlet for Black Sea nations.'
  }
};
