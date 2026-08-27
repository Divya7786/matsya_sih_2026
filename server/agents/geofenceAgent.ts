export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export interface GeofenceZoneDefinition {
  id: string;
  name: string;
  type: 'IMBL' | 'RESTRICTED_MILITARY' | 'MARINE_PROTECTED_AREA' | 'SHIPPING_LANE';
  countryOrAgency: string;
  coordinates: [number, number][]; // [lat, lng]
  isPolygon: boolean;
  bufferWarningKm: number;
  criticalBufferKm: number;
  description: string;
  legalBasis: string;
  consequences: string;
}

export interface GeofenceCheckResult {
  vesselLocation: GeoCoordinate;
  geofenceStatus: 'CLEAR' | 'APPROACHING_BOUNDARY' | 'NEAR_BOUNDARY' | 'INSIDE_RESTRICTED_ZONE';
  nearestZone: {
    id: string;
    name: string;
    type: string;
    distanceKm: number;
    distanceNauticalMiles: number;
    bearingDegrees: number;
    warningLevel: 'INFO' | 'CAUTION' | 'CRITICAL';
    description: string;
    isInside: boolean;
  };
  allZonesCheckedCount: number;
  alerts: {
    zoneId: string;
    zoneName: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    message: string;
    spokenWarning: {
      en: string;
      ta: string;
      hi: string;
      te: string;
      ml: string;
      kn: string;
    };
  }[];
  timestamp: string;
}

// Great-circle Haversine distance in Kilometers
export function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate bearing in degrees from point 1 to point 2
export function calculateBearingDegrees(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return (Math.round((θ * 180) / Math.PI + 360) % 360);
}

// Point to Line Segment minimum distance calculation
export function distanceToSegmentKm(
  pLat: number, pLng: number,
  vLat: number, vLng: number,
  wLat: number, wLng: number
): { distanceKm: number; nearestPoint: GeoCoordinate } {
  const l2 = (vLat - wLat) ** 2 + (vLng - wLng) ** 2;
  if (l2 === 0) {
    return {
      distanceKm: calculateHaversineKm(pLat, pLng, vLat, vLng),
      nearestPoint: { lat: vLat, lng: vLng }
    };
  }

  // Projection parameter t
  let t = ((pLat - vLat) * (wLat - vLat) + (pLng - vLng) * (wLng - vLng)) / l2;
  t = Math.max(0, Math.min(1, t));

  const projLat = vLat + t * (wLat - vLat);
  const projLng = vLng + t * (wLng - vLng);

  return {
    distanceKm: calculateHaversineKm(pLat, pLng, projLat, projLng),
    nearestPoint: { lat: projLat, lng: projLng }
  };
}

// Ray-casting algorithm for Point in Polygon
export function isPointInPolygon(point: GeoCoordinate, polygon: [number, number][]): boolean {
  const x = point.lng;
  const y = point.lat;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][1], yi = polygon[i][0];
    const xj = polygon[j][1], yj = polygon[j][0];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

