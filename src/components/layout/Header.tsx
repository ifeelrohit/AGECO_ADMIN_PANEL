import React, { useState } from 'react';
import { LogOut, ChevronDown, UserCheck, Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';

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
  const { resolvedTheme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Formatted names for authoritative administrator account
  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.name || 'Admin User';

  const roleTitle =
    user?.role === 'SUPER_ADMIN'
      ? 'Administrator'
      : user?.role === 'ADMIN'
      ? 'System Admin'
      : user?.role || 'Administrator';

  const initials =
    user?.firstName && user?.lastName
      ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
      : 'AU';

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1726] px-4 lg:px-8 transition-colors duration-200">
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 lg:hidden"
          title="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Clean Breadcrumb matching screenshot: AGECO Digital Platform / Admin */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 sm:text-sm">
          <span>AGECO Digital Platform</span>
          <span className="text-slate-400 dark:text-slate-600 font-normal">/</span>
          <span className="text-slate-600 dark:text-slate-400">Admin</span>
          {currentSection && currentSection !== 'Dashboard' && (
            <>
              <span className="text-slate-400 dark:text-slate-600 font-normal">/</span>
              <span className="text-orange-600 dark:text-orange-500 font-bold">{currentSection}</span>
            </>
          )}
        </div>
      </div>

      {/* Right: Theme Toggle + User Profile Avatar */}
      <div className="flex items-center gap-3">
        {/* Quick Theme Switcher Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={resolvedTheme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
          title={resolvedTheme === 'dark' ? 'Switch to Light theme' : 'Switch to Dark theme'}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400 transition" />
          ) : (
            <Moon className="h-4 w-4 text-slate-600 transition" />
          )}
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition text-left cursor-pointer"
          >
            {/* Avatar circle */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#10192e] dark:bg-orange-500 text-xs font-bold text-white shadow-sm">
              {initials.toUpperCase()}
            </div>

            <div className="hidden sm:block text-left leading-tight">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {displayName}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {roleTitle}
              </div>
            </div>

            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-2 shadow-xl ring-1 ring-black/5 z-50">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-2 px-3 pt-1">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{displayName}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{user?.email}</p>
              </div>
              <div className="mt-1 space-y-1">
                <div className="flex items-center justify-between rounded px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-2">
                    <UserCheck className="h-3.5 w-3.5 text-slate-400" /> Status
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                    {user?.status || 'ACTIVE'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
