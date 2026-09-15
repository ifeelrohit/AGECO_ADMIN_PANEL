import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { agecoStore } from '../data/store.ts';
import { generateToken, authenticateToken, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

router.post('/login', (req, res): void => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required fields.',
      },
    });
    return;
  }

  const user = agecoStore.users.find(
    (u) => u.email.toLowerCase() === String(email).trim().toLowerCase()
  );

  if (!user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid administrative credentials provided.',
      },
    });
    return;
  }

  if (user.status !== 'ACTIVE') {
    res.status(403).json({
      success: false,
      error: {
        code: 'ACCOUNT_LOCKED',
        message: `Account is currently ${user.status}. Please contact System Administration.`,
      },
    });
    return;
  }

  const passwordMatches = bcrypt.compareSync(password, user.passwordHash);
  if (!passwordMatches) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid administrative credentials provided.',
      },
    });
    return;
  }

  // Update lastLoginAt
  user.lastLoginAt = new Date().toISOString();

  // Generate token
  const accessToken = generateToken(user);

  // Record audit log
  agecoStore.recordAudit(
    { id: user.id, name: user.name, role: user.role },
    'LOGIN',
    'AUTH',
    user.id,
    `Admin session initiated successfully for ${user.email} (${user.role})`,
    undefined,
    req.ip || '127.0.0.1'
  );

  res.status(200).json({
    success: true,
    data: {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 28800, // 8 hours
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status,
        twoFactorEnabled: user.twoFactorEnabled,
        lastLoginAt: user.lastLoginAt,
      },
    },
  });
});

router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const user = agecoStore.users.find((u) => u.id === req.user?.id);
  if (!user) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User profile not found.' },
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
      twoFactorEnabled: user.twoFactorEnabled,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    },
  });
});

router.post('/logout', authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  if (req.user) {
    agecoStore.recordAudit(
      { id: req.user.id, name: req.user.name, role: req.user.role },
      'LOGOUT',
      'AUTH',
      req.user.id,
      `User ${req.user.email} logged out from Admin Panel`,
      undefined,
      req.ip || '127.0.0.1'
    );
  }

  res.status(200).json({
    success: true,
    message: 'Session terminated successfully.',
  });
});

export default router;
