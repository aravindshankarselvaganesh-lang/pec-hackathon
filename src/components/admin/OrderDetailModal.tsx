'use client';

import React from 'react';
import { X, Clock, CheckCircle2, User, Phone, MapPin, ChefHat, PackageCheck, AlertCircle, MessageSquare } from 'lucide-react';
import { CustomerOrder, OrderStatus } from '@/domain/types';
import { formatCurrency, formatMinutes, formatTimeHHMM, getStatusBadgeConfig } from '@/domain/formatters';

interface OrderDetailModalProps {
  order: CustomerOrder | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus, note?: string) => Promise<void>;
}

export function OrderDetailModal({ order, onClose, onUpdateStatus }: OrderDetailModalProps) {
  if (!order) return null;

  const badge = getStatusBadgeConfig(order.status);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    let note = `Counter staff updated status to ${newStatus}`;
    if (newStatus === 'ACCEPTED') note = 'Order ticket accepted at dispatch counter';
    if (newStatus === 'PREPARING') note = 'Stations began grilling, frying & assembling';
    if (newStatus === 'READY') note = 'Plated and ready at Pickup Bay 2';
    if (newStatus === 'COLLECTED') note = 'Customer collected food tray';

    await onUpdateStatus(order.id, newStatus, note);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#202923]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E7E5DD] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-[#E7E5DD] flex items-center justify-between bg-[#FAF8F3]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-2xl text-[#183F35]">
                {order.orderToken}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E6EFE8] text-[#183F35]">
                {order.orderType === 'DINE_IN' ? 'Dine In' : 'Takeaway'}
              </span>
              {order.isWalkIn && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                  Walk-In
                </span>
              )}
            </div>
            <p className="text-xs text-[#707A73] mt-0.5">
              Order placed {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
            >
              {badge.label}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#707A73] hover:text-[#202923] hover:bg-stone-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Customer info & Timing */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F7F5EF] border border-[#E7E5DD]">
            <div className="space-y-0.5">
              <span className="text-[#707A73] block text-[11px] font-medium">Customer / Table</span>
              <span className="font-bold text-[#202923] text-sm block">{order.customerName}</span>
              {order.tableNumber && (
                <span className="text-[#8E3219] font-semibold text-[11px] block mt-0.5">
                  📍 {order.tableNumber}
                </span>
              )}
              {order.customerPhone && (
                <span className="text-[#707A73] block text-[11px]">📞 {order.customerPhone}</span>
              )}
            </div>

            <div className="border-l border-[#E7E5DD] pl-3.5 space-y-0.5">
              <span className="text-[#707A73] block text-[11px] font-medium">Pickup Deadline</span>
              <span className="font-extrabold text-[#183F35] text-sm block">
                {formatTimeHHMM(order.requestedDeadline)}
              </span>
              <span className="text-[#707A73] block text-[11px]">
                Target ready: {order.estimatedReadyTime}
              </span>
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#707A73] uppercase tracking-wider text-[11px]">
              Order Items
            </h4>
            <div className="divide-y divide-[#E7E5DD] border-y border-[#E7E5DD]">
              {order.lineItems.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#202923] text-sm">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-[#707A73] block text-[11px]">
                      Station: {item.stationId} • Prep: {formatMinutes(item.preparationTimeMinutes)}
                    </span>
                    {item.notes && (
                      <p className="text-[11px] text-[#8E3219] font-medium bg-[#FDF2EF] px-2 py-0.5 rounded border border-[#D96D4C]/15 inline-block">
                        Note: &ldquo;{item.notes}&rdquo;
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-[#183F35] text-sm whitespace-nowrap">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-1 text-sm font-extrabold text-[#183F35]">
              <span>Total Bill</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          {/* Status Change Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-[#E7E5DD]">
            <h4 className="font-bold text-[#707A73] uppercase tracking-wider text-[11px]">
              Advance Kitchen Step
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange('ACCEPTED')}
                disabled={order.status === 'ACCEPTED'}
                className="py-2.5 px-3 rounded-xl border border-[#E7E5DD] bg-white hover:bg-stone-50 font-semibold text-[#202923] active:scale-95 transition-all disabled:opacity-40"
              >
                Accept Ticket
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('PREPARING')}
                disabled={order.status === 'PREPARING'}
                className="py-2.5 px-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-semibold hover:bg-blue-100 active:scale-95 transition-all disabled:opacity-40"
              >
                Start Cooking
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('READY')}
                disabled={order.status === 'READY'}
                className="py-2.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold hover:bg-emerald-100 active:scale-95 transition-all disabled:opacity-40"
              >
                Pass to Counter
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('COLLECTED')}
                disabled={order.status === 'COLLECTED'}
                className="py-2.5 px-3 rounded-xl bg-[#183F35] text-white font-semibold hover:bg-[#245447] active:scale-95 transition-all disabled:opacity-40 shadow-xs"
              >
                Hand to Guest
              </button>
            </div>
          </div>

          {/* Audit trail */}
          <div className="space-y-1.5 pt-2 border-t border-[#E7E5DD] text-[11px] text-[#707A73]">
            <span className="font-bold text-[#202923] block">Ticket Activity Log:</span>
            {order.statusHistory.map((hist, i) => (
              <div key={i} className="flex justify-between">
                <span>• {hist.note}</span>
                <span className="text-stone-400">
                  {new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
