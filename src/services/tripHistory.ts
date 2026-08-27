export interface TripRecord {
  id: string;
  date: string;
  startLocation: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  distanceKm: number;
  durationMinutes: number;
  pfzName: string;
  recommendation: string;
  confidenceScore: number;
  safetyStatus: 'SAFE' | 'CAUTION' | 'HIGH_RISK';
  dataTimestamp: string;
}

export interface UserMemory {
  preferredLanguage: string;
  previousDestinations: { lat: number; lng: number; name: string }[];
  tripCount: number;
  lastTripDate: string | null;
  preferences: Record<string, string>;
}

const TRIPS_KEY = 'matsya_trip_history';
const MEMORY_KEY = 'matsya_user_memory';

export class TripHistoryService {
  getTrips(): TripRecord[] {
    try {
      const raw = localStorage.getItem(TRIPS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveTrip(trip: Omit<TripRecord, 'id' | 'date'>): TripRecord {
    const record: TripRecord = {
      ...trip,
      id: `trip-${Date.now().toString(36)}`,
      date: new Date().toISOString(),
    };
    const trips = this.getTrips();
    trips.unshift(record);
    // Keep last 50 trips
    const trimmed = trips.slice(0, 50);
    localStorage.setItem(TRIPS_KEY, JSON.stringify(trimmed));

    // Update memory
    const memory = this.getMemory();
    memory.tripCount = trimmed.length;
    memory.lastTripDate = record.date;
    if (!memory.previousDestinations.find(d => d.name === record.destination.name)) {
      memory.previousDestinations.unshift(record.destination);
      memory.previousDestinations = memory.previousDestinations.slice(0, 20);
    }
    this.saveMemory(memory);

    return record;
  }

  getLastTrip(): TripRecord | null {
    const trips = this.getTrips();
    return trips.length > 0 ? trips[0] : null;
  }

  getMemory(): UserMemory {
    try {
      const raw = localStorage.getItem(MEMORY_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* noop */ }
    return {
      preferredLanguage: 'ta',
      previousDestinations: [],
      tripCount: 0,
      lastTripDate: null,
      preferences: {},
    };
  }

  saveMemory(memory: UserMemory): void {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  }

  updateLanguagePreference(lang: string): void {
    const memory = this.getMemory();
    memory.preferredLanguage = lang;
    this.saveMemory(memory);
  }

  findPreviousDestination(query: string): { lat: number; lng: number; name: string } | null {
    const q = query.toLowerCase();
    const memory = this.getMemory();
    if (q.includes('yesterday') || q.includes('same place') || q.includes('last') ||
        q.includes('நேற்று') || q.includes('அதே') || q.includes('कल') || q.includes('पिछली')) {
      const lastTrip = this.getLastTrip();
      if (lastTrip) return lastTrip.destination;
    }
    return memory.previousDestinations.find(d =>
      d.name.toLowerCase().includes(q)
    ) || null;
  }

  clearHistory(): void {
    localStorage.removeItem(TRIPS_KEY);
  }
}

export const globalTripHistory = new TripHistoryService();
