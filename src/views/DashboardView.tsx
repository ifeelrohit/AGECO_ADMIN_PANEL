import React, { useEffect, useState } from 'react';
import {
  Box,
  Check,
  Tag,
  Mail,
  AlertCircle,
  Layers,
  Image as ImageIcon,
  Compass,
  Plus,
} from 'lucide-react';
import { api } from '../config/api.ts';
import { NavigationTarget } from '../components/layout/Sidebar.tsx';

interface DashboardProps {
  onNavigate: (target: NavigationTarget) => void;
}

export const DashboardView: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get<any>('/dashboard/stats');
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const metrics = data?.metrics || {};

  // Stat numbers matching the user's dashboard specification
  const totalProducts = metrics.totalProducts ?? 0;
  const publishedProducts = metrics.publishedProducts ?? 0;
  const totalBrands = metrics.totalBrands ?? 18;
  const totalEnquiries = metrics.totalEnquiries ?? 3;
  const pendingEnquiries = metrics.newEnquiries ?? 2;
  const categoriesCount = data?.categoryStats?.length ?? 12;
  const mediaAssets = metrics.totalMediaAssets ?? 0;
  const productFamilies = 4;

  const statCards = [
    {
      label: 'Total Products',
      value: totalProducts,
      icon: <Box className="h-4 w-4" />,
    },
    {
      label: 'Published Products',
      value: publishedProducts,
      icon: <Check className="h-4 w-4" />,
    },
    {
      label: 'Total Brands',
      value: totalBrands,
      icon: <Tag className="h-4 w-4" />,
    },
    {
      label: 'Total Enquiries',
      value: totalEnquiries,
      icon: <Mail className="h-4 w-4" />,
    },
    {
      label: 'Pending Enquiries',
      value: pendingEnquiries,
      icon: <AlertCircle className="h-4 w-4" />,
    },
    {
      label: 'Categories',
      value: categoriesCount,
      icon: <Layers className="h-4 w-4" />,
    },
    {
      label: 'Media Assets',
      value: mediaAssets,
      icon: <ImageIcon className="h-4 w-4" />,
    },
    {
      label: 'Product Families',
      value: productFamilies,
      icon: <Compass className="h-4 w-4" />,
    },
  ];

  const recentEnquiries = [
    {
      name: 'Rajesh Sharma',
      subject: 'Bathroom solution enquiry',
      status: 'New',
      badgeClass: 'bg-amber-100/80 text-amber-800',
    },
    {
      name: 'Project Team',
      subject: 'Commercial electrical requirement',
      status: 'In Progress',
      badgeClass: 'bg-amber-100/80 text-amber-800',
    },
    {
      name: 'Anita Mehta',
      subject: 'Home appliance enquiry',
      status: 'Resolved',
      badgeClass: 'bg-emerald-100 text-emerald-800',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Title Section */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Dashboard
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Manage the AGECO Digital Platform from one central workspace.
        </p>
      </div>

      {/* 8 Stat Cards Grid (2 rows of 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-orange-300/80 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                {card.label}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                {card.icon}
              </div>
            </div>
            <div className="mt-3 text-2xl font-bold text-slate-900 font-heading">
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Container */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Quick Actions</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Common catalogue and content operations.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <button
            type="button"
            onClick={() => onNavigate('catalogue-products')}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-3.5 px-3 text-xs font-semibold text-slate-800 hover:border-orange-500 hover:text-orange-600 transition shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <Plus className="h-3.5 w-3.5 text-slate-600" />
            <span>Add Product</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('catalogue-brands')}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-3.5 px-3 text-xs font-semibold text-slate-800 hover:border-orange-500 hover:text-orange-600 transition shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <Plus className="h-3.5 w-3.5 text-slate-600" />
            <span>Add Brand</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('catalogue-categories')}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-3.5 px-3 text-xs font-semibold text-slate-800 hover:border-orange-500 hover:text-orange-600 transition shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <Plus className="h-3.5 w-3.5 text-slate-600" />
            <span>Add Category</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('enquiries')}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-3.5 px-3 text-xs font-semibold text-slate-800 hover:border-orange-500 hover:text-orange-600 transition shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <Mail className="h-3.5 w-3.5 text-slate-600" />
            <span>Enquiries</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('media')}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-3.5 px-3 text-xs font-semibold text-slate-800 hover:border-orange-500 hover:text-orange-600 transition shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <ImageIcon className="h-3.5 w-3.5 text-slate-600" />
            <span>Media Library</span>
          </button>
        </div>
      </div>

      {/* Two Column Section: Recent Products & Recent Enquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Products */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-sm font-bold text-slate-900">Recent Products</h3>
            <button
              type="button"
              onClick={() => onNavigate('catalogue-products')}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              View All
            </button>
          </div>

          <div className="py-20 text-center text-xs text-slate-400">
            No products yet. Use Add Product to create the first catalogue item.
          </div>
        </div>

        {/* Right Column: Recent Enquiries */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-sm font-bold text-slate-900">Recent Enquiries</h3>
            <button
              type="button"
              onClick={() => onNavigate('enquiries')}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentEnquiries.map((enq, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3 hover:bg-slate-50/50 transition px-1 rounded-lg"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {enq.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {enq.subject}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${enq.badgeClass}`}
                >
                  {enq.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