export const GEOFENCE_REGISTRY: GeofenceZoneDefinition[] = [
  {
    id: 'imbl-sri-lanka-palk-strait',
    name: 'India - Sri Lanka International Maritime Boundary Line (IMBL)',
    type: 'IMBL',
    countryOrAgency: 'Sri Lanka Navy / Indian Coast Guard',
    coordinates: [
      [9.001, 79.521],
      [9.215, 79.654],
      [9.512, 79.882],
      [9.890, 80.125],
      [10.210, 80.340],
      [10.580, 80.590],
    ],
    isPolygon: false,
    bufferWarningKm: 12.0,
    criticalBufferKm: 5.0,
    description: 'Sovereign international boundary line separating Indian territorial waters and Sri Lankan maritime jurisdiction.',
    legalBasis: '1974 & 1976 India-Sri Lanka Maritime Boundary Agreements',
    consequences: 'Crossing leads to vessel apprehension by Sri Lanka Navy and legal prosecution under Foreign Fishing Vessel Act.',
  },
  {
    id: 'imbl-pakistan-sir-creek',
    name: 'India - Pakistan Maritime Boundary (Sir Creek / Arabian Sea)',
    type: 'IMBL',
    countryOrAgency: 'Pakistan Maritime Security Agency (PMSA)',
    coordinates: [
      [23.58, 68.10],
      [23.25, 67.85],
      [22.80, 67.45],
      [22.10, 66.90],
    ],
    isPolygon: false,
    bufferWarningKm: 20.0,
    criticalBufferKm: 8.0,
    description: 'International maritime boundary in the northern Arabian Sea off Gujarat / Kutch coast.',
    legalBasis: 'UNCLOS Maritime Boundary Guidelines',
    consequences: 'Immediate arrest and seizure of motorized fishing vessels by PMSA.',
  },
  {
    id: 'mpa-gulf-of-mannar',
    name: 'Gulf of Mannar Marine National Park & Biosphere Reserve',
    type: 'MARINE_PROTECTED_AREA',
    countryOrAgency: 'Tamil Nadu Forest & Wildlife Department',
    coordinates: [
      [8.78, 78.15],
      [9.25, 79.10],
      [9.35, 79.35],
      [9.05, 79.45],
      [8.65, 78.35],
      [8.78, 78.15],
    ],
    isPolygon: true,
    bufferWarningKm: 8.0,
    criticalBufferKm: 2.0,
    description: 'Ecologically sensitive biosphere spanning 21 islands with endangered dugongs, seagrass beds, and coral reefs.',
    legalBasis: 'Wildlife Protection Act 1972 & MoEFCC Marine Sanctuary Notification',
    consequences: 'Prohibition of commercial bottom trawling, purse seining, and destructive coral gear.',
  },
  {
    id: 'military-drdo-chandipur',
    name: 'Chandipur & Wheeler Island (Abdul Kalam Island) Defence Testing Range',
    type: 'RESTRICTED_MILITARY',
    countryOrAgency: 'DRDO / Integrated Test Range (ITR) Odisha',
    coordinates: [
      [20.55, 86.95],
      [21.15, 87.20],
      [21.05, 87.65],
      [20.45, 87.40],
      [20.55, 86.95],
    ],
    isPolygon: true,
    bufferWarningKm: 25.0,
    criticalBufferKm: 10.0,
    description: 'Active military missile test launch corridor and ballistic telemetry observation zone in Bay of Bengal.',
    legalBasis: 'Ministry of Defence Notice to Mariners (NOTMAR)',
    consequences: 'Civilian transit prohibited during active trial firing windows.',
  },
  {
    id: 'shipping-lane-chennai-port-tss',
    name: 'Chennai Port Commercial Traffic Separation Scheme (TSS)',
    type: 'SHIPPING_LANE',
    countryOrAgency: 'Chennai Port Authority & DG Shipping',
    coordinates: [
      [13.05, 80.32],
      [13.12, 80.38],
      [13.10, 80.45],
      [13.02, 80.38],
      [13.05, 80.32],
    ],
    isPolygon: true,
    bufferWarningKm: 5.0,
    criticalBufferKm: 1.0,
    description: 'Deep-draft commercial container and oil tanker navigational approach corridor.',
    legalBasis: 'International Regulations for Preventing Collisions at Sea (COLREGs 1972)',
    consequences: 'Stationary net casting or anchoring strictly prohibited due to severe container ship collision hazard.',
  },
];

export class GeofenceAgent {
  private alertHistory: Map<string, { timestamp: number; lastAlertLevel: string }> = new Map();
  private cooldownMs = 60000; // 1 minute cooldown between duplicate push alerts

