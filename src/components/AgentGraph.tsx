import React from 'react';
import { 
  Bot, 
  Cpu, 
  Satellite, 
  Waves, 
  CloudSun, 
  Fish, 
  ShieldCheck, 
  Route, 
  Database, 
  Volume2, 
  CheckCircle2, 
  Sparkles, 
  Activity,
  Zap,
  BookOpen
} from 'lucide-react';
import { AgentExecutionStep } from '../types/marine';

interface AgentGraphProps {
  steps?: AgentExecutionStep[];
  isExecuting?: boolean;
  activeAgentName?: string;
  onSelectAgent?: (step: AgentExecutionStep) => void;
}

export const AgentGraph: React.FC<AgentGraphProps> = ({
  steps = [],
  isExecuting = false,
  activeAgentName,
  onSelectAgent,
}) => {
  const defaultAgents = [
    { name: 'planner', alias: ['planner'], label: 'Planner Agent', icon: Cpu, role: 'Intent decomposition & DAG task scheduling' },
    { name: 'satellite', alias: ['satellite', 'satelliteobservationagent'], label: 'Satellite Observation', icon: Satellite, role: 'INSAT-3DR SST & Oceansat-3 OCM-3 swaths' },
    { name: 'oceanPfz', alias: ['oceanpfz', 'ocean', 'pfz'], label: 'Ocean & PFZ Agent', icon: Fish, role: 'Thermal front & chlorophyll upwelling correlation' },
    { name: 'weatherSafety', alias: ['weathersafety', 'weather', 'risk'], label: 'Weather & Safety Agent', icon: CloudSun, role: 'SWAN wave height, wind gusts & squall risk' },
    { name: 'geofence', alias: ['geofence', 'geospatial'], label: 'Geofence Agent', icon: ShieldCheck, role: 'IMBL & Marine Protected Area boundary verification' },
    { name: 'weatherSafeRouting', alias: ['weathersaferouting', 'route'], label: 'Weather-Safe Routing', icon: Route, role: 'A* waypoint path avoiding shoals & anchorage' },
    { name: 'historicalAnalytics', alias: ['historicalanalytics', 'causal'], label: 'Historical Causal Agent', icon: Activity, role: '4-tier evidence anomaly decomposition' },
    { name: 'vectorKnowledge', alias: ['vectorknowledge', 'vector', 'knowledge'], label: 'Vector Knowledge Store', icon: BookOpen, role: 'Peer oceanographic literature & INCOIS bulletin retrieval' },
    { name: 'synthesisXai', alias: ['synthesisxai', 'evidence', 'synthesis'], label: 'Synthesis & XAI Agent', icon: Database, role: 'Multi-source evidence fusion & calibrated confidence' },
    { name: 'voiceAssistant', alias: ['voiceassistant', 'voice'], label: 'Multilingual Voice Agent', icon: Volume2, role: 'Tamil, Hindi, Telugu, Malayalam spoken output' },
  ];

  return (
    <div id="matsya-agentic-architecture" className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
              Demonstrable Multi-Agent AI Architecture
            </h3>
              <p className="text-[11px] text-[#555555]">
              MATSYA AI Orchestrator executes collaborative domain-specialist agents
            </p>
          </div>
        </div>

        {isExecuting ? (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-teal-50 text-teal-800 border border-teal-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping" />
            Agents Reasoning...
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Multi-Agent Pipeline Ready
          </span>
        )}
      </div>

      {/* Central Node Visual Flow */}
      <div className="relative mb-6 p-4 rounded-lg bg-[#F7F7F5] border border-[#E5E5E5] flex items-center justify-center">
        <div className="flex items-center gap-3 bg-[#111111] px-5 py-2.5 rounded-lg text-white shadow-sm border border-black">
          <Bot className="w-5 h-5 text-teal-400" />
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-300 block font-mono">Orchestrator Core</span>
            <span className="text-xs font-bold text-white">MATSYA AI Autonomous Multi-Agent Engine</span>
          </div>
        </div>
      </div>

      {/* Grid of Modular Sub-Agents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {defaultAgents.map((agent, index) => {
          const Icon = agent.icon;
          const stepMatch = steps.find((s) => {
            const sn = s.agentName.toLowerCase();
            return sn === agent.name.toLowerCase() || agent.alias.some(a => a.toLowerCase() === sn);
          });
          const isCompleted = stepMatch?.status === 'COMPLETED';
          const isRunning = isExecuting && (activeAgentName === agent.name || !steps.length);

          return (
            <div
              key={agent.name}
              id={`agent-node-${agent.name}`}
              onClick={() => stepMatch && onSelectAgent && onSelectAgent(stepMatch)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                isRunning
                  ? 'bg-teal-50/70 border-teal-400 shadow-sm scale-[1.01]'
                  : isCompleted
                  ? 'bg-emerald-50/40 border-emerald-300 hover:border-emerald-500'
                  : 'bg-[#F7F7F5] border-[#E5E5E5] hover:bg-white hover:border-[#111111]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={`p-1.5 rounded-md ${isRunning ? 'bg-teal-600 text-white' : 'bg-white border border-[#E5E5E5] text-[#111111]'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {isCompleted ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                    {stepMatch.durationMs}ms
                  </span>
                ) : isRunning ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-teal-100 text-teal-800 animate-pulse font-semibold">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] text-[#777777] font-mono">0{index + 1}</span>
                )}
              </div>

              <h4 className="text-xs font-semibold text-[#111111] truncate">{agent.label}</h4>
              <p className="text-[11px] text-[#555555] line-clamp-2 mt-0.5 leading-tight">
                {stepMatch?.summary || agent.role}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
