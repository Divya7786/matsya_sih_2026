import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import {
  Globe,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sparkles,
  Crosshair,
  MapPin,
  Loader2,
  AlertTriangle,
  Fish,
  Navigation,
  Wind,
  Thermometer,
  Droplets,
  ShieldCheck,
  X,
  ZoomIn,
  ZoomOut,
  Waves,
  Compass,
  Layers,
} from 'lucide-react';
import { OceanVariable, MarineLocationData } from '../types/marine';
import { fetchMarineLocation, fetchMLPfzPredictions, runAgentOrchestration, checkGeofenceStatus } from '../services/api';
import type { MLPfzPrediction } from '../services/api';

// ═══════════════════════════════════════════════════════════
// OCEAN DATA LAYER DEFINITIONS
// ═══════════════════════════════════════════════════════════

type OceanLayerId = 'sst' | 'chlorophyll' | 'salinity' | 'waveHeight' | 'wind' | 'current' | 'bathymetry' | 'pfz';

interface OceanLayerDef {
  id: OceanLayerId;
  label: string;
  shortLabel: string;
  unit: string;
  icon: React.ReactNode;
  dataField: string;
  colorStops: { value: number; color: [number, number, number] }[];
  legendLabels: string[];
  apiAvailable: boolean;
  dataSource: string;
}

const OCEAN_LAYERS: OceanLayerDef[] = [
  {
    id: 'sst',
    label: 'Sea Surface Temperature',
    shortLabel: 'SST',
    unit: '°C',
    icon: <Thermometer className="w-3.5 h-3.5" />,
    dataField: 'temperature',
    colorStops: [
      { value: 0, color: [10, 20, 80] },
      { value: 10, color: [20, 60, 180] },
      { value: 18, color: [40, 180, 180] },
      { value: 24, color: [80, 220, 80] },
      { value: 28, color: [240, 200, 20] },
      { value: 32, color: [220, 40, 20] },
    ],
    legendLabels: ['0°C', '10°C', '18°C', '24°C', '28°C', '32°C'],
    apiAvailable: true,
    dataSource: 'Open-Meteo Marine API / NCEI OISST v2.1 (ECMWF SST)',
  },
  {
    id: 'chlorophyll',
    label: 'Chlorophyll-a Concentration',
    shortLabel: 'Chl-a',
    unit: 'mg/m³',
    icon: <Droplets className="w-3.5 h-3.5" />,
    dataField: 'chlorophyll',
    colorStops: [
      { value: 0, color: [5, 5, 40] },
      { value: 0.5, color: [10, 30, 120] },
      { value: 1.0, color: [20, 100, 100] },
      { value: 2.0, color: [40, 180, 40] },
      { value: 3.0, color: [200, 220, 20] },
      { value: 5.0, color: [200, 60, 10] },
    ],
    legendLabels: ['0', '0.5', '1.0', '2.0', '3.0', '5.0'],
    apiAvailable: true,
    dataSource: 'PIFSC ESA-CCI Chl-a (8-day composite) / INCOIS Oceansat-2',
  },
  {
    id: 'salinity',
    label: 'Sea Surface Salinity',
    shortLabel: 'Salinity',
    unit: 'PSU',
    icon: <Droplets className="w-3.5 h-3.5" />,
    dataField: 'salinity',
    colorStops: [
      { value: 30, color: [200, 220, 255] },
      { value: 33, color: [80, 160, 220] },
      { value: 34, color: [40, 100, 180] },
      { value: 35, color: [20, 60, 140] },
      { value: 36, color: [60, 20, 120] },
      { value: 38, color: [120, 10, 80] },
    ],
    legendLabels: ['30', '33', '34', '35', '36', '38'],
    apiAvailable: false,
    dataSource: 'Physics model — no free real-time salinity API',
  },
  {
    id: 'waveHeight',
    label: 'Significant Wave Height',
    shortLabel: 'Waves',
    unit: 'm',
    icon: <Waves className="w-3.5 h-3.5" />,
    dataField: 'waveHeight',
    colorStops: [
      { value: 0, color: [10, 40, 80] },
      { value: 0.5, color: [20, 100, 140] },
      { value: 1.0, color: [40, 180, 120] },
      { value: 1.5, color: [180, 200, 40] },
      { value: 2.5, color: [220, 120, 20] },
      { value: 4.0, color: [200, 30, 20] },
    ],
    legendLabels: ['0m', '0.5m', '1.0m', '1.5m', '2.5m', '4.0m'],
    apiAvailable: true,
    dataSource: 'Open-Meteo Marine API (WaveWatch III / ECMWF)',
  },
  {
    id: 'wind',
    label: 'Wind Speed',
    shortLabel: 'Wind',
    unit: 'km/h',
    icon: <Wind className="w-3.5 h-3.5" />,
    dataField: 'windSpeed',
    colorStops: [
      { value: 0, color: [20, 40, 60] },
      { value: 8, color: [40, 120, 160] },
      { value: 15, color: [60, 180, 100] },
      { value: 25, color: [200, 200, 40] },
      { value: 35, color: [220, 100, 20] },
      { value: 50, color: [180, 20, 40] },
    ],
    legendLabels: ['0', '8', '15', '25', '35', '50 km/h'],
    apiAvailable: true,
    dataSource: 'Estimated from Open-Meteo Marine wave data',
  },
  {
    id: 'current',
    label: 'Ocean Current Speed',
    shortLabel: 'Current',
    unit: 'm/s',
    icon: <Navigation className="w-3.5 h-3.5" />,
    dataField: 'currentSpeed',
    colorStops: [
      { value: 0, color: [10, 20, 60] },
      { value: 0.2, color: [20, 80, 140] },
      { value: 0.4, color: [40, 160, 160] },
      { value: 0.6, color: [100, 200, 60] },
      { value: 1.0, color: [220, 180, 20] },
      { value: 1.5, color: [200, 40, 20] },
    ],
    legendLabels: ['0', '0.2', '0.4', '0.6', '1.0', '1.5 m/s'],
    apiAvailable: true,
    dataSource: 'Open-Meteo Marine API (ocean_current_velocity)',
  },
  {
    id: 'bathymetry',
    label: 'Ocean Depth (Bathymetry)',
    shortLabel: 'Depth',
    unit: 'm',
    icon: <Compass className="w-3.5 h-3.5" />,
    dataField: 'bathymetry',
    colorStops: [
      { value: 0, color: [160, 210, 230] },
      { value: 200, color: [80, 160, 200] },
      { value: 1000, color: [40, 100, 160] },
      { value: 3000, color: [20, 60, 120] },
      { value: 6000, color: [10, 30, 80] },
      { value: 11000, color: [5, 10, 40] },
    ],
    legendLabels: ['0m', '200m', '1km', '3km', '6km', '11km'],
    apiAvailable: false,
    dataSource: 'Not connected — requires GEBCO/ETOPO integration',
  },
  {
    id: 'pfz',
    label: 'Potential Fishing Zones',
    shortLabel: 'PFZ',
    unit: '%',
    icon: <Fish className="w-3.5 h-3.5" />,
    dataField: 'pfz_probability',
    colorStops: [
      { value: 0, color: [60, 10, 10] },
      { value: 0.3, color: [180, 60, 20] },
      { value: 0.5, color: [220, 160, 20] },
      { value: 0.7, color: [80, 200, 60] },
      { value: 0.9, color: [20, 255, 100] },
      { value: 1.0, color: [0, 255, 180] },
    ],
    legendLabels: ['0%', '30%', '50%', '70%', '90%', '100%'],
    apiAvailable: true,
    dataSource: 'ML RandomForest (GeoJSON — INCOIS/ISRO satellite-derived)',
  },
];

