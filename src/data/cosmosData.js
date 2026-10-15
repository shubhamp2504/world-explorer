// src/data/cosmosData.js
// Authoritative Astrophysical Data across 20 Orders of Magnitude (10^7 m to 10^26 m)
// Verified via NASA, ESA, Gaia DR3, SDSS, and Planck Cosmological Survey

export const COSMOS_SCALES = [
  {
    exponent: 7,
    id: 'earth',
    name: 'Earth & Low Orbit',
    subtitle: 'Planetary Realm • The Blue Marble',
    meters: '10⁷ m',
    sizeFormatted: '12,742 km (Earth Diameter)',
    lightTime: '0.04 seconds',
    scaleRatio: '1 : 10,000,000',
    dominantForce: 'Planetary Gravity & Electromagnetism',
    description: 'The cradle of human civilization. Earth has an equatorial diameter of 12,742 km and orbits the Sun at 107,000 km/h. At this altitude, humanity\'s entire recorded history, atmosphere (troposphere to exosphere), and the International Space Station (408 km) are captured within a single visual frame.',
    milestones: [
      { name: 'Earth Equatorial Diameter', value: '12,742 km' },
      { name: 'Moon Orbital Distance', value: '384,400 km (1.28 light-sec)' },
      { name: 'ISS Altitude', value: '408 km above sea level' },
      { name: 'Atmosphere Thickness', value: '100 km (Kármán Line)' }
    ],
    deepFact: 'If Earth were shrunk to the size of a billiard ball, its surface would be smoother than regulation billiard balls; the deepest trench (Mariana, 11 km) and highest peak (Everest, 8.8 km) are mere fractions of a millimeter at that scale.'
  },
  {
    exponent: 11,
    id: 'inner_solar_system',
    name: 'Inner Solar System',
    subtitle: 'Terrestrial Planets & The Sun',
    meters: '10¹¹ m',
    sizeFormatted: '300 Million km (2 Astronomical Units)',
    lightTime: '16.6 minutes',
    scaleRatio: '1 : 100 Billion',
    dominantForce: 'Solar Gravitational Field',
    description: 'The inner planetary sanctum governed by the Sun—a G-type main-sequence star containing 99.86% of the Solar System\'s mass. Encompasses Mercury, Venus, Earth, Mars, and the inner boundary of the Asteroid Belt. Sunlight takes 8.3 minutes to reach Earth across 149.6 million km (1 AU).',
    milestones: [
      { name: 'Sun Diameter', value: '1,392,700 km (109 Earths)' },
      { name: 'Earth Orbit (1 AU)', value: '149,597,870 km' },
      { name: 'Mars Orbit (1.52 AU)', value: '227,940,000 km' },
      { name: 'Asteroid Belt Peak', value: '2.7 AU (~400M km)' }
    ],
    deepFact: 'The volume of the Sun is so colossal that approximately 1.3 million Earths could fit inside it. It burns 600 million tons of hydrogen into helium every single second via core nuclear fusion.'
  },
  {
    exponent: 13,
    id: 'outer_solar_system',
    name: 'Solar System & Kuiper Belt',
    subtitle: 'Gas Giants, Ring Systems & Icy Debris',
    meters: '10¹³ m',
    sizeFormatted: '15 Billion km (100 AU)',
    lightTime: '13.9 hours',
    scaleRatio: '1 : 10 Trillion',
    dominantForce: 'Heliocentric Gravity & Solar Wind',
    description: 'The vast outer realm of gas and ice giants—Jupiter, Saturn with its spectacular ring system, Uranus, and Neptune. Beyond Neptune lies the Kuiper Belt (30–50 AU), home to Pluto, Eris, Haumea, and Makemake, terminating at the Heliopause where solar wind meets interstellar space.',
    milestones: [
      { name: 'Jupiter (Largest Planet)', value: '142,984 km (318 Earth masses)' },
      { name: 'Saturn Rings Span', value: '282,000 km across' },
      { name: 'Neptune Orbit (30 AU)', value: '4.5 Billion km' },
      { name: 'Heliopause Boundary', value: '~120 AU (18 Billion km)' }
    ],
    deepFact: 'Voyager 1, launched in 1977, officially crossed the heliopause in August 2012 at 121 AU, becoming humanity\'s first artifact to enter the pristine vacuum of interstellar space.'
  },
  {
    exponent: 16,
    id: 'interstellar',
    name: 'Oort Cloud & Star Neighborhood',
    subtitle: 'Interstellar Expanse • The Nearest Stars',
    meters: '10¹⁶ m',
    sizeFormatted: '1.05 Light-Years (66,000 AU)',
    lightTime: '1.05 Years',
    scaleRatio: '1 : 10 Quadrillion',
    dominantForce: 'Stellar Gravitational Interactions',
    description: 'The icy outer halo of our Solar System: the Oort Cloud—a spherical shell of trillions of comet nuclei extending up to 100,000 AU (1.58 light-years). Here, the Sun\'s gravitational grasp yields to the collective gravity of the Milky Way, opening into our immediate stellar neighbors.',
    milestones: [
      { name: 'Oort Cloud Extent', value: '2,000 to 100,000 AU' },
      { name: 'Proxima Centauri', value: '4.246 Light-Years' },
      { name: 'Alpha Centauri A & B', value: '4.37 Light-Years' },
      { name: 'Sirius (Brightest Star)', value: '8.60 Light-Years' },
      { name: 'Voyager 1 Distance', value: '~163 AU (0.0026 ly)' }
    ],
    deepFact: 'Space at this scale is profoundly empty. If the Sun were a grain of sand in New York City, Proxima Centauri would be another grain of sand located in Washington, D.C., with virtually nothing but vacuum in between.'
  },
  {
    exponent: 21,
    id: 'milky_way',
    name: 'The Milky Way Galaxy',
    subtitle: 'Barred Spiral Galaxy • 200+ Billion Stars',
    meters: '10²¹ m',
    sizeFormatted: '105,700 Light-Years Across',
    lightTime: '105,700 Years',
    scaleRatio: '1 : 10²¹',
    dominantForce: 'Galactic Gravity & Dark Matter Halo',
    description: 'Our galactic home: a barred spiral galaxy (type SBbc) containing 200 to 400 billion stars and at least 100 billion planets. Four primary spiral arms (Perseus, Scutum-Centaurus, Sagittarius, Norma) and local spurs (Orion-Cygnus Arm, where our Solar System resides 26,670 light-years from the center). At the core lies Sagittarius A*, a supermassive black hole with 4.15 million solar masses.',
    milestones: [
      { name: 'Milky Way Diameter', value: '105,700 Light-Years' },
      { name: 'Stellar Population', value: '200 to 400 Billion Stars' },
      { name: 'Sun\'s Distance to Center', value: '26,670 Light-Years' },
      { name: 'Galactic Year (Orbit)', value: '230 Million Years' },
      { name: 'Sagittarius A* Mass', value: '4.15 Million Solar Masses' }
    ],
    deepFact: 'Our Solar System has orbited the galactic center only ~20 times since the birth of the Sun 4.6 billion years ago. The last time Earth was at its current galactic position, dinosaurs were just beginning to walk the planet!'
  },
  {
    exponent: 23,
    id: 'local_group',
    name: 'The Local Galactic Group',
    subtitle: 'Milky Way, Andromeda & 80+ Galaxies',
    meters: '10²³ m',
    sizeFormatted: '10 Million Light-Years Across',
    lightTime: '10 Million Years',
    scaleRatio: '1 : 10²³',
    dominantForce: 'Intergalactic Gravitational Binding',
    description: 'A gravitationally bound cluster spanning ~10 million light-years, dominated by two giant spiral galaxies: the Milky Way and the Andromeda Galaxy (M31, containing ~1 trillion stars). The third-largest is the Triangulum Galaxy (M33), accompanied by over 80 satellite dwarf galaxies including the Magellanic Clouds.',
    milestones: [
      { name: 'Local Group Diameter', value: '9.8 Million Light-Years' },
      { name: 'Distance to Andromeda', value: '2.537 Million Light-Years' },
      { name: 'Approach Speed (M31)', value: '110 km/s (Collision in 4.5B yr)' },
      { name: 'Total Galaxies', value: '80+ Dwarf & Spiral Galaxies' }
    ],
    deepFact: 'Andromeda and the Milky Way are hurtling toward each other at 400,000 km/h. In ~4.5 billion years, they will undergo a spectacular collision and merge into a colossal single elliptical galaxy dubbed "Milkdromeda". Because interstellar space is so vast, virtually zero individual stars will physically collide!'
  },
  {
    exponent: 26,
    id: 'cosmic_web',
    name: 'The Observable Universe',
    subtitle: 'The Cosmic Web & CMB Horizon Boundary',
    meters: '10²⁶ m',
    sizeFormatted: '93 Billion Light-Years (Co-moving Diameter)',
    lightTime: '13.8 Billion Years (Age)',
    scaleRatio: '1 : 10²⁶',
    dominantForce: 'Dark Energy (Hubble Expansion) & Dark Matter Web',
    description: 'The totality of space, time, matter, and radiation accessible to astronomical observation. Matter is organized into a breathtaking sponge-like "Cosmic Web"—filaments of trillions of galaxy superclusters (such as Laniakea, Pisces-Cetus, and the Sloan Great Wall) separated by immense, cavernous cosmic voids (like the Boötes Void, 330 million light-years wide). Enclosed by the spherical Cosmic Microwave Background (CMB) radiation horizon—the earliest light emitted 380,000 years after the Big Bang.',
    milestones: [
      { name: 'Observable Diameter', value: '93 Billion Light-Years' },
      { name: 'Total Galaxies', value: '2 Trillion (Estimated)' },
      { name: 'Age of Universe', value: '13.787 ± 0.020 Billion Years' },
      { name: 'Largest Void (Boötes)', value: '330 Million Light-Years Wide' },
      { name: 'Home Supercluster', value: 'Laniakea (100,000 Galaxies)' }
    ],
    deepFact: 'Because space itself expands faster than light at cosmological distances, the observable universe is 93 billion light-years across even though the universe is only 13.8 billion years old. Over 94% of the galaxies we can currently see are already beyond our cosmic event horizon—even a beam of light launched today will never reach them.'
  }
];

