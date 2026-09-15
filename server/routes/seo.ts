import { Router, Response } from 'express';
import { agecoStore } from '../data/store.ts';
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.ts';
import { SeoConfig } from '../types.ts';

const router = Router();

const seoAuth = [
  authenticateToken,
  authorizeRoles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'CONTENT_MANAGER'),
];

router.get('/', ...seoAuth, (_req, res: Response) => {
  res.json({
    success: true,
    data: agecoStore.seoConfigs,
    sitemapStatus: {
      generatedAt: new Date().toISOString(),
      indexedUrlsCount: 42,
      robotsTxtConfigured: true,
      googleSearchConsoleConnected: true,
    },
  });
});

router.put('/:id', ...seoAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = agecoStore.seoConfigs.findIndex((s) => s.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'SEO configuration not found.' } });
    return;
  }

  const existing = agecoStore.seoConfigs[index];
  const updated: SeoConfig = {
    ...existing,
    ...req.body,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };

  agecoStore.seoConfigs[index] = updated;

  if (req.user) {
    agecoStore.recordAudit(
      req.user,
      'CONFIG_UPDATE',
      'SEO',
      id,
      `Updated SEO meta directives for path: ${updated.pagePath}`
    );
  }

  res.json({ success: true, data: updated });
});

export default router;
