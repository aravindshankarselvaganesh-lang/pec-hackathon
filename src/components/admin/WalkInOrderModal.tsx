'use client';

import React, { useState } from 'react';
import { X, Plus, Minus, Check, ShoppingBag, Utensils } from 'lucide-react';
import { useRestaurant } from '@/context/restaurant-context';
import { MenuItem, OrderType } from '@/domain/types';
import { formatCurrency, formatMinutes } from '@/domain/formatters';

interface WalkInOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalkInOrderModal({ isOpen, onClose }: WalkInOrderModalProps) {
  const { menu, createWalkInOrder } = useRestaurant();

  const [orderType, setOrderType] = useState<OrderType>('TAKEAWAY');
  const [customerName, setCustomerName] = useState('Counter Guest');
  const [tableNumber, setTableNumber] = useState('');
  const [selectedItemQuantities, setSelectedItemQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuantityChange = (itemId: string, delta: number) => {
    setSelectedItemQuantities((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const selectedItemsList = Object.entries(selectedItemQuantities).map(([itemId, qty]) => {
    const item = menu.find((m) => m.id === itemId);
    return { item, qty };
  });

  const totalEstimate = selectedItemsList.reduce((acc, curr) => {
    return acc + (curr.item ? curr.item.price * curr.qty : 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = Object.entries(selectedItemQuantities).map(([itemId, quantity]) => ({
      itemId,
      quantity,
    }));

    if (items.length === 0) {
      setError('Please add at least one item to the walk-in order.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await createWalkInOrder({
        orderType,
        customerName: customerName.trim() || 'Counter Guest',
        tableNumber: orderType === 'DINE_IN' ? tableNumber.trim() || 'Counter' : undefined,
        items,
      });
      onClose();
      // Reset form
      setSelectedItemQuantities({});
      setCustomerName('Counter Guest');
      setTableNumber('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create order';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E7E5DD] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-[#E7E5DD] flex items-center justify-between bg-[#FAF8F3]">
          <div>
            <h3 className="font-extrabold text-base text-[#183F35]">
              New Walk-In Counter Order
            </h3>
            <p className="text-xs text-[#707A73]">
              Add in-person counter order to active kitchen queues.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#707A73] hover:text-[#202923] hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Order Type Toggle */}
          <div className="bg-[#F7F5EF] p-1 rounded-xl border border-[#E7E5DD] grid grid-cols-2 gap-1 font-semibold">
            <button
              type="button"
              onClick={() => setOrderType('TAKEAWAY')}
              className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 ${
                orderType === 'TAKEAWAY' ? 'bg-white text-[#183F35] shadow-xs' : 'text-[#707A73]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Takeaway</span>
            </button>
            <button
              type="button"
              onClick={() => setOrderType('DINE_IN')}
              className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 ${
                orderType === 'DINE_IN' ? 'bg-white text-[#183F35] shadow-xs' : 'text-[#707A73]'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Dine-In</span>
            </button>
          </div>

          {/* Customer / Table info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#707A73] font-medium mb-1">
                Guest Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-[#E7E5DD] text-xs focus:outline-none focus:border-[#183F35]"
              />
            </div>
            {orderType === 'DINE_IN' && (
              <div>
                <label className="block text-[#707A73] font-medium mb-1">
                  Table Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. Table 6"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#E7E5DD] text-xs focus:outline-none focus:border-[#183F35]"
                />
              </div>
            )}
          </div>

          {/* Quick Item Picker */}
          <div className="space-y-2">
            <label className="block text-[#707A73] font-bold uppercase tracking-wider text-[11px]">
              Select Items ({menu.filter((m) => m.isAvailable).length} available)
            </label>
            <div className="max-h-48 overflow-y-auto divide-y divide-[#E7E5DD] border border-[#E7E5DD] rounded-xl">
              {menu.map((item) => {
                const qty = selectedItemQuantities[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className={`p-2 flex items-center justify-between ${
                      !item.isAvailable ? 'opacity-40 bg-stone-50' : 'hover:bg-[#FAF8F3]'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-[#202923]">{item.name}</span>
                      <span className="text-[11px] text-[#707A73] block">
                        {formatCurrency(item.price)} • {formatMinutes(item.preparationTimeMinutes)}
                      </span>
                    </div>

                    {item.isAvailable ? (
                      <div className="flex items-center gap-1.5">
                        {qty > 0 && (
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.id, -1)}
                            className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold"
                          >
                            -
                          </button>
                        )}
                        {qty > 0 && (
                          <span className="font-extrabold w-5 text-center text-[#183F35]">
                            {qty}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, 1)}
                          className="w-6 h-6 rounded bg-[#183F35] text-white hover:bg-[#245447] flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-rose-600 font-semibold">Sold Out</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
              {error}
            </div>
          )}

          {/* Footer with total and submit */}
          <div className="pt-2 border-t border-[#E7E5DD] flex items-center justify-between">
            <div>
              <span className="text-[#707A73] text-[11px] block">Order Total</span>
              <span className="font-extrabold text-sm text-[#183F35]">
                {formatCurrency(totalEstimate)}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || Object.keys(selectedItemQuantities).length === 0}
              className="px-4 py-2 rounded-xl bg-[#183F35] text-white font-semibold hover:bg-[#245447] transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add to Kitchen Queue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
