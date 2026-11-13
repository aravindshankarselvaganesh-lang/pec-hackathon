'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  AlternativeSuggestion,
  BreakFitResult,
  CartItem,
  CreateWalkInOrderInput,
  CustomerOrder,
  KitchenStationSnapshot,
  MenuCategory,
  MenuItem,
  OrderStatus,
  OrderType,
  Restaurant,
} from '@/domain/types';
import { RestaurantApi } from '@/lib/data/restaurant-api';
import { mockRestaurantApi } from '@/lib/data/mock-restaurant-api';
import { supabaseRestaurantApi } from '@/lib/data/supabase-restaurant-api';
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client';
import { evaluateBreakFit } from '@/lib/breakfit/estimate';
import { formatTime24H } from '@/domain/formatters';

interface RestaurantContextType {
  restaurant: Restaurant | null;
  menu: MenuItem[];
  categories: MenuCategory[];
  kitchenSnapshots: KitchenStationSnapshot[];
  orders: CustomerOrder[];
  cart: CartItem[];
  orderType: OrderType;
  customerDeadline: string;
  customerName: string;
  customerPhone: string;
  tableNumber: string;
  breakFitResult: BreakFitResult;
  isCartOpen: boolean;
  isLoading: boolean;
  isLiveSupabase: boolean;
  lastPlacedOrder: CustomerOrder | null;
  currentTime: Date;
  isHydrated: boolean;

