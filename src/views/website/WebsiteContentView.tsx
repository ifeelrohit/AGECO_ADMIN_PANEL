import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  Briefcase,
  BookOpen,
  Box,
  Sliders,
  Plus,
  Edit2,
  CheckCircle2,
  ExternalLink,
  X,
} from 'lucide-react';
import { api } from '../../config/api.ts';
import {
  WebsiteHeroSlide,
  Solution,
  Industry,
  Story,
  Project,
  WebsiteContentBlock,
} from '../../types/index.ts';

interface WebsiteViewProps {
  initialSubpage?:
    | 'homepage'
    | 'solutions'
    | 'industries'
    | 'stories'
    | 'projects'
    | 'content';
}

export const WebsiteContentView: React.FC<WebsiteViewProps> = ({
  initialSubpage = 'homepage',
}) => {
  const [activeTab, setActiveTab] = useState<
    'homepage' | 'solutions' | 'industries' | 'stories' | 'projects' | 'content'
  >(initialSubpage);

  // States
  const [slides, setSlides] = useState<WebsiteHeroSlide[]>([]);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [blocks, setBlocks] = useState<WebsiteContentBlock[]>([]);
  const [loading, setLoading] = useState(true);

  // Editing state for content blocks
  const [editingBlock, setEditingBlock] = useState<WebsiteContentBlock | null>(null);
  const [blockContent, setBlockContent] = useState('');
  const [blockTitle, setBlockTitle] = useState('');

  const fetchWebsiteData = async () => {
    setLoading(true);
    try {
      const [sRes, solRes, indRes, stoRes, pRes, bRes] = await Promise.all([
        api.get<WebsiteHeroSlide[]>('/website/homepage-slides'),
        api.get<Solution[]>('/website/solutions'),
        api.get<Industry[]>('/website/industries'),
        api.get<Story[]>('/website/stories'),
        api.get<Project[]>('/website/projects'),
        api.get<WebsiteContentBlock[]>('/website/content-blocks'),
      ]);

      if (sRes.success && sRes.data) setSlides(sRes.data);
      if (solRes.success && solRes.data) setSolutions(solRes.data);
      if (indRes.success && indRes.data) setIndustries(indRes.data);
      if (stoRes.success && stoRes.data) setStories(stoRes.data);
      if (pRes.success && pRes.data) setProjects(pRes.data);
      if (bRes.success && bRes.data) setBlocks(bRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsiteData();
  }, []);

  useEffect(() => {
    if (initialSubpage) {
      setActiveTab(initialSubpage);
    }
  }, [initialSubpage]);

  const handleSaveBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlock) return;

    try {
      const res = await api.put<WebsiteContentBlock>(
        `/website/content-blocks/${editingBlock.id}`,
        {
          title: blockTitle,
          content: blockContent,
        }
      );

      if (res.success && res.data) {
        setBlocks((prev) =>
          prev.map((b) => (b.id === editingBlock.id ? res.data! : b))
        );
        setEditingBlock(null);
      }
    } catch (err) {
      console.error('Failed to update content block', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Sub-navigation */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
            Website Content & Experience Manager
          </h1>
          <p className="text-xs text-slate-400">
            Authoritative content synchronization for the AGECO Main Website public portal
          </p>
        </div>

        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-800 bg-slate-900/80 p-1">
          <button
            onClick={() => setActiveTab('homepage')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              activeTab === 'homepage'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            <span>Hero Slides</span>
          </button>
          <button
            onClick={() => setActiveTab('solutions')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              activeTab === 'solutions'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="h-3 w-3" />
            <span>Solutions</span>
          </button>
          <button
            onClick={() => setActiveTab('industries')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              activeTab === 'industries'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="h-3 w-3" />
            <span>Industries</span>
          </button>
          <button
            onClick={() => setActiveTab('stories')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              activeTab === 'stories'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="h-3 w-3" />
            <span>Stories</span>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              activeTab === 'projects'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Box className="h-3 w-3" />
            <span>Projects</span>
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              activeTab === 'content'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="h-3 w-3" />
            <span>Copy Blocks</span>
          </button>
        </div>
      </div>

      {/* Homepage Hero Slides Tab */}
      {activeTab === 'homepage' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Live Homepage Hero Slides ({slides.length})
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {slides.map((slide) => (
              <div
                key={slide.id}
                className="overflow-hidden rounded-xl border border-slate-800 bg-[#0c121e]/90 shadow transition hover:border-slate-700"
              >
                <div className="relative h-44 w-full">
                  <img
                    src={slide.imageUrl}
                    alt={slide.headline}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c121e] via-[#0c121e]/50 to-transparent" />
                  <span className="absolute top-3 left-3 rounded bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                    {slide.badge}
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="font-heading text-base font-bold text-white">
                    {slide.headline}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                    {slide.subheadline}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
                    <span className="text-slate-500 font-mono">
                      CTA: {slide.primaryCtaText} ({slide.primaryCtaLink})
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Published
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Turnkey Solutions Tab */}
      {activeTab === 'solutions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {solutions.map((sol) => (
              <div
                key={sol.id}
                className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-5 shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-400 border border-cyan-500/20">
                      {sol.sector}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">PUBLISHED</span>
                  </div>

                  <h3 className="mt-3 font-heading text-base font-bold text-white">
                    {sol.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-400 line-clamp-3">
                    {sol.summary}
                  </p>

                  <div className="mt-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Scope Deliverables:
                    </span>
                    <ul className="space-y-0.5 text-[11px] text-slate-300">
                      {sol.deliverables?.map((d, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-amber-400" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-800/80 pt-3 text-[11px] text-slate-500 font-mono">
                  Slug: /solutions/{sol.slug}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target Industries Tab */}
      {activeTab === 'industries' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {industries.map((ind) => (
            <div
              key={ind.id}
              className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-5 shadow"
            >
              <h3 className="font-heading text-base font-bold text-white">{ind.name}</h3>
              <p className="text-xs text-amber-400 font-medium">{ind.tagline}</p>
              <p className="mt-2 text-xs text-slate-400">{ind.overview}</p>

              <div className="mt-3 flex flex-wrap gap-1">
                {ind.complianceStandards?.map((std, idx) => (
                  <span
                    key={idx}
                    className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-cyan-300"
                  >
                    {std}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stories and Whitepapers Tab */}
      {activeTab === 'stories' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {stories.map((story) => (
              <div
                key={story.id}
                className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-5 shadow"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="rounded bg-amber-500/10 px-2 py-0.5 font-mono font-bold text-amber-400 border border-amber-500/20">
                    {story.category}
                  </span>
                  <span className="text-slate-500 font-mono">{story.readTime}</span>
                </div>

                <h3 className="mt-2.5 font-heading text-base font-bold text-white">
                  {story.title}
                </h3>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2">{story.excerpt}</p>

                <div className="mt-4 border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Author: {story.author}</span>
                  <span className="font-mono">{story.publishDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reference Projects Tab */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-5 shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-400 border border-emerald-500/20">
                    {proj.status}
                  </span>
                  <span className="text-slate-400">{proj.completionYear}</span>
                </div>

                <h3 className="mt-3 font-heading text-base font-bold text-white">
                  {proj.title}
                </h3>
                <p className="mt-1 text-xs text-amber-400 font-medium">
                  Client: {proj.client} ({proj.location})
                </p>
                <p className="mt-2 text-xs text-slate-400">{proj.scopeSummary}</p>

                <div className="mt-3 rounded bg-slate-900/60 p-2 text-xs font-mono text-cyan-300">
                  Capacity: {proj.capacityValue}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1 border-t border-slate-800/80 pt-2">
                {proj.technologiesUsed?.map((t, idx) => (
                  <span
                    key={idx}
                    className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Website Copy Blocks Tab */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {blocks.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-5 shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-amber-400">
                      {b.key}
                    </span>
                    <button
                      onClick={() => {
                        setEditingBlock(b);
                        setBlockTitle(b.title);
                        setBlockContent(b.content);
                      }}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                  <h3 className="mt-2.5 font-heading text-sm font-bold text-white">{b.title}</h3>
                  <p className="mt-1 text-xs text-slate-300 whitespace-pre-line">{b.content}</p>
                </div>
                <div className="mt-3 border-t border-slate-800/80 pt-2 text-[10px] text-slate-500 font-mono">
                  Modified by: {b.lastModifiedBy}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Content Block Modal */}
      {editingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-[#0e1525] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-heading text-base font-bold text-white">Edit Copy Block</h3>
                <span className="font-mono text-xs text-amber-400">{editingBlock.key}</span>
              </div>
              <button
                onClick={() => setEditingBlock(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBlock} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300">Title</label>
                <input
                  type="text"
                  required
                  value={blockTitle}
                  onChange={(e) => setBlockTitle(e.target.value)}
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Content</label>
                <textarea
                  rows={4}
                  required
                  value={blockContent}
                  onChange={(e) => setBlockContent(e.target.value)}
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingBlock(null)}
                  className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-amber-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