export const NEARBY_STARS = [
  { name: 'Proxima Centauri', distanceLy: 4.24, spectralType: 'M5.5Ve (Red Dwarf)', planets: '3 Confirmed (b, c, d)', x: 1.2, y: -0.4, z: 4.0, color: '#ff6644' },
  { name: 'Alpha Centauri A & B', distanceLy: 4.37, spectralType: 'G2V / K1V (Binary Sun-like)', planets: 'Candidate', x: 1.3, y: -0.3, z: 4.1, color: '#ffe499' },
  { name: 'Barnard\'s Star', distanceLy: 5.96, spectralType: 'M4.0V (High Proper Motion)', planets: '1 Confirmed', x: -3.8, y: 1.5, z: 4.2, color: '#ff7755' },
  { name: 'Wolf 359', distanceLy: 7.86, spectralType: 'M6.0V (Flare Star)', planets: '2 Confirmed', x: 2.1, y: 6.2, z: -4.3, color: '#ff5533' },
  { name: 'Lalande 21185', distanceLy: 8.31, spectralType: 'M2.0V', planets: '2 Confirmed', x: 0.8, y: 7.8, z: 2.7, color: '#ff8866' },
  { name: 'Sirius A & B (Dog Star)', distanceLy: 8.60, spectralType: 'A1V + DA2 (Brightest in Sky)', planets: 'None known', x: -5.4, y: -4.8, z: -4.6, color: '#d8eeff' },
  { name: 'Luyten 726-8 (UV Ceti)', distanceLy: 8.73, spectralType: 'M5.5V + M6.0V', planets: 'None', x: -1.2, y: -8.1, z: 3.0, color: '#ff5544' },
  { name: 'Ross 154', distanceLy: 9.69, spectralType: 'M3.5V', planets: 'Candidate', x: 7.2, y: -4.1, z: 5.0, color: '#ff7766' },
  { name: 'Epsilon Eridani', distanceLy: 10.50, spectralType: 'K2V (Young Sun-like)', planets: '1 Confirmed + Asteroid Belts', x: 4.2, y: -7.5, z: -6.0, color: '#ffcc77' },
  { name: 'Procyon A & B', distanceLy: 11.46, spectralType: 'F5IV-V + DQZ', planets: 'None', x: -7.8, y: 4.2, z: -7.1, color: '#fff5dd' }
];

