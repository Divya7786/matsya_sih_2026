import React, { useState } from 'react';
import { 
  Cpu, 
  Satellite, 
  Mic, 
  ShieldCheck, 
  Layers, 
  Compass, 
  Database, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Eye, 
  Code,
  Activity,
  Globe,
  Radio,
  Waves
} from 'lucide-react';

interface TechnologyViewProps {
  onNavigate: (view: string) => void;
  onOpenVoiceModal: (query?: string) => void;
}

interface AgentDetail {
  id: string;
  name: string;
  role: string;
  category: 'Planning' | 'Perception' | 'Risk & Routing' | 'Delivery';
  purpose: string;
  inputs: string[];
  algorithm: string;
  sampleOutput: string;
  confidence: number;
}

const AGENTS_LIST: AgentDetail[] = [
  {
    id: 'planner',
    name: 'MATSYA Orchestrator (Planner Agent)',
    role: 'Decomposes complex human questions into multi-agent sub-goals',
    category: 'Planning',
    purpose: 'Interprets user intent in colloquial marine vernacular, establishes hypotheses, and coordinates parallel agent execution.',
    inputs: ['Spoken audio waveform', 'Raw text prompt', 'User GPS coordinate', 'Device context'],
    algorithm: 'Chain-of-Thought DAG Scheduler with recursive dependency resolution',
    sampleOutput: 'Sub-goals created: 1. Ingest OCM-3 chlorophyll; 2. Check SWAN wave height; 3. Validate IMBL geofence.',
    confidence: 98,
  },
  {
    id: 'ocean',
    name: 'Ocean Dynamics Agent',
    role: 'Retrieves multi-spectral SST, salinity, and bathymetry',
    category: 'Perception',
    purpose: 'Queries INSAT-3DR thermal radiometers and HYCOM 3D hydrodynamic models to detect ocean thermocline variations.',
    inputs: ['INSAT-3DR Infrared Bands', 'GHRSST Level 4', 'GEBCO Bathymetry'],
    algorithm: 'Thermal gradient edge-detection filter with cloud-mask filtering',
    sampleOutput: 'Detected coastal thermal front at 11.24°N, 80.45°E with ΔT = 1.4°C / 5 km.',
    confidence: 95,
  },
  {
    id: 'weather',
    name: 'Weather & Squall Agent',
    role: 'Evaluates wind vectors, convective storms, and precipitation',
    category: 'Perception',
    purpose: 'Monitors OSCAT-3 scatterometer wind vectors and convective storm clusters to alert against sudden monsoon squalls.',
    inputs: ['Oceansat-3 OSCAT-3 Swaths', 'INSAT-3DR Water Vapor Channel', 'IMD Radar Doppler'],
    algorithm: 'Deep convective storm cell tracking with 3-hour vector extrapolation',
    sampleOutput: 'Sustained winds 22 km/h SW → NE; localized squall cell 18 km east moving at 12 knots.',
    confidence: 94,
  },
  {
    id: 'pfz',
    name: 'PFZ Synthesis Agent',
    role: 'Fuses thermal-optical fronts for pelagic fish aggregations',
    category: 'Risk & Routing',
    purpose: 'Correlates chlorophyll bloom plumes (OCM-3) with thermal fronts to pinpoint feeding zones for pelagics.',
    inputs: ['OCM-3 Chlorophyll-a', 'INSAT-3DR SST', 'Historical CMFRI Catch Baselines'],
    algorithm: 'Bio-optical gradient confluence matching calibrated against in-situ catches',
    sampleOutput: 'PFZ Match: Coromandel East Sector (Suitability: 94%, Depth: 34m, Distance: 24 km).',
    confidence: 96,
  },
  {
    id: 'geospatial',
    name: 'Geospatial Geofence Agent',
    role: 'Calculates proximity to international maritime borders & marine reserves',
    category: 'Risk & Routing',
    purpose: 'Computes geodesic distance to International Maritime Boundary Line (IMBL) and triggers buffer alerts.',
    inputs: ['UNCLOS Maritime Baselines', 'Survey of India IMBL Shapefiles', 'Marine Protected Area Polygons'],
    algorithm: 'Vincenty geodesic distance calculation with dynamic speed-of-advance buffer expansion',
    sampleOutput: 'Distance to Palk Bay IMBL: 6.8 km (Status: APPROACHING_BOUNDARY, Alert Buffer: 5 km).',
    confidence: 99,
  },
  {
    id: 'risk',
    name: 'Marine Risk & SWH Agent',
    role: 'Determines seaworthiness and wave hazard thresholds',
    category: 'Risk & Routing',
    purpose: 'Evaluates Significant Wave Height, breaker steepness, and wind shear against craft classification.',
    inputs: ['INCOIS Wavewatch-III', 'SWAN Coastal Wave Model', 'Craft Type (Artisanal vs Trawler)'],
    algorithm: 'Non-linear risk matrix evaluating wave steepness index H_s / L',
    sampleOutput: 'Risk Level: LOW (SWH: 0.9m, Swell: 7.2s). Safe for motorized fibreglass crafts.',
    confidence: 95,
  },
  {
    id: 'route',
    name: 'Route Optimization Agent',
    role: 'Generates collision-free, fuel-efficient nautical waypoints',
    category: 'Risk & Routing',
    purpose: 'Calculates turn-by-turn navigation waypoints guiding seafarers safely around shallow reefs and high swells.',
    inputs: ['Hydrographic Chart Obstructions', 'Real-time Wave Field', 'Destination Coordinates'],
    algorithm: 'Constrained A* Pathfinding on geodesic marine grid with bathymetric safety depth ≥ 5m',
    sampleOutput: 'Optimal route: 3 waypoints, Total 26.4 km, Estimated Fuel Savings: 32%.',
    confidence: 93,
  },
  {
    id: 'voice',
    name: 'Voice & Multilingual Agent',
    role: 'Synthesizes native dialect spoken guidance',
    category: 'Delivery',
    purpose: 'Generates zero-latency natural audio in Tamil, Hindi, Telugu, Malayalam, Kannada, Bengali, Odia, and English.',
    inputs: ['Fused Markdown Advisory', 'Selected Dialect', 'Audio Bitrate Constraint'],
    algorithm: 'Acoustic neural speech synthesis with maritime vocabulary phonetic dictionary',
    sampleOutput: 'Audio synthesized: "காசிமேடுக்கு வெளியே 24 கி.மீ தொலைவில் மீன் பிடிக்க சாதகமாக உள்ளது."',
    confidence: 97,
  }
];

