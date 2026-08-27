export interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  journal: string;
  category: 'Ocean Climate' | 'Fisheries' | 'Marine Biodiversity' | 'Earth Observation' | 'Artificial Intelligence' | 'Marine Safety';
  doi: string;
  abstract: string;
  keywords: string[];
  datasetsUsed: string[];
  downloadUrl?: string;
  citationsCount: number;
  isDemonstrationRecord: boolean;
}

export interface DatasetItem {
  id: string;
  name: string;
  category: 'Thermal' | 'Optical' | 'Hydrodynamic' | 'Atmospheric' | 'Altimetry' | 'Fisheries' | 'Geospatial';
  source: string;
  sensor: string;
  spatialResolution: string;
  temporalResolution: string;
  updateFrequency: string;
  coverage: string;
  format: string;
  lastUpdated: string;
  status: 'ACTIVE' | 'PROCESSING' | 'ARCHIVED';
  description: string;
  variables: string[];
}

export interface GlossaryTerm {
  term: string;
  category: string;
  definition: string;
  practicalApplication: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'General' | 'Fishermen' | 'ISRO & Science' | 'AI & Technology';
}

export const MOCK_RESEARCH_PAPERS: ResearchPaper[] = [
  {
    id: 'paper-01',
    title: 'Multi-Agent Autonomous Reasoning for Marine Front Detection Using Oceansat-3 and INSAT-3DR Telemetry',
    authors: ['Dr. A. R. Sharma', 'V. K. Narayanan', 'Dr. S. Mukherjee', 'ISRO Earth Observation Group'],
    year: 2026,
    journal: 'Journal of Indian Ocean Remote Sensing & Space Applications',
    category: 'Earth Observation',
    doi: '10.1016/j.jorssa.2026.04.012',
    abstract: 'This paper presents a collaborative multi-agent architecture (MATSYA AI) integrating thermal infrared channels from INSAT-3DR and optical chlorophyll-a retrievals from Oceansat-3 Ocean Colour Monitor (OCM-3). We demonstrate automated detection of mesoscale thermal fronts along the Coromandel Shelf with 94.2% spatial validation against in-situ ARGO profiling floats.',
    keywords: ['Thermal Fronts', 'Oceansat-3', 'INSAT-3DR', 'Agentic AI', 'Bay of Bengal'],
    datasetsUsed: ['Oceansat-3 OCM-3 Chlorophyll', 'INSAT-3DR SST Sounder', 'ARGO Floats'],
    citationsCount: 18,
    isDemonstrationRecord: true,
  },
  {
    id: 'paper-02',
    title: 'Spatio-Temporal Analysis of Positive Sea Surface Temperature Anomalies and Artisanal Fisheries Displacement in Tamil Nadu Shelf',
    authors: ['Dr. K. Jayaraman', 'P. Elango', 'Dr. M. S. Sundaram'],
    year: 2025,
    journal: 'Marine Ecology Progress Series & Coastal Management',
    category: 'Fisheries',
    doi: '10.3354/meps.2025.14820',
    abstract: 'Investigating a 30-day thermal deviation (+1.2°C) in the Coromandel coastal corridor, this study correlates spaceborne SST gradients with reported catches across 12 landing centers. Results show a seaward displacement of pelagic shoals (Rastrelliger kanagurta) by 38–45 km, underscoring the necessity of real-time multi-sensor waypoint guidance for small craft.',
    keywords: ['Pelagic Fisheries', 'SST Anomaly', 'Coromandel Coast', 'Fish Catch Trends'],
    datasetsUsed: ['GHRSST Multi-Scale L4', 'INCOIS PFZ Advisories', 'CMFRI Landing Data'],
    citationsCount: 29,
    isDemonstrationRecord: true,
  },
  {
    id: 'paper-03',
    title: 'Coupling SWAN Wave Models with Edge-Computed Geofencing for Artisanal Marine Safety in the Palk Bay Frontier',
    authors: ['Cmdr. R. V. Menon (Retd.)', 'Dr. T. Anand', 'B. Meenakshi'],
    year: 2026,
    journal: 'International Journal of Maritime Safety and Ocean Governance',
    category: 'Marine Safety',
    doi: '10.1080/ijmsog.2026.10938',
    abstract: 'Artisanal navigation in politically sensitive and ecologically fragile waters like the Palk Strait requires zero-latency boundary alerting. This paper validates edge-based geofence calculation coupled with numerical wave forecast models, eliminating false boundary alerts while safeguarding fishermen against treacherous breaker zones.',
    keywords: ['Geofencing', 'IMBL', 'Marine Safety', 'SWAN Wave Model', 'Palk Strait'],
    datasetsUsed: ['INCOIS Wavewatch-III', 'Survey of India Maritime Baselines', 'Coast Guard AIS'],
    citationsCount: 14,
    isDemonstrationRecord: true,
  },
  {
    id: 'paper-04',
    title: 'Mesoscale Eddy Dynamics and Bio-Optical Chlorophyll Plumes in Northern Arabian Sea During Southwest Monsoon',
    authors: ['Dr. S. Bhattacharya', 'N. Radhakrishnan', 'Dr. H. K. Patel'],
    year: 2025,
    journal: 'Ocean Science & Satellite Oceanography',
    category: 'Ocean Climate',
    doi: '10.5194/os-2025-88',
    abstract: 'High-energy cyclonic and anticyclonic eddies play a pivotal role in vertical nutrient pumping. Using altimetry-derived sea level anomalies (SLA) and multi-band ocean colour reflectance, we quantify nutrient enrichment pathways sustaining intense winter phytoplankton blooms in the Arabian Sea.',
    keywords: ['Mesoscale Eddies', 'Chlorophyll Plume', 'Arabian Sea', 'Altimetry'],
    datasetsUsed: ['SARAL/AltiKa SLA', 'Oceansat-3 OCM-3', 'HYCOM Ocean Reanalysis'],
    citationsCount: 42,
    isDemonstrationRecord: true,
  },
  {
    id: 'paper-05',
    title: 'Evaluating Speech-First Agentic User Interfaces for Low-Literacy Coastal Fishing Communities',
    authors: ['Prof. L. Venkatesh', 'S. Muthukrishnan', 'Dr. Deepa Nair'],
    year: 2026,
    journal: 'ACM Transactions on Accessible Computing & Human-Computer Interaction',
    category: 'Artificial Intelligence',
    doi: '10.1145/3648291.2026.11',
    abstract: 'Artisanal seafarers frequently operate under harsh maritime sunlight and salt spray where smartphone touchscreens are impractical. We evaluate a zero-latency native voice interaction layer supporting Tamil, Telugu, and Hindi dialects with 98.4% speech recognition accuracy in high-noise outboard motor environments.',
    keywords: ['Voice AI', 'Fisherman Assistance', 'Accessibility', 'Multilingual NLP'],
    datasetsUsed: ['MATSYA Voice Corpus', 'INCOIS Marine Bulletins'],
    citationsCount: 11,
    isDemonstrationRecord: true,
  },
  {
    id: 'paper-06',
    title: 'Decadal Assessment of Coral Bleaching Resilience in the Gulf of Mannar Biosphere Reserve',
    authors: ['Dr. P. Rajendran', 'A. Swaminathan', 'Dr. G. Mathews'],
    year: 2025,
    journal: 'Coral Reefs & Marine Biodiversity Conservation',
    category: 'Marine Biodiversity',
    doi: '10.1007/s00338-025-02410-z',
    abstract: 'Combining high-resolution thermal sounding datasets with scuba ground truthing, this paper tracks thermal stress accumulation (Degree Heating Weeks) across 21 islands in the Gulf of Mannar, identifying high-flow channels that provide thermal refugia to Acropora coral colonies.',
    keywords: ['Coral Bleaching', 'Gulf of Mannar', 'Degree Heating Weeks', 'Biodiversity'],
    datasetsUsed: ['NOAA Coral Reef Watch', 'INSAT-3DR SST', 'Field Transect Surveys'],
    citationsCount: 35,
    isDemonstrationRecord: true,
  }
];

