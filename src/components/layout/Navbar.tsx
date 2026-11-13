'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Utensils, ChefHat, Clock } from 'lucide-react';
import { useRestaurant } from '@/context/restaurant-context';

export function Navbar() {
  const pathname = usePathname();
  const { cart, setIsCartOpen, restaurant } = useRestaurant();

  const totalCartCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);
  const isAdmin = pathname.startsWith('/admin');

  return (
    <div className="sticky top-2 sm:top-4 z-40 w-full px-3 sm:px-6 pointer-events-none">
      <header className="max-w-5xl mx-auto rounded-full border border-[#E7E5DD]/80 bg-[#FAF8F3]/85 backdrop-blur-xl shadow-pill px-3.5 sm:px-6 py-2 flex items-center justify-between pointer-events-auto transition-all duration-300 hover:shadow-float">
        {/* Brand & Food Hall Identity */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#183F35] text-[#E6B65C] flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-[#245447] group-hover:rotate-6 active:scale-90 transition-all duration-300">
              <Clock className="w-5 h-5 text-[#E6B65C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-[#183F35] tracking-tight">
                  Rush<span className="text-[#D96D4C]">Less</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E6EFE8] text-[#183F35] border border-[#183F35]/15 hidden xs:inline-block">
                  BreakFit™
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#707A73]">
                <span className="font-medium text-[#202923] truncate max-w-[140px] md:max-w-none">
                  {restaurant?.name || 'Crossroads Global Food Hall'}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Kitchen Live
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* View Switcher & Floating Tray Action */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Organic Segmented Switcher */}
          <div className="bg-[#EAE6DC]/80 p-1 rounded-full border border-[#DDD8CB] flex items-center text-xs font-semibold shadow-inner">
            <Link
              href="/"
              className={`px-3 sm:px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all duration-200 ${
                !isAdmin
                  ? 'bg-white text-[#183F35] shadow-xs font-bold'
                  : 'text-[#707A73] hover:text-[#202923]'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span className="text-xs">Menu</span>
            </Link>

            <Link
              href="/admin"
              className={`px-3 sm:px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all duration-200 ${
                isAdmin
                  ? 'bg-white text-[#183F35] shadow-xs font-bold'
                  : 'text-[#707A73] hover:text-[#202923]'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span className="text-xs">Kitchen</span>
            </Link>
          </div>

          {/* Floating Tray Button */}
          {!isAdmin && (
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative px-3.5 sm:px-4 py-2 rounded-full bg-[#183F35] text-white hover:bg-[#245447] active:scale-95 transition-all flex items-center gap-2 shadow-xs group"
              aria-label={`Open cart with ${totalCartCount} items`}
            >
              <ShoppingBag className="w-4 h-4 text-[#E6B65C] group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline text-xs font-bold">My Tray</span>
              {totalCartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#D96D4C] text-white text-[11px] font-extrabold flex items-center justify-center border-2 border-white shadow-xs animate-bounce">
                  {totalCartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </header>
    </div>
  );
}
