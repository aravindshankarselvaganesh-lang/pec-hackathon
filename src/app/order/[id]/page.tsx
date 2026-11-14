'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  ArrowLeft,
  ShoppingBag,
  ChefHat,
  PackageCheck,
  AlertCircle,
  ExternalLink,
  Sparkles,
  BellRing,
} from 'lucide-react';
import { useRestaurant } from '@/context/restaurant-context';
import { CustomerOrder, OrderStatus } from '@/domain/types';
import { formatCurrency, formatMinutes, formatTimeHHMM, getStatusBadgeConfig } from '@/domain/formatters';

const STATUS_STEPS: { status: OrderStatus; label: string; humanDesc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  {
    status: 'ACCEPTED',
    label: 'Accepted',
    humanDesc: 'Order confirmed',
    icon: ShoppingBag,
  },
  {
    status: 'PREPARING',
    label: 'Cooking',
    humanDesc: 'Preparing your food',
    icon: ChefHat,
  },
  {
    status: 'READY',
    label: 'Ready',
    humanDesc: 'Ready for pickup',
    icon: PackageCheck,
  },
  {
    status: 'COLLECTED',
    label: 'Collected',
    humanDesc: 'Order completed',
    icon: CheckCircle2,
  },
];

export const dynamic = 'force-dynamic';