export const TechnologyView: React.FC<TechnologyViewProps> = ({ onNavigate, onOpenVoiceModal }) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentDetail>(AGENTS_LIST[0]);

  return (
    <div className="bg-white min-h-screen text-[#111111] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        
        {/* Page Header */}
        <div className="space-y-3 pb-6 border-b border-[#E5E5E5]">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#F7F7F5] border border-[#E5E5E5] text-xs font-mono text-[#555555]">
            <Cpu className="w-3.5 h-3.5 text-teal-700" />
            <span>Agentic AI & Earth Observation Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
            Technology Behind MATSYA AI
          </h1>
          <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
            An autonomous multi-agent reasoning architecture engineered to fuse spaceborne remote sensing, 
            coastal numerical simulations, and dialect-specific speech processing into reliable marine decisions.
          </p>
        </div>

        {/* 1. END-TO-END ARCHITECTURE DIAGRAM */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#111111]">System Architecture & Data Flow</h2>
            <p className="text-xs text-[#666666]">
              From satellite downlink and numerical grids to multi-agent reasoning and explainable human delivery.
            </p>
          </div>

          <div className="p-6 bg-[#F7F7F5] rounded-2xl border border-[#E5E5E5] space-y-6">
            
            {/* Layer 1: Ingestion */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase text-[#888888] tracking-wider block">
                LAYER 1: MULTI-SOURCE EARTH OBSERVATION & OCEAN TELEMETRY
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-white rounded-lg border border-[#E5E5E5] text-center font-mono">
                  <Satellite className="w-4 h-4 text-teal-700 mx-auto mb-1" />
                  <span className="text-xs font-bold text-[#111111] block">INSAT-3DR</span>
                  <span className="text-[10px] text-[#666666]">Thermal SST (30m cadence)</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E5E5E5] text-center font-mono">
                  <Satellite className="w-4 h-4 text-emerald-700 mx-auto mb-1" />
                  <span className="text-xs font-bold text-[#111111] block">Oceansat-3 OCM</span>
                  <span className="text-[10px] text-[#666666]">360m Optical Chlorophyll</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E5E5E5] text-center font-mono">
                  <Waves className="w-4 h-4 text-blue-700 mx-auto mb-1" />
                  <span className="text-xs font-bold text-[#111111] block">INCOIS SWAN</span>
                  <span className="text-[10px] text-[#666666]">Numerical Wave Spectrum</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E5E5E5] text-center font-mono">
                  <ShieldCheck className="w-4 h-4 text-amber-700 mx-auto mb-1" />
                  <span className="text-xs font-bold text-[#111111] block">Maritime GIS</span>
                  <span className="text-[10px] text-[#666666]">IMBL & Marine Reserves</span>
                </div>
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="flex justify-center">
              <span className="text-xs font-mono font-bold text-[#888888] bg-white px-3 py-1 rounded-full border border-[#E5E5E5]">
                ↓ Ingested via Cloud Optimized GeoTIFF & NetCDF-4 Streams ↓
              </span>
            </div>

            {/* Layer 2: Orchestration & Agents */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase text-teal-800 tracking-wider block">
                LAYER 2: MATSYA AI AGENTIC REASONING & COLLABORATIVE NETWORK
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {AGENTS_LIST.slice(0, 4).map((agent) => (
                  <div key={agent.id} className="p-3 bg-white rounded-lg border border-[#E5E5E5]">
                    <span className="font-bold text-[#111111] block">{agent.name.split('(')[0]}</span>
                    <span className="text-[10px] text-[#666666]">{agent.role}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                {AGENTS_LIST.slice(4, 8).map((agent) => (
                  <div key={agent.id} className="p-3 bg-white rounded-lg border border-[#E5E5E5]">
                    <span className="font-bold text-[#111111] block">{agent.name.split('(')[0]}</span>
                    <span className="text-[10px] text-[#666666]">{agent.role}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="flex justify-center">
              <span className="text-xs font-mono font-bold text-[#888888] bg-white px-3 py-1 rounded-full border border-[#E5E5E5]">
                ↓ Evidence Fusion & Guardrail Safety Validation ↓
              </span>
            </div>

            {/* Layer 3: Delivery Interfaces */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase text-[#888888] tracking-wider block">
                LAYER 3: ADAPTIVE USER-CENTRIC INTERFACES
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-lg border border-[#E5E5E5] text-center">
                  <Globe className="w-4 h-4 text-teal-700 mx-auto mb-1" />
                  <span className="text-xs font-bold text-[#111111] block">3D WebGL Planetary Globe</span>
                  <span className="text-[10px] text-[#666666]">Visual multi-layer inspection</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E5E5E5] text-center">
                  <Mic className="w-4 h-4 text-teal-700 mx-auto mb-1" />
                  <span className="text-xs font-bold text-[#111111] block">Fisherman Voice Console</span>
                  <span className="text-[10px] text-[#666666]">8 Indian Dialects with zero latency</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#E5E5E5] text-center">
                  <Satellite className="w-4 h-4 text-teal-700 mx-auto mb-1" />
                  <span className="text-xs font-bold text-[#111111] block">ISRO Operations Workspace</span>
                  <span className="text-[10px] text-[#666666]">Automated intelligence dossiers</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 2. INTERACTIVE AGENT NETWORK INSPECTOR */}
        <section className="space-y-6 pt-6 border-t border-[#E5E5E5]">
          <div>
            <h2 className="text-xl font-bold text-[#111111]">Collaborative AI Agent Inspector</h2>
            <p className="text-xs text-[#666666]">
              Click on any specialized sub-agent to inspect its internal prompt logic, inputs, algorithms, and confidence thresholds.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Agent Selector List */}
            <div className="lg:col-span-5 space-y-2">
              {AGENTS_LIST.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    selectedAgent.id === agent.id
                      ? 'bg-[#111111] text-white border-black shadow-md'
                      : 'bg-[#F7F7F5] text-[#111111] border-[#E5E5E5] hover:bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{agent.name}</span>
                    </div>
                    <span className={`text-[10px] font-mono block mt-0.5 ${
                      selectedAgent.id === agent.id ? 'text-neutral-300' : 'text-[#666666]'
                    }`}>
                      {agent.category} • Confidence: {agent.confidence}%
                    </span>
                  </div>
                  <span className="text-xs font-mono opacity-80">→</span>
                </div>
              ))}
            </div>

            {/* Selected Agent Details Card */}
            <div className="lg:col-span-7 p-6 rounded-2xl border border-[#E5E5E5] bg-white space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-teal-800 tracking-wider">
                    {selectedAgent.category} Agent Specification
                  </span>
                  <h3 className="text-base font-bold text-[#111111] mt-0.5">{selectedAgent.name}</h3>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {selectedAgent.confidence}% Calibrated Accuracy
                </span>
              </div>

              {/* Purpose */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#111111] block">Operational Purpose:</span>
                <p className="text-xs text-[#555555] leading-relaxed">
                  {selectedAgent.purpose}
                </p>
              </div>

              {/* Inputs */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#111111] block">Data Inputs & Sensor Feeds:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAgent.inputs.map((inp, idx) => (
                    <span key={idx} className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E5] text-[#333333]">
                      {inp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Algorithm */}
              <div className="p-3 bg-[#F7F7F5] rounded-xl border border-[#E5E5E5] space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-[#888888] block">Underlying Algorithm</span>
                <p className="text-xs font-mono text-[#111111] font-semibold">{selectedAgent.algorithm}</p>
              </div>

              {/* Sample Output */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#111111] block">Real-world Execution Output:</span>
                <div className="p-3 bg-neutral-900 text-teal-300 font-mono text-xs rounded-xl border border-neutral-800">
                  {selectedAgent.sampleOutput}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onOpenVoiceModal(`Simulate execution for ${selectedAgent.name}`)}
                  className="px-4 py-2 bg-[#111111] text-white text-xs font-semibold rounded-lg hover:bg-black transition flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>Execute Agent Test Query</span>
                </button>
              </div>

            </div>

          </div>
        </section>

        {/* 3. EXPLAINABLE AI & EVIDENCE FUSION */}
        <section className="space-y-6 pt-6 border-t border-[#E5E5E5]">
          <div>
            <h2 className="text-xl font-bold text-[#111111]">Explainable AI & Grounding Principles</h2>
            <p className="text-xs text-[#666666]">
              Every recommendation output by MATSYA AI is strictly grounded with full sensor lineage and verifiable citations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-white rounded-xl border border-[#E5E5E5] space-y-2">
              <ShieldCheck className="w-5 h-5 text-teal-700" />
              <h3 className="font-bold text-xs text-[#111111]">Zero-Hallucination Policy</h3>
              <p className="text-xs text-[#555555] leading-relaxed">
                If sensor telemetry is older than 6 hours or cloud cover exceeds 85%, the system explicitly declares confidence degradation rather than generating fictitious advisories.
              </p>
            </div>

            <div className="p-5 bg-white rounded-xl border border-[#E5E5E5] space-y-2">
              <FileText className="w-5 h-5 text-indigo-700" />
              <h3 className="font-bold text-xs text-[#111111]">Evidence Fusion Matrix</h3>
              <p className="text-xs text-[#555555] leading-relaxed">
                All reasoning steps attach exact satellite sensor names, resolution metrics, observation timestamps, and mathematical anomaly deviations for auditability.
              </p>
            </div>

            <div className="p-5 bg-white rounded-xl border border-[#E5E5E5] space-y-2">
              <Radio className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-xs text-[#111111]">Human-in-the-Loop Safety</h3>
              <p className="text-xs text-[#555555] leading-relaxed">
                Critical alerts such as Cyclone warnings and IMBL boundary violations trigger instant high-priority audio interrupts with verified Coast Guard SAR protocols.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
