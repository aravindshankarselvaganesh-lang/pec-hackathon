'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Utensils,
} from 'lucide-react';
import { useRestaurant } from '@/context/restaurant-context';
import { formatCurrency, formatMinutes } from '@/domain/formatters';
import { KitchenAuthWrapper } from '@/components/kitchen/KitchenAuthWrapper';

export default function KitchenMenuStockPage() {
  const { menu, toggleMenuItemAvailability, categories } = useRestaurant();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleToggle = async (itemId: string, currentAvailable: boolean) => {
    try {
      setUpdatingId(itemId);
      await toggleMenuItemAvailability(itemId, !currentAvailable);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredItems = menu.filter((item) => {
    const matchCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchSearch =
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.stationId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <KitchenAuthWrapper>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header & Back link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E5DD]">
          <div>
            <Link
              href="/kitchen"
              className="inline-flex items-center gap-1.5 text-xs text-[#183F35] font-semibold hover:underline mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Kitchen Live Queue</span>
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#183F35] tracking-tight">
                Menu Stock & Availability
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#E6EFE8] text-[#183F35]">
                Kitchen Pass
              </span>
            </div>
            <p className="text-xs text-[#707A73] mt-0.5">
              Toggle dish availability instantly to manage line rush and out-of-stock items.
            </p>
          </div>

          <Link
            href="/menu"
            className="px-3.5 py-2 rounded-xl bg-white border border-[#E7E5DD] text-[#202923] hover:bg-[#F7F5EF] text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto transition-colors shadow-2xs"
          >
            <Utensils className="w-3.5 h-3.5 text-[#183F35]" />
            <span>Open Customer Menu</span>
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#E7E5DD] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold" role="tablist" aria-label="Menu categories">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-[#183F35] text-white border-[#183F35]'
                    : 'bg-white text-[#707A73] border-[#E7E5DD] hover:bg-[#F7F5EF] hover:text-[#202923]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#707A73] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search dish or station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search dish or station"
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#E7E5DD] text-xs text-[#202923] placeholder:text-[#707A73] focus:outline-none focus:border-[#183F35]"
            />
          </div>
        </div>

        {/* Menu Table */}
        <div className="bg-white rounded-2xl border border-[#E7E5DD] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F3] border-b border-[#E7E5DD] text-[#707A73] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Item Details</th>
                  <th className="py-3 px-4">Station</th>
                  <th className="py-3 px-4">Prep Time</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Availability Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5DD]">
                {filteredItems.map((item) => {
                  const isToggling = updatingId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#FAF8F3]/60 transition-colors ${
                        !item.isAvailable ? 'bg-stone-50/70 text-stone-500' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-sm text-[#202923]">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-[#707A73] max-w-sm truncate mt-0.5">
                          {item.description}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-[#183F35]">
                        <span className="px-2 py-0.5 rounded bg-[#F7F5EF] border border-[#E7E5DD]">
                          {item.stationId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="flex items-center gap-1 font-semibold text-[#202923]">
                          <Clock className="w-3.5 h-3.5 text-[#E6B65C]" />
                          <span>{formatMinutes(item.preparationTimeMinutes)}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-extrabold text-[#183F35] text-sm">
                        {formatCurrency(item.price)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {item.isAvailable ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-rose-50 text-rose-800 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Sold Out
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggle(item.id, item.isAvailable)}
                          disabled={isToggling}
                          aria-label={`${item.isAvailable ? 'Mark ' + item.name + ' as sold out' : 'Mark ' + item.name + ' as available'}`}
                          className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all border ${
                            item.isAvailable
                              ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          } disabled:opacity-50`}
                        >
                          {isToggling
                            ? 'Updating...'
                            : item.isAvailable
                            ? 'Mark Sold Out'
                            : 'Mark Available'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </KitchenAuthWrapper>
  );
}
