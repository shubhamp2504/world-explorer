// src/conquest/siegeQuestions.js
// Museum-Grade KBC-Level Geopolitical, Historical, and Scientific Question Engine
// High-IQ, curiosity-inducing questions with fascinating explanations across World Heritage,
// Ancient Wonders, Space/Science, Geopolitical Masterstrokes, and Extreme Geography.

import { COUNTRIES, countryByCode } from '../countries.js';
import { WILD_COUNTRY_FACTS } from '../facts.js';
import { COUNTRY_GDP_BILLIONS } from '../data/empireData.js';

// Deep, authentic KBC-grade dossiers for major global and regional powers
export const CURATED_GEOPOLITICAL_DOSSIERS = {
  IN: [
    {
      shield: 1,
      cat: '🚀 SPACE EXPLORATION & SCIENCE (ISRO)',
      prompt: 'On August 23, 2023, India made historic history by becoming the first country to land a spacecraft near the lunar south pole. What did Prime Minister Narendra Modi name this landing site?',
      correct: 'Shiv Shakti Point',
      distractors: ['Tiranga Point', 'Vikram Sthal', 'Atal Point'],
      fact: 'Shiv Shakti Point marks the touchdown location of the Chandrayaan-3 Vikram lander at 69.37°S latitude. August 23 was officially declared India’s "National Space Day" to honor this monumental achievement.'
    },
    {
      shield: 2,
      cat: '🏛️ ANCIENT HERITAGE & MARITIME HISTORY',
      prompt: 'Dating back to 2400 BCE in modern-day Gujarat, which Indus Valley Civilization site features the world’s oldest known tidal dockyard connected to the ancient Sabarmati river?',
      correct: 'Lothal',
      distractors: ['Dholavira', 'Kalibangan', 'Rakhigarhi'],
      fact: 'Lothal’s sophisticated hydro-engineering allowed tidal waters to enter a massive brick basin (214 × 36 meters), enabling bronze-age merchant ships to trade beads, gems, and metals as far as Mesopotamia and Ancient Egypt.'
    },
    {
      shield: 3,
      cat: '🧪 NOBEL SCIENCE & DISCOVERY',
      prompt: 'National Science Day in India is celebrated every February 28 to honor which Nobel-winning breakthrough discovered by Sir C.V. Raman in 1928?',
      correct: 'Inelastic scattering of photons (Raman Effect)',
      distractors: ['Discovery of cosmic microwave background', 'Quantum Bose-Einstein condensation', 'Cosmic ray cascade theory'],
      fact: 'The Raman Effect proved that when light traverses a transparent material, some deflected light changes wavelength due to molecular vibrations. Sir C.V. Raman became the first Asian to win a Nobel Prize in Science in 1930.'
    },
    {
      shield: 4,
      cat: '⚔️ MILITARY GENIUS & NAVAL CITADELS',
      prompt: 'Which legendary 17th-century sea fort, built on an islet off the Konkan coast by Chhatrapati Shivaji Maharaj using over 70,000 kg of molten lead for foundation mortar, remains impregnable to coastal erosion?',
      correct: 'Sindhudurg Fort',
      distractors: ['Murud-Janjira', 'Suvarnadurg', 'Vijaydurg'],
      fact: 'Constructed between 1664 and 1667 under master builder Hiroji Indulkar, Sindhudurg boasts 3 kilometers of continuous sea walls with 42 bastions designed to defy Portuguese, British, and Siddis naval armadas.'
    },
    {
      shield: 5,
      cat: '🌊 STRATEGIC GEOPOLITICS & CHOKEPOINTS',
      prompt: 'Which strategic maritime passage, located between Great Nicobar Island and Sumatra, oversees nearly 30% of global seaborne crude oil heading toward East Asia?',
      correct: 'Six Degree Channel (Great Channel)',
      distractors: ['Ten Degree Channel', 'Palk Strait', 'Duncan Passage'],
      fact: 'The Six Degree Channel marks the western gate to the vital Strait of Malacca. India’s tri-service Andaman and Nicobar Command directly monitors maritime surveillance across this critical global economic artery.'
    }
  ],

  US: [
    {
      shield: 1,
      cat: '🚀 APOLLO SPACE PROGRAM',
      prompt: 'On July 20, 1969, Neil Armstrong and Buzz Aldrin steered the Apollo 11 Lunar Module "Eagle" to human history\'s first crewed lunar landing in which basaltic plain?',
      correct: 'Mare Tranquillitatis (Sea of Tranquility)',
      distractors: ['Oceanus Procellarum (Ocean of Storms)', 'Mare Imbrium (Sea of Rains)', 'Mare Serenitatis (Sea of Serenity)'],
      fact: 'Armstrong manually piloted Eagle over a boulder-strewn crater with under 25 seconds of fuel remaining before announcing: "Houston, Tranquility Base here. The Eagle has landed."'
    },
    {
      shield: 2,
      cat: '⚡ SCIENTIFIC & TECH BREAKTHROUGHS',
      prompt: 'In 1947 at Bell Laboratories in New Jersey, John Bardeen, Walter Brattain, and William Shockley invented which device that sparked the entire modern semiconductor and digital revolution?',
      correct: 'Point-Contact Transistor',
      distractors: ['Microprocessor chip', 'Integrated circuit', 'Cathode ray tube'],
      fact: 'The transistor replaced bulky, fragile vacuum tubes, enabling miniature radios, computers, smartphones, and space missions. The trio shared the 1956 Nobel Prize in Physics.'
    },
    {
      shield: 3,
      cat: '📜 HISTORIC TURNING POINTS',
      prompt: 'On July 4, 1776, the Second Continental Congress in Philadelphia ratified the Declaration of Independence, drafted principally by which Founding Father?',
      correct: 'Thomas Jefferson',
      distractors: ['Benjamin Franklin', 'Alexander Hamilton', 'John Adams'],
      fact: 'Jefferson penned the immortal words that all humans are created equal, endowed with unalienable rights to Life, Liberty, and the pursuit of Happiness.'
    },
    {
      shield: 4,
      cat: '🌊 GEOGRAPHICAL WONDERS',
      prompt: 'Carved over 6 million years by the Colorado River in Arizona, which 446-kilometer-long natural wonder exposes nearly 2 billion years of Earth’s geological crust?',
      correct: 'Grand Canyon',
      distractors: ['Bryce Canyon', 'Zion Canyon', 'Black Canyon of the Gunnison'],
      fact: 'The Grand Canyon reaches depths of over 1,800 meters and reveals pristine Paleozoic and Precambrian rock strata, creating one of the most complete visual records of Earth’s history.'
    },
    {
      shield: 5,
      cat: '💎 ECONOMIC INFRASTRUCTURE & SUPPLY CHAINS',
      prompt: 'Which high-technology innovation basin in Northern California’s Santa Clara Valley accounts for the world’s highest density of trillion-dollar tech enterprises and generative AI pioneers?',
      correct: 'Silicon Valley',
      distractors: ['Research Triangle', 'Silicon Alley', 'Route 128 Corridor'],
      fact: 'Originating from Stanford University research spin-offs (Hewlett-Packard, Fairchild Semiconductor), Silicon Valley generates an annual economic output rivaling the top-20 sovereign nations.'
    }
  ],

  CN: [
    {
      shield: 1,
      cat: '🏛️ ANCIENT IMPERIAL ARCHAEOLOGY',
      prompt: 'Discovered by local well-diggers in 1974 near Xi\'an, which life-sized army of over 8,000 clay warriors, chariots, and horses was buried to protect China’s first emperor?',
      correct: 'Terracotta Army of Emperor Qin Shi Huang',
      distractors: ['Han Dynasty Jade Army', 'Ming Dynasty Imperial Guard', 'Tang Dynasty Bronze Garrison'],
      fact: 'Qin Shi Huang, who unified China in 221 BCE, commissioned this subterranean funerary necropolis. No two terracotta warriors have the exact same facial expression or hair style.'
    },
    {
      shield: 2,
      cat: '📜 THE FOUR GREAT INVENTIONS',
      prompt: 'Which of the following breakthroughs is recognized in world history as one of Ancient China\'s "Four Great Inventions" alongside papermaking, printing, and gunpowder?',
      correct: 'Magnetic Compass (Sinan)',
      distractors: ['Steam locomotive', 'Mechanical clockwork loom', 'Refracting telescope'],
      fact: 'During the Han Dynasty (2nd century BCE), the magnetic lodestone compass was invented. It revolutionized maritime navigation, leading to Admiral Zheng He\'s massive treasure voyages in the 15th century.'
    },
    {
      shield: 3,
      cat: '⚡ MEGACONSTRUCTION & ENERGY',
      prompt: 'Spanning the Yangtze River in Hubei province, which massive engineering marvel is the world’s largest power station by installed electrical generation capacity (22,500 MW)?',
      correct: 'Three Gorges Dam',
      distractors: ['Baihetan Dam', 'Xiluodu Dam', 'Gezhouba Dam'],
      fact: 'The reservoir of Three Gorges Dam holds 39.3 billion cubic meters of water. NASA geophysicists calculated that its immense mass actually slowed Earth’s rotation by 0.06 microseconds!'
    },
    {
      shield: 4,
      cat: '🌊 STRATEGIC GEOPOLITICAL CHOKEPOINTS',
      prompt: 'China relies on which narrow Southeast Asian waterway for roughly 75% of its seaborne oil imports, creating a strategic vulnerability famously known as the "Malacca Dilemma"?',
      correct: 'Strait of Malacca',
      distractors: ['Sunda Strait', 'Lombok Strait', 'Taiwan Strait'],
      fact: 'The term was coined by President Hu Jintao in 2003, highlighting how a naval blockade at Malacca could cripple China’s energy security, prompting China’s Belt and Road investments in overland pipelines.'
    },
    {
      shield: 5,
      cat: '🏛️ IMPERIAL CITADELS',
      prompt: 'Constructed from 1406 to 1420 by the Ming Emperor Yongle, which 980-building palace complex in Beijing served as the imperial seat for 24 emperors across 500 years?',
      correct: 'The Forbidden City (Zijin Cheng)',
      distractors: ['Summer Palace (Yiheyuan)', 'Old Summer Palace (Yuanmingyuan)', 'Mukden Palace'],
      fact: 'The Forbidden City is the world\'s largest preserved wooden palace complex, spanning 72 hectares. It was designed according to ancient feng shui cosmological principles aligned directly with the North Star.'
    }
  ],

  GB: [
    {
      shield: 1,
      cat: '📜 CONSTITUTIONAL & RULE OF LAW',
      prompt: 'Sealed at Runnymede in 1215 by King John, which landmark charter established for the first time that even the monarch is subject to the rule of law?',
      correct: 'Magna Carta (The Great Charter)',
      distractors: ['Bill of Rights 1689', 'Habeas Corpus Act', 'Petition of Right'],
      fact: 'Clause 39 of Magna Carta granted that no free person could be seized, imprisoned, or stripped of possessions except by lawful judgment of their equals or by the law of the land—inspiring modern constitutional democracies.'
    },
    {
      shield: 2,
      cat: '🧪 SCIENTIFIC REVOLUTION',
      prompt: 'Published in 1687, which monumental masterwork by Sir Isaac Newton laid out the three universal laws of motion and the law of universal gravitation?',
      correct: 'Philosophiae Naturalis Principia Mathematica',
      distractors: ['Opticks', 'Dialogo sopra i due massimi sistemi', 'De Revolutionibus Orbium Coelestium'],
      fact: 'Principia Mathematica unified the physics of heavenly bodies and earthly mechanics under a single mathematical framework, sparking the modern Scientific Revolution.'
    },
    {
      shield: 3,
      cat: '💻 COMPUTING & CODEBREAKING',
      prompt: 'During World War II at Bletchley Park, which brilliant British mathematician designed the electro-mechanical "Bombe" machine to crack the Nazi military Enigma cipher?',
      correct: 'Alan Turing',
      distractors: ['Charles Babbage', 'Ada Lovelace', 'John von Neumann'],
      fact: 'Turing’s decryption breakthroughs saved an estimated 14 million lives and shortened the war by two to three years. He is widely celebrated as the father of theoretical computer science and artificial intelligence.'
    },
    {
      shield: 4,
      cat: '🧭 GLOBAL TIME & GEOGRAPHY',
      prompt: 'Located at the Royal Observatory in London, which historic landmark line was internationally adopted in 1884 as the Prime Meridian (0° Longitude) defining universal world time?',
      correct: 'Greenwich Meridian',
      distractors: ['Paris Meridian', 'Cadiz Meridian', 'Rome Meridian'],
      fact: 'Every timezone on Earth is measured relative to Greenwich Mean Time (GMT/UTC). A physical brass strip at the Royal Observatory allows visitors to stand with one foot in the Eastern and one in the Western Hemisphere.'
    },
    {
      shield: 5,
      cat: '⚙️ INDUSTRIAL REVOLUTION',
      prompt: 'In the 1760s and 1770s, which Scottish inventor developed the separate condenser for steam engines, drastically multiplying efficiency and powering the global Industrial Revolution?',
      correct: 'James Watt',
      distractors: ['Thomas Newcomen', 'Richard Arkwright', 'George Stephenson'],
      fact: 'Watt’s breakthrough transformed steam engines from localized coal-mine pumps into the universal prime mover for cotton mills, locomotives, and steamships. The SI unit of power, the "watt", is named in his honor.'
    }
  ],

  FR: [
    {
      shield: 1,
      cat: '🧪 NOBEL SCIENCE & RADIOACTIVITY',
      prompt: 'Who remains the only person in history to win Nobel Prizes in two different scientific fields (Physics in 1903 and Chemistry in 1911) for pioneering research in radioactivity?',
      correct: 'Marie Skłodowska-Curie',
      distractors: ['Irène Joliot-Curie', 'Louis Pasteur', 'Henri Becquerel'],
      fact: 'Curie coined the term "radioactivity" and discovered the elements polonium (named after her homeland Poland) and radium. During WWI, she developed mobile X-ray units ("petites Curies") to treat wounded battlefield soldiers.'
    },
    {
      shield: 2,
      cat: '📜 REVOLUTION & DEMOCRACY',
      prompt: 'Which dramatic event on July 14, 1789, where citizens seized a medieval fortress prison in Paris, became the defining symbol of the French Revolution and is celebrated as France’s National Day?',
      correct: 'Storming of the Bastille',
      distractors: ['Women’s March on Versailles', 'Execution of Louis XVI', 'Tennis Court Oath'],
      fact: 'The Bastille represented royal tyranny and arbitrary monarchical imprisonment. When King Louis XVI asked if it was a revolt, Duke de La Rochefoucauld famously answered: "No, Sire, it is a revolution."'
    },
    {
      shield: 3,
      cat: '🏛️ ARCHITECTURAL WONDERS',
      prompt: 'Set on a tidal rocky islet in Normandy, which UNESCO World Heritage medieval Benedictine abbey becomes completely surrounded by surging sea waters during extreme high tides?',
      correct: 'Mont Saint-Michel',
      distractors: ['Château de Chambord', 'Palace of Fontainebleau', 'Carcassonne Citadel'],
      fact: 'Mont Saint-Michel withstood English sieges during the Hundred Years\' War. The tidal variation here can reach up to 14 meters (46 feet), described by Victor Hugo as waters rushing "with the speed of a galloping horse."'
    },
    {
      shield: 4,
      cat: '📜 HISTORIC CITADELS & TREATIES',
      prompt: 'In which opulent royal palace outside Paris did Emperor Louis XIV commission the 73-meter Hall of Mirrors, where the Treaty of Versailles was later signed in 1919 ending World War I?',
      correct: 'Palace of Versailles',
      distractors: ['Château de Chenonceau', 'Palais Garnier', 'Château de Vincennes'],
      fact: 'The Hall of Mirrors contains 357 mirrors reflecting 17 arcaded windows overlooking formal gardens. In the 17th century, Venetian mirror artisans were strictly guarded by Venice, but France smuggled master glassmakers out to build it.'
    },
    {
      shield: 5,
      cat: '💡 VACCINE REVOLUTION & MICROBIOLOGY',
      prompt: 'In 1885, French scientist Louis Pasteur successfully administered the first human vaccine against which deadly neurological viral disease to a 9-year-old boy named Joseph Meister?',
      correct: 'Rabies (Hydrophobia)',
      distractors: ['Smallpox', 'Anthrax', 'Cholera'],
      fact: 'Meister had been mauled by a rabid dog and was expected to die. Pasteur’s vaccine saved the boy, who later grew up to become the caretaker of the Pasteur Institute in Paris.'
    }
  ],

  RU: [
    {
      shield: 1,
      cat: '🚀 DAWN OF THE SPACE AGE',
      prompt: 'On April 12, 1961, aboard Vostok 1, which 27-year-old Soviet cosmonaut became the first human being to journey into outer space and orbit planet Earth?',
      correct: 'Yuri Gagarin',
      distractors: ['Gherman Titov', 'Alexei Leonov', 'Valentina Tereshkova'],
      fact: 'Gagarin famously shouted "Poyekhali!" ("Let’s go!") at liftoff. His historic 108-minute flight proved that humans could survive launch, weightlessness, and fiery atmospheric re-entry.'
    },
    {
      shield: 2,
      cat: '🌊 EXTREME FRESHWATER GEOGRAPHY',
      prompt: 'Plunging to a depth of 1,642 meters in Siberia, which ancient geological rift lake contains roughly 20% of the world’s unfrozen surface freshwater?',
      correct: 'Lake Baikal',
      distractors: ['Lake Ladoga', 'Lake Onega', 'Caspian Sea'],
      fact: 'Lake Baikal is the world’s deepest, oldest (25 million years), and most transparent lake. It holds more water than all five North American Great Lakes combined and hosts over 1,700 endemic plant and animal species.'
    },
    {
      shield: 3,
      cat: '🚂 CONTINENTAL INFRASTRUCTURE',
      prompt: 'Stretching 9,289 kilometers across two continents from Moscow to the Pacific port of Vladivostok, which is the longest continuous railway line in human history?',
      correct: 'Trans-Siberian Railway',
      distractors: ['Baikal-Amur Mainline (BAM)', 'Turkestan-Siberian Railway', 'Northern Sea Route'],
      fact: 'Spanning eight time zones and crossing 16 major rivers, the Trans-Siberian takes seven full days of non-stop travel to traverse from Europe to the Pacific Ocean.'
    },
    {
      shield: 4,
      cat: '🧪 PERIODIC TABLE OF ELEMENTS',
      prompt: 'In 1869, which Russian chemist organized all 63 known elements by atomic weight, creating the Periodic Table and accurately predicting properties of undiscovered elements like Gallium and Germanium?',
      correct: 'Dmitri Mendeleev',
      distractors: ['Mikhail Lomonosov', 'Nikolay Basov', 'Pavel Cherenkov'],
      fact: 'Mendeleev reportedly conceived the arrangement in a dream after playing chemical solitaire. When French chemist Lecoq de Boisbaudran discovered gallium in 1875, its density matched Mendeleev\'s prediction almost precisely.'
    },
    {
      shield: 5,
      cat: '🏛️ IMPERIAL TREASURES & CITADELS',
      prompt: 'Founded in 1764 by Empress Catherine the Great in Saint Petersburg, which palace museum complex holds over 3 million artworks, spanning the Winter Palace of the Tsars?',
      correct: 'The State Hermitage Museum',
      distractors: ['Tretyakov Gallery', 'Pushkin State Museum', 'Kremlin Armoury'],
      fact: 'With over 360 display rooms across six historic riverside buildings, experts estimate that spending just one minute on every exhibited artifact would take over 11 years of continuous viewing.'
    }
  ],

  JP: [
    {
      shield: 1,
      cat: '🚄 HIGH-SPEED RAILWAY INNOVATION',
      prompt: 'Inaugurated for the 1964 Tokyo Olympics, which world-first high-speed railway line connected Tokyo and Osaka at 210 km/h, pioneering zero-fatality bullet trains?',
      correct: 'Tokaido Shinkansen',
      distractors: ['Sanyo Shinkansen', 'Tohoku Shinkansen', 'Hokuriku Shinkansen'],
      fact: 'In over 60 years of transporting billions of passengers, the Shinkansen has maintained an unprecedented record of zero passenger fatalities from train accidents and an average annual delay of under one minute.'
    },
    {
      shield: 2,
      cat: '🗻 SACRED NATURAL WONDERS',
      prompt: 'Rising to 3,776 meters on Honshu Island, which symmetrical active stratovolcano is celebrated as one of Japan’s "Three Holy Mountains" and a UNESCO Cultural Heritage icon?',
      correct: 'Mount Fuji (Fuji-san)',
      distractors: ['Mount Haku', 'Mount Tate', 'Mount Aso'],
      fact: 'Mount Fuji last erupted in 1707 during the Edo period (the Hoei eruption). Its striking snow-capped conical silhouette has inspired centuries of Japanese poetry and ukiyo-e woodblock prints by artists like Hokusai.'
    },
    {
      shield: 3,
      cat: '📜 HISTORIC ERAS & SAMURAI CITADELS',
      prompt: 'Following the decisive Battle of Sekigahara in 1600, which warlord unified Japan and founded a 250-year period of peace and isolation known as the Edo Period?',
      correct: 'Tokugawa Ieyasu',
      distractors: ['Oda Nobunaga', 'Toyotomi Hideyoshi', 'Minamoto no Yoritomo'],
      fact: 'Tokugawa moved the administrative capital to Edo (modern Tokyo), establishing the "Sakoku" closed-country policy that strictly regulated foreign trade until Commodore Perry\'s arrival in 1853.'
    },
    {
      shield: 4,
      cat: '🎨 CULTURAL PHILOSOPHY & ARTISTRY',
      prompt: 'What is the traditional Japanese art of repairing broken ceramic pottery using urushi lacquer dusted with powdered gold, silver, or platinum, treating breakage as part of an object\'s beauty?',
      correct: 'Kintsugi ("Golden Joinery")',
      distractors: ['Wabi-sabi', 'Ikebana', 'Origami'],
      fact: 'Kintsugi embodies the Zen Buddhist philosophy of embracing imperfection and transience (mushin), transforming scars and repairs into the most illuminated and valued aspects of an artifact.'
    },
    {
      shield: 5,
      cat: '⚡ ROBOTICS & QUANTUM MATERIALS',
      prompt: 'Discovered in 1991 by Japanese physicist Sumio Iijima at NEC Corporation, which cylindrical carbon nanostructures possess 100 times the tensile strength of steel at one-sixth the weight?',
      correct: 'Carbon Nanotubes (CNTs)',
      distractors: ['Graphene sheets', 'Buckminsterfullerenes', 'Diamondoids'],
      fact: 'Iijima’s discovery ignited modern nanotechnology. Carbon nanotubes conduct electricity better than copper, transfer heat faster than diamond, and are pivotal for space elevators and quantum computing chips.'
    }
  ],

  EG: [
    {
      shield: 1,
      cat: '🏛️ ANCIENT WORLD WONDERS',
      prompt: 'Built around 2560 BCE for Pharaoh Khufu, which monument is the oldest and only substantially surviving monument of the original Seven Wonders of the Ancient World?',
      correct: 'The Great Pyramid of Giza',
      distractors: ['Colossus of Rhodes', 'Lighthouse of Alexandria', 'Hanging Gardens of Babylon'],
      fact: 'Constructed from approximately 2.3 million stone blocks weighing an average of 2.5 tons each, the Great Pyramid remained the tallest human-made structure on Earth for over 3,800 years until Lincoln Cathedral in 1311 CE.'
    },
    {
      shield: 2,
      cat: '📜 LINGUISTIC & ARCHAEOLOGICAL BREAKTHROUGHS',
      prompt: 'Discovered in 1799 near the Nile delta, which granodiorite stele inscribed in Hieroglyphic, Demotic, and Ancient Greek enabled Jean-François Champollion to unlock ancient Egyptian texts?',
      correct: 'The Rosetta Stone',
      distractors: ['Palermo Stone', 'Narmer Palette', 'Turin Royal Canon'],
      fact: 'Because the same decree was written in three scripts, scholars used the known Ancient Greek text to decipher phonetic hieroglyphs in royal cartouches (such as Ptolemy and Cleopatra), cracking a 1,400-year mystery.'
    },
    {
      shield: 3,
      cat: '👑 ROYAL TOMBS & DISCOVERIES',
      prompt: 'In November 1922 in the Valley of the Kings, which British archaeologist peered through a sealed doorway into Pharaoh Tutankhamun\'s tomb and uttered the famous words: "Yes, wonderful things!"?',
      correct: 'Howard Carter',
      distractors: ['Lord Carnarvon', 'Flinders Petrie', 'Arthur Evans'],
      fact: 'KV62 was the most intact royal pharaonic tomb ever discovered, containing over 5,000 artifacts including the iconic 11-kilogram solid gold funerary death mask encrusted with lapis lazuli and turquoise.'
    },
    {
      shield: 4,
      cat: '🌊 MARITIME TRADE CHOKEPOINTS',
      prompt: 'Inaugurated in November 1869 across the Isthmus of Suez, which 193-kilometer sea-level canal directly connects the Mediterranean Sea to the Red Sea, eliminating the voyage around Africa?',
      correct: 'Suez Canal',
      distractors: ['Panama Canal', 'Corinth Canal', 'Kiel Canal'],
      fact: 'Engineered by French diplomat Ferdinand de Lesseps, the Suez Canal carries approximately 12% of global trade and 30% of global container traffic, shortening the Mumbai-to-London voyage by roughly 8,900 km.'
    },
    {
      shield: 5,
      cat: '🌊 RIVER CIVILIZATIONS',
      prompt: 'Regarded by world historians as the literal lifeblood of ancient Egyptian agriculture and civilization, which longest river on Earth flows northward over 6,650 kilometers into the Mediterranean?',
      correct: 'The Nile River',
      distractors: ['The Amazon River', 'The Congo River', 'The Yangtze River'],
      fact: 'Herodotus famously wrote that "Egypt is the gift of the Nile." Annual summer floods deposited nutrient-rich black silt ("kemet") across the desert floodplain, allowing ancient kingdoms to produce massive grain surpluses.'
    }
  ]
};

