import { PFZZone, RoutePlan } from '../types/marine';
import { calculateHaversineKm } from './geoUtils';

export type NavigationState =
  | 'IDLE'
  | 'PLANNING'
  | 'NAVIGATING'
  | 'ARRIVED'
  | 'PAUSED';

export interface NavigationSession {
  id: string;
  state: NavigationState;
  startTime: number;
  destination: { lat: number; lng: number; name: string };
  origin: { lat: number; lng: number; name: string };
  route: RoutePlan | null;
  currentPosition: { lat: number; lng: number };
  distanceRemainingKm: number;
  distanceTravelledKm: number;
  announcementsMade: Set<string>;
  geofenceWarningIssued: boolean;
  routeDeviationWarned: boolean;
  arrivalRadiusMeters: number;
}

export interface DistanceAnnouncement {
  thresholdKm: number;
  id: string;
  getMessage: (distKm: number, lang: string) => string;
}

const DISTANCE_ANNOUNCEMENTS: DistanceAnnouncement[] = [
  {
    thresholdKm: 10,
    id: 'at-10km',
    getMessage: (d, lang) => {
      if (lang === 'ta') return 'நீங்கள் சுமார் 10 கிலோமீட்டர் தொலைவில் உள்ளீர்கள்.';
      if (lang === 'hi') return 'आप लगभग 10 किलोमीटर दूर हैं।';
      return "You're about 10 kilometres away.";
    },
  },
  {
    thresholdKm: 5,
    id: 'at-5km',
    getMessage: (d, lang) => {
      if (lang === 'ta') return 'நீங்கள் மீன்பிடி மண்டலத்திலிருந்து சுமார் 5 கிலோமீட்டர் தொலைவில் உள்ளீர்கள்.';
      if (lang === 'hi') return 'आप मत्स्य क्षेत्र से लगभग 5 किलोमीटर दूर हैं।';
      return "You're about 5 kilometres from the fishing zone.";
    },
  },
  {
    thresholdKm: 3,
    id: 'at-3km',
    getMessage: (d, lang) => {
      if (lang === 'ta') return 'நீங்கள் நெருங்கி வருகிறீர்கள். சுமார் 3 கிலோமீட்டர் மீதமுள்ளது.';
      if (lang === 'hi') return 'आप करीब आ रहे हैं। लगभग 3 किलोमीटर बाकी है।';
      return "You're getting close. About 3 kilometres remaining.";
    },
  },
  {
    thresholdKm: 1,
    id: 'at-1km',
    getMessage: (d, lang) => {
      if (lang === 'ta') return 'நீங்கள் இலக்கிலிருந்து சுமார் 1 கிலோமீட்டர் தொலைவில் உள்ளீர்கள்.';
      if (lang === 'hi') return 'आप गंतव्य से लगभग 1 किलोमीटर दूर हैं।';
      return "You're about 1 kilometre from the destination.";
    },
  },
];

const ARRIVAL_MESSAGE: Record<string, string> = {
  ta: 'நீங்கள் பரிந்துரைக்கப்பட்ட மீன்பிடி மண்டலத்தை அடைந்துவிட்டீர்கள்.',
  hi: 'आप अनुशंसित मत्स्य क्षेत्र पर पहुँच गए हैं।',
  en: "You've reached the recommended fishing zone.",
};

const GEOFENCE_WARNING: Record<string, (dist: number, name: string) => string> = {
  ta: (d, n) => `எச்சரிக்கை. நீங்கள் ${n} இலிருந்து சுமார் ${d.toFixed(1)} கிலோமீட்டர் தொலைவில் உள்ளீர்கள். வரைபடத்தில் குறித்துள்ளேன்.`,
  hi: (d, n) => `चेतावनी। आप ${n} से लगभग ${d.toFixed(1)} किलोमीटर दूर हैं। मैंने इसे मानचित्र पर चिह्नित किया है।`,
  en: (d, n) => `Warning. You're approximately ${d.toFixed(1)} kilometres from ${n}. I've marked it on the map.`,
};

export type NavigationEvent =
  | { type: 'DISTANCE_ANNOUNCEMENT'; message: string }
  | { type: 'ARRIVAL'; message: string }
  | { type: 'GEOFENCE_WARNING'; message: string; distanceKm: number; zoneName: string }
  | { type: 'ROUTE_DEVIATION'; message: string }
  | { type: 'POSITION_UPDATE'; lat: number; lng: number; distanceRemainingKm: number };

export class NavigationEngine {
  private session: NavigationSession | null = null;
  private eventCallbacks: ((event: NavigationEvent) => void)[] = [];
  private demoInterval: ReturnType<typeof setInterval> | null = null;
  private demoProgress = 0;

  getSession(): NavigationSession | null {
    return this.session;
  }

  isActive(): boolean {
    return this.session?.state === 'NAVIGATING';
  }

  onEvent(cb: (event: NavigationEvent) => void) {
    this.eventCallbacks.push(cb);
    return () => {
      this.eventCallbacks = this.eventCallbacks.filter(c => c !== cb);
    };
  }

  private emit(event: NavigationEvent) {
    this.eventCallbacks.forEach(cb => cb(event));
  }

  startNavigation(params: {
    origin: { lat: number; lng: number; name: string };
    destination: { lat: number; lng: number; name: string };
    route: RoutePlan | null;
    currentPosition: { lat: number; lng: number };
  }): NavigationSession {
    this.stopNavigation();

    const distanceKm = calculateHaversineKm(
      params.currentPosition.lat, params.currentPosition.lng,
      params.destination.lat, params.destination.lng
    );

    this.session = {
      id: `nav-${Date.now().toString(36)}`,
      state: 'NAVIGATING',
      startTime: Date.now(),
      destination: params.destination,
      origin: params.origin,
      route: params.route,
      currentPosition: params.currentPosition,
      distanceRemainingKm: distanceKm,
      distanceTravelledKm: 0,
      announcementsMade: new Set(),
      geofenceWarningIssued: false,
      routeDeviationWarned: false,
      arrivalRadiusMeters: 200,
    };

    return this.session;
  }

