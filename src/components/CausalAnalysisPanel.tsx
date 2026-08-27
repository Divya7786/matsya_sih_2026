import React, { useState } from 'react';
import { 
  Activity, 
  Database, 
  Sparkles, 
  TrendingDown, 
  BookOpen, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Waves, 
  Thermometer, 
  Search,
  ExternalLink
} from 'lucide-react';
import { HistoricalCausalReport } from '../types/marine';
import { analyzeHistoricalCausalDecomposition } from '../services/api';

interface CausalAnalysisPanelProps {
  initialRegion?: string;
  onClose?: () => void;
}

export const CausalAnalysisPanel: React.FC<CausalAnalysisPanelProps> = ({ 
  initialRegion = 'Coromandel Coast / Bay of Bengal', 
  onClose 
}) => {
  const [region, setRegion] = useState<string>(initialRegion);
  const [customQuery, setCustomQuery] = useState<string>('Why has fish catch declined in this coastal zone over the last 30 days?');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [report, setReport] = useState<HistoricalCausalReport | null>(null);

  const handleRunAnalysis = async () => {
    setIsLoading(true);
    const res = await analyzeHistoricalCausalDecomposition({
      query: customQuery,
      region,
      timeframe: 'Last 30 Days (vs 5-Year Baseline)',
    });
    setReport(res);
    setIsLoading(false);
  };

  React.useEffect(() => {
    handleRunAnalysis();
  }, [region]);

  return (
    <div id="causal-analysis-panel" className="bg-white rounded-2xl border border-[#E5E5E5] p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider">
                Historical Causal Analytics & Explainability (XAI)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-purple-50 text-purple-800 border border-purple-200">
                4-TIER EVIDENCE MODEL
              </span>
            </div>
            <p className="text-xs text-[#555555]">
              Decomposes ocean anomalies into observed sensor data, statistical correlations, physical drivers & AI forecasts
            </p>
          </div>
        </div>

        {onClose && (
          <button 
            onClick={onClose}
            className="text-xs text-[#777777] hover:text-[#111111] px-3 py-1.5 rounded-lg border border-[#E5E5E5] hover:bg-[#F7F7F5] transition"
          >
            Close Panel
          </button>
        )}
      </div>

      {/* Query Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-3" />
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="Ask a historical or causal oceanography question..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#F7F7F5] border border-[#E5E5E5] rounded-xl text-xs text-[#111111] focus:outline-hidden focus:border-black transition font-medium"
          />
        </div>
        <button
          onClick={handleRunAnalysis}
          disabled={isLoading}
          className="px-5 py-2.5 bg-[#111111] hover:bg-black text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow-xs disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Sparkles className="w-4 h-4 text-teal-400 animate-spin" />
              <span>Analyzing Tiers...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Run Causal Decomposition</span>
            </>
          )}
        </button>
      </div>

      {/* Primary Finding Banner */}
      {report && (
        <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 space-y-2">
          <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
            <Sparkles className="w-4 h-4 text-teal-700" />
            <span>Primary Causal Attribution Finding</span>
          </div>
          <p className="text-xs text-teal-950 leading-relaxed font-medium">
            {report.primaryFinding}
          </p>
        </div>
      )}

      {/* 4-Tier Causal Decomposition Grid */}
      {report && (
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-700" />
            <span>Rigorous 4-Tier Scientific Evidence Chain</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.evidenceTiers.map((tier, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-xl border border-[#E5E5E5] bg-[#FDFDFD] space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#EEEEEE]">
                  <span className="font-bold text-xs text-[#111111]">{tier.title}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#F0F0F0] text-[#444444]">
                    Tier 0{idx + 1}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {tier.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="p-2.5 rounded-lg bg-white border border-[#EBEBEB] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#111111]">{item.title}</span>
                        {item.metricValue && (
                          <span className="font-mono text-[11px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                            {item.metricValue}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#444444] leading-relaxed">
                        {item.statement}
                      </p>
                      <div className="pt-1 flex items-center justify-between text-[10px] text-[#777777] font-mono">
                        <span>Source: {item.dataSource}</span>
                        <span className="text-emerald-700 font-semibold">{item.confidencePercent}% Confidence</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Peer Literature & Recommendations Footer */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Retrieved Literature */}
          <div className="p-4 rounded-xl bg-[#F7F7F5] border border-[#E5E5E5] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#111111]">
              <BookOpen className="w-4 h-4 text-teal-700" />
              <span>Corroborating Peer Oceanographic Literature</span>
            </div>
            <div className="space-y-2">
              {report.retrievedScientificLiterature.map((lit, lIdx) => (
                <div key={lIdx} className="p-2 bg-white rounded-lg border border-[#E5E5E5] text-[11px] space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#111111] truncate">{lit.title}</span>
                    <span className="text-[10px] font-mono text-teal-700 font-bold">{lit.relevanceScore}% Match</span>
                  </div>
                  <span className="text-[10px] text-[#777777] block font-mono">{lit.source}</span>
                  <p className="text-[11px] text-[#555555] line-clamp-2">{lit.excerpt}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Fishery Mitigation Advice */}
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Actionable Operational Recommendations</span>
            </div>
            <ul className="space-y-2 text-xs text-emerald-950">
              {report.mitigationAndFisheryAdvice.map((adv, aIdx) => (
                <li key={aIdx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
