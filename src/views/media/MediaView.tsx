import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Search,
  FileText,
  Copy,
  CheckCircle2,
  X,
  FileCode,
  Trash2,
  FolderOpen,
} from 'lucide-react';
import { api } from '../../config/api.ts';
import { MediaItem } from '../../types/index.ts';

export const MediaView: React.FC = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Upload Form
  const [filename, setFilename] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [category, setCategory] = useState<MediaItem['category']>('CATALOGUE_CAD');
  const [tags, setTags] = useState('CAD, 36kV, Drawing');

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await api.get<MediaItem[]>('/media');
      if (res.success && res.data) setMediaItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const res = await api.delete(`/media/${id}`);
      if (res.success) {
        setMediaItems((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete media asset', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filename || !originalName) return;

    try {
      const res = await api.post<MediaItem>('/media', {
        filename,
        originalName,
        mimeType: category === 'CATALOGUE_CAD' ? 'application/dwg' : category === 'PRODUCT_IMAGE' ? 'image/png' : 'application/pdf',
        sizeBytes: 1024 * 1024 * 2.5,
        category,
        url: `/assets/media/${filename}`,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      });

      if (res.success && res.data) {
        setMediaItems((prev) => [res.data!, ...prev]);
        setIsUploadOpen(false);
        setFilename('');
        setOriginalName('');
        setTags('CAD, 36kV, Drawing');
      }
    } catch (err) {
      console.error('Failed to upload media asset', err);
    }
  };

  const filteredMedia = mediaItems.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = !categoryFilter || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Media Library
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Manage CAD schematics, technical datasheets, test certificates, and product imagery.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition shadow-sm"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Media</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 sm:flex-row sm:items-center shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search files by name or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:border-orange-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          <option value="CATALOGUE_CAD">CAD Drawings</option>
          <option value="CERTIFICATE">Certificates</option>
          <option value="PDF_SPEC">Technical Datasheets</option>
          <option value="PRODUCT_IMAGE">Product Images</option>
        </select>
      </div>

      {/* Media Grid or Empty State */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
            <FolderOpen className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
            {mediaItems.length === 0 ? 'Media Library is Empty' : 'No Matching Assets Found'}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {mediaItems.length === 0
              ? 'No media assets, CAD diagrams, or specifications have been uploaded yet.'
              : `No files matched "${searchQuery || categoryFilter}". Try resetting your filter.`}
          </p>
          <div className="mt-6">
            <button
              onClick={() => {
                if (mediaItems.length === 0) {
                  setIsUploadOpen(true);
                } else {
                  setSearchQuery('');
                  setCategoryFilter('');
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition shadow-sm"
            >
              {mediaItems.length === 0 ? (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Asset</span>
                </>
              ) : (
                <span>Clear Filters</span>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:border-orange-300 dark:hover:border-orange-500/50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-orange-50 dark:bg-orange-950/50 px-2 py-0.5 font-mono text-[10px] text-orange-700 dark:text-orange-400 font-semibold">
                    {item.category.replace('_', ' ')}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {(item.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>

                <div className="my-3 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-950 p-6 border border-slate-100 dark:border-slate-800/80">
                  {item.category === 'CATALOGUE_CAD' ? (
                    <FileCode className="h-10 w-10 text-cyan-600 dark:text-cyan-400" />
                  ) : item.category === 'CERTIFICATE' ? (
                    <FileText className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-orange-500" />
                  )}
                </div>

                <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1" title={item.originalName}>
                  {item.originalName}
                </h2>

                <div className="mt-2 flex flex-wrap gap-1">
                  {item.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:text-slate-300"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-2.5 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyUrl(item.id, item.url)}
                    className="flex items-center gap-1 text-[11px] text-orange-600 dark:text-orange-400 font-medium hover:text-orange-700"
                  >
                    {copiedId === item.id ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    title="Delete asset"
                    className="p-1 text-slate-400 hover:text-rose-500 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Upload Media Asset</h2>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">File Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. switchgear-diagram.dwg"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 font-mono placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Display Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 36kV Drawing Schematic"
                  value={originalName}
                  onChange={(e) => setOriginalName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                >
                  <option value="CATALOGUE_CAD">CATALOGUE_CAD (CAD Diagrams)</option>
                  <option value="CERTIFICATE">CERTIFICATE (Type-Test Certs)</option>
                  <option value="PDF_SPEC">PDF_SPEC (Datasheets)</option>
                  <option value="PRODUCT_IMAGE">PRODUCT_IMAGE (High-Res Photos)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Comma-separated tags"
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 font-mono placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition"
                >
                  Upload Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
