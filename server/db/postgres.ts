import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';

let pool: Pool | null = null;
const inMemoryUsers: Map<string, StoredUser> = new Map();
const inMemoryAnalyses: Map<string, StoredAnalysis[]> = new Map();
const inMemoryUserLocations: Map<string, StoredUserLocation[]> = new Map();
const inMemoryMarineAlerts: Map<string, StoredMarineAlert> = new Map(); // keyed by dedup_key
const inMemoryAlertList: StoredMarineAlert[] = [];

export interface StoredUser {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  organization: string;
  designation: string;
  role: string;
  phone: string;
  preferred_language: string;
  is_verified: boolean;
  account_status: string; // ACTIVE | PENDING_VERIFICATION | REJECTED
  last_login_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface StoredAnalysis {
  id: string;
  user_id: string;
  query: string;
  intent: string;
  location_name: string | null;
  lat: number | null;
  lng: number | null;
  answer_summary: string;
  data_status: string;
  pfz_count: number;
  wave_height: number | null;
  created_at: string;
}

export interface StoredUserLocation {
  id: string;
  user_id: string;
  name: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
  created_at: string;
}

export interface StoredMarineAlert {
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
  sst: number | null;
  source: string;
  is_active: boolean;
  dedup_key: string;
  created_at: string;
  expires_at: string | null;
}

function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function dbQuery(sql: string, params: any[] = []): Promise<any[]> {
  const p = getPool();
  if (!p) throw new Error('NO_DATABASE');
  const { rows } = await p.query(sql, params);
  return rows;
}

export async function runMigrations(): Promise<void> {
  const p = getPool();
  if (!p) {
    console.log('[DB] No DATABASE_URL — using in-memory store (development mode)');
    return;
  }
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      organization TEXT NOT NULL DEFAULT '',
      designation TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'PUBLIC_RESEARCHER',
      phone TEXT NOT NULL DEFAULT '',
      preferred_language TEXT NOT NULL DEFAULT 'en',
      is_verified BOOLEAN NOT NULL DEFAULT FALSE,
      account_status TEXT NOT NULL DEFAULT 'ACTIVE',
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'en';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'ACTIVE';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
    CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
    CREATE TABLE IF NOT EXISTS analysis_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      query TEXT NOT NULL,
      intent TEXT NOT NULL DEFAULT '',
      location_name TEXT,
      lat DOUBLE PRECISION,
      lng DOUBLE PRECISION,
      answer_summary TEXT NOT NULL DEFAULT '',
      data_status TEXT NOT NULL DEFAULT 'UNKNOWN',
      pfz_count INTEGER NOT NULL DEFAULT 0,
      wave_height DOUBLE PRECISION,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS trip_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      origin_name TEXT NOT NULL,
      destination_name TEXT NOT NULL,
      origin_lat DOUBLE PRECISION,
      origin_lng DOUBLE PRECISION,
      dest_lat DOUBLE PRECISION,
      dest_lng DOUBLE PRECISION,
      distance_km DOUBLE PRECISION,
      wave_height DOUBLE PRECISION,
      departure_window TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS user_locations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      is_default BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS marine_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      alert_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      region TEXT NOT NULL DEFAULT '',
      wave_height DOUBLE PRECISION,
      wind_speed DOUBLE PRECISION,
      sst DOUBLE PRECISION,
      source TEXT NOT NULL DEFAULT 'MATSYA AI',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      dedup_key TEXT UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS user_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      alert_id UUID NOT NULL REFERENCES marine_alerts(id) ON DELETE CASCADE,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      delivered_email BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      read_at TIMESTAMPTZ,
      UNIQUE(user_id, alert_id)
    );
    CREATE TABLE IF NOT EXISTS notification_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      alert_id UUID REFERENCES marine_alerts(id) ON DELETE SET NULL,
      channel TEXT NOT NULL DEFAULT 'system',
      status TEXT NOT NULL DEFAULT 'sent',
      message TEXT NOT NULL DEFAULT '',
      sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
    CREATE INDEX IF NOT EXISTS idx_marine_alerts_active ON marine_alerts(is_active);
    CREATE INDEX IF NOT EXISTS idx_user_alerts_user_id ON user_alerts(user_id);
    CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON notification_history(user_id);
  `;
  try {
    await p.query(schema);
    console.log('[DB] PostgreSQL schema ready');
  } catch (err: any) {
    console.error('[DB] Migration failed:', err.message);
  }
}

// ── In-memory fallback: users ──────────────────────────────────────────────

export function memCreateUser(user: StoredUser): void {
  inMemoryUsers.set(user.id, user);
}

export function memGetUserByEmail(email: string): StoredUser | undefined {
  for (const u of inMemoryUsers.values()) {
    if (u.email === email) return u;
  }
  return undefined;
}

export function memGetUserById(id: string): StoredUser | undefined {
  return inMemoryUsers.get(id);
}

export function memUpdateUser(id: string, patch: Partial<StoredUser>): void {
  const u = inMemoryUsers.get(id);
  if (u) inMemoryUsers.set(id, { ...u, ...patch, updated_at: new Date().toISOString() });
}

export function memGetAllUsers(): StoredUser[] {
  return Array.from(inMemoryUsers.values());
}

export function memGetUsersByAccountStatus(status: string): StoredUser[] {
  return Array.from(inMemoryUsers.values()).filter(u => (u.account_status ?? 'ACTIVE') === status);
}

// ── In-memory fallback: analyses ───────────────────────────────────────────

export function memSaveAnalysis(a: StoredAnalysis): void {
  const list = inMemoryAnalyses.get(a.user_id) ?? [];
  list.unshift(a);
  inMemoryAnalyses.set(a.user_id, list.slice(0, 100));
}

export function memGetAnalyses(userId: string): StoredAnalysis[] {
  return inMemoryAnalyses.get(userId) ?? [];
}

// ── In-memory fallback: user locations ────────────────────────────────────

export function memGetUserLocations(userId: string): StoredUserLocation[] {
  return inMemoryUserLocations.get(userId) ?? [];
}

export function memSaveUserLocation(loc: StoredUserLocation): void {
  const list = inMemoryUserLocations.get(loc.user_id) ?? [];
  list.push(loc);
  inMemoryUserLocations.set(loc.user_id, list);
}

export function memDeleteUserLocation(userId: string, locationId: string): void {
  const list = inMemoryUserLocations.get(userId) ?? [];
  inMemoryUserLocations.set(userId, list.filter(l => l.id !== locationId));
}

// ── In-memory fallback: marine alerts ─────────────────────────────────────

export function memUpsertAlert(candidate: Omit<StoredMarineAlert, 'id' | 'created_at'>): StoredMarineAlert {
  const existing = inMemoryMarineAlerts.get(candidate.dedup_key);
  if (existing) {
    const updated: StoredMarineAlert = { ...existing, ...candidate };
    inMemoryMarineAlerts.set(candidate.dedup_key, updated);
    const idx = inMemoryAlertList.findIndex(a => a.id === existing.id);
    if (idx >= 0) inMemoryAlertList[idx] = updated;
    return updated;
  }
  const alert: StoredMarineAlert = {
    ...candidate,
    id: randomUUID(),
    created_at: new Date().toISOString(),
  };
  inMemoryMarineAlerts.set(alert.dedup_key, alert);
  inMemoryAlertList.unshift(alert);
  return alert;
}

export function memGetActiveAlerts(): StoredMarineAlert[] {
  return inMemoryAlertList.filter(a => a.is_active);
}

export function memGetAllAlerts(limit = 50): StoredMarineAlert[] {
  return inMemoryAlertList.slice(0, limit);
}

export function useInMemory(): boolean {
  return !process.env.DATABASE_URL;
}

export async function dbHealthCheck(): Promise<{
  connected: boolean;
  mode: 'postgresql' | 'in-memory';
  databaseName: string | null;
  tables: Record<string, boolean>;
  userCount: number;
}> {
  if (useInMemory()) {
    return {
      connected: false,
      mode: 'in-memory',
      databaseName: null,
      tables: {
        users: true,
        user_locations: true,
        marine_alerts: true,
        user_alerts: true,
        notification_history: true,
      },
      userCount: inMemoryUsers.size,
    };
  }

  const tableNames = ['users', 'user_locations', 'marine_alerts', 'user_alerts', 'notification_history', 'analysis_history'];
  const tables: Record<string, boolean> = {};
  let dbName: string | null = null;
  let userCount = 0;

  try {
    const dbRow = await dbQuery(`SELECT current_database() AS db`);
    dbName = dbRow[0]?.db ?? null;

    for (const t of tableNames) {
      const rows = await dbQuery(
        `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name=$1 AND table_schema='public') AS exists`,
        [t],
      );
      tables[t] = rows[0]?.exists === true;
    }

    const countRows = await dbQuery(`SELECT COUNT(*) AS c FROM users`);
    userCount = parseInt(countRows[0]?.c ?? '0', 10);

    return { connected: true, mode: 'postgresql', databaseName: dbName, tables, userCount };
  } catch (err: any) {
    return {
      connected: false,
      mode: 'postgresql',
      databaseName: null,
      tables,
      userCount: 0,
    };
  }
}

export async function dbGetSafeUsers(): Promise<Array<{
  id: string; full_name: string; email: string; role: string;
  is_verified: boolean; account_status: string; created_at: string;
}>> {
  if (useInMemory()) {
    return Array.from(inMemoryUsers.values()).map(u => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      role: u.role,
      is_verified: u.is_verified,
      account_status: u.account_status ?? 'ACTIVE',
      created_at: u.created_at,
    }));
  }
  try {
    const rows = await dbQuery(
      `SELECT id, full_name, email, role, is_verified, account_status, created_at FROM users ORDER BY created_at DESC LIMIT 100`,
    );
    return rows;
  } catch { return []; }
}

export async function seedInMemoryAdmin(email: string, password: string, name: string): Promise<void> {
  if (!useInMemory()) return;
  const lowerEmail = email.toLowerCase().trim();
  const existing = memGetUserByEmail(lowerEmail);
  if (existing) {
    if (existing.role !== 'ADMIN') {
      memUpdateUser(existing.id, { role: 'ADMIN', account_status: 'ACTIVE', is_verified: true });
      console.log(`[AUTH] In-memory user ${lowerEmail} promoted to ADMIN`);
    }
    return;
  }
  const password_hash = await bcrypt.hash(password, 12);
  memCreateUser({
    id: `admin-${randomUUID()}`,
    email: lowerEmail,
    password_hash,
    full_name: name,
    organization: 'MATSYA AI',
    designation: 'System Administrator',
    role: 'ADMIN',
    phone: '',
    preferred_language: 'en',
    is_verified: true,
    account_status: 'ACTIVE',
    last_login_at: null,
    created_at: new Date().toISOString(),
    updated_at: null,
  });
  console.log(`[AUTH] In-memory admin seeded: ${lowerEmail}`);
}
