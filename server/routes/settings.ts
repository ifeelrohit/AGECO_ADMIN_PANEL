import { Router, Response } from 'express';
import { agecoStore } from '../data/store.ts';
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.ts';
import { SystemSetting } from '../types.ts';

const router = Router();

// Locked role matrix: System settings strictly SUPER_ADMIN and ADMIN
const settingsAuth = [
  authenticateToken,
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
];

router.get('/', ...settingsAuth, (_req, res: Response) => {
  res.json({ success: true, data: agecoStore.systemSettings });
});

router.put('/:id', ...settingsAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = agecoStore.systemSettings.findIndex((s) => s.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Setting not found.' } });
    return;
  }

  const existing = agecoStore.systemSettings[index];
  const previousValue = existing.value;
  const { value } = req.body || {};

  if (value === undefined) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Value is required.' } });
    return;
  }

  existing.value = String(value);
  existing.updatedAt = new Date().toISOString();

  if (req.user) {
    agecoStore.recordAudit(
      req.user,
      'CONFIG_UPDATE',
      'SYSTEM_SETTINGS',
      existing.key,
      `Modified system configuration parameter '${existing.label}'`,
      `value: "${previousValue}" -> "${existing.value}"`
    );
  }

  res.json({ success: true, data: existing });
});

export default router;
