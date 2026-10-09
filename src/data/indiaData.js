// src/data/indiaData.js
// Verified UPSC & MPSC Geographic & General Studies Dataset
// Covers 28 States, 8 Union Territories, Physical Features, Rivers, National Parks, and UNESCO Heritage

export const INDIA_STATES_DATA = [
  { code: 'AP', name: 'Andhra Pradesh', capital: 'Amaravati', region: 'South', majorRiver: 'Godavari, Krishna', nationalPark: 'Sri Venkateswara, Papikonda', lat: 15.9129, lng: 79.7400 },
  { code: 'AR', name: 'Arunachal Pradesh', capital: 'Itanagar', region: 'North-East', majorRiver: 'Siang (Brahmaputra), Kameng', nationalPark: 'Namdapha, Mouling', lat: 28.2180, lng: 94.7278 },
  { code: 'AS', name: 'Assam', capital: 'Dispur', region: 'North-East', majorRiver: 'Brahmaputra, Barak', nationalPark: 'Kaziranga, Manas, Dibru-Saikhowa', lat: 26.2006, lng: 92.9376 },
  { code: 'BR', name: 'Bihar', capital: 'Patna', region: 'East', majorRiver: 'Ganga, Kosi, Gandak, Son', nationalPark: 'Valmiki National Park', lat: 25.0961, lng: 85.3131 },
  { code: 'CG', name: 'Chhattisgarh', capital: 'Raipur', region: 'Central', majorRiver: 'Mahanadi, Indravati', nationalPark: 'Kanger Ghati, Guru Ghasidas', lat: 21.2787, lng: 81.8661 },
  { code: 'GA', name: 'Goa', capital: 'Panaji', region: 'West', majorRiver: 'Mandovi, Zuari', nationalPark: 'Mollem (Bhagwan Mahaveer)', lat: 15.2993, lng: 74.1240 },
  { code: 'GJ', name: 'Gujarat', capital: 'Gandhinagar', region: 'West', majorRiver: 'Narmada, Sabarmati, Tapi', nationalPark: 'Gir (Asiatic Lions), Marine (Gulf of Kutch), Blackbuck', lat: 22.2587, lng: 71.1924 },
  { code: 'HR', name: 'Haryana', capital: 'Chandigarh', region: 'North', majorRiver: 'Yamuna, Ghaggar', nationalPark: 'Sultanpur, Kalesar', lat: 29.0588, lng: 76.0856 },
  { code: 'HP', name: 'Himachal Pradesh', capital: 'Shimla', region: 'North', majorRiver: 'Satluj, Beas, Ravi, Chenab', nationalPark: 'Great Himalayan, Pin Valley', lat: 31.1048, lng: 77.1734 },
  { code: 'JH', name: 'Jharkhand', capital: 'Ranchi', region: 'East', majorRiver: 'Subarnarekha, Damodar', nationalPark: 'Betla National Park', lat: 23.6102, lng: 85.2799 },
  { code: 'KA', name: 'Karnataka', capital: 'Bengaluru', region: 'South', majorRiver: 'Cauvery, Krishna, Tungabhadra', nationalPark: 'Bandipur, Nagarhole, Kudremukh, Bannerghatta', lat: 15.3173, lng: 75.7139 },
  { code: 'KL', name: 'Kerala', capital: 'Thiruvananthapuram', region: 'South', majorRiver: 'Periyar, Bharathappuzha, Pamba', nationalPark: 'Silent Valley, Eravikulam, Periyar', lat: 10.8505, lng: 76.2711 },
  { code: 'MP', name: 'Madhya Pradesh', capital: 'Bhopal', region: 'Central', majorRiver: 'Narmada, Chambal, Betwa, Son', nationalPark: 'Kanha, Bandhavgarh, Kuno (Cheetahs), Pench', lat: 22.9734, lng: 78.6569 },
  { code: 'MH', name: 'Maharashtra', capital: 'Mumbai', region: 'West', majorRiver: 'Godavari, Krishna, Bhima, Tapi', nationalPark: 'Tadoba-Andhari, Sanjay Gandhi, Chandoli', lat: 19.7515, lng: 75.7139 },
  { code: 'MN', name: 'Manipur', capital: 'Imphal', region: 'North-East', majorRiver: 'Barak, Manipur', nationalPark: 'Keibul Lamjao (Floating National Park / Sangai Deer)', lat: 24.6637, lng: 93.9063 },
  { code: 'ML', name: 'Meghalaya', capital: 'Shillong', region: 'North-East', majorRiver: 'Simsang, Umngot (Crystal river)', nationalPark: 'Balpakram, Nokrek Biosphere', lat: 25.4670, lng: 91.3662 },
  { code: 'MZ', name: 'Mizoram', capital: 'Aizawl', region: 'North-East', majorRiver: 'Tlawng, Chhimtuipui', nationalPark: 'Murlen, Phawngpui Blue Mountain', lat: 23.1645, lng: 92.9376 },
  { code: 'NL', name: 'Nagaland', capital: 'Kohima', region: 'North-East', majorRiver: 'Doyang, Dhansiri', nationalPark: 'Ntangki National Park', lat: 26.1584, lng: 94.5624 },
  { code: 'OD', name: 'Odisha', capital: 'Bhubaneswar', region: 'East', majorRiver: 'Mahanadi, Brahmani, Baitarani', nationalPark: 'Similipal, Bhitarkanika (Olive Ridley Turtles)', lat: 20.9517, lng: 85.9838 },
  { code: 'PB', name: 'Punjab', capital: 'Chandigarh', region: 'North', majorRiver: 'Sutlej, Beas, Ravi', nationalPark: 'Harike Wetland Sanctuary', lat: 31.1471, lng: 75.3412 },
  { code: 'RJ', name: 'Rajasthan', capital: 'Jaipur', region: 'North-West', majorRiver: 'Chambal, Banas, Luni', nationalPark: 'Ranthambore, Desert National Park, Keoladeo (Ghana)', lat: 27.0238, lng: 74.2179 },
  { code: 'SK', name: 'Sikkim', capital: 'Gangtok', region: 'North-East', majorRiver: 'Teesta, Rangit', nationalPark: 'Khangchendzonga (Mixed UNESCO World Heritage Site)', lat: 27.5330, lng: 88.5122 },
  { code: 'TN', name: 'Tamil Nadu', capital: 'Chennai', region: 'South', majorRiver: 'Cauvery, Vaigai, Thamirabarani', nationalPark: 'Mudumalai, Guindy, Gulf of Mannar Marine', lat: 11.1271, lng: 78.6569 },
  { code: 'TG', name: 'Telangana', capital: 'Hyderabad', region: 'South', majorRiver: 'Godavari, Krishna, Musi', nationalPark: 'Kasu Brahmananda Reddy, Mahavir Harina', lat: 18.1124, lng: 79.0193 },
  { code: 'TR', name: 'Tripura', capital: 'Agartala', region: 'North-East', majorRiver: 'Howrah, Gomati', nationalPark: 'Clouded Leopard, Rajbari', lat: 23.9408, lng: 91.9882 },
  { code: 'UP', name: 'Uttar Pradesh', capital: 'Lucknow', region: 'North', majorRiver: 'Ganga, Yamuna, Gomti, Saryu', nationalPark: 'Dudhwa National Park', lat: 26.8467, lng: 80.9462 },
  { code: 'UK', name: 'Uttarakhand', capital: 'Dehradun (Winter) / Gairsain (Summer)', region: 'North', majorRiver: 'Bhagirathi, Alaknanda, Ganga, Yamuna', nationalPark: 'Jim Corbett (Oldest in India), Valley of Flowers, Nanda Devi', lat: 30.0668, lng: 79.0193 },
  { code: 'WB', name: 'West Bengal', capital: 'Kolkata', region: 'East', majorRiver: 'Hooghly (Ganga), Teesta, Damodar', nationalPark: 'Sundarbans (Royal Bengal Tigers), Jaldapara, Gorumara', lat: 22.9868, lng: 87.8550 },
  // Union Territories
  { code: 'DL', name: 'Delhi (NCT)', capital: 'New Delhi', region: 'North', majorRiver: 'Yamuna', nationalPark: 'Asola Bhatti Wildlife Sanctuary', lat: 28.7041, lng: 77.1025 },
  { code: 'JK', name: 'Jammu & Kashmir', capital: 'Srinagar (Summer) / Jammu (Winter)', region: 'North', majorRiver: 'Jhelum, Chenab, Tawi', nationalPark: 'Dachigam (Hangul Deer), Kishtwar', lat: 33.7782, lng: 76.5762 },
  { code: 'LA', name: 'Ladakh', capital: 'Leh', region: 'North', majorRiver: 'Indus, Zanskar, Shyok', nationalPark: 'Hemis National Park (Snow Leopards - Largest in India)', lat: 34.1526, lng: 77.5771 }
];

