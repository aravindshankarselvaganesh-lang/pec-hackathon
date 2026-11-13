'use client';

import React, { useState } from 'react';
import {
  Clock,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  User,
  ShoppingBag,
  UtensilsCrossed,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useRestaurant } from '@/context/restaurant-context';
import { CustomerOrder, OrderStatus } from '@/domain/types';
import { formatCurrency, formatTimeHHMM, getStatusBadgeConfig, parseTimeToTodayDate } from '@/domain/formatters';
import { OrderDetailModal } from './OrderDetailModal';

export function LiveOrderQueue() {
  const { orders, updateOrderStatus } = useRestaurant();
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);

  const now = new Date();

  // Helper to determine deadline urgency
  const getDeadlineRisk = (order: CustomerOrder) => {
    if (order.status === 'COLLECTED' || order.status === 'CANCELLED') return 'NORMAL';
    const deadline = parseTimeToTodayDate(order.requestedDeadline);
    const diffMinutes = Math.round((deadline.getTime() - now.getTime()) / 60000);

    if (diffMinutes < 0) return 'OVERDUE';
    if (diffMinutes <= 8) return 'AT_RISK';
    return 'ON_TIME';
  };

  const filteredOrders = orders.filter((o) => {
    // Status Filter
    if (statusFilter === 'active') {
      if (o.status === 'COLLECTED' || o.status === 'CANCELLED') return false;
    } else if (statusFilter !== 'all' && o.status !== statusFilter) {
      return false;
    }

    // Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchToken = o.orderToken.toLowerCase().includes(q);
      const matchName = o.customerName.toLowerCase().includes(q);
      const matchItems = o.lineItems.some((l) => l.name.toLowerCase().includes(q));
      if (!matchToken && !matchName && !matchItems) return false;
    }

    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-[#E7E5DD] shadow-xs overflow-hidden space-y-4 p-5">
      {/* Queue Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-base sm:text-lg text-[#183F35]">
            Live Order Queue
          </h3>
          <p className="text-xs text-[#707A73]">
            Orders sorted by pickup deadline.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-[#707A73] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search token, name, or dish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#E7E5DD] text-xs text-[#202923] placeholder:text-[#707A73] focus:outline-none focus:border-[#183F35]"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
        {[
          { id: 'active', label: 'Active' },
          { id: 'PENDING', label: 'Incoming' },
          { id: 'ACCEPTED', label: 'Queued' },
          { id: 'PREPARING', label: 'Cooking' },
          { id: 'READY', label: 'Ready' },
          { id: 'COLLECTED', label: 'Completed' },
          { id: 'all', label: 'All' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border ${
              statusFilter === tab.id
                ? 'bg-[#183F35] text-white border-[#183F35]'
                : 'bg-white text-[#707A73] border-[#E7E5DD] hover:bg-[#F7F5EF] hover:text-[#202923]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List / Table */}
      {filteredOrders.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#707A73] space-y-1 bg-[#FAF8F3] rounded-xl border border-dashed border-[#E7E5DD]">
          <p className="font-semibold text-[#202923]">No orders in this station view</p>
          <p>Switch filter tabs above or log a walk-in guest order.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const risk = getDeadlineRisk(order);
            const badge = getStatusBadgeConfig(order.status);

            // Collect all line item notes
            const itemNotes = order.lineItems
              .filter((li) => Boolean(li.notes))
              .map((li) => `${li.name}: "${li.notes}"`);

            return (
              <div
                key={order.id}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                  risk === 'OVERDUE'
                    ? 'bg-rose-50/70 border-rose-300'
                    : risk === 'AT_RISK'
                    ? 'bg-amber-50/70 border-amber-300'
                    : 'bg-white border-[#E7E5DD] hover:border-[#183F35]/30 shadow-2xs'
                }`}
              >
                {/* Left: Token, Order Type, Customer & Items */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-base text-[#183F35]">
                      {order.orderToken}
                    </span>

                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#E6EFE8] text-[#183F35] flex items-center gap-1">
                      {order.orderType === 'DINE_IN' ? (
                        <>
                          <UtensilsCrossed className="w-2.5 h-2.5" />
                          <span>Dine-In Table</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-2.5 h-2.5" />
                          <span>Takeaway Parcel</span>
                        </>
                      )}
                    </span>

                    {order.isWalkIn && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                        Counter Walk-In
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="text-xs text-[#202923] space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[#183F35]">{order.customerName}</span>
                      {order.tableNumber && (
                        <span className="text-[#8E3219] font-medium bg-[#FDF2EF] px-1.5 py-0.5 rounded border border-[#D96D4C]/20 text-[11px]">
                          📍 {order.tableNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-[#707A73]">
                      {order.lineItems.map((li) => `${li.quantity}x ${li.name}`).join(' • ')}
                    </p>
                  </div>

                  {/* Customer Preparation Notes Highlight */}
                  {itemNotes.length > 0 && (
                    <div className="flex items-start gap-1.5 text-[11px] text-[#8E3219] bg-[#FAF8F3] border border-[#E7E5DD] px-2.5 py-1.5 rounded-lg max-w-xl">
                      <MessageSquare className="w-3.5 h-3.5 text-[#D96D4C] flex-shrink-0 mt-0.5" />
                      <span className="font-medium">
                        Kitchen Note: {itemNotes.join('; ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Middle: Deadline & Timing Risk Indicator */}
                <div className="flex md:flex-col items-end justify-between md:justify-center gap-1 text-xs min-w-[130px]">
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end font-extrabold text-[#183F35]">
                      <Clock className="w-3.5 h-3.5 text-[#E6B65C]" />
                      <span>Break {formatTimeHHMM(order.requestedDeadline)}</span>
                    </div>
                    <span className="text-[11px] text-[#707A73] block">
                      Target ready: {order.estimatedReadyTime}
                    </span>
                  </div>

                  {risk === 'OVERDUE' ? (
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px] flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      Break Miss Risk
                    </span>
                  ) : risk === 'AT_RISK' ? (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Break Ending Soon
                    </span>
                  ) : null}
                </div>

                {/* Right: Quick Action Controls */}
                <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-[#E7E5DD]">
                  {order.status === 'PENDING' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ACCEPTED', 'Counter accepted ticket')}
                      className="px-3 py-1.5 rounded-xl bg-[#183F35] text-white text-xs font-semibold hover:bg-[#245447] active:scale-95 transition-all shadow-xs"
                    >
                      Accept Ticket
                    </button>
                  )}

                  {order.status === 'ACCEPTED' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'PREPARING', 'Station chef started grilling & cooking')}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 text-xs font-semibold hover:bg-blue-100 active:scale-95 transition-all"
                    >
                      Start Cooking
                    </button>
                  )}

                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'READY', 'Order plated fresh and passed to counter')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 active:scale-95 transition-all shadow-xs"
                    >
                      Pass to Counter
                    </button>
                  )}

                  {order.status === 'READY' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'COLLECTED', 'Handed over to dining guest')}
                      className="px-3 py-1.5 rounded-xl bg-[#202923] text-white text-xs font-semibold hover:bg-black active:scale-95 transition-all shadow-xs"
                    >
                      Hand to Guest
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="p-2 rounded-xl border border-[#E7E5DD] bg-white text-[#707A73] hover:text-[#202923] hover:bg-[#F7F5EF] active:scale-95 transition-all"
                    title="View full order ticket"
                    aria-label="View order ticket"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for detail view */}
      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={async (id, st, note) => {
          await updateOrderStatus(id, st, note);
          setSelectedOrder(null);
        }}
      />
    </div>
  );
}
