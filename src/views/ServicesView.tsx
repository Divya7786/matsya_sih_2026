import React, { useState } from 'react';
import { 
  Leaf, 
  Waves, 
  Wind, 
  Compass, 
  ShieldCheck, 
  Anchor, 
  AlertTriangle, 
  Mic, 
  ArrowRight, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  TrendingUp, 
  ExternalLink,
  PhoneCall,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { MOCK_PFZ_ZONES, MOCK_SAMPLE_ROUTES, MOCK_ADVISORIES, MOCK_GEOFENCES } from '../data/mockMarineData';
import { PFZZone, RoutePlan } from '../types/marine';

interface ServicesViewProps {
  onNavigate: (view: string) => void;
  onOpenVoiceModal: (query?: string) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({ onNavigate, onOpenVoiceModal }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'pfz' | 'routes' | 'safety' | 'weather' | 'geofence' | 'advisories'>('all');
  const [selectedZone, setSelectedZone] = useState<PFZZone | null>(MOCK_PFZ_ZONES[0]);
  const [selectedRoute, setSelectedRoute] = useState<RoutePlan | null>(Object.values(MOCK_SAMPLE_ROUTES)[0]);

  return (
    <div className="bg-white min-h-screen text-[#111111] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Page Header */}
        <div className="space-y-3 pb-6 border-b border-[#E5E5E5]">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#F7F7F5] border border-[#E5E5E5] text-xs font-mono text-[#555555]">
            <span>Operational Marine Solutions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
            MATSYA AI Marine Intelligence Services
          </h1>
          <p className="text-sm text-[#555555] max-w-3xl leading-relaxed">
            Scientifically calibrated maritime services combining satellite thermal-optical retrievals, 
            hydrodynamic wave modeling, geospatial baselines, and multi-dialect voice synthesis.
          </p>
        </div>

        {/* Horizontal Service Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-2 border-b border-[#E5E5E5] text-xs font-semibold scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
              activeTab === 'all' ? 'bg-[#111111] text-white shadow-xs' : 'bg-[#F7F7F5] text-[#555555] hover:text-black'
            }`}
          >
            All Services
          </button>
          <button
            onClick={() => setActiveTab('pfz')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'pfz' ? 'bg-[#111111] text-white shadow-xs' : 'bg-[#F7F7F5] text-[#555555] hover:text-black'
            }`}
          >
            <Leaf className="w-3.5 h-3.5 text-emerald-500" />
            <span>Potential Fishing Zones (PFZ)</span>
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'routes' ? 'bg-[#111111] text-white shadow-xs' : 'bg-[#F7F7F5] text-[#555555] hover:text-black'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-purple-500" />
            <span>Route Optimization</span>
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'safety' ? 'bg-[#111111] text-white shadow-xs' : 'bg-[#F7F7F5] text-[#555555] hover:text-black'
            }`}
          >
            <Waves className="w-3.5 h-3.5 text-blue-500" />
            <span>Wave & Sea Swell Safety</span>
          </button>
          <button
            onClick={() => setActiveTab('weather')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'weather' ? 'bg-[#111111] text-white shadow-xs' : 'bg-[#F7F7F5] text-[#555555] hover:text-black'
            }`}
          >
            <Wind className="w-3.5 h-3.5 text-teal-500" />
            <span>Wind & Squall Alerts</span>
          </button>
          <button
            onClick={() => setActiveTab('geofence')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'geofence' ? 'bg-[#111111] text-white shadow-xs' : 'bg-[#F7F7F5] text-[#555555] hover:text-black'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>Geofencing & IMBL</span>
          </button>
          <button
            onClick={() => setActiveTab('advisories')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'advisories' ? 'bg-[#111111] text-white shadow-xs' : 'bg-[#F7F7F5] text-[#555555] hover:text-black'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Active Advisories</span>
          </button>
        </div>

        {/* TAB CONTENT: PFZ FOCUS */}
        {(activeTab === 'all' || activeTab === 'pfz') && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#111111]">
                  Potential Fishing Zones (PFZ) Directory
                </h2>
                <p className="text-xs text-[#666666]">
                  Synchronized daily using Oceansat-3 OCM-3 optical chlorophyll and INSAT-3DR thermal gradient fronts.
                </p>
              </div>
              <button
                onClick={() => onOpenVoiceModal('Where are the nearest high-suitability PFZ zones off my coast?')}
                className="px-3.5 py-2 bg-[#111111] text-white text-xs font-semibold rounded-lg hover:bg-black transition flex items-center gap-2"
              >
                <Mic className="w-3.5 h-3.5 text-teal-400" />
                <span>Ask Voice Assistant</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* List of PFZ Zones */}
              <div className="space-y-3">
                {MOCK_PFZ_ZONES.map((zone) => (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className={`p-4 rounded-xl border transition cursor-pointer ${
                      selectedZone?.id === zone.id
                        ? 'border-black bg-white shadow-md'
                        : 'border-[#E5E5E5] bg-[#F7F7F5] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="font-bold text-xs text-[#111111] block">{zone.name}</span>
                        <span className="text-[10px] font-mono text-[#777777]">
                          Lat {zone.latitude.toFixed(2)}°N, Lng {zone.longitude.toFixed(2)}°E
                        </span>
                      </div>
                      <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {zone.suitabilityScore}% Match
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#E5E5E5] flex items-center justify-between text-[11px] text-[#555555]">
                      <span>{zone.distanceKm} km {zone.direction}</span>
                      <span className="font-mono">{zone.sst}°C • {zone.chlorophyllLevel} Chl</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected PFZ Detail Card */}
              {selectedZone && (
                <div className="lg:col-span-2 p-6 rounded-2xl border border-[#E5E5E5] bg-white space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E5E5] gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#111111]">{selectedZone.name}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-bold border border-teal-200">
                          {selectedZone.confidenceScore}% Model Confidence
                        </span>
                      </div>
                      <p className="text-xs text-[#666666] mt-0.5">
                        Bearing: {selectedZone.direction} • Distance: {selectedZone.distanceKm} km from shore • Depth: {selectedZone.depthMeters}m
                      </p>
                    </div>

                    <button
                      onClick={() => onOpenVoiceModal(`Calculate route to ${selectedZone.name}`)}
                      className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg transition self-start sm:self-auto flex items-center gap-1.5"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Plan Safe Route Here</span>
                    </button>
                  </div>

                  {/* Scientific Reasoning Block */}
                  <div className="p-4 bg-[#F7F7F5] rounded-xl border border-[#E5E5E5] space-y-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-teal-800 tracking-wider block">
                      Multi-Sensor Reasoning & Oceanographic Rationale
                    </span>
                    <p className="text-xs text-[#333333] leading-relaxed">
                      {selectedZone.reasoning}
                    </p>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                    <div className="p-3 bg-[#F7F7F5] rounded-lg border border-[#E5E5E5]">
                      <span className="text-[10px] text-[#888888] block">SURFACE SST</span>
                      <span className="font-bold text-sm text-[#111111]">{selectedZone.sst}°C</span>
                    </div>
                    <div className="p-3 bg-[#F7F7F5] rounded-lg border border-[#E5E5E5]">
                      <span className="text-[10px] text-[#888888] block">CHLOROPHYLL</span>
                      <span className="font-bold text-sm text-emerald-700">{selectedZone.chlorophyllLevel}</span>
                    </div>
                    <div className="p-3 bg-[#F7F7F5] rounded-lg border border-[#E5E5E5]">
                      <span className="text-[10px] text-[#888888] block">WAVE SWH</span>
                      <span className="font-bold text-sm text-[#111111]">{selectedZone.waveHeight}m</span>
                    </div>
                    <div className="p-3 bg-[#F7F7F5] rounded-lg border border-[#E5E5E5]">
                      <span className="text-[10px] text-[#888888] block">WIND SPEED</span>
                      <span className="font-bold text-sm text-[#111111]">{selectedZone.windSpeed} km/h</span>
                    </div>
                  </div>

                  {/* Species Likelihood */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#111111] block">Expected Pelagic Species:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedZone.speciesLikelihood.map((species, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-md bg-[#F7F7F5] border border-[#E5E5E5] text-xs font-medium text-[#333333]">
                          🐟 {species}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB CONTENT: ROUTE OPTIMIZER */}
        {(activeTab === 'all' || activeTab === 'routes') && (
          <div className="space-y-6 pt-6 border-t border-[#E5E5E5]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#111111]">
                  Safe Waypoint Route Optimization
                </h2>
                <p className="text-xs text-[#666666]">
                  Calculates optimal nautical paths avoiding shallow shoals, breakers, and heavy swell zones.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.values(MOCK_SAMPLE_ROUTES).map((route) => (
                <div 
                  key={route.id}
                  className="p-6 rounded-2xl border border-[#E5E5E5] bg-white space-y-4 hover:border-black transition"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
                    <div>
                      <h3 className="font-bold text-sm text-[#111111]">
                        {route.origin.name} → {route.destination.name}
                      </h3>
                      <span className="text-[11px] text-[#666666] font-mono">
                        Distance: {route.distanceKm} km • Est. Time: {route.estimatedTravelTimeHours}h
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-teal-50 text-teal-800 border border-teal-200">
                      Bearing {route.recommendedBearing}°
                    </span>
                  </div>

                  <div className="p-3 bg-[#F7F7F5] rounded-xl border border-[#E5E5E5] text-xs text-[#444444] space-y-1">
                    <span className="font-bold text-[#111111] block">Advisory Recommendation:</span>
                    <p>{route.departureRecommendation}</p>
                  </div>

                  {/* Waypoints sequence */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-[#111111] block">Calculated Safe Waypoints:</span>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      {route.waypoints.map((wp, i) => (
                        <React.Fragment key={i}>
                          <span className="px-2 py-1 rounded bg-[#F7F7F5] border border-[#E5E5E5] text-[#333333]">
                            WP{i+1}: {wp.lat.toFixed(2)}°N, {wp.lng.toFixed(2)}°E
                          </span>
                          {i < route.waypoints.length - 1 && <span className="text-[#CCCCCC]">→</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs font-semibold">
                    <span className="text-emerald-700">✓ Hazards avoided: {route.hazardsAvoided.join(', ')}</span>
                    <button
                      onClick={() => onOpenVoiceModal(`Start voice navigation for route from ${route.origin.name} to ${route.destination.name}`)}
                      className="text-[#111111] hover:underline flex items-center gap-1"
                    >
                      <span>Start Voice Nav</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB CONTENT: GEOFENCE & ADVISORIES */}
        {(activeTab === 'all' || activeTab === 'geofence' || activeTab === 'advisories') && (
          <div className="space-y-6 pt-6 border-t border-[#E5E5E5]">
            <div>
              <h2 className="text-xl font-bold text-[#111111]">
                Maritime Safety & Emergency Hotlines
              </h2>
              <p className="text-xs text-[#666666]">
                Coast Guard 1554 SAR integration and verified International Maritime Boundary Lines.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Emergency SAR Card */}
              <div className="p-6 rounded-2xl border border-rose-300 bg-rose-50/50 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-rose-950">Coast Guard SAR 1554</h3>
                    <span className="text-[10px] font-mono text-rose-800">Toll-Free 24/7 Distress Channel</span>
                  </div>
                </div>

                <p className="text-xs text-rose-900 leading-relaxed">
                  In case of engine failure, capsizing, medical emergency, or severe squall entrapment, trigger immediate Coast Guard SAR with GPS coordinates.
                </p>

                <button 
                  onClick={() => alert('Emergency protocol: Coast Guard 1554 SAR beacon dispatch simulated with telemetry GPS tag.')}
                  className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Simulate 1554 SAR Broadcast</span>
                </button>
              </div>

              {/* Active Advisories List */}
              <div className="md:col-span-2 space-y-3">
                {MOCK_ADVISORIES.map((adv) => (
                  <div key={adv.id} className="p-4 rounded-xl border border-[#E5E5E5] bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                          adv.severity === 'WARNING' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}>
                          {adv.severity}
                        </span>
                        <h4 className="font-bold text-xs text-[#111111]">{adv.title}</h4>
                      </div>
                      <span className="text-[10px] font-mono text-[#888888]">{adv.issuedAt}</span>
                    </div>
                    <p className="text-xs text-[#555555] leading-relaxed">
                      {adv.message}
                    </p>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
