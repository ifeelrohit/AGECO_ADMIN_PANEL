import React, { useState } from 'react';
import {
  Bell,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Server,
  UserCheck,
  Building2,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types/index.ts';

interface HeaderProps {
  currentSection: string;
  currentSubpage?: string;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSection,
  currentSubpage,
  onToggleSidebar,
}) => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : (user?.name || user?.email || 'User');

  const getRoleBadgeStyle = (role?: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'ADMIN':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'EDITOR':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'SALES':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'CONTENT_MANAGER':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  const notifications = [
    {
      id: 1,
      title: 'New High-Value RFP Received',
      desc: 'NEOM Energy submitted RFQ-2026-0843 for Containerized Solar PCS Skids ($5.8M)',
      time: '18m ago',
      unread: true,
    },
    {
      id: 2,
      title: 'Database Auto-Vacuum Completed',
      desc: 'PostgreSQL maintenance worker re-indexed catalogue and enquiries tables',
      time: '1h ago',
      unread: false,
    },
    {
      id: 3,
      title: 'Type Test Certificate Attached',
      desc: 'CESI 62271 Certificate uploaded for VectroMax 36kV VCB',
      time: '3h ago',
      unread: false,
    },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-[#0c121e]/95 px-4 backdrop-blur lg:px-6">
      {/* Left: Mobile Toggle, Brand & Breadcrumb context */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          title="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* AGECO Corporate Logo & Identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded border border-amber-500/30 bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 font-mono text-sm font-bold tracking-wider text-amber-400 shadow-inner">
            <Building2 className="h-5 w-5 text-amber-400" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-heading text-base font-bold tracking-tight text-white">
                AGECO
              </span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-slate-300">
                ADP v2.4
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              Arab-German Electrical Corporation
            </p>
          </div>
        </div>

        {/* Breadcrumb Context */}
        <div className="hidden h-6 w-px bg-slate-800 md:block" />
        <nav aria-label="Breadcrumb" className="hidden items-center gap-2 text-xs font-medium md:flex">
          <span className="text-slate-400">Platform</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 font-semibold">{currentSection}</span>
          {currentSubpage && (
            <>
              <span className="text-slate-600">/</span>
              <span className="rounded bg-cyan-950/40 px-2 py-0.5 text-cyan-300 border border-cyan-800/40">
                {currentSubpage}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Right: Operational Status, Role Switcher, Notifications, User Menu */}
      <div className="flex items-center gap-3">
        {/* Backend API & PostgreSQL Status Indicator */}
        <div className="hidden xl:flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <Server className="h-3.5 w-3.5 text-emerald-400" />
          <span>PostgreSQL API Active</span>
        </div>

        {/* Role Badge Indicator */}
        <div className="flex items-center gap-1.5 rounded border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
          <span className="hidden sm:inline text-slate-400">Role:</span>
          <span className="font-semibold text-amber-300">{user?.role}</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative rounded-md border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:border-slate-700 hover:text-slate-200 transition"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-lg border border-slate-800 bg-[#0e1626] p-3 shadow-2xl ring-1 ring-black/40 z-50">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-semibold text-white">System Notifications</span>
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                  3 Updates
                </span>
              </div>
              <div className="mt-2 space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="rounded border border-slate-800/60 bg-slate-900/50 p-2 text-xs transition hover:border-slate-700"
                  >
                    <div className="flex items-center justify-between font-medium text-slate-200">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-slate-500">{n.time}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Logout */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-900/80 p-1.5 pr-3 text-left hover:border-slate-700 transition"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-tr from-slate-700 to-slate-800 text-xs font-semibold text-slate-200">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden text-left md:block">
              <div className="text-xs font-medium text-slate-200 leading-tight">
                {displayName}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-block rounded border px-1.5 py-0.2 text-[9px] font-semibold tracking-wider ${getRoleBadgeStyle(
                    user?.role
                  )}`}
                >
                  {user?.role}
                </span>
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-lg border border-slate-800 bg-[#0e1626] p-2 shadow-2xl z-50">
              <div className="border-b border-slate-800 pb-2 px-2">
                <p className="text-xs font-semibold text-white">{displayName}</p>
                <p className="text-[11px] text-slate-400 font-mono">{user?.email}</p>
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between rounded px-2 py-1.5 text-xs text-slate-300">
                  <span className="flex items-center gap-2">
                    <UserCheck className="h-3.5 w-3.5 text-slate-400" /> Account Status
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium font-mono">{user?.status || 'ACTIVE'}</span>
                </div>
                <button
                  onClick={() => logout()}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
