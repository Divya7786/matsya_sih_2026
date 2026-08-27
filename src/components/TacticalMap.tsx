import React, { useState, useEffect } from 'react';
import {
  Navigation,
  ShieldAlert,
  MapPin,
  Compass,
  Eye,
  Layers,
  Info,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Anchor,
  Wind,
  Waves
} from 'lucide-react';
import { PFZZone, GeofenceZone, RoutePlan } from '../types/marine';
import { MOCK_PFZ_ZONES, MOCK_GEOFENCES, MOCK_SAMPLE_ROUTES } from '../data/mockMarineData';
import { fetchMLPfzPredictions, MLPfzPrediction } from '../services/api';

interface TacticalMapProps {
  onSelectPFZ?: (pfz: PFZZone) => void;
  selectedPFZId?: string;
  activeRoute?: RoutePlan;
  showGeofences?: boolean;
  showWaveRisk?: boolean;
  centerLat?: number;
  centerLng?: number;
  onAskOrcaPFZ?: (pfz: PFZZone) => void;
  onAskMatsyaPFZ?: (pfz: PFZZone) => void;
  pfzZones?: PFZZone[];
  isLoading?: boolean;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  onSelectPFZ,
  selectedPFZId,
  activeRoute = MOCK_SAMPLE_ROUTES.chennai_to_pfz1,
  showGeofences = true,
  showWaveRisk = true,
  centerLat = 13.0827,
  centerLng = 80.2707,
  onAskOrcaPFZ,
  onAskMatsyaPFZ,
  pfzZones,
  isLoading = false,
}) => {
  const [activeLayer, setActiveLayer] = useState<'all' | 'pfz' | 'geofence' | 'route'>('all');
  const displayZones = pfzZones && pfzZones.length > 0 ? pfzZones : MOCK_PFZ_ZONES;
  const [inspectedPFZ, setInspectedPFZ] = useState<PFZZone | null>(displayZones[0]);
  const [mlPredictions, setMlPredictions] = useState<MLPfzPrediction[]>([]);
  const [selectedMLPfz, setSelectedMLPfz] = useState<MLPfzPrediction | null>(null);
  const [showMLLayer, setShowMLLayer] = useState(false);
  const [mlLoading, setMlLoading] = useState(false);

  useEffect(() => {
    if (pfzZones && pfzZones.length > 0) {
      setInspectedPFZ(pfzZones[0]);
    }
  }, [pfzZones]);

  useEffect(() => {
    if (showMLLayer && mlPredictions.length === 0) {
      setMlLoading(true);
      fetchMLPfzPredictions().then((data) => {
        if (data && data.predictions) {
          setMlPredictions(data.predictions);
        }
        setMlLoading(false);
      });
    }
  }, [showMLLayer]);

  // Coordinate projection helper to convert Lat/Lng to SVG Canvas X/Y
  // When ML layer is active, use wider Indian Ocean view; otherwise Coromandel view
  const minLat = showMLLayer ? 6.0 : 11.8;
  const maxLat = showMLLayer ? 24.0 : 14.5;
  const minLng = showMLLayer ? 65.0 : 79.6;
  const maxLng = showMLLayer ? 96.0 : 82.2;

  const toSvgX = (lng: number) => {
    return ((lng - minLng) / (maxLng - minLng)) * 750 + 25;
  };

  const toSvgY = (lat: number) => {
    return ((maxLat - lat) / (maxLat - minLat)) * 450 + 25;
  };

  return (
    <div id="matsya-tactical-map" className="relative w-full h-[520px] bg-[#F7F7F5] rounded-xl border border-[#E5E5E5] overflow-hidden shadow-sm flex flex-col select-none">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#E5E5E5] shadow-sm">
            <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium text-[#333333]">Fetching PFZ predictions...</span>
          </div>
        </div>
      )}
      {/* Top Map Action Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#E5E5E5] pointer-events-auto shadow-sm">
          <Anchor className="w-4 h-4 text-teal-600" />
          <span className="text-xs font-bold text-[#111111] uppercase tracking-wider">Tactical Marine GIS</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
            pfzZones && pfzZones.length > 0
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-teal-50 text-teal-800 border-teal-200'
          }`}>
            {pfzZones && pfzZones.length > 0 ? `${pfzZones.length} Live PFZ` : 'Baseline'}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-lg border border-[#E5E5E5] pointer-events-auto text-xs shadow-sm">
          <button
            onClick={() => setActiveLayer('all')}
            className={`px-2.5 py-1 rounded-md transition text-xs ${
              activeLayer === 'all' ? 'bg-[#111111] text-white font-medium' : 'text-[#555555] hover:text-[#111111]'
            }`}
          >
            All Layers
          </button>
          <button
            onClick={() => setActiveLayer('pfz')}
            className={`px-2.5 py-1 rounded-md transition text-xs ${
              activeLayer === 'pfz' ? 'bg-emerald-600 text-white font-medium' : 'text-[#555555] hover:text-[#111111]'
            }`}
          >
            PFZ Zones
          </button>
          <button
            onClick={() => setActiveLayer('geofence')}
            className={`px-2.5 py-1 rounded-md transition text-xs ${
              activeLayer === 'geofence' ? 'bg-rose-600 text-white font-medium' : 'text-[#555555] hover:text-[#111111]'
            }`}
          >
            Geofences / IMBL
          </button>
          <button
            onClick={() => setShowMLLayer(!showMLLayer)}
            className={`px-2.5 py-1 rounded-md transition text-xs ${
              showMLLayer ? 'bg-orange-600 text-white font-medium' : 'text-[#555555] hover:text-[#111111]'
            }`}
          >
            ML PFZ
          </button>
        </div>
      </div>

      {/* SVG Interactive Ocean Canvas */}
      <div className="w-full h-full flex-1 relative bg-[#EBF4F6]">
        <svg viewBox="0 0 800 500" className="w-full h-full">
          {/* Depth Contours / Bathymetry Grids */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(15, 118, 110, 0.08)" strokeWidth="1" />
            </pattern>
            {/* Wave Heatmap Gradients */}
            <radialGradient id="waveCalm" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.25)" />
              <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
            </radialGradient>
            <radialGradient id="pfzGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(13, 148, 136, 0.35)" />
              <stop offset="100%" stopColor="rgba(13, 148, 136, 0)" />
            </radialGradient>
          </defs>

          <rect width="800" height="500" fill="url(#grid)" />

          {/* Coastal Landmass (Western edge - Tamil Nadu Coast) */}
          <path
            d="M 0,0 L 160,0 L 175,70 L 190,140 L 195,220 L 180,310 L 170,390 L 155,500 L 0,500 Z"
            fill="#E2E8F0"
            stroke="#94A3B8"
            strokeWidth="1.5"
          />

          {/* Coastal settlements labels */}
          <text x="45" y="80" fill="#475569" fontSize="11" fontWeight="600" fontFamily="sans-serif">Pulicat Lake</text>
          <text x="60" y="210" fill="#0F172A" fontWeight="bold" fontSize="12" fontFamily="sans-serif">Chennai Harbour</text>
          <text x="45" y="320" fill="#475569" fontSize="11" fontWeight="600" fontFamily="sans-serif">Mahabalipuram</text>
          <text x="45" y="420" fill="#475569" fontSize="11" fontWeight="600" fontFamily="sans-serif">Kalpakkam</text>

          {/* 12 Nautical Mile Artisanal Fishing Boundary */}
          <path
            d="M 280,0 L 300,90 L 315,190 L 320,290 L 305,400 L 290,500"
            fill="none"
            stroke="#0284C7"
            strokeWidth="1.5"
            strokeDasharray="6,4"
            opacity="0.8"
          />
          <text x="310" y="480" fill="#0369A1" fontSize="10" fontWeight="600" fontFamily="sans-serif">12 NM Territorial Water Boundary</text>

          {/* International Maritime Boundary Line (IMBL) */}
          {(activeLayer === 'all' || activeLayer === 'geofence') && (
            <g>
              <line x1="450" y1="420" x2="780" y2="480" stroke="#E11D48" strokeWidth="2.5" strokeDasharray="8,5" />
              <rect x="520" y="435" width="220" height="24" rx="4" fill="rgba(255, 255, 255, 0.95)" stroke="#E11D48" strokeWidth="1" />
              <text x="530" y="451" fill="#BE123C" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                ⚠ IMBL Restricted Boundary (Sri Lanka)
              </text>
            </g>
          )}

          {/* Safe Navigational Route Waypoint Line */}
          {activeRoute && (activeLayer === 'all' || activeLayer === 'route') && (
            <g>
              {/* Waypoint Polyline */}
              <polyline
                points={activeRoute.waypoints.map((wp) => `${toSvgX(wp.lng)},${toSvgY(wp.lat)}`).join(' ')}
                fill="none"
                stroke="#059669"
                strokeWidth="3"
                strokeDasharray="4,2"
              />

              {/* Waypoint Nodes */}
              {activeRoute.waypoints.map((wp, idx) => (
                <circle
                  key={idx}
                  cx={toSvgX(wp.lng)}
                  cy={toSvgY(wp.lat)}
                  r="5"
                  fill="#059669"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              ))}

              {/* Bearing Track Label */}
              <text
                x={toSvgX(80.45)}
                y={toSvgY(13.22) - 10}
                fill="#047857"
                fontSize="11"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                Safe Bearing: 045° (38 km)
              </text>
            </g>
          )}

          {/* PFZ Target Zones */}
          {(activeLayer === 'all' || activeLayer === 'pfz') &&
            displayZones.map((pfz) => {
              const x = toSvgX(pfz.longitude);
              const y = toSvgY(pfz.latitude);
              const isSelected = inspectedPFZ?.id === pfz.id;

              return (
                <g
                  key={pfz.id}
                  id={`map-pfz-marker-${pfz.id}`}
                  onClick={() => {
                    setInspectedPFZ(pfz);
                    if (onSelectPFZ) onSelectPFZ(pfz);
                  }}
                  className="cursor-pointer group"
                >
                  {/* Outer Pulsing Glow */}
                  <circle cx={x} cy={y} r="28" fill="url(#pfzGlow)" className="animate-pulse" />

                  {/* Polygon Target Box — color by confidence */}
                  <polygon
                    points={`${x},${y - 12} ${x + 12},${y} ${x},${y + 12} ${x - 12},${y}`}
                    fill={isSelected ? '#0D9488' : pfz.suitabilityScore >= 80 ? '#059669' : pfz.suitabilityScore >= 60 ? '#D97706' : '#EA580C'}
                    stroke={isSelected ? '#115E59' : pfz.suitabilityScore >= 80 ? '#065F46' : pfz.suitabilityScore >= 60 ? '#92400E' : '#9A3412'}
                    strokeWidth="2.5"
                  />

                  {/* Icon or center dot */}
                  <circle cx={x} cy={y} r="3.5" fill="#ffffff" />

                  {/* Label */}
                  <rect
                    x={x + 14}
                    y={y - 12}
                    width="140"
                    height="24"
                    rx="6"
                    fill="rgba(255, 255, 255, 0.95)"
                    stroke={isSelected ? '#0D9488' : '#CBD5E1'}
                    strokeWidth="1.2"
                  />
                  <text
                    x={x + 22}
                    y={y + 4}
                    fill={isSelected ? '#0F766E' : '#1E293B'}
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    PFZ: {pfz.suitabilityScore}% Match
                  </text>
                </g>
              );
            })}

          {/* ML PFZ Prediction Layer */}
          {showMLLayer && mlPredictions.length > 0 && mlPredictions.map((pred, idx) => {
            const px = toSvgX(pred.longitude);
            const py = toSvgY(pred.latitude);
            if (px < 0 || px > 800 || py < 0 || py > 500) return null;
            const isSelected = selectedMLPfz?.latitude === pred.latitude && selectedMLPfz?.longitude === pred.longitude;
            const probColor = pred.pfz_probability > 0.99 ? '#DC2626' : pred.pfz_probability > 0.95 ? '#EA580C' : '#F59E0B';
            return (
              <circle
                key={`ml-${idx}`}
                cx={px}
                cy={py}
                r={isSelected ? 7 : 5}
                fill={probColor}
                fillOpacity={0.7}
                stroke={isSelected ? '#111111' : '#ffffff'}
                strokeWidth={isSelected ? 2 : 1}
                className="cursor-pointer"
                onClick={() => setSelectedMLPfz(pred)}
              />
            );
          })}

          {showMLLayer && mlLoading && (
            <text x="400" y="250" textAnchor="middle" fill="#666666" fontSize="14" fontFamily="sans-serif">
              Loading ML predictions...
            </text>
          )}

          {/* User / Vessel Current Position (Kasimedu Fishing Harbour) */}
          <g>
            <circle cx={toSvgX(80.2707)} cy={toSvgY(13.0827)} r="12" fill="rgba(225, 29, 72, 0.2)" className="animate-ping" />
            <circle cx={toSvgX(80.2707)} cy={toSvgY(13.0827)} r="7" fill="#E11D48" stroke="#ffffff" strokeWidth="2" />
            <text x={toSvgX(80.2707) + 12} y={toSvgY(13.0827) + 4} fill="#BE123C" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
              Your Vessel
            </text>
          </g>
        </svg>

        {/* Floating Map Legend */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg border border-[#E5E5E5] text-[11px] text-[#333333] space-y-1 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-teal-600 inline-block" />
            <span className="font-medium">Potential Fishing Zone (PFZ)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-emerald-600 inline-block" />
            <span className="font-medium">Recommended Safe Transit Corridor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 border-b border-dashed border-rose-600 inline-block" />
            <span className="font-medium">Restricted / IMBL Territorial Line</span>
          </div>
          {showMLLayer && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
              <span className="font-medium">ML PFZ Prediction ({mlPredictions.length} zones)</span>
            </div>
          )}
        </div>

        {/* ML PFZ Prediction Detail Card */}
        {selectedMLPfz && showMLLayer && (
          <div className="absolute top-14 right-3 w-72 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-orange-200 shadow-lg text-xs z-20">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-orange-100">
              <span className="font-bold text-[#111111] text-xs">ML PFZ Prediction</span>
              <button onClick={() => setSelectedMLPfz(null)} className="text-[#999] hover:text-[#333] text-sm leading-none">&times;</button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#333333] my-2">
              <div>
                <span className="text-[#666666] block text-[10px]">Location</span>
                <span className="font-bold text-[#111111]">{selectedMLPfz.latitude.toFixed(3)}°N, {selectedMLPfz.longitude.toFixed(3)}°E</span>
              </div>
              <div>
                <span className="text-[#666666] block text-[10px]">PFZ Probability</span>
                <span className="font-bold text-orange-700">{(selectedMLPfz.pfz_probability * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-[#666666] block text-[10px]">SST</span>
                <span className="font-medium text-[#111111]">{selectedMLPfz.sst.toFixed(2)}°C</span>
              </div>
              <div>
                <span className="text-[#666666] block text-[10px]">Chlorophyll-a</span>
                <span className="font-medium text-green-700">{selectedMLPfz.chlorophyll.toFixed(4)} mg/m³</span>
              </div>
              <div>
                <span className="text-[#666666] block text-[10px]">SST Gradient</span>
                <span className="font-medium text-amber-700">{selectedMLPfz.sst_gradient.toFixed(4)}</span>
              </div>
              <div>
                <span className="text-[#666666] block text-[10px]">Date</span>
                <span className="font-medium text-[#111111]">{selectedMLPfz.date}</span>
              </div>
            </div>
            <p className="text-[10px] text-[#888] italic mt-1 border-t border-orange-100 pt-1.5">
              Satellite-derived ML prediction. Not an official INCOIS PFZ advisory.
            </p>
          </div>
        )}

        {/* Inspected PFZ Quick Card */}
        {inspectedPFZ && (
          <div className="absolute bottom-3 right-3 w-80 max-w-[calc(100%-1.5rem)] bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-[#E5E5E5] shadow-lg text-xs">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#E5E5E5]">
              <span className="font-bold text-[#111111]">{inspectedPFZ.name}</span>
              <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                inspectedPFZ.suitabilityScore >= 80 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                inspectedPFZ.suitabilityScore >= 60 ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                'bg-orange-50 text-orange-800 border border-orange-200'
              }`}>
                {inspectedPFZ.suitabilityScore}% Confidence
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#333333] my-2">
              <div>
                <span className="text-[#666666] block text-[10px]">Distance & Bearing</span>
                <span className="font-bold text-[#111111]">{inspectedPFZ.distanceKm} km ({inspectedPFZ.direction})</span>
              </div>
              <div>
                <span className="text-[#666666] block text-[10px]">Thermal Signature</span>
                <span className="font-bold text-amber-700">{inspectedPFZ.sst}°C (High Chl-a)</span>
              </div>
              <div>
                <span className="text-[#666666] block text-[10px]">Wave & Wind</span>
                <span className="font-medium text-[#111111]">{inspectedPFZ.waveHeight}m / {inspectedPFZ.windSpeed} km/h</span>
              </div>
              <div>
                <span className="text-[#666666] block text-[10px]">Target Pelagics</span>
                <span className="text-teal-700 font-medium truncate">{inspectedPFZ.speciesLikelihood.slice(0, 2).join(', ')}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#555555] line-clamp-2 italic">{inspectedPFZ.reasoning}</p>

            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={() => {
                  if (onAskMatsyaPFZ) onAskMatsyaPFZ(inspectedPFZ);
                  else if (onAskOrcaPFZ) onAskOrcaPFZ(inspectedPFZ);
                }}
                className="flex-1 py-1.5 px-2.5 bg-[#111111] hover:bg-black text-white rounded-lg font-medium text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                <span>Ask MATSYA AI Reasoning</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
