import React, { useState, useEffect } from 'react';
import { Settings, ShieldAlert, CheckCircle2, Save } from 'lucide-react';
import { api } from '../../config/api.ts';
import { SystemSetting } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const SystemSettingsView: React.FC = () => {
  const { user: currentUser, canAccess } = useAuth();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<{ id: string; msg: string } | null>(null);

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
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-rose-400" />
        <h2 className="mt-4 font-heading text-lg font-bold text-white">
          Authorization Restricted
        </h2>
        <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
          System Settings modification is restricted to <span className="text-amber-400 font-mono font-semibold">SUPER_ADMIN</span> and <span className="text-blue-400 font-mono font-semibold">ADMIN</span> roles per the locked ADP Security Role Matrix.
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
        setSaveStatus({ id: setting.id, msg: 'Saved to ADP backend!' });
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (err) {
      console.error('Failed to update setting', err);
    }
  };

  const categories = ['GENERAL', 'SECURITY', 'INTEGRATION', 'EMAIL_NOTIFICATIONS'] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
          System Settings & Platform Parameters
        </h1>
        <p className="text-xs text-slate-400">
          Global operational flags, security session timeouts, ERP integration endpoints, and dispatch rules
        </p>
      </div>

      <div className="space-y-6">
        {categories.map((cat) => {
          const catSettings = settings.filter((s) => s.category === cat);
          if (catSettings.length === 0) return null;

          return (
            <div
              key={cat}
              className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-5 shadow"
            >
              <div className="border-b border-slate-800 pb-3">
                <span className="rounded bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-400 border border-amber-500/20">
                  {cat} CONFIGURATION
                </span>
              </div>

              <div className="mt-4 divide-y divide-slate-800/80">
                {catSettings.map((item) => (
                  <div
                    key={item.id}
                    className="py-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-xs">{item.label}</span>
                        <span className="font-mono text-[10px] text-slate-500">[{item.key}]</span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">{item.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.type === 'BOOLEAN' ? (
                        <button
                          onClick={() =>
                            handleUpdateValue(
                              item,
                              item.value === 'true' ? 'false' : 'true'
                            )
                          }
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            item.value === 'true' ? 'bg-amber-500' : 'bg-slate-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
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
                            className="rounded border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white font-mono w-48 focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      )}

                      {saveStatus?.id === item.id && (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3 w-3" />
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
