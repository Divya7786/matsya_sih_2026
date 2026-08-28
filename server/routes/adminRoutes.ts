import { Router, Request, Response, NextFunction } from 'express';
import {
  dbQuery, useInMemory,
  memGetUsersByAccountStatus, memGetAllUsers, memGetUserById, memUpdateUser,
  StoredUser,
} from '../db/postgres';
import { requireAuth } from '../middleware/auth';

export const adminRouter = Router();

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

function safeAdminUser(u: StoredUser) {
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    organization: u.organization,
    designation: u.designation,
    role: u.role,
    account_status: u.account_status ?? 'ACTIVE',
    is_verified: u.is_verified ?? false,
    created_at: u.created_at,
  };
}

// GET /api/admin/users/pending — list accounts awaiting verification
adminRouter.get('/users/pending', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    if (useInMemory()) {
      const users = memGetUsersByAccountStatus('PENDING_VERIFICATION');
      res.json({ users: users.map(safeAdminUser), count: users.length });
    } else {
      const rows = await dbQuery(
        `SELECT id, email, full_name, organization, designation, role, account_status, is_verified, created_at
         FROM users WHERE account_status='PENDING_VERIFICATION' ORDER BY created_at DESC`,
      );
      res.json({ users: rows, count: rows.length });
    }
  } catch (err: any) {
    console.error('[ADMIN] Failed to fetch pending users:', err.message);
    res.status(500).json({ error: 'Failed to fetch pending users' });
  }
});

// GET /api/admin/users — list all users
adminRouter.get('/users', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    if (useInMemory()) {
      const users = memGetAllUsers();
      res.json({ users: users.map(safeAdminUser), count: users.length });
    } else {
      const rows = await dbQuery(
        `SELECT id, email, full_name, organization, designation, role, account_status, is_verified, created_at
         FROM users ORDER BY created_at DESC LIMIT 200`,
      );
      res.json({ users: rows, count: rows.length });
    }
  } catch (err: any) {
    console.error('[ADMIN] Failed to fetch users:', err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/admin/users/:id/verify — activate a pending user
adminRouter.post('/users/:id/verify', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    if (useInMemory()) {
      const user = memGetUserById(id);
      if (!user) { res.status(404).json({ error: 'User not found' }); return; }
      memUpdateUser(id, { account_status: 'ACTIVE', is_verified: true });
      console.log(`[ADMIN] User ${user.email} verified by ${req.user!.email}`);
      res.json({ success: true, message: `${user.full_name} verified and activated` });
    } else {
      const rows = await dbQuery(
        `UPDATE users SET account_status='ACTIVE', is_verified=true, updated_at=NOW() WHERE id=$1 RETURNING id, full_name`,
        [id],
      );
      if (rows.length === 0) { res.status(404).json({ error: 'User not found' }); return; }
      console.log(`[ADMIN] User ${rows[0].full_name} (${id}) verified by ${req.user!.email}`);
      res.json({ success: true, message: `${rows[0].full_name} verified and activated` });
    }
  } catch (err: any) {
    console.error('[ADMIN] Verify error:', err.message);
    res.status(500).json({ error: 'Failed to verify user' });
  }
});

// POST /api/admin/users/:id/reject — reject a pending user
adminRouter.post('/users/:id/reject', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    if (useInMemory()) {
      const user = memGetUserById(id);
      if (!user) { res.status(404).json({ error: 'User not found' }); return; }
      memUpdateUser(id, { account_status: 'REJECTED', is_verified: false });
      console.log(`[ADMIN] User ${user.email} rejected by ${req.user!.email}`);
      res.json({ success: true, message: `${user.full_name} rejected` });
    } else {
      const rows = await dbQuery(
        `UPDATE users SET account_status='REJECTED', is_verified=false, updated_at=NOW() WHERE id=$1 RETURNING id, full_name`,
        [id],
      );
      if (rows.length === 0) { res.status(404).json({ error: 'User not found' }); return; }
      console.log(`[ADMIN] User ${rows[0].full_name} (${id}) rejected by ${req.user!.email}`);
      res.json({ success: true, message: `${rows[0].full_name} rejected` });
    }
  } catch (err: any) {
    console.error('[ADMIN] Reject error:', err.message);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});