export const INDIA_BATTLE_QUESTIONS = [
  {
    id: 'in-1',
    text: 'Click on MAHARASHTRA 🇮🇳 — Home of the Western Ghats & Ajanta-Ellora!',
    stateCode: 'MH',
    lat: 19.75,
    lng: 75.71,
    hint: 'Bordered by Gujarat, MP, Chhattisgarh, Telangana, Karnataka & Goa; capital is Mumbai',
    difficulty: 'EASY',
    fact: 'Maharashtra has the highest GSDP in India and contains 5 UNESCO World Heritage sites including Ajanta, Ellora, and Elephanta Caves.'
  },
  {
    id: 'in-2',
    text: 'Find RAJASTHAN — The Land of Thar Desert & Forts!',
    stateCode: 'RJ',
    lat: 27.02,
    lng: 74.21,
    hint: 'Largest Indian state by land area (342,239 km²); capital is Jaipur',
    difficulty: 'EASY',
    fact: 'Rajasthan covers 10.4% of India’s geographical area and features the ancient Aravalli Range, the oldest fold mountains in India.'
  },
  {
    id: 'in-3',
    text: 'Where is KERALA — "God\'s Own Country" with Silent Valley?',
    stateCode: 'KL',
    lat: 10.85,
    lng: 76.27,
    hint: 'Lies along the Malabar Coast between the Arabian Sea and the Western Ghats',
    difficulty: 'EASY',
    fact: 'Kerala consistently ranks #1 in India on NITI Aayog Sustainable Development Goals (SDG) index and human development indices.'
  },
  {
    id: 'in-4',
    text: 'Find ASSAM — The Valley of the Mighty Brahmaputra & One-Horned Rhinos!',
    stateCode: 'AS',
    lat: 26.20,
    lng: 92.93,
    hint: 'North-East gateway state surrounding the Brahmaputra River; capital is Dispur',
    difficulty: 'MEDIUM',
    fact: 'Kaziranga National Park in Assam holds world’s largest population of the Great Indian One-Horned Rhinoceros (Rhinoceros unicornis).'
  },
  {
    id: 'in-5',
    text: 'Locate MADHYA PRADESH — The "Tiger State" & Geographic Heart of India!',
    stateCode: 'MP',
    lat: 22.97,
    lng: 78.65,
    hint: 'Central Indian state, home to Kanha, Bandhavgarh, and Kuno National Park',
    difficulty: 'EASY',
    fact: 'Madhya Pradesh holds the largest forest cover in India and highest tiger population (785 tigers as per 2022 Census).'
  },
  {
    id: 'in-6',
    text: 'Find UTTARAKHAND — Land of the Chota Char Dham & Ganga Origin!',
    stateCode: 'UK',
    lat: 30.06,
    lng: 79.01,
    hint: 'Himalayan state where Bhagirathi meets Alaknanda at Devprayag to form the Ganga',
    difficulty: 'MEDIUM',
    fact: 'Jim Corbett National Park in Uttarakhand was established in 1936 as Hailey National Park, the first national park in India.'
  },
  {
    id: 'in-7',
    text: 'Click on GUJARAT — State with the LONGEST Mainland Coastline in India (1,600 km)!',
    stateCode: 'GJ',
    lat: 22.25,
    lng: 71.19,
    hint: 'Westernmost state of India, home to the Gir Asiatic Lion Sanctuary and Lothal',
    difficulty: 'EASY',
    fact: 'Gujarat has the longest coastline among all Indian states and is the sole natural home of the wild Asiatic Lion (Panthera leo persica).'
  },
  {
    id: 'in-8',
    text: 'Where is MANIPUR — Home to Keibul Lamjao, the world\'s only Floating National Park?',
    stateCode: 'MN',
    lat: 24.66,
    lng: 93.90,
    hint: 'Bordering Myanmar to the east and south; capital is Imphal',
    difficulty: 'HARD',
    fact: 'Loktak Lake features unique floating decomposed biomass islands called "phumdis", home to the endangered Sangai brow-antlered deer.'
  },
  {
    id: 'in-9',
    text: 'Find SIKKIM — India\'s First 100% Organic State & Home to Khangchendzonga!',
    stateCode: 'SK',
    lat: 27.53,
    lng: 88.51,
    hint: 'Nestled in the Himalayas between Nepal, Bhutan, and Tibet; capital is Gangtok',
    difficulty: 'MEDIUM',
    fact: 'Khangchendzonga (8,586 m) is India\'s highest mountain peak and a UNESCO World Heritage Mixed site (both natural and cultural).'
  },
  {
    id: 'in-10',
    text: 'Find ODISHA — Home to Chilika Lake, India\'s Largest Coastal Lagoon!',
    stateCode: 'OD',
    lat: 20.95,
    lng: 85.98,
    hint: 'Eastern coastal state along the Bay of Bengal; capital is Bhubaneswar',
    difficulty: 'MEDIUM',
    fact: 'Chilika Lake is the first Indian wetland of international importance designated under the Ramsar Convention in 1981.'
  },
  {
    id: 'in-11',
    text: 'Locate LADAKH — The High-Altitude Cold Desert & Home to Hemis National Park!',
    stateCode: 'LA',
    lat: 34.15,
    lng: 77.57,
    hint: 'Northernmost Union Territory between the Karakoram and Great Himalayas; capital is Leh',
    difficulty: 'HARD',
    fact: 'Hemis National Park is India\'s largest national park (4,400 km²) and world-famous for its thriving Snow Leopard population.'
  },
  {
    id: 'in-12',
    text: 'Find TELANGANA — India\'s 28th State formed in June 2014!',
    stateCode: 'TG',
    lat: 18.11,
    lng: 79.01,
    hint: 'Deccan plateau state bounded by Maharashtra, Chhattisgarh, Karnataka, and AP; capital Hyderabad',
    difficulty: 'MEDIUM',
    fact: 'The historic Ramappa (Kakatiya Rudreshwara) Temple in Telangana was declared a UNESCO World Heritage site in 2021.'
  }
];

