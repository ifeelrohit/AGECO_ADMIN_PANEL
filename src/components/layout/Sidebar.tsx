import React, { useState } from 'react';
import {
  LayoutDashboard,
  Box,
  Globe,
  Inbox,
  Image,
  Search,
  Users,
  FileText,
  Settings,
  Database,
  ChevronDown,
  ChevronRight,
  Zap,
  FolderTree,
  Tag,
  Boxes,
  Compass,
  Layers,
  Sparkles,
  BookOpen,
  Briefcase,
  Sliders,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ModulePermissionKey } from '../../types/index.ts';

export type NavigationTarget =
  | 'dashboard'
  // Catalogue
  | 'catalogue-audiences'
  | 'catalogue-categories'
  | 'catalogue-subcategories'
  | 'catalogue-brands'
  | 'catalogue-product-types'
  | 'catalogue-products'
  // Website
  | 'website-homepage'
  | 'website-solutions'
  | 'website-industries'
  | 'website-stories'
  | 'website-projects'
  | 'website-content'
  // Standalone
  | 'enquiries'
  | 'media'
  | 'seo'
  | 'users'
  | 'audit-logs'
  | 'settings'
  | 'diagnostics';

interface SidebarProps {
  activeTab: NavigationTarget;
  onSelectTab: (tab: NavigationTarget) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  enquiriesBadgeCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile = false,
  onCloseMobile,
  enquiriesBadgeCount = 1,
}) => {
  const { canAccess, user } = useAuth();

  // Accordion states for nested sections
  const [catalogueExpanded, setCatalogueExpanded] = useState(
    activeTab.startsWith('catalogue')
  );
  const [websiteExpanded, setWebsiteExpanded] = useState(
    activeTab.startsWith('website')
  );

  const handleSelect = (tab: NavigationTarget) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const navItemClass = (isActive: boolean) =>
    `group flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-all ${
      isActive
        ? 'bg-amber-500/10 text-amber-300 font-semibold border-l-2 border-amber-500 shadow-sm'
        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
    }`;

  const subNavItemClass = (isActive: boolean) =>
    `group flex w-full items-center gap-2 rounded-md py-1.5 pl-7 pr-3 text-xs transition-all ${
      isActive
        ? 'text-cyan-300 font-semibold bg-cyan-950/30'
        : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800/80 bg-[#090e18] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header Close */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4 lg:hidden">
          <span className="font-heading text-sm font-bold text-white tracking-wide">
            AGECO NAVIGATION
          </span>
          <button
            onClick={onCloseMobile}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Nav Items Container */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {/* Main Navigation Group */}
          <div>
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Overview
            </p>
            {canAccess('admin_dashboard') && (
              <button
                onClick={() => handleSelect('dashboard')}
                className={navItemClass(activeTab === 'dashboard')}
              >
                <LayoutDashboard className="h-4 w-4 text-slate-400 group-hover:text-amber-400" />
                <span>Dashboard</span>
              </button>
            )}
          </div>

          {/* Catalogue Group */}
          {canAccess('catalogue_management') && (
            <div>
              <button
                onClick={() => setCatalogueExpanded(!catalogueExpanded)}
                className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition"
              >
                <span className="flex items-center gap-1.5">
                  <Box className="h-3.5 w-3.5 text-slate-400" />
                  Catalogue
                </span>
                {catalogueExpanded ? (
                  <ChevronDown className="h-3 w-3 text-slate-500" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-slate-500" />
                )}
              </button>

              {catalogueExpanded && (
                <div className="mt-1 space-y-0.5 border-l border-slate-800/80 ml-3 pl-1">
                  <button
                    onClick={() => handleSelect('catalogue-audiences')}
                    className={subNavItemClass(activeTab === 'catalogue-audiences')}
                  >
                    <Compass className="h-3.5 w-3.5 text-slate-500" />
                    <span>Audiences</span>
                  </button>
                  <button
                    onClick={() => handleSelect('catalogue-categories')}
                    className={subNavItemClass(activeTab === 'catalogue-categories')}
                  >
                    <FolderTree className="h-3.5 w-3.5 text-slate-500" />
                    <span>Categories</span>
                  </button>
                  <button
                    onClick={() => handleSelect('catalogue-subcategories')}
                    className={subNavItemClass(activeTab === 'catalogue-subcategories')}
                  >
                    <Layers className="h-3.5 w-3.5 text-slate-500" />
                    <span>Subcategories</span>
                  </button>
                  <button
                    onClick={() => handleSelect('catalogue-brands')}
                    className={subNavItemClass(activeTab === 'catalogue-brands')}
                  >
                    <Tag className="h-3.5 w-3.5 text-slate-500" />
                    <span>Brands</span>
                  </button>
                  <button
                    onClick={() => handleSelect('catalogue-product-types')}
                    className={subNavItemClass(activeTab === 'catalogue-product-types')}
                  >
                    <Boxes className="h-3.5 w-3.5 text-slate-500" />
                    <span>Product Types</span>
                  </button>
                  <button
                    onClick={() => handleSelect('catalogue-products')}
                    className={subNavItemClass(activeTab === 'catalogue-products')}
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    <span className="font-semibold text-slate-200">Products</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Website Management Group */}
          {canAccess('website_content') && (
            <div>
              <button
                onClick={() => setWebsiteExpanded(!websiteExpanded)}
                className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition"
              >
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-slate-400" />
                  Website
                </span>
                {websiteExpanded ? (
                  <ChevronDown className="h-3 w-3 text-slate-500" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-slate-500" />
                )}
              </button>

              {websiteExpanded && (
                <div className="mt-1 space-y-0.5 border-l border-slate-800/80 ml-3 pl-1">
                  <button
                    onClick={() => handleSelect('website-homepage')}
                    className={subNavItemClass(activeTab === 'website-homepage')}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-slate-500" />
                    <span>Homepage</span>
                  </button>
                  <button
                    onClick={() => handleSelect('website-solutions')}
                    className={subNavItemClass(activeTab === 'website-solutions')}
                  >
                    <Zap className="h-3.5 w-3.5 text-slate-500" />
                    <span>Solutions</span>
                  </button>
                  <button
                    onClick={() => handleSelect('website-industries')}
                    className={subNavItemClass(activeTab === 'website-industries')}
                  >
                    <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                    <span>Industries</span>
                  </button>
                  <button
                    onClick={() => handleSelect('website-stories')}
                    className={subNavItemClass(activeTab === 'website-stories')}
                  >
                    <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                    <span>Stories</span>
                  </button>
                  <button
                    onClick={() => handleSelect('website-projects')}
                    className={subNavItemClass(activeTab === 'website-projects')}
                  >
                    <Box className="h-3.5 w-3.5 text-slate-500" />
                    <span>Projects</span>
                  </button>
                  <button
                    onClick={() => handleSelect('website-content')}
                    className={subNavItemClass(activeTab === 'website-content')}
                  >
                    <Sliders className="h-3.5 w-3.5 text-slate-500" />
                    <span>Website Content</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Operations & Communications Group */}
          <div>
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Operations
            </p>
            <div className="space-y-1">
              {canAccess('enquiries') && (
                <button
                  onClick={() => handleSelect('enquiries')}
                  className={navItemClass(activeTab === 'enquiries')}
                >
                  <Inbox className="h-4 w-4 text-slate-400 group-hover:text-amber-400" />
                  <span className="flex-1 text-left">Enquiries & RFQs</span>
                  {enquiriesBadgeCount > 0 && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      {enquiriesBadgeCount}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => handleSelect('media')}
                className={navItemClass(activeTab === 'media')}
              >
                <Image className="h-4 w-4 text-slate-400 group-hover:text-amber-400" />
                <span>Media & CAD</span>
              </button>

              <button
                onClick={() => handleSelect('seo')}
                className={navItemClass(activeTab === 'seo')}
              >
                <Search className="h-4 w-4 text-slate-400 group-hover:text-amber-400" />
                <span>SEO Directives</span>
              </button>
            </div>
          </div>

          {/* Administration & Diagnostics (Restricted by Role Matrix) */}
          <div>
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Administration
            </p>
            <div className="space-y-1">
              {canAccess('user_management') && (
                <button
                  onClick={() => handleSelect('users')}
                  className={navItemClass(activeTab === 'users')}
                >
                  <Users className="h-4 w-4 text-slate-400 group-hover:text-amber-400" />
                  <span>User Management</span>
                </button>
              )}

              {canAccess('audit_logs') && (
                <button
                  onClick={() => handleSelect('audit-logs')}
                  className={navItemClass(activeTab === 'audit-logs')}
                >
                  <FileText className="h-4 w-4 text-slate-400 group-hover:text-amber-400" />
                  <span>Audit Logs</span>
                </button>
              )}

              {canAccess('system_settings') && (
                <button
                  onClick={() => handleSelect('settings')}
                  className={navItemClass(activeTab === 'settings')}
                >
                  <Settings className="h-4 w-4 text-slate-400 group-hover:text-amber-400" />
                  <span>System Settings</span>
                </button>
              )}

              {canAccess('database_diagnostics') && (
                <button
                  onClick={() => handleSelect('diagnostics')}
                  className={navItemClass(activeTab === 'diagnostics')}
                >
                  <Database className="h-4 w-4 text-slate-400 group-hover:text-cyan-400" />
                  <span className="flex-1 text-left">Database Diagnostics</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-cyan-300">
                    PG
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Footer: Enterprise Environment Stamp */}
        <div className="border-t border-slate-800/80 p-3 bg-slate-950/40">
          <div className="rounded border border-slate-800/60 bg-slate-900/40 p-2 text-[11px]">
            <div className="flex items-center justify-between text-slate-400 font-mono">
              <span>ADP NODE</span>
              <span className="text-emerald-400">ONLINE</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-500 truncate">
              Auth: Bearer JWT ({user?.role})
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
