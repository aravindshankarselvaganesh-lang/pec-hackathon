'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Clock, Plus, Minus, ChefHat, AlertCircle, UtensilsCrossed } from 'lucide-react';
import { MenuItem } from '@/domain/types';
import { useRestaurant } from '@/context/restaurant-context';
import { formatCurrency, formatMinutes } from '@/domain/formatters';

interface MenuItemCardProps {
  item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const { cart, addToCart, updateQuantity, kitchenSnapshots } = useRestaurant();
  const [imageError, setImageError] = useState(false);

  const cartItem = cart.find((ci) => ci.menuItem.id === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  // Find live station snapshot for queue context
  const stationSnapshot = kitchenSnapshots.find((s) => s.stationId === item.stationId);
  const stationWait = stationSnapshot ? stationSnapshot.currentWaitMinutes : 0;

  const stationLabels: Record<string, string> = {
    'quick-bites': 'Quick Bites',
    'hot-kitchen': 'Hot Kitchen',
    'fryer': 'Fryer',
    'drinks': 'Drinks Bar',
  };

  return (
    <div
      className={`group bg-white rounded-[28px] border transition-all duration-300 ease-out overflow-hidden flex flex-col justify-between ${
        item.isAvailable
          ? 'border-[#E7E5DD] hover:border-[#183F35]/30 hover:shadow-diffuse hover:-translate-y-1'
          : 'border-[#E7E5DD] opacity-60 bg-stone-50'
      }`}
    >
      <div>
        {/* Photo Container */}
        <div className="relative h-48 w-full bg-stone-100 overflow-hidden">
          {!imageError && Boolean(item.image) ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 350px"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#E6EFE8] text-[#183F35]">
              <UtensilsCrossed className="w-8 h-8 opacity-40 mb-1" />
              <span className="text-xs font-semibold">{item.name}</span>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 max-w-[85%]">
            {/* Universal Dietary Badge */}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 ${
                item.dietary === 'PURE_VEG' || item.dietary === 'VEG'
                  ? 'bg-emerald-950/85 text-emerald-100 border border-emerald-500/40'
                  : item.dietary === 'NON_VEG'
                  ? 'bg-rose-950/85 text-rose-100 border border-rose-500/40'
                  : item.dietary === 'VEGAN'
                  ? 'bg-teal-950/85 text-teal-100 border border-teal-500/40'
                  : 'bg-stone-900/85 text-amber-200 border border-amber-500/40'
              }`}
            >
              {(item.dietary === 'PURE_VEG' || item.dietary === 'VEG') && (
                <span className="w-3 h-3 border border-emerald-400 p-[1.5px] rounded-[2px] flex items-center justify-center bg-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </span>
              )}
              {item.dietary === 'NON_VEG' && (
                <span className="w-3 h-3 border border-rose-400 p-[1.5px] rounded-[2px] flex items-center justify-center bg-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                </span>
              )}
              {item.dietary === 'PURE_VEG'
                ? 'Pure Veg'
                : item.dietary === 'NON_VEG'
                ? 'Non-Veg'
                : item.dietary === 'VEGAN'
                ? 'Vegan'
                : item.dietary === 'BEVERAGE'
                ? 'Brew / Boba'
                : item.dietary}
            </span>

            {/* Chef's Pick Badge */}
            {item.chefPick && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#D96D4C] text-white shadow-xs flex items-center gap-1">
                <ChefHat className="w-3 h-3 text-[#E6B65C]" />
                Chef&apos;s Pick
              </span>
            )}

            {/* Under 5 min / Fast Prep Badge */}
            {item.fastPrepBadge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E6EFE8] text-[#183F35] border border-[#183F35]/20 shadow-xs">
                {item.fastPrepBadge}
              </span>
            )}
          </div>

          {/* Cooking Time Overlay */}
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 bg-black/80 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg">
            <Clock className="w-3 h-3 text-[#E6B65C]" />
            <span>{formatMinutes(item.preparationTimeMinutes)}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-bold text-sm sm:text-base text-[#202923] leading-snug group-hover:text-[#183F35] transition-colors">
              {item.name}
            </h4>
            <span className="font-extrabold text-sm sm:text-base text-[#183F35] whitespace-nowrap">
              {formatCurrency(item.price)}
            </span>
          </div>

          <p className="text-xs text-[#707A73] line-clamp-2 leading-relaxed">
            {item.description}
          </p>

          {/* Portion Note & Serving Detail */}
          {item.portionNote && (
            <p className="text-[11px] text-[#8E3219] font-medium bg-[#FDF2EF] px-2 py-1 rounded-md border border-[#D96D4C]/15 flex items-center gap-1">
              <span>✦</span>
              <span className="truncate">{item.portionNote}</span>
            </p>
          )}

          {/* Station & Live Queue Wait */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-[#F7F5EF] border border-[#E7E5DD] font-medium text-[#202923]">
              {stationLabels[item.stationId] || item.stationId}
            </span>
            {stationWait > 0 && item.isAvailable && (
              <span className="text-[10px] text-[#707A73] font-medium">
                • Wait: ~{stationWait}m
              </span>
            )}
            {!item.isAvailable && (
              <span className="text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Sold Out
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 pt-0">
        {!item.isAvailable ? (
          <button
            type="button"
            disabled
            className="w-full py-2.5 rounded-full bg-stone-200 text-stone-500 font-semibold text-xs cursor-not-allowed text-center"
          >
            Sold Out
          </button>
        ) : quantity === 0 ? (
          <button
            type="button"
            onClick={() => addToCart(item, 1)}
            aria-label={`Add ${item.name} to cart`}
            className="w-full py-2.5 rounded-full bg-[#183F35] text-white hover:bg-[#245447] font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs min-h-[44px]"
          >
            <Plus className="w-4 h-4 text-[#E6B65C]" aria-hidden="true" />
            <span>Add</span>
          </button>
        ) : (
          <div className="flex items-center justify-between bg-[#F7F5EF] border border-[#E7E5DD] rounded-full p-1 min-h-[44px]">
            <button
              type="button"
              onClick={() => updateQuantity(item.id, -1)}
              className="w-9 h-9 rounded-full bg-white border border-[#E7E5DD] text-[#202923] hover:bg-[#E6EFE8] flex items-center justify-center transition-colors active:scale-90"
              aria-label={`Decrease quantity of ${item.name}`}
            >
              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <span className="font-extrabold text-xs sm:text-sm text-[#183F35] px-3" aria-live="polite">
              {quantity} in cart
            </span>
            <button
              type="button"
              onClick={() => updateQuantity(item.id, 1)}
              className="w-9 h-9 rounded-full bg-[#183F35] text-white hover:bg-[#245447] flex items-center justify-center transition-colors active:scale-90 shadow-2xs"
              aria-label={`Increase quantity of ${item.name}`}
            >
              <Plus className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