export const MOCK_DATASETS: DatasetItem[] = [
  {
    id: 'ds-insat-3dr-sst',
    name: 'INSAT-3DR Sea Surface Temperature (SST)',
    category: 'Thermal',
    source: 'ISRO Space Applications Centre (SAC)',
    sensor: 'Sounder & Imager Infrared Radiometer',
    spatialResolution: '4.0 km (Geostationary)',
    temporalResolution: 'Every 30 Minutes',
    updateFrequency: 'Real-Time Stream',
    coverage: 'Indian Ocean Basin (40°E–110°E, 40°S–40°N)',
    format: 'HDF5 / GeoTIFF / NetCDF-4',
    lastUpdated: 'Live (Updated 14 mins ago)',
    status: 'ACTIVE',
    description: 'High-frequency thermal observations of surface skin temperature used for real-time thermal front calculation, cyclone intensification tracking, and marine heatwave monitoring.',
    variables: ['Skin Temperature', 'Thermal Front Gradient', 'Quality Flag'],
  },
  {
    id: 'ds-oceansat3-ocm3',
    name: 'Oceansat-3 Ocean Colour Monitor (OCM-3)',
    category: 'Optical',
    source: 'ISRO National Remote Sensing Centre (NRSC)',
    sensor: 'OCM-3 13-Band Optical Radiometer',
    spatialResolution: '360 Metres (Local Area Coverage)',
    temporalResolution: '2 Days Global Revisit',
    updateFrequency: 'Daily Ingestion',
    coverage: 'Indian Exclusive Economic Zone & Global Oceans',
    format: 'NetCDF-4 / Cloud-Optimized GeoTIFF',
    lastUpdated: 'Live (Updated 2 hours ago)',
    status: 'ACTIVE',
    description: '13-spectral-band bio-optical telemetry measuring spectral reflectance, Chlorophyll-a concentration, Total Suspended Matter (TSM), and Diffuse Attenuation Coefficient.',
    variables: ['Chlorophyll-a (mg/m³)', 'Total Suspended Matter', 'Photosynthetically Active Radiation'],
  },
  {
    id: 'ds-incois-swan',
    name: 'INCOIS Wavewatch-III & SWAN Coastal Wave Model',
    category: 'Hydrodynamic',
    source: 'Indian National Centre for Ocean Information Services',
    sensor: 'Numerical Wave Forecast + AltiKa Calibration',
    spatialResolution: '1.5 km Coastal / 9.0 km Deep Sea',
    temporalResolution: 'Hourly Forecast (120 Hour Horizon)',
    updateFrequency: 'Every 6 Hours',
    coverage: 'Arabian Sea, Bay of Bengal, Indian Ocean',
    format: 'GRIB2 / NetCDF-4',
    lastUpdated: 'Live (Updated 45 mins ago)',
    status: 'ACTIVE',
    description: 'Coupled Simulating Waves Nearshore (SWAN) models providing Significant Wave Height (SWH), primary swell period, wave direction, and hazardous breaker alerts.',
    variables: ['Significant Wave Height (m)', 'Peak Period (s)', 'Mean Wave Direction (°)', 'Swell Component'],
  },
  {
    id: 'ds-scat-wind',
    name: 'Oceansat-3 Scatterometer Ocean Surface Winds (OSCAT-3)',
    category: 'Atmospheric',
    source: 'ISRO SAC & EUMETSAT',
    sensor: 'Ku-Band Pencil Beam Scatterometer',
    spatialResolution: '12.5 km Swath Grid',
    temporalResolution: 'Daily Swath Coverage',
    updateFrequency: 'Every 3 Hours',
    coverage: 'Global Oceans & Coastal Margins',
    format: 'BUFR / NetCDF-4',
    lastUpdated: 'Live (Updated 1 hour ago)',
    status: 'ACTIVE',
    description: 'High-precision sea surface wind vector retrievals at 10m height above sea level, critical for artisanal small craft departure advisory and squall warnings.',
    variables: ['Wind Speed (m/s)', 'Wind Vector Direction', 'Wind Stress Curl'],
  },
  {
    id: 'ds-pfz-incois',
    name: 'Integrated Potential Fishing Zone (PFZ) Advisories',
    category: 'Fisheries',
    source: 'INCOIS / MoES & Department of Fisheries',
    sensor: 'Fused Multi-Sensor Thermal-Optical Processing',
    spatialResolution: 'Point Sectors + Polygon Corridors',
    temporalResolution: 'Daily Operational Run',
    updateFrequency: 'Every Morning at 04:30 UTC',
    coverage: 'Entire Indian Coastline (9 Coastal States & Islands)',
    format: 'GeoJSON / Vector Shapefile / CSV',
    lastUpdated: 'Live (Issued today 04:30 UTC)',
    status: 'ACTIVE',
    description: 'Scientifically validated fishing ground coordinates generated through SST gradient alignment and chlorophyll bloom confluence, validated by CMFRI field trials.',
    variables: ['Suitability Index (%)', 'Expected Pelagics', 'Bearing & Distance', 'Transit Safety'],
  },
  {
    id: 'ds-hycom-currents',
    name: 'HYCOM Global Ocean Circulation & Current Vectors',
    category: 'Hydrodynamic',
    source: 'Hybrid Coordinate Ocean Model / NCODA Assimilation',
    sensor: 'NCODA Assimilated Global Ocean Model',
    spatialResolution: '1/12° (~8 km)',
    temporalResolution: '3-Hourly Step',
    updateFrequency: 'Daily 00 UTC',
    coverage: 'Global Maritime Basins (Surface to 5000m)',
    format: 'OpenDAP / NetCDF-4',
    lastUpdated: 'Live (Updated today)',
    status: 'ACTIVE',
    description: '3D velocity vectors (u, v components), salinity profiles, and mixed layer depth representing major global circulation gyres and coastal boundary currents.',
    variables: ['Current Velocity (m/s)', 'Current Direction (°)', 'Salinity (PSU)', 'Mixed Layer Depth (m)'],
  },
  {
    id: 'ds-maritime-geofence',
    name: 'National Maritime Geofences & Boundaries Repository',
    category: 'Geospatial',
    source: 'Survey of India, Indian Coast Guard & National Hydrographic Office',
    sensor: 'High-Precision Hydrographic Chart Datums (WGS84)',
    spatialResolution: 'Vector Polygons (Decimetric Precision)',
    temporalResolution: 'Continuous Vector Datum',
    updateFrequency: 'On Notice-to-Mariners updates',
    coverage: 'India EEZ, IMBL, Marine Sanctuaries, Shipping Corridors',
    format: 'GeoJSON / TopoJSON',
    lastUpdated: 'Current (Verified 2026)',
    status: 'ACTIVE',
    description: 'Legally demarcated International Maritime Boundary Lines (IMBL), restricted military shooting ranges, marine national parks, and port approach channels.',
    variables: ['Boundary Type', 'Legal Reference', 'Warning Buffer Distance', 'Enforcement Agency'],
  }
];

