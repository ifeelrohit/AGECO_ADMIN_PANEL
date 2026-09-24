import { Router, Request, Response } from 'express';
import { agecoStore } from '../data/store.ts';
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/auth.ts';
import { SeoConfig } from '../types.ts';

const router = Router();

const seoAuth = [
  authenticateToken,
  authorizeRoles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'CONTENT_MANAGER'),
];

// Helper: Generate recommended keywords for a Category
export function generateCategoryKeywords(
  category: { name: string; code?: string; audienceId?: string; description?: string },
  subcategories: { name: string }[] = []
): string[] {
  const base = category.name.trim();
  const audience = category.audienceId === 'aud-consumer' ? 'Residential & Consumer' : 'Industrial & Commercial';
  const list: string[] = [];

  list.push(base);
  list.push(`${base} Saudi Arabia`);
  list.push(`${base} Suppliers KSA`);
  list.push(`${base} Specifications & Catalog`);
  if (category.code) list.push(`${category.code} ${base}`);
  if (audience.includes('Industrial')) {
    list.push(`Industrial ${base} Engineering`);
    list.push(`Type-Tested ${base} Middle East`);
  } else {
    list.push(`Energy Efficient ${base}`);
    list.push(`Smart ${base} for Modern Living`);
  }

  // Add top subcategory names
  subcategories.slice(0, 3).forEach((s) => {
    list.push(`${s.name} - ${base}`);
  });

  return Array.from(new Set(list));
}

// Helper: Generate recommended keywords for a Subcategory
export function generateSubcategoryKeywords(
  subcategory: { name: string; code?: string },
  categoryName?: string
): string[] {
  const base = subcategory.name.trim();
  const list: string[] = [];

  list.push(base);
  list.push(`${base} Saudi Arabia`);
  list.push(`${base} KSA Price & Specs`);
  list.push(`Commercial & Domestic ${base}`);
  if (categoryName) {
    list.push(`${base} for ${categoryName}`);
    list.push(`${categoryName} - ${base} Catalogue`);
  }
  list.push(`High Quality ${base} Suppliers`);

  return Array.from(new Set(list));
}

// Helper: Generate recommended keywords for a Brand
export function generateBrandKeywords(
  brand: { name: string; tier?: string; description?: string; audienceType?: string }
): string[] {
  const base = brand.name.trim();
  const list: string[] = [];

  list.push(base);
  list.push(`${base} Saudi Arabia`);
  list.push(`${base} Authorized Distributor KSA`);
  list.push(`${base} Electrical Products & Catalogue`);
  list.push(`${base} Genuine Datasheets & Specs`);
  list.push(`Buy ${base} Equipment Middle East`);
  list.push(`${base} SASO & IEC Certified`);

  return Array.from(new Set(list));
}

