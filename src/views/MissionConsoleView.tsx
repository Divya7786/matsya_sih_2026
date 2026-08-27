import React, { useState } from 'react';
import { 
  Satellite, 
  Cpu, 
  Activity, 
  FileText, 
  Download, 
  Sparkles, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  RefreshCw, 
  TrendingUp, 
  SlidersHorizontal,
  Compass,
  Play,
  Send,
  Zap
} from 'lucide-react';
import { AgentGraph } from '../components/AgentGraph';
import { MarineIntelligenceReport, AgentOrchestrationResult } from '../types/marine';
import { DATA_SOURCES_METADATA, COASTAL_REGIONS } from '../data/mockMarineData';
import { runAgentOrchestration, generateMarineReport } from '../services/api';

export const MissionConsoleView: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('tamil_nadu');
  const [anomalyQuery, setAnomalyQuery] = useState<string>(
    'Analyze why fish catch has declined in this coastal sector over the last 30 days.'
  );
  const [isExecutingOrchestrator, setIsExecutingOrchestrator] = useState(false);
  const [orchestrationResult, setOrchestrationResult] = useState<AgentOrchestrationResult | null>(null);
  const [generatedReport, setGeneratedReport] = useState<MarineIntelligenceReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [activeTab, setActiveTab] = useState<'agents' | 'telemetry' | 'report' | 'anomaly'>('agents');

  // Trigger Multi-Agent Anomaly Diagnosis
  const handleRunAgentPipeline = async (queryText: string) => {
    setIsExecutingOrchestrator(true);
    const result = await runAgentOrchestration(queryText, 'en', {
      lat: 13.0827,
      lng: 80.2707,
      name: 'Bay of Bengal / Coromandel Shelf',
    });
    setOrchestrationResult(result);
    setIsExecutingOrchestrator(false);
  };

  // Trigger Automated Report Generation
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    const regionObj = COASTAL_REGIONS.find((r) => r.id === selectedRegion);
    const report = await generateMarineReport({
      region: regionObj?.name || 'Coromandel Coast / Bay of Bengal',
      timeframe: 'Last 30 Days (24 Jul - 22 Aug 2026)',
      datasets: ['INSAT-3DR SST', 'Oceansat-3 OCM-3 Chlorophyll', 'INCOIS Wavewatch-III', 'HYCOM Reanalysis'],
      customFocus: anomalyQuery,
    });
    setGeneratedReport(report);
    setIsGeneratingReport(false);
    setActiveTab('report');
  };

  return (
    <div id="matsya-mission-console-view" className="w-full max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Console Header */}
      <div className="bg-white border border-[#E5E5E5] rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-[#111111] text-white flex items-center justify-center shadow-sm">
            <Satellite className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#111111] tracking-tight">ISRO / Mission & Research Console</h1>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200">
                SIH26176 DIGITAL OCEAN
              </span>
            </div>
            <p className="text-xs text-[#555555]">
              Multi-Sensor Earth Observation raster telemetry & autonomous agent orchestration
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[#F7F7F5] p-1 rounded-lg border border-[#E5E5E5] text-xs">
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              activeTab === 'agents' ? 'bg-[#111111] text-white shadow-sm' : 'text-[#555555] hover:text-[#111111] hover:bg-white'
            }`}
          >
            Multi-Agent Graph
          </button>
          <button
            onClick={() => setActiveTab('anomaly')}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              activeTab === 'anomaly' ? 'bg-[#111111] text-white shadow-sm' : 'text-[#555555] hover:text-[#111111] hover:bg-white'
            }`}
          >
            Spatial-Temporal Detective
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              activeTab === 'telemetry' ? 'bg-[#111111] text-white shadow-sm' : 'text-[#555555] hover:text-[#111111] hover:bg-white'
            }`}
          >
            Sensor Telemetry
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              activeTab === 'report' ? 'bg-[#111111] text-white shadow-sm' : 'text-[#555555] hover:text-[#111111] hover:bg-white'
            }`}
          >
            Intelligence Reports
          </button>
        </div>
      </div>

      {/* Primary Tab: Multi-Agent AI Visualizer */}
      {activeTab === 'agents' && (
        <div className="space-y-6">
          {/* Agent Graph Component */}
          <AgentGraph
            steps={orchestrationResult?.steps}
            isExecuting={isExecutingOrchestrator}
          />

          {/* Interactive Agent Query & Trigger Strip */}
          <div className="p-5 rounded-xl bg-white border border-[#E5E5E5] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-2">
                <Cpu className="w-4 h-4 text-teal-700" />
                <span>Test Agentic Orchestration Pipeline</span>
              </span>
              <span className="text-[11px] text-[#666666] font-mono">Gemini Flash + Multi-Domain Sub-Agents</span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={anomalyQuery}
                onChange={(e) => setAnomalyQuery(e.target.value)}
                placeholder="Enter scientific oceanographic hypothesis or fisherman query..."
                className="flex-1 px-4 py-2.5 bg-[#F7F7F5] border border-[#E5E5E5] rounded-lg text-xs text-[#111111] placeholder-[#888888] focus:outline-none focus:border-[#111111] transition"
              />
              <button
                onClick={() => handleRunAgentPipeline(anomalyQuery)}
                disabled={isExecutingOrchestrator}
                className="px-5 py-2.5 bg-[#111111] hover:bg-black text-white font-medium text-xs rounded-lg flex items-center gap-2 shadow-sm disabled:opacity-50 transition"
              >
                {isExecutingOrchestrator ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                    <span>Executing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-teal-400" />
                    <span>Run Multi-Agent Pipeline</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Sample Benchmark Prompts */}
            <div className="flex flex-wrap gap-2 pt-1 text-xs">
              <span className="text-[#666666] text-[11px] py-1">Benchmark Scenarios:</span>
              {[
                'Why has fish catch declined in Tamil Nadu coastal shelf over 30 days?',
                'Synthesize PFZ recommendation with 12 NM geofence validation',
                'Evaluate cyclone squall wind risk and thermal front displacement',
              ].map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setAnomalyQuery(sample);
                    handleRunAgentPipeline(sample);
                  }}
                  className="px-3 py-1 bg-[#F7F7F5] border border-[#E5E5E5] hover:border-[#111111] hover:bg-white rounded-md text-[#333333] hover:text-[#111111] transition text-[11px]"
                >
                  {sample}
                </button>
              ))}
            </div>

            {/* Orchestration Execution Results & Evidence Fusion Matrix */}
            {orchestrationResult && (
              <div className="mt-4 p-4 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] text-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E5]">
                  <span className="font-bold text-[#111111] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-700" />
                    MATSYA AI Multi-Agent Synthesized Output
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Confidence: {orchestrationResult.confidence}%
                  </span>
                </div>

                <p className="text-sm text-[#222222] leading-relaxed">{orchestrationResult.answer}</p>

                {/* Evidence Matrix Table */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#555555] mb-2 font-mono">
                    Evidence Fusion Matrix
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-[#E5E5E5] rounded-lg overflow-hidden bg-white">
                      <thead className="bg-[#F7F7F5] text-[#555555] text-[10px] uppercase font-mono border-b border-[#E5E5E5]">
                        <tr>
                          <th className="p-2.5">Dataset</th>
                          <th className="p-2.5">Source Sensor</th>
                          <th className="p-2.5">Spatial Res</th>
                          <th className="p-2.5">Observation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E5] text-[#333333]">
                        {orchestrationResult.evidence.map((ev, i) => (
                          <tr key={i} className="hover:bg-[#F7F7F5]">
                            <td className="p-2.5 font-bold text-[#111111]">{ev.dataset}</td>
                            <td className="p-2.5 text-teal-700 font-medium">{ev.source}</td>
                            <td className="p-2.5 font-mono text-[11px] text-[#666666]">{ev.resolution}</td>
                            <td className="p-2.5">{ev.observation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Secondary Tab: Spatial-Temporal Anomaly Detective */}
      {activeTab === 'anomaly' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-white border border-[#E5E5E5] space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">Spatial-Temporal Detective</h3>
              <p className="text-xs text-[#555555]">
                Correlate long-term Earth Observation thermal and biological signatures to explain regional ecosystem shifts.
              </p>

              <div>
                <label className="text-[11px] text-[#666666] font-medium block mb-1">Target Coastal Sector</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F7F5] border border-[#E5E5E5] rounded-lg text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                >
                  {COASTAL_REGIONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-[#666666] font-medium block mb-1">Temporal Baseline Window</label>
                <select className="w-full px-3 py-2 bg-[#F7F7F5] border border-[#E5E5E5] rounded-lg text-xs text-[#111111]">
                  <option>Last 30 Days (24 Jul - 22 Aug 2026)</option>
                  <option>Seasonal Monsoon Baseline (Last 90 Days)</option>
                  <option>Interannual Comparison (2025 vs 2026)</option>
                </select>
              </div>

              <button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="w-full py-2.5 bg-[#111111] hover:bg-black text-white font-medium text-xs rounded-lg flex items-center justify-center gap-2 shadow-sm transition"
              >
                {isGeneratingReport ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                    <span>Synthesizing Deep Research...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-teal-400" />
                    <span>Generate Intelligence Briefing</span>
                  </>
                )}
              </button>
            </div>

            <div className="md:col-span-2 p-5 rounded-xl bg-white border border-[#E5E5E5] space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                Correlation Diagnostics: Thermal Anomaly vs Chlorophyll-a
              </h3>

              {/* Statistical Chart representation */}
              <div className="p-4 rounded-lg bg-[#F7F7F5] border border-[#E5E5E5] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#111111] font-bold">Coromandel Shelf 30-Day Trend</span>
                  <span className="text-amber-800 font-mono font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">+1.2°C SST Anomaly Detected</span>
                </div>

                {/* Visual bar graph representation */}
                <div className="h-32 flex items-end gap-2 pt-4">
                  {[45, 52, 60, 68, 75, 70, 58, 48, 38, 32, 28, 25].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-teal-600 hover:bg-teal-700 transition"
                        style={{ height: `${val}%` }}
                      />
                      <span className="text-[9px] text-[#666666] font-mono">W{idx + 1}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#666666] pt-2 border-t border-[#E5E5E5]">
                  <span>Chlorophyll Plume Density (mg/m³)</span>
                  <span className="text-teal-800 font-medium">Current Phase: Off-shelf offshore migration</span>
                </div>
              </div>

              <div className="p-3 bg-teal-50 rounded-lg border border-teal-200 text-xs text-teal-900 leading-relaxed">
                <strong>Scientific Finding:</strong> The localized decline in nearshore artisanal catch over the past 30 days is primarily driven by a <strong>+1.2°C positive sea surface temperature anomaly</strong> and offshore current divergence, which displaced pelagic shoals 45 km further east into the deep shelf.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Third Tab: Sensor Telemetry Metadata */}
      {activeTab === 'telemetry' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DATA_SOURCES_METADATA.map((src, idx) => (
            <div key={idx} className="p-5 rounded-xl bg-white border border-[#E5E5E5] shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E5]">
                <span className="font-bold text-[#111111] text-sm">{src.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  {src.freshness}
                </span>
              </div>

              <div className="space-y-1 text-xs text-[#333333]">
                <div>
                  <span className="text-[#666666] block text-[10px]">Sensor / Payload:</span>
                  <span className="font-medium text-teal-700">{src.source}</span>
                </div>
                <div>
                  <span className="text-[#666666] block text-[10px]">Spatial Resolution:</span>
                  <span className="font-mono text-[#555555]">{src.resolution}</span>
                </div>
                <div>
                  <span className="text-[#666666] block text-[10px]">Operational Status:</span>
                  <span className="text-emerald-700 font-semibold">{src.status}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E5E5E5] text-[11px] text-[#666666]">
                Last Observation: <span className="text-[#111111] font-mono font-medium">{src.updatedAt}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fourth Tab: Intelligence Reports */}
      {activeTab === 'report' && (
        <div className="p-6 rounded-xl bg-white border border-[#E5E5E5] shadow-sm space-y-6">
          {generatedReport ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 font-mono">
                    Official Intelligence Dossier
                  </span>
                  <h2 className="text-lg font-bold text-[#111111]">{generatedReport.title}</h2>
                  <p className="text-xs text-[#666666] font-mono">
                    ID: {generatedReport.id} • Date: {generatedReport.date} • {generatedReport.timeframe}
                  </p>
                </div>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#111111] hover:bg-black text-white rounded-lg text-xs font-medium flex items-center gap-2 transition shadow-sm"
                >
                  <Download className="w-4 h-4 text-teal-400" />
                  <span>Export Briefing (PDF)</span>
                </button>
              </div>

              {/* Executive Summary */}
              <div className="p-4 rounded-lg bg-[#F7F7F5] border border-[#E5E5E5] text-xs space-y-2">
                <h3 className="font-bold text-[#111111] uppercase tracking-wider text-[11px]">Executive Summary</h3>
                <p className="text-sm text-[#333333] leading-relaxed">{generatedReport.summary}</p>
              </div>

              {/* Findings */}
              <div className="space-y-2">
                <h3 className="font-bold text-[#111111] text-xs uppercase tracking-wider">Key Empirical Findings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {generatedReport.findings.map((f, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E5E5E5] text-xs text-[#333333]">
                      • {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Spatial-Temporal Insights */}
              <div className="p-4 rounded-lg bg-teal-50 border border-teal-200 text-xs space-y-2">
                <h3 className="font-bold text-teal-900 text-[11px] uppercase tracking-wider">
                  Ocean Dynamics & Fisheries Implications
                </h3>
                <p className="text-teal-950 leading-relaxed">{generatedReport.spatialTemporalInsights}</p>
                <div className="pt-2 flex items-center gap-4 font-mono text-[11px] text-teal-900">
                  <span>SST Anomaly: <strong className="text-amber-800">{generatedReport.sstAnomalyAvg}°C</strong></span>
                  <span>Chlorophyll Trend: <strong className="text-emerald-800">{generatedReport.chlorophyllTrend}</strong></span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <FileText className="w-12 h-12 text-[#999999] mx-auto" />
              <h4 className="text-base font-bold text-[#111111]">No Intelligence Dossier Generated Yet</h4>
              <p className="text-xs text-[#555555] max-w-md mx-auto">
                Generate an on-demand spatial-temporal assessment report for any coastal sector.
              </p>
              <button
                onClick={handleGenerateReport}
                className="px-5 py-2.5 bg-[#111111] hover:bg-black text-white rounded-lg text-xs font-medium shadow-sm transition"
              >
                Generate Coromandel Marine Assessment
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