export const LOCAL_GROUP_GALAXIES = [
  { name: 'Milky Way Galaxy', type: 'Barred Spiral (SBbc)', diameterLy: 105700, stars: '250 Billion', distFromMilkyWayLy: 0, x: -15, y: 2, z: -5, color: '#a0c8ff' },
  { name: 'Andromeda Galaxy (M31)', type: 'Barred Spiral (SA(s)b)', diameterLy: 152000, stars: '1 Trillion', distFromMilkyWayLy: 2537000, x: 22, y: 12, z: 18, color: '#ffd59e' },
  { name: 'Triangulum Galaxy (M33)', type: 'Spiral (SA(s)cd)', diameterLy: 60000, stars: '40 Billion', distFromMilkyWayLy: 2730000, x: 28, y: -16, z: 12, color: '#9de8ff' },
  { name: 'Large Magellanic Cloud (LMC)', type: 'Magellanic Spiral (SB(s)m)', diameterLy: 32200, stars: '20 Billion', distFromMilkyWayLy: 163000, x: -13, y: -4, z: -2, color: '#ffb3d9' },
  { name: 'Small Magellanic Cloud (SMC)', type: 'Dwarf Irregular (IB(s)m)', diameterLy: 18900, stars: '3 Billion', distFromMilkyWayLy: 204000, x: -16, y: -6, z: -3, color: '#cce0ff' },
  { name: 'M32 (Le Gentil)', type: 'Compact Elliptical (cE2)', diameterLy: 6500, stars: '3 Billion', distFromMilkyWayLy: 2490000, x: 23, y: 13, z: 17, color: '#ffe6bf' },
  { name: 'M110 (NGC 205)', type: 'Dwarf Elliptical (dE5)', diameterLy: 17000, stars: '10 Billion', distFromMilkyWayLy: 2690000, x: 20, y: 14, z: 19, color: '#fff0db' },
  { name: 'NGC 3109', type: 'Magellanic Spiral (SB(s)m)', diameterLy: 25000, stars: '5 Billion', distFromMilkyWayLy: 4300000, x: -35, y: -25, z: 15, color: '#d0e0ff' }
];

