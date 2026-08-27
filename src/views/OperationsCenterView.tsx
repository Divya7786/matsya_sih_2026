import React, { useState } from 'react';
import { 
  Satellite, 
  Cpu, 
  Layers, 
  FileText, 
  Bookmark, 
  Activity, 
  ShieldCheck, 
  Download, 
  Printer, 
  Send, 
  Sparkles, 
  Compass, 
  Waves, 
  Leaf, 
  Wind, 
  Clock, 
  TrendingUp, 
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { UserProfile } from '../types/auth';
import { MOCK_SAVED_ANALYSES } from '../data/mockResearchData';
import { generateMarineReport, runAgentOrchestration } from '../services/api';
import { MarineIntelligenceReport, AgentOrchestrationResult } from '../types/marine';

interface OperationsCenterViewProps {
  user: UserProfile;
  onNavigate: (view: string) => void;
  onOpenVoiceModal: (query?: string) => void;
}

export const OperationsCenterView: React.FC<OperationsCenterViewProps> = ({
  user,
  onNavigate,
  onOpenVoiceModal
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'agent-console' | 'satellite-telemetry' | 'pfz-workbench' | 'anomaly-detective' | 'report-generator' | 'saved-analyses' | 'sources-health'
  >('overview');

  // Query state for Agent Console
  const [consoleQuery, setConsoleQuery] = useState(
    'Correlate INSAT-3DR thermal fronts with Oceansat-3 chlorophyll anomalies in the Coromandel shelf for the past 30 days.'
  );
  const [isExecutingConsole, setIsExecutingConsole] = useState(false);
  const [consoleResult, setConsoleResult] = useState<AgentOrchestrationResult | null>(null);

  // Report Generator State
  const [reportRegion, setReportRegion] = useState('Coromandel Coast (Tamil Nadu)');
  const [reportTimeframe, setReportTimeframe] = useState('Last 30 Days (Monsoon)');
  const [reportFocus, setReportFocus] = useState('Pelagic Fisheries Catch Disruption & Thermal Eddy Dynamics');
  const [generatedReport, setGeneratedReport] = useState<MarineIntelligenceReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleExecuteConsole = async () => {
    if (!consoleQuery.trim() || isExecutingConsole) return;
    setIsExecutingConsole(true);
    setConsoleResult(null);

    try {
      const res = await runAgentOrchestration(consoleQuery, 'en', {
        lat: 13.0827,
        lng: 80.2707,
        name: reportRegion
      });
      setConsoleResult(res);
    } catch (err) {
      console.error('Console execution failed:', err);
    } finally {
      setIsExecutingConsole(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const rep = await generateMarineReport({
        region: reportRegion,
        timeframe: reportTimeframe,
        datasets: ['INSAT-3DR SST', 'Oceansat-3 OCM-3', 'INCOIS SWAN', 'SARAL/AltiKa'],
        customFocus: reportFocus
      });
      setGeneratedReport(rep);
    } catch (err) {
      console.error('Report generation error:', err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="bg-[#F7F7F5] min-h-screen text-[#111111] flex flex-col">
      
      {/* Top Operations Header */}
      <div className="bg-[#111111] text-white border-b border-black px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Satellite className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm tracking-tight uppercase font-mono">
                  MATSYA AI Operations Center • ISRO & MoES Research Portal
                </h1>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-teal-900/60 text-teal-300 border border-teal-500/40">
                  {user.badge}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Scientist: <strong className="text-white">{user.name}</strong> ({user.organization}) • Clearance: <span className="font-mono text-emerald-400 font-bold">{user.clearanceLevel}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-neutral-300">INSAT-3DR: ACTIVE</span>
            </div>
            <button
              onClick={() => onNavigate('ocean')}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold transition flex items-center gap-1"
            >
              <span>3D Earth</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Operations Workspace Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Operations Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          <div className="bg-white rounded-2xl border border-[#E5E5E5] p-3 shadow-xs space-y-1 text-xs font-semibold">
            <div className="px-3 py-2 text-[10px] font-mono font-bold text-[#888888] uppercase tracking-wider border-b border-[#E5E5E5] mb-1">
              Operations Tools
            </div>

            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full p-2.5 rounded-xl text-left transition flex items-center gap-2.5 ${
                activeTab === 'overview' ? 'bg-[#111111] text-white shadow-xs' : 'text-[#555555] hover:bg-[#F7F7F5] hover:text-black'
              }`}
            >
              <Activity className="w-4 h-4 text-teal-400" />
              <span>Mission Telemetry Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('agent-console')}
              className={`w-full p-2.5 rounded-xl text-left transition flex items-center gap-2.5 ${
                activeTab === 'agent-console' ? 'bg-[#111111] text-white shadow-xs' : 'text-[#555555] hover:bg-[#F7F7F5] hover:text-black'
              }`}
            >
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Multi-Agent Query Console</span>
            </button>

            <button
              onClick={() => setActiveTab('anomaly-detective')}
              className={`w-full p-2.5 rounded-xl text-left transition flex items-center gap-2.5 ${
                activeTab === 'anomaly-detective' ? 'bg-[#111111] text-white shadow-xs' : 'text-[#555555] hover:bg-[#F7F7F5] hover:text-black'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Spatial-Temporal Detective</span>
            </button>

            <button
              onClick={() => setActiveTab('report-generator')}
              className={`w-full p-2.5 rounded-xl text-left transition flex items-center gap-2.5 ${
                activeTab === 'report-generator' ? 'bg-[#111111] text-white shadow-xs' : 'text-[#555555] hover:bg-[#F7F7F5] hover:text-black'
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Automated Intelligence Dossier</span>
            </button>

            <button
              onClick={() => setActiveTab('saved-analyses')}
              className={`w-full p-2.5 rounded-xl text-left transition flex items-center gap-2.5 ${
                activeTab === 'saved-analyses' ? 'bg-[#111111] text-white shadow-xs' : 'text-[#555555] hover:bg-[#F7F7F5] hover:text-black'
              }`}
            >
              <Bookmark className="w-4 h-4 text-emerald-400" />
              <span>My Saved Analyses ({user.savedAnalysesCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('sources-health')}
              className={`w-full p-2.5 rounded-xl text-left transition flex items-center gap-2.5 ${
                activeTab === 'sources-health' ? 'bg-[#111111] text-white shadow-xs' : 'text-[#555555] hover:bg-[#F7F7F5] hover:text-black'
              }`}
            >
              <Database className="w-4 h-4 text-blue-400" />
              <span>Sensor Health & Ingestion</span>
            </button>
          </div>

          {/* Quick Context Card */}
          <div className="bg-white rounded-2xl border border-[#E5E5E5] p-4 shadow-xs space-y-2 text-xs">
            <span className="font-bold text-[#111111] block">ISRO SAC Telemetry Feed</span>
            <p className="text-[11px] text-[#666666]">
              All rasters are cryptographically signed with 30-minute geostationary synchronization.
            </p>
          </div>
        </div>

        {/* Right Main Panel Content */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* TAB 1: MISSION TELEMETRY OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Telemetry Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
                <div className="p-4 bg-white rounded-2xl border border-[#E5E5E5] shadow-xs space-y-1">
                  <span className="text-[10px] text-[#888888] block">SATELLITE PASS</span>
                  <span className="text-base font-bold text-[#111111]">Oceansat-3</span>
                  <span className="text-[10px] text-emerald-700 font-bold block">Next in 42 mins</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-[#E5E5E5] shadow-xs space-y-1">
                  <span className="text-[10px] text-[#888888] block">THERMAL ANOMALY</span>
                  <span className="text-base font-bold text-amber-600">+1.2°C Dev</span>
                  <span className="text-[10px] text-[#666666] block">Coromandel Shelf</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-[#E5E5E5] shadow-xs space-y-1">
                  <span className="text-[10px] text-[#888888] block">CHLOROPHYLL PLUME</span>
                  <span className="text-base font-bold text-emerald-700">3.1 mg/m³</span>
                  <span className="text-[10px] text-[#666666] block">Active Upwelling</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-[#E5E5E5] shadow-xs space-y-1">
                  <span className="text-[10px] text-[#888888] block">IMBL INCIDENTS</span>
                  <span className="text-base font-bold text-[#111111]">0 Crossings</span>
                  <span className="text-[10px] text-teal-700 font-bold block">Geofences 100% Valid</span>
                </div>
              </div>

              {/* Active Anomalies & Observations Table */}
              <div className="p-6 bg-white rounded-2xl border border-[#E5E5E5] shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
                  <h3 className="font-bold text-sm text-[#111111]">
                    Active Synoptic Marine Anomalies (Indian EEZ)
                  </h3>
                  <span className="text-xs font-mono text-[#888888]">Updated Live 14:00 UTC</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950">Coromandel Coast (11.2°N, 80.5°E) - Positive SST Anomaly</span>
                      <span className="font-mono font-bold text-amber-800 text-[10px]">MONITORING</span>
                    </div>
                    <p className="text-amber-900 leading-relaxed">
                      SST anomaly of +1.2°C detected over a 30-day window. Mesoscale warm core eddy has displaced surface pelagic shoals (Rastrelliger kanagurta) seaward by 38 km.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950">Malabar Upwelling Corridor (9.9°N, 76.2°E) - High Biological Productivity</span>
                      <span className="font-mono font-bold text-emerald-800 text-[10px]">HIGH CATCH POTENTIAL</span>
                    </div>
                    <p className="text-emerald-900 leading-relaxed">
                      Ekman coastal pumping driven by southwest monsoon wind stress has concentrated high chlorophyll (3.1 mg/m³) within 18 NM of Kochi harbor.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: MULTI-AGENT QUERY CONSOLE */}
          {activeTab === 'agent-console' && (
            <div className="space-y-6">
              <div className="p-6 bg-white rounded-2xl border border-[#E5E5E5] shadow-xs space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-[#111111]">
                    Agentic Oceanographic Query & Telemetry Reasoner
                  </h3>
                  <p className="text-xs text-[#666666]">
                    Execute complex multi-parameter spatial queries using natural language or scientific parameters.
                  </p>
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={consoleQuery}
                    onChange={(e) => setConsoleQuery(e.target.value)}
                    placeholder="Enter scientific inquiry..."
                    className="w-full p-3 text-xs bg-[#F7F7F5] border border-[#E5E5E5] rounded-xl focus:outline-hidden focus:border-black font-mono text-[#111111]"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleExecuteConsole}
                      disabled={isExecutingConsole}
                      className="px-5 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-bold rounded-lg transition flex items-center gap-2"
                    >
                      {isExecutingConsole ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                      )}
                      <span>{isExecutingConsole ? 'Reasoning across 10 Agents...' : 'Execute Scientific Analysis'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {consoleResult && (
                <div className="p-6 bg-white rounded-2xl border border-[#E5E5E5] shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
                    <span className="font-bold text-xs font-mono uppercase text-[#111111]">
                      Agentic Synthesis Output
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-bold border border-teal-200">
                      {consoleResult.confidence}% Confidence
                    </span>
                  </div>

                  <div className="p-4 bg-[#F7F7F5] rounded-xl border border-[#E5E5E5] text-xs leading-relaxed whitespace-pre-line text-[#222222]">
                    {consoleResult.answer}
                  </div>

                  {/* Evidence Matrix */}
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-[#111111] block">Satellite Lineage & Evidence:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {consoleResult.evidence.map((ev, i) => (
                        <div key={i} className="p-3 bg-white rounded-lg border border-[#E5E5E5] space-y-1">
                          <span className="font-bold text-[#111111] block">{ev.dataset}</span>
                          <p className="text-[11px] text-[#555555]">{ev.observation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SPATIAL-TEMPORAL DETECTIVE */}
          {activeTab === 'anomaly-detective' && (
            <div className="p-6 bg-white rounded-2xl border border-[#E5E5E5] shadow-xs space-y-6">
              <div className="space-y-1 pb-3 border-b border-[#E5E5E5]">
                <h3 className="font-bold text-sm text-[#111111]">
                  Spatial-Temporal Anomaly Detective: 30-Day Fish Catch Decline
                </h3>
                <p className="text-xs text-[#666666]">
                  Cross-sensor investigation correlating thermal deviation, chlorophyll displacement, and coastal catch records.
                </p>
              </div>

              {/* Simulated Multi-Parameter Comparison Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-4 bg-[#F7F7F5] rounded-xl border border-[#E5E5E5] space-y-2">
                  <span className="text-[10px] text-[#888888] uppercase block">Parameter 1</span>
                  <h4 className="font-bold text-[#111111]">Sea Surface Temp (SST)</h4>
                  <div className="text-lg font-bold text-amber-600">+1.2°C Anomaly</div>
                  <p className="text-[11px] text-[#666666]">Warm-core eddy diverts nutrient upwelling offshore.</p>
                </div>

                <div className="p-4 bg-[#F7F7F5] rounded-xl border border-[#E5E5E5] space-y-2">
                  <span className="text-[10px] text-[#888888] uppercase block">Parameter 2</span>
                  <h4 className="font-bold text-[#111111]">Chlorophyll Plume Distance</h4>
                  <div className="text-lg font-bold text-indigo-600">38 km Offshore</div>
                  <p className="text-[11px] text-[#666666]">Pelagic feeding zone moved beyond traditional 12 NM zone.</p>
                </div>

                <div className="p-4 bg-[#F7F7F5] rounded-xl border border-[#E5E5E5] space-y-2">
                  <span className="text-[10px] text-[#888888] uppercase block">Outcome</span>
                  <h4 className="font-bold text-[#111111]">Catch Disruption</h4>
                  <div className="text-lg font-bold text-rose-600">-42% Inshore Catch</div>
                  <p className="text-[11px] text-[#666666]">Small artisanal crafts unable to reach deep-sea front without waypoints.</p>
                </div>
              </div>

              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-teal-950 block">MATSYA AI Multi-Agent Resolution:</span>
                <p className="text-teal-900 leading-relaxed">
                  The Route Optimization Agent calculated a certified waypoint corridor (Bearing 072°, 24 NM) enabling motorized crafts to safely reach the offshore thermal boundary with 35% fuel savings.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: REPORT GENERATOR */}
          {activeTab === 'report-generator' && (
            <div className="space-y-6">
              <div className="p-6 bg-white rounded-2xl border border-[#E5E5E5] shadow-xs space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-[#111111]">
                    Generate Certified Marine Intelligence Dossier
                  </h3>
                  <p className="text-xs text-[#666666]">
                    Produces a formal scientific report synthesizing INSAT-3DR, Oceansat-3, SWAN wave models, and socio-economic fisheries impact.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-[#111111]">Target Coastal Region</label>
                    <input
                      type="text"
                      value={reportRegion}
                      onChange={(e) => setReportRegion(e.target.value)}
                      className="w-full p-2 bg-[#F7F7F5] border border-[#E5E5E5] rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[#111111]">Temporal Window</label>
                    <input
                      type="text"
                      value={reportTimeframe}
                      onChange={(e) => setReportTimeframe(e.target.value)}
                      className="w-full p-2 bg-[#F7F7F5] border border-[#E5E5E5] rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-[#111111]">Custom Focus Topic</label>
                    <input
                      type="text"
                      value={reportFocus}
                      onChange={(e) => setReportFocus(e.target.value)}
                      className="w-full p-2 bg-[#F7F7F5] border border-[#E5E5E5] rounded-lg text-xs"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                  className="w-full py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-2"
                >
                  {isGeneratingReport ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-teal-400" />
                  )}
                  <span>{isGeneratingReport ? 'Compiling Dossier...' : 'Synthesize Official Dossier'}</span>
                </button>
              </div>

              {/* Generated Dossier Preview */}
              {generatedReport && (
                <div className="p-8 bg-white rounded-2xl border border-[#E5E5E5] shadow-md space-y-6 text-xs text-[#111111]">
                  <div className="flex items-start justify-between pb-4 border-b border-[#E5E5E5]">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-teal-800 tracking-wider">
                        OFFICIAL ISRO-MOES MARINE INTELLIGENCE ASSESSMENT
                      </span>
                      <h2 className="text-base font-bold text-[#111111] mt-1">{generatedReport.title}</h2>
                      <p className="text-[11px] text-[#666666] font-mono mt-0.5">
                        Report ID: {generatedReport.id} • Issued: {generatedReport.date} • Timeframe: {generatedReport.timeframe}
                      </p>
                    </div>

                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-[#F7F7F5] hover:bg-[#EFEFEA] border border-[#E5E5E5] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Dossier</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[#888888] font-mono">Executive Summary</h4>
                    <p className="text-[#333333] leading-relaxed text-justify">
                      {generatedReport.summary}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[#888888] font-mono">Key Oceanographic Findings</h4>
                    <ul className="space-y-1 list-disc list-inside text-[#444444]">
                      {generatedReport.findings.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-[#F7F7F5] rounded-xl border border-[#E5E5E5] space-y-1">
                    <h4 className="font-bold text-xs text-[#111111]">Fisheries & Community Advisory:</h4>
                    <p className="text-[#555555]">{generatedReport.fisheriesImplication}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SAVED ANALYSES */}
          {activeTab === 'saved-analyses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#111111]">
                  My Saved Investigations & Spatial Analyses
                </h3>
                <span className="text-xs font-mono text-[#888888]">{MOCK_SAVED_ANALYSES.length} Saved</span>
              </div>

              <div className="space-y-3">
                {MOCK_SAVED_ANALYSES.map((item) => (
                  <div key={item.id} className="p-5 rounded-2xl border border-[#E5E5E5] bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#111111]">{item.title}</span>
                      <span className="text-[10px] font-mono text-[#888888]">{item.date}</span>
                    </div>

                    <p className="text-xs text-[#555555]">{item.summary}</p>

                    <div className="flex flex-wrap gap-1.5">
                      {item.variables.map((v, i) => (
                        <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E5E5E5] text-[#444444]">
                          {v}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-[#F0F0F0] flex items-center justify-between text-xs">
                      <span className="text-[11px] font-mono text-teal-800">{item.region}</span>
                      <button
                        onClick={() => {
                          setConsoleQuery(item.query);
                          setActiveTab('agent-console');
                          handleExecuteConsole();
                        }}
                        className="font-bold text-[#111111] hover:underline flex items-center gap-1"
                      >
                        <span>Re-Run Query</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: SENSOR HEALTH */}
          {activeTab === 'sources-health' && (
            <div className="p-6 bg-white rounded-2xl border border-[#E5E5E5] shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-[#111111]">
                Earth Observation Pipeline & Ingestion Health Status
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-[#F7F7F5] rounded-xl border border-[#E5E5E5] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-bold">INSAT-3DR Geostationary Sounder (SAC)</span>
                  </div>
                  <span className="font-mono text-emerald-700">Latency: 14 mins (100% Granules)</span>
                </div>

                <div className="p-3 bg-[#F7F7F5] rounded-xl border border-[#E5E5E5] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-bold">Oceansat-3 Ocean Colour Monitor (OCM-3)</span>
                  </div>
                  <span className="font-mono text-emerald-700">Latency: 1.8 hrs (Orbit 4812 Valid)</span>
                </div>

                <div className="p-3 bg-[#F7F7F5] rounded-xl border border-[#E5E5E5] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-bold">INCOIS SWAN Numerical Wave Forecast</span>
                  </div>
                  <span className="font-mono text-emerald-700">Run: 12:00 UTC (120h Horizon)</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