// GET all SEO Configurations, Categories, Subcategories, Brands & Metrics
router.get('/', ...seoAuth, (_req: Request, res: Response) => {
  const totalCategoryKw = agecoStore.categories.reduce((acc, c) => acc + (c.seoKeywords?.length || 0), 0);
  const totalSubcatKw = agecoStore.subcategories.reduce((acc, s) => acc + (s.seoKeywords?.length || 0), 0);
  const totalBrandKw = agecoStore.brands.reduce((acc, b) => acc + (b.seoKeywords?.length || 0), 0);
  const totalPageKw = agecoStore.seoConfigs.reduce((acc, p) => acc + (p.keywords?.length || 0), 0);

  const categoriesWithKw = agecoStore.categories.filter((c) => c.seoKeywords && c.seoKeywords.length > 0).length;
  const subcatsWithKw = agecoStore.subcategories.filter((s) => s.seoKeywords && s.seoKeywords.length > 0).length;
  const brandsWithKw = agecoStore.brands.filter((b) => b.seoKeywords && b.seoKeywords.length > 0).length;

  const enrichedCategories = agecoStore.categories.map((c) => {
    const subcats = agecoStore.subcategories.filter((s) => s.categoryId === c.id);
    const audience = agecoStore.audiences.find((a) => a.id === c.audienceId);
    return {
      ...c,
      audienceName: audience?.name || 'General',
      subcategoriesCount: subcats.length,
      subcategoriesPreview: subcats.slice(0, 4).map((s) => s.name),
      seoKeywords: c.seoKeywords || [],
      metaTitle: c.metaTitle || `${c.name} Solutions & Specifications | AGECO`,
      metaDescription: c.metaDescription || c.description || `Browse type-tested and certified ${c.name} from AGECO.`,
      canonicalUrl: c.canonicalUrl || `https://ageco.com.sa/catalogue/category/${c.code.toLowerCase()}`,
    };
  });

  const enrichedSubcategories = agecoStore.subcategories.map((s) => {
    const cat = agecoStore.categories.find((c) => c.id === s.categoryId);
    return {
      ...s,
      categoryName: cat?.name || 'Unknown Category',
      categoryCode: cat?.code || '',
      seoKeywords: s.seoKeywords || [],
      metaTitle: s.metaTitle || `${s.name} - ${cat?.name || 'AGECO'} | Specifications`,
      metaDescription: s.metaDescription || s.description || `Explore ${s.name} under ${cat?.name || 'AGECO Catalogue'}.`,
      canonicalUrl: s.canonicalUrl || `https://ageco.com.sa/catalogue/sub/${s.code.toLowerCase()}`,
    };
  });

  const enrichedBrands = agecoStore.brands.map((b) => {
    return {
      ...b,
      seoKeywords: b.seoKeywords || [],
      metaTitle: b.metaTitle || `${b.name} Authorized Electrical Partner | AGECO`,
      metaDescription: b.metaDescription || b.description || `Official partner datasheets and certified equipment for ${b.name}.`,
      canonicalUrl: b.canonicalUrl || `https://ageco.com.sa/catalogue/brand/${b.code.toLowerCase()}`,
    };
  });

  res.json({
    success: true,
    data: {
      pageConfigs: agecoStore.seoConfigs,
      categories: enrichedCategories,
      subcategories: enrichedSubcategories,
      brands: enrichedBrands,
      audiences: agecoStore.audiences,
      stats: {
        totalPages: agecoStore.seoConfigs.length,
        totalCategories: agecoStore.categories.length,
        categoriesWithKeywords: categoriesWithKw,
        totalSubcategories: agecoStore.subcategories.length,
        subcategoriesWithKeywords: subcatsWithKw,
        totalBrands: agecoStore.brands.length,
        brandsWithKeywords: brandsWithKw,
        totalTrackedKeywords: totalCategoryKw + totalSubcatKw + totalBrandKw + totalPageKw,
        categoryKeywordsCount: totalCategoryKw,
        subcategoryKeywordsCount: totalSubcatKw,
        brandKeywordsCount: totalBrandKw,
        pageKeywordsCount: totalPageKw,
      },
      sitemapStatus: {
        generatedAt: new Date().toISOString(),
        indexedUrlsCount: 42 + agecoStore.categories.length + agecoStore.subcategories.length + agecoStore.brands.length,
        robotsTxtConfigured: true,
        googleSearchConsoleConnected: true,
      },
    },
  });
});

