import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation } from 'lucide-react';
import type { PFZZone, RoutePlan } from '../types/marine';

// ── Fix Leaflet default icon broken in Vite ──────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Custom marker icons using divIcon ─────────────────────────────────────────

const makeUserIcon = (isLive: boolean) =>
  L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:36px;height:36px">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:${isLive ? 'rgba(16,185,129,0.25)' : 'rgba(251,191,36,0.2)'};
          animation:pulse 2s ease-in-out infinite;
        "></div>
        <div style="
          position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
          width:18px;height:18px;border-radius:50%;
          background:${isLive ? '#10b981' : '#f59e0b'};
          border:2.5px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.5);
        "></div>
      </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });

const makePfzIcon = (score: number, isSelected: boolean) => {
  const bg = score >= 80 ? '#059669' : score >= 60 ? '#d97706' : '#ea580c';
  const size = isSelected ? 26 : 22;
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${bg};border:2.5px solid white;
        display:flex;align-items:center;justify-content:center;
        font-size:${size * 0.55}px;
        box-shadow:0 2px 8px rgba(0,0,0,0.5);
        ${isSelected ? 'box-shadow:0 0 0 3px rgba(16,185,129,0.4),0 2px 8px rgba(0,0,0,0.5);' : ''}
      ">🐟</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
};

// ── Sub-components ────────────────────────────────────────────────────────────

// Smoothly follows GPS position when tracking is on
function GpsFollower({
  lat,
  lng,
  tracking,
}: {
  lat: number;
  lng: number;
  tracking: boolean;
}) {
  const map = useMap();
  const first = useRef(true);

  useEffect(() => {
    if (tracking || first.current) {
      map.setView([lat, lng], first.current ? 13 : map.getZoom(), { animate: true });
      first.current = false;
    }
  }, [lat, lng, tracking, map]);

  return null;
}

// Detects manual pan/zoom to stop auto-follow
function PanWatcher({ onPan }: { onPan: () => void }) {
  useMapEvents({ dragstart: onPan, zoomstart: onPan });
  return null;
}

// ── Main component ────────────────────────────────────────────────────────────

export interface MarineLeafletMapProps {
  lat: number;
  lng: number;
  isLiveGps: boolean;
  pfzZones: PFZZone[];
  activeRoute?: RoutePlan | null;
  selectedPFZId?: string;
  isLoading?: boolean;
  isNavigating?: boolean;
  onSelectPFZ?: (pfz: PFZZone) => void;
  onNavigate?: (pfz: PFZZone) => void;
}

