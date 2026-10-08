// src/data/games.js
// Geography Battle Royale Questions & Guess Where I Am Mystery Locations

export const BATTLE_QUESTIONS = [
  {
    id: 'bq-1',
    text: 'Click on JAPAN 🇯🇵',
    targetCode: 'JP',
    lat: 36.2,
    lng: 138.2,
    hint: 'Island nation in East Asia famous for Mount Fuji and Tokyo',
    difficulty: 'EASY'
  },
  {
    id: 'bq-2',
    text: 'Find the country with the LONGEST Coastline (202,080 km)! 🌊',
    targetCode: 'CA',
    lat: 56.1,
    lng: -106.3,
    hint: 'North American giant with maple syrup and 2 million lakes',
    difficulty: 'MEDIUM'
  },
  {
    id: 'bq-3',
    text: 'Where is BRAZIL 🇧🇷 located?',
    targetCode: 'BR',
    lat: -14.2,
    lng: -51.9,
    hint: 'Largest country in South America with the Amazon rainforest',
    difficulty: 'EASY'
  },
  {
    id: 'bq-4',
    text: 'Click the country directly SOUTH of Russia with vast steppes! 🐎',
    targetCode: 'KZ',
    lat: 48.0,
    lng: 66.9,
    hint: 'Kazakhstan — the 9th largest nation in the world by land area',
    difficulty: 'HARD'
  },
  {
    id: 'bq-5',
    text: 'Find the country home to MADAGASCAR 🇲🇬!',
    targetCode: 'MG',
    lat: -18.7,
    lng: 46.8,
    hint: 'Huge island nation off the southeast coast of Africa with unique lemurs',
    difficulty: 'EASY'
  },
  {
    id: 'bq-6',
    text: 'Click on EGYPT 🇪🇬 — Home of the Pyramids of Giza!',
    targetCode: 'EG',
    lat: 26.8,
    lng: 30.8,
    hint: 'Northeast Africa along the lower Nile River',
    difficulty: 'EASY'
  },
  {
    id: 'bq-7',
    text: 'Find AUSTRALIA 🇦🇺 — Wider than the Earth\'s Moon!',
    targetCode: 'AU',
    lat: -25.2,
    lng: 133.7,
    hint: 'The world\'s only continent-spanning country',
    difficulty: 'EASY'
  },
  {
    id: 'bq-8',
    text: 'Find the only CARBON-NEGATIVE country on Earth! 🌲',
    targetCode: 'BT',
    lat: 27.5,
    lng: 90.4,
    hint: 'Bhutan — Himalayan kingdom nestled between India and China',
    difficulty: 'INSANE'
  },
  {
    id: 'bq-9',
    text: 'Where is ICELAND 🇮🇸 — Land of fire and ice?',
    targetCode: 'IS',
    lat: 64.9,
    lng: -19.0,
    hint: 'North Atlantic volcanic island right below the Arctic Circle',
    difficulty: 'MEDIUM'
  },
  {
    id: 'bq-10',
    text: 'Find SOUTH AFRICA 🇿🇦 with its three national capital cities!',
    targetCode: 'ZA',
    lat: -30.5,
    lng: 22.9,
    hint: 'Southernmost tip of the African continent',
    difficulty: 'EASY'
  },
  {
    id: 'bq-11',
    text: 'Click on NORWAY 🇳🇴 — Famous for deep western fjords!',
    targetCode: 'NO',
    lat: 60.4,
    lng: 8.4,
    hint: 'Western half of the Scandinavian peninsula',
    difficulty: 'MEDIUM'
  },
  {
    id: 'bq-12',
    text: 'Find the country with the MOST ISLANDS in the world (>267,000)! 🏝️',
    targetCode: 'SE',
    lat: 60.1,
    lng: 18.6,
    hint: 'Sweden — between Norway and the Baltic Sea',
    difficulty: 'HARD'
  }
];

