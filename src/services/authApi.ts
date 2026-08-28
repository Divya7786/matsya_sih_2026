export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  organization: string;
  designation: string;
  role: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

const TOKEN_KEY = 'matsya_jwt';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  if (!token) return { 'Content-Type': 'application/json' };
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export async function apiSignup(data: {
  email: string;
  password: string;
  full_name: string;
  organization?: string;
  designation?: string;
  role?: string;
}): Promise<AuthResponse> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Signup failed');
  return json as AuthResponse;
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Login failed');
  return json as AuthResponse;
}

export async function apiLogout(): Promise<void> {
  const token = getStoredToken();
  if (token) {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
  clearToken();
}

export async function apiMe(): Promise<AuthUser | null> {
  const token = getStoredToken();
  if (!token) return null;
  const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { clearToken(); return null; }
  const json = await res.json();
  return json.user as AuthUser;
}

export async function apiGetAnalysisHistory(): Promise<any[]> {
  const res = await fetch('/api/history/analyses', { headers: authHeaders() });
  if (!res.ok) return [];
  const json = await res.json();
  return json.analyses ?? [];
}

// ── Saved Locations ────────────────────────────────────────────────────────

export async function apiGetLocations(): Promise<any[]> {
  const res = await fetch('/api/user/locations', { headers: authHeaders() });
  if (!res.ok) return [];
  const json = await res.json();
  return json.locations ?? [];
}

export async function apiSaveLocation(data: {
  name: string;
  latitude: number;
  longitude: number;
  is_default?: boolean;
}): Promise<any | null> {
  const res = await fetch('/api/user/locations', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.location ?? null;
}

export async function apiDeleteLocation(locationId: string): Promise<boolean> {
  const res = await fetch(`/api/user/locations/${locationId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return res.ok;
}

// ── Notifications ──────────────────────────────────────────────────────────

export async function apiGetNotifications(): Promise<{ notifications: any[]; unreadCount: number }> {
  const res = await fetch('/api/user/notifications', { headers: authHeaders() });
  if (!res.ok) return { notifications: [], unreadCount: 0 };
  return res.json();
}

export async function apiMarkNotificationRead(alertId: string): Promise<boolean> {
  const res = await fetch(`/api/user/notifications/${alertId}/read`, {
    method: 'PUT',
    headers: authHeaders(),
  });
  return res.ok;
}

// ── Public Marine Data ─────────────────────────────────────────────────────

export async function apiGetPublicDashboard(lat: number, lng: number, region?: string): Promise<any | null> {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  if (region) params.set('region', region);
  const res = await fetch(`/api/public/dashboard?${params}`);
  if (!res.ok) return null;
  return res.json();
}

export async function apiGetActiveAlerts(): Promise<any[]> {
  const res = await fetch('/api/public/alerts');
  if (!res.ok) return [];
  const json = await res.json();
  return json.alerts ?? [];
}
