import React, { useState, useEffect } from 'react';
import { Compass, CheckCircle2 } from 'lucide-react';
import { api } from '../../config/api.ts';
import { Audience } from '../../types/index.ts';

export const AudiencesView: React.FC = () => {
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAud = async () => {
      setLoading(true);
      try {
        const res = await api.get<Audience[]>('/catalogue/audiences');
        if (res.success && res.data) setAudiences(res.data);
      } finally {
        setLoading(false);
      }
    };
    fetchAud();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
          Market Audiences & Segments
        </h1>
        <p className="text-xs text-slate-400">
          Industrial verticals defining technical equipment requirements and compliance standards
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {audiences.map((aud) => (
          <div
            key={aud.id}
            className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-5 shadow transition hover:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <span className="rounded bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-400 border border-amber-500/20">
                {aud.code}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> Active
              </span>
            </div>
            <h2 className="mt-3 font-heading text-base font-bold text-white">{aud.name}</h2>
            <div className="mt-1 text-xs text-cyan-400 font-medium">{aud.sector}</div>
            <p className="mt-2 text-xs text-slate-400">{aud.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
