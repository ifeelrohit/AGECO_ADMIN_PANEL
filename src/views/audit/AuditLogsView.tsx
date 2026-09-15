import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Download,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Terminal,
} from 'lucide-react';
import { api } from '../../config/api.ts';
import { AuditLog } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const AuditLogsView: React.FC = () => {
  const { user: currentUser, canAccess } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get<AuditLog[]>('/audit-logs');
      if (res.success && res.data) setLogs(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess('audit_logs')) {
      fetchLogs();
    }
  }, [currentUser]);

  if (!canAccess('audit_logs')) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-rose-400" />
        <h2 className="mt-4 font-heading text-lg font-bold text-white">
          Authorization Restricted
        </h2>
        <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
          Audit log inspection is restricted to <span className="text-amber-400 font-mono font-semibold">SUPER_ADMIN</span> and <span className="text-blue-400 font-mono font-semibold">ADMIN</span> roles per the locked ADP Security Role Matrix.
        </p>
      </div>
    );
  }

  const handleExport = async () => {
    try {
      const res = await api.post<any>('/audit-logs/export');
      if (res.success) {
        const count = (res as any).count ?? logs.length;
        setExportNotice(`Audit trail report generated (${count} events recorded)`);
        setTimeout(() => setExportNotice(null), 4000);
      }
    } catch (err) {
      console.error('Failed to export audit logs', err);
    }
  };

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      !searchQuery ||
      l.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.resourceId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = !moduleFilter || l.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'UPDATE':
      case 'CONFIG_UPDATE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'DELETE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'STATUS_CHANGE':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
            Audit Logs & Security Compliance
          </h1>
          <p className="text-xs text-slate-400">
            Immutable, cryptographically verifiable trace of administrative operations across ADP
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
        >
          <Download className="h-4 w-4 text-amber-400" />
          <span>Export Compliance Snapshot</span>
        </button>
      </div>

      {exportNotice && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
          {exportNotice}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-[#0c121e]/90 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search audit trail by actor name, resource ID, or detail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-900/90 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs text-slate-300 focus:border-amber-500 focus:outline-none"
        >
          <option value="">All ADP Modules</option>
          <option value="CATALOGUE">CATALOGUE</option>
          <option value="WEBSITE">WEBSITE</option>
          <option value="ENQUIRIES">ENQUIRIES</option>
          <option value="AUTH">AUTH</option>
          <option value="USERS">USERS</option>
          <option value="SYSTEM_SETTINGS">SYSTEM_SETTINGS</option>
          <option value="DATABASE_DIAGNOSTICS">DATABASE_DIAGNOSTICS</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0c121e]/90 shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/60 font-mono text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 pl-4 pr-3">Timestamp / IP</th>
                <th className="py-3 px-3">Actor & Role</th>
                <th className="py-3 px-3">Module / Resource</th>
                <th className="py-3 px-3">Action Type</th>
                <th className="py-3 pl-3 pr-4">Details & Mutation Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No audit records match the filter query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/50 transition font-mono">
                    <td className="py-3 pl-4 pr-3">
                      <div className="text-slate-200">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(log.createdAt).toLocaleTimeString()} • {log.ipAddress}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-sans">
                      <div className="font-semibold text-white">{log.actorName}</div>
                      <span className="rounded bg-slate-800 px-1.5 py-0.2 font-mono text-[9px] text-amber-400">
                        {log.actorRole}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] text-cyan-300 border border-slate-800">
                        {log.module}
                      </span>
                      <div className="mt-1 text-[10px] text-slate-500 truncate max-w-[140px]">
                        {log.resourceId}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block rounded border px-2 py-0.5 text-[10px] font-bold ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 pl-3 pr-4 font-sans text-xs">
                      <p className="text-slate-200">{log.details}</p>
                      {log.diffSummary && (
                        <div className="mt-1 rounded bg-slate-950/70 p-1.5 font-mono text-[10px] text-amber-400/90 border border-slate-800/60">
                          {log.diffSummary}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
