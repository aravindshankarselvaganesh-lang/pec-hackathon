'use client';

import React from 'react';
import { ShoppingBag, Clock, PackageCheck, Flame } from 'lucide-react';
import { useRestaurant } from '@/context/restaurant-context';
import { parseTimeToTodayDate } from '@/domain/formatters';

export function OverviewMetrics() {
  const { orders, kitchenSnapshots } = useRestaurant();

  const activeOrders = orders.filter((o) => o.status !== 'COLLECTED' && o.status !== 'CANCELLED');
  const readyOrders = orders.filter((o) => o.status === 'READY');

  // Orders due in next 10 minutes or overdue
  const now = new Date();
  const dueSoonOrders = activeOrders.filter((o) => {
    const deadline = parseTimeToTodayDate(o.requestedDeadline);
    const diffMin = (deadline.getTime() - now.getTime()) / 60000;
    return diffMin <= 10;
  });

  // Calculate overall kitchen load
  const maxWait = Math.max(...kitchenSnapshots.map((s) => s.currentWaitMinutes), 0);
  const kitchenStatus = maxWait >= 9 ? 'Lunch Rush' : maxWait >= 5 ? 'Steady Prep' : 'Calm Flow';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Active Orders */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7E5DD] shadow-xs">
        <div className="flex items-center justify-between text-[#707A73] mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Active Orders</span>
          <div className="w-7 h-7 rounded-lg bg-[#E6EFE8] text-[#183F35] flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-[#183F35]" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-[#183F35]">{activeOrders.length}</div>
        <div className="text-[11px] text-[#707A73] mt-1">
          {orders.filter((o) => o.status === 'PREPARING').length} cooking now
        </div>
      </div>

      {/* 2. Due Soon / Deadline Alert */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7E5DD] shadow-xs">
        <div className="flex items-center justify-between text-[#707A73] mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Due Soon (&lt;10m)</span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <Clock className="w-4 h-4 text-amber-700" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-amber-800">{dueSoonOrders.length}</div>
        <div className="text-[11px] text-[#707A73] mt-1">
          Priority orders
        </div>
      </div>

      {/* 3. Ready for Collection */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7E5DD] shadow-xs">
        <div className="flex items-center justify-between text-[#707A73] mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Ready for Pickup</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <PackageCheck className="w-4 h-4 text-emerald-700" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-emerald-800">{readyOrders.length}</div>
        <div className="text-[11px] text-[#707A73] mt-1">
          Awaiting customer
        </div>
      </div>

      {/* 4. Kitchen Load */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7E5DD] shadow-xs">
        <div className="flex items-center justify-between text-[#707A73] mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Kitchen Load</span>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              maxWait >= 9 ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
            }`}
          >
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-extrabold text-[#183F35]">{kitchenStatus}</div>
        <div className="text-[11px] text-[#707A73] mt-1">
          Max station wait: ~{maxWait}m
        </div>
      </div>
    </div>
  );
}
