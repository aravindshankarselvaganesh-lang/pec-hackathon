import React from 'react';
import Link from 'next/link';
import { ChefHat, ArrowLeft, Utensils } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#E7E5DD] shadow-card p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#FAF8F3] text-[#D96D4C] border border-[#E7E5DD] flex items-center justify-center mx-auto shadow-xs">
          <ChefHat className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
            404 • Not Found
          </span>
          <h1 className="text-2xl font-black text-[#183F35] tracking-tight">
            Station Not Found
          </h1>
          <p className="text-xs sm:text-sm text-[#707A73] leading-relaxed">
            The page you are looking for does not exist or has been moved to a new counter.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/menu"
            className="px-5 py-2.5 rounded-xl bg-[#183F35] text-white hover:bg-[#245447] text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
          >
            <Utensils className="w-4 h-4 text-[#E6B65C]" />
            <span>Open Customer Menu</span>
          </Link>

          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-white border border-[#E7E5DD] text-[#202923] hover:bg-[#FAF8F3] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Portal Home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
