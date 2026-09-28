import React, { useState, useEffect, useMemo } from 'react';
import {
  SlidersHorizontal,
  Plus,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Edit2,
  Trash2,
  Tag,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { api } from '../../config/api.ts';
import {
  ProductAttribute,
  AttributeDataType,
  Subcategory,
  ProductType,
  Category,
} from '../../types/index.ts';

const DATA_TYPES: { type: AttributeDataType; label: string; desc: string }[] = [
  { type: 'SELECT', label: 'Select (Single Value)', desc: 'One predefined value from a list' },
  { type: 'MULTI_SELECT', label: 'Multi-Select', desc: 'Multiple predefined values (e.g. smart platforms, spray modes)' },
  { type: 'DIMENSION', label: 'Dimension (Value + Unit)', desc: 'Numeric value with unit (mm, Litres)' },
  { type: 'NUMBER', label: 'Numeric Value', desc: 'Raw count or number (e.g. wattage, RPM, airflow)' },
  { type: 'BOOLEAN', label: 'Boolean (Yes/No)', desc: 'Binary toggle (e.g. Smart IoT, Underlight, Oscillation)' },
  { type: 'TEXT', label: 'Free Text', desc: 'Custom textual note (use sparingly)' },
];

const ATTRIBUTE_GROUPS = [
  'Basic',
  'Capacity & Storage',
  'Cooling Technology',
  'Cooling Performance',
  'Cooling & Airflow',
  'Compressor',
  'Compressor & Technology',
  'Energy',
  'Temperature Control',
  'Convertible Features',
  'Smart Features',
  'Smart Connectivity',
  'Water & Ice',
  'Water System',
  'Hygiene & Freshness',
  'Door & Physical Features',
  'Fan & Motor',
  'Air Direction',
  'Refrigerant',
  'Airflow & Air Quality',
  'Controls',
  'Installation',
  'Electrical',
  'Indoor Unit',
  'Outdoor Unit',
  'Noise',
  'Dimensions',
  'Dimensions & Sizing',
  'Safety',
  'Safety & Protection',
  'Physical Specifications',
  'Physical & Mobility',
  'Special Features',
  'Warranty',
  'Warranty & Support',
  'General',
  'Performance',
  'Smart & Control',
  'Aesthetics & Lighting',
  'Physical & Material',
  'Identification',
  'Material & Finish',
  'Mounting & Installation',
  'Operation & Control',
  'Functions & Features',
  'Smart & Electrical',
  'Plumbing Specs',
];

export const ProductAttributesView: React.FC = () => {
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedDataType, setSelectedDataType] = useState<string>('all');
  const [selectedCardFilter, setSelectedCardFilter] = useState<'all' | 'card' | 'detail'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<ProductAttribute | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form Fields
  const [formCategory, setFormCategory] = useState<string>('cat-c-home');
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDataType, setFormDataType] = useState<AttributeDataType>('SELECT');
  const [formUnit, setFormUnit] = useState('');
  const [formGroup, setFormGroup] = useState('General');
  const [formDescription, setFormDescription] = useState('');
  const [formAllowedValues, setFormAllowedValues] = useState<string[]>([]);
  const [valueInput, setValueInput] = useState('');
  const [formSubcategories, setFormSubcategories] = useState<string[]>([]);
  const [formProductTypes, setFormProductTypes] = useState<string[]>([]);
  const [formIsRequired, setFormIsRequired] = useState(false);
  const [formIsFilterable, setFormIsFilterable] = useState(true);
  const [formIsComparable, setFormIsComparable] = useState(true);
  const [formShowOnCard, setFormShowOnCard] = useState(false);
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, attrRes, subRes, typeRes] = await Promise.all([
        api.get<Category[]>('/catalogue/categories'),
        api.get<ProductAttribute[]>('/catalogue/attributes'),
        api.get<Subcategory[]>('/catalogue/subcategories'),
        api.get<ProductType[]>('/catalogue/product-types'),
      ]);
      if (catRes.success && catRes.data) setCategories(catRes.data);
      if (attrRes.success && attrRes.data) setAttributes(attrRes.data);
      if (subRes.success && subRes.data) setSubcategories(subRes.data);
      if (typeRes.success && typeRes.data) setProductTypes(typeRes.data);
    } catch (err) {
      console.error('Failed to load attributes data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingAttr(null);
    setFormName('');
    setFormCode('');
    setFormDataType('SELECT');
    setFormUnit('');
    setFormGroup('General');
    setFormDescription('');
    setFormAllowedValues([]);
    setValueInput('');
    const initialCategory = selectedCategory !== 'all' ? selectedCategory : 'cat-c-home';
    setFormCategory(initialCategory);
    const validSubs = subcategories.filter((s) => s.categoryId === initialCategory);
    setFormSubcategories(validSubs.length > 0 ? [validSubs[0].id] : []);
    setFormProductTypes([]);
    setFormIsRequired(false);
    setFormIsFilterable(true);
    setFormIsComparable(true);
    setFormShowOnCard(false);
    setFormStatus('ACTIVE');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (attr: ProductAttribute) => {
    setEditingAttr(attr);
    setFormName(attr.name);
    setFormCode(attr.code);
    setFormDataType(attr.dataType);
    setFormUnit(attr.unit || '');
    setFormGroup(attr.group || 'General');
    setFormDescription(attr.description || '');
    setFormAllowedValues(attr.allowedValues || []);
    setValueInput('');
    setFormCategory(attr.applicableCategoryIds[0] || 'cat-c-home');
    setFormSubcategories(attr.applicableSubcategoryIds || []);
    setFormProductTypes(attr.applicableProductTypeIds || []);
    setFormIsRequired(attr.isRequired);
    setFormIsFilterable(attr.isFilterable);
    setFormIsComparable(attr.isComparable);
    setFormShowOnCard(attr.showOnCard);
    setFormStatus(attr.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAddAllowedValue = () => {
    const val = valueInput.trim();
    if (!val) return;
    if (formAllowedValues.includes(val)) {
      setFormError(`Value '${val}' is already in the list.`);
      return;
    }
    setFormAllowedValues([...formAllowedValues, val]);
    setValueInput('');
    setFormError(null);
  };

  const handleRemoveAllowedValue = (index: number) => {
    setFormAllowedValues(formAllowedValues.filter((_, i) => i !== index));
  };

  const toggleSubcategoryInForm = (subcatId: string) => {
    if (formSubcategories.includes(subcatId)) {
      setFormSubcategories(formSubcategories.filter((id) => id !== subcatId));
    } else {
      setFormSubcategories([...formSubcategories, subcatId]);
    }
  };

  const handleSaveAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      setFormError('Attribute Name and Code are required.');
      return;
    }

    if ((formDataType === 'SELECT' || formDataType === 'MULTI_SELECT') && formAllowedValues.length === 0) {
      setFormError('Predefined values are required for Select and Multi-Select attributes.');
      return;
    }

    if (formSubcategories.length === 0) {
      setFormError('Select at least one applicable product family.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      name: formName.trim(),
      code: formCode.trim().toUpperCase(),
      dataType: formDataType,
      unit: formDataType === 'DIMENSION' || formDataType === 'NUMBER' ? formUnit.trim() || undefined : undefined,
      allowedValues: formDataType === 'SELECT' || formDataType === 'MULTI_SELECT' ? formAllowedValues : undefined,
      applicableCategoryIds: [formCategory],
      applicableSubcategoryIds: formSubcategories,
      applicableProductTypeIds: formProductTypes.length > 0 ? formProductTypes : undefined,
      isRequired: formIsRequired,
      isFilterable: formIsFilterable,
      isComparable: formIsComparable,
      showOnCard: formShowOnCard,
      status: formStatus,
      group: formGroup,
      description: formDescription.trim(),
    };

    try {
      if (editingAttr) {
        const res = await api.put<ProductAttribute>(`/catalogue/attributes/${editingAttr.id}`, payload);
        if (res.success && res.data) {
          setAttributes((prev) => prev.map((a) => (a.id === editingAttr.id ? res.data! : a)));
          setIsModalOpen(false);
          showNotification(`Updated attribute '${res.data.name}'`);
        } else {
          setFormError(res.error?.message || 'Failed to update attribute.');
        }
      } else {
        const res = await api.post<ProductAttribute>('/catalogue/attributes', payload);
        if (res.success && res.data) {
          setAttributes((prev) => [res.data!, ...prev]);
          setIsModalOpen(false);
          showNotification(`Created attribute '${res.data.name}'`);
        } else {
          setFormError(res.error?.message || 'Failed to create attribute.');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (attr: ProductAttribute) => {
    const newStatus = attr.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await api.patch<ProductAttribute>(`/catalogue/attributes/${attr.id}/status`, {
        status: newStatus,
      });
      if (res.success && res.data) {
        setAttributes((prev) => prev.map((a) => (a.id === attr.id ? { ...a, status: newStatus } : a)));
        showNotification(`Attribute '${attr.name}' is now ${newStatus}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCardDisplay = async (attr: ProductAttribute) => {
    try {
      const res = await api.put<ProductAttribute>(`/catalogue/attributes/${attr.id}`, {
        showOnCard: !attr.showOnCard,
      });
      if (res.success && res.data) {
        setAttributes((prev) =>
          prev.map((a) => (a.id === attr.id ? { ...a, showOnCard: !attr.showOnCard } : a))
        );
        showNotification(
          `Card display for '${attr.name}' ${!attr.showOnCard ? 'enabled' : 'disabled'}`
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAttribute = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to remove attribute '${code}'?`)) {
      return;
    }
    try {
      const res = await api.delete(`/catalogue/attributes/${id}`);
      if (res.success) {
        setAttributes((prev) => prev.filter((a) => a.id !== id));
        showNotification(`Attribute ${code} removed.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered List
  const filteredAttributes = useMemo(() => {
    return attributes.filter((a) => {
      const matchesSearch =
        searchQuery === '' ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.group && a.group.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.allowedValues && a.allowedValues.some((v) => v.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesCategory =
        selectedCategory === 'all' ||
        a.applicableCategoryIds.includes(selectedCategory);

      const matchesSubcat =
        selectedSubcategory === 'all' ||
        a.applicableSubcategoryIds.includes(selectedSubcategory);

      const matchesType =
        selectedDataType === 'all' || a.dataType === selectedDataType;

      const matchesCard =
        selectedCardFilter === 'all' ||
        (selectedCardFilter === 'card' && a.showOnCard) ||
        (selectedCardFilter === 'detail' && !a.showOnCard);

      const matchesStatus =
        selectedStatus === 'all' || a.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesSubcat && matchesType && matchesCard && matchesStatus;
    });
  }, [attributes, searchQuery, selectedCategory, selectedSubcategory, selectedDataType, selectedCardFilter, selectedStatus]);

  // Statistics
  const totalCount = attributes.length;
  const cardVisibleCount = attributes.filter((a) => a.showOnCard).length;
  const activeCount = attributes.filter((a) => a.status === 'ACTIVE').length;
  const filterableCount = attributes.filter((a) => a.isFilterable).length;

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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Bathroom Solutions Attributes
            </h1>
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold text-orange-800">
              Bathroom Only
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Define structured technical specifications, allowed values, product family applicability, and card-display rules.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Create Attribute</span>
        </button>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Attributes</span>
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">{totalCount}</p>
          <span className="text-[10px] text-slate-400">Standardized specs</span>
        </div>

        <div className="rounded-xl border border-orange-200/80 bg-orange-50/50 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-orange-800">Card Display</span>
            <Eye className="h-4 w-4 text-orange-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-orange-950">{cardVisibleCount}</p>
          <span className="text-[10px] text-orange-700">2–4 key attributes for card preview</span>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Filterable</span>
            <Filter className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">{filterableCount}</p>
          <span className="text-[10px] text-slate-400">Available in customer facet filters</span>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Status</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">{activeCount}</p>
          <span className="text-[10px] text-slate-400">Published to catalogue</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-4 sm:flex-row sm:items-center shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search attributes by name, code, allowed values..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubcategory('all');
            }}
            className="rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-700 focus:border-orange-500 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="cat-c-home">Home Appliances</option>
            <option value="cat-c-bath">Bathroom Solutions</option>
          </select>

          {/* Subcategory / Product Family Filter */}
          <select
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-700 focus:border-orange-500 focus:outline-none"
          >
            <option value="all">
              {selectedCategory === 'cat-c-home'
                ? 'All Home Appliance Families'
                : selectedCategory === 'cat-c-bath'
                ? 'All Bath Families (11)'
                : 'All Product Families'}
            </option>
            {(selectedCategory === 'all'
              ? subcategories.filter((s) => ['cat-c-home', 'cat-c-bath'].includes(s.categoryId))
              : subcategories.filter((s) => s.categoryId === selectedCategory)
            ).map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>

          {/* Data Type Filter */}
          <select
            value={selectedDataType}
            onChange={(e) => setSelectedDataType(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-700 focus:border-orange-500 focus:outline-none"
          >
            <option value="all">All Data Types</option>
            {DATA_TYPES.map((dt) => (
              <option key={dt.type} value={dt.type}>
                {dt.type}
              </option>
            ))}
          </select>

          {/* Card Display Filter */}
          <select
            value={selectedCardFilter}
            onChange={(e) => setSelectedCardFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-700 focus:border-orange-500 focus:outline-none"
          >
            <option value="all">All Display Levels</option>
            <option value="card">Card Visible Only</option>
            <option value="detail">Detail Only</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-700 focus:border-orange-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Attributes Table */}
      <div className="rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-600">
              <tr>
                <th className="py-3 px-4">Attribute</th>
                <th className="py-3 px-4">Data Type</th>
                <th className="py-3 px-4">Applicable Family</th>
                <th className="py-3 px-4 text-center">Required</th>
                <th className="py-3 px-4 text-center">Filterable</th>
                <th className="py-3 px-4 text-center">Comparable</th>
                <th className="py-3 px-4 text-center">Card Display</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    Loading attributes library...
                  </td>
                </tr>
              ) : filteredAttributes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No product attributes found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredAttributes.map((attr) => {
                  const familyNames = (attr.applicableSubcategoryIds || [])
                    .map((id) => subcategories.find((s) => s.id === id)?.name || id)
                    .slice(0, 2);
                  const moreCount = (attr.applicableSubcategoryIds || []).length - familyNames.length;

                  return (
                    <tr key={attr.id} className="hover:bg-slate-50/50 transition">
                      {/* Name & Code */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{attr.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-500">{attr.code}</span>
                          {attr.group && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] text-slate-600 font-medium">
                              {attr.group}
                            </span>
                          )}
                          {attr.conditionalRule && (
                            <span
                              className="rounded bg-sky-100 px-1.5 py-0.2 text-[9px] text-sky-800 font-semibold"
                              title={`Conditional rule: depends on ${attr.conditionalRule.dependsOnCode}`}
                            >
                              Conditional
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Data Type & Allowed Values Count / Unit */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            {attr.dataType}
                          </span>
                          {attr.unit && (
                            <span className="font-mono text-[10px] text-orange-600 font-bold">
                              ({attr.unit})
                            </span>
                          )}
                        </div>
                        {attr.allowedValues && attr.allowedValues.length > 0 && (
                          <div className="mt-1 text-[10px] text-slate-500 truncate max-w-[200px]" title={attr.allowedValues.join(', ')}>
                            {attr.allowedValues.length} values: {attr.allowedValues.slice(0, 3).join(', ')}...
                          </div>
                        )}
                      </td>

                      {/* Applicable Family */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 max-w-[220px]">
                          <div className="flex flex-wrap gap-1">
                            {attr.applicableCategoryIds.map((catId) => (
                              <span
                                key={catId}
                                className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                  catId === 'cat-c-home'
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-indigo-100 text-indigo-900'
                                }`}
                              >
                                {catId === 'cat-c-home'
                                  ? 'Home Appliances'
                                  : catId === 'cat-c-bath'
                                  ? 'Bathroom Solutions'
                                  : catId}
                              </span>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {familyNames.map((fn, idx) => (
                              <span
                                key={idx}
                                className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700"
                              >
                                {fn}
                              </span>
                            ))}
                            {moreCount > 0 && (
                              <span className="rounded bg-slate-200/70 px-1.5 py-0.5 text-[10px] text-slate-600 font-medium">
                                +{moreCount} more
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Required */}
                      <td className="py-3 px-4 text-center">
                        {attr.isRequired ? (
                          <span className="inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                            Required
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Optional</span>
                        )}
                      </td>

                      {/* Filterable */}
                      <td className="py-3 px-4 text-center">
                        {attr.isFilterable ? (
                          <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Comparable */}
                      <td className="py-3 px-4 text-center">
                        {attr.isComparable ? (
                          <Check className="h-4 w-4 text-sky-500 mx-auto" />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Card Display Rule */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleCardDisplay(attr)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition ${
                            attr.showOnCard
                              ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                          title="Click to toggle card display rule"
                        >
                          <Eye className="h-3 w-3" />
                          <span>{attr.showOnCard ? 'Card Visible' : 'Detail Only'}</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(attr)}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition ${
                            attr.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              attr.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{attr.status}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(attr)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                            title="Edit Attribute"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAttribute(attr.id, attr.code)}
                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Delete Attribute"
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

      {/* Modal: Create or Edit Attribute */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingAttr ? `Edit Attribute: ${editingAttr.code}` : 'Create Product Attribute'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  Standardized Bathroom Solutions specification definition.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
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

            <form onSubmit={handleSaveAttribute} className="mt-4 space-y-4">
              {/* Row 1: Name and Code */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Attribute Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Spout Reach, Mounting"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (!editingAttr && !formCode) {
                        setFormCode(
                          e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]+/g, '_')
                            .replace(/(^_|_$)/g, '')
                        );
                      }
                    }}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Attribute Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SPOUT_REACH, MOUNTING"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 font-mono focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Data Type and Unit */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Data Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formDataType}
                    onChange={(e) => setFormDataType(e.target.value as AttributeDataType)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                  >
                    {DATA_TYPES.map((dt) => (
                      <option key={dt.type} value={dt.type}>
                        {dt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Unit {formDataType === 'DIMENSION' && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. mm, Litres, ml"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    disabled={formDataType !== 'DIMENSION' && formDataType !== 'NUMBER'}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 font-mono focus:border-orange-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>

              {/* Row 3: Predefined Allowed Values (for SELECT and MULTI_SELECT) */}
              {(formDataType === 'SELECT' || formDataType === 'MULTI_SELECT') && (
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Allowed Values ({formAllowedValues.length})
                    </label>
                    <span className="text-[10px] text-slate-500">
                      Controlled options for {formDataType}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add an allowed option (e.g. Chrome, Wall Mounted)..."
                      value={valueInput}
                      onChange={(e) => setValueInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAllowedValue();
                        }
                      }}
                      className="flex-1 rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddAllowedValue}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1 max-h-28 overflow-y-auto">
                    {formAllowedValues.map((val, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-medium text-slate-700 border border-slate-200 shadow-xs"
                      >
                        {val}
                        <button
                          type="button"
                          onClick={() => handleRemoveAllowedValue(idx)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Row 4: Group & Description */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Specification Group</label>
                  <select
                    value={formGroup}
                    onChange={(e) => setFormGroup(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                  >
                    {ATTRIBUTE_GROUPS.map((grp) => (
                      <option key={grp} value={grp}>
                        {grp}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Description / Technical Note</label>
                  <input
                    type="text"
                    placeholder="Short guideline for content creators"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 5: Category & Product Family Applicability */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Applicable Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setFormCategory(newCat);
                      const validSubs = subcategories.filter((s) => s.categoryId === newCat);
                      setFormSubcategories(validSubs.length > 0 ? [validSubs[0].id] : []);
                    }}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="cat-c-home">Home Appliances (Fans)</option>
                    <option value="cat-c-bath">Bathroom Solutions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Applicable Product Families (Subcategories) <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-36 overflow-y-auto rounded-lg border border-slate-200 p-2.5 bg-slate-50/50">
                    {subcategories
                      .filter((s) => s.categoryId === formCategory)
                      .map((sub) => {
                        const isChecked = formSubcategories.includes(sub.id);
                        return (
                          <label
                            key={sub.id}
                            className={`flex items-center gap-2 rounded p-1.5 text-[11px] cursor-pointer transition ${
                              isChecked ? 'bg-orange-50 text-orange-950 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSubcategoryInForm(sub.id)}
                              className="h-3.5 w-3.5 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                            />
                            <span className="truncate">{sub.name}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Row 6: Toggles & Visibility Flags */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-lg border border-slate-200 p-3 bg-slate-50/60">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsRequired}
                    onChange={(e) => setFormIsRequired(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-800">Required</div>
                    <div className="text-[10px] text-slate-400">Must be set in product</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsFilterable}
                    onChange={(e) => setFormIsFilterable(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-800">Filterable</div>
                    <div className="text-[10px] text-slate-400">Sidebar facet filter</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsComparable}
                    onChange={(e) => setFormIsComparable(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-800">Comparable</div>
                    <div className="text-[10px] text-slate-400">Comparison table</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-orange-100/60 p-1.5 rounded-lg border border-orange-200/80">
                  <input
                    type="checkbox"
                    checked={formShowOnCard}
                    onChange={(e) => setFormShowOnCard(e.target.checked)}
                    className="h-4 w-4 rounded border-orange-400 text-orange-600 focus:ring-orange-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-orange-900">Card Display</div>
                    <div className="text-[10px] text-orange-700">Top 2–4 card preview</div>
                  </div>
                </label>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Status:</span>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="rounded border border-slate-200 bg-white py-1 px-2 text-xs font-semibold text-slate-800 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : editingAttr ? 'Update Attribute' : 'Save Attribute'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
