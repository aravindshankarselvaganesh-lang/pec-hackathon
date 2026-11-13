'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Clock,
  Sparkles,
  Zap,
  ChefHat,
  Plus,
  Flame,
  ArrowRight,
  Coffee,
  CheckCircle2,
  UtensilsCrossed,
  Layers,
  Heart,
  TrendingUp,
} from 'lucide-react';
import { useRestaurant } from '@/context/restaurant-context';
import { DEMO_MENU_ITEMS } from '@/data/demo-menu';
import { formatCurrency, formatMinutes, formatTimeHHMM, formatTime24H, parseTimeToTodayDate } from '@/domain/formatters';

export function BentoShowcase() {
  const {
    menu,
    kitchenSnapshots,
    customerDeadline,
    setCustomerDeadline,
    breakFitResult,
    addToCart,
    setIsCartOpen,
  } = useRestaurant();

  const [activePreset, setActivePreset] = useState<number | null>(15);

  const setPresetMinutes = (min: number) => {
    setActivePreset(min);
    const target = new Date(Date.now() + min * 60000);
    setCustomerDeadline(formatTime24H(target));
  };

  // Safe menu fallback during initial SSR before hydration
  const activeMenu = menu.length > 0 ? menu : DEMO_MENU_ITEMS;

  // Find Chef's Spotlight Item
  const chefSpecial =
    activeMenu.find((item) => item.chefPick) ||
    activeMenu.find((item) => item.id === 'item-masala-dosa') ||
    activeMenu[0];

  // Express Flash Items (<= 4 mins)
  const flashItems = activeMenu.filter((item) => item.preparationTimeMinutes <= 4).slice(0, 4);

  return (
    <section aria-label="Organic Bento Grid Showcase" className="space-y-4">
      {/* Bento Grid Container: Asymmetrical, Broken-Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        {/* ========================================================
            BENTO CELL 1: Interactive BreakFit Deadline Controller (Col span 7)
            Fluid card with generous rounded borders and diffused shadow
           ======================================================== */}
        <div className="md:col-span-7 bg-[#FAF8F3]/90 backdrop-blur-md rounded-[32px] border border-[#E7E5DD] p-6 sm:p-8 shadow-diffuse relative overflow-hidden flex flex-col justify-between group hover:border-[#183F35]/30 transition-all duration-300">
          {/* Organic Background Anchor Blob */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-gradient-to-br from-[#E6EFE8]/80 to-[#FDF8ED]/40 blur-2xl pointer-events-none -z-0" />

          <div className="relative z-10 space-y-4">
            {/* Top Pill & Title */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6EFE8] text-[#183F35] text-xs font-bold border border-[#183F35]/15 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#E6B65C]" />
                <span>Pickup Time</span>
              </span>

              <div className="flex items-center gap-2 text-xs font-medium text-[#707A73] bg-white/80 px-3 py-1 rounded-full border border-[#E7E5DD]">
                <Clock className="w-3.5 h-3.5 text-[#183F35]" />
                <span>Pickup by: <strong className="text-[#183F35] font-extrabold">{formatTimeHHMM(customerDeadline)}</strong></span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#183F35] tracking-tight leading-snug">
                When do you need your food?
              </h2>
              <p className="text-xs sm:text-sm text-[#707A73] leading-relaxed max-w-lg">
                Choose your collection time. We check live counter wait times to make sure your order is ready when you arrive.
              </p>
            </div>

            {/* Tactile Quick Picks (Pill Buttons with soft depression) */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-[#707A73] uppercase tracking-wider block">
                Quick Presets:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { min: 10, label: '10 mins' },
                  { min: 15, label: '15 mins (Standard)' },
                  { min: 25, label: '25 mins' },
                ].map((preset) => (
                  <button
                    key={preset.min}
                    type="button"
                    onClick={() => setPresetMinutes(preset.min)}
                    className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200 border active:scale-95 flex items-center gap-1.5 ${
                      activePreset === preset.min
                        ? 'bg-[#183F35] text-white border-[#183F35] shadow-sm'
                        : 'bg-white text-[#202923] border-[#E7E5DD] hover:bg-[#F2EFE7] hover:border-[#183F35]/20'
                    }`}
                  >
                    <span>{preset.label}</span>
                  </button>
                ))}

                {/* Custom Time Input */}
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#E7E5DD] shadow-2xs">
                  <span className="text-[11px] text-[#707A73] font-medium">Custom:</span>
                  <input
                    type="time"
                    value={customerDeadline}
                    onChange={(e) => {
                      setActivePreset(null);
                      setCustomerDeadline(e.target.value);
                    }}
                    className="text-xs font-extrabold text-[#183F35] bg-transparent focus:outline-none"
                    aria-label="Set custom break time"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Feasibility Indicator Bar */}
          <div className="relative z-10 mt-6 pt-4 border-t border-[#E7E5DD]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  breakFitResult.feasibility === 'FEASIBLE'
                    ? 'bg-emerald-500 animate-pulse'
                    : breakFitResult.feasibility === 'RISKY'
                    ? 'bg-amber-500'
                    : 'bg-[#D96D4C]'
                }`}
              />
              <span className="text-[#202923] font-semibold">
                Status: <strong className="text-[#183F35]">{breakFitResult.statusLabel}</strong>
              </span>
              <span className="text-[#707A73] hidden sm:inline">•</span>
              <span className="text-[#707A73] hidden sm:inline">
                Ready by {breakFitResult.estimatedReadyTime}
              </span>
            </div>

            <a
              href="#menu-section"
              className="text-[#183F35] font-extrabold flex items-center gap-1 hover:underline self-start sm:self-auto"
            >
              <span>View Menu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* ========================================================
            BENTO CELL 2: Chef's Daily Spotlight (Col span 5)
            Asymmetric Card with Curved Image Frame & Floating Badge
           ======================================================== */}
        <div className="md:col-span-5 bg-white rounded-[32px] border border-[#E7E5DD] p-5 sm:p-6 shadow-diffuse flex flex-col justify-between relative overflow-hidden group hover:border-[#183F35]/30 transition-all duration-300">
          <div className="space-y-3.5">
            {/* Header Tag */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F3] text-[#D96D4C] text-[11px] font-extrabold border border-[#D96D4C]/20 shadow-2xs">
                <ChefHat className="w-3.5 h-3.5 text-[#D96D4C]" />
                <span>Chef&apos;s Special</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Fresh
              </span>
            </div>

            {/* Asymmetrical Curved Photo Container with Floating Tag */}
            <div className="relative h-44 w-full rounded-[24px] overflow-hidden bg-stone-100 shadow-inner">
              <Image
                src={chefSpecial.image}
                alt={chefSpecial.name}
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />

              {/* Overlapping Floating Price Tag */}
              <div className="absolute bottom-3 left-3 bg-[#FAF8F3]/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-extrabold text-[#183F35] shadow-xs flex items-center gap-1.5">
                <span>{formatCurrency(chefSpecial.price)}</span>
                <span className="text-[10px] text-[#707A73] font-normal">• {formatMinutes(chefSpecial.preparationTimeMinutes)}</span>
              </div>

              {/* Dietary Pill */}
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                {chefSpecial.dietary === 'PURE_VEG' ? 'Pure Veg' : chefSpecial.dietary}
              </div>
            </div>

            {/* Dish Info */}
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-[#202923] group-hover:text-[#183F35] transition-colors">
                {chefSpecial.name}
              </h3>
              <p className="text-xs text-[#707A73] line-clamp-2 leading-relaxed">
                {chefSpecial.description}
              </p>
              {chefSpecial.portionNote && (
                <p className="text-[11px] text-[#8E3219] font-medium pt-0.5 flex items-center gap-1">
                  <span>✦</span>
                  <span className="truncate">{chefSpecial.portionNote}</span>
                </p>
              )}
            </div>
          </div>

          {/* Quick Action Button with Tactile Depression */}
          <div className="pt-4 mt-2 border-t border-[#E7E5DD] flex items-center justify-between gap-3">
            <span className="text-[11px] text-[#707A73]">
              Queue wait: ~{kitchenSnapshots.find((s) => s.stationId === chefSpecial.stationId)?.currentWaitMinutes || 8}m
            </span>
            <button
              type="button"
              onClick={() => {
                addToCart(chefSpecial, 1);
                setIsCartOpen(true);
              }}
              className="px-4 py-2 rounded-full bg-[#183F35] text-white hover:bg-[#245447] active:scale-95 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-[#E6B65C]" />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            BENTO CELL 3: Multi-Station Live Kitchen Congestion Heatmap (Col span 5)
            Organic pill meters showing real queues
           ======================================================== */}
        <div className="md:col-span-5 bg-white rounded-[32px] border border-[#E7E5DD] p-5 sm:p-6 shadow-diffuse space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-extrabold text-sm text-[#183F35]">
                  Station Wait Times
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-[#707A73] bg-[#FAF8F3] px-2 py-0.5 rounded-full border border-[#E7E5DD]">
                Live
              </span>
            </div>

            <p className="text-xs text-[#707A73]">
              Current queue times across all counters.
            </p>

            {/* Station Progress Bars */}
            <div className="space-y-2.5 pt-1">
              {kitchenSnapshots.map((station) => {
                const loadPercent = Math.min(100, Math.round((station.activeLoad / station.totalCapacity) * 100));

                return (
                  <div
                    key={station.stationId}
                    className="p-2.5 rounded-[18px] bg-[#FAF8F3] border border-[#E7E5DD] flex items-center justify-between text-xs transition-all hover:bg-white hover:shadow-2xs"
                  >
                    <div className="space-y-0.5 flex-1 min-w-0 pr-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#202923] truncate">
                          {station.stationName}
                        </span>
                        <span className="font-extrabold text-[#183F35]">
                          ~{formatMinutes(station.currentWaitMinutes)}
                        </span>
                      </div>
                      <div className="w-full bg-[#E7E5DD] rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            station.status === 'PEAK'
                              ? 'bg-[#D96D4C]'
                              : station.status === 'BUSY'
                              ? 'bg-[#E6B65C]'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.max(15, loadPercent)}%` }}
                        />
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        station.status === 'PEAK'
                          ? 'bg-rose-100 text-rose-800'
                          : station.status === 'BUSY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {station.status === 'PEAK' ? 'Busy' : station.status === 'BUSY' ? 'Active' : 'Fast'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================
            BENTO CELL 4: Flash Express Rail (<= 4m Prep) (Col span 7)
            Pebble-shaped quick additions for tight break times
           ======================================================== */}
        <div className="md:col-span-7 bg-gradient-to-br from-[#FAF8F3] via-white to-[#E6EFE8]/30 rounded-[32px] border border-[#E7E5DD] p-5 sm:p-6 shadow-diffuse flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#E6B65C]" />
              <h3 className="font-extrabold text-sm sm:text-base text-[#183F35]">
                Quick Picks (≤ 4 mins)
              </h3>
            </div>
            <span className="text-[11px] font-medium text-[#707A73]">
              Fastest items to prepare
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {flashItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[#E7E5DD] p-3 flex flex-col justify-between hover:border-[#183F35]/30 hover:shadow-card transition-all duration-200 group"
              >
                <div className="space-y-1.5">
                  <div className="relative h-20 w-full rounded-xl overflow-hidden bg-stone-100">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="150px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                      {item.preparationTimeMinutes}m
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-[#202923] truncate leading-tight group-hover:text-[#183F35]">
                    {item.name}
                  </h4>
                  <div className="text-xs font-extrabold text-[#183F35]">
                    {formatCurrency(item.price)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => addToCart(item, 1)}
                  className="mt-2 w-full py-1.5 rounded-lg bg-[#FAF8F3] hover:bg-[#183F35] text-[#183F35] hover:text-white border border-[#E7E5DD] hover:border-[#183F35] text-[11px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
