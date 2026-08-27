import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import {
  Globe,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sparkles,
  MapPin,
  Loader2,
  Fish,
  Navigation,
  Wind,
  Thermometer,
  Droplets,
  X,
  ZoomIn,
  ZoomOut,
  Waves,
  Compass,
  Play,
  Pause,
  Activity,
  FlaskConical,
  Eye,
  Atom,
  Layers,
  Mic,
  AlertTriangle,
} from 'lucide-react';
import { OceanVariable, MarineLocationData } from '../types/marine';
import { fetchMarineLocation, fetchMLPfzPredictions, runAgentOrchestration } from '../services/api';
import type { MLPfzPrediction } from '../services/api';

// ═══════════════════════════════════════════════════════════
// LAYER DEFINITIONS
// ═══════════════════════════════════════════════════════════

type OceanLayerId =
  | 'sst'
  | 'chlorophyll'
  | 'salinity'
  | 'oxygen'
  | 'current'
  | 'ssh'
  | 'ph'
  | 'turbidity'
  | 'nitrate'
  | 'pfz';

interface OceanLayerDef {
  id: OceanLayerId;
  label: string;
  shortLabel: string;
  unit: string;
  sublabel: string;
  source: string;
  icon: React.ReactNode;
  colorStops: { value: number; color: [number, number, number] }[];
  legendLabels: string[];
  isSimulated: boolean;
}

const OCEAN_LAYERS: OceanLayerDef[] = [
  {
    id: 'sst',
    label: 'Sea Surface Temperature (SST)',
    shortLabel: 'SST',
    unit: '°C',
    sublabel: 'Surface ocean temperature',
    source: 'Open-Meteo Marine / NCEI OISST v2.1',
    icon: <Thermometer className="w-4 h-4" />,
    isSimulated: false,
    colorStops: [
      { value: 0,  color: [28,  10, 110] },
      { value: 4,  color: [20,  40, 180] },
      { value: 8,  color: [20, 100, 200] },
      { value: 12, color: [20, 160, 160] },
      { value: 16, color: [60, 200,  80] },
      { value: 20, color: [180, 220, 20] },
      { value: 24, color: [240, 180, 20] },
      { value: 28, color: [220,  80, 20] },
      { value: 32, color: [180,  10, 10] },
    ],
    legendLabels: ['32', '28', '24', '20', '16', '12', '8', '4', '0'],
  },
  {
    id: 'chlorophyll',
    label: 'Chlorophyll-a Concentration',
    shortLabel: 'Chl-a',
    unit: 'mg/m³',
    sublabel: 'Phytoplankton biomass',
    source: 'PIFSC ESA-CCI Chl-a / INCOIS',
    icon: <Droplets className="w-4 h-4 text-emerald-400" />,
    isSimulated: false,
    colorStops: [
      { value: 0,   color: [5,   5,  40] },
      { value: 0.5, color: [10,  30, 120] },
      { value: 1.0, color: [20, 100, 100] },
      { value: 2.0, color: [40, 180,  40] },
      { value: 3.0, color: [200, 220,  20] },
      { value: 5.0, color: [200,  60,  10] },
    ],
    legendLabels: ['5.0', '3.0', '2.0', '1.0', '0.5', '0'],
  },
  {
    id: 'salinity',
    label: 'Salinity',
    shortLabel: 'Salinity',
    unit: 'PSU',
    sublabel: 'Practical Salinity Units',
    source: 'Physics model (simulated)',
    icon: <Droplets className="w-4 h-4 text-sky-300" />,
    isSimulated: true,
    colorStops: [
      { value: 30, color: [200, 220, 255] },
      { value: 32, color: [120, 180, 230] },
      { value: 34, color: [40,  100, 180] },
      { value: 35, color: [20,   60, 140] },
      { value: 36, color: [60,   20, 120] },
      { value: 38, color: [120,  10,  80] },
    ],
    legendLabels: ['38', '36', '35', '34', '32', '30'],
  },
  {
    id: 'oxygen',
    label: 'Dissolved Oxygen',
    shortLabel: 'O₂',
    unit: 'mg/L',
    sublabel: 'Oxygen in water',
    source: 'Simulated (no free real-time API)',
    icon: <span className="text-[11px] font-bold text-cyan-300 w-4 inline-block text-center">O₂</span>,
    isSimulated: true,
    colorStops: [
      { value: 2,  color: [80,  10, 10] },
      { value: 4,  color: [160, 30, 30] },
      { value: 6,  color: [40, 120, 180] },
      { value: 7,  color: [20, 180, 160] },
      { value: 9,  color: [60, 220,  80] },
      { value: 12, color: [200, 240, 220] },
    ],
    legendLabels: ['12', '9', '7', '6', '4', '2'],
  },
  {
    id: 'current',
    label: 'Ocean Currents',
    shortLabel: 'Currents',
    unit: 'm/s',
    sublabel: 'Surface current velocity',
    source: 'Open-Meteo Marine (ocean_current_velocity)',
    icon: <Navigation className="w-4 h-4 text-blue-300" />,
    isSimulated: false,
    colorStops: [
      { value: 0,   color: [10,  20, 60] },
      { value: 0.2, color: [20,  80, 140] },
      { value: 0.4, color: [40, 160, 160] },
      { value: 0.6, color: [100, 200, 60] },
      { value: 1.0, color: [220, 180, 20] },
      { value: 1.5, color: [200,  40, 20] },
    ],
    legendLabels: ['1.5', '1.0', '0.6', '0.4', '0.2', '0'],
  },
  {
    id: 'ssh',
    label: 'Sea Surface Height (SSH)',
    shortLabel: 'SSH',
    unit: 'm',
    sublabel: 'Sea level anomaly',
    source: 'Simulated (COPERNICUS/JASON-3 style)',
    icon: <Waves className="w-4 h-4 text-indigo-300" />,
    isSimulated: true,
    colorStops: [
      { value: -0.5, color: [20,  20, 120] },
      { value: -0.2, color: [40,  80, 200] },
      { value: 0,    color: [220, 230, 240] },
      { value: 0.2,  color: [240, 200,  40] },
      { value: 0.5,  color: [220,  60,  20] },
      { value: 1.0,  color: [180,  10,  10] },
    ],
    legendLabels: ['1.0m', '0.5m', '0m', '-0.2m', '-0.5m', ''],
  },
  {
    id: 'ph',
    label: 'pH (Acidity/Alkalinity)',
    shortLabel: 'pH',
    unit: '',
    sublabel: 'Ocean acidity',
    source: 'Simulated (no free real-time pH API)',
    icon: <span className="text-[11px] font-bold text-purple-300 w-4 inline-block text-center">pH</span>,
    isSimulated: true,
    colorStops: [
      { value: 7.5,  color: [180,  20,  20] },
      { value: 7.7,  color: [220, 100,  20] },
      { value: 7.9,  color: [220, 200,  40] },
      { value: 8.0,  color: [60,  200, 100] },
      { value: 8.1,  color: [40,  160, 200] },
      { value: 8.3,  color: [20,   60, 160] },
    ],
    legendLabels: ['8.3', '8.1', '8.0', '7.9', '7.7', '7.5'],
  },
  {
    id: 'turbidity',
    label: 'Turbidity',
    shortLabel: 'Turbidity',
    unit: 'FTU',
    sublabel: 'Water clarity',
    source: 'Simulated (coastal model)',
    icon: <span className="text-[11px] font-bold text-amber-300 w-4 inline-block text-center">···</span>,
    isSimulated: true,
    colorStops: [
      { value: 0,  color: [5,   10,  60] },
      { value: 1,  color: [20,  60, 120] },
      { value: 3,  color: [60, 160, 100] },
      { value: 5,  color: [180, 180,  40] },
      { value: 8,  color: [180,  80,  20] },
      { value: 10, color: [120,  40,  10] },
    ],
    legendLabels: ['10', '8', '5', '3', '1', '0'],
  },
  {
    id: 'nitrate',
    label: 'Nitrate Concentration',
    shortLabel: 'NO₃',
    unit: 'mmol/m³',
    sublabel: 'Nutrient level',
    source: 'Simulated (upwelling model)',
    icon: <span className="text-[11px] font-bold text-green-300 w-4 inline-block text-center">NO₃</span>,
    isSimulated: true,
    colorStops: [
      { value: 0,  color: [5,   10,  40] },
      { value: 2,  color: [20,  60, 100] },
      { value: 5,  color: [40, 140,  80] },
      { value: 10, color: [140, 200,  40] },
      { value: 20, color: [220, 160,  20] },
      { value: 30, color: [200,  40,  10] },
    ],
    legendLabels: ['30', '20', '10', '5', '2', '0'],
  },
  {
    id: 'pfz',
    label: 'Potential Fishing Zones',
    shortLabel: 'PFZ',
    unit: '%',
    sublabel: 'ML fishing probability',
    source: 'ML RandomForest (INCOIS / ISRO)',
    icon: <Fish className="w-4 h-4 text-emerald-400" />,
    isSimulated: false,
    colorStops: [
      { value: 0,   color: [60,  10,  10] },
      { value: 0.3, color: [180, 60,  20] },
      { value: 0.5, color: [220, 160, 20] },
      { value: 0.7, color: [80,  200, 60] },
      { value: 0.9, color: [20,  255, 100] },
      { value: 1.0, color: [0,   255, 180] },
    ],
    legendLabels: ['100%', '90%', '70%', '50%', '30%', '0%'],
  },
];

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface GlobalOceanGlobeProps {
  onAskOrca?: (location: MarineLocationData, variable: OceanVariable) => void;
  onAskMatsya?: (location: MarineLocationData, variable: OceanVariable) => void;
  onOpenVoiceModal?: (query: string) => void;
  onNavigate?: (view: string) => void;
  initialVariable?: OceanVariable;
  isFullScreenDefault?: boolean;
  onCloseFullScreen?: () => void;
}

