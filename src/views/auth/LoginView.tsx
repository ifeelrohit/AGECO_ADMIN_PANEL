import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Mail,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types/index.ts';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('superadmin@ageco.com');
  const [password, setPassword] = useState('AgecoPassword2026!');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected connection error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectPersona = (role: UserRole) => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      setEmail(creds.email);
      setPassword('AgecoPassword2026!');
      setError(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#070b13] px-4 py-12 sm:px-6 lg:px-8">
      {/* Subtle industrial grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d0f_1px,transparent_1px),linear-gradient(to_bottom,#1f293d0f_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 shadow-2xl">
            <Building2 className="h-8 w-8 text-amber-400" />
          </div>
          <h2 className="mt-4 font-heading text-2xl font-bold tracking-tight text-white">
            AGECO Digital Platform
          </h2>
          <p className="mt-1 text-xs font-medium tracking-wide uppercase text-amber-400/90 font-mono">
            Enterprise Administration Portal (ADP)
          </p>
          <p className="mt-2 text-center text-xs text-slate-400 max-w-sm">
            Authorized access for Arab-German Electrical Corporation switchgear, automation, and turnkey engineering operations.
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 rounded-xl border border-slate-800 bg-[#0c1322]/90 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Corporate Email Address
              </label>
              <div className="relative mt-1.5 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@ageco.com"
                  className="block w-full rounded-md border border-slate-700 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <span className="text-[11px] text-slate-500 font-mono">JWT Protected</span>
              </div>
              <div className="relative mt-1.5 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border border-slate-700 bg-slate-900/90 py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <input
                  id="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500/20"
                />
                <label htmlFor="remember-me" className="text-xs text-slate-400">
                  Maintain persistent token
                </label>
              </div>
              <span className="text-[11px] text-slate-500">SSO / MFA Enabled</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-semibold text-slate-950 transition hover:from-amber-400 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Authenticating with ADP Backend...</span>
              ) : (
                <>
                  <span>Sign In to Admin Panel</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Role Tester Selector */}
          <div className="mt-6 border-t border-slate-800 pt-5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                Select Role Persona for Verification:
              </span>
              <span className="text-[10px] text-slate-500 font-mono">5 Locked Roles</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {(Object.keys(DEMO_CREDENTIALS) as UserRole[]).map((role) => {
                const cred = DEMO_CREDENTIALS[role];
                const isCurrent = email === cred.email;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => selectPersona(role)}
                    className={`flex items-center justify-between rounded border p-2 text-left text-xs transition ${
                      isCurrent
                        ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-mono text-[10px] font-semibold">{role}</div>
                      <div className="text-[9px] text-slate-500 truncate max-w-[130px]">
                        {cred.label}
                      </div>
                    </div>
                    {isCurrent && <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Security Watermark */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Cpu className="h-3.5 w-3.5" /> AGECO Backend v1
          </span>
          <span>•</span>
          <span>PostgreSQL Authoritative</span>
          <span>•</span>
          <span>Role-Gated UX</span>
        </div>
      </div>
    </div>
  );
};
