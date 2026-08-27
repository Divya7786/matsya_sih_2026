import React, { useState } from 'react';
import { 
  Globe, 
  Layers, 
  MapPin, 
  Sparkles, 
  Mic, 
  Compass, 
  Info, 
  Download, 
  Maximize2,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { GlobalOceanGlobe } from '../components/GlobalOceanGlobe';
import { OceanVariable, MarineLocationData } from '../types/marine';
import { COASTAL_REGIONS } from '../data/mockMarineData';

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
  initialVariable = 'chlorophyll',
}) => {
  const [selectedVar, setSelectedVar] = useState<OceanVariable>(initialVariable);

  const handleAsk = (loc: MarineLocationData, v: OceanVariable) => {
    const formattedQuery = `Analyze the selected ocean location:
Latitude: ${loc.latitude.toFixed(4)}
Longitude: ${loc.longitude.toFixed(4)}
SST: ${loc.temperature} °C
Salinity: ${loc.salinity} PSU
Wave Height: ${loc.waveHeight} m
Chlorophyll: ${loc.chlorophyll} mg/m³`;

    if (onAskMatsya) {
      onAskMatsya(loc, v);
    } else if (onAskOrca) {
      onAskOrca(loc, v);
    } else {
      onOpenVoiceModal(formattedQuery);
    }
  };

  return (
    <div className="bg-white min-h-[calc(100vh-4rem)] flex flex-col text-[#111111]">
      
      {/* Top Scientific Toolbar */}
      <div className="bg-[#F7F7F5] border-b border-[#E5E5E5] px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#111111] text-white flex items-center justify-center font-bold">
            <Globe className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm tracking-tight text-[#111111] uppercase font-mono">
                MATSYA AI — Global 3D Ocean GIS
              </h1>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                LIVE ORBIT INGESTION
              </span>
            </div>
            <p className="text-[11px] text-[#666666]">
              Interactive Scientific Earth • Multi-spectral spatial resolution calibrated to Copernicus Marine & ISRO Oceansat-3
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenVoiceModal('Analyze the current chlorophyll, temperature, and current conditions across Indian coastline and global oceans')}
            className="px-3 py-1.5 bg-[#111111] hover:bg-black text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-xs"
          >
            <Mic className="w-3.5 h-3.5 text-teal-400" />
            <span>MATSYA AI Voice Analysis</span>
          </button>
        </div>
      </div>

      {/* Main 3D Interactive Container */}
      <div className="flex-1 relative w-full h-[calc(100vh-10rem)] min-h-[580px] bg-[#111111]">
        <GlobalOceanGlobe 
          initialVariable={selectedVar}
          onAskMatsya={(loc, v) => handleAsk(loc, v)}
          onAskOrca={(loc, v) => handleAsk(loc, v)}
          onOpenVoiceModal={onOpenVoiceModal}
          onNavigate={onNavigate}
          isFullScreenDefault={false}
        />
      </div>

      {/* Explanatory Scientific Strip at Bottom */}
      <div className="bg-white border-t border-[#E5E5E5] px-4 sm:px-6 py-3 text-xs text-[#555555] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
          <span>Coordinate Reference: WGS 84 / World Mercator & Spherical Geodesic Projection</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="font-mono">Sensor: OCM-3, OSCAT-3, INSAT-3DR Imager/Sounder</span>
          <span className="text-[#CCCCCC]">|</span>
          <span className="text-teal-800 font-bold">Accuracy: ±0.15°C SST / ±0.08 mg/m³ Chl-a</span>
        </div>
      </div>

    </div>
  );
};
