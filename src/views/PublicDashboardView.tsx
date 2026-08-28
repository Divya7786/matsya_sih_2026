import React, { useState, useEffect, useCallback } from 'react';
import {
  Waves, Wind, Thermometer, AlertTriangle, Fish, ArrowLeft,
  Sparkles, ShieldCheck, Droplets, Clock, Bell, RefreshCw,
  MapPin, Info, CheckCircle, XCircle, AlertCircle, Loader2,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Coastal locations for the dropdown
const COASTAL_LOCATIONS = [
  { name: 'Chennai (Kasimedu)', lat: 13.0827, lng: 80.2707 },
  { name: 'Mumbai (Sassoon Dock)', lat: 18.9067, lng: 72.8147 },
  { name: 'Kochi (Vypeen)', lat: 9.9312, lng: 76.2673 },
  { name: 'Visakhapatnam (Bheemunipatnam)', lat: 17.8872, lng: 83.4561 },
  { name: 'Rameswaram', lat: 9.2876, lng: 79.3129 },
  { name: 'Mandapam Camp', lat: 9.2739, lng: 79.1303 },
  { name: 'Tuticorin (V.O.C. Port)', lat: 8.7642, lng: 78.1348 },
  { name: 'Nagapattinam', lat: 10.7672, lng: 79.8449 },
];

interface MarineConditions {
  lat: number;
  lng: number;
  region: string;
  waveHeight: number | null;
  windSpeed: number | null;
  windDirection: string | null;
  swellHeight: number | null;
  sst: number | null;
  chlorophyll: number | null;
  overallRisk: string;
  safetyScore: number;
  geofenceStatus: string;
  nearestZone: string;
  dataStatus: string;
  dataSource: string;
  lastUpdated: string;
  sstSource: string;
  chlorophyllSource: string;
}

interface MarineAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  latitude: number | null;
  longitude: number | null;
  region: string;
  wave_height: number | null;
  wind_speed: number | null;
  source: string;
  is_active: boolean;
  created_at: string;
}

interface PublicDashboardViewProps {
  onNavigate: (view: string) => void;
  onOpenVoiceModal: () => void;
}

function MapCentre({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 9, { animate: true }); }, [lat, lng, map]);
  return null;
}

