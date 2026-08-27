export interface CachedItem<T = any> {
  key: string;
  data: T;
  cachedAt: number;
  expiresAt: number;
  source: string;
}

export type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'SLOW';

const CACHE_PREFIX = 'matsya_cache_';
const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

class OfflineCacheService {
  private status: ConnectionStatus = 'ONLINE';
  private listeners: ((status: ConnectionStatus) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.setStatus('ONLINE'));
      window.addEventListener('offline', () => this.setStatus('OFFLINE'));
      this.status = navigator.onLine ? 'ONLINE' : 'OFFLINE';
    }
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  isOnline(): boolean {
    return this.status === 'ONLINE';
  }

  onStatusChange(cb: (status: ConnectionStatus) => void): () => void {
    this.listeners.push(cb);
    return () => { this.listeners = this.listeners.filter(l => l !== cb); };
  }

  private setStatus(status: ConnectionStatus) {
    if (this.status !== status) {
      this.status = status;
      this.listeners.forEach(cb => cb(status));
    }
  }

  set<T>(key: string, data: T, source: string, ttlMs: number = DEFAULT_TTL_MS): void {
    try {
      const item: CachedItem<T> = {
        key,
        data,
        cachedAt: Date.now(),
        expiresAt: Date.now() + ttlMs,
        source,
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
    } catch (e) {
      // localStorage full — evict oldest items
      this.evictOldest(3);
      try {
        const item: CachedItem<T> = { key, data, cachedAt: Date.now(), expiresAt: Date.now() + ttlMs, source };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
      } catch {}
    }
  }

  get<T>(key: string): CachedItem<T> | null {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const item: CachedItem<T> = JSON.parse(raw);
      return item;
    } catch {
      return null;
    }
  }

  getFresh<T>(key: string): T | null {
    const item = this.get<T>(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) return null;
    return item.data;
  }

  getStale<T>(key: string): { data: T; age: string; source: string } | null {
    const item = this.get<T>(key);
    if (!item) return null;
    const ageMs = Date.now() - item.cachedAt;
    const ageMins = Math.round(ageMs / 60000);
    const age = ageMins < 60 ? `${ageMins} min ago` : `${Math.round(ageMins / 60)} hr ago`;
    return { data: item.data, age, source: item.source };
  }

  // Cache specific data types
  cacheWeatherData(lat: number, lng: number, data: any): void {
    this.set(`weather_${lat.toFixed(2)}_${lng.toFixed(2)}`, data, 'WeatherSafetyAgent', 20 * 60 * 1000);
  }

  cachePfzData(lat: number, lng: number, data: any): void {
    this.set(`pfz_${lat.toFixed(2)}_${lng.toFixed(2)}`, data, 'OceanPfzAgent', 60 * 60 * 1000);
  }

  cacheGeofenceData(data: any): void {
    this.set('geofence_boundaries', data, 'GeofenceAgent', 24 * 60 * 60 * 1000);
  }

  cacheRouteData(routeId: string, data: any): void {
    this.set(`route_${routeId}`, data, 'RoutingAgent', 4 * 60 * 60 * 1000);
  }

  cacheOrchestrationResult(queryHash: string, data: any): void {
    this.set(`orch_${queryHash}`, data, 'Orchestrator', 15 * 60 * 1000);
  }

  getWeatherCache(lat: number, lng: number): any | null {
    return this.getStale(`weather_${lat.toFixed(2)}_${lng.toFixed(2)}`);
  }

  getPfzCache(lat: number, lng: number): any | null {
    return this.getStale(`pfz_${lat.toFixed(2)}_${lng.toFixed(2)}`);
  }

  getGeofenceCache(): any | null {
    return this.getStale('geofence_boundaries');
  }

  private evictOldest(count: number): void {
    const entries: { key: string; cachedAt: number }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          entries.push({ key, cachedAt: item.cachedAt || 0 });
        } catch {}
      }
    }
    entries.sort((a, b) => a.cachedAt - b.cachedAt);
    entries.slice(0, count).forEach(e => localStorage.removeItem(e.key));
  }

  clearAll(): void {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) toRemove.push(key);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  }

  getCacheStats(): { totalItems: number; totalSizeKb: number; oldestMinutes: number } {
    let count = 0;
    let size = 0;
    let oldest = Date.now();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        count++;
        const val = localStorage.getItem(key) || '';
        size += val.length;
        try {
          const item = JSON.parse(val);
          if (item.cachedAt < oldest) oldest = item.cachedAt;
        } catch {}
      }
    }
    return {
      totalItems: count,
      totalSizeKb: Math.round(size / 1024),
      oldestMinutes: count > 0 ? Math.round((Date.now() - oldest) / 60000) : 0,
    };
  }
}

export const globalOfflineCache = new OfflineCacheService();
