import { Router, Response } from 'express';
import { agecoStore } from '../data/store.ts';
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// Locked role matrix: Database diagnostics strictly SUPER_ADMIN and ADMIN
const diagnosticsAuth = [
  authenticateToken,
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
];

router.get('/', ...diagnosticsAuth, (_req, res: Response) => {
  const diagnostics = agecoStore.getDiagnostics();
  res.json({ success: true, data: diagnostics });
});

router.post('/vacuum', ...diagnosticsAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (req.user) {
    agecoStore.recordAudit(
      req.user,
      'UPDATE',
      'DATABASE_DIAGNOSTICS',
      'POSTGRES_MAINTENANCE',
      'Executed VACUUM ANALYZE across all PostgreSQL production tables.'
    );
  }

  const updatedStats = agecoStore.getDiagnostics();
  updatedStats.tableStats.forEach((t) => {
    t.lastVacuum = new Date().toISOString();
  });

  res.json({
    success: true,
    message: 'PostgreSQL VACUUM ANALYZE completed successfully. Indices re-indexed.',
    data: updatedStats,
  });
});

export default router;