export const MYSTERY_LOCATIONS = [
  {
    id: 'myst-1',
    name: 'Lisbon',
    country: 'Portugal',
    countryCode: 'PT',
    lat: 38.7223,
    lng: -9.1393,
    clues: [
      { round: 1, label: '🌡️ Climate', text: 'Sunny Mediterranean coast with average annual temperatures of 21°C' },
      { round: 2, label: '🗣️ Language', text: 'The native spoken tongue is Portuguese' },
      { round: 3, label: '🌊 Ocean Proximity', text: 'Perched right along the Atlantic Ocean at the mouth of the Tagus River' },
      { round: 4, label: '👥 Population', text: 'Metro area of roughly 2.9 million people' },
      { round: 5, label: '🍽️ Food Speciality', text: 'World-famous for Pastéis de Nata (warm custard tarts) & grilled sardines' },
      { round: 6, label: '🏛️ Landmark', text: 'Yellow vintage Tram 28 rattling up cobbled hills to São Jorge Castle' }
    ]
  },
  {
    id: 'myst-2',
    name: 'Kyoto',
    country: 'Japan',
    countryCode: 'JP',
    lat: 35.0116,
    lng: 135.7681,
    clues: [
      { round: 1, label: '🌡️ Climate', text: 'Four distinct seasons with humid summer heat and snowy winter shrines' },
      { round: 2, label: '🗣️ Language', text: 'Japanese is the sole primary language' },
      { round: 3, label: '🌊 Ocean Proximity', text: 'Located inland in a valley basin, roughly 50 km from the inland sea' },
      { round: 4, label: '👥 Population', text: 'Approximately 1.45 million residents' },
      { round: 5, label: '🍽️ Food Speciality', text: 'Multi-course Kaiseki dining, matcha green tea, and silky yuba tofu' },
      { round: 6, label: '🏛️ Landmark', text: 'Fushimi Inari with 10,000 bright vermilion Torii gates winding up the mountain' }
    ]
  },
  {
    id: 'myst-3',
    name: 'Cape Town',
    country: 'South Africa',
    countryCode: 'ZA',
    lat: -33.9249,
    lng: 18.4241,
    clues: [
      { round: 1, label: '🌡️ Climate', text: 'Warm Mediterranean dry summers cooled by ocean breezes from two currents' },
      { round: 2, label: '🗣️ Language', text: 'English, Afrikaans, and isiXhosa are commonly heard in the streets' },
      { round: 3, label: '🌊 Ocean Proximity', text: 'Bordered directly by the cold South Atlantic on a mountainous peninsula' },
      { round: 4, label: '👥 Population', text: 'Metropolitan area with 4.8 million citizens' },
      { round: 5, label: '🍽️ Food Speciality', text: 'Cape Malay Bobotie, fresh snoek fish braai, and local rooibos tea' },
      { round: 6, label: '🏛️ Landmark', text: 'Flat-topped Table Mountain towering directly over the downtown harbor' }
    ]
  },
  {
    id: 'myst-4',
    name: 'Reykjavik',
    country: 'Iceland',
    countryCode: 'IS',
    lat: 64.1466,
    lng: -21.9426,
    clues: [
      { round: 1, label: '🌡️ Climate', text: 'Subpolar oceanic with cool summers (12°C) and surprisingly mild winters' },
      { round: 2, label: '🗣️ Language', text: 'Icelandic — unchanged enough that locals read 1,000-year-old Viking sagas' },
      { round: 3, label: '🌊 Ocean Proximity', text: 'Right on Faxaflói Bay looking across at volcanic snowcaps' },
      { round: 4, label: '👥 Population', text: 'Small capital community of roughly 135,000 souls' },
      { round: 5, label: '🍽️ Food Speciality', text: 'Hearty lamb stew (Kjötsúpa), rye bread baked in volcanic ground, skyr' },
      { round: 6, label: '🏛️ Landmark', text: 'Hallgrímskirkja church spire shaped like giant basalt lava columns' }
    ]
  },
  {
    id: 'myst-5',
    name: 'Cartagena',
    country: 'Colombia',
    countryCode: 'CO',
    lat: 10.3910,
    lng: -75.4794,
    clues: [
      { round: 1, label: '🌡️ Climate', text: 'Tropical Caribbean heat averaging 31°C year-round with coastal trade winds' },
      { round: 2, label: '🗣️ Language', text: 'Spanish spoken with lively Caribbean cadence' },
      { round: 3, label: '🌊 Ocean Proximity', text: 'Situated right on the Caribbean Sea with coral archipelagos offshore' },
      { round: 4, label: '👥 Population', text: 'Historic coastal metropolis of 1.05 million people' },
      { round: 5, label: '🍽️ Food Speciality', text: 'Arepas de huevo, coconut rice, fresh ceviche, and fried plantain patacones' },
      { round: 6, label: '🏛️ Landmark', text: 'The massive Spanish colonial stone ramparts and vibrant floral balconies' }
    ]
  }
];
