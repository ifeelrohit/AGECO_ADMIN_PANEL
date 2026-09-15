import { Router, Response } from 'express';
import { agecoStore } from '../data/store.ts';
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.ts';
import { Product, Brand, Category, Subcategory, Audience, ProductType } from '../types.ts';

const router = Router();

// Middleware: all catalogue endpoints require authentication and authorized catalogue roles
const catalogueAuth = [
  authenticateToken,
  authorizeRoles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'CONTENT_MANAGER'),
];

// ----------------------------------------------------
// AUDIENCES
// ----------------------------------------------------
router.get('/audiences', ...catalogueAuth, (_req, res: Response) => {
  res.json({ success: true, data: agecoStore.audiences });
});

router.post('/audiences', ...catalogueAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { name, code, description, sector, active = true } = req.body || {};
  if (!name || !code) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name and code are required.' } });
    return;
  }
  const newAudience: Audience = {
    id: `aud-${Date.now().toString().slice(-4)}`,
    name,
    code: String(code).toUpperCase(),
    description: description || '',
    sector: sector || 'General',
    active: Boolean(active),
  };
  agecoStore.audiences.push(newAudience);
  if (req.user) {
    agecoStore.recordAudit(
      req.user,
      'CREATE',
      'CATALOGUE_AUDIENCES',
      newAudience.id,
      `Created audience segment '${newAudience.name}' (${newAudience.code})`
    );
  }
  res.status(201).json({ success: true, data: newAudience });
});

// ----------------------------------------------------
// CATEGORIES
// ----------------------------------------------------
router.get('/categories', ...catalogueAuth, (_req, res: Response) => {
  res.json({ success: true, data: agecoStore.categories });
});

router.post('/categories', ...catalogueAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { name, code, audienceId, description, iconName = 'Zap', active = true } = req.body || {};
  if (!name || !code || !audienceId) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name, code, and audienceId are required.' } });
    return;
  }
  const newCategory: Category = {
    id: `cat-${Date.now().toString().slice(-4)}`,
    name,
    code: String(code).toUpperCase(),
    audienceId,
    description: description || '',
    iconName: iconName || 'Zap',
    order: agecoStore.categories.length + 1,
    active: Boolean(active),
  };
  agecoStore.categories.push(newCategory);
  if (req.user) {
    agecoStore.recordAudit(req.user, 'CREATE', 'CATALOGUE_CATEGORIES', newCategory.id, `Created category '${newCategory.name}'`);
  }
  res.status(201).json({ success: true, data: newCategory });
});

router.put('/categories/:id', ...catalogueAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = agecoStore.categories.findIndex((c) => c.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found.' } });
    return;
  }
  const existing = agecoStore.categories[index];
  const updated: Category = {
    ...existing,
    ...req.body,
    id: existing.id,
  };
  agecoStore.categories[index] = updated;
  if (req.user) {
    agecoStore.recordAudit(req.user, 'UPDATE', 'CATALOGUE_CATEGORIES', id, `Updated category '${updated.name}'`);
  }
  res.json({ success: true, data: updated });
});

// ----------------------------------------------------
// SUBCATEGORIES
// ----------------------------------------------------
router.get('/subcategories', ...catalogueAuth, (_req, res: Response) => {
  res.json({ success: true, data: agecoStore.subcategories });
});

router.post('/subcategories', ...catalogueAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { name, code, categoryId, description, active = true } = req.body || {};
  if (!name || !code || !categoryId) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name, code, and categoryId are required.' } });
    return;
  }
  const newSubcat: Subcategory = {
    id: `subcat-${Date.now().toString().slice(-4)}`,
    name,
    code: String(code).toUpperCase(),
    categoryId,
    description: description || '',
    active: Boolean(active),
  };
  agecoStore.subcategories.push(newSubcat);
  if (req.user) {
    agecoStore.recordAudit(req.user, 'CREATE', 'CATALOGUE_SUBCATEGORIES', newSubcat.id, `Created subcategory '${newSubcat.name}'`);
  }
  res.status(201).json({ success: true, data: newSubcat });
});

// ----------------------------------------------------
// BRANDS
// ----------------------------------------------------
router.get('/brands', ...catalogueAuth, (_req, res: Response) => {
  res.json({ success: true, data: agecoStore.brands });
});

router.post('/brands', ...catalogueAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { name, code, website, tier = 'PARTNER', description, active = true, logo } = req.body || {};
  if (!name || !code) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Brand name and code are required.' } });
    return;
  }
  const newBrand: Brand = {
    id: `brd-${Date.now().toString().slice(-4)}`,
    name,
    code: String(code).toUpperCase(),
    website: website || '',
    tier: tier as Brand['tier'],
    description: description || '',
    active: Boolean(active),
    logo: logo || '/assets/brands/default-brand.svg',
    productCount: 0,
  };
  agecoStore.brands.push(newBrand);
  if (req.user) {
    agecoStore.recordAudit(req.user, 'CREATE', 'CATALOGUE_BRANDS', newBrand.id, `Created brand partner '${newBrand.name}'`);
  }
  res.status(201).json({ success: true, data: newBrand });
});

