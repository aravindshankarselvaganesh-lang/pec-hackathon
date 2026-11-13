'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  UtensilsCrossed,
} from 'lucide-react';
import { useRestaurant } from '@/context/restaurant-context';
import { formatCurrency, formatTimeHHMM } from '@/domain/formatters';

export function BreakFitPanel() {
  const {
    cart,
    customerDeadline,
    breakFitResult,
    applyAlternativeSuggestion,
    setCustomerDeadline,
  } = useRestaurant();

  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [keptAnyway, setKeptAnyway] = useState(false);

  if (cart.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#DDD8CB] p-5 text-center space-y-2 shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-[#E6EFE8] text-[#183F35] flex items-center justify-center mx-auto shadow-xs">
          <UtensilsCrossed className="w-5 h-5 text-[#183F35]" />
        </div>
        <h4 className="font-extrabold text-sm sm:text-base text-[#183F35]">Your cart is empty</h4>
        <p className="text-xs text-[#707A73] max-w-sm mx-auto">
          Add items to check live kitchen wait times and pickup feasibility.
        </p>
      </div>
    );
  }

  const {
    feasibility,
    estimatedReadyTime,
    totalEstimatedMinutes,
    bufferMinutes,
    bottleneckStation,
    explanation,
    alternativeSuggestions,
    suggestedLaterDeadline,
  } = breakFitResult;

  const isFeasible = feasibility === 'FEASIBLE';
  const isRisky = feasibility === 'RISKY';
  const isInfeasible = feasibility === 'INFEASIBLE';

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
        isFeasible
          ? 'bg-emerald-50/80 border-emerald-300'
          : isRisky
          ? 'bg-amber-50/80 border-amber-300'
          : 'bg-[#FDF2EF] border-[#D96D4C]/40'
      }`}
    >
      <div className="p-4 sm:p-5 space-y-4">
        {/* Main Feasibility Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${
                isFeasible
                  ? 'bg-emerald-700 text-white'
                  : isRisky
                  ? 'bg-amber-600 text-white'
                  : 'bg-[#D96D4C] text-white'
              }`}
            >
              {isFeasible ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : isRisky ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-extrabold text-sm sm:text-base ${
                    isFeasible
                      ? 'text-emerald-950'
                      : isRisky
                      ? 'text-amber-950'
                      : 'text-[#8E3219]'
                  }`}
                >
                  {isFeasible
                    ? 'Ready on time'
                    : isRisky
                    ? 'Tight schedule'
                    : 'May be delayed'}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/80 text-[#183F35] border border-black/10">
                  Live Check
                </span>
              </div>
              <p className="text-xs text-[#202923] mt-1 max-w-xl">
                {explanation}
              </p>
            </div>
          </div>

          {/* Time Comparison Badges */}
          <div className="flex items-center gap-3 sm:self-center bg-white/95 px-3.5 py-2 rounded-xl border border-black/10 text-xs shadow-xs">
            <div>
              <span className="text-[10px] text-[#707A73] block uppercase tracking-wider font-semibold">
                Ready by
              </span>
              <span className="font-extrabold text-[#183F35] text-sm">{estimatedReadyTime}</span>
            </div>
            <span className="text-stone-300">|</span>
            <div>
              <span className="text-[10px] text-[#707A73] block uppercase tracking-wider font-semibold">
                Your Deadline
              </span>
              <span className="font-extrabold text-[#202923] text-sm">{formatTimeHHMM(customerDeadline)}</span>
            </div>
          </div>
        </div>

        {/* Station Breakdown details toggler */}
        <div className="pt-2 border-t border-black/5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#707A73]">
              Est. prep: <strong className="text-[#183F35] font-bold">{totalEstimatedMinutes} min</strong>
              {bottleneckStation && ` • Station: ${bottleneckStation.stationName}`}
            </span>
            <button
              type="button"
              onClick={() => setIsExplainerOpen(!isExplainerOpen)}
              aria-expanded={isExplainerOpen}
              className="text-[#183F35] font-bold flex items-center gap-1 hover:underline ml-2"
            >
              <span>{isExplainerOpen ? 'Hide details' : 'How it works'}</span>
              {isExplainerOpen ? <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" /> : <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />}
            </button>
          </div>

          {isExplainerOpen && (
            <div className="mt-3 p-3.5 rounded-xl bg-white/90 border border-black/10 text-xs text-[#202923] space-y-1">
              <p className="font-bold text-[#183F35]">
                Kitchen calculation:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[#707A73]">
                <li>
                  Current queue: <strong>{bottleneckStation?.stationName}</strong> (~{bottleneckStation?.stationWaitMinutes}m wait).
                </li>
                <li>
                  Longest prep item sets your cooking pace.
                </li>
                <li>
                  Includes {bufferMinutes}m packaging buffer.
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Infeasible Suggestion Section */}
        {isInfeasible && !keptAnyway && alternativeSuggestions.length > 0 && (
          <div className="pt-3 border-t border-[#D96D4C]/25 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#8E3219]">
              <Sparkles className="w-4 h-4 text-[#E6B65C]" />
              <span>Faster Alternative:</span>
            </div>

            {alternativeSuggestions.map((suggestion, idx) => {
              const priceDeltaText =
                suggestion.priceDifference === 0
                  ? 'Same price'
                  : suggestion.priceDifference > 0
                  ? `+${formatCurrency(suggestion.priceDifference)}`
                  : `-${formatCurrency(Math.abs(suggestion.priceDifference))}`;

              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-3 border border-[#D96D4C]/35 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="line-through text-[#707A73]">
                        {suggestion.originalItem.name}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#D96D4C]" />
                      <span className="font-extrabold text-[#183F35]">
                        {suggestion.suggestedItem.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        ⚡ ~{suggestion.timeSavedMinutes}m faster
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-stone-100 text-stone-700">
                        {priceDeltaText}
                      </span>
                    </div>
                    <p className="text-xs text-[#707A73]">
                      {suggestion.reason}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => applyAlternativeSuggestion(suggestion)}
                    aria-label={`Swap ${suggestion.originalItem.name} for ${suggestion.suggestedItem.name}`}
                    className="px-4 py-2 rounded-xl bg-[#183F35] text-white font-bold text-xs hover:bg-[#245447] active:scale-95 transition-all shadow-xs self-start sm:self-center whitespace-nowrap"
                  >
                    Swap Item
                  </button>
                </div>
              );
            })}

            {/* Alternative Choices */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
              {suggestedLaterDeadline && (
                <button
                  type="button"
                  onClick={() => setCustomerDeadline(suggestedLaterDeadline)}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-[#DDD8CB] text-[#183F35] font-semibold hover:bg-[#FAF8F3] flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                >
                  <CalendarCheck className="w-3.5 h-3.5 text-[#E6B65C]" />
                  <span>Pick up later ({formatTimeHHMM(suggestedLaterDeadline)})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setKeptAnyway(true)}
                className="px-3 py-1.5 rounded-xl text-[#707A73] hover:text-[#202923] hover:bg-black/5 font-semibold transition-colors"
              >
                Keep current items
              </button>
            </div>
          </div>
        )}

        {/* If user kept anyway */}
        {isInfeasible && keptAnyway && (
          <div className="pt-2 text-xs text-[#707A73] flex items-center justify-between">
            <span>Kept original items. Estimated ready at {estimatedReadyTime}.</span>
            <button
              type="button"
              onClick={() => setKeptAnyway(false)}
              className="text-[#183F35] underline font-bold"
            >
              View swap suggestion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
