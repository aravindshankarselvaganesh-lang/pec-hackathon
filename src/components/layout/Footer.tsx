import React from 'react';
import Link from 'next/link';
import { Clock, ShieldCheck, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-[#E7E5DD] mt-16 text-xs text-[#707A73]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-[#183F35]">
                Rush<span className="text-[#D96D4C]">Less</span>
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#E6EFE8] text-[#183F35]">
                Crossroads Food Hall
              </span>
            </div>
            <p className="text-xs text-[#202923] max-w-md">
              Time-aware ordering for campus food halls. Pick your time and enjoy freshly made food without the wait.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-[#707A73]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Digital Ordering for Local Restaurants</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-xs text-[#202923] uppercase tracking-wider mb-3">
              Navigation
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-[#183F35] transition-colors">
                  Storefront Menu
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-[#183F35] transition-colors">
                  Kitchen Live Queue
                </Link>
              </li>
              <li>
                <Link href="/admin/menu" className="hover:text-[#183F35] transition-colors">
                  Menu Stock Controls
                </Link>
              </li>
              <li>
                <Link href="/order/ord-rl-021" className="hover:text-[#183F35] transition-colors">
                  Order Status Demo
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-xs text-[#202923] uppercase tracking-wider mb-3">
              Key Features
            </h4>
            <div className="space-y-2 text-[11px] leading-relaxed">
              <p>
                <strong className="text-[#202923]">Time-Aware:</strong> Live kitchen queue checks before you order.
              </p>
              <p>
                <strong className="text-[#202923]">Smart Swaps:</strong> Suggested alternatives when stations are busy.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#E7E5DD] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} RushLess. Demo application.</p>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-[11px] text-[#183F35] bg-[#E6EFE8] px-2 py-0.5 rounded-full font-medium">
              <Sparkles className="w-3 h-3 text-[#E6B65C]" />
              Direct Kitchen Ordering
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