router.put('/brands/:id', ...catalogueAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = agecoStore.brands.findIndex((b) => b.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Brand not found.' } });
    return;
  }
  const existing = agecoStore.brands[index];
  const updated: Brand = { ...existing, ...req.body, id: existing.id };
  agecoStore.brands[index] = updated;
  if (req.user) {
    agecoStore.recordAudit(req.user, 'UPDATE', 'CATALOGUE_BRANDS', id, `Updated brand '${updated.name}'`);
  }
  res.json({ success: true, data: updated });
});

// ----------------------------------------------------
// PRODUCT TYPES
// ----------------------------------------------------
router.get('/product-types', ...catalogueAuth, (_req, res: Response) => {
  res.json({ success: true, data: agecoStore.productTypes });
});

router.post('/product-types', ...catalogueAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { name, code, description, requiresCustomEngineering = false, active = true } = req.body || {};
  if (!name || !code) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name and code are required.' } });
    return;
  }
  const newType: ProductType = {
    id: `ptype-${Date.now().toString().slice(-4)}`,
    name,
    code: String(code).toUpperCase(),
    description: description || '',
    requiresCustomEngineering: Boolean(requiresCustomEngineering),
    active: Boolean(active),
  };
  agecoStore.productTypes.push(newType);
  if (req.user) {
    agecoStore.recordAudit(req.user, 'CREATE', 'CATALOGUE_TYPES', newType.id, `Created product type '${newType.name}'`);
  }
  res.status(201).json({ success: true, data: newType });
});

// ----------------------------------------------------
// PRODUCTS (CRUD)
// ----------------------------------------------------
router.get('/products', ...catalogueAuth, (req, res: Response) => {
  const { categoryId, brandId, status, search } = req.query;
  let items = [...agecoStore.products];

  if (categoryId) {
    items = items.filter((p) => p.categoryId === categoryId);
  }
  if (brandId) {
    items = items.filter((p) => p.brandId === brandId);
  }
  if (status) {
    items = items.filter((p) => p.status === status);
  }
  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    data: items,
    total: items.length,
  });
});

router.get('/products/:id', ...catalogueAuth, (req, res: Response): void => {
  const product = agecoStore.products.find((p) => p.id === req.params.id);
  if (!product) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found.' } });
    return;
  }
  res.json({ success: true, data: product });
});

router.post('/products', ...catalogueAuth, (req: AuthenticatedRequest, res: Response): void => {
  const {
    sku,
    title,
    brandId,
    categoryId,
    subcategoryId,
    audienceId,
    productTypeId,
    shortDescription,
    technicalSummary,
    specifications,
    standardCertifications,
    voltageRating,
    currentRating,
    ipRating,
    featured = false,
    status = 'PUBLISHED',
    mainImage,
    documents = [],
  } = req.body || {};

  if (!sku || !title || !categoryId || !brandId) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'SKU, Title, Category, and Brand are required fields.' },
    });
    return;
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const newProduct: Product = {
    id: `prd-${Date.now().toString().slice(-4)}`,
    sku: String(sku).toUpperCase(),
    title,
    slug,
    brandId,
    categoryId,
    subcategoryId: subcategoryId || '',
    audienceId: audienceId || '',
    productTypeId: productTypeId || '',
    shortDescription: shortDescription || '',
    technicalSummary: technicalSummary || '',
    specifications: specifications || {},
    standardCertifications: standardCertifications || ['IEC Standards'],
    voltageRating,
    currentRating,
    ipRating,
    featured: Boolean(featured),
    status: status as Product['status'],
    mainImage: mainImage || 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80',
    documents,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  agecoStore.products.unshift(newProduct);

  // Update brand product count
  const brand = agecoStore.brands.find((b) => b.id === brandId);
  if (brand) {
    brand.productCount = (brand.productCount || 0) + 1;
  }

  if (req.user) {
    agecoStore.recordAudit(
      req.user,
      'CREATE',
      'CATALOGUE_PRODUCTS',
      newProduct.id,
      `Created product SKU: ${newProduct.sku} (${newProduct.title})`
    );
  }

  res.status(201).json({ success: true, data: newProduct });
});

router.put('/products/:id', ...catalogueAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = agecoStore.products.findIndex((p) => p.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found.' } });
    return;
  }

  const existing = agecoStore.products[index];
  const updated: Product = {
    ...existing,
    ...req.body,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };

  agecoStore.products[index] = updated;

  if (req.user) {
    agecoStore.recordAudit(
      req.user,
      'UPDATE',
      'CATALOGUE_PRODUCTS',
      id,
      `Updated product specs/status for SKU ${updated.sku}`,
      `status: ${updated.status}`
    );
  }

  res.json({ success: true, data: updated });
});

router.delete('/products/:id', ...catalogueAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = agecoStore.products.findIndex((p) => p.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found.' } });
    return;
  }

  const removed = agecoStore.products.splice(index, 1)[0];

  if (req.user) {
    agecoStore.recordAudit(
      req.user,
      'DELETE',
      'CATALOGUE_PRODUCTS',
      id,
      `Deleted product SKU ${removed.sku} (${removed.title})`
    );
  }

  res.json({ success: true, message: `Product ${removed.sku} removed.` });
});

export default router;
