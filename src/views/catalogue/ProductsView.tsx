import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  X,
  RefreshCw,
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
    specKeys: ['Rated Voltage', 'Rated Current'],
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
      sku: `AG-${Math.floor(100 + Math.random() * 900)}`,
      title: '',
      brandId: brands[0]?.id || '',
      categoryId: categories[0]?.id || '',
      subcategoryId: '',
      audienceId: audiences[0]?.id || '',
      productTypeId: productTypes[0]?.id || '',
      shortDescription: '',
      technicalSummary: '',
      voltageRating: '11 kV',
      currentRating: '630 A',
      ipRating: 'IP4X',
      featured: false,
      status: 'PUBLISHED',
      mainImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=600',
      specKeys: ['Voltage', 'Current'],
      specVals: ['11 kV', '630 A'],
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    const keys = Object.keys(p.specifications || {});
    const vals = Object.values(p.specifications || {});
    setFormData({
      sku: p.sku,
      title: p.title,
      brandId: p.brandId,
      categoryId: p.categoryId,
      subcategoryId: p.subcategoryId || '',
      audienceId: p.audienceId || '',
      productTypeId: p.productTypeId || '',
      shortDescription: p.shortDescription || '',
      technicalSummary: p.technicalSummary || '',
      voltageRating: p.voltageRating || '',
      currentRating: p.currentRating || '',
      ipRating: p.ipRating || '',
      featured: p.featured,
      status: p.status,
      mainImage: p.mainImage,
      specKeys: keys.length ? keys : ['Voltage', 'Current'],
      specVals: vals.length ? vals : ['', ''],
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const specs: Record<string, string> = {};
    formData.specKeys.forEach((k, idx) => {
      if (k.trim() && formData.specVals[idx]?.trim()) {
        specs[k.trim()] = formData.specVals[idx].trim();
      }
    });

    const payload = {
      sku: formData.sku,
      title: formData.title,
      brandId: formData.brandId || brands[0]?.id,
      categoryId: formData.categoryId || categories[0]?.id,
      subcategoryId: formData.subcategoryId || undefined,
      audienceId: formData.audienceId || undefined,
      productTypeId: formData.productTypeId || undefined,
      shortDescription: formData.shortDescription,
      technicalSummary: formData.technicalSummary,
      voltageRating: formData.voltageRating,
      currentRating: formData.currentRating,
      ipRating: formData.ipRating,
      featured: formData.featured,
      status: formData.status,
      mainImage: formData.mainImage,
      specifications: specs,
    };

    try {
      if (editingProduct) {
        const res = await api.put<Product>(`/catalogue/products/${editingProduct.id}`, payload);
        if (res.success && res.data) {
          setProducts(products.map((p) => (p.id === editingProduct.id ? res.data! : p)));
          setIsModalOpen(false);
        } else {
          setFormError(res.error?.message || 'Failed to update product.');
        }
      } else {
        const res = await api.post<Product>('/catalogue/products', payload);
        if (res.success && res.data) {
          setProducts([res.data, ...products]);
          setIsModalOpen(false);
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

  const handleDeleteProduct = async (id: string, sku: string) => {
    if (!window.confirm(`Are you sure you want to delete product ${sku}?`)) {
      return;
    }
    try {
      const res = await api.delete(`/catalogue/products/${id}`);
      if (res.success) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        alert(res.error?.message || 'Failed to delete product.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.voltageRating && p.voltageRating.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCat = selectedCategory ? p.categoryId === selectedCategory : true;
    const matchesBrand = selectedBrand ? p.brandId === selectedBrand : true;
    const matchesStatus = selectedStatus ? p.status === selectedStatus : true;

    return matchesSearch && matchesCat && matchesBrand && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Products
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Manage product catalogue and inventory.
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
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-4 sm:flex-row sm:items-center shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-orange-500 focus:outline-none"
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
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-orange-500 focus:outline-none"
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
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-orange-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 pl-4 pr-3">Product / SKU</th>
                <th className="py-3 px-3">Category & Brand</th>
                <th className="py-3 px-3">Specs</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Updated</th>
                <th className="py-3 pl-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-orange-500" />
                      <span>Loading products...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const brand = brands.find((b) => b.id === product.brandId);
                  const category = categories.find((c) => c.id === product.categoryId);

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 pl-4 pr-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.mainImage}
                            alt={product.title}
                            className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 line-clamp-1">
                              {product.title}
                            </div>
                            <div className="font-mono text-[11px] text-orange-600">
                              {product.sku}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-medium text-slate-800">
                          {category?.name || 'General'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {brand?.name || '—'}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono text-[11px]">
                        {product.voltageRating && (
                          <span className="mr-1.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">
                            {product.voltageRating}
                          </span>
                        )}
                        {product.currentRating && (
                          <span className="inline-block rounded bg-orange-50 px-1.5 py-0.5 text-orange-700">
                            {product.currentRating}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            product.status === 'PUBLISHED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : product.status === 'DRAFT'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-[11px] text-slate-500">
                        {new Date(product.updatedAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 pl-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailProduct(product)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(product)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-orange-50 hover:text-orange-600 transition"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.sku)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Delete"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                {editingProduct ? `Edit Product: ${editingProduct.sku}` : 'Add Product'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">SKU</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 font-mono focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Brand</label>
                  <select
                    value={formData.brandId}
                    onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
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
                  <label className="block text-xs font-semibold text-slate-700">Voltage</label>
                  <input
                    type="text"
                    placeholder="e.g. 11 kV"
                    value={formData.voltageRating}
                    onChange={(e) => setFormData({ ...formData, voltageRating: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 font-mono focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Current</label>
                  <input
                    type="text"
                    placeholder="e.g. 630 A"
                    value={formData.currentRating}
                    onChange={(e) => setFormData({ ...formData, currentRating: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 font-mono focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">IP Rating</label>
                  <input
                    type="text"
                    placeholder="e.g. IP54"
                    value={formData.ipRating}
                    onChange={(e) => setFormData({ ...formData, ipRating: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 font-mono focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
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
                    className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                  />
                  <label htmlFor="featured-toggle" className="text-xs font-medium text-slate-700">
                    Featured Product
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
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
                  {isSubmitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Product Details */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {detailProduct.title}
                </h3>
                <span className="font-mono text-xs text-orange-600">{detailProduct.sku}</span>
              </div>
              <button
                onClick={() => setDetailProduct(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <p className="text-slate-600">{detailProduct.shortDescription || detailProduct.technicalSummary || 'No description provided.'}</p>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <span className="font-semibold text-slate-800">Specifications:</span>
                <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(detailProduct.specifications || {}).map(([k, v]) => (
                    <div key={k} className="border-b border-slate-200/60 pb-1">
                      <dt className="text-slate-500">{k}</dt>
                      <dd className="font-mono text-slate-800">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setDetailProduct(null)}
                  className="rounded-lg bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
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