// GET Keyword Matrix (Search across all Category, Subcategory, Brand, and Page keywords)
router.get('/matrix', ...seoAuth, (_req: Request, res: Response) => {
  const matrix: Array<{
    keyword: string;
    sourceType: 'CATEGORY' | 'SUBCATEGORY' | 'BRAND' | 'PAGE';
    sourceId: string;
    sourceName: string;
    pathOrUrl?: string;
  }> = [];

  agecoStore.categories.forEach((cat) => {
    (cat.seoKeywords || []).forEach((kw) => {
      matrix.push({
        keyword: kw,
        sourceType: 'CATEGORY',
        sourceId: cat.id,
        sourceName: cat.name,
        pathOrUrl: `/catalogue/category/${cat.code.toLowerCase()}`,
      });
    });
  });

  agecoStore.subcategories.forEach((sub) => {
    (sub.seoKeywords || []).forEach((kw) => {
      matrix.push({
        keyword: kw,
        sourceType: 'SUBCATEGORY',
        sourceId: sub.id,
        sourceName: sub.name,
        pathOrUrl: `/catalogue/sub/${sub.code.toLowerCase()}`,
      });
    });
  });

  agecoStore.brands.forEach((brand) => {
    (brand.seoKeywords || []).forEach((kw) => {
      matrix.push({
        keyword: kw,
        sourceType: 'BRAND',
        sourceId: brand.id,
        sourceName: brand.name,
        pathOrUrl: `/catalogue/brand/${brand.code.toLowerCase()}`,
      });
    });
  });

  agecoStore.seoConfigs.forEach((page) => {
    (page.keywords || []).forEach((kw) => {
      matrix.push({
        keyword: kw,
        sourceType: 'PAGE',
        sourceId: page.id,
        sourceName: page.metaTitle || page.pagePath,
        pathOrUrl: page.pagePath,
      });
    });
  });

  res.json({ success: true, data: matrix });
});

// UPDATE Category SEO & Keywords
router.put('/category/:id', ...seoAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = agecoStore.categories.findIndex((c) => c.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found.' } });
    return;
  }

  const existing = agecoStore.categories[index];
  const { seoKeywords, metaTitle, metaDescription, canonicalUrl } = req.body || {};

  const cleanKeywords = Array.isArray(seoKeywords)
    ? Array.from(new Set(seoKeywords.map((k: string) => String(k).trim()).filter(Boolean)))
    : existing.seoKeywords || [];

  const updated = {
    ...existing,
    seoKeywords: cleanKeywords,
    metaTitle: metaTitle !== undefined ? metaTitle : existing.metaTitle,
    metaDescription: metaDescription !== undefined ? metaDescription : existing.metaDescription,
    canonicalUrl: canonicalUrl !== undefined ? canonicalUrl : existing.canonicalUrl,
  };

  agecoStore.categories[index] = updated;

  if (req.user) {
    agecoStore.recordAudit(
      req.user,
      'CONFIG_UPDATE',
      'SEO_CATEGORY',
      id,
      `Updated SEO keywords (${cleanKeywords.length} tags) and meta tags for Category '${existing.name}'`
    );
  }

  res.json({ success: true, data: updated });
});

// UPDATE Subcategory SEO & Keywords
router.put('/subcategory/:id', ...seoAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = agecoStore.subcategories.findIndex((s) => s.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Subcategory not found.' } });
    return;
  }

  const existing = agecoStore.subcategories[index];
  const { seoKeywords, metaTitle, metaDescription, canonicalUrl } = req.body || {};

  const cleanKeywords = Array.isArray(seoKeywords)
    ? Array.from(new Set(seoKeywords.map((k: string) => String(k).trim()).filter(Boolean)))
    : existing.seoKeywords || [];

  const updated = {
    ...existing,
    seoKeywords: cleanKeywords,
    metaTitle: metaTitle !== undefined ? metaTitle : existing.metaTitle,
    metaDescription: metaDescription !== undefined ? metaDescription : existing.metaDescription,
    canonicalUrl: canonicalUrl !== undefined ? canonicalUrl : existing.canonicalUrl,
  };

  agecoStore.subcategories[index] = updated;

  if (req.user) {
    agecoStore.recordAudit(
      req.user,
      'CONFIG_UPDATE',
      'SEO_SUBCATEGORY',
      id,
      `Updated SEO keywords (${cleanKeywords.length} tags) and meta tags for Subcategory '${existing.name}'`
    );
  }

  res.json({ success: true, data: updated });
});

