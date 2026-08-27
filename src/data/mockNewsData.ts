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
}

export const MOCK_MARINE_NEWS: MarineNewsItem[] = [
  {
    id: 'news-01',
    category: 'Satellite',
    headline: 'Oceansat-3 Ocean Colour Monitor Delivers Enhanced Coastal Chlorophyll Resolving at 360m',
    summary: 'ISRO and INCOIS scientists announce synchronized optical data streams allowing real-time detection of coastal upwelling plumes and pelagic feeding zones along the Indian coastline.',
    date: '22 AUG 2026',
    source: 'ISRO SAC Earth Observation Bulletin',
    readTime: '3 min read',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    isDemo: true
  },
  {
    id: 'news-02',
    category: 'Fisheries',
    headline: 'Coromandel Coastal Fishermen Report 35% Fuel Savings Using Autonomous PFZ Advisory Routing',
    summary: 'Pilot study across 450 artisanal craft operating from Kasimedu and Cuddalore highlights rapid adoption of multilingual voice advisories preventing fruitless deep-sea exploratory voyages.',
    date: '21 AUG 2026',
    source: 'National Fisheries Development Board',
    readTime: '4 min read',
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    isDemo: true
  },
  {
    id: 'news-03',
    category: 'Climate',
    headline: 'Bay of Bengal Mesoscale Eddy Dynamics Show 1.8°C SST Anomaly in Annual Ecosystem Assessment',
    summary: 'High-resolution GHRSST and INSAT-3DR thermal sounder telemetry confirms persistent warm-core circulation altering seasonal sardine migratory timing in the southern shelf.',
    date: '19 AUG 2026',
    source: 'Ministry of Earth Sciences (MoES)',
    readTime: '5 min read',
    imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80',
    isDemo: true
  },
  {
    id: 'news-04',
    category: 'Marine Safety',
    headline: 'Coast Guard Integrates Automated Geofence SAR Triggers Across Palk Strait Fishing Fleets',
    summary: 'Digital IMBL boundary geofencing successfully reduced unintentional international maritime boundary crossings by 92% over the last monsoon quarter.',
    date: '17 AUG 2026',
    source: 'Indian Coast Guard Operations',
    readTime: '3 min read',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
    isDemo: true
  },
  {
    id: 'news-05',
    category: 'Technology',
    headline: 'Agentic AI Orchestrator Bridges Multi-Sensor Space Rasters with Natural Regional Voice Dialects',
    summary: 'Autonomous reasoning graph combines SWAN wave forecasts, OCM-3 bio-optical algorithms, and local dialect speech synthesis to deliver zero-latency safety intelligence.',
    date: '14 AUG 2026',
    source: 'Global Ocean Informatics Journal',
    readTime: '6 min read',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    isDemo: true
  },
  {
    id: 'news-06',
    category: 'Research',
    headline: 'Deep Arabian Sea Upwelling Study Uncovers Deep Nutrient Surges Fueling Malabar Biodiversity',
    summary: 'Autonomous ocean glider transects and satellite altimetry reconstruct monsoon-driven subsurface vertical mixing supporting high pelagic biomass density.',
    date: '10 AUG 2026',
    source: 'National Institute of Oceanography (NIO)',
    readTime: '4 min read',
    imageUrl: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&w=800&q=80',
    isDemo: true
  }
];
