import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Target Audiences
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Industry sectors and market segments for products.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {audiences.map((aud) => (
          <div
            key={aud.id}
            className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:border-orange-300"
          >
            <div className="flex items-center justify-between">
              <span className="rounded bg-orange-50 px-2 py-0.5 font-mono text-[11px] font-bold text-orange-700">
                {aud.code}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Active
              </span>
            </div>
            <h2 className="mt-3 text-base font-bold text-slate-900">{aud.name}</h2>
            <div className="mt-1 text-xs text-orange-600 font-semibold">{aud.sector}</div>
            <p className="mt-2 text-xs text-slate-500">{aud.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
