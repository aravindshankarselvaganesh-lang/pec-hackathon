'use client';

import React, { useState } from 'react';
import { HeroSection } from '@/components/customer/HeroSection';
import { BentoShowcase } from '@/components/customer/BentoShowcase';
import { MenuCategoryTabs, QuickFilterType } from '@/components/customer/MenuCategoryTabs';
import { MenuItemCard } from '@/components/customer/MenuItemCard';
import { BreakFitPanel } from '@/components/breakfit/BreakFitPanel';
import { CartDrawer } from '@/components/customer/CartDrawer';
import { MobileBottomBar } from '@/components/customer/MobileBottomBar';
import { useRestaurant } from '@/context/restaurant-context';
import { Clock, ShieldAlert, Sparkles, ChefHat, CheckCircle2, Zap, Utensils, Flame, Plus, Heart } from 'lucide-react';
import { formatCurrency, formatMinutes } from '@/domain/formatters';

export default function CustomerStorefrontPage() {
  const { menu, isLoading, addToCart, setIsCartOpen } = useRestaurant();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>('all');

  // Filter items across category, search, and express quick filters
  const filteredItems = menu.filter((item) => {
    const matchesCategory =
      selectedCategoryId === 'all' || item.categoryId === selectedCategoryId;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesQuick = true;
    if (quickFilter === 'under5') {
      matchesQuick = item.preparationTimeMinutes <= 5;
    } else if (quickFilter === 'pureveg') {
      matchesQuick = item.dietary === 'PURE_VEG' || item.dietary === 'VEGAN';
    } else if (quickFilter === 'bestseller') {
      matchesQuick = Boolean(item.isPopular);
    }

    return matchesCategory && matchesSearch && matchesQuick;
  });

  // Quick addition for campus combos
  const handleAddCombo = (itemIds: string[]) => {
    itemIds.forEach((id) => {
      const found = menu.find((m) => m.id === id);
      if (found) addToCart(found, 1);
    });
    setIsCartOpen(true);
  };

  return (
    <div className="min-w-0 pb-28 sm:pb-20">
      {/* 1. Hero Section with Visual Anchor SVG Blob */}
      <HeroSection />

      {/* 2. Main Storefront & Bento Box Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-10" id="bento-section">
        {/* Bento Grid Architecture */}
        <BentoShowcase />

        {/* Dynamic BreakFit Feasibility Summary (if cart has items or user is checking) */}
        <section aria-label="BreakFit Feasibility Check">
          <BreakFitPanel />
        </section>

        {/* ========================================================
            Popular Combos Section
           ======================================================== */}
        <section aria-label="Popular Meal Combos" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#E6B65C]" />
              <h3 className="font-extrabold text-lg sm:text-xl text-[#183F35] tracking-tight">
                Popular Combos
              </h3>
            </div>
            <span className="text-xs font-medium text-[#707A73]">
              Quick 1-click meal pairings
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Combo 1: Quick Tiffin & Chai */}
            <div className="bg-gradient-to-br from-emerald-500/10 via-white to-[#FDF8ED]/40 rounded-[30px] border border-emerald-200/80 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-diffuse hover:border-emerald-300 transition-all duration-300 group">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-emerald-900">
                    ⚡ Quick Tiffin Combo
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-700 text-white shadow-2xs">
                    Ready in 5m
                  </span>
                </div>
                <h4 className="font-extrabold text-base text-[#202923] group-hover:text-[#183F35] transition-colors">
                  Bombay Grill Sandwich + Kulhad Chai
                </h4>
                <p className="text-xs text-[#707A73] leading-relaxed">
                  Grilled potato cheese sandwich with hot ginger chai.
                </p>
                <div className="flex items-center gap-2.5 pt-1 text-sm">
                  <span className="font-extrabold text-[#183F35]">₹90</span>
                  <span className="text-xs line-through text-stone-400">₹95</span>
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    Save ₹5
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleAddCombo(['item-bombay-sandwich', 'item-kulhad-chai'])}
                className="px-5 py-3 rounded-full bg-[#183F35] text-white hover:bg-[#245447] text-xs font-extrabold flex items-center justify-center gap-2 self-start sm:self-center transition-all shadow-xs active:scale-95 whitespace-nowrap hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4 text-[#E6B65C]" />
                <span>Add Combo</span>
              </button>
            </div>

            {/* Combo 2: Burger & Fries */}
            <div className="bg-gradient-to-br from-amber-500/10 via-white to-[#FDF2EF]/40 rounded-[30px] border border-amber-200/80 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-diffuse hover:border-amber-300 transition-all duration-300 group">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-amber-950">
                    🍔 Burger & Fries Combo
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-600 text-white shadow-2xs">
                    Ready in 8m
                  </span>
                </div>
                <h4 className="font-extrabold text-base text-[#202923] group-hover:text-[#183F35] transition-colors">
                  Smash Burger + Peri Peri Fries + Shikanji
                </h4>
                <p className="text-xs text-[#707A73] leading-relaxed">
                  Brioche veggie burger with spiced fries and fresh lemon soda.
                </p>
                <div className="flex items-center gap-2.5 pt-1 text-sm">
                  <span className="font-extrabold text-[#183F35]">₹220</span>
                  <span className="text-xs line-through text-stone-400">₹235</span>
                  <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                    Save ₹15
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleAddCombo(['item-smash-burger', 'item-truffle-fries', 'item-nimbu-shikanji'])}
                className="px-5 py-3 rounded-full bg-[#183F35] text-white hover:bg-[#245447] text-xs font-extrabold flex items-center justify-center gap-2 self-start sm:self-center transition-all shadow-xs active:scale-95 whitespace-nowrap hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4 text-[#E6B65C]" />
                <span>Add Combo</span>
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================
            Menu Navigation & Search
           ======================================================== */}
        <section aria-label="Menu Items Navigation" id="menu-section">
          <MenuCategoryTabs
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            quickFilter={quickFilter}
            onQuickFilterChange={setQuickFilter}
          />
        </section>

        {/* ========================================================
            Menu Items Grid with Organic Tactile Cards
           ======================================================== */}
        <section aria-label="Menu List">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-[#707A73]">
              Loading food hall menu...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white rounded-[32px] border border-[#E7E5DD] p-12 text-center space-y-3 shadow-diffuse">
              <ChefHat className="w-12 h-12 text-stone-300 mx-auto" />
              <h4 className="font-extrabold text-base text-[#202923]">No items match your criteria</h4>
              <p className="text-xs text-[#707A73] max-w-sm mx-auto">
                Try clearing express filters or click &ldquo;All Cuisines&rdquo; to reset category filters.
              </p>
              <button
                onClick={() => {
                  setSelectedCategoryId('all');
                  setSearchQuery('');
                  setQuickFilter('all');
                }}
                className="px-5 py-2.5 rounded-full bg-[#183F35] text-white text-xs font-bold hover:bg-[#245447] transition-all active:scale-95 shadow-xs"
              >
                Reset Menu Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        {/* ========================================================
            How It Works Section
           ======================================================== */}
        <section
          id="how-breakfit-works"
          className="rounded-[32px] border border-[#E7E5DD] bg-white p-6 sm:p-8 space-y-4 shadow-diffuse relative overflow-hidden"
        >
          <div className="relative z-10 flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-[#183F35] text-[#E6B65C] flex items-center justify-center font-bold text-sm shadow-xs">
              <Sparkles className="w-5 h-5 text-[#E6B65C]" />
            </span>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl text-[#183F35]">
                How It Works
              </h3>
              <p className="text-xs text-[#707A73]">
                3 simple steps to get your food fresh and on time.
              </p>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#707A73]">
            <div className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#E7E5DD] space-y-1.5">
              <div className="flex items-center gap-2 text-[#183F35] font-extrabold text-sm">
                <Clock className="w-4 h-4 text-[#E6B65C]" />
                <h4>1. Set Pickup Time</h4>
              </div>
              <p>
                Choose when you need your order before you browse the menu.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#E7E5DD] space-y-1.5">
              <div className="flex items-center gap-2 text-[#183F35] font-extrabold text-sm">
                <Flame className="w-4 h-4 text-[#D96D4C]" />
                <h4>2. Live Queue Check</h4>
              </div>
              <p>
                We track live counter lines to give you realistic prep estimates.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#E7E5DD] space-y-1.5">
              <div className="flex items-center gap-2 text-[#183F35] font-extrabold text-sm">
                <Sparkles className="w-4 h-4 text-[#1E7E51]" />
                <h4>3. Smart Swaps</h4>
              </div>
              <p>
                If a station is busy, we suggest faster alternatives so you stay on schedule.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Slide-in Cart / Tray Drawer */}
      <CartDrawer />

      {/* Floating Mobile Bottom Bar */}
      <MobileBottomBar />
    </div>
  );
}
