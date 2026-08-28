import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name: string;
  organization: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

function getSecret(): string {
  return process.env.JWT_SECRET || 'matsya_dev_secret_change_in_production';
}

export function signToken(payload: AuthenticatedUser): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthenticatedUser | null {
  try {
    return jwt.verify(token, getSecret()) as AuthenticatedUser;
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const user = verifyToken(header.slice(7));
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
  req.user = user;
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const user = verifyToken(header.slice(7));
    if (user) req.user = user;
  }
  next();
}
