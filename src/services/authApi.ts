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