// ═══════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
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

interface SelectedPoint {
  lat: number;
  lng: number;
  screenX: number;
  screenY: number;
}

interface PfzMarkerData {
  latitude: number;
  longitude: number;
  sst: number;
  sst_gradient: number;
  chlorophyll: number;
  pfz_probability: number;
  date: string;
}

interface LocationDataExtended extends MarineLocationData {
  dataStatus?: 'LIVE' | 'CACHED' | 'MODEL' | 'SIMULATED';
  dataTimestamp?: string;
  sstStatus?: string;
  sstSource?: string;
  chlorophyllStatus?: string;
  chlorophyllSource?: string;
  waveSource?: string;
  currentSource?: string;
  salinityStatus?: string;
  windNote?: string;
}

const EARTH_RADIUS = 2;
const MARKER_RADIUS = EARTH_RADIUS + 0.02;

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

function interpolateColor(value: number, stops: { value: number; color: [number, number, number] }[]): [number, number, number] {
  if (value <= stops[0].value) return stops[0].color;
  if (value >= stops[stops.length - 1].value) return stops[stops.length - 1].color;
  for (let i = 0; i < stops.length - 1; i++) {
    if (value >= stops[i].value && value <= stops[i + 1].value) {
      const t = (value - stops[i].value) / (stops[i + 1].value - stops[i].value);
      return [
        Math.round(stops[i].color[0] + (stops[i + 1].color[0] - stops[i].color[0]) * t),
        Math.round(stops[i].color[1] + (stops[i + 1].color[1] - stops[i].color[1]) * t),
        Math.round(stops[i].color[2] + (stops[i + 1].color[2] - stops[i].color[2]) * t),
      ];
    }
  }
  return stops[stops.length - 1].color;
}

