import { Pool, PoolClient } from 'pg';

let pool: Pool | null = null;
const inMemoryUsers: Map<string, StoredUser> = new Map();
const inMemoryAnalyses: Map<string, StoredAnalysis[]> = new Map();

export interface StoredUser {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  organization: string;
  designation: string;
  role: string;
  created_at: string;
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

function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false } });
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
    console.log('[DB] No DATABASE_URL — using in-memory user store (development mode)');
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
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
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
  `;
  try {
    await p.query(schema);
    console.log('[DB] PostgreSQL schema ready');
  } catch (err: any) {
    console.error('[DB] Migration failed:', err.message);
  }
}

// ── In-memory fallback (used when DATABASE_URL is not set) ─────────────────

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

export function memSaveAnalysis(a: StoredAnalysis): void {
  const list = inMemoryAnalyses.get(a.user_id) ?? [];
  list.unshift(a);
  inMemoryAnalyses.set(a.user_id, list.slice(0, 100));
}

export function memGetAnalyses(userId: string): StoredAnalysis[] {
  return inMemoryAnalyses.get(userId) ?? [];
}

export function useInMemory(): boolean {
  return !process.env.DATABASE_URL;
}
