import { Router, type Request, type Response } from 'express';
import { agecoStore } from '../data/store.ts';
import { authenticateToken, authorizeRoles, type AuthenticatedRequest } from '../middleware/auth.ts';
import type { Product, Brand, Category, Subcategory, Audience, ProductType, ProductAttribute } from '../types.ts';
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
router.get('/product-types', ...catalogueAuth, (req: Request, res: Response) => {
  const { categoryId, subcategoryId } = req.query;
  let list = agecoStore.productTypes;
  if (subcategoryId) {
    const specific = list.filter((pt) => pt.subcategoryId === subcategoryId);
    list = specific.length > 0 ? specific : list.filter((pt) => !pt.subcategoryId && !pt.categoryId);
  } else if (categoryId) {
    const specific = list.filter((pt) => pt.categoryId === categoryId);
    list = specific.length > 0 ? specific : list.filter((pt) => !pt.subcategoryId && !pt.categoryId);
  }
  res.json({ success: true, data: list });
});

router.post('/product-types', ...catalogueAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { name, code, description, subcategoryId, categoryId, requiresCustomEngineering = false, active = true } = req.body || {};
  if (!name || !code) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name and code are required.' } });
    return;
  }
  const newType: ProductType = {
    id: `ptype-${Date.now().toString().slice(-4)}`,
    name,
    code: String(code).toUpperCase(),
    description: description || '',
    subcategoryId,
    categoryId,
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
// PRODUCT ATTRIBUTES
// ----------------------------------------------------
router.get('/attributes', ...catalogueAuth, (req: Request, res: Response) => {
  const { categoryId, subcategoryId, productTypeId, status, search, cardOnly } = req.query;
  let list = agecoStore.productAttributes;

  if (categoryId) {
    list = list.filter((a) => a.applicableCategoryIds.includes(String(categoryId)));
  }
  if (subcategoryId) {
    list = list.filter((a) => a.applicableSubcategoryIds.includes(String(subcategoryId)));
  }
  if (productTypeId) {
    list = list.filter(
      (a) =>
        !a.applicableProductTypeIds ||
        a.applicableProductTypeIds.length === 0 ||
        a.applicableProductTypeIds.includes(String(productTypeId))
    );
  }
  if (status) {
    list = list.filter((a) => a.status === status);
  }
  if (cardOnly === 'true' || cardOnly === '1') {
    list = list.filter((a) => a.showOnCard);
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        (a.group && a.group.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, data: list, total: list.length });
});

router.get('/attributes/:id', ...catalogueAuth, (req: Request, res: Response): void => {
  const attr = agecoStore.productAttributes.find((a) => a.id === req.params.id);
  if (!attr) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Attribute not found.' } });
    return;
  }
  res.json({ success: true, data: attr });
});

router.post('/attributes', ...catalogueAuth, (req: AuthenticatedRequest, res: Response): void => {
  const {
    name,
    code,
    dataType,
    unit,
    allowedValues,
    applicableCategoryIds = ['cat-c-bath'],
    applicableSubcategoryIds = [],
    applicableProductTypeIds,
    isRequired = false,
    isFilterable = true,
    isComparable = true,
    showOnCard = false,
    cardOrder,
    status = 'ACTIVE',
    group = 'General',
    description,
    conditionalRule,
  } = req.body || {};

  if (!name || !code || !dataType) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Name, code, and dataType are required.' },
    });
    return;
  }

  const cleanCode = String(code).toUpperCase().trim();
  const newAttr: ProductAttribute = {
    id: `attr-${Date.now().toString().slice(-6)}`,
    name,
    code: cleanCode,
    dataType,
    unit: dataType === 'DIMENSION' || dataType === 'NUMBER' ? unit : undefined,
    allowedValues: (dataType === 'SELECT' || dataType === 'MULTI_SELECT') ? allowedValues || [] : undefined,
    applicableCategoryIds,
    applicableSubcategoryIds,
    applicableProductTypeIds,
    isRequired: Boolean(isRequired),
    isFilterable: Boolean(isFilterable),
    isComparable: Boolean(isComparable),
    showOnCard: Boolean(showOnCard),
    cardOrder: cardOrder ? Number(cardOrder) : undefined,
    status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    group,
    description: description || '',
    conditionalRule: conditionalRule || undefined,
  };

  agecoStore.productAttributes.push(newAttr);
  if (req.user) {
    agecoStore.recordAudit(
      req.user,
      'CREATE',
      'CATALOGUE_ATTRIBUTES',
      newAttr.id,
      `Created attribute '${newAttr.name}' (${newAttr.code}) [${newAttr.dataType}]`
    );
  }
  res.status(201).json({ success: true, data: newAttr });
});

router.put('/attributes/:id', ...catalogueAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = agecoStore.productAttributes.findIndex((a) => a.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Attribute not found.' } });
    return;
  }

  const existing = agecoStore.productAttributes[index];
  const updated: ProductAttribute = {
    ...existing,
    ...req.body,
    id: existing.id,
  };
  agecoStore.productAttributes[index] = updated;

  if (req.user) {
    agecoStore.recordAudit(
      req.user,
      'UPDATE',
      'CATALOGUE_ATTRIBUTES',
      id,
      `Updated attribute '${updated.name}' (${updated.code})`
    );
  }
  res.json({ success: true, data: updated });
});