// Rich, high-IQ KBC templates for dynamic procedural questions
const KBC_CATEGORY_TEMPLATES = [
  {
    category: '🏛️ WORLD HERITAGE & ICONIC LANDMARKS',
    build: (c) => {
      const cap = c.capital || c.name;
      const wild = WILD_COUNTRY_FACTS[c.code];
      const hasWild = wild && wild[0]?.text;
      const snippet = hasWild ? wild[0].text.replace(/<[^>]+>/g, '') : `Historic monuments in ${cap}`;

      const distractors = COUNTRIES
        .filter(x => x.code !== c.code && x.region === c.region && x.capital)
        .map(x => `The Citadel & Historic Monuments of ${x.capital} (${x.name})`)
        .slice(0, 3);

      return {
        prompt: `In the annals of world civilization, which sovereign capital citadel serves as the supreme constitutional seat and historical anchor of ${c.flag} ${c.name}?`,
        correct: `The Historic Seat of ${cap} (${c.name})`,
        distractors: distractors.length === 3 ? distractors : ['The Acropolis Citadel', 'The Imperial Grand Forum', 'The Royal Alcázar Complex'],
        fact: `${cap} anchors the national sovereignty of ${c.name}. Fascinating fact: ${snippet}`
      };
    }
  },
  {
    category: '🌊 GEOGRAPHICAL WONDERS & NATURAL MARVELS',
    build: (c) => {
      const gdpB = getCountryGdpBillions(c.code);
      const gdpStr = gdpB >= 1000 ? `$${(gdpB / 1000).toFixed(2)} Trillion` : `$${gdpB} Billion`;
      const region = c.subregion || c.region || 'World';

      const trueArea = `${c.area?.toLocaleString() || '150,000'} km² in ${region}`;
      const fakeAreas = [
        `12,400 km² in Western Europe`,
        `850,000 km² in Southern Africa`,
        `320,000 km² in Southeast Asia`
      ];

      return {
        prompt: `Commanding sovereign territorial borders across ${region}, what is the verified geographical footprint and economic expanse of ${c.flag} ${c.name}?`,
        correct: `${trueArea} with ~${gdpStr} GDP`,
        distractors: fakeAreas.map(a => `${a} with ~$25B GDP`),
        fact: `${c.name} spans ${c.area?.toLocaleString() || '100,000'} km² with a population of ${c.population?.toLocaleString() || 'millions'}, generating ${gdpStr} in economic output.`
      };
    }
  },
  {
    category: '💡 FASCINATING SOVEREIGN TRIVIA & CULTURE',
    build: (c) => {
      const wild = WILD_COUNTRY_FACTS[c.code];
      if (wild && wild.length > 0 && wild[0]?.text) {
        const clean = wild[0].text.replace(/<[^>]+>/g, '');
        const currency = c.currency || 'National Currency';

        return {
          prompt: `Which unique cultural, geographical, or historical hallmark distinguishes the sovereign nation of ${c.flag} ${c.name}?`,
          correct: clean.length > 90 ? clean.slice(0, 90) + '...' : clean,
          distractors: [
            `The entire nation operates without any official national coastline or borders`,
            `It was the first country on Earth to completely outlaw paper sovereign currency`,
            `Its national boundary encompasses over 100,000 active geothermal geysers`
          ],
          fact: `Did you know? ${clean}`
        };
      }

      const currency = c.currency || 'Official Currency';
      return {
        prompt: `Underpinning national commerce and foreign reserve transactions in ${c.region}, which recognized sovereign currency powers the domestic economy of ${c.flag} ${c.name}?`,
        correct: `${currency} of ${c.name}`,
        distractors: ['Sovereign Dinars', 'Crown Guilders', 'Universal Francs'],
        fact: `${c.name} operates its national monetary policy using the ${currency}.`
      };
    }
  }
];