export const MOCK_GLOSSARY: GlossaryTerm[] = [
  {
    term: 'Potential Fishing Zone (PFZ)',
    category: 'Fisheries & Earth Observation',
    definition: 'Ocean regions where oceanic processes like upwelling, eddies, and thermal fronts create ideal conditions for phytoplankton blooms, attracting forage fish and predatory pelagic species.',
    practicalApplication: 'Reduces search time for artisanal and commercial fishermen by 40-70%, directly decreasing diesel consumption and carbon emissions.'
  },
  {
    term: 'Sea Surface Temperature (SST)',
    category: 'Oceanography & Climate',
    definition: 'The water temperature close to the ocean surface, typically within the top few millimetres (skin SST measured by spaceborne radiometers) to the top few metres (bulk SST measured by buoys).',
    practicalApplication: 'Primary indicator for tracking thermal fronts, marine heatwaves, coral bleaching stress, and tropical cyclone intensification.'
  },
  {
    term: 'Significant Wave Height (SWH)',
    category: 'Marine Safety & Hydrodynamics',
    definition: 'The average height (trough to crest) of the highest one-third of waves in a given sea wave spectrum, closely matching what an experienced observer estimates visually.',
    practicalApplication: 'Used by coastal authorities and fishermen to determine if sea conditions are safe for artisanal non-motorized craft (<1.0m) or mechanized trawlers (<2.5m).'
  },
  {
    term: 'International Maritime Boundary Line (IMBL)',
    category: 'Maritime Law & Geofencing',
    definition: 'A legally defined boundary delimiting the sovereign territorial waters and Exclusive Economic Zone (EEZ) of adjacent maritime nations under UNCLOS.',
    practicalApplication: 'Integrated into MATSYA AI geofencing to trigger automated multilingual voice alerts when vessels approach within 5 km of international borders.'
  },
  {
    term: 'Chlorophyll-a Concentration',
    category: 'Marine Biology & Optics',
    definition: 'The primary photosynthetic pigment found in microscopic marine phytoplankton, measured optically by satellite radiometers through spectral water reflectance.',
    practicalApplication: 'Serves as a quantitative proxy for ocean biological productivity and the foundation of the marine food web.'
  },
  {
    term: 'Mesoscale Eddy',
    category: 'Physical Oceanography',
    definition: 'Swirling circular water masses spanning 10 to 100 km across that rotate clockwise or counter-clockwise, persisting for weeks to months.',
    practicalApplication: 'Cyclonic eddies pump cold, nutrient-rich deep water upward, creating high-productivity biological hot-spots detectable via altimetry.'
  },
  {
    term: 'Ekman Transport & Coastal Upwelling',
    category: 'Physical Oceanography',
    definition: 'The wind-driven net movement of surface water at 90 degrees to the wind direction due to the Coriolis effect, drawing nutrient-rich sub-surface water up to the sunlit layer.',
    practicalApplication: 'Triggers massive seasonal sardine and mackerel aggregations along the south-west and south-east coasts of India.'
  }
];

