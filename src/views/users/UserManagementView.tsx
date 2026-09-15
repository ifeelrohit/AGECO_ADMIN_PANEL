import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Lock,
  X,
  ShieldAlert,
  Key,
  Copy,
  Check,
  Eye,
  RefreshCw,
  AlertCircle,
  Clock,
  Building,
  Mail,
} from 'lucide-react';
import { api } from '../../config/api.ts';
import { User, UserRole, UsersResponseData, PasswordResetResponse } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const UserManagementView: React.FC = () => {
  const { user: currentUser, canAccess } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Form states for user provisioning
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('EDITOR');
  const [department, setDepartment] = useState('');
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);

  // Password reset workflow states
  const [resetModalData, setResetModalData] = useState<{
    user: User;
    resetLink: string;
    expiresInMinutes: number;
    expiresAt?: string;
  } | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Action status feedback
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Contract: GET /api/v1/admin/users
      const res = await api.get<UsersResponseData | User[]>('/admin/users');
      if (res.success && res.data) {
        if (Array.isArray(res.data)) {
          setUsers(res.data);
        } else if ('users' in res.data && Array.isArray(res.data.users)) {
          setUsers(res.data.users);
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin users from AGECO backend', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess('user_management')) {
      fetchUsers();
    }
  }, [currentUser]);

  // Section 8 & 9: Strict RBAC check
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

  // Contract: GET /api/v1/admin/users/:userId
  const handleOpenUserDetails = async (user: User) => {
    setSelectedUser(user);
    setIsLoadingDetails(true);
    try {
      const res = await api.get<User>(`/admin/users/${user.id}`);
      if (res.success && res.data) {
        setSelectedUser(res.data);
      }
    } catch (err) {
      console.warn('Using existing user state for detail view', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Contract: PATCH /api/v1/admin/users/:userId
  const handleToggleStatus = async (user: User) => {
    const newStatus: 'ACTIVE' | 'INACTIVE' = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await api.patch<User>(`/admin/users/${user.id}`, { status: newStatus });
      if (res.success && res.data) {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data! : u)));
        if (selectedUser?.id === user.id) {
          setSelectedUser(res.data);
        }
        showSuccessMessage(`User status updated to ${newStatus}`);
      }
    } catch (err) {
      console.error('Failed to update user status via PATCH /admin/users/:userId', err);
    }
  };

  // Contract: POST /api/v1/admin/users
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisionError(null);
    if (!name || !email || !department) {
      setProvisionError('All fields are required.');
      return;
    }

    setIsProvisioning(true);
    try {
      const res = await api.post<User>('/admin/users', {
        name,
        email,
        role,
        department,
        status: 'ACTIVE',
        twoFactorEnabled: true,
      });

      if (res.success && res.data) {
        setUsers((prev) => [...prev, res.data!]);
        setIsProvisionModalOpen(false);
        setName('');
        setEmail('');
        setDepartment('');
        showSuccessMessage(`User ${res.data.name} provisioned successfully with role ${res.data.role}.`);
      } else {
        setProvisionError(res.error?.message || res.message || 'Failed to provision user account.');
      }
    } catch (err: any) {
      setProvisionError(err.message || 'Connection to AGECO backend service failed.');
    } finally {
      setIsProvisioning(false);
    }
  };

  // Contract: POST /api/v1/admin/users/:userId/password-reset
  const handleGeneratePasswordReset = async (user: User) => {
    setIsResetting(true);
    setResetError(null);
    setCopiedLink(false);

    try {
      const res = await api.post<PasswordResetResponse>(`/admin/users/${user.id}/password-reset`);
      if (res.success && res.data) {
        setResetModalData({
          user,
          resetLink: res.data.resetLink,
          expiresInMinutes: res.data.expiresInMinutes || 30,
          expiresAt: res.data.expiresAt,
        });
        showSuccessMessage(`Generated single-use password reset link for ${user.email}.`);
      } else {
        setResetError(res.error?.message || res.message || 'Failed to generate reset link.');
      }
    } catch (err: any) {
      setResetError(err.message || 'Error communicating with backend password reset service.');
    } finally {
      setIsResetting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (e) {
      console.warn('Clipboard write failed', e);
    }
  };

  const showSuccessMessage = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 4000);
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
      {/* Toast Notification */}
      {actionSuccessMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/90 px-4 py-3 text-xs text-emerald-200 shadow-xl backdrop-blur-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Header & Provision Button */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
              User Management & Role Governance
            </h1>
            <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-amber-400 border border-slate-700">
              Contract: /admin/users
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Locked RBAC matrix, authoritative PostgreSQL session control, and secure tokenized password recovery
          </p>
        </div>

        <button
          onClick={() => setIsProvisionModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Provision User</span>
        </button>
      </div>

      {/* Main Users Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0c121e]/90 shadow">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <RefreshCw className="h-5 w-5 animate-spin text-amber-400 mr-2" />
            <span className="text-xs">Loading authoritative user accounts from AGECO backend...</span>
          </div>
        ) : (
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
                <tr
                  key={u.id}
                  className="hover:bg-slate-850/50 transition cursor-pointer"
                  onClick={() => handleOpenUserDetails(u)}
                >
                  <td className="py-3 pl-4 pr-3">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      {u.name}
                      {u.id === currentUser?.id && (
                        <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[9px] font-mono text-slate-400">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">{u.email}</div>
                  </td>

                  <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
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

                  <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
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

                  <td className="py-3 pl-3 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenUserDetails(u)}
                        className="rounded border border-slate-700 bg-slate-800/80 px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white hover:border-slate-600 transition"
                        title="View User Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleGeneratePasswordReset(u)}
                        disabled={isResetting}
                        className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-300 hover:bg-amber-500/20 transition flex items-center gap-1"
                        title="Generate single-use secure reset link"
                      >
                        <Key className="h-3.5 w-3.5" />
                        <span className="hidden md:inline">Reset</span>
                      </button>

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
                        <span className="text-[11px] text-slate-500 italic px-1">Self</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* User Details Modal (Contract: GET /api/v1/admin/users/:userId) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-[#0e1525] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-400" />
                <h2 className="font-heading text-base font-bold text-white">User Account Record</h2>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isLoadingDetails ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-amber-400" />
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                  <div>
                    <h3 className="font-bold text-white text-sm">{selectedUser.name}</h3>
                    <p className="font-mono text-xs text-slate-400">{selectedUser.email}</p>
                  </div>
                  <span
                    className={`rounded border px-2.5 py-1 text-[11px] font-mono font-bold ${getRoleBadgeStyle(
                      selectedUser.role
                    )}`}
                  >
                    {selectedUser.role}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded border border-slate-800 bg-slate-900/30 p-2.5">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Building className="h-3.5 w-3.5 text-slate-400" /> Department:
                    </span>
                    <span className="font-semibold text-slate-200 mt-1 block">
                      {selectedUser.department}
                    </span>
                  </div>

                  <div className="rounded border border-slate-800 bg-slate-900/30 p-2.5">
                    <span className="text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-400" /> 2FA Authentication:
                    </span>
                    <span className="font-semibold text-emerald-400 mt-1 block">
                      {selectedUser.twoFactorEnabled ? 'Enforced' : 'Not Enforced'}
                    </span>
                  </div>

                  <div className="rounded border border-slate-800 bg-slate-900/30 p-2.5">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" /> Last Authoritative Login:
                    </span>
                    <span className="font-mono text-[11px] text-slate-300 mt-1 block">
                      {selectedUser.lastLoginAt}
                    </span>
                  </div>

                  <div className="rounded border border-slate-800 bg-slate-900/30 p-2.5">
                    <span className="text-slate-500">Account State:</span>
                    <span
                      className={`font-semibold mt-1 block ${
                        selectedUser.status === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {selectedUser.status}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleGeneratePasswordReset(selectedUser)}
                    disabled={isResetting}
                    className="flex items-center gap-1.5 rounded border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition"
                  >
                    <Key className="h-4 w-4" />
                    <span>Generate Password Reset Link</span>
                  </button>

                  <div className="flex gap-2">
                    {selectedUser.id !== currentUser?.id && (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(selectedUser)}
                        className={`rounded px-3 py-1.5 text-xs font-medium border transition ${
                          selectedUser.status === 'ACTIVE'
                            ? 'border-slate-700 bg-slate-800 text-slate-300 hover:text-rose-400'
                            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        {selectedUser.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Password Reset Modal (Contract: POST /api/v1/admin/users/:userId/password-reset) */}
      {resetModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-amber-500/40 bg-[#0e1628] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-400" />
                <h2 className="font-heading text-base font-bold text-white">
                  Secure Password Reset Generated
                </h2>
              </div>
              <button
                onClick={() => setResetModalData(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 space-y-1">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>30-Minute Single-Use Recovery Token</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  The backend has generated a secure, single-use token for{' '}
                  <strong className="text-white font-mono">{resetModalData.user.email}</strong>. Any
                  previously generated tokens for this user have been automatically invalidated.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Generated Password Reset Link:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={resetModalData.resetLink}
                    className="block w-full rounded border border-slate-700 bg-slate-900/90 py-2 px-3 text-xs text-amber-300 font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(resetModalData.resetLink)}
                    className={`flex items-center gap-1.5 rounded px-3 py-2 text-xs font-semibold transition shrink-0 ${
                      copiedLink
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded border border-slate-800 bg-slate-900/40 p-3 text-[11px] text-slate-400 space-y-1">
                <div className="font-medium text-slate-300">Admin Dispatch Instructions:</div>
                <p>
                  Copy and securely provide this link to the user. When opened, the user will be
                  prompted to establish a new password compliant with AGECO enterprise password standards.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalData(null)}
                  className="rounded bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provision User Modal (Contract: POST /api/v1/admin/users) */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-slate-800 bg-[#0e1525] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="font-heading text-base font-bold text-white">Provision Admin User</h2>
              <button
                onClick={() => setIsProvisionModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {provisionError && (
              <div className="mt-3 rounded-md border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-300">
                {provisionError}
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
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProvisioning}
                  className="rounded bg-amber-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  {isProvisioning ? 'Provisioning...' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
