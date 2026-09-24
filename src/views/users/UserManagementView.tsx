import React, { useState, useEffect, useMemo } from 'react';
import {
  Key,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Mail,
  UserCheck,
  Calendar,
  Shield,
  X,
  RefreshCw,
  Lock,
  CheckCircle2,
  Edit2,
  Plus,
  Trash2,
  Search,
  ShieldCheck,
  ShieldAlert,
  Building2,
  UserPlus,
} from 'lucide-react';
import { api } from '../../config/api.ts';
import { User, UserRole, PasswordResetResponse } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

// Predefined departments for quick selection in the edit form
const PREDEFINED_DEPARTMENTS = [
  'Executive Technical Board',
  'System & Operations Infrastructure',
  'Technical Communications & Documentation',
  'B2B Major Projects & Tenders',
  'Brand Marketing & Digital Portals',
  'Engineering & QA Standards',
  'Supply Chain & Distribution',
];

// Helper to format role names
const ROLE_CONFIG: Record<
  UserRole,
  { label: string; badgeClass: string; description: string }
> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Full unrestricted platform control, user provisioning & security governance',
  },
  ADMIN: {
    label: 'Administrator',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'System configuration, operational monitoring & catalogue oversight',
  },
  EDITOR: {
    label: 'Editor',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Product catalogue authoring, technical specifications & datasheet review',
  },
  SALES: {
    label: 'Sales Representative',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Enquiry lead review, client correspondence & procurement quote handling',
  },
  CONTENT_MANAGER: {
    label: 'Content Manager',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'Brand landing pages, media library curation & web presentation',
  },
};

