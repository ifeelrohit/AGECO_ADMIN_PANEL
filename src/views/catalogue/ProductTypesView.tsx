import React, { useState, useEffect } from 'react';
import { Wrench } from 'lucide-react';
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Product Types
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Manufacturing and engineering classifications for catalogue products.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {types.map((type) => (
          <div
            key={type.id}
            className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:border-orange-300"
          >
            <div className="flex items-center justify-between">
              <span className="rounded bg-orange-50 px-2 py-0.5 font-mono text-[11px] font-bold text-orange-700">
                {type.code}
              </span>
              {type.requiresCustomEngineering && (
                <span className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                  <Wrench className="h-3 w-3" /> Custom Engineered
                </span>
              )}
            </div>
            <h2 className="mt-3 text-base font-bold text-slate-900">{type.name}</h2>
            <p className="mt-2 text-xs text-slate-500">{type.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