interface SelectedPoint { lat: number; lng: number }

interface PfzMarkerData {
  latitude: number;
  longitude: number;
  sst: number;
  sst_gradient: number;
  chlorophyll: number;
  pfz_probability: number;
  date: string;
}

interface ExtendedLocationData extends MarineLocationData {
  dataStatus?: 'LIVE' | 'CACHED' | 'MODEL' | 'SIMULATED';
  dataTimestamp?: string;
  sstSource?: string;
  chlorophyllSource?: string;
  waveSource?: string;
  // Simulated extended fields
  oxygen?: number;
  ph?: number;
  turbidity?: number;
  nitrate?: number;
  sshMeters?: number;
}

// ═══════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════

const EARTH_RADIUS = 2;
const MARKER_RADIUS = EARTH_RADIUS + 0.025;

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function vector3ToLatLng(point: THREE.Vector3): { lat: number; lng: number } {
  const radius = point.length();
  const lat = 90 - Math.acos(point.y / radius) * (180 / Math.PI);
  const lng = -(Math.atan2(point.z, -point.x) * (180 / Math.PI)) - 180;
  const normalizedLng = ((lng + 540) % 360) - 180;
  return { lat: parseFloat(lat.toFixed(4)), lng: parseFloat(normalizedLng.toFixed(4)) };
}

// Deterministic marine data generator
function generateMarineData(lat: number, lng: number, timeOffset = 0) {
  const h1 = Math.abs(Math.sin(lat * 0.0174533 * 127.1 + lng * 0.0174533 * 311.7) * 43758.5453 % 1);
  const h2 = Math.abs(Math.sin(lat * 0.05 + 1 + lng * 0.05 + 2) * 12345.678 % 1);
  const h3 = Math.abs(Math.sin(lat * 0.03 - lng * 0.07 + 3) * 98765.432 % 1);
  const tVar = Math.sin(timeOffset * 0.261799) * 0.06; // π/12

  const latAbs = Math.abs(lat);
  const tropicFactor = Math.max(0, 1 - latAbs / 50);

  const isBayOfBengal = lng > 80 && lng < 95 && lat > 5 && lat < 22;
  const isArabianSea = lng > 55 && lng < 78 && lat > 8 && lat < 27;
  const isCoastal = h2 > 0.65;

  // SST
  let sst = 28 * tropicFactor + 5 * (1 - tropicFactor);
  if (isBayOfBengal) sst = 28 + h1 * 3;
  if (isArabianSea) sst = 27 + h1 * 2;
  sst += tVar * 2 + (h1 - 0.5) * 2;
  sst = Math.max(2, Math.min(34, +sst.toFixed(1)));

  // Chlorophyll
  let chl = 0.2 + h1 * 0.6;
  if (isBayOfBengal) chl = 0.6 + h1 * 1.4;
  if (isArabianSea) chl = 1.1 + h1 * 1.8; // upwelling
  if (isCoastal) chl += 0.5;
  chl += tVar * 0.2;
  chl = Math.max(0.05, Math.min(5, +chl.toFixed(2)));

  // Salinity
  let sal = 35 + (h2 - 0.5) * 1.5;
  if (isBayOfBengal) sal = 33 + h1 * 1.5;
  if (isArabianSea) sal = 36 + h1 * 0.8;
  sal = Math.max(30, Math.min(38, +sal.toFixed(1)));

  // Wave height
  let waveH = 0.4 + h2 * 1.5;
  if (latAbs > 40) waveH += 1.5;
  waveH += tVar * 0.3;
  waveH = Math.max(0.1, Math.min(6, +waveH.toFixed(1)));

  // Wind
  let wind = 8 + h3 * 20;
  if (latAbs > 30) wind += 10;
  wind += tVar * 3;
  wind = Math.max(2, Math.min(60, +wind.toFixed(0)));

  // Current
  let cur = 0.1 + h1 * 0.8;
  if (latAbs < 5) cur += 0.5;
  cur = Math.max(0.05, Math.min(2, +cur.toFixed(2)));

  // Dissolved Oxygen (higher in cold/polar, lower in warm tropics)
  let oxygen = 6.5 + (1 - tropicFactor) * 3 + (h2 - 0.5) * 1.5;
  oxygen += tVar * 0.5;
  oxygen = Math.max(2.5, Math.min(12, +oxygen.toFixed(1)));

  // SSH (mesoscale eddies)
  let ssh = (h1 - 0.5) * 0.4 + Math.sin(lat * 0.1 + timeOffset * 0.05) * 0.1;
  ssh = Math.max(-0.9, Math.min(0.9, +ssh.toFixed(2)));

  // pH (inversely related to SST + slight random variation)
  let ph = 8.1 - (sst - 20) * 0.004 + (h3 - 0.5) * 0.15;
  ph = Math.max(7.5, Math.min(8.4, +ph.toFixed(2)));

  // Turbidity (higher near coasts/river mouths)
  let turb = 0.5 + h2 * 2.5;
  if (isBayOfBengal) turb = 2 + h1 * 4;
  if (isCoastal) turb += 1.5;
  turb = Math.max(0.1, Math.min(10, +turb.toFixed(1)));

  // Nitrate (upwelling zones much higher)
  let nitrate = 2 + h1 * 6;
  if (isArabianSea) nitrate = 10 + h1 * 15;
  if (isBayOfBengal) nitrate = 3 + h1 * 5;
  nitrate = Math.max(0.2, Math.min(30, +nitrate.toFixed(1)));

  const risk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' =
    waveH > 3 || wind > 45 ? 'HIGH' : waveH > 1.8 || wind > 28 ? 'MODERATE' : 'LOW';

  const suitability: 'FAVOURABLE' | 'MODERATE' | 'UNFAVOURABLE' | 'RESTRICTED' =
    chl > 0.8 && sst > 24 && sst < 30 && waveH < 2 ? 'FAVOURABLE' :
    chl > 0.4 && waveH < 2.5 ? 'MODERATE' : 'UNFAVOURABLE';

  const productivity: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY HIGH' =
    chl > 2 ? 'VERY HIGH' : chl > 1 ? 'HIGH' : chl > 0.5 ? 'MEDIUM' : 'LOW';

  return {
    sst, chl, sal, waveH, wind, cur,
    oxygen, ssh, ph, turbidity: turb, nitrate,
    risk, suitability, productivity,
  };
}

