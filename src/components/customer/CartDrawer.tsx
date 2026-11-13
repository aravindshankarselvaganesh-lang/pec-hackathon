'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Plus,
  Minus,
  Trash2,
  UtensilsCrossed,
  Clock,
  ArrowRight,
  MessageSquare,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import { useRestaurant } from '@/context/restaurant-context';
import { formatCurrency, formatMinutes, formatTimeHHMM } from '@/domain/formatters';

const POPULAR_TABLES = [
  'Courtyard Table 4',
  'Window Bar 2',
  'Library Corner Booth 7',
  'Fountain Bench 1',
];

export function CartDrawer() {
  const router = useRouter();
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    updateItemNotes,
    removeFromCart,
    orderType,
    setOrderType,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    tableNumber,
    setTableNumber,
    customerDeadline,
    breakFitResult,
    placeCustomerOrder,
  } = useRestaurant();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeNoteItemId, setActiveNoteItemId] = useState<string | null>(null);

  // Close on Escape key press
  React.useEffect(() => {
    if (!isCartOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  const subtotal = cart.reduce((acc, curr) => acc + curr.menuItem.price * curr.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  const handleCheckout = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (cart.length === 0) return;

    if (!customerName.trim()) {
      setFormError('Please let us know your name so the kitchen can call your token.');
      return;
    }

    if (orderType === 'DINE_IN' && !tableNumber.trim()) {
      setFormError('Please select or write your table nickname so we know where you are sitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      const createdOrder = await placeCustomerOrder();
      setIsCartOpen(false);
      router.push(`/order/${createdOrder.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not place demo order. Please try again.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Soft Dimmed Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        role="presentation"
        aria-hidden="true"
        className="fixed inset-0 bg-[#202923]/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Shopping Cart Drawer"
          className="w-screen max-w-md bg-[#FAF8F3] shadow-2xl flex flex-col justify-between border-l border-[#E7E5DD] animate-in slide-in-from-right duration-300"
        >
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 bg-white border-b border-[#E7E5DD] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#183F35] text-white flex items-center justify-center shadow-xs">
                <UtensilsCrossed className="w-4 h-4 text-[#E6B65C]" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#183F35]">Your Cart</h3>
                <span className="text-xs text-[#707A73]">
                  {cart.length === 0
                    ? 'Empty'
                    : `${cart.reduce((sum, i) => sum + i.quantity, 0)} item${
                        cart.length === 1 ? '' : 's'
                      }`}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl text-[#707A73] hover:text-[#202923] hover:bg-[#F7F5EF] transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Dining Mode Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#707A73] uppercase tracking-wider block">
                Order Type
              </label>
              <div className="bg-white p-1 rounded-xl border border-[#E7E5DD] grid grid-cols-2 gap-1 text-xs font-semibold shadow-2xs">
                <button
                  type="button"
                  onClick={() => setOrderType('TAKEAWAY')}
                  className={`py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    orderType === 'TAKEAWAY'
                      ? 'bg-[#183F35] text-white shadow-xs'
                      : 'text-[#707A73] hover:text-[#202923] hover:bg-[#F7F5EF]'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Takeaway</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderType('DINE_IN')}
                  className={`py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    orderType === 'DINE_IN'
                      ? 'bg-[#183F35] text-white shadow-xs'
                      : 'text-[#707A73] hover:text-[#202923] hover:bg-[#F7F5EF]'
                  }`}
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Dine In</span>
                </button>
              </div>
            </div>

            {/* Target Deadline Snapshot Banner */}
            <div className="bg-[#E6EFE8] rounded-xl p-3 border border-[#183F35]/15 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#183F35]" />
                <span className="text-[#183F35] font-semibold">Pickup Time:</span>
              </div>
              <span className="font-extrabold text-sm text-[#183F35]">
                {formatTimeHHMM(customerDeadline)}
              </span>
            </div>

            {/* Line Items List */}
            {cart.length === 0 ? (
              <div className="py-14 text-center space-y-2 bg-white rounded-2xl border border-dashed border-[#E7E5DD] p-6">
                <UtensilsCrossed className="w-10 h-10 text-stone-300 mx-auto" />
                <p className="text-sm font-bold text-[#202923]">Your cart is empty</p>
                <p className="text-xs text-[#707A73] max-w-xs mx-auto">
                  Add items from the menu to check live kitchen wait times.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#707A73] uppercase tracking-wider">
                    Items ({cart.length})
                  </h4>
                </div>

                {cart.map((ci) => {
                  const hasNote = Boolean(ci.notes);
                  const isNoteOpen = activeNoteItemId === ci.menuItem.id;

                  return (
                    <div
                      key={ci.menuItem.id}
                      className="p-3.5 rounded-xl border border-[#E7E5DD] bg-white hover:border-[#183F35]/30 transition-all shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-xs sm:text-sm text-[#202923] truncate">
                            {ci.menuItem.name}
                          </h5>
                          <div className="flex items-center gap-2 text-[11px] text-[#707A73] mt-0.5">
                            <span className="font-semibold text-[#183F35]">
                              {formatCurrency(ci.menuItem.price)}
                            </span>
                            <span>•</span>
                            <span>{formatMinutes(ci.menuItem.preparationTimeMinutes)} cook</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-[#F7F5EF] border border-[#E7E5DD] rounded-lg">
                            <button
                              type="button"
                              onClick={() => updateQuantity(ci.menuItem.id, -1)}
                              className="p-1 hover:bg-[#E6EFE8] rounded-l text-[#202923] active:scale-90"
                              aria-label={`Reduce ${ci.menuItem.name}`}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold px-2 text-[#183F35]">
                              {ci.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(ci.menuItem.id, 1)}
                              className="p-1 hover:bg-[#E6EFE8] rounded-r text-[#202923] active:scale-90"
                              aria-label={`Add another ${ci.menuItem.name}`}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="font-extrabold text-xs sm:text-sm text-[#183F35] w-14 text-right">
                            {formatCurrency(ci.menuItem.price * ci.quantity)}
                          </span>

                          <button
                            type="button"
                            onClick={() => removeFromCart(ci.menuItem.id)}
                            className="p-1 text-stone-400 hover:text-rose-600 transition-colors"
                            aria-label={`Remove ${ci.menuItem.name} from cart`}
                            title={`Remove ${ci.menuItem.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      {/* Customer Note toggle & inline editor */}
                      <div>
                        {!isNoteOpen && !hasNote ? (
                          <button
                            type="button"
                            onClick={() => setActiveNoteItemId(ci.menuItem.id)}
                            className="text-[11px] text-[#707A73] hover:text-[#183F35] font-medium flex items-center gap-1 transition-colors"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Add note</span>
                          </button>
                        ) : !isNoteOpen && hasNote ? (
                          <div
                            onClick={() => setActiveNoteItemId(ci.menuItem.id)}
                            className="text-[11px] text-[#183F35] bg-[#FAF8F3] border border-[#E7E5DD] px-2.5 py-1 rounded-md flex items-center justify-between cursor-pointer hover:bg-[#F2EFE7]"
                          >
                            <span className="italic truncate">&ldquo;{ci.notes}&rdquo;</span>
                            <span className="text-[10px] text-[#707A73] uppercase font-bold ml-2">Edit</span>
                          </div>
                        ) : (
                          <div className="pt-1 space-y-1">
                            <input
                              type="text"
                              placeholder="e.g. Less spicy, dressing on side"
                              value={ci.notes || ''}
                              onChange={(e) => updateItemNotes(ci.menuItem.id, e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-[#E7E5DD] text-xs text-[#202923] placeholder:text-stone-400 focus:outline-none focus:border-[#183F35] bg-[#F7F5EF]"
                              autoFocus
                            />
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => setActiveNoteItemId(null)}
                                className="text-[10px] font-bold text-[#183F35] hover:underline"
                              >
                                Save Note
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Customer & Physical Table Details */}
            {cart.length > 0 && (
              <div className="space-y-3 pt-2 bg-white p-4 rounded-2xl border border-[#E7E5DD] shadow-2xs">
                <h4 className="text-xs font-bold text-[#707A73] uppercase tracking-wider">
                  Details
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <label htmlFor="cart-customer-name" className="block text-[#202923] font-semibold mb-1">
                      Your Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="cart-customer-name"
                      type="text"
                      placeholder="e.g. Ananya, Kabir"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E7E5DD] text-xs text-[#202923] placeholder:text-stone-400 focus:outline-none focus:border-[#183F35]"
                    />
                  </div>

                  {orderType === 'DINE_IN' ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="cart-table-number" className="block text-[#202923] font-semibold">
                          Table Number <span className="text-rose-500">*</span>
                        </label>
                      </div>
                      <input
                        id="cart-table-number"
                        type="text"
                        placeholder="e.g. Table 4 or Bar 2"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E7E5DD] text-xs text-[#202923] placeholder:text-stone-400 focus:outline-none focus:border-[#183F35]"
                      />

                      {/* Quick-Pick Table Nicknames */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {POPULAR_TABLES.map((tName) => (
                          <button
                            key={tName}
                            type="button"
                            onClick={() => setTableNumber(tName)}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                              tableNumber === tName
                                ? 'bg-[#183F35] text-white border-[#183F35]'
                                : 'bg-[#FAF8F3] text-[#707A73] border-[#E7E5DD] hover:bg-[#F2EFE7] hover:text-[#202923]'
                            }`}
                          >
                            📍 {tName}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="cart-customer-phone" className="block text-[#202923] font-semibold mb-1">
                        Phone (Optional)
                      </label>
                      <input
                        id="cart-customer-phone"
                        type="tel"
                        placeholder="e.g. 98765 43210"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#E7E5DD] text-xs text-[#202923] placeholder:text-stone-400 focus:outline-none focus:border-[#183F35]"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BreakFit Feasibility Summary inside Drawer */}
            {cart.length > 0 && (
              <div
                className={`p-3.5 rounded-xl border text-xs ${
                  breakFitResult.feasibility === 'FEASIBLE'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : breakFitResult.feasibility === 'RISKY'
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-[#FDF2EF] border-[#D96D4C]/30 text-[#8E3219]'
                }`}
              >
                <div className="flex items-center justify-between font-extrabold mb-1">
                  <span>Status:</span>
                  <span>{breakFitResult.statusLabel}</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Ready by <strong>{breakFitResult.estimatedReadyTime}</strong> (~{breakFitResult.totalEstimatedMinutes} min).
                </p>
              </div>
            )}

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}
          </div>

          {/* Drawer Sticky Footer with Totals & Conversational Checkout */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#E7E5DD] bg-white space-y-3 shadow-lg">
              <div className="space-y-1.5 text-xs text-[#707A73]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#202923]">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (5%)</span>
                  <span className="font-semibold text-[#202923]">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#E7E5DD] text-sm text-[#183F35] font-extrabold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-[#183F35] text-white font-bold text-sm hover:bg-[#245447] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-card disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Placing Order...</span>
                  ) : (
                    <>
                      <span>Place Order</span>
                      <ArrowRight className="w-4 h-4 text-[#E6B65C]" />
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-[#707A73]">
                  Demo order • Pay at counter
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