// UPDATE Brand SEO & Keywords
router.put('/brand/:id', ...seoAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = agecoStore.brands.findIndex((b) => b.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Brand not found.' } });
    return;
  }

  const existing = agecoStore.brands[index];
  const { seoKeywords, metaTitle, metaDescription, canonicalUrl } = req.body || {};

  const cleanKeywords = Array.isArray(seoKeywords)
    ? Array.from(new Set(seoKeywords.map((k: string) => String(k).trim()).filter(Boolean)))
    : existing.seoKeywords || [];

  const updated = {
    ...existing,
    seoKeywords: cleanKeywords,
    metaTitle: metaTitle !== undefined ? metaTitle : existing.metaTitle,
    metaDescription: metaDescription !== undefined ? metaDescription : existing.metaDescription,
    canonicalUrl: canonicalUrl !== undefined ? canonicalUrl : existing.canonicalUrl,
  };

  agecoStore.brands[index] = updated;

  if (req.user) {
    agecoStore.recordAudit(
      req.user,
      'CONFIG_UPDATE',
      'SEO_BRAND',
      id,
      `Updated SEO keywords (${cleanKeywords.length} tags) and meta tags for Brand '${existing.name}'`
    );
  }

  res.json({ success: true, data: updated });
});

// POST: Generate keywords for a specific item
router.post('/generate-keywords', ...seoAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { type, id } = req.body || {};

  if (type === 'CATEGORY') {
    const cat = agecoStore.categories.find((c) => c.id === id);
    if (!cat) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found.' } });
      return;
    }
    const subcats = agecoStore.subcategories.filter((s) => s.categoryId === cat.id);
    const keywords = generateCategoryKeywords(cat, subcats);
    res.json({ success: true, data: { keywords, targetName: cat.name } });
    return;
  }

  if (type === 'SUBCATEGORY') {
    const sub = agecoStore.subcategories.find((s) => s.id === id);
    if (!sub) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Subcategory not found.' } });
      return;
    }
    const parentCat = agecoStore.categories.find((c) => c.id === sub.categoryId);
    const keywords = generateSubcategoryKeywords(sub, parentCat?.name);
    res.json({ success: true, data: { keywords, targetName: sub.name } });
    return;
  }

  if (type === 'BRAND') {
    const brand = agecoStore.brands.find((b) => b.id === id);
    if (!brand) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Brand not found.' } });
      return;
    }
    const keywords = generateBrandKeywords(brand);
    res.json({ success: true, data: { keywords, targetName: brand.name } });
    return;
  }

  res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Invalid entity type specified.' } });
});

// POST: Bulk auto-generate missing SEO keywords for Categories, Subcategories, or Brands
router.post('/bulk-generate', ...seoAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { target = 'ALL' } = req.body || {};
  let updatedCategories = 0;
  let updatedSubcategories = 0;
  let updatedBrands = 0;

  if (target === 'CATEGORIES' || target === 'ALL') {
    agecoStore.categories.forEach((cat) => {
      if (!cat.seoKeywords || cat.seoKeywords.length === 0) {
        const subcats = agecoStore.subcategories.filter((s) => s.categoryId === cat.id);
        cat.seoKeywords = generateCategoryKeywords(cat, subcats);
        if (!cat.metaTitle) cat.metaTitle = `${cat.name} Solutions & Products | AGECO`;
        if (!cat.metaDescription) cat.metaDescription = `Official ${cat.name} specifications, subcategories, and type-tested equipment.`;
        if (!cat.canonicalUrl) cat.canonicalUrl = `https://ageco.com.sa/catalogue/category/${cat.code.toLowerCase()}`;
        updatedCategories++;
      }
    });
  }

  if (target === 'SUBCATEGORIES' || target === 'ALL') {
    agecoStore.subcategories.forEach((sub) => {
      if (!sub.seoKeywords || sub.seoKeywords.length === 0) {
        const parentCat = agecoStore.categories.find((c) => c.id === sub.categoryId);
        sub.seoKeywords = generateSubcategoryKeywords(sub, parentCat?.name);
        if (!sub.metaTitle) sub.metaTitle = `${sub.name} - ${parentCat?.name || 'AGECO'} | Datasheets`;
        if (!sub.metaDescription) sub.metaDescription = `Browse technical specifications and models for ${sub.name}.`;
        if (!sub.canonicalUrl) sub.canonicalUrl = `https://ageco.com.sa/catalogue/sub/${sub.code.toLowerCase()}`;
        updatedSubcategories++;
      }
    });
  }

  if (target === 'BRANDS' || target === 'ALL') {
    agecoStore.brands.forEach((brand) => {
      if (!brand.seoKeywords || brand.seoKeywords.length === 0) {
        brand.seoKeywords = generateBrandKeywords(brand);
        if (!brand.metaTitle) brand.metaTitle = `${brand.name} Authorized Electrical Partner | AGECO`;
        if (!brand.metaDescription) brand.metaDescription = `Authorized supply, warranty, and documentation for ${brand.name} in Saudi Arabia.`;
        if (!brand.canonicalUrl) brand.canonicalUrl = `https://ageco.com.sa/catalogue/brand/${brand.code.toLowerCase()}`;
        updatedBrands++;
      }
    });
  }

  if (req.user) {
    agecoStore.recordAudit(
      req.user,
      'CONFIG_UPDATE',
      'SEO_BULK_GENERATE',
      'seo-bulk',
      `Auto-generated SEO keywords for ${updatedCategories} categories, ${updatedSubcategories} subcategories, and ${updatedBrands} brands.`
    );
  }

  res.json({
    success: true,
    data: {
      updatedCategories,
      updatedSubcategories,
      updatedBrands,
      message: `Successfully populated SEO keywords: ${updatedCategories} categories, ${updatedSubcategories} subcategories, and ${updatedBrands} brands updated.`,
    },
  });
});

