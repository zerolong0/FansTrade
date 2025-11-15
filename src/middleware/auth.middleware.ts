import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

/**
 * Extend Express Request to include user
 */
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    username: string;
  };
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token from Authorization header
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    console.log('[Auth] Request URL:', req.url);
    console.log('[Auth] Authorization header:', authHeader ? `Bearer ${authHeader.slice(7, 27)}...` : 'MISSING');

    if (!authHeader) {
      console.log('[Auth] FAILED: No authorization header');
      res.status(401).json({ error: 'No authorization header' });
      return;
    }

    // Extract token (format: "Bearer <token>")
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.log('[Auth] FAILED: Invalid format, parts:', parts.length, 'type:', parts[0]);
      res.status(401).json({ error: 'Invalid authorization format. Use: Bearer <token>' });
      return;
    }

    const token = parts[1];

    // Verify token
    const payload = authService.verifyToken(token);

    console.log('[Auth] SUCCESS: User authenticated:', payload.username);

    // Attach user to request
    req.user = payload;

    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    console.log('[Auth] FAILED: Verification error:', message);
    res.status(401).json({ error: message });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const parts = authHeader.split(' ');

    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1];
      const payload = authService.verifyToken(token);
      req.user = payload;
    }

    next();
  } catch {
    // Token is invalid, but we don't fail
    next();
  }
}
