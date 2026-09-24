import React, { useState, useEffect } from 'react';
import {
  Plus,
  Layers,
  X,
  Search,
  CheckCircle2,
  FolderTree,
  Tag,
  Briefcase,
  Users,
} from 'lucide-react';
import { api } from '../../config/api.ts';
import { Category, Subcategory, Audience } from '../../types/index.ts';

interface CategoriesViewProps {
  initialMode?: 'categories' | 'subcategories';
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  initialMode = 'categories',
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeMode, setActiveMode] = useState<'categories' | 'subcategories'>(
    initialMode
  );
  const [selectedAudience, setSelectedAudience] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Category Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatCode, setNewCatCode] = useState('');
  const [newCatAudience, setNewCatAudience] = useState('aud-professional');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Add Subcategory Modal
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subTargetCatId, setSubTargetCatId] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubDesc, setNewSubDesc] = useState('');

  const [notification, setNotification] = useState<string | null>(null);

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

  useEffect(() => {
    setActiveMode(initialMode);
  }, [initialMode]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatCode) return;

    try {
      const res = await api.post<Category>('/catalogue/categories', {
        name: newCatName,
        code: newCatCode.toUpperCase(),
        audienceId: newCatAudience || 'aud-professional',
        description: newCatDesc,
        iconName: 'Layers',
        order: categories.length + 1,
        active: true,
      });

      if (res.success && res.data) {
        setCategories((prev) => [...prev, res.data!]);
        setIsCatModalOpen(false);
        setNewCatName('');
        setNewCatCode('');
        setNewCatDesc('');
        showNotification(`Category "${res.data.name}" added successfully.`);
      }
    } catch (err) {
      console.error('Failed to create category', err);
    }
  };

  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName || !newSubCode || !subTargetCatId) return;

    try {
      const res = await api.post<Subcategory>('/catalogue/subcategories', {
        name: newSubName,
        code: newSubCode.toUpperCase(),
        categoryId: subTargetCatId,
        description: newSubDesc,
        active: true,
      });

      if (res.success && res.data) {
        setSubcategories((prev) => [...prev, res.data!]);
        setIsSubModalOpen(false);
        setNewSubName('');
        setNewSubCode('');
        setNewSubDesc('');
        showNotification(`Subcategory "${res.data.name}" added successfully.`);
      }
    } catch (err) {
      console.error('Failed to create subcategory', err);
    }
  };

  const openSubModalForCat = (categoryId: string) => {
    setSubTargetCatId(categoryId);
    setIsSubModalOpen(true);
  };

  // Audience counts
  const consumerCats = categories.filter((c) => c.audienceId === 'aud-consumer');
  const professionalCats = categories.filter(
    (c) => c.audienceId === 'aud-professional'
  );

  // Filter categories
  const filteredCategories = categories.filter((cat) => {
    const matchesAudience =
      selectedAudience === 'all' || cat.audienceId === selectedAudience;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      cat.name.toLowerCase().includes(q) ||
      cat.code.toLowerCase().includes(q) ||
      (cat.description && cat.description.toLowerCase().includes(q)) ||
      subcategories.some(
        (s) => s.categoryId === cat.id && s.name.toLowerCase().includes(q)
      );
    return matchesAudience && matchesSearch;
  });

  // Filter subcategories
  const filteredSubcategories = subcategories.filter((sub) => {
    const parentCat = categories.find((c) => c.id === sub.categoryId);
    const matchesAudience =
      selectedAudience === 'all' ||
      (parentCat && parentCat.audienceId === selectedAudience);
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      sub.name.toLowerCase().includes(q) ||
      sub.code.toLowerCase().includes(q) ||
      (parentCat && parentCat.name.toLowerCase().includes(q));
    return matchesAudience && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Categories & Subcategories
            </h1>
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
              {categories.length} Categories • {subcategories.length} Subcategories
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Consumer product hierarchy and direct professional engineering categories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (consumerCats.length > 0 && !subTargetCatId) {
                setSubTargetCatId(consumerCats[0].id);
              }
              setIsSubModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 text-slate-500" />
            <span>Add Subcategory</span>
          </button>

          <button
            onClick={() => setIsCatModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Category</span>
          </button>
        </div>
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
          All Audiences ({categories.length})
        </button>

        <button
          onClick={() => setSelectedAudience('aud-professional')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            selectedAudience === 'aud-professional'
              ? 'bg-orange-500 text-white font-semibold shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:border-orange-300'
          }`}
        >
          <Briefcase className="h-3.5 w-3.5" />
          <span>For Professionals</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              selectedAudience === 'aud-professional'
                ? 'bg-white/30 text-white'
                : 'bg-orange-50 text-orange-700'
            }`}
          >
            {professionalCats.length} Direct Categories
          </span>
        </button>

        <button
          onClick={() => setSelectedAudience('aud-consumer')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            selectedAudience === 'aud-consumer'
              ? 'bg-orange-500 text-white font-semibold shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:border-orange-300'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>For Consumers</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              selectedAudience === 'aud-consumer'
                ? 'bg-white/30 text-white'
                : 'bg-orange-50 text-orange-700'
            }`}
          >
            {consumerCats.length} Categories • 66 Subcategories
          </span>
        </button>
      </div>

      {/* Controls Bar: Search & View Mode Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setActiveMode('categories')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeMode === 'categories'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderTree className="h-3.5 w-3.5" />
            <span>Category View ({filteredCategories.length})</span>
          </button>
          <button
            onClick={() => setActiveMode('subcategories')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeMode === 'subcategories'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Subcategories List ({filteredSubcategories.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-xs text-slate-400">
          Loading catalogue...
        </div>
      ) : activeMode === 'categories' ? (
        /* CATEGORIES CARD VIEW */
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredCategories.map((cat) => {
            const catSubs = subcategories.filter((s) => s.categoryId === cat.id);
            const isProfessional = cat.audienceId === 'aud-professional';

            return (
              <div
                key={cat.id}
                className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-orange-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold ${
                          isProfessional
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-orange-50 text-orange-700'
                        }`}
                      >
                        {cat.code}
                      </span>
                      <h2 className="text-sm font-bold text-slate-900">{cat.name}</h2>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{cat.description}</p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold shrink-0 ${
                      isProfessional
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {isProfessional ? 'Professional' : 'Consumer'}
                  </span>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  {isProfessional ? (
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Tag className="h-3.5 w-3.5 text-orange-500" />
                        <span>Direct Category (No subcategories)</span>
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        AUD-PROFESSIONAL
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-orange-500" />
                          Subcategories ({catSubs.length})
                        </span>

                        <button
                          onClick={() => openSubModalForCat(cat.id)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add Subcategory</span>
                        </button>
                      </div>

                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {catSubs.map((sub) => (
                          <span
                            key={sub.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-xs text-slate-700 font-medium hover:border-orange-300 transition"
                          >
                            <span>{sub.name}</span>
                            <span className="font-mono text-[9px] text-slate-400">
                              ({sub.code})
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* SUBCATEGORIES TABLE VIEW */
        <div className="rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Subcategory</th>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Parent Category</th>
                  <th className="px-5 py-3">Audience</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSubcategories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                      {selectedAudience === 'aud-professional'
                        ? 'Professional categories are direct categories with no subcategories.'
                        : 'No subcategories found.'}
                    </td>
                  </tr>
                ) : (
                  filteredSubcategories.map((sub, idx) => {
                    const parentCat = categories.find((c) => c.id === sub.categoryId);

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-5 py-3 font-mono text-[11px] text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-900">
                          {sub.name}
                        </td>
                        <td className="px-5 py-3 font-mono text-[11px] text-slate-500">
                          {sub.code}
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                            <Tag className="h-3 w-3" />
                            <span>{parentCat?.name || 'Unassigned'}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          For Consumers
                        </td>
                        <td className="px-5 py-3 text-slate-500 max-w-xs truncate">
                          {sub.description || '-'}
                        </td>
                        <td className="px-5 py-3">
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            Active
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Add Category</h2>
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Target Audience
                </label>
                <select
                  value={newCatAudience}
                  onChange={(e) => setNewCatAudience(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                >
                  <option value="aud-professional">For Professionals (Direct Category)</option>
                  <option value="aud-consumer">For Consumers</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. CABLES AND WIRES"
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Category Code
                </label>
                <input
                  type="text"
                  required
                  value={newCatCode}
                  onChange={(e) => setNewCatCode(e.target.value)}
                  placeholder="e.g. CAT-P-CABLES"
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 font-mono placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Category description..."
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subcategory Modal */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Add Subcategory</h2>
              <button
                onClick={() => setIsSubModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubcategory} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Category
                </label>
                <select
                  required
                  value={subTargetCatId}
                  onChange={(e) => setSubTargetCatId(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none"
                >
                  {categories.map((c) => {
                    const isProf = c.audienceId === 'aud-professional';
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({isProf ? 'Professional' : 'Consumer'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Subcategory Name
                </label>
                <input
                  type="text"
                  required
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="e.g. Exhaust Fans"
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Subcategory Code
                </label>
                <input
                  type="text"
                  required
                  value={newSubCode}
                  onChange={(e) => setNewSubCode(e.target.value)}
                  placeholder="e.g. SUB-EXHAUST-FANS"
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 font-mono placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newSubDesc}
                  onChange={(e) => setNewSubDesc(e.target.value)}
                  placeholder="Description..."
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition"
                >
                  Add Subcategory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
