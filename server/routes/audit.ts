import { Router, Response } from 'express';
import { agecoStore } from '../data/store.ts';
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// Locked role matrix: Audit logs strictly SUPER_ADMIN and ADMIN
const auditAuth = [
  authenticateToken,
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
];

router.get('/', ...auditAuth, (req, res: Response) => {
  const { module, action, search } = req.query;
  let items = [...agecoStore.auditLogs];

  if (module) {
    items = items.filter((l) => l.module === module);
  }
  if (action) {
    items = items.filter((l) => l.action === action);
  }
  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(
      (l) =>
        l.actorName.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.resourceId.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    data: items,
    total: items.length,
  });
});

router.post('/export', ...auditAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (req.user) {
    agecoStore.recordAudit(
      req.user,
      'UPDATE',
      'AUDIT_COMPLIANCE',
      'AUDIT_EXPORT',
      `Exported enterprise compliance audit log snapshot (${agecoStore.auditLogs.length} events)`
    );
  }

  res.json({
    success: true,
    message: 'Audit log exported.',
    count: agecoStore.auditLogs.length,
    timestamp: new Date().toISOString(),
  });
});

export default router;
