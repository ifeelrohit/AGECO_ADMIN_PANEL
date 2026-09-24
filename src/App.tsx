import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { Header } from './components/layout/Header.tsx';
import { Sidebar, NavigationTarget } from './components/layout/Sidebar.tsx';
import { LoginView } from './views/auth/LoginView.tsx';
import { DashboardView } from './views/DashboardView.tsx';
import { ProductsView } from './views/catalogue/ProductsView.tsx';
import { CategoriesView } from './views/catalogue/CategoriesView.tsx';
import { BrandsView } from './views/catalogue/BrandsView.tsx';
import { AudiencesView } from './views/catalogue/AudiencesView.tsx';
import { ProductTypesView } from './views/catalogue/ProductTypesView.tsx';
import { WebsiteContentView } from './views/website/WebsiteContentView.tsx';
import { EnquiriesView } from './views/enquiries/EnquiriesView.tsx';
import { MediaView } from './views/media/MediaView.tsx';
import { SeoView } from './views/seo/SeoView.tsx';
import { UserManagementView } from './views/users/UserManagementView.tsx';
import { AuditLogsView } from './views/audit/AuditLogsView.tsx';
import { SystemSettingsView } from './views/settings/SystemSettingsView.tsx';
import { DatabaseDiagnosticsView } from './views/diagnostics/DatabaseDiagnosticsView.tsx';
import { ShieldAlert } from 'lucide-react';

const AdminPanelApp: React.FC = () => {
  const { user, isLoading, canAccess } = useAuth();
  const [activeTab, setActiveTab] = useState<NavigationTarget>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b13] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="font-mono text-xs text-slate-400">
            Initializing AGECO Digital Platform session...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  // Determine section and subpage for header breadcrumbs
  let currentSection = 'Dashboard';
  let currentSubpage: string | undefined = undefined;

  if (activeTab.startsWith('catalogue')) {
    currentSection = 'Catalogue';
    const sub = activeTab.replace('catalogue-', '');
    currentSubpage = sub.charAt(0).toUpperCase() + sub.slice(1).replace('-', ' ');
  } else if (activeTab.startsWith('website')) {
    currentSection = 'Website';
    const sub = activeTab.replace('website-', '');
    currentSubpage = sub.charAt(0).toUpperCase() + sub.slice(1);
  } else {
    switch (activeTab) {
      case 'dashboard':
        currentSection = 'Dashboard';
        break;
      case 'enquiries':
        currentSection = 'Enquiries';
        break;
      case 'media':
        currentSection = 'Media Library';
        break;
      case 'seo':
        currentSection = 'SEO';
        break;
      case 'users':
        currentSection = 'Users & Roles';
        break;
      case 'audit-logs':
        currentSection = 'Audit Logs';
        break;
      case 'settings':
        currentSection = 'Settings';
        break;
      case 'diagnostics':
        currentSection = 'Diagnostics';
        break;
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;

      // Catalogue
      case 'catalogue-products':
        return <ProductsView />;
      case 'catalogue-categories':
      case 'catalogue-subcategories':
        return <CategoriesView initialMode={activeTab === 'catalogue-subcategories' ? 'subcategories' : 'categories'} />;
      case 'catalogue-brands':
        return <BrandsView />;
      case 'catalogue-audiences':
        return <AudiencesView />;
      case 'catalogue-product-types':
        return <ProductTypesView />;

      // Website
      case 'website-homepage':
        return <WebsiteContentView initialSubpage="homepage" />;
      case 'website-solutions':
        return <WebsiteContentView initialSubpage="solutions" />;
      case 'website-industries':
        return <WebsiteContentView initialSubpage="industries" />;
      case 'website-stories':
        return <WebsiteContentView initialSubpage="stories" />;
      case 'website-projects':
        return <WebsiteContentView initialSubpage="projects" />;
      case 'website-content':
        return <WebsiteContentView initialSubpage="content" />;

      // Operations
      case 'enquiries':
        if (!canAccess('enquiries')) {
          return (
            <div className="rounded-xl border border-rose-200 bg-white p-8 text-center shadow-sm">
              <ShieldAlert className="mx-auto h-12 w-12 text-rose-500" />
              <h2 className="mt-4 text-base font-bold text-slate-900">
                Access Restricted
              </h2>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                Enquiries are accessible only to authorized roles.
              </p>
            </div>
          );
        }
        return <EnquiriesView />;

      case 'media':
        return <MediaView />;

      case 'seo':
        return <SeoView />;

      // Restricted Administrative
      case 'users':
        return <UserManagementView />;

      case 'audit-logs':
        return <AuditLogsView />;

      case 'settings':
        return <SystemSettingsView />;

      case 'diagnostics':
        return <DatabaseDiagnosticsView />;

      default:
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#070B14] text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white transition-colors duration-200">
      <Header
        currentSection={currentSection}
        currentSubpage={currentSubpage}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          enquiriesBadgeCount={1}
        />

        <main className="flex-1 overflow-y-auto bg-[#F4F6F9] dark:bg-[#070B14] p-6 lg:p-8 transition-colors duration-200">
          <div className="mx-auto max-w-7xl">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminPanelApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
