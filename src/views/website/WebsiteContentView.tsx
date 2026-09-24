import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  Briefcase,
  BookOpen,
  Box,
  Sliders,
  Edit2,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Layers,
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

  // Creation modal states
  const [isAddSlideOpen, setIsAddSlideOpen] = useState(false);
  const [slideHeadline, setSlideHeadline] = useState('');
  const [slideSubheadline, setSlideSubheadline] = useState('');
  const [slideBadge, setSlideBadge] = useState('AGECO Engineering');
  const [slideCtaText, setSlideCtaText] = useState('Explore Solutions');
  const [slideCtaLink, setSlideCtaLink] = useState('/solutions');
  const [slideImageUrl, setSlideImageUrl] = useState('');

  const [isAddSolutionOpen, setIsAddSolutionOpen] = useState(false);
  const [solTitle, setSolTitle] = useState('');
  const [solSector, setSolSector] = useState('');
  const [solSummary, setSolSummary] = useState('');
  const [solDeliverables, setSolDeliverables] = useState('');

  const [isAddIndustryOpen, setIsAddIndustryOpen] = useState(false);
  const [indName, setIndName] = useState('');
  const [indTagline, setIndTagline] = useState('');
  const [indOverview, setIndOverview] = useState('');
  const [indStandards, setIndStandards] = useState('');

  const [isAddStoryOpen, setIsAddStoryOpen] = useState(false);
  const [storyTitle, setStoryTitle] = useState('');
  const [storyCategory, setStoryCategory] = useState<'CASE_STUDY' | 'WHITEPAPER' | 'NEWS'>('CASE_STUDY');
  const [storyExcerpt, setStoryExcerpt] = useState('');
  const [storyAuthor, setStoryAuthor] = useState('AGECO Editorial Board');

  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [projTitle, setProjTitle] = useState('');
  const [projClient, setProjClient] = useState('');
  const [projLocation, setProjLocation] = useState('Saudi Arabia');
  const [projCapacity, setProjCapacity] = useState('');
  const [projYear, setProjYear] = useState('2026');
  const [projSummary, setProjSummary] = useState('');

  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [newBlockKey, setNewBlockKey] = useState('');
  const [newBlockTitle, setNewBlockTitle] = useState('');
  const [newBlockContent, setNewBlockContent] = useState('');
  const [newBlockSection, setNewBlockSection] = useState('General');

  const fetchWebsiteData = async () => {
    setLoading(true);
    try {
      const [sRes, solRes, indRes, stoRes, pRes, bRes] = await Promise.all([
        api.get<WebsiteHeroSlide[]>('/website/homepage'),
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

  // Handlers for deleting items
  const handleDeleteSlide = async (id: string) => {
    const res = await api.delete(`/website/homepage/${id}`);
    if (res.success) {
      setSlides((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleDeleteSolution = async (id: string) => {
    const res = await api.delete(`/website/solutions/${id}`);
    if (res.success) {
      setSolutions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleDeleteIndustry = async (id: string) => {
    const res = await api.delete(`/website/industries/${id}`);
    if (res.success) {
      setIndustries((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleDeleteStory = async (id: string) => {
    const res = await api.delete(`/website/stories/${id}`);
    if (res.success) {
      setStories((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleDeleteProject = async (id: string) => {
    const res = await api.delete(`/website/projects/${id}`);
    if (res.success) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleDeleteBlock = async (id: string) => {
    const res = await api.delete(`/website/content-blocks/${id}`);
    if (res.success) {
      setBlocks((prev) => prev.filter((b) => b.id !== id));
    }
  };

  // Creation Handlers
  const handleCreateSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideHeadline) return;
    const res = await api.post<WebsiteHeroSlide>('/website/homepage', {
      headline: slideHeadline,
      subheadline: slideSubheadline,
      badge: slideBadge,
      primaryCtaText: slideCtaText,
      primaryCtaLink: slideCtaLink,
      imageUrl: slideImageUrl || 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1600&auto=format&fit=crop&q=80',
    });
    if (res.success && res.data) {
      setSlides((prev) => [...prev, res.data!]);
      setIsAddSlideOpen(false);
      setSlideHeadline('');
      setSlideSubheadline('');
    }
  };

  const handleCreateSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solTitle || !solSector) return;
    const deliverables = solDeliverables.split('\n').map((d) => d.trim()).filter(Boolean);
    const res = await api.post<Solution>('/website/solutions', {
      title: solTitle,
      sector: solSector,
      summary: solSummary,
      deliverables,
      featured: true,
      status: 'PUBLISHED',
    });
    if (res.success && res.data) {
      setSolutions((prev) => [...prev, res.data!]);
      setIsAddSolutionOpen(false);
      setSolTitle('');
      setSolSector('');
      setSolSummary('');
      setSolDeliverables('');
    }
  };

  const handleCreateIndustry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!indName) return;
    const standards = indStandards.split(',').map((s) => s.trim()).filter(Boolean);
    const res = await api.post<Industry>('/website/industries', {
      name: indName,
      tagline: indTagline,
      overview: indOverview,
      complianceStandards: standards,
      active: true,
    });
    if (res.success && res.data) {
      setIndustries((prev) => [...prev, res.data!]);
      setIsAddIndustryOpen(false);
      setIndName('');
      setIndTagline('');
      setIndOverview('');
      setIndStandards('');
    }
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyTitle) return;
    const res = await api.post<Story>('/website/stories', {
      title: storyTitle,
      category: storyCategory,
      excerpt: storyExcerpt,
      content: storyExcerpt,
      author: storyAuthor,
      status: 'PUBLISHED',
    });
    if (res.success && res.data) {
      setStories((prev) => [res.data!, ...prev]);
      setIsAddStoryOpen(false);
      setStoryTitle('');
      setStoryExcerpt('');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle || !projClient) return;
    const res = await api.post<Project>('/website/projects', {
      title: projTitle,
      client: projClient,
      location: projLocation,
      capacityValue: projCapacity,
      completionYear: projYear,
      scopeSummary: projSummary,
      technologiesUsed: ['Engineering', 'Installation'],
      status: 'COMPLETED',
    });
    if (res.success && res.data) {
      setProjects((prev) => [res.data!, ...prev]);
      setIsAddProjectOpen(false);
      setProjTitle('');
      setProjClient('');
      setProjCapacity('');
      setProjSummary('');
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockKey || !newBlockTitle || !newBlockContent) return;
    const res = await api.post<WebsiteContentBlock>('/website/content-blocks', {
      key: newBlockKey,
      section: newBlockSection,
      title: newBlockTitle,
      content: newBlockContent,
    });
    if (res.success && res.data) {
      setBlocks((prev) => [...prev, res.data!]);
      setIsAddBlockOpen(false);
      setNewBlockKey('');
      setNewBlockTitle('');
      setNewBlockContent('');
    }
  };

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

  // Helper empty state component
  const renderEmptyState = (title: string, desc: string, onAdd: () => void, btnText: string) => (
    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
        <Layers className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
        {title}
      </h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
        {desc}
      </p>
      <div className="mt-6">
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{btnText}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header and Sub-navigation */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Website Content
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Manage public website pages, copy, hero slides, and technical showcase items.
          </p>
        </div>

        <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('homepage')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'homepage'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Hero Slides ({slides.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('solutions')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'solutions'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Solutions ({solutions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('industries')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'industries'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>Industries ({industries.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('stories')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'stories'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Stories ({stories.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'projects'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Box className="h-3.5 w-3.5" />
            <span>Projects ({projects.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'content'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Copy Blocks ({blocks.length})</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Homepage Hero Slides Tab */}
          {activeTab === 'homepage' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {slides.length} active hero slides
                </span>
                <button
                  onClick={() => setIsAddSlideOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Hero Slide</span>
                </button>
              </div>

              {slides.length === 0 ? (
                renderEmptyState(
                  'No Hero Slides Published',
                  'There are currently no hero banner slides configured for the homepage.',
                  () => setIsAddSlideOpen(true),
                  'Add First Hero Slide'
                )
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {slides.map((slide) => (
                    <div
                      key={slide.id}
                      className="overflow-hidden rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:border-orange-300 dark:hover:border-orange-500/50"
                    >
                      <div className="relative h-44 w-full">
                        <img
                          src={slide.imageUrl}
                          alt={slide.headline}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <span className="absolute top-3 left-3 rounded-full bg-orange-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                          {slide.badge}
                        </span>
                        <button
                          onClick={() => handleDeleteSlide(slide.id)}
                          className="absolute top-3 right-3 rounded-lg bg-black/60 p-1.5 text-white hover:bg-rose-600 transition"
                          title="Delete slide"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="p-4">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {slide.headline}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {slide.subheadline}
                        </p>

                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
                          <span className="text-slate-400 font-mono">
                            CTA: {slide.primaryCtaText}
                          </span>
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Published
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Turnkey Solutions Tab */}
          {activeTab === 'solutions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {solutions.length} engineering solutions
                </span>
                <button
                  onClick={() => setIsAddSolutionOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Solution</span>
                </button>
              </div>

              {solutions.length === 0 ? (
                renderEmptyState(
                  'No Solutions Published',
                  'There are currently no turnkey engineering solutions in the catalogue.',
                  () => setIsAddSolutionOpen(true),
                  'Publish Engineering Solution'
                )
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {solutions.map((sol) => (
                    <div
                      key={sol.id}
                      className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between transition hover:border-orange-300 dark:hover:border-orange-500/50"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="rounded bg-orange-50 dark:bg-orange-950/60 px-2.5 py-0.5 font-mono text-[10px] font-bold text-orange-700 dark:text-orange-400">
                            {sol.sector}
                          </span>
                          <button
                            onClick={() => handleDeleteSolution(sol.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 transition"
                            title="Delete solution"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                          {sol.title}
                        </h3>
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-3">
                          {sol.summary}
                        </p>

                        {sol.deliverables && sol.deliverables.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Deliverables:
                            </span>
                            <ul className="space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                              {sol.deliverables.map((d, i) => (
                                <li key={i} className="flex items-center gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                                  <span>{d}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3 text-[11px] text-slate-400 font-mono">
                        /solutions/{sol.slug}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Target Industries Tab */}
          {activeTab === 'industries' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {industries.length} target industry sectors
                </span>
                <button
                  onClick={() => setIsAddIndustryOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Industry</span>
                </button>
              </div>

              {industries.length === 0 ? (
                renderEmptyState(
                  'No Industries Published',
                  'There are currently no target industry sectors listed.',
                  () => setIsAddIndustryOpen(true),
                  'Add Industry Sector'
                )
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {industries.map((ind) => (
                    <div
                      key={ind.id}
                      className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:border-orange-300 dark:hover:border-orange-500/50"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">{ind.name}</h3>
                          <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold">{ind.tagline}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteIndustry(ind.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition"
                          title="Delete industry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{ind.overview}</p>

                      <div className="mt-3 flex flex-wrap gap-1">
                        {ind.complianceStandards?.map((std, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-700 dark:text-slate-300"
                          >
                            {std}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stories Tab */}
          {activeTab === 'stories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {stories.length} published technical articles & case studies
                </span>
                <button
                  onClick={() => setIsAddStoryOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Story</span>
                </button>
              </div>

              {stories.length === 0 ? (
                renderEmptyState(
                  'No Technical Stories Published',
                  'There are currently no case studies, whitepapers, or editorial insights.',
                  () => setIsAddStoryOpen(true),
                  'Publish Technical Article'
                )
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {stories.map((story) => (
                    <div
                      key={story.id}
                      className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:border-orange-300 dark:hover:border-orange-500/50 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="rounded bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 font-mono font-bold text-orange-700 dark:text-orange-400">
                            {story.category}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-mono text-[11px]">{story.readTime}</span>
                            <button
                              onClick={() => handleDeleteStory(story.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 transition"
                              title="Delete story"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <h3 className="mt-2.5 text-base font-bold text-slate-900 dark:text-white">
                          {story.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{story.excerpt}</p>
                      </div>

                      <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>By {story.author}</span>
                        <span className="font-mono text-[11px]">{story.publishDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reference Projects Tab */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {projects.length} completed turnkey project references
                </span>
                <button
                  onClick={() => setIsAddProjectOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Project</span>
                </button>
              </div>

              {projects.length === 0 ? (
                renderEmptyState(
                  'No Projects Published',
                  'There are currently no turnkey EPC or substation reference projects listed.',
                  () => setIsAddProjectOpen(true),
                  'Add Project Reference'
                )
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between transition hover:border-orange-300 dark:hover:border-orange-500/50"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="rounded bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 font-bold text-emerald-700 dark:text-emerald-400">
                            {proj.status}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">{proj.completionYear}</span>
                            <button
                              onClick={() => handleDeleteProject(proj.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 transition"
                              title="Delete project"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                          {proj.title}
                        </h3>
                        <p className="mt-1 text-xs text-orange-600 dark:text-orange-400 font-semibold">
                          {proj.client} ({proj.location})
                        </p>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{proj.scopeSummary}</p>

                        {proj.capacityValue && (
                          <div className="mt-3 rounded-lg bg-slate-50 dark:bg-slate-950 p-2 text-xs font-mono text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                            Capacity: {proj.capacityValue}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1 border-t border-slate-100 dark:border-slate-800 pt-2">
                        {proj.technologiesUsed?.map((t, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Website Copy Blocks Tab */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {blocks.length} configurable website copy blocks
                </span>
                <button
                  onClick={() => setIsAddBlockOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Copy Block</span>
                </button>
              </div>

              {blocks.length === 0 ? (
                renderEmptyState(
                  'No Copy Blocks Configured',
                  'There are currently no website text or content blocks saved.',
                  () => setIsAddBlockOpen(true),
                  'Create First Copy Block'
                )
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {blocks.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between transition hover:border-orange-300 dark:hover:border-orange-500/50"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="rounded bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 font-mono text-[11px] text-orange-700 dark:text-orange-400 font-semibold">
                            {b.key}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingBlock(b);
                                setBlockTitle(b.title);
                                setBlockContent(b.content);
                              }}
                              className="flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteBlock(b.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 transition"
                              title="Delete block"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <h3 className="mt-2.5 text-sm font-bold text-slate-900 dark:text-white">{b.title}</h3>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">{b.content}</p>
                      </div>
                      <div className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-2 text-[11px] text-slate-400 font-mono">
                        Modified by: {b.lastModifiedBy}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Edit Content Block Modal */}
      {editingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Copy Block</h3>
                <span className="font-mono text-xs text-orange-600 dark:text-orange-400">{editingBlock.key}</span>
              </div>
              <button
                onClick={() => setEditingBlock(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBlock} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Title</label>
                <input
                  type="text"
                  required
                  value={blockTitle}
                  onChange={(e) => setBlockTitle(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Content</label>
                <textarea
                  rows={4}
                  required
                  value={blockContent}
                  onChange={(e) => setBlockContent(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingBlock(null)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Slide Modal */}
      {isAddSlideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Homepage Hero Slide</h3>
              <button onClick={() => setIsAddSlideOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSlide} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next-Generation Medium Voltage Solutions"
                  value={slideHeadline}
                  onChange={(e) => setSlideHeadline(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Subheadline</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Certified IEC switchgear and digital automation architectures."
                  value={slideSubheadline}
                  onChange={(e) => setSlideSubheadline(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Badge Tag</label>
                  <input
                    type="text"
                    value={slideBadge}
                    onChange={(e) => setSlideBadge(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Button CTA Text</label>
                  <input
                    type="text"
                    value={slideCtaText}
                    onChange={(e) => setSlideCtaText(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Button Link</label>
                  <input
                    type="text"
                    value={slideCtaLink}
                    onChange={(e) => setSlideCtaLink(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Image URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={slideImageUrl}
                    onChange={(e) => setSlideImageUrl(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button type="button" onClick={() => setIsAddSlideOpen(false)} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition">
                  Create Hero Slide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Solution Modal */}
      {isAddSolutionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Engineering Solution</h3>
              <button onClick={() => setIsAddSolutionOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSolution} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Solution Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Digital Substation Automation & Protection"
                  value={solTitle}
                  onChange={(e) => setSolTitle(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Sector</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High Voltage Transmission & Distribution"
                  value={solSector}
                  onChange={(e) => setSolSector(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Summary</label>
                <textarea
                  rows={3}
                  placeholder="Detailed technical overview of the engineered solution..."
                  value={solSummary}
                  onChange={(e) => setSolSummary(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Deliverables (one per line)</label>
                <textarea
                  rows={2}
                  placeholder="Protection relay coordination studies&#10;SCADA Gateway design"
                  value={solDeliverables}
                  onChange={(e) => setSolDeliverables(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button type="button" onClick={() => setIsAddSolutionOpen(false)} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition">
                  Create Solution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Industry Modal */}
      {isAddIndustryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Target Industry</h3>
              <button onClick={() => setIsAddIndustryOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateIndustry} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Industry Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oil, Gas & Petrochemicals"
                  value={indName}
                  onChange={(e) => setIndName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Explosion-proof electrical assemblies and certified severe-duty systems."
                  value={indTagline}
                  onChange={(e) => setIndTagline(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Overview</label>
                <textarea
                  rows={2}
                  value={indOverview}
                  onChange={(e) => setIndOverview(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Compliance Standards (comma-separated)</label>
                <input
                  type="text"
                  placeholder="ATEX / IECEx Zone 1, Saudi Aramco SAES"
                  value={indStandards}
                  onChange={(e) => setIndStandards(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button type="button" onClick={() => setIsAddIndustryOpen(false)} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition">
                  Create Industry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Story Modal */}
      {isAddStoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Publish Story or Case Study</h3>
              <button onClick={() => setIsAddStoryOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStory} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modernizing 380kV Substation with IEC 61850 Process Bus"
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={storyCategory}
                    onChange={(e) => setStoryCategory(e.target.value as any)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="CASE_STUDY">CASE_STUDY</option>
                    <option value="WHITEPAPER">WHITEPAPER</option>
                    <option value="NEWS">NEWS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Author</label>
                  <input
                    type="text"
                    value={storyAuthor}
                    onChange={(e) => setStoryAuthor(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Excerpt / Summary</label>
                <textarea
                  rows={3}
                  value={storyExcerpt}
                  onChange={(e) => setStoryExcerpt(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button type="button" onClick={() => setIsAddStoryOpen(false)} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition">
                  Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {isAddProjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Turnkey Project</h3>
              <button onClick={() => setIsAddProjectOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Red Sea Coastal Eco-Resort 132kV Microgrid"
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Client</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Red Sea Global"
                    value={projClient}
                    onChange={(e) => setProjClient(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Location</label>
                  <input
                    type="text"
                    value={projLocation}
                    onChange={(e) => setProjLocation(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Capacity / Scope</label>
                  <input
                    type="text"
                    placeholder="e.g. 120 MVA with BESS"
                    value={projCapacity}
                    onChange={(e) => setProjCapacity(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Year</label>
                  <input
                    type="text"
                    value={projYear}
                    onChange={(e) => setProjYear(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Scope Summary</label>
                <textarea
                  rows={2}
                  value={projSummary}
                  onChange={(e) => setProjSummary(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button type="button" onClick={() => setIsAddProjectOpen(false)} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Content Block Modal */}
      {isAddBlockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Copy Block</h3>
              <button onClick={() => setIsAddBlockOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBlock} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Block Key</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. homepage_cta_title"
                    value={newBlockKey}
                    onChange={(e) => setNewBlockKey(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 font-mono focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Section</label>
                  <input
                    type="text"
                    value={newBlockSection}
                    onChange={(e) => setNewBlockSection(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Display Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Call to Action Headline"
                  value={newBlockTitle}
                  onChange={(e) => setNewBlockTitle(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Content</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Block text or markdown copy..."
                  value={newBlockContent}
                  onChange={(e) => setNewBlockContent(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button type="button" onClick={() => setIsAddBlockOpen(false)} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition">
                  Create Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
