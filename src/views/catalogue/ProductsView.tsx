import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Zap,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../config/api.ts';
import { Product, Brand, Category, Subcategory, Audience, ProductType } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const ProductsView: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    sku: '',
    title: '',
    brandId: '',
    categoryId: '',
    subcategoryId: '',
    audienceId: '',
    productTypeId: '',
    shortDescription: '',
    technicalSummary: '',
    voltageRating: '',
    currentRating: '',
    ipRating: '',
    featured: false,
    status: 'PUBLISHED' as Product['status'],
    mainImage: '',
    specKeys: ['Rated Voltage', 'Rated Normal Current'],
    specVals: ['36 kV', '1250 A'],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, brandRes, catRes, subcatRes, audRes, typeRes] = await Promise.all([
        api.get<Product[]>('/catalogue/products'),
        api.get<Brand[]>('/catalogue/brands'),
        api.get<Category[]>('/catalogue/categories'),
        api.get<Subcategory[]>('/catalogue/subcategories'),
        api.get<Audience[]>('/catalogue/audiences'),
        api.get<ProductType[]>('/catalogue/product-types'),
      ]);

      if (prodRes.success && prodRes.data) setProducts(prodRes.data);
      if (brandRes.success && brandRes.data) setBrands(brandRes.data);
      if (catRes.success && catRes.data) setCategories(catRes.data);
      if (subcatRes.success && subcatRes.data) setSubcategories(subcatRes.data);
      if (audRes.success && audRes.data) setAudiences(audRes.data);
      if (typeRes.success && typeRes.data) setProductTypes(typeRes.data);
    } catch (err) {
      console.error('Failed to load catalogue data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      sku: `AG-MV-${Math.floor(100 + Math.random() * 900)}`,
      title: '',
      brandId: brands[0]?.id || '',
      categoryId: categories[0]?.id || '',
      subcategoryId: subcategories[0]?.id || '',
      audienceId: audiences[0]?.id || '',
      productTypeId: productTypes[0]?.id || '',
      shortDescription: '',
      technicalSummary: '',
      voltageRating: '36 kV',
      currentRating: '1250 A',
      ipRating: 'IP54',
      featured: false,
      status: 'PUBLISHED',
      mainImage: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80',
      specKeys: ['Standard', 'Breaking Capacity'],
      specVals: ['IEC 62271-100', '31.5 kA'],
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    const keys = Object.keys(product.specifications || {});
    const vals = Object.values(product.specifications || {});
    setFormData({
      sku: product.sku,
      title: product.title,
      brandId: product.brandId,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId || '',
      audienceId: product.audienceId || '',
      productTypeId: product.productTypeId || '',
      shortDescription: product.shortDescription,
      technicalSummary: product.technicalSummary,
      voltageRating: product.voltageRating || '',
      currentRating: product.currentRating || '',
      ipRating: product.ipRating || '',
      featured: product.featured,
      status: product.status,
      mainImage: product.mainImage,
      specKeys: keys.length > 0 ? keys : ['Standard'],
      specVals: vals.length > 0 ? vals : ['IEC 62271'],
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sku || !formData.title || !formData.categoryId || !formData.brandId) {
      setFormError('SKU, Title, Category, and Brand are mandatory fields.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const specifications: Record<string, string> = {};
    formData.specKeys.forEach((key, idx) => {
      if (key.trim()) {
        specifications[key.trim()] = formData.specVals[idx] || '';
      }
    });

    const payload = {
      sku: formData.sku,
      title: formData.title,
      brandId: formData.brandId,
      categoryId: formData.categoryId,
      subcategoryId: formData.subcategoryId,
      audienceId: formData.audienceId,
      productTypeId: formData.productTypeId,
      shortDescription: formData.shortDescription,
      technicalSummary: formData.technicalSummary,
      voltageRating: formData.voltageRating,
      currentRating: formData.currentRating,
      ipRating: formData.ipRating,
      featured: formData.featured,
      status: formData.status,
      mainImage: formData.mainImage,
      specifications,
      standardCertifications: ['IEC Standards', 'ISO 9001:2015'],
      documents: editingProduct?.documents || [
        { title: 'Technical Datasheet PDF', url: '/docs/spec.pdf', type: 'PDF' as const },
      ],
    };

    try {
      if (editingProduct) {
        const res = await api.put<Product>(`/catalogue/products/${editingProduct.id}`, payload);
        if (res.success && res.data) {
          setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? res.data! : p)));
          setIsModalOpen(false);
        } else {
          setFormError(res.error?.message || 'Failed to update product');
        }
      } else {
        const res = await api.post<Product>('/catalogue/products', payload);
        if (res.success && res.data) {
          setProducts((prev) => [res.data!, ...prev]);
          setIsModalOpen(false);
        } else {
          setFormError(res.error?.message || 'Failed to create product');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'API connection failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, sku: string) => {
    if (!window.confirm(`Are you sure you want to remove product ${sku} from the AGECO catalogue?`)) {
      return;
    }

    try {
      const res = await api.delete(`/catalogue/products/${id}`);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete product', err);
    }
  };

  // Filtered product listing
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    const matchesBrand = !selectedBrand || p.brandId === selectedBrand;
    const matchesStatus = !selectedStatus || p.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesBrand && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
            Product Catalogue & Equipment
          </h1>
          <p className="text-xs text-slate-400">
            Authoritative inventory of medium/low voltage switchgear, transformers, and SCADA panels
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Product Item</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-[#0c121e]/90 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by SKU, product name, or rating..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-900/90 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs text-slate-300 focus:border-amber-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Brand filter */}
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs text-slate-300 focus:border-amber-500 focus:outline-none"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs text-slate-300 focus:border-amber-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0c121e]/90 shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/60 font-mono text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 pl-4 pr-3">Product / SKU</th>
                <th className="py-3 px-3">Category & Brand</th>
                <th className="py-3 px-3">Technical Ratings</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Last Modified</th>
                <th className="py-3 pl-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No equipment found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const brand = brands.find((b) => b.id === product.brandId);
                  const category = categories.find((c) => c.id === product.categoryId);

                  return (
                    <tr key={product.id} className="hover:bg-slate-850/50 transition">
                      <td className="py-3 pl-4 pr-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.mainImage}
                            alt={product.title}
                            className="h-10 w-10 shrink-0 rounded border border-slate-700 object-cover"
                          />
                          <div>
                            <div className="font-semibold text-white line-clamp-1">
                              {product.title}
                            </div>
                            <div className="font-mono text-[11px] text-amber-400">
                              {product.sku}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-200">
                          {category?.name || 'General Category'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {brand?.name || 'Proprietary'}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px]">
                        {product.voltageRating && (
                          <span className="mr-2 inline-block rounded bg-slate-800 px-1.5 py-0.5 text-cyan-300">
                            {product.voltageRating}
                          </span>
                        )}
                        {product.currentRating && (
                          <span className="inline-block rounded bg-slate-800 px-1.5 py-0.5 text-amber-300">
                            {product.currentRating}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider ${
                            product.status === 'PUBLISHED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : product.status === 'DRAFT'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-700/40 text-slate-400 border border-slate-600'
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {product.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                        {new Date(product.updatedAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 pl-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailProduct(product)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                            title="Inspect Technical Specs"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(product)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-amber-400"
                            title="Edit Product"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.sku)}
                            className="rounded p-1 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400"
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Modal: Create or Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-xl border border-slate-800 bg-[#0e1525] p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="font-heading text-base font-bold text-white">
                {editingProduct ? `Edit Equipment: ${editingProduct.sku}` : 'Add New Equipment Item'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 rounded-md border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">Title / Name</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">Brand / OEM</label>
                  <select
                    value={formData.brandId}
                    onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                    className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Voltage Rating</label>
                  <input
                    type="text"
                    placeholder="e.g. 36 kV"
                    value={formData.voltageRating}
                    onChange={(e) => setFormData({ ...formData, voltageRating: e.target.value })}
                    className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Current Rating</label>
                  <input
                    type="text"
                    placeholder="e.g. 1250 A"
                    value={formData.currentRating}
                    onChange={(e) => setFormData({ ...formData, currentRating: e.target.value })}
                    className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300">IP Ingress Rating</label>
                  <input
                    type="text"
                    placeholder="e.g. IP54"
                    value={formData.ipRating}
                    onChange={(e) => setFormData({ ...formData, ipRating: e.target.value })}
                    className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Short Description</label>
                <textarea
                  rows={2}
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Technical Summary</label>
                <textarea
                  rows={3}
                  value={formData.technicalSummary}
                  onChange={(e) => setFormData({ ...formData, technicalSummary: e.target.value })}
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Publication Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white focus:border-amber-500"
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="featured-toggle"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500"
                  />
                  <label htmlFor="featured-toggle" className="text-xs font-medium text-slate-300">
                    Feature on Main Website Showcase
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded bg-amber-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  {isSubmitting ? 'Syncing with ADP Backend...' : 'Save Product Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Full Details */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-xl border border-slate-800 bg-[#0e1525] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-heading text-base font-bold text-white">
                  {detailProduct.title}
                </h3>
                <span className="font-mono text-xs text-amber-400">{detailProduct.sku}</span>
              </div>
              <button
                onClick={() => setDetailProduct(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <p className="text-slate-300">{detailProduct.technicalSummary}</p>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <span className="font-semibold text-slate-200">Technical Specifications:</span>
                <dl className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                  {Object.entries(detailProduct.specifications || {}).map(([k, v]) => (
                    <div key={k} className="border-b border-slate-800/80 pb-1">
                      <dt className="text-slate-500">{k}</dt>
                      <dd className="font-mono text-slate-200">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Certifications:</span>
                {detailProduct.standardCertifications?.map((c, i) => (
                  <span
                    key={i}
                    className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-emerald-300"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