export default function OrderStatusPage() {
  const params = useParams();
  const rawId = params?.id;
  const orderId = Array.isArray(rawId) ? rawId[0] : (rawId ?? '');
  const { orders, updateOrderStatus, getOrder, isLoading } = useRestaurant();

  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isSearching, setIsSearching] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    if (!orderId) {
      setIsSearching(false);
      setNotFound(true);
      return;
    }

    const checkOrder = async () => {
      // 1. Check if already present in context orders
      const found = orders.find(
        (o) => o.id === orderId || o.orderToken.toLowerCase() === orderId.toLowerCase()
      );
      if (found) {
        if (!isCancelled) {
          setOrder(found);
          setNotFound(false);
          setIsSearching(false);
        }
        return;
      }

      // 2. If not in memory yet, query API/Supabase directly
      try {
        const fetched = await getOrder(orderId);
        if (!isCancelled) {
          if (fetched) {
            setOrder(fetched);
            setNotFound(false);
          } else if (!isLoading) {
            setNotFound(true);
          }
          setIsSearching(false);
        }
      } catch {
        if (!isCancelled) {
          setNotFound(true);
          setIsSearching(false);
        }
      }
    };

    checkOrder();

    return () => {
      isCancelled = true;
    };
  }, [orderId, orders, getOrder, isLoading]);

  // Loading state while resolving order
  if (isSearching || (isLoading && !order)) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#E6EFE8] text-[#183F35] flex items-center justify-center mx-auto shadow-xs animate-pulse">
          <Clock className="w-7 h-7 text-[#183F35]" />
        </div>
        <h2 className="text-xl font-extrabold text-[#183F35]">
          Locating Order #{orderId}...
        </h2>
        <p className="text-xs text-[#707A73]">
          Checking live kitchen tickets and order status.
        </p>
      </main>
    );
  }

  // Graceful empty / not found state
  if (notFound || !order) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#E6EFE8] text-[#183F35] flex items-center justify-center mx-auto shadow-xs">
          <AlertCircle className="w-8 h-8 text-[#D96D4C]" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#183F35]">Demo Order Token Not Found</h2>
        <p className="text-sm text-[#707A73] max-w-md mx-auto leading-relaxed">
          The requested demo order token &ldquo;{orderId}&rdquo; was not found in active session storage. In this frontend prototype, orders reside in your browser session.
        </p>
        <div className="pt-4 flex items-center justify-center gap-3">
          <Link
            href="/menu"
            className="px-5 py-2.5 rounded-xl bg-[#183F35] text-white text-xs font-semibold hover:bg-[#245447] transition-all active:scale-95 shadow-xs"
          >
            Back to Food Hall Menu
          </Link>
          <Link
            href="/kitchen"
            className="px-5 py-2.5 rounded-xl border border-[#E7E5DD] bg-white text-xs font-semibold text-[#202923] hover:bg-[#F7F5EF] transition-all active:scale-95"
          >
            View Kitchen Live Queue
          </Link>
        </div>
      </main>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.status === order.status);
  const badge = getStatusBadgeConfig(order.status);

  const simulateNextStatus = async () => {
    let nextStatus: OrderStatus = 'ACCEPTED';
    let note = 'Kitchen advanced order status';

    if (order.status === 'PENDING') {
      nextStatus = 'ACCEPTED';
      note = 'Counter staff printed order ticket';
    } else if (order.status === 'ACCEPTED') {
      nextStatus = 'PREPARING';
      note = 'Station chef started grilling & assembling';
    } else if (order.status === 'PREPARING') {
      nextStatus = 'READY';
      note = 'Tray plated and bell rung for collection';
    } else if (order.status === 'READY') {
      nextStatus = 'COLLECTED';
      note = 'Handed over to customer at pickup counter';
    }

    await updateOrderStatus(order.id, nextStatus, note);
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Back button & Kitchen Shortcut */}
      <div className="flex items-center justify-between text-xs">
        <Link
          href="/menu"
          className="inline-flex items-center gap-1.5 text-[#183F35] font-bold hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Food Hall Menu</span>
        </Link>

        <Link
          href="/kitchen"
          className="inline-flex items-center gap-1.5 text-[#707A73] hover:text-[#183F35] font-medium"
        >
          <span>Inspect on Kitchen Dashboard</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Order Status Card */}
      <div className="bg-white rounded-2xl border border-[#E7E5DD] p-6 sm:p-8 shadow-card space-y-6">
        {/* Token Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7E5DD]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-[#707A73]">
                Order Token
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E6EFE8] text-[#183F35]">
                {order.orderType === 'DINE_IN' ? 'Dine In' : 'Takeaway'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#183F35] tracking-tight mt-1">
              {order.orderToken}
            </h1>
            <p className="text-xs text-[#707A73] mt-1.5 flex flex-wrap items-center gap-2">
              <span>Name: <strong className="text-[#202923]">{order.customerName}</strong></span>
              {order.tableNumber && (
                <>
                  <span>•</span>
                  <span className="text-[#183F35] font-semibold bg-[#FAF8F3] px-2 py-0.5 rounded border border-[#E7E5DD]">
                    📍 {order.tableNumber}
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:items-end">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
            >
              {badge.label}
            </span>
            <span className="text-[11px] text-[#707A73] mt-1.5">
              Pickup Deadline: <strong className="text-[#183F35]">{formatTimeHHMM(order.requestedDeadline)}</strong>
            </span>
          </div>
        </div>

        {/* Step Progression Timeline with Human Milestones */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#707A73] uppercase tracking-wider">
              Order Status
            </h3>
            <span className="text-[11px] text-[#707A73]">
              Estimated ready: <strong className="text-[#183F35]">{order.estimatedReadyTime}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {STATUS_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isPastOrCurrent = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div
                  key={step.status}
                  className={`p-3 rounded-xl border flex flex-col items-center space-y-1.5 transition-all ${
                    isCurrent
                      ? 'bg-[#FAF8F3] border-[#183F35]/30 shadow-xs'
                      : isPastOrCurrent
                      ? 'bg-emerald-50/50 border-emerald-200/60'
                      : 'bg-stone-50/50 border-[#E7E5DD] opacity-60'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-[#183F35] text-[#E6B65C] ring-4 ring-[#E6EFE8]'
                        : isPastOrCurrent
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-200 text-stone-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-xs font-bold leading-tight ${
                      isCurrent
                        ? 'text-[#183F35]'
                        : isPastOrCurrent
                        ? 'text-stone-800'
                        : 'text-stone-400'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="text-[10px] text-[#707A73] leading-tight">
                    {step.humanDesc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Collection Guidance Alert */}
        <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E7E5DD] flex items-start gap-3">
          <BellRing className="w-5 h-5 text-[#D96D4C] flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-[#183F35]">Pickup Instructions:</h4>
            <p className="text-[#707A73] leading-relaxed">
              When status shows <strong className="text-[#202923]">Ready</strong>, collect your order at <strong className="text-[#183F35]">Pickup Bay 2</strong> with token <strong className="text-[#183F35]">{order.orderToken}</strong>.
            </p>
          </div>
        </div>

        {/* Order Items Breakdown with Customer Notes */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-[#707A73] uppercase tracking-wider">
            Order Items ({order.lineItems.length})
          </h3>

          <div className="divide-y divide-[#E7E5DD] border-y border-[#E7E5DD] text-xs">
            {order.lineItems.map((line, idx) => (
              <div key={idx} className="py-3 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-[#202923] text-sm">
                    {line.quantity}x {line.name}
                  </span>
                  <div className="text-[#707A73] text-[11px] flex items-center gap-1.5">
                    <span>Est. cook: {formatMinutes(line.preparationTimeMinutes)}</span>
                  </div>
                  {line.notes && (
                    <p className="text-[11px] text-[#183F35] font-medium bg-[#E6EFE8] px-2 py-0.5 rounded inline-block mt-1">
                      Chef note: &ldquo;{line.notes}&rdquo;
                    </p>
                  )}
                </div>
                <span className="font-extrabold text-[#183F35] text-sm whitespace-nowrap">
                  {formatCurrency(line.price * line.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          <div className="space-y-1 pt-1 text-xs text-[#707A73]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-[#202923]">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (5%)</span>
              <span className="font-semibold text-[#202923]">{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#E7E5DD] text-sm font-extrabold text-[#183F35]">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Audit / Status History */}
        <div className="pt-2 border-t border-[#E7E5DD] space-y-2">
          <h4 className="text-[11px] font-bold text-[#707A73] uppercase tracking-wider">
            Status History
          </h4>
          <div className="space-y-1.5 text-[11px]">
            {order.statusHistory.map((hist, idx) => (
              <div key={idx} className="flex items-start justify-between text-[#707A73]">
                <span>• {hist.note}</span>
                <span className="text-[10px] text-stone-400 whitespace-nowrap ml-2">
                  {formatTimeHHMM(hist.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Controller: Step to next status */}
        {order.status !== 'COLLECTED' && (
          <div className="p-4 rounded-xl bg-[#E6EFE8] border border-[#183F35]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E6B65C]" />
              <span className="text-[#183F35] font-semibold">
                Simulate: Advance order status
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                void simulateNextStatus();
              }}
              className="px-4 py-2 rounded-xl bg-[#183F35] text-white font-semibold hover:bg-[#245447] transition-all active:scale-95 text-xs shadow-xs"
              aria-label="Advance order status"
            >
              Advance Status
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
