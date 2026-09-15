import { Router, Response } from 'express';
import { agecoStore } from '../data/store.ts';
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.ts';
import { WebsiteHeroSlide, Solution, Industry, Story, Project, WebsiteContentBlock } from '../types.ts';

const router = Router();

const websiteAuth = [
  authenticateToken,
  authorizeRoles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'CONTENT_MANAGER'),
];

// ----------------------------------------------------
// HOMEPAGE HERO SLIDES
// ----------------------------------------------------
router.get('/homepage', ...websiteAuth, (_req, res: Response) => {
  res.json({ success: true, data: agecoStore.heroSlides });
});

router.post('/homepage', ...websiteAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { headline, subheadline, primaryCtaText, primaryCtaLink, badge, imageUrl, active = true } = req.body || {};
  if (!headline) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Headline is required.' } });
    return;
  }
  const newSlide: WebsiteHeroSlide = {
    id: `slide-${Date.now().toString().slice(-4)}`,
    headline,
    subheadline: subheadline || '',
    primaryCtaText: primaryCtaText || 'Explore Solutions',
    primaryCtaLink: primaryCtaLink || '/solutions',
    badge: badge || 'AGECO Engineering',
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1600&auto=format&fit=crop&q=80',
    order: agecoStore.heroSlides.length + 1,
    active: Boolean(active),
  };
  agecoStore.heroSlides.push(newSlide);
  if (req.user) {
    agecoStore.recordAudit(req.user, 'CREATE', 'WEBSITE_HOMEPAGE', newSlide.id, `Created homepage slide '${newSlide.headline}'`);
  }
  res.status(201).json({ success: true, data: newSlide });
});

router.put('/homepage/:id', ...websiteAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = agecoStore.heroSlides.findIndex((s) => s.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Hero slide not found.' } });
    return;
  }
  const existing = agecoStore.heroSlides[index];
  const updated = { ...existing, ...req.body, id: existing.id };
  agecoStore.heroSlides[index] = updated;
  if (req.user) {
    agecoStore.recordAudit(req.user, 'UPDATE', 'WEBSITE_HOMEPAGE', id, `Updated homepage hero slide: ${updated.headline}`);
  }
  res.json({ success: true, data: updated });
});

// ----------------------------------------------------
// SOLUTIONS
// ----------------------------------------------------
router.get('/solutions', ...websiteAuth, (_req, res: Response) => {
  res.json({ success: true, data: agecoStore.solutions });
});

router.post('/solutions', ...websiteAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { title, sector, summary, deliverables = [], keySpecs = {}, featured = false, status = 'PUBLISHED' } = req.body || {};
  if (!title || !sector) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Title and sector are required.' } });
    return;
  }
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const newSol: Solution = {
    id: `sol-${Date.now().toString().slice(-4)}`,
    title,
    slug,
    sector,
    summary: summary || '',
    deliverables,
    keySpecs,
    featured: Boolean(featured),
    status: status as Solution['status'],
    updatedAt: new Date().toISOString(),
  };
  agecoStore.solutions.push(newSol);
  if (req.user) {
    agecoStore.recordAudit(req.user, 'CREATE', 'WEBSITE_SOLUTIONS', newSol.id, `Created engineering solution '${newSol.title}'`);
  }
  res.status(201).json({ success: true, data: newSol });
});

router.put('/solutions/:id', ...websiteAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = agecoStore.solutions.findIndex((s) => s.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Solution not found.' } });
    return;
  }
  const existing = agecoStore.solutions[index];
  const updated = { ...existing, ...req.body, id: existing.id, updatedAt: new Date().toISOString() };
  agecoStore.solutions[index] = updated;
  if (req.user) {
    agecoStore.recordAudit(req.user, 'UPDATE', 'WEBSITE_SOLUTIONS', id, `Updated solution '${updated.title}'`);
  }
  res.json({ success: true, data: updated });
});

// ----------------------------------------------------
// INDUSTRIES
// ----------------------------------------------------
router.get('/industries', ...websiteAuth, (_req, res: Response) => {
  res.json({ success: true, data: agecoStore.industries });
});

router.post('/industries', ...websiteAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { name, tagline, overview, complianceStandards = [], active = true } = req.body || {};
  if (!name) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Industry name is required.' } });
    return;
  }
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const newInd: Industry = {
    id: `ind-${Date.now().toString().slice(-4)}`,
    name,
    slug,
    tagline: tagline || '',
    overview: overview || '',
    complianceStandards,
    active: Boolean(active),
    caseCount: 0,
  };
  agecoStore.industries.push(newInd);
  if (req.user) {
    agecoStore.recordAudit(req.user, 'CREATE', 'WEBSITE_INDUSTRIES', newInd.id, `Added target industry '${newInd.name}'`);
  }
  res.status(201).json({ success: true, data: newInd });
});

