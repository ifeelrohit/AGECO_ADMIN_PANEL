import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Sun,
  Moon,
  Monitor,
  Check,
  Sparkles,
  Sliders,
  Palette,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../config/api.ts';
import { SystemSetting } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme, ThemeMode } from '../../context/ThemeContext.tsx';

export const SystemSettingsView: React.FC = () => {
  const { user: currentUser, canAccess } = useAuth();
  const { theme, resolvedTheme, setTheme, isDark } = useTheme();

  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<{ id: string; msg: string } | null>(null);
  const [themeNotification, setThemeNotification] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get<SystemSetting[]>('/settings');
      if (res.success && res.data) setSettings(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess('system_settings')) {
      fetchSettings();
    }
  }, [currentUser]);

  if (!canAccess('system_settings')) {
    return (
      <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-[#0E1726] p-8 text-center shadow-sm">
        <ShieldAlert className="mx-auto h-12 w-12 text-rose-500" />
        <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-slate-100">
          Access Restricted
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          System settings are restricted to administrators.
        </p>
      </div>
    );
  }

  const handleUpdateValue = async (setting: SystemSetting, newValue: string) => {
    try {
      const res = await api.put<SystemSetting>(`/settings/${setting.id}`, {
        value: newValue,
      });

      if (res.success && res.data) {
        setSettings((prev) =>
          prev.map((s) => (s.id === setting.id ? res.data! : s))
        );
        setSaveStatus({ id: setting.id, msg: 'Saved' });
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (err) {
      console.error('Failed to update setting', err);
    }
  };

  const handleSelectTheme = async (mode: ThemeMode) => {
    await setTheme(mode, true);
    setThemeNotification(
      mode === 'dark'
        ? 'Dark Theme enabled across the platform.'
        : mode === 'light'
        ? 'Light Theme enabled across the platform.'
        : 'System Theme mode synced with OS settings.'
    );
    setTimeout(() => setThemeNotification(null), 3500);
  };

  const categories = ['APPEARANCE', 'GENERAL', 'SECURITY', 'INTEGRATION', 'EMAIL_NOTIFICATIONS'] as const;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Settings
            </h1>
            <span className="rounded-full bg-orange-100 dark:bg-orange-950/60 px-2.5 py-0.5 text-xs font-semibold text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60">
              Platform Configuration
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Configure platform appearance, security governance, and enterprise integrations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSettings}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1726] px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Theme Update Alert Notification */}
      {themeNotification && (
        <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-xs text-emerald-800 dark:text-emerald-300 shadow-xs transition">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">{themeNotification}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRIMARY FEATURE: APPEARANCE & INTERFACE THEME (DARK / LIGHT BUTTONS)      */}
      {/* ========================================================================= */}
      <div className="overflow-hidden rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E1726] p-6 shadow-xs transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Interface Theme
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Active: {resolvedTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Switch between Dark and Light mode themes for the internal administration workspace.
              </p>
            </div>
          </div>

          {/* Quick Toggle Pill */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/80 p-1">
            <button
              type="button"
              onClick={() => handleSelectTheme('light')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                theme === 'light'
                  ? 'bg-white text-orange-600 shadow-xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sun className="h-3.5 w-3.5 text-amber-500" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectTheme('dark')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                theme === 'dark'
                  ? 'bg-white text-orange-600 shadow-xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Moon className="h-3.5 w-3.5 text-indigo-400" />
              <span>Dark</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectTheme('system')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                theme === 'system'
                  ? 'bg-white text-orange-600 shadow-xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Monitor className="h-3.5 w-3.5 text-slate-500" />
              <span>System</span>
            </button>
          </div>
        </div>

        {/* Big Interactive Visual Theme Selection Cards */}
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* ================= LIGHT THEME BUTTON ================= */}
          <button
            type="button"
            onClick={() => handleSelectTheme('light')}
            className={`group relative flex flex-col rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer ${
              theme === 'light'
                ? 'border-orange-500 bg-orange-50/20 ring-2 ring-orange-500/20 shadow-sm dark:bg-orange-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1120] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
            }`}
          >
            {/* Active Check Indicator */}
            {theme === 'light' && (
              <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white shadow-xs">
                <Check className="h-3 w-3 stroke-[3]" />
              </div>
            )}

            {/* Mini Visual UI Mockup Preview of Light Theme */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100 p-2 shadow-inner mb-3">
              <div className="flex h-20 w-full overflow-hidden rounded bg-white shadow-xs">
                {/* Mini Sidebar */}
                <div className="w-1/4 border-r border-slate-200 bg-[#0A1120] p-1.5 flex flex-col gap-1">
                  <div className="h-2 w-full rounded bg-orange-500" />
                  <div className="h-1.5 w-3/4 rounded bg-slate-600" />
                  <div className="h-1.5 w-1/2 rounded bg-slate-700" />
                  <div className="h-1.5 w-5/6 rounded bg-slate-700" />
                </div>
                {/* Mini Main Area */}
                <div className="flex-1 flex flex-col bg-[#F4F6F9] p-1.5 gap-1.5">
                  <div className="h-3 w-full rounded bg-white border border-slate-200 flex items-center px-1">
                    <div className="h-1.5 w-1/3 rounded bg-slate-300" />
                  </div>
                  <div className="grid grid-cols-2 gap-1 flex-1">
                    <div className="rounded bg-white border border-slate-200 p-1 flex flex-col gap-1">
                      <div className="h-2 w-1/2 rounded bg-orange-100" />
                      <div className="h-1 w-full rounded bg-slate-200" />
                    </div>
                    <div className="rounded bg-white border border-slate-200 p-1 flex flex-col gap-1">
                      <div className="h-2 w-1/2 rounded bg-slate-100" />
                      <div className="h-1 w-full rounded bg-slate-200" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600 border border-amber-200">
                <Sun className="h-4 w-4" />
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Light Theme
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              High-contrast daytime aesthetic with crisp borders, slate cards, and vibrant accents.
            </p>

            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Contrast Ratio: Normal (WCAG AA)
              </span>
              <span
                className={`text-xs font-bold ${
                  theme === 'light' ? 'text-orange-600' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                }`}
              >
                {theme === 'light' ? 'Active' : 'Select'}
              </span>
            </div>
          </button>

          {/* ================= DARK THEME BUTTON ================= */}
          <button
            type="button"
            onClick={() => handleSelectTheme('dark')}
            className={`group relative flex flex-col rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer ${
              theme === 'dark'
                ? 'border-orange-500 bg-orange-50/20 ring-2 ring-orange-500/20 shadow-sm dark:bg-orange-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1120] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
            }`}
          >
            {/* Active Check Indicator */}
            {theme === 'dark' && (
              <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white shadow-xs">
                <Check className="h-3 w-3 stroke-[3]" />
              </div>
            )}

            {/* Mini Visual UI Mockup Preview of Dark Theme */}
            <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900 p-2 shadow-inner mb-3">
              <div className="flex h-20 w-full overflow-hidden rounded bg-[#070B14] shadow-xs">
                {/* Mini Sidebar */}
                <div className="w-1/4 border-r border-slate-800 bg-[#0A1120] p-1.5 flex flex-col gap-1">
                  <div className="h-2 w-full rounded bg-orange-500" />
                  <div className="h-1.5 w-3/4 rounded bg-slate-700" />
                  <div className="h-1.5 w-1/2 rounded bg-slate-800" />
                  <div className="h-1.5 w-5/6 rounded bg-slate-800" />
                </div>
                {/* Mini Main Area */}
                <div className="flex-1 flex flex-col bg-[#070B14] p-1.5 gap-1.5">
                  <div className="h-3 w-full rounded bg-[#0E1726] border border-slate-800 flex items-center px-1">
                    <div className="h-1.5 w-1/3 rounded bg-slate-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-1 flex-1">
                    <div className="rounded bg-[#0E1726] border border-slate-800 p-1 flex flex-col gap-1">
                      <div className="h-2 w-1/2 rounded bg-orange-500/30" />
                      <div className="h-1 w-full rounded bg-slate-700" />
                    </div>
                    <div className="rounded bg-[#0E1726] border border-slate-800 p-1 flex flex-col gap-1">
                      <div className="h-2 w-1/2 rounded bg-slate-800" />
                      <div className="h-1 w-full rounded bg-slate-700" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-900/60 text-indigo-300 border border-indigo-700/60">
                <Moon className="h-4 w-4" />
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Dark Theme
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Deep slate & obsidian canvas optimized for reduced eye strain in low-light environments.
            </p>

            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Energy Efficient: OLED Friendly
              </span>
              <span
                className={`text-xs font-bold ${
                  theme === 'dark' ? 'text-orange-600' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                }`}
              >
                {theme === 'dark' ? 'Active' : 'Select'}
              </span>
            </div>
          </button>

          {/* ================= SYSTEM DEFAULT THEME BUTTON ================= */}
          <button
            type="button"
            onClick={() => handleSelectTheme('system')}
            className={`group relative flex flex-col rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer ${
              theme === 'system'
                ? 'border-orange-500 bg-orange-50/20 ring-2 ring-orange-500/20 shadow-sm dark:bg-orange-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1120] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
            }`}
          >
            {/* Active Check Indicator */}
            {theme === 'system' && (
              <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white shadow-xs">
                <Check className="h-3 w-3 stroke-[3]" />
              </div>
            )}

            {/* Mini Visual UI Mockup Preview of Split System Theme */}
            <div className="overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-900 p-2 shadow-inner mb-3">
              <div className="flex h-20 w-full overflow-hidden rounded shadow-xs relative">
                {/* Split Left (Light) */}
                <div className="w-1/2 h-full bg-[#F4F6F9] border-r border-orange-500 p-1 flex flex-col gap-1">
                  <div className="h-3 w-full rounded bg-white border border-slate-200" />
                  <div className="h-8 rounded bg-white border border-slate-200 p-1 flex flex-col gap-1">
                    <div className="h-1.5 w-2/3 rounded bg-amber-400" />
                    <div className="h-1 w-full rounded bg-slate-300" />
                  </div>
                </div>
                {/* Split Right (Dark) */}
                <div className="w-1/2 h-full bg-[#070B14] p-1 flex flex-col gap-1">
                  <div className="h-3 w-full rounded bg-[#0E1726] border border-slate-800" />
                  <div className="h-8 rounded bg-[#0E1726] border border-slate-800 p-1 flex flex-col gap-1">
                    <div className="h-1.5 w-2/3 rounded bg-indigo-400" />
                    <div className="h-1 w-full rounded bg-slate-700" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <Monitor className="h-4 w-4" />
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                System Default
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Automatically tracks your operating system dark/light mode preference across devices.
            </p>

            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Detected OS: {resolvedTheme.toUpperCase()}
              </span>
              <span
                className={`text-xs font-bold ${
                  theme === 'system' ? 'text-orange-600' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                }`}
              >
                {theme === 'system' ? 'Active' : 'Select'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SYSTEM SETTINGS CATEGORIES & ATTRIBUTES                                    */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const catSettings = settings.filter((s) => s.category === cat);
          if (catSettings.length === 0) return null;

          return (
            <div
              key={cat}
              className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0E1726] p-5 shadow-xs transition-colors duration-200"
            >
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                <span className="rounded-full bg-orange-50 dark:bg-orange-950/60 px-2.5 py-0.5 font-mono text-[11px] font-bold text-orange-700 dark:text-orange-400 border border-orange-200/80 dark:border-orange-800/60">
                  {cat.replace('_', ' ')}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {catSettings.length} Parameters
                </span>
              </div>

              <div className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                {catSettings.map((item) => (
                  <div
                    key={item.id}
                    className="py-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                          {item.label}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                          [{item.key}]
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* If setting is ui_theme_mode, offer quick theme switch buttons */}
                      {item.key === 'ui_theme_mode' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectTheme('light');
                              handleUpdateValue(item, 'light');
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border transition ${
                              item.value === 'light'
                                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <Sun className="h-3 w-3 text-amber-500" />
                            <span>Light</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectTheme('dark');
                              handleUpdateValue(item, 'dark');
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border transition ${
                              item.value === 'dark'
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <Moon className="h-3 w-3 text-indigo-400" />
                            <span>Dark</span>
                          </button>
                        </div>
                      ) : item.type === 'BOOLEAN' ? (
                        <button
                          onClick={() =>
                            handleUpdateValue(
                              item,
                              item.value === 'true' ? 'false' : 'true'
                            )
                          }
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            item.value === 'true' ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              item.value === 'true' ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            defaultValue={item.value}
                            onBlur={(e) => {
                              if (e.target.value !== item.value) {
                                handleUpdateValue(item, e.target.value);
                              }
                            }}
                            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070B14] px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono w-52 focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                      )}

                      {saveStatus?.id === item.id && (
                        <span className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          <span>{saveStatus.msg}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
