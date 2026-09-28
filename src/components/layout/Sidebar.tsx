import React, { useState } from 'react';
import {
  LayoutDashboard,
  Box,
  Globe,
  Inbox,
  Image,
  Search,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Tag,
  Zap,
  LogOut,
  X,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export type NavigationTarget =
  | 'dashboard'
  // Catalogue
  | 'catalogue-audiences'
  | 'catalogue-categories'
  | 'catalogue-subcategories'
  | 'catalogue-brands'
  | 'catalogue-product-types'
  | 'catalogue-attributes'
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
}) => {
  const { logout } = useAuth();

  // Accordion states
  const [categoriesOpen, setCategoriesOpen] = useState(
    activeTab.includes('categories') || activeTab.includes('subcategories')
  );
  const [productsOpen, setProductsOpen] = useState(
    activeTab.includes('products') || activeTab.includes('product-types')
  );

  const handleSelect = (tab: NavigationTarget) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

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
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#0A1120] text-slate-300 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header: AGECO SINCE 1983 Emblem */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800/60 px-5">
          <div className="flex items-center gap-2.5">
            {/* Vector AGECO Logo matching screenshot */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <span className="font-heading text-lg font-black tracking-wider text-white">
                  AGECO
                </span>
                {/* Lightning Bolt Circle Badge */}
                <div className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[#0A1120]">
                  <Zap className="h-2.5 w-2.5 fill-current text-[#0A1120]" />
                </div>
              </div>
              <span className="text-[9px] font-semibold tracking-widest text-slate-400">
                — SINCE 1983 —
              </span>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {/* OVERVIEW */}
          <div>
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              OVERVIEW
            </p>
            <button
              type="button"
              onClick={() => handleSelect('dashboard')}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <LayoutDashboard
                className={`h-4 w-4 ${
                  activeTab === 'dashboard' ? 'text-white' : 'text-slate-400'
                }`}
              />
              <span>Dashboard</span>
            </button>
          </div>

          {/* CATALOGUE */}
          <div>
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              CATALOGUE
            </p>
            <div className="space-y-1">
              {/* Brands */}
              <button
                type="button"
                onClick={() => handleSelect('catalogue-brands')}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  activeTab === 'catalogue-brands'
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Tag className="h-3.5 w-3.5 text-slate-400" />
                <span>Brands</span>
              </button>

              {/* Categories */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setCategoriesOpen(!categoriesOpen);
                    handleSelect('catalogue-categories');
                  }}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                    activeTab === 'catalogue-categories' || activeTab === 'catalogue-subcategories'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FolderTree className="h-3.5 w-3.5 text-slate-400" />
                    <span>Categories</span>
                  </div>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                      categoriesOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {categoriesOpen && (
                  <div className="ml-5 mt-1 space-y-0.5 border-l border-slate-800 pl-3">
                    <button
                      type="button"
                      onClick={() => handleSelect('catalogue-categories')}
                      className={`block w-full py-1 text-left text-xs ${
                        activeTab === 'catalogue-categories'
                          ? 'text-orange-400 font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All Categories
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelect('catalogue-subcategories')}
                      className={`block w-full py-1 text-left text-xs ${
                        activeTab === 'catalogue-subcategories'
                          ? 'text-orange-400 font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Subcategories
                    </button>
                  </div>
                )}
              </div>

              {/* Products */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setProductsOpen(!productsOpen);
                    handleSelect('catalogue-products');
                  }}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                    activeTab === 'catalogue-products' || activeTab === 'catalogue-product-types'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Box className="h-3.5 w-3.5 text-slate-400" />
                    <span>Products</span>
                  </div>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                      productsOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {productsOpen && (
                  <div className="ml-5 mt-1 space-y-0.5 border-l border-slate-800 pl-3">
                    <button
                      type="button"
                      onClick={() => handleSelect('catalogue-products')}
                      className={`block w-full py-1 text-left text-xs ${
                        activeTab === 'catalogue-products'
                          ? 'text-orange-400 font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All Products
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelect('catalogue-product-types')}
                      className={`block w-full py-1 text-left text-xs ${
                        activeTab === 'catalogue-product-types'
                          ? 'text-orange-400 font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Product Types
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelect('catalogue-attributes')}
                      className={`block w-full py-1 text-left text-xs ${
                        activeTab === 'catalogue-attributes'
                          ? 'text-orange-400 font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Product Attributes
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* OPERATIONS */}
          <div>
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              OPERATIONS
            </p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleSelect('enquiries')}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  activeTab === 'enquiries'
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Inbox className="h-3.5 w-3.5 text-slate-400" />
                <span>Enquiries</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelect('users')}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  activeTab === 'users'
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <span>Users & Roles</span>
              </button>
            </div>
          </div>

          {/* WEBSITE */}
          <div>
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              WEBSITE
            </p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleSelect('website-content')}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  activeTab.startsWith('website')
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span>Website Content</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelect('media')}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  activeTab === 'media'
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Image className="h-3.5 w-3.5 text-slate-400" />
                <span>Media Library</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelect('seo')}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  activeTab === 'seo'
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Search className="h-3.5 w-3.5 text-slate-400" />
                <span>SEO</span>
              </button>
            </div>
          </div>

          {/* SYSTEM */}
          <div>
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              SYSTEM
            </p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleSelect('settings')}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  activeTab === 'settings'
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Settings className="h-3.5 w-3.5 text-slate-400" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer: Clean Logout Button matching screenshot */}
        <div className="border-t border-slate-800/80 p-3">
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <LogOut className="h-4 w-4 text-slate-400" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
