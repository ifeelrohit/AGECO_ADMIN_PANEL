import { Router, Response } from 'express';
import { agecoStore } from '../data/store.ts';
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.ts';
import { MediaItem } from '../types.ts';

const router = Router();

router.get('/', authenticateToken, (req, res: Response) => {
  const { category, search } = req.query;
  let items = [...agecoStore.mediaItems];

  if (category) {
    items = items.filter((m) => m.category === category);
  }
  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(
      (m) =>
        m.originalName.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, data: items });
});

router.post(
  '/upload',
  authenticateToken,
  authorizeRoles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'CONTENT_MANAGER'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { originalName, mimeType, sizeBytes, category = 'PDF_SPEC', tags = [], url } = req.body || {};

    if (!originalName) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Original filename is required.' } });
      return;
    }

    const newMedia: MediaItem = {
      id: `med-${Date.now().toString().slice(-4)}`,
      filename: `AGECO_${Date.now()}_${originalName.replace(/\s+/g, '_')}`,
      originalName,
      mimeType: mimeType || 'application/pdf',
      sizeBytes: Number(sizeBytes) || 1024000,
      category: category as MediaItem['category'],
      url: url || '/assets/media/sample-document.pdf',
      tags: Array.isArray(tags) ? tags : ['General'],
      uploadedBy: req.user?.name || 'Administrator',
      createdAt: new Date().toISOString(),
    };

    agecoStore.mediaItems.unshift(newMedia);

    if (req.user) {
      agecoStore.recordAudit(
        req.user,
        'CREATE',
        'MEDIA',
        newMedia.id,
        `Uploaded media asset '${newMedia.originalName}' (${newMedia.category})`
      );
    }

    res.status(201).json({ success: true, data: newMedia });
  }
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('SUPER_ADMIN', 'ADMIN', 'EDITOR'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { id } = req.params;
    const index = agecoStore.mediaItems.findIndex((m) => m.id === id);
    if (index === -1) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Media asset not found.' } });
      return;
    }

    const removed = agecoStore.mediaItems.splice(index, 1)[0];

    if (req.user) {
      agecoStore.recordAudit(req.user, 'DELETE', 'MEDIA', id, `Deleted media item '${removed.originalName}'`);
    }

    res.json({ success: true, message: 'Media asset deleted successfully.' });
  }
);

export default router;
