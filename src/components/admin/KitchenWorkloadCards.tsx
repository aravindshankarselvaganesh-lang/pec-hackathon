'use client';

import React from 'react';
import { ChefHat, Flame, Coffee, Sparkles } from 'lucide-react';
import { useRestaurant } from '@/context/restaurant-context';
import { formatMinutes } from '@/domain/formatters';

export function KitchenWorkloadCards() {
  const { kitchenSnapshots } = useRestaurant();

  const getStationIcon = (id: string) => {
    switch (id) {
      case 'quick-bites':
        return ChefHat;
      case 'hot-kitchen':
        return Flame;
      case 'fryer':
        return Flame;
      case 'drinks':
        return Coffee;
      default:
        return ChefHat;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PEAK':
        return { label: 'Rush', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'BUSY':
        return { label: 'Busy', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      default:
        return { label: 'Calm', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E7E5DD] p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-extrabold text-sm sm:text-base text-[#183F35]">
            Station Queues
          </h3>
          <p className="text-xs text-[#707A73]">
            Live workload and queue delay per cooking counter.
          </p>
        </div>
        <span className="text-[10px] uppercase font-bold text-[#707A73] bg-[#F7F5EF] px-2.5 py-1 rounded-md border border-[#E7E5DD] self-start sm:self-auto">
          Live Status
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {kitchenSnapshots.map((station) => {
          const Icon = getStationIcon(station.stationId);
          const badge = getStatusBadge(station.status);
          const loadPercentage = Math.min(100, Math.round((station.activeLoad / station.totalCapacity) * 100));

          return (
            <div
              key={station.stationId}
              className="p-3.5 rounded-xl border border-[#E7E5DD] bg-[#FAF8F3] flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#E7E5DD] text-[#183F35] flex items-center justify-center shadow-2xs">
                    <Icon className="w-4 h-4 text-[#183F35]" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bg}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <h4 className="font-bold text-xs text-[#202923] pt-1">
                  {station.stationName}
                </h4>

                <div className="flex items-baseline justify-between text-xs text-[#707A73]">
                  <span>Capacity:</span>
                  <span className="font-extrabold text-[#183F35]">
                    {station.activeLoad} / {station.totalCapacity} slots
                  </span>
                </div>

                {/* Capacity Progress Bar */}
                <div className="w-full bg-[#E7E5DD] rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      station.status === 'PEAK'
                        ? 'bg-[#D96D4C]'
                        : station.status === 'BUSY'
                        ? 'bg-[#E6B65C]'
                        : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.max(15, loadPercentage)}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#E7E5DD] flex items-center justify-between text-[11px] text-[#707A73]">
                <span>Wait time:</span>
                <span className="font-extrabold text-[#202923]">
                  ~{formatMinutes(station.currentWaitMinutes)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