function getCountryGdpBillions(countryCode) {
  return COUNTRY_GDP_BILLIONS[countryCode] || 15;
}

function shuffleOptions(correctText, distractors) {
  const uniqueDistractors = [];
  for (const d of distractors) {
    if (d && d !== correctText && !uniqueDistractors.includes(d)) {
      uniqueDistractors.push(d);
    }
    if (uniqueDistractors.length === 3) break;
  }
  while (uniqueDistractors.length < 3) {
    uniqueDistractors.push(`Verified Option ${uniqueDistractors.length + 1}`);
  }

  const list = [correctText, ...uniqueDistractors.slice(0, 3)];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return {
    options: list,
    answerIndex: list.indexOf(correctText)
  };
}

/**
 * Returns dynamic shields based on country status:
 * - Microstates & small islands: 1 Shield (Fast, fun, user-friendly!)
 * - Regional powers: 2 - 3 Shields
 * - Superpower Boss Citadels (IN, US, CN, GB, FR, RU, JP, DE, EG, BR): 4 - 5 Shields
 */
export function getRecommendedShieldCount(countryCode) {
  const bosses = ['IN', 'US', 'CN', 'GB', 'FR', 'RU', 'JP', 'DE', 'EG', 'BR'];
  if (bosses.includes(countryCode)) return 5;

  const gdp = getCountryGdpBillions(countryCode);
  if (gdp > 400) return 3;
  if (gdp > 50) return 2;
  return 1; // Small countries have 1 shield for fast, engaging expansion!
}