export const MOCK_FAQS: FAQItem[] = [
  {
    id: 'faq-01',
    category: 'General',
    question: 'What is MATSYA AI?',
    answer: 'MATSYA AI (Ocean Reasoning & Conversational Assistant) is an autonomous, agentic marine intelligence platform that bridges spaceborne Earth Observation telemetry, numerical ocean forecasts, and real-time human decision-making for fishermen, ocean scientists, and maritime authorities.'
  },
  {
    id: 'faq-02',
    category: 'Fishermen',
    question: 'How does Fisherman Mode work without internet at deep sea?',
    answer: 'MATSYA AI supports pre-departure voice caching and waypoint synchronization. In coastal zones (up to 12-15 nautical miles), it utilizes regional mobile networks and NavIC / VHF data broadcasts to provide live voice warnings in Tamil, Hindi, Telugu, Malayalam, and Kannada.'
  },
  {
    id: 'faq-03',
    category: 'ISRO & Science',
    question: 'Which satellite sensors are ingested into the platform?',
    answer: 'MATSYA AI directly processes rasters and swaths from INSAT-3DR (Thermal Sounder & Imager), Oceansat-3 (OCM-3 bio-optics and OSCAT-3 scatterometer wind vectors), SARAL/AltiKa altimetry, and INCOIS SWAN numerical wave model runs.'
  },
  {
    id: 'faq-04',
    category: 'AI & Technology',
    question: 'How do the collaborative AI agents work together?',
    answer: 'Rather than a monolithic chatbot, MATSYA AI orchestrates 10 specialized sub-agents (Planner, Ocean, Weather, PFZ, Geospatial, Risk, Route, Voice, Visualization, Reporting). When a query is submitted, the Planner breaks it down, dispatches tasks in parallel, and fuses the evidence into an explainable, cited recommendation.'
  },
  {
    id: 'faq-05',
    category: 'ISRO & Science',
    question: 'How can researchers and ISRO scientists access raw datasets?',
    answer: 'Authorized research users can log into the MATSYA AI Operations Center via institutional credentials to execute spatial-temporal correlation queries, inspect full-resolution NetCDF/GeoTIFF rasters, and generate certified intelligence dossiers.'
  }
];

