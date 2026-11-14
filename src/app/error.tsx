'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Utensils } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected runtime client error for debugging
    console.error('[RushLess Production Error Boundary]:', error);
  }, [error]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#E7E5DD] shadow-card p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-[#D96D4C] border border-rose-200 flex items-center justify-center mx-auto shadow-xs">
          <AlertCircle className="w-8 h-8 text-[#D96D4C]" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
            System Notice
          </span>
          <h1 className="text-2xl font-black text-[#183F35] tracking-tight">
            Something went wrong
          </h1>
          <p className="text-xs sm:text-sm text-[#707A73] leading-relaxed">
            The page encountered an unexpected issue while loading live restaurant data.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-[#183F35] text-white hover:bg-[#245447] text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-[#E6B65C]" />
            <span>Try Again</span>
          </button>

          <Link
            href="/menu"
            className="px-5 py-2.5 rounded-xl bg-white border border-[#E7E5DD] text-[#202923] hover:bg-[#FAF8F3] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Utensils className="w-3.5 h-3.5 text-[#183F35]" />
            <span>Return to Menu</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