export function generateSiegeQuestionsForCountry(countryCode, shieldCount = null, recentQuestionIds = []) {
  const c = countryByCode[countryCode];
  if (!c) return [];

  const neededShields = shieldCount || getRecommendedShieldCount(countryCode);
  const questions = [];
  const curated = CURATED_GEOPOLITICAL_DOSSIERS[countryCode];

  for (let s = 1; s <= neededShields; s++) {
    if (curated && curated[s - 1]) {
      const qData = curated[s - 1];
      const shuffled = shuffleOptions(qData.correct, qData.distractors);
      questions.push({
        id: `q_${c.code}_curated_s${s}`,
        shieldIndex: s,
        category: qData.cat,
        prompt: qData.prompt,
        options: shuffled.options,
        answerIndex: shuffled.answerIndex,
        explanation: qData.fact
      });
    } else {
      const template = KBC_CATEGORY_TEMPLATES[(s - 1) % KBC_CATEGORY_TEMPLATES.length];
      const dynData = template.build(c);
      const shuffled = shuffleOptions(dynData.correct, dynData.distractors);

      questions.push({
        id: `q_${c.code}_dyn_s${s}`,
        shieldIndex: s,
        category: template.category,
        prompt: dynData.prompt,
        options: shuffled.options,
        answerIndex: shuffled.answerIndex,
        explanation: dynData.fact
      });
    }
  }

  return questions;
}
