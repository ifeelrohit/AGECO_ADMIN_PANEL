import { Router, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { agecoStore } from '../data/store.ts';
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.ts';
import { User, UserRole } from '../types.ts';

const router = Router();

// Store for active password reset tokens: userId -> { token, expiresAt }
const resetTokenStore = new Map<string, { token: string; expiresAt: Date }>();

// Locked role matrix: User management strictly SUPER_ADMIN and ADMIN
const userMgmtAuth = [
  authenticateToken,
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
];

// GET /api/v1/admin/users
router.get('/', ...userMgmtAuth, (_req, res: Response) => {
  const safeUsers = agecoStore.users.map(({ passwordHash: _ph, ...safe }) => safe);
  res.json({
    success: true,
    message: 'Users retrieved successfully',
    data: {
      users: safeUsers,
      pagination: {
        page: 1,
        limit: 50,
        total: safeUsers.length,
        totalPages: 1,
      },
    },
  });
});

// GET /api/v1/admin/users/:userId
router.get('/:userId', ...userMgmtAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { userId } = req.params;
  const found = agecoStore.users.find((u) => u.id === userId);
  if (!found) {
    res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User not found in authoritative records.' },
    });
    return;
  }
  const { passwordHash: _ph, ...safeUser } = found;
  res.json({
    success: true,
    data: safeUser,
  });
});

// POST /api/v1/admin/users
router.post('/', ...userMgmtAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { name, email, password, role, department, twoFactorEnabled = false } = req.body || {};

  if (!name || !email || !role) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Name, email, and role are required.' },
    });
    return;
  }

  // Validate that role is one of the locked 5 roles
  const validRoles: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'SALES', 'CONTENT_MANAGER'];
  if (!validRoles.includes(role)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ROLE', message: `Invalid role '${role}'. Allowed roles: ${validRoles.join(', ')}.` },
    });
    return;
  }

  // Check email collision
  const existing = agecoStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    res.status(409).json({
      success: false,
      error: { code: 'EMAIL_EXISTS', message: 'A user with this email address already exists.' },
    });
    return;
  }

  // Only SUPER_ADMIN can create another SUPER_ADMIN or ADMIN
  if ((role === 'SUPER_ADMIN' || role === 'ADMIN') && req.user?.role !== 'SUPER_ADMIN') {
    res.status(403).json({
      success: false,
      error: { code: 'INSUFFICIENT_PRIVILEGE', message: 'Only SUPER_ADMIN can provision administrative tier accounts.' },
    });
    return;
  }

  const initialPassword = password || 'AgecoPassword2026!';
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(initialPassword, salt);

  const newUser: User = {
    id: `usr-${Date.now().toString().slice(-4)}`,
    name,
    email: email.toLowerCase().trim(),
    passwordHash,
    role,
    department: department || 'General Engineering',
    status: 'ACTIVE',
    twoFactorEnabled: Boolean(twoFactorEnabled),
    lastLoginAt: 'Never logged in',
    createdAt: new Date().toISOString(),
  };

  agecoStore.users.push(newUser);

  if (req.user) {
    agecoStore.recordAudit(
      req.user,
      'CREATE',
      'USER_MANAGEMENT',
      newUser.id,
      `Provisioned new user ${newUser.email} with role '${newUser.role}'`
    );
  }

  const { passwordHash: _ph, ...safeUser } = newUser;
  res.status(201).json({
    success: true,
    message: 'User provisioned successfully',
    data: safeUser,
  });
});

