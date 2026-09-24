import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  ShieldAlert,
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
      <div className="rounded-xl border border-rose-200 bg-white p-8 text-center shadow-sm">
        <ShieldAlert className="mx-auto h-12 w-12 text-rose-500" />
        <h2 className="mt-4 text-base font-bold text-slate-900">
          Access Restricted
        </h2>
        <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
          Audit logs are restricted to administrators.
        </p>
      </div>
    );
  }

  const handleExport = async () => {
    try {
      const res = await api.post<any>('/audit-logs/export');
      if (res.success) {
        const count = (res as any).count ?? logs.length;
        setExportNotice(`Exported ${count} audit events successfully.`);
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
        return 'bg-emerald-50 text-emerald-700';
      case 'UPDATE':
      case 'CONFIG_UPDATE':
        return 'bg-amber-50 text-amber-700';
      case 'DELETE':
        return 'bg-rose-50 text-rose-700';
      case 'STATUS_CHANGE':
        return 'bg-blue-50 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Audit Logs
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Activity history and administrative events.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
        >
          <Download className="h-3.5 w-3.5 text-orange-500" />
          <span>Export Logs</span>
        </button>
      </div>

      {exportNotice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          {exportNotice}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-4 sm:flex-row sm:items-center shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
          />
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-orange-500 focus:outline-none"
        >
          <option value="">All Modules</option>
          <option value="CATALOGUE">Catalogue</option>
          <option value="WEBSITE">Website</option>
          <option value="ENQUIRIES">Enquiries</option>
          <option value="AUTH">Auth</option>
          <option value="USERS">Users</option>
          <option value="SYSTEM_SETTINGS">Settings</option>
          <option value="DATABASE_DIAGNOSTICS">Diagnostics</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/60 font-semibold text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 pl-4 pr-3">Timestamp / IP</th>
                <th className="py-3 px-3">Actor</th>
                <th className="py-3 px-3">Module</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 pl-3 pr-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 pl-4 pr-3">
                      <div className="font-medium text-slate-800">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {new Date(log.createdAt).toLocaleTimeString()} • {log.ipAddress}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-900">{log.actorName}</div>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                        {log.actorRole}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="rounded bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                        {log.module}
                      </span>
                      <div className="mt-1 text-[11px] text-slate-400 font-mono truncate max-w-[140px]">
                        {log.resourceId}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 pl-3 pr-4 text-xs">
                      <p className="text-slate-800">{log.details}</p>
                      {log.diffSummary && (
                        <div className="mt-1 rounded border border-slate-200 bg-slate-50 p-1.5 font-mono text-[11px] text-slate-600">
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
