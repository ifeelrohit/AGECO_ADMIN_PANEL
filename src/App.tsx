import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
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
        currentSection = 'Enquiries & RFQs';
        break;
      case 'media':
        currentSection = 'Media & CAD';
        break;
      case 'seo':
        currentSection = 'SEO Directives';
        break;
      case 'users':
        currentSection = 'User Management';
        break;
      case 'audit-logs':
        currentSection = 'Audit Logs';
        break;
      case 'settings':
        currentSection = 'System Settings';
        break;
      case 'diagnostics':
        currentSection = 'Database Diagnostics';
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
        return <CategoriesView />;
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
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
              <ShieldAlert className="mx-auto h-12 w-12 text-rose-400" />
              <h2 className="mt-4 font-heading text-lg font-bold text-white">
                Authorization Restricted
              </h2>
              <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
                Tender inquiries and commercial RFQs are accessible only to SUPER_ADMIN, ADMIN, and SALES roles.
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
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
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

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#070b13]">
          <div className="mx-auto max-w-7xl">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AdminPanelApp />
    </AuthProvider>
  );
}
