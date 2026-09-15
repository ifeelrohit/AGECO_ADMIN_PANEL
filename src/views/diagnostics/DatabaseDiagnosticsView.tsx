import React, { useState, useEffect } from 'react';
import {
  Database,
  Activity,
  ShieldAlert,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Cpu,
  Layers,
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
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-rose-400" />
        <h2 className="mt-4 font-heading text-lg font-bold text-white">
          Authorization Restricted
        </h2>
        <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
          Database diagnostics are restricted to <span className="text-amber-400 font-mono font-semibold">SUPER_ADMIN</span> and <span className="text-blue-400 font-mono font-semibold">ADMIN</span> roles per the locked ADP Security Role Matrix.
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
        setVacuumResult(res.message || 'VACUUM ANALYZE completed successfully.');
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
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          <span className="text-xs font-mono">Querying PostgreSQL pg_stat_activity & catalog...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
            PostgreSQL Database Diagnostics & Health
          </h1>
          <p className="text-xs text-slate-400">
            Authoritative connection pool telemetry, buffer cache hit ratios, and table bloat maintenance
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDiagnostics}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
            <span>Refresh Stats</span>
          </button>

          <button
            onClick={handleRunVacuum}
            disabled={vacuumLoading}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition shadow-sm disabled:opacity-50"
          >
            <Activity className="h-3.5 w-3.5" />
            <span>{vacuumLoading ? 'Running VACUUM...' : 'Run VACUUM ANALYZE'}</span>
          </button>
        </div>
      </div>

      {vacuumResult && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{vacuumResult}</span>
        </div>
      )}

      {/* Primary DB Metric Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-4 shadow">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Database Engine
          </span>
          <div className="mt-2 font-heading text-lg font-bold text-white">
            {metrics.databaseEngine}
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-mono">{metrics.version}</p>
          <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>STATUS: {metrics.status}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-4 shadow">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Connection Pool
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-heading text-2xl font-bold text-white">
              {metrics.activeConnections}
            </span>
            <span className="text-xs text-slate-400">/ {metrics.maxConnections} Max</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Pool Idle: {metrics.poolIdle}</span>
            <span>Waiting: {metrics.poolWaiting}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-4 shadow">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Cache Hit Ratio
          </span>
          <div className="mt-2 font-heading text-2xl font-bold text-emerald-400">
            {metrics.cacheHitRatio}%
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Shared buffers efficiency</p>
          <div className="mt-2 text-[10px] text-slate-500 font-mono">
            Optimal: &gt; 99.0%
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-4 shadow">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Commit Rate
          </span>
          <div className="mt-2 font-heading text-2xl font-bold text-cyan-400">
            {metrics.transactionCommitRate}%
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Zero deadlock incidents</p>
          <div className="mt-2 text-[10px] text-slate-500 font-mono">
            Uptime: {Math.floor(metrics.uptimeSeconds / 86400)}d {Math.floor((metrics.uptimeSeconds % 86400) / 3600)}h
          </div>
        </div>
      </div>

      {/* Tables & Storage Bloat Analysis */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-5 shadow">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="font-heading text-sm font-bold text-white">
              Production Table Footprint & Statistics
            </h2>
            <p className="text-xs text-slate-400">
              Live row volume and disk consumption per relation
            </p>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-slate-800 text-[10px] text-slate-500 uppercase">
                <tr>
                  <th className="py-2">Table Name</th>
                  <th className="py-2">Rows</th>
                  <th className="py-2">Disk Size</th>
                  <th className="py-2 text-right">Last Vacuum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {metrics.tableStats.map((tbl) => (
                  <tr key={tbl.tableName} className="hover:bg-slate-850/50">
                    <td className="py-2 text-cyan-300">{tbl.tableName}</td>
                    <td className="py-2">{tbl.rowCount}</td>
                    <td className="py-2">{tbl.sizeKb} KB</td>
                    <td className="py-2 text-right text-slate-400">
                      {new Date(tbl.lastVacuum).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Database Migrations Timeline */}
        <div className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-5 shadow">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="font-heading text-sm font-bold text-white">
              Applied Schema Migrations (Prisma / Flyway)
            </h2>
            <p className="text-xs text-slate-400">
              Deterministic schema version ledger applied to PostgreSQL
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {metrics.migrations.map((m) => (
              <div
                key={m.migrationName}
                className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3 text-xs"
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="font-semibold text-slate-200">{m.migrationName}</span>
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    {m.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
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
