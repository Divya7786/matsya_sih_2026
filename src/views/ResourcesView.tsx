import React, { useState } from 'react';
import { 
  Database, 
  BookOpen, 
  Code, 
  HelpCircle, 
  Search, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Copy, 
  FileText, 
  Layers, 
  Satellite, 
  Filter,
  Terminal,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { MOCK_DATASETS, MOCK_GLOSSARY, MOCK_FAQS, DatasetItem, GlossaryTerm } from '../data/mockResearchData';

interface ResourcesViewProps {
  onNavigate: (view: string) => void;
  onOpenVoiceModal: (query?: string) => void;
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({ onNavigate, onOpenVoiceModal }) => {
  const [activeTab, setActiveTab] = useState<'datasets' | 'glossary' | 'api' | 'faq'>('datasets');
  const [glossarySearch, setGlossarySearch] = useState<string>('');
  const [datasetFilter, setDatasetFilter] = useState<string>('All');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-01');

  const filteredDatasets = MOCK_DATASETS.filter((ds) => {
    return datasetFilter === 'All' || ds.category === datasetFilter;
  });

  const filteredGlossary = MOCK_GLOSSARY.filter((term) => {
    return (
      term.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
      term.definition.toLowerCase().includes(glossarySearch.toLowerCase()) ||
      term.category.toLowerCase().includes(glossarySearch.toLowerCase())
    );
  });

  const handleCopyCode = (id: string, codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const pythonSampleCode = `import requests

# Query MATSYA AI Marine Intelligence API for real-time PFZ & Ocean Telemetry
API_ENDPOINT = "https://api.matsya-marine.gov.in/v1/ocean/telemetry"
headers = {"Authorization": "Bearer YOUR_ISRO_MATSYA_TOKEN"}
params = {
    "lat": 13.0827,
    "lng": 80.2707,
    "variables": ["temperature", "chlorophyll", "waveHeight", "salinity"],
    "format": "geojson"
}

response = requests.get(API_ENDPOINT, headers=headers, params=params)
if response.status_code == 200:
    data = response.json()
    print("SST (°C):", data['properties']['temperature'])
    print("Chlorophyll-a (mg/m³):", data['properties']['chlorophyll'])
    print("PFZ Suitability Index:", data['properties']['pfzSuitabilityScore'])
`;

  return (
    <div className="bg-white min-h-screen text-[#111111] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        
        {/* Page Header */}
        <div className="space-y-3 pb-6 border-b border-[#E5E5E5]">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#F7F7F5] border border-[#E5E5E5] text-xs font-mono text-[#555555]">
            <Database className="w-3.5 h-3.5 text-teal-700" />
            <span>Open Earth Observation & Developer Resources</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
            MATSYA AI Data & Resources
          </h1>
          <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
            Direct access to satellite observation rasters, scientific oceanographic glossaries, 
            programmatic REST/GeoJSON APIs, and platform documentation.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex overflow-x-auto gap-2 border-b border-[#E5E5E5] pb-2 text-xs font-semibold scrollbar-none">
          <button
            onClick={() => setActiveTab('datasets')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'datasets' ? 'bg-[#111111] text-white shadow-xs' : 'bg-[#F7F7F5] text-[#555555] hover:text-black'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-teal-400" />
            <span>Marine Data Explorer ({MOCK_DATASETS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('glossary')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'glossary' ? 'bg-[#111111] text-white shadow-xs' : 'bg-[#F7F7F5] text-[#555555] hover:text-black'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Marine Glossary ({MOCK_GLOSSARY.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'api' ? 'bg-[#111111] text-white shadow-xs' : 'bg-[#F7F7F5] text-[#555555] hover:text-black'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-amber-400" />
            <span>API & Integration</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'faq' ? 'bg-[#111111] text-white shadow-xs' : 'bg-[#F7F7F5] text-[#555555] hover:text-black'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>FAQs & Help</span>
          </button>
        </div>

        {/* TAB 1: DATA EXPLORER */}
        {activeTab === 'datasets' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#111111]">
                  Spaceborne Rasters & Numerical Ocean Datasets
                </h2>
                <p className="text-xs text-[#666666]">
                  Calibrated satellite feeds from ISRO Space Applications Centre, INCOIS, and international altimetry missions.
                </p>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                {['All', 'Thermal', 'Optical', 'Hydrodynamic', 'Atmospheric', 'Fisheries', 'Geospatial'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setDatasetFilter(cat)}
                    className={`px-3 py-1 rounded-lg border transition ${
                      datasetFilter === cat
                        ? 'bg-[#111111] text-white border-black'
                        : 'bg-[#F7F7F5] text-[#555555] border-[#E5E5E5] hover:text-black'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredDatasets.map((ds) => (
                <div 
                  key={ds.id}
                  className="p-6 rounded-2xl border border-[#E5E5E5] bg-white space-y-4 hover:border-black hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                        {ds.category} SENSOR
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        {ds.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-[#111111]">
                      {ds.name}
                    </h3>

                    <p className="text-xs text-[#555555] leading-relaxed">
                      {ds.description}
                    </p>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-[#F7F7F5] p-3 rounded-xl border border-[#E5E5E5]">
                      <div>
                        <span className="text-[#888888] block text-[9px]">SOURCE</span>
                        <span className="text-[#111111] font-bold">{ds.source}</span>
                      </div>
                      <div>
                        <span className="text-[#888888] block text-[9px]">RESOLUTION</span>
                        <span className="text-[#111111] font-bold">{ds.spatialResolution}</span>
                      </div>
                      <div>
                        <span className="text-[#888888] block text-[9px]">UPDATE FREQUENCY</span>
                        <span className="text-[#111111]">{ds.updateFrequency}</span>
                      </div>
                      <div>
                        <span className="text-[#888888] block text-[9px]">FORMATS</span>
                        <span className="text-[#111111]">{ds.format}</span>
                      </div>
                    </div>

                    {/* Variables chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {ds.variables.map((v, i) => (
                        <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E5] text-[#444444]">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#F0F0F0] flex items-center justify-between text-xs font-semibold">
                    <span className="text-[11px] font-mono text-[#777777]">{ds.lastUpdated}</span>
                    <button 
                      onClick={() => onNavigate('ocean')}
                      className="text-teal-800 hover:underline flex items-center gap-1"
                    >
                      <span>Inspect on 3D Earth</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: MARINE GLOSSARY */}
        {activeTab === 'glossary' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#111111]">
                  Oceanographic & Remote Sensing Glossary
                </h2>
                <p className="text-xs text-[#666666]">
                  Standardized definitions bridging complex physical oceanography and practical artisanal fisheries usage.
                </p>
              </div>

              {/* Glossary Search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#888888] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={glossarySearch}
                  onChange={(e) => setGlossarySearch(e.target.value)}
                  placeholder="Search terms (e.g., Upwelling, SWH, IMBL)..."
                  className="w-full pl-9 pr-3 py-2 bg-[#F7F7F5] border border-[#E5E5E5] rounded-lg text-xs text-[#111111] focus:outline-hidden focus:border-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredGlossary.map((term, idx) => (
                <div key={idx} className="p-6 rounded-2xl border border-[#E5E5E5] bg-white space-y-3 hover:border-black transition">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-[#111111]">{term.term}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E5] text-[#666666]">
                      {term.category}
                    </span>
                  </div>

                  <p className="text-xs text-[#444444] leading-relaxed">
                    {term.definition}
                  </p>

                  <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1 text-xs">
                    <span className="font-bold text-teal-950 block text-[11px]">Practical Fishery & Safety Application:</span>
                    <p className="text-teal-900 leading-relaxed">
                      {term.practicalApplication}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: API & INTEGRATION */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#111111]">
                Developer REST & GeoJSON API Access
              </h2>
              <p className="text-xs text-[#666666]">
                Integrate MATSYA AI oceanographic reasoning and raster queries directly into your spatial workflows or field navigation applications.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Code Snippet Card */}
              <div className="lg:col-span-8 bg-[#111111] text-white rounded-2xl p-6 border border-neutral-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-teal-400" />
                    <span className="font-mono text-xs font-bold text-neutral-300">python_matsya_telemetry.py</span>
                  </div>
                  <button
                    onClick={() => handleCopyCode('python', pythonSampleCode)}
                    className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-mono text-neutral-300 flex items-center gap-1.5 transition"
                  >
                    {copiedSnippet === 'python' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippet === 'python' ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>

                <pre className="font-mono text-xs text-neutral-300 overflow-x-auto p-2 leading-relaxed">
                  <code>{pythonSampleCode}</code>
                </pre>
              </div>

              {/* Endpoints Documentation */}
              <div className="lg:col-span-4 space-y-3">
                <div className="p-4 bg-[#F7F7F5] rounded-xl border border-[#E5E5E5] space-y-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-teal-800">GET /v1/ocean/location</span>
                  <p className="text-xs text-[#555555]">
                    Fetches calibrated SST, salinity, chlorophyll, wave height, and IMBL distance for any latitude/longitude pair.
                  </p>
                </div>

                <div className="p-4 bg-[#F7F7F5] rounded-xl border border-[#E5E5E5] space-y-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-purple-800">POST /v1/agents/orchestrate</span>
                  <p className="text-xs text-[#555555]">
                    Executes multi-agent hypothesis decomposition with explainable evidence steps and synthesized speech audio.
                  </p>
                </div>

                <div className="p-4 bg-[#F7F7F5] rounded-xl border border-[#E5E5E5] space-y-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-800">GET /v1/pfz/active-zones</span>
                  <p className="text-xs text-[#555555]">
                    Streams verified Potential Fishing Zones vector polygons along Indian Exclusive Economic Zone.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: FAQS */}
        {activeTab === 'faq' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-xl font-bold text-[#111111]">
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-[#666666]">
                Everything you need to know about MATSYA AI, satellite ingestion frequencies, voice models, and access permissions.
              </p>
            </div>

            <div className="space-y-3">
              {MOCK_FAQS.map((faq) => (
                <div 
                  key={faq.id}
                  className="rounded-xl border border-[#E5E5E5] bg-white overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)}
                    className="w-full p-4 text-left font-bold text-xs text-[#111111] flex items-center justify-between hover:bg-[#F7F7F5] transition"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`w-4 h-4 text-[#888888] transition-transform ${openFaqId === faq.id ? 'rotate-180' : ''}`} />
                  </button>

                  {openFaqId === faq.id && (
                    <div className="p-4 pt-0 text-xs text-[#555555] leading-relaxed border-t border-[#F0F0F0] bg-[#F7F7F5]/50">
                      <p className="pt-2">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
