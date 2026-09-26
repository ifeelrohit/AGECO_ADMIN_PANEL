import { Router, type Request, type Response } from 'express';
import { agecoStore } from '../data/store.ts';
import { authenticateToken, authorizeRoles, type AuthenticatedRequest } from '../middleware/auth.ts';
import type { Product, Brand, Category, Subcategory, Audience, ProductType } from '../types.ts';
import { generateCategoryKeywords, generateSubcategoryKeywords, generateBrandKeywords } from './seo.ts';

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
router.get('/categories', ...catalogueAuth, (req: Request, res: Response) => {
  const { audienceId } = req.query;
  let list = agecoStore.categories;
  if (audienceId) {
    list = list.filter((c) => c.audienceId === audienceId);
  }
  res.json({ success: true, data: list });
});

router.post('/categories', ...catalogueAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { name, code, audienceId, description, iconName = 'Zap', active = true, seoKeywords, metaTitle, metaDescription, canonicalUrl } = req.body || {};
  if (!name || !code || !audienceId) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name, code, and audienceId are required.' } });
    return;
  }
  const cleanCode = String(code).toUpperCase();
  const subcats = agecoStore.subcategories.filter((s) => s.categoryId === `cat-${Date.now().toString().slice(-4)}`);
  const generatedKw = generateCategoryKeywords({ name, code: cleanCode, audienceId, description }, subcats);

  const newCategory: Category = {
    id: `cat-${Date.now().toString().slice(-4)}`,
    name,
    code: cleanCode,
    audienceId,
    description: description || '',
    iconName: iconName || 'Zap',
    order: agecoStore.categories.length + 1,
    active: Boolean(active),
    seoKeywords: Array.isArray(seoKeywords) && seoKeywords.length > 0 ? seoKeywords : generatedKw,
    metaTitle: metaTitle || `${name} Solutions & Specifications | AGECO`,
    metaDescription: metaDescription || description || `Explore certified ${name} electrical and industrial equipment from AGECO.`,
    canonicalUrl: canonicalUrl || `https://ageco.com.sa/catalogue/category/${cleanCode.toLowerCase()}`,
  };
  agecoStore.categories.push(newCategory);
  if (req.user) {
    agecoStore.recordAudit(req.user, 'CREATE', 'CATALOGUE_CATEGORIES', newCategory.id, `Created category '${newCategory.name}' with ${newCategory.seoKeywords.length} SEO keywords`);
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
router.get('/subcategories', ...catalogueAuth, (req: Request, res: Response) => {
  const { categoryId } = req.query;
  let list = agecoStore.subcategories;
  if (categoryId) {
    list = list.filter((s) => s.categoryId === categoryId);
  }
  res.json({ success: true, data: list });
});

router.post('/subcategories', ...catalogueAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { name, code, categoryId, description, active = true, seoKeywords, metaTitle, metaDescription, canonicalUrl } = req.body || {};
  if (!name || !code || !categoryId) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name, code, and categoryId are required.' } });
    return;
  }
  const cleanCode = String(code).toUpperCase();
  const parentCat = agecoStore.categories.find((c) => c.id === categoryId);
  const generatedKw = generateSubcategoryKeywords({ name, code: cleanCode }, parentCat?.name);

  const newSubcat: Subcategory = {
    id: `subcat-${Date.now().toString().slice(-4)}`,
    name,
    code: cleanCode,
    categoryId,
    description: description || '',
    active: Boolean(active),
    seoKeywords: Array.isArray(seoKeywords) && seoKeywords.length > 0 ? seoKeywords : generatedKw,
    metaTitle: metaTitle || `${name} - ${parentCat?.name || 'AGECO'} | Specifications`,
    metaDescription: metaDescription || description || `Explore ${name} models and documentation.`,
    canonicalUrl: canonicalUrl || `https://ageco.com.sa/catalogue/sub/${cleanCode.toLowerCase()}`,
  };
  agecoStore.subcategories.push(newSubcat);
  if (req.user) {
    agecoStore.recordAudit(req.user, 'CREATE', 'CATALOGUE_SUBCATEGORIES', newSubcat.id, `Created subcategory '${newSubcat.name}' with ${newSubcat.seoKeywords.length} SEO keywords`);
  }
  res.status(201).json({ success: true, data: newSubcat });
});

// ----------------------------------------------------
// BRANDS
// ----------------------------------------------------
router.get('/brands', ...catalogueAuth, (req: Request, res: Response) => {
  const { audienceId } = req.query;
  let list = agecoStore.brands;
  if (audienceId) {
    list = list.filter(
      (b) =>
        b.audiences?.includes(String(audienceId)) ||
        (audienceId === 'aud-consumer' && (b.audienceType === 'CONSUMER' || b.audienceType === 'BOTH')) ||
        (audienceId === 'aud-professional' && (b.audienceType === 'PROFESSIONAL' || b.audienceType === 'BOTH'))
    );
  }
  res.json({ success: true, data: list });
});

router.post('/brands', ...catalogueAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { name, code, website, tier = 'PARTNER', description, active = true, logo, audienceType = 'CONSUMER', audiences, seoKeywords, metaTitle, metaDescription, canonicalUrl } = req.body || {};
  if (!name || !code) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Brand name and code are required.' } });
    return;
  }
  const cleanCode = String(code).toUpperCase();
  const assignedAudiences: string[] = audiences || (
    audienceType === 'BOTH'
      ? ['aud-consumer', 'aud-professional']
      : audienceType === 'PROFESSIONAL'
      ? ['aud-professional']
      : ['aud-consumer']
  );
  const generatedKw = generateBrandKeywords({ name, tier, description, audienceType });

  const newBrand: Brand = {
    id: `brd-${Date.now().toString().slice(-4)}`,
    name,
    code: cleanCode,
    website: website || '',
    tier: tier as Brand['tier'],
    description: description || '',
    audienceType: audienceType as Brand['audienceType'],
    audiences: assignedAudiences,
    active: Boolean(active),
    logo: logo || '/assets/brands/default-brand.svg',
    productCount: 0,
    seoKeywords: Array.isArray(seoKeywords) && seoKeywords.length > 0 ? seoKeywords : generatedKw,
    metaTitle: metaTitle || `${name} Authorized Electrical Partner | AGECO`,
    metaDescription: metaDescription || description || `Official supply, warranty, and datasheets for ${name}.`,
    canonicalUrl: canonicalUrl || `https://ageco.com.sa/catalogue/brand/${cleanCode.toLowerCase()}`,
  };
  agecoStore.brands.push(newBrand);
  if (req.user) {
    agecoStore.recordAudit(req.user, 'CREATE', 'CATALOGUE_BRANDS', newBrand.id, `Created brand partner '${newBrand.name}' with ${newBrand.seoKeywords.length} SEO keywords`);
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

router.delete('/brands/:id', ...catalogueAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = agecoStore.brands.findIndex((b) => b.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Brand not found.' } });
    return;
  }
  const removed = agecoStore.brands.splice(index, 1)[0];
  if (req.user) {
    agecoStore.recordAudit(req.user, 'DELETE', 'CATALOGUE_BRANDS', id, `Deleted brand '${removed.name}'`);
  }
  res.json({ success: true, data: { message: `Brand '${removed.name}' deleted successfully.` } });
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
