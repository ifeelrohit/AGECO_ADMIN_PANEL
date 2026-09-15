import { Router, Response } from 'express';
import { agecoStore } from '../data/store.ts';
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.ts';
import { Enquiry } from '../types.ts';

const router = Router();

const enquiriesAuth = [
  authenticateToken,
  authorizeRoles('SUPER_ADMIN', 'ADMIN', 'SALES'),
];

router.get('/', ...enquiriesAuth, (req, res: Response) => {
  const { status, priority, search } = req.query;
  let items = [...agecoStore.enquiries];

  if (status) {
    items = items.filter((e) => e.status === status);
  }
  if (priority) {
    items = items.filter((e) => e.priority === priority);
  }
  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(
      (e) =>
        e.company.toLowerCase().includes(q) ||
        e.contactName.toLowerCase().includes(q) ||
        e.referenceNumber.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    data: items,
    total: items.length,
  });
});

router.get('/:id', ...enquiriesAuth, (req, res: Response): void => {
  const enquiry = agecoStore.enquiries.find((e) => e.id === req.params.id);
  if (!enquiry) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Enquiry record not found.' } });
    return;
  }
  res.json({ success: true, data: enquiry });
});

router.put('/:id', ...enquiriesAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = agecoStore.enquiries.findIndex((e) => e.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Enquiry record not found.' } });
    return;
  }

  const existing = agecoStore.enquiries[index];
  const previousStatus = existing.status;
  const updated: Enquiry = {
    ...existing,
    ...req.body,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };

  agecoStore.enquiries[index] = updated;

  if (req.user) {
    const isStatusChange = previousStatus !== updated.status;
    agecoStore.recordAudit(
      req.user,
      isStatusChange ? 'STATUS_CHANGE' : 'UPDATE',
      'ENQUIRIES',
      id,
      `Updated enquiry ${updated.referenceNumber} (${updated.company})`,
      isStatusChange ? `status: "${previousStatus}" -> "${updated.status}"` : undefined
    );
  }

  res.json({ success: true, data: updated });
});

router.post('/:id/notes', ...enquiriesAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const { text } = req.body || {};
  if (!text) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Note text is required.' } });
    return;
  }

  const enquiry = agecoStore.enquiries.find((e) => e.id === id);
  if (!enquiry) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Enquiry record not found.' } });
    return;
  }

  const newNote = {
    id: `note-${Date.now()}`,
    author: req.user?.name || 'Sales Staff',
    text: String(text).trim(),
    createdAt: new Date().toISOString(),
  };

  enquiry.internalNotes.push(newNote);
  enquiry.updatedAt = new Date().toISOString();

  if (req.user) {
    agecoStore.recordAudit(
      req.user,
      'UPDATE',
      'ENQUIRIES',
      id,
      `Appended internal note to RFP/Enquiry ${enquiry.referenceNumber}`
    );
  }

  res.status(201).json({ success: true, data: newNote, enquiry });
});

export default router;
