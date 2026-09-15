import React, { useState, useEffect } from 'react';
import { Tag, Plus, ExternalLink, CheckCircle2, X } from 'lucide-react';
import { api } from '../../config/api.ts';
import { Brand } from '../../types/index.ts';

export const BrandsView: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [tier, setTier] = useState<Brand['tier']>('PARTNER');
  const [website, setWebsite] = useState('');
  const [desc, setDesc] = useState('');

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    try {
      const res = await api.post<Brand>('/catalogue/brands', {
        name,
        code: code.toUpperCase(),
        tier,
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
      }
    } catch (err) {
      console.error('Failed to create brand', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
            Brands & OEM Technology Partners
          </h1>
          <p className="text-xs text-slate-400">
            Proprietary AGECO switchgear manufacturing and authorized global OEM partnerships
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add Brand Partner</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          <div
            key={brand.id}
            className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-5 shadow transition hover:border-slate-700 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <span
                  className={`rounded border px-2 py-0.5 text-[10px] font-bold font-mono tracking-wider ${
                    brand.tier === 'PROPRIETARY'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                  }`}
                >
                  {brand.tier}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Authorized
                </span>
              </div>

              <h2 className="mt-3 font-heading text-base font-bold text-white">{brand.name}</h2>
              <p className="mt-1 text-xs text-slate-400 line-clamp-2">{brand.description}</p>
            </div>

            <div className="mt-4 border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs">
              <span className="font-mono text-[11px] text-slate-500">CODE: {brand.code}</span>
              {brand.website && (
                <a
                  href={brand.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-amber-400 hover:underline text-[11px]"
                >
                  <span>Portal</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-[#0e1525] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="font-heading text-base font-bold text-white">Register Brand Partner</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300">Brand Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Eaton Electrical"
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Code</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. EATON"
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Partnership Tier</label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as any)}
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white"
                >
                  <option value="PROPRIETARY">PROPRIETARY</option>
                  <option value="PARTNER">PARTNER</option>
                  <option value="AUTHORIZED_DISTRIBUTOR">AUTHORIZED_DISTRIBUTOR</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Website URL</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Brand scope & partnership credentials..."
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-amber-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400"
                >
                  Register Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
