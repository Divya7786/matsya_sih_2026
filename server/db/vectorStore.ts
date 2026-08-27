export interface VectorDocument {
  id: string;
  title: string;
  region: string;
  variable: string;
  source: string;
  timestamp: string;
  coordinates?: { lat: number; lng: number };
  content: string;
  tags: string[];
  embedding: number[];
}

export interface VectorSearchResult {
  document: VectorDocument;
  score: number; // 0 to 1 cosine similarity
}

// Deterministic lightweight embedding generator using multi-hash semantic feature projecting
function generateTextEmbedding(text: string, dimensions: number = 32): number[] {
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const tokens = normalized.split(/\s+/).filter(t => t.length > 2);
  const vector = new Array(dimensions).fill(0);

  const keywords = [
    'sst', 'temperature', 'thermal', 'front', 'chlorophyll', 'upwelling', 'current',
    'salinity', 'wave', 'swell', 'wind', 'monsoon', 'cyclone', 'incois', 'isro',
    'oceansat', 'insat', 'copernicus', 'geofence', 'imbl', 'tuna', 'sardine', 'mackerel',
    'pelagic', 'bathymetry', 'ekman', 'eddy', 'anomaly', 'decline', 'catch', 'productivity', 'shelf'
  ];

  tokens.forEach((token, idx) => {
    // 1. Keyword projection
    const kwIdx = keywords.indexOf(token);
    if (kwIdx !== -1) {
      vector[kwIdx % dimensions] += 2.5;
    }

    // 2. Hash projection for general vocabulary
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }
    const dim = Math.abs(hash) % dimensions;
    vector[dim] += 1.0 / (1 + idx * 0.05);
  });

  // Normalize vector to unit length
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] /= magnitude;
    }
  }

  return vector;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return Math.max(0, Math.min(1, dotProduct / (Math.sqrt(magA) * Math.sqrt(magB))));
}

export class VectorKnowledgeStore {
  private documents: Map<string, VectorDocument> = new Map();

  constructor() {
    this.seedOceanographicKnowledge();
  }

  public insert(doc: Omit<VectorDocument, 'embedding'> & { embedding?: number[] }): VectorDocument {
    const embedding = doc.embedding || generateTextEmbedding(`${doc.title} ${doc.content} ${doc.tags.join(' ')}`);
    const fullDoc: VectorDocument = {
      ...doc,
      embedding,
    };
    this.documents.set(fullDoc.id, fullDoc);
    return fullDoc;
  }