  // Cart actions
  addToCart: (item: MenuItem, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  updateItemNotes: (itemId: string, notes: string) => void;
  clearCart: () => void;
  setOrderType: (type: OrderType) => void;
  setCustomerDeadline: (timeStr: string) => void;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setTableNumber: (table: string) => void;
  setIsCartOpen: (open: boolean) => void;
  applyAlternativeSuggestion: (suggestion: AlternativeSuggestion) => void;

  // Order & Admin actions
  getOrder: (id: string) => Promise<CustomerOrder | null>;
  placeCustomerOrder: () => Promise<CustomerOrder>;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => Promise<void>;
  createWalkInOrder: (input: CreateWalkInOrderInput) => Promise<CustomerOrder>;
  toggleMenuItemAvailability: (itemId: string, available: boolean) => Promise<void>;
  resetDemoSession: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const initialConfigured = useMemo(() => isSupabaseConfigured(), []);
  const [isLiveSupabase, setIsLiveSupabase] = useState<boolean>(initialConfigured);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [kitchenSnapshots, setKitchenSnapshots] = useState<KitchenStationSnapshot[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('TAKEAWAY');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [tableNumber, setTableNumber] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<CustomerOrder | null>(null);

  // Hydration safety: use a fixed baseline during SSR, synchronize to client clock in useEffect
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date(2026, 0, 1, 12, 0, 0));
  const [customerDeadline, setCustomerDeadline] = useState<string>('12:15');

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    setIsHydrated(true);

    const now = new Date();
    setCurrentTime(now);
    const defaultTime = new Date(now.getTime() + 15 * 60000);
    setCustomerDeadline(formatTime24H(defaultTime));

    const intervalId = setInterval(() => {
      if (isMountedRef.current) {
        setCurrentTime(new Date());
      }
    }, 30000);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
    };
  }, []);

  const refreshData = useCallback(async () => {
    if (isLiveSupabase) {
      try {
        const [rest, mn, cats, kitchen, ords] = await Promise.all([
          supabaseRestaurantApi.getRestaurant(),
          supabaseRestaurantApi.getMenu(),
          supabaseRestaurantApi.getCategories(),
          supabaseRestaurantApi.getKitchenSnapshot(),
          supabaseRestaurantApi.getOrders(),
        ]);
        if (isMountedRef.current) {
          setRestaurant(rest);
          setMenu(mn);
          setCategories(cats);
          setKitchenSnapshots(kitchen);
          setOrders(ords);
        }
        return;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(
          '[RushLess] Supabase connection or queries failed. Gracefully falling back to mock dataset:',
          msg
        );
        if (isMountedRef.current) {
          setIsLiveSupabase(false);
        }
      }
    }

    // Fallback or default mock dataset
    try {
      const [rest, mn, cats, kitchen, ords] = await Promise.all([
        mockRestaurantApi.getRestaurant(),
        mockRestaurantApi.getMenu(),
        mockRestaurantApi.getCategories(),
        mockRestaurantApi.getKitchenSnapshot(),
        mockRestaurantApi.getOrders(),
      ]);
      if (isMountedRef.current) {
        setRestaurant(rest);
        setMenu(mn);
        setCategories(cats);
        setKitchenSnapshots(kitchen);
        setOrders(ords);
      }
    } catch (mockErr) {
      console.error('[RushLess] Failed to load fallback mock restaurant data:', mockErr);
    }
  }, [isLiveSupabase]);

  useEffect(() => {
    let refreshTimeout: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefresh = () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        if (isMountedRef.current) {
          refreshData();
        }
      }, 350);
    };

    const loadInitial = async () => {
      try {
        setIsLoading(true);
        await refreshData();
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadInitial();

    // Setup Supabase Realtime when connected
    let channel: ReturnType<typeof supabase.channel> | null = null;
    if (isLiveSupabase) {
      const channelId = `rushless_rt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      channel = supabase
        .channel(channelId)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          scheduleRefresh();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'kitchen_stations' }, () => {
          scheduleRefresh();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
          scheduleRefresh();
        })
        .subscribe((status, err) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn(`[RushLess] Supabase Realtime subscription status: ${status}`, err);
          }
        });
    }

    return () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      if (channel) {
        channel.unsubscribe().catch(() => {});
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, [isLiveSupabase, refreshData]);

  // Recalculate BreakFit whenever cart, deadline, kitchen, menu, or currentTime change
  const breakFitResult = useMemo<BreakFitResult>(() => {
    return evaluateBreakFit({
      items: cart,
      requestedDeadline: customerDeadline,
      kitchenSnapshots,
      allMenuItems: menu,
      currentTime,
      bufferMinutes: restaurant?.defaultBufferMinutes || 3,
    });
  }, [cart, customerDeadline, kitchenSnapshots, menu, restaurant, currentTime]);

  const addToCart = (item: MenuItem, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.menuItem.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.menuItem.id === item.id ? { ...ci, quantity: ci.quantity + quantity } : ci
        );
      }
      return [...prev, { menuItem: item, quantity }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.menuItem.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((ci) => {
          if (ci.menuItem.id === itemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const updateItemNotes = (itemId: string, notes: string) => {
    setCart((prev) => {
      return prev.map((ci) => {
        if (ci.menuItem.id === itemId) {
          return { ...ci, notes };
        }
        return ci;
      });
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const applyAlternativeSuggestion = (suggestion: AlternativeSuggestion) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((ci) => ci.menuItem.id === suggestion.originalItem.id);
      if (existingIndex === -1) return prev;

      const originalCartItem = prev[existingIndex];
      const newCart = [...prev];

      const altIndex = newCart.findIndex((ci) => ci.menuItem.id === suggestion.suggestedItem.id);
      if (altIndex > -1) {
        newCart[altIndex] = {
          ...newCart[altIndex],
          quantity: newCart[altIndex].quantity + originalCartItem.quantity,
        };
        newCart.splice(existingIndex, 1);
      } else {
        newCart[existingIndex] = {
          menuItem: suggestion.suggestedItem,
          quantity: originalCartItem.quantity,
        };
      }
      return newCart;
    });
  };

  const getOrder = useCallback(
    async (id: string): Promise<CustomerOrder | null> => {
      if (!id) return null;
      if (isLiveSupabase) {
        try {
          const remote = await supabaseRestaurantApi.getOrder(id);
          if (remote) return remote;
        } catch (err) {
          console.warn('[RushLess] getOrder from Supabase failed, searching local orders:', err);
        }
      }
      return mockRestaurantApi.getOrder(id);
    },
    [isLiveSupabase]
  );

  const placeCustomerOrder = async (): Promise<CustomerOrder> => {
    if (cart.length === 0) {
      throw new Error('Cannot place an empty order');
    }

    const orderInput = {
      orderType,
      customerName: customerName.trim() || 'Demo Guest',
      customerPhone: customerPhone.trim() || undefined,
      tableNumber: orderType === 'DINE_IN' ? tableNumber.trim() || 'Counter' : undefined,
      items: cart.map((ci) => ({
        itemId: ci.menuItem.id,
        quantity: ci.quantity,
        notes: ci.notes,
      })),
      requestedDeadline: customerDeadline,
    };

    let order: CustomerOrder;
    if (isLiveSupabase) {
      try {
        order = await supabaseRestaurantApi.createDemoOrder(orderInput);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(
          '[RushLess] Supabase createDemoOrder failed, gracefully falling back to mock order storage:',
          msg
        );
        setIsLiveSupabase(false);
        order = await mockRestaurantApi.createDemoOrder(orderInput);
      }
    } else {
      order = await mockRestaurantApi.createDemoOrder(orderInput);
    }

    setLastPlacedOrder(order);
    setCart([]);
    await refreshData();
    return order;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, note?: string) => {
    if (isLiveSupabase) {
      try {
        await supabaseRestaurantApi.updateDemoOrderStatus(orderId, status, note);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(
          '[RushLess] Supabase updateDemoOrderStatus failed, updating in mock storage:',
          msg
        );
        await mockRestaurantApi.updateDemoOrderStatus(orderId, status, note);
      }
    } else {
      await mockRestaurantApi.updateDemoOrderStatus(orderId, status, note);
    }
    await refreshData();
  };

  const createWalkInOrder = async (input: CreateWalkInOrderInput): Promise<CustomerOrder> => {
    let order: CustomerOrder;
    if (isLiveSupabase) {
      try {
        order = await supabaseRestaurantApi.createWalkInOrder(input);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(
          '[RushLess] Supabase createWalkInOrder failed, falling back to mock storage:',
          msg
        );
        order = await mockRestaurantApi.createWalkInOrder(input);
      }
    } else {
      order = await mockRestaurantApi.createWalkInOrder(input);
    }
    await refreshData();
    return order;
  };

  const toggleMenuItemAvailability = async (itemId: string, available: boolean) => {
    if (isLiveSupabase) {
      try {
        await supabaseRestaurantApi.updateMenuAvailability(itemId, available);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(
          '[RushLess] Supabase updateMenuAvailability failed, falling back to mock storage:',
          msg
        );
        await mockRestaurantApi.updateMenuAvailability(itemId, available);
      }
    } else {
      await mockRestaurantApi.updateMenuAvailability(itemId, available);
    }
    await refreshData();
  };

  const resetDemoSession = async () => {
    if (isLiveSupabase) {
      try {
        await supabaseRestaurantApi.resetDemoData();
      } catch (err) {
        console.warn('[RushLess] Warning: Reset demo data in Supabase skipped:', err);
      }
    }
    await mockRestaurantApi.resetDemoData();
    setCart([]);
    setLastPlacedOrder(null);
    await refreshData();
  };

  return (
    <RestaurantContext.Provider
      value={{
        restaurant,
        menu,
        categories,
        kitchenSnapshots,
        orders,
        cart,
        orderType,
        customerDeadline,
        customerName,
        customerPhone,
        tableNumber,
        breakFitResult,
        isCartOpen,
        isLoading,
        isLiveSupabase,
        lastPlacedOrder,
        currentTime,
        isHydrated,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateItemNotes,
        clearCart,
        setOrderType,
        setCustomerDeadline,
        setCustomerName,
        setCustomerPhone,
        setTableNumber,
        setIsCartOpen,
        applyAlternativeSuggestion,
        getOrder,
        placeCustomerOrder,
        updateOrderStatus,
        createWalkInOrder,
        toggleMenuItemAvailability,
        resetDemoSession,
        refreshData,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}