// CREATE Page SEO Config
router.post('/', ...seoAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { pagePath, metaTitle, metaDescription, keywords, canonicalUrl, ogTitle, ogDescription, sitemapPriority, indexingDirective } = req.body || {};

  if (!pagePath || !metaTitle) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Page path and meta title are required.' } });
    return;
  }

  const newConfig: SeoConfig = {
    id: `seo-${Date.now().toString().slice(-4)}`,
    pagePath,
    metaTitle,
    metaDescription: metaDescription || '',
    keywords: Array.isArray(keywords) ? keywords : [],
    canonicalUrl: canonicalUrl || `https://ageco.com.sa${pagePath}`,
    ogTitle: ogTitle || metaTitle,
    ogDescription: ogDescription || metaDescription || '',
    sitemapPriority: typeof sitemapPriority === 'number' ? sitemapPriority : 0.8,
    indexingDirective: indexingDirective || 'INDEX_FOLLOW',
    updatedAt: new Date().toISOString(),
  };

  agecoStore.seoConfigs.push(newConfig);

  if (req.user) {
    agecoStore.recordAudit(req.user, 'CREATE', 'SEO', newConfig.id, `Created SEO config for route: ${newConfig.pagePath}`);
  }

  res.status(201).json({ success: true, data: newConfig });
});

// UPDATE Page SEO Config (supporting keywords array)
router.put('/:id', ...seoAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = agecoStore.seoConfigs.findIndex((s) => s.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'SEO configuration not found.' } });
    return;
  }

  const existing = agecoStore.seoConfigs[index];
  const { keywords, ...rest } = req.body;

  const updated: SeoConfig = {
    ...existing,
    ...rest,
    keywords: Array.isArray(keywords)
      ? Array.from(new Set(keywords.map((k: string) => String(k).trim()).filter(Boolean)))
      : existing.keywords,
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
      `Updated SEO meta directives and keywords (${updated.keywords.length} tags) for path: ${updated.pagePath}`
    );
  }

  res.json({ success: true, data: updated });
});

// DELETE Page SEO Config
router.delete('/:id', ...seoAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const index = agecoStore.seoConfigs.findIndex((s) => s.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'SEO configuration not found.' } });
    return;
  }

  const removed = agecoStore.seoConfigs.splice(index, 1)[0];

  if (req.user) {
    agecoStore.recordAudit(req.user, 'DELETE', 'SEO', id, `Deleted SEO config for path: ${removed.pagePath}`);
  }

  res.json({ success: true, data: { message: `SEO configuration for '${removed.pagePath}' deleted.` } });
});

export default router;
