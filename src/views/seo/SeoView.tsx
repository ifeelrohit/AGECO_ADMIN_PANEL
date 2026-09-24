import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  X,
  Sparkles,
  Download,
  Globe,
  Layers,
  CheckCircle2,
  FolderTree,
  Building2,
  FileText,
  RefreshCw,
  Tag,
  Check,
} from 'lucide-react';
import { api } from '../../config/api.ts';
import { SeoConfig, Category, Subcategory, Brand, Audience } from '../../types/index.ts';

type ActiveTab = 'CATEGORIES' | 'SUBCATEGORIES' | 'BRANDS' | 'PAGES' | 'MATRIX';

interface EnrichedCategory extends Category {
  audienceName?: string;
  subcategoriesCount?: number;
  subcategoriesPreview?: string[];
}

interface EnrichedSubcategory extends Subcategory {
  categoryName?: string;
  categoryCode?: string;
}

interface SeoResponseData {
  pageConfigs: SeoConfig[];
  categories: EnrichedCategory[];
  subcategories: EnrichedSubcategory[];
  brands: Brand[];
  audiences: Audience[];
  stats: {
    totalPages: number;
    totalCategories: number;
    categoriesWithKeywords: number;
    totalSubcategories: number;
    subcategoriesWithKeywords: number;
    totalBrands: number;
    brandsWithKeywords: number;
    totalTrackedKeywords: number;
    categoryKeywordsCount: number;
    subcategoryKeywordsCount: number;
    brandKeywordsCount: number;
    pageKeywordsCount: number;
  };
  sitemapStatus: {
    generatedAt: string;
    indexedUrlsCount: number;
    robotsTxtConfigured: boolean;
    googleSearchConsoleConnected: boolean;
  };
}

