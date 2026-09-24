import React, { useState, useEffect } from 'react';
import {
  Plus,
  ExternalLink,
  CheckCircle2,
  X,
  Search,
  Users,
  Briefcase,
  Trash2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../../config/api.ts';
import { Brand } from '../../types/index.ts';

export const BrandsView: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAudience, setSelectedAudience] = useState<
    'all' | 'consumer' | 'professional'
  >('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [tier, setTier] = useState<Brand['tier']>('PARTNER');
  const [audienceType, setAudienceType] = useState<
    'CONSUMER' | 'PROFESSIONAL' | 'BOTH'
  >('CONSUMER');
  const [website, setWebsite] = useState('');
  const [desc, setDesc] = useState('');

  // Delete state
  const [deletingBrandId, setDeletingBrandId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await api.get<Brand[]>('/catalogue/brands');
      if (res.success && res.data) setBrands(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    try {
      const res = await api.post<Brand>('/catalogue/brands', {
        name,
        code: code.toUpperCase(),
        tier,
        audienceType,
        website,
        description: desc,
        logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&auto=format&fit=crop&q=60',
        active: true,
      });
      if (res.success && res.data) {
        setBrands((prev) => [...prev, res.data!]);
        setIsModalOpen(false);
        setName('');
        setCode('');
        setWebsite('');
        setDesc('');
        setAudienceType('CONSUMER');
        showNotification(`Brand "${res.data.name}" added successfully.`);
      }
    } catch (err) {
      console.error('Failed to create brand', err);
    }
  };

  const handleDelete = async (brand: Brand) => {
    if (!window.confirm(`Are you sure you want to remove ${brand.name}?`)) return;

    try {
      setDeletingBrandId(brand.id);
      const res = await api.delete(`/catalogue/brands/${brand.id}`);
      if (res.success) {
        setBrands((prev) => prev.filter((b) => b.id !== brand.id));
        showNotification(`Brand "${brand.name}" removed successfully.`);
      }
    } catch (err) {
      console.error('Failed to delete brand', err);
    } finally {
      setDeletingBrandId(null);
    }
  };

  const isConsumerBrand = (b: Brand) =>
    b.audienceType === 'CONSUMER' ||
    b.audienceType === 'BOTH' ||
    b.audiences?.includes('aud-consumer');

  const isProfessionalBrand = (b: Brand) =>
    b.audienceType === 'PROFESSIONAL' ||
    b.audienceType === 'BOTH' ||
    b.audiences?.includes('aud-professional');

  const consumerBrands = brands.filter(isConsumerBrand);
  const professionalBrands = brands.filter(isProfessionalBrand);

  const filteredBrands = brands.filter((brand) => {
    if (selectedAudience === 'consumer' && !isConsumerBrand(brand)) return false;
    if (selectedAudience === 'professional' && !isProfessionalBrand(brand)) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = brand.name.toLowerCase().includes(q);
      const matchCode = brand.code.toLowerCase().includes(q);
      const matchDesc = brand.description?.toLowerCase().includes(q);
      return matchName || matchCode || matchDesc;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Brands
            </h1>
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
              {brands.length} Total Brands
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Consumer appliance & electrical brands, and professional engineering manufacturers.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Brand</span>
        </button>
      </div>

      {notification && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Audience Segment Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setSelectedAudience('all')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            selectedAudience === 'all'
              ? 'bg-slate-900 text-white font-semibold shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Brands ({brands.length})
        </button>

        <button
          onClick={() => setSelectedAudience('consumer')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            selectedAudience === 'consumer'
              ? 'bg-orange-500 text-white font-semibold shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:border-orange-300'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Consumer Brands</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              selectedAudience === 'consumer'
                ? 'bg-white/30 text-white'
                : 'bg-orange-50 text-orange-700'
            }`}
          >
            {consumerBrands.length} Brands
          </span>
        </button>

        <button
          onClick={() => setSelectedAudience('professional')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            selectedAudience === 'professional'
              ? 'bg-orange-500 text-white font-semibold shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:border-orange-300'
          }`}
        >
          <Briefcase className="h-3.5 w-3.5" />
          <span>Professional Brands</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              selectedAudience === 'professional'
                ? 'bg-white/30 text-white'
                : 'bg-orange-50 text-orange-700'
            }`}
          >
            {professionalBrands.length} Brands
          </span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search brands by name or code..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-800">{filteredBrands.length}</span> brands
        </div>
      </div>

      {/* Brands Grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-xs text-slate-400">
          Loading brands...
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-400">
          No brands found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBrands.map((brand) => {
            const isBoth =
              brand.audienceType === 'BOTH' ||
              (brand.audiences?.includes('aud-consumer') &&
                brand.audiences?.includes('aud-professional'));
            const isConsumer = !isBoth && isConsumerBrand(brand);
            const isProfessional = !isBoth && isProfessionalBrand(brand);

            return (
              <div
                key={brand.id}
                className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:border-orange-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isBoth ? (
                        <span className="rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-700 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-purple-600" />
                          Consumer & Professional
                        </span>
                      ) : isConsumer ? (
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                          <Users className="h-3 w-3 text-emerald-600" />
                          Consumer
                        </span>
                      ) : isProfessional ? (
                        <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700 flex items-center gap-1">
                          <Briefcase className="h-3 w-3 text-blue-600" />
                          Professional
                        </span>
                      ) : null}

                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {brand.tier}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDelete(brand)}
                      disabled={deletingBrandId === brand.id}
                      title="Remove brand"
                      className="text-slate-300 hover:text-rose-600 transition p-1 rounded hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      {brand.name}
                    </h2>
                    <span className="font-mono text-[11px] font-bold rounded bg-slate-100 px-2 py-0.5 text-slate-700">
                      {brand.code}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {brand.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-medium text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Active Partner</span>
                  </div>

                  {brand.website && (
                    <a
                      href={brand.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium text-[11px]"
                    >
                      <span>Website</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Brand Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Add Brand</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Target Audience
                </label>
                <select
                  value={audienceType}
                  onChange={(e) => setAudienceType(e.target.value as any)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                >
                  <option value="CONSUMER">Consumer Only</option>
                  <option value="PROFESSIONAL">Professional Only</option>
                  <option value="BOTH">Both Consumer & Professional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Brand Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. PHILIPS"
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Brand Code
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. PHILIPS"
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 font-mono placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Tier
                </label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as any)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                >
                  <option value="PARTNER">PARTNER</option>
                  <option value="PROPRIETARY">PROPRIETARY</option>
                  <option value="AUTHORIZED_DISTRIBUTOR">AUTHORIZED_DISTRIBUTOR</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Website
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Brief description..."
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition"
                >
                  Add Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
