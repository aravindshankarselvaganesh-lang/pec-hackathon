'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
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
  placeCustomerOrder: () => Promise<CustomerOrder>;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => Promise<void>;
  createWalkInOrder: (input: CreateWalkInOrderInput) => Promise<CustomerOrder>;
  toggleMenuItemAvailability: (itemId: string, available: boolean) => Promise<void>;
  resetDemoSession: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const isLiveSupabase = useMemo(() => isSupabaseConfigured(), []);
  const api: RestaurantApi = useMemo(() => {
    return isLiveSupabase ? supabaseRestaurantApi : mockRestaurantApi;
  }, [isLiveSupabase]);

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

  // Initialize deadline to 15 minutes from now in "HH:MM"
  const [customerDeadline, setCustomerDeadline] = useState<string>(() => {
    const defaultTime = new Date(Date.now() + 15 * 60000);
    return formatTime24H(defaultTime);
  });

  const refreshData = useCallback(async () => {
    try {
      const [rest, mn, cats, kitchen, ords] = await Promise.all([
        api.getRestaurant(),
        api.getMenu(),
        api.getCategories(),
        api.getKitchenSnapshot(),
        api.getOrders(),
      ]);
      setRestaurant(rest);
      setMenu(mn);
      setCategories(cats);
      setKitchenSnapshots(kitchen);
      setOrders(ords);
    } catch (err) {
      console.error('Error refreshing restaurant data:', err);
    }
  }, [api]);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setIsLoading(true);
        await refreshData();
      } finally {
        setIsLoading(false);
      }
    };

    loadInitial();

    // Setup Supabase Realtime when connected
    if (isLiveSupabase) {
      const channel = supabase
        .channel('rushless_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          refreshData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'kitchen_stations' }, () => {
          refreshData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
          refreshData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isLiveSupabase, refreshData]);

  // Recalculate BreakFit whenever cart, deadline, kitchen, or menu change
  const breakFitResult = useMemo<BreakFitResult>(() => {
    return evaluateBreakFit({
      items: cart,
      requestedDeadline: customerDeadline,
      kitchenSnapshots,
      allMenuItems: menu,
      bufferMinutes: restaurant?.defaultBufferMinutes || 3,
    });
  }, [cart, customerDeadline, kitchenSnapshots, menu, restaurant]);

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

  const placeCustomerOrder = async (): Promise<CustomerOrder> => {
    if (cart.length === 0) {
      throw new Error('Cannot place an empty order');
    }

    const order = await api.createDemoOrder({
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
    });

    setLastPlacedOrder(order);
    setCart([]);
    await refreshData();
    return order;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, note?: string) => {
    await api.updateDemoOrderStatus(orderId, status, note);
    await refreshData();
  };

  const createWalkInOrder = async (input: CreateWalkInOrderInput): Promise<CustomerOrder> => {
    const order = await api.createWalkInOrder(input);
    await refreshData();
    return order;
  };

  const toggleMenuItemAvailability = async (itemId: string, available: boolean) => {
    await api.updateMenuAvailability(itemId, available);
    await refreshData();
  };

  const resetDemoSession = async () => {
    await api.resetDemoData();
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
