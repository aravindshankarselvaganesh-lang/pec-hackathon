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
import { Clock, ChefHat, Zap, Flame, Plus } from 'lucide-react';

export default function CustomerMenuPage() {
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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-28 sm:pb-20 overflow-x-hidden">
      {/* 1. Hero Introduction */}
      <HeroSection />

      {/* 2. Interactive Bento Showcase */}
      <BentoShowcase />

      {/* 3. BreakFit Live Feasibility Summary Drawer/Card */}
      <BreakFitPanel />

      {/* 4. Menu Catalog Explorer with Anchor */}
      <section id="menu-section" className="space-y-6 pt-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#E7E5DD]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#183F35] tracking-tight">
                Food Hall Menu
              </h2>
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#E6EFE8] text-[#183F35]">
                {filteredItems.length} items
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#707A73] mt-1">
              Select dishes to see real-time prep and pickup times.
            </p>
          </div>
        </div>

        {/* Category Pill Tabs & Search Filter */}
        <MenuCategoryTabs
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          quickFilter={quickFilter}
          onQuickFilterChange={setQuickFilter}
        />

        {/* Food Items Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-5 border border-[#E7E5DD] shadow-xs animate-pulse space-y-4"
              >
                <div className="h-44 bg-[#F2EFE7] rounded-2xl w-full" />
                <div className="h-4 bg-[#F2EFE7] rounded w-2/3" />
                <div className="h-3 bg-[#F2EFE7] rounded w-full" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-5 bg-[#F2EFE7] rounded w-16" />
                  <div className="h-9 bg-[#F2EFE7] rounded-full w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#E7E5DD] p-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FAF8F3] text-[#707A73] flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6 text-[#707A73]" />
            </div>
            <h3 className="font-bold text-[#183F35]">No dishes found</h3>
            <p className="text-xs text-[#707A73] max-w-sm mx-auto">
              No menu items match your search or filters. Try clearing your filters or selecting a different category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategoryId('all');
                setSearchQuery('');
                setQuickFilter('all');
              }}
              className="px-4 py-2 text-xs font-bold bg-[#183F35] text-white rounded-full hover:bg-[#245447] transition-all"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* 5. Recommended Combos */}
      <section className="bg-white rounded-3xl border border-[#E7E5DD] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#183F35]">
              Popular Quick Combos
            </h3>
            <p className="text-xs text-[#707A73]">
              Curated pairings timed for fast preparation.
            </p>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#FAF8F3] text-[#707A73] border border-[#E7E5DD]">
            Chef Paired
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Combo 1: Bombay Street Express */}
          <div className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#E7E5DD] flex flex-col justify-between space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  5 Min Prep
                </span>
                <span className="font-bold text-[#183F35] text-sm">₹95</span>
              </div>
              <h4 className="font-bold text-sm text-[#183F35]">Express Chai &amp; Toast</h4>
              <p className="text-[11px] text-[#707A73] leading-relaxed">
                Bombay Masala Grill Sandwich paired with a hot Kulhad Adrak Chai.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleAddCombo(['item-bombay-sandwich', 'item-kulhad-chai'])}
              className="w-full py-2 rounded-xl bg-white border border-[#E7E5DD] hover:border-[#183F35] text-[#183F35] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#E6EFE8] transition-all active:scale-95 shadow-2xs"
              aria-label="Add Bombay Grill Sandwich and Kulhad Chai combo to cart"
            >
              <Plus className="w-3.5 h-3.5 text-[#183F35]" />
              <span>Add Combo (₹95)</span>
            </button>
          </div>

          {/* Combo 2: South Indian Filter Kaapi & Samosas */}
          <div className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#E7E5DD] flex flex-col justify-between space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  4 Min Prep
                </span>
                <span className="font-bold text-[#183F35] text-sm">₹75</span>
              </div>
              <h4 className="font-bold text-sm text-[#183F35]">Crisp Samosas &amp; Filter Kaapi</h4>
              <p className="text-[11px] text-[#707A73] leading-relaxed">
                2 Garam Aloo Samosas with chutney and Degree South Indian Filter Coffee.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleAddCombo(['item-samosa', 'item-filter-coffee'])}
              className="w-full py-2 rounded-xl bg-white border border-[#E7E5DD] hover:border-[#183F35] text-[#183F35] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#E6EFE8] transition-all active:scale-95 shadow-2xs"
              aria-label="Add Samosas and Filter Coffee combo to cart"
            >
              <Plus className="w-3.5 h-3.5 text-[#183F35]" />
              <span>Add Combo (₹75)</span>
            </button>
          </div>

          {/* Combo 3: Fast Asian Break */}
          <div className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#E7E5DD] flex flex-col justify-between space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  4 Min Prep
                </span>
                <span className="font-bold text-[#183F35] text-sm">₹175</span>
              </div>
              <h4 className="font-bold text-sm text-[#183F35]">Momos &amp; Boba Break</h4>
              <p className="text-[11px] text-[#707A73] leading-relaxed">
                Steamed Himalayan Dumplings (6 pcs) with Brown Sugar Boba Tea.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleAddCombo(['item-steamed-momos', 'item-boba-tea'])}
              className="w-full py-2 rounded-xl bg-white border border-[#E7E5DD] hover:border-[#183F35] text-[#183F35] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#E6EFE8] transition-all active:scale-95 shadow-2xs"
              aria-label="Add Steamed Momos and Boba Tea combo to cart"
            >
              <Plus className="w-3.5 h-3.5 text-[#183F35]" />
              <span>Add Combo (₹175)</span>
            </button>
          </div>
        </div>
      </section>

      {/* 6. Simple 3-Step Guide */}
      <section className="bg-white rounded-3xl border border-[#E7E5DD] p-6 sm:p-8 shadow-xs">
        <h3 className="text-base sm:text-lg font-extrabold text-[#183F35] mb-4">
          How It Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E6EFE8] text-[#183F35] font-extrabold text-sm flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#202923]">Pick your pickup time</h4>
              <p className="text-xs text-[#707A73] mt-0.5">
                Tell us when your break ends or when you want your food ready.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E6EFE8] text-[#183F35] font-extrabold text-sm flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#202923]">Live kitchen check</h4>
              <p className="text-xs text-[#707A73] mt-0.5">
                We check live cooking stations. If a dish takes too long, we suggest faster swaps.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E6EFE8] text-[#183F35] font-extrabold text-sm flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#202923]">Grab and go</h4>
              <p className="text-xs text-[#707A73] mt-0.5">
                Show your order token at the counter and pick up freshly cooked food on time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Cart Drawer */}
      <CartDrawer />

      {/* Mobile Floating Sticky Checkout Bar */}
      <MobileBottomBar />
    </main>
  );
}
