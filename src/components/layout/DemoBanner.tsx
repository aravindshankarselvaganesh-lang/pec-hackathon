'use client';

import React from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';
import { useRestaurant } from '@/context/restaurant-context';

export function DemoBanner() {
  const { resetDemoSession } = useRestaurant();

  return (
    <aside aria-label="Demo mode notice" className="bg-[#183F35] text-white text-xs py-2 px-4 border-b border-[#245447]">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-[#E6B65C] text-[#183F35] shadow-xs">
            <Sparkles className="w-3 h-3 text-[#183F35]" />
            Live Demo
          </span>
          <span className="text-[#E6EFE8] text-xs">
            Set your pickup time to see live prep estimates.
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm('Reset demo orders and kitchen wait times?')) {
              void resetDemoSession();
            }
          }}
          className="inline-flex items-center gap-1.5 text-[11px] text-[#E6EFE8] hover:text-white underline underline-offset-4 decoration-[#E6B65C] transition-colors ml-auto sm:ml-0 active:scale-95"
          aria-label="Reset demo sample orders and kitchen wait times"
          title="Reset sample orders and availability"
        >
          <RotateCcw className="w-3 h-3 text-[#E6B65C]" />
          <span>Reset Demo</span>
        </button>
      </div>
    </aside>
  );
}