export const SeoView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('CATEGORIES');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Data states
  const [pageConfigs, setPageConfigs] = useState<SeoConfig[]>([]);
  const [categories, setCategories] = useState<EnrichedCategory[]>([]);
  const [subcategories, setSubcategories] = useState<EnrichedSubcategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [stats, setStats] = useState<SeoResponseData['stats'] | null>(null);
  const [sitemapStatus, setSitemapStatus] = useState<SeoResponseData['sitemapStatus'] | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [brandTierFilter, setBrandTierFilter] = useState('ALL');

  // Edit Modals
  const [editingCategory, setEditingCategory] = useState<EnrichedCategory | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<EnrichedSubcategory | null>(null);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [editingPage, setEditingPage] = useState<SeoConfig | null>(null);
  const [isAddPageOpen, setIsAddPageOpen] = useState(false);

  // Modal Form Fields
  const [formKeywords, setFormKeywords] = useState<string[]>([]);
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [formMetaTitle, setFormMetaTitle] = useState('');
  const [formMetaDescription, setFormMetaDescription] = useState('');
  const [formCanonicalUrl, setFormCanonicalUrl] = useState('');
  const [formIndexingDirective, setFormIndexingDirective] = useState<SeoConfig['indexingDirective']>('INDEX_FOLLOW');
  const [formPagePath, setFormPagePath] = useState('');
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchAllSeoData = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/seo');
      if (res.success && res.data) {
        if (Array.isArray(res.data)) {
          setPageConfigs(res.data);
        } else {
          setPageConfigs(res.data.pageConfigs || []);
          setCategories(res.data.categories || []);
          setSubcategories(res.data.subcategories || []);
          setBrands(res.data.brands || []);
          setAudiences(res.data.audiences || []);
          setStats(res.data.stats || null);
          setSitemapStatus(res.data.sitemapStatus || null);
        }
      }
    } catch (err) {
      console.error('Failed to load SEO data', err);
      showToast('Error loading SEO metadata.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSeoData();
  }, []);

  // Open Edit Modals
  const openEditCategory = (cat: EnrichedCategory) => {
    setEditingCategory(cat);
    setFormKeywords(cat.seoKeywords || []);
    setFormMetaTitle(cat.metaTitle || `${cat.name} Solutions & Specifications | AGECO`);
    setFormMetaDescription(cat.metaDescription || cat.description || '');
    setFormCanonicalUrl(cat.canonicalUrl || `https://ageco.com.sa/catalogue/category/${cat.code.toLowerCase()}`);
    setNewKeywordInput('');
    setSuggestedKeywords([]);
  };

  const openEditSubcategory = (sub: EnrichedSubcategory) => {
    setEditingSubcategory(sub);
    setFormKeywords(sub.seoKeywords || []);
    setFormMetaTitle(sub.metaTitle || `${sub.name} - ${sub.categoryName || 'AGECO'} | Specifications`);
    setFormMetaDescription(sub.metaDescription || sub.description || '');
    setFormCanonicalUrl(sub.canonicalUrl || `https://ageco.com.sa/catalogue/sub/${sub.code.toLowerCase()}`);
    setNewKeywordInput('');
    setSuggestedKeywords([]);
  };

  const openEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setFormKeywords(brand.seoKeywords || []);
    setFormMetaTitle(brand.metaTitle || `${brand.name} Authorized Electrical Partner | AGECO`);
    setFormMetaDescription(brand.metaDescription || brand.description || '');
    setFormCanonicalUrl(brand.canonicalUrl || `https://ageco.com.sa/catalogue/brand/${brand.code.toLowerCase()}`);
    setNewKeywordInput('');
    setSuggestedKeywords([]);
  };

  const openEditPage = (page: SeoConfig) => {
    setEditingPage(page);
    setFormKeywords(page.keywords || []);
    setFormMetaTitle(page.metaTitle);
    setFormMetaDescription(page.metaDescription);
    setFormCanonicalUrl(page.canonicalUrl);
    setFormIndexingDirective(page.indexingDirective);
    setFormPagePath(page.pagePath);
    setNewKeywordInput('');
    setSuggestedKeywords([]);
  };

  const openAddPage = () => {
    setIsAddPageOpen(true);
    setFormPagePath('');
    setFormMetaTitle('');
    setFormMetaDescription('');
    setFormCanonicalUrl('');
    setFormKeywords([]);
    setFormIndexingDirective('INDEX_FOLLOW');
    setNewKeywordInput('');
    setSuggestedKeywords([]);
  };

  // Keyword management inside modals
  const addKeyword = () => {
    const trimmed = newKeywordInput.trim();
    if (!trimmed) return;
    if (!formKeywords.includes(trimmed)) {
      setFormKeywords([...formKeywords, trimmed]);
    }
    setNewKeywordInput('');
  };

  const removeKeyword = (kwToRemove: string) => {
    setFormKeywords(formKeywords.filter((k) => k !== kwToRemove));
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeyword();
    }
  };

  const addSuggestedKeyword = (kw: string) => {
    if (!formKeywords.includes(kw)) {
      setFormKeywords([...formKeywords, kw]);
    }
    setSuggestedKeywords(suggestedKeywords.filter((k) => k !== kw));
  };

  // Request keyword suggestions from server
  const requestSuggestions = async (type: 'CATEGORY' | 'SUBCATEGORY' | 'BRAND', id: string) => {
    setGeneratingSuggestions(true);
    try {
      const res = await api.post<any>('/seo/generate-keywords', { type, id });
      if (res.success && res.data?.keywords) {
        const fresh = res.data.keywords.filter((k: string) => !formKeywords.includes(k));
        setSuggestedKeywords(fresh);
        if (fresh.length === 0) {
          showToast('All suggested keywords are already in your list!');
        }
      }
    } catch (err) {
      console.error('Failed to generate suggestions', err);
      showToast('Could not fetch suggestions.');
    } finally {
      setGeneratingSuggestions(false);
    }
  };

  // Save Category SEO
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setActionLoading(true);
    try {
      const res = await api.put<Category>(`/seo/category/${editingCategory.id}`, {
        seoKeywords: formKeywords,
        metaTitle: formMetaTitle,
        metaDescription: formMetaDescription,
        canonicalUrl: formCanonicalUrl,
      });
      if (res.success && res.data) {
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? { ...c, ...res.data } : c))
        );
        showToast(`SEO keywords updated for category: ${editingCategory.name}`);
        setEditingCategory(null);
      }
    } catch (err) {
      console.error('Failed to save category SEO', err);
      showToast('Failed to save category SEO.');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Subcategory SEO
  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubcategory) return;
    setActionLoading(true);
    try {
      const res = await api.put<Subcategory>(`/seo/subcategory/${editingSubcategory.id}`, {
        seoKeywords: formKeywords,
        metaTitle: formMetaTitle,
        metaDescription: formMetaDescription,
        canonicalUrl: formCanonicalUrl,
      });
      if (res.success && res.data) {
        setSubcategories((prev) =>
          prev.map((s) => (s.id === editingSubcategory.id ? { ...s, ...res.data } : s))
        );
        showToast(`SEO keywords updated for subcategory: ${editingSubcategory.name}`);
        setEditingSubcategory(null);
      }
    } catch (err) {
      console.error('Failed to save subcategory SEO', err);
      showToast('Failed to save subcategory SEO.');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Brand SEO
  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;
    setActionLoading(true);
    try {
      const res = await api.put<Brand>(`/seo/brand/${editingBrand.id}`, {
        seoKeywords: formKeywords,
        metaTitle: formMetaTitle,
        metaDescription: formMetaDescription,
        canonicalUrl: formCanonicalUrl,
      });
      if (res.success && res.data) {
        setBrands((prev) =>
          prev.map((b) => (b.id === editingBrand.id ? { ...b, ...res.data } : b))
        );
        showToast(`SEO keywords updated for brand: ${editingBrand.name}`);
        setEditingBrand(null);
      }
    } catch (err) {
      console.error('Failed to save brand SEO', err);
      showToast('Failed to save brand SEO.');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Page SEO
  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPage) return;
    setActionLoading(true);
    try {
      const res = await api.put<SeoConfig>(`/seo/${editingPage.id}`, {
        metaTitle: formMetaTitle,
        metaDescription: formMetaDescription,
        canonicalUrl: formCanonicalUrl,
        indexingDirective: formIndexingDirective,
        keywords: formKeywords,
      });
      if (res.success && res.data) {
        setPageConfigs((prev) =>
          prev.map((c) => (c.id === editingPage.id ? res.data! : c))
        );
        showToast(`Page SEO updated for: ${editingPage.pagePath}`);
        setEditingPage(null);
      }
    } catch (err) {
      console.error('Failed to save page SEO', err);
      showToast('Failed to save page SEO.');
    } finally {
      setActionLoading(false);
    }
  };

  // Create New Page SEO
  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post<SeoConfig>('/seo', {
        pagePath: formPagePath,
        metaTitle: formMetaTitle,
        metaDescription: formMetaDescription,
        canonicalUrl: formCanonicalUrl || `https://ageco.com.sa${formPagePath}`,
        indexingDirective: formIndexingDirective,
        keywords: formKeywords,
      });
      if (res.success && res.data) {
        setPageConfigs((prev) => [...prev, res.data!]);
        showToast(`Created SEO configuration for ${res.data.pagePath}`);
        setIsAddPageOpen(false);
      }
    } catch (err) {
      console.error('Failed to create page SEO', err);
      showToast('Failed to create page SEO configuration.');
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Auto-Generate Missing Keywords
  const handleBulkGenerate = async (target: 'CATEGORIES' | 'SUBCATEGORIES' | 'BRANDS' | 'ALL') => {
    setActionLoading(true);
    try {
      const res = await api.post<any>('/seo/bulk-generate', { target });
      if (res.success) {
        showToast(res.data?.message || 'SEO keywords generated successfully!');
        await fetchAllSeoData();
      }
    } catch (err) {
      console.error('Failed bulk generate', err);
      showToast('Bulk generation encountered an error.');
    } finally {
      setActionLoading(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const rows = [
      ['Type', 'Entity Name', 'Code', 'Keywords Count', 'Keywords List', 'Meta Title', 'Canonical URL'],
    ];

    categories.forEach((c) => {
      rows.push([
        'Category',
        `"${c.name}"`,
        c.code,
        String(c.seoKeywords?.length || 0),
        `"${(c.seoKeywords || []).join(', ')}"`,
        `"${c.metaTitle || ''}"`,
        c.canonicalUrl || '',
      ]);
    });

    subcategories.forEach((s) => {
      rows.push([
        'Subcategory',
        `"${s.name}"`,
        s.code,
        String(s.seoKeywords?.length || 0),
        `"${(s.seoKeywords || []).join(', ')}"`,
        `"${s.metaTitle || ''}"`,
        s.canonicalUrl || '',
      ]);
    });

    brands.forEach((b) => {
      rows.push([
        'Brand',
        `"${b.name}"`,
        b.code,
        String(b.seoKeywords?.length || 0),
        `"${(b.seoKeywords || []).join(', ')}"`,
        `"${b.metaTitle || ''}"`,
        b.canonicalUrl || '',
      ]);
    });

    pageConfigs.forEach((p) => {
      rows.push([
        'Page Route',
        `"${p.pagePath}"`,
        '-',
        String(p.keywords?.length || 0),
        `"${(p.keywords || []).join(', ')}"`,
        `"${p.metaTitle}"`,
        p.canonicalUrl,
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ageco-seo-keywords-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported SEO Keywords CSV successfully.');
  };

  // Filtered lists
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.seoKeywords || []).some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesAudience = audienceFilter === 'ALL' || c.audienceId === audienceFilter;
      return matchesSearch && matchesAudience;
    });
  }, [categories, searchQuery, audienceFilter]);

  const filteredSubcategories = useMemo(() => {
    return subcategories.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.categoryName && s.categoryName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.seoKeywords || []).some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCat = categoryFilter === 'ALL' || s.categoryId === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [subcategories, searchQuery, categoryFilter]);

  const filteredBrands = useMemo(() => {
    return brands.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.seoKeywords || []).some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTier = brandTierFilter === 'ALL' || b.tier === brandTierFilter;
      return matchesSearch && matchesTier;
    });
  }, [brands, searchQuery, brandTierFilter]);

  const filteredPages = useMemo(() => {
    return pageConfigs.filter((p) => {
      return (
        p.pagePath.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.metaTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.keywords || []).some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [pageConfigs, searchQuery]);

  // Combined Matrix of all keywords for Explorer Tab
  const keywordMatrix = useMemo(() => {
    const list: Array<{
      keyword: string;
      sourceType: 'Category' | 'Subcategory' | 'Brand' | 'Page';
      sourceName: string;
      sourceCode?: string;
      targetId: string;
      rawItem: any;
    }> = [];

    categories.forEach((cat) => {
      (cat.seoKeywords || []).forEach((kw) => {
        list.push({
          keyword: kw,
          sourceType: 'Category',
          sourceName: cat.name,
          sourceCode: cat.code,
          targetId: cat.id,
          rawItem: cat,
        });
      });
    });

    subcategories.forEach((sub) => {
      (sub.seoKeywords || []).forEach((kw) => {
        list.push({
          keyword: kw,
          sourceType: 'Subcategory',
          sourceName: `${sub.name} (${sub.categoryName || 'General'})`,
          sourceCode: sub.code,
          targetId: sub.id,
          rawItem: sub,
        });
      });
    });

    brands.forEach((brand) => {
      (brand.seoKeywords || []).forEach((kw) => {
        list.push({
          keyword: kw,
          sourceType: 'Brand',
          sourceName: brand.name,
          sourceCode: brand.code,
          targetId: brand.id,
          rawItem: brand,
        });
      });
    });

    pageConfigs.forEach((page) => {
      (page.keywords || []).forEach((kw) => {
        list.push({
          keyword: kw,
          sourceType: 'Page',
          sourceName: page.metaTitle || page.pagePath,
          sourceCode: page.pagePath,
          targetId: page.id,
          rawItem: page,
        });
      });
    });

    if (!searchQuery.trim()) return list;

    return list.filter(
      (item) =>
        item.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sourceType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, subcategories, brands, pageConfigs, searchQuery]);

  // Precalculated Coverage Percentages
  const categoryCoveragePct = useMemo(() => {
    if (!categories.length) return 0;
    const count = categories.filter((c) => c.seoKeywords && c.seoKeywords.length > 0).length;
    return Math.round((count / categories.length) * 100);
  }, [categories]);

  const subcategoryCoveragePct = useMemo(() => {
    if (!subcategories.length) return 0;
    const count = subcategories.filter((s) => s.seoKeywords && s.seoKeywords.length > 0).length;
    return Math.round((count / subcategories.length) * 100);
  }, [subcategories]);

  const brandCoveragePct = useMemo(() => {
    if (!brands.length) return 0;
    const count = brands.filter((b) => b.seoKeywords && b.seoKeywords.length > 0).length;
    return Math.round((count / brands.length) * 100);
  }, [brands]);

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-xl">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header & KPI Summary */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>SEO & Metadata Management</span>
            <span className="inline-flex items-center rounded-md bg-orange-100 dark:bg-orange-950/60 px-2 py-0.5 text-xs font-semibold text-orange-800 dark:text-orange-300">
              Keywords by Category, Subcategory & Brands
            </span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Configure high-ranking search keywords, meta titles, descriptions, and indexing directives mapped directly to your added Categories, Subcategories, and Brands.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleBulkGenerate('ALL')}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40 px-3 py-1.5 text-xs font-medium text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition shadow-xs disabled:opacity-50"
            title="Auto-generate recommended SEO keywords for any categories, subcategories, or brands missing keywords"
          >
            <Sparkles className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
            <span>Auto-Sync Keywords</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={openAddPage}
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 transition shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Route SEO</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Tracked Keywords</span>
            <Tag className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {stats?.totalTrackedKeywords ??
                categories.reduce((acc, c) => acc + (c.seoKeywords?.length || 0), 0) +
                  subcategories.reduce((acc, s) => acc + (s.seoKeywords?.length || 0), 0) +
                  brands.reduce((acc, b) => acc + (b.seoKeywords?.length || 0), 0) +
                  pageConfigs.reduce((acc, p) => acc + (p.keywords?.length || 0), 0)}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Across all catalog entities</p>
        </div>

        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Categories Coverage</span>
            <FolderTree className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {categories.filter((c) => c.seoKeywords && c.seoKeywords.length > 0).length} / {categories.length}
            </span>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              {categoryCoveragePct}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            {categories.reduce((acc, c) => acc + (c.seoKeywords?.length || 0), 0)} category keywords
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Subcategories Coverage</span>
            <Layers className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {subcategories.filter((s) => s.seoKeywords && s.seoKeywords.length > 0).length} / {subcategories.length}
            </span>
            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
              {subcategoryCoveragePct}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            {subcategories.reduce((acc, s) => acc + (s.seoKeywords?.length || 0), 0)} subcategory keywords
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Brands Coverage</span>
            <Building2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {brands.filter((b) => b.seoKeywords && b.seoKeywords.length > 0).length} / {brands.length}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {brandCoveragePct}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            {brands.reduce((acc, b) => acc + (b.seoKeywords?.length || 0), 0)} brand keywords
          </p>
        </div>

        <div className="col-span-2 sm:col-span-4 lg:col-span-1 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Sitemap Index</span>
            <Globe className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {sitemapStatus?.indexedUrlsCount ?? 42 + categories.length + subcategories.length + brands.length}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              <span>Valid</span>
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Google Search Console Sync</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('CATEGORIES')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === 'CATEGORIES'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FolderTree className="h-4 w-4" />
            <span>Category Keywords</span>
            <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 font-bold">
              {categories.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('SUBCATEGORIES')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === 'SUBCATEGORIES'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Subcategory Keywords</span>
            <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 font-bold">
              {subcategories.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('BRANDS')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === 'BRANDS'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Brand Keywords</span>
            <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 font-bold">
              {brands.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('PAGES')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === 'PAGES'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Page & Route SEO</span>
            <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 font-bold">
              {pageConfigs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('MATRIX')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === 'MATRIX'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Tag className="h-4 w-4" />
            <span>Keyword Matrix Explorer</span>
            <span className="rounded-full bg-orange-100 dark:bg-orange-950/60 px-2 py-0.5 text-[10px] text-orange-700 dark:text-orange-300 font-bold">
              Search All
            </span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'CATEGORIES'
                ? 'Search categories or SEO keywords...'
                : activeTab === 'SUBCATEGORIES'
                ? 'Search subcategories or keywords...'
                : activeTab === 'BRANDS'
                ? 'Search brands or partner keywords...'
                : activeTab === 'PAGES'
                ? 'Search page path or meta titles...'
                : 'Search any keyword across categories, brands, & routes...'
            }
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'CATEGORIES' && (
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
            >
              <option value="ALL">All Audiences</option>
              <option value="aud-consumer">Consumer Solutions (6 Categories)</option>
              <option value="aud-professional">Professional Solutions (17 Categories)</option>
            </select>
          )}

          {activeTab === 'SUBCATEGORIES' && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none max-w-xs truncate"
            >
              <option value="ALL">All Parent Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          )}

          {activeTab === 'BRANDS' && (
            <select
              value={brandTierFilter}
              onChange={(e) => setBrandTierFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
            >
              <option value="ALL">All Brand Tiers</option>
              <option value="PARTNER">Partner Brands</option>
              <option value="PROPRIETARY">Proprietary</option>
              <option value="AUTHORIZED_DISTRIBUTOR">Authorized Distributor</option>
            </select>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-orange-500 mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading SEO configurations & category keywords...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: CATEGORY SEO KEYWORDS */}
          {activeTab === 'CATEGORIES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Showing {filteredCategories.length} categories with targeted SEO keywords
                </span>
                <button
                  onClick={() => handleBulkGenerate('CATEGORIES')}
                  className="text-xs text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Refresh Category Keywords</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCategories.map((cat) => {
                  const kwList = cat.seoKeywords || [];
                  return (
                    <div
                      key={cat.id}
                      className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-5 shadow-xs transition hover:border-orange-400/60 dark:hover:border-orange-500/60 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="rounded bg-orange-100 dark:bg-orange-950/70 px-2 py-0.5 font-mono text-[11px] font-semibold text-orange-800 dark:text-orange-300">
                                {cat.code}
                              </span>
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                                  cat.audienceId === 'aud-consumer'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                                }`}
                              >
                                {cat.audienceName || (cat.audienceId === 'aud-consumer' ? 'Consumer' : 'Professional')}
                              </span>
                              {cat.subcategoriesCount !== undefined && cat.subcategoriesCount > 0 && (
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                  • {cat.subcategoriesCount} Subcategories
                                </span>
                              )}
                            </div>
                            <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white">{cat.name}</h3>
                          </div>

                          <button
                            onClick={() => openEditCategory(cat)}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 px-2.5 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/50 hover:border-orange-300 transition shrink-0"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Edit SEO</span>
                          </button>
                        </div>

                        {/* SEO Keywords Section */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Tag className="h-3 w-3 text-orange-500" />
                              <span>SEO Keywords ({kwList.length})</span>
                            </span>
                            {kwList.length === 0 && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                No keywords configured
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                            {kwList.length > 0 ? (
                              kwList.map((kw, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center rounded-md bg-white dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs font-medium"
                                >
                                  {kw}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                Click "Edit SEO" to add keywords or generate automatically.
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Meta Tags preview */}
                        <div className="mt-3 text-xs space-y-1">
                          <p className="text-slate-700 dark:text-slate-300 line-clamp-1">
                            <span className="font-semibold text-slate-500 dark:text-slate-400">Meta Title: </span>
                            {cat.metaTitle || `${cat.name} Solutions & Specifications | AGECO`}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            <span className="font-semibold text-slate-500 dark:text-slate-400">Description: </span>
                            {cat.metaDescription || cat.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-mono text-slate-600 dark:text-slate-400 truncate max-w-xs">
                          {cat.canonicalUrl || `https://ageco.com.sa/catalogue/category/${cat.code.toLowerCase()}`}
                        </span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">INDEX_FOLLOW</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: SUBCATEGORY SEO KEYWORDS */}
          {activeTab === 'SUBCATEGORIES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Showing {filteredSubcategories.length} subcategories with targeted SEO keywords
                </span>
                <button
                  onClick={() => handleBulkGenerate('SUBCATEGORIES')}
                  className="text-xs text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Refresh Subcategory Keywords</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubcategories.map((sub) => {
                  const kwList = sub.seoKeywords || [];
                  return (
                    <div
                      key={sub.id}
                      className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-4 shadow-xs transition hover:border-orange-400/60 dark:hover:border-orange-500/60 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="rounded bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 font-mono text-[10px] font-semibold text-purple-700 dark:text-purple-300">
                                {sub.code}
                              </span>
                              <span className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                                {sub.categoryName}
                              </span>
                            </div>
                            <h3 className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">{sub.name}</h3>
                          </div>

                          <button
                            onClick={() => openEditSubcategory(sub)}
                            className="flex items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-50 transition shrink-0"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                        </div>

                        {/* Keywords */}
                        <div className="mt-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              Keywords ({kwList.length})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 p-1.5 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-100 dark:border-slate-800 min-h-[28px]">
                            {kwList.slice(0, 5).map((kw, i) => (
                              <span
                                key={i}
                                className="inline-block rounded bg-white dark:bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              >
                                {kw}
                              </span>
                            ))}
                            {kwList.length > 5 && (
                              <span className="inline-block rounded bg-orange-50 dark:bg-orange-950/60 px-1 py-0.5 text-[10px] font-semibold text-orange-700 dark:text-orange-300">
                                +{kwList.length - 5} more
                              </span>
                            )}
                            {kwList.length === 0 && (
                              <span className="text-[10px] text-slate-400 italic">No keywords yet</span>
                            )}
                          </div>
                        </div>

                        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {sub.metaTitle || `${sub.name} - ${sub.categoryName} | Specifications`}
                        </p>
                      </div>

                      <div className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-2 text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">
                        {sub.canonicalUrl || `https://ageco.com.sa/catalogue/sub/${sub.code.toLowerCase()}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: BRAND SEO KEYWORDS */}
          {activeTab === 'BRANDS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Showing {filteredBrands.length} brand partners with targeted SEO keywords
                </span>
                <button
                  onClick={() => handleBulkGenerate('BRANDS')}
                  className="text-xs text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Refresh Brand Keywords</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBrands.map((brand) => {
                  const kwList = brand.seoKeywords || [];
                  return (
                    <div
                      key={brand.id}
                      className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-5 shadow-xs transition hover:border-orange-400/60 dark:hover:border-orange-500/60 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-1 overflow-hidden shrink-0">
                              {brand.logo && brand.logo.startsWith('http') ? (
                                <img src={brand.logo} alt={brand.name} className="h-full w-full object-cover rounded" />
                              ) : (
                                <Building2 className="h-5 w-5 text-orange-500" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                                  {brand.code}
                                </span>
                                <span className="rounded bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                                  {brand.tier}
                                </span>
                              </div>
                              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{brand.name}</h3>
                            </div>
                          </div>

                          <button
                            onClick={() => openEditBrand(brand)}
                            className="flex items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-50 transition shrink-0"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                        </div>

                        {/* Brand Keywords */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Tag className="h-3 w-3 text-orange-500" />
                              <span>Brand Keywords ({kwList.length})</span>
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 min-h-[36px]">
                            {kwList.length > 0 ? (
                              kwList.map((kw, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center rounded bg-white dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium"
                                >
                                  {kw}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 italic">No keywords configured</span>
                            )}
                          </div>
                        </div>

                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {brand.metaDescription || brand.description}
                        </p>
                      </div>

                      <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <span className="truncate max-w-xs">
                          {brand.canonicalUrl || `https://ageco.com.sa/catalogue/brand/${brand.code.toLowerCase()}`}
                        </span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">INDEX_FOLLOW</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: PAGE & ROUTE SEO */}
          {activeTab === 'PAGES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Showing {filteredPages.length} public route SEO configurations
                </span>
                <button
                  onClick={openAddPage}
                  className="text-xs text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add New Page SEO</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filteredPages.map((cfg) => {
                  const kwList = cfg.keywords || [];
                  return (
                    <div
                      key={cfg.id}
                      className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-5 shadow-xs transition hover:border-orange-300 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="rounded bg-orange-50 dark:bg-orange-950/60 px-2.5 py-0.5 font-mono text-[11px] text-orange-700 dark:text-orange-300 font-semibold">
                              {cfg.pagePath}
                            </span>
                            <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white">{cfg.metaTitle}</h3>
                          </div>
                          <button
                            onClick={() => openEditPage(cfg)}
                            className="flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>
                        </div>

                        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {cfg.metaDescription}
                        </p>

                        {/* Page Keywords */}
                        <div className="mt-3">
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 block">
                            Target SEO Keywords ({kwList.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 min-h-[32px]">
                            {kwList.length > 0 ? (
                              kwList.map((kw, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center rounded-md bg-white dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium"
                                >
                                  {kw}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 italic">No keywords added</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                          <span>Canonical:</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-xs">
                            {cfg.canonicalUrl}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                          <span>Directives:</span>
                          <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                            {cfg.indexingDirective}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: GLOBAL KEYWORD MATRIX EXPLORER */}
          {activeTab === 'MATRIX' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Master Keyword Explorer ({keywordMatrix.length} Total Matches)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Search and audit keyword coverage across every category, subcategory, brand, and page.
                  </p>
                </div>
                <button
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Full Matrix</span>
                </button>
              </div>

              <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 text-[11px] font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-4">SEO Keyword Term</th>
                        <th className="py-3 px-4">Source Type</th>
                        <th className="py-3 px-4">Associated Entity Name</th>
                        <th className="py-3 px-4">Entity Code / Path</th>
                        <th className="py-3 px-4 text-right">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {keywordMatrix.slice(0, 100).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition">
                          <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                            <span className="flex items-center gap-1.5">
                              <Tag className="h-3 w-3 text-orange-500" />
                              <span>{item.keyword}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                                item.sourceType === 'Category'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
                                  : item.sourceType === 'Subcategory'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300'
                                  : item.sourceType === 'Brand'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                                  : 'bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300'
                              }`}
                            >
                              {item.sourceType}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                            {item.sourceName}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {item.sourceCode}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              onClick={() => {
                                if (item.sourceType === 'Category') openEditCategory(item.rawItem);
                                else if (item.sourceType === 'Subcategory') openEditSubcategory(item.rawItem);
                                else if (item.sourceType === 'Brand') openEditBrand(item.rawItem);
                                else if (item.sourceType === 'Page') openEditPage(item.rawItem);
                              }}
                              className="text-orange-600 dark:text-orange-400 hover:underline font-semibold text-xs"
                            >
                              Edit SEO
                            </button>
                          </td>
                        </tr>
                      ))}
                      {keywordMatrix.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                            No keywords matching "{searchQuery}"
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {keywordMatrix.length > 100 && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/40 text-center text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800">
                    Showing top 100 results. Use the search box to filter specifically.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: EDIT CATEGORY SEO KEYWORDS */}
      {/* ---------------------------------------------------- */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                  Category SEO Keywords
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingCategory.name} ({editingCategory.code})
                </h3>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="mt-4 space-y-4">
              {/* Keywords Tag Manager */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    SEO Keywords ({formKeywords.length} tags)
                  </label>
                  <button
                    type="button"
                    onClick={() => requestSuggestions('CATEGORY', editingCategory.id)}
                    disabled={generatingSuggestions}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline disabled:opacity-50"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>{generatingSuggestions ? 'Generating...' : '✨ Suggest AI Keywords'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 min-h-[50px]">
                  {formKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-md bg-white dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs font-medium"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => removeKeyword(kw)}
                        className="text-slate-400 hover:text-rose-500 ml-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Input to add tag */}
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newKeywordInput}
                    onChange={(e) => setNewKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    placeholder="Type keyword and press Enter or comma (e.g., 'Modular Switches KSA')..."
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addKeyword}
                    className="rounded-lg bg-slate-800 dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    + Add
                  </button>
                </div>

                {/* Suggested tags */}
                {suggestedKeywords.length > 0 && (
                  <div className="mt-3 p-2.5 rounded-lg bg-orange-50/70 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/60">
                    <span className="text-[10px] font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wider block mb-1.5">
                      Recommended Category Keywords (Click to add)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedKeywords.map((skw, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => addSuggestedKeyword(skw)}
                          className="inline-flex items-center gap-1 rounded bg-white dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/60 transition"
                        >
                          <Plus className="h-3 w-3" />
                          <span>{skw}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Meta Title ({formMetaTitle.length}/60 chars)
                </label>
                <input
                  type="text"
                  required
                  value={formMetaTitle}
                  onChange={(e) => setFormMetaTitle(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Meta Description ({formMetaDescription.length}/160 chars)
                </label>
                <textarea
                  rows={3}
                  required
                  value={formMetaDescription}
                  onChange={(e) => setFormMetaDescription(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Canonical URL
                </label>
                <input
                  type="url"
                  required
                  value={formCanonicalUrl}
                  onChange={(e) => setFormCanonicalUrl(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 font-mono focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-lg bg-orange-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Category SEO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: EDIT SUBCATEGORY SEO KEYWORDS */}
      {/* ---------------------------------------------------- */}
      {editingSubcategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  Subcategory SEO Keywords
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingSubcategory.name} ({editingSubcategory.categoryName})
                </h3>
              </div>
              <button
                onClick={() => setEditingSubcategory(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubcategory} className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    SEO Keywords ({formKeywords.length} tags)
                  </label>
                  <button
                    type="button"
                    onClick={() => requestSuggestions('SUBCATEGORY', editingSubcategory.id)}
                    disabled={generatingSuggestions}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline disabled:opacity-50"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>{generatingSuggestions ? 'Generating...' : '✨ Suggest AI Keywords'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 min-h-[50px]">
                  {formKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-md bg-white dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs font-medium"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => removeKeyword(kw)}
                        className="text-slate-400 hover:text-rose-500 ml-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newKeywordInput}
                    onChange={(e) => setNewKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    placeholder="Add subcategory keyword and press Enter..."
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addKeyword}
                    className="rounded-lg bg-slate-800 dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    + Add
                  </button>
                </div>

                {suggestedKeywords.length > 0 && (
                  <div className="mt-3 p-2.5 rounded-lg bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/60">
                    <span className="text-[10px] font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider block mb-1.5">
                      Suggested Keywords (Click to add)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedKeywords.map((skw, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => addSuggestedKeyword(skw)}
                          className="inline-flex items-center gap-1 rounded bg-white dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition"
                        >
                          <Plus className="h-3 w-3" />
                          <span>{skw}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Meta Title</label>
                <input
                  type="text"
                  required
                  value={formMetaTitle}
                  onChange={(e) => setFormMetaTitle(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Meta Description</label>
                <textarea
                  rows={3}
                  required
                  value={formMetaDescription}
                  onChange={(e) => setFormMetaDescription(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Canonical URL</label>
                <input
                  type="url"
                  required
                  value={formCanonicalUrl}
                  onChange={(e) => setFormCanonicalUrl(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingSubcategory(null)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Subcategory SEO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: EDIT BRAND SEO KEYWORDS */}
      {/* ---------------------------------------------------- */}
      {editingBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Brand Partner SEO Keywords
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingBrand.name} ({editingBrand.code})
                </h3>
              </div>
              <button
                onClick={() => setEditingBrand(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    SEO Keywords ({formKeywords.length} tags)
                  </label>
                  <button
                    type="button"
                    onClick={() => requestSuggestions('BRAND', editingBrand.id)}
                    disabled={generatingSuggestions}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>{generatingSuggestions ? 'Generating...' : '✨ Suggest AI Keywords'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 min-h-[50px]">
                  {formKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-md bg-white dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs font-medium"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => removeKeyword(kw)}
                        className="text-slate-400 hover:text-rose-500 ml-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newKeywordInput}
                    onChange={(e) => setNewKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    placeholder="Add brand keyword (e.g. 'Schneider Authorized Distributor KSA')..."
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addKeyword}
                    className="rounded-lg bg-slate-800 dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    + Add
                  </button>
                </div>

                {suggestedKeywords.length > 0 && (
                  <div className="mt-3 p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60">
                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block mb-1.5">
                      Suggested Brand Keywords (Click to add)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedKeywords.map((skw, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => addSuggestedKeyword(skw)}
                          className="inline-flex items-center gap-1 rounded bg-white dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition"
                        >
                          <Plus className="h-3 w-3" />
                          <span>{skw}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Meta Title</label>
                <input
                  type="text"
                  required
                  value={formMetaTitle}
                  onChange={(e) => setFormMetaTitle(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Meta Description</label>
                <textarea
                  rows={3}
                  required
                  value={formMetaDescription}
                  onChange={(e) => setFormMetaDescription(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Canonical URL</label>
                <input
                  type="url"
                  required
                  value={formCanonicalUrl}
                  onChange={(e) => setFormCanonicalUrl(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingBrand(null)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Brand SEO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: EDIT PAGE SEO */}
      {/* ---------------------------------------------------- */}
      {editingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                  Page Route SEO
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{editingPage.pagePath}</h3>
              </div>
              <button
                onClick={() => setEditingPage(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePage} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target SEO Keywords ({formKeywords.length})
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 min-h-[40px] mt-1">
                  {formKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded bg-white dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => removeKeyword(kw)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-1.5 flex gap-2">
                  <input
                    type="text"
                    value={newKeywordInput}
                    onChange={(e) => setNewKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    placeholder="Add target keyword..."
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addKeyword}
                    className="rounded-lg bg-slate-800 dark:bg-slate-700 px-3 py-1 text-xs font-semibold text-white"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Meta Title</label>
                <input
                  type="text"
                  required
                  value={formMetaTitle}
                  onChange={(e) => setFormMetaTitle(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Meta Description</label>
                <textarea
                  rows={3}
                  required
                  value={formMetaDescription}
                  onChange={(e) => setFormMetaDescription(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Canonical URL</label>
                <input
                  type="url"
                  required
                  value={formCanonicalUrl}
                  onChange={(e) => setFormCanonicalUrl(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 font-mono focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Robots Directive</label>
                <select
                  value={formIndexingDirective}
                  onChange={(e) => setFormIndexingDirective(e.target.value as any)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                >
                  <option value="INDEX_FOLLOW">INDEX_FOLLOW</option>
                  <option value="NOINDEX_FOLLOW">NOINDEX_FOLLOW</option>
                  <option value="INDEX_NOFOLLOW">INDEX_NOFOLLOW</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingPage(null)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-lg bg-orange-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: ADD NEW PAGE ROUTE SEO */}
      {/* ---------------------------------------------------- */}
      {isAddPageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Public Route SEO</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure search index directives and keywords for a new path.
                </p>
              </div>
              <button
                onClick={() => setIsAddPageOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePage} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Page Path (e.g. /contact, /about, /projects)
                </label>
                <input
                  type="text"
                  required
                  placeholder="/contact"
                  value={formPagePath}
                  onChange={(e) => setFormPagePath(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 font-mono focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Meta Title</label>
                <input
                  type="text"
                  required
                  placeholder="Contact AGECO Engineering | Switchgear & EPC Solutions"
                  value={formMetaTitle}
                  onChange={(e) => setFormMetaTitle(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Meta Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Get in touch with AGECO sales and engineering team in Riyadh and Dammam."
                  value={formMetaDescription}
                  onChange={(e) => setFormMetaDescription(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target SEO Keywords ({formKeywords.length})
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 min-h-[36px] mt-1">
                  {formKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded bg-white dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => removeKeyword(kw)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-1.5 flex gap-2">
                  <input
                    type="text"
                    value={newKeywordInput}
                    onChange={(e) => setNewKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    placeholder="Type keyword and press Enter..."
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addKeyword}
                    className="rounded-lg bg-slate-800 dark:bg-slate-700 px-3 py-1 text-xs font-semibold text-white"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Robots Directive</label>
                <select
                  value={formIndexingDirective}
                  onChange={(e) => setFormIndexingDirective(e.target.value as any)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                >
                  <option value="INDEX_FOLLOW">INDEX_FOLLOW</option>
                  <option value="NOINDEX_FOLLOW">NOINDEX_FOLLOW</option>
                  <option value="INDEX_NOFOLLOW">INDEX_NOFOLLOW</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddPageOpen(false)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-lg bg-orange-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 transition disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Create Page SEO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
