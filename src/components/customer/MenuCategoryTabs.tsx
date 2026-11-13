'use client';

import React from 'react';
import { Search, X, Zap, Leaf, Flame, Sparkles } from 'lucide-react';
import { useRestaurant } from '@/context/restaurant-context';

export type QuickFilterType = 'all' | 'under5' | 'pureveg' | 'bestseller';

interface MenuCategoryTabsProps {
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  quickFilter: QuickFilterType;
  onQuickFilterChange: (filter: QuickFilterType) => void;
}

export function MenuCategoryTabs({
  selectedCategoryId,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  quickFilter,
  onQuickFilterChange,
}: MenuCategoryTabsProps) {
  const { categories, menu } = useRestaurant();

  const getCategoryCount = (catId: string) => {
    if (catId === 'all') return menu.length;
    return menu.filter((m) => m.categoryId === catId).length;
  };

  return (
    <div className="space-y-4">
      {/* Search Bar & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#183F35] tracking-tight">
            Menu
          </h3>
          <p className="text-xs text-[#707A73]">
            Fresh food and drinks with live prep times.
          </p>
        </div>

        {/* Search Input with Organic Glassmorphic Pill */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#707A73] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search dishes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-full border border-[#E7E5DD] bg-white/80 backdrop-blur-md text-xs text-[#202923] placeholder:text-[#707A73] focus:outline-none focus:ring-2 focus:ring-[#183F35]/20 focus:border-[#183F35] shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707A73] hover:text-[#202923] p-1"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Speed & Dietary Quick Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <span className="text-[11px] font-extrabold text-[#707A73] uppercase tracking-wider mr-1">
          Filters:
        </span>

        <button
          onClick={() => onQuickFilterChange(quickFilter === 'under5' ? 'all' : 'under5')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all duration-200 border active:scale-95 shadow-2xs ${
            quickFilter === 'under5'
              ? 'bg-[#E6B65C] text-[#183F35] border-[#D4A346] shadow-xs'
              : 'bg-white text-[#202923] border-[#E7E5DD] hover:bg-[#FAF8F3]'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-700" />
          <span>≤ 5 mins</span>
        </button>

        <button
          onClick={() => onQuickFilterChange(quickFilter === 'pureveg' ? 'all' : 'pureveg')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all duration-200 border active:scale-95 shadow-2xs ${
            quickFilter === 'pureveg'
              ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
              : 'bg-white text-[#202923] border-[#E7E5DD] hover:bg-[#FAF8F3]'
          }`}
        >
          <Leaf className="w-3.5 h-3.5 text-emerald-600" />
          <span>Pure Veg</span>
        </button>

        <button
          onClick={() => onQuickFilterChange(quickFilter === 'bestseller' ? 'all' : 'bestseller')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all duration-200 border active:scale-95 shadow-2xs ${
            quickFilter === 'bestseller'
              ? 'bg-[#183F35] text-white border-[#183F35] shadow-xs'
              : 'bg-white text-[#202923] border-[#E7E5DD] hover:bg-[#FAF8F3]'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-[#E6B65C]" />
          <span>Popular</span>
        </button>

        {quickFilter !== 'all' && (
          <button
            onClick={() => onQuickFilterChange('all')}
            className="text-[11px] text-[#707A73] hover:text-[#183F35] font-semibold underline ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Category Pills (horizontally scrollable organic pebble buttons) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
        {categories.map((cat) => {
          const count = getCategoryCount(cat.id);
          const isSelected = selectedCategoryId === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 border active:scale-95 shadow-2xs ${
                isSelected
                  ? 'bg-[#183F35] text-white border-[#183F35] shadow-sm'
                  : 'bg-white text-[#202923] border-[#E7E5DD] hover:bg-[#FAF8F3] hover:border-[#183F35]/20'
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-white/20 text-white font-extrabold' : 'bg-[#E7E5DD] text-[#707A73]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
