'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChefHat, Lock, ArrowRight, Sparkles, Utensils, ShieldCheck, KeyRound } from 'lucide-react';

interface KitchenAuthWrapperProps {
  children: React.ReactNode;
}

const STORAGE_KEY = 'rushless_kitchen_demo_auth';
const DEMO_PIN = '1234';

export function KitchenAuthWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Check if previously logged in as demo kitchen staff
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'true') {
        setIsAuthenticated(true);
      }
    } catch {
      // ignore storage errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoginWithPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === DEMO_PIN || pin.trim() === 'admin') {
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch {}
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid PIN code. Use demo PIN: 1234');
    }
  };

  const handleQuickDemoLogin = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
    setIsAuthenticated(true);
    setError('');
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setIsAuthenticated(false);
    setPin('');
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#183F35] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="max-w-lg mx-auto px-4 py-12 sm:py-20 space-y-6">
        <div className="bg-white rounded-3xl border border-[#E7E5DD] shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-[#183F35] text-[#E6B65C] flex items-center justify-center mx-auto shadow-md">
              <ChefHat className="w-8 h-8 text-[#E6B65C]" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6EFE8] text-[#183F35] text-xs font-bold uppercase tracking-wider mt-2">
              <Lock className="w-3.5 h-3.5 text-[#183F35]" />
              <span>Demo Kitchen Portal</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#183F35] tracking-tight">
              Kitchen Display Access
            </h1>
            <p className="text-xs sm:text-sm text-[#707A73] max-w-sm mx-auto">
              Simulated kitchen pass for cooks and counter staff to manage live preparation tickets.
            </p>
          </div>

          {/* Quick 1-Click Demo Login (Primary) */}
          <div className="bg-[#FAF8F3] rounded-2xl border border-[#E7E5DD] p-4 text-center space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#183F35]">
              <Sparkles className="w-4 h-4 text-[#D96D4C]" />
              <span>Quick Demo Access</span>
            </div>
            <p className="text-xs text-[#707A73]">
              Instantly open the live kitchen station queues and orders without typing credentials.
            </p>
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="w-full py-3 rounded-xl bg-[#183F35] text-white hover:bg-[#245447] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
            >
              <ChefHat className="w-4 h-4 text-[#E6B65C]" />
              <span>Enter as Demo Head Chef</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#E7E5DD]"></div>
            <span className="flex-shrink mx-4 text-xs font-bold text-[#707A73] uppercase">
              Or Enter Staff PIN
            </span>
            <div className="flex-grow border-t border-[#E7E5DD]"></div>
          </div>

          {/* PIN Form */}
          <form onSubmit={handleLoginWithPin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="staff-pin" className="block text-xs font-bold text-[#202923]">
                Kitchen Staff PIN <span className="text-[#707A73] font-normal">(Demo PIN: 1234)</span>
              </label>
              <div className="relative">
                <input
                  id="staff-pin"
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter 1234"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E7E5DD] bg-white text-sm font-bold text-[#183F35] tracking-widest focus:outline-none focus:ring-2 focus:ring-[#183F35]/20 focus:border-[#183F35]"
                />
                <KeyRound className="w-4 h-4 text-[#707A73] absolute right-3.5 top-3" />
              </div>
              {error && <p className="text-xs text-[#D96D4C] font-semibold">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-white border border-[#183F35] text-[#183F35] hover:bg-[#E6EFE8] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Unlock Kitchen Station</span>
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="pt-2 border-t border-[#E7E5DD] text-center">
            <Link
              href="/menu"
              className="text-xs font-bold text-[#707A73] hover:text-[#183F35] inline-flex items-center gap-1.5 transition-colors"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Back to Customer Menu</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div>
      {/* Staff Logged In Bar */}
      <div className="bg-[#183F35] text-white px-4 py-1.5 text-xs flex items-center justify-between border-b border-[#245447]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-[#E6EFE8]">
            Demo Kitchen Staff Terminal • Connected Live
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/menu"
            className="text-[11px] text-[#E6EFE8] hover:text-white underline underline-offset-2 transition-colors"
          >
            Customer Menu
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[11px] text-[#E6B65C] font-bold transition-all"
          >
            Exit Staff Portal
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
