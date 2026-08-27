import React from 'react';
import { Globe, Mic, ShieldCheck } from 'lucide-react';
import { GlobalOceanGlobe } from '../components/GlobalOceanGlobe';
import { OceanVariable, MarineLocationData } from '../types/marine';

interface OceanViewProps {
  onNavigate?: (view: string) => void;
  onAskOrca?: (location: MarineLocationData, variable: OceanVariable) => void;
  onAskMatsya?: (location: MarineLocationData, variable: OceanVariable) => void;
  onOpenVoiceModal: (query?: string) => void;
  initialVariable?: OceanVariable;
}

export const OceanView: React.FC<OceanViewProps> = ({
  onNavigate,
  onAskOrca,
  onAskMatsya,
  onOpenVoiceModal,
  initialVariable = 'temperature',
}) => {
  const handleAsk = (loc: MarineLocationData, v: OceanVariable) => {
    const query = `Analyze ocean location at ${loc.latitude.toFixed(4)}°N, ${loc.longitude.toFixed(4)}°E — SST: ${loc.temperature}°C, Chl-a: ${loc.chlorophyll} mg/m³, Salinity: ${loc.salinity} PSU, Waves: ${loc.waveHeight}m, Wind: ${loc.windSpeed} km/h`;
    if (onAskMatsya) onAskMatsya(loc, v);
    else if (onAskOrca) onAskOrca(loc, v);
    else onOpenVoiceModal(query);
  };

  return (
    <div className="bg-[#020810] min-h-[calc(100vh-4rem)] flex flex-col text-white">

      {/* ── Dark scientific header ── */}
      <div className="bg-[#020d1a] border-b border-white/8 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center">
            <Globe className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-[11px] tracking-widest text-white uppercase font-mono">
                MATSYA AI — GLOBAL 3D OCEAN GIS
              </h1>
              <span className="text-[8px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                LIVE DATA
              </span>
            </div>
            <p className="text-[9px] text-neutral-500 font-mono">
              Multi-spectral ocean variables · Real-time from Copernicus Marine, NASA, INCOIS &amp; Open-Meteo
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenVoiceModal(
            'Analyze the current chlorophyll, sea surface temperature, and ocean current conditions across the Indian Ocean, Bay of Bengal, and Arabian Sea'
          )}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/30 text-teal-300 text-[10px] font-bold font-mono transition whitespace-nowrap"
        >
          <Mic className="w-3.5 h-3.5" />
          MATSYA AI Voice Analysis
        </button>
      </div>

      {/* ── Globe (fills remaining space) ── */}
      <div className="flex-1 relative w-full bg-[#020810]" style={{ minHeight: 'calc(100vh - 8rem)' }}>
        <GlobalOceanGlobe
          initialVariable={initialVariable}
          onAskMatsya={(loc, v) => handleAsk(loc, v)}
          onAskOrca={(loc, v) => handleAsk(loc, v)}
          onOpenVoiceModal={onOpenVoiceModal}
          onNavigate={onNavigate}
          isFullScreenDefault={false}
        />
      </div>
    </div>
  );
};