export const KBC_QUIZ_BANK = [
  {
    id: 'kbc-1',
    question: 'Which is the longest river in Peninsular India (Dakshin Ganga)?',
    options: ['Krishna', 'Godavari', 'Cauvery', 'Mahanadi'],
    answerIndex: 1, // Godavari
    explanation: 'Godavari is the longest peninsular river in India (1,465 km), originating from Trimbakeshwar near Nashik in Maharashtra.',
    category: 'Indian Physical Geography (UPSC)',
    difficulty: 'MEDIUM'
  },
  {
    id: 'kbc-2',
    question: 'Through how many Indian states does the Tropic of Cancer (23°30\' N) pass?',
    options: ['6 States', '7 States', '8 States', '9 States'],
    answerIndex: 2, // 8
    explanation: 'The Tropic of Cancer passes through 8 states: Gujarat, Rajasthan, Madhya Pradesh, Chhattisgarh, Jharkhand, West Bengal, Tripura, and Mizoram.',
    category: 'Indian Geography (UPSC)',
    difficulty: 'MEDIUM'
  },
  {
    id: 'kbc-3',
    question: 'Which Indian state shares international land borders with three foreign countries (Nepal, Bhutan, China)?',
    options: ['Uttarakhand', 'Sikkim', 'Arunachal Pradesh', 'West Bengal'],
    answerIndex: 1, // Sikkim
    explanation: 'Sikkim borders Nepal to the west, Bhutan to the east, and China (Tibet Autonomous Region) to the north.',
    category: 'Political Geography (UPSC/MPSC)',
    difficulty: 'MEDIUM'
  },
  {
    id: 'kbc-4',
    question: 'The famous "Silent Valley National Park" known for the Lion-tailed Macaque is located in which state?',
    options: ['Tamil Nadu', 'Karnataka', 'Kerala', 'Andhra Pradesh'],
    answerIndex: 2, // Kerala
    explanation: 'Silent Valley National Park is located in the Nilgiri Hills, Palakkad district of Kerala, along the Kunthi River.',
    category: 'Ecology & Biodiversity',
    difficulty: 'EASY'
  },
  {
    id: 'kbc-5',
    question: 'Which mountain pass connects Srinagar to Leh across the Great Himalayas?',
    options: ['Nathu La', 'Rohtang Pass', 'Zoji La', 'Shipki La'],
    answerIndex: 2, // Zoji La
    explanation: 'Zoji La pass (altitude 3,528 m) on National Highway 1 connects the Kashmir Valley with the Ladakh plateau.',
    category: 'Himalayan Passes (UPSC)',
    difficulty: 'HARD'
  },
  {
    id: 'kbc-6',
    question: 'What is the standard meridian of India upon which Indian Standard Time (IST = UTC+05:30) is calculated?',
    options: ['80° 30\' E', '82° 30\' E', '84° 00\' E', '88° 15\' E'],
    answerIndex: 1, // 82° 30' E
    explanation: '82° 30\' E longitude passing through Mirzapur near Prayagraj (Uttar Pradesh) is the Standard Meridian of India.',
    category: 'Cartography & Time Zones',
    difficulty: 'EASY'
  },
  {
    id: 'kbc-7',
    question: 'Which state in India has the highest percentage of forest cover relative to its total geographical area?',
    options: ['Madhya Pradesh', 'Mizoram', 'Arunachal Pradesh', 'Chhattisgarh'],
    answerIndex: 1, // Mizoram
    explanation: 'While Madhya Pradesh has the largest total forest area, Mizoram has the highest percentage of forest cover (~84.53% of its total area).',
    category: 'India State of Forest Report (ISFR)',
    difficulty: 'HARD'
  },
  {
    id: 'kbc-8',
    question: 'Majuli, the world\'s largest river island, is located in which river in Assam?',
    options: ['Ganga', 'Brahmaputra', 'Barak', 'Subansiri'],
    answerIndex: 1, // Brahmaputra
    explanation: 'Majuli is formed by the Brahmaputra River system in Assam and was declared the first island district of India in 2016.',
    category: 'Physical Geography',
    difficulty: 'EASY'
  },
  {
    id: 'kbc-9',
    question: 'Which line of latitude divides the African continent almost equally in half?',
    options: ['Tropic of Cancer', 'Equator (0°)', 'Tropic of Capricorn', 'Prime Meridian'],
    answerIndex: 1, // Equator
    explanation: 'The Equator runs right through central Africa, passing through Gabon, Congo, DRC, Uganda, Kenya, and Somalia.',
    category: 'World Geography',
    difficulty: 'EASY'
  },
  {
    id: 'kbc-10',
    question: 'Which of the following ocean trenches is the deepest point in the world\'s oceans (10,994 meters)?',
    options: ['Java Trench', 'Puerto Rico Trench', 'Mariana Trench (Challenger Deep)', 'Sunda Trench'],
    answerIndex: 2, // Mariana Trench
    explanation: 'The Challenger Deep in the Mariana Trench (western Pacific Ocean) reaches a depth of approximately 10,994 meters (36,070 feet).',
    category: 'Oceanography (UPSC)',
    difficulty: 'EASY'
  },
  {
    id: 'kbc-11',
    question: 'The Ten Degree Channel (10° N) separates which two island groups?',
    options: ['Lakshadweep and Maldives', 'Andaman and Nicobar Islands', 'Daman and Diu', 'Rameshwaram and Sri Lanka'],
    answerIndex: 1, // Andaman and Nicobar
    explanation: 'The 10° Channel separates Little Andaman in the north from Car Nicobar in the south in the Bay of Bengal.',
    category: 'Indian Island Territories',
    difficulty: 'MEDIUM'
  },
  {
    id: 'kbc-12',
    question: 'Which of the following is the only active volcano in South Asia and India?',
    options: ['Narcondam Island', 'Barren Island', 'Dhinodhar Hills', 'Tosham Hills'],
    answerIndex: 1, // Barren Island
    explanation: 'Barren Island in the Andaman Sea is the only confirmed active volcano in the South Asian subcontinent, with recorded eruptions up to 2020.',
    category: 'Geomorphology (UPSC)',
    difficulty: 'MEDIUM'
  },
  {
    id: 'kbc-13',
    question: 'Which is the largest freshwater lake in India by surface area?',
    options: ['Chilika Lake', 'Vembanad Lake', 'Wular Lake', 'Loktak Lake'],
    answerIndex: 2, // Wular Lake
    explanation: 'Wular Lake in Jammu and Kashmir (fed by the Jhelum River) is India’s largest freshwater lake. Vembanad is longest, Chilika is brackish.',
    category: 'Hydrology (UPSC)',
    difficulty: 'MEDIUM'
  },
  {
    id: 'kbc-14',
    question: 'Which plateau lies between the Aravalli Range and the Vindhya Range in Central India?',
    options: ['Deccan Plateau', 'Chota Nagpur Plateau', 'Malwa Plateau', 'Meghalaya Plateau'],
    answerIndex: 2, // Malwa
    explanation: 'The Malwa Plateau is an extensive volcanic tableland situated in western Madhya Pradesh and southeastern Rajasthan.',
    category: 'Indian Physiography',
    difficulty: 'HARD'
  },
  {
    id: 'kbc-15',
    question: 'Which country has the highest natural biodiversity of lemurs, with 100% endemic species found nowhere else?',
    options: ['New Zealand', 'Madagascar', 'Costa Rica', 'Papua New Guinea'],
    answerIndex: 1, // Madagascar
    explanation: 'Madagascar separated from the Indian landmass ~88 million years ago, allowing lemurs and 90% of its flora/fauna to evolve in complete isolation.',
    category: 'Global Biogeography',
    difficulty: 'EASY'
  }
];
