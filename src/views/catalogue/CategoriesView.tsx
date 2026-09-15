import React, { useState, useEffect } from 'react';
import { FolderTree, Plus, Edit2, Layers, CheckCircle2, X } from 'lucide-react';
import { api } from '../../config/api.ts';
import { Category, Subcategory, Audience } from '../../types/index.ts';

export const CategoriesView: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatCode, setNewCatCode] = useState('');
  const [newCatAudience, setNewCatAudience] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, scRes, aRes] = await Promise.all([
        api.get<Category[]>('/catalogue/categories'),
        api.get<Subcategory[]>('/catalogue/subcategories'),
        api.get<Audience[]>('/catalogue/audiences'),
      ]);
      if (cRes.success && cRes.data) setCategories(cRes.data);
      if (scRes.success && scRes.data) setSubcategories(scRes.data);
      if (aRes.success && aRes.data) setAudiences(aRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatCode) return;

    try {
      const res = await api.post<Category>('/catalogue/categories', {
        name: newCatName,
        code: newCatCode.toUpperCase(),
        audienceId: newCatAudience || audiences[0]?.id,
        description: newCatDesc,
        iconName: 'Zap',
        order: categories.length + 1,
        active: true,
      });

      if (res.success && res.data) {
        setCategories((prev) => [...prev, res.data!]);
        setIsModalOpen(false);
        setNewCatName('');
        setNewCatCode('');
        setNewCatDesc('');
      }
    } catch (err) {
      console.error('Failed to create category', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
            Categories & Subcategories
          </h1>
          <p className="text-xs text-slate-400">
            Structural electrical taxonomy mapping products to primary engineering sectors
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {categories.map((cat) => {
          const catSubs = subcategories.filter((s) => s.categoryId === cat.id);
          const aud = audiences.find((a) => a.id === cat.audienceId);

          return (
            <div
              key={cat.id}
              className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-5 shadow transition hover:border-slate-700"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-400 border border-amber-500/20">
                      {cat.code}
                    </span>
                    <span className="font-heading text-sm font-bold text-white">
                      {cat.name}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{cat.description}</p>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                  Active
                </span>
              </div>

              {aud && (
                <div className="mt-3 text-[11px] text-slate-400">
                  Target Audience: <span className="text-slate-200">{aud.name}</span>
                </div>
              )}

              {/* Subcategories list */}
              <div className="mt-4 border-t border-slate-800/80 pt-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="h-3 w-3 text-amber-400" />
                  Subcategories ({catSubs.length})
                </span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {catSubs.length === 0 ? (
                    <span className="text-[11px] text-slate-500 italic">No subcategories defined</span>
                  ) : (
                    catSubs.map((sub) => (
                      <span
                        key={sub.id}
                        className="rounded border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] text-slate-300"
                      >
                        {sub.name}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-[#0e1525] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="font-heading text-base font-bold text-white">Add Equipment Category</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Busway & High-Current Trunking"
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Category Code</label>
                <input
                  type="text"
                  required
                  value={newCatCode}
                  onChange={(e) => setNewCatCode(e.target.value)}
                  placeholder="e.g. BUSWAY"
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Target Audience</label>
                <select
                  value={newCatAudience}
                  onChange={(e) => setNewCatAudience(e.target.value)}
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white"
                >
                  {audiences.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Summary of scope..."
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
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
