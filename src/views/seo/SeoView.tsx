import React, { useState, useEffect } from 'react';
import { Search, Globe, CheckCircle2, Edit2, X, ExternalLink } from 'lucide-react';
import { api } from '../../config/api.ts';
import { SeoConfig } from '../../types/index.ts';

export const SeoView: React.FC = () => {
  const [configs, setConfigs] = useState<SeoConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<SeoConfig | null>(null);

  // Form states
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [indexingDirective, setIndexingDirective] = useState<SeoConfig['indexingDirective']>('INDEX_FOLLOW');

  const fetchSeo = async () => {
    setLoading(true);
    try {
      const res = await api.get<SeoConfig[]>('/seo');
      if (res.success && res.data) setConfigs(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeo();
  }, []);

  const openEdit = (cfg: SeoConfig) => {
    setEditingConfig(cfg);
    setMetaTitle(cfg.metaTitle);
    setMetaDescription(cfg.metaDescription);
    setCanonicalUrl(cfg.canonicalUrl);
    setIndexingDirective(cfg.indexingDirective);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig) return;

    try {
      const res = await api.put<SeoConfig>(`/seo/${editingConfig.id}`, {
        metaTitle,
        metaDescription,
        canonicalUrl,
        indexingDirective,
      });

      if (res.success && res.data) {
        setConfigs((prev) =>
          prev.map((c) => (c.id === editingConfig.id ? res.data! : c))
        );
        setEditingConfig(null);
      }
    } catch (err) {
      console.error('Failed to update SEO config', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
            SEO Directives & Meta Configurations
          </h1>
          <p className="text-xs text-slate-400">
            Search engine indexation rules, canonical URL mapping, and OpenGraph tags for public routes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {configs.map((cfg) => (
          <div
            key={cfg.id}
            className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-5 shadow transition hover:border-slate-700"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-amber-400 font-bold">
                  ROUTE: {cfg.pagePath}
                </span>
                <h3 className="mt-2 font-heading text-base font-bold text-white">
                  {cfg.metaTitle}
                </h3>
              </div>
              <button
                onClick={() => openEdit(cfg)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Configure</span>
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-300 leading-relaxed">{cfg.metaDescription}</p>

            <div className="mt-4 border-t border-slate-800/80 pt-3 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-slate-400">
                <span>Canonical:</span>
                <span className="font-mono text-slate-300 truncate max-w-xs">{cfg.canonicalUrl}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Directives:</span>
                <span className="font-mono text-emerald-400 font-medium">{cfg.indexingDirective}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-[#0e1525] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-heading text-base font-bold text-white">
                  Configure SEO: {editingConfig.pagePath}
                </h3>
              </div>
              <button
                onClick={() => setEditingConfig(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300">Meta Title</label>
                <input
                  type="text"
                  required
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Meta Description</label>
                <textarea
                  rows={3}
                  required
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Canonical URL</label>
                <input
                  type="url"
                  required
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Robots Indexing</label>
                <select
                  value={indexingDirective}
                  onChange={(e) => setIndexingDirective(e.target.value as any)}
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white"
                >
                  <option value="INDEX_FOLLOW">INDEX_FOLLOW</option>
                  <option value="NOINDEX_FOLLOW">NOINDEX_FOLLOW</option>
                  <option value="INDEX_NOFOLLOW">INDEX_NOFOLLOW</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingConfig(null)}
                  className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-amber-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400"
                >
                  Save SEO Directives
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