router.patch('/attributes/:id/status', ...catalogueAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const attr = agecoStore.productAttributes.find((a) => a.id === id);
  if (!attr) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Attribute not found.' } });
    return;
  }

  const { status } = req.body || {};
  attr.status = status || (attr.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');

  if (req.user) {
    agecoStore.recordAudit(
      req.user,
      'UPDATE',
      'CATALOGUE_ATTRIBUTES',
      id,
      `Toggled attribute status to ${attr.status}`
    );
  }
  res.json({ success: true, data: attr });
});

router.delete('/attributes/:id', ...catalogueAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = agecoStore.productAttributes.findIndex((a) => a.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Attribute not found.' } });
    return;
  }

  const removed = agecoStore.productAttributes.splice(index, 1)[0];
  if (req.user) {
    agecoStore.recordAudit(
      req.user,
      'DELETE',
      'CATALOGUE_ATTRIBUTES',
      id,
      `Deleted attribute '${removed.name}' (${removed.code})`
    );
  }
  res.json({ success: true, message: `Attribute ${removed.code} removed.` });
});

// ----------------------------------------------------
// PRODUCTS (CRUD)
// ----------------------------------------------------
router.get('/products', ...catalogueAuth, (req, res: Response) => {
  const { categoryId, subcategoryId, productTypeId, brandId, status, search } = req.query;
  let items = [...agecoStore.products];

  if (categoryId) {
    items = items.filter((p) => p.categoryId === categoryId);
  }
  if (subcategoryId) {
    items = items.filter((p) => p.subcategoryId === subcategoryId);
  }
  if (productTypeId) {
    items = items.filter((p) => p.productTypeId === productTypeId);
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
        (p.shortDescription && p.shortDescription.toLowerCase().includes(q))
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
    name,
    brandId,
    categoryId,
    subcategoryId,
    audienceId,
    productTypeId,
    shortDescription,
    description,
    technicalSummary,
    keyFeatures = [],
    attributes = {},
    specifications = {},
    standardCertifications,
    voltageRating,
    currentRating,
    ipRating,
    featured = false,
    status = 'PUBLISHED',
    mainImage,
    additionalImages = [],
    warranty,
    documents = [],
  } = req.body || {};

  const productTitle = title || name;
  if (!productTitle || !categoryId) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Product Name and Category are required.' },
    });
    return;
  }

  const finalSku = sku && String(sku).trim()
    ? String(sku).trim().toUpperCase()
    : `AG-${Date.now().toString().slice(-6)}`;

  const slug = productTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  let finalAudienceId = audienceId;
  if (!finalAudienceId) {
    const parentCategory = agecoStore.categories.find((c) => c.id === categoryId);
    finalAudienceId = parentCategory?.audienceId || 'aud-consumer';
  }

  // Populate specifications map for backward compatibility from attributes
  const finalSpecs: Record<string, string> = { ...specifications };
  if (attributes && typeof attributes === 'object') {
    Object.entries(attributes).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        const attrDef = agecoStore.productAttributes.find((a) => a.code === key || a.id === key);
        const label = attrDef?.name || key;
        const formattedVal = Array.isArray(val)
          ? val.join(', ')
          : attrDef?.unit
          ? `${val} ${attrDef.unit}`
          : String(val);
        finalSpecs[label] = formattedVal;
      }
    });
  }

  const newProduct: Product = {
    id: `prd-${Date.now().toString().slice(-6)}`,
    sku: finalSku,
    title: productTitle,
    name: productTitle,
    slug,
    brandId: brandId && String(brandId).trim() ? String(brandId) : undefined,
    categoryId,
    subcategoryId: subcategoryId || undefined,
    audienceId: finalAudienceId,
    productTypeId: productTypeId || undefined,
    shortDescription: shortDescription || '',
    description: description || technicalSummary || '',
    technicalSummary: technicalSummary || description || '',
    keyFeatures: Array.isArray(keyFeatures) ? keyFeatures : [],
    attributes: attributes || {},
    specifications: finalSpecs,
    standardCertifications: standardCertifications || ['ISO 9001', 'SASO Quality Mark'],
    voltageRating,
    currentRating,
    ipRating,
    featured: Boolean(featured),
    status: status as Product['status'],
    mainImage:
      mainImage ||
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
    additionalImages: Array.isArray(additionalImages) ? additionalImages : [],
    warranty: warranty || undefined,
    documents: Array.isArray(documents) ? documents : [],
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  agecoStore.products.unshift(newProduct);

  if (brandId) {
    const brand = agecoStore.brands.find((b) => b.id === brandId);
    if (brand) {
      brand.productCount = (brand.productCount || 0) + 1;
    }
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
  const body = req.body || {};
  const productTitle = body.title || body.name || existing.title;

  const finalSpecs: Record<string, string> = { ...existing.specifications, ...(body.specifications || {}) };
  if (body.attributes && typeof body.attributes === 'object') {
    Object.entries(body.attributes).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        const attrDef = agecoStore.productAttributes.find((a) => a.code === key || a.id === key);
        const label = attrDef?.name || key;
        const formattedVal = Array.isArray(val)
          ? val.join(', ')
          : attrDef?.unit
          ? `${val} ${attrDef.unit}`
          : String(val);
        finalSpecs[label] = formattedVal;
      }
    });
  }

  const updated: Product = {
    ...existing,
    ...body,
    id: existing.id,
    title: productTitle,
    name: productTitle,
    brandId: body.brandId !== undefined ? (body.brandId ? String(body.brandId) : undefined) : existing.brandId,
    specifications: finalSpecs,
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
