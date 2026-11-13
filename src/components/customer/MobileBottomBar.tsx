'use client';

import React from 'react';
import { ShoppingBag, ArrowRight, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { useRestaurant } from '@/context/restaurant-context';
import { formatCurrency, formatTimeHHMM } from '@/domain/formatters';

export function MobileBottomBar() {
  const { cart, setIsCartOpen, breakFitResult, customerDeadline } = useRestaurant();

  if (cart.length === 0) return null;

  const totalQuantity = cart.reduce((acc, curr) => acc + curr.quantity, 0);
  const subtotal = cart.reduce((acc, curr) => acc + curr.menuItem.price * curr.quantity, 0);

  const isFeasible = breakFitResult.feasibility === 'FEASIBLE';
  const isRisky = breakFitResult.feasibility === 'RISKY';

  return (
    <div className="fixed bottom-4 inset-x-4 max-w-md mx-auto z-40 sm:hidden pointer-events-auto">
      <div className="bg-[#FAF8F3]/95 backdrop-blur-xl border border-[#E7E5DD] rounded-full p-2.5 px-4 shadow-float flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
        <div className="flex flex-col pl-1">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm text-[#183F35]">
              {formatCurrency(subtotal)}
            </span>
            <span className="text-xs text-[#707A73]">({totalQuantity} items)</span>
          </div>

          <div className="flex items-center gap-1 text-[10px] mt-0.5">
            {isFeasible ? (
              <span className="text-emerald-800 font-extrabold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                On time
              </span>
            ) : isRisky ? (
              <span className="text-amber-800 font-extrabold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Tight schedule
              </span>
            ) : (
              <span className="text-[#D96D4C] font-extrabold flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#D96D4C]" />
                May be late
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsCartOpen(true)}
          className="px-4 py-2 rounded-full bg-[#183F35] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <ShoppingBag className="w-4 h-4 text-[#E6B65C]" />
          <span>View Cart</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
