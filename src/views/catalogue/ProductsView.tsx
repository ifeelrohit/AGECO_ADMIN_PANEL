import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  X,
  Check,
  Star,
  FileText,
  Shield,
  Layers,
  Sparkles,
  SlidersHorizontal,
  FolderTree,
  Tag,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../config/api.ts';
import {
  Product,
  Brand,
  Category,
  Subcategory,
  Audience,
  ProductType,
  ProductAttribute,
  ProductDocument,
  ProductWarranty,
} from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

// ----------------------------------------------------
// FORM STATE TYPES (Modular Separation per Spec)
// ----------------------------------------------------
interface BasicInfoState {
  title: string;
  sku: string;
  brandId: string;
}

interface ClassificationState {
  audienceId: string;
  categoryId: string;
  subcategoryId: string;
  productTypeId: string;
}

interface ContentState {
  shortDescription: string;
  description: string;
  keyFeatures: string[];
}

interface MediaState {
  mainImage: string;
  additionalImages: string[];
}

interface WarrantyState {
  period: string;
  info: string;
  supportInfo: string;
}

interface PublishingState {
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  featured: boolean;
}

export const ProductsView: React.FC = () => {
  const { user } = useAuth();

  // Catalogue Reference Data
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [allAttributes, setAllAttributes] = useState<ProductAttribute[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAudience, setFilterAudience] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubcategory, setFilterSubcategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // ----------------------------------------------------
  // FORM SECTIONS STATE (Strict Architectural Separation)
  // ----------------------------------------------------
  const [basicInfo, setBasicInfo] = useState<BasicInfoState>({
    title: '',
    sku: '',
    brandId: '',
  });

  const [classification, setClassification] = useState<ClassificationState>({
    audienceId: '',
    categoryId: '',
    subcategoryId: '',
    productTypeId: '',
  });

  const [attributeValues, setAttributeValues] = useState<Record<string, any>>({});

  const [content, setContent] = useState<ContentState>({
    shortDescription: '',
    description: '',
    keyFeatures: [],
  });
  const [featureInput, setFeatureInput] = useState('');

  const [media, setMedia] = useState<MediaState>({
    mainImage: '',
    additionalImages: [],
  });
  const [additionalImageInput, setAdditionalImageInput] = useState('');

  const [warranty, setWarranty] = useState<WarrantyState>({
    period: '',
    info: '',
    supportInfo: '',
  });

  const [documents, setDocuments] = useState<ProductDocument[]>([]);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');
  const [newDocType, setNewDocType] = useState<ProductDocument['type']>('DATASHEET');

  const [publishing, setPublishing] = useState<PublishingState>({
    status: 'PUBLISHED',
    featured: false,
  });

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, brandRes, catRes, subcatRes, audRes, typeRes, attrRes] =
        await Promise.all([
          api.get<Product[]>('/catalogue/products'),
          api.get<Brand[]>('/catalogue/brands'),
          api.get<Category[]>('/catalogue/categories'),
          api.get<Subcategory[]>('/catalogue/subcategories'),
          api.get<Audience[]>('/catalogue/audiences'),
          api.get<ProductType[]>('/catalogue/product-types'),
          api.get<ProductAttribute[]>('/catalogue/attributes'),
        ]);

      if (prodRes.success && prodRes.data) setProducts(prodRes.data);
      if (brandRes.success && brandRes.data) setBrands(brandRes.data);
      if (catRes.success && catRes.data) setCategories(catRes.data);
      if (subcatRes.success && subcatRes.data) setSubcategories(subcatRes.data);
      if (audRes.success && audRes.data) setAudiences(audRes.data);
      if (typeRes.success && typeRes.data) setProductTypes(typeRes.data);
      if (attrRes.success && attrRes.data) setAllAttributes(attrRes.data);
    } catch (err) {
      console.error('Failed to load catalogue data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ----------------------------------------------------
  // CASCADING DEPENDENT SELECTION HELPERS
  // ----------------------------------------------------
  const availableCategoriesForForm = useMemo(() => {
    if (!classification.audienceId) return categories;
    return categories.filter((c) => c.audienceId === classification.audienceId);
  }, [categories, classification.audienceId]);

  const availableSubcategoriesForForm = useMemo(() => {
    if (!classification.categoryId) return [];
    return subcategories.filter((s) => s.categoryId === classification.categoryId);
  }, [subcategories, classification.categoryId]);

  const availableProductTypesForForm = useMemo(() => {
    if (classification.subcategoryId) {
      const filtered = productTypes.filter(
        (pt) => pt.subcategoryId === classification.subcategoryId
      );
      if (filtered.length > 0) return filtered;
    }
    if (classification.categoryId) {
      const filtered = productTypes.filter(
        (pt) => pt.categoryId === classification.categoryId
      );
      if (filtered.length > 0) return filtered;
    }
    // Return all general/default product types if none specifically tied
    return productTypes.filter((pt) => !pt.subcategoryId && !pt.categoryId);
  }, [productTypes, classification.subcategoryId, classification.categoryId]);

  // Dynamic Applicable Attributes based on Classification
  const applicableAttributes = useMemo(() => {
    if (!classification.categoryId) return [];
    return allAttributes.filter((attr) => {
      // Must match category
      if (!attr.applicableCategoryIds.includes(classification.categoryId)) {
        return false;
      }
      // If attribute has specific subcategories, check match
      if (
        classification.subcategoryId &&
        attr.applicableSubcategoryIds &&
        attr.applicableSubcategoryIds.length > 0
      ) {
        if (!attr.applicableSubcategoryIds.includes(classification.subcategoryId)) {
          return false;
        }
      }
      // If attribute has specific product types, check match
      if (
        classification.productTypeId &&
        attr.applicableProductTypeIds &&
        attr.applicableProductTypeIds.length > 0
      ) {
        if (!attr.applicableProductTypeIds.includes(classification.productTypeId)) {
          return false;
        }
      }
      return attr.status === 'ACTIVE';
    });
  }, [
    allAttributes,
    classification.categoryId,
    classification.subcategoryId,
    classification.productTypeId,
  ]);

  // Helper to determine if an attribute conditional rule is satisfied
  const isAttributeConditionMet = (attr: ProductAttribute, values: Record<string, any>): boolean => {
    if (!attr.conditionalRule) return true;
    const parentVal = values[attr.conditionalRule.dependsOnCode];
    const { operator, value } = attr.conditionalRule;
    if (operator === 'EQUALS' || !operator) {
      return parentVal === value;
    }
    if (operator === 'NOT_EQUALS') {
      return parentVal !== value;
    }
    if (operator === 'IN') {
      return Array.isArray(value) && value.includes(parentVal);
    }
    if (operator === 'TRUTHY') {
      return Boolean(parentVal);
    }
    return true;
  };

  // Grouped attributes for structured form presentation
  const groupedAttributes = useMemo(() => {
    const map = new Map<string, ProductAttribute[]>();
    applicableAttributes.forEach((attr) => {
      const groupName = attr.group || 'General Specifications';
      if (!map.has(groupName)) {
        map.set(groupName, []);
      }
      map.get(groupName)!.push(attr);
    });
    return Array.from(map.entries());
  }, [applicableAttributes]);

  // ----------------------------------------------------
  // CLASSIFICATION CHANGE HANDLERS (Dependent Reset & Attribute Cleanup)
  // ----------------------------------------------------
  // Recalculates and removes values that are no longer applicable to the target classification
  const filterCompatibleAttributeValues = (
    currentValues: Record<string, any>,
    targetCategoryId: string,
    targetSubcategoryId: string,
    targetProductTypeId: string
  ) => {
    const validCodes = new Set<string>();
    allAttributes.forEach((attr) => {
      if (attr.status !== 'ACTIVE') return;
      if (!attr.applicableCategoryIds.includes(targetCategoryId)) return;
      if (
        targetSubcategoryId &&
        attr.applicableSubcategoryIds &&
        attr.applicableSubcategoryIds.length > 0 &&
        !attr.applicableSubcategoryIds.includes(targetSubcategoryId)
      ) {
        return;
      }
      if (
        targetProductTypeId &&
        attr.applicableProductTypeIds &&
        attr.applicableProductTypeIds.length > 0 &&
        !attr.applicableProductTypeIds.includes(targetProductTypeId)
      ) {
        return;
      }
      validCodes.add(attr.code);
    });

    const newValues: Record<string, any> = {};
    Object.entries(currentValues).forEach(([k, v]) => {
      if (validCodes.has(k)) {
        newValues[k] = v;
      }
    });
    return newValues;
  };

  const handleAudienceChange = (newAudienceId: string) => {
    const validCats = categories.filter((c) => c.audienceId === newAudienceId);
    const isCatStillValid = validCats.some((c) => c.id === classification.categoryId);
    const targetCatId = isCatStillValid ? classification.categoryId : validCats[0]?.id || '';
    const targetSubcatId = isCatStillValid ? classification.subcategoryId : '';
    const targetProductTypeId = isCatStillValid ? classification.productTypeId : '';

    setClassification({
      audienceId: newAudienceId,
      categoryId: targetCatId,
      subcategoryId: targetSubcatId,
      productTypeId: targetProductTypeId,
    });

    setAttributeValues((prev) =>
      filterCompatibleAttributeValues(
        prev,
        targetCatId,
        targetSubcatId,
        targetProductTypeId
      )
    );
  };

  const handleCategoryChange = (newCatId: string) => {
    const parentCat = categories.find((c) => c.id === newCatId);
    const validSubs = subcategories.filter((s) => s.categoryId === newCatId);
    const newSubcatId = validSubs[0]?.id || '';

    setClassification({
      audienceId: parentCat?.audienceId || classification.audienceId,
      categoryId: newCatId,
      subcategoryId: newSubcatId,
      productTypeId: '',
    });
    // Clear incompatible subcategory, classification, and attributes
    setAttributeValues((prev) =>
      filterCompatibleAttributeValues(prev, newCatId, newSubcatId, '')
    );
  };

  const handleSubcategoryChange = (newSubcatId: string) => {
    setClassification((prev) => ({
      ...prev,
      subcategoryId: newSubcatId,
      productTypeId: '',
    }));
    // Clear incompatible product classification and attributes
    setAttributeValues((prev) =>
      filterCompatibleAttributeValues(
        prev,
        classification.categoryId,
        newSubcatId,
        ''
      )
    );
  };

  const handleProductTypeChange = (newTypeId: string) => {
    setClassification((prev) => ({
      ...prev,
      productTypeId: newTypeId,
    }));
    // Recalculate applicable attributes and remove values belonging strictly to previous classification
    setAttributeValues((prev) =>
      filterCompatibleAttributeValues(
        prev,
        classification.categoryId,
        classification.subcategoryId,
        newTypeId
      )
    );
  };

  // ----------------------------------------------------
  // MODAL OPEN / EDIT / POPULATE
  // ----------------------------------------------------
  const openCreateModal = () => {
    setEditingProduct(null);

    const defaultAudience = audiences[0]?.id || 'aud-consumer';
    const defaultCats = categories.filter((c) => c.audienceId === defaultAudience);
    const defaultCat = defaultCats.find((c) => c.id === 'cat-c-bath') || defaultCats[0];
    const defaultSubs = defaultCat
      ? subcategories.filter((s) => s.categoryId === defaultCat.id)
      : [];
    const defaultSub = defaultSubs[0];
    const defaultTypes = defaultSub
      ? productTypes.filter((pt) => pt.subcategoryId === defaultSub.id)
      : [];

    setBasicInfo({
      title: '',
      sku: '',
      brandId: brands[0]?.id || '',
    });

    setClassification({
      audienceId: defaultAudience,
      categoryId: defaultCat?.id || '',
      subcategoryId: defaultSub?.id || '',
      productTypeId: defaultTypes[0]?.id || '',
    });

    setAttributeValues({});

    setContent({
      shortDescription: '',
      description: '',
      keyFeatures: [],
    });
    setFeatureInput('');

    setMedia({
      mainImage:
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
      additionalImages: [],
    });
    setAdditionalImageInput('');

    setWarranty({
      period: '5 Years Manufacturer Warranty',
      info: 'Covers functional defects and surface finishes under normal intended use.',
      supportInfo: 'Authorized AGECO Customer Care, Kingdom of Saudi Arabia.',
    });

    setDocuments([]);
    setNewDocTitle('');
    setNewDocUrl('');
    setNewDocType('DATASHEET');

    setPublishing({
      status: 'PUBLISHED',
      featured: false,
    });

    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);

    setBasicInfo({
      title: p.title || p.name || '',
      sku: p.sku || '',
      brandId: p.brandId || '',
    });

    // Resolve audience from category if missing
    let targetAudienceId = p.audienceId;
    if (!targetAudienceId && p.categoryId) {
      const cat = categories.find((c) => c.id === p.categoryId);
      targetAudienceId = cat?.audienceId || 'aud-consumer';
    }

    setClassification({
      audienceId: targetAudienceId || '',
      categoryId: p.categoryId,
      subcategoryId: p.subcategoryId || '',
      productTypeId: p.productTypeId || '',
    });

    // Populate attribute values: combine p.attributes and map any existing specifications
    const initialVals: Record<string, any> = { ...(p.attributes || {}) };
    if (p.specifications && Object.keys(p.specifications).length > 0) {
      allAttributes.forEach((attr) => {
        if (initialVals[attr.code] === undefined) {
          const directMatch = p.specifications[attr.name] || p.specifications[attr.code];
          if (directMatch) {
            if (attr.dataType === 'DIMENSION' || attr.dataType === 'NUMBER') {
              const numeric = parseFloat(directMatch.replace(/[^0-9.]/g, ''));
              if (!isNaN(numeric)) initialVals[attr.code] = String(numeric);
            } else if (attr.dataType === 'MULTI_SELECT') {
              initialVals[attr.code] = directMatch.split(',').map((s) => s.trim());
            } else if (attr.dataType === 'BOOLEAN') {
              initialVals[attr.code] =
                directMatch.toLowerCase() === 'yes' || directMatch.toLowerCase() === 'true';
            } else {
              initialVals[attr.code] = directMatch;
            }
          }
        }
      });
    }
    setAttributeValues(initialVals);

    setContent({
      shortDescription: p.shortDescription || '',
      description: p.description || p.technicalSummary || '',
      keyFeatures: p.keyFeatures || [],
    });
    setFeatureInput('');

    setMedia({
      mainImage: p.mainImage || '',
      additionalImages: p.additionalImages || [],
    });
    setAdditionalImageInput('');

    setWarranty({
      period: p.warranty?.period || '',
      info: p.warranty?.info || '',
      supportInfo: p.warranty?.supportInfo || '',
    });

    setDocuments(p.documents || []);
    setNewDocTitle('');
    setNewDocUrl('');
    setNewDocType('DATASHEET');

    setPublishing({
      status: p.status,
      featured: p.featured,
    });

    setFormError(null);
    setIsModalOpen(true);
  };

  // ----------------------------------------------------
  // KEY FEATURES LIST MANAGEMENT
  // ----------------------------------------------------
  const handleAddFeature = () => {
    const val = featureInput.trim();
    if (!val) return;
    setContent((prev) => ({
      ...prev,
      keyFeatures: [...prev.keyFeatures, val],
    }));
    setFeatureInput('');
  };

  const handleRemoveFeature = (index: number) => {
    setContent((prev) => ({
      ...prev,
      keyFeatures: prev.keyFeatures.filter((_, i) => i !== index),
    }));
  };

  // ----------------------------------------------------
  // MEDIA LIST MANAGEMENT
  // ----------------------------------------------------
  const handleAddAdditionalImage = () => {
    const val = additionalImageInput.trim();
    if (!val) return;
    setMedia((prev) => ({
      ...prev,
      additionalImages: [...prev.additionalImages, val],
    }));
    setAdditionalImageInput('');
  };

  const handleRemoveAdditionalImage = (index: number) => {
    setMedia((prev) => ({
      ...prev,
      additionalImages: prev.additionalImages.filter((_, i) => i !== index),
    }));
  };

  // ----------------------------------------------------
  // DOCUMENTS LIST MANAGEMENT
  // ----------------------------------------------------
  const handleAddDocument = () => {
    if (!newDocTitle.trim() || !newDocUrl.trim()) return;
    setDocuments((prev) => [
      ...prev,
      {
        title: newDocTitle.trim(),
        url: newDocUrl.trim(),
        type: newDocType,
      },
    ]);
    setNewDocTitle('');
    setNewDocUrl('');
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  // ----------------------------------------------------
  // ATTRIBUTE VALUE HANDLERS
  // ----------------------------------------------------
  const handleAttributeChange = (code: string, val: any) => {
    setAttributeValues((prev) => ({
      ...prev,
      [code]: val,
    }));
  };

  const handleToggleMultiSelectOption = (code: string, option: string) => {
    const current: string[] = Array.isArray(attributeValues[code])
      ? attributeValues[code]
      : [];
    if (current.includes(option)) {
      handleAttributeChange(
        code,
        current.filter((item) => item !== option)
      );
    } else {
      handleAttributeChange(code, [...current, option]);
    }
  };

  // ----------------------------------------------------
  // FORM SUBMISSION & CLIENT VALIDATION
  // ----------------------------------------------------
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation 1: Product Name is mandatory
    if (!basicInfo.title.trim()) {
      setFormError('Product Name is required.');
      return;
    }

    // Validation 2: Category is mandatory
    if (!classification.categoryId) {
      setFormError('Category selection is required.');
      return;
    }

    // Validation 3: Verify required attributes have values (if applicable and conditions met)
    for (const attr of applicableAttributes) {
      if (attr.isRequired && isAttributeConditionMet(attr, attributeValues)) {
        const val = attributeValues[attr.code];
        if (
          val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0)
        ) {
          setFormError(`Required technical attribute '${attr.name}' must be provided.`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    setFormError(null);

    // Build Specifications Map for backward compatibility, excluding hidden conditional values
    const cleanAttributeValues: Record<string, any> = {};
    const specsMap: Record<string, string> = {};
    Object.entries(attributeValues).forEach(([code, val]) => {
      const attrDef = allAttributes.find((a) => a.code === code);
      if (attrDef && !isAttributeConditionMet(attrDef, attributeValues)) {
        // Discard stale values whose parent condition is currently unmet
        return;
      }
      if (val !== undefined && val !== null && val !== '') {
        cleanAttributeValues[code] = val;
        const label = attrDef?.name || code;
        const formattedVal = Array.isArray(val)
          ? val.join(', ')
          : attrDef?.unit
          ? `${val} ${attrDef.unit}`
          : String(val);
        specsMap[label] = formattedVal;
      }
    });

    const payload = {
      sku: basicInfo.sku.trim() || undefined,
      title: basicInfo.title.trim(),
      name: basicInfo.title.trim(),
      // Brand is explicitly optional
      brandId: basicInfo.brandId ? basicInfo.brandId : undefined,
      audienceId: classification.audienceId || undefined,
      categoryId: classification.categoryId,
      subcategoryId: classification.subcategoryId || undefined,
      productTypeId: classification.productTypeId || undefined,
      attributes: cleanAttributeValues,
      specifications: specsMap,
      shortDescription: content.shortDescription.trim(),
      description: content.description.trim(),
      technicalSummary: content.description.trim() || content.shortDescription.trim(),
      keyFeatures: content.keyFeatures,
      mainImage:
        media.mainImage.trim() ||
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
      additionalImages: media.additionalImages,
      warranty:
        warranty.period.trim() || warranty.info.trim()
          ? {
              period: warranty.period.trim(),
              info: warranty.info.trim(),
              supportInfo: warranty.supportInfo.trim(),
            }
          : undefined,
      documents: documents,
      status: publishing.status,
      featured: publishing.featured,
    };

    try {
      if (editingProduct) {
        const res = await api.put<Product>(`/catalogue/products/${editingProduct.id}`, payload);
        if (res.success && res.data) {
          setProducts(products.map((p) => (p.id === editingProduct.id ? res.data! : p)));
          setIsModalOpen(false);
          showNotification(`Updated product '${res.data.title}'`);
        } else {
          setFormError(res.error?.message || 'Failed to update product.');
        }
      } else {
        const res = await api.post<Product>('/catalogue/products', payload);
        if (res.success && res.data) {
          setProducts([res.data, ...products]);
          setIsModalOpen(false);
          showNotification(`Created product '${res.data.title}' (SKU: ${res.data.sku})`);
        } else {
          setFormError(res.error?.message || 'Failed to create product.');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete product '${title}'?`)) {
      return;
    }
    try {
      const res = await api.delete(`/catalogue/products/${id}`);
      if (res.success) {
        setProducts(products.filter((p) => p.id !== id));
        showNotification(`Product '${title}' removed.`);
      } else {
        alert(res.error?.message || 'Failed to delete product.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ----------------------------------------------------
  // FILTERED PRODUCTS FOR TABLE DISPLAY
  // ----------------------------------------------------
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        searchQuery === '' ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.shortDescription && p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesAudience = filterAudience ? p.audienceId === filterAudience : true;
      const matchesCat = filterCategory ? p.categoryId === filterCategory : true;
      const matchesSubcat = filterSubcategory ? p.subcategoryId === filterSubcategory : true;
      const matchesBrand = filterBrand ? p.brandId === filterBrand : true;
      const matchesStatus = filterStatus ? p.status === filterStatus : true;

      return matchesSearch && matchesAudience && matchesCat && matchesSubcat && matchesBrand && matchesStatus;
    });
  }, [
    products,
    searchQuery,
    filterAudience,
    filterCategory,
    filterSubcategory,
    filterBrand,
    filterStatus,
  ]);

  // Helper to extract the 2–4 card attributes for a product
  const getProductCardAttributes = (p: Product) => {
    if (!p.attributes || Object.keys(p.attributes).length === 0) {
      return Object.entries(p.specifications || {}).slice(0, 3).map(([k, v]) => `${v}`);
    }

    const cardAttrs = allAttributes
      .filter((a) => a.showOnCard && p.attributes?.[a.code])
      .sort((a, b) => (a.cardOrder || 99) - (b.cardOrder || 99))
      .slice(0, 4);

    return cardAttrs.map((a) => {
      const val = p.attributes![a.code];
      if (Array.isArray(val)) return val.join(' / ');
      if (a.unit) return `${val} ${a.unit}`;
      return String(val);
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl animate-fade-in border border-slate-700">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* View Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Products
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Manage catalogue products with classification-driven attributes, card display previews, and technical specifications.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by title, SKU, or summary..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-700 focus:border-orange-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Brand Filter */}
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-700 focus:border-orange-500 focus:outline-none"
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-700 focus:border-orange-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Brand</th>
                <th className="py-3 px-4">Card Attributes Preview</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading catalogue products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No products found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const category = categories.find((c) => c.id === p.categoryId);
                  const subcategory = subcategories.find((s) => s.id === p.subcategoryId);
                  const productType = productTypes.find((pt) => pt.id === p.productTypeId);
                  const brand = brands.find((b) => b.id === p.brandId);
                  const cardAttributes = getProductCardAttributes(p);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      {/* Product Name, SKU, Image */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.mainImage}
                            alt={p.title}
                            className="h-10 w-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=200';
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900">{p.title}</span>
                              {p.featured && (
                                <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-orange-600 font-medium">
                              {p.sku}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Classification */}
                      <td className="py-3 px-4">
                        <div className="text-[11px] font-medium text-slate-800">
                          {category?.name || 'Uncategorized'}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <span>{subcategory?.name || 'General'}</span>
                          {productType && (
                            <>
                              <span>•</span>
                              <span className="text-orange-700 font-medium">
                                {productType.name}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="py-3 px-4">
                        {brand ? (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            {brand.name}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Optional (None)
                          </span>
                        )}
                      </td>

                      {/* Card Attributes Preview */}
                      <td className="py-3 px-4">
                        {cardAttributes.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1 text-[10px]">
                            {cardAttributes.map((attrText, idx) => (
                              <span
                                key={idx}
                                className="rounded bg-orange-50 px-1.5 py-0.5 font-medium text-orange-800 border border-orange-200/60"
                              >
                                {attrText}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            p.status === 'PUBLISHED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : p.status === 'DRAFT'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailProduct(p)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                            title="View Product Presentation"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                            title="Edit Product"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.title)}
                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Delete Product"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MODAL: ADD / EDIT PRODUCT (Classification-Driven)     */}
      {/* ==================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingProduct ? `Edit Product: ${editingProduct.title}` : 'Add New Product'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  Classification-driven product specification and cataloging system.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="mt-5 space-y-6">
              {/* ==================================================== */}
              {/* STEPS 1 TO 4 — CLASSIFICATION HIERARCHY              */}
              {/* ==================================================== */}
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/70 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
                      1-4
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Product Hierarchy & Classification (Steps 1 – 4)
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Audience → Category → Subcategory → Product Classification
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  {/* Step 1 — Audience * */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Step 1 — Audience <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={classification.audienceId}
                      onChange={(e) => handleAudienceChange(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-2.5 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                    >
                      {audiences.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 2 — Category * */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Step 2 — Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={classification.categoryId}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-2.5 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                    >
                      <option value="">Select Category...</option>
                      {availableCategoriesForForm.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 3 — Subcategory */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Step 3 — Subcategory
                    </label>
                    <select
                      value={classification.subcategoryId}
                      onChange={(e) => handleSubcategoryChange(e.target.value)}
                      disabled={availableSubcategoriesForForm.length === 0}
                      className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-2.5 text-xs text-slate-800 focus:border-orange-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 font-medium"
                    >
                      <option value="">Select Subcategory...</option>
                      {availableSubcategoriesForForm.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 4 — Product Classification */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Step 4 — Product Classification
                    </label>
                    <select
                      value={classification.productTypeId}
                      onChange={(e) => handleProductTypeChange(e.target.value)}
                      disabled={availableProductTypesForForm.length === 0}
                      className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-2.5 text-xs text-slate-800 focus:border-orange-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 font-semibold"
                    >
                      <option value="">Select Classification...</option>
                      {availableProductTypesForForm.map((pt) => (
                        <option key={pt.id} value={pt.id}>
                          {pt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ==================================================== */}
              {/* STEP 5 — PRODUCT INFORMATION                         */}
              {/* ==================================================== */}
              <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
                      5
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Step 5 — Product Information
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    General identity, brand (optional), and catalog description
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {/* Product Name * */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Product Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Symphony Diet 3D 25L Personal Air Cooler"
                      value={basicInfo.title}
                      onChange={(e) => setBasicInfo({ ...basicInfo, title: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  {/* SKU (Optional) */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700">SKU</label>
                      <span className="text-[10px] text-slate-400 font-medium">Optional</span>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. AG-CLR-PERSONAL-01 (auto-generates if empty)"
                      value={basicInfo.sku}
                      onChange={(e) => setBasicInfo({ ...basicInfo, sku: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 font-mono focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Brand (Optional) */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">Brand</label>
                    <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-500">
                      Optional
                    </span>
                  </div>
                  <select
                    value={basicInfo.brandId}
                    onChange={(e) => setBasicInfo({ ...basicInfo, brandId: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">No Brand Selected / Proprietary AGECO Solution</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.tier})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ==================================================== */}
              {/* STEP 6 — DYNAMIC PRODUCT ATTRIBUTES                  */}
              {/* ==================================================== */}
              <div className="rounded-xl border border-orange-200 bg-white p-4 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-orange-100 pb-2.5 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
                      6
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Step 6 — Dynamic Attributes (Classification Specifications)
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold text-orange-800">
                      {applicableAttributes.length} Applicable Attributes
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Card Display vs Detail Only
                    </span>
                  </div>
                </div>

                {applicableAttributes.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                    <SlidersHorizontal className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="font-semibold text-slate-700">
                      No dynamic attributes defined for this classification yet.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Select a Category or Subcategory (e.g. Fans, Air Conditioners, Faucets & Taps, Showers) to configure technical specifications.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {groupedAttributes.map(([groupName, attrs]) => {
                      const visibleAttrs = attrs.filter((attr) => isAttributeConditionMet(attr, attributeValues));
                      if (visibleAttrs.length === 0) return null;

                      return (
                        <div key={groupName} className="space-y-3">
                          <div className="flex items-center gap-2 border-b border-slate-100 pb-1">
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                              {groupName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({visibleAttrs.length} active attributes)
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {visibleAttrs.map((attr) => {
                              const currentValue = attributeValues[attr.code];

                              return (
                                <div
                                  key={attr.id}
                                  className="rounded-lg border border-slate-200/90 p-2.5 bg-slate-50/40 hover:bg-slate-50 transition"
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <label className="text-xs font-semibold text-slate-800">
                                        {attr.name}
                                      </label>
                                      {attr.isRequired && (
                                        <span className="text-rose-500 font-bold" title="Required">*</span>
                                      )}
                                      {attr.conditionalRule && (
                                        <span className="rounded bg-sky-100 px-1 py-0.2 text-[8px] font-bold text-sky-800">
                                          Conditional
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-1">
                                      {attr.showOnCard ? (
                                        <span className="rounded bg-orange-100 px-1.5 py-0.2 text-[9px] font-bold text-orange-800">
                                          Card Display
                                        </span>
                                      ) : (
                                        <span className="rounded bg-slate-200/70 px-1.5 py-0.2 text-[9px] font-medium text-slate-600">
                                          Detail Only
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                {/* Render by Data Type */}
                                {attr.dataType === 'SELECT' && (
                                  <select
                                    value={currentValue || ''}
                                    onChange={(e) => handleAttributeChange(attr.code, e.target.value)}
                                    className="w-full rounded-md border border-slate-200 bg-white py-1.5 px-2.5 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                                  >
                                    <option value="">Select {attr.name}...</option>
                                    {(attr.allowedValues || []).map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                )}

                                {attr.dataType === 'MULTI_SELECT' && (
                                  <div className="space-y-1.5">
                                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pt-0.5">
                                      {(attr.allowedValues || []).map((opt) => {
                                        const isSelected = Array.isArray(currentValue) && currentValue.includes(opt);
                                        return (
                                          <button
                                            key={opt}
                                            type="button"
                                            onClick={() => handleToggleMultiSelectOption(attr.code, opt)}
                                            className={`rounded px-2 py-0.5 text-[10px] font-medium transition ${
                                              isSelected
                                                ? 'bg-orange-500 text-white shadow-xs font-semibold'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                            }`}
                                          >
                                            {opt}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {attr.dataType === 'DIMENSION' && (
                                  <div className="flex rounded-md border border-slate-200 bg-white overflow-hidden focus-within:border-orange-500">
                                    <input
                                      type="number"
                                      step="any"
                                      placeholder="e.g. 185"
                                      value={currentValue || ''}
                                      onChange={(e) => handleAttributeChange(attr.code, e.target.value)}
                                      className="flex-1 py-1.5 px-2.5 text-xs text-slate-800 font-mono focus:outline-none"
                                    />
                                    <span className="flex items-center px-2.5 bg-slate-100 text-[11px] font-bold text-slate-600 border-l border-slate-200">
                                      {attr.unit || 'mm'}
                                    </span>
                                  </div>
                                )}

                                {attr.dataType === 'NUMBER' && (
                                  <div className="flex rounded-md border border-slate-200 bg-white overflow-hidden focus-within:border-orange-500">
                                    <input
                                      type="number"
                                      step="any"
                                      placeholder="Value"
                                      value={currentValue || ''}
                                      onChange={(e) => handleAttributeChange(attr.code, e.target.value)}
                                      className="flex-1 py-1.5 px-2.5 text-xs text-slate-800 font-mono focus:outline-none"
                                    />
                                    {attr.unit && (
                                      <span className="flex items-center px-2.5 bg-slate-100 text-[11px] font-bold text-slate-600 border-l border-slate-200">
                                        {attr.unit}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {attr.dataType === 'BOOLEAN' && (
                                  <div className="flex gap-2 pt-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleAttributeChange(attr.code, true)}
                                      className={`flex-1 rounded py-1 text-xs font-semibold transition ${
                                        currentValue === true
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                      }`}
                                    >
                                      Yes
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleAttributeChange(attr.code, false)}
                                      className={`flex-1 rounded py-1 text-xs font-semibold transition ${
                                        currentValue === false
                                          ? 'bg-slate-700 text-white shadow-xs'
                                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                      }`}
                                    >
                                      No
                                    </button>
                                  </div>
                                )}

                                {attr.dataType === 'TEXT' && (
                                  <input
                                    type="text"
                                    placeholder="Specification detail..."
                                    value={currentValue || ''}
                                    onChange={(e) => handleAttributeChange(attr.code, e.target.value)}
                                    className="w-full rounded-md border border-slate-200 bg-white py-1.5 px-2.5 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ==================================================== */}
              {/* SECTION 4 — CONTENT (Descriptions & Key Features)    */}
              {/* ==================================================== */}
              <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
                    4
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Content & Key Features
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Short Description (Card Summary)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Brief 1–2 sentence overview for catalog cards..."
                      value={content.shortDescription}
                      onChange={(e) => setContent({ ...content, shortDescription: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Full Product Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Complete architectural and technical description for product detail page..."
                      value={content.description}
                      onChange={(e) => setContent({ ...content, description: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Key Features List Manager */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Key Features List ({content.keyFeatures.length})
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Solid brass construction for long-term corrosion resistance..."
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                      className="flex-1 rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900"
                    >
                      Add Feature
                    </button>
                  </div>

                  <ul className="space-y-1.5 pt-1">
                    {content.keyFeatures.map((feat, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between rounded bg-white p-2 text-xs text-slate-700 border border-slate-200"
                      >
                        <span className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="text-slate-400 hover:text-rose-600 rounded p-0.5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* ==================================================== */}
              {/* SECTION 5 — MEDIA                                    */}
              {/* ==================================================== */}
              <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
                    5
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Product Media
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Primary Product Image URL
                  </label>
                  <div className="mt-1 flex gap-3 items-center">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={media.mainImage}
                      onChange={(e) => setMedia({ ...media, mainImage: e.target.value })}
                      className="flex-1 rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                    />
                    {media.mainImage && (
                      <img
                        src={media.mainImage}
                        alt="Preview"
                        className="h-9 w-9 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                    )}
                  </div>
                </div>

                {/* Additional Images */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Additional Gallery Images ({media.additionalImages.length})
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Additional image URL (e.g. unboxing, dimension diagram)..."
                      value={additionalImageInput}
                      onChange={(e) => setAdditionalImageInput(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddAdditionalImage}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900"
                    >
                      Add Image
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {media.additionalImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-lg border border-slate-200 bg-white p-1 shadow-2xs group"
                      >
                        <img
                          src={imgUrl}
                          alt="Gallery"
                          className="h-12 w-12 rounded object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveAdditionalImage(idx)}
                          className="absolute -top-1 -right-1 rounded-full bg-rose-600 text-white p-0.5 shadow-sm"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ==================================================== */}
              {/* SECTION 6 — WARRANTY & SUPPORT                       */}
              {/* ==================================================== */}
              <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
                    6
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Warranty & Support
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Warranty Period
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 10 Years Limited Warranty"
                      value={warranty.period}
                      onChange={(e) => setWarranty({ ...warranty, period: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Warranty Coverage Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cartridge leakage, surface tarnishing"
                      value={warranty.info}
                      onChange={(e) => setWarranty({ ...warranty, info: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Support / Service Partner
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AGECO Central Customer Care KSA"
                      value={warranty.supportInfo}
                      onChange={(e) => setWarranty({ ...warranty, supportInfo: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* ==================================================== */}
              {/* SECTION 7 — DOCUMENTS                                */}
              {/* ==================================================== */}
              <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
                    7
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Documents & Technical Downloads
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Document Title (e.g. Technical Datasheet, CAD BIM File)..."
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="url"
                      placeholder="Document URL (https://...)"
                      value={newDocUrl}
                      onChange={(e) => setNewDocUrl(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={newDocType}
                      onChange={(e) => setNewDocType(e.target.value as any)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                    >
                      <option value="DATASHEET">DATASHEET</option>
                      <option value="MANUAL">MANUAL</option>
                      <option value="CAD">CAD</option>
                      <option value="PDF">PDF</option>
                      <option value="WARRANTY">WARRANTY</option>
                      <option value="BROCHURE">BROCHURE</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddDocument}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {documents.length > 0 && (
                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-slate-50/50">
                    {documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 text-xs text-slate-700"
                      >
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-slate-200 px-1.5 py-0.2 text-[9px] font-bold text-slate-700">
                            {doc.type}
                          </span>
                          <span className="font-semibold">{doc.title}</span>
                          <span className="font-mono text-[10px] text-slate-400 truncate max-w-xs">
                            {doc.url}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(idx)}
                          className="text-slate-400 hover:text-rose-600 rounded p-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ==================================================== */}
              {/* SECTION 8 — PUBLISHING & STATUS                      */}
              {/* ==================================================== */}
              <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
                    8
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Publishing
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Publication Status
                    </label>
                    <select
                      value={publishing.status}
                      onChange={(e) =>
                        setPublishing({ ...publishing, status: e.target.value as any })
                      }
                      className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                    >
                      <option value="PUBLISHED">PUBLISHED (Live on Website & Search)</option>
                      <option value="DRAFT">DRAFT (Internal Review Only)</option>
                      <option value="ARCHIVED">ARCHIVED (Discontinued)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="featured-product-toggle"
                      checked={publishing.featured}
                      onChange={(e) =>
                        setPublishing({ ...publishing, featured: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                    />
                    <label
                      htmlFor="featured-product-toggle"
                      className="text-xs font-medium text-slate-700 cursor-pointer flex items-center gap-1.5"
                    >
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                      <span>Featured Product (Display in hero showcases & homepage carousels)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Bottom Actions */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-orange-500 px-5 py-2 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition shadow-sm"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : editingProduct
                    ? 'Update Product'
                    : 'Save & Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: VIEW PRODUCT DETAILS PRESENTATION             */}
      {/* ==================================================== */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 sticky top-0 bg-white">
              <div>
                <h3 className="text-base font-bold text-slate-900">{detailProduct.title}</h3>
                <span className="font-mono text-xs text-orange-600">{detailProduct.sku}</span>
              </div>
              <button
                onClick={() => setDetailProduct(null)}
                className="text-slate-400 hover:text-slate-600 rounded p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Image & Basic Meta */}
              <div className="flex gap-4 items-start">
                <img
                  src={detailProduct.mainImage}
                  alt={detailProduct.title}
                  className="h-28 w-28 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                />
                <div className="space-y-1.5 flex-1">
                  <p className="text-slate-600">
                    {detailProduct.shortDescription ||
                      detailProduct.description ||
                      detailProduct.technicalSummary ||
                      'No description.'}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                      {categories.find((c) => c.id === detailProduct.categoryId)?.name}
                    </span>
                    {detailProduct.subcategoryId && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        {subcategories.find((s) => s.id === detailProduct.subcategoryId)?.name}
                      </span>
                    )}
                    {detailProduct.brandId && (
                      <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-800">
                        {brands.find((b) => b.id === detailProduct.brandId)?.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Card Presentation Model Preview */}
              <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-orange-950 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-orange-600" />
                    Product Card Presentation (2–4 Top Attributes)
                  </span>
                  <span className="text-[10px] text-orange-700 font-semibold">Card Preview</span>
                </div>
                <div className="rounded-lg bg-white p-3 border border-orange-200 shadow-2xs">
                  <div className="text-xs font-bold text-slate-900">{detailProduct.title}</div>
                  <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-slate-600 font-medium">
                    {getProductCardAttributes(detailProduct).map((item, idx) => (
                      <span key={idx} className="flex items-center">
                        <span className="text-slate-800 font-semibold">{item}</span>
                        {idx < getProductCardAttributes(detailProduct).length - 1 && (
                          <span className="mx-1 text-slate-300">·</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Complete Structured Technical Specifications */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <span className="font-bold text-slate-800 block mb-2">
                  Complete Technical Specifications (Detail View)
                </span>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {Object.entries(detailProduct.specifications || {}).map(([k, v]) => (
                    <div key={k} className="border-b border-slate-200/60 pb-1">
                      <dt className="text-slate-500 text-[11px]">{k}</dt>
                      <dd className="font-mono text-slate-900 font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Key Features */}
              {detailProduct.keyFeatures && detailProduct.keyFeatures.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <span className="font-bold text-slate-800 block mb-2">Key Features</span>
                  <ul className="space-y-1">
                    {detailProduct.keyFeatures.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-700">
                        <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warranty & Support */}
              {detailProduct.warranty && (
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-start gap-2.5">
                  <Shield className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900">
                      {detailProduct.warranty.period || 'Standard Warranty'}
                    </div>
                    <p className="text-[11px] text-slate-500">{detailProduct.warranty.info}</p>
                    {detailProduct.warranty.supportInfo && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Support: {detailProduct.warranty.supportInfo}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setDetailProduct(null)}
                  className="rounded-lg bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