router.put('/industries/:id', ...websiteAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = agecoStore.industries.findIndex((i) => i.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Industry not found.' } });
    return;
  }
  const existing = agecoStore.industries[index];
  const updated = { ...existing, ...req.body, id: existing.id };
  agecoStore.industries[index] = updated;
  if (req.user) {
    agecoStore.recordAudit(req.user, 'UPDATE', 'WEBSITE_INDUSTRIES', id, `Updated industry '${updated.name}'`);
  }
  res.json({ success: true, data: updated });
});

// ----------------------------------------------------
// STORIES
// ----------------------------------------------------
router.get('/stories', ...websiteAuth, (_req, res: Response) => {
  res.json({ success: true, data: agecoStore.stories });
});

router.post('/stories', ...websiteAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { title, category = 'CASE_STUDY', readTime = '5 min read', excerpt, content, author, status = 'PUBLISHED' } = req.body || {};
  if (!title) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Title is required.' } });
    return;
  }
  const newStory: Story = {
    id: `sty-${Date.now().toString().slice(-4)}`,
    title,
    category: category as Story['category'],
    readTime,
    publishDate: new Date().toISOString().split('T')[0],
    excerpt: excerpt || '',
    content: content || '',
    author: author || 'AGECO Editorial Board',
    status: status as Story['status'],
  };
  agecoStore.stories.unshift(newStory);
  if (req.user) {
    agecoStore.recordAudit(req.user, 'CREATE', 'WEBSITE_STORIES', newStory.id, `Published technical article '${newStory.title}'`);
  }
  res.status(201).json({ success: true, data: newStory });
});

router.put('/stories/:id', ...websiteAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = agecoStore.stories.findIndex((s) => s.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Story not found.' } });
    return;
  }
  const existing = agecoStore.stories[index];
  const updated = { ...existing, ...req.body, id: existing.id };
  agecoStore.stories[index] = updated;
  if (req.user) {
    agecoStore.recordAudit(req.user, 'UPDATE', 'WEBSITE_STORIES', id, `Updated story '${updated.title}'`);
  }
  res.json({ success: true, data: updated });
});

// ----------------------------------------------------
// PROJECTS
// ----------------------------------------------------
router.get('/projects', ...websiteAuth, (_req, res: Response) => {
  res.json({ success: true, data: agecoStore.projects });
});

router.post('/projects', ...websiteAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { title, client, location, capacityValue, completionYear, scopeSummary, technologiesUsed = [], status = 'COMPLETED' } = req.body || {};
  if (!title || !client) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Title and client are required.' } });
    return;
  }
  const newProj: Project = {
    id: `prj-${Date.now().toString().slice(-4)}`,
    title,
    client,
    location: location || 'Saudi Arabia',
    capacityValue: capacityValue || 'Custom MW',
    completionYear: completionYear || '2025',
    scopeSummary: scopeSummary || '',
    technologiesUsed,
    status: status as Project['status'],
  };
  agecoStore.projects.unshift(newProj);
  if (req.user) {
    agecoStore.recordAudit(req.user, 'CREATE', 'WEBSITE_PROJECTS', newProj.id, `Added turnkey project '${newProj.title}'`);
  }
  res.status(201).json({ success: true, data: newProj });
});

router.put('/projects/:id', ...websiteAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = agecoStore.projects.findIndex((p) => p.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found.' } });
    return;
  }
  const existing = agecoStore.projects[index];
  const updated = { ...existing, ...req.body, id: existing.id };
  agecoStore.projects[index] = updated;
  if (req.user) {
    agecoStore.recordAudit(req.user, 'UPDATE', 'WEBSITE_PROJECTS', id, `Updated project '${updated.title}'`);
  }
  res.json({ success: true, data: updated });
});

// ----------------------------------------------------
// WEBSITE CONTENT BLOCKS
// ----------------------------------------------------
router.get('/content-blocks', ...websiteAuth, (_req, res: Response) => {
  res.json({ success: true, data: agecoStore.contentBlocks });
});

router.put('/content-blocks/:id', ...websiteAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = agecoStore.contentBlocks.findIndex((cb) => cb.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Content block not found.' } });
    return;
  }
  const existing = agecoStore.contentBlocks[index];
  const updated: WebsiteContentBlock = {
    ...existing,
    ...req.body,
    id: existing.id,
    lastModifiedBy: req.user?.name || 'System Admin',
    updatedAt: new Date().toISOString(),
  };
  agecoStore.contentBlocks[index] = updated;
  if (req.user) {
    agecoStore.recordAudit(req.user, 'UPDATE', 'WEBSITE_CONTENT', id, `Modified site content block '${updated.title}'`);
  }
  res.json({ success: true, data: updated });
});

export default router;
