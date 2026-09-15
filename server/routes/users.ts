import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { agecoStore } from '../data/store.ts';
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.ts';
import { User, UserRole } from '../types.ts';

const router = Router();

// Locked role matrix: User management strictly SUPER_ADMIN and ADMIN
const userMgmtAuth = [
  authenticateToken,
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
];

router.get('/', ...userMgmtAuth, (_req, res: Response) => {
  // Strip password hashes
  const safeUsers = agecoStore.users.map(({ passwordHash: _ph, ...safe }) => safe);
  res.json({ success: true, data: safeUsers });
});

router.post('/', ...userMgmtAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { name, email, password, role, department, twoFactorEnabled = false } = req.body || {};

  if (!name || !email || !password || !role) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Name, email, password, and role are required.' },
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

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

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
  res.status(201).json({ success: true, data: safeUser });
});

router.put('/:id', ...userMgmtAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = agecoStore.users.findIndex((u) => u.id === id);
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

  const { role, status, department, name, twoFactorEnabled, password } = req.body || {};

  if (role) {
    const validRoles: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'SALES', 'CONTENT_MANAGER'];
    if (!validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ROLE', message: `Invalid role. Allowed: ${validRoles.join(', ')}` },
      });
      return;
    }
    existing.role = role;
  }

  if (status) existing.status = status;
  if (department) existing.department = department;
  if (name) existing.name = name;
  if (typeof twoFactorEnabled === 'boolean') existing.twoFactorEnabled = twoFactorEnabled;
  if (password) {
    const salt = bcrypt.genSaltSync(10);
    existing.passwordHash = bcrypt.hashSync(password, salt);
  }

  if (req.user) {
    agecoStore.recordAudit(
      req.user,
      'UPDATE',
      'USER_MANAGEMENT',
      id,
      `Updated user profile for ${existing.email} (${existing.role})`
    );
  }

  const { passwordHash: _ph, ...safeUser } = existing;
  res.json({ success: true, data: safeUser });
});

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