  public search(
    query: string,
    filter?: { region?: string; variable?: string; tag?: string },
    limit: number = 4
  ): VectorSearchResult[] {
    const queryEmbedding = generateTextEmbedding(query);
    const results: VectorSearchResult[] = [];

    for (const doc of this.documents.values()) {
      if (filter) {
        if (filter.region && !doc.region.toLowerCase().includes(filter.region.toLowerCase()) && doc.region !== 'Global / All Indian Coasts') {
          continue;
        }
        if (filter.variable && !doc.variable.toLowerCase().includes(filter.variable.toLowerCase())) {
          continue;
        }
        if (filter.tag && !doc.tags.some(t => t.toLowerCase() === filter.tag!.toLowerCase())) {
          continue;
        }
      }

      const score = cosineSimilarity(queryEmbedding, doc.embedding);
      results.push({ document: doc, score });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  public getById(id: string): VectorDocument | undefined {
    return this.documents.get(id);
  }

  public getAll(): VectorDocument[] {
    return Array.from(this.documents.values());
  }

  private seedOceanographicKnowledge() {
    const seedDocs = [
      {
        id: 'doc-sst-front-01',
        title: 'Thermal Fronts and Pelagic Fish Aggregation in the Bay of Bengal',
        region: 'Coromandel Coast / Bay of Bengal',
        variable: 'Sea Surface Temperature',
        source: 'INCOIS PFZ Validation & ISRO SAC Mission Archives',
        timestamp: '2026-08-15T06:00:00Z',
        coordinates: { lat: 13.34, lng: 80.62 },
        content: 'Horizontal sea surface temperature gradients (>0.5°C per 5 km) create convergence zones where phytoplankton and zooplankton accumulate. Artisanal fishers targeting pelagic species like Sardinella longiceps and Rastrelliger kanagurta experience 2.4x higher Catch Per Unit Effort (CPUE) along the Coromandel shelf slope when SST fronts align with positive chlorophyll-a anomaly fringes.',
        tags: ['sst', 'thermal front', 'pfz', 'sardines', 'mackerel', 'pelagic', 'incois'],
      },
      {
        id: 'doc-upwelling-kerala-02',
        title: 'Southwest Monsoon Coastal Upwelling Dynamics along Malabar Coast',
        region: 'Kerala / Arabian Sea',
        variable: 'Chlorophyll & Currents',
        source: 'CMFRI & INCOIS Joint Monsoonal Oceanography Bulletin',
        timestamp: '2026-08-10T12:00:00Z',
        coordinates: { lat: 9.75, lng: 75.85 },
        content: 'Alongshore equatorward winds drive offshore Ekman transport, lifting sub-surface cold, nutrient-rich water (temperature 24-26°C, salinity >35.2 PSU) into the photic zone. Chlorophyll-a blooms frequently exceed 3.5 mg/m³. During active upwelling phases, pelagic fish shoals concentrate along the 30-60m isobath.',
        tags: ['upwelling', 'chlorophyll', 'malabar', 'kerala', 'ekman', 'productivity', 'cmfri'],
      },
      {
        id: 'doc-catch-decline-causal-03',
        title: 'Causal Attribution of Seasonal Marine Catch Fluctuations in Coromandel Waters',
        region: 'Coromandel Coast / Bay of Bengal',
        variable: 'Marine Ecology / Anomaly',
        source: 'MoES & Fishery Survey of India (FSI) Technical Report',
        timestamp: '2026-08-01T08:00:00Z',
        coordinates: { lat: 13.08, lng: 80.27 },
        content: 'Analysis of 10-year spatial-temporal records demonstrates that localized catch declines (>30%) are primarily driven by two coupled factors: 1) SST thermal warming anomalies (+1.0°C to +1.4°C) causing deepening of the thermocline and dispersion of shoals offshore; 2) Reduction of riverine/coastal nutrient discharge leading to localized chlorophyll-a deficit. Fishermen are advised to track offshore front migrations.',
        tags: ['decline', 'catch', 'anomaly', 'thermal anomaly', 'causal', 'productivity', 'fisheries'],
      },
      {
        id: 'doc-imbl-geofence-protocol-04',
        title: 'Standard Operating Procedures: Maritime Geofencing & Boundary Verification',
        region: 'Palk Bay / Gulf of Mannar',
        variable: 'Geospatial & Geofencing',
        source: 'Indian Coast Guard & Ministry of External Affairs Advisory',
        timestamp: '2026-07-20T00:00:00Z',
        coordinates: { lat: 9.25, lng: 79.4 },
        content: 'The International Maritime Boundary Line (IMBL) in Palk Strait and Gulf of Mannar is governed by bilateral treaties (1974 and 1976). MATSYA AI enforces a 3-tier boundary alert: 10 km warning buffer (CAUTION), 5 km proximity boundary (HIGH ALERT with audio siren), and 0 km line crossing (CRITICAL RESTRICTION). Mechanized vessels must maintain a safe starboard drift clear of sovereign coordinates.',
        tags: ['geofence', 'imbl', 'boundary', 'safety', 'coast guard', 'palk strait'],
      },
      {
        id: 'doc-wave-safety-swan-05',
        title: 'High Swell & Squall Wave Risk Classification for Coastal Craft',
        region: 'Global / All Indian Coasts',
        variable: 'Wave & Wind',
        source: 'INCOIS Ocean State Forecast (SWAN/WAVEWATCH III)',
        timestamp: '2026-08-20T04:00:00Z',
        content: 'Significant Wave Height (SWH) thresholds for artisanal fiberglass boats (FRP) and traditional catamarans: SWH < 1.5m is SAFE; 1.5m to 2.2m requires CAUTION with restricted payload; SWH > 2.2m or wind gusts > 40 km/h is HIGH RISK (no venture advisory). Swell periods exceeding 14 seconds produce hazardous plunging breakers in surf zones.',
        tags: ['wave', 'swell', 'safety', 'swan', 'wind', 'squall', 'incois', 'craft limits'],
      },
      {
        id: 'doc-oceansat3-sensor-06',
        title: 'Oceansat-3 Ocean Colour Monitor (OCM-3) Validation for Indian Waters',
        region: 'Indian Ocean',
        variable: 'Satellite Remote Sensing',
        source: 'ISRO Space Applications Centre (SAC)',
        timestamp: '2026-08-18T10:00:00Z',
        content: 'Oceansat-3 OCM-3 provides 13 spectral bands covering 400 nm to 1010 nm at 360m spatial resolution. In-situ radiometric validation in the Arabian Sea and Bay of Bengal confirms chlorophyll retrieval accuracy within 15% root mean square error (RMSE), enabling accurate identification of coastal phytoplankton fronts and upwelling filaments.',
        tags: ['oceansat', 'isro', 'satellite', 'chlorophyll', 'ocm3', 'earth observation', 'sensors'],
      },
    ];

    for (const doc of seedDocs) {
      this.insert(doc);
    }
  }
}

export const globalVectorStore = new VectorKnowledgeStore();