export const MOCK_SAVED_ANALYSES = [
  {
    id: 'saved-01',
    title: 'Coromandel Shelf Thermal Disruption 30-Day Analysis',
    date: '22 Aug 2026',
    region: 'Tamil Nadu Coast (11.2°N, 80.5°E)',
    variables: ['SST Anomaly (+1.2°C)', 'Chlorophyll-a', 'SWH'],
    summary: 'Identified offshore displacement of pelagic schools due to warm core eddy divergence.',
    query: 'Analyze why fish catch has declined in this coastal sector over the last 30 days.',
    reportId: 'REP-2026-0822-TN'
  },
  {
    id: 'saved-02',
    title: 'Palk Bay Geofence Crossing Prevention Audit',
    date: '18 Aug 2026',
    region: 'Palk Strait / IMBL Corridor',
    variables: ['IMBL Geofence', 'Tide Height', 'Wind Vector'],
    summary: 'Evaluated 1554 SAR response times and buffer alert efficacy across 450 artisanal crafts.',
    query: 'Evaluate risk of vessel straying across IMBL during SW monsoon squalls.',
    reportId: 'REP-2026-0818-PB'
  },
  {
    id: 'saved-03',
    title: 'Malabar Upwelling & Oil Sardine Bloom Forecast',
    date: '12 Aug 2026',
    region: 'Kerala Coast / Cochin Shelf',
    variables: ['Chlorophyll (3.1 mg/m³)', 'Ekman Pumping', 'Current Velocity'],
    summary: 'Favourable coastal upwelling detected between 9°N and 11°N with peak biomass predicted.',
    query: 'Synthesize PFZ recommendation with 12 NM geofence validation for Malabar shelf.',
    reportId: 'REP-2026-0812-KL'
  }
];