function makeAlertIcon(severity: string) {
  const color = severity === 'VERY_HIGH' ? '#dc2626'
    : severity === 'HIGH' ? '#ea580c'
    : severity === 'MODERATE' ? '#d97706'
    : '#2563eb';
  return L.divIcon({
    className: '',
    html: `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -14],
  });
}

function riskColor(risk: string): string {
  if (risk === 'DANGEROUS' || risk === 'VERY_HIGH') return 'text-red-700 bg-red-50 border-red-200';
  if (risk === 'HIGH_RISK' || risk === 'HIGH') return 'text-orange-700 bg-orange-50 border-orange-200';
  if (risk === 'CAUTION' || risk === 'MODERATE') return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-emerald-700 bg-emerald-50 border-emerald-200';
}

function severityBadge(severity: string): string {
  if (severity === 'VERY_HIGH') return 'bg-red-100 text-red-800 border border-red-300';
  if (severity === 'HIGH') return 'bg-orange-100 text-orange-800 border border-orange-300';
  if (severity === 'MODERATE') return 'bg-amber-100 text-amber-800 border border-amber-300';
  return 'bg-blue-100 text-blue-800 border border-blue-300';
}

function DataBadge({ status }: { status: string }) {
  if (status === 'LIVE') return <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">LIVE</span>;
  if (status === 'CACHED') return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">CACHED</span>;
  if (status === 'UNAVAILABLE') return <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 font-bold">N/A</span>;
  return <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-200 font-bold">{status}</span>;
}

export const PublicDashboardView: React.FC<PublicDashboardViewProps> = ({ onNavigate, onOpenVoiceModal }) => {
  const [selectedLocation, setSelectedLocation] = useState(COASTAL_LOCATIONS[0]);
  const [conditions, setConditions] = useState<MarineConditions | null>(null);
  const [alerts, setAlerts] = useState<MarineAlert[]>([]);
  const [alertHistory, setAlertHistory] = useState<MarineAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const fetchConditions = useCallback(async (loc: typeof COASTAL_LOCATIONS[0]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/public/dashboard?lat=${loc.lat}&lng=${loc.lng}&region=${encodeURIComponent(loc.name)}`,
      );
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: MarineConditions = await res.json();
      setConditions(data);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load marine conditions');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const [activeRes, historyRes] = await Promise.all([
        fetch('/api/public/alerts'),
        fetch('/api/public/alerts/history?limit=20'),
      ]);
      if (activeRes.ok) {
        const d = await activeRes.json();
        setAlerts(d.alerts ?? []);
      }
      if (historyRes.ok) {
        const d = await historyRes.json();
        setAlertHistory(d.alerts ?? []);
      }
    } catch { /* non-critical */ }
    setAlertsLoading(false);
  }, []);

  useEffect(() => {
    fetchConditions(selectedLocation);
    fetchAlerts();
  }, [selectedLocation, fetchConditions, fetchAlerts]);

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const loc = COASTAL_LOCATIONS.find(l => l.name === e.target.value);
    if (loc) setSelectedLocation(loc);
  };

  const handleRefresh = () => {
    fetchConditions(selectedLocation);
    fetchAlerts();
  };

  const conditionCards = conditions ? [
    {
      label: 'Sea Surface Temp',
      value: conditions.sst != null ? `${conditions.sst}°C` : 'N/A',
      icon: Thermometer,
      colorClass: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      source: conditions.sstSource,
    },
    {
      label: 'Wave Height',
      value: conditions.waveHeight != null ? `${conditions.waveHeight} m` : 'N/A',
      icon: Waves,
      colorClass: 'text-teal-700',
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      source: conditions.dataSource,
    },
    {
      label: 'Wind Speed',
      value: conditions.windSpeed != null ? `${conditions.windSpeed} km/h` : 'N/A',
      icon: Wind,
      colorClass: 'text-sky-700',
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      source: conditions.dataSource,
    },
    {
      label: 'Chlorophyll-a',
      value: conditions.chlorophyll != null ? `${conditions.chlorophyll} mg/m³` : 'N/A',
      icon: Droplets,
      colorClass: 'text-green-700',
      bg: 'bg-green-50',
      border: 'border-green-200',
      source: conditions.chlorophyllSource,
    },
    {
      label: 'Marine Risk',
      value: conditions.overallRisk,
      icon: ShieldCheck,
      colorClass: riskColor(conditions.overallRisk).split(' ')[0],
      bg: riskColor(conditions.overallRisk).split(' ')[1],
      border: riskColor(conditions.overallRisk).split(' ')[2],
      source: 'MATSYA AI',
    },
    {
      label: 'Safety Score',
      value: `${conditions.safetyScore}/100`,
      icon: CheckCircle,
      colorClass: conditions.safetyScore >= 70 ? 'text-emerald-700' : conditions.safetyScore >= 40 ? 'text-amber-700' : 'text-red-700',
      bg: conditions.safetyScore >= 70 ? 'bg-emerald-50' : conditions.safetyScore >= 40 ? 'bg-amber-50' : 'bg-red-50',
      border: conditions.safetyScore >= 70 ? 'border-emerald-200' : conditions.safetyScore >= 40 ? 'border-amber-200' : 'border-red-200',
      source: 'MATSYA AI',
    },
  ] : [];

  const displayedAlerts = showHistory ? alertHistory : alerts;

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="p-2 rounded-lg border border-[#E5E5E5] bg-white hover:bg-[#F0F0F0] transition"
            >
              <ArrowLeft className="w-4 h-4 text-[#333333]" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#111111] flex items-center gap-2">
                Public Coastal Dashboard
                {loading && <Loader2 className="w-4 h-4 animate-spin text-teal-600" />}
              </h1>
              <p className="text-xs text-[#666666]">Live ocean intelligence — Indian coastline. No login required.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Location selector */}
            <select
              value={selectedLocation.name}
              onChange={handleLocationChange}
              className="text-xs border border-[#E5E5E5] rounded-lg px-3 py-2 bg-white text-[#333333] focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {COASTAL_LOCATIONS.map(l => (
                <option key={l.name} value={l.name}>{l.name}</option>
              ))}
            </select>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 rounded-lg border border-[#E5E5E5] bg-white hover:bg-[#F0F0F0] transition disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 text-[#333333] ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onOpenVoiceModal}
              className="flex items-center gap-2 px-4 py-2 bg-[#111111] text-white rounded-lg text-xs font-semibold hover:bg-black transition shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-teal-300" />
              Ask MATSYA AI
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error} — showing last available data or try refreshing.</span>
          </div>
        )}

        {/* Condition Cards */}
        {loading && !conditions ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-white border border-[#E5E5E5] animate-pulse h-28" />
            ))}
          </div>
        ) : conditions ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {conditionCards.map((c) => (
              <div
                key={c.label}
                className="p-4 rounded-xl bg-white border border-[#E5E5E5] shadow-xs flex flex-col items-center text-center gap-2"
                title={`Source: ${c.source}`}
              >
                <div className={`w-10 h-10 rounded-lg ${c.bg} ${c.colorClass} border ${c.border} flex items-center justify-center`}>
                  <c.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#666666]">{c.label}</span>
                <span className={`text-base font-bold ${c.colorClass}`}>{c.value}</span>
              </div>
            ))}
          </div>
        ) : null}

        {/* Map + Geofence Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Leaflet Map */}
          <div className="lg:col-span-2 rounded-xl overflow-hidden border border-[#E5E5E5] shadow-sm" style={{ height: 340 }}>
            <MapContainer
              center={[selectedLocation.lat, selectedLocation.lng]}
              zoom={9}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapCentre lat={selectedLocation.lat} lng={selectedLocation.lng} />

              {/* Selected location marker */}
              <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                <Popup>
                  <div className="text-xs space-y-1">
                    <p className="font-bold">{selectedLocation.name}</p>
                    {conditions && (
                      <>
                        {conditions.waveHeight != null && <p>Wave: {conditions.waveHeight} m</p>}
                        {conditions.windSpeed != null && <p>Wind: {conditions.windSpeed} km/h {conditions.windDirection}</p>}
                        {conditions.sst != null && <p>SST: {conditions.sst}°C</p>}
                        <p className={`font-semibold ${conditions.overallRisk === 'SAFE' ? 'text-green-700' : 'text-amber-700'}`}>
                          Risk: {conditions.overallRisk}
                        </p>
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>

              {/* Alert markers */}
              {alerts.filter(a => a.latitude != null && a.longitude != null).map(alert => (
                <Marker
                  key={alert.id}
                  position={[alert.latitude!, alert.longitude!]}
                  icon={makeAlertIcon(alert.severity)}
                >
                  <Popup>
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-red-700">{alert.title}</p>
                      <p className="text-[#444444]">{alert.message}</p>
                      <p className="text-[#888888]">Region: {alert.region}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Geofence & Conditions Panel */}
          <div className="space-y-3">
            {conditions && (
              <>
                <div className="p-4 rounded-xl bg-white border border-[#E5E5E5] shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    Location Info
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#666666]">Coordinates</span>
                      <span className="font-mono text-[#111111]">
                        {conditions.lat.toFixed(3)}°N, {conditions.lng.toFixed(3)}°E
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666666]">Boundary Status</span>
                      <span className={`font-bold ${conditions.geofenceStatus === 'SAFE' ? 'text-emerald-700' : 'text-red-700'}`}>
                        {conditions.geofenceStatus}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666666]">Nearest Zone</span>
                      <span className="text-[#333333] text-right max-w-[120px] truncate">{conditions.nearestZone}</span>
                    </div>
                    {conditions.windDirection && (
                      <div className="flex justify-between">
                        <span className="text-[#666666]">Wind Direction</span>
                        <span className="font-semibold text-[#333333]">{conditions.windDirection}</span>
                      </div>
                    )}
                    {conditions.swellHeight != null && (
                      <div className="flex justify-between">
                        <span className="text-[#666666]">Swell Height</span>
                        <span className="font-semibold text-sky-700">{conditions.swellHeight} m</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#E5E5E5] shadow-xs">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1">
                      <Info className="w-3 h-3 text-[#888888]" />
                      Data Source
                    </span>
                    <DataBadge status={conditions.dataStatus} />
                  </div>
                  <p className="text-[11px] text-[#666666]">{conditions.dataSource}</p>
                  {lastRefresh && (
                    <p className="text-[10px] text-[#999999] mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Updated {lastRefresh.toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Alerts Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              Marine Alerts
              {alerts.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
                  {alerts.length} active
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(false)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${!showHistory ? 'bg-[#111111] text-white' : 'bg-white border border-[#E5E5E5] text-[#555555] hover:bg-[#F0F0F0]'}`}
              >
                Active
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${showHistory ? 'bg-[#111111] text-white' : 'bg-white border border-[#E5E5E5] text-[#555555] hover:bg-[#F0F0F0]'}`}
              >
                History
              </button>
            </div>
          </div>

          {alertsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-white border border-[#E5E5E5] animate-pulse" />
              ))}
            </div>
          ) : displayedAlerts.length === 0 ? (
            <div className="p-6 rounded-xl bg-white border border-[#E5E5E5] text-center">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#333333]">
                {showHistory ? 'No alert history available' : 'No active marine alerts'}
              </p>
              <p className="text-xs text-[#666666] mt-1">
                {showHistory ? 'Alerts will appear here once generated.' : 'Conditions are within safe parameters.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border shadow-xs ${
                    alert.severity === 'VERY_HIGH' ? 'bg-red-50 border-red-200'
                    : alert.severity === 'HIGH' ? 'bg-orange-50 border-orange-200'
                    : alert.severity === 'MODERATE' ? 'bg-amber-50 border-amber-200'
                    : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${severityBadge(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      alert.severity === 'VERY_HIGH' ? 'text-red-600'
                      : alert.severity === 'HIGH' ? 'text-orange-600'
                      : 'text-amber-600'
                    }`} />
                  </div>
                  <p className="text-[10px] text-[#666666] mb-1">{alert.region}</p>
                  <h3 className="text-xs font-bold text-[#111111] mb-1">{alert.title}</h3>
                  <p className="text-[11px] text-[#444444] line-clamp-3">{alert.message}</p>
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-[#888888]">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(alert.created_at).toLocaleString()}</span>
                  </div>
                  {alert.wave_height != null && (
                    <p className="text-[10px] text-[#666666] mt-1">Wave: {alert.wave_height.toFixed(1)} m
                      {alert.wind_speed != null && ` · Wind: ${alert.wind_speed.toFixed(0)} km/h`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer row */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white border border-[#E5E5E5] shadow-xs">
          <div className="flex items-center gap-2 text-xs text-[#555555]">
            <Fish className="w-4 h-4 text-teal-600" />
            <span>Data: Open-Meteo Marine · NCEI OISST · PIFSC ESA-CCI · MATSYA AI Alert Engine</span>
          </div>
          <div className="flex items-center gap-2">
            {conditions && <DataBadge status={conditions.dataStatus} />}
            <button
              onClick={() => onNavigate('fisherman')}
              className="text-xs px-3 py-1.5 bg-teal-700 text-white rounded-lg font-semibold hover:bg-teal-800 transition"
            >
              Fisherman Mode →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
