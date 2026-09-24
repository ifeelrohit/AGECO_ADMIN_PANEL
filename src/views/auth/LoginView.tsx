import React, { useState } from 'react';
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected connection error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#F4F6F9] px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md">
            <Zap className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            AGECO Admin
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Sign in to manage the digital platform.
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Email
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ageco.com"
                  className="block w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">
              Quick Demo Access
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={async () => {
                  setEmail('superadmin@ageco.com');
                  setPassword('AgecoPassword2026!');
                  setIsSubmitting(true);
                  setError(null);
                  try {
                    const res = await login('superadmin@ageco.com', 'AgecoPassword2026!');
                    if (!res.success) setError(res.error || 'Failed to sign in.');
                  } catch (err: any) {
                    setError(err.message);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-orange-50 hover:border-orange-300 transition"
              >
                <div className="text-left">
                  <div className="font-semibold text-slate-900">Dr. Tariq Al-Mansoor</div>
                  <div className="text-[10px] text-slate-500">Super Administrator (Full Access)</div>
                </div>
                <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
                  Demo
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
