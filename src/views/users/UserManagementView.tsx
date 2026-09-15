import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Lock,
  UserX,
  X,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../../config/api.ts';
import { User, UserRole } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const UserManagementView: React.FC = () => {
  const { user: currentUser, canAccess } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('EDITOR');
  const [department, setDepartment] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get<User[]>('/users');
      if (res.success && res.data) setUsers(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess('user_management')) {
      fetchUsers();
    }
  }, [currentUser]);

  if (!canAccess('user_management')) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-rose-400" />
        <h2 className="mt-4 font-heading text-lg font-bold text-white">
          Authorization Restricted
        </h2>
        <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
          User Management is strictly restricted to <span className="text-amber-400 font-mono font-semibold">SUPER_ADMIN</span> and <span className="text-blue-400 font-mono font-semibold">ADMIN</span> roles per the locked ADP Security Role Matrix.
        </p>
      </div>
    );
  }

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await api.put<User>(`/users/${user.id}/status`, { status: newStatus });
      if (res.success && res.data) {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data! : u)));
      }
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name || !email || !department) {
      setFormError('All fields are required.');
      return;
    }

    try {
      const res = await api.post<User>('/users', {
        name,
        email,
        role,
        department,
        status: 'ACTIVE',
        twoFactorEnabled: true,
      });

      if (res.success && res.data) {
        setUsers((prev) => [...prev, res.data!]);
        setIsModalOpen(false);
        setName('');
        setEmail('');
        setDepartment('');
      } else {
        setFormError(res.error?.message || 'Failed to create user.');
      }
    } catch (err: any) {
      setFormError(err.message || 'API connection failed.');
    }
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'ADMIN':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'EDITOR':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'SALES':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'CONTENT_MANAGER':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
            User Management & Role Governance
          </h1>
          <p className="text-xs text-slate-400">
            RBAC administrative users, active sessions, and 2FA authentication state
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Provision User</span>
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0c121e]/90 shadow">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-900/60 font-mono text-[11px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-3 pl-4 pr-3">User</th>
              <th className="py-3 px-3">Role Matrix Assignment</th>
              <th className="py-3 px-3">Department</th>
              <th className="py-3 px-3">MFA Status</th>
              <th className="py-3 px-3">Account Status</th>
              <th className="py-3 pl-3 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-300">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-850/50 transition">
                <td className="py-3 pl-4 pr-3">
                  <div className="font-semibold text-white">{u.name}</div>
                  <div className="font-mono text-[11px] text-slate-400">{u.email}</div>
                </td>

                <td className="py-3 px-3">
                  <span
                    className={`inline-block rounded border px-2 py-0.5 text-[10px] font-mono font-bold ${getRoleBadgeStyle(
                      u.role
                    )}`}
                  >
                    {u.role}
                  </span>
                </td>

                <td className="py-3 px-3 text-slate-300">{u.department}</td>

                <td className="py-3 px-3">
                  {u.twoFactorEnabled ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <ShieldCheck className="h-3.5 w-3.5" /> Enforced
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500">Disabled</span>
                  )}
                </td>

                <td className="py-3 px-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      u.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {u.status}
                  </span>
                </td>

                <td className="py-3 pl-3 pr-4 text-right">
                  {u.id !== currentUser?.id ? (
                    <button
                      onClick={() => handleToggleStatus(u)}
                      className={`rounded px-2 py-1 text-[11px] font-medium border transition ${
                        u.status === 'ACTIVE'
                          ? 'border-slate-700 bg-slate-800 text-slate-300 hover:text-rose-400'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">Self</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-[#0e1525] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="font-heading text-base font-bold text-white">Provision Admin User</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 rounded-md border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Eng. Fahad Al-Otaibi"
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="f.otaibi@ageco.com"
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Role Matrix Assignment</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white font-mono"
                >
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full Platform Authority)</option>
                  <option value="ADMIN">ADMIN (Infrastructure & Operational Management)</option>
                  <option value="EDITOR">EDITOR (Technical Specifications & Documentation)</option>
                  <option value="SALES">SALES (Tenders & Commercial RFQ Pipeline)</option>
                  <option value="CONTENT_MANAGER">CONTENT_MANAGER (Website Experience & Media)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">Department</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Medium Voltage Engineering Division"
                  className="mt-1 block w-full rounded border border-slate-700 bg-slate-900 py-1.5 px-2.5 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-amber-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400"
                >
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