export const MarineLeafletMap: React.FC<MarineLeafletMapProps> = ({
  lat,
  lng,
  isLiveGps,
  pfzZones,
  activeRoute,
  selectedPFZId,
  isLoading = false,
  isNavigating = false,
  onSelectPFZ,
  onNavigate,
}) => {
  const [tracking, setTracking] = useState(true);

  // When GPS changes while tracking, keep following
  const userIcon = makeUserIcon(isLiveGps);

  // Route waypoints for polyline
  const routePoints: [number, number][] = (() => {
    if (!activeRoute || !isNavigating) return [];
    const wps =
      activeRoute.primaryRouteWaypoints ||
      activeRoute.waypoints ||
      [];
    if (lat && lng) {
      return [[lat, lng] as [number, number], ...wps.map((w) => [w.lat, w.lng] as [number, number])];
    }
    return wps.map((w) => [w.lat, w.lng] as [number, number]);
  })();

  return (
    <div className="relative w-full h-full" style={{ minHeight: 0 }}>
      {/* Leaflet CSS pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.6); opacity: 0; }
        }
        .leaflet-popup-content-wrapper {
          background: #0c1a2e !important;
          border: 1px solid rgba(16,185,129,0.25) !important;
          border-radius: 12px !important;
          color: white !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
        }
        .leaflet-popup-tip { background: #0c1a2e !important; }
        .leaflet-popup-close-button { color: rgba(255,255,255,0.5) !important; }
        .leaflet-control-zoom a {
          background: #0c1a2e !important;
          color: #5eead4 !important;
          border-color: rgba(94,234,212,0.2) !important;
        }
        .leaflet-control-attribution {
          background: rgba(6,16,30,0.7) !important;
          color: rgba(255,255,255,0.3) !important;
          font-size: 9px !important;
        }
        .leaflet-control-attribution a { color: rgba(255,255,255,0.4) !important; }
      `}</style>

      <MapContainer
        center={[lat, lng]}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        attributionControl={true}
      >
        {/* Dark nautical tile layer — CartoDB DarkMatter, no API key needed */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OSM</a> &copy; <a href="https://carto.com">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        {/* GPS follower + pan detection */}
        <GpsFollower lat={lat} lng={lng} tracking={tracking} />
        <PanWatcher onPan={() => setTracking(false)} />

        {/* User position marker */}
        <Marker position={[lat, lng]} icon={userIcon}>
          <Popup>
            <div style={{ minWidth: 140, fontSize: 12 }}>
              <div style={{ fontWeight: 700, color: '#10b981', marginBottom: 4 }}>
                {isLiveGps ? '📍 Your Position (Live GPS)' : '📍 Demo Position'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', fontSize: 10 }}>
                {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
              </div>
            </div>
          </Popup>
        </Marker>

        {/* PFZ zone markers */}
        {pfzZones.map((pfz) => (
          <Marker
            key={pfz.id}
            position={[pfz.latitude, pfz.longitude]}
            icon={makePfzIcon(pfz.suitabilityScore, pfz.id === selectedPFZId)}
            eventHandlers={{
              click: () => onSelectPFZ?.(pfz),
            }}
          >
            <Popup>
              <PfzPopup pfz={pfz} onNavigate={onNavigate} />
            </Popup>
          </Marker>
        ))}

        {/* Route polyline */}
        {routePoints.length >= 2 && (
          <Polyline
            positions={routePoints}
            pathOptions={{
              color: '#10b981',
              weight: 3,
              dashArray: '8, 5',
              opacity: 0.9,
            }}
          />
        )}
      </MapContainer>

      {/* Recenter button — overlays the map */}
      <button
        onClick={() => setTracking(true)}
        className={[
          'absolute bottom-14 right-2 z-[1000] flex items-center gap-1 px-2.5 py-1.5',
          'rounded-xl text-[10px] font-bold font-mono border transition-all shadow-lg',
          tracking
            ? 'bg-emerald-900/80 border-emerald-500/40 text-emerald-300'
            : 'bg-[#06101e]/90 border-white/20 text-white/60 hover:border-teal-500/40 hover:text-teal-300',
        ].join(' ')}
        title="Recenter map on GPS position"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
        {tracking ? 'TRACKING' : 'RECENTER'}
      </button>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-[2000] bg-[#06101e]/70 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-2 bg-[#0c1a2e] border border-teal-500/30 rounded-xl px-4 py-2.5 shadow-xl">
            <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-teal-300 text-xs font-mono">Fetching PFZ data...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ── PFZ popup content ─────────────────────────────────────────────────────────

function PfzPopup({
  pfz,
  onNavigate,
}: {
  pfz: PFZZone;
  onNavigate?: (pfz: PFZZone) => void;
}) {
  const confColor = pfz.suitabilityScore >= 80 ? '#10b981' : pfz.suitabilityScore >= 60 ? '#f59e0b' : '#f97316';
  return (
    <div style={{ minWidth: 200, maxWidth: 240, fontSize: 12 }}>
      <div style={{ fontWeight: 700, color: confColor, marginBottom: 6, fontSize: 13 }}>
        🐟 {pfz.name.split('(')[0].trim()}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', marginBottom: 8 }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, textTransform: 'uppercase' }}>Confidence</div>
          <div style={{ color: confColor, fontWeight: 700 }}>{pfz.confidenceScore}%</div>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, textTransform: 'uppercase' }}>Distance</div>
          <div style={{ color: 'white', fontWeight: 600 }}>{pfz.distanceKm} km</div>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, textTransform: 'uppercase' }}>Bearing</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace', fontSize: 10 }}>
            {pfz.direction.split('(').pop()?.replace(')', '') || pfz.direction}
          </div>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, textTransform: 'uppercase' }}>SST</div>
          <div style={{ color: '#f59e0b', fontWeight: 600 }}>{pfz.sst}°C</div>
        </div>
        {pfz.chlorophyllValue != null && pfz.chlorophyllValue > 0 && (
          <div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, textTransform: 'uppercase' }}>Chlorophyll</div>
            <div style={{ color: '#34d399', fontWeight: 600 }}>{pfz.chlorophyllValue.toFixed(2)} mg/m³</div>
          </div>
        )}
        {pfz.waveHeight > 0 && (
          <div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, textTransform: 'uppercase' }}>Wave / Wind</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>
              {pfz.waveHeight}m / {pfz.windSpeed > 0 ? pfz.windSpeed + ' km/h' : '—'}
            </div>
          </div>
        )}
      </div>

      {pfz.speciesLikelihood.length > 0 && (
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginBottom: 8 }}>
          {pfz.speciesLikelihood.slice(0, 3).join(' · ')}
        </div>
      )}

      {onNavigate && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(pfz);
          }}
          style={{
            width: '100%', padding: '6px 0', borderRadius: 8,
            background: '#0d9488', border: 'none', color: 'white',
            fontWeight: 700, fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          ↗ NAVIGATE
        </button>
      )}
    </div>
  );
}
