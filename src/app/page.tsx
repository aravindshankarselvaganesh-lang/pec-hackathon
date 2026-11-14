'use client';

import React from 'react';
import Link from 'next/link';
import {
  Utensils,
  ChefHat,
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2,
  Lock,
  ShoppingBag,
  SlidersHorizontal,
} from 'lucide-react';

export default function GatewayPage() {
  return (
    <main className="min-h-[85vh] flex flex-col justify-center max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Top Banner / Hero Title */}
      <div className="text-center space-y-4 max-w-2xl mx-auto mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E6EFE8] text-[#183F35] text-xs font-bold border border-[#183F35]/15 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-[#183F35]" />
          <span>Crossroads Food Hall • Time-Aware Platform</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-[#183F35] tracking-tight leading-tight">
          Welcome to Rush<span className="text-[#D96D4C]">Less</span>
        </h1>

        <p className="text-sm sm:text-base text-[#707A73] leading-relaxed">
          Where would you like to go? Choose whether you are ordering food as a customer or operating the food stations in the kitchen.
        </p>
      </div>

      {/* Gateway Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
        {/* Card 1: Customer Menu (Common to all, no login) */}
        <div className="bg-white rounded-3xl border-2 border-[#E7E5DD] hover:border-[#183F35] transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between shadow-card hover:shadow-xl group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-emerald-100/60 to-transparent rounded-bl-full pointer-events-none -mr-4 -mt-4"></div>

          <div className="space-y-5 relative z-10">
            {/* Header / Badges */}
            <div className="flex items-center justify-between gap-2">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF8F3] text-[#183F35] border border-[#E7E5DD] flex items-center justify-center shadow-2xs group-hover:bg-[#183F35] group-hover:text-[#E6B65C] transition-colors duration-300">
                <Utensils className="w-7 h-7" />
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Open to Everyone
              </span>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-[#183F35] tracking-tight group-hover:text-[#183F35]">
                Customer Menu & Ordering
              </h2>
              <p className="text-xs sm:text-sm text-[#707A73] leading-relaxed">
                Browse food hall counters, check live prep times with BreakFit™, order meals, and track progress without needing an account.
              </p>
            </div>

            {/* Feature bullets */}
            <ul className="space-y-2.5 text-xs text-[#202923] pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span><strong>No Sign-In Required:</strong> Instant access for all guests</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#E6B65C] flex-shrink-0" />
                <span><strong>BreakFit™ Smart Scheduling:</strong> Target pickup deadlines</span>
              </li>
              <li className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#D96D4C] flex-shrink-0" />
                <span><strong>Live Order Tracking:</strong> Real-time ticket updates</span>
              </li>
            </ul>
          </div>

          {/* Action Button */}
          <div className="pt-8 relative z-10">
            <Link
              href="/menu"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#183F35] text-white hover:bg-[#245447] text-sm font-extrabold flex items-center justify-center gap-2.5 shadow-md active:scale-98 transition-all group-hover:shadow-lg"
            >
              <span>Browse Customer Menu</span>
              <ArrowRight className="w-4 h-4 text-[#E6B65C] group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-[11px] text-center text-[#707A73] mt-2.5">
              Public menu • Full dish catalogue & combos
            </p>
          </div>
        </div>

        {/* Card 2: Demo Kitchen (Requires kitchen demo login / PIN) */}
        <div className="bg-white rounded-3xl border-2 border-[#E7E5DD] hover:border-[#D96D4C] transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between shadow-card hover:shadow-xl group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-amber-100/60 to-transparent rounded-bl-full pointer-events-none -mr-4 -mt-4"></div>

          <div className="space-y-5 relative z-10">
            {/* Header / Badges */}
            <div className="flex items-center justify-between gap-2">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF8F3] text-[#D96D4C] border border-[#E7E5DD] flex items-center justify-center shadow-2xs group-hover:bg-[#183F35] group-hover:text-[#E6B65C] transition-colors duration-300">
                <ChefHat className="w-7 h-7" />
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Demo Kitchen Login</span>
              </span>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-[#183F35] tracking-tight">
                Demo Kitchen Display (KDS)
              </h2>
              <p className="text-xs sm:text-sm text-[#707A73] leading-relaxed">
                Staff portal for cooks and counter operators. Manage live preparation queues, station workloads, and dish stock in real time.
              </p>
            </div>

            {/* Feature bullets */}
            <ul className="space-y-2.5 text-xs text-[#202923] pt-2">
              <li className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#D96D4C] flex-shrink-0" />
                <span><strong>Live Order Kanban:</strong> Accept, cook, and mark orders ready</span>
              </li>
              <li className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#183F35] flex-shrink-0" />
                <span><strong>Station Balancer:</strong> Track Fryer, Grill, and Drinks line stress</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E6B65C] flex-shrink-0" />
                <span><strong>1-Click Demo Login:</strong> PIN 1234 or instant Chef Pass</span>
              </li>
            </ul>
          </div>

          {/* Action Button */}
          <div className="pt-8 relative z-10">
            <Link
              href="/kitchen"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#FAF8F3] border-2 border-[#183F35] text-[#183F35] hover:bg-[#183F35] hover:text-white text-sm font-extrabold flex items-center justify-center gap-2.5 shadow-sm active:scale-98 transition-all"
            >
              <span>Enter Demo Kitchen Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-[11px] text-center text-[#707A73] mt-2.5">
              Staff login required • PIN: <strong className="text-[#183F35]">1234</strong> or 1-Click Demo Chef
            </p>
          </div>
        </div>
      </div>

      {/* Quick Test Demo Bar */}
      <div className="mt-10 p-4 rounded-2xl bg-[#FAF8F3] border border-[#E7E5DD] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#707A73]">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <Sparkles className="w-4 h-4 text-[#E6B65C] flex-shrink-0" />
          <span>
            Quick test shortcut: Inspect a live simulated customer order directly
          </span>
        </div>
        <Link
          href="/order/ord-rl-021"
          className="font-bold text-[#183F35] hover:underline flex items-center gap-1"
        >
          <span>View Order #RL-021</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </main>
  );
}
