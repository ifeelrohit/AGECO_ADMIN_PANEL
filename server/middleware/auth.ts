import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, User } from '../types.ts';
import { agecoStore } from '../data/store.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'ageco-enterprise-jwt-secret-key-2026-production';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    department: string;
  };
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      department: user.department,
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token missing. Bearer authorization header is required.',
      },
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: UserRole;
      name: string;
      department: string;
    };

    const existingUser = agecoStore.users.find((u) => u.id === decoded.id);
    if (!existingUser || existingUser.status !== 'ACTIVE') {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_INACTIVE_OR_NOT_FOUND',
          message: 'The user account is inactive or no longer authorized.',
        },
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (err: unknown) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'The provided access token is invalid or has expired.',
      },
    });
    return;
  }
}

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required before role verification.',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_ROLE_ACCESS',
          message: `Access denied. Role '${req.user.role}' is not authorized for this operation. Permitted roles: ${allowedRoles.join(', ')}.`,
        },
      });
      return;
    }

    next();
  };
}