// PATCH /api/v1/admin/users/:userId
router.patch('/:userId', ...userMgmtAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { userId } = req.params;
  const index = agecoStore.users.findIndex((u) => u.id === userId);
  if (index === -1) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found.' } });
    return;
  }

  const existing = agecoStore.users[index];

  // Prevent non-SUPER_ADMIN from modifying SUPER_ADMIN accounts
  if (existing.role === 'SUPER_ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Cannot modify SUPER_ADMIN user without SUPER_ADMIN credentials.' },
    });
    return;
  }

  const { role, status, department, name, firstName, lastName, email, twoFactorEnabled, password } = req.body || {};

  // Check email update
  if (email && typeof email === 'string' && email.trim() && email.trim().toLowerCase() !== existing.email.toLowerCase()) {
    const trimmedEmail = email.trim().toLowerCase();
    const collision = agecoStore.users.find((u) => u.id !== userId && u.email.toLowerCase() === trimmedEmail);
    if (collision) {
      res.status(409).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'A user with this email address already exists.' },
      });
      return;
    }
    existing.email = trimmedEmail;
  }

  // Check role update
  if (role) {
    const validRoles: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'SALES', 'CONTENT_MANAGER'];
    if (!validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ROLE', message: `Invalid role. Allowed: ${validRoles.join(', ')}` },
      });
      return;
    }
    if ((role === 'SUPER_ADMIN' || role === 'ADMIN') && req.user?.role !== 'SUPER_ADMIN') {
      res.status(403).json({
        success: false,
        error: { code: 'INSUFFICIENT_PRIVILEGE', message: 'Only SUPER_ADMIN can assign administrative roles.' },
      });
      return;
    }
    existing.role = role;
  }

  // Name or firstName + lastName
  if (name !== undefined && typeof name === 'string') {
    existing.name = name.trim();
  } else if (firstName !== undefined || lastName !== undefined) {
    const combined = `${firstName || ''} ${lastName || ''}`.trim();
    if (combined) {
      existing.name = combined;
    }
  }

  if (status) {
    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
    if (validStatuses.includes(status)) {
      existing.status = status;
    }
  }

  if (department !== undefined && typeof department === 'string') {
    existing.department = department.trim();
  }

  if (typeof twoFactorEnabled === 'boolean') {
    existing.twoFactorEnabled = twoFactorEnabled;
  }

  if (password && typeof password === 'string' && password.trim().length >= 6) {
    const salt = bcrypt.genSaltSync(10);
    existing.passwordHash = bcrypt.hashSync(password.trim(), salt);
  }

  if (req.user) {
    agecoStore.recordAudit(
      req.user,
      'UPDATE',
      'USER_MANAGEMENT',
      userId,
      `Updated user profile for ${existing.email} (Status: ${existing.status}, Role: ${existing.role}, Name: ${existing.name})`
    );
  }

  const { passwordHash: _ph, ...safeUser } = existing;
  res.json({
    success: true,
    message: 'User updated successfully',
    data: safeUser,
  });
});

// POST /api/v1/admin/users/:userId/change-password
router.post('/:userId/change-password', ...userMgmtAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { userId } = req.params;
  const { currentPassword, newPassword } = req.body || {};

  const user = agecoStore.users.find((u) => u.id === userId);
  if (!user) {
    res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User not found.' },
    });
    return;
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_PASSWORD', message: 'New password must be at least 8 characters long.' },
    });
    return;
  }

  // If changing self password and current password provided, verify it
  if (req.user?.id === userId && currentPassword) {
    const matches = bcrypt.compareSync(currentPassword, user.passwordHash);
    if (!matches) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CURRENT_PASSWORD', message: 'Current password does not match.' },
      });
      return;
    }
  }

  const salt = bcrypt.genSaltSync(10);
  user.passwordHash = bcrypt.hashSync(newPassword, salt);

  if (req.user) {
    agecoStore.recordAudit(
      req.user,
      'UPDATE',
      'USER_MANAGEMENT',
      userId,
      `Password changed for ${user.email}`
    );
  }

  res.json({
    success: true,
    message: 'Password updated successfully.',
  });
});

// POST /api/v1/admin/users/:userId/password-reset
router.post('/:userId/password-reset', ...userMgmtAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { userId } = req.params;
  const user = agecoStore.users.find((u) => u.id === userId);
  if (!user) {
    res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User not found.' },
    });
    return;
  }

  // Invalidate any previous reset token for this user
  if (resetTokenStore.has(userId)) {
    resetTokenStore.delete(userId);
  }

  // Generate a cryptographically secure reset token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresInMinutes = 30;
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  resetTokenStore.set(userId, { token, expiresAt });

  // Record audit trail
  if (req.user) {
    agecoStore.recordAudit(
      req.user,
      'UPDATE',
      'USER_MANAGEMENT',
      userId,
      `Generated single-use password reset link for ${user.email} (30m validity)`
    );
  }

  const resetLink = `https://portal.ageco.com/auth/reset-password?token=${token}&uid=${userId}`;

  res.json({
    success: true,
    message: 'Secure password reset link generated successfully',
    data: {
      resetLink,
      expiresInMinutes,
      expiresAt: expiresAt.toISOString(),
    },
  });
});

// Support legacy DELETE
router.delete('/:id', ...userMgmtAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  if (id === req.user?.id) {
    res.status(400).json({ success: false, error: { code: 'CANNOT_DELETE_SELF', message: 'Administrators cannot delete their own active account.' } });
    return;
  }

  const index = agecoStore.users.findIndex((u) => u.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found.' } });
    return;
  }

  const target = agecoStore.users[index];
  if (target.role === 'SUPER_ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only SUPER_ADMIN can delete another administrator.' } });
    return;
  }

  agecoStore.users.splice(index, 1);

  if (req.user) {
    agecoStore.recordAudit(
      req.user,
      'DELETE',
      'USER_MANAGEMENT',
      id,
      `Revoked and deleted user account: ${target.email}`
    );
  }

  res.json({ success: true, message: `User ${target.email} deleted.` });
});

export default router;