export const COSMIC_WEB_LANDMARKS = [
  { name: 'Laniakea Supercluster', type: 'Home Supercluster', spanMly: 520, galaxies: '100,000+', desc: 'Our cosmic watershed basin spanning 520 million light-years, pulling the Milky Way toward the Great Attractor.', x: 0, y: 0, z: 0, color: '#00ffff' },
  { name: 'Virgo Supercluster', type: 'Central Cluster', spanMly: 110, galaxies: '2,000+', desc: 'The heart of our local filament, containing giant elliptical galaxy M87.', x: 8, y: 14, z: -6, color: '#88eeff' },
  { name: 'Boötes Void', type: 'Supervoid', spanMly: 330, galaxies: 'Only ~60 in total volume', desc: 'The "Great Nothing"—a spherical void of 330 million light-years that should contain 10,000 galaxies but has almost none.', x: -35, y: 45, z: 20, color: '#220044' },
  { name: 'Shapley Concentration', type: 'Gravitational Monster', spanMly: 650, galaxies: '8,000+ massive clusters', desc: 'The most massive concentration of galaxies in the local universe, exercising immense gravitational pull.', x: 42, y: -30, z: -25, color: '#ffaa44' },
  { name: 'Sloan Great Wall', type: 'Galactic Filament', spanMly: 1370, galaxies: 'Millions', desc: 'One of the largest known structures in the universe—a cosmic wall of galaxies stretching 1.37 billion light-years.', x: -55, y: -40, z: 60, color: '#ff55aa' }
];

export const COSMIC_AI_QUESTIONS = [
  {
    q: 'Where are we inside the Milky Way Galaxy?',
    answer: 'We live on the inner edge of the Orion-Cygnus Arm (the "Orion Spur"), roughly 26,670 light-years from the supermassive black hole Sagittarius A* at the galactic core. Our Sun orbits the galactic center at 828,000 km/h, taking ~230 million years to complete a single galactic circuit.',
    targetExponent: 21
  },
  {
    q: 'How big is the Boötes Void, the "Great Nothing"?',
    answer: 'The Boötes Void is a staggering spherical chasm ~330 million light-years in diameter (approx. 0.27% of the observable universe). By normal cosmic density, it should house 10,000 galaxies; astronomers have detected only ~60. If the Milky Way were placed in the center of the Boötes Void, we wouldn\'t have known other galaxies existed until the 1960s with radio telescopes.',
    targetExponent: 26
  },
  {
    q: 'When will the Milky Way and Andromeda collide?',
    answer: 'Andromeda (M31) is charging toward us at 110 km per second (400,000 km/h). In approximately 4.5 billion years, our two galaxies will pass through each other and coalesce into an enormous giant elliptical galaxy dubbed "Milkdromeda". Because stars are separated by light-years of empty space, virtually no individual stars will collide.',
    targetExponent: 23
  },
  {
    q: 'What is the Cosmic Microwave Background (CMB)?',
    answer: 'The CMB is the thermal afterglow of the Big Bang, emitted 380,000 years after the dawn of time when the universe cooled to 3,000 Kelvin, allowing protons and electrons to form neutral hydrogen ("Recombination") so photons could travel freely. Stretched by 13.8 billion years of cosmic expansion into microwaves (2.725 K), it forms the outer spherical horizon of our observable universe.',
    targetExponent: 26
  },
  {
    q: 'Where is humanity\'s farthest traveler, Voyager 1?',
    answer: 'Voyager 1 is over 163 Astronomical Units (24.4 billion kilometers or ~22.6 light-hours) from Earth, travelling at 61,000 km/h in interstellar space. Even at its incredible speed, it will take ~300 years to reach the inner edge of the Oort Cloud, and roughly 30,000 years to pass entirely through it!',
    targetExponent: 16
  },
  {
    q: 'Why can we see 93 billion light-years if the universe is 13.8B years old?',
    answer: 'Because of cosmological metric expansion! Space itself has been expanding continuously since the Big Bang. While the light from the most distant observable objects has traveled for 13.8 billion years to reach our telescopes, the expansion of the spatial fabric during that journey has propelled those objects to a current "co-moving distance" of ~46.5 billion light-years in every direction—giving an observable diameter of 93 billion light-years.',
    targetExponent: 26
  }
];
