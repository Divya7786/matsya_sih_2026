import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import {
  dbQuery, useInMemory,
  memCreateUser, memGetUserByEmail, memGetUserById,
  StoredUser,
} from '../db/postgres';
import { signToken, requireAuth } from '../middleware/auth';

export const authRouter = Router();

const BCRYPT_ROUNDS = 12;

function safeUser(u: StoredUser) {
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    organization: u.organization,
    designation: u.designation,
    role: u.role,
    created_at: u.created_at,
  };
}

// POST /api/auth/signup
authRouter.post('/signup', async (req: Request, res: Response) => {
  const { email, password, full_name, organization = '', designation = '', role = 'PUBLIC_RESEARCHER' } = req.body;

  if (!email || !password || !full_name) {
    res.status(400).json({ error: 'email, password, and full_name are required' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }
  const sanitizedEmail = email.toLowerCase().trim();
  const allowedRoles = ['PUBLIC_RESEARCHER', 'MARINE_ANALYST', 'ISRO_SCIENTIST', 'COAST_GUARD', 'FISHERMAN'];
  const assignedRole = allowedRoles.includes(role) ? role : 'PUBLIC_RESEARCHER';

  try {
    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    if (useInMemory()) {
      const existing = memGetUserByEmail(sanitizedEmail);
      if (existing) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }
      const user: StoredUser = {
        id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        email: sanitizedEmail,
        password_hash,
        full_name,
        organization,
        designation,
        role: assignedRole,
        created_at: new Date().toISOString(),
      };
      memCreateUser(user);
      const token = signToken({ id: user.id, email: user.email, full_name: user.full_name, organization: user.organization, role: user.role });
      res.status(201).json({ token, user: safeUser(user) });
    } else {
      const existing = await dbQuery('SELECT id FROM users WHERE email=$1', [sanitizedEmail]);
      if (existing.length > 0) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }
      const rows = await dbQuery(
        `INSERT INTO users (email, password_hash, full_name, organization, designation, role)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [sanitizedEmail, password_hash, full_name, organization, designation, assignedRole]
      );
      const user = rows[0];
      const token = signToken({ id: user.id, email: user.email, full_name: user.full_name, organization: user.organization, role: user.role });
      res.status(201).json({ token, user: safeUser(user) });
    }
  } catch (err: any) {
    console.error('[AUTH] Signup error:', err.message);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }
  const sanitizedEmail = email.toLowerCase().trim();

  try {
    let user: StoredUser | null = null;

    if (useInMemory()) {
      const found = memGetUserByEmail(sanitizedEmail);
      if (found) user = found;
    } else {
      const rows = await dbQuery('SELECT * FROM users WHERE email=$1', [sanitizedEmail]);
      if (rows.length > 0) user = rows[0];
    }

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const token = signToken({ id: user.id, email: user.email, full_name: user.full_name, organization: user.organization, role: user.role });
    res.json({ token, user: safeUser(user) });
  } catch (err: any) {
    console.error('[AUTH] Login error:', err.message);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// POST /api/auth/logout — client-side token discard; server-side is stateless
authRouter.post('/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  const uid = req.user!.id;
  try {
    let user: StoredUser | null = null;
    if (useInMemory()) {
      user = memGetUserById(uid) ?? null;
    } else {
      const rows = await dbQuery('SELECT * FROM users WHERE id=$1', [uid]);
      if (rows.length > 0) user = rows[0];
    }
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: safeUser(user) });
  } catch (err: any) {
    console.error('[AUTH] /me error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});
