'use client';

import React, { useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { useRestaurant } from '@/context/restaurant-context';
import { formatTime24H, formatTimeHHMM, parseTimeToTodayDate } from '@/domain/formatters';

export function DeadlineSelector() {
  const { customerDeadline, setCustomerDeadline, breakFitResult, currentTime, isHydrated } = useRestaurant();
  const [customError, setCustomError] = useState<string | null>(null);

  const setPresetMinutes = (minutesFromNow: number) => {
    const target = new Date(currentTime.getTime() + minutesFromNow * 60000);
    const time24 = formatTime24H(target);
    setCustomerDeadline(time24);
    setCustomError(null);
  };

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;

    const parsed = parseTimeToTodayDate(val, currentTime);

    if (parsed.getTime() <= currentTime.getTime()) {
      setCustomError('That time has already passed! Pick a time at least a few minutes from now.');
    } else {
      setCustomError(null);
    }
    setCustomerDeadline(val);
  };

  const getActivePreset = (): number | null => {
    if (!isHydrated) return 15;
    const currentTarget = parseTimeToTodayDate(customerDeadline, currentTime);
    const diffMin = Math.round((currentTarget.getTime() - currentTime.getTime()) / 60000);
    if (diffMin >= 9 && diffMin <= 11) return 10;
    if (diffMin >= 14 && diffMin <= 16) return 15;
    if (diffMin >= 19 && diffMin <= 21) return 20;
    return null;
  };

  const activePreset = getActivePreset();

  return (
    <section id="deadline-selector" className="bg-[#FAF8F3] border-b border-[#E7E5DD] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-[#DDD8CB] p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Human Title & Conversational Prompt */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#E6EFE8] text-[#183F35] flex items-center justify-center shadow-xs">
                  <Clock className="w-4 h-4 text-[#183F35]" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#183F35]">
                  When do you need your food?
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#707A73]">
                Select your pickup time to check live kitchen wait times.
              </p>
            </div>

            {/* Selected Deadline Badge */}
            <div className="flex items-center gap-2.5 bg-[#FAF8F3] px-4 py-2.5 rounded-xl border border-[#DDD8CB] self-start md:self-auto shadow-xs">
              <span className="text-xs text-[#707A73] font-medium">Pickup Time:</span>
              <span className="text-sm font-extrabold text-[#183F35]">
                {formatTimeHHMM(customerDeadline)}
              </span>
            </div>
          </div>

          {/* Quick Choice Buttons + Accessible Time Picker */}
          <div className="mt-4 pt-4 border-t border-[#F0ECE2] flex flex-wrap items-center gap-2.5 sm:gap-3">
            <span className="text-xs font-bold text-[#202923] mr-1">Quick:</span>

            <button
              type="button"
              onClick={() => setPresetMinutes(10)}
              aria-pressed={activePreset === 10}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 border active:scale-95 ${
                activePreset === 10
                  ? 'bg-[#183F35] text-white border-[#183F35] shadow-xs'
                  : 'bg-white text-[#202923] border-[#DDD8CB] hover:bg-[#FAF8F3]'
              }`}
            >
              10 mins
            </button>

            <button
              type="button"
              onClick={() => setPresetMinutes(15)}
              aria-pressed={activePreset === 15}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 border active:scale-95 ${
                activePreset === 15
                  ? 'bg-[#183F35] text-white border-[#183F35] shadow-xs'
                  : 'bg-white text-[#202923] border-[#DDD8CB] hover:bg-[#FAF8F3]'
              }`}
            >
              15 mins (Recommended)
            </button>

            <button
              type="button"
              onClick={() => setPresetMinutes(20)}
              aria-pressed={activePreset === 20}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 border active:scale-95 ${
                activePreset === 20
                  ? 'bg-[#183F35] text-white border-[#183F35] shadow-xs'
                  : 'bg-white text-[#202923] border-[#DDD8CB] hover:bg-[#FAF8F3]'
              }`}
            >
              20 mins
            </button>

            {/* Custom Time Input */}
            <div className="flex items-center gap-1.5 ml-auto sm:ml-2">
              <label htmlFor="custom-time-input" className="text-xs text-[#707A73] font-medium">
                Custom:
              </label>
              <div className="relative">
                <input
                  id="custom-time-input"
                  type="time"
                  value={customerDeadline}
                  onChange={handleCustomTimeChange}
                  className="px-3 py-1.5 rounded-xl border border-[#DDD8CB] text-xs font-bold text-[#183F35] bg-white focus:outline-none focus:ring-2 focus:ring-[#183F35]"
                />
              </div>
            </div>
          </div>

          {/* Validation Warning */}
          {(customError || breakFitResult.feasibility === 'INVALID_DEADLINE') && (
            <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>
                {customError || 'That time is already in the past! Pick a time at least a few minutes ahead so our cooks have time to prepare your food.'}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