export const UserManagementView: React.FC = () => {
  const { user: currentUser, updateCurrentUser } = useAuth();

  // Users Directory State
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ALL');

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('EDITOR');
  const [editDepartment, setEditDepartment] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [editTwoFactor, setEditTwoFactor] = useState(false);
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFirstName, setAddFirstName] = useState('');
  const [addLastName, setAddLastName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState<UserRole>('EDITOR');
  const [addDepartment, setAddDepartment] = useState('System & Operations Infrastructure');
  const [addStatus, setAddStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [addTwoFactor, setAddTwoFactor] = useState(false);
  const [addPassword, setAddPassword] = useState('AgecoPassword2026!');
  const [addError, setAddError] = useState<string | null>(null);
  const [isSavingAdd, setIsSavingAdd] = useState(false);

  // Password Management Modal State (for self or targeted user)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [targetPasswordUserId, setTargetPasswordUserId] = useState<string | null>(null);
  const [targetPasswordUserName, setTargetPasswordUserName] = useState<string>('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Reset Token Modal State
  const [resetModalData, setResetModalData] = useState<{
    userName: string;
    userEmail: string;
    resetLink: string;
    expiresInMinutes: number;
    expiresAt?: string;
  } | null>(null);
  const [isGeneratingReset, setIsGeneratingReset] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Delete User Confirmation State
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Action status notification
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Fetch all users from authoritative endpoint
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await api.get<{ users: User[] }>('/admin/users');
      if (res.success && res.data?.users) {
        setUsers(res.data.users);
      }
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered and searched users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        searchQuery === '' ||
        (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.department || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Open Edit Modal and prefill all existing details
  const handleOpenEditModal = (targetUser: User) => {
    setEditingUser(targetUser);
    setEditError(null);

    // Extract first and last name
    let first = targetUser.firstName || '';
    let last = targetUser.lastName || '';
    if (!first && targetUser.name) {
      const parts = targetUser.name.trim().split(/\s+/);
      first = parts[0] || '';
      last = parts.slice(1).join(' ') || '';
    }

    setEditFirstName(first);
    setEditLastName(last);
    setEditEmail(targetUser.email || '');
    setEditRole(targetUser.role || 'EDITOR');
    setEditDepartment(targetUser.department || 'General Administration');
    setEditStatus(targetUser.status || 'ACTIVE');
    setEditTwoFactor(Boolean(targetUser.twoFactorEnabled));
    setEditNewPassword('');
  };

  // Save edited user details
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);

    const trimmedFirst = editFirstName.trim();
    const trimmedLast = editLastName.trim();
    const fullName = `${trimmedFirst} ${trimmedLast}`.trim() || trimmedFirst || editingUser.name || 'User';

    if (!editEmail.trim() || !editEmail.includes('@')) {
      setEditError('Please provide a valid email address.');
      return;
    }

    if (editNewPassword && editNewPassword.length < 8) {
      setEditError('If setting a new password, it must be at least 8 characters long.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const payload: any = {
        name: fullName,
        firstName: trimmedFirst,
        lastName: trimmedLast,
        email: editEmail.trim().toLowerCase(),
        role: editRole,
        department: editDepartment.trim(),
        status: editStatus,
        twoFactorEnabled: editTwoFactor,
      };

      if (editNewPassword.trim()) {
        payload.password = editNewPassword.trim();
      }

      const res = await api.patch<User>(`/admin/users/${editingUser.id}`, payload);

      if (res.success && res.data) {
        const updated = res.data;
        // Update user list in place
        setUsers((prev) =>
          prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
        );

        // If the updated user is the currently logged-in user, synchronize AuthContext
        if (currentUser?.id === updated.id) {
          updateCurrentUser({
            name: updated.name,
            firstName: trimmedFirst,
            lastName: trimmedLast,
            email: updated.email,
            role: updated.role,
            department: updated.department,
            status: updated.status,
            twoFactorEnabled: updated.twoFactorEnabled,
          });
        }

        showNotification(`User details for ${updated.name || updated.email} updated successfully.`);
        setEditingUser(null);
      } else {
        setEditError(res.error?.message || 'Failed to update user details.');
      }
    } catch (err: any) {
      setEditError(err?.message || 'Network error while updating user details.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Create New User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const trimmedFirst = addFirstName.trim();
    const trimmedLast = addLastName.trim();
    const fullName = `${trimmedFirst} ${trimmedLast}`.trim();

    if (!fullName) {
      setAddError('Please specify the user full name.');
      return;
    }

    if (!addEmail.trim() || !addEmail.includes('@')) {
      setAddError('Please enter a valid corporate email address.');
      return;
    }

    if (addPassword && addPassword.length < 8) {
      setAddError('Initial password must be at least 8 characters long.');
      return;
    }

    setIsSavingAdd(true);
    try {
      const res = await api.post<User>('/admin/users', {
        name: fullName,
        firstName: trimmedFirst,
        lastName: trimmedLast,
        email: addEmail.trim().toLowerCase(),
        role: addRole,
        department: addDepartment.trim() || 'General Administration',
        status: addStatus,
        twoFactorEnabled: addTwoFactor,
        password: addPassword || 'AgecoPassword2026!',
      });

      if (res.success && res.data) {
        showNotification(`User ${res.data.name} (${res.data.email}) created successfully.`);
        setIsAddModalOpen(false);
        setAddFirstName('');
        setAddLastName('');
        setAddEmail('');
        setAddRole('EDITOR');
        setAddDepartment('System & Operations Infrastructure');
        setAddPassword('AgecoPassword2026!');
        setAddTwoFactor(false);
        fetchUsers();
      } else {
        setAddError(res.error?.message || 'Failed to create user account.');
      }
    } catch (err: any) {
      setAddError(err?.message || 'Network error while creating user.');
    } finally {
      setIsSavingAdd(false);
    }
  };

  // Delete User Confirmation
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      const res = await api.delete(`/admin/users/${userToDelete.id}`);
      if (res.success) {
        showNotification(`User ${userToDelete.name || userToDelete.email} has been removed.`);
        setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
        setUserToDelete(null);
      } else {
        alert(res.error?.message || 'Failed to delete user.');
      }
    } catch (err: any) {
      alert(err?.message || 'Network error deleting user.');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Generate Single-Use Password Reset Link
  const handleGenerateResetLink = async (targetUser: User) => {
    setIsGeneratingReset(true);
    setResetError(null);
    setCopiedLink(false);

    try {
      const res = await api.post<PasswordResetResponse>(
        `/admin/users/${targetUser.id}/password-reset`
      );

      if (res.success && res.data?.resetLink) {
        setResetModalData({
          userName: targetUser.name || targetUser.email,
          userEmail: targetUser.email,
          resetLink: res.data.resetLink,
          expiresInMinutes: res.data.expiresInMinutes || 30,
          expiresAt: res.data.expiresAt,
        });
      } else {
        showNotification(res.error?.message || 'Failed to generate reset link.');
      }
    } catch (err: any) {
      showNotification(err?.message || 'Password reset service unavailable.');
    } finally {
      setIsGeneratingReset(false);
    }
  };

  const copyResetLink = () => {
    if (resetModalData?.resetLink) {
      navigator.clipboard.writeText(resetModalData.resetLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Open Password Modal for a user
  const handleOpenPasswordModal = (targetUser: User) => {
    setTargetPasswordUserId(targetUser.id);
    setTargetPasswordUserName(targetUser.name || targetUser.email);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setIsPasswordModalOpen(true);
  };

  // Handle Password Change Submission
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    const isSelf = targetPasswordUserId === currentUser?.id;
    if (isSelf && !currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const res = await api.post(`/admin/users/${targetPasswordUserId}/change-password`, {
        currentPassword,
        newPassword,
      });

      if (res.success) {
        showNotification(`Password updated for ${targetPasswordUserName}.`);
        setIsPasswordModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(res.error?.message || 'Password update failed.');
      }
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to update password.');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Profile details for current active user banner
  const currentFirst =
    currentUser?.firstName ||
    (currentUser?.name ? currentUser.name.split(' ')[0] : '') ||
    'Admin';
  const currentLast =
    currentUser?.lastName ||
    (currentUser?.name ? currentUser.name.split(' ').slice(1).join(' ') : '') ||
    '';
  const currentRole = currentUser?.role || 'SUPER_ADMIN';
  const currentDepartment = currentUser?.department || 'Executive Technical Board';
  const currentEmail = currentUser?.email || 'superadmin@ageco.com';
  const currentStatus = currentUser?.status || 'ACTIVE';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Users & Roles
            </h1>
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">
              {users.length} Platform {users.length === 1 ? 'User' : 'Users'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Manage system operators, assign access privileges, and edit user profile details.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchUsers}
            disabled={isLoadingUsers}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
            title="Refresh user list"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isLoadingUsers ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAddError(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-orange-600 transition"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Status Feedback Notification */}
      {feedbackMessage && (
        <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 shadow-sm transition">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="font-medium">{feedbackMessage}</span>
        </div>
      )}

      {/* Active Administrator Summary Card with EDIT BUTTON */}
      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#0A1120] text-base font-bold text-white shadow-sm">
                {currentFirst.charAt(0)}
                {currentLast.charAt(0) || currentFirst.charAt(1) || 'A'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    {currentFirst} {currentLast}
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {currentStatus}
                  </span>
                  <span className="rounded bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                    You
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {currentEmail}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    {currentDepartment}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons for Active Admin */}
            <div className="flex flex-wrap items-center gap-2">
              {currentUser && (
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(currentUser)}
                  className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-orange-600 transition"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit Profile Details</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => currentUser && handleOpenPasswordModal(currentUser)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <Key className="h-3.5 w-3.5 text-orange-500" />
                <span>Password</span>
              </button>

              <button
                type="button"
                onClick={() => currentUser && handleGenerateResetLink(currentUser)}
                disabled={isGeneratingReset}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isGeneratingReset ? 'animate-spin' : ''}`} />
                <span>Reset Link</span>
              </button>
            </div>
          </div>
        </div>

        {/* Role Distribution Chips */}
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5 border-t border-slate-100 bg-slate-50/30 text-xs">
          {(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'SALES', 'CONTENT_MANAGER'] as UserRole[]).map((r) => {
            const count = users.filter((u) => u.role === r).length;
            const config = ROLE_CONFIG[r];
            return (
              <div
                key={r}
                onClick={() => setRoleFilter(roleFilter === r ? 'ALL' : r)}
                className={`cursor-pointer rounded-lg border p-2.5 transition ${
                  roleFilter === r
                    ? 'border-orange-500 bg-orange-50/50 shadow-xs'
                    : 'border-slate-200/80 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 text-[11px] truncate">
                    {config.label}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                    {count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Users & Roles Directory Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        {/* Search & Filters Bar */}
        <div className="border-b border-slate-100 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or department..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:bg-white focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Selectors */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                aria-label="Filter users by assigned role"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-orange-500 focus:outline-none"
              >
                <option value="ALL">All Roles ({users.length})</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Administrator</option>
                <option value="EDITOR">Editor</option>
                <option value="SALES">Sales</option>
                <option value="CONTENT_MANAGER">Content Manager</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                aria-label="Filter users by account status"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-orange-500 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>

              {(roleFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery !== '') && (
                <button
                  type="button"
                  onClick={() => {
                    setRoleFilter('ALL');
                    setStatusFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 px-2 py-1"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3.5">User</th>
                <th className="px-4 py-3.5">Assigned Role</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">2FA</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Last Login</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoadingUsers ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="mx-auto h-5 w-5 animate-spin text-orange-500 mb-2" />
                    Loading platform users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <UserCheck className="mx-auto h-6 w-6 text-slate-300 mb-2" />
                    No users matching criteria found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleConfig = ROLE_CONFIG[u.role] || {
                    label: u.role,
                    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                    description: '',
                  };
                  const isCurrent = currentUser?.id === u.id;
                  const initials = u.name
                    ? u.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                    : u.email.substring(0, 2).toUpperCase();

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/60 transition ${
                        isCurrent ? 'bg-orange-50/20' : ''
                      }`}
                    >
                      {/* User Column */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white shadow-xs">
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900">
                                {u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User'}
                              </span>
                              {isCurrent && (
                                <span className="rounded bg-orange-100 px-1.5 py-0.2 text-[10px] font-bold text-orange-700">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono block">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Assigned Role */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-bold ${roleConfig.badgeClass}`}
                          title={roleConfig.description}
                        >
                          <Shield className="h-3 w-3" />
                          {roleConfig.label}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5 text-slate-700">
                        <span className="truncate max-w-[180px] block font-medium">
                          {u.department || 'General Administration'}
                        </span>
                      </td>

                      {/* 2FA Status */}
                      <td className="px-4 py-3.5">
                        {u.twoFactorEnabled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
                            Disabled
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : u.status === 'INACTIVE'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-500'
                                : u.status === 'INACTIVE'
                                ? 'bg-slate-400'
                                : 'bg-rose-500'
                            }`}
                          />
                          {u.status}
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                        {u.lastLoginAt ? (
                          <span title={u.lastLoginAt}>
                            {new Date(u.lastLoginAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : (
                          'Never logged in'
                        )}
                      </td>

                      {/* Actions Column with EDIT BUTTON */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* EDIT BUTTON */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(u)}
                            className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-100 hover:border-orange-300 transition"
                            title="Edit user details"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Edit</span>
                          </button>

                          {/* Quick Password Change */}
                          <button
                            type="button"
                            onClick={() => handleOpenPasswordModal(u)}
                            className="rounded-md border border-slate-200 bg-white p-1 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
                            title="Change password"
                          >
                            <Key className="h-3.5 w-3.5" />
                          </button>

                          {/* Reset Link */}
                          <button
                            type="button"
                            onClick={() => handleGenerateResetLink(u)}
                            className="rounded-md border border-slate-200 bg-white p-1 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
                            title="Generate reset link"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete (if not self and user has permission) */}
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => setUserToDelete(u)}
                              className="rounded-md border border-slate-200 bg-white p-1 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition"
                              title="Delete user"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EDIT USER DETAILS MODAL (PRIMARY FEATURE)                                  */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <Edit2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit User Details
                  </h3>
                  <p className="text-xs text-slate-500">
                    Updating details for <span className="font-semibold text-slate-700">{editingUser.email}</span> (ID: {editingUser.id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error Notification */}
            {editError && (
              <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{editError}</span>
              </div>
            )}

            {/* Edit Form */}
            <form onSubmit={handleSaveEditUser} className="mt-4 space-y-4">
              {/* Names: First and Last */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    placeholder="e.g. Tariq"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    placeholder="e.g. Al-Mansoor"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="operator@ageco.com"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 font-mono placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Administrative Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-orange-500 focus:outline-none"
                >
                  <option value="SUPER_ADMIN">Super Admin (Full System Control & Security)</option>
                  <option value="ADMIN">Administrator (Infrastructure, Operations, Audit)</option>
                  <option value="EDITOR">Editor (Catalogue Specifications, Products, Datasheets)</option>
                  <option value="SALES">Sales Representative (Customer Enquiries & RFQs)</option>
                  <option value="CONTENT_MANAGER">Content Manager (Brand Pages, CMS, Media Assets)</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  {ROLE_CONFIG[editRole]?.description}
                </p>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department / Organization Unit
                </label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    list="departments-list"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    placeholder="Select or enter department..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                  />
                  <datalist id="departments-list">
                    {PREDEFINED_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Account Status and 2FA in Two Columns */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
                {/* Account Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Status
                  </label>
                  <div className="flex gap-2">
                    {(['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const).map((st) => (
                      <button
                        type="button"
                        key={st}
                        onClick={() => setEditStatus(st)}
                        className={`flex-1 rounded-lg py-1.5 text-[11px] font-bold border transition ${
                          editStatus === st
                            ? st === 'ACTIVE'
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                              : st === 'INACTIVE'
                              ? 'border-slate-500 bg-slate-100 text-slate-800'
                              : 'border-rose-500 bg-rose-50 text-rose-800'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2FA Toggle */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Two-Factor Authentication (2FA)
                  </label>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 p-2">
                    <span className="text-xs text-slate-700 font-medium">
                      {editTwoFactor ? 'Enforced' : 'Optional / Disabled'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditTwoFactor(!editTwoFactor)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        editTwoFactor ? 'bg-orange-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          editTwoFactor ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Optional Password Override */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-orange-500" />
                    Reset or Override Password (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      handleGenerateResetLink(editingUser);
                    }}
                    className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 underline"
                  >
                    Generate Reset Link
                  </button>
                </div>
                <input
                  type="password"
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  placeholder="Leave empty to keep existing password, or enter new password (min 8 chars)"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD USER MODAL                                                            */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Add New Platform User
                  </h3>
                  <p className="text-xs text-slate-500">
                    Provision credentials and role privileges for a new staff member.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {addError && (
              <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addFirstName}
                    onChange={(e) => setAddFirstName(e.target.value)}
                    placeholder="e.g. Elena"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={addLastName}
                    onChange={(e) => setAddLastName(e.target.value)}
                    placeholder="e.g. Rostova"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="new.operator@ageco.com"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 font-mono placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as UserRole)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="ADMIN">Administrator</option>
                    <option value="EDITOR">Editor</option>
                    <option value="SALES">Sales</option>
                    <option value="CONTENT_MANAGER">Content Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    list="add-departments-list"
                    value={addDepartment}
                    onChange={(e) => setAddDepartment(e.target.value)}
                    placeholder="Department..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                  />
                  <datalist id="add-departments-list">
                    {PREDEFINED_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Two-Factor Authentication
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Require TOTP verification for this user
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAddTwoFactor(!addTwoFactor)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    addTwoFactor ? 'bg-orange-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      addTwoFactor ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAdd}
                  className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {isSavingAdd ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Provisioning...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Create User</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHANGE PASSWORD MODAL                                                     */}
      {/* ========================================================================= */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Change Password
                </h3>
                <p className="text-xs text-slate-500">
                  Target user: {targetPasswordUserName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {passwordError && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
              {targetPasswordUserId === currentUser?.id && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError(null);
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {isSubmittingPassword ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESET LINK MODAL                                                          */}
      {/* ========================================================================= */}
      {resetModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Single-Use Password Reset Link
                </h3>
                <p className="text-xs text-slate-500">
                  Target user: {resetModalData.userName} ({resetModalData.userEmail})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResetModalData(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-500">
                This secure token link expires in {resetModalData.expiresInMinutes} minutes and becomes invalid once consumed.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Reset URL
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={resetModalData.resetLink}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 font-mono text-xs text-slate-800 select-all"
                  />
                  <button
                    type="button"
                    onClick={copyResetLink}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setResetModalData(null)}
                  className="rounded-lg bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Confirm User Deletion
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to revoke and delete this account?
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700 space-y-1">
              <p><span className="font-semibold text-slate-500">Name:</span> {userToDelete.name}</p>
              <p><span className="font-semibold text-slate-500">Email:</span> {userToDelete.email}</p>
              <p><span className="font-semibold text-slate-500">Role:</span> {userToDelete.role}</p>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4 mt-4">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={handleConfirmDelete}
                className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeletingUser ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
