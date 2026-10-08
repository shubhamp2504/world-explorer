// src/data/liveEarth.js
// Live Earth dynamic datasets: Volcanoes, Earthquakes, Weather, Wildfires, Satellites, Shipping, Flights

export const LIVE_VOLCANOES = [
  { id: 'volc-1', name: 'Mount Etna', country: 'Italy', lat: 37.7510, lng: 14.9934, status: 'Active (Strombolian explosions)', elevation: '3,357 m', alert: 'Orange', update: '12m ago', detail: 'Frequent ash emissions and glowing lava fountains visible along the Southeast Crater.' },
  { id: 'volc-2', name: 'Kilauea', country: 'United States (Hawaii)', lat: 19.4069, lng: -155.2834, status: 'Active (Lava lake summit)', elevation: '1,247 m', alert: 'Red', update: '45m ago', detail: 'Active lava fountains within Halemaʻumaʻu crater feeding an expansive glowing lava lake.' },
  { id: 'volc-3', name: 'Fagradalsfjall / Reykjanes', country: 'Iceland', lat: 63.8930, lng: -22.2700, status: 'Fissure Eruption', elevation: '385 m', alert: 'Red', update: '2h ago', detail: 'Basaltic lava curtain issuing from ground fissures southwest of Grindavík.' },
  { id: 'volc-4', name: 'Sakurajima', country: 'Japan', lat: 31.5932, lng: 130.6575, status: 'Explosive Eruption', elevation: '1,117 m', alert: 'Orange', update: '3h ago', detail: 'Vulcanian explosive event sending ash plumes 2,500m into Kagoshima skies.' },
  { id: 'volc-5', name: 'Popocatépetl', country: 'Mexico', lat: 19.0224, lng: -98.6279, status: 'Continuous degassing', elevation: '5,426 m', alert: 'Yellow Phase 2', update: '1h ago', detail: 'Continuous emissions of water vapor, volcanic gas, and light ash falling in Puebla.' },
  { id: 'volc-6', name: 'Semeru', country: 'Indonesia', lat: -8.1080, lng: 112.9220, status: 'Pyroclastic Flows', elevation: '3,676 m', alert: 'Orange', update: '5h ago', detail: 'Avalanches of glowing lava and periodic pyroclastic density currents on southeastern flank.' }
];

export const LIVE_EARTHQUAKES = [
  { id: 'eq-1', place: 'Off Coast of Honshu, Japan', mag: 6.2, depth: '32 km', lat: 37.8, lng: 142.1, time: '34m ago', tsunami: false },
  { id: 'eq-2', place: 'Valparaíso Coastal Region, Chile', mag: 5.7, depth: '45 km', lat: -32.8, lng: -71.9, time: '2h ago', tsunami: false },
  { id: 'eq-3', place: 'Vanuatu Islands Arc', mag: 5.4, depth: '110 km', lat: -16.2, lng: 168.0, time: '4h ago', tsunami: false },
  { id: 'eq-4', place: 'Crete Sea, Greece', mag: 4.8, depth: '18 km', lat: 35.3, lng: 24.8, time: '6h ago', tsunami: false },
  { id: 'eq-5', place: 'Southern Alaska Faultline', mag: 5.1, depth: '52 km', lat: 60.1, lng: -152.8, time: '7h ago', tsunami: false },
  { id: 'eq-6', place: 'Mindanao Trench, Philippines', mag: 5.8, depth: '64 km', lat: 7.9, lng: 126.7, time: '9h ago', tsunami: false }
];

export const LIVE_STORMS = [
  { id: 'storm-1', name: 'Super Typhoon Ragasa', category: 'Cat 4 Tropical Cyclone', wind: '225 km/h', lat: 16.5, lng: 133.0, track: 'WNW towards Luzon Strait', pressure: '935 hPa' },
  { id: 'storm-2', name: 'Hurricane Sebastian', category: 'Cat 3 Atlantic Hurricane', wind: '185 km/h', lat: 24.2, lng: -55.8, track: 'North-Northeast into open waters', pressure: '960 hPa' },
  { id: 'storm-3', name: 'Cyclonic Storm Sagar', category: 'Severe Arabian Sea Storm', wind: '120 km/h', lat: 13.8, lng: 64.2, track: 'Northwest towards Oman Gulf', pressure: '984 hPa' }
];

export const LIVE_WILDFIRES = [
  { id: 'fire-1', name: 'Pantanal Wetland Complex', country: 'Brazil / Bolivia', lat: -17.5, lng: -57.2, intensity: 'High Fire Radiative Power (540 MW)', acres: '140,000 ha' },
  { id: 'fire-2', name: 'Northern Boreal Forest Blazes', country: 'Siberia, Russia', lat: 62.4, lng: 129.5, intensity: 'Extreme smoke plume', acres: '380,000 ha' },
  { id: 'fire-3', name: 'Kimberley Savanna Fires', country: 'Western Australia', lat: -16.8, lng: 125.4, intensity: 'Moderate burn area', acres: '65,000 ha' },
  { id: 'fire-4', name: 'Sierra Nevada Wilderness', country: 'California, USA', lat: 38.6, lng: -120.1, intensity: '35% Contained', acres: '28,000 ha' }
];

export const LIVE_FLIGHT_ROUTES = [
  { id: 'fl-1', callsign: 'SQ22 (SIN-EWR)', airline: 'Singapore Airlines (World\'s Longest Flight)', origin: [1.36, 103.99], dest: [40.69, -74.17], progress: 0.62, alt: '36,000 ft', speed: '910 km/h' },
  { id: 'fl-2', callsign: 'EK215 (DXB-LAX)', airline: 'Emirates A380', origin: [25.25, 55.36], dest: [33.94, -118.41], progress: 0.48, alt: '38,000 ft', speed: '880 km/h' },
  { id: 'fl-3', callsign: 'BA117 (LHR-JFK)', airline: 'British Airways B777', origin: [51.47, -0.45], dest: [40.64, -73.78], progress: 0.75, alt: '37,000 ft', speed: '895 km/h' },
  { id: 'fl-4', callsign: 'QF9 (PER-LHR)', airline: 'Qantas Dreamliner', origin: [-31.94, 115.97], dest: [51.47, -0.45], progress: 0.35, alt: '40,000 ft', speed: '930 km/h' },
  { id: 'fl-5', callsign: 'NH106 (HND-LAX)', airline: 'All Nippon Airways', origin: [35.55, 139.78], dest: [33.94, -118.41], progress: 0.55, alt: '35,000 ft', speed: '940 km/h' }
];

export const LIVE_SHIPPING_CHOKEPOINTS = [
  { id: 'ship-1', name: 'Strait of Malacca Convoy', lat: 2.2, lng: 102.1, count: '380 Container Vessels & Tankers', status: 'Dense Maritime Traffic (40% of global trade)' },
  { id: 'ship-2', name: 'Suez Canal Approach', lat: 29.9, lng: 32.5, count: '125 Bulk Carriers', status: 'Continuous Convoy Flow' },
  { id: 'ship-3', name: 'Strait of Hormuz', lat: 26.5, lng: 56.2, count: '90 Supertankers', status: 'Vital Energy Corridor (21M bbl/day)' },
  { id: 'ship-4', name: 'Panama Canal Transit', lat: 9.1, lng: -79.7, count: '65 Neopanamax Ships', status: 'Lock transits scheduled' }
];
