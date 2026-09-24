import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { api } from '../../config/api.ts';
import { DiagnosticMetrics } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const DatabaseDiagnosticsView: React.FC = () => {
  const { user: currentUser, canAccess } = useAuth();
  const [metrics, setMetrics] = useState<DiagnosticMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [vacuumLoading, setVacuumLoading] = useState(false);
  const [vacuumResult, setVacuumResult] = useState<string | null>(null);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await api.get<DiagnosticMetrics>('/diagnostics');
      if (res.success && res.data) setMetrics(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess('database_diagnostics')) {
      fetchDiagnostics();
    }
  }, [currentUser]);

  if (!canAccess('database_diagnostics')) {
    return (
      <div className="rounded-xl border border-rose-200 bg-white p-8 text-center shadow-sm">
        <ShieldAlert className="mx-auto h-12 w-12 text-rose-500" />
        <h2 className="mt-4 text-base font-bold text-slate-900">
          Access Restricted
        </h2>
        <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
          Database diagnostics are restricted to administrators.
        </p>
      </div>
    );
  }

  const handleRunVacuum = async () => {
    setVacuumLoading(true);
    setVacuumResult(null);
    try {
      const res = await api.post<any>('/diagnostics/vacuum');
      if (res.success) {
        setVacuumResult(res.message || 'Vacuum completed successfully.');
        if (res.data) setMetrics(res.data);
        setTimeout(() => setVacuumResult(null), 5000);
      }
    } catch (err) {
      console.error('Vacuum operation failed', err);
    } finally {
      setVacuumLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-500 text-xs">
          <RefreshCw className="h-5 w-5 animate-spin text-orange-500" />
          <span>Loading diagnostics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Database Diagnostics
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Database health, connection pool status, and performance metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDiagnostics}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleRunVacuum}
            disabled={vacuumLoading}
            className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition shadow-sm disabled:opacity-50"
          >
            <Activity className="h-3.5 w-3.5" />
            <span>{vacuumLoading ? 'Optimizing...' : 'Optimize Tables'}</span>
          </button>
        </div>
      </div>

      {vacuumResult && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{vacuumResult}</span>
        </div>
      )}

      {/* Primary DB Metric Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Engine
          </span>
          <div className="mt-2 text-lg font-bold text-slate-900">
            {metrics.databaseEngine}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-mono">{metrics.version}</p>
          <div className="mt-2 text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Status: {metrics.status}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Connections
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {metrics.activeConnections}
            </span>
            <span className="text-xs text-slate-500">/ {metrics.maxConnections} Max</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Idle: {metrics.poolIdle}</span>
            <span>Waiting: {metrics.poolWaiting}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Cache Hit Ratio
          </span>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            {metrics.cacheHitRatio}%
          </div>
          <p className="mt-1 text-xs text-slate-500">Buffer cache efficiency</p>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Target: &gt; 99.0%
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Commit Rate
          </span>
          <div className="mt-2 text-2xl font-bold text-orange-600">
            {metrics.transactionCommitRate}%
          </div>
          <p className="mt-1 text-xs text-slate-500">Transaction integrity</p>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Uptime: {Math.floor(metrics.uptimeSeconds / 86400)}d {Math.floor((metrics.uptimeSeconds % 86400) / 3600)}h
          </div>
        </div>
      </div>

      {/* Tables & Storage Analysis */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">
              Table Storage & Rows
            </h2>
            <p className="text-xs text-slate-500">
              Row counts and disk footprint per table
            </p>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-slate-100 text-[10px] text-slate-500 uppercase">
                <tr>
                  <th className="py-2">Table</th>
                  <th className="py-2">Rows</th>
                  <th className="py-2">Size</th>
                  <th className="py-2 text-right">Last Vacuum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {metrics.tableStats.map((tbl) => (
                  <tr key={tbl.tableName} className="hover:bg-slate-50">
                    <td className="py-2.5 font-semibold text-slate-900">{tbl.tableName}</td>
                    <td className="py-2.5">{tbl.rowCount}</td>
                    <td className="py-2.5">{tbl.sizeKb} KB</td>
                    <td className="py-2.5 text-right text-slate-500">
                      {new Date(tbl.lastVacuum).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Database Migrations */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">
              Schema Migrations
            </h2>
            <p className="text-xs text-slate-500">
              Applied migrations history
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {metrics.migrations.map((m) => (
              <div
                key={m.migrationName}
                className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs"
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="font-semibold text-slate-800">{m.migrationName}</span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    {m.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>SHA256: {m.checksum}</span>
                  <span>{new Date(m.appliedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