  public checkLocation(location: GeoCoordinate): GeofenceCheckResult {
    let minDistanceKm = Infinity;
    let closestZone = GEOFENCE_REGISTRY[0];
    let isInsideAny = false;
    let closestZoneIsInside = false;
    let closestBearing = 0;

    const activeAlerts: GeofenceCheckResult['alerts'] = [];

    for (const zone of GEOFENCE_REGISTRY) {
      let zoneDistanceKm = Infinity;
      let zoneIsInside = false;
      let nearestCoord: GeoCoordinate = { lat: zone.coordinates[0][0], lng: zone.coordinates[0][1] };

      if (zone.isPolygon) {
        zoneIsInside = isPointInPolygon(location, zone.coordinates);
        if (zoneIsInside) {
          zoneDistanceKm = 0;
          isInsideAny = true;
        } else {
          // Compute distance to boundary segments
          for (let i = 0; i < zone.coordinates.length - 1; i++) {
            const seg = distanceToSegmentKm(
              location.lat, location.lng,
              zone.coordinates[i][0], zone.coordinates[i][1],
              zone.coordinates[i + 1][0], zone.coordinates[i + 1][1]
            );
            if (seg.distanceKm < zoneDistanceKm) {
              zoneDistanceKm = seg.distanceKm;
              nearestCoord = seg.nearestPoint;
            }
          }
        }
      } else {
        // Polyline (e.g. IMBL line)
        for (let i = 0; i < zone.coordinates.length - 1; i++) {
          const seg = distanceToSegmentKm(
            location.lat, location.lng,
            zone.coordinates[i][0], zone.coordinates[i][1],
            zone.coordinates[i + 1][0], zone.coordinates[i + 1][1]
          );
          if (seg.distanceKm < zoneDistanceKm) {
            zoneDistanceKm = seg.distanceKm;
            nearestCoord = seg.nearestPoint;
          }
        }
      }

      const bearing = calculateBearingDegrees(location.lat, location.lng, nearestCoord.lat, nearestCoord.lng);

      if (zoneDistanceKm < minDistanceKm) {
        minDistanceKm = zoneDistanceKm;
        closestZone = zone;
        closestZoneIsInside = zoneIsInside;
        closestBearing = bearing;
      }

      // Check alert thresholds
      if (zoneIsInside) {
        activeAlerts.push({
          zoneId: zone.id,
          zoneName: zone.name,
          severity: 'CRITICAL',
          message: `CRITICAL ALERT: Your vessel is INSIDE ${zone.name}. Turn back immediately to Indian territorial waters!`,
          spokenWarning: {
            en: `Critical Alert. You have crossed into ${zone.name}. Reverse heading immediately.`,
            ta: `எச்சரிக்கை! நீங்கள் ${zone.name} எல்லைக்குள் நுழைந்துவிட்டீர்கள். உடனே திரும்பவும்.`,
            hi: `चेतावनी! आप प्रतिबंधित क्षेत्र ${zone.name} के अंदर हैं। तुरंत वापस लौटें।`,
            te: `హెచ్చరిక! మీరు ${zone.name} నిషేధిత ప్రాంతంలోకి ప్రవేశించారు. వెంటనే వెనక్కి తిరగండి.`,
            ml: `മുന്നറിയിപ്പ്! നിങ്ങൾ ${zone.name} അതിർത്തി കടന്നിരിക്കുന്നു. ഉടൻ തിരികെ പോകുക.`,
            kn: `ಎಚ್ಚರಿಕೆ! ನೀವು ${zone.name} ನಿಷೇಧಿತ ವಲಯಕ್ಕೆ ಪ್ರವೇಶಿಸಿದ್ದೀರಿ. ತಕ್ಷಣ ಹಿಂತಿರುಗಿ.`,
          },
        });
      } else if (zoneDistanceKm <= zone.criticalBufferKm) {
        activeAlerts.push({
          zoneId: zone.id,
          zoneName: zone.name,
          severity: 'CRITICAL',
          message: `DANGER: You are only ${zoneDistanceKm.toFixed(1)} km (${(zoneDistanceKm * 0.539957).toFixed(1)} NM) from ${zone.name}. Proximity alarm active!`,
          spokenWarning: {
            en: `Danger. You are within ${(zoneDistanceKm * 0.539957).toFixed(1)} nautical miles of the international boundary line.`,
            ta: `ஆபத்து! சர்வதேச எல்லைக்கோடு ${zoneDistanceKm.toFixed(1)} கி.மீ தொலைவில் உள்ளது. உஷாராக இருக்கவும்.`,
            hi: `खतरा! अंतरराष्ट्रीय सीमा केवल ${zoneDistanceKm.toFixed(1)} किमी दूर है।`,
            te: `ప్రమాదం! అంతర్జాతీయ సరిహద్దు కేవలం ${zoneDistanceKm.toFixed(1)} కి.మీ దూరంలో ఉంది.`,
            ml: `അപായം! അന്താരാഷ്ട്ര അതിർത്തി വെറും ${zoneDistanceKm.toFixed(1)} കിലോമീറ്റർ അകലെയാണ്.`,
            kn: `ಅಪಾಯ! ಅಂತರರಾಷ್ಟ್ರೀಯ ಗಡಿಯು ಕೇವಲ ${zoneDistanceKm.toFixed(1)} ಕಿ.ಮೀ ದೂರದಲ್ಲಿದೆ.`,
          },
        });
      } else if (zoneDistanceKm <= zone.bufferWarningKm) {
        activeAlerts.push({
          zoneId: zone.id,
          zoneName: zone.name,
          severity: 'WARNING',
          message: `CAUTION: Approaching ${zone.name}. Current distance: ${zoneDistanceKm.toFixed(1)} km.`,
          spokenWarning: {
            en: `Caution. Approaching ${zone.name} at ${zoneDistanceKm.toFixed(1)} kilometres.`,
            ta: `கவனம். ${zone.name} ${zoneDistanceKm.toFixed(1)} கி.மீ அருகில் உள்ளது.`,
            hi: `सावधानी। ${zone.name} ${zoneDistanceKm.toFixed(1)} किमी निकट है।`,
            te: `జాగ్రత్త. ${zone.name} ${zoneDistanceKm.toFixed(1)} కి.మీ సమీపంలో ఉంది.`,
            ml: `ശ്രദ്ധിക്കുക. ${zone.name} സമീപിക്കുന്നു. ദൂരം ${zoneDistanceKm.toFixed(1)} കിലോമീറ്റർ.`,
            kn: `ಎಚ್ಚರಿಕೆ. ${zone.name} ಸಮೀಪಿಸುತ್ತಿದೆ.`,
          },
        });
      }
    }

    let overallStatus: GeofenceCheckResult['geofenceStatus'] = 'CLEAR';
    let warningLevel: 'INFO' | 'CAUTION' | 'CRITICAL' = 'INFO';

    if (closestZoneIsInside || isInsideAny) {
      overallStatus = 'INSIDE_RESTRICTED_ZONE';
      warningLevel = 'CRITICAL';
    } else if (minDistanceKm <= closestZone.criticalBufferKm) {
      overallStatus = 'NEAR_BOUNDARY';
      warningLevel = 'CRITICAL';
    } else if (minDistanceKm <= closestZone.bufferWarningKm) {
      overallStatus = 'APPROACHING_BOUNDARY';
      warningLevel = 'CAUTION';
    }

    return {
      vesselLocation: location,
      geofenceStatus: overallStatus,
      nearestZone: {
        id: closestZone.id,
        name: closestZone.name,
        type: closestZone.type,
        distanceKm: Math.round(minDistanceKm * 10) / 10,
        distanceNauticalMiles: Math.round(minDistanceKm * 0.539957 * 10) / 10,
        bearingDegrees: closestBearing,
        warningLevel,
        description: closestZone.description,
        isInside: closestZoneIsInside,
      },
      allZonesCheckedCount: GEOFENCE_REGISTRY.length,
      alerts: activeAlerts,
      timestamp: new Date().toISOString(),
    };
  }

  public shouldTriggerVoiceAlarm(vesselId: string, alertLevel: string): boolean {
    const now = Date.now();
    const prev = this.alertHistory.get(vesselId);

    if (!prev || (now - prev.timestamp > this.cooldownMs) || (alertLevel === 'CRITICAL' && prev.lastAlertLevel !== 'CRITICAL')) {
      this.alertHistory.set(vesselId, { timestamp: now, lastAlertLevel: alertLevel });
      return true;
    }
    return false;
  }
}

export const globalGeofenceAgent = new GeofenceAgent();
