import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Search,
  FileText,
  Download,
  Copy,
  CheckCircle2,
  X,
  FileCode,
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filename || !originalName) return;

    try {
      const res = await api.post<MediaItem>('/media', {
        filename,
        originalName,
        mimeType: category === 'CATALOGUE_CAD' ? 'application/dwg' : 'application/pdf',
        sizeBytes: 1024 * 1024 * 2.5,
        category,
        url: `/assets/media/${filename}`,
        tags: tags.split(',').map((t) => t.trim()),
      });

      if (res.success && res.data) {
        setMediaItems((prev) => [res.data!, ...prev]);
        setIsUploadOpen(false);
        setFilename('');
        setOriginalName('');
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
            Technical Media & CAD Asset Library
          </h1>
          <p className="text-xs text-slate-400">
            Engineering drawings (DWG/DXF), CESI type-test certificates, and high-resolution CAD models
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Media Asset</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-[#0c121e]/90 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search assets by file name or technical tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-900/90 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs text-slate-300 focus:border-amber-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          <option value="CATALOGUE_CAD">CAD Drawings (DWG)</option>
          <option value="CERTIFICATE">Certificates (CESI/KEMA)</option>
          <option value="PDF_SPEC">Technical Datasheets</option>
          <option value="PRODUCT_IMAGE">Product Images</option>
        </select>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filteredMedia.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-4 shadow transition hover:border-slate-700 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[9px] text-amber-400 font-bold border border-slate-700">
                  {item.category}
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {(item.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>

              <div className="my-3 flex items-center justify-center rounded-lg bg-slate-950/60 p-6 border border-slate-800/80">
                {item.category === 'CATALOGUE_CAD' ? (
                  <FileCode className="h-10 w-10 text-cyan-400" />
                ) : item.category === 'CERTIFICATE' ? (
                  <FileText className="h-10 w-10 text-emerald-400" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-amber-400" />
                )}
              </div>

              <h2 className="font-heading text-xs font-bold text-white line-clamp-1" title={item.originalName}>
                {item.originalName}
              </h2>

              <div className="mt-2 flex flex-wrap gap-1">
                {item.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[9px] text-slate-400"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 border-t border-slate-800/80 pt-2.5 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-500 font-mono">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => copyUrl(item.id, item.url)}
                className="flex items-center gap-1 text-[11px] text-amber-400 hover:underline"
              >
                {copiedId === item.id ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-[#0e1525] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="font-heading text-base font-bold text-white">Upload Media Asset</h2>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300">File Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. vectromax-36kv-cad.dwg"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Display Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VectroMax 36kV Outline Drawing"
                  value={originalName}
                  onChange={(e) => setOriginalName(e.target.value)}
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Asset Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white"
                >
                  <option value="CATALOGUE_CAD">CATALOGUE_CAD</option>
                  <option value="CERTIFICATE">CERTIFICATE</option>
                  <option value="PDF_SPEC">PDF_SPEC</option>
                  <option value="PRODUCT_IMAGE">PRODUCT_IMAGE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Technical Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Comma-separated tags"
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-amber-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400"
                >
                  Store Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