function getLayerShaderUniforms(layer: OceanLayerDef): { colorStops: number[]; valueStops: number[]; numStops: number } {
  const colorStops: number[] = [];
  const valueStops: number[] = [];
  layer.colorStops.forEach(s => {
    colorStops.push(s.color[0] / 255, s.color[1] / 255, s.color[2] / 255);
    valueStops.push(s.value);
  });
  return { colorStops, valueStops, numStops: layer.colorStops.length };
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
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const globeRef = useRef<THREE.Mesh | null>(null);
  const globeMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const markerGroupRef = useRef<THREE.Group | null>(null);
  const pfzGroupRef = useRef<THREE.Group | null>(null);
  const selectedMarkerRef = useRef<THREE.Mesh | null>(null);
  const animationRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const previousMouseRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0.3, y: -1.4 });
  const targetRotationRef = useRef({ x: 0.3, y: -1.4 });
  const zoomRef = useRef(5.5);
  const targetZoomRef = useRef(5.5);
  const autoRotateRef = useRef(true);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const [isLoading, setIsLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(isFullScreenDefault);
  const [activeLayer, setActiveLayer] = useState<OceanLayerId>('sst');
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(null);
  const [locationData, setLocationData] = useState<LocationDataExtended | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [pfzMarkers, setPfzMarkers] = useState<PfzMarkerData[]>([]);
  const [selectedPfz, setSelectedPfz] = useState<PfzMarkerData | null>(null);
  const [layerPanelOpen, setLayerPanelOpen] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<{ loading: boolean; data?: any; error?: string }>({ loading: false });

  const currentLayerDef = OCEAN_LAYERS.find(l => l.id === activeLayer)!;

  // Load PFZ data on mount
  useEffect(() => {
    fetchMLPfzPredictions().then(res => {
      if (res?.predictions) {
        setPfzMarkers(res.predictions);
      }
    });
  }, []);

  // Build the fragment shader based on the active layer
  const buildOceanFragShader = useCallback((layerId: OceanLayerId) => {
    const layer = OCEAN_LAYERS.find(l => l.id === layerId)!;
    const uniforms = getLayerShaderUniforms(layer);

    // Generate GLSL color stop array
    let colorStopsGlsl = '';
    let valueStopsGlsl = '';
    for (let i = 0; i < uniforms.numStops; i++) {
      colorStopsGlsl += `vec3(${uniforms.colorStops[i * 3].toFixed(4)}, ${uniforms.colorStops[i * 3 + 1].toFixed(4)}, ${uniforms.colorStops[i * 3 + 2].toFixed(4)})${i < uniforms.numStops - 1 ? ',' : ''}`;
      valueStopsGlsl += `${uniforms.valueStops[i].toFixed(4)}${i < uniforms.numStops - 1 ? ',' : ''}`;
    }

    // Compute value range for procedural visualization
    const minVal = uniforms.valueStops[0];
    const maxVal = uniforms.valueStops[uniforms.numStops - 1];

    return `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      uniform vec3 lightDir;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i++) {
          v += a * noise(p);
          p *= 2.0;
          a *= 0.5;
        }
        return v;
      }

      vec3 getLayerColor(float t) {
        vec3 colors[6];
        float values[6];
        colors[0] = ${colorStopsGlsl.split(',').slice(0, 1).join(',')};
        colors[1] = ${colorStopsGlsl.split(',').slice(1, 2).join(',')};
        colors[2] = ${colorStopsGlsl.split(',').slice(2, 3).join(',')};
        colors[3] = ${colorStopsGlsl.split(',').slice(3, 4).join(',')};
        colors[4] = ${colorStopsGlsl.split(',').slice(4, 5).join(',')};
        colors[5] = ${colorStopsGlsl.split(',').slice(5, 6).join(',')};
        values[0] = ${uniforms.valueStops[0].toFixed(4)};
        values[1] = ${uniforms.valueStops[1].toFixed(4)};
        values[2] = ${uniforms.valueStops[2].toFixed(4)};
        values[3] = ${uniforms.valueStops[3].toFixed(4)};
        values[4] = ${uniforms.valueStops[4].toFixed(4)};
        values[5] = ${uniforms.valueStops[5].toFixed(4)};

        float val = mix(${minVal.toFixed(4)}, ${maxVal.toFixed(4)}, t);

        if (val <= values[0]) return colors[0];
        if (val >= values[5]) return colors[5];

        for (int i = 0; i < 5; i++) {
          if (val >= values[i] && val <= values[i+1]) {
            float f = (val - values[i]) / (values[i+1] - values[i]);
            return mix(colors[i], colors[i+1], f);
          }
        }
        return colors[5];
      }

      void main() {
        float lat = asin(vNormal.y) * 57.2958;
        float lng = atan(vNormal.z, vNormal.x) * 57.2958;

        vec2 coord = vec2(lng * 0.05, lat * 0.05);
        float land = fbm(coord * 3.0 + vec2(1.7, 2.3));
        land += 0.3 * fbm(coord * 8.0 + vec2(5.1, 3.7));

        float threshold = 0.52;
        float indiaFactor = smoothstep(20.0, 5.0, length(vec2(lng - 78.0, lat - 20.0)));
        float africaFactor = smoothstep(30.0, 10.0, length(vec2(lng - 20.0, lat - 5.0)));
        float euroFactor = smoothstep(25.0, 8.0, length(vec2(lng - 10.0, lat - 48.0)));
        float asiaFactor = smoothstep(35.0, 12.0, length(vec2(lng - 100.0, lat - 35.0)));
        float naFactor = smoothstep(30.0, 10.0, length(vec2(lng + 100.0, lat - 40.0)));
        float saFactor = smoothstep(25.0, 8.0, length(vec2(lng + 60.0, lat + 15.0)));
        float ausFactor = smoothstep(20.0, 6.0, length(vec2(lng - 135.0, lat + 25.0)));

        float landBoost = max(max(max(indiaFactor, africaFactor), max(euroFactor, asiaFactor)), max(max(naFactor, saFactor), ausFactor));
        threshold -= landBoost * 0.15;

        bool isLand = land > threshold;

        vec3 color;
        if (isLand) {
          // Dark land for all layers
          vec3 lowLand = vec3(0.08, 0.1, 0.06);
          vec3 highLand = vec3(0.12, 0.09, 0.05);
          float elevation = (land - threshold) / (1.0 - threshold);
          color = mix(lowLand, highLand, elevation);
        } else {
          // Ocean: colorized by layer variable
          float depth = (threshold - land) / threshold;

          // Generate a pseudo-scientific ocean value based on latitude, depth, and noise
          float latNorm = (lat + 90.0) / 180.0;
          float oceanNoise = fbm(coord * 6.0 + vec2(4.2, 1.8));
          float depthFactor = depth;

          // Generate a normalized value [0,1] representing the ocean variable
          float t = 0.0;
          ${layerId === 'sst' ? `
            // SST: warm at equator, cold at poles
            t = 1.0 - abs(latNorm - 0.5) * 1.6;
            t += (oceanNoise - 0.5) * 0.2;
            t -= depthFactor * 0.1;
            t = clamp(t, 0.0, 1.0);
          ` : layerId === 'chlorophyll' ? `
            // Chlorophyll: high near coasts, upwelling zones
            float coastal = 1.0 - smoothstep(0.0, 0.3, depthFactor);
            t = coastal * 0.6 + oceanNoise * 0.4;
            t += abs(latNorm - 0.5) * 0.3;
            t = clamp(t, 0.0, 1.0);
          ` : layerId === 'salinity' ? `
            // Salinity: varies with latitude and freshwater input
            t = 0.4 + (1.0 - abs(latNorm - 0.35)) * 0.3;
            t += oceanNoise * 0.2;
            t -= (1.0 - depthFactor) * 0.15;
            t = clamp(t, 0.0, 1.0);
          ` : layerId === 'waveHeight' ? `
            // Waves: higher in open ocean, storms
            t = depthFactor * 0.5 + oceanNoise * 0.4;
            t += abs(latNorm - 0.5) * 0.3;
            t = clamp(t, 0.0, 1.0);
          ` : layerId === 'wind' ? `
            // Wind: trade winds, westerlies patterns
            float tradeWinds = smoothstep(0.1, 0.3, abs(latNorm - 0.5));
            t = tradeWinds * 0.5 + oceanNoise * 0.35 + depthFactor * 0.15;
            t = clamp(t, 0.0, 1.0);
          ` : layerId === 'current' ? `
            // Current: gyres and major flow
            float gyre = sin(lat * 0.08) * cos(lng * 0.05);
            t = abs(gyre) * 0.4 + oceanNoise * 0.3 + depthFactor * 0.2;
            t = clamp(t, 0.0, 1.0);
          ` : layerId === 'bathymetry' ? `
            // Bathymetry: directly use depth
            t = depthFactor;
          ` : `
            // PFZ: combine chlorophyll and temperature indicators
            float coastal2 = 1.0 - smoothstep(0.0, 0.35, depthFactor);
            float warmWater = 1.0 - abs(latNorm - 0.45) * 1.5;
            t = coastal2 * 0.4 + warmWater * 0.3 + oceanNoise * 0.3;
            t = clamp(t, 0.0, 1.0);
          `}

          color = getLayerColor(t);

          // Subtle variation
          color += vec3(oceanNoise * 0.03);
        }

        // Lighting
        float diffuse = max(dot(vNormal, lightDir), 0.0);
        float ambient = 0.3;
        color *= (ambient + diffuse * 0.7);

        // Atmosphere rim
        float rim = 1.0 - max(dot(vNormal, normalize(cameraPosition - vPosition)), 0.0);
        rim = pow(rim, 3.5);
        color += vec3(0.1, 0.2, 0.4) * rim * 0.5;

        gl_FragColor = vec4(color, 1.0);
      }
    `;
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020810);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = zoomRef.current;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x334455, 0.6);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);
    const rimLight = new THREE.DirectionalLight(0x4488ff, 0.3);
    rimLight.position.set(-3, -1, -2);
    scene.add(rimLight);

    // Earth globe
    const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 128, 64);
    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const earthMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: buildOceanFragShader(activeLayer),
      uniforms: {
        lightDir: { value: new THREE.Vector3(0.5, 0.3, 0.5).normalize() },
        cameraPosition: { value: camera.position },
      },
    });

    const globe = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(globe);
    globeRef.current = globe;
    globeMaterialRef.current = earthMaterial;

    // Atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(EARTH_RADIUS * 1.015, 64, 32);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform vec3 cameraPos;
        void main() {
          float rim = 1.0 - max(dot(vNormal, normalize(cameraPos - vPosition)), 0.0);
          rim = pow(rim, 4.0);
          gl_FragColor = vec4(0.2, 0.5, 0.9, rim * 0.35);
        }
      `,
      uniforms: { cameraPos: { value: camera.position } },
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Groups
    const markerGroup = new THREE.Group();
    scene.add(markerGroup);
    markerGroupRef.current = markerGroup;

    const pfzGroup = new THREE.Group();
    scene.add(pfzGroup);
    pfzGroupRef.current = pfzGroup;

    // Stars
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 1500;
    const starPositions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 80;
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.04, sizeAttenuation: true });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      if (autoRotateRef.current && !isDraggingRef.current) {
        targetRotationRef.current.y += 0.0008;
      }

      rotationRef.current.x += (targetRotationRef.current.x - rotationRef.current.x) * 0.08;
      rotationRef.current.y += (targetRotationRef.current.y - rotationRef.current.y) * 0.08;
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
      (earthMaterial.uniforms.cameraPosition as any).value.copy(camera.position);
      (atmosphereMaterial.uniforms.cameraPos as any).value.copy(camera.position);

      renderer.render(scene, camera);
    };
    animate();

    setIsLoading(false);

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      earthGeometry.dispose();
      earthMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
    };
  }, []);

  // Update shader when layer changes
  useEffect(() => {
    if (!globeMaterialRef.current) return;
    globeMaterialRef.current.fragmentShader = buildOceanFragShader(activeLayer);
    globeMaterialRef.current.needsUpdate = true;
  }, [activeLayer, buildOceanFragShader]);

  // Update PFZ markers visibility based on active layer
  useEffect(() => {
    if (!pfzGroupRef.current) return;
    pfzGroupRef.current.visible = activeLayer === 'pfz';
  }, [activeLayer]);

  // Update PFZ markers when data changes
  useEffect(() => {
    if (!pfzGroupRef.current || pfzMarkers.length === 0) return;
    const group = pfzGroupRef.current;

    while (group.children.length > 0) {
      const child = group.children[0] as THREE.Mesh;
      child.geometry?.dispose();
      (child.material as THREE.Material)?.dispose();
      group.remove(child);
    }

    const markerGeom = new THREE.SphereGeometry(0.025, 12, 8);
    pfzMarkers.forEach(pfz => {
      const material = new THREE.MeshBasicMaterial({
        color: pfz.pfz_probability > 0.7 ? 0x00ff88 : pfz.pfz_probability > 0.4 ? 0xffaa00 : 0xff4444,
        transparent: true,
        opacity: 0.85,
      });
      const marker = new THREE.Mesh(markerGeom, material);
      const pos = latLngToVector3(pfz.latitude, pfz.longitude, MARKER_RADIUS);
      marker.position.copy(pos);
      marker.userData = pfz;
      group.add(marker);
    });

    return () => { markerGeom.dispose(); };
  }, [pfzMarkers]);

  // Interaction handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    autoRotateRef.current = false;
    previousMouseRef.current = { x: e.clientX, y: e.clientY };
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - previousMouseRef.current.x;
    const dy = e.clientY - previousMouseRef.current.y;
    targetRotationRef.current.y += dx * 0.005;
    targetRotationRef.current.x += dy * 0.005;
    targetRotationRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotationRef.current.x));
    previousMouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const dx = Math.abs(e.clientX - dragStartRef.current.x);
    const dy = Math.abs(e.clientY - dragStartRef.current.y);
    isDraggingRef.current = false;

    if (dx < 4 && dy < 4) {
      handleGlobeClick(e);
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    targetZoomRef.current += e.deltaY * 0.003;
    targetZoomRef.current = Math.max(3, Math.min(12, targetZoomRef.current));
  }, []);

  const handleGlobeClick = useCallback((e: React.PointerEvent) => {
    if (!canvasRef.current || !cameraRef.current || !globeRef.current || !sceneRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    // Check PFZ markers first when PFZ layer is active
    if (activeLayer === 'pfz' && pfzGroupRef.current && pfzGroupRef.current.visible) {
      const pfzHits = raycaster.intersectObjects(pfzGroupRef.current.children);
      if (pfzHits.length > 0) {
        const pfzData = pfzHits[0].object.userData as PfzMarkerData;
        setSelectedPfz(pfzData);
        setSelectedPoint(null);
        setLocationData(null);
        return;
      }
    }

    // Check globe intersection
    const hits = raycaster.intersectObject(globeRef.current);
    if (hits.length > 0) {
      const point = hits[0].point;
      const localPoint = globeRef.current.worldToLocal(point.clone());
      const { lat, lng } = vector3ToLatLng(localPoint);

      // Place selected marker
      if (markerGroupRef.current) {
        if (selectedMarkerRef.current) {
          markerGroupRef.current.remove(selectedMarkerRef.current);
          (selectedMarkerRef.current.geometry as THREE.BufferGeometry).dispose();
          ((selectedMarkerRef.current.material as THREE.Material)).dispose();
        }
        const markerGeom = new THREE.SphereGeometry(0.035, 16, 12);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const marker = new THREE.Mesh(markerGeom, markerMat);
        const markerPos = latLngToVector3(lat, lng, MARKER_RADIUS + 0.01);
        marker.position.copy(markerPos);
        markerGroupRef.current.add(marker);
        selectedMarkerRef.current = marker;
      }

      setSelectedPoint({ lat, lng, screenX: e.clientX, screenY: e.clientY });
      setSelectedPfz(null);
      setAnalysisResult({ loading: false });

      // Fetch location data
      setLocationLoading(true);
      setLocationData(null);
      fetchMarineLocation(lat, lng).then(data => {
        setLocationData(data);
        setLocationLoading(false);
      }).catch(() => setLocationLoading(false));
    }
  }, [activeLayer]);

  const handleAnalyzeLocation = useCallback(async () => {
    if (!selectedPoint) return;
    setAnalysisResult({ loading: true });
    try {
      const result = await runAgentOrchestration(
        `Analyze this ocean location and find fishing zones`,
        'en',
        { lat: selectedPoint.lat, lng: selectedPoint.lng }
      );
      setAnalysisResult({ loading: false, data: result });
    } catch (err: any) {
      setAnalysisResult({ loading: false, error: err?.message || 'Analysis failed' });
    }
  }, [selectedPoint]);

  const handleZoomIn = () => { targetZoomRef.current = Math.max(3, targetZoomRef.current - 1); };
  const handleZoomOut = () => { targetZoomRef.current = Math.min(12, targetZoomRef.current + 1); };

  const handleReset = () => {
    targetRotationRef.current = { x: 0.3, y: -1.4 };
    targetZoomRef.current = 5.5;
    autoRotateRef.current = true;
    setSelectedPoint(null);
    setLocationData(null);
    setAnalysisResult({ loading: false });
    setSelectedPfz(null);
  };

  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!isFullScreen) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullScreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullScreen(false);
      onCloseFullScreen?.();
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Get current value to display for the selected location
  const getLayerValue = (): { value: string; label: string } | null => {
    if (!locationData) return null;
    const layer = currentLayerDef;
    switch (layer.id) {
      case 'sst': return { value: `${locationData.temperature} ${layer.unit}`, label: 'Sea Surface Temperature' };
      case 'chlorophyll': return { value: `${locationData.chlorophyll} ${layer.unit}`, label: 'Chlorophyll-a' };
      case 'salinity': return { value: `${locationData.salinity} ${layer.unit}`, label: 'Salinity' };
      case 'waveHeight': return { value: `${locationData.waveHeight} ${layer.unit}`, label: 'Sig. Wave Height' };
      case 'wind': return { value: `${locationData.windSpeed} ${layer.unit}`, label: 'Wind Speed' };
      case 'current': return { value: `${locationData.currentSpeed} ${layer.unit}`, label: 'Current Speed' };
      case 'bathymetry': return { value: 'N/A — Not Connected', label: 'Depth (GEBCO not integrated)' };
      case 'pfz': return null;
      default: return null;
    }
  };

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-[#020810] overflow-hidden flex flex-col ${
        isFullScreen ? 'fixed inset-0 z-50' : 'min-h-[600px]'
      }`}
    >
      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 z-40 bg-[#020810] flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
          <p className="mt-3 text-sm text-teal-300 font-mono">Initializing 3D Ocean Globe...</p>
        </div>
      )}

      {/* Top HUD */}
      <div className="absolute top-3 left-3 right-3 z-30 pointer-events-none flex items-center justify-between gap-2">
        <div className="bg-black/85 backdrop-blur-md px-3 py-2 rounded-xl border border-white/15 shadow-xl pointer-events-auto flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-white tracking-wide font-mono uppercase">MATSYA AI</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {currentLayerDef.shortLabel}
              </span>
            </div>
            <p className="text-[9px] text-neutral-400 font-mono">{currentLayerDef.label}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-black/85 backdrop-blur-md px-2 py-1.5 rounded-xl border border-white/15 shadow-xl pointer-events-auto flex items-center gap-1">
          <button onClick={handleZoomIn} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition" title="Zoom In">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleZoomOut} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition" title="Zoom Out">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleReset} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition" title="Reset View">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={toggleFullScreen} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition" title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ═══════ LAYER SELECTOR PANEL ═══════ */}
      <div className={`absolute top-14 left-3 z-30 transition-all duration-200 ${layerPanelOpen ? 'w-44' : 'w-9'}`}>
        {!layerPanelOpen ? (
          <button
            onClick={() => setLayerPanelOpen(true)}
            className="w-9 h-9 rounded-lg bg-black/85 backdrop-blur-md border border-white/15 flex items-center justify-center text-teal-300 hover:text-white hover:border-teal-500/50 transition shadow-xl"
            title="Open Layers"
          >
            <Layers className="w-4 h-4" />
          </button>
        ) : (
          <div className="bg-black/90 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl overflow-hidden">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
              <span className="text-[9px] font-mono font-bold text-teal-300 uppercase tracking-wider">Ocean Layers</span>
              <button onClick={() => setLayerPanelOpen(false)} className="text-neutral-500 hover:text-white transition">
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Layer Buttons */}
            <div className="p-1.5 space-y-0.5 max-h-[60vh] overflow-y-auto">
              {OCEAN_LAYERS.map(layer => (
                <button
                  key={layer.id}
                  onClick={() => setActiveLayer(layer.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition text-[11px] font-mono ${
                    activeLayer === layer.id
                      ? 'bg-teal-600/30 text-teal-200 border border-teal-500/40'
                      : 'text-neutral-300 hover:bg-white/10 hover:text-white border border-transparent'
                  } ${!layer.apiAvailable ? 'opacity-60' : ''}`}
                >
                  <span className={activeLayer === layer.id ? 'text-teal-300' : 'text-neutral-500'}>{layer.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{layer.shortLabel}</div>
                    {!layer.apiAvailable && (
                      <div className="text-[8px] text-amber-400/80 truncate">Not connected</div>
                    )}
                  </div>
                  {activeLayer === layer.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0"></span>
                  )}
                </button>
              ))}
            </div>

            {/* Data Source */}
            <div className="px-3 py-2 border-t border-white/10 text-[8px] text-neutral-500 font-mono">
              {currentLayerDef.dataSource}
            </div>
          </div>
        )}
      </div>

      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full flex-1 cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* ═══════ LEGEND ═══════ */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
        {activeLayer === 'pfz' && pfzMarkers.length > 0 ? (
          <div className="bg-black/80 backdrop-blur-sm px-3 py-2.5 rounded-lg border border-white/10 text-[9px] font-mono text-neutral-300 space-y-1">
            <div className="text-teal-300 font-bold uppercase mb-1.5">PFZ Probability</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block"></span>High (&gt;70%)</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>Medium (40-70%)</div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span>Low (&lt;40%)</div>
            <div className="text-neutral-500 mt-1.5 text-[8px]">{pfzMarkers.length} ML predictions loaded</div>
          </div>
        ) : (
          <div className="bg-black/80 backdrop-blur-sm px-3 py-2.5 rounded-lg border border-white/10 text-[9px] font-mono text-neutral-300">
            <div className="text-teal-300 font-bold uppercase mb-1.5">{currentLayerDef.shortLabel} ({currentLayerDef.unit})</div>
            <div className="flex items-center gap-1.5">
              <div className="w-32 h-2.5 rounded-sm overflow-hidden flex">
                {currentLayerDef.colorStops.map((stop, i) => (
                  <div
                    key={i}
                    className="flex-1 h-full"
                    style={{ backgroundColor: `rgb(${stop.color[0]}, ${stop.color[1]}, ${stop.color[2]})` }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-between mt-1 text-[8px] text-neutral-400">
              <span>{currentLayerDef.legendLabels[0]}</span>
              <span>{currentLayerDef.legendLabels[Math.floor(currentLayerDef.legendLabels.length / 2)]}</span>
              <span>{currentLayerDef.legendLabels[currentLayerDef.legendLabels.length - 1]}</span>
            </div>
            {!currentLayerDef.apiAvailable && (
              <div className="text-amber-400/80 mt-1 text-[8px]">Layer not connected to live data</div>
            )}
          </div>
        )}
      </div>

      {/* ═══════ SELECTED LOCATION INFO CARD ═══════ */}
      {selectedPoint && (
        <div className="absolute bottom-4 left-3 z-30 max-w-[280px]">
          <div className="bg-black/92 backdrop-blur-xl border border-white/15 rounded-xl p-3.5 shadow-2xl text-white space-y-2.5">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <Crosshair className="w-3 h-3 text-teal-400" />
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-teal-300">
                  {currentLayerDef.shortLabel} DATA
                </span>
              </div>
              <button onClick={() => { setSelectedPoint(null); setLocationData(null); setAnalysisResult({ loading: false }); }} className="text-neutral-500 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-white/5 p-2 rounded-lg border border-white/5">
              <div>
                <span className="text-[8px] text-neutral-500 uppercase block">Lat</span>
                <span className="text-white font-bold">{selectedPoint.lat.toFixed(4)}°{selectedPoint.lat >= 0 ? 'N' : 'S'}</span>
              </div>
              <div>
                <span className="text-[8px] text-neutral-500 uppercase block">Lng</span>
                <span className="text-white font-bold">{selectedPoint.lng.toFixed(4)}°{selectedPoint.lng >= 0 ? 'E' : 'W'}</span>
              </div>
            </div>

            {/* Loading */}
            {locationLoading && (
              <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Fetching data...</span>
              </div>
            )}

            {/* Layer-specific value (primary display) */}
            {locationData && !locationLoading && (
              <>
                {getLayerValue() && (
                  <div className="p-2.5 rounded-lg bg-teal-900/20 border border-teal-500/20">
                    <span className="text-[8px] text-teal-400 uppercase block font-mono font-bold">{getLayerValue()!.label}</span>
                    <span className="text-lg font-bold text-white font-mono">{getLayerValue()!.value}</span>
                    {activeLayer === 'wind' && locationData.windDirection && (
                      <span className="text-[9px] text-neutral-400 font-mono ml-2">Dir: {locationData.windDirection}</span>
                    )}
                    {activeLayer === 'current' && locationData.currentDirection && (
                      <span className="text-[9px] text-neutral-400 font-mono ml-2">Dir: {locationData.currentDirection}</span>
                    )}
                  </div>
                )}

                {/* Secondary data */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  {activeLayer !== 'sst' && (
                    <div className="p-1.5 rounded bg-white/5 border border-white/5">
                      <span className="text-[8px] text-neutral-500 block font-mono">SST</span>
                      <span className="text-rose-400 font-bold font-mono">{locationData.temperature}°C</span>
                    </div>
                  )}
                  {activeLayer !== 'waveHeight' && (
                    <div className="p-1.5 rounded bg-white/5 border border-white/5">
                      <span className="text-[8px] text-neutral-500 block font-mono">Waves</span>
                      <span className="text-sky-300 font-bold font-mono">{locationData.waveHeight}m</span>
                    </div>
                  )}
                  {activeLayer !== 'chlorophyll' && activeLayer !== 'pfz' && (
                    <div className="p-1.5 rounded bg-white/5 border border-white/5">
                      <span className="text-[8px] text-neutral-500 block font-mono">Chl-a</span>
                      <span className="text-emerald-400 font-bold font-mono">{locationData.chlorophyll} mg/m³</span>
                    </div>
                  )}
                  {activeLayer !== 'wind' && (
                    <div className="p-1.5 rounded bg-white/5 border border-white/5">
                      <span className="text-[8px] text-neutral-500 block font-mono">Wind</span>
                      <span className="text-sky-400 font-bold font-mono">{locationData.windSpeed} km/h</span>
                    </div>
                  )}
                </div>

                {/* Risk & provenance */}
                <div className="flex items-center gap-2 flex-wrap text-[9px] font-mono">
                  <span className={`px-1.5 py-0.5 rounded ${locationData.marineRisk === 'LOW' ? 'bg-emerald-500/20 text-emerald-300' : locationData.marineRisk === 'MODERATE' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'}`}>
                    {locationData.marineRisk}
                  </span>
                  {locationData.dataStatus && (
                    <span className={`px-1.5 py-0.5 rounded font-bold ${
                      locationData.dataStatus === 'LIVE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      locationData.dataStatus === 'CACHED' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                      'bg-neutral-500/20 text-neutral-400 border border-neutral-500/30'
                    }`}>
                      {locationData.dataStatus}
                    </span>
                  )}
                </div>
                <div className="text-[8px] text-neutral-500 font-mono leading-relaxed mt-1">
                  {activeLayer === 'sst' && locationData.sstSource && (
                    <span>{locationData.sstSource}</span>
                  )}
                  {activeLayer === 'chlorophyll' && locationData.chlorophyllSource && (
                    <span>{locationData.chlorophyllSource}{locationData.chlorophyllStatus === 'HISTORICAL' ? ' (historical)' : ''}</span>
                  )}
                  {activeLayer === 'salinity' && (
                    <span className="text-amber-500/80">Physics model — no free real-time salinity API</span>
                  )}
                  {(activeLayer === 'waveHeight' || activeLayer === 'current') && locationData.waveSource && (
                    <span>{locationData.waveSource}</span>
                  )}
                  {activeLayer === 'wind' && (
                    <span>Estimated from marine wave data</span>
                  )}
                  {activeLayer === 'bathymetry' && (
                    <span className="text-amber-500/80">Depth data not connected — requires GEBCO integration</span>
                  )}
                </div>
              </>
            )}

            {/* Analyze Button */}
            {locationData && (
              <button
                onClick={handleAnalyzeLocation}
                disabled={analysisResult.loading}
                className="w-full py-1.5 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 disabled:cursor-not-allowed text-white font-bold text-[10px] rounded-lg shadow-lg transition flex items-center justify-center gap-1.5 uppercase font-mono tracking-wider cursor-pointer"
              >
                {analysisResult.loading ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /><span>Analyzing...</span></>
                ) : (
                  <><Sparkles className="w-3 h-3 text-teal-200" /><span>4-Agent Analysis</span></>
                )}
              </button>
            )}

            {/* Analysis Result */}
            {analysisResult.data && (
              <div className="p-2.5 bg-teal-900/20 border border-teal-500/20 rounded-lg text-[10px] space-y-1.5 max-h-36 overflow-y-auto">
                <p className="text-white/90 leading-relaxed">{analysisResult.data.answer?.slice(0, 250) || 'No answer.'}</p>
                {analysisResult.data.detectedIntent && (
                  <div className="text-[8px] text-teal-400 font-mono">
                    {analysisResult.data.detectedIntent} | {analysisResult.data.confidence}%
                  </div>
                )}
              </div>
            )}
            {analysisResult.error && (
              <div className="p-2 bg-red-900/20 border border-red-500/20 rounded-lg text-[10px] text-red-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />{analysisResult.error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ PFZ SELECTION PANEL ═══════ */}
      {selectedPfz && (
        <div className="absolute bottom-4 left-3 z-30 max-w-[280px]">
          <div className="bg-black/92 backdrop-blur-xl border border-emerald-500/20 rounded-xl p-3.5 shadow-2xl text-white space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <Fish className="w-3 h-3 text-emerald-400" />
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-300">PFZ PREDICTION</span>
              </div>
              <button onClick={() => setSelectedPfz(null)} className="text-neutral-500 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-white/5 p-2 rounded-lg border border-white/5">
              <div>
                <span className="text-[8px] text-neutral-500 block">Lat</span>
                <span className="text-white font-bold">{selectedPfz.latitude.toFixed(4)}°</span>
              </div>
              <div>
                <span className="text-[8px] text-neutral-500 block">Lng</span>
                <span className="text-white font-bold">{selectedPfz.longitude.toFixed(4)}°</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-900/20 border border-emerald-500/20">
              <span className="text-[8px] text-emerald-400 uppercase block font-mono font-bold">PFZ Probability</span>
              <span className="text-xl font-bold text-emerald-300 font-mono">{(selectedPfz.pfz_probability * 100).toFixed(0)}%</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              <div className="p-1.5 rounded bg-white/5 border border-white/5 text-center">
                <span className="text-[8px] text-neutral-500 block font-mono">SST</span>
                <span className="text-rose-400 font-bold font-mono">{selectedPfz.sst.toFixed(1)}°C</span>
              </div>
              <div className="p-1.5 rounded bg-white/5 border border-white/5 text-center">
                <span className="text-[8px] text-neutral-500 block font-mono">Chl-a</span>
                <span className="text-emerald-400 font-bold font-mono">{selectedPfz.chlorophyll.toFixed(2)}</span>
              </div>
              <div className="p-1.5 rounded bg-white/5 border border-white/5 text-center">
                <span className="text-[8px] text-neutral-500 block font-mono">Gradient</span>
                <span className="text-amber-400 font-bold font-mono">{selectedPfz.sst_gradient.toFixed(3)}</span>
              </div>
            </div>

            <div className="text-[8px] text-neutral-500 font-mono">
              ML RandomForest | {selectedPfz.date || 'Cached'}
            </div>
          </div>
        </div>
      )}

      {/* Instructions (when no selection) */}
      {!selectedPoint && !selectedPfz && !isLoading && (
        <div className="absolute bottom-4 left-3 z-20 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10 text-[9px] font-mono text-neutral-500">
            <MapPin className="w-3 h-3 inline mr-1 text-teal-400" />
            Drag to rotate • Scroll to zoom • Click ocean to inspect
          </div>
        </div>
      )}
    </div>
  );
};