function getDisplayDate(timeOffset: number): string {
  const base = new Date('2026-08-28T00:00:00Z');
  const d = new Date(base.getTime() + timeOffset * 3_600_000);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${day} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}  ${hh}:${mm} UTC`;
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export const GlobalOceanGlobe: React.FC<GlobalOceanGlobeProps> = ({
  onAskOrca,
  onAskMatsya,
  onOpenVoiceModal,
  onNavigate,
  initialVariable = 'temperature',
  isFullScreenDefault = false,
  onCloseFullScreen,
}) => {
  // ── Three.js refs ──────────────────────────────────────────────────
  const containerRef       = useRef<HTMLDivElement>(null);
  const canvasRef          = useRef<HTMLCanvasElement>(null);
  const rendererRef        = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef           = useRef<THREE.Scene | null>(null);
  const cameraRef          = useRef<THREE.PerspectiveCamera | null>(null);
  const globeRef           = useRef<THREE.Mesh | null>(null);
  const globeMaterialRef   = useRef<THREE.ShaderMaterial | null>(null);
  const atmosphereRef      = useRef<THREE.Mesh | null>(null);
  const markerGroupRef     = useRef<THREE.Group | null>(null);
  const pfzGroupRef        = useRef<THREE.Group | null>(null);
  const selectedMarkerRef  = useRef<THREE.Mesh | null>(null);
  const selectedGlowRef    = useRef<THREE.Mesh | null>(null);
  const animationRef       = useRef<number>(0);
  const isDraggingRef      = useRef(false);
  const prevMouseRef       = useRef({ x: 0, y: 0 });
  const rotationRef        = useRef({ x: 0.3, y: -1.4 });
  const targetRotRef       = useRef({ x: 0.3, y: -1.4 });
  const zoomRef            = useRef(5.5);
  const targetZoomRef      = useRef(5.5);
  const autoRotateRef      = useRef(true);
  const dragStartRef       = useRef({ x: 0, y: 0 });
  const pulseRef           = useRef(0);
  const playIntervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── React state ────────────────────────────────────────────────────
  const [isLoading,       setIsLoading]       = useState(true);
  const [isFullScreen,    setIsFullScreen]     = useState(isFullScreenDefault);
  const [activeLayer,     setActiveLayer]     = useState<OceanLayerId>('sst');
  const [selectedPoint,   setSelectedPoint]   = useState<SelectedPoint | null>(null);
  const [locationData,    setLocationData]    = useState<ExtendedLocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [pfzMarkers,      setPfzMarkers]      = useState<PfzMarkerData[]>([]);
  const [selectedPfz,     setSelectedPfz]     = useState<PfzMarkerData | null>(null);
  const [analysisResult,  setAnalysisResult]  = useState<{ loading: boolean; answer?: string; error?: string }>({ loading: false });
  const [timeOffset,      setTimeOffset]      = useState(0);
  const [isPlaying,       setIsPlaying]       = useState(false);
  const [dataStatus,      setDataStatus]      = useState<'LIVE' | 'SIMULATED'>('SIMULATED');

  const currentLayerDef = OCEAN_LAYERS.find(l => l.id === activeLayer)!;

  // ── Load PFZ data ──────────────────────────────────────────────────
  useEffect(() => {
    fetchMLPfzPredictions().then(res => {
      if (res?.predictions) setPfzMarkers(res.predictions);
    });
  }, []);

  // ── GLSL fragment shader ───────────────────────────────────────────
  const buildFragShader = useCallback((layerId: OceanLayerId): string => {
    const layer = OCEAN_LAYERS.find(l => l.id === layerId)!;
    const s = layer.colorStops;
    const n = s.length;

    // Generate GLSL color stop arrays (fixed at 9 slots max, pad with last value)
    const MAX = 9;
    const colors: string[] = [];
    const vals: string[] = [];
    for (let i = 0; i < MAX; i++) {
      const idx = Math.min(i, n - 1);
      colors.push(`vec3(${(s[idx].color[0]/255).toFixed(4)},${(s[idx].color[1]/255).toFixed(4)},${(s[idx].color[2]/255).toFixed(4)})`);
      vals.push((s[idx].value).toFixed(6));
    }

    const oceanCase = {
      sst: `
        t = 1.0 - abs(latNorm - 0.5) * 1.8;
        t += (fbm(coord * 4.0 + vec2(2.1, 0.8)) - 0.5) * 0.25;
        t -= depthFactor * 0.08;
        t += sin(u_timeOffset * 0.261799) * 0.05;`,
      chlorophyll: `
        float coastal = 1.0 - smoothstep(0.0, 0.35, depthFactor);
        t = coastal * 0.6 + fbm(coord * 7.0) * 0.35;
        t += abs(latNorm - 0.5) * 0.3;`,
      salinity: `
        t = 0.4 + (1.0 - abs(latNorm - 0.36)) * 0.3;
        t += (fbm(coord * 5.0) - 0.5) * 0.2;
        float riverMouth = smoothstep(8.0, 2.0, length(vec2(lng - 86.0, lat - 16.0)));
        t -= riverMouth * 0.25;`,
      oxygen: `
        t = 1.0 - (1.0 - abs(latNorm - 0.5) * 1.6) * 0.7;
        t += (1.0 - depthFactor) * 0.2;
        t += (fbm(coord * 4.0) - 0.5) * 0.15;`,
      current: `
        float gyre = sin(lat * 0.08 + u_timeOffset * 0.04) * cos(lng * 0.05);
        t = abs(gyre) * 0.45 + fbm(coord * 5.0) * 0.3 + depthFactor * 0.2;`,
      ssh: `
        float eddy = sin(lat * 0.15 + u_timeOffset * 0.08) * cos(lng * 0.08);
        t = 0.5 + eddy * 0.4 + (fbm(coord * 6.0) - 0.5) * 0.2;`,
      ph: `
        float warmAcid = (1.0 - abs(latNorm - 0.5) * 1.5) * 0.3;
        t = 0.75 - warmAcid + (fbm(coord * 4.0) - 0.5) * 0.15;`,
      turbidity: `
        float coastal2 = 1.0 - smoothstep(0.0, 0.4, depthFactor);
        t = coastal2 * 0.7 + fbm(coord * 8.0) * 0.25;
        float bay = smoothstep(12.0, 3.0, length(vec2(lng - 86.0, lat - 14.0)));
        t += bay * 0.4;`,
      nitrate: `
        float arabian = smoothstep(18.0, 4.0, length(vec2(lng - 64.0, lat - 14.0)));
        float peru = smoothstep(12.0, 3.0, length(vec2(lng + 81.0, lat + 8.0)));
        float upwell = max(arabian, peru);
        t = upwell * 0.8 + (1.0 - depthFactor) * 0.15 + fbm(coord * 5.0) * 0.15;`,
      pfz: `
        float coastal3 = 1.0 - smoothstep(0.0, 0.4, depthFactor);
        float warm = 1.0 - abs(latNorm - 0.45) * 1.8;
        t = coastal3 * 0.45 + warm * 0.3 + fbm(coord * 6.0) * 0.25;`,
    }[layerId] ?? `t = fbm(coord * 4.0);`;

    return `
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform vec3 lightDir;
      uniform float u_timeOffset;

      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){
        vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
      }
      float fbm(vec2 p){
        float v=0.0,a=0.5;
        for(int i=0;i<5;i++){v+=a*noise(p);p*=2.0;a*=0.5;}
        return v;
      }

      vec3 getLayerColor(float t){
        vec3 colors[${MAX}]; float vals[${MAX}];
        ${colors.map((c, i) => `colors[${i}]=${c};`).join('')}
        ${vals.map((v, i) => `vals[${i}]=${v};`).join('')}
        float minV=vals[0], maxV=vals[${n-1}];
        float val=mix(minV,maxV,clamp(t,0.0,1.0));
        if(val<=vals[0]) return colors[0];
        if(val>=vals[${n-1}]) return colors[${n-1}];
        for(int i=0;i<${n-1};i++){
          if(val>=vals[i]&&val<=vals[i+1]){
            float f=(val-vals[i])/(vals[i+1]-vals[i]);
            return mix(colors[i],colors[i+1],f);
          }
        }
        return colors[${n-1}];
      }

      void main(){
        float lat=asin(clamp(vNormal.y,-1.0,1.0))*57.2958;
        float lng=atan(vNormal.z,vNormal.x)*57.2958;
        float latNorm=(lat+90.0)/180.0;
        vec2 coord=vec2(lng*0.05,lat*0.05);

        // Land mask
        float land=fbm(coord*3.0+vec2(1.7,2.3))+0.3*fbm(coord*8.0+vec2(5.1,3.7));
        float thr=0.52;
        float landBoost=max(max(
          smoothstep(22.0,5.0,length(vec2(lng-78.0,lat-20.0))),
          smoothstep(32.0,10.0,length(vec2(lng-20.0,lat-5.0)))),max(max(
          smoothstep(28.0,8.0,length(vec2(lng-10.0,lat-48.0))),
          smoothstep(38.0,12.0,length(vec2(lng-100.0,lat-35.0)))),max(
          smoothstep(32.0,10.0,length(vec2(lng+100.0,lat-40.0))),max(
          smoothstep(26.0,8.0,length(vec2(lng+60.0,lat+15.0))),
          smoothstep(22.0,6.0,length(vec2(lng-135.0,lat+25.0)))))));
        thr-=landBoost*0.16;
        bool isLand=land>thr;

        vec3 color;
        if(isLand){
          float elev=(land-thr)/(1.0-thr);
          color=mix(vec3(0.078,0.098,0.059),vec3(0.120,0.088,0.050),elev);
          // Snow caps
          if(latNorm<0.1||latNorm>0.9) color=mix(color,vec3(0.9,0.95,1.0),smoothstep(0.05,0.0,latNorm-0.9+0.9));
        } else {
          float depthFactor=(thr-land)/thr;
          float oceanNoise=fbm(coord*6.0+vec2(4.2,1.8));
          float t=0.0;
          ${oceanCase}
          t=clamp(t,0.0,1.0);
          color=getLayerColor(t);
          color+=vec3(oceanNoise*0.03);
        }

        float diff=max(dot(vNormal,lightDir),0.0);
        color*=(0.28+diff*0.72);
        float rim=pow(1.0-max(dot(vNormal,normalize(cameraPosition-vPosition)),0.0),3.5);
        color+=vec3(0.1,0.22,0.42)*rim*0.5;
        gl_FragColor=vec4(color,1.0);
      }`;
  }, []);

  // ── Three.js init ──────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020810);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.z = zoomRef.current;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // Lighting
    scene.add(new THREE.AmbientLight(0x334455, 0.55));
    const sun = new THREE.DirectionalLight(0xffffff, 1.3);
    sun.position.set(5, 3, 5);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x4488ff, 0.25);
    rim.position.set(-3, -1, -2);
    scene.add(rim);

    // Globe
    const vsh = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      void main(){
        vNormal=normalize(normalMatrix*normal);
        vPosition=(modelMatrix*vec4(position,1.0)).xyz;
        vUv=uv;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
      }`;
    const earthGeom = new THREE.SphereGeometry(EARTH_RADIUS, 128, 64);
    const earthMat = new THREE.ShaderMaterial({
      vertexShader: vsh,
      fragmentShader: buildFragShader('sst'),
      uniforms: {
        lightDir: { value: new THREE.Vector3(0.5, 0.3, 0.5).normalize() },
        cameraPosition: { value: camera.position },
        u_timeOffset: { value: 0 },
      },
    });
    const globe = new THREE.Mesh(earthGeom, earthMat);
    scene.add(globe);
    globeRef.current = globe;
    globeMaterialRef.current = earthMat;

    // Atmosphere
    const atmGeom = new THREE.SphereGeometry(EARTH_RADIUS * 1.018, 64, 32);
    const atmMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vN; varying vec3 vP;
        void main(){ vN=normalize(normalMatrix*normal);
          vP=(modelMatrix*vec4(position,1.0)).xyz;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vN; varying vec3 vP; uniform vec3 cameraPos;
        void main(){
          float rim=pow(1.0-max(dot(vN,normalize(cameraPos-vP)),0.0),4.5);
          gl_FragColor=vec4(0.18,0.48,0.92,rim*0.38); }`,
      uniforms: { cameraPos: { value: camera.position } },
      transparent: true, side: THREE.BackSide, depthWrite: false,
    });
    const atmosphere = new THREE.Mesh(atmGeom, atmMat);
    scene.add(atmosphere);
    atmosphereRef.current = atmosphere;

    // Marker group
    const markerGroup = new THREE.Group();
    scene.add(markerGroup);
    markerGroupRef.current = markerGroup;

    // PFZ group
    const pfzGroup = new THREE.Group();
    scene.add(pfzGroup);
    pfzGroupRef.current = pfzGroup;

    // Stars
    const starPos = new Float32Array(2000 * 3);
    for (let i = 0; i < starPos.length; i++) starPos[i] = (Math.random() - 0.5) * 90;
    const starGeom = new THREE.BufferGeometry();
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeom, new THREE.PointsMaterial({ color: 0xffffff, size: 0.04, sizeAttenuation: true }));
    scene.add(stars);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      if (autoRotateRef.current && !isDraggingRef.current) {
        targetRotRef.current.y += 0.0007;
      }

      rotationRef.current.x += (targetRotRef.current.x - rotationRef.current.x) * 0.08;
      rotationRef.current.y += (targetRotRef.current.y - rotationRef.current.y) * 0.08;
      zoomRef.current += (targetZoomRef.current - zoomRef.current) * 0.08;

      globe.rotation.x = rotationRef.current.x;
      globe.rotation.y = rotationRef.current.y;
      atmosphere.rotation.x = rotationRef.current.x;
      atmosphere.rotation.y = rotationRef.current.y;
      markerGroup.rotation.x = rotationRef.current.x;
      markerGroup.rotation.y = rotationRef.current.y;
      pfzGroup.rotation.x = rotationRef.current.x;
      pfzGroup.rotation.y = rotationRef.current.y;

      camera.position.z = zoomRef.current;
      (earthMat.uniforms.cameraPosition as any).value.copy(camera.position);
      (atmMat.uniforms.cameraPos as any).value.copy(camera.position);

      // Pulse selected marker glow
      pulseRef.current += 0.04;
      if (selectedGlowRef.current) {
        const mat = selectedGlowRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.08 + Math.abs(Math.sin(pulseRef.current)) * 0.18;
        selectedGlowRef.current.scale.setScalar(1 + Math.sin(pulseRef.current * 0.7) * 0.08);
      }

      renderer.render(scene, camera);
    };
    animate();
    setIsLoading(false);

    const handleResize = () => {
      if (!containerRef.current) return;
      const nw = containerRef.current.clientWidth;
      const nh = containerRef.current.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      earthGeom.dispose(); earthMat.dispose();
      atmGeom.dispose(); atmMat.dispose();
      starGeom.dispose();
    };
  }, [buildFragShader]);

  // ── Shader update on layer change ─────────────────────────────────
  useEffect(() => {
    if (!globeMaterialRef.current) return;
    globeMaterialRef.current.fragmentShader = buildFragShader(activeLayer);
    globeMaterialRef.current.needsUpdate = true;
  }, [activeLayer, buildFragShader]);

  // ── Update time uniform ───────────────────────────────────────────
  useEffect(() => {
    if (!globeMaterialRef.current) return;
    globeMaterialRef.current.uniforms.u_timeOffset.value = timeOffset;
  }, [timeOffset]);

  // ── PFZ visibility ────────────────────────────────────────────────
  useEffect(() => {
    if (pfzGroupRef.current) pfzGroupRef.current.visible = activeLayer === 'pfz';
  }, [activeLayer]);

  // ── PFZ markers update ────────────────────────────────────────────
  useEffect(() => {
    const group = pfzGroupRef.current;
    if (!group || pfzMarkers.length === 0) return;
    while (group.children.length > 0) {
      const c = group.children[0] as THREE.Mesh;
      c.geometry?.dispose(); (c.material as THREE.Material)?.dispose(); group.remove(c);
    }
    const geom = new THREE.SphereGeometry(0.022, 10, 7);
    pfzMarkers.forEach(pfz => {
      const mat = new THREE.MeshBasicMaterial({
        color: pfz.pfz_probability > 0.7 ? 0x00ff88 : pfz.pfz_probability > 0.4 ? 0xffaa00 : 0xff4444,
        transparent: true, opacity: 0.85,
      });
      const m = new THREE.Mesh(geom, mat);
      m.position.copy(latLngToVector3(pfz.latitude, pfz.longitude, MARKER_RADIUS));
      m.userData = pfz;
      group.add(m);
    });
    return () => { geom.dispose(); };
  }, [pfzMarkers]);

  // ── Play animation ────────────────────────────────────────────────
  const handlePlay = useCallback(() => {
    if (isPlaying) {
      if (playIntervalRef.current) { clearInterval(playIntervalRef.current); playIntervalRef.current = null; }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playIntervalRef.current = setInterval(() => {
        setTimeOffset(prev => { const n = prev + 1; return n > 24 ? -24 : n; });
      }, 280);
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => { if (playIntervalRef.current) clearInterval(playIntervalRef.current); };
  }, []);

  // ── Pointer handlers ─────────────────────────────────────────────
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    autoRotateRef.current = false;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - prevMouseRef.current.x;
    const dy = e.clientY - prevMouseRef.current.y;
    targetRotRef.current.y += dx * 0.005;
    targetRotRef.current.x += dy * 0.005;
    targetRotRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotRef.current.x));
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const dx = Math.abs(e.clientX - dragStartRef.current.x);
    const dy = Math.abs(e.clientY - dragStartRef.current.y);
    isDraggingRef.current = false;
    if (dx < 5 && dy < 5) handleGlobeClick(e);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    targetZoomRef.current = Math.max(3, Math.min(12, targetZoomRef.current + e.deltaY * 0.003));
  }, []);

  const handleGlobeClick = useCallback((e: React.PointerEvent) => {
    if (!canvasRef.current || !cameraRef.current || !globeRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    // PFZ hit first
    if (activeLayer === 'pfz' && pfzGroupRef.current?.visible) {
      const hits = raycaster.intersectObjects(pfzGroupRef.current.children);
      if (hits.length > 0) {
        setSelectedPfz(hits[0].object.userData as PfzMarkerData);
        setSelectedPoint(null); setLocationData(null);
        return;
      }
    }

    // Globe hit
    const hits = raycaster.intersectObject(globeRef.current);
    if (hits.length === 0) return;

    const local = globeRef.current.worldToLocal(hits[0].point.clone());
    const { lat, lng } = vector3ToLatLng(local);

    // Place marker
    if (markerGroupRef.current) {
      // Remove old
      if (selectedMarkerRef.current) {
        (selectedMarkerRef.current.geometry as any).dispose();
        (selectedMarkerRef.current.material as THREE.Material).dispose();
        markerGroupRef.current.remove(selectedMarkerRef.current);
      }
      if (selectedGlowRef.current) {
        (selectedGlowRef.current.geometry as any).dispose();
        (selectedGlowRef.current.material as THREE.Material).dispose();
        markerGroupRef.current.remove(selectedGlowRef.current);
      }
      const pos = latLngToVector3(lat, lng, MARKER_RADIUS + 0.01);
      // Core pin
      const pinGeom = new THREE.SphereGeometry(0.038, 16, 12);
      const pinMat = new THREE.MeshBasicMaterial({ color: 0x00e8ff });
      const pin = new THREE.Mesh(pinGeom, pinMat);
      pin.position.copy(pos);
      markerGroupRef.current.add(pin);
      selectedMarkerRef.current = pin;
      // Glow halo
      const glowGeom = new THREE.SphereGeometry(0.12, 16, 12);
      const glowMat = new THREE.MeshBasicMaterial({ color: 0x00e8ff, transparent: true, opacity: 0.15 });
      const glow = new THREE.Mesh(glowGeom, glowMat);
      glow.position.copy(pos);
      markerGroupRef.current.add(glow);
      selectedGlowRef.current = glow;
    }

    setSelectedPoint({ lat, lng });
    setSelectedPfz(null);
    setAnalysisResult({ loading: false });
    setLocationLoading(true);
    setLocationData(null);

    // Merge API data with generated extended fields
    const generated = generateMarineData(lat, lng, timeOffset);
    fetchMarineLocation(lat, lng)
      .then((apiData: any) => {
        setDataStatus(apiData?.dataStatus === 'LIVE' ? 'LIVE' : 'SIMULATED');
        const merged: ExtendedLocationData = {
          ...apiData,
          oxygen:    generated.oxygen,
          ph:        generated.ph,
          turbidity: generated.turbidity,
          nitrate:   generated.nitrate,
          sshMeters: generated.ssh,
          dataStatus: apiData?.dataStatus,
          sstSource:  apiData?.sstSource,
          chlorophyllSource: apiData?.chlorophyllSource,
          waveSource: apiData?.waveSource,
        };
        setLocationData(merged);
        setLocationLoading(false);
      })
      .catch(() => {
        // Fallback: build from generated data
        setDataStatus('SIMULATED');
        const fallback: ExtendedLocationData = {
          locationName: `${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E`,
          latitude: lat, longitude: lng,
          temperature: generated.sst, salinity: generated.sal,
          chlorophyll: generated.chl, waveHeight: generated.waveH,
          windSpeed: generated.wind, windDirection: 'NE',
          currentSpeed: generated.cur, currentDirection: 'E',
          precipitation: 0, seaLevelAnomaly: Math.round(generated.ssh * 100),
          weatherCondition: 'Clear', marineRisk: generated.risk,
          fishingSuitability: generated.suitability,
          productivityIndicator: generated.productivity,
          lastUpdated: new Date().toISOString(),
          geofenceStatus: 'CLEAR',
          oxygen: generated.oxygen, ph: generated.ph,
          turbidity: generated.turbidity, nitrate: generated.nitrate,
          sshMeters: generated.ssh, dataStatus: 'SIMULATED',
        };
        setLocationData(fallback);
        setLocationLoading(false);
      });
  }, [activeLayer, timeOffset]);

  const handleAnalyzeLocation = useCallback(async () => {
    if (!selectedPoint || !locationData) return;
    setAnalysisResult({ loading: true });
    try {
      const result = await runAgentOrchestration(
        `Analyze this ocean location for fishing and safety. SST: ${locationData.temperature}°C, Chl-a: ${locationData.chlorophyll} mg/m³, Waves: ${locationData.waveHeight}m, Wind: ${locationData.windSpeed} km/h`,
        'en',
        { lat: selectedPoint.lat, lng: selectedPoint.lng }
      );
      setAnalysisResult({ loading: false, answer: result.answer });
    } catch (err: any) {
      setAnalysisResult({ loading: false, error: err?.message || 'Analysis failed' });
    }
  }, [selectedPoint, locationData]);

  const handleZoomIn  = () => { targetZoomRef.current = Math.max(3, targetZoomRef.current - 1); };
  const handleZoomOut = () => { targetZoomRef.current = Math.min(12, targetZoomRef.current + 1); };
  const handleReset   = () => {
    targetRotRef.current = { x: 0.3, y: -1.4 };
    targetZoomRef.current = 5.5;
    autoRotateRef.current = true;
    setSelectedPoint(null); setLocationData(null);
    setSelectedPfz(null); setAnalysisResult({ loading: false });
    if (markerGroupRef.current) {
      while (markerGroupRef.current.children.length > 0) {
        const c = markerGroupRef.current.children[0] as THREE.Mesh;
        c.geometry?.dispose(); (c.material as THREE.Material).dispose();
        markerGroupRef.current.remove(c);
      }
      selectedMarkerRef.current = null;
      selectedGlowRef.current = null;
    }
  };
  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!isFullScreen) { containerRef.current.requestFullscreen?.().catch(() => {}); setIsFullScreen(true); }
    else { document.exitFullscreen?.().catch(() => {}); setIsFullScreen(false); onCloseFullScreen?.(); }
  };
  useEffect(() => {
    const onChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // ── Voice analysis ────────────────────────────────────────────────
  const handleVoiceAnalysis = useCallback(() => {
    const query = selectedPoint
      ? `Analyze ocean at ${selectedPoint.lat.toFixed(3)}°${selectedPoint.lat >= 0 ? 'N' : 'S'}, ${selectedPoint.lng.toFixed(3)}°${selectedPoint.lng >= 0 ? 'E' : 'W'}. SST: ${locationData?.temperature ?? '?'}°C, Chl-a: ${locationData?.chlorophyll ?? '?'} mg/m³, Waves: ${locationData?.waveHeight ?? '?'}m. Active layer: ${currentLayerDef.label}. Is this good for fishing and is it safe?`
      : `Analyze ocean conditions around India, Bay of Bengal, and Arabian Sea. Current layer: ${currentLayerDef.label}`;
    onOpenVoiceModal?.(query);
  }, [selectedPoint, locationData, currentLayerDef, onOpenVoiceModal]);

  // ── Helpers ───────────────────────────────────────────────────────
  const getLayerValue = () => {
    if (!locationData) return null;
    switch (activeLayer) {
      case 'sst':        return { v: `${locationData.temperature}°C`, lbl: 'SST' };
      case 'chlorophyll':return { v: `${locationData.chlorophyll} mg/m³`, lbl: 'Chl-a' };
      case 'salinity':   return { v: `${locationData.salinity} PSU`, lbl: 'Salinity' };
      case 'oxygen':     return { v: `${locationData.oxygen ?? '--'} mg/L`, lbl: 'Dissolved O₂' };
      case 'current':    return { v: `${locationData.currentSpeed} m/s`, lbl: 'Current Speed' };
      case 'ssh':        return { v: `${locationData.sshMeters ?? (locationData.seaLevelAnomaly / 100).toFixed(2)} m`, lbl: 'SSH Anomaly' };
      case 'ph':         return { v: `${locationData.ph ?? '--'}`, lbl: 'pH Level' };
      case 'turbidity':  return { v: `${locationData.turbidity ?? '--'} FTU`, lbl: 'Turbidity' };
      case 'nitrate':    return { v: `${locationData.nitrate ?? '--'} mmol/m³`, lbl: 'Nitrate' };
      default: return null;
    }
  };

  const riskColor = (risk?: string) =>
    risk === 'LOW' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
    risk === 'MODERATE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
    risk === 'HIGH' || risk === 'CRITICAL' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
    'bg-white/10 text-white/50';

  const suitabilityColor = (s?: string) =>
    s === 'FAVOURABLE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
    s === 'MODERATE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
    'bg-red-500/20 text-red-300 border border-red-500/30';

  const layerVal = getLayerValue();
  const displayDate = getDisplayDate(timeOffset);
  const TIME_TICKS = [-24, -18, -12, -6, 0, 6, 12, 18, 24];

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-[#020810] overflow-hidden flex flex-col font-mono ${
        isFullScreen ? 'fixed inset-0 z-50' : 'h-full min-h-[600px]'
      }`}
    >
      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-[#020810] flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
          <p className="mt-3 text-sm text-teal-300 font-mono tracking-wide">Initializing 3D Ocean Globe...</p>
          <p className="mt-1 text-[10px] text-neutral-500 font-mono">MATSYA AI · Global Ocean Intelligence</p>
        </div>
      )}

      {/* ──── THREE.JS CANVAS ──── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* ──── UI OVERLAY ──── */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col select-none">

        {/* ═══ 3-COLUMN MAIN AREA ═══ */}
        <div className="flex flex-1 min-h-0">

          {/* ─── LEFT PANEL: OCEAN DATA LAYERS ─────────────────── */}
          <div className="pointer-events-auto w-[258px] shrink-0 h-full bg-black/82 backdrop-blur-xl border-r border-white/10 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 shrink-0">
              <span className="text-[9px] font-mono font-bold text-white/50 uppercase tracking-[0.2em]">
                Ocean Data Layers
              </span>
            </div>

            {/* Layer list */}
            <div className="flex-1 overflow-y-auto py-1 scrollbar-hide">
              {OCEAN_LAYERS.filter(l => l.id !== 'pfz').map(layer => (
                <button
                  key={layer.id}
                  onClick={() => setActiveLayer(layer.id)}
                  className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-all border-l-2 ${
                    activeLayer === layer.id
                      ? 'bg-teal-600/12 border-teal-400 text-white'
                      : 'border-transparent text-neutral-400 hover:bg-white/6 hover:text-neutral-200'
                  }`}
                >
                  {/* Icon slot */}
                  <span className={`mt-0.5 shrink-0 w-4 ${activeLayer === layer.id ? 'text-teal-300' : 'text-neutral-500'}`}>
                    {layer.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold leading-tight truncate">{layer.label}</div>
                    <div className="text-[9px] text-neutral-500 mt-0.5">
                      {layer.unit ? `${layer.unit} • ` : ''}{layer.sublabel}
                    </div>
                    <div className="text-[8px] text-neutral-600 mt-0.5 truncate">
                      {layer.isSimulated ? (
                        <span className="text-amber-600/70">SIMULATED DATA</span>
                      ) : (
                        <span className="text-neutral-600">Source: {layer.source.split('/')[0].trim()}</span>
                      )}
                    </div>
                  </div>
                  {activeLayer === layer.id && (
                    <span className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5" />
                  )}
                </button>
              ))}

              {/* PFZ separator */}
              <div className="mx-3 my-1 border-t border-white/8" />
              <button
                onClick={() => setActiveLayer('pfz')}
                className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-all border-l-2 ${
                  activeLayer === 'pfz'
                    ? 'bg-emerald-600/12 border-emerald-400 text-white'
                    : 'border-transparent text-neutral-400 hover:bg-white/6 hover:text-neutral-200'
                }`}
              >
                <span className={`mt-0.5 shrink-0 w-4 ${activeLayer === 'pfz' ? 'text-emerald-300' : 'text-neutral-500'}`}>
                  <Fish className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold leading-tight">Potential Fishing Zones</div>
                  <div className="text-[9px] text-neutral-500 mt-0.5">% • ML fishing probability</div>
                  <div className="text-[8px] text-emerald-700/80 mt-0.5">ML RandomForest · INCOIS / ISRO</div>
                </div>
                {activeLayer === 'pfz' && <span className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5" />}
              </button>

              {/* Compare Layers (decorative) */}
              <div className="mx-3 my-1 border-t border-white/8" />
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 text-neutral-600 hover:text-neutral-400 hover:bg-white/5 transition text-left"
                onClick={() => alert('Compare Layers: select two layers to split-screen compare. Feature in progress.')}
              >
                <Layers className="w-4 h-4 shrink-0" />
                <div>
                  <div className="text-[11px] font-bold">Compare Layers</div>
                  <div className="text-[8px] text-neutral-600">Split-view comparison</div>
                </div>
              </button>
            </div>

            {/* Footer data source */}
            <div className="px-4 py-2.5 border-t border-white/8 shrink-0 text-[8px] text-neutral-600 leading-relaxed">
              {activeLayer === 'pfz' ? (
                `${pfzMarkers.length} ML predictions loaded`
              ) : (
                currentLayerDef.source
              )}
            </div>
          </div>

          {/* ─── CENTER: transparent globe area ──────────────── */}
          <div className="flex-1 relative">
            {/* Layer name HUD – top center */}
            <div className="pointer-events-auto absolute top-3 left-1/2 -translate-x-1/2 z-20">
              <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/12 shadow-xl flex items-center gap-3 whitespace-nowrap">
                <span className={activeLayer === 'pfz' ? 'text-emerald-400' : 'text-teal-400'}>
                  {currentLayerDef.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-white">{currentLayerDef.label}</span>
                    {currentLayerDef.isSimulated ? (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25">SIMULATED</span>
                    ) : (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        {dataStatus === 'LIVE' ? 'LIVE' : 'CACHED'}
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-neutral-500">{displayDate}</div>
                </div>
              </div>
            </div>

            {/* Map controls – top right */}
            <div className="pointer-events-auto absolute top-3 right-3 z-20 flex items-center gap-1.5">
              <button onClick={handleZoomIn}  className="w-8 h-8 rounded-lg bg-black/80 backdrop-blur-sm border border-white/12 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/15 transition" title="Zoom In"><ZoomIn className="w-3.5 h-3.5" /></button>
              <button onClick={handleZoomOut} className="w-8 h-8 rounded-lg bg-black/80 backdrop-blur-sm border border-white/12 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/15 transition" title="Zoom Out"><ZoomOut className="w-3.5 h-3.5" /></button>
              <button onClick={handleReset}   className="w-8 h-8 rounded-lg bg-black/80 backdrop-blur-sm border border-white/12 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/15 transition" title="Reset View"><RotateCcw className="w-3.5 h-3.5" /></button>
              <button onClick={toggleFullScreen} className="w-8 h-8 rounded-lg bg-black/80 backdrop-blur-sm border border-white/12 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/15 transition" title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Voice analysis – bottom center of globe area */}
            <div className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
              <button
                onClick={handleVoiceAnalysis}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/75 backdrop-blur-md border border-teal-500/30 text-teal-300 hover:bg-teal-600/20 hover:border-teal-500/50 transition text-[10px] font-bold shadow-xl"
              >
                <Mic className="w-3.5 h-3.5" />
                MATSYA AI Voice Analysis
              </button>
            </div>

            {/* Hint (when nothing selected) */}
            {!selectedPoint && !selectedPfz && !isLoading && (
              <div className="pointer-events-none absolute bottom-14 left-1/2 -translate-x-1/2 z-20">
                <div className="text-[9px] text-neutral-600 font-mono text-center">
                  <MapPin className="w-3 h-3 inline mr-1 text-teal-600" />
                  Drag to rotate · Scroll to zoom · Click ocean to inspect
                </div>
              </div>
            )}
          </div>

          {/* ─── RIGHT PANEL: LEGEND + SELECTED LOCATION ───────── */}
          <div className="pointer-events-auto w-[210px] shrink-0 h-full bg-black/82 backdrop-blur-xl border-l border-white/10 flex flex-col overflow-hidden">

            {/* Color Legend */}
            <div className="px-4 py-3 border-b border-white/10 shrink-0">
              <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
                {currentLayerDef.shortLabel}{currentLayerDef.unit ? ` (${currentLayerDef.unit})` : ''}
              </div>
              <div className="flex items-stretch gap-2">
                {/* Gradient bar */}
                <div
                  className="w-4 rounded-sm shrink-0"
                  style={{
                    height: `${currentLayerDef.colorStops.length * 18}px`,
                    background: `linear-gradient(to bottom, ${
                      [...currentLayerDef.colorStops].reverse()
                        .map(s => `rgb(${s.color[0]},${s.color[1]},${s.color[2]})`)
                        .join(', ')
                    })`,
                  }}
                />
                {/* Labels */}
                <div
                  className="flex flex-col justify-between"
                  style={{ height: `${currentLayerDef.colorStops.length * 18}px` }}
                >
                  {currentLayerDef.legendLabels.map((lbl, i) => (
                    <span key={i} className="text-[9px] text-neutral-400 leading-none">{lbl}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Location data */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {/* Loading */}
              {locationLoading && (
                <div className="px-4 py-4 flex flex-col items-center gap-2 text-neutral-500">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                  <span className="text-[9px]">Fetching data...</span>
                </div>
              )}

              {/* No selection */}
              {!selectedPoint && !selectedPfz && !locationLoading && (
                <div className="px-4 py-6 text-center text-[9px] text-neutral-600 leading-relaxed">
                  Click any ocean point on the globe to inspect marine data
                </div>
              )}

              {/* Selected ocean point */}
              {selectedPoint && locationData && !locationLoading && (
                <div className="px-4 py-3 space-y-2.5">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Selected Location</span>
                    <button
                      onClick={() => { setSelectedPoint(null); setLocationData(null); setAnalysisResult({ loading: false }); }}
                      className="text-neutral-600 hover:text-white transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Coordinates */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[9px] text-neutral-500">Lat</span>
                      <span className="text-[11px] font-bold text-white">{selectedPoint.lat.toFixed(3)}°{selectedPoint.lat >= 0 ? 'N' : 'S'}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[9px] text-neutral-500">Lon</span>
                      <span className="text-[11px] font-bold text-white">{selectedPoint.lng.toFixed(3)}°{selectedPoint.lng >= 0 ? 'E' : 'W'}</span>
                    </div>
                  </div>

                  {/* Primary layer value */}
                  {layerVal && (
                    <div className="py-2 px-2.5 rounded-lg bg-teal-500/10 border border-teal-500/20">
                      <div className="text-[8px] text-teal-400 uppercase font-bold">{layerVal.lbl}</div>
                      <div className="text-lg font-bold text-white leading-tight">{layerVal.v}</div>
                    </div>
                  )}

                  {/* All variables */}
                  <div className="space-y-1">
                    {activeLayer !== 'sst' && (
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] text-neutral-500">SST</span>
                        <span className="text-[10px] font-bold text-rose-400">{locationData.temperature} °C</span>
                      </div>
                    )}
                    {activeLayer !== 'chlorophyll' && (
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] text-neutral-500">Chl-a</span>
                        <span className="text-[10px] font-bold text-emerald-400">{locationData.chlorophyll} mg/m³</span>
                      </div>
                    )}
                    {activeLayer !== 'salinity' && (
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] text-neutral-500">Salinity</span>
                        <span className="text-[10px] font-bold text-sky-400">{locationData.salinity} PSU</span>
                      </div>
                    )}
                    <div className="flex justify-between items-baseline">
                      <span className="text-[9px] text-neutral-500">Waves</span>
                      <span className="text-[10px] font-bold text-blue-300">{locationData.waveHeight} m</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[9px] text-neutral-500">Wind</span>
                      <span className="text-[10px] font-bold text-sky-300">{locationData.windSpeed} km/h</span>
                    </div>
                    {locationData.oxygen !== undefined && activeLayer !== 'oxygen' && (
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] text-neutral-500">O₂</span>
                        <span className="text-[10px] font-bold text-cyan-300">{locationData.oxygen} mg/L</span>
                      </div>
                    )}
                    {locationData.ph !== undefined && activeLayer !== 'ph' && (
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] text-neutral-500">pH</span>
                        <span className="text-[10px] font-bold text-purple-300">{locationData.ph}</span>
                      </div>
                    )}
                    {locationData.nitrate !== undefined && activeLayer !== 'nitrate' && (
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] text-neutral-500">NO₃</span>
                        <span className="text-[10px] font-bold text-green-300">{locationData.nitrate} mmol/m³</span>
                      </div>
                    )}
                  </div>

                  {/* Risk + Fishing */}
                  <div className="pt-1 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-neutral-500">Risk Level</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${riskColor(locationData.marineRisk)}`}>
                        {locationData.marineRisk}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-neutral-500">Fishing</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${suitabilityColor(locationData.fishingSuitability)}`}>
                        {locationData.fishingSuitability === 'FAVOURABLE' ? 'GOOD' :
                         locationData.fishingSuitability === 'MODERATE' ? 'FAIR' : 'POOR'}
                      </span>
                    </div>
                    {locationData.dataStatus && (
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-neutral-500">Data</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${
                          locationData.dataStatus === 'LIVE' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/8 text-neutral-500'
                        }`}>
                          {locationData.dataStatus}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Analyze button */}
                  <button
                    onClick={handleAnalyzeLocation}
                    disabled={analysisResult.loading}
                    className="w-full py-2 rounded-lg bg-teal-600 hover:bg-teal-500 active:scale-95 disabled:bg-teal-900 disabled:opacity-60 text-white text-[10px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    {analysisResult.loading
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</>
                      : <><Sparkles className="w-3 h-3" /> Analyze This Location</>
                    }
                  </button>

                  {/* AI result */}
                  {analysisResult.answer && (
                    <div className="p-2.5 rounded-lg bg-teal-900/15 border border-teal-500/20 text-[9px] text-white/80 leading-relaxed max-h-28 overflow-y-auto">
                      {analysisResult.answer.slice(0, 320)}
                      {analysisResult.answer.length > 320 && '…'}
                    </div>
                  )}
                  {analysisResult.error && (
                    <div className="flex items-center gap-1.5 text-[9px] text-red-400">
                      <AlertTriangle className="w-3 h-3 shrink-0" />{analysisResult.error}
                    </div>
                  )}
                </div>
              )}

              {/* PFZ selection panel */}
              {selectedPfz && !selectedPoint && (
                <div className="px-4 py-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">PFZ Prediction</span>
                    <button onClick={() => setSelectedPfz(null)} className="text-neutral-600 hover:text-white transition">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[9px] text-neutral-500">Lat</span>
                      <span className="text-[11px] font-bold text-white">{selectedPfz.latitude.toFixed(4)}°</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[9px] text-neutral-500">Lon</span>
                      <span className="text-[11px] font-bold text-white">{selectedPfz.longitude.toFixed(4)}°</span>
                    </div>
                  </div>
                  <div className="py-2 px-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-[8px] text-emerald-400 uppercase font-bold">PFZ Probability</div>
                    <div className="text-xl font-bold text-emerald-300">{(selectedPfz.pfz_probability * 100).toFixed(0)}%</div>
                    <div className="text-[8px] text-emerald-500/70">
                      {selectedPfz.pfz_probability > 0.7 ? 'HIGH POTENTIAL' : selectedPfz.pfz_probability > 0.4 ? 'MEDIUM POTENTIAL' : 'LOW POTENTIAL'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[9px] text-neutral-500">SST</span>
                      <span className="text-[10px] font-bold text-rose-400">{selectedPfz.sst.toFixed(1)}°C</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[9px] text-neutral-500">Chl-a</span>
                      <span className="text-[10px] font-bold text-emerald-400">{selectedPfz.chlorophyll.toFixed(2)} mg/m³</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[9px] text-neutral-500">Gradient</span>
                      <span className="text-[10px] font-bold text-amber-400">{selectedPfz.sst_gradient.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[9px] text-neutral-500">Confidence</span>
                      <span className="text-[10px] font-bold text-teal-300">{(selectedPfz.pfz_probability * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="text-[8px] text-neutral-600">ML RandomForest · Source: INCOIS/ISRO · {selectedPfz.date || 'Cached'}</div>
                  <button
                    onClick={() => { onNavigate?.('fisherman'); }}
                    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[10px] font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5"
                  >
                    <Navigation className="w-3 h-3" /> Navigate
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ BOTTOM TIME SLIDER ═══ */}
        <div className="pointer-events-auto shrink-0 h-[72px] bg-black/90 backdrop-blur-xl border-t border-white/10 flex items-center px-4 gap-4">
          {/* Play/Pause */}
          <button
            onClick={handlePlay}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition shrink-0 ${
              isPlaying ? 'bg-teal-600 text-white' : 'bg-white/10 text-neutral-300 hover:bg-white/20'
            }`}
            title={isPlaying ? 'Pause' : 'Play time animation'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* Slider area */}
          <div className="flex-1 flex flex-col gap-1">
            {/* Date label */}
            <div className="text-center text-[10px] font-mono text-neutral-400">{displayDate}</div>

            {/* Range input */}
            <div className="relative">
              <input
                type="range"
                min={-24}
                max={24}
                step={1}
                value={timeOffset}
                onChange={e => { setTimeOffset(parseInt(e.target.value)); if (isPlaying) handlePlay(); }}
                className="w-full h-1 bg-white/10 rounded-full accent-teal-400 cursor-pointer"
                style={{ background: `linear-gradient(to right, rgba(20,184,166,0.4) ${((timeOffset + 24) / 48) * 100}%, rgba(255,255,255,0.1) ${((timeOffset + 24) / 48) * 100}%)` }}
              />
            </div>

            {/* Tick labels */}
            <div className="flex justify-between px-0.5">
              {TIME_TICKS.map(h => (
                <span
                  key={h}
                  className={`text-[8px] font-mono cursor-pointer transition select-none ${
                    h === 0 ? 'text-teal-400 font-bold' :
                    h === timeOffset ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'
                  }`}
                  onClick={() => setTimeOffset(h)}
                >
                  {h === 0 ? 'Now' : h < 0 ? `${h}h` : `+${h}h`}
                </span>
              ))}
            </div>
          </div>

          {/* Calendar icon */}
          <div className="shrink-0 text-neutral-600">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        {/* Scientific footer strip */}
        <div className="pointer-events-auto shrink-0 px-4 py-1.5 bg-black/95 border-t border-white/6 flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 text-[8px] text-neutral-600 font-mono">
          <span>Coord: WGS 84 / Spherical Geodesic Projection</span>
          <span>Sensors: OCM-3 · OSCAT-3 · INSAT-3DR · Sentinel-3 · Jason-3</span>
          <span className={currentLayerDef.isSimulated ? 'text-amber-600' : 'text-emerald-600'}>
            {currentLayerDef.isSimulated ? 'SIMULATED DATA' : `DATA: ${dataStatus}`}
          </span>
        </div>
      </div>
    </div>
  );
};
