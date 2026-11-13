'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  SlidersHorizontal,
} from 'lucide-react';
import { OverviewMetrics } from '@/components/admin/OverviewMetrics';
import { KitchenWorkloadCards } from '@/components/admin/KitchenWorkloadCards';
import { LiveOrderQueue } from '@/components/admin/LiveOrderQueue';
import { WalkInOrderModal } from '@/components/admin/WalkInOrderModal';
import { useRestaurant } from '@/context/restaurant-context';

export default function RestaurantAdminPage() {
  const { restaurant } = useRestaurant();
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Kitchen Floor Subheader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E5DD]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#183F35] tracking-tight">
              Kitchen Live Queue
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#E6EFE8] text-[#183F35]">
              Live KDS
            </span>
          </div>
          <p className="text-xs text-[#707A73] mt-0.5">
            {restaurant?.name || 'Crossroads Food Hall'} • Active Orders & Station Queues
          </p>
        </div>

        {/* Quick Top Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsWalkInModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#183F35] text-white hover:bg-[#245447] active:scale-95 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#E6B65C]" aria-hidden="true" />
            <span>New Walk-In Order</span>
          </button>

          <Link
            href="/admin/menu"
            className="px-4 py-2 rounded-xl bg-white border border-[#E7E5DD] text-[#202923] hover:bg-[#F7F5EF] active:scale-95 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#707A73]" />
            <span>Menu Stock</span>
          </Link>
        </div>
      </div>

      {/* 1. Overview Metrics Cards */}
      <OverviewMetrics />

      {/* 2. Kitchen Station Workload Section */}
      <KitchenWorkloadCards />

      {/* 3. Live Order Queue Table/Cards */}
      <LiveOrderQueue />

      {/* Walk-in Modal */}
      <WalkInOrderModal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
      />
    </main>
  );
}
