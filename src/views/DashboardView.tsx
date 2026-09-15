import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Tag,
  Inbox,
  Activity,
  ArrowUpRight,
  Database,
  Building2,
  FileCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../config/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { NavigationTarget } from '../components/layout/Sidebar.tsx';

interface DashboardProps {
  onNavigate: (target: NavigationTarget) => void;
}

export const DashboardView: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, canAccess } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/dashboard/stats');
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="text-xs font-mono">Aggregating AGECO Platform telemetry...</span>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const categoryStats = data?.categoryStats || [];
  const enquiryStatusMap = data?.enquiryStatusMap || {};
  const recentAuditLogs = data?.recentAuditLogs || [];

  return (
    <div className="space-y-6">
      {/* Enterprise Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-r from-[#0c1424] via-[#0e172a] to-[#0c1424] p-5 shadow-xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 border border-amber-500/30 font-mono">
                Authoritative Console
              </span>
              <span className="text-xs text-slate-400">PostgreSQL Backend Synced</span>
            </div>
            <h1 className="mt-1 font-heading text-xl font-bold tracking-tight text-white md:text-2xl">
              Welcome, {user?.name}
            </h1>
            <p className="mt-0.5 text-xs text-slate-400">
              Department: <span className="text-slate-200">{user?.department}</span> • Role:{' '}
              <span className="font-mono text-amber-400 font-semibold">{user?.role}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {canAccess('product_management') && (
              <button
                onClick={() => onNavigate('catalogue-products')}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-700 transition"
              >
                <Boxes className="h-3.5 w-3.5 text-amber-400" />
                <span>Manage Catalogue</span>
              </button>
            )}

            {canAccess('enquiries') && (
              <button
                onClick={() => onNavigate('enquiries')}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition shadow-sm"
              >
                <Inbox className="h-3.5 w-3.5" />
                <span>Review RFQs ({metrics.newEnquiries || 0} New)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Products */}
        <div className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-4 shadow transition hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Catalogue Items</span>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-2xl font-bold text-white">
              {metrics.totalProducts || 0}
            </span>
            <span className="text-xs font-medium text-emerald-400">
              {metrics.publishedProducts || 0} Published
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
            <span>OEM Brands: {metrics.totalBrands || 0}</span>
            <button
              onClick={() => onNavigate('catalogue-products')}
              className="text-amber-400 hover:underline flex items-center gap-0.5"
            >
              View <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Metric 2: Enquiries & RFQ */}
        <div className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-4 shadow transition hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">B2B Enquiries & RFQ</span>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400 border border-purple-500/20">
              <Inbox className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-2xl font-bold text-white">
              {metrics.totalEnquiries || 0}
            </span>
            <span className="text-xs font-medium text-amber-400">
              {metrics.newEnquiries || 0} Awaiting Review
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
            <span>Quoted: {metrics.quotedEnquiries || 0} proposals</span>
            {canAccess('enquiries') && (
              <button
                onClick={() => onNavigate('enquiries')}
                className="text-purple-400 hover:underline flex items-center gap-0.5"
              >
                Triage <ArrowUpRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Metric 3: Solutions & Projects */}
        <div className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-4 shadow transition hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Turnkey Deliverables</span>
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/20">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-2xl font-bold text-white">
              {metrics.totalProjects || 0}
            </span>
            <span className="text-xs font-medium text-cyan-400">
              {metrics.activeSolutions || 0} Engineering Solutions
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
            <span>Website Synced</span>
            {canAccess('website_content') && (
              <button
                onClick={() => onNavigate('website-projects')}
                className="text-cyan-400 hover:underline flex items-center gap-0.5"
              >
                Inspect <ArrowUpRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Metric 4: Infrastructure Health */}
        <div className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-4 shadow transition hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Database Status</span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading text-2xl font-bold text-white">99.4%</span>
            <span className="text-xs font-medium text-emerald-400">Cache Hit Ratio</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
            <span>PostgreSQL 16.2</span>
            {canAccess('database_diagnostics') && (
              <button
                onClick={() => onNavigate('diagnostics')}
                className="text-emerald-400 hover:underline flex items-center gap-0.5"
              >
                Diagnostics <ArrowUpRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Catalogue Breakdown & Enquiries Funnel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Catalogue Distribution by Category */}
        <div className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-5 shadow lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="font-heading text-sm font-bold text-white">
                Catalogue Distribution by Category
              </h2>
              <p className="text-xs text-slate-400">
                Active equipment and panels mapped to electrical categories
              </p>
            </div>
            {canAccess('catalogue_management') && (
              <button
                onClick={() => onNavigate('catalogue-categories')}
                className="text-xs font-medium text-amber-400 hover:underline"
              >
                Manage Categories
              </button>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {categoryStats.map((cat: any, i: number) => {
              const count = cat.count || 0;
              const max = Math.max(...categoryStats.map((c: any) => c.count || 1), 1);
              const pct = Math.round((count / max) * 100);

              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{cat.name}</span>
                    <span className="font-mono text-slate-400">{count} products</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                      style={{ width: `${pct || 15}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Enquiry Pipeline Status */}
        <div className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-5 shadow">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="font-heading text-sm font-bold text-white">
              B2B RFP / Enquiry Pipeline
            </h2>
            <p className="text-xs text-slate-400">
              Commercial proposals and tender triage status
            </p>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="text-xs font-semibold text-slate-200">NEW</span>
              </div>
              <span className="font-heading text-base font-bold text-amber-300">
                {enquiryStatusMap.NEW || 0}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                <span className="text-xs font-semibold text-slate-200">IN REVIEW</span>
              </div>
              <span className="font-heading text-base font-bold text-blue-300">
                {enquiryStatusMap.IN_REVIEW || 0}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-purple-400" />
                <span className="text-xs font-semibold text-slate-200">QUOTED</span>
              </div>
              <span className="font-heading text-base font-bold text-purple-300">
                {enquiryStatusMap.QUOTED || 0}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">CLOSED</span>
              </div>
              <span className="font-heading text-base font-bold text-emerald-300">
                {enquiryStatusMap.CLOSED || 0}
              </span>
            </div>

            {canAccess('enquiries') && (
              <button
                onClick={() => onNavigate('enquiries')}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800/80 py-2 text-center text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
              >
                Open Tenders Management
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Audit Trail Stream */}
      {canAccess('audit_logs') && (
        <div className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-5 shadow">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-400" />
              <div>
                <h2 className="font-heading text-sm font-bold text-white">
                  Recent System Audit Events
                </h2>
                <p className="text-xs text-slate-400">
                  Authoritative immutable trail of administrative actions across ADP
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('audit-logs')}
              className="text-xs font-medium text-amber-400 hover:underline"
            >
              View Complete Audit Log
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-800/80">
            {recentAuditLogs.slice(0, 5).map((log: any) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{log.actorName}</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono text-slate-400">
                      {log.actorRole}
                    </span>
                    <span className="text-slate-500 font-mono text-[10px]">
                      IP: {log.ipAddress}
                    </span>
                  </div>
                  <p className="text-slate-300">{log.details}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] font-mono font-medium text-cyan-300 border border-slate-700/50">
                    {log.action}
                  </span>
                  <div className="mt-1 text-[10px] text-slate-500 font-mono">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
