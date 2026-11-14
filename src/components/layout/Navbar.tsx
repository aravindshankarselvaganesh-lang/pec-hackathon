'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Utensils, ChefHat, Clock, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { useRestaurant } from '@/context/restaurant-context';

export function Navbar() {
  const pathname = usePathname();
  const { cart, setIsCartOpen, restaurant } = useRestaurant();

  const totalCartCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  const isGateway = pathname === '/';
  const isKitchen = pathname.startsWith('/kitchen') || pathname.startsWith('/admin');
  const isOrderTracking = pathname.startsWith('/order');
  const isMenu = pathname.startsWith('/menu');

  return (
    <div className="sticky top-2 sm:top-4 z-40 w-full px-3 sm:px-6 pointer-events-none">
      <header className="max-w-5xl mx-auto rounded-full border border-[#E7E5DD]/80 bg-[#FAF8F3]/90 backdrop-blur-xl shadow-pill px-3.5 sm:px-6 py-2 flex items-center justify-between pointer-events-auto transition-all duration-300 hover:shadow-float">
        {/* Brand & Food Hall Identity */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group" title="Return to Portal Gateway">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#183F35] text-[#E6B65C] flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-[#245447] group-hover:rotate-6 active:scale-90 transition-all duration-300">
              <Clock className="w-5 h-5 text-[#E6B65C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-[#183F35] tracking-tight">
                  Rush<span className="text-[#D96D4C]">Less</span>
                </span>
                {isKitchen ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    Kitchen Pass
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E6EFE8] text-[#183F35] border border-[#183F35]/15 hidden xs:inline-block">
                    BreakFit™
                  </span>
                )}
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#707A73]">
                <span className="font-medium text-[#202923] truncate max-w-[140px] md:max-w-none">
                  {restaurant?.name || 'Crossroads Global Food Hall'}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {isKitchen ? 'Station Feeds Live' : 'Kitchen Live'}
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Right Navigation Actions based on current portal */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 1. On Gateway (/) */}
          {isGateway && (
            <div className="flex items-center gap-2">
              <Link
                href="/menu"
                className="px-3.5 py-1.5 rounded-full bg-white border border-[#E7E5DD] text-[#183F35] hover:bg-[#E6EFE8] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
              >
                <Utensils className="w-3.5 h-3.5 text-[#183F35]" />
                <span>Customer Menu</span>
              </Link>
              <Link
                href="/kitchen"
                className="px-3.5 py-1.5 rounded-full bg-[#183F35] text-white hover:bg-[#245447] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
              >
                <ChefHat className="w-3.5 h-3.5 text-[#E6B65C]" />
                <span className="hidden xs:inline">Demo Kitchen</span>
              </Link>
            </div>
          )}

          {/* 2. On Customer Menu (/menu) */}
          {isMenu && (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/kitchen"
                className="text-[11px] text-[#707A73] hover:text-[#183F35] font-semibold hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#E7E5DD] hover:border-[#183F35]/40 transition-colors"
                title="Switch to Demo Kitchen Portal"
              >
                <ChefHat className="w-3 h-3 text-[#D96D4C]" />
                <span>Kitchen Staff Portal</span>
              </Link>

              {/* Floating Tray Button */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative px-3.5 sm:px-4 py-2 rounded-full bg-[#183F35] text-white hover:bg-[#245447] active:scale-95 transition-all flex items-center gap-2 shadow-xs group"
                aria-label={`Open cart with ${totalCartCount} items`}
              >
                <ShoppingBag className="w-4 h-4 text-[#E6B65C] group-hover:scale-110 transition-transform" />
                <span className="hidden xs:inline text-xs font-bold">My Tray</span>
                {totalCartCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#D96D4C] text-white text-[11px] font-extrabold flex items-center justify-center border-2 border-white shadow-xs animate-bounce">
                    {totalCartCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* 3. On Kitchen (/kitchen or /kitchen/menu) */}
          {isKitchen && (
            <div className="flex items-center gap-2">
              <Link
                href="/kitchen/menu"
                className="px-3 py-1.5 rounded-full bg-white border border-[#E7E5DD] text-[#202923] hover:bg-[#FAF8F3] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#707A73]" />
                <span className="hidden sm:inline">Menu Stock</span>
              </Link>
              <Link
                href="/menu"
                className="px-3.5 py-1.5 rounded-full bg-[#183F35] text-white hover:bg-[#245447] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
              >
                <Utensils className="w-3.5 h-3.5 text-[#E6B65C]" />
                <span>Customer Menu</span>
              </Link>
            </div>
          )}

          {/* 4. On Order Tracking (/order/[id]) */}
          {isOrderTracking && (
            <Link
              href="/menu"
              className="px-3.5 py-1.5 rounded-full bg-[#183F35] text-white hover:bg-[#245447] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Menu</span>
            </Link>
          )}
        </div>
      </header>
    </div>
  );
}
