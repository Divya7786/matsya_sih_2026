export type GeoStatus = 'idle' | 'loading' | 'success' | 'denied' | 'unavailable' | 'error';

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  status: GeoStatus;
  isLive: boolean;
}

const FALLBACK_POSITION: GeoPosition = {
  latitude: 13.0827,
  longitude: 80.2707,
  accuracy: 0,
  status: 'idle',
  isLive: false,
};

export function isGeolocationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

export function requestPosition(): Promise<GeoPosition> {
  if (!isGeolocationSupported()) {
    return Promise.resolve({ ...FALLBACK_POSITION, status: 'unavailable' });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
          status: 'success',
          isLive: true,
        });
      },
      (error) => {
        const status: GeoStatus =
          error.code === error.PERMISSION_DENIED ? 'denied' :
          error.code === error.POSITION_UNAVAILABLE ? 'unavailable' : 'error';
        resolve({ ...FALLBACK_POSITION, status });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}

export function getFallbackPosition(): GeoPosition {
  return { ...FALLBACK_POSITION };
}

export function formatLocationName(pos: GeoPosition): string {
  if (!pos.isLive) return 'Kasimedu Fishing Harbour, Chennai (Demo)';
  return `GPS Location (${pos.latitude.toFixed(4)}°N, ${pos.longitude.toFixed(4)}°E)`;
}
