import React, { useState, useEffect } from 'react';
import { Boxes, CheckCircle2, Wrench } from 'lucide-react';
import { api } from '../../config/api.ts';
import { ProductType } from '../../types/index.ts';

export const ProductTypesView: React.FC = () => {
  const [types, setTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTypes = async () => {
      setLoading(true);
      try {
        const res = await api.get<ProductType[]>('/catalogue/product-types');
        if (res.success && res.data) setTypes(res.data);
      } finally {
        setLoading(false);
      }
    };
    fetchTypes();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
          Product Classification Types
        </h1>
        <p className="text-xs text-slate-400">
          Manufacturing classifications distinguishing custom engineered-to-order (ETO) assemblies from standard catalog items
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {types.map((type) => (
          <div
            key={type.id}
            className="rounded-xl border border-slate-800 bg-[#0c121e]/90 p-5 shadow transition hover:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <span className="rounded bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-400 border border-cyan-500/20">
                {type.code}
              </span>
              {type.requiresCustomEngineering && (
                <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                  <Wrench className="h-3 w-3" /> ETO Custom
                </span>
              )}
            </div>
            <h2 className="mt-3 font-heading text-base font-bold text-white">{type.name}</h2>
            <p className="mt-2 text-xs text-slate-400">{type.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
