export interface MarineNewsItem {
  id: string;
  category: 'Ocean' | 'Climate' | 'Fisheries' | 'Marine Safety' | 'Satellite' | 'Research' | 'India' | 'Technology';
  headline: string;
  summary: string;
  date: string;
  source: string;
  readTime: string;
  imageUrl: string;
  isDemo?: boolean;
  // User-friendly additions
  simpleHeadline?: string;
  simpleSummary?: string;
  location?: string;
  whatThisMeans?: string;
  whatToDo?: string;
  priority?: 'urgent' | 'important' | 'info';
  isLocal?: boolean;
  affectedRegions?: string[];
  timestamp?: string;
  isCached?: boolean;
}

export const MOCK_MARINE_NEWS: MarineNewsItem[] = [
  {
    id: 'news-01',
    category: 'Satellite',
    headline: 'Oceansat-3 Ocean Colour Monitor Delivers Enhanced Coastal Chlorophyll Resolving at 360m',
    summary: 'ISRO and INCOIS scientists announce synchronized optical data streams allowing real-time detection of coastal upwelling plumes and pelagic feeding zones along the Indian coastline.',
    simpleHeadline: '🛰️ Better Satellite Images Help Find Fish',
    simpleSummary: 'New satellite technology can now see where fish food is growing in the ocean, helping fishermen find better fishing areas.',
    location: 'Indian Coast',
    whatThisMeans: 'Satellites can now detect areas where small plants (phytoplankton) grow in the ocean. Fish eat these plants, so more plants mean more fish in that area.',
    whatToDo: 'Check the MATSYA AI fishing zone predictions before your trip. The satellite data now gives more accurate information.',
    priority: 'info',
    isLocal: false,
    affectedRegions: ['All Indian Coastal States'],
    timestamp: '2 hours ago',
    date: '22 AUG 2026',
    source: 'ISRO',
    readTime: '2 min read',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    isDemo: true
  },
  {
    id: 'news-02',
    category: 'Fisheries',
    headline: 'Coromandel Coastal Fishermen Report 35% Fuel Savings Using Autonomous PFZ Advisory Routing',
    summary: 'Pilot study across 450 artisanal craft operating from Kasimedu and Cuddalore highlights rapid adoption of multilingual voice advisories preventing fruitless deep-sea exploratory voyages.',
    simpleHeadline: '⛽ Chennai Fishermen Save Money on Fuel',
    simpleSummary: 'Fishermen who follow AI fishing zone advice are saving 35% on fuel by going directly to good fishing areas.',
    location: 'Chennai & Cuddalore Coast',
    whatThisMeans: '450 fishing boats from Kasimedu and Cuddalore are now using voice AI to find the best fishing spots without wasting time and fuel searching.',
    whatToDo: 'Use the MATSYA AI voice assistant to get fishing zone recommendations before leaving. This can help you save fuel and find fish faster.',
    priority: 'important',
    isLocal: true,
    affectedRegions: ['Chennai', 'Cuddalore', 'Tamil Nadu Coast'],
    timestamp: '5 hours ago',
    date: '21 AUG 2026',
    source: 'National Fisheries Development Board',
    readTime: '2 min read',
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    isDemo: true
  },
  {
    id: 'news-03',
    category: 'Climate',
    headline: 'Bay of Bengal Mesoscale Eddy Dynamics Show 1.8°C SST Anomaly in Annual Ecosystem Assessment',
    summary: 'High-resolution GHRSST and INSAT-3DR thermal sounder telemetry confirms persistent warm-core circulation altering seasonal sardine migratory timing in the southern shelf.',
    simpleHeadline: '🌡️ Water is Warmer Than Usual in Bay of Bengal',
    simpleSummary: 'The Bay of Bengal water is about 2°C warmer than normal. This may change where fish are found.',
    location: 'Bay of Bengal',
    whatThisMeans: 'Warmer water temperature can cause fish (especially sardines) to move to different areas than usual. Fish may be found in deeper or cooler waters.',
    whatToDo: 'Fish movements may have changed. Check current fishing zone predictions for your area, as fish may not be in their usual spots.',
    priority: 'important',
    isLocal: true,
    affectedRegions: ['Bay of Bengal', 'Tamil Nadu', 'Andhra Pradesh', 'Odisha', 'West Bengal'],
    timestamp: '1 day ago',
    date: '19 AUG 2026',
    source: 'Ministry of Earth Sciences',
    readTime: '3 min read',
    imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80',
    isDemo: true
  },
  {
    id: 'news-04',
    category: 'Marine Safety',
    headline: 'Coast Guard Integrates Automated Geofence SAR Triggers Across Palk Strait Fishing Fleets',
    summary: 'Digital IMBL boundary geofencing successfully reduced unintentional international maritime boundary crossings by 92% over the last monsoon quarter.',
    simpleHeadline: '⚠️ New Alert System Prevents Crossing International Border',
    simpleSummary: 'Coast Guard has installed automatic warnings that alert fishermen before crossing into international waters.',
    location: 'Palk Strait',
    whatThisMeans: 'If your boat gets close to the international maritime boundary, you will automatically receive a warning. This helps prevent accidental border crossings.',
    whatToDo: 'Pay attention to location alerts on your device. If you receive a border warning, turn back immediately to stay in Indian waters.',
    priority: 'urgent',
    isLocal: true,
    affectedRegions: ['Palk Strait', 'Rameswaram', 'Tamil Nadu South Coast'],
    timestamp: '3 days ago',
    date: '17 AUG 2026',
    source: 'Indian Coast Guard',
    readTime: '2 min read',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
    isDemo: true
  },
  {
    id: 'news-05',
    category: 'Technology',
    headline: 'Agentic AI Orchestrator Bridges Multi-Sensor Space Rasters with Natural Regional Voice Dialects',
    summary: 'Autonomous reasoning graph combines SWAN wave forecasts, OCM-3 bio-optical algorithms, and local dialect speech synthesis to deliver zero-latency safety intelligence.',
    simpleHeadline: '🗣️ Voice AI Now Speaks in Your Local Language',
    simpleSummary: 'MATSYA AI can now speak in Tamil, Telugu, Malayalam, Hindi, and other regional languages to give fishing and safety information.',
    location: 'All India',
    whatThisMeans: 'You can ask questions and receive ocean information in your own language. The AI understands local fishing terms and provides answers you can easily understand.',
    whatToDo: 'Try using the Voice AI feature in your preferred language. It can tell you about weather, waves, and fishing conditions.',
    priority: 'info',
    isLocal: false,
    affectedRegions: ['All Indian States'],
    timestamp: '1 week ago',
    date: '14 AUG 2026',
    source: 'MATSYA AI Team',
    readTime: '2 min read',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    isDemo: true
  },
  {
    id: 'news-06',
    category: 'Research',
    headline: 'Deep Arabian Sea Upwelling Study Uncovers Deep Nutrient Surges Fueling Malabar Biodiversity',
    summary: 'Autonomous ocean glider transects and satellite altimetry reconstruct monsoon-driven subsurface vertical mixing supporting high pelagic biomass density.',
    simpleHeadline: '🐟 More Fish Food Found in Arabian Sea',
    simpleSummary: 'Scientists discovered that nutrients from deep water are rising to the surface in the Arabian Sea, creating good conditions for fish.',
    location: 'Arabian Sea (Kerala Coast)',
    whatThisMeans: 'Cold, nutrient-rich water from the deep ocean is coming up to the surface. This creates more food for fish, which may attract larger schools of fish to the area.',
    whatToDo: 'Kerala and Karnataka coastal fishermen: fishing conditions in the Arabian Sea may be favorable. Check local fishing zone predictions.',
    priority: 'info',
    isLocal: true,
    affectedRegions: ['Arabian Sea', 'Kerala Coast', 'Karnataka Coast', 'Goa Coast'],
    timestamp: '2 weeks ago',
    date: '10 AUG 2026',
    source: 'National Institute of Oceanography',
    readTime: '3 min read',
    imageUrl: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&w=800&q=80',
    isDemo: true
  }
];