  updatePosition(lat: number, lng: number, language: string = 'en'): NavigationEvent[] {
    if (!this.session || this.session.state !== 'NAVIGATING') return [];

    const events: NavigationEvent[] = [];
    const prevPos = this.session.currentPosition;
    const moved = calculateHaversineKm(prevPos.lat, prevPos.lng, lat, lng);

    this.session.currentPosition = { lat, lng };
    this.session.distanceTravelledKm += moved;

    const distToDestination = calculateHaversineKm(
      lat, lng,
      this.session.destination.lat, this.session.destination.lng
    );
    this.session.distanceRemainingKm = distToDestination;

    this.emit({ type: 'POSITION_UPDATE', lat, lng, distanceRemainingKm: distToDestination });

    // Check arrival
    if (distToDestination * 1000 <= this.session.arrivalRadiusMeters) {
      this.session.state = 'ARRIVED';
      const msg = ARRIVAL_MESSAGE[language] || ARRIVAL_MESSAGE.en;
      const arrivalEvent: NavigationEvent = { type: 'ARRIVAL', message: msg };
      events.push(arrivalEvent);
      this.emit(arrivalEvent);
      return events;
    }

    // Check distance announcements
    for (const ann of DISTANCE_ANNOUNCEMENTS) {
      if (
        distToDestination <= ann.thresholdKm &&
        !this.session.announcementsMade.has(ann.id)
      ) {
        // Only announce if we crossed this threshold (were previously beyond it)
        const totalDist = calculateHaversineKm(
          this.session.origin.lat, this.session.origin.lng,
          this.session.destination.lat, this.session.destination.lng
        );
        if (totalDist > ann.thresholdKm) {
          this.session.announcementsMade.add(ann.id);
          const msg = ann.getMessage(distToDestination, language);
          const distEvent: NavigationEvent = { type: 'DISTANCE_ANNOUNCEMENT', message: msg };
          events.push(distEvent);
          this.emit(distEvent);
          break; // Only one announcement per position update
        }
      }
    }

    return events;
  }

  checkGeofence(nearestZoneDistKm: number, zoneName: string, language: string = 'en'): NavigationEvent | null {
    if (!this.session || this.session.state !== 'NAVIGATING') return null;

    if (nearestZoneDistKm < 5 && !this.session.geofenceWarningIssued) {
      this.session.geofenceWarningIssued = true;
      const msgFn = GEOFENCE_WARNING[language] || GEOFENCE_WARNING.en;
      const msg = msgFn(nearestZoneDistKm, zoneName);
      const event: NavigationEvent = {
        type: 'GEOFENCE_WARNING',
        message: msg,
        distanceKm: nearestZoneDistKm,
        zoneName,
      };
      this.emit(event);
      return event;
    }
    return null;
  }

  // Demo GPS simulation
  startDemoMovement(speedMultiplier: number = 1): void {
    if (!this.session || this.session.state !== 'NAVIGATING') return;
    this.stopDemoMovement();
    this.demoProgress = 0;

    const { origin, destination } = this.session;
    const route = this.session.route;
    const waypoints = route?.waypoints || route?.primaryRouteWaypoints || [
      { lat: origin.lat, lng: origin.lng },
      { lat: destination.lat, lng: destination.lng },
    ];

    const totalSteps = 120;
    const intervalMs = Math.max(200, 1000 / speedMultiplier);

    this.demoInterval = setInterval(() => {
      if (!this.session || this.session.state !== 'NAVIGATING') {
        this.stopDemoMovement();
        return;
      }

      this.demoProgress += 1;
      const frac = Math.min(this.demoProgress / totalSteps, 1);

      // Interpolate along waypoints
      const totalWaypoints = waypoints.length;
      const exactIdx = frac * (totalWaypoints - 1);
      const fromIdx = Math.floor(exactIdx);
      const toIdx = Math.min(fromIdx + 1, totalWaypoints - 1);
      const segFrac = exactIdx - fromIdx;

      const fromWp = waypoints[fromIdx];
      const toWp = waypoints[toIdx];

      const lat = fromWp.lat + segFrac * (toWp.lat - fromWp.lat);
      const lng = (fromWp.lng || (fromWp as any).lng) + segFrac * ((toWp.lng || (toWp as any).lng) - (fromWp.lng || (fromWp as any).lng));

      this.updatePosition(lat, lng, 'en');

      if (frac >= 1) {
        this.stopDemoMovement();
      }
    }, intervalMs);
  }

  stopDemoMovement(): void {
    if (this.demoInterval) {
      clearInterval(this.demoInterval);
      this.demoInterval = null;
    }
  }

  stopNavigation(): void {
    this.stopDemoMovement();
    if (this.session) {
      this.session.state = 'IDLE';
    }
    this.session = null;
  }

  endTrip(): { distanceTravelledKm: number; durationMinutes: number; destination: string } | null {
    if (!this.session) return null;
    const result = {
      distanceTravelledKm: Math.round(this.session.distanceTravelledKm * 10) / 10,
      durationMinutes: Math.round((Date.now() - this.session.startTime) / 60000),
      destination: this.session.destination.name,
    };
    this.stopNavigation();
    return result;
  }
}

export const globalNavigationEngine = new NavigationEngine();
